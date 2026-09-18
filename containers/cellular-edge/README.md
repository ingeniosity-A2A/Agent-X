# cellular-edge — active cellular execution

**Owns:** Onomondo SoftSIM, nRF91 / NCS runtime, LTE-M / NB-IoT attach, connectivity receipts.

**Skill definition (firmware contract):** `../../skills/onomondo-ncs/`  
**Hub routing:** Ava007-Omni-OS Omnibus (intent in, receipt out)  
**Not here:** srsRAN/gNB (→ fapo-ran), Telnyx (→ telecom-gateway), ADB phone bridge (→ Omni bridge)

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

`skills/registry.json` → `onomondo-ncs` provides `cellular.softsim.cli`, execution_surface Agent-X.
