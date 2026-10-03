# AI-Native Software Factory — Architecture Note

**Doc ID:** UI-DOC-ANF-01  
**Status:** Canonical design guidance  
**Version:** 1.0  
**Date:** 2026-10-03  
**Applies to:** Agent-X / Bento UI documentation layer  
**Source:** Adapted from NVIDIA's *AI Native by Design: Lessons Learned from Building NVIDIA TensorRT Model Connect* (29 Sep 2026).

## Purpose

Translate the observable engineering pattern in NVIDIA's AI-native software-factory write-up into a framework-neutral contract for this system.

This is an **architecture/design reference**, not a claim that this repository implements NVIDIA TensorRT Model Connect.

## 1. Factory pipeline

```text
Human Intent
    ↓
High-Level Outcome + Constraints
    ↓
Parallel Agent Runs × N
    ↓
Evidence / Validation Gate
    ├── pass → Verified Artifact → Ship
    └── fail → Reproduce → Refine/Revert → Agent Run
```

### Human Intent

The human defines:

- the problem worth solving;
- the desired outcome;
- explicit constraints;
- acceptance criteria;
- the release/rollback boundary.

### Agent Runs

Agents explore implementation paths independently. The command surface should describe the **outcome and evidence contract**, not encode a brittle implementation recipe.

### Validation

A candidate is not trusted because an agent completed it. Acceptance requires reproducible evidence, regression coverage, reference comparison where appropriate, and human-legible output.

### Verified Artifact

Only a candidate that passes the declared gate can transition to the release path.

## 2. Isolation is the scaling boundary

Use an independently owned work unit when parallel execution is useful.

```text
Stable substrate
  └── shared contracts / runtime / CI

Integration layer
  ├── work unit A
  ├── work unit B
  └── work unit C

Each work unit owns:
  ├── implementation
  ├── local configuration
  ├── local runtime helpers
  └── local evidence / tests
```

A failure should remain local whenever the contract permits. Shared infrastructure is promoted only when multiple independent owners require the same stable assumption.

Some duplication is therefore intentional.

## 3. Reversibility

Prefer changes that are easy to evaluate and revert.

Every factory run should preserve:

- input intent;
- selected work unit;
- candidate identifier;
- validation evidence;
- failure/revision history;
- final disposition.

A failed candidate is evidence for the next iteration, not a silent state mutation.

## 4. Evidence contract

Minimum evidence classes:

| Evidence | Question |
|---|---|
| Reference parity | Does behavior match the declared reference? |
| Functional tests | Does the contract hold on expected inputs? |
| Regression | Did the change break a known invariant? |
| Performance | Does it remain within the declared envelope? |
| Human-legible artifact | Can a reviewer inspect the result without decoding raw telemetry? |
| Reproducibility | Can another run reproduce the acceptance/failure? |

QA and development should be able to operate against the same reproducible evidence while retaining independent challenge authority.

## 5. UI mapping

The Watermelon catalog provides reusable visual components; Bento remains the production UI framework.

| Factory concept | Watermelon component | Production mapping |
|---|---|---|
| Intent → outcome | `Factory Pipeline` | Bento card / workflow surface |
| Parallel work | `Agent Run Matrix` | Bento grid / work-unit cards |
| Validation gate | `Evidence Gate` | Bento status card / review surface |
| Command contract | `Factory Command Console` | Bento command surface |

Watermelon is a **component/reference catalogue**, not a competing application framework.

## 6. Industry-standard UI requirements

All production implementations derived from these components should:

- expose semantic HTML and accessible names;
- support keyboard interaction;
- preserve visible focus;
- respect `prefers-reduced-motion`;
- keep state changes explicit;
- avoid color-only status communication;
- use design tokens rather than component-local magic values;
- keep motion subordinate to state transitions;
- expose machine-readable status where the host application needs it.

## 7. Non-goals

This pattern does not imply:

- every task can be parallelized;
- more agents automatically produce more accepted work;
- reference implementations are infallible;
- shared infrastructure is risk-free;
- agent output is trusted by default.

## Source

Yifei Fang, NVIDIA Technical Blog, “AI Native by Design: Lessons Learned from Building NVIDIA TensorRT Model Connect,” 29 Sep 2026.
