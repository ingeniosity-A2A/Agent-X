"use client";

import { useRef, useState } from "react";

/**
 * Terminal surface reused across the console (EditModePanel mounts it with
 * context="bash"). This build executes the REAL agent-browser CLI actions via
 * the /api/browser routes. A general bash-exec backend is NOT wired — lines
 * that are not agent-browser subcommands get an honest note instead of fake
 * output.
 */

type Line = { kind: "in" | "out" | "err" | "note"; text: string };

const SESSION = "ava007-console";

const BROWSER_SUBCOMMANDS = new Set([
  "open",
  "snapshot",
  "click",
  "eval",
  "back",
  "forward",
  "read",
]);

export default function TerminalPanel({ context = "bash" }: { context?: string }) {
  const [lines, setLines] = useState<Line[]>([
    {
      kind: "note",
      text: `agent-browser exec surface — context "${context}". bash exec is not wired in this console; agent-browser subcommands run for real (open/snapshot/click/eval/back/forward/read).`,
    },
  ]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  function push(kind: Line["kind"], text: string) {
    setLines((l) => [...l.slice(-160), { kind, text }]);
    requestAnimationFrame(() => {
      const sc = scrollerRef.current;
      if (sc) sc.scrollTop = sc.scrollHeight;
    });
  }

  async function run(raw: string) {
    const input = raw.trim();
    if (!input || busy) return;
    push("in", `$ ${input}`);
    setValue("");
    const [cmd, ...rest] = input.split(/\s+/);

    if (!BROWSER_SUBCOMMANDS.has(cmd)) {
      push("note", `${cmd}: not available here — this surface executes agent-browser CLI actions only (bash exec backend not wired).`);
      return;
    }

    setBusy(true);
    try {
      if (cmd === "open") {
        let url = rest[0] || "";
        if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
        const res = await fetch("/api/browser/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: SESSION, url }),
        });
        const data = await res.json();
        if (data.ok) push("out", `open ${url} — ok (session ${SESSION})`);
        else push("err", data.hint || data.stderr || "open failed");
      } else if (cmd === "snapshot") {
        const res = await fetch(`/api/browser/snapshot?session=${encodeURIComponent(SESSION)}`);
        const data = await res.json();
        if (data.ok) push("out", (data.raw || "(empty snapshot)").split("\n").slice(0, 40).join("\n"));
        else push("err", data.hint || "snapshot failed");
      } else if (cmd === "read") {
        push("note", "read is available from the Browser panel address bar navigation; not exposed as a route yet.");
      } else {
        // click / eval / back / forward → generic action route
        const action =
          cmd === "click" ? { type: "click", ref: rest[0] } :
          cmd === "eval" ? { type: "eval", expression: rest.join(" ") } :
          { type: cmd };
        const res = await fetch("/api/browser/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: SESSION, action }),
        });
        const data = await res.json();
        if (data.ok) push("out", data.result != null ? String(data.result) : `${cmd} — ok`);
        else push("err", data.hint || data.stderr || `${cmd} failed`);
      }
    } catch {
      push("err", "could not reach the /api/browser routes — is the Next.js server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ava-term" style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, flex: 1 }}>
      <div ref={scrollerRef} className="bento-card--inset ava-scrollbar mono" style={{ borderRadius: 12, padding: 10, flex: 1, minHeight: 180, maxHeight: 320, overflowY: "auto", fontSize: 10.5, lineHeight: 1.55 }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color:
                l.kind === "in" ? "var(--bento-text-primary)" :
                l.kind === "err" ? "var(--bento-warn, #e0a13e)" :
                l.kind === "note" ? "var(--bento-text-muted)" :
                "var(--bento-accent-mint)",
            }}
          >
            {l.text}
          </div>
        ))}
        {busy && <div style={{ color: "var(--bento-text-muted)" }}>…</div>}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="mono" style={{ color: "var(--bento-accent-mint)", fontSize: 11 }}>$</span>
        <input
          className="mono"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(value)}
          placeholder="agent-browser command…"
          disabled={busy}
          style={{
            flex: 1,
            background: "var(--bento-surface-dark)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "7px 10px",
            color: "var(--bento-text-primary)",
            fontSize: 11.5,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
