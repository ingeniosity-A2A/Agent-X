# Naming Register

**Status:** authoritative · **Founded:** 2026-09-09 · **Revised:** 2026-09-09 (v2, owner rulings applied) · **Rule:** one concept, one name.

**Ground rule #1 (owner doctrine):** renaming without editing, removing, or
quarantining the documents is a recipe for disaster. A harness→exoskeleton
change is a complete redesign — documents are **rewritten for the new
framework or removed**, never relabeled. Every entry below lists the canonical
name, every alias found, where it lived, and its disposition. Evidence is
file-level; line numbers refer to the 2026-09-09 audit.

---

## 1. ESA — Extended Stay America (the client) · brand = service cards ONLY

| | Ruling |
|---|---|
| **ESA means** | **Extended Stay America** — the client. Agent-X provides their service software: maintenance work, supply ordering, maintenance inventory. |
| **Brand rule** | The software renders **through Cards** — ESA may be branded **only on cards that perform their service** (and surfaces whose sole content is those cards). |
| **Never** | a shell, console, sandbox, framework, folder, or transport name. |

**Retired aliases — FIXED 2026-09-09:**

| Alias | Lived in | Disposition |
|-------|----------|-------------|
| `ESAExoskeleton` (shell component + file) | `platform/src/components/esa-modules/ESAExoskeleton.tsx` | → **`ServiceCardShell`** (`git mv` + CSS classes `esa-exoskeleton*` → `service-card-shell*`); decorative `EXOSKELETON APPLIED` bar pill REMOVED (that string is the F2 forge verdict pill, not UI chrome — wearing it claimed a forge verdict that never happened). Bar now reads "ESA Service Cards / EXTENDED STAY AMERICA". |
| `ESAExoskeletonSurface` (3d-rendering page component) | `interface/3d-rendering/esa/page.tsx:19` | → **`ESARenderingCards`**; sidebar copy "ESA Exoskeleton" → "Rendering Cards"; `← Exoskeleton` → `← Cards`; page heading → "ESA Rendering Cards · …". |
| "ESA Exoskeleton" (chrome strings) | `ESAWebUI.tsx:361,551`, `layout.esa.tsx:20,27`, `app/layout.tsx:17,19`, `app/page.tsx:34`, `api/email-snapshot/route.ts:24,57,94`, `lib/esa-email.ts:2`, both `.env.example` headers | → "ESA Service Cards" / "ESA (Extended Stay America) service"; `ESA Exoskeleton Applied` status chip → `ESA Service Active`. |
| `Exoskeleton` (nav tab label) | `page.esa.tsx:409` | label → **"Service Shell"** (state key `exoskeleton` kept for compat — registered, not drifted). |
| "ESA Exoskeleton" (ingestion branding) | `ESAInputInterface.tsx:102` | → "Ava007 · Ingestion Interface" (per ESA-MODULE-MAPPING: ingestion is the Ava007 layer, not an ESA card). Component rename registered as pending below. |
| "ESA Exoskeleton" (sandbox console prose) | `esa-exoskeleton/README.md` ×5, `esa-exoskeleton/SKILL.md` ×4 (living prose) | → "ESA service cards console" — the `/esa-console` sandbox renders the ESA service cards. Changelog history rows (3.6.0, 2.0.0) intentionally kept as release records. |

**Legitimately ESA (verified against the cards-only rule):** `ESAMaintenanceCard`,
`ESAJobTracker`, `ESARequestForm`, `MaintenanceRequestComplete`, `PartsCard`
(Parts + Inventory), `ServiceRequestCard`, `GreenShieldPanel`, `ESA.Ptac-B.js`,
`ESA.workorder.js`, `ESA.DiagnosticCard.js`, `ESA.MaintenanceChecklist.js`,
`ESA.Calendar.js`, `ESA.InvPartsCard-B.js`, `ESA_AVA_EMAIL` / `ESA_MANAGER_EMAIL`
(service-request flow), `esa-email.ts` transport, `/3d-rendering/esa` route
(exists solely to render the ESA cards).

**Disposition: fixed in platform surfaces; sandbox folder pending (deploy-bound).**

---

## 2. ForgedxFolders — the file system (retires every "vault" name)

| | Name |
|---|---|
| **Canonical** | **ForgedxFolders** (owner ruling 2026-09-09) |
| **Engine** | `scripts/forgedxfolders.py` (was `forged_vault.py`), class `ForgedXFolders`, `forgedxfolders.duckdb` |
| **UI** | `ForgedxFoldersExplorer.tsx` + `ForgedxFoldersTree.tsx` → `/agent-browser/interface/forge` |
| **Contract** | `skills/forge-org/FORGED-FILE-STANDARD.md` **v1.1.0** |

**Retired aliases — FIXED 2026-09-09 (origin: AI commit `762d626`, never owner-sanctioned):**

