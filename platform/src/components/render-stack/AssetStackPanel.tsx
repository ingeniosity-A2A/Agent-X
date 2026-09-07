"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * AssetStackPanel — the interactive file-folder system over the service's
 * RocksDB housing. Implements the owner's asset-stacking architecture:
 *
 *   UI (drag & drop restack) → stacking engine API → RocksDB
 *   (job#frame#depth keys, layers/meta CFs, WriteBatch atomic restack)
 *   → render hand-off (bounded prefix scan, byte-sorted bottom → top)
 *
 * Values are path references into the real working tree; every row shows
 * the actual RocksDB key the engine streams to the render pipeline.
 */

type StackEntry = { key: string; depth: number; path: string };
type FolderAsset = { name: string; path: string; kind: string };
type StackState = {
  ok: boolean;
  job?: string;
  frame?: string;
  db?: string;
  render_order?: StackEntry[];
  assets?: FolderAsset[];
  stream?: string;
  error?: string;
};

export default function AssetStackPanel({
  service,
  job,
  frame = "f0001",
}: {
  service: "esa" | "helpassembly";
  job: string;
  frame?: string;
}) {
  const [state, setState] = useState<StackState | null>(null);
  const [order, setOrder] = useState<StackEntry[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [streamed, setStreamed] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/render-stack/${service}?job=${encodeURIComponent(job)}&frame=${encodeURIComponent(frame)}`);
      const d = (await res.json()) as StackState;
      setState(d);
      if (d.ok) setOrder(d.render_order ?? []);
    } catch {
      setNote("stack engine unreachable");
    }
  }, [service, job, frame]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(body: Record<string, unknown>, label: string) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/render-stack/${service}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, frame, ...body }),
      });
      const d = (await res.json()) as StackState;
      if (d.ok) {
        setState(d);
        setOrder(d.render_order ?? []);
        setNote(label);
      } else {
        setNote(d.error ?? "stack engine rejected the write");
      }
    } catch {
      setNote("stack engine unreachable");
    } finally {
      setBusy(false);
    }
  }

  function drop(at: number) {
    if (dragIdx === null || dragIdx === at) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...order];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(at, 0, moved);
    setOrder(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  async function saveStack() {
    await post({ op: "stack", layers: order.map((e) => e.path) }, `stack saved — WriteBatch atomic, ${order.length} layers`);
    setStreamed(null);
  }

  async function streamOrder() {
    setBusy(true);
    try {
      const res = await fetch(`/api/render-stack/${service}?job=${encodeURIComponent(job)}&frame=${encodeURIComponent(frame)}`);
      const d = (await res.json()) as StackState;
      if (d.ok) {
        setOrder(d.render_order ?? []);
        setStreamed((d.render_order ?? []).map((e) => e.key));
        setNote(`render hand-off: prefix scan "job#${frame}#" streamed ${d.render_order?.length ?? 0} layers bottom→top`);
      }
    } finally {
      setBusy(false);
    }
  }

  const stackedPaths = new Set(order.map((e) => e.path));

  return (
    <section className="rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] p-4 text-[#e8e8ed]">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Asset Stack — RocksDB</h2>
          <p className="text-[10px] text-[#666]">
            job <code className="text-[#00d4ff]">{job}</code> · frame <code className="text-[#00d4ff]">{frame}</code>
            {state?.db ? (
              <>
                {" "}· db <code className="text-[#666]">{state.db}</code>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2 text-[10px]">
          <button
            type="button"
            disabled={busy || !order.length}
            onClick={saveStack}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {busy ? "Writing…" : "Save stack (WriteBatch)"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={streamOrder}
            className="rounded-lg border border-[#00d4ff]/40 bg-[#00d4ff]/10 px-3 py-1.5 text-[#00d4ff] hover:bg-[#00d4ff]/20 disabled:opacity-40"
          >
            Stream render order
          </button>
        </div>
      </header>

      {state && !state.ok && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}
      {note && <p className="mb-3 text-[10px] text-[#888]">{note}</p>}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* the stack — draggable, L01 (bottom) first in render order */}
        <div className="lg:col-span-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-[#555]">
            Render stack · bottom → top · drag to reorder
          </p>
          <ol className="space-y-1.5">
            {order.map((entry, i) => (
              <li
                key={entry.key}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIdx(i);
                }}
                onDragEnd={() => {
                  setDragIdx(null);
                  setOverIdx(null);
                }}
                onDrop={() => drop(i)}
                className={`flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                  dragIdx === i
                    ? "border-[#00d4ff]/60 bg-[#00d4ff]/10 opacity-60"
                    : overIdx === i
                      ? "border-[#7c3aed]/60 bg-[#7c3aed]/10"
                      : "border-[#1e1e2e] bg-[#0a0a0f] hover:border-[#2a2a3a]"
                } ${streamed?.includes(entry.key) ? "ring-1 ring-emerald-500/30" : ""}`}
              >
                <span className="rounded bg-[#7c3aed]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#b79df5]">
                  L{String(entry.depth).padStart(2, "0")}
                </span>
                <code className="hidden shrink-0 text-[9px] text-[#555] sm:inline">{entry.key}</code>
                <span className="truncate font-mono text-[10px] text-[#aaa]" title={entry.path}>
                  {entry.path}
                </span>
                <span className="ml-auto text-[9px] text-[#444]">{i === 0 ? "bottom" : i === order.length - 1 ? "top" : "⋮"}</span>
              </li>
            ))}
            {!order.length && !state?.error && (
              <li className="rounded-lg border border-dashed border-[#1e1e2e] px-3 py-6 text-center text-xs text-[#555]">
                empty stack — add layers from the folder
              </li>
            )}
          </ol>
          <p className="mt-2 text-[9px] leading-relaxed text-[#444]">
            keys: job#frame#depth (byte-sorted, zero-padded) · restacks are one atomic WriteBatch · values are path
            references (BlobDB tier next)
          </p>
        </div>

        {/* the virtual folder — meta CF, files never move on disk */}
        <div className="lg:col-span-2">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-[#555]">
            Asset folder · meta CF · virtual
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {(state?.assets ?? []).map((a) => (
              <li
                key={a.name}
                className="flex items-center gap-2 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-2.5 py-1.5 text-xs"
              >
                <span className="rounded bg-[#1e1e2e] px-1.5 py-0.5 text-[9px] text-[#888]">{a.kind}</span>
                <span className="truncate" title={`${a.name} · ${a.path}`}>
                  {a.name}
                </span>
                <button
                  type="button"
                  disabled={busy || stackedPaths.has(a.path)}
                  onClick={() => post({ op: "add", path: a.path }, `added at next depth — ${a.name}`)}
                  className="ml-auto shrink-0 rounded border border-[#2a2a3a] px-1.5 py-0.5 text-[9px] text-[#aaa] hover:border-[#00d4ff] hover:text-[#00d4ff] disabled:opacity-30"
                >
                  {stackedPaths.has(a.path) ? "stacked" : "add →"}
                </button>
              </li>
            ))}
            {!state?.assets?.length && (
              <li className="rounded-lg border border-dashed border-[#1e1e2e] px-3 py-4 text-center text-[10px] text-[#555]">
                folder empty
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
