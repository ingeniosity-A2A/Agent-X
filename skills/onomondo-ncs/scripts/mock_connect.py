#!/usr/bin/env python3
"""Mock Onomondo/NCS connectivity muscle — runs without modem.

Produces a connectivity receipt so the Artifact Boundary is satisfied in lab mode.
Live SoftSIM + nRF91 requires NCS west toolchain + Onomondo CLI entitlement + hardware.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("ONOMONDO_OUT", ROOT / "artifacts" / "out"))
OUT.mkdir(parents=True, exist_ok=True)


def main() -> int:
    mode = os.environ.get("ONOMONDO_MODE", "mock")
    ts = time.time_ns()
    receipt = {
        "skill": "onomondo-ncs",
        "mode": mode,
        "status": "ok" if mode == "mock" else "pending_device",
        "carrier": "onomondo",
        "sim": "softsim",
        "path": "cli",
        "stack": "nrf-connect-sdk",
        "bands": ["LTE-M", "NB-IoT"],
        "message": (
            "Mock attach complete. No physical modem in this environment. "
            "For device mode: Onomondo SoftSIM CLI + west build + flash nRF91."
        ),
        "timestamp_ns": ts,
        "artifact_boundary": "satisfied",
    }
    path = OUT / f"onomondo_receipt_{ts}.json"
    path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"receipt": str(path), **receipt}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
