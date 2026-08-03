# Agent X — Experimental Capability Specification

**Role:** Sandboxed Experimental / Evolvable Execution Surface  
**Architecture:** Exoskeleton Upgrade · Capability Substrate  
**Served by:** Cybernetic Ava007 (Intellect)  
**Version:** 0.2 (Identity Clarification)  
**Status:** Active — Identity Locked

---

## 1. Identity (Canonical)

**Name:** Agent X  
**Full Designation:** Experimental Capability Surface  
**Nature:** Headless, sandboxed, evolvable capability  
**Layer:** L3 (Substrate-managed capability)  
**Not:** A runtime, device manager, mobile agent, orchestration runtime, or peer Intellect.

### Explicit Non-Ownership

Agent X does **not** own:

- Device runtime or mobile/IoT execution (that belongs to dedicated device/runtime capabilities or harnesses)
- Model routing or tier selection (Constellation / Execution Scheduler)
- Persistent memory (Core-Membrain)
- Philosophical / motivational framing (REV.IKE)
- Routine planning or decomposition
- Direct hardware control

Any earlier interpretation that Agent X “handles the runtime aka mobile/devices” is **superseded**. Device and runtime concerns are separate capabilities or harnesses.

---

## 2. Architectural Position

```
┌──────────────────────────────────────────────┐
│           CYBERNETIC AVA007 (Intellect)      │
│   Emits Intent only                          │
└────────────────────┬─────────────────────────┘
                     │
                     │  capability call
                     │  "agent_x_run" | "latent_skill_acquire"
                     │
┌────────────────────┴─────────────────────────┐
│            EXOSKELETON SUBSTRATE (L3)        │
│  Isolation · WASM / process sandbox          │
│  Circuit breakers · Observation normalization│
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│                 AGENT X                      │
│                                              │
│  · Experimental task execution               │
│  · Latent skill acquisition loops            │
│  · Untrusted / provisional code paths        │
│  · Candidate capability generation           │
│  · Returns only normalized observations      │
└──────────────────────────────────────────────┘
```

Agent X is a **capability**, not a runtime plane.

---

## 3. Capability Contract (Model-Facing)

### 3.1 Canonical Calls

| Capability Name              | Purpose                                            |
|------------------------------|----------------------------------------------------|
| `agent_x_run`                | Execute an experimental or provisional task        |
| `latent_skill_acquire`       | Attempt acquisition / adaptation of a new skill    |
| `experimental_compose`       | Generate candidate capability implementations      |
| `agent_x_status`             | Health / resource status of the experimental surface |

### 3.2 Call Shape
```json
{
  "capability": "agent_x_run",
  "args": {
    "task": "Prototype a new bracket-torque prediction heuristic from the last 40 installation events",
    "sandbox": "wasm",
    "timeout_ms": 45000,
    "allow_side_effects": false
  }
}
```

### 3.3 Observation Shape
```json
{
  "capability": "agent_x_run",
  "status": "ok",
  "result": {
    "outcome": "heuristic_candidate_v3",
    "metrics": {
      "accuracy_on_holdout": 0.87,
      "latency_ms": 12
    },
    "recommendation": "promote_to_staging",
    "artifacts": ["heuristic_v3.wasm"]
  }
}
```

Ava007 never sees internal training loops, intermediate failures, sandbox logs, or device-level details.

---

## 4. What Agent X Owns

| Concern                        | Ownership |
|--------------------------------|-----------|
| Experimental task execution    | Agent X   |
| Latent skill acquisition       | Agent X   |
| Untrusted / provisional code   | Agent X   |
| Candidate generation for later promotion | Agent X |
| Sandbox isolation & circuit breakers | Substrate (on behalf of Agent X) |

---

## 5. What Agent X Explicitly Does **Not** Own

| Concern                        | Correct Owner                          |
|--------------------------------|----------------------------------------|
| Device / mobile / IoT runtime  | Dedicated device capability or harness |
| Model / tier selection         | Constellation + Execution Scheduler    |
| Persistent memory              | Core-Membrain                          |
| Philosophical framing          | REV.IKE                                |
| Routine planning               | Stable planning capabilities           |
| Hardware control               | Hardware-specific capabilities         |
| Cognitive-band selection       | brain.ts / L4 policy                   |

---

## 6. Promotion Path (Only Path Out of Agent X)

1. Experiment runs inside Agent X (fully sandboxed).  
2. Result + metrics written to Core-Membrain.  
3. Operator or policy evaluates.  
4. Successful candidate is promoted into the **stable capability registry**.  
5. Ava007 continues to see only the stable surface. Experimental noise never enters the Intellect.

Agent X is the laboratory.  
The stable capability registry is production.

---

## 7. Exoskeleton Alignment

| Principle                      | How Agent X Satisfies It                          |
|--------------------------------|---------------------------------------------------|
| Headless Rule                  | No conversational surface; pure capability        |
| Compartmentalization           | Full sandbox isolation                            |
| Context Rehydration            | Only normalized observation reaches Ava007        |
| Lazy Prompt Topology           | Experimental prompts materialize only on demand   |
| Error Isolation                | Failures never propagate to Intellect or siblings |
| Flat Scaling                   | Adding experiments does not increase Ava007 load  |

---

## 8. Behavioral Directives

1. Default to maximum isolation.  
2. Prefer side-effect-free execution unless explicitly authorized.  
3. Always return a structured observation — never raw logs or stack traces.  
4. Record every experiment into Core-Membrain via the substrate.  
5. Never escalate experimental state into Ava007’s context.  
6. Never claim ownership of device, runtime, routing, or memory concerns.  
7. Fail fast and fail closed.

---

## 9. Relationship to Open Questions

This specification **closes OQ-002** (Agent X Identity):

- Agent X is a **capability executor** (experimental surface).  
- It is **not** a persistent agent, orchestration runtime, device runtime, or harness owner.  
- It owns only experimental task lifecycle and latent skill work inside a sandbox.  
- All other concerns are assigned elsewhere.

---

## 10. One-Line Summary

> **Agent X is the sandboxed laboratory.  
> It does not run devices, does not select models, and does not remember.  
> It experiments.  
> Successful results graduate.  
> The Intellect never lives inside the experiment.**
