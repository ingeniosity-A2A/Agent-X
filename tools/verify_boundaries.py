#!/usr/bin/env python3
"""Local architecture boundary verifier for Agent-X.

This is intentionally repo-local and executable from Freebuff/Termux/Ubuntu.
It does not use GitHub Actions or any hosted CI service.

The verifier checks executable Agent-X surfaces for legacy cognitive-state
transport fields. Architecture documentation may discuss cognition and is not
part of this runtime scan.
"""

from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
RUNTIME_ROOTS = (
    ROOT / "src",
    ROOT / "esa-exoskeleton" / "public",
    ROOT / "platform" / "src",
)
EXTENSIONS = {".py", ".js", ".ts", ".tsx", ".java"}
FORBIDDEN = (
    re.compile(r"\bcognitive_state\b"),
    re.compile(r"\bCognitiveState\b"),
    re.compile(r"\bchain_of_thought\b"),
    re.compile(r"\bcot\b", re.IGNORECASE),
)
SELF = Path(__file__).resolve()


def iter_runtime_files():
    seen: set[Path] = set()
    for base in RUNTIME_ROOTS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path in seen or path == SELF or not path.is_file():
                continue
            if ".git" in path.parts or "node_modules" in path.parts:
                continue
            if path.suffix.lower() not in EXTENSIONS:
                continue
            seen.add(path)
            yield path


def main() -> int:
    violations: list[str] = []
    for path in iter_runtime_files():
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        for number, line in enumerate(lines, 1):
            stripped = line.lstrip()
            if stripped.startswith("//") or stripped.startswith("#"):
                continue
            if any(pattern.search(line) for pattern in FORBIDDEN):
                violations.append(f"{path.relative_to(ROOT)}:{number}: {line.strip()}")

    if violations:
        print("AGENT-X BOUNDARY: FAIL")
        print("Legacy cognitive transport/state references found:\n")
        print("\n".join(violations))
        print("\nUse opaque intent_id, capability, skill/version, and observation metadata.")
        return 1

    print("AGENT-X BOUNDARY: PASS")
    print("No forbidden cognitive-state transport references found in runtime surfaces.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
