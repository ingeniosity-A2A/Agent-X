# HELP ASSEMBLY EXOSKELETON - Master Skill Registry

## Version: 3.6.0
## Status: Active ✓
## Last Updated: 2026-08-22
## Deployment: ESA.ingeniosity.tech
## Identity: Agent X = logic & reasoning for the capabilities layer · Ava007 = voice · Scope = Help Assembly Services only
## Exoskeletons: `public/` = Help Assembly Services console · `public/esa-console/` = ESA Exoskeleton (hotel maintenance, HD Supply PTAC) — sandboxed separately, no shared architecture

---

## ESA Components (All prefixed with ESA.)

### ✅ Verified Components
| Component | Version | Description | Status |
|-----------|---------|-------------|--------|
| **ESA.Console** | v1.1.0 | Scene/layers panel (left sidebar): Console ⇄ Library tabs + search | ✅ Active |
| **ESA.DuckDB** | v1.0.0 | Help Assembly catalog streaming (WASM) | ✅ Active |
| **ESA.Ingestion** | v7.0.0 | React comms hub — dock (lens/PDF/email/audio) + chat card (Help Assembly scope) | ✅ Active |
| **ESA.MaintenanceChecklist** | v3.0.0 | React tech shift checklist card (assembly workflow) | ✅ Active |

### 🏖️ Sandbox Components
| Component | Version | Description | Status |
|-----------|---------|-------------|--------|
| **ESA.ButtonPanel** | v1.0.0 | AI button + stacked attachments | 🏖️ Sandbox |
| **ESA.SandboxManager** | v1.0.0 | WASM sandbox wrapper | 🏖️ Sandbox |
| **ESA.VerifiedWrapper** | v1.0.0 | Component verification layer | 🏖️ Sandbox |
| **ESA.InvPartsCard-B** | v1.0.0 | Service broadcasting B-side: inventory + parts panel (see docs/service-broadcast-cards.md) | 🏖️ Sandbox |
| **ESA.Ptac-B** | v1.0.0 | Service broadcasting B-side: PTAC #223532 service deck (see docs/service-broadcast-cards.md) | 🏖️ Sandbox |

---

## Component Architecture

```
ESA EXOSKELETON (ESA.ingeniosity.tech)
│
├── 📋 ESA.Console (left sidebar — scene/layers panel, hidden on mobile)
│   ├── Header (✦ + title + subtitle) · Console ⇄ Library tabs · search footer
│   ├── Console tab: icon-coded log feed
│   └── Library tab: rendering-card list (click → jump to card)
│
├── 🖼️ RENDERING AREA — every module is a card
│   ├── 💬 AI INGESTION CHAT card (parts: text / images / cards)
│   ├── 🩺 Diagnostic card
│   ├── 📦 Broadcast parts card
│   ├── 📋 Workorder card
│   └── ✅ Daily to-do list card
│
├── 📥 ESA.Ingestion DOCK (bottom, React module) — SOLE COMMUNICATION HUB
│   ├── Floating prompt pill: + Add menu (lens / files / email), ✨ Inspiration prompts,
│   │   input + audio visualizer overlay, 🎤 mic, white circular send
│   └── Dual audio flanking the pill (Sound I mic + Agent voice)
│   └── Floating RENDERING VIEW toolbar over the viewport (tools, 100%, ‹ › card nav)
│
├── 🏖️ Arrow.js sandboxes the remaining components
│   └── ESAVerifyComponent / SandboxManager
│
└── 🗄️ ESA.DuckDB
    ├── HD Supply catalog streaming (DuckDB WASM)
    ├── Embedded fallback catalog (offline-safe)
    └── SKU search functionality
```

---

## Component Notes

### ESA.Ingestion AI (React module)
- **Purpose**: Sole communication hub for the ESA EXOSKELETON console
- **Scope**: ESA content only (HD Supply catalog, inventory, diagnostics)
- **Rendering**: message parts — text, inline images (lens), tool-style cards (DuckDB/HD Supply)
- **Dock**: bottom interface with 🔍 lens, 📄 PDF/TXT upload, ✉️ email-to, input + audio visualizer overlay
- **Audio**: dual audio system (Sound I inbound mic + Agent voice output)
- **Hub**: surfaces `esa:*` events from every ESA component as system messages
- **Stack**: React (esm.sh CDN, no build step) · Arrow.js sandboxes the rest of the Exoskeleton

### ESA.ButtonPanel
- **Position**: Far right of layout
- **Features**:
  - Camera activation with 2s auto-capture
  - Text input via prompt
  - PDF/TXT file upload
  - Image preview popup
- **Events**: Dispatches `esa:capture` and `esa:attachment` events

### ESA.InvPartsCard-B / ESA.Ptac-B (Service Broadcasting B-side)
- **Role**: parent/child pair operating the Seasons PTAC catalog — inventory (warranty/processing/recycle), service intervals, diagnostics, and live service broadcasts
- **InvPartsCard-B**: inventory + verbal-inventory scan (`esa:inventory-scan`), parts ordering (`esa:order-part`), toggleable broadcast features
- **Ptac-B**: right-edge sliding service deck for HD Supply Part #223532; tabs Overview / Parts / Service / Diagnostics / Broadcast; `broadcastMessage()` → GSAP Transport `broadcast:message` tween atom + voice announcement + `esa:broadcast` event
- **Status**: Arrow.js components (ESAVerifyComponent), syntax-verified, not yet mounted in the console
- **▶ Full spec**: `docs/service-broadcast-cards.md`

