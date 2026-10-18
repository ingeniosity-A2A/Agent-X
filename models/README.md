# Agent-X model assets

This directory is the system-of-record path for Agent-X-owned model assets and model references. Large model weights are runtime/download artifacts and must not be committed by default. Keep them under this repository's ignored `models/` path; keep the local package store separate at `.pnpm-store/` and any optional model download/cache data under `.model-store/`.

Do not redirect Agent-X model assets to Exoskeleton or a global store. Exoskeleton owns orchestration and its own independent pnpm store; Agent-X owns capability-specific models and model-store lifecycle.
