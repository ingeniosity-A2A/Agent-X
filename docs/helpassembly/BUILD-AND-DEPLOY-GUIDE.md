# HelpAssembly Platform: Complete Build & Deployment Guide

This document provides step-by-step instructions for building and deploying the entire HelpAssembly platform across Cloudflare Pages and Workers.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account with Pages and Workers enabled
- `wrangler` CLI installed globally: `npm install -g @cloudflare/wrangler`

## Architecture Quick Reference

```
www.helpassembly.com        → public-ds (Vite + Pages)
ops.helpassembly.com        → ops-ds (Vite + Pages)
api.helpassembly.com        → api-worker (REST endpoints)
ai.helpassembly.com         → ai-worker (Ava007 orchestration)
events.helpassembly.com     → realtime-worker (WebSocket)
ops-api.helpassembly.com    → ops-worker (Admin telemetry)
```

## Phase 1: Validation & Setup

### Step 1: Install Dependencies
```bash
cd /workspaces/Ava007

# Install all monorepo dependencies
npm install

# Verify installation
npm list | head -20
```

**Expected output**: All packages resolved, no errors

### Step 2: Validate Infrastructure
```bash
# Run validation script
bash scripts/validate-infrastructure.sh
```

**Expected output**:
```
✓ All checks passed!
✓ workers/edge-router/index.ts
✓ workers/api-worker/index.ts
✓ apps/public-ds/src/main.tsx
✓ packages/ui-system/destiny-ui/
...
```

### Step 3: TypeScript & Linting
```bash
# Check for TypeScript errors
npm run lint:watch

# In another terminal, keep this running during development
```

## Phase 2: Local Development

### Option A: Develop All Apps Locally

**Terminal 1 - Public DS:**
```bash
cd apps/public-ds
npm run local
# → http://localhost:5173
```

**Terminal 2 - Ops DS:**
```bash
cd apps/ops-ds
npm run local
# → http://localhost:5174
```

**Terminal 3 - Individual Worker (API):**
```bash
cd workers/api-worker
wrangler dev
# → http://localhost:8787
```

### Option B: Develop Single App
```bash
cd apps/public-ds
npm run local
```

Then test APIs manually:
```bash
# Test API endpoints
curl -X POST http://localhost:8787/quote -H "Content-Type: application/json" -d '{"serviceType":"furniture"}'
```

## Phase 3: Build for Production

### Step 1: Build All Apps
```bash
npm run public-ds:build
npm run ops-ds:build
npm run booking-surface:build
npm run marketing-root:build
```

**Expected output**: Each app creates a `dist/` folder
```
apps/public-ds/dist/       (built)
apps/ops-ds/dist/          (built)
apps/booking-surface/dist/ (built)
apps/marketing-root/dist/  (built)
```

### Step 2: Verify Build Outputs
```bash
# Check build sizes
du -sh apps/*/dist/

# Expected: Each should be 100-500KB (depends on dependencies)
```

### Step 3: Build Workers
Workers are built automatically by Wrangler, but you can pre-verify:

```bash
# Validate worker TypeScript
cd workers/edge-router && npx tsc --noEmit
cd workers/api-worker && npx tsc --noEmit
cd workers/ai-worker && npx tsc --noEmit
cd workers/realtime-worker && npx tsc --noEmit
cd workers/ops-worker && npx tsc --noEmit
```

## Phase 4: Deploy to Production

### Step 4a: Deploy Pages Apps

**Important**: Deploy apps BEFORE workers (workers need Pages URLs to route to)

```bash
# Public-facing surface
npm run public-ds:deploy
# Expected: Deployed to helpassembly-public-ds.pages.dev

npm run ops-ds:deploy
# Expected: Deployed to helpassembly-ops-ds.pages.dev

npm run booking-surface:deploy
# Expected: Deployed to helpassembly-booking-surface.pages.dev

npm run marketing-root:deploy
# Expected: Deployed to helpassembly-marketing-root.pages.dev
```

**Verification:**
```bash
# Test each deployment
curl https://helpassembly-public-ds.pages.dev/
curl https://helpassembly-ops-ds.pages.dev/
curl https://helpassembly-booking-surface.pages.dev/
curl https://helpassembly-marketing-root.pages.dev/
```

### Step 4b: Deploy Workers (Order Matters!)

**IMPORTANT**: Deploy API/AI/realtime FIRST, then edge-router LAST

```bash
# 1. Deploy API worker
cd workers/api-worker
wrangler deploy --env production

# 2. Deploy AI worker
cd workers/ai-worker
wrangler deploy --env production

# 3. Deploy realtime worker
cd workers/realtime-worker
wrangler deploy --env production

# 4. Deploy ops worker
cd workers/ops-worker
wrangler deploy --env production

# 5. Deploy edge-router LAST (highest priority)
cd workers/edge-router
wrangler deploy --env production
```

**Why order matters**: The edge-router must be deployed last so it becomes the top-level handler for all requests.

## Phase 5: Post-Deployment Validation

### Test Routing

