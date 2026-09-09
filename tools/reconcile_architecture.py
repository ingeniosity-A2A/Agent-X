#!/usr/bin/env python3
"""Local-only Agent-X boundary reconciliation.

No GitHub Actions or hosted automation is used. This script performs only the
approved compatibility migration: legacy cognitive envelopes are converted to
opaque intent/capability references while preserving existing behavior and UI.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    "src/quantum/task_memory.py",
    "esa-exoskeleton/public/components/ESA.GSAPTransport.js",
    "esa-exoskeleton/public/components/ESA.Ptac-B.js",
    "esa-exoskeleton/docs/service-broadcast-cards.md",
]


def replace(path: str, replacements: list[tuple[str, str]]) -> bool:
    p = ROOT / path
    if not p.exists():
        return False
    text = p.read_text(encoding="utf-8")
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        p.write_text(text, encoding="utf-8")
        print(f"reconciled {path}")
        return True
    return False


changed = False

# Preserve the existing task-memory intent/confidence API, but source it only
# from opaque substrate routing/observation metadata.
changed |= replace(
    "src/quantum/task_memory.py",
    [
        (
            '        cog = q.get("cognitive_state", {})\n        sig = q.get("signal_metadata", {})\n',
            '        payload = q.get("payload", {}) or {}\n        metadata = q.get("metadata", {}) or {}\n        sig = q.get("signal_metadata", {}) or {}\n',
        ),
        (
            '            intent=cog.get("intent", "unknown"),\n            confidence=cog.get("confidence", 0),\n',
            '            intent=(q.get("intent_id") or payload.get("intent_id") or payload.get("capability") or metadata.get("intent_id") or "unknown"),\n            confidence=payload.get("confidence", metadata.get("confidence", 0)),\n',
        ),
    ],
)

# Convert transport-side legacy cognitive envelope lookups/emitters.
for path in [
    "esa-exoskeleton/public/components/ESA.GSAPTransport.js",
    "esa-exoskeleton/public/components/ESA.Ptac-B.js",
]:
    changed |= replace(
        path,
        [
            (
                "q.cognitive_state?.intent || q.intent || 'default'",
                "q.intent_id || q.payload?.intent_id || q.payload?.capability || q.intent || 'default'",
            ),
            (
                "q.cognitive_state?.intent || 'unknown'",
                "q.intent_id || q.payload?.intent_id || q.payload?.capability || 'unknown'",
            ),
            (
                "cognitive_state: { intent: 'service:broadcast' },",
                "intent_id: 'service:broadcast',",
            ),
        ],
    )

changed |= replace(
    "esa-exoskeleton/docs/service-broadcast-cards.md",
    [
        (
            "     cognitive_state: { intent: 'service:broadcast' },",
            "     intent_id: 'service:broadcast',",
        ),
    ],
)

print("boundary reconciliation complete" if changed else "no legacy changes required")
