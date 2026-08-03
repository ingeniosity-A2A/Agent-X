# Agent X

**Role:** Experimental / evolvable execution surface (Exoskeleton capability)  
**Not:** Cybernetic Ava007, Core-Q², or a peer Intellect

Agent X runs sandboxed experiments, latent skill work, and provisional code paths.
Successful results promote through Core-Membrain into the stable capability registry.
Ava007 never lives inside the experiment.

## Exoskeleton rules

- Headless capability under the rotational Exoskeleton when attached
- Does **not** own device runtime, model routing, or persistent memory
- Untrusted code prefers WASM / isolated process (`wasm_sandbox` harness class)
- Mercury2 and other backends are **harnesses**, not Agent X’s identity

Canonical contract: [`docs/exoskeleton/Agent-X-Capability.md`](docs/exoskeleton/Agent-X-Capability.md)

Related repos:
- [Ava007](https://github.com/ingeniosity-A2A/Ava007) — Intellect + architecture SoR
- [Core-Membrain](https://github.com/ingeniosity-A2A/Core-Membrain) — memory membrane

## Run (existing harness)

```bash
export MERCURY_API_KEY="your-key"
python3 -m src.harness
```

Platform app: see `platform/`.

## Layout

| Path | Role |
|------|------|
| `src/` | Harness, routers, patterns, mercury engine, API |
| `platform/` | Help Assembly Services UI / Next.js surface |
| `docs/exoskeleton/` | Capability identity and alignment |
| `imports/qag-skills-agent_x/` | Snapshot from QAG-MemBrain for reconciliation |
