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
role: connectivity-muscle
layer: capability-firmware
not: intellect
owner: Agent-X / Exoskeleton connectivity surface
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

**Muscles, not brain.** Ava emits Intent. This skill attaches the radio path.

## What it does

- Configures **nRF Connect SDK** cellular stack for LTE-M / NB-IoT (nRF91-series)
- Uses **Onomondo SoftSIM** as carrier layer (software SIM, strategic autonomy)
- SoftSIM operations are **CLI-path** (not dashboard theater)
- Emits a **connectivity receipt** (artifact) so the framework treats work as real

## What it does not do

- Does not invent carrier authority without provisioned SoftSIM
- Does not live inside AVA-007 intellect repo as implementation body
- Does not replace Core-Membrain or GSAP temporal kernel

## Layers

| Path | Role |
|------|------|
| `SKILL.md` | This brain — triggers + constraints |
| `config/prj.conf` | NCS Kconfig tokens for Onomondo path |
| `scripts/` | Build / mock / receipt actions (CLI) |
| `references/` | Lazy manuals — load only when skill active |

## Human gates

1. Confirm Onomondo account / SoftSIM entitlement before live attach
2. Confirm target device identity before flash
3. Verify link status before claiming uplink success

## Artifact rule

If no file is written under the skill output path, **no real work** occurred.
