import { NextRequest, NextResponse } from "next/server";
import { errJson, memoryEngine, repoRoot } from "@/lib/memory/engine";

/**
 * POST /api/memory/lock  { node, state: "locked" | "unlocked" }
 *
 * Governance Lock-and-Slide: tier cards are LOCKED by default (protected
 * layers — agents and teammates never write over verified directories).
 * Unlocking is an explicit, recorded state transition that authorizes the
 * GSAP slide-out into the split-screen inspector. Streaming completions
 * auto-lock their targets (Governance Transition).
 */
export async function POST(req: NextRequest) {
  let body: { node?: string; state?: string };
  try {
    body = await req.json();
  } catch {
    return errJson("invalid JSON body", 400);
  }
  const node = (body.node || "").trim();
  const state = body.state === "unlocked" ? "unlocked" : body.state === "locked" ? "locked" : null;
  if (!node || !state) return errJson("need { node, state: locked|unlocked }", 400);

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return errJson("no git checkout reachable", 404);
  }
  try {
    const result = await memoryEngine(root, ["lock", node, "--state", state]);
    return NextResponse.json({ ...result, service: "memory-tdai" }, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return errJson(`lock transition failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
