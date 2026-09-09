import { NextResponse } from "next/server";
import { errJson, memoryEngine, repoRoot } from "@/lib/memory/engine";

/**
 * GET /api/memory/tree — the 4-tier Memory Timeline: L3 Persona -> L2 Scenario
 * -> L1 Atoms -> L0 Trace + refs/ offload archive, with governance lock
 * states and the deterministic symbol graph (Mermaid + structured nodes).
 */
export async function GET() {
  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  try {
    const result = await memoryEngine(root, ["tree"]);
    return NextResponse.json({ ...result, service: "memory-tdai" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`memory tree failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
