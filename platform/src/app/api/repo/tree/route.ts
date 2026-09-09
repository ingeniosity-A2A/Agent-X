import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * GET /api/repo/tree — the REAL file surface for the console's IDE mode.
 *
 * Runs `git rev-parse --show-toplevel` from the platform working directory
 * (the Next dev server runs inside <repo>/platform) and lists tracked files
 * with `git ls-files`. Read-only; on a host where the checkout is absent
 * (standalone production bundle) it says so instead of serving a fake tree.
 */
export async function GET(req: Request) {
  new URL(req.url); // force dynamic handling — the tree can change between calls

  try {
    const { stdout: root } = await exec("git", ["rev-parse", "--show-toplevel"], {
      cwd: process.cwd(),
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    const repoRoot = root.trim();

    const { stdout } = await exec("git", ["ls-files"], {
      cwd: repoRoot,
      timeout: 15_000,
      maxBuffer: 8 * 1024 * 1024,
    });

    const files = stdout.split("\n").filter(Boolean).sort();
    return NextResponse.json({ ok: true, root: repoRoot, count: files.length, files });
  } catch (err) {
    const message = err instanceof Error ? err.message : "git failed";
    return NextResponse.json(
      {
        ok: false,
        hint:
          "No git checkout reachable from the platform working directory — IDE mode needs the repo on disk (run the platform from <repo>/platform).",
        error: message.slice(0, 300),
      },
      { status: 404 },
    );
  }
}
