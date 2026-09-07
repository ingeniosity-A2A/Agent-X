import { NextResponse } from "next/server";
import { errJson, forgeEngine, repoRoot } from "@/lib/forge/engine";

/** GET /api/forge/entry?kind=f0|f2|skill|capability|vendor|quarantine&id=… */
export async function GET(req: Request) {
  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "";
  const id = (url.searchParams.get("id") ?? "").slice(0, 200);
  const kinds = ["f0", "f2", "skill", "capability", "vendor", "quarantine"];
  if (!kinds.includes(kind)) return errJson(`kind must be one of ${kinds.join(" | ")}`, 400);
  if (!/^[\w:.\-]+$/.test(id)) return errJson("invalid id", 400);

  try {
    const result = await forgeEngine(root, ["entry", "--kind", kind, "--id", id]);
    return NextResponse.json({ ...result, service: "forge-org" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`entry read failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
