import { execFile } from "node:child_process";
import { promisify } from "node:util";

/**
 * Thin bridge to the real `agent-browser` CLI (v0.35+).
 *
 * The CLI is a global binary on the host; routes call it with a session name
 * so the console's browser panel and an operator's shell session never fight
 * over the same daemon. `--session` is a global flag and goes BEFORE the
 * subcommand (per `agent-browser --help`).
 */

const exec = promisify(execFile);

export const DEFAULT_SESSION = "ava007-console";

export interface CLIResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export function argsFor(session: string, rest: string[]): string[] {
  return ["--session", session, ...rest];
}

export async function runAgentBrowser(args: string[], timeoutMs = 20000): Promise<CLIResult> {
  try {
    const { stdout, stderr } = await exec("agent-browser", args, {
      timeout: timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
    });
    return { ok: true, stdout, stderr };
  } catch (err) {
    const e = err as { code?: number | string; stderr?: string; stdout?: string; message?: string };
    return {
      ok: false,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? "agent-browser CLI failed",
    };
  }
}

export function cliInstallHint(stderr: string): string | null {
  if (/ENOENT|not found|not installed/i.test(stderr)) {
    return "agent-browser CLI not installed on this host — npm install -g agent-browser && agent-browser install";
  }
  return null;
}
