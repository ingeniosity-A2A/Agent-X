import { NextRequest, NextResponse } from "next/server";
import { errJson, MAX_TAKE, memoryEngine, repoRoot } from "@/lib/memory/engine";

/**
 * POST /api/memory/ingest  { source, take?, actor? }
 *
 * Synchronous Rev.ike zero-copy ingestion (no SSE): runs the full stream and
 * returns the benchmark-format report — records, throughput, per-tier output
 * bytes, Delta RSS + VERIFIED FLAT RAM verdict. Sources: local
 * .jsonl/.parquet/.json paths, "hf:<repo>[::<config>][:split]" (Sovereign
 * Ingestion streaming=True), or "synthetic:N" simulated heavy workload.
 */
export async function POST(req: NextRequest) {
  let body: { source?: string; take?: number; actor?: string };
  try {
    body = await req.json();
  } catch {
    return errJson("invalid JSON body", 400);
  }
  const source = (body.source || "").trim();
  if (!source) return errJson("need { source } — file path, hf:<repo>, or synthetic:N", 400);
  const take = Number.isFinite(body.take) ? Math.min(Math.max(Number(body.take), 1), MAX_TAKE) : undefined;
  const actor = (body.actor || "rev-ike").slice(0, 64);

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  try {
    const args = ["ingest", "--source", source, "--actor", actor];
    if (take) args.push("--take", String(take));
    const result = await memoryEngine(root, args, 120_000);
    return NextResponse.json({ ...result, service: "memory-tdai" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`ingest failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** GET /api/memory/ingest — benchmark alias for quick checks from the shell. */
export async function GET() {
  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  try {
    const result = await memoryEngine(root, ["stats"]);
    return NextResponse.json({ ...result, service: "memory-tdai" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`stats failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
