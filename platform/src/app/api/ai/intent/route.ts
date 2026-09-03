import { NextResponse } from "next/server";
import { runAgentBrowser, argsFor, DEFAULT_SESSION } from "@/lib/agentBrowser";

/**
 * POST /api/ai/intent — real intent dispatch for the console AI surfaces
 * (BottomAIBar + UniversalFeatureStack both POST here).
 *
 * Primary engine: the z-ai-web-dev-sdk chat completions (server-side only).
 * When `current_surface` is "browser", the route first pulls the REAL live
 * a11y snapshot from the operator's agent-browser session and hands it to the
 * model as grounding context, so "summarize this page" summarizes the page
 * that is actually open — not a hallucinated one.
 *
 * Fallback engine (SDK unreachable — no network/credentials): a deterministic
 * local parser that does REAL work on the same real snapshot (element counts,
 * link extraction, verbatim snapshot read). It never invents content; when a
 * request genuinely needs a model (e.g. a refactor plan) it says so instead
 * of faking one.
 */

const SNAPSHOT_CAP = 6000; // chars of live a11y tree handed to the model
const LLM_TIMEOUT_MS = 30_000;

type Engine = "llm" | "local";

interface IntentBody {
  text?: string;
  current_surface?: string;
  feature?: string;
}

function classify(text: string): string {
  const t = text.toLowerCase();
  if (/summar|what.*(page|site)|tl;?dr/.test(t)) return "summarize-page";
  if (/(extract|list|find).*(link|url)|links\b/.test(t)) return "extract-links";
  if (/snapshot|a11y|accessibility|read.*(page|tree)/.test(t)) return "read-snapshot";
  if (/refactor|plan|restructur|split.*(code|chunk)/.test(t)) return "refactor-plan";
  return "freeform";
}

async function liveSnapshot(): Promise<{ raw: string; error?: string }> {
  const r = await runAgentBrowser(argsFor(DEFAULT_SESSION, ["snapshot"]));
  if (!r.ok || !r.stdout.trim()) {
    return { raw: "", error: r.stderr ? r.stderr.slice(0, 200) : "empty snapshot" };
  }
  return { raw: r.stdout.slice(0, SNAPSHOT_CAP) };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms)),
  ]);
}

async function llmReply(text: string, surface: string, snapshot: string | null): Promise<string> {
  const { default: ZAI } = await import("z-ai-web-dev-sdk");
  const zai = await ZAI.create();

  const grounding =
    snapshot
      ? `\n\nLIVE PAGE CONTEXT (a11y snapshot of the page currently open in the operator's agent-browser session "${DEFAULT_SESSION}", truncated):\n${snapshot}`
      : `\n\n(The ${surface} surface has no live snapshot available right now — do not invent page content.)`;

  const system =
    `You are Ava, the operator console intelligence embedded in the AVA007 Cybernetic Console. ` +
    `Answer the operator's request about the current surface ("${surface}"). Be concrete and technical; ` +
    `keep replies under 4 sentences unless a plan is explicitly requested. Use only the live page context ` +
    `provided — never fabricate page content, URLs or links that are not in it.` +
    grounding;

  const completion = await withTimeout(
    zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: text },
      ],
      thinking: { type: "disabled" },
    }),
    LLM_TIMEOUT_MS,
  );

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("empty LLM response");
  return reply;
}

/** Deterministic local engine — real parsing of the real snapshot, no invention. */
function localReply(text: string, intent: string, snapshot: string, snapshotError?: string): string {
  const lines = snapshot ? snapshot.split("\n").filter((l) => l.trim()) : [];

  if (intent === "summarize-page") {
    if (!lines.length) {
      return `Local engine (LLM unreachable): no live snapshot to summarize${snapshotError ? ` — ${snapshotError}` : ""}. Open a page in the Browser panel and retry.`;
    }
    const roles = new Map<string, number>();
    for (const l of lines) {
      const m = l.match(/\[([^\]]+)\]/);
      if (m) roles.set(m[1], (roles.get(m[1]) ?? 0) + 1);
    }
    const top = [...roles.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return `Local engine (LLM unreachable) — real snapshot stats: ${lines.length} a11y elements. Top roles: ${top
      .map(([r, n]) => `${r} (${n})`)
      .join(", ")}. Connect the SDK credentials for a prose summary.`;
  }

  if (intent === "extract-links") {
    if (!lines.length) {
      return `Local engine (LLM unreachable): no live snapshot to extract links from${snapshotError ? ` — ${snapshotError}` : ""}.`;
    }
    const links = lines
      .filter((l) => /\blink\b/i.test(l))
      .map((l) => (l.match(/"([^"]+)"/) ?? [])[1])
      .filter((n): n is string => !!n);
    const unique = [...new Set(links)];
    return unique.length
      ? `Local engine (LLM unreachable) — ${unique.length} link${unique.length === 1 ? "" : "s"} found in the live snapshot:\n${unique
          .slice(0, 20)
          .map((n) => `· ${n}`)
          .join("\n")}${unique.length > 20 ? `\n…and ${unique.length - 20} more` : ""}`
      : "Local engine (LLM unreachable): the live snapshot contains no link elements.";
  }

  if (intent === "read-snapshot") {
    if (!lines.length) {
      return `Local engine (LLM unreachable): no snapshot available${snapshotError ? ` — ${snapshotError}` : ""}.`;
    }
    return `Local engine (LLM unreachable) — live snapshot, first ${Math.min(lines.length, 30)} of ${lines.length} lines:\n${lines
      .slice(0, 30)
      .join("\n")}`;
  }

  // refactor-plan / freeform genuinely need the model.
  return `Intent "${intent}" received (${JSON.stringify(text.slice(0, 120))}). The local engine can only parse the live snapshot — this request needs the LLM, which is unreachable right now (${snapshotError ?? "SDK unavailable"}). Nothing was faked.`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as IntentBody | null;

  if (!body?.text || !body.text.trim()) {
    return NextResponse.json({ ok: false, hint: "text is required" }, { status: 400 });
  }

  const text = body.text.trim();
  const surface = body.current_surface ?? "unknown";
  const intent = body.feature ?? classify(text);

  // Real page grounding: the actual live session snapshot, best-effort.
  const { raw, error } = surface === "browser" ? await liveSnapshot() : { raw: "", error: undefined };

  try {
    const reply = await llmReply(text, surface, raw || null);
    return NextResponse.json({ ok: true, intent, engine: "llm", reply });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "SDK unavailable";
    return NextResponse.json({
      ok: true,
      intent,
      engine: "local" as Engine,
      reply: localReply(text, intent, raw, error ?? reason),
    });
  }
}
