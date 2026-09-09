"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════
   ESA SERVICE CARD SHELL
   Layout chrome around the ESA service views. ESA = Extended Stay America:
   the brand lives on the service cards (work orders, supply ordering,
   inventory) — the shell is chrome, so it carries the client label only as
   the host of those cards.
   History: ESAHarness → ESAExoskeleton → ServiceCardShell. The decorative
   "EXOSKELETON APPLIED" pill was REMOVED (that string is the F2 forge
   verdict pill, not UI chrome) and "HARNESS/Exoskeleton" naming left with it
   — per owner doctrine, 2026-09-09.
   Provides the gold-accent top bar and a consistent layout shell around all
   ESA service views.
   ═══════════════════════════════════════════════════════════ */

export function ServiceCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="service-card-shell">
      {/* Top bar — hosts the ESA service cards */}
      <div className="service-card-shell-bar">
        <div className="service-card-shell-inner">
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
                ESA Service Cards
              </div>
              <div className="text-[9px] font-mono tracking-widest" style={{ color: "rgba(201,168,76,0.4)" }}>
                EXTENDED STAY AMERICA
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
                  animation: "service-card-shell-pulse 2s ease-in-out infinite",
                }}
              />
              <span className="text-[9px] font-mono font-semibold" style={{ color: "#22c55e" }}>
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shell body — renders all child content */}
      <div className="service-card-shell-body">{children}</div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes service-card-shell-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        .service-card-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #09090b;
        }
        .service-card-shell-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: linear-gradient(180deg, rgba(8,8,8,0.98), rgba(8,8,8,0.92));
          border-bottom: 1px solid rgba(201,168,76,0.15);
          backdrop-filter: blur(12px);
          padding: 0.4rem 0;
        }
        .service-card-shell-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .service-card-shell-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
