# HelpAssembly Platform Scaffold

This directory is a workspace scaffold for a runtime-surface oriented architecture.

## Layout

- apps/public-ds: Public Docking Station surfaces for www and booking ingress.
- apps/ops-ds: Operations Docking Station Runtime.
- apps/booking-surface: Dedicated booking runtime surface.
- apps/marketing-root: Landing and campaign surfaces.
- workers/edge-router: Hostname and route orchestration at the edge.
- workers/api-worker: Deterministic API execution runtime.
- workers/ai-worker: AVA007 orchestration runtime.
- workers/ops-worker: Dispatch and operational runtime endpoints.
- workers/realtime-worker: Realtime and socket orchestration.
- packages/ui-system: Docking shell primitives, cards, motion, and style system.
- packages/a2ui: Render contracts and interface runtime state models.
- packages/quote-engine: Quoting and pricing execution modules.
- packages/revike: DID/session continuity and identity utilities.
- packages/beeper-core: Dispatch and scheduling core.
- packages/ingenosity-lens: Vision pipeline and extraction runtime.
- packages/shared: Shared schemas, utilities, and types.
- infrastructure: Wrangler configs, database infra, and monitoring setup.
- docs: Platform and runbook documentation.
- scripts: Automation and operational scripts.
