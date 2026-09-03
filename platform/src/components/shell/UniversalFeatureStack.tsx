"use client";

import { useState } from "react";

/**
 * Universal feature stack shown in the Browser panel's AI tab.
 *
 * Each feature dispatches a real intent POST to `/api/ai/intent` carrying the
 * active surface. There is no pretending: if the intent queue is not wired in
 * this deployment (the reserved route answers 501), the response is rendered
 * verbatim so the operator sees the true state.
 */

interface Feature {
  id: string;
  label: string;
}

const FEATURES: Feature[] = [
  { id: "summarize-page", label: "Summarize this page" },
  { id: "extract-links", label: "Extract all links" },
  { id: "read-snapshot", label: "Read the a11y snapshot" },
  { id: "refactor-plan", label: "Draft a refactor plan" },
];

export function UniversalFeatureStack({ showPrompt = false }: { showPrompt?: boolean }) {
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [draft, setDraft] = useState("");

  async function dispatch(text: string) {
    if (!text.trim() || pending) return;
    setPending(text);
    setResult("");
    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), current_surface: "browser" }),
      });
      const data = (await res.json().catch(() => ({}))) as { hint?: string };
      setResult(data.hint || (res.ok ? "Queued." : `Intent queue responded ${res.status}.`));
    } catch {
      setResult("Could not reach /api/ai/intent — intent queue not wired in this deployment.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {FEATURES.map((f) => (
          <button
            key={f.id}
            className="ava-badge"
            style={{ cursor: "pointer", opacity: pending === f.label ? 0.5 : 1 }}
            onClick={() => dispatch(f.label)}
          >
            {pending === f.label ? "dispatching…" : f.label}
          </button>
        ))}
      </div>

      {showPrompt && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="mono"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && dispatch(draft)}
            placeholder="Ask about this page…"
            style={{
              flex: 1,
              background: "var(--bento-surface-dark)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "8px 10px",
              color: "var(--bento-text-primary)",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button className="ava-badge" style={{ cursor: "pointer" }} onClick={() => dispatch(draft)}>
            Send
          </button>
        </div>
      )}

      {result && (
        <div className="mono" style={{ fontSize: 10.5, color: "var(--bento-text-muted)" }}>
          {result}
        </div>
      )}
    </div>
  );
}
