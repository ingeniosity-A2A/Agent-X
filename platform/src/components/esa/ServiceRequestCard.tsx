"use client";

import { useCallback, useEffect, useState } from "react";
import { SendEmailButtons } from "./SendEmailButtons";

export type SRStatus = "completed" | "incomplete_parts" | "follow_up";

export type ServiceRequestRow = {
  id: string;
  title: string;
  timeRange: string;
  service: string;
  status: SRStatus;
  assigneeName?: string;
  partSku?: string;
  notes?: string;
  createdAt: string;
};

const STATUS_STYLE: Record<SRStatus, string> = {
  completed: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
  incomplete_parts: "border-amber-500/40 bg-amber-950/30 text-amber-200",
  follow_up: "border-sky-500/40 bg-sky-950/30 text-sky-200",
};

const STATUS_LABEL: Record<SRStatus, string> = {
  completed: "Completed",
  incomplete_parts: "Incomplete — parts",
  follow_up: "Follow-up to complete",
};

/**
 * Service Request Card — statuses cover completion; no separate Service Complete card.
 */
export function ServiceRequestCard() {
  const [rows, setRows] = useState<ServiceRequestRow[]>([]);
  const [title, setTitle] = useState("");
  const [partSku, setPartSku] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/service-request");
    const data = await res.json();
    setRows(data.requests ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Failed to load service requests"));
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          partSku: partSku || undefined,
          notes: notes || undefined,
          status: "incomplete_parts",
          service: "Service request",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setTitle("");
      setPartSku("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: SRStatus) {
    setBusy(true);
    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#1e1e2e] bg-[#12121a]" data-card="service-request">
      <div className="border-b border-[#1e1e2e] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#7c3aed]">
          Service Request Card
        </p>
        <h2 className="text-base font-semibold">Service requests</h2>
        <p className="text-xs text-[#666]">
          Statuses: completed · incomplete — parts · follow-up to complete (no
          separate complete card)
        </p>
        <div className="mt-2">
          <SendEmailButtons
            aloneContext={{
              type: "service_requests",
              count: rows.length,
              ids: rows.map((r) => r.id),
            }}
          />
        </div>
      </div>

      <form onSubmit={create} className="space-y-2 border-b border-[#1e1e2e] px-4 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Request title (e.g. Room 214 fill valve)"
          className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={partSku}
            onChange={(e) => setPartSku(e.target.value)}
            placeholder="Part SKU (optional)"
            className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#00d4ff] px-4 py-2 text-sm font-semibold text-[#0a0a0f] disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2 text-sm"
        />
      </form>

      {error && (
        <div className="mx-4 mt-2 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <ul className="max-h-[28rem] space-y-2 overflow-y-auto px-4 py-3">
        {rows.map((r) => (
          <li
            key={r.id}
            className={`rounded-xl border px-3 py-3 ${STATUS_STYLE[r.status]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#e8e8ed]">{r.title}</p>
                <p className="font-mono text-[11px] opacity-80">
                  {r.id}
                  {r.partSku ? ` · ${r.partSku}` : ""}
                </p>
                {r.notes && (
                  <p className="mt-1 text-xs opacity-70">{r.notes}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-medium">
                {STATUS_LABEL[r.status]}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  "incomplete_parts",
                  "follow_up",
                  "completed",
                ] as SRStatus[]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy || r.status === s}
                  onClick={() => setStatus(r.id, s)}
                  className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-[#ddd] disabled:opacity-40"
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed border-[#2a2a3a] px-3 py-8 text-center text-xs text-[#666]">
            No service requests yet
          </li>
        )}
      </ul>
    </div>
  );
}
