#!/usr/bin/env python3
"""Local architectural boundary verifier for Agent-X.

This is intentionally executable from Freebuff/Termux/Ubuntu. It is not CI.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SCAN_ROOTS = [ROOT / "src", ROOT / "esa-exoskeleton"]
FORBIDDEN = re.compile(r"cognitive_state|CognitiveState|chain_of_thought|(^|[^A-Za-z])reasoning([^A-Za-z]|$)")


def main() -> int:
    violations: list[str] = []
    for base in SCAN_ROOTS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or ".git" in path.parts or "node_modules" in path.parts:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            for number, line in enumerate(text.splitlines(), 1):
                if FORBIDDEN.search(line):
                    violations.append(f"{path.relative_to(ROOT)}:{number}: {line.strip()}")
    if violations:
        print("AGENT-X BOUNDARY VIOLATIONS")
        print("\n".join(violations))
        return 1
    print("Agent-X boundary: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
