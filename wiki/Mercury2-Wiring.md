# Mercury 2 Wiring

**Status:** wired + verified live · **Date:** 2026-09-09 · **Tier:** Cortex

## What was wired

Mercury 2 (Inception Labs, diffusion + reasoning LLM) is the Cortex-tier
inference backend. The client code existed since `41a286e`; the credential and
the env contract were not connected, and the TS default model was stale.

| Piece | Location |
|-------|----------|
| TS client (server-only) | `platform/src/lib/backends/mercury2.ts` |
| Registry + probe | `platform/src/lib/backends/registry.ts` |
| API route (status/probe) | `platform/src/app/api/ai/backends/route.ts` |
| Env panel (masked keys) | `platform/src/app/agent-browser/interface/environment-variables/` |
| Python engine | `src/mercury_engine.py` (`Mercury2Engine`) |
| Python config | `src/config.py` |
| Tracked contract | `platform/.env.example` + `.env.example` (ONE name set) |
| Local secrets | `platform/.env.local` + `.env` (gitignored — fill per session) |

## Env contract (single name set across Python + TypeScript)

```
MERCURY2_API_KEY=sk_...        # from dashboard.inceptionlabs.ai
MERCURY2_ENDPOINT=https://api.inceptionlabs.ai/v1/chat/completions
MERCURY2_MODEL=mercury-2
```

## Verification evidence (2026-09-09)

1. **Model access policy (probe):** `mercury-coder-small` → HTTP error
   `model_access_denied` — *"only available to accounts created before
   February 24, 2026. Please use Mercury 2 or Mercury Edit models instead."*
   The old TS default was therefore broken for this account. Fixed to
   `mercury-2`; do not revert without re-probing.
2. **Python end-to-end:** `Mercury2Engine` → completion in **2269 ms**,
   10 in / 486 out tokens, cost **$0.000367**, budget tracker decrementing
   (9,992,775 → 9,992,279). Cache at `cache/mercury2/response_cache.json`.
3. **Semantics:** context must be COMPLETE before the call — no mid-call
   steering; output arrives as a block, not a token stream. `mercury-2` is a
   reasoning model: give `max_tokens` headroom (reasoning tokens count against
   the cap before content is emitted). Probe uses 256; `run_test()` uses 512.

## Rules

- The API key never crosses the A2A boundary — `Mercury2Backend` is
  server-only; the env panel shows masked keys (`••••tail`) only.
- Cognition authority remains with Cybernetic-Ava007; Agent-X is the
  capability adapter / execution surface (ARCHITECTURE-BOUNDARY).
- Register entry: see [[Naming Register]] §1 — all `MERCURY_*` aliases retired.

## Why the environment "keeps dropping" the APIs — and the recovery drill

Observed 2026-09-09: sandbox resets wipe (a) untracked secret files and
(b) pip packages — both look like "the API disappeared".

| What gets dropped | Durable answer | Recovery |
|-------------------|----------------|----------|
| `.env` / `platform/.env.local` (secrets) | tracked `.env.example` + `.env.example` carry the FULL contract (names + endpoints + model) | re-fill the two secret files from the examples; keys are never in git by design |
| pip packages (`rocksdict`, `duckdb` — forge engine deps) | this page + Naming Register §9 | `python3 -m pip install --break-system-packages rocksdict duckdb` (interpreter = `/home/z/.venv/bin/python3`) |
| probe after any reset | — | config check (model/endpoint/key SET) + 64-token probe through `Mercury2Engine`; 2026-09-09 post-reset probe: **782 ms, reply `WIRED`, 16/54 tokens** |

**Post-reset verification 2026-09-09:** env contract intact in both secret
files, probe green after package restore. Mercury 2 wiring survives the
environment; the drill above is the full restore path.
