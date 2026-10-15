# Agent-X Telnyx Call Control

This service is the execution boundary for Ava007's Orbit Dialer. It performs
Telnyx Call Control requests; the Cybernetic Ava007 UI/API must not hold the
Telnyx API key or execute PSTN actions directly.

## Environment on the Agent-X host

Set the following in the service's secret environment:

- `TELNYX_API_KEY` — Telnyx API key
- `TELNYX_FROM_NUMBER` — caller ID in E.164 format
- `TELNYX_CONNECTION_ID` — Telnyx Call Control connection / application ID
- `AGENT_X_VOICE_TOKEN` — a random service-to-service bearer token
- Optional: `AGENT_X_VOICE_HOST` (defaults to `127.0.0.1`) and
  `AGENT_X_VOICE_PORT` (defaults to `8081`)

Generate a token on each host with `openssl rand -hex 32`. Use separate values
for `AGENT_X_VOICE_TOKEN` and the browser-facing `VOICE_DIALER_TOKEN`; do not
reuse the same token across the two trust boundaries.

## Run

From the Agent-X repository root:

```bash
python3 -m src.voice_call_server
```

The service binds to loopback by default. If Omni-OS runs on the same machine,
configure its environment with:

```text
AGENT_X_VOICE_URL=http://127.0.0.1:8081
AGENT_X_VOICE_TOKEN=<same secret as Agent-X>
VOICE_DIALER_TOKEN=<separate browser-to-Omni-OS secret>
```

If the services run on different machines, expose port 8081 only through a
**private Tailscale Serve** endpoint and set `AGENT_X_VOICE_URL` to that
HTTPS MagicDNS URL on the Omni-OS host. Check `tailscale serve status` before
changing Serve configuration. Do not use Tailscale Funnel or a public
Cloudflare Tunnel for this call-control service.

## API

- `GET /healthz` — presence-only configuration status
- `POST /api/voice/dial` — `{"to":"+14045550123"}`
- `POST /api/voice/hangup` — `{"call_control_id":"..."}`

Dial and hangup require `Authorization: Bearer <AGENT_X_VOICE_TOKEN>`.
The service validates E.164 destinations and call-control IDs. Telnyx's
response means the request was accepted; it does not prove the call's audio
media is connected. No call-state webhook synchronization or browser audio
media transport is implemented by this service.

## Verify without placing a call

```bash
python3 -m unittest discover -s tests -p 'test_voice_call_server.py'
```

The tests mock the Telnyx API. They do not place a real call.