| Alias | Lived in | Disposition |
|-------|----------|-------------|
| `forged_vault.py` / `smoke_forged_vault.py` | `scripts/` | `git mv` → `forgedxfolders.py` / `smoke_forgedxfolders.py`; `class Vault` → `ForgedXFolders`; `vault.*` calls → `fx.*`; `vault.duckdb` → `forgedxfolders.duckdb`; spec string → `forged-file-standard/1.1.0` |
| `VaultExplorer` / `VaultTree` | `platform/src/components/forge/` | `git mv` → `ForgedxFoldersExplorer` / `ForgedxFoldersTree`; all UI strings ("AVA007 Vault", "AVA007 Forged File Vault", "Vault is empty", "reading vault…") → ForgedxFolders |
| "AVA007 VAULT" (diagram root) | `FORGED-FILE-STANDARD.md:15` | → **FORGEDXFOLDERS** (v1.1.0 rewrite) |
| `vault.*` (registry provides prefix) | `skills/registry.json` | → `forgedxfolders.{standard,f0-f3,rocksdb.skills,duckdb.intelligence,hf.vendor.boundary}` |
| vault references in API/bridge | `api/forge/{tree,stats,vendor}/route.ts`, `lib/forge/engine.ts`, `lib/memory/engine.ts`, `memory_tdai.py`, `skills/forge-org/SKILL.md`, `modules/forge-org/data/README.md` | rewritten |

**Verification:** `scripts/smoke_forgedxfolders.py` → **31 passed, 0 failed**
on the renamed chain (F0→F1→F2→F3 + RocksDB + DuckDB + artifact detector),
spec `forged-file-standard/1.1.0`.

**Disposition: fixed end-to-end.**

---

## 3. Aetheris — KEPT on trial · pipeline to become the next FORGED

| | Ruling |
|---|---|
| **Status** | **KEPT** (owner ruling 2026-09-09: "Keep Aetheris we are trying out this system") |
| **Position** | Its pipeline is **the candidate to become the next FORGED** — Forged File Standard §11. Not a competing file system; outputs enter F0 like any upload until validated. |
| **Origin (exposed)** | Name entered at AI commit `41a286e` ("feat(aetheris): memory-tdai file system…") without owner sanction — now sanctioned by the trial ruling. |
| **Paths** | unchanged: `modules/aetheris/`, `skills/aetheris/`, `interface/aetheris`, `components/aetheris`, engine `scripts/memory_tdai.py` + `rev_ike_*` |

**Doc corrections applied (rewrite, not relabel):** `skills/aetheris/SKILL.md`
retitled "Memory Timeline Pipeline (TRIAL)"; the false claim "Aetheris is the
lived-in file system" and the competing "Forged File Vault is the governance
pipeline" boundary REWRITTEN to the Standard §11 relationship; `fs.*` claim
marked pending next-FORGED promotion; L2 scenario seed corrected; registry
`status` → `trial`, `fs.memory-tdai` → `memory-tdai.tiers`.

**Validation evidence (2026-09-09):** see **[[Aetheris Trial]]** — flat-RAM
benchmark PASSED fail-closed (50k records, ΔRSS 0.0 MB, peak heap 0.45 MB,
3,905 rec/s), deterministic recall verified, all historical streams
`verified_flat_ram: true`.

**Disposition: kept on trial; docs rewritten; validation recorded.**

---

## 4. Forge stage — Exoskeleton Application (between Refactor/Normalize and F2)

| | Name |
|---|---|
| **Stage name** | `Exoskeleton Application` |
| **Data field** | `exoskeleton` (engine JSON → API → UI types) |
| **Verdict pill** | `EXOSKELETON APPLIED` / `EXOSKELETON FAIL` — **F2 forge UI only** (its misuse as ESA chrome decoration was removed, §1) |
| **Function** | `apply_exoskeleton()` (`scripts/forgedxfolders.py`) |
| **DuckDB column** | `exoskeleton_verdict` |

**Retired aliases — FIXED 2026-09-09 (v1 sweep) + v2 additions:**

| Alias | Lived in | Evidence |
|-------|----------|----------|
| `Capability Harness` (stage) | `FORGED-FILE-STANDARD.md` diagram + `skills/forge-org/SKILL.md` frontmatter description | the canonical contract itself still taught the retired name — rewritten in v1.1.0 |
| `harness` (Capability JSON field) | `FORGED-FILE-STANDARD.md` §4 | → `"exoskeleton"` (code already emitted `exoskeleton`; the contract now matches the code) |
| "Dependencies / Skills / Harnesses" (tab tree) | `FORGED-FILE-STANDARD.md` §10 | → "Dependencies / Skills / Exoskeleton Bindings" |

**Disposition: fixed end-to-end (contract now matches code).**

---

## 5. `src/harness.py` — disposition EXECUTED: `CapabilityRouter`

The pending §4 from v1 is resolved. `class Harness` routes queries through
reflex → skill → tier0/tier1/tier2. Per owner doctrine it was **NOT** renamed
to "Exoskeleton" — that would claim a redesign that never happened. It is a
router; it now bears its functional name.

