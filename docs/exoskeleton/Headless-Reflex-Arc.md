# Headless Reflex Arc

**method / capability id:** `headless_reflex_arc`  
**Architectural slot:** **Agent X** (local edge / experimental execution surface)  
**Tier:** Reflex (Core-Q² band)  
**Interface:** Headless — no chat UI  
**Status:** Locked naming · first concrete Agent X implementation pattern

---

## 1. What it is

A **small, fast model** path that performs **gated local shell execution**:

- Allowlisted commands only
- Human confirmation before run (application-level gate)
- No deep cortical planning loop
- Returns normalized observation + receipt upward

Biologically: a **reflex arc** is sensory → motor without waiting on deep cortex.  
Architecturally: this is the short loop under **Agent X**, not the Intellect and not the Exoskeleton substrate.

---

## 2. Naming lock (no collisions)

| Name | Meaning |
|------|---------|
| **Agent X** | Diagram **slot** — local edge / experimental execution |
| **Headless Reflex Arc** | **This implementation** (code/internal name) |
| **Exoskeleton** | **Reserved** — Layer 2 non-cognitive substrate (Arrow Flight / body). **Do not** reuse for this component |

```text
Ava007 Intent
  → Constellation (route)
      → Agent X (slot)
          → Headless Reflex Arc (concrete capability)
              allowlist + confirm + observation
```

---

## 3. What it is not

- Not Cybernetic Ava007 / Core-Q² identity
- Not Exoskeleton / Arrow substrate
- Not Cortex / Nemotron deep reasoning
- Not Core-Membrain (it may **deposit** outcomes; it does not own memory)
- Not unsupervised arbitrary code execution

---

## 4. Pipeline contract

| Step | Owner |
|------|--------|
| Intent | `brain.ts` / Ava007 |
| Assign local edge | Constellation |
| Invoke | Neuro-Stem → Agent X → Headless Reflex Arc |
| Safety | Allowlist + human confirm (required while unattended gate is off) |
| Result | Normalized observation + receipt |
| Retain | Embedded DB and/or `membrain_write` when outcome is meaningful |

Example observation (shape only):

```json
{
  "capability": "headless_reflex_arc",
  "status": "ok",
  "result": {
    "commands_approved": ["ls", "cat info.txt"],
    "cwd": "/workspace/project",
    "summary": "Listed files; summarized info.txt"
  },
  "receipt_id": "rcpt_..."
}
```

---

## 5. Isolation hardening (roadmap)

Current: application allowlist + confirm.  
Recommended middle ground when shell risk grows:

| Layer | Mechanism |
|-------|-----------|
| App | Allowlist + human confirm |
| Outer | Incus (or equivalent) system container + cgroup limits |
| Inner | Rootless Podman for services inside the project boundary |
| Extreme | Firecracker / Kata microVM only if confirm gate is removed and code is untrusted |

Filesystem/process isolation is the backstop **behind** the allowlist, not a replacement for Ava oversight.

---

## 6. Relation to Nemotron Bash tutorial

External pattern (Nemotron Nano + Bash tool + allowlist + confirm) is a **reference implementation shape**.  
In Ava007:

- Model may be any Reflex-band engine selected by Constellation
- Ava remains sole Intellect
- Tool loop results must still **retain** when durable

---

## 7. Coding agent rules

1. Register under Agent X — do not invent a second slot name.
2. Never name this component "Exoskeleton".
3. Do not auto-approve shell without the human gate unless a future policy explicitly replaces it with stronger isolation.
4. Do not put shell transcripts into Ava's full context — normalized observation only.

---

## 8. One-line

> **Headless Reflex Arc = Agent X's first concrete local gated shell path. Fast. Headless. Subordinate. Not the Exoskeleton.**
