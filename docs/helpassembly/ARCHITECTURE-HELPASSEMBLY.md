# HelpAssembly System Architecture

> Canonical Governance Notice
> Read authoritative docs first:
> - docs/VOLUME-I-BEEP-TEKTON-CORE-PRODUCTION.md
> - docs/VOLUME-II-AVA007-CONVERGENCE-ARCHITECTURE.md
> - docs/VOLUME-III-BEEP-ADVANCED-INTELLIGENCE-INFRASTRUCTURE.md
> - docs/CAPABILITY-TRUTH-MATRIX.md

Production-ready skeleton for autonomous item assessment and quoting platform.

---

## 📐 SYSTEM ARCHITECTURE

```
User (SMS)
   ↓
Twilio (SMS Gateway)
   ↓
/api/sms (Route Handler)
   ↓ Storage → Supabase Storage
/api/upload (Image Processing)
   ↓
events table (Audit Log)
   ↓
jobs table (Job Status)
   ↓
/dashboard (Real-time Display)
```

---

## 🗂️ FILE STRUCTURE

```
app/
├── page.tsx              # Home (landing page)
├── capture/page.tsx      # Capture page (user uploads image)
├── dashboard/page.tsx    # Dashboard (view jobs)
└── api/
    ├── sms/route.ts      # Twilio webhook (inbound SMS)
    ├── upload/route.ts   # File upload handler
    ├── job/route.ts      # Job operations (GET/POST)
    └── [other routes]    # Existing dispatch systems

lib/
├── supabase.ts           # Supabase client
├── twilio.ts             # Twilio SMS client
├── ava.ts                # Job processing (AVA v1)
└── tashi.ts              # Advanced routing (optional)

components/
├── A2UIRenderer.tsx      # Dynamic component renderer
├── JobCard.tsx           # Job display component
└── CaptureCTA.tsx        # Call-to-action button

sql/
└── deployment-schema.sql # Supabase schema
```

---

## 🔧 CORE FUNCTIONS

### `lib/supabase.ts`
- Initializes Supabase client with service role key
- Used for all DB reads/writes
- Access pattern: `supabase.from('table').select()`

### `lib/twilio.ts`
- Initializes Twilio client
- `sendSMS(to, message)` - Send outbound SMS
- Used in confirmation workflows

### `lib/ava.ts`
- `processJob(job)` - Business logic for job routing
- Returns: `{ assigned, quote, status }`
- Replace with real logic for fleet assignment

### `lib/tashi.ts`
- `submit_to_tashi(event)` - Optional advanced routing
- Placeholder for future ML/routing service
- Currently logs events

---

## 📡 API ROUTES

### `POST /api/sms`
**Triggered by:** Twilio webhook on inbound SMS

**Flow:**
1. Receives SMS from user (From, Body)
2. Generates unique session ID
3. Logs to `events` table
4. Returns XML response with capture link
5. Twilio sends SMS back to user

**Request:**
```
From: +1234567890
Body: Hello
```

**Response:**
```xml
<Response>
  <Message>Upload your item: https://helpassembly.com/capture?sid=uuid</Message>
</Response>
```

---

### `POST /api/upload`
**Triggered by:** Client-side form submission

**Flow:**
1. Receives file from `capture/page.tsx`
2. Uploads to Supabase storage
3. Creates job record in `jobs` table
4. Returns jobId to client

**Request:**
```
FormData {
  file: File
  sid?: string (optional session ID)
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "pending"
}
```

---

### `POST /api/job`
**Triggered by:** Dashboard when user updates job

**Flow:**
1. Receives job action (e.g., "assign")
2. Calls `processJob()` from AVA
3. Updates job record in DB
4. Submits to Tashi if enabled
5. Returns updated job

**Request:**
```json
{
  "jobId": "uuid",
  "action": "assign"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "assigned",
  "assigned": "auto-tech-1",
  "quote": 75
}
```

---

### `GET /api/job?id=uuid`
**Triggered by:** Dashboard for single job details

**Response:**
```json
{
  "id": "uuid",
  "status": "assigned",
  "image_url": "filename",
  "assigned": "tech-1",
  "quote": 75,
  "created_at": "2026-05-01T12:00:00Z"
}
```

---

## 🎨 COMPONENTS

### `A2UIRenderer`
Dynamically renders components based on configuration.

**Usage:**
```tsx
<A2UIRenderer node={{ 
  component: "JobCard", 
  data: { id, status, imageUrl } 
}} />
```

### `JobCard`
Displays job status, image, assigned tech, quote.

**Props:**
```tsx
{
  id: string
  status: string
  imageUrl: string
  assigned?: string
  quote?: number
  createdAt?: string
}
```

### `CaptureCTA`
Button that routes to capture page.

---

## 📊 DATABASE SCHEMA

### `jobs` Table
```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY,
  status text DEFAULT 'pending',
  image_url text,
  assigned text,
  quote numeric,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

**Status values:**
- `pending` - Waiting for processing
- `assigned` - Assigned to technician
- `completed` - Job finished
- `cancelled` - Job cancelled

### `events` Table
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  type text,
  payload jsonb,
  created_at timestamp DEFAULT now()
);
```

**Event types:**
- `sms_inbound` - Inbound SMS received
- `upload_complete` - File uploaded
- `job_created` - New job added
- `job_assigned` - Job assigned to tech
- `job_completed` - Job finished

---

## 🔐 SECURITY NOTES

1. **Service Role Key** - Only server-side in API routes
2. **Public URL** - Can be used in client (supabase.js handles this)
3. **Storage** - Bucket is public but files are UUID'd (hard to guess)
4. **Twilio Webhook** - Verify signature in production (TODO)
5. **Auth** - None yet (consider Supabase Auth or NextAuth)

---

## 🚦 ENV VARIABLES QUICK REF

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Required for Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Application Config
BASE_URL=https://helpassembly.com
```

---

## 🎯 COMMON MODIFICATIONS

### Add real job assignment logic
Edit `lib/ava.ts`:
```typescript
export function processJob(job: any) {
  // Replace with real fleet routing
  const technicianId = assignToNearestTech(job.location)
  return {
    assigned: technicianId,
    quote: calculateQuote(job),
    status: 'assigned'
  }
}
```

### Add outbound SMS confirmation
Edit `app/api/job/route.ts`:
```typescript
import { sendSMS } from '@/lib/twilio'

await sendSMS(phone, `Job assigned to ${tech.name}`)
```

### Add email notifications
Install `nodemailer` or use SendGrid:
```typescript
await sendEmail(user.email, 'Job Status Update', template)
```

---

## 🧪 TESTING CHECKLIST

- [ ] Text phone number, receive capture link
- [ ] Upload image on capture page
- [ ] See job appear on dashboard
- [ ] Click job to view details
- [ ] Assign job (if logged in)
- [ ] Monitor events table in Supabase

---

**For full deployment steps, see [DEPLOYMENT-HELPASSEMBLY.md](./DEPLOYMENT-HELPASSEMBLY.md)**
