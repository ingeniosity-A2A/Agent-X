"use client";

import { useState } from "react";

/**
 * Send alone (this card) or Send batch (EOD) → manager bmccray02@gmail.com from Ava.
 */
export function SendEmailButtons({
  aloneContext,
  className = "",
}: {
  aloneContext?: Record<string, unknown>;
  className?: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(mode: "alone" | "batch") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/email-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          context: mode === "alone" ? aloneContext : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Send failed");
      const dest = data.email?.to || "bmccray02@gmail.com";
      if (data.delivered) {
        setMsg(
          mode === "batch"
            ? `EOD delivered → ${dest}`
            : `Card sent → ${dest}`
        );
      } else {
        setMsg(
          mode === "batch"
            ? `EOD ready → ${dest} (${data.transport || "stub"})`
            : `Card ready → ${dest} (${data.transport || "stub"})`
        );
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        disabled={busy}
        onClick={() => send("alone")}
        className="rounded-lg border border-[#2a2a3a] px-2.5 py-1 text-[11px] text-[#ccc] hover:border-[#00d4ff] disabled:opacity-50"
      >
        Send alone
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => send("batch")}
        className="rounded-lg bg-[#10b981]/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-[#10b981]/30 disabled:opacity-50"
      >
        Send batch (EOD)
      </button>
      {msg && <span className="max-w-[14rem] truncate text-[10px] text-[#888]">{msg}</span>}
    </div>
  );
}
