# Utilize Omni-OS Telecom Plane + DLI

Policy intelligence (JCAS, identity rotation triggers, ephemeral logs) lives in:

**`Ava007-Omni-OS/Omnibus/skills/telecom_dli/`**  
**Canonical Telecom Plane:** **`Ava007-Omni-OS/capabilities/telecom/`**

This container supplies **modem AT / USB serial harness** execution when Omnibus routes:

- `telecom.dli.rotate_identity` / `telecom.rotate_identity`
- `telecom.dli.purge_logs` (if device-local)
- backhaul selection AT side-effects

Do not re-implement DLI policy or Telecom Plane state here — import or call via Omnibus hub / Omni-OS interfaces.
