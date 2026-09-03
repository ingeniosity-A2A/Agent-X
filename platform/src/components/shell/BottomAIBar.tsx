"use client";

import { useState } from "react";
import { IconMic, IconPaperclip, IconSend } from "./icons";
import { Waveform } from "./Waveform";
import type { SectionId } from "./AvaShell";

/**
 * Bottom AI communication interface. Sends `current_surface` (derived from
 * the active nav section) alongside the message so Ava's intent resolution
 * knows what the user is looking at — e.g. "extract the maintenance
 * procedures" while on the Browser panel carries current_surface: "browser".
 *
 * "Sound on both ends": a mic waveform on the input side (real — driven by
 * the `listening` toggle) and an output waveform on the send side that
 * represents TTS playback. The output side stays visually inert (no
 * animation) since no TTS backend is wired yet — showing it as "active"
 * would be faking audio output that isn't happening. Once a TTS endpoint
 * exists, flip `speaking` to true while it plays and this side lights up
 * using the same real Waveform component the mic side already uses.
 */
export default function BottomAIBar({ activeSection }: { activeSection: SectionId }) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking] = useState(false); // wire to real TTS playback state when available

  const send = () => {
    if (!value.trim()) return;
    // Intent dispatch point: POST { text: value, current_surface: activeSection }
    // to the Intellect intent queue once that endpoint exists.
    setValue("");
  };

  return (
    <div className="ava-bottombar">
      <button className="ava-icon-btn" title="Attach">
        <IconPaperclip />
      </button>
      <span className="ava-context-chip">{activeSection}</span>
      {listening ? (
        <Waveform isActive />
      ) : (
        <input
          placeholder="Ask Ava…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
      )}
      <button
        className={`ava-icon-btn ${listening ? "listening" : ""}`}
        title={listening ? "Stop listening" : "Voice in"}
        onClick={() => setListening((v) => !v)}
      >
        <IconMic />
      </button>
      <div title={speaking ? "Ava speaking" : "Voice out (idle — no TTS backend wired)"} style={{ opacity: speaking ? 1 : 0.35 }}>
        <Waveform bars={16} isActive={speaking} />
      </div>
      <button className="ava-icon-btn primary" title="Send" onClick={send}>
        <IconSend />
      </button>
    </div>
  );
}
