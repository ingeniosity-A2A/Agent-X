"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import TerminalPanel from "../terminals/TerminalPanel";
import BentoCardBuilder from "../builder/BentoCardBuilder";
import { chunkCode, type Chunk } from "@/lib/recursive-splitter";
import { animateCodeDiff } from "@/lib/codeDiffAnimator";

type EditMode = "terminal" | "ide" | "cards";

/**
 * Original slide-over "Edit Mode" surface for the Browser panel — not a
 * port of any reference material. Toggling Edit Mode in BrowserPanel's
 * address bar slides this in from the right (real GSAP xPercent tween,
 * same technique as useDevSlideOut) with three original workspace modes:
 * Terminal (reuses the real TerminalPanel), IDE (the real repo file tree +
 * read-only preview + the recursive-splitter → SplitText render pass, fed
 * by /api/repo/*), and Cards (the real CardBuilder, mounted inline).
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
        {mode === "ide" && <IdeMode />}
        {mode === "cards" && (
          <div style={{ transform: "scale(0.94)", transformOrigin: "top left" }}>
            <BentoCardBuilder />
          </div>
        )}
      </div>
    </div>
  );
}

interface FileResponse {
  ok: boolean;
  path: string;
  bytes: number;
  truncated: boolean;
  content: string;
  error?: string;
}

/**
 * IDE mode — wired to the real repository on disk through /api/repo/tree and
 * /api/repo/file. Pick a tracked file, read its real working-tree content,
 * run the architecture doc's frontend half on it: recursive-splitter chunks
 * (deterministic hashes, line/col bounds, parent headers) and the GSAP
 * SplitText slide-up + ASCII glitch ripple rendering a selected chunk.
 */
function IdeMode() {
  const [root, setRoot] = useState<string | null>(null);
  const [files, setFiles] = useState<string[] | null>(null);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileResponse | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[] | null>(null);
  const [activeChunk, setActiveChunk] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/repo/tree");
        const data = (await res.json().catch(() => null)) as
          | { ok: boolean; root: string; files: string[]; hint?: string; error?: string }
          | null;
        if (cancelled) return;
        if (data?.ok) {
          setRoot(data.root);
          setFiles(data.files);
          const preferred =
            data.files.find((f) => f.endsWith("src/app/agent-browser/interface/terminal/page.tsx")) ?? data.files[0];
          if (preferred) setSelected(preferred);
        } else {
          setTreeError(data?.hint ?? data?.error ?? `repo tree responded ${res.status}`);
        }
      } catch {
        if (!cancelled) setTreeError("Could not reach /api/repo/tree.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFile = useCallback(async (path: string) => {
    setSelected(path);
    setFileError(null);
    setChunks(null);
    setActiveChunk(null);
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/repo/file?path=${encodeURIComponent(path)}`);
      const data = (await res.json().catch(() => null)) as FileResponse | null;
      if (data?.ok) {
        setFileData(data);
      } else {
        setFileData(null);
        setFileError(data?.error ?? `file read responded ${res.status}`);
      }
    } catch {
      setFileData(null);
      setFileError("Could not reach /api/repo/file.");
    } finally {
      setLoadingFile(false);
    }
  }, []);

  const visible = (files ?? []).filter((f) => f.toLowerCase().includes(filter.toLowerCase()));
  const rendered = visible.slice(0, 300);

  function splitCurrent() {
    if (!fileData?.ok || !fileData.content) return;
    const cs = chunkCode(fileData.content, { maxSize: 1200 });
    setChunks(cs);
    setActiveChunk(cs.length ? 0 : null);
  }

  function renderChunk(i: number) {
    if (!chunks || i < 0 || i >= chunks.length || !stageRef.current) return;
    setActiveChunk(i);
    stageRef.current.textContent = chunks[i].content;
    animateCodeDiff(stageRef.current);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="bento-card--inset" style={{ borderRadius: 12, padding: 10 }}>
        <div style={{ fontSize: 10.5, color: "var(--bento-text-muted)", marginBottom: 6 }}>
          {files
            ? `Files — tracked by git${root ? ` · ${root.split("/").pop()}` : ""} · ${files.length}`
            : "Files"}
        </div>
        {treeError && (
          <div className="mono" style={{ fontSize: 10.5, color: "var(--bento-text-muted)" }}>
            {treeError}
          </div>
        )}
        {files && (
          <input
            className="mono"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter tracked files…"
            style={{
              width: "100%",
              background: "var(--bento-surface-dark)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "6px 8px",
              color: "var(--bento-text-primary)",
              fontSize: 11,
              outline: "none",
              marginBottom: 6,
            }}
          />
        )}
        <div className="ava-scrollbar" style={{ maxHeight: 150, overflowY: "auto" }}>
          {rendered.map((f) => (
            <button
              key={f}
              onClick={() => loadFile(f)}
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
          {visible.length > rendered.length && (
            <div className="mono" style={{ fontSize: 10, color: "var(--bento-text-muted)", padding: "4px 6px" }}>
              …and {visible.length - rendered.length} more — refine the filter
            </div>
          )}
        </div>
      </div>

      <div className="bento-card--inset" style={{ borderRadius: 12, padding: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--bento-text-muted)" }}>
            {selected ?? "no file selected"}
            {fileData?.truncated ? " (truncated to 512 KB)" : ""}
          </span>
          <button className="ava-badge" style={{ cursor: "pointer" }} onClick={splitCurrent} disabled={!fileData}>
            {loadingFile ? "loading…" : "Split"}
          </button>
        </div>
        {fileError && (
          <div className="mono" style={{ fontSize: 10.5, color: "var(--bento-text-muted)" }}>
            {fileError}
          </div>
        )}
        {fileData && (
          <pre
            className="mono ava-scrollbar"
            style={{
              margin: 0,
              maxHeight: 160,
              overflow: "auto",
              fontSize: 10,
              lineHeight: 1.45,
              color: "var(--bento-text-secondary)",
              whiteSpace: "pre",
            }}
          >
            {fileData.content}
          </pre>
        )}
      </div>

      {chunks && chunks.length > 0 && (
        <div className="bento-card--inset" style={{ borderRadius: 12, padding: 10 }}>
          <div style={{ fontSize: 10.5, color: "var(--bento-text-muted)", marginBottom: 6 }}>
            Chunks — {chunks.length} · recursive splitter, FNV-1a hashed
          </div>
          <div className="ava-scrollbar" style={{ maxHeight: 110, overflowY: "auto" }}>
            {chunks.map((c, i) => (
              <button
                key={c.id + i}
                onClick={() => renderChunk(i)}
                className="mono"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: activeChunk === i ? "var(--bento-surface-light)" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 6px",
                  fontSize: 10,
                  color: activeChunk === i ? "var(--bento-text-primary)" : "var(--bento-text-muted)",
                  cursor: "pointer",
                }}
              >
                {c.id} · L{c.startLine}–{c.endLine}
                {c.parent ? ` · ${c.parent.kind}:${c.parent.name}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {chunks && chunks.length > 0 && (
        <div className="bento-card--inset" style={{ borderRadius: 12, padding: 10 }}>
          <div style={{ fontSize: 10.5, color: "var(--bento-text-muted)", marginBottom: 6 }}>
            Render — SplitText slide-up + ASCII shift of the selected chunk
          </div>
          <div
            ref={stageRef}
            className="mono"
            style={{
              minHeight: 60,
              maxHeight: 140,
              overflowY: "auto",
              fontSize: 10,
              lineHeight: 1.45,
              color: "var(--bento-text-primary)",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      )}
    </div>
  );
}
