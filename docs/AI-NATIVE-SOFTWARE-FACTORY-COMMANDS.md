# AI-Native Software Factory — Command Contract

**Doc ID:** UI-DOC-ANF-CMD-01  
**Status:** Canonical command vocabulary  
**Version:** 1.0  
**Date:** 2026-10-03  
**Owner:** Agent-X / Bento UI documentation layer

## Command model

Commands operate on a declared **work unit** and produce an auditable **candidate**.

```text
intent → plan → run → validate → revise|revert → verify → ship
```

### `factory.intent`

Declares the human-owned problem.

**Required**
- `goal`
- `constraints`
- `acceptance`
- `rollback`

**Output:** immutable intent record.

### `factory.plan`

Converts the outcome into independent work units where the task geometry permits.

**Required**
- `work_units[]`
- `dependencies[]`
- `evidence[]`

**Rule:** do not manufacture parallelism when units share a serial critical path.

### `factory.run`

Starts one candidate inside one isolated work unit.

**Required**
- `work_unit`
- `candidate_id`
- `intent_id`

**Rule:** candidate output is untrusted until validation passes.

### `factory.validate`

Runs the declared evidence gate.

**Checks may include**
- reference parity;
- functional tests;
- regression tests;
- performance envelope;
- human-legible artifact inspection;
- reproducibility.

**Output:** `PASS` or `FAIL` plus evidence receipt.

### `factory.revise`

Reopens a failed candidate with the failure evidence attached.

**Required**
- `candidate_id`
- `failure_receipt`
- `revision_scope`

The revision must remain inside the owning work unit unless the failure proves that a shared contract is the actual defect.

### `factory.revert`

Returns a candidate to its last known safe state.

**Rule:** rollback is a first-class operation, not an exceptional recovery path.

### `factory.verify`

Marks a candidate as release-eligible only after the declared validation gate passes.

**Output:** verified artifact receipt.

### `factory.ship`

Moves a verified artifact to the release boundary.

**Precondition:** `VERIFIED` only.

## State machine

```text
INTENT
  ↓
PLANNED
  ↓
RUNNING
  ↓
CANDIDATE
  ↓
VALIDATING ── FAIL ──→ REVISE ──→ RUNNING
  │
 PASS
  ↓
VERIFIED
  ↓
SHIPPED
```

No command may skip the validation gate.

## Isolation contract

A work unit owns its implementation and local evidence. Cross-unit dependencies require an explicit stable contract.

Promote a behavior into shared infrastructure only when multiple independent owners require the same assumption-free contract.

## Command receipts

Every command should be traceable by:

```json
{
  "intent_id": "…",
  "work_unit": "…",
  "candidate_id": "…",
  "command": "factory.validate",
  "status": "PASS|FAIL",
  "evidence": [],
  "timestamp": "…"
}
```

The receipt is the handoff between agent execution, validation, review, and release.

## UI component mapping

| Command | Primary visual |
|---|---|
| `factory.intent` | Factory Pipeline |
| `factory.plan` | Agent Run Matrix |
| `factory.run` | Agent Run Matrix |
| `factory.validate` | Evidence Gate |
| `factory.revise` | Evidence Gate |
| `factory.revert` | Evidence Gate |
| `factory.verify` | Evidence Gate |
| `factory.ship` | Factory Command Console |

## Design rule

Commands describe **intent, state, evidence, and boundaries**. They do not prescribe a hidden implementation recipe.

This keeps the human-owned outcome stable while allowing agents to explore implementation paths inside the declared contract.
