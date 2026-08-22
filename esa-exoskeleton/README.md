# 🛡️ ESA EXOSKELETON

**Enterprise Security Agent (ESA) Exoskeleton** - A cloud-native AI agent console with DuckDB WASM integration.

[![Deployed on Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange?logo=cloudflare)](https://ESA.ingeniosity.tech)
[![Version](https://img.shields.io/badge/version-3.1.0-green.svg)](https://github.com/ingeniosity-A2A/Agent-X/tree/main/esa-exoskeleton)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Features

- ✅ **ESA.Ingestion AI** - React module: bottom Ingestion dock (lens → DuckDB/HD Supply, PDF upload, email-to, dual audio, visualizer overlay on input) + chat card in the rendering area
- ✅ **Rendering cards** - every module is a card: AI chat, diagnostics, broadcast parts, workorder, daily to-do list
- ✅ **Web console** - left sidebar styled as a scene/layers panel: Console ⇄ Library tabs, filtered log feed, and a search bar (hidden on mobile)
- ✅ **React module** - Ingestion Interface is React (esm.sh CDN, no build step); Arrow.js sandboxes the rest of the Exoskeleton
- ✅ **DuckDB WASM** - HD Supply catalog streaming (zero local storage)
- ✅ **Arrow.js** - Verified component wrapping with sandbox isolation
- ✅ **Gruvbox Theme** - Dark/Light toggleable color scheme
- ✅ **GSAP Animations** - Smooth component entrance effects
- ✅ **Cloudflare Pages** - Global edge deployment with automatic CI/CD
- ✅ **Event System** - Custom `esa:*` events for component communication

---

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or pnpm
- (Optional) Cloudflare account for deployment

### 1. Clone Repository
```bash
git clone https://github.com/ingeniosity-A2A/Agent-X.git
cd Agent-X/esa-exoskeleton
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Local Development
```bash
npm run dev
```
Open [http://localhost:8787](http://localhost:8787)

### 4. Deploy to Cloudflare

#### Option A: GitHub Actions (Recommended)
1. Go to **GitHub Settings → Secrets and variables → Actions**
2. Add repository secrets:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
3. Push to `main` branch - **automatic deployment**

#### Option B: Manual Deploy
```bash
npm run deploy
```

---

## Project Structure

```
esa-exoskeleton/
├── .github/
│   └── workflows/
│       └── cloudflare-deploy.yml    # GitHub Actions CI/CD
├── .wrangler/
│   └── wrangler.toml                 # Cloudflare Pages config (output: ./public)
├── config/                           # Source copies (theme, duckdb)
├── components/                       # Source copies (Arrow.js versions)
├── public/                           # ← DEPLOY ROOT (Cloudflare Pages)
│   ├── components/
│   │   ├── ESAIngestionChat.js       # React Ingestion Interface (chat + dual audio)
│   │   ├── ESA.Ingestion.js          # Adapter → React Ingestion module
│   │   ├── ESA.ButtonPanel.js        # React lens / text / upload panel
│   │   ├── ESA.ReactMount.js         # Shared React setup (esm.sh + htm)
│   │   └── …                         # Arrow.js sandboxed components (workorder, parts…)
│   ├── hooks/
│   │   └── use-esa-chat.js           # React chat hook + DuckDB/HD Supply engine
│   ├── config/
│   │   ├── gruvbox-colors.js        # Theme configuration
│   │   └── duckdb-setup.js          # DuckDB WASM initialization
│   └── index.html                   # Main HTML (ESA EXOSKELETON)
├── integration.js                    # Source copy (stale) — public/integration.js is used
├── package.json                      # Dependencies & scripts
├── SKILL.md                          # Component registry
└── README.md                         # This file
```

---

## Cloudflare Setup Guide

### 1. Create Cloudflare Pages Project
```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create esa-exoskeleton
```

### 2. Get API Token
1. Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use **"Edit Cloudflare Pages"** template
4. Copy the token

### 3. Get Account ID
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Look at the **right sidebar** → Account ID
3. Copy the Account ID

### 4. Configure GitHub Secrets
Go to: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

Add:
| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | (from step 2) |
| `CLOUDFLARE_ACCOUNT_ID` | (from step 3) |

---

## Component Architecture

```
ESA EXOSKELETON
│
├── ESA Console (left sidebar — scene/layers panel style, hidden on mobile)
│   ├── Header (✦ icon + title + subtitle)
│   ├── Console ⇄ Library segmented toggle
│   ├── Console: icon-coded log feed · Library: rendering-card list (click → jump to card)
│   └── Search bar (filters active view)
│
├── RENDERING AREA — every module is a card
│   └── APPROVED 3D RENDERING CARD STANDARD: 24rem wide · 2rem radius · 1.75rem
│       padding · fixed 11rem middle (meta col | model zone | stepper). Top and
│       bottom vary per card type; the middle and card size stay standard.
│   ├── 💬 AI INGESTION CHAT card (standard: meta | thread zone | stepper)
│   ├── 📦 Broadcast parts card (React — standard product card: Seasons PTAC,
│   │   model zone with loader, specs, price, HD Supply CTA)
│   ├── 🩺 Diagnostic card (standard frame)
│   ├── 📋 Workorder card (operator console — spans the full row, standard frame)
│   └── ✅ Daily to-do list card (standard frame)
│
├── ESA.Ingestion DOCK (bottom, React module) — SOLE COMMUNICATION HUB
│   └── Floating prompt pill (3D-editor style): + Add menu (photos/videos → lens, files → PDF/TXT, email → AgentMail),
│       ✨ Inspiration quick prompts, input with audio visualizer overlay, 🎤 mic, white circular send
│   └── Dual audio system flanking the pill (Sound I inbound mic + Agent voice output)
│   └── RENDERING VIEW toolbar (floating pill over the viewport: tools, 100%, ‹ › card navigation)
│
├── ESA.DuckDB
│   └── HD Supply catalog streaming (with embedded fallback)
│
└── Arrow.js sandboxes the remaining components (ESAVerifyComponent)
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server (port 8787) |
| `npm run build` | Build for production (no-op for static site) |
| `npm run deploy` | Deploy to Cloudflare Pages manually |
| `npm run init` | Login to Cloudflare via Wrangler |
| `npm start` | Serve static files locally (port 3000) |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `production` |
| `ESA_VERSION` | ESA version string | `2.1.0` |

---

## Event System

Components communicate via custom DOM events:

```javascript
// Listen for camera capture
window.addEventListener('esa:capture', (e) => {
  const { file, type } = e.detail;
  console.log(`Captured ${type}:`, file.name);
});

// Listen for file upload
window.addEventListener('esa:attachment', (e) => {
  const { file, type } = e.detail;
  console.log(`Attached ${type}:`, file.name);
});

// Listen for initialization complete
window.addEventListener('esa:ready', (e) => {
  console.log('ESA Ready:', e.detail);
});
```

---

## Theme Configuration

The ESA Exoskeleton uses a **Gruvbox color scheme** with dark/light modes:

```javascript
import { setTheme, toggleTheme, activeTheme } from './config/gruvbox-colors.js';

// Toggle between dark/light
toggleTheme();

// Force specific theme
setTheme('dark');
setTheme('light');

// Access current colors
console.log(activeTheme.bg);      // Background color
console.log(activeTheme.green);   // Accent green
```

---

## Integration with Existing Components

Hook your existing ingestion into ESA:

```javascript
// Register your ingestion component
window.ESA.registerIngestion({
  handleFile: (file, type) => {
    // Process the captured/uploaded file
    console.log(`Processing ${type}:`, file.name);
    
    // Send to your backend, process locally, etc.
  }
});

// Check ESA status
const status = window.ESA.getStatus();
console.log(status);
// { initialized: true, version: '2.1.0', hasDuckDB: true, ... }
```

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 15+ | ✅ Full |
| Edge | 90+ | ✅ Full |

**Required APIs:**
- ES Modules (`type="module"`)
- Web Workers (for DuckDB WASM)
- MediaDevices API (camera)
- Custom Events

---

## Security

- **Sandbox Isolation**: Unverified components run in WASM sandbox
- **Default-Deny Policy**: No action executes without explicit allow
- **Zero Local Storage**: DuckDB streams data, nothing persists locally
- **CSP Headers**: Configured via Cloudflare/Enforcer module
- **Token Security**: API tokens stored in GitHub Secrets (never committed)

See [`SKILL.md`](./SKILL.md) for full security documentation.

---

## Troubleshooting

### DuckDB fails to initialize
- Check browser console for WASM errors
- Ensure CORS headers allow CDN access
- Try hard refresh to clear cached WASM files

### Camera not working
- Requires HTTPS or localhost
- Check browser permissions for camera access
- Some browsers block camera in iframes

### Components not mounting
- Verify `integration.js` path is correct
- Check browser console for import errors
- Ensure all dependencies are installed

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Component Guidelines:**
- All components must use `ESA.` prefix
- Wrap new components in `ESAVerifyWrapper`
- Follow Gruvbox color scheme
- Emit `esa:` prefixed events for communication

---

## License

MIT © ESA Team

---

## References

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages Git Integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [DuckDB WASM](https://duckdb.org/docs/api/wasm)
- [Arrow.js](https://arrow-js.dev/)
- [GSAP Animation Library](https://gsap.com/)

---

**Live URL**: [ESA.ingeniosity.tech](https://ESA.ingeniosity.tech)

**Issues**: [GitHub Issues](https://github.com/ingeniosity-A2A/Agent-X/issues)
