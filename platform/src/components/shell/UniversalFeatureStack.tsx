"use client";

import { useState } from "react";

/**
 * Universal feature stack shown in the Browser panel's AI tab.
 *
 * Each feature dispatches a real intent POST to `/api/ai/intent` carrying the
 * active surface and feature id. The route grounds the model in the live
 * agent-browser a11y snapshot of the open page; when the SDK is unreachable
 * its local engine answers from real snapshot parsing and labels itself
 * "local engine" — the reply is rendered verbatim either way.
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

  async function dispatch(text: string, feature?: string) {
    if (!text.trim() || pending) return;
    setPending(text);
    setResult("");
    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), current_surface: "browser", feature }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reply?: string; hint?: string };
      setResult(data.reply ?? data.hint ?? (res.ok ? "Empty reply." : `Intent dispatch responded ${res.status}.`));
    } catch {
      setResult("Could not reach /api/ai/intent.");
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
            onClick={() => dispatch(f.label, f.id)}
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
        <div
          className="mono ava-scrollbar"
          style={{ fontSize: 10.5, color: "var(--bento-text-muted)", whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
