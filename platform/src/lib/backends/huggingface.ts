/**
 * Hugging Face Hub Substrate — adapter
 *
 * TypeScript adapter for the Agent-X platform, following the
 * Cybernetic-Ava007 doctrine (`Ava007_Permanent_Master_Skill_HuggingFace.md`,
 * "Intelligence Injection v3.0"). Agent-X is the capability adapter /
 * execution surface; the Hub intelligence authority remains with Ava007
 * (ARCHITECTURE-BOUNDARY.md).
 *
 * Auth model (doctrine §3.3 / TweenAtom [AUTH:HF_TOKEN]):
 *   HF_TOKEN — Hugging Face user access token (https://huggingface.co/settings/tokens)
 *
 * Surfaces wired here:
 *   - Identity:    GET https://huggingface.co/api/whoami-v2
 *   - Inference:   POST https://router.huggingface.co/v1/chat/completions
 *                  (Inference Providers — OpenAI-compatible router)
 */

export const HF_WHOAMI_URL = "https://huggingface.co/api/whoami-v2";
export const HF_ROUTER_CHAT_URL =
  "https://router.huggingface.co/v1/chat/completions";

export interface HFStatus {
  id: "huggingface";
  label: string;
  tier: "substrate";
  whoamiUrl: string;
  routerUrl: string;
  keyEnv: "HF_TOKEN";
  available: boolean;
  keyMask: string | null;
}

export interface HFWhoami {
  name: string;
  type: string | null;
  auth: { accessToken?: { role?: string; displayName?: string } } | null;
}

function token(): string {
  return process.env.HF_TOKEN?.trim() || "";
}

/**
 * The Hugging Face adapter. Server-only — never import from client
 * components: the token must not cross the A2A boundary.
 */
export class HuggingFaceBackend {
  isAvailable(): boolean {
    return token().length > 0;
  }

  /**
   * Doctrine reflex: `hf auth whoami` — validates the token against the
   * Hub and returns the authenticated identity.
   */
  async whoami(): Promise<HFWhoami> {
    if (!this.isAvailable()) {
      throw new Error(
        "HF_TOKEN not set — get one at https://huggingface.co/settings/tokens"
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const resp = await fetch(HF_WHOAMI_URL, {
        headers: { Authorization: `Bearer ${token()}` },
        signal: controller.signal,
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`HF whoami error ${resp.status}: ${body}`);
      }
      const data = (await resp.json()) as {
        name?: string;
        type?: string;
        auth?: HFWhoami["auth"];
      };
      return {
        name: data.name ?? "unknown",
        type: data.type ?? null,
        auth: data.auth ?? null,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Inference Providers router — OpenAI-compatible chat completions.
   * `model` is a router id, e.g. "meta-llama/Llama-3.3-70B-Instruct".
   */
  async routerChat(
    model: string,
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    maxTokens: number
  ): Promise<{ text: string }> {
    if (!this.isAvailable()) {
      throw new Error("HF_TOKEN not set — inference router unavailable");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const resp = await fetch(HF_ROUTER_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`HF router error ${resp.status}: ${body}`);
      }
      const data = (await resp.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return { text: data.choices?.[0]?.message?.content ?? "" };
    } finally {
      clearTimeout(timer);
    }
  }

  keyMask(): string | null {
    const t = token();
    if (t.length === 0) return null;
    return `\u2022\u2022\u2022\u2022${t.slice(-4)}`;
  }

  status(): HFStatus {
    return {
      id: "huggingface",
      label: "Hugging Face Hub Substrate",
      tier: "substrate",
      whoamiUrl: HF_WHOAMI_URL,
      routerUrl: HF_ROUTER_CHAT_URL,
      keyEnv: "HF_TOKEN",
      available: this.isAvailable(),
      keyMask: this.keyMask(),
    };
  }
}
