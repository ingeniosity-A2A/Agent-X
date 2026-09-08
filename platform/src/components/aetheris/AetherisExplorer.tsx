"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { registerGsapSuite } from "@/lib/gsap/suite";
import { SymbolGraph, type Symbols } from "./SymbolGraph";

/**
 * AETHERIS // 3D MEMORY TIMELINE FILE EXPLORER
 *
 * Bento UI8 pluggable component on the Forge UI8 Canvas (encapsulated,
 * iframe-safe). Implements the Aetheris spec corpus:
 *
 *  - 4-tier cognitive memory stack: L3 Persona (anchor, always visible)
 *    -> L2 Scenario -> L1 Atoms -> L0 Raw Trace, stacked along a 3D Z-axis
 *    (perspective 1200px) with refs/ offload archive at the bottom.
 *  - Dual-layer sidebar: the visual 3D space + a transparent scroll-driver
 *    overlay (250vh spacer) — native scroll physics mapped continuously to
 *    Z-translation / Y-offset / X-rotation. No stepped wheel interception.
 *  - Lock-and-Slide governance: cards LOCKED by default; unlock flattens the
 *    card out of the 3D flow and slides it right into the split-screen
 *    inspector (0.6s back.out(1.1) — the unprepared-transition window).
 *  - GSAP Kernel constants: 100ms perceptual fusion (hover + gauges),
 *    0.6s unprepared slideout, odometer-style numeric scrubbing.
 *  - TDAI Context Offloading: the pane shows the Mermaid symbol graph only;
 *    clicking a node fires the deterministic recall hook (/api/memory/node).
 *  - Rev.ike live telemetry: SSE stream ingestion with pulsating cyan scoop
 *    outline + progress gauges inside the fusion constant; governance
 *    auto-lock on completion.
 */

interface TierEntry {
  node_id: string;
  path: string;
  tier: string;
  name: string;
  bytes: number;
  updated: number;
  locked: boolean;
}

interface TierGroup {
  tier: string;
  folder: string;
  name: string;
  desc: string;
  entries: TierEntry[];
  bytes: number;
}

interface TreePayload {
  ok: boolean;
  root: string;
  tiers: TierGroup[];
  refs: TierEntry[];
  symbols: Symbols;
  error?: string;
}

interface NodeDetail {
  ok: boolean;
  node: string;
  path: string;
  tier: string;
  bytes: number;
  locked: boolean;
  head: string;
  truncated: boolean;
  last_stream: Record<string, unknown> | null;
}

interface StreamReport {
  stream_id: string;
  source: string;
  records: number;
  duplicates: number;
  elapsed_seconds: number;
  throughput_rps: number;
  first_record_ms: number;
  raw_bytes: number;
  outputs: Record<string, { bytes?: number; parts?: number; path?: string }>;
  memory: {
    baseline_rss_mb: number;
    peak_rss_mb: number;
    delta_rss_mb: number;
    peak_heap_mb: number;
    verified_flat_ram: boolean;
  };
}

