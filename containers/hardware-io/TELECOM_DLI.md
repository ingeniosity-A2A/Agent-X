# Utilize Omnibus Telecom DLI

Policy intelligence (JCAS, identity rotation triggers, ephemeral logs) lives in:

**`Ava007-Omni-OS/Omnibus/skills/telecom-dli/`**

This container supplies **modem AT / USB serial harness** execution when Omnibus routes:

- `telecom.rotate_identity`
- `telecom.purge_logs` (if device-local)
- backhaul selection AT side-effects

Do not re-implement DLI policy here — import or call via Omnibus hub.