### ESA.DuckDB
- **Storage**: Pure WASM streaming (zero local persistence)
- **Source**: HD Supply catalog (CSV/PDF)
- **Query**: Full SQL support via DuckDB WASM

---

## Features Checklist

- [x] ESA. prefix naming convention (all components)
- [x] React Ingestion module (esm.sh CDN, no build step)
- [x] Arrow.js sandboxes the remaining Exoskeleton components
- [x] Every module renders as a card; web console = left sidebar
- [x] Mobile mode: cards + Ingestion dock only
- [x] DuckDB WASM streaming (no local storage)
- [x] Camera API integration
- [x] PDF/Text file attachments
- [x] GSAP animations on mount
- [x] Gruvbox color scheme (dark/light toggleable)
- [x] Auto-update console notifications
- [x] Cloudflare Pages deployment ready
- [x] GitHub Actions CI/CD pipeline
- [x] Custom event system (`esa:*` events)
- [x] Global `window.ESA` namespace
- [x] Status indicator (online/offline/error)
- [x] Responsive design (mobile breakpoints)

---

## Event System

Components communicate via custom DOM events:

| Event Name | Detail | Trigger |
|------------|--------|---------|
| `esa:ready` | `{ status, version, ... }` | Initialization complete |
| `esa:capture` | `{ file, type: 'image' }` | Camera captures image |
| `esa:attachment` | `{ file, type: 'pdf\|text' }` | File uploaded |
| `esa-sandbox-message` | `{ message, source }` | Sandbox → Host message |

### Listening for Events
```javascript
window.addEventListener('esa:capture', (e) => {
  console.log('Captured:', e.detail.file);
});
```

---

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `production` |
| `ESA_VERSION` | ESA version string | `2.1.0` |

### Theme Toggle
```javascript
// Programmatic theme control
import { setTheme, toggleTheme } from './config/gruvbox-colors.js';

toggleTheme();        // Switch between dark/light
setTheme('dark');     // Force dark mode
setTheme('light');    // Force light mode
```

---

## Deployment

### Cloudflare Pages
- **URL**: https://ESA.ingeniosity.tech
- **Build**: Static (no build step required)
- **CI/CD**: GitHub Actions on push to main

### Local Development
```bash
npm install
npm run dev      # http://localhost:8787
```

---

## Update Log

| Version | Date | Changes |
|---------|------|---------|
| **3.6.1** | 2026-08-22 | **GLB 3D rendering**: `<model-viewer>` 3.5.0 (Google CDN) added to both consoles; catalog items carry a `model` GLB URL via `MODEL_URLS` (Khronos sample placeholders — swap for real product GLBs); product render cards + parts-card model zones render the GLB with auto-rotate/camera-controls and fall back to the CSS visual on error |
| **3.6.0** | 2026-08-22 | **Two sandboxed exoskeletons**: `public/` = Help Assembly Services console (root); `public/esa-console/` = separate ESA EXOSKELETON console (`/esa-console`) with hotel-maintenance content (HD Supply PTAC catalog, Seasons PTAC product card, service broadcasting, hotel workorder/checklist) restored from the pre-retool baseline + light console theme. **Lens → render flow** in both: upload a photo → visual catalog picker → tap the match → product render card (Help Assembly: info + quote + QUOTE/BOOK; ESA: 3D PTAC visual + inventory + ORDER PART / WORK ORDER). **CI added**: `.github/workflows/verify.yml` (node --check + py_compile + import containment + hub-event symmetry) |
| **3.5.0** | 2026-08-22 | Retooled console for **Help Assembly Services** (furniture assembly): Ingestion chat + catalog engine now Help Assembly scope (HA-* SKUs, Agent X logic / Ava007 voice); broadcast parts card → furniture service card; tech shift checklist replaces daily maintenance; workorder → furniture job order (customer/order/QA codes); diagnostic card → assembly QA panel; DuckDB seed → help_assembly_catalog |
| **3.4.1** | 2026-08-22 | Stepper wheel moved onto the far right of the 3D model zone (overlay) and made functional: parts card scrolls quotes/images/specs slides (wheel + click); chat card scrolls the thread |
| **3.4.0** | 2026-08-22 | Approved 3D RENDERING CARD STANDARD applied: 24rem cards, warm glass frame, fixed 11rem middle (meta col \| model zone \| stepper); chat + parts cards rebuilt to the standard, parts card is now a React product card (Seasons PTAC) |
| **3.3.0** | 2026-08-22 | Console restyled as scene/layers panel (Console ⇄ Library tabs + search); viewport gets dot-grid + floating RENDERING VIEW toolbar; Ingestion dock becomes a floating prompt pill (+ Add menu, ✨ Inspiration, mic, white send) — no right sidebar |
| **3.2.0** | 2026-08-22 | Ingestion is a React module (dock + chat card); every module is a rendering card; web console = left sidebar; mobile = cards + dock only |
| **2.1.0** | 2026-08-21 | Removed Ava console; clean ESA. prefix structure; added Cloudflare deployment |
| **2.0.0** | 2026-08-20 | Initial ESA Exoskeleton with Arrow.js components |
| **1.0.0** | 2026-08-19 | Prototype release |

---

## Security Notes

- **Default-deny policy**: All components run in sandbox unless verified
- **No local storage**: DuckDB streams only, zero persistence
- **CSP headers**: Configured via Cloudflare/Enforcer
- **Token security**: Cloudflare API token in secrets (never committed)

---

*ESA EXOSKELETON - Execution surface for Help Assembly capabilities*
