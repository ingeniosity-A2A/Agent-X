"use client";

import BrowserPanel from "@/components/browser/BrowserPanel";
import BottomAIBar from "@/components/shell/BottomAIBar";
import { SECTIONS } from "@/components/shell/AvaShell";
import "../ava-console.css";

/**
 * AVA007 Cybernetic Console — route mounting the patch v8 surface:
 * BrowserPanel (with the Edit Mode slide-over) + BottomAIBar ("sound on both
 * ends": real Web Speech input, real /api/ai/tts voice-out, reply bubble).
 */
export default function AvaConsolePage() {
  return (
    <main className="ava-console">
      <header className="ava-console-header">
        <div>
          <h1>AVA007 Cybernetic Console</h1>
          <p>
            patch v8 — Edit Mode panel + dual waveform · agent-browser session{" "}
            <span className="mono">ava007-console</span>
          </p>
        </div>
        <span className="ava-badge">
          <span className="ava-dot" />
          {SECTIONS.browser.label}
        </span>
      </header>

      <BrowserPanel />

      <BottomAIBar activeSection="browser" />
    </main>
  );
}
