import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { runAgentBrowser, argsFor, DEFAULT_SESSION, cliInstallHint } from "@/lib/agentBrowser";

/**
 * GET /api/browser/screenshot?session=…&t=<cache-buster> — capture a PNG via
 * the real agent-browser CLI and stream it back. The BrowserPanel <img> uses
 * the `t` param purely as a cache buster.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const session = url.searchParams.get("session") || DEFAULT_SESSION;
  const tmpPath = join(tmpdir(), `ava007-console-${session}-${Date.now()}.png`);

  const r = await runAgentBrowser(argsFor(session, ["screenshot", tmpPath]), 30000);
  if (!r.ok) {
    return NextResponse.json(
      {
        ok: false,
        stderr: r.stderr,
        hint: cliInstallHint(r.stderr) || r.stderr.slice(0, 400),
      },
      { status: 502 },
    );
  }

  try {
    const png = await readFile(tmpPath);
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, hint: "CLI reported success but no screenshot file was written" },
      { status: 502 },
    );
  } finally {
    void unlink(tmpPath).catch(() => {});
  }
}
