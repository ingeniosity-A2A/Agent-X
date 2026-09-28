"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconMic, IconSend } from "@/components/shell/icons";

type Props = {
  card: "maintenance" | "inventory" | "todos";
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Shared ESA Chat Ingestion capability.
 * Every ESA primary card gets the same communication surface:
 * text, camera/Lens capture, files, voice in, and Ava007 voice out.
 * Card-specific APIs remain the source of operational state.
 */
export function ESAChatIngestion({ card }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    audioRef.current?.pause();
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      audioRef.current = audio;
      await audio.play().catch(() => undefined);
    } catch {
      // Voice output is optional; text remains authoritative.
    }
  }, []);

  const send = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? value).trim();
    if (!text || busy) return;
    setBusy(true);
    setStatus(null);
    setValue("");
    try {
      const res = await fetch("/api/ai/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, current_surface: `esa:${card}` }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; reply?: string; hint?: string } | null;
      if (data?.reply) {
        setStatus(data.reply);
        await speak(data.reply);
      } else {
        setStatus(data?.hint ?? "Ava007 did not return a response.");
      }
    } catch {
      setStatus("Ava007 is unavailable.");
    } finally {
      setBusy(false);
    }
  }, [busy, card, speak, value]);

  const toggleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setStatus("Voice input is not supported in this browser.");
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
      recognitionRef.current = null;
    };
    rec.onerror = (e) => {
      setStatus(`Voice input unavailable: ${e.error ?? "microphone error"}.`);
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  function onFile(file: File | undefined) {
    if (!file) return;
    setStatus(`Captured ${file.name}. Send a question to Ava007 about it.`);
  }

  return (
    <section className="mb-4 rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] p-3" data-card-chat-ingestion={card}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#7c3aed]">Chat Ingestion</p>
          <p className="text-xs text-[#777]">Lens · files · voice · Ava007</p>
        </div>
        <span className="text-[10px] text-[#555]">ESA · {card}</span>
      </div>

      {status && (
        <div className="mb-2 max-h-28 overflow-y-auto rounded-lg border border-[#1e1e2e] bg-[#09090d] px-3 py-2 text-xs text-[#bbb]">
          {status}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.txt,.csv"
          capture="environment"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-[#2a2a3a] px-2 py-2 text-[10px] text-[#aaa]"
          title="Lens / file capture"
        >
          Lens
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Ava007 about this card…"
          className="min-w-0 flex-1 rounded-lg border border-[#2a2a3a] bg-[#09090d] px-3 py-2 text-xs text-[#eee] outline-none"
        />
        <button
          type="button"
          onClick={toggleMic}
          className={`rounded-lg border px-2 py-2 text-xs ${listening ? "border-red-500/50 text-red-300" : "border-[#2a2a3a] text-[#aaa]"}`}
          title={listening ? "Stop voice input" : "Voice input"}
        >
          <IconMic />
        </button>
        <button
          type="button"
          onClick={() => send()}
          disabled={busy}
          className="rounded-lg bg-[#00d4ff] px-3 py-2 text-xs font-semibold text-[#09090d] disabled:opacity-50"
        >
          <IconSend />
        </button>
      </div>
    </section>
  );
}