```bash
# Test public surface
curl https://www.helpassembly.com/
# Expected: 200 OK, HTML from public-ds

# Test ops surface (requires auth)
curl -H "Authorization: Bearer mock-token" https://ops.helpassembly.com/
# Expected: 200 OK, HTML from ops-ds

# Test API endpoints
curl -X POST https://api.helpassembly.com/quote \
  -H "Content-Type: application/json" \
  -d '{"serviceType":"furniture_assembly"}'
# Expected: 200 OK, JSON response

# Test AI worker
curl -X POST https://ai.helpassembly.com/intent \
  -H "Content-Type: application/json" \
  -d '{"input":"I need help assembling furniture"}'
# Expected: 200 OK, JSON response with intent recognition
```

### Test WebSocket (Events)
```bash
# Using websocat or similar
websocat wss://events.helpassembly.com/
# Expected: Connection established, JSON message received

# Or using curl
curl --include \
  --no-buffer \
  --header "Connection: Upgrade" \
  --header "Upgrade: websocket" \
  --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  --header "Sec-WebSocket-Version: 13" \
  https://events.helpassembly.com/
```

### Check Destiny UI Rendering
```bash
# Visit public surface
open https://www.helpassembly.com/

# Look for:
# - Ava007 Docking Surface header
# - Destiny card components rendering
# - No TypeScript errors in console
```

## Phase 6: Monitoring & Maintenance

### Enable Cloudflare Analytics
1. Go to Cloudflare dashboard
2. Navigate to your domain
3. Enable Web Analytics (free)
4. View metrics:
   - Edge-router latency
   - Worker error rates
   - Pages deployment status

### Monitor Worker Logs
```bash
# Stream real-time logs from a worker
wrangler tail api-worker --env production
wrangler tail edge-router --env production
```

### View Deployment History
```bash
# Pages deployments
wrangler pages deployments list

# Worker deployments
wrangler deployments list
```

## Rollback Procedures

### Rollback a Pages Deployment
```bash
# Navigate to Cloudflare dashboard
# Pages → helpassembly-public-ds → Deployments
# Click "Rollback" on previous version
```

### Rollback a Worker
```bash
# Redeploy previous version
cd workers/api-worker
git checkout HEAD~1 -- index.ts
wrangler deploy --env production
```

## Environment Variables Reference

### Public-DS (.env.local)
```bash
VITE_API_URL=https://api.helpassembly.com
VITE_AI_URL=https://ai.helpassembly.com
VITE_EVENTS_URL=wss://events.helpassembly.com
VITE_STRIPE_KEY=pk_live_...
```

### Ops-DS (.env.local)
```bash
VITE_API_URL=https://api.helpassembly.com
VITE_OPS_API_URL=https://ops-api.helpassembly.com
VITE_STRIPE_KEY=pk_live_...
AUTH_REQUIRED=true
```

### Workers (wrangler.toml env section)
```toml
[env.production.vars]
ENVIRONMENT = "production"
STRIPE_WEBHOOK_SECRET = "whsec_..."
AVA_MODEL = "claude-3-5-sonnet"
```

Pages destinations are resolved by the routing contract in `packages/runtime-contracts/routing/index.ts`.

## Troubleshooting

### Issue: 502 Bad Gateway from edge-router
**Cause**: Pages deployments not ready
**Fix**: Wait 60 seconds for Pages to fully deploy, then try again

### Issue: Workers returning 404
**Cause**: Route not configured in wrangler.toml
**Fix**: Verify routes in each worker's wrangler.toml matches your domain

### Issue: CORS errors in console
**Cause**: Worker not setting CORS headers
**Fix**: Check worker's Response headers include:
```typescript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
```

### Issue: WebSocket connection fails
**Cause**: realtime-worker not deployed
**Fix**: Verify realtime-worker is deployed and accessible

## Performance Optimization

### Reduce Bundle Size
```bash
# Analyze what's in your bundles
cd apps/public-ds
npm install -D rollup-plugin-visualizer
# Then configure vite.config.ts to use it
```

### Cache Strategy
- **Pages**: Set cache TTL in edge-router (production: 3600s, public: 60s)
- **Workers**: Use cache API for repeated requests
- **Assets**: Enable gzip compression via Cloudflare

### Database Queries
- Batch requests when possible
- Use Cloudflare D1 for fast local queries
- Implement query caching at worker level

## Security Checklist

- [ ] All ops-api routes require Authorization header
- [ ] Stripe webhook signatures verified
- [ ] CORS headers restricted to helpassembly.com domains
- [ ] Rate limiting enabled on public endpoints
- [ ] API keys stored in Cloudflare Secrets, not in code
- [ ] HTTPS enforced everywhere
- [ ] CSP headers configured in Pages

## Final Verification Checklist

- [ ] npm install completes without errors
- [ ] npm run lint:watch passes
- [ ] All 4 apps build successfully
- [ ] All 5 workers deploy without errors
- [ ] www.helpassembly.com resolves to public-ds
- [ ] ops.helpassembly.com requires auth
- [ ] api.helpassembly.com/quote returns JSON
- [ ] ai.helpassembly.com/intent returns JSON
- [ ] events.helpassembly.com WebSocket connects
- [ ] Destiny cards render in both public and ops
- [ ] No TypeScript errors in any surface
- [ ] Cloudflare analytics showing traffic

---

**Deployment Complete!** 🎉

The HelpAssembly platform is now running edge-first on Cloudflare with:
- 4 app surfaces (Pages)
- 5 worker entry points (Workers)
- 7 shared packages (monorepo)
- Complete Destiny UI system
- Production-ready infrastructure
