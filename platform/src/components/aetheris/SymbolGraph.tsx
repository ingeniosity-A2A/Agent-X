"use client";

import React from "react";

/**
 * Aetheris Symbol Graph — Symbolic In-Context Graphing (TDAI Context
 * Offloading). The explorer renders ONLY this lightweight, interactive
 * graph of the active state boundaries; the raw payloads stay one
 * node_id drill-down away (deterministic recall hook).
 *
 * The engine also emits the canonical Mermaid source for the same graph —
 * shown verbatim under the SVG so the UI never becomes the source of truth.
 */

export interface SymbolNode {
  id: string;
  kind: string;
  label: string;
  bytes?: number;
  ref?: string;
}

export interface SymbolEdge {
  from: string;
  to: string;
  rel: string;
}

export interface Symbols {
  mermaid: string;
  nodes: SymbolNode[];
  edges: SymbolEdge[];
}

const ROW = 46;
const SPINE_X = 84;
const FILE_X = 268;
const WIDTH = 430;

function shortName(name: string): string {
  // stream-20260908-170629.jsonl -> stream…170629
  const m = name.match(/^(stream-\d{8})-(\d{6})/);
  if (m) return `stream…${m[2]}`;
  return name.length > 26 ? `${name.slice(0, 25)}…` : name;
}

export function SymbolGraph({
  symbols,
  unlocked,
  onRecall,
  activeRef,
}: {
  symbols: Symbols;
  unlocked: string | null;
  onRecall: (nodeId: string) => void;
  activeRef: string | null;
}) {
  const { nodes, edges } = symbols;

  const layout = new Map<string, { x: number; y: number }>();
  let row = 0;
  for (const n of nodes) {
    if (n.kind === "tier") {
      layout.set(n.id, { x: SPINE_X, y: 26 + row * ROW });
      row += 1;
    }
  }
  // file nodes fan to the right of their tier spine node
  const filesUnderTier = new Map<string, number>();
  for (const n of nodes) {
    if (n.kind === "file") {
      const parentEdge = edges.find((e) => e.to === n.id);
      const parent = parentEdge?.from;
      const p = parent ? layout.get(parent) : undefined;
      const k = filesUnderTier.get(parent || "") || 0;
      const y = (p?.y ?? 26) + 16 + k * 26;
      layout.set(n.id, { x: FILE_X + (k % 2) * 52, y });
      filesUnderTier.set(parent || "", k + 1);
      row = Math.max(row, y / ROW + 1);
    }
  }
  for (const n of nodes) {
    if (n.kind === "refs") layout.set(n.id, { x: SPINE_X, y: 26 + row * ROW });
  }

  const height = 26 + (row + 1) * ROW;

  return (
    <div className="symbol-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="memory symbol graph">
        {edges.map((e, i) => {
          const a = layout.get(e.from);
          const b = layout.get(e.to);
          if (!a || !b) return null;
          const spineEdge = e.rel !== "contains";
          return (
            <g key={`e${i}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={spineEdge ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}
                strokeWidth={spineEdge ? 1.4 : 1}
                strokeDasharray={spineEdge ? undefined : "3 3"}
              />
              {spineEdge && (
                <text x={a.x - 10} y={(a.y + b.y) / 2 + 3} fill="rgba(244,244,238,0.42)" fontSize={7.5} textAnchor="end">
                  ↓ {e.rel}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((n) => {
          const p = layout.get(n.id);
          if (!p) return null;
          const isTier = n.kind === "tier";
          const isRefs = n.kind === "refs";
          const isActive = activeRef && n.ref === activeRef;
          const r = isTier ? 13 : isRefs ? 10 : 6;
          const tierLabel = n.label.startsWith("refs") ? "REFS" : n.label.split(" ").slice(0, 2).join(" ");
          const fileLabel = shortName(n.label);
          return (
            <g
              key={n.id}
              className={n.ref ? "symbol-node" : undefined}
              onClick={n.ref ? () => onRecall(n.ref as string) : undefined}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={isActive ? "#f4f4ee" : isTier ? "rgba(36,36,39,0.95)" : "rgba(24,24,27,0.95)"}
                stroke={isActive ? "#18181b" : "rgba(255,255,255,0.3)"}
                strokeWidth={1.2}
              />
              {(isTier || isRefs) && (
                <text x={p.x - 18} y={p.y + 3.5} fill="rgba(244,244,238,0.8)" fontSize={9} textAnchor="end">
                  {isRefs ? "REFS" : tierLabel}
                </text>
              )}
              {!isTier && !isRefs && (
                <text x={p.x + 12} y={p.y + 3} fill="rgba(244,244,238,0.6)" fontSize={8.5} textAnchor="start">
                  {fileLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <pre className="mermaid-src">{symbols.mermaid}</pre>
    </div>
  );
}
