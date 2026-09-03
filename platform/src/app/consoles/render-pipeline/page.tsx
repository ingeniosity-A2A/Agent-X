"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chunkCode, CODE_SEPARATORS, type Chunk } from "@/lib/recursive-splitter";
import { animateCodeDiff } from "@/lib/codeDiffAnimator";
import { SECTIONS } from "@/components/shell/AvaShell";
import "../ava-console.css";

/**
 * Render Pipeline console — the frontend layer of the recursive-splitting
 * architecture, running for real and end-to-end:
 *
 *   source text → chunkCode() (code-aware recursive splitter)
 *              → rendered chunk stream → animateCodeDiff()
 *              (GSAP SplitText line masks + ASCII glitch ripple)
 *
 * The DuckDB symbol-table storage and scheduler blast-radius queries live in
 * the edge repo (AGENTS.md boundary) and are intentionally absent here — this
 * surface demonstrates and exercises the pure frontend pipeline.
 */

const DEFAULT_SOURCE = `// Syntax-Aware Recursive Splitting — live demo source.
// Edit this buffer and re-run: every chunk gets a deterministic
// FNV-1a hash, exact line/col bounds and its parent header.

export class RenderPipeline {
  constructor(container) {
    this.container = container;
    this.frameBudget = 1000 / 120; // 120fps
  }

  present(chunks) {
    for (const chunk of chunks) {
      const node = document.createElement("pre");
      node.className = "ava-pipe-chunk";
      node.dataset.hash = chunk.id;
      node.textContent = chunk.content;
      this.container.appendChild(node);
    }
    return chunks.length;
  }
}

function fnv1a(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export const BLAST_RADIUS_QUERY = "pull the affected chunk + parent node";
export const SEPARATORS = ["\\nclass ", "\\nfunction ", "\\nexport ", "\\n\\n", ";\\n", "\\n", " ", ""];

const schedulerNote =
  "Backend half (DuckDB symbol index, scheduler routing) is the edge repo's " +
  "half of the hard boundary — this console never stores the data itself.";

await scheduler.ready();
export function route(edit) {
  return scheduler.act(edit, { tier: edit.weight > 0.5 ? 1 : 0 });
}
`;

export default function RenderPipelinePage() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [maxSize, setMaxSize] = useState(420);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [runCount, setRunCount] = useState(0);
  const [status, setStatus] = useState("Idle — edit the source and run the pipeline.");
  const streamRef = useRef<HTMLDivElement>(null);

  const run = useCallback(() => {
    if (!source.trim()) {
      setStatus("Source buffer is empty — nothing to split.");
      setChunks([]);
      return;
    }
    const t0 = performance.now();
    const result = chunkCode(source, { maxSize });
    const t1 = performance.now();
    setChunks(result);
    setRunCount((n) => n + 1);
    setStatus(
      `${result.length} chunk${result.length === 1 ? "" : "s"} · ${separatorsUsed()} · split ${(t1 - t0).toFixed(2)}ms · animating render stream…`,
    );
  }, [source, maxSize]);

  useEffect(() => {
    if (!chunks.length || !streamRef.current) return;
    const el = streamRef.current;
    const raf = requestAnimationFrame(() => animateCodeDiff(el));
    return () => cancelAnimationFrame(raf);
  }, [chunks, runCount]);

  return (
    <main className="ava-console">
      <header className="ava-console-header">
        <div>
          <h1>Render Pipeline — recursive splitter → SplitText</h1>
          <p>
            {SECTIONS.pipeline.description} · DuckDB/scheduler half lives in the edge repo (boundary: AGENTS.md)
          </p>
        </div>
        <span className="ava-badge">
          <span className="ava-dot" />
          {SECTIONS.pipeline.label}
        </span>
      </header>

      <section className="bento-card bento-card--elevated" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button className="bento-tab active" style={{ cursor: "pointer" }} onClick={run}>
            Split → Render
          </button>
          <label className="mono" style={{ fontSize: 11, color: "var(--bento-text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
            chunk target
            <input
              type="range"
              min={200}
              max={1600}
              step={20}
              value={maxSize}
              onChange={(e) => setMaxSize(Number(e.target.value))}
              style={{ accentColor: "#7ec8a0" }}
            />
            <span style={{ color: "var(--bento-text-secondary)", width: 52 }}>{maxSize} chars</span>
          </label>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--bento-text-muted)" }}>
            separators: {"["}class → function → export → block → stmt → line → token → char{"]"}
          </span>
        </div>

        <textarea
          className="mono ava-scrollbar"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: 180,
            resize: "vertical",
            background: "var(--bento-surface-dark)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 12,
            color: "var(--bento-text-secondary)",
            fontSize: 11.5,
            lineHeight: 1.6,
            outline: "none",
          }}
        />

        <div className="mono" style={{ fontSize: 10.5, color: "var(--bento-accent-mint)" }}>
          {status}
        </div>
      </section>

      <section className="bento-card bento-card--elevated" style={{ padding: 14 }}>
        <div style={{ fontSize: 11, color: "var(--bento-text-muted)", marginBottom: 10 }}>
          render stream — <span className="mono">animateCodeDiff()</span> · SplitText line masks + ASCII shift ripple
        </div>
        <div ref={streamRef} className="ava-scrollbar" style={{ maxHeight: 420, overflowY: "auto" }}>
          {chunks.length === 0 ? (
            <div className="ava-pipe-chunk" style={{ color: "var(--bento-text-muted)" }}>
              No chunks yet — run the pipeline.
            </div>
          ) : (
            chunks.map((c) => (
              <pre key={`${c.id}-${c.start}`} className="ava-pipe-chunk mono">
                <span style={{ color: "var(--bento-accent-blue)" }}>{`#chunk:${c.id}`}</span>{" "}
                <span style={{ color: "var(--bento-text-muted)" }}>
                  {`L${c.startLine}:${c.startCol}–L${c.endLine}:${c.endCol}`}
                  {c.parent ? ` · parent ${c.parent.kind} ${c.parent.name}` : " · parent —"}
                  {` · ${c.content.length} chars`}
                </span>
                {"\n"}
                {c.content}
              </pre>
            ))
          )}
        </div>
      </section>

      <BottomPipelineBar chunkCount={chunks.length} />
    </main>
  );
}

function separatorsUsed(): string {
  return `${CODE_SEPARATORS.length} separator tiers`;
}

/**
 * Pipeline stage strip — mirrors the doc's end-to-end flow with honest state
 * per stage (what is real here vs. what belongs to the edge repo).
 */
function BottomPipelineBar({ chunkCount }: { chunkCount: number }) {
  const stages = [
    { label: "Recursive Code Splitter", state: chunkCount > 0 ? "ok" : "idle", note: "real — this page" },
    { label: "DuckDB Symbol Index", state: "edge", note: "edge repo (not built here)" },
    { label: "Constellation Scheduler", state: "edge", note: "edge repo (not built here)" },
    { label: "SplitText Render", state: chunkCount > 0 ? "ok" : "idle", note: "real — this page" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {stages.map((s) => (
        <span key={s.label} className="ava-badge" title={s.note}>
          <span className={`ava-dot ${s.state === "ok" ? "" : s.state === "edge" ? "warn" : "off"}`} />
          {s.label} · <span style={{ color: "var(--bento-text-muted)" }}>{s.note}</span>
        </span>
      ))}
    </div>
  );
}