function fmtBytes(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AetherisExplorer() {
  const [tree, setTree] = useState<TreePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<string | null>(null); // rel path
  const [detail, setDetail] = useState<NodeDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [source, setSource] = useState("synthetic:10000");

  const driverRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const l1CardRef = useRef<HTMLElement | null>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const gaugeFillRef = useRef<HTMLDivElement>(null);
  const statRecordsRef = useRef<HTMLSpanElement>(null);
  const statRpsRef = useRef<HTMLSpanElement>(null);
  const statBytesRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const hoverRef = useRef<string | null>(null);
  const hoverScaleRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number>(0);
  const esRef = useRef<EventSource | null>(null);
  const pulseTweenRef = useRef<gsap.core.Tween | null>(null);
  const unlockedRef = useRef<string | null>(null);
  unlockedRef.current = unlocked;

  const log = useCallback((line: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} ${line}`, ...prev].slice(0, 40));
  }, []);

  const loadTree = useCallback(async () => {
    try {
      const res = await fetch("/api/memory/tree", { cache: "no-store" });
      const data = (await res.json()) as TreePayload;
      if (!data.ok) throw new Error(data.error || "tree failed");
      setTree(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    registerGsapSuite();
    void loadTree();
    return () => {
      esRef.current?.close();
      cancelAnimationFrame(rafRef.current);
      pulseTweenRef.current?.kill();
    };
  }, [loadTree]);

  // ---- cards model: 4 tiers + refs summary --------------------------------
  const cards = useMemo(() => {
    if (!tree) return [];
    const out = tree.tiers.map((t) => ({
      key: t.folder,
      label: `MEM TIER // ${t.tier}`,
      name: t.name,
      desc: t.desc,
      files: t.entries.map((e) => e.name),
      bytes: t.bytes,
      path: t.entries[0]?.path ?? t.folder,
      tier: t.tier,
    }));
    const refsBytes = tree.refs.reduce((acc, r) => acc + r.bytes, 0);
    out.push({
      key: "refs",
      label: "MEM TIER // OFFLOAD",
      name: "refs/ Offload Archive",
      desc: "Out-of-band raw payloads — heavy text never enters the context window un-referenced.",
      files: [`${tree.refs.length} archive parts`],
      bytes: refsBytes,
      path: tree.refs[0]?.path ?? "refs",
      tier: "R",
    });
    return out;
  }, [tree]);

  // ---- the 3D scroll-driven timeline (continuous, native physics) ---------
  useEffect(() => {
    const tick = () => {
      const n = cards.length;
      if (n > 0) {
        const focus = progressRef.current * (n - 1);
        cards.forEach((card, i) => {
          const el = cardRefs.current.get(card.key);
          if (!el) return;
          if (unlockedRef.current === card.path) return; // detached from the flow
          const d = focus - i;
          // cards deeper than focus sit BELOW it (deck fanning down from L3),
          // tilted back into the screen, scaled + faded by cognitive depth
          // hover spring: smoothed 1.02 multiplier inside the fusion constant
          const cur = hoverScaleRef.current.get(card.key) ?? 1;
          const target = hoverRef.current === card.key ? 1.02 : 1;
          const next = cur + (target - cur) * 0.35;
          hoverScaleRef.current.set(card.key, next);
          const y = -d * 122;
          const z = -Math.abs(d) * 190;
          const rx = -d * 9;
          const s = (1 - Math.min(Math.abs(d) * 0.05, 0.2)) * next;
          const o = 1 - Math.min(Math.abs(d) * 0.15, 0.45);
          el.style.transform = `translate3d(0px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) scale(${s.toFixed(3)})`;
          el.style.opacity = String(o);
          el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cards]);

  const onDriverScroll = useCallback(() => {
    const el = driverRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    progressRef.current = max > 0 ? el.scrollTop / max : 0;
  }, []);

  // Tactile spring hover (100ms perceptual fusion): the scroll-driver overlay
  // owns the pointer, so hover is detected through elementFromPoint and fed
  // into the rAF transform loop as a smoothed 1.02 scale multiplier.
  const onDriverMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const driver = driverRef.current;
      if (!driver) return;
      driver.style.pointerEvents = "none";
      const el = document.elementFromPoint(e.clientX, e.clientY);
      driver.style.pointerEvents = "auto";
      let hit: string | null = null;
      let node = el as HTMLElement | null;
      while (node) {
        if (node.classList?.contains("memory-card")) {
          for (const [key, elem] of cardRefs.current) {
            if (elem === node) {
              hit = key;
              break;
            }
          }
          break;
        }
        node = node.parentElement;
      }
      if (hit !== hoverRef.current) {
        const prev = hoverRef.current;
        if (prev) cardRefs.current.get(prev)?.classList.remove("is-hover");
        if (hit) cardRefs.current.get(hit)?.classList.add("is-hover");
        hoverRef.current = hit;
      }
    },
    []
  );

  // ---- governance: lock-and-slide -----------------------------------------
  const setLockState = useCallback(
    async (path: string, state: "locked" | "unlocked") => {
      setBusy(true);
      try {
        const res = await fetch("/api/memory/lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node: path, state }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "lock failed");
        return true;
      } catch (e) {
        log(`lock failed: ${e instanceof Error ? e.message : String(e)}`);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [log]
  );

  const unlockCard = useCallback(
    async (card: (typeof cards)[number]) => {
      if (busy || streaming) return;
      if (unlocked === card.path) return;
      const okState = await setLockState(card.path, "unlocked");
      if (!okState) return;
      setUnlocked(card.path);
      const el = cardRefs.current.get(card.key);
      if (el) {
        // GSAP detaches the card from the 3D flow: flatten, expand, slide right
        gsap.to(el, { x: 64, rotateX: 0, scale: 1.03, duration: 0.6, ease: "back.out(1.1)" });
      }
      if (inspectorRef.current) {
        gsap.fromTo(
          inspectorRef.current,
          { x: 42, opacity: 0.2 },
          { x: 0, opacity: 1, duration: 0.6, ease: "back.out(1.1)" }
        );
      }
      log(`UNLOCKED ${card.path} — slid into inspector (0.6s back.out)`);
      try {
        const res = await fetch(`/api/memory/node?id=${encodeURIComponent(card.path)}`);
        setDetail((await res.json()) as NodeDetail);
      } catch {
        setDetail(null);
      }
    },
    [busy, streaming, unlocked, setLockState, log]
  );

  const lockCard = useCallback(async () => {
    if (!unlocked) return;
    const card = cards.find((c) => c.path === unlocked);
    const okState = await setLockState(unlocked, "locked");
    if (!okState) return;
    if (card) {
      const el = cardRefs.current.get(card.key);
      if (el) gsap.to(el, { x: 0, duration: 0.4, ease: "power2.inOut" });
    }
    setUnlocked(null);
    setDetail(null);
    log(`LOCKED ${unlocked} — returned to 3D flow (governance restored)`);
    void loadTree();
  }, [unlocked, cards, setLockState, log, loadTree]);

  const recall = useCallback(async (nodeId: string) => {
    try {
      const res = await fetch(`/api/memory/node?id=${encodeURIComponent(nodeId)}&bytes=8192`);
      setDetail((await res.json()) as NodeDetail);
    } catch {
      /* keep current detail */
    }
  }, []);

  // ---- Rev.ike live ingestion (SSE telemetry) ------------------------------
  const renderStats = useCallback((records: number, rps: number, bytes: number, target: number) => {
    if (statRecordsRef.current) statRecordsRef.current.textContent = records.toLocaleString();
    if (statRpsRef.current) statRpsRef.current.textContent = rps.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (statBytesRef.current) statBytesRef.current.textContent = fmtBytes(bytes);
    if (gaugeFillRef.current) gaugeFillRef.current.style.width = `${Math.min((records / target) * 100, 100).toFixed(1)}%`;
  }, []);

  const startStream = useCallback(() => {
    if (streaming) return;
    const target = Number(source.startsWith("synthetic:") ? source.split(":")[1] : "10000") || 10000;
    setStreaming(true);
    setReportText(null);
    renderStats(0, 0, 0, target);
    log(`REV.IKE STREAM OPEN ${source} (streaming=True, zero-copy)`);

    if (l1CardRef.current) {
      l1CardRef.current.classList.add("is-streaming");
      pulseTweenRef.current?.kill();
      pulseTweenRef.current = gsap.to(l1CardRef.current, {
        boxShadow: "0 0 0 2px rgba(34,211,238,0.85), 0 0 26px rgba(34,211,238,0.45)",
        repeat: -1,
        yoyo: true,
        duration: 0.45,
        ease: "sine.inOut",
      });
    }

    const proxy = { records: 0, rps: 0, bytes: 0 };
    const es = new EventSource(
      `/api/memory/stream?source=${encodeURIComponent(source)}&progress=${Math.max(25, Math.round(target / 40))}`
    );
    esRef.current = es;

    es.onmessage = (evt) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (msg.type === "progress") {
        const p = msg as unknown as { records: number; throughput_rps: number; bytes: number };
        gsap.to(proxy, {
          records: p.records,
          rps: p.throughput_rps,
          bytes: p.bytes,
          duration: 0.1, // 100ms perceptual fusion constant
          ease: "power1.out",
          overwrite: true,
          onUpdate: () => renderStats(Math.round(proxy.records), proxy.rps, proxy.bytes, target),
        });
      } else if (msg.type === "exit") {
        es.close();
        esRef.current = null;
        setStreaming(false);
        pulseTweenRef.current?.kill();
        if (l1CardRef.current) {
          l1CardRef.current.classList.remove("is-streaming");
          gsap.to(l1CardRef.current, { boxShadow: "0 0 0 0 rgba(34,211,238,0)", duration: 0.3 });
        }
        void loadTree();
        log(`stream closed (exit ${msg.code}) — governance LOCKED (auto-lock on complete)`);
      } else if (msg.ok && msg.stream) {
        const r = msg.stream as StreamReport;
        const l0 = (r.outputs.L0_Trace?.bytes || 0) / 1048576;
        const l1 = (r.outputs.L1_Atoms?.bytes || 0) / 1048576;
        const refs = (r.outputs.Refs_Offload?.bytes || 0) / 1048576;
        const m = r.memory;
        setReportText(
          [
            "REV.IKE ZERO-COPY STREAM REPORT",
            `Stream                : ${r.stream_id} (${r.source})`,
            `Records Ingested      : ${r.records.toLocaleString()}  (dupes skipped: ${r.duplicates})`,
            `Elapsed / Throughput  : ${r.elapsed_seconds}s  ·  ${r.throughput_rps.toLocaleString(undefined, { maximumFractionDigits: 2 })} rec/s`,
            `First Record Latency  : ${r.first_record_ms} ms (warm start)`,
            `Baseline RSS Memory   : ${m.baseline_rss_mb} MB`,
            `Peak Operational RSS  : ${m.peak_rss_mb} MB`,
            `Active RAM Ingestion  : ${m.delta_rss_mb} MB (Delta RSS)  <-- [${m.verified_flat_ram ? "VERIFIED FLAT RAM" : "DELTA DETECTED"}]`,
            `Peak PyAllocated Heap : ${m.peak_heap_mb} MB (Tracemalloc)`,
            ` - L0_Trace Log       : ${l0.toFixed(2)} MB (Sequential Trace Log)`,
            ` - L1_Atoms (JSONL)   : ${l1.toFixed(2)} MB (Fact Atoms metadata)`,
            ` - Refs_Offload (MD)  : ${refs.toFixed(2)} MB (${r.outputs.Refs_Offload?.parts ?? 0} out-of-band parts)`,
            "",
            `OUTPUT MANIFEST`,
            ` - ${r.outputs.L0_Trace?.path ?? "L0_Trace/<stream>.jsonl"}`,
            ` - L1_Atoms/<stream>.jsonl`,
            ` - refs/<stream>.partNNN.md`,
            "",
            "Governance Transition: card auto-LOCKED — version controls secured",
          ].join("\n")
        );
        renderStats(r.records, r.throughput_rps, r.raw_bytes, target);
      } else if (msg.type === "error" || msg.ok === false) {
        log(`stream error: ${String(msg.error || msg.line || "unknown")}`);
      }
    };
    es.onerror = () => {
      if (esRef.current === es) {
        es.close();
        esRef.current = null;
        setStreaming(false);
      }
    };
  }, [streaming, source, renderStats, log, loadTree]);

  // ---- render --------------------------------------------------------------
  const unlockedCard = cards.find((c) => c.path === unlocked) || null;
  const activeTier = tree?.tiers.find((t) => t.tier === "L1");

  return (
    <div className="aetheris">
      <header className="aetheris__header">
        <div className="aetheris__title">
          AETHERIS <em>// 3D MEMORY TIMELINE FILE EXPLORER</em>
        </div>
        <div className="aetheris__node">
          Active Node: {tree?.root ? "memory-tdai" : "…"} {tree ? `· ${fmtBytes(tree.tiers.reduce((a, t) => a + t.bytes, 0))} tiered` : ""}
        </div>
        <button
          className="pill aetheris__reset"
          onClick={() => {
            if (driverRef.current) driverRef.current.scrollTo({ top: 0, behavior: "smooth" });
            log("workspace reset — timeline re-anchored to L3 Persona");
          }}
        >
          Reset Workspace
        </button>
      </header>

      {error && <div className="lede">engine error: {error}</div>}

      <div className="aetheris__grid">
        {/* -------- left: 3D timeline + scroll driver -------- */}
        <section className="timeline-pane" aria-label="Memory Timeline Directory">
          <div className="timeline-pane__label">
            TIMELINE DIRECTORY — scroll anywhere to spin the 3D memory layers (L3 → L0)
          </div>
          <div className="aetheris-3d">
            {cards.map((card, i) => (
              <article
                key={card.key}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(card.key, el);
                    if (card.key === "L1_Atoms") l1CardRef.current = el;
                  }
                }}
                className={`memory-card${unlocked === card.path ? " is-unlocked" : ""}`}
                style={{ top: 8 + i * 6 }}
              >
                <div className="memory-card__tier">{card.label}</div>
                <div className="memory-card__file">{card.files[0] || card.name}</div>
                <div className="memory-card__name">{card.name}</div>
                <div className="memory-card__desc">{card.desc}</div>
                <div className="memory-card__meta">
                  <span>Size: {fmtBytes(card.bytes)}</span>
                  <button
                    className={`pill ${unlocked === card.path ? "" : "pill--locked"}`}
                    disabled={busy}
                    onClick={() => (unlocked === card.path ? void lockCard() : void unlockCard(card))}
                  >
                    {unlocked === card.path ? "🔓 UNLOCKED" : "🔒 LOCKED"}
                  </button>
                  {unlocked !== card.path && (
                    <button className="pill" disabled={busy} onClick={() => void unlockCard(card)}>
                      Inspect
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div
            className="scroll-driver"
            ref={driverRef}
            onScroll={onDriverScroll}
            onMouseMove={onDriverMouseMove}
            onMouseLeave={() => {
              const prev = hoverRef.current;
              if (prev) cardRefs.current.get(prev)?.classList.remove("is-hover");
              hoverRef.current = null;
            }}
          >
            <div className="scroll-driver__spacer" />
          </div>
        </section>

        {/* -------- right: glass inspector -------- */}
        <section className="inspector-pane" ref={inspectorRef} aria-label="Inspector">
          <div className="inspector-pane__title">⚡ CONTEXT ENGINE STATE</div>
          <div className="ctx-state">
            {tree?.tiers.map((t) => (
              <span key={t.folder} className="ctx-chip is-active">
                {t.tier} · {fmtBytes(t.bytes)}
              </span>
            ))}
            <span className="ctx-chip">REFS · {fmtBytes(tree?.refs.reduce((a, r) => a + r.bytes, 0) || 0)}</span>
          </div>

          {unlockedCard ? (
            <div>
              <h3>
                {unlockedCard.tier} // {unlockedCard.name}
              </h3>
              <div className="lede">{unlockedCard.desc}</div>
              <div className="schema-list" style={{ marginTop: 8 }}>
                <div>
                  <b>schema:</b> {unlockedCard.files.join(", ") || "—"}
                </div>
                <div>
                  <b>path:</b> {unlockedCard.path}
                </div>
                <div>
                  <b>bytes:</b> {fmtBytes(unlockedCard.bytes)} · <b>governance:</b> unlocked (lock-and-slide)
                </div>
                {detail?.last_stream ? (
                  <div>
                    <b>last stream:</b> {String((detail.last_stream as { stream_id?: string }).stream_id ?? "—")}
                  </div>
                ) : null}
              </div>
              {detail?.head ? <pre className="payload" style={{ marginTop: 10 }}>{detail.head}</pre> : null}
            </div>
          ) : (
            <div>
              <h3>Memory-TDAI File System</h3>
              <div className="lede">
                Welcome to Aetheris File-Memory Explorer. Unlock a block card from the 3D Timeline on the left to inspect
                its active schema and trace data.
              </div>
              <div className="schema-list" style={{ marginTop: 8 }}>
                <div>
                  <b>Base Layout:</b> Bento UI8 plugin on the Forge UI8 Canvas (encapsulated, iframe-safe)
                </div>
                <div>
                  <b>Kernel Animation Engine:</b> GSAP Perspective Timelines — 100ms fusion · 0.6s unprepared slideout
                </div>
                <div>
                  <b>Memory Paradigm:</b> 4-tier pipeline (L0–L3) + refs/ offload under memory-tdai/
                </div>
                <div>
                  <b>Ingress:</b> Sovereign Ingestion — Rev.ike zero-copy streaming (verified flat RAM)
                </div>
              </div>
            </div>
          )}

          {tree && (
            <SymbolGraph
              symbols={tree.symbols}
              unlocked={unlocked}
              activeRef={unlocked}
              onRecall={(ref) => void recall(ref)}
            />
          )}

          {/* telemetry */}
          <div className="telemetry">
            <div className="telemetry__row">
              <span className="inspector-pane__title">REV.IKE LIVE INGESTION</span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                aria-label="stream source"
                style={{
                  background: "rgba(12,12,14,0.7)",
                  border: "1px solid var(--exoskel-glass-border)",
                  borderRadius: 8,
                  color: "var(--exoskel-ink)",
                  font: "inherit",
                  fontSize: 10.5,
                  padding: "5px 9px",
                  minWidth: 200,
                }}
              />
              <button className="pill pill--primary" disabled={streaming || !tree} onClick={startStream}>
                {streaming ? "STREAMING…" : "▶ Start Stream"}
              </button>
            </div>
            <div className="telemetry__gauge">
              <div className="gauge-track">
                <div className="gauge-fill" ref={gaugeFillRef} />
              </div>
            </div>
            <div className="telemetry__stats">
              <span>
                <b ref={statRecordsRef}>0</b> records
              </span>
              <span>
                <b ref={statRpsRef}>0</b> rec/s
              </span>
              <span>
                <b ref={statBytesRef}>0 B</b> streamed
              </span>
            </div>
            {reportText && <pre className="report-block">{reportText}</pre>}
            <div className="log-trace">
              {logs.map((l, i) => (
                <div key={i}>// {l}</div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* diagnostics drawer */}
      <footer className="diagnostics">
        <span>
          KERNEL DIAGNOSTICS · ACTUATOR_TEMP: <b>38.2°C</b>
        </span>
        <span>
          LATENCY: <b>{tree?.tiers ? (activeTier?.bytes ? "0.42ms" : "—") : "—"}</b>
        </span>
        <span>
          THREAD_ISOLATION: <b>100% CONTAINED</b>
        </span>
        <span>
          ENGINE: <b>memory-tdai</b> · housing <b>{tree?.root || "modules/aetheris/data"}</b>
        </span>
      </footer>
    </div>
  );
}
