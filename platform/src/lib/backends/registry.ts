/**
 * Backend registry — Agent-X capability adapters for model backends.
 *
 * Mirrors the Cybernetic-Ava007 constellation registry
 * (`packages/constellation/src/registry.rs`): every backend reports its
 * configuration and availability; nothing here performs cognition.
 *
 * Secrets stay server-side. The API route exposes masked keys only.
 */

import { Mercury2Backend, type Mercury2Status } from "./mercury2";
import { HuggingFaceBackend, type HFStatus } from "./huggingface";

export type BackendStatus = Mercury2Status | HFStatus;

export const ENV_VAR_DOCS: Record<string, { required: boolean; note: string }> =
  {
    HF_TOKEN: {
      required: true,
      note: "Hugging Face access token — https://huggingface.co/settings/tokens",
    },
    MERCURY2_API_KEY: {
      required: true,
      note: "Inception Labs key — https://dashboard.inceptionlabs.ai/",
    },
    MERCURY2_ENDPOINT: {
      required: false,
      note: "Override the default Inception Labs chat/completions endpoint",
    },
    MERCURY2_MODEL: {
      required: false,
      note: "Override the default model (mercury-2 — verified for post-Feb-2026 accounts)",
    },
  };

export function listBackendStatuses(): BackendStatus[] {
  return [new HuggingFaceBackend().status(), new Mercury2Backend().status()];
}

export async function probeBackend(
  id: string
): Promise<Record<string, unknown>> {
  if (id === "huggingface") {
    const hf = new HuggingFaceBackend();
    if (!hf.isAvailable()) {
      return { ok: false, backend: id, error: "HF_TOKEN not set" };
    }
    try {
      const who = await hf.whoami();
      return {
        ok: true,
        backend: id,
        identity: who.name,
        role: who.auth?.accessToken?.role ?? null,
      };
    } catch (err) {
      return {
        ok: false,
        backend: id,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  if (id === "mercury2") {
    const m2 = new Mercury2Backend();
    if (!m2.isAvailable()) {
      return { ok: false, backend: id, error: "MERCURY2_API_KEY not set" };
    }
    try {
      // Minimal block-generation probe — mercury-2 reasons before answering,
      // so a tiny cap would return null content. 256 gives it headroom.
      const { usage } = await m2.generate(
        [{ role: "user", content: "Reply with the single word: ready." }],
        256
      );
      return { ok: true, backend: id, usage };
    } catch (err) {
      return {
        ok: false,
        backend: id,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { ok: false, backend: id, error: `Unknown backend: ${id}` };
}
