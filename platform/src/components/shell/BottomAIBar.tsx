"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconMic, IconPaperclip, IconSend } from "./icons";
import { Waveform } from "./Waveform";
import type { SectionId } from "./AvaShell";

/**
 * Bottom AI communication interface. Sends `current_surface` (derived from
 * the active nav section) alongside the message to /api/ai/intent — a real
 * dispatch: the reply is rendered in a bubble above the bar and spoken
 * through /api/ai/tts (real synthesized audio; the output waveform animates
 * from actual playback state, never otherwise).
 *
 * "Sound on both ends": the mic side uses the Web Speech API when the browser
 * has it — transcript lands in the input, the waveform runs only while real
 * recognition is live. Browsers without SpeechRecognition get an honest note
 * instead of a decorative fake waveform.
 */

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function speechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function BottomAIBar({ activeSection }: { activeSection: SectionId }) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [reply, setReply] = useState<{ text: string; engine: string } | null>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const lastReplyRef = useRef<string>("");

  useEffect(() => {
    setMicSupported(speechRecognitionCtor() !== null);
    return () => {
      audioRef.current?.pause();
      recogRef.current?.stop();
    };
  }, []);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      if (a.src.startsWith("blob:")) URL.revokeObjectURL(a.src);
      a.src = "";
    }
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stopAudio();
      setNote(null);
      try {
        const res = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setNote(`Voice out unavailable: ${data?.error ?? `tts responded ${res.status}`}`);
          return;
        }
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onplay = () => setSpeaking(true);
        audio.onended = () => stopAudio();
        audio.onerror = () => {
          setNote("Voice out unavailable: audio playback failed.");
          stopAudio();
        };
        audioRef.current = audio;
        try {
          await audio.play();
        } catch (playErr) {
          // Autoplay policy or output device issue — name the real cause.
          const name = playErr instanceof Error ? playErr.name : "playback failed";
          setNote(`Voice out blocked: ${name}.`);
          stopAudio();
        }
      } catch {
        setNote("Voice out unavailable: could not reach /api/ai/tts.");
      }
    },
    [stopAudio],
  );

  const send = useCallback(async () => {
    const text = value.trim();
    if (!text || busy) return;
    setBusy(true);
    setNote(null);
    setValue("");
    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, current_surface: activeSection }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; reply?: string; engine?: string; hint?: string }
        | null;
      if (data?.ok && data.reply) {
        setReply({ text: data.reply, engine: data.engine ?? "local" });
        lastReplyRef.current = data.reply;
        setBubbleOpen(true);
        speak(data.reply);
      } else {
        setNote(data?.hint ?? `Intent dispatch responded ${res.status}.`);
      }
    } catch {
      setNote("Could not reach /api/ai/intent.");
    } finally {
      setBusy(false);
    }
  }, [value, busy, activeSection, speak]);

  const toggleMic = useCallback(() => {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const Ctor = speechRecognitionCtor();
    if (!Ctor) {
      // Honest state: no fake waveform for a mic that captures nothing.
      setNote("Voice in not supported in this browser — type instead.");
      return;
    }
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setValue(transcript);
    };
    rec.onend = () => {
      setListening(false);
      recogRef.current = null;
    };
    rec.onerror = (e) => {
      setNote(`Voice in error: ${e.error ?? "microphone unavailable"}.`);
      setListening(false);
      recogRef.current = null;
    };
    recogRef.current = rec;
    setNote(null);
    rec.start();
    setListening(true);
  }, [listening]);

  return (
    <>
      {reply && bubbleOpen && (
        <div
          className="bento-card bento-card--elevated ava-scrollbar"
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 104,
            width: "min(680px, calc(100vw - 32px))",
            maxHeight: 180,
            overflowY: "auto",
            padding: 14,
            zIndex: 29,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="ava-badge" style={{ cursor: "default" }}>
              ava · {reply.engine === "llm" ? "llm" : "local engine"}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="ava-badge"
                style={{ cursor: "pointer" }}
                title="Speak again"
                onClick={() => speak(reply.text)}
              >
                replay
              </button>
              <button className="ava-badge" style={{ cursor: "pointer" }} onClick={() => setBubbleOpen(false)}>
                ×
              </button>
            </div>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--bento-text-primary)", whiteSpace: "pre-wrap" }}>
            {reply.text}
          </div>
        </div>
      )}

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
          title={listening ? "Stop listening" : micSupported ? "Voice in" : "Voice in (not supported in this browser)"}
          onClick={toggleMic}
        >
          <IconMic />
        </button>
        <div title={speaking ? "Ava speaking" : "Voice out (idle)"} style={{ opacity: speaking ? 1 : 0.35 }}>
          <Waveform bars={16} isActive={speaking} />
        </div>
        <button className="ava-icon-btn primary" title={busy ? "Dispatching…" : "Send"} onClick={send}>
          <IconSend />
        </button>
      </div>

      {(note || (reply && !bubbleOpen)) && (
        <button
          className="ava-badge"
          style={{ position: "fixed", right: 20, bottom: 108, zIndex: 28, cursor: "pointer" }}
          onClick={() => {
            if (reply) setBubbleOpen(true);
            setNote(null);
          }}
        >
          {note ?? "last reply hidden — reopen"}
        </button>
      )}
    </>
  );
}
