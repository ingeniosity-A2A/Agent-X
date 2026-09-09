import { NextResponse } from "next/server";
import { errJson, forgeEngine, repoRoot } from "@/lib/forge/engine";

/** GET /api/forge/tree — the ForgedxFolders tree the explorer sidebar renders. */
export async function GET() {
  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  try {
    const result = await forgeEngine(root, ["tree"]);
    return NextResponse.json({ ...result, service: "forge-org" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`forgedxfolders tree failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
