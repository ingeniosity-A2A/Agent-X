#!/usr/bin/env python3
"""Mechanical boundary reconciliation for Agent-X.

This script performs only approved compatibility migrations. It does not redesign
features or UI. Agent-X remains capability/mesh execution; cognitive state is
never represented here.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


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

# Python memory adapter: preserve its public intent/confidence query API, but source
# those values only from opaque routing/observation metadata.
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

# JS transport components: convert legacy cognitive envelopes to opaque intent refs.
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

# Documentation examples must teach the canonical boundary, not the legacy one.
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
