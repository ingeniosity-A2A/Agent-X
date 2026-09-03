"use client";

import { useMemo } from "react";

/**
 * Real waveform strip used on both ends of the BottomAIBar ("sound on both
 * ends"). The bars are CSS-animated; `isActive` drives whether they actually
 * move. When inactive the strip is intentionally inert — the mic side passes
 * its real `listening` state, the TTS side passes real playback state (which
 * is `false` until a TTS backend is wired; no fake audio activity).
 */
export function Waveform({ bars = 24, isActive = true }: { bars?: number; isActive?: boolean }) {
  const delays = useMemo(
    () => Array.from({ length: bars }, (_, i) => ((i * 7) % 11) * 0.07 + ((i * 3) % 5) * 0.03),
    [bars],
  );

  return (
    <span className={`ava-waveform ${isActive ? "active" : "idle"}`} role="img" aria-label={isActive ? "audio active" : "audio idle"}>
      {delays.map((d, i) => (
        <span key={i} className="ava-waveform-bar" style={{ animationDelay: `-${d.toFixed(2)}s` }} />
      ))}
    </span>
  );
}
