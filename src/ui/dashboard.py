"""
RETIRED — SIF AVA007 on-device dashboard.

Agent-X is the Help Assembly Exoskeleton execution surface + experimental
sandbox. It is NOT Cybernetic Ava007 and must not host an Ava identity UI.

Operator configuration for ESA Inventory lives in the platform Console:
  platform/src/app/consoles/esa-maintenance → Select Card
  platform/src/app/api/esa/route.ts  →  /api/esa

Do not reintroduce a general-purpose dashboard here.
"""

from __future__ import annotations

import sys


def main() -> None:
    print(
        "src/ui/dashboard.py is retired.\n"
        "Use ESA Exoskeleton (/consoles/esa-maintenance) for Select Card.\n"
        "See platform/src/lib/enforcer.ts and docs/exoskeleton/.",
        file=sys.stderr,
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
