"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════
   ESA HARNESS
   Outer wrapper for the entire ESA Exoskeleton project.
   Provides global ESA branding, a gold-accent top bar, and
   consistent layout shell around all ESA views.
   ═══════════════════════════════════════════════════════════ */

export function ESAHarness({ children }: { children: React.ReactNode }) {
  return (
    <div className="esa-harness">
      {/* Top harness bar — ESA Exoskeleton branding */}
      <div className="esa-harness-bar">
        <div className="esa-harness-inner">
          <div className="flex items-center gap-2.5">
            {/* ESA logo mark */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "linear-gradient(135deg, #c9a84c, #8a6a1a)",
                boxShadow: "0 0 12px rgba(201,168,76,0.35)",
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#080808"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                className="text-[12px] font-bold tracking-wider"
                style={{
                  background: "linear-gradient(90deg, #c9a84c, #e8d5a3)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ESA Exoskeleton
              </div>
              <div className="text-[9px] font-mono tracking-widest" style={{ color: "rgba(201,168,76,0.4)" }}>
                HARNESS ACTIVE
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="block"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e",
                  animation: "esa-harness-pulse 2s ease-in-out infinite",
                }}
              />
              <span className="text-[9px] font-mono font-semibold" style={{ color: "#22c55e" }}>
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Harness body — renders all child content */}
      <div className="esa-harness-body">{children}</div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes esa-harness-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        .esa-harness {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #09090b;
        }
        .esa-harness-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: linear-gradient(180deg, rgba(8,8,8,0.98), rgba(8,8,8,0.92));
          border-bottom: 1px solid rgba(201,168,76,0.15);
          backdrop-filter: blur(12px);
          padding: 0.4rem 0;
        }
        .esa-harness-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .esa-harness-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
