# Agent-X organization map

**Role:** Capability + consoles only (one of three official repos).

```text
Agent-X/
├─ esa-exoskeleton/     # ESA + Help sandboxed consoles (static)
├─ platform/            # Next ops consoles + Bento UI upgrade
│   └─ src/components/bento/   # official cards (one framework)
├─ skills/              # skill-as-firmware (onomondo, agent-browser, …)
├─ docs/                # Bento, viewport, three-repo, polish
├─ AGENTS.md            # agent rules for this repo
├─ OFFICIAL-THREE-REPO.md
├─ s26_*.sh / termux    # S26 Ultra edge only
└─ verify / deploy      # this surface only
```

## Organization status

| Area | Status |
|------|--------|
| Role vs Cybernetic-Ava007 / a2a-exoskeleton | **Locked** |
| Consoles home (ESA / Help / platform) | **Organized** |
| UI = Bento upgrade (not second framework) | **Locked** in docs + partial port |
| Skills as firmware | **Folder present** |
| S25 / Destiny product UI | **Removed or marked archive** |
| `destiny_build/` data residue | **Still on tree** → QAG when ready |
| `imports/` | **Still on tree** → confirm then QAG |
| Full Bento library (theme, cardsA–D) | **Partial** — finish from `bento-board` |
| Skill registry JSON / Reflex Arc skill | **Still MISSING** |

## Done enough to move forward

Structure and ownership are complete. Remaining work is **fill**, not re-org:

1. Finish Bento files into `platform/src/components/bento/`
2. Move `destiny_build/` + dead `imports/` → QAG-MemBrain
3. Skill firmware registry + Headless Reflex Arc under `skills/`

Do **not** put intellect or substrate code here.
