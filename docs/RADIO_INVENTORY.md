# Radio inventory → correct repo

## Telecom Plane (canonical)

| Asset | Active path |
|-------|-------------|
| **Telecom Plane (state + policy + identity)** | **`Ava007-Omni-OS/capabilities/telecom/`** |
| **Telecom DLI full package** | **`Ava007-Omni-OS/Omnibus/skills/telecom_dli/`** |
| Provenance (DLI) | `QAG-MemBrain/skills/telecom/` |
| Hardware / carrier harness | Agent-X containers below (execution only) |

## Agent-X execution surfaces (not ownership)

| Asset | Path | Role |
|-------|------|------|
| Onomondo / NCS / SoftSIM | `skills/onomondo-ncs` + `containers/cellular-edge` | Execute under Omni-OS policy |
| Modem AT / USB | `containers/hardware-io` | Execute |
| Telnyx API | `containers/telecom-gateway` | Execute |
| Tunnel ops | `containers/edge-tunnel` | Execute |
| RF / SDR (non-gNB) | `containers/rf-edge`, `sdr-edge` | Execute |

## Other

| Asset | Correct owner |
|-------|---------------|
| RAN / FAPO / srsRAN | fapo-ran |
| ADB / ASIMCA bridge | Ava007-Omni-OS |
| Hub routing | Omnibus |
