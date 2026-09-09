import { NextResponse } from "next/server";
import { runAgentBrowser, argsFor, DEFAULT_SESSION, cliInstallHint } from "@/lib/agentBrowser";

/**
 * GET /api/browser/snapshot?session=… — accessibility-tree snapshot from the
 * real agent-browser CLI. Returns { ok, raw } where raw is the CLI's text
 * output ([role] "name" @eN lines), which BrowserPanel.parseRefs consumes.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const session = url.searchParams.get("session") || DEFAULT_SESSION;

  const r = await runAgentBrowser(argsFor(session, ["snapshot"]));
  if (!r.ok) {
    return NextResponse.json({
      ok: false,
      raw: "",
      stderr: r.stderr,
      hint: cliInstallHint(r.stderr) || r.stderr.slice(0, 400),
    });
  }
  return NextResponse.json({ ok: true, raw: r.stdout });
}
