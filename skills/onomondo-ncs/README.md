# onomondo-ncs (Skill-as-Firmware)

Connectivity **muscle** for Ava007 Exoskeleton surface.
**Onomondo SoftSIM is CLI-path only.**

```bash
# lab (no modem)
python3 scripts/mock_connect.py
bash scripts/check_env.sh

# device (NCS + nRF91 + SoftSIM entitlement)
# 1. west init/update NCS workspace
# 2. merge config/prj.conf into app
# 3. SoftSIM via Onomondo CLI / vendor west packages
# 4. west build && west flash
```
