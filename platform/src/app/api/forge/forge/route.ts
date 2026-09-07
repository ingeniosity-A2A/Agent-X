import { NextResponse } from "next/server";
import { errJson, forgeEngine, repoRoot } from "@/lib/forge/engine";

/**
 * POST /api/forge/forge — Normalize → Capability Harness → F2 Forged File →
 * housing (RocksDB skills/capabilities + DuckDB intelligence) → F3 append.
 * Immutability: forging the same source again yields version v+1, never a
 * silent modification (the Standard's traceability contract).
 */
export async function POST(req: Request) {
  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }

  let body: { f0_id?: unknown; max_bytes?: unknown };
  try {
    body = await req.json();
  } catch {
    return errJson("invalid JSON body", 400);
  }
  const f0 = typeof body.f0_id === "string" ? body.f0_id : "";
  if (!/^f0-[0-9a-f]{12}$/.test(f0)) return errJson("f0_id must match f0-<12 hex>", 400);
  const maxBytes =
    typeof body.max_bytes === "number" && Number.isInteger(body.max_bytes) && body.max_bytes >= 64 && body.max_bytes <= 8192
      ? body.max_bytes
      : 1200;

  try {
    const result = await forgeEngine(root, ["forge", "--f0", f0, "--max-bytes", String(maxBytes)]);
    return NextResponse.json({ ...result, service: "forge-org" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`F2 forge failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
