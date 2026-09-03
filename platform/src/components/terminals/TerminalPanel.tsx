"use client";

import { useState } from "react";
import {
  Terminal,
  TerminalActions,
  TerminalClearButton,
  TerminalContent,
  TerminalCopyButton,
  TerminalHeader,
  TerminalStatus,
  TerminalTitle,
} from "@/components/ai-elements/terminal";

/**
 * Terminal surface reused across the console (EditModePanel mounts it with
 * context="bash"). Output renders through the AI Elements Terminal component
 * (https://elements.ai-sdk.dev/components/terminal) — ANSI transcript, copy
 * to clipboard, clear, and a streaming cursor while a command is in flight.
 *
 * Everything shown is REAL: agent-browser subcommands hit the /api/browser
 * routes; any other line runs through /api/bash, the allowlisted bash exec
 * backend. Refused commands get the honest server note — never fake output.
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

// ANSI wrappers — the Elements Terminal renders these through ansi-to-react.
const ansi = {
  prompt: (s: string) => `\x1b[36m${s}\x1b[0m`,
  err: (s: string) => `\x1b[31m${s}\x1b[0m`,
  note: (s: string) => `\x1b[90m${s}\x1b[0m`,
  ok: (s: string) => `\x1b[32m${s}\x1b[0m`,
};

function transcriptOf(lines: Line[]): string {
  return lines
    .map((l) =>
      l.kind === "in"
        ? `${ansi.prompt("$")} ${l.text}`
        : l.kind === "err"
          ? ansi.err(l.text)
          : l.kind === "note"
            ? ansi.note(l.text)
            : l.text
    )
    .join("\n");
}

const INITIAL_LINES: Line[] = [
  {
    kind: "note",
    text: `agent-browser exec surface — context "bash". agent-browser subcommands run for real (open/snapshot/click/eval/back/forward/read); anything else runs through the allowlisted /api/bash exec backend.`,
  },
];

export default function TerminalPanel({ context = "bash" }: { context?: string }) {
  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  function push(kind: Line["kind"], text: string) {
    setLines((l) => [...l.slice(-160), { kind, text }]);
  }

  function clearTranscript() {
    setLines(INITIAL_LINES);
  }

  async function run(raw: string) {
    const input = raw.trim();
    if (!input || busy) return;
    push("in", input);
    setValue("");
    const [cmd, ...rest] = input.split(/\s+/);

    if (BROWSER_SUBCOMMANDS.has(cmd)) {
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
          if (data.ok) push("out", `${ansi.ok("open ok")} ${url} (session ${SESSION})`);
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
          if (data.ok) push("out", data.result != null ? String(data.result) : `${ansi.ok(cmd + " ok")}`);
          else push("err", data.hint || data.stderr || `${cmd} failed`);
        }
      } catch {
        push("err", "could not reach the /api/browser routes — is the Next.js server running?");
      } finally {
        setBusy(false);
      }
      return;
    }

    // Not an agent-browser subcommand → real allowlisted bash via /api/bash.
    setBusy(true);
    try {
      const res = await fetch("/api/bash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: input }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.output != null) {
        push("out", data.output);
      } else if (res.status === 403 || res.status === 400) {
        push("note", data?.error || `request refused (${res.status})`);
      } else {
        push("err", data?.error || `exec failed (${res.status})`);
      }
    } catch {
      push("err", "could not reach /api/bash — is the Next.js server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="ava-term"
      style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, flex: 1 }}
    >
      <Terminal
        output={transcriptOf(lines)}
        isStreaming={busy}
        onClear={clearTranscript}
        style={{ flex: 1, minHeight: 0 }}
      >
        <TerminalHeader>
          <TerminalTitle className="text-xs">agent-browser · {context}</TerminalTitle>
          <div className="flex items-center gap-1">
            <TerminalStatus>
              <span className="text-[10px] uppercase tracking-wide">executing…</span>
            </TerminalStatus>
            <TerminalActions>
              <TerminalCopyButton />
              <TerminalClearButton />
            </TerminalActions>
          </div>
        </TerminalHeader>
        <TerminalContent className="max-h-72 text-[11px]" />
      </Terminal>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="mono" style={{ color: "var(--bento-accent-mint)", fontSize: 11 }}>$</span>
        <input
          className="mono"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(value)}
          placeholder="agent-browser command or bash (allowlisted)…"
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
