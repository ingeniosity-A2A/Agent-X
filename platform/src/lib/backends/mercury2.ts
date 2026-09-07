/**
 * Mercury2 Backend — Cortex tier (diffusion LLM)
 *
 * TypeScript adapter for the Agent-X platform, ported from the
 * Cybernetic-Ava007 constellation contract
 * (`packages/constellation/src/backends/mercury2.rs` — white paper §3, L6
 * Cortex tier). Agent-X is the capability adapter / execution surface;
 * cognition authority remains with Ava007 (ARCHITECTURE-BOUNDARY.md).
 *
 * Mercury 2 is a diffusion-based LLM from Inception Labs. Unlike
 * autoregressive models, it generates the complete output as a block
 * over parallel diffusion passes — flat latency regardless of length.
 *
 * Constraint: context must be COMPLETE before the call. No mid-call
 * steering. Output arrives as a block, not a token stream.
 *
 * # Configuration (env vars, matching the constellation .env)
 *   MERCURY2_ENDPOINT — https://api.inceptionlabs.ai/v1/chat/completions
 *   MERCURY2_API_KEY  — sk-... (from dashboard.inceptionlabs.ai)
 *   MERCURY2_MODEL    — mercury-coder-small (default)
 */

export const MERCURY2_DEFAULT_ENDPOINT =
  "https://api.inceptionlabs.ai/v1/chat/completions";
export const MERCURY2_DEFAULT_MODEL = "mercury-coder-small";

export interface Mercury2Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Mercury2Choice {
  message: Mercury2Message;
  finish_reason: string;
}

interface Mercury2Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

interface Mercury2Response {
  id: string;
  choices: Mercury2Choice[];
  usage: Mercury2Usage;
}

export interface Mercury2Status {
  id: "mercury2";
  label: string;
  tier: "cortex";
  endpoint: string;
  model: string;
  keyEnv: "MERCURY2_API_KEY";
  available: boolean;
  keyMask: string | null;
}

export function mercury2Config() {
  return {
    endpoint:
      process.env.MERCURY2_ENDPOINT?.trim() || MERCURY2_DEFAULT_ENDPOINT,
    apiKey: process.env.MERCURY2_API_KEY?.trim() || "",
    model: process.env.MERCURY2_MODEL?.trim() || MERCURY2_DEFAULT_MODEL,
  };
}

/**
 * The Mercury2 backend client. Server-only — never import from client
 * components: the API key must not cross the A2A boundary.
 */
export class Mercury2Backend {
  private endpoint: string;
  private apiKey: string;
  private model: string;

  constructor() {
    const cfg = mercury2Config();
    this.endpoint = cfg.endpoint;
    this.apiKey = cfg.apiKey;
    this.model = cfg.model;
  }

  /**
   * Generate a response using Mercury2 diffusion.
   *
   * The prompt must be COMPLETE — Mercury 2 refines in parallel passes
   * and cannot be steered mid-call. Output arrives as a block.
   */
  async generate(
    messages: Mercury2Message[],
    maxTokens: number,
    temperature = 0.7
  ): Promise<{ text: string; usage: Mercury2Usage }> {
    if (!this.isAvailable()) {
      throw new Error(
        "MERCURY2_API_KEY not set — get one at https://dashboard.inceptionlabs.ai/"
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000); // diffusion can be slow
    try {
      const resp = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Mercury2 API error ${resp.status}: ${body}`);
      }

      const body = (await resp.json()) as Mercury2Response;
      const text = body.choices[0]?.message.content ?? "";
      return { text, usage: body.usage };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Check if the backend is available (API key configured). */
  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  /** Masked key tail for UI display — the secret never leaves the server. */
  keyMask(): string | null {
    if (!this.isAvailable()) return null;
    const tail = this.apiKey.slice(-4);
    return `\u2022\u2022\u2022\u2022${tail}`;
  }

  /** Safe metadata for the environment-variables panel. */
  status(): Mercury2Status {
    return {
      id: "mercury2",
      label: "Mercury 2 — Inception Labs (diffusion)",
      tier: "cortex",
      endpoint: this.endpoint,
      model: this.model,
      keyEnv: "MERCURY2_API_KEY",
      available: this.isAvailable(),
      keyMask: this.keyMask(),
    };
  }
}
