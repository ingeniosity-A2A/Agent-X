# Agent-X Wiki — Home

This wiki is the naming and wiring authority for the Agent-X capability repo
(one of the three official repos — see `OFFICIAL-THREE-REPO.md`).

Pages:

| Page | What it governs |
|------|-----------------|
| **[[Naming Register]]** | ONE canonical name per concept; every retired alias with file-level evidence and disposition |
| **[[Mercury 2 Wiring]]** | The Cortex-tier backend: env contract, verification evidence, model access policy |
| **[[Aetheris Trial]]** | Validation record for the kept trial system — candidate to become the next FORGED |

## Ground rules

1. **One concept, one name.** When a second name appears for the same concept,
   the Naming Register must record it as an alias with a disposition
   (`fixed`, `pending`, `archived`, `trial`) — never left drifting.
2. **Renames rewrite documents.** Renaming without editing, removing, or
   quarantining the documents is a recipe for disaster: a harness→exoskeleton
   change is a complete redesign, so documents are **rewritten for the new
   framework or removed** — never relabeled. Every rename in the register
   carries its doc dispositions.
3. **ESA = Extended Stay America.** The client. The ESA brand appears ONLY on
   the cards that perform their service (maintenance work, supply ordering,
   maintenance inventory) and surfaces whose sole content is those cards.
   Never on shells, consoles, sandboxes, frameworks, or folders.
4. **The file system is ForgedxFolders.** "Forged File Vault" / "AVA007 Vault"
   / every "vault" alias is retired (entered unsanctioned at `762d626`).
5. **Aetheris is kept on trial.** Its pipeline is the candidate to become the
   next FORGED (Standard §11); it must stay validated — evidence lives in
   [[Aetheris Trial]].
6. **"We don't do harnesses. We apply Exoskeleton."** (locked 2026-09)
   The forge stage is **Exoskeleton Application**; the verdict pill is
   **EXOSKELETON APPLIED** (F2 forge UI only); replay evidence is
   **Exoskeleton replay verification**. The query router is `CapabilityRouter`
   — renamed to its function, NOT to Exoskeleton (that would claim a redesign
   that never happened).
7. **Env contracts are single-named.** One name set per backend across Python
   and TypeScript: `MERCURY2_API_KEY` / `MERCURY2_ENDPOINT` / `MERCURY2_MODEL`.
8. **Secrets never enter git.** `.env` / `.env.local` are gitignored; the tracked
   `.env.example` files are the durable contract.

## Mirroring to GitHub

GitHub only creates the wiki git endpoint after the first page is saved in the
browser UI. Once initialized:

```bash
git clone https://github.com/ingeniosity-A2A/Agent-X.wiki.git
cp agent-x/wiki/*.md Agent-X.wiki/
cd Agent-X.wiki && git add . && git commit -m "wiki: naming register v2 + Mercury 2 wiring + Aetheris trial record" && git push
```
