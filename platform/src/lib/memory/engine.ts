import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * memory-tdai engine bridge — /api/memory/* routes drive the Aetheris
 * file-system engine (scripts/memory_tdai.py) the same way /api/forge/*
 * drives forged_vault.py: JSON on stdout, NDJSON progress lines when
 * --progress-every is set (streamed to the explorer via SSE).
 *
 * The engine implements the Sovereign Ingestion protocol: zero-copy
 * sequential iterators -> L0_Trace / L1_Atoms / refs offload, with the
 * verified flat-RAM contract (Delta RSS ~ 0.00 MB, tracemalloc peak heap
 * sub-MB). Canonical specs: the Aetheris / Rev.ike spec corpus.
 */

export const DEFAULT_HOUSING = path.join("modules", "aetheris", "data");

export const MAX_TAKE = 200_000; // hard cap on records per stream request

export async function repoRoot(): Promise<string> {
  const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

export async function memoryEngine(root: string, args: string[], timeoutMs = 60_000): Promise<Record<string, unknown>> {
  const py = process.env.MEMORY_PY || "python3";
  const script = path.join(root, "scripts", "memory_tdai.py");
  const { stdout } = await exec(py, [script, ...args], {
    cwd: root,
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout) as Record<string, unknown>;
}

/**
 * Spawn the engine in NDJSON progress mode. Returns the child so the SSE
 * route can forward each stdout line as it arrives (live Rev.ike telemetry:
 * records, throughput, bytes — inside the 100ms perceptual fusion constant).
 */
export function spawnMemoryEngine(root: string, args: string[]) {
  const py = process.env.MEMORY_PY || "python3";
  const script = path.join(root, "scripts", "memory_tdai.py");
  return spawn(py, [script, ...args], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function errJson(message: string, status = 500) {
  return Response.json({ ok: false, error: message.slice(0, 300) }, { status });
}
