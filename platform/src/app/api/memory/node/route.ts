import { NextRequest, NextResponse } from "next/server";
import { errJson, memoryEngine, repoRoot } from "@/lib/memory/engine";

/**
 * GET /api/memory/node?id=<node_id|path>&bytes=N — the Deterministic Recall
 * Hook. Resolves a symbol-graph node to its raw payload head + provenance.
 * This is the drill-down behind Mermaid symbol nodes: the explorer shows the
 * graph; clicking a node pulls exactly the referenced segment out of
 * refs/ / L0 / L1 — nothing enters context un-referenced (TDAI offloading).
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const bytesParam = req.nextUrl.searchParams.get("bytes");
  if (!id) return errJson("missing ?id=<node_id|path>", 400);
  const bytes = bytesParam ? Math.min(Math.max(parseInt(bytesParam, 10) || 4096, 64), 262144) : undefined;

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  try {
    const args = ["node", id];
    if (bytes) args.push("--bytes", String(bytes));
    const result = await memoryEngine(root, args);
    return NextResponse.json({ ...result, service: "memory-tdai" }, { status: result.ok ? 200 : 404 });
  } catch (e) {
    return errJson(`node recall failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
