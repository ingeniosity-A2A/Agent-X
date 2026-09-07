import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const exec = promisify(execFile);

/**
 * FORGE-ORG engine bridge — /api/forge/* routes drive the vault engine
 * (scripts/forged_vault.py) exactly the way /api/render-stack drives
 * rocks_stack.py: real RocksDB control plane + real DuckDB intelligence,
 * JSON on stdout, JSON errors on failure. The engine enforces the Forged
 * File Standard (immutable F0/F1/F2, append-only F3, HF vendor boundary).
 */

export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024; // documented in the Standard

export async function repoRoot(): Promise<string> {
  const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

export async function forgeEngine(root: string, args: string[]): Promise<Record<string, unknown>> {
  const py = process.env.ROCKS_PY || "python3";
  const script = path.join(root, "scripts", "forged_vault.py");
  const { stdout } = await exec(py, [script, ...args], {
    cwd: root,
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout) as Record<string, unknown>;
}

/** Stage an incoming upload to a temp file so the engine reads exact bytes. */
export async function stageUpload(file: File): Promise<{ dir: string; filePath: string; name: string }> {
  const dir = await mkdtemp(path.join(tmpdir(), "forge-upload-"));
  const name = (file.name || "upload.bin").replace(/[/\\]/g, "_").slice(0, 200);
  const filePath = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buf);
  return { dir, filePath, name };
}

export async function cleanupStage(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export function errJson(message: string, status = 500) {
  return Response.json({ ok: false, error: message.slice(0, 300) }, { status });
}
