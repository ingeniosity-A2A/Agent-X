/**
 * Syntax-Aware Recursive Splitting — frontend half of the architecture doc
 * ("Recursive splitting operates at two distinct layers").
 *
 * This module is the PURE algorithm only: code-aware separator priority,
 * deterministic chunk hashing, exact line/column boundaries, and parent
 * context capture. The DuckDB symbol-table storage and the scheduler's
 * blast-radius queries are edge-repo territory (AGENTS.md boundary) and are
 * deliberately NOT implemented here — this module only produces the chunk
 * records such a store would persist.
 */

/** Code-aware separator priority — top-level structure first, chars last. */
export const CODE_SEPARATORS: readonly string[] = [
  "\nclass ", // Top-level class boundaries
  "\nfunction ", // Module functions
  "\nexport ", // Component/service exports
  "\n\n", // Block-level logical breaks
  ";\n", // Statement boundaries
  "\n", // Line breaks
  " ", // Tokens
  "", // Character fallback
];

export type ParentKind = "class" | "function" | "export" | "block";

export interface ChunkParent {
  kind: ParentKind;
  name: string;
}

export interface Chunk {
  /** Deterministic FNV-1a hash of the chunk content (hex, zero-padded). */
  id: string;
  content: string;
  /** Absolute character offsets in the source string. */
  start: number;
  end: number;
  /** 1-based line/column bounds, matching editor gutters. */
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
  /** Nearest enclosing top-level construct header above the chunk, if any. */
  parent: ChunkParent | null;
}

/** FNV-1a 32-bit — tiny, synchronous, deterministic across runs/hosts. */
export function hashChunk(content: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

interface RawPiece {
  content: string;
  start: number;
}

/**
 * Recursive splitter with absolute offsets. If a piece exceeds `maxSize`,
 * recurse with the next separator; the "" fallback splits by fixed windows so
 * pathologically long tokens still terminate.
 */
function splitRecursive(text: string, separators: readonly string[], maxSize: number): RawPiece[] {
  if (text.length <= maxSize) return [{ content: text, start: 0 }];
  const [sep, ...rest] = separators;
  if (sep === undefined) return [{ content: text, start: 0 }];

  if (sep === "") {
    // Character fallback: fixed windows of maxSize.
    const pieces: RawPiece[] = [];
    for (let i = 0; i < text.length; i += maxSize) {
      pieces.push({ content: text.slice(i, i + maxSize), start: i });
    }
    return pieces;
  }

  // Split on this separator, keeping absolute offsets.
  const rawParts = text.split(sep);
  const parts: RawPiece[] = [];
  let offset = 0;
  for (const part of rawParts) {
    parts.push({ content: part, start: offset });
    offset += part.length + sep.length;
  }

  // Greedy merge of adjacent small pieces (re-joining with the separator so
  // content round-trips), then recurse into any piece that is still too big.
  const merged: RawPiece[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    const gap = last ? sep.length : 0;
    if (last && last.content.length + gap + part.content.length <= maxSize) {
      // Re-join with the separator so merged content round-trips the source.
      last.content = last.content + sep + part.content;
    } else {
      merged.push({ ...part });
    }
  }

  const out: RawPiece[] = [];
  for (const piece of merged) {
    if (rest.length === 0 || piece.content.length <= maxSize) {
      out.push(piece);
    } else {
      // Still oversized → recurse with the next separator; re-base offsets.
      const subs = splitRecursive(piece.content, rest, maxSize);
      for (const sub of subs) out.push({ content: sub.content, start: piece.start + sub.start });
    }
  }
  return out;
}

/** Line/col for an absolute offset (1-based; col is the char position in the line). */
export function locate(text: string, offset: number): { line: number; col: number } {
  const upto = text.slice(0, offset);
  const lines = upto.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

const PARENT_RE = /^(\s*)(export\s+)?(?:default\s+)?(class|function|const|let|var)\s+([A-Za-z0-9_$]+)/;

/**
 * Walk backwards from `offset` to find the nearest enclosing header line.
 * class/function count at any indent (nested scopes are real scopes);
 * const/let/var only count at top-level indent — an indented `const node`
 * inside a method is a statement, not a parent scope. This is the pure-frontend
 * header heuristic; the real AST parent comes from tree-sitter on the edge.
 */
export function findParent(text: string, offset: number): ChunkParent | null {
  const upto = text.slice(0, offset);
  const lines = upto.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(PARENT_RE);
    if (!m) continue;
    const indent = m[1];
    const kw = m[3];
    if ((kw === "const" || kw === "let" || kw === "var") && indent.length > 0) continue;
    const kind: ParentKind =
      kw === "class" ? "class" : kw === "function" ? "function" : m[2] ? "export" : "block";
    return { kind, name: m[4] };
  }
  return null;
}

export interface ChunkOptions {
  /** Target maximum chunk size in characters (default 1200). */
  maxSize?: number;
  /** Override the separator priority (defaults to CODE_SEPARATORS). */
  separators?: readonly string[];
}

/**
 * Split source text into syntax-aware recursive chunks with deterministic
 * hashes, exact line/col bounds and parent context — the record shape a
 * DuckDB symbol table (edge repo) would index by hash.
 */
export function chunkCode(source: string, opts: ChunkOptions = {}): Chunk[] {
  const maxSize = Math.max(1, opts.maxSize ?? 1200);
  const separators = opts.separators ?? CODE_SEPARATORS;
  const pieces = splitRecursive(source, separators, maxSize);

  return pieces.map((p) => {
    // Trim leading separator residue (e.g. "\nclass " leaves a leading break
    // on the following piece) without losing absolute offsets.
    const lead = p.content.match(/^[\s;]+/);
    const trimFrom = lead ? lead[0].length : 0;
    const content = p.content.slice(trimFrom);
    const start = p.start + trimFrom;
    const end = start + content.length;
    const s = locate(source, start);
    const e = locate(source, Math.max(start, end - 1));
    return {
      id: hashChunk(content),
      content,
      start,
      end,
      startLine: s.line,
      startCol: s.col,
      endLine: e.line,
      endCol: e.col,
      parent: findParent(source, start),
    };
  });
}
