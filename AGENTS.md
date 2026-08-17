# AGENTS.md — Agent-X (exo.help_assembly surface)

## Identity
- Cybernetic Ava007 = sole Intellect (Core-Q²). Lives in Ava007 repo.
- Agent-X = Help Assembly Exoskeleton execution surface + experimental sandbox. NOT a peer Intellect.
- Edge device: Galaxy S26 Ultra only (never target S25).

## SDK & Runtime Location
The primary SDK implementations live in two places — NOT in this project's Agent-X/ reference folder:

1. **Termux on-device** (Galaxy S26 Ultra): `tekton-sdk/`, `quantum-membrain/`, `ava007-runtime/`, `onomondo-softsim-cli/` contain real compiled/runtime code. These are the live execution environments.

2. **Agent-X GitHub repo**: https://github.com/ingeniosity-A2A/Agent-X — the canonical source for execution surfaces, quantum modules, appless protocols, and A2A mesh routing.

The `Agent-X/` folder in this project (gitbook-ingest) is a **reference/documentation snapshot**. It contains:
- `src/quantum/` — Python implementations of TashiDAG, InteractionQuantum, TweenAtom, GSAP, RF physical, crypto routing, UWB ranging, VFile, SMS bridge, Beeper bridge
- `src/appless/` — VCF/vCard generator, appless server
- `src/config.py` — A2A agent DIDs (`did:helpassembly:*`), tool definitions (`a2a_send`, `a2a_request`), pattern triggers
- `src/patterns.py` — Help Assembly business patterns (review requests, job completion, inventory)
- `src/ui/dashboard.py` — Real-time dashboard with UWB ranging, TashiDAG vertices, system telemetry
- `src/modules/` — Rust modules (crawlers, ingenuity_lens)
- `src/main/java/` — Android accessibility service

**Top-level directories in this project are empty placeholders**: `tekton-sdk/`, `quantum-membrain/`, `ava007-runtime/`, `onomondo-softsim-cli/`, `agent-x/` — real code is on-device (Termux) and in the Agent-X repo.

## Verified Implementation Domains
| Domain | Status | Key Artifacts |
|--------|--------|---------------|
| App-less Protocols | ✅ Implemented | vCard generator, `did:helpassembly:*` (8 DIDs), `a2a_send`/`a2a_request` patterns, review request flow |
| Quantum Atomic & Tashi | ✅ Implemented | `TashiDAG` class, `InteractionQuantum`, `TweenAtom`, GSAP timeline, `rf_physical`, `crypto_routing`, `zero_latency_harness` |
| A2A Mesh Routing | ✅ Implemented | `wss://a2a.ava.network/beeper`, delegation chains (`did:ava:parent`), VFile transport |
| UWB/NFC | ✅ Implemented | `uwb_ranging.py`, dashboard real-time display (±10cm), Channel 9 (7.987 GHz) |
| eSIM / WebRTC / Captive Portal | 📋 Designed | Specified in architecture PDFs; implementation in Termux SDK repos |

## Ownership
Agent-X owns: platform/ (Help Assembly UI/services), src/ (execution, patterns, jobs, quotes), examples/agent-card.json (A2A VCard), docs/exoskeleton/ (pointers only), data/ (Help Assembly product data), imports/ (staged experimental).
Agent-X does NOT own: Core-Q² weights, canonical architecture docs, memory implementation, Core-Membrain trees.

## Repo links
- Architecture SoR: https://github.com/ingeniosity-A2A/Ava007/tree/main/docs/exoskeleton
- Memory membrane: https://github.com/ingeniosity-A2A/Core-Membrain
- Agent-X repo: https://github.com/ingeniosity-A2A/Agent-X

## Rules
- Gate Help Assembly APIs on active profile `exo.help_assembly`.
- Experimental code stays sandboxed until promoted to stable capability registry.
- A2A VCard = gateway card, not a second Ava.
- Do not re-home Core-Membrain trees here.
- Never introduce S25 targets. Edge = S26 Ultra.
- Prefer INJECT over BUILD. Do not invent a second Core-Q².

## Forbidden language
- "multi-agent swarm", "sub-AGI", "second brain" for Agent-X
- "Ava runs here" — Ava runs in Ava007
- "peer Intellect" — there is only one Intellect
- No military/combative/adversary terminology (enemy, combat, weapon, attack, defend, battle, war, soldier)

## When editing
- Tree: platform/ (Help Assembly), src/ (execution), examples/agent-card.json, docs/exoskeleton/ (pointers only).
- Do not duplicate Core-Membrain memory trees.
- Nested AGENTS.md may scope per package. Deeper files win on conflict.

## ESA / Exoskeleton UI surface
- ESA Inventory (`esa_inventory`) is an Exoskeleton Framework capability, not a general product dashboard.
- Operator configuration lives under **ESA Exoskeleton**: `platform/src/app/consoles/esa-maintenance` → Select Card.
- Help Assembly console: `/consoles/help-assembly`.
- Ava007 Dashboard is the sole Dashboard (Ava007 repo) — never re-home it on Agent-X.
- Inventory is mandatory when no parts DB exists.
- Service requests → Daily To-Dos via `/api/service-request`.
- AgentMail: ava007@agentmail.to → manager (ESA_MANAGER_EMAIL).
