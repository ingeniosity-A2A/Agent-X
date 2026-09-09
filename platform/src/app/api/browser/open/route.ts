import { NextResponse } from "next/server";
import { runAgentBrowser, argsFor, DEFAULT_SESSION, cliInstallHint } from "@/lib/agentBrowser";

/**
 * POST /api/browser/open — navigate the session's browser via the real
 * agent-browser CLI. Body: { session?: string, url: string }.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { session?: string; url?: string } | null;
  const session = body?.session || DEFAULT_SESSION;
  const url = body?.url;

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, hint: "url must be an http(s) URL" }, { status: 400 });
  }

  const r = await runAgentBrowser(argsFor(session, ["open", url]));
  if (!r.ok) {
    return NextResponse.json({
      ok: false,
      stderr: r.stderr,
      hint: cliInstallHint(r.stderr) || r.stderr.slice(0, 400),
    });
  }
  return NextResponse.json({ ok: true });
}
