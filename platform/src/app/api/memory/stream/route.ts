import { NextRequest } from "next/server";
import { DEFAULT_HOUSING, errJson, MAX_TAKE, repoRoot, spawnMemoryEngine } from "@/lib/memory/engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/memory/stream?source=synthetic:10000&progress=250
 *
 * Server-Sent Events live Rev.ike ingestion. Each engine stdout line (NDJSON)
 * is forwarded as an SSE event the moment it arrives — the explorer's L1
 * Atom Card progress gauges update inside the 100ms perceptual fusion
 * constant (Bento UI8 Visual Telemetry), and the final line carries the
 * full benchmark-format report + auto-lock governance transition.
 *
 * Event types: progress {records, throughput_rps, bytes} | done {ok, stream}
 *              | error {ok:false, error}
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const source = (sp.get("source") || "synthetic:10000").slice(0, 200);
  const take = sp.get("take") ? Math.min(Math.max(parseInt(sp.get("take") || "0", 10) || 0, 1), MAX_TAKE) : null;
  const progress = Math.min(Math.max(parseInt(sp.get("progress") || "250", 10) || 250, 25), 25_000);
  const actor = (sp.get("actor") || "rev-ike-live").slice(0, 64);

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }

  const args = ["--housing", DEFAULT_HOUSING, "ingest", "--source", source, "--actor", actor, "--progress-every", String(progress)];
  if (take) args.push("--take", String(take));

  const encoder = new TextEncoder();
  const child = spawnMemoryEngine(root, args);

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (line: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${line}\n\n`));
        } catch {
          closed = true;
        }
      };

      let buf = "";
      child.stdout.on("data", (chunk: Buffer) => {
        buf += chunk.toString("utf-8");
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (line) send(line);
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf-8").trim();
        if (text) send(JSON.stringify({ type: "stderr", line: text.slice(0, 300) }));
      });

      child.on("close", (code) => {
        if (buf.trim()) send(buf.trim());
        send(JSON.stringify({ type: "exit", code }));
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
      child.on("error", (err) => {
        send(JSON.stringify({ type: "error", ok: false, error: String(err).slice(0, 300) }));
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });

      req.signal.addEventListener("abort", () => {
        try {
          child.kill("SIGKILL");
        } catch {
          /* noop */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
