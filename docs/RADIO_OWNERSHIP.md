# Radio / Telecom Ownership

**Canonical Telecom Plane owner: Ava007-Omni-OS** (`capabilities/telecom/`).

Ava007 issues intent. Omnibus routes. **Omni-OS owns state, policy, and multi-layer identity.**  
**Agent-X executes hardware and carrier API side-effects only.**

| Capability | Active owner | Agent-X role |
|------------|--------------|--------------|
| Telecom Plane (SIM/eSIM, modem, PLMN, APN, bearer, interfaces, overlay, egress, SIP/DID, health/policy) | **Ava007-Omni-OS** `capabilities/telecom/` | Consume interfaces |
| Telecom DLI (JCAS, rotation, backhaul, ephemeral log) | **Omni-OS** `Omnibus/skills/telecom_dli/` | Execute harness when routed |
| Cellular SoftSIM / Onomondo / nRF91 | Omni-OS policy | **Execution** `containers/cellular-edge/` |
| USB serial / modem I/O | Omni-OS policy | **Execution** `containers/hardware-io/` |
| LoRa / SX1262 / CC1101 | Omni-OS / radio intents | **Execution** `containers/rf-edge/` |
| SDR adapters (non-gNB) | Omni-OS / radio intents | **Execution** `containers/sdr-edge/` |
| Telnyx / carrier SIP API | Omni-OS SIP contracts | **Execution** `containers/telecom-gateway/` |
| Cloudflare Tunnel | Omni-OS edge policy | **Execution** `containers/edge-tunnel/` |
| RAN / srsRAN / FAPO | **fapo-ran** only | — |
| ADB / ASIMCA phone bridge | **Omni-OS** `ava007_bridge.py` | — |
| Skill/contract promotion | **Omnibus** | — |
| Historical RF/telecom research | **QAG-MemBrain** (read-only) | — |

## Rules

1. Agent-X **must not** define competing subscriber / PLMN / SIP / transport policy.
2. Agent-X containers report facts and perform authorized side-effects; Omni-OS synthesizes state.
3. Identity layers remain distinct (see Omni-OS `capabilities/telecom/IDENTITY_MODEL.md`).
4. Intelligence does **not** belong in Agent-X merely because Agent-X executes it.
