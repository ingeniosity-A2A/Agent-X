"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap/suite";
import { createASCIIShift } from "@/lib/asciiGlitch";
import { VaultTree, type TreeNode, type TreeEntry } from "./VaultTree";
import { Odometer, SplitTextStage, VerdictPill, LockGlyph, type TreeTone } from "./widgets";
/**
 * FILE EXPLORER CANVAS — the UI implementation of the AVA007 FORGED FILE VAULT
 * (FORGED-FILE-STANDARD.md 1.0.0). The reference explorer's geometry,
 * navigation, inspector, grid/list behavior, breadcrumbs, search, sorting and
 * interaction model are preserved; the pipeline stages, stage rail, three
 * colors, and semantic animations are the Forged File architecture additions.
 *
 * Pipeline: F0 Raw Upload → [PRE-CHECK → INTERCEPT] → F1 Chunk (GSAP
 * SplitText) → Refactor/Normalize → Capability Harness → F2 Forged File →
 * RocksDB Skills / DuckDB Intelligence → F3 Manifest (append-only).
 * Hugging Face vendor imports stay OUTSIDE F0→F3.
 */

type Folder = "overview" | "f0" | "f1" | "f2" | "f3" | "skills" | "intelligence" | "vendor" | "quarantine" | "curation";

const FOLDER_ORDER: Folder[] = ["overview", "f0", "f1", "f2", "f3", "skills", "intelligence", "vendor", "quarantine", "curation"];

const FOLDER_META: Record<Folder, { label: string; tone: TreeTone; blurb: string }> = {
  overview: { label: "Overview", tone: "neutral", blurb: "Vault status — real RocksDB control plane + real DuckDB intelligence" },
  f0: { label: "F0 Raw Upload", tone: "neutral", blurb: "Write-once original evidence · sha256-addressed · dedupe on identical bytes" },
  f1: { label: "F1 Chunk Engine", tone: "neutral", blurb: "Deterministic chunking · GSAP SplitText is the mandatory visual language" },
  f2: { label: "F2 Forged Files", tone: "neutral", blurb: "Governed immutable artifacts — changes forge a new version, never modify history" },
  f3: { label: "F3 Manifest", tone: "neutral", blurb: "Append-only provenance + backlinks — why does this skill exist?" },
  skills: { label: "Forged Skills", tone: "orange", blurb: "RocksDB — executable procedural knowledge (control plane)" },
  intelligence: { label: "Forged Intelligence", tone: "yellow", blurb: "DuckDB — structured knowledge, metadata, facts" },
  vendor: { label: "Hugging Face Vendor", tone: "neutral", blurb: "Vendor/input boundary — OUTSIDE F0→F3 · weights stay in the HF store" },
  quarantine: { label: "Quarantine", tone: "neutral", blurb: "Unknown artifacts — fail-safe classification" },
  curation: { label: "Mastering-Ava007-Curation", tone: "neutral", blurb: "Curation selects/refines; forging governs what was produced and traced" },
};

interface VaultTreeData {
  ok?: boolean;
  f0: (TreeEntry & { bytes?: number; ts?: string })[];
  f2: (TreeEntry & { harness?: string; chunks?: number; version?: number; ts?: string })[];
  skills: (TreeEntry & { provides?: number; ts?: string })[];
  capabilities: (TreeEntry & { verdict?: string; ts?: string })[];
  vendor: (TreeEntry & { format?: string; ts?: string })[];
  quarantine: (TreeEntry & { format?: string; ts?: string })[];
}

interface ManifestData {
  ok?: boolean;
  f0_count: number;
  f2_count: number;
  vendor_count: number;
  quarantine_count: number;
  forged: {
    forged_id: string;
    name: string;
    sha256: string;
    version: number;
    f0_id: string;
    chunk_count: number;
    skills: string[];
    capabilities: string[];
    harness: string;
    forged_at: string;
    provenance_events: number;
  }[];
}

interface StatsData {
  ok?: boolean;
  rocksdb: { control_keys: number; idx_keys: number; manifest_keys: number; meta_keys: number };
  duckdb: Record<string, number | string>;
  files: { raw: number; forged: number; vendor: number; quarantine: number };
}

interface EntryDetail extends Record<string, unknown> {
  ok?: boolean;
  kind?: string;
}

const bytes = (n?: number) => (typeof n === "number" ? `${(n / 1024).toFixed(n < 102400 ? 1 : 0)} KB` : "—");
const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

