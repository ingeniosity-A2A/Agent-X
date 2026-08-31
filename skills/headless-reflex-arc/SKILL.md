---
skill_id: headless-reflex-arc
version: 0.1.0
provides:
  - shell.gated.local
authority: local
---

# Headless Reflex Arc

**Architectural slot:** Agent-X Layer-3 capability (not the Exoskeleton substrate).

Small / fast gated local shell execution. Human confirmation before side effects. No chat surface.

## Rules

1. Allowlist only — no open-ended shell.
2. Gate: explicit confirm for mutating commands.
3. Emit structured result for ObservationMessage back to intellect.
4. Mount via a2a-exoskeleton firmware registry (hash-verified) when live.

## Status

Scaffold. Implement allowlist + gate next.
