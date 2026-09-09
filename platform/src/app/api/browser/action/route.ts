import { NextResponse } from "next/server";
import { runAgentBrowser, argsFor, DEFAULT_SESSION, cliInstallHint } from "@/lib/agentBrowser";

/**
 * POST /api/browser/action — run a structured action against the session via
 * the real agent-browser CLI. Body: { session?: string, action: { type, ... } }.
 *
 * Supported actions: back, forward, click (@ref), eval (js expression),
 * snapshot. Unknown actions are rejected with an honest 400 — never silently
 * "succeed".
 */

interface BrowserAction {
  type?: string;
  ref?: string;
  expression?: string;
}

function toArgs(action: BrowserAction): string[] | null {
  switch (action.type) {
    case "back":
      return ["back"];
    case "forward":
      return ["forward"];
    case "click":
      return action.ref ? ["click", String(action.ref)] : null;
    case "eval":
      return action.expression ? ["eval", String(action.expression)] : null;
    case "snapshot":
      return ["snapshot"];
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { session?: string; action?: BrowserAction } | null;
  const session = body?.session || DEFAULT_SESSION;
  const action = body?.action;

  if (!action?.type) {
    return NextResponse.json({ ok: false, hint: "action.type is required" }, { status: 400 });
  }

  const args = toArgs(action);
  if (!args) {
    return NextResponse.json(
      { ok: false, hint: `action "${action.type}" is not supported by the bridge (back/forward/click/eval/snapshot)` },
      { status: 400 },
    );
  }

  const r = await runAgentBrowser(argsFor(session, args));
  if (!r.ok) {
    return NextResponse.json({
      ok: false,
      stderr: r.stderr,
      hint: cliInstallHint(r.stderr) || r.stderr.slice(0, 400),
    });
  }
  return NextResponse.json({ ok: true, result: r.stdout.trim() || null });
}