export function VaultExplorer() {
  const [folder, setFolder] = useState<Folder>("overview");
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"name" | "size" | "time" | "kind">("name");
  const [tree, setTree] = useState<VaultTreeData | null>(null);
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [detail, setDetail] = useState<EntryDetail | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chunkResult, setChunkResult] = useState<Record<string, unknown> | null>(null);
  const [chunkF0, setChunkF0] = useState<string>("");
  const [activeChunk, setActiveChunk] = useState<number | null>(null);
  const [rippleId, setRippleId] = useState<string | null>(null);
  const [vendorResult, setVendorResult] = useState<Record<string, unknown> | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const prevFolder = useRef<Folder>(folder);
  const rippleTimers = useRef<number[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [t, m, s] = await Promise.all([
        fetch("/api/forge/tree").then((r) => r.json()),
        fetch("/api/forge/manifest").then((r) => r.json()),
        fetch("/api/forge/stats").then((r) => r.json()),
      ]);
      if (t?.ok) setTree(t);
      if (m?.ok) setManifest(m);
      if (s?.ok) setStats(s);
    } catch {
      setError("vault engine unreachable — is the platform server running?");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // serialized on purpose: the engines are single-writer (RocksDB +
      // DuckDB file locks) — the API retries, but we don't stack calls
      try {
        const t = await fetch("/api/forge/tree").then((r) => r.json());
        if (!cancelled && t?.ok) setTree(t);
        const m = await fetch("/api/forge/manifest").then((r) => r.json());
        if (!cancelled && m?.ok) setManifest(m);
        const s = await fetch("/api/forge/stats").then((r) => r.json());
        if (!cancelled && s?.ok) setStats(s);
      } catch {
        if (!cancelled) setError("vault engine unreachable — is the platform server running?");
      }
    })();
    return () => {
      cancelled = true;
      rippleTimers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // SLIDE — stage changes always slide, never fade (Standard §7)
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const from = FOLDER_ORDER.indexOf(prevFolder.current);
    const to = FOLDER_ORDER.indexOf(folder);
    prevFolder.current = folder;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const dir = to >= from ? 1 : -1;
    gsap.fromTo(canvas, { xPercent: 4 * dir, opacity: 1 }, { xPercent: 0, opacity: 1, duration: 0.42, ease: "power3.out", clearProps: "transform" });
  }, [folder]);

  const loadDetail = useCallback(async (kind: string, id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/forge/entry?kind=${kind}&id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as EntryDetail;
      setDetail(data);
      if (!data.ok) setError(String(data.error ?? "entry read failed"));
    } catch {
      setError("entry read unreachable");
    } finally {
      setBusy(false);
    }
  }, []);

  const select = useCallback(
    (node: { id: string; entryId?: string; locked?: boolean }) => {
      setError(null);
      if (node.locked) {
        setSelection(null);
        setDetail(null);
        return;
      }
      if (node.entryId) {
        const [kind, id] = node.entryId.split(":");
        setSelection(node.entryId);
        const kmap: Record<string, string> = { f0: "f0", f2: "f2", skills: "skill", intelligence: "capability", vendor: "vendor", quarantine: "quarantine" };
        void loadDetail(kmap[kind] ?? kind, id);
        if (kind === "f0" || kind === "f2") setFolder(kind === "f0" ? "f0" : "f2");
      } else {
        setSelection(null);
        setDetail(null);
        setFolder(node.id as Folder);
      }
    },
    [loadDetail],
  );

  // ── flows ──────────────────────────────────────────────────────────────────
  const ingest = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/forge/ingest", { method: "POST", body: form });
        const data = await res.json();
        if (!data.ok) {
          setError(String(data.error ?? "F0 ingest failed"));
          return null;
        }
        await refresh();
        // UPLOAD → ASCII glitch ripple on the new entry (Standard §7)
        setRippleId(data.f0_id as string);
        setFolder("f0");
        const t = window.setTimeout(() => setRippleId(null), 1600);
        rippleTimers.current.push(t);
        return data.f0_id as string;
      } catch {
        setError("F0 ingest unreachable");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const runChunk = useCallback(
    async (f0: string) => {
      setBusy(true);
      setError(null);
      setChunkResult(null);
      setActiveChunk(null);
      try {
        const res = await fetch("/api/forge/chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ f0_id: f0 }),
        });
        const data = await res.json();
        if (!data.ok) setError(String(data.error ?? "F1 chunk failed"));
        else setChunkResult(data);
      } catch {
        setError("F1 chunk unreachable");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const runForge = useCallback(
    async (f0: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/forge/forge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ f0_id: f0 }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(String(data.error ?? "F2 forge failed"));
          return;
        }
        await refresh();
        setFolder("f2");
        setSelection(`f2:${data.forged_id}`);
        await loadDetail("f2", data.forged_id as string);
      } catch {
        setError("F2 forge unreachable");
      } finally {
        setBusy(false);
      }
    },
    [refresh, loadDetail],
  );

  const runVendor = useCallback(
    async (file: File, repo: string) => {
      setBusy(true);
      setError(null);
      setVendorResult(null);
      try {
        const form = new FormData();
        form.append("file", file);
        if (repo) form.append("repo", repo);
        const res = await fetch("/api/forge/vendor", { method: "POST", body: form });
        const data = await res.json();
        if (!data.ok) setError(String(data.error ?? "vendor detection failed"));
        else {
          setVendorResult(data);
          await refresh();
        }
      } catch {
        setError("vendor detection unreachable");
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  // ── sidebar tree data (reference geometry, vault content) ────────────────
  const groups: TreeNode[][] = [
    [{ id: "overview", label: "Overview", tone: "neutral" }],
    [
      { id: "f0", label: "F0 Raw Upload", tone: "neutral", count: tree?.f0.length, children: tree?.f0.map((e) => ({ id: e.id, name: e.name, meta: bytes(e.bytes) })) },
      { id: "f1", label: "F1 Chunk Engine", tone: "neutral", count: tree?.f0.length },
      { id: "f2", label: "F2 Forged Files", tone: "neutral", count: tree?.f2.length, children: tree?.f2.map((e) => ({ id: e.id, name: e.name, meta: `v${e.version ?? 1}` })) },
      { id: "f3", label: "F3 Manifest", tone: "neutral", count: manifest?.f2_count },
    ],
    [
      { id: "skills", label: "Forged Skills · RocksDB", tone: "orange", count: tree?.skills.length, children: tree?.skills.map((e) => ({ id: e.id, name: e.name, meta: `${e.provides ?? 0} symbols` })) },
      { id: "intelligence", label: "Forged Intelligence · DuckDB", tone: "yellow", count: tree?.capabilities.length, children: tree?.capabilities.map((e) => ({ id: e.id, name: e.name, meta: e.verdict })) },
    ],
    [
      {
        id: "vendor",
        label: "Hugging Face Vendor",
        tone: "neutral",
        count: tree?.vendor.length,
        children: [
          ...(tree?.vendor.map((e) => ({ id: e.id, name: e.name, meta: e.format })) ?? []),
          ...(tree?.quarantine.some((q) => q.format === "unknown")
            ? []
            : [{ id: "vendor-weights", name: "Model weights (HF store)", meta: "DEV-LOCKED", locked: true }]),
        ],
      },
      { id: "quarantine", label: "Quarantine", tone: "neutral", count: tree?.quarantine.length, children: tree?.quarantine.map((e) => ({ id: e.id, name: e.name, meta: e.format })) },
    ],
    [
      {
        id: "curation",
        label: "Mastering-Ava007-Curation",
        tone: "neutral",
        children: [
          { id: "cur-core", name: "Core Parameters", meta: "DEV-LOCKED", locked: true },
          { id: "cur-exo", name: "Curated Exoskeleton Configuration", meta: "DEV-LOCKED", locked: true },
          { id: "cur-sandbox", name: "Realtime Sandbox", meta: "DEV-LOCKED", locked: true },
        ],
      },
    ],
  ];

  // sorting + search over the current folder's entries
  const sortEntries = useCallback(
    <T extends { name: string; size?: number; ts?: string; kind?: string }>(rows: T[]) => {
      const s = [...rows];
      s.sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "size") return (b.size ?? 0) - (a.size ?? 0);
        if (sort === "time") return (b.ts ?? "").localeCompare(a.ts ?? "");
        return (a.kind ?? "").localeCompare(b.kind ?? "") || a.name.localeCompare(b.name);
      });
      return s;
    },
    [sort],
  );

  const f0Rows = sortEntries((tree?.f0 ?? []).map((e) => ({ ...e, size: e.bytes })));
  const f2Rows = sortEntries((tree?.f2 ?? []).map((e) => ({ ...e })));

  const meta = FOLDER_META[folder];
  const activeStages: { id: Folder; label: string; sub: string; tone: TreeTone }[] = [
    { id: "f0", label: "F0", sub: "raw", tone: "neutral" },
    { id: "f1", label: "F1", sub: "chunk", tone: "neutral" },
    { id: "f2", label: "F2", sub: "forged", tone: "neutral" },
    { id: "skills", label: "SKILLS", sub: "rocksdb", tone: "orange" },
    { id: "intelligence", label: "INTEL", sub: "duckdb", tone: "yellow" },
    { id: "f3", label: "F3", sub: "manifest", tone: "neutral" },
  ];

  return (
    <div className="forge-root" data-folder={folder}>
      <VaultTree groups={groups} activeId={selection ?? folder} onSelect={select} />

      <main className="forge-main">
        <div className="forge-topbar">
          <nav className="forge-crumbs" aria-label="Breadcrumb">
            <span>Vault</span>
            <span aria-hidden="true">/</span>
            <b>{meta.label}</b>
            {selection && (
              <>
                <span aria-hidden="true">/</span>
                <span className="forge-mono">{selection.split(":")[1]}</span>
              </>
            )}
          </nav>
          <div style={{ flex: 1 }} />
          <span className="forge-pill forge-pill--orange">RocksDB · Skills</span>
          <span className="forge-pill forge-pill--yellow">DuckDB · Intelligence</span>
          <div role="group" aria-label="View mode" style={{ display: "flex", gap: 4 }}>
            <button className="forge-btn" aria-pressed={mode === "grid"} onClick={() => setMode("grid")}>
              Grid
            </button>
            <button className="forge-btn" aria-pressed={mode === "list"} onClick={() => setMode("list")}>
              List
            </button>
          </div>
          <label className="forge-mono" style={{ fontSize: 10, color: "var(--forge-muted)" }}>
            sort{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ background: "var(--forge-inset)", color: "var(--forge-ink)", border: "1px solid var(--forge-line)", borderRadius: 7, padding: "3px 6px", font: "inherit" }}>
              <option value="name">name</option>
              <option value="size">size</option>
              <option value="time">time</option>
              <option value="kind">kind</option>
            </select>
          </label>
        </div>

        <div className="forge-body">
          <div className="forge-canvas forge-slide" ref={canvasRef}>
            {/* stage rail — the pipeline is always visible, active stage highlighted */}
            <div className="forge-rail" role="tablist" aria-label="Forged File pipeline stages">
              {activeStages.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={folder === s.id || (s.id === "f2" && folder === "f3") || (s.id === "intelligence" && folder === "f3")}
                  data-tone={s.tone}
                  data-active={folder === s.id}
                  className="forge-stage"
                  onClick={() => {
                    setSelection(null);
                    setDetail(null);
                    setFolder(s.id);
                  }}
                >
                  <b>{s.label}</b>
                  <span>{s.sub}</span>
                </button>
              ))}
            </div>

            <p className="forge-mono" style={{ fontSize: 10.5, color: "var(--forge-muted)", marginTop: 0 }}>
              {meta.blurb}
            </p>

            {error && (
              <div className="forge-mono" role="alert" style={{ fontSize: 11, color: "#c1341b", border: "1px solid currentColor", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
                {error}
              </div>
            )}

            {folder === "overview" && <Overview manifest={manifest} stats={stats} onGo={(f) => { setSelection(null); setDetail(null); setFolder(f); }} />}

            {folder === "f0" && (
              <F0View
                rows={f0Rows}
                mode={mode}
                busy={busy}
                rippleId={rippleId}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onIngest={ingest}
                selected={selection}
                onSelect={(id) => {
                  setSelection(`f0:${id}`);
                  void loadDetail("f0", id);
                }}
                onForge={runForge}
                onChunk={(id) => {
                  setChunkF0(id);
                  setFolder("f1");
                  void runChunk(id);
                }}
              />
            )}

            {folder === "f1" && (
              <F1View
                f0Rows={f0Rows}
                chunkF0={chunkF0}
                setChunkF0={(id) => {
                  setChunkF0(id);
                  if (id) void runChunk(id);
                }}
                chunkResult={chunkResult}
                activeChunk={activeChunk}
                setActiveChunk={setActiveChunk}
                busy={busy}
              />
            )}

            {folder === "f2" && (
              <F2View rows={f2Rows} mode={mode} selected={selection} onSelect={(id) => { setSelection(`f2:${id}`); void loadDetail("f2", id); }} />
            )}

            {folder === "f3" && <F3View manifest={manifest} onSelect={(id) => { setSelection(`f2:${id}`); void loadDetail("f2", id); }} />}

            {folder === "skills" && (
              <RowsView
                rows={sortEntries((tree?.skills ?? []).map((e) => ({ ...e, kind: "skill", ts: e.ts })))}
                mode={mode}
                tone="orange"
                selected={selection}
                onSelect={(id) => {
                  setSelection(`skills:${id}`);
                  void loadDetail("skill", id);
                }}
                empty="No forged skills yet — forge an F0 in the pipeline."
              />
            )}

            {folder === "intelligence" && <IntelView stats={stats} caps={sortEntries((tree?.capabilities ?? []).map((e) => ({ ...e, kind: "capability" })))} mode={mode} selected={selection} onSelect={(id) => { setSelection(`intelligence:${id}`); void loadDetail("capability", id); }} />}

            {folder === "vendor" && (
              <VendorView
                rows={sortEntries((tree?.vendor ?? []).map((e) => ({ ...e, kind: e.format ?? "asset", ts: e.ts })))}
                quarantined={sortEntries((tree?.quarantine ?? []).map((e) => ({ ...e, kind: e.format ?? "asset", ts: e.ts })))}
                mode={mode}
                busy={busy}
                result={vendorResult}
                onVendor={runVendor}
                selected={selection}
                onSelect={(id) => {
                  setSelection(`vendor:${id}`);
                  void loadDetail("vendor", id);
                }}
              />
            )}

            {folder === "quarantine" && (
              <RowsView
                rows={sortEntries((tree?.quarantine ?? []).map((e) => ({ ...e, kind: e.format ?? "asset", ts: e.ts })))}
                mode={mode}
                tone="neutral"
                selected={selection}
                onSelect={(id) => {
                  setSelection(`quarantine:${id}`);
                  void loadDetail("quarantine", id);
                }}
                empty="Quarantine is empty — every artifact so far was recognized."
              />
            )}

            {folder === "curation" && <CurationView onGo={(f) => { setSelection(null); setDetail(null); setFolder(f); }} />}
          </div>

          <aside className="forge-inspector" aria-label="Inspector">
            <Inspector detail={detail} selection={selection} busy={busy} folder={folder} />
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ── views ─────────────────────────────────────────────────────────────────── */

type Row = { id: string; name: string; size?: number; ts?: string; kind?: string; harness?: string; chunks?: number; meta?: string };

function Cell({ row, mode, tone, selected, onSelect, ripple, children }: { row: Row; mode: "grid" | "list"; tone: TreeTone; selected: boolean; onSelect: () => void; ripple?: boolean; children?: React.ReactNode }) {
  const titleRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ripple && titleRef.current) {
      const cancel = createASCIIShift(titleRef.current, { dur: 900, spread: 0.35 });
      return cancel;
    }
  }, [ripple]);
  return (
    <div
      className="forge-cell"
      data-tone={tone}
      data-selected={selected}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={mode === "list" ? { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px" } : undefined}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="cell-title" ref={titleRef}>
          {row.name}
        </span>
        <span className="cell-sub" style={{ display: "block" }}>
          {row.meta ?? row.kind ?? ""} {row.size !== undefined ? `· ${fmtBytes(row.size)}` : ""}
        </span>
      </span>
      {children}
    </div>
  );
}

function RowsView({ rows, mode, tone, selected, onSelect, empty }: { rows: Row[]; mode: "grid" | "list"; tone: TreeTone; selected: string | null; onSelect: (id: string) => void; empty: string }) {
  return (
    <div className={mode === "grid" ? "forge-grid" : "forge-rows"}>
      {rows.map((r) => (
        <Cell key={r.id} row={r} mode={mode} tone={tone} selected={selected?.includes(r.id) ?? false} onSelect={() => onSelect(r.id)} />
      ))}
      {rows.length === 0 && (
        <p className="forge-mono" style={{ fontSize: 11, color: "var(--forge-muted)", gridColumn: "1 / -1" }}>
          {empty}
        </p>
      )}
    </div>
  );
}

function Overview({ manifest, stats, onGo }: { manifest: ManifestData | null; stats: StatsData | null; onGo: (f: Folder) => void }) {
  const cards: { label: string; value: number; tone: TreeTone; go: Folder }[] = [
    { label: "F0 Raw Uploads", value: manifest?.f0_count ?? stats?.files.raw ?? 0, tone: "neutral", go: "f0" },
    { label: "F2 Forged Files", value: manifest?.f2_count ?? stats?.files.forged ?? 0, tone: "neutral", go: "f2" },
    { label: "RocksDB Skills", value: stats?.rocksdb.control_keys ?? 0, tone: "orange", go: "skills" },
    { label: "DuckDB Capabilities", value: manifest?.forged.reduce((a, f) => a + (f.capabilities?.length ?? 0), 0) ?? 0, tone: "yellow", go: "intelligence" },
    { label: "Vendor Assets", value: manifest?.vendor_count ?? stats?.files.vendor ?? 0, tone: "neutral", go: "vendor" },
    { label: "Quarantined", value: manifest?.quarantine_count ?? stats?.files.quarantine ?? 0, tone: "neutral", go: "quarantine" },
  ];
  return (
    <div>
      <div className="forge-grid">
        {cards.map((c) => (
          <button key={c.label} className="forge-cell" data-tone={c.tone} onClick={() => onGo(c.go)} style={{ textAlign: "left" }}>
            <span className="cell-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`forge-dot forge-dot--${c.tone}`} aria-hidden="true" />
              <Odometer value={c.value} />
            </span>
            <span className="cell-sub" style={{ display: "block", marginTop: 2 }}>
              {c.label}
            </span>
          </button>
        ))}
      </div>
      <div className="forge-cell" style={{ marginTop: 12, cursor: "default" }}>
        <span className="cell-title forge-mono" style={{ fontSize: 11 }}>
          F0 → F1 → F2 → RocksDB / DuckDB → F3
        </span>
        <span className="cell-sub" style={{ display: "block", marginTop: 4, whiteSpace: "normal" }}>
          immutable F0/F1/F2 · append-only F3 · Hugging Face vendoring happens OUTSIDE the pipeline · orchestration stays outside Ava007
        </span>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <span className="forge-pill">spec {stats?.duckdb && typeof stats === "object" ? "forged-file-standard/1.0.0" : "forged-file-standard/1.0.0"}</span>
          <span className="forge-pill">rocksdb {stats ? `${stats.rocksdb.control_keys + stats.rocksdb.idx_keys + stats.rocksdb.manifest_keys} keys` : "—"}</span>
          <span className="forge-pill">duckdb {stats?.duckdb && !("error" in stats.duckdb) ? `${Object.values(stats.duckdb).reduce<number>((a, b) => a + (typeof b === "number" ? b : 0), 0)} rows` : "—"}</span>
        </div>
      </div>
    </div>
  );
}

function F0View({ rows, mode, busy, rippleId, dragOver, setDragOver, onIngest, selected, onSelect, onForge, onChunk }: {
  rows: Row[];
  mode: "grid" | "list";
  busy: boolean;
  rippleId: string | null;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onIngest: (f: File) => Promise<string | null>;
  selected: string | null;
  onSelect: (id: string) => void;
  onForge: (id: string) => void;
  onChunk: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div
        className="forge-drop"
        data-over={dragOver}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void onIngest(f);
        }}
      >
        F0 Raw Upload — drop a file here (≤32MB) or{" "}
        <button className="forge-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onIngest(f);
            e.currentTarget.value = "";
          }}
        />
        <div className="forge-mono" style={{ fontSize: 9.5, marginTop: 6, opacity: 0.7 }}>
          write-once · sha256-addressed · identical bytes dedupe to the same F0
        </div>
      </div>

      <div className={mode === "grid" ? "forge-grid" : "forge-rows"} style={{ marginTop: 14 }}>
        {rows.map((r) => (
          <Cell key={r.id} row={r} mode={mode} tone="neutral" selected={selected === `f0:${r.id}`} onSelect={() => onSelect(r.id)} ripple={rippleId === r.id}>
            <span style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <button className="forge-btn" onClick={() => onChunk(r.id)} disabled={busy} title="Run F1 chunk on this upload">
                F1
              </button>
              <button className="forge-btn forge-btn--accent" onClick={() => onForge(r.id)} disabled={busy} title="Forge through harness to F2">
                Forge
              </button>
            </span>
          </Cell>
        ))}
      </div>
      {rows.length === 0 && (
        <p className="forge-mono" style={{ fontSize: 11, color: "var(--forge-muted)" }}>
          Vault is empty — the first upload lands here, then flows F1 → F2 → skills/intelligence → F3.
        </p>
      )}
    </div>
  );
}

