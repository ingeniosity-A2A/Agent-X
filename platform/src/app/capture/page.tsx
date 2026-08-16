"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { A2UIRenderer } from "@/components/a2ui";
import type { A2UINode, IngestResult } from "@/components/a2ui/types";

/**
 * Input Ingestion Interface
 * Camera / file → /api/upload → A2UI JobCard render.
 * ESA Lens scan path can reuse the same ingest contract.
 */

export default function CapturePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [item, setItem] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultNode, setResultNode] = useState<A2UINode | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const onFile = useCallback((f: File | null) => {
    setError(null);
    setResultNode(null);
    setJobId(null);
    setFile(f);
    if (!f) {
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      setError("Use an image or PDF");
      setFile(null);
      setPreview(null);
      return;
    }
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !item.trim()) {
      setError("Add a photo or item description");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (item.trim()) form.append("item", item.trim());
      form.append("service", "Standard Assembly");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as IngestResult;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setJobId(data.jobId ?? null);
      setResultNode(data.a2ui ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    onFile(null);
    setItem("");
    setResultNode(null);
    setJobId(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8ed]">
      <header className="border-b border-[#1e1e2e] bg-[#0d0d14] px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7c3aed]">
              Input ingestion
            </p>
            <h1 className="mt-1 text-lg font-semibold">Capture</h1>
            <p className="text-xs text-[#666]">
              Image / file → job → A2UI card (not a dashboard)
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-[#2a2a3a] px-3 py-1.5 text-sm text-[#aaa] hover:border-[#00d4ff] hover:text-[#00d4ff]"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-6 py-8">
        <form onSubmit={submit} className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") inputRef.current?.click();
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              const f = ev.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            className="cursor-pointer rounded-xl border border-dashed border-[#2a2a3a] bg-[#12121a] px-4 py-8 text-center transition hover:border-[#00d4ff]/50"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-48 rounded-lg object-contain"
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#ccc]">Tap or drop image / PDF</p>
                <p className="text-xs text-[#555]">
                  Camera on mobile · max 4MB in this surface
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(ev) => onFile(ev.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="mt-3 truncate font-mono text-[11px] text-[#888]">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div>
            <label htmlFor="item" className="text-[11px] uppercase tracking-wide text-[#555]">
              Item label (optional)
            </label>
            <input
              id="item"
              value={item}
              onChange={(ev) => setItem(ev.target.value)}
              placeholder="e.g. IKEA MALM dresser"
              className="mt-1 w-full rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-2.5 text-sm text-[#e8e8ed] outline-none placeholder:text-[#444] focus:border-[#00d4ff]"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-lg bg-[#00d4ff] px-4 py-2.5 text-sm font-semibold text-[#0a0a0f] disabled:opacity-50"
            >
              {busy ? "Ingesting…" : "Ingest"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-[#2a2a3a] px-4 py-2.5 text-sm text-[#aaa]"
            >
              Reset
            </button>
          </div>
        </form>

        {resultNode && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[#666]">
                Rendered card
              </h2>
              {jobId && (
                <span className="font-mono text-[11px] text-[#00d4ff]">{jobId}</span>
              )}
            </div>
            <A2UIRenderer node={resultNode} />
            <p className="text-[11px] text-[#555]">
              Contract: <code className="text-[#777]">{"{ component: \"JobCard\", data }"}</code>
            </p>
          </section>
        )}

        <p className="text-[11px] text-[#444]">
          ESA Lens can POST the same multipart to <code className="text-[#666]">/api/upload</code>{" "}
          or emit InventoryCard via A2UI after FORGE match.
        </p>
      </main>
    </div>
  );
}
