# HelpAssembly Deployment Guide

> Canonical Governance Notice
> Read authoritative docs first:
> - docs/VOLUME-I-BEEP-TEKTON-CORE-PRODUCTION.md
> - docs/VOLUME-II-AVA007-CONVERGENCE-ARCHITECTURE.md
> - docs/VOLUME-III-BEEP-ADVANCED-INTELLIGENCE-INFRASTRUCTURE.md
> - docs/CAPABILITY-TRUTH-MATRIX.md

Complete deployment skeleton for HelpAssembly using a Next.js host, Supabase, and Twilio.

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] GitHub repo created and pushed
- [ ] Supabase project created
- [ ] Twilio account set up with phone number
- [ ] Domain registered (helpassembly.com)

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### 1. **Supabase Setup** (5 min)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. In SQL Editor, run the schema from `/sql/deployment-schema.sql`
4. Create a storage bucket named `uploads` (make it public)
5. Go to Settings → API keys and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. **Twilio Setup** (5 min)

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number (SMS capable)
3. In Console, copy:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER` (your assigned number)
4. **Skip A2P for now** (use standard SMS; add A2P later for production scale)

### 3. **Deploy Next.js App** (10 min)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Initial HelpAssembly deployment"
   git push origin main
   ```

2. Deploy this repository on your Next.js hosting platform
3. In Environment Variables, add all keys needed by the app runtime:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=...
   BASE_URL=https://www.helpassembly.com
   NEXT_PUBLIC_BASE_URL=https://www.helpassembly.com
   ```
4. Deploy and wait for first successful Next.js build

### 5. **Domain Configuration** (5 min)

1. Point `www.helpassembly.com` DNS to your deployed Next.js app
2. Ensure TLS is active
3. Wait for DNS propagation (typically <1 hour)

### 5.1 **DNS Automation via Cloudflare API** (optional)

Use the repo helper to create or update DNS records from CLI without storing secrets in source code.

```bash
export CLOUDFLARE_API_TOKEN="<cloudflare-token-with-zone-dns-edit>"
export CLOUDFLARE_ZONE_NAME="helpassembly.com"

# Apex record
npm run dns:upsert -- --name helpassembly.com --type CNAME --content <your-nextjs-hostname> --proxied true

# WWW record
npm run dns:upsert -- --name www.helpassembly.com --type CNAME --content <your-nextjs-hostname> --proxied true

# Verify
npm run dns:list -- --type CNAME
```

Security note: keep the token in environment variables (or GitHub Secrets/CI secrets only). Never commit tokens to the repository.

### 6. **Twilio Webhook Setup** (2 min)

1. In Twilio Console → Phone Numbers → Your Number
2. Scroll to "Messaging"
3. Set Webhook URL:
   ```
   https://www.helpassembly.com/api/gateway/messages
   ```
   (unified gateway route)
4. Select HTTP POST
5. Save

---

## 🔄 LIVE FLOW

1. **User texts number** → `+1 (your Twilio number)`
2. **Twilio hits `/api/sms`** → Webhook receives SMS
3. **System generates link** → `https://helpassembly.com/capture?sid={uuid}`
4. **User gets reply** → "Upload your item: [link]"
5. **User uploads image** → File → Supabase storage
6. **Job created** → `jobs` table in Supabase
7. **Status appears** → Dashboard updates in real-time

---

## 📊 TESTING

### Test SMS Flow
```bash
# Send test SMS to your Twilio number
# You should get: "Upload your item: https://helpassembly.com/capture?sid=..."
```

### Test Upload Flow
1. Go to `https://helpassembly.com/capture`
2. Select an image
3. Click "Submit"
4. You should see a success screen with a Job ID

### Check Dashboard
- Visit `https://helpassembly.com/dashboard`
- Should list all uploaded jobs

### Monitor Events
- In Supabase → SQL Editor
- Run: `SELECT * FROM events ORDER BY created_at DESC LIMIT 10;`
- Should see SMS inbound events logged

---

## 🔑 ENVIRONMENT VARIABLES

| Variable | Source | Example |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API | (public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API | (private key) |
| `TWILIO_ACCOUNT_SID` | Twilio Console | `ACxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Console | (secret token) |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Numbers | `+1234567890` |
| `BASE_URL` | Set in your Next.js host config | `https://www.helpassembly.com` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Tokens | token scoped to DNS edit for target zone |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone settings | `32-char zone id` |

---

## ⚠️ PRODUCTION READINESS

### Immediate Next Steps (After Go-Live)

1. **A2P 10DLC Registration** (2-3 days)
   - Prevents carrier blocking of SMS
   - Required if sending >100 SMS/day
   - Twilio → Compliance → Messaging

2. **Job Assignment Logic**
   - Update `lib/ava.ts` with real routing
   - Replace `assigned: "auto-tech-1"` with actual fleet logic

3. **Outbound Confirmations**
   - Use `sendSMS()` from `lib/twilio.ts`
   - Send confirmation when job is assigned
   - Send alert when job is updated

4. **Authentication**
   - Add auth via Supabase Auth or NextAuth
   - Protect `/dashboard` route
   - Add user sessions

5. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor SMS costs
   - Track job conversion rates

---

## 🎯 QUOTA / LIMITS

| Resource | Limit | Cost |
|----------|-------|------|
| Supabase Free | 500 MB storage, 1 GB bandwidth | Free, then $5/mo |
| Next.js host | Provider-specific | Provider pricing |
| Twilio SMS | ~$0.0075 per SMS | Pay-as-you-go |
| Domain | Annual | ~$10-15 |

---

## 🔗 QUICK LINKS

- [Supabase Docs](https://supabase.com/docs)
- [Twilio Messaging Docs](https://www.twilio.com/docs/sms)
- [Next.js Docs](https://nextjs.org/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/edge-client/building-your-application/deploying)

---

## 💰 REVENUE ACTIVATION

Once deployed:
- Job quotes flow through system
- User accepts quote → SMS confirmation
- Schedule pickup/appointment
- Charge & fulfill
- Loop: Repeat

---

## 🚨 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| SMS not received | Check Twilio webhook URL in console |
| Upload fails | Check Supabase storage bucket is public |
| Domain not resolving | Wait 15 min for DNS propagation |
| Env vars not loading | Verify in your Next.js host environment settings |
| Job not appearing | Check Supabase connection in `/lib/supabase.ts` |

---

**❗ You are now live. Monitor your dashboard and respond to inquiries. Celebrate.**