function F1View({ f0Rows, chunkF0, setChunkF0, chunkResult, activeChunk, setActiveChunk, busy }: {
  f0Rows: Row[];
  chunkF0: string;
  setChunkF0: (id: string) => void;
  chunkResult: Record<string, unknown> | null;
  activeChunk: number | null;
  setActiveChunk: (i: number) => void;
  busy: boolean;
}) {
  const chunks = (chunkResult?.chunks as { seq: number; hash: string; bytes: number; startLine: number; endLine: number; parent: { kind: string; name: string } | null; signals: Record<string, unknown> }[] | undefined) ?? [];
  const norm = (chunkResult?.normalize as Record<string, number | boolean> | undefined) ?? {};
  const harness = chunkResult?.harness as { verdict: string; checks: Record<string, unknown>; measured_us: number } | undefined;
  const preview = String(chunkResult?.preview ?? "");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label className="forge-mono" style={{ fontSize: 10.5, color: "var(--forge-muted)" }}>
          F0 source{" "}
          <select value={chunkF0} onChange={(e) => setChunkF0(e.target.value)} style={{ background: "var(--forge-inset)", color: "var(--forge-ink)", border: "1px solid var(--forge-line)", borderRadius: 7, padding: "4px 8px", font: "inherit", maxWidth: 260 }}>
            <option value="">— pick an F0 upload —</option>
            {f0Rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.id})
              </option>
            ))}
          </select>
        </label>
        <button className="forge-btn forge-btn--accent" disabled={!chunkF0 || busy} onClick={() => setChunkF0(chunkF0)}>
          {busy ? "chunking…" : "Run F1 chunk"}
        </button>
        {harness && <VerdictPill verdict={harness.verdict} />}
      </div>

      {chunkResult?.ok === true && (
        <>
          <div className="forge-cell" style={{ marginTop: 12, cursor: "default" }}>
            <span className="cell-title forge-mono" style={{ fontSize: 11 }}>
              Refactor / Normalize —{" "}
              <Odometer value={Number(norm.crlf ?? 0)} /> CRLF ·{" "}
              <Odometer value={norm.bom ? 1 : 0} /> BOM ·{" "}
              <Odometer value={Number(norm.trailing_ws ?? 0)} /> trailing-ws lines
            </span>
            <span className="cell-sub" style={{ display: "block", marginTop: 4 }}>
              replay-proven: re-chunk produced the same {String(harness?.checks.hashes_stable ?? chunks.length)} hashes · harness measured {harness?.measured_us}µs · F0 untouched
            </span>
          </div>

          <div className="forge-rows" style={{ marginTop: 12 }}>
            {chunks.map((c, i) => (
              <button key={c.hash + i} className="forge-cell" data-selected={activeChunk === i} onClick={() => setActiveChunk(i)} style={{ padding: "8px 12px" }}>
                <span className="cell-title forge-mono" style={{ fontSize: 10.5 }}>
                  #{c.seq} · {c.hash} · L{c.startLine}–{c.endLine} · {fmtBytes(c.bytes)}
                  {c.parent ? ` · ${c.parent.kind}:${c.parent.name}` : ""}
                </span>
              </button>
            ))}
          </div>

          {activeChunk !== null && chunks[activeChunk] && (
            <div className="forge-cell" style={{ marginTop: 12, cursor: "default" }}>
              <span className="cell-title forge-mono" style={{ fontSize: 10.5 }}>
                F1 CHUNK — GSAP SplitText: characters physically separate
              </span>
              <div style={{ marginTop: 8 }}>
                <SplitTextStage key={`${activeChunk}-${chunkResult?.f0_id}`} text={preview} runId={activeChunk} />
              </div>
              <span className="cell-sub" style={{ display: "block", marginTop: 8 }}>
                signals — {JSON.stringify(chunks[activeChunk].signals)}
              </span>
            </div>
          )}
        </>
      )}
      {!chunkResult && (
        <p className="forge-mono" style={{ fontSize: 11, color: "var(--forge-muted)" }}>
          Deterministic separator-priority chunking (class / function / export / block / line / token), FNV-1a content addresses, replay-verified — the same input always forges the same chunk set.
        </p>
      )}
    </div>
  );
}

