"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import TerminalPanel from "../terminals/TerminalPanel";
import CardBuilder from "../builder/CardBuilder";

type EditMode = "terminal" | "ide" | "cards";

/**
 * Original slide-over "Edit Mode" surface for the Browser panel — not a
 * port of any reference material. Toggling Edit Mode in BrowserPanel's
 * address bar slides this in from the right (real GSAP xPercent tween,
 * same technique as useDevSlideOut) with three original workspace modes:
 * Terminal (reuses the real TerminalPanel), IDE (a minimal original file
 * list + read-only preview — placeholder content, not any specific repo),
 * and Cards (the real CardBuilder, mounted inline instead of full-page).
 */
export function EditModePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<EditMode>("cards");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Own the offscreen offset on gsap's xPercent channel: an inline CSS
    // translateX(100%) gets parsed into gsap's x (px) channel, which the
    // xPercent tween never touches — the panel would stay parked offscreen.
    gsap.set(panelRef.current, { xPercent: 100 });
    gsap.to(panelRef.current, {
      xPercent: open ? 0 : 100,
      opacity: open ? 1 : 0,
      duration: reduceMotion ? 0 : open ? 0.5 : 0.35,
      ease: open ? "power3.out" : "power3.in",
    });
  }, [open]);

  return (
    <div
      ref={panelRef}
      className="bento-card bento-card--elevated ava-scrollbar"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        bottom: 100,
        width: 380,
        padding: 16,
        overflowY: "auto",
        opacity: 0,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Edit Mode</span>
        <button className="ava-badge" style={{ cursor: "pointer" }} onClick={onClose}>
          Close
        </button>
      </div>

      <div className="bento-tabs">
        {(["cards", "terminal", "ide"] as EditMode[]).map((m) => (
          <button key={m} className={`bento-tab ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
            {m === "cards" ? "Card Editor" : m === "terminal" ? "Terminal" : "IDE"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {mode === "terminal" && <TerminalPanel context="bash" />}
        {mode === "ide" && <IdeModeStub />}
        {mode === "cards" && (
          <div style={{ transform: "scale(0.94)", transformOrigin: "top left" }}>
            <CardBuilder />
          </div>
        )}
      </div>
    </div>
  );
}

function IdeModeStub() {
  const [selected, setSelected] = useState("console/page.tsx");
  const files = ["console/page.tsx", "components/shell/AvaShell.tsx", "components/browser/BrowserPanel.tsx"];
  const [glbQueue, setGlbQueue] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="bento-card--inset" style={{ borderRadius: 12, padding: 10 }}>
        <div style={{ fontSize: 10.5, color: "var(--bento-text-muted)", marginBottom: 6 }}>Files (placeholder tree)</div>
        {files.map((f) => (
          <button
            key={f}
            onClick={() => setSelected(f)}
            className="mono"
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: selected === f ? "var(--bento-surface-light)" : "transparent",
              border: "none",
              borderRadius: 6,
              padding: "4px 6px",
              fontSize: 11,
              color: "var(--bento-text-secondary)",
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bento-card--inset mono" style={{ borderRadius: 12, padding: 10, fontSize: 10.5, color: "var(--bento-text-muted)", minHeight: 100 }}>
        Read-only preview stub — this IDE mode isn&apos;t wired to a real file system yet. The Browser panel already
        has a real <span style={{ color: "var(--bento-text-secondary)" }}>eval</span> action hook; wire that here to
        make this a real code surface.
      </div>

      <div className="bento-card--inset" style={{ borderRadius: 12, padding: 10 }}>
        <div style={{ fontSize: 10.5, color: "var(--bento-text-muted)", marginBottom: 6 }}>Image → GLB</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setGlbQueue((q) => [...q, f.name]);
          }}
        />
        <button className="ava-badge" style={{ cursor: "pointer" }} onClick={() => inputRef.current?.click()}>
          Choose image
        </button>
        {glbQueue.map((name, i) => (
          <div key={i} style={{ fontSize: 10.5, color: "var(--bento-text-muted)", marginTop: 6 }} className="mono">
            {name} — queued (no GLB conversion pipeline connected yet)
          </div>
        ))}
      </div>
    </div>
  );
}
