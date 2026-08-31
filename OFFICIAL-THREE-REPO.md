# Official three-repo architecture

**Only these three are active product repos:**

| Repo | Role |
|------|------|
| **Cybernetic-Ava007** | Sovereign Intellect (Core-Q²) — reason, learn, voice, manifesto gate, embedded memory *interface* |
| **a2a-exoskeleton** | Runtime substrate — Arrow/zero-copy, DuckDB tiers, timeline, firmware registry, device bindings |
| **Agent-X** | Capability + consoles — ESA / Help Assembly, skills-as-firmware, Headless Reflex Arc, Agent Browser surface |

**Archive / misfit sink:** [QAG-MemBrain](https://github.com/ingeniosity-A2A/QAG-MemBrain)  
**Source-only (not official):** Ava007 monorepo, Core-Membrain, ava007-bridge, personal-agent, bento-file-runner, gitbook-ingest

## Agent-X KEEP

- `esa-exoskeleton/` — Help + ESA sandboxed consoles
- `platform/` — Next consoles, shell cards, API routes for ops
- `skills/` — onomondo-ncs, agent-browser, firmware skills
- `AGENTS.md`, `docs/` (capability, UI v6, agent-browser viewport)
- S26 edge scripts: `s26_diagnostic.sh`, `setup_termux.sh`, `bootstrap_nonroot.sh`
- `verify.sh`, deploy needed for this surface only

## Agent-X REMOVE → QAG-MemBrain (`archive/from-agent-x/`)

| Path | Why |
|------|-----|
| `Modelfile.destiny` | Destiny experiment — not Exoskeleton capability |
| `destiny_build/` | Same |
| `merge_destiny.sh` | Same |
| `s25_proot_diagnostic.sh` | **S25 obsolete** — body is S26 Ultra only |
| `imports/` | Staging junk if not referenced by ESA/Help |
| Any Ava *identity* / intellect UI | Belongs in Cybernetic-Ava007 only |

## Agent-X MISSING (fill next)

- [ ] Skill firmware registry JSON (schema + mounted skills list)
- [ ] Wire `v6-exoskel-polish.css` into Help + ESA `index.html`
- [ ] `DevExoskelCard` + full shell card registry on live console routes
- [ ] Headless Reflex Arc package under `skills/` (gated shell)
- [ ] Agent Browser launch profile (viewport 1920×1080) in docs + script
- [ ] Delete/move REMOVE list above into QAG after copy confirmed