function F2View({ rows, mode, selected, onSelect }: { rows: Row[]; mode: "grid" | "list"; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className={mode === "grid" ? "forge-grid" : "forge-rows"}>
      {rows.map((r) => (
        <Cell key={r.id} row={r} mode={mode} tone="neutral" selected={selected === `f2:${r.id}`} onSelect={() => onSelect(r.id)}>
          {r.harness && <VerdictPill verdict={r.harness} />}
        </Cell>
      ))}
      {rows.length === 0 && (
        <p className="forge-mono" style={{ fontSize: 11, color: "var(--forge-muted)" }}>
          Nothing forged yet — pick an F0 and run Forge.
        </p>
      )}
    </div>
  );
}

function F3View({ manifest, onSelect }: { manifest: ManifestData | null; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="forge-cell" style={{ cursor: "default", marginBottom: 12 }}>
        <span className="cell-title forge-mono" style={{ fontSize: 11 }}>
          Append-only provenance — <Odometer value={manifest?.forged.reduce((a, f) => a + f.provenance_events, 0) ?? 0} /> events
        </span>
        <span className="cell-sub" style={{ display: "block", marginTop: 4 }}>
          skill → forged file → chunk → upload → vendor/dependency — the F3 chain answers “why does this skill exist?”
        </span>
      </div>
      <div className="forge-rows">
        {(manifest?.forged ?? []).map((f) => (
          <button key={f.forged_id} className="forge-cell" onClick={() => onSelect(f.forged_id)} style={{ padding: "9px 12px" }}>
            <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span className="cell-title forge-mono" style={{ fontSize: 11 }}>
                {f.forged_id}
              </span>
              <span className="cell-sub" style={{ margin: 0 }}>
                {f.name} · v{f.version} · {f.chunk_count} chunks · {f.provenance_events} events
              </span>
              <VerdictPill verdict={f.harness} />
            </span>
          </button>
        ))}
        {!manifest?.forged.length && (
          <p className="forge-mono" style={{ fontSize: 11, color: "var(--forge-muted)" }}>
            Manifest is empty until the first forge.
          </p>
        )}
      </div>
    </div>
  );
}

