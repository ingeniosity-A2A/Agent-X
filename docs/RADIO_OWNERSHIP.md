# Radio / Telecom Ownership — Fixed

**Rule:** Ava007 knows *what* capability exists. It does **not** contain physical-radio implementation.

| Capability | Repo | Runtime container |
|------------|------|-------------------|
| Intelligence / orchestration | Cybernetic-Ava007 | ava007-core |
| Cellular hardware (Onomondo, nRF91, NCS) | **Agent-X** | `containers/cellular-edge/` |
| USB modem / serial | **Agent-X** | `containers/hardware-io/` |
| SX1262 / CC1101 / LoRa | **Agent-X** | `containers/rf-edge/` |
| SDR adapters | **Agent-X** | `containers/sdr-edge/` |
| Telnyx SMS/MMS/Voice | **Agent-X** | `containers/telecom-gateway/` |
| Cloudflare Tunnel | **Agent-X** | `containers/edge-tunnel/` |
| srsRAN / gNB / FAPO | **fapo-ran** | ran-stack |
| Connectivity memory / policy / receipts | **QAG-MemBrain** | connectivity-memory |

```text
Cybernetic-Ava007
        │ capability contract (A2A)
        ├──────────────┬──────────────┐
        ▼              ▼              ▼
   Agent-X          fapo-ran      QAG-MemBrain
   edge execution   RAN stack     memory/policy
```

Skill firmware (e.g. `skills/onomondo-ncs/`) stays as **definition**.  
Hardware execution moves under `containers/*-edge/`.