| Change | Evidence |
|--------|----------|
| `src/harness.py` → `src/capability_router.py` (`class Harness` → `CapabilityRouter`) | `git mv` + rename; benchmark self-test runs green (11/11 reflex hits, 0.6 ms avg) |
| `src/quantum/zero_latency_harness.py` → `src/quantum/zero_latency_router.py` (`ZeroLatencyHarness` → `ZeroLatencyRouter`) | `base_harness` → `base_router`; `role="harness"` → `role="router"`; DID namespace `did:helpassembly:harness:001` → `did:helpassembly:router:001` (benchmark-only, no persistent quanta relied on the old namespace); storage dir → `.openclaw/tmp/quantum_router` |
| Consumers rewritten | `api_server.py` (global `router`), `agent_loop.py`, `appless/server.py` (injection param + user-facing error "Agent-X capability router not connected"), `quantum/{quantum_fetch,__init__,termux_bridge}.py`, Android log tag `007-Router` |
| Installers/verifiers repaired (they pointed at the dead paths) | `verify.sh`, `setup_termux.sh`, `bootstrap_nonroot.sh`, `AGENTS.md`, `README.md` (run section → `python3 -m src.capability_router`) |
| Docs rewritten | `docs/exoskeleton/Agent-X-Capability.md` §6 ("RIM / Cortex reasoning stacks", "Dedicated connectivity skills") |

**Intentionally kept (registered, not drifted):** `MANIFESTO.md` lines 71/261/273
—"not an agent harness" declarations REJECT the industry pattern (aligned with
doctrine); `skills/headless-reflex-arc/agent_x/membrane.py:13` "tool-harness
dichotomy" (describes the rejected industry concept being collapsed);
`imports/` (quarantined, §6).

**Disposition: executed end-to-end. `src/` tree contains zero "harness" identifiers.**

---

## 6. `imports/qag-skills-agent_x/` — QUARANTINED (unchanged)

Duplicate copies of the old modules live here. Per `OFFICIAL-THREE-REPO.md` the
`imports/` tree is staging junk slated for the QAG-MemBrain archive sink.
**Not part of the canonical vocabulary; do not wire, do not fix — archive.**
Its stale `harness` references are intentionally not repaired.

---

## 7. Pending (registered, not drifted)

| Item | Why pending |
|------|-------------|
| `esa-exoskeleton/` repo folder name | The sandbox is the Help Assembly Exoskeleton project (its own README title) hosting the ESA cards console. Renaming is deploy-bound (Cloudflare paths, 40+ doc references, uncommitted tree). Recommended target recorded at promotion time; ESA brand inside it already reduced to the service cards. |
| `ESAInputInterface` component name | Per ESA-MODULE-MAPPING it belongs to the Ava007 ingestion layer, not ESA; rename touches ingestion imports — scheduled with the console-layer cleanup. Comment already corrected. |
| `page.esa.tsx` state key `"exoskeleton"` | UI label changed to "Service Shell"; state key kept for routing compat — rename with the next ESA UI refactor. |

---

## 8. Non-duplicates (registered to prevent false collisions)

| Name | Concept |
|------|---------|
| `FORGE-ORG` | The org module (`modules/forge-org/`) housing the ForgedxFolders pipeline |
| `ForgedxFolders` | THE file system (F0→F3) — §2 above |
| `Aetheris` | Trial pipeline, next-FORGED candidate — §3 above (distinct from ForgedxFolders until promotion) |
| `memory-tdai` | Aetheris's 4-tier L0→L3 schema |
| `CapabilityRouter` | The query router (`src/capability_router.py`) — §5 |
| `Cybernetic-Ava007` | Sovereign Intellect repo (cognition authority — OUTSIDE Agent-X) |
| `a2a-exoskeleton` | Runtime substrate repo (Arrow/DuckDB tiers/timeline, mount/verify/transport) |
| `esa-exoskeleton/` | Help Assembly Exoskeleton sandbox folder (repo-root; pending rename, §7) |
| `ServiceCardShell` | ESA service chrome component — §1 |
| `EXOSKELETON APPLIED` | F2 forge verdict pill ONLY — never UI chrome |

---

## 9. Known-broken (pre-existing, NOT from the naming sweeps)

`page.esa.tsx` carries three tsc errors that predate 2026-09-09 and are
unrelated to naming: `@/lib/reorder-store` module absent, `Bot` icon unresolved,
`MaintenanceRequestComplete` prop mismatch. The platform tree has ~21 tsc
errors total (missing `@/lib/agent-x/types`, `ansi-to-react`, `IngeniosityLens`,
etc.) — **none touch the renamed files** (verified 2026-09-09: zero tsc errors
mention `ForgedxFolders*`, `ServiceCardShell`, `forge/page`, or `esa/page`).
Registered here so the broken state is visible and owned — not silently tolerated.

**Environment note:** sandbox resets drop pip packages (`rocksdict`, `duckdb`)
and untracked env files. Restore: `python3 -m pip install --break-system-packages
rocksdict duckdb` (the venv at `/home/z/.venv` is the interpreter `python3`
resolves to). Secrets live in gitignored `.env` / `platform/.env.local`; the
tracked `.env.example` files are the durable contract — see [[Mercury 2 Wiring]].
