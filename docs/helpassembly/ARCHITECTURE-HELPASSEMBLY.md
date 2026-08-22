# Help Assembly Platform Architecture

> Canonical governance notices:
> - Architecture SoR: [Ava007 `docs/exoskeleton/`](https://github.com/ingeniosity-A2A/Ava007/tree/main/docs/exoskeleton)
> - Memory membrane: [Core-Membrain](https://github.com/ingeniosity-A2A/Core-Membrain)
> - Exoskeleton online console: [esa-exoskeleton/](../../esa-exoskeleton/)

**Agent-X platform/ is the Help Assembly Exoskeleton execution surface** — a Next.js 16 app providing ESA operator consoles, inventory, service requests, Green Shield inspections, and AgentMail-based email dispatch. It is not a dashboard, not a peer Intellect, and not a Supabase/Twilio app.

---

## System Architecture (actual)

```
Operator (browser)
   │
   ▼
Next.js 16 (platform/src)
   ├── /consoles/esa-maintenance    Select Card (Parts · Service · Green Shield)
   ├── /consoles/help-assembly      Help Assembly console (Jobs · Capture · A2UI)
   ├── /capture                     Image/file ingestion → job card
   │
   │  API routes
   ├── /api/esa                     Governance enforcer + feature flags
   ├── /api/inventory               Parts CRUD (in-memory store)
   ├── /api/parts                   Part ordering (in-memory)
   ├── /api/service-request         Service request CRUD → Daily To-Dos
   ├── /api/jobs                    Daily To-Do list (compiled from service requests)
   ├── /api/green-shield            Calendar + daily checklists
   ├── /api/email-snapshot          Send alone / Send batch (EOD) → AgentMail
   │
   ▼
AgentMail (ava007@agentmail.to → bmccray02@gmail.com)
   │  REST API: api.agentmail.to/v0/inboxes/{id}/messages/send
   │  Fallback: stub mode when AGENTMAIL_API_KEY is not set
```

### What this platform is NOT

- **Not a Supabase app** — no Supabase client, no Supabase tables, no `/api/sms` webhook.
- **Not a Twilio app** — no Twilio SMS gateway, no `/api/sms` route, no phone messaging.
- **Not a dashboard** — operator surface is `/consoles/esa-maintenance` (Select Card). The home page is a nav hub.
- **Not a persistent database** — inventory and service requests are in-memory. Prisma is starter-only (User/Post models, SQLite).

---

## File Structure (actual)

```
platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Home — nav to ESA / Help Assembly consoles
│   │   ├── layout.tsx                        # Root layout (Geist fonts, Toaster)
│   │   ├── globals.css                       # Tailwind + shadcn/ui theme
│   │   ├── console/page.tsx                  # Legacy redirect → /consoles/esa-maintenance
│   │   ├── capture/page.tsx                  # Image/file ingestion → JobCard
│   │   ├── consoles/
│   │   │   ├── esa-maintenance/page.tsx      # Select Card: Parts · Service Request · Green Shield
│   │   │   └── help-assembly/page.tsx        # Help Assembly: Today's Jobs + Capture + A2UI
│   │   └── api/
│   │       ├── route.ts                      # Health — surface: exo.help_assembly
│   │       ├── esa/route.ts                  # ESA governance (GET snapshot + POST enforce/feature toggle/IAM)
│   │       ├── inventory/route.ts            # Parts inventory (GET snapshot + POST scan_add/stream_add/set_quantity)
│   │       ├── parts/route.ts                # Parts ordering (GET list + POST orderPart)
│   │       ├── service-request/route.ts       # Service request CRUD (GET list + POST create/set_status)
│   │       ├── jobs/route.ts                 # Daily To-Dos (GET: service requests → todo list)
│   │       ├── green-shield/route.ts         # Green Shield (GET calendar/day + POST toggle/rooms)
│   │       └── email-snapshot/route.ts       # Email dispatch (POST alone/batch → AgentMail)
│   ├── components/
│   │   ├── a2ui/
│   │   │   ├── index.ts                      # A2UIRenderer (maps component name → React card)
│   │   │   ├── types.ts                      # A2UINode, JobCardData, InventoryCardData, IngestResult
│   │   │   ├── A2UIRenderer.tsx              # Dynamic card renderer
│   │   │   ├── JobCard.tsx                   # Job display (status, image, quote, assignment)
│   │   │   ├── TodaysJobs.tsx                # Today's Jobs list (detached observation, not ingestion)
│   │   │   ├── InventoryCard.tsx             # Inventory match card (sku, confidence, vendor, agent)
│   │   │   └── CaptureCTA.tsx                # Capture call-to-action button
│   │   ├── esa/
│   │   │   ├── PartsCard.tsx                 # Parts card: inventory mode + order mode + photo/barcode/catalog
│   │   │   ├── ServiceRequestCard.tsx        # Service requests: create + status toggle (completed/incomplete/follow_up)
│   │   │   ├── GreenShieldPanel.tsx          # Calendar + daily checklist + out-of-service rooms
│   │   │   └── SendEmailButtons.tsx          # Send alone (this card) / Send batch (EOD) → AgentMail
│   │   └── ui/                               # ~50 shadcn/ui components (button, card, dialog, etc.)
│   └── lib/
│       ├── db.ts                             # Prisma client (SQLite, User + Post models only)
│       ├── enforcer.ts                       # ESA governance: IAM policies, deployment specs, feature flags
│       ├── inventory-store.ts               # In-memory parts inventory (Map), HD Supply catalog stubs
│       ├── green-shield.ts                   # In-memory calendar + daily checklists + room OOS tracking
│       ├── esa-email.ts                      # AgentMail transport (ava007@agentmail.to → manager)
│       └── utils.ts                          # cn() classname utility
├── prisma/
│   └── schema.prisma                         # SQLite: User + Post models (starter)
├── db/
│   └── custom.db                             # SQLite database file
├── package.json                              # Next.js 16, React 19, Prisma, shadcn/ui, framer-motion
├── next.config.ts                            # Standalone output, TS errors suppressed
├── tailwind.config.ts                        # Tailwind v4
├── Caddyfile                                 # Reverse proxy :81 → localhost:3000
└── scripts/                                  # build.sh, dev.sh, start.sh, mini-services scripts
```

---

## Data Layer

### In-memory stores (no persistence across restarts)

| Store | File | What it holds |
|-------|------|---------------|
| Parts inventory | `inventory-store.ts` | `Map<string, PartRecord>` — SKU, name, barcode, qty, vendor, status (in_stock/low/out_of_stock), image |
| Service requests | `inventory-store.ts` | `ServiceRequest[]` — title, status (completed/incomplete_parts/follow_up), partSku, notes, assignee |
| Green Shield | `green-shield.ts` | `Map<string, GreenShieldDay>` — date, checklist items, rooms OOS |
| Catalog stream | `inventory-store.ts` | 4 HD Supply part stubs (HD-4421, HD-1180, HD-9033, HD-2205) |

**Mandatory inventory gate**: If parts inventory is empty (`inventoryBootstrapRequired()`), parts ordering is blocked (HTTP 409) until at least one part is scanned in.

### Prisma (SQLite)

The Prisma schema has only two models: `User` and `Post` — these are the Freebuff template defaults. **No Job, Part, ServiceRequest, Customer, Booking, or Technician tables exist.** Prisma is not used by any API route or library — all business data flows through the in-memory stores.

---

## API Routes (actual)

### `GET /api` — Platform health

```json
{
  "service": "agent-x",
  "surface": "exo.help_assembly",
  "esa_console": "/console",
  "esa_api": "/api/esa",
  "dashboard": "retired"
}
```

### `GET/POST /api/esa` — ESA Governance Enforcer

**GET**: Returns full console snapshot (deployment, features, agents, governance, security headers, hydration plan).

**POST** `{ action, intent, featureId, enabled, scopes }`:
- `action: "enforce"` → default-deny IAM policy check
- `action: "set_feature"` → enable/disable feature flags (esa.deploy, esa.sync, esa.scan, esa.reorder)
- `action: "verify_iam"` → verify scopes for an operation

### `GET/POST /api/inventory` — Parts Inventory

**GET**: Returns full inventory snapshot (parts, counts, catalog links, stream catalog, service requests).

**POST** `{ action, ... }`:
- `scan_add` / `photo_add` → upsert a part (sku, name, barcode, quantity, imageUrl); returns conversational prompt
- `stream_add` → add part from HD Supply catalog stub by SKU
- `set_quantity` → update part quantity

### `GET/POST /api/parts` — Parts Ordering

**GET**: Returns all parts + `bootstrapRequired` flag.

**POST** `{ sku, quantity }` → `orderPart()` — blocked (409) when inventory is empty. Returns `{ ok, orderId, part }`.

### `GET/POST /api/service-request` — Service Requests

**GET**: Returns all service requests + allowed statuses.

**POST** `{ title, service, partSku, notes, status }` → creates a service request (default: "incomplete_parts").

**POST** `{ action: "set_status", id, status }` → updates request status to completed | incomplete_parts | follow_up.

### `GET /api/jobs` — Daily To-Dos

Compiles service requests into a todo list:

```json
{
  "surface": "daily_todos",
  "ingestion": "detached",
  "counts": { "inProgress": 2, "scheduled": 1, "completed": 3 },
  "jobs": [
    { "id": "SR-xxx", "title": "...", "status": "in_progress|scheduled|completed", ... }
  ]
}
```

### `GET/POST /api/green-shield` — Green Shield Inspection

**GET** `?year=&month=` → calendar month with daily checklist days.

**GET** `?date=YYYY-MM-DD` → single day's checklist.

**POST** `{ action: "toggle", date, itemId }` → toggle checklist item done/undone.

**POST** `{ action: "rooms", date, rooms }` → set out-of-service rooms.

### `POST /api/email-snapshot` — Email Dispatch (AgentMail)

**POST** `{ mode: "alone", context }` → send a single card snapshot to manager.

**POST** `{ mode: "batch" }` → send full EOD snapshot (inventory counts + OOS parts + Green Shield status + service requests complete/missed).

When `AGENTMAIL_API_KEY` is set: delivers via AgentMail REST API.  
When not set: returns stub with payload ready.

---

## Communication: AgentMail

**Path**: Ava (`ava007@agentmail.to`) → Manager (`bmccray02@gmail.com`)

**Implementation**: `lib/esa-email.ts` — `sendViaAgentMail()`:
- REST POST to `https://api.agentmail.to/v0/inboxes/{inboxId}/messages/send`
- Auth: `Bearer AGENTMAIL_API_KEY`
- Fallback: returns `{ delivered: false, transport: "stub" }` when key is unset

**UI**: `SendEmailButtons` component on Parts Card, Service Request Card, and Green Shield Panel — two buttons: "Send alone" (this card) and "Send batch" (full EOD).

---

## Consoles

### ESA Exoskeleton (`/consoles/esa-maintenance`) — "Select Card"

Left sidebar with card navigation:
- **Daily To-Dos** — modal popup (detached `TodaysJobs`, not connected to ESA Ingestion)
- **Parts + Inventory** — `PartsCard`: inventory mode (photo capture, barcode scan, quantity commit) + order mode
- **Service Request** — `ServiceRequestCard`: create + status toggle
- **Green Shield Inspection** — `GreenShieldPanel`: calendar view + daily checklist

Bottom bar: SendEmailButtons, AgentMail address display, mobile parts card link, nav to Help Assembly.

### Help Assembly Console (`/consoles/help-assembly`)

Left: `TodaysJobs` list (compiled from `/api/jobs`).  
Right: `CaptureCTA` → `/capture` + A2UI preview.

### Capture Page (`/capture`)

Image/file upload with camera support → `POST /api/upload` → `A2UIRenderer` with `JobCard`.  
**Known gap**: `/api/upload` route does not exist — the capture page's fetch will fail at runtime.

### Home Page (`/`)

Nav hub: links to ESA Exoskeleton and Help Assembly consoles. Displays AgentMail address.

---

## Deployment

- **Runtime**: Next.js 16 standalone output (`.next/standalone/`)
- **Reverse proxy**: Caddy on port 81 → `localhost:3000`
- **Database**: SQLite file at `db/custom.db`
- **Target**: `ESA.ingeniosity.tech` (per `enforcer.ts` deployment spec)
- **Port**: 3000 (Next.js), 81 (Caddy)

### Environment variables

```bash
# Required for AgentMail email delivery (optional — stub mode when unset)
ESA_AVA_EMAIL=ava007@agentmail.to
ESA_MANAGER_EMAIL=bmccray02@gmail.com
AGENTMAIL_API_KEY=
AGENTMAIL_INBOX_ID=ava007@agentmail.to

# Cloudflare R2 (S3-compatible) for file storage — reserved, not yet wired in API routes
R2_S3_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
```

---

## Known Gaps (honest assessment)

| Gap | Impact | Fix |
|-----|--------|-----|
| No persistence | All data lost on restart | Add real Prisma models (Part, ServiceRequest, ChecklistDay) |
| `/api/upload` missing | Capture page posts to nonexistent route | Implement multipart upload or remove the capture page |
| No authentication | Consoles are fully public | Wire `next-auth` (already installed, unused) |
| In-memory inventory only | Inventory resets on every deploy | Swap `Map` for Prisma-backed store |
| Prisma schema is starter-only | User/Post models, no business tables | Add Job, Part, ServiceRequest, ChecklistDay, Booking models |
| TypeScript errors suppressed | `next.config.ts` has `ignoreBuildErrors: true` | Fix the errors, remove the flag |
| No `/api/sms` or phone path | No inbound/outbound SMS | Wire Twilio or remove all SMS references from docs |
| `capture/page.tsx` UI is incomplete | References `A2UI JobCard` from missing `/api/upload` | Fix endpoint or redirect to PartsCard's photo capture |
| No test framework | No automated verification | Add Vitest + a few integration tests |
| R2 vars defined but unused | Cloudflare R2 storage env vars have no consumer | Wire into an `/api/upload` file-storage implementation |

---

## Related docs

- [Agent-X Capability Spec](../exoskeleton/Agent-X-Capability.md) — canonical Agent-X identity and boundaries
- [A2A Agent Card (Appless)](../exoskeleton/A2A-Agent-Card-Appless.md) — VCard schema and appless gateway
- [ESA Exoskeleton SKILL.md](../../esa-exoskeleton/SKILL.md) — web console module registry
- [Service Broadcast Cards](../../esa-exoskeleton/docs/service-broadcast-cards.md) — InvPartsCard-B / Ptac-B docs
- [Build Guide](./BUILD-AND-DEPLOY-GUIDE.md) — build + deploy steps (Render)
- [Worker Infrastructure](./WORKER-INFRASTRUCTURE-COMPLETE.md) — worker/service architecture