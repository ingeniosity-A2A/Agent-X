# Twilio SMS + WhatsApp Quickstart (Minimal)
Runtime anchor: quantum-membrain

> Canonical Governance Notice
> Read authoritative docs first:
> - VOLUME-I-BEEP-TEKTON-CORE-PRODUCTION.md
> - VOLUME-II-AVA007-CONVERGENCE-ARCHITECTURE.md
> - VOLUME-III-BEEP-ADVANCED-INTELLIGENCE-INFRASTRUCTURE.md
> - CAPABILITY-TRUTH-MATRIX.md

Goal: get SMS and WhatsApp replies working immediately with minimal setup.

## Option A (fastest): TwiML Bin

1. In Twilio Console, create a TwiML Bin.
2. Paste this XML for SMS:

```xml
<Response>
  <Message>📡 HelpAssembly: Message received. Reply STOP to opt out.</Message>
</Response>
```

3. Attach the TwiML Bin URL to your Twilio phone number Messaging webhook (HTTP POST).
4. Test SMS by texting your number.

If using your hosted app instead of a TwiML Bin, set webhook URL to:

`https://helpassembly.com/api/gateway/messages`

For WhatsApp Sandbox, use this XML:

```xml
<Response>
  <Message>🟢 HelpAssembly WhatsApp: Connected successfully.</Message>
</Response>
```

Then set the Sandbox "When a message comes in" webhook to the same TwiML Bin URL and test from WhatsApp.

## Option B (server webhook in this repo)

Use this route for both SMS and WhatsApp webhooks:

- `/api/gateway/messages` (POST)

What it does:
- Replies to SMS with: "📡 HelpAssembly: Message received. Reply STOP to opt out."
- Replies to WhatsApp with: "🟢 HelpAssembly WhatsApp: Connected successfully."
- Handles `STOP` and `START` in a minimal way.

### Required Twilio request fields

Twilio sends fields like:

```txt
From=+14045551234
To=+14044391350
Body=Hello
MessageSid=SMxxxxxxxx
```

For WhatsApp, `From` and `To` are prefixed with `whatsapp:`.

### Local/hosted sanity check

Open the route in a edge-client:
- `GET /api/gateway/messages`

You should receive gateway status JSON.

For quick TwiML-only smoke tests, `/api/twilio/inbound` remains available as a minimal ack route.

## Next step after quickstart

Once both channels are confirmed, replace TwiML Bin with this repo webhook to add:
- user/account routing
- automation flows
- AI response logic
- integration with dialer routing layer