function IntelView({ stats, caps, mode, selected, onSelect }: { stats: StatsData | null; caps: Row[]; mode: "grid" | "list"; selected: string | null; onSelect: (id: string) => void }) {
  const duck = stats?.duckdb ?? {};
  return (
    <div>
      <div className="forge-grid">
        {Object.entries(duck).map(([table, n]) => (
          <div key={table} className="forge-cell" data-tone="yellow" style={{ cursor: "default" }}>
            <span className="cell-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="forge-dot forge-dot--yellow" aria-hidden="true" />
              <Odometer value={typeof n === "number" ? n : 0} />
            </span>
            <span className="cell-sub" style={{ display: "block" }}>
              {table}
            </span>
          </div>
        ))}
      </div>
      <h4 className="forge-mono" style={{ margin: "16px 0 8px", fontSize: 11, color: "var(--forge-muted)" }}>
        compiled capability units — the runtime-loadable objects
      </h4>
      <div className={mode === "grid" ? "forge-grid" : "forge-rows"}>
        {caps.map((r) => (
          <Cell key={r.id} row={r} mode={mode} tone="yellow" selected={selected === `intelligence:${r.id}`} onSelect={() => onSelect(r.id)} />
        ))}
      </div>
    </div>
  );
}

function VendorView({ rows, quarantined, mode, busy, result, onVendor, selected, onSelect }: {
  rows: Row[];
  quarantined: Row[];
  mode: "grid" | "list";
  busy: boolean;
  result: Record<string, unknown> | null;
  onVendor: (f: File, repo: string) => void;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [repo, setRepo] = useState("");
  return (
    <div>
      <div className="forge-drop">
        Vendor import (OUTSIDE F0→F3) —{" "}
        <button className="forge-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          probe an artifact
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onVendor(f, repo);
            e.currentTarget.value = "";
          }}
        />
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
          <input className="forge-mono" placeholder="hf repo (optional, e.g. meta-llama/Llama-3)" value={repo} onChange={(e) => setRepo(e.target.value)} style={{ background: "var(--forge-inset)", color: "var(--forge-ink)", border: "1px solid var(--forge-line)", borderRadius: 8, padding: "4px 8px", fontSize: 10.5, width: 260 }} />
        </div>
        <div className="forge-mono" style={{ fontSize: 9.5, marginTop: 6, opacity: 0.7 }}>
          safetensors / GGUF / ONNX / tokenizer-config parsed for facts · weight-archives recorded · unknown → quarantine · bytes NEVER enter the vault
        </div>
      </div>

      {result?.ok === true && (
        <div className="forge-cell" style={{ marginTop: 12, cursor: "default" }}>
          <span className="cell-title forge-mono" style={{ fontSize: 11 }}>
            {String(result.format)} — {String(result.classification)}
          </span>
          <span className="cell-sub" style={{ display: "block", marginTop: 4, whiteSpace: "normal" }}>
            asset {String(result.asset_id)} · {fmtBytes(Number(result.size_bytes ?? 0))} · bytes retained: <Odometer value={0} />
            {result.quarantined ? " · QUARANTINED" : ""}
          </span>
          {!!result.facts && Object.keys(result.facts as object).length > 0 && (
            <pre className="forge-pre">{JSON.stringify(result.facts, null, 2)}</pre>
          )}
        </div>
      )}

      <div className={mode === "grid" ? "forge-grid" : "forge-rows"} style={{ marginTop: 12 }}>
        {rows.map((r) => (
          <Cell key={r.id} row={r} mode={mode} tone="neutral" selected={selected === `vendor:${r.id}`} onSelect={() => onSelect(r.id)} />
        ))}
        <div className="forge-cell forge-locked" style={{ cursor: "default" }} inert={true}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LockGlyph />
            <span className="cell-title">Model weights</span>
          </span>
          <span className="cell-sub" style={{ display: "block" }}>
            multi-GB artifacts stay in the HF / content-addressed store — DEV-LOCKED
          </span>
        </div>
      </div>

      {quarantined.length > 0 && (
        <>
          <h4 className="forge-mono" style={{ margin: "16px 0 8px", fontSize: 11, color: "#c1341b" }}>
            quarantined by the detector
          </h4>
          <div className="forge-rows">
            {quarantined.map((r) => (
              <Cell key={r.id} row={r} mode="list" tone="neutral" selected={selected === `quarantine:${r.id}`} onSelect={() => onSelect(r.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CurationView({ onGo }: { onGo: (f: Folder) => void }) {
  const locked = (label: string, sub: string) => (
    <div className="forge-cell forge-locked" style={{ cursor: "default" }} inert={true}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <LockGlyph />
        <span className="cell-title">{label}</span>
      </span>
      <span className="cell-sub" style={{ display: "block" }}>
        {sub}
      </span>
    </div>
  );
  return (
    <div className="forge-grid">
      {locked("Core Parameters", "DEV-LOCKED — specified, not yet operational")}
      {locked("Curated Exoskeleton Configuration", "Manifesto Collection · Beyond The Rainbow Learning · VLA · Voice/Audio")}
      <button className="forge-cell" onClick={() => onGo("f0")} style={{ textAlign: "left" }}>
        <span className="cell-title">Forged File Engine</span>
        <span className="cell-sub" style={{ display: "block" }}>
          F0 Raw · F1 Chunk · F2 Forge · F3 Manifest — live
        </span>
      </button>
      <button className="forge-cell" onClick={() => onGo("skills")} style={{ textAlign: "left" }}>
        <span className="cell-title">Capability Catalog → RocksDB</span>
        <span className="cell-sub" style={{ display: "block" }}>
          Dependencies · Skills · Harnesses — live
        </span>
      </button>
      <button className="forge-cell" onClick={() => onGo("intelligence")} style={{ textAlign: "left" }}>
        <span className="cell-title">DuckDB — Forged Intelligence</span>
        <span className="cell-sub" style={{ display: "block" }}>
          structured knowledge + facts — live
        </span>
      </button>
      <button className="forge-cell" onClick={() => onGo("vendor")} style={{ textAlign: "left" }}>
        <span className="cell-title">Hugging Face Vendor</span>
        <span className="cell-sub" style={{ display: "block" }}>
          models / tokenizers / configs — metadata live, weights locked
        </span>
      </button>
      {locked("Realtime Sandbox", "downstream of curation — Ava007 creative output, not architecture definition")}
    </div>
  );
}

/* ── inspector ─────────────────────────────────────────────────────────────── */

function Inspector({ detail, selection, busy, folder }: { detail: EntryDetail | null; selection: string | null; busy: boolean; folder: Folder }) {
  if (busy) return <p className="forge-mono sub">reading vault…</p>;
  if (!detail?.ok) {
    return (
      <>
        <h3>{FOLDER_META[folder].label}</h3>
        <p className="sub">{FOLDER_META[folder].blurb}</p>
        <dl className="forge-kv">
          <dt>spec</dt>
          <dd>forged-file-standard/1.0.0</dd>
          <dt>colors</dt>
          <dd>neutral / orange / yellow</dd>
          <dt>transitions</dt>
          <dd>slide — never fade</dd>
        </dl>
        <p className="sub" style={{ marginTop: 10 }}>
          Select an entry to inspect it. DEV-LOCKED items are visible but inert — specified, not yet operational.
        </p>
      </>
    );
  }
  const k = detail.kind;
  return (
    <div>
      <h3>{String(detail.name ?? detail.forged_id ?? detail.skill_id ?? detail.capability_id ?? detail.asset_id ?? selection ?? "entry")}</h3>
      <p className="sub">{k ? `kind: ${k}` : ""}</p>
      <dl className="forge-kv">
        {Object.entries(detail)
          .filter(([key, v]) => !["ok", "kind", "preview", "chunks", "provenance", "facts", "content"].includes(key) && typeof v !== "object")
          .slice(0, 14)
          .map(([key, v]) => (
            <div key={key} style={{ display: "contents" }}>
              <dt>{key}</dt>
              <dd>{String(v)}</dd>
            </div>
          ))}
      </dl>

      {Array.isArray(detail.provenance) && (detail.provenance as object[]).length > 0 && (
        <>
          <h4 className="forge-mono" style={{ margin: "12px 0 6px", fontSize: 10.5, color: "var(--forge-muted)" }}>
            F3 provenance (append-only)
          </h4>
          <pre className="forge-pre">{JSON.stringify(detail.provenance, null, 2)}</pre>
        </>
      )}

      {Array.isArray(detail.chunks) && (detail.chunks as object[]).length > 0 && (
        <>
          <h4 className="forge-mono" style={{ margin: "12px 0 6px", fontSize: 10.5, color: "var(--forge-muted)" }}>
            chunk manifest (content-addressed)
          </h4>
          <pre className="forge-pre" style={{ maxHeight: 140 }}>
            {JSON.stringify(detail.chunks, null, 2)}
          </pre>
        </>
      )}

      {typeof detail.preview === "string" && (
        <>
          <h4 className="forge-mono" style={{ margin: "12px 0 6px", fontSize: 10.5, color: "var(--forge-muted)" }}>
            preview (F0 evidence, first 2KB)
          </h4>
          <pre className="forge-pre">{detail.preview}</pre>
        </>
      )}

      {!!detail.facts && Object.keys(detail.facts as object).length > 0 && (
        <>
          <h4 className="forge-mono" style={{ margin: "12px 0 6px", fontSize: 10.5, color: "var(--forge-muted)" }}>
            detector facts
          </h4>
          <pre className="forge-pre">{JSON.stringify(detail.facts, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
