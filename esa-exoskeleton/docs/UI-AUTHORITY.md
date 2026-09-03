# UI AUTHORITY — esa-exoskeleton

Status: binding. Read before touching ANY file in this directory.

## Doctrine (owner's rule, non-negotiable)

1. **The exoskeleton has NO UI authority.** UI authority lives with the
   **Agent Browser** surface and the uploaded shell attachments (v6/UI8 —
   `ava-shell.css` is the attached authority). Attachments are applied
   verbatim and never redesigned here.
2. **ESA and Help Assembly are service companies (tenants).** They receive
   the Exoskeleton to streamline their service — that is all they get.
3. **Brands do not mingle.** Tenant branding exists ONLY inside tenant
   cards. Framework chrome (header, dock, nav, toolbar, loading/error
   screens) is framework identity — no tenant names in it, no framework
   names inside tenant cards.
4. **The tenant surface is small and closed.** ESA = 5 rendering cards,
   a calendar, a DB, inventory management. New ESA surface requires an
   explicit owner decision — no growth byaccident.

## File classification

### SHELL — framework UI (Agent Browser authority · do not redesign here)

| File | Role |
|------|------|
| `public/index.html` | Document frame: attachment header structure, workspace grid, mount points |
| `public/ava-shell.css` | V6 attachment — byte-authoritative shell skin |
| `public/shell-layout.css` | Dock/panel layout layer (V6) |
| `public/shell-nav.js` | Card switching contract (`ESAShell.showCard`) |
| `public/sidebar/sidebar-tree.js` + `sidebar.css` | Official sidebar + ESA dropdown nav |
| `public/ai-chatbot-dock.css` | Bottom dock chrome (fixed toolbar) |
| `public/v6-exoskel-polish.css` | Polish layer (V6 attachment era) |
| `public/bento-tokens.css` | Bento design tokens |
| `public/esa-bento-theme.css` | Bento theme bridge |
| `public/mount-alias.js` | Mount-point alias contract |
| `public/builder.html` | Shell builder surface |
| `public/_headers` | CF Pages cache headers |

### FRAMEWORK RUNTIME — verify · mount · transport (not tenant, not visual)

| File | Role |
|------|------|
| `public/components/ESA.VerifiedWrapper.js` | Arrow.js sandbox verification |
| `public/components/ESA.ReactMount.js` | React (esm.sh + htm) mount runtime |
| `public/components/ESA.GSAPTransport.js` | GSAP animation transport |
| `public/components/ESA.SandboxManager.js` | Hidden sandbox host |
| `public/config/gruvbox-colors.js` | Theme configuration |

### TENANT — ESA service surface (complete, closed set)

| ESA asset | Files |
|-----------|-------|
| **5 rendering cards** | `ESA.DiagnosticCard.js` · `ESA.invpartscard-B.js` (parts + inventory + broadcast) · `ESA.workorder.js` · `ESA.MaintenanceChecklist.js` · `ESA.Ptac-B.js` |
| **Calendar** | `ESA.Calendar.js` + `config/green-shield.js` (backend-parity schedule) |
| **DB** | `config/duckdb-setup.js` (DuckDB WASM catalog) |
| **Inventory management** | Inside `ESA.invpartscard-B.js` (inventory panel + broadcast B-side) |
| Tenant chat/lens modules | `ESAIngestionChat.js` · `ESA.Ingestion.js` (dock adapter) · `ESA.ButtonPanel.js` · `hooks/use-esa-chat.js` |
| Tenant wiring | `integration.js` (framework glue, tenant-configured) |

## Rules going forward

1. Shell/layout/branding fixes are made in the **Agent Browser surface or a
   new uploaded attachment** — never by redesigning shell files here.
2. Tenant work is confined to the tenant set above. The tenant set does not
   grow silently.
3. A tenant card may style ITSELF (`--bk-*` bento tokens). It may never restyle
   the shell or other tenants' cards.
4. Every change here must survive the question: *does this file carry UI
   authority, or does it consume it?*
