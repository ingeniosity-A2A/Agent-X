import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * GET /api/repo/file?path=… — real working-tree file content for IDE mode.
 *
 * Safety model (read-only): the requested path must be an exact tracked file
 * (`git ls-files -- <path>` returns exactly that path), must not contain
 * traversal segments, and the resolved absolute path must stay inside the
 * repo toplevel. Content is read from the working tree — what an IDE shows —
 * capped at 512 KB with an honest `truncated` flag.
 */

const MAX_BYTES = 512 * 1024;

async function repoRoot(): Promise<string> {
  const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";

  if (!rel || rel.startsWith("/") || rel.includes("\\") || rel.split("/").includes("..") || rel.includes("\0")) {
    return NextResponse.json({ ok: false, error: "invalid path" }, { status: 400 });
  }

  let root: string;
  try {
    root = await repoRoot();
  } catch {
    return NextResponse.json(
      { ok: false, error: "no git checkout reachable from the platform working directory" },
      { status: 404 },
    );
  }

  // Whitelist: only exact tracked files are readable.
  try {
    const { stdout } = await exec("git", ["ls-files", "--", rel], {
      cwd: root,
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    if (stdout.trim() !== rel) {
      return NextResponse.json({ ok: false, error: "path is not a tracked file" }, { status: 404 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "git ls-files failed";
    return NextResponse.json({ ok: false, error: message.slice(0, 300) }, { status: 500 });
  }

  const abs = path.resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return NextResponse.json({ ok: false, error: "path escapes the repository" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) {
      return NextResponse.json({ ok: false, error: "not a regular file" }, { status: 400 });
    }
    const fh = await fs.open(abs, "r");
    try {
      const len = Math.min(stat.size, MAX_BYTES);
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, 0);
      if (buf.subarray(0, Math.min(len, 8000)).includes(0)) {
        return NextResponse.json({ ok: false, error: "binary file — no text preview" }, { status: 415 });
      }
      return NextResponse.json({
        ok: true,
        path: rel,
        bytes: stat.size,
        truncated: stat.size > MAX_BYTES,
        content: buf.toString("utf8"),
      });
    } finally {
      await fh.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ ok: false, error: message.slice(0, 300) }, { status: 500 });
  }
}
