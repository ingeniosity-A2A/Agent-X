import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

/**
 * Real allowlisted bash execution for the Agent Browser terminal surface
 * (Edit Mode → Terminal). Mirrors the repo's modules/bash-api/route.ts
 * semantics exactly: prefix allowlist, blocked-pattern list, 500-char cap,
 * 15s timeout, 100 KB max buffer, fixed cwd. Commands outside the allowlist
 * are refused with an honest 403 — no fabricated output.
 */

const execAsync = promisify(exec);

const ALLOWED_PREFIXES = [
  "ls", "pwd", "echo", "cat", "head", "tail", "wc", "date", "whoami", "uname",
  "git ", "npm ", "npx ", "node ", "bun ", "which", "env", "df", "free",
  "ps aux", "uptime", "curl ", "gh ",
];
const BLOCKED = ["rm -rf /", "sudo", "chmod 777", "> /dev/", "mkfs", "dd if=", ":(){ :|:& };:"];

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command required" }, { status: 400 });
    }
    const trimmed = command.trim();
    if (trimmed.length > 500) {
      return NextResponse.json(
        { error: "Command too long (max 500 chars)" },
        { status: 400 }
      );
    }
    if (BLOCKED.some((b) => trimmed.includes(b))) {
      return NextResponse.json({ error: "Command not permitted" }, { status: 403 });
    }
    const allowed = ALLOWED_PREFIXES.some((p) => trimmed.startsWith(p));
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Command not in allowlist. Prefix must be: " +
            ALLOWED_PREFIXES.filter((p) => !p.endsWith(" ")).join(", "),
        },
        { status: 403 }
      );
    }
    const { stdout, stderr } = await execAsync(trimmed, {
      timeout: 15000,
      cwd: "/home/z/my-project",
      maxBuffer: 1024 * 100,
    });
    return NextResponse.json({
      output: (stdout || stderr || "(no output)").trim().slice(0, 5000),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg.slice(0, 500) }, { status: 500 });
  }
}
