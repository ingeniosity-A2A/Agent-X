"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bento UI Editor card builder — drag-reorder the Agent Browser's card stack
 * with localStorage persistence (the persistence contract EditModePanel's
 * Card Editor mode relies on: "same drag-reorder, same localStorage
 * persistence"). Mounted full-surface at
 * /agent-browser/interface/bento-ui-editor and inside Edit Mode → Card Editor.
 *
 * Relocated from builder/CardBuilder.tsx when the Interface hierarchy landed
 * (the "consoles"-era CardBuilder path is retired in the same commit).
 *
 * Original implementation, no new dependencies: HTML5 drag events only.
 * The registry lists the Agent Browser's real surfaces; order + visibility
 * persist under `ava007-console.cardbuilder.v1` (data key, unchanged).
 */

interface BuilderCard {
  id: string;
  label: string;
  hint: string;
}

const DEFAULT_CARDS: BuilderCard[] = [
  { id: "browser", label: "Browser Panel", hint: "agent-browser viewport + snapshot refs (/agent-browser/interface/terminal)" },
  { id: "terminal", label: "Terminal", hint: "AI Elements terminal exec surface (Edit Mode → Terminal)" },
  { id: "pipeline", label: "3D-Rendering", hint: "recursive splitter → SplitText render (/agent-browser/interface/3d-rendering)" },
  { id: "esa", label: "ESA", hint: "/agent-browser/interface/3d-rendering/esa — Select Card" },
  { id: "diagnostics", label: "Diagnostics", hint: "session + capability status badges" },
];

const LS_KEY = "ava007-console.cardbuilder.v1";

interface PersistedState {
  order: string[];
  hidden: string[];
}

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode) — builder still works in-memory
  }
}

export default function BentoCardBuilder() {
  const [cards, setCards] = useState<BuilderCard[]>(DEFAULT_CARDS);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const persisted = loadState();
    if (!persisted) return;
    const byId = new Map(DEFAULT_CARDS.map((c) => [c.id, c]));
    const ordered = persisted.order.map((id) => byId.get(id)).filter(Boolean) as BuilderCard[];
    const rest = DEFAULT_CARDS.filter((c) => !persisted.order.includes(c.id));
    setCards([...ordered, ...rest]);
    setHidden(new Set(persisted.hidden));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(nextOrder: BuilderCard[], nextHidden: Set<string>) {
    saveState({ order: nextOrder.map((c) => c.id), hidden: [...nextHidden] });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from == null || from === targetIndex) return;
    const next = [...cards];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    setCards(next);
    persist(next, hidden);
  }

  function toggleHidden(id: string) {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHidden(next);
    persist(cards, next);
  }

  function reset() {
    window.localStorage.removeItem(LS_KEY);
    setCards(DEFAULT_CARDS);
    setHidden(new Set());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, color: "var(--bento-text-muted)" }}>
          Drag to reorder · persistence: localStorage <span className="mono">{LS_KEY}</span>
        </span>
        <button className="ava-badge" style={{ cursor: "pointer" }} onClick={reset}>
          Reset
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {cards.map((c, i) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => {
              dragIndex.current = i;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDragLeave={() => setOverIndex((v) => (v === i ? null : v))}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              dragIndex.current = null;
              setOverIndex(null);
            }}
            className={`ava-builder-item ${overIndex === i && dragIndex.current !== i ? "drop-target" : ""} ${hidden.has(c.id) ? "is-hidden" : ""}`}
          >
            <span className="ava-builder-grip" aria-hidden="true">
              ⠿
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--bento-text-primary)" }}>{c.label}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--bento-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.hint}
              </div>
            </div>
            <button
              className={`ava-badge ${hidden.has(c.id) ? "" : "on"}`}
              style={{ cursor: "pointer" }}
              onClick={() => toggleHidden(c.id)}
              title={hidden.has(c.id) ? "Show card" : "Hide card"}
            >
              {hidden.has(c.id) ? "hidden" : "visible"}
            </button>
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 10, color: saved ? "var(--bento-accent-mint)" : "var(--bento-text-muted)" }}>
        {saved ? "saved to localStorage" : `${cards.length - hidden.size} of ${cards.length} cards visible`}
      </div>
    </div>
  );
}