# cellular-edge — cellular **execution** (not ownership)

**Owns nothing in the Telecom Plane.**  
**Canonical owner:** Ava007-Omni-OS `capabilities/telecom/`.

**Executes:** Onomondo SoftSIM, nRF91 / NCS runtime, LTE-M / NB-IoT attach, connectivity receipts — when Omni-OS / Omnibus routes the work.

**Skill definition (firmware contract):** `../../skills/onomondo-ncs/`  
**Hub routing:** Ava007-Omni-OS Omnibus (intent in, receipt out)  
**Not here:** srsRAN/gNB (→ fapo-ran), Telnyx policy (→ Omni-OS SIP contracts + telecom-gateway execution), ADB phone bridge (→ Omni bridge), subscriber/PLMN/SIP policy (→ Omni-OS)

## Bindings

| Path | Role |
|------|------|
| `skills/onomondo-ncs/SKILL.md` | Triggers, constraints, gates |
| `skills/onomondo-ncs/config/` | NCS Kconfig tokens |
| `skills/onomondo-ncs/scripts/` | CLI build / mock / receipt (execution entry) |
| `skills/onomondo-ncs/references/` | Lazy manuals |

Execution mode: `mock` (no modem) or `device` (flash + SoftSIM).  
Artifact rule: no file under skill output path → no real work.

## Registry

`skills/registry.json` → `onomondo-ncs` provides `cellular.softsim.cli`, execution_surface Agent-X, **policy_surface Omni-OS telecom.plane**.
