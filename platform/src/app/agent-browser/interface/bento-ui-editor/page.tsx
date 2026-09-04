"use client";

import BentoCardBuilder from "@/components/builder/BentoCardBuilder";
import { SECTIONS } from "@/components/shell/AvaShell";

/**
 * Agent Browser / Interface / Bento-UI-Editor — the drag-reorder bento card
 * builder promoted to a full Interface surface (same real CardBuilder that
 * Edit Mode → Card Editor mounts; same localStorage persistence contract).
 */
export default function BentoUiEditorPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bento-bg, #0a0a0f)",
        padding: "28px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--bento-text-muted, #888)",
              margin: 0,
            }}
          >
            Agent Browser · Interface
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--bento-text-primary, #e8e8ed)",
            }}
          >
            Bento UI Editor
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--bento-text-muted, #999)" }}>
            {SECTIONS.bento.description} — order and visibility persist per browser.
          </p>
        </div>
        <span
          className="ava-badge"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <span className="ava-dot" />
          {SECTIONS.bento.label}
        </span>
      </header>

      <section
        className="bento-card bento-card--elevated"
        style={{ padding: 16, borderRadius: 16 }}
      >
        <BentoCardBuilder />
      </section>
    </main>
  );
}
