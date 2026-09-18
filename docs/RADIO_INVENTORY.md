# Radio inventory → correct repo

**Organized 2026-09-17.** No deletes; ownership is binding.

## Map

| Asset | Current location | Correct owner | Action |
|-------|------------------|---------------|--------|
| Onomondo + NCS skill/firmware | `Agent-X/skills/onomondo-ncs/` | **Agent-X** skill + `containers/cellular-edge/` execution | **KEEP** — already correct repo |
| SoftSIM CLI / nRF91 runtime | skill `scripts/` | **Agent-X** `containers/cellular-edge/` | Bind scripts here; skill stays definition |
| ADB / S26 / ASIMCA / Onomondo QR | `Ava007-Omni-OS` bridge + scripts | **Omnibus hub** (comms) | **KEEP** — not a driver stack |
| FAPO / srsRAN / SafetyEnvelope | `fapo-ran/` | **fapo-ran** only | **KEEP** |
| `QAG-MemBrain/skills/telecom/*` | MemBrain | **Legacy extract → Omnibus** | Do not run as live radio; promote policy ideas only |
| Telnyx | (if any) | **Agent-X** `containers/telecom-gateway/` | Home any new Telnyx code here |
| SX1262 / CC1101 / LoRa drivers | (sparse) | **Agent-X** `containers/rf-edge/` | Home here |
| USB serial / Termux modem I/O | (sparse) | **Agent-X** `containers/hardware-io/` | Home here |
| Non-gNB SDR tools | (sparse) | **Agent-X** `containers/sdr-edge/` | Home here; gNB SDR stays fapo-ran |
| Cloudflare tunnel | (sparse) | **Agent-X** `containers/edge-tunnel/` | Home here |

## Active radio runtime homes

```text
Agent-X
├── skills/onomondo-ncs/          # firmware definition (OK)
└── containers/
    ├── cellular-edge/            # Onomondo / nRF91 / NCS EXECUTION
    ├── hardware-io/              # USB serial / modem I/O
    ├── rf-edge/                  # LoRa / SX1262 / CC1101
    ├── sdr-edge/                 # user SDR (not gNB)
    ├── telecom-gateway/          # Telnyx etc.
    └── edge-tunnel/              # Cloudflare

fapo-ran/                         # RAN only
Ava007-Omni-OS/                   # hub + ADB bridge only
QAG-MemBrain/skills/telecom/      # LEGACY source only
```

## Rule

> Skill definition can live under `skills/`. Hardware execution lives under `containers/*`. Hub routes. RAN is fapo-ran. MemBrain is not live radio.
