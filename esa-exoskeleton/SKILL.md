# ESA EXOSKELETON - Master Skill Registry

## Version: 2.1.0
## Status: Active ✓
## Last Updated: 2026-08-21
## Deployment: ESA.ingeniosity.tech

---

## ESA Components (All prefixed with ESA.)

### ✅ Verified Components
| Component | Version | Description | Status |
|-----------|---------|-------------|--------|
| **ESA.Console** | v1.0.0 | Main console output | ✅ Active |
| **ESA.DuckDB** | v1.0.0 | HD Supply streaming (WASM) | ✅ Active |
| **ESA.Ingestion** | v1.0.0 | AI ingestion (no chat/to-do) | ✅ Active |

### 🏖️ Sandbox Components
| Component | Version | Description | Status |
|-----------|---------|-------------|--------|
| **ESA.ButtonPanel** | v1.0.0 | AI button + stacked attachments | 🏖️ Sandbox |
| **ESA.SandboxManager** | v1.0.0 | WASM sandbox wrapper | 🏖️ Sandbox |
| **ESA.VerifiedWrapper** | v1.0.0 | Component verification layer | 🏖️ Sandbox |

---

## Component Architecture

```
ESA EXOSKELETON (ESA.ingeniosity.tech)
│
├── 📋 ESA.Console (Verified)
│   ├── Main execution surface
│   ├── Log output with timestamps
│   └── Clear button functionality
│
├── 📥 ESA.Ingestion (Verified)
│   ├── Standalone ingestion component
│   ├── NO chat box
│   ├── NO to-do list
│   └── File handling integration
│
├── 🎛️ ESA.ButtonPanel (Sandbox) - Far Right Position
│   ├── ✨ AI Button (Camera capture)
│   ├── 📝 Text Button (Stacked)
│   ├── 📄 PDF/TXT Upload (Stacked)
│   └── Image preview with remove
│
├── 🏖️ ESA.SandboxManager
│   ├── WASM sandbox isolation
│   ├── Component registration
│   ├── API bridge to host
│   └── Safe code execution
│
└── 🗄️ ESA.DuckDB
    ├── HD Supply catalog streaming
    ├── Pure WASM (no local storage)
    ├── CSV/PDF import capability
    └── SKU search functionality
```

---

## Component Notes

### ESA.Ingestion
- **Purpose**: Standalone file/data ingestion
- **Constraints**: 
  - ❌ No chat box interface
  - ❌ No to-do list functionality
  - ✅ File handling only
- **Integration**: Hooks via `window.ESA.registerIngestion()`

### ESA.ButtonPanel
- **Position**: Far right of layout
- **Features**:
  - Camera activation with 2s auto-capture
  - Text input via prompt
  - PDF/TXT file upload
  - Image preview popup
- **Events**: Dispatches `esa:capture` and `esa:attachment` events

### ESA.DuckDB
- **Storage**: Pure WASM streaming (zero local persistence)
- **Source**: HD Supply catalog (CSV/PDF)
- **Query**: Full SQL support via DuckDB WASM

---

## Features Checklist

- [x] ESA. prefix naming convention (all components)
- [x] Arrow.js verified component wrapping
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
