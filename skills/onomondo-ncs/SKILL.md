---
name: onomondo-ncs
version: 0.1.0
status: firmware-scaffold
trigger:
  - device-connect
  - softsim-attach
  - lte-m-uplink
  - nb-iot-telemetry
  - iot-gateway-status
role: connectivity-firmware
layer: capability-firmware
not: intellect
owner: Cybernetic-Ava007 (firmware intelligence) / Agent-X (execution adapter)
requires:
  - nRF Connect SDK (NCS) toolchain on build host
  - Onomondo SoftSIM credentials (operator-provisioned)
  - nRF91-class hardware for live radio
runtime_modes:
  - mock: local validation without modem
  - device: flash + SoftSIM OTA via Onomondo
outputs:
  - artifact: must write connectivity receipt under artifacts/out/
boundary: no-artifact-no-work
---

# Onomondo + NCS — Connectivity Firmware

**Firmware, not brain replacement.** The authoritative skill intelligence belongs to Cybernetic-Ava007. Ava emits Intent; the Exoskeleton mounts and transports the firmware contract; Agent-X supplies the world-facing connectivity execution adapter.

## What it does

- Configures **nRF Connect SDK** cellular stack for LTE-M / NB-IoT (nRF91-series)
- Uses **Onomondo SoftSIM** as carrier layer (software SIM, strategic autonomy)
- SoftSIM operations are **CLI-path** (not dashboard theater)
- Emits a **connectivity receipt** (artifact) so the framework treats work as real

## What it does not do

- Does not invent carrier authority without provisioned SoftSIM
- Does not move Ava007 intelligence into Agent-X
- Does not replace Core-Membrain or GSAP temporal kernel
- Does not become runtime orchestration or device-wide authority

## Layers

| Path | Role |
|------|------|
| `SKILL.md` | Ava007 firmware intelligence: triggers + constraints |
| `config/prj.conf` | NCS Kconfig tokens for Onomondo path |
| `scripts/` | Agent-X execution/build/mock/receipt actions (CLI) |
| `references/` | Lazy manuals — load only when skill active |

## Human gates

1. Confirm Onomondo account / SoftSIM entitlement before live attach
2. Confirm target device identity before flash
3. Verify link status before claiming uplink success

## Artifact rule

If no file is written under the skill output path, **no real work** occurred.
