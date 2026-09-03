"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconRefresh, IconGlobe, IconLock } from "../shell/icons";
import { UniversalFeatureStack } from "../shell/UniversalFeatureStack";
import { EditModePanel } from "./EditModePanel";

type Tab = "snapshot" | "dom" | "network" | "parser" | "downloads" | "ai";

interface SnapshotRef {
  ref: string;
  role?: string;
  name?: string;
  raw: string;
}

const SESSION = "ava007-console";

function parseRefs(raw: string): SnapshotRef[] {
  // agent-browser's compact text snapshot lines look like: [button] "Sign in" @e3
  const lines = raw.split("\n").filter((l) => l.includes("@e"));
  return lines.slice(0, 60).map((line) => {
    const refMatch = line.match(/@e\d+/);
    const roleMatch = line.match(/\[([a-zA-Z_-]+)\]/);
    const nameMatch = line.match(/"([^"]*)"/);
    return {
      ref: refMatch?.[0] ?? "",
      role: roleMatch?.[1],
      name: nameMatch?.[1],
      raw: line.trim(),
    };
  });
}

export default function BrowserPanel() {
  const [url, setUrl] = useState("https://example.com");
  const [addressInput, setAddressInput] = useState("https://example.com");
  const [tab, setTab] = useState<Tab>("snapshot");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "connected" | "error">("idle");
  const [editMode, setEditMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Session not started");
  const [snapRefs, setSnapRefs] = useState<SnapshotRef[]>([]);
  const [screenshotKey, setScreenshotKey] = useState(0);
  const openedRef = useRef(false);

  const refreshSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/browser/snapshot?session=${SESSION}&i=1&c=1`);
      const data = await res.json();
      if (data.ok) {
        setSnapRefs(parseRefs(data.raw || ""));
      }
    } catch {
      // network/API not reachable in this environment — panel stays in error state
    }
  }, []);

  const navigate = useCallback(
    async (targetUrl: string) => {
      setLoading(true);
      setStatusMsg(`Loading ${targetUrl}…`);
      try {
        const res = await fetch("/api/browser/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: SESSION, url: targetUrl }),
        });
        const data = await res.json();
        if (data.ok) {
          setStatus("connected");
          setStatusMsg(`agent-browser · session ${SESSION}`);
          setUrl(targetUrl);
          setScreenshotKey((k) => k + 1);
          await refreshSnapshot();
        } else {
          setStatus("error");
          setStatusMsg(data.hint || data.stderr || "agent-browser unreachable");
        }
      } catch {
        setStatus("error");
        setStatusMsg("Could not reach /api/browser/open — is the Next.js server running?");
      } finally {
        setLoading(false);
      }
    },
    [refreshSnapshot],
  );

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    navigate(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doAction = async (action: Record<string, unknown>) => {
    setLoading(true);
    try {
      await fetch("/api/browser/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: SESSION, action }),
      });
      setScreenshotKey((k) => k + 1);
      await refreshSnapshot();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bento-card bento-card--elevated" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* address bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="ava-icon-btn" onClick={() => doAction({ type: "back" })} title="Back">
          <IconArrowLeft />
        </button>
        <button className="ava-icon-btn" onClick={() => doAction({ type: "forward" })} title="Forward">
          <IconArrowRight />
        </button>
        <button
          className="ava-icon-btn"
          onClick={() => {
            setScreenshotKey((k) => k + 1);
            refreshSnapshot();
          }}
          title="Refresh"
        >
          <IconRefresh />
        </button>
        <form
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--bento-surface-dark)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "7px 14px" }}
          onSubmit={(e) => {
            e.preventDefault();
            let target = addressInput.trim();
            if (target && !/^https?:\/\//.test(target)) target = `https://${target}`;
            if (target) navigate(target);
          }}
        >
          <IconLock style={{ width: 13, height: 13, opacity: 0.5 }} />
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="mono"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--bento-text-primary)", fontSize: 12.5 }}
            placeholder="Enter URL or search…"
          />
        </form>
        <span className="ava-badge">
          <span className={`ava-dot ${status === "connected" ? "" : status === "error" ? "warn" : "off"}`} />
          agent-browser
        </span>
        <button
          className="ava-badge"
          style={{ cursor: "pointer", background: editMode ? "var(--bento-gradient-cool)" : undefined, color: editMode ? "#fff" : undefined, border: editMode ? "none" : undefined }}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? "Editing…" : "Edit Mode"}
        </button>
      </div>
      <EditModePanel open={editMode} onClose={() => setEditMode(false)} />

      {/* viewport */}
      <div
        className="bento-card--inset"
        style={{
          borderRadius: 20,
          minHeight: 360,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {status === "connected" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={screenshotKey}
            src={`/api/browser/screenshot?session=${SESSION}&t=${screenshotKey}`}
            alt="live browser viewport"
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            onError={() => setStatusMsg("Screenshot capture failed — CLI may still be starting Chrome")}
          />
        ) : (
          <div style={{ textAlign: "center", padding: 32, color: "var(--bento-text-muted)", fontSize: 12.5, maxWidth: 380 }}>
            <IconGlobe style={{ width: 26, height: 26, margin: "0 auto 10px", opacity: 0.5 }} />
            <div style={{ color: "var(--bento-text-secondary)", marginBottom: 6, fontSize: 13 }}>
              {status === "error" ? "Exoskeleton browser capability offline" : "Starting session…"}
            </div>
            <div>{statusMsg}</div>
            {status === "error" && (
              <div className="mono" style={{ marginTop: 10, fontSize: 10.5, opacity: 0.7 }}>
                npm install -g agent-browser && agent-browser install
              </div>
            )}
          </div>
        )}
        {loading && (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <span className="ava-badge">working…</span>
          </div>
        )}
      </div>

      {/* tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="bento-tabs">
          {(["snapshot", "dom", "network", "parser", "downloads", "ai"] as Tab[]).map((t) => (
            <button key={t} className={`bento-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--bento-text-muted)" }}>{url}</span>
      </div>

      {/* tab content */}
      <div className="bento-card--inset ava-scrollbar" style={{ borderRadius: 16, padding: 12, maxHeight: 220, overflowY: "auto" }}>
        {tab === "snapshot" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {snapRefs.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--bento-text-muted)" }}>
                No accessibility-tree refs yet. Refs appear here after a page loads — click any @eN row to click that
                element live.
              </div>
            )}
            {snapRefs.map((r, i) => (
              <button
                key={i}
                onClick={() => r.ref && doAction({ type: "click", ref: r.ref })}
                className="mono"
                style={{
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "var(--bento-text-secondary)",
                  fontSize: 11.5,
                  padding: "3px 4px",
                  borderRadius: 6,
                  cursor: r.ref ? "pointer" : "default",
                }}
              >
                <span style={{ color: "var(--bento-accent-mint)" }}>{r.ref}</span>{" "}
                {r.role && <span style={{ color: "var(--bento-accent-blue)" }}>[{r.role}]</span>}{" "}
                {r.name && <span>&quot;{r.name}&quot;</span>}
              </button>
            ))}
          </div>
        )}
        {tab === "dom" && (
          <div style={{ fontSize: 12, color: "var(--bento-text-muted)" }}>
            Full DOM inspection uses <span className="mono">agent-browser eval</span> against the live session —
            wire a query box here next; the eval action is already exposed via <span className="mono">POST /api/browser/action</span>.
          </div>
        )}
        {tab === "network" && (
          <div style={{ fontSize: 12, color: "var(--bento-text-muted)" }}>
            agent-browser exposes request/response logging and network control; not yet streamed into this panel —
            next-phase item, backend hook (<span className="mono">act()</span>) is ready.
          </div>
        )}
        {tab === "parser" && (
          <div style={{ fontSize: 12, color: "var(--bento-text-muted)" }}>
            Ingestion pipeline: page → <span className="mono">agent-browser read</span> → normalize → chunk → an A2A
            call to <span className="mono">quantum-membrain</span> on the edge device (Termux/S26 Ultra) — this
            console never stores the data itself, it only dispatches the call and awaits the state mutation.
            See the Workflow panel for the full pipeline diagram.
          </div>
        )}
        {tab === "downloads" && (
          <div style={{ fontSize: 12, color: "var(--bento-text-muted)" }}>
            Downloads route through the same ingestion pipeline as parsed pages once the artifact registry hook is
            connected here.
          </div>
        )}
        {tab === "ai" && (
          <div>
            <div style={{ fontSize: 11.5, color: "var(--bento-text-muted)", marginBottom: 10 }}>
              current_surface: <span className="mono">browser</span> — asking Ava here carries this page as context.
            </div>
            <UniversalFeatureStack showPrompt />
          </div>
        )}
      </div>
    </div>
  );
}
