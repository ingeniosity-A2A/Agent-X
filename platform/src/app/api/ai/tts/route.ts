import { NextResponse } from "next/server";

/**
 * POST /api/ai/tts — real text-to-speech for the console's voice-out side.
 *
 * Uses z-ai-web-dev-sdk `audio.tts.create` (server-side only). The SDK caps a
 * single request at 1024 chars, so the reply is split on sentence boundaries
 * into ≤1000-char chunks, each is synthesized as raw 24 kHz 16-bit mono PCM,
 * and the PCM buffers are concatenated and wrapped in one proper RIFF/WAVE
 * header — the operator hears the entire reply, not a truncated first second.
 */

const CHUNK_MAX = 1000; // SDK hard cap is 1024; leave headroom
const TOTAL_MAX = 8000; // bound synthesis time for very long replies
const SAMPLE_RATE = 24000;

const VOICES = new Set(["tongtong", "chuichui", "xiaochen", "jam", "kazi", "douji", "luodo"]);

function splitSentences(text: string): string[] {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length <= CHUNK_MAX) {
      current += sentence;
    } else {
      if (current.trim()) chunks.push(current.trim());
      // A single pathological "sentence" over the cap is hard-split — never dropped.
      let rest = sentence;
      while (rest.length > CHUNK_MAX) {
        chunks.push(rest.slice(0, CHUNK_MAX));
        rest = rest.slice(CHUNK_MAX);
      }
      current = rest;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function wavHeader(pcmLength: number): Buffer {
  const b = Buffer.alloc(44);
  b.write("RIFF", 0, "ascii");
  b.writeUInt32LE(36 + pcmLength, 4);
  b.write("WAVE", 8, "ascii");
  b.write("fmt ", 12, "ascii");
  b.writeUInt32LE(16, 16); // PCM chunk size
  b.writeUInt16LE(1, 20); // format = PCM
  b.writeUInt16LE(1, 22); // channels = mono
  b.writeUInt32LE(SAMPLE_RATE, 24);
  b.writeUInt32LE(SAMPLE_RATE * 1 * 2, 28); // byte rate
  b.writeUInt16LE(2, 32); // block align
  b.writeUInt16LE(16, 34); // bits per sample
  b.write("data", 36, "ascii");
  b.writeUInt32LE(pcmLength, 40);
  return b;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { text?: string; voice?: string; speed?: number }
    | null;

  const text = body?.text?.replace(/\s+/g, " ").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
  }

  const voice = VOICES.has(body?.voice ?? "") ? (body!.voice as string) : "jam";
  const speedRaw = Number(body?.speed ?? 1.0);
  const speed = Number.isFinite(speedRaw) ? Math.min(2.0, Math.max(0.5, speedRaw)) : 1.0;

  const spoken = text.length > TOTAL_MAX ? text.slice(0, TOTAL_MAX) : text;
  const chunks = splitSentences(spoken);
  if (!chunks.length) {
    return NextResponse.json({ ok: false, error: "nothing speakable in text" }, { status: 400 });
  }

  try {
    const { default: ZAI } = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.create();

    const pcmParts: Buffer[] = [];
    let pcmLength = 0;
    for (const chunk of chunks) {
      const response = await zai.audio.tts.create({
        input: chunk,
        voice,
        speed,
        response_format: "pcm", // raw samples — safe to concatenate
        stream: false,
      });
      const buf = Buffer.from(new Uint8Array(await response.arrayBuffer()));
      pcmParts.push(buf);
      pcmLength += buf.length;
    }

    const wav = Buffer.concat([wavHeader(pcmLength), ...pcmParts]);
    return new NextResponse(new Uint8Array(wav), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.length),
        "X-Speech-Chunks": String(chunks.length),
        ...(text.length > TOTAL_MAX ? { "X-Speech-Truncated": `char-${TOTAL_MAX}` } : {}),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS synthesis failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
