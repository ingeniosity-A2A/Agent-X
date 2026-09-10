# Agent X — Experimental Capability Specification

**Role:** Sandboxed Experimental / Evolvable Execution Surface  
**Architecture:** Exoskeleton Upgrade · Capability Substrate  
**Served by:** Cybernetic Ava007 (Intellect)  
**Version:** 0.4 (Headless Reflex Arc locked · Freebuff capability exposed)  
**Status:** Active — Identity Locked

---

## 1. Identity (Canonical)

**Name:** Agent X  
**Full Designation:** Experimental Capability Surface  
**Nature:** Headless, sandboxed, evolvable capability  
**Layer:** Capability under substrate (not Intellect, not Exoskeleton substrate)  
**Not:** A peer Intellect, device OS owner, or the Exoskeleton itself.

### Explicit Non-Ownership

Agent X does **not** own:

- Persistent memory (Core-Membrain + Ava embedded DB)
- Model routing (Constellation)
- Philosophical framing (REV.IKE)
- The Exoskeleton substrate / Arrow Flight fabric
- Ava007 identity

---

## 2. Architectural Position

```
┌──────────────────────────────────────────────┐
│           CYBERNETIC AVA007 (Intellect)      │
│   Emits Intent only                          │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│         EXOSKELETON SUBSTRATE (body)         │
│  Constellation · Neuro-Stem · Arrow fabric   │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│                 AGENT X (slot)               │
│  Experimental / local-edge execution surface │
│                                              │
│  First concrete implementation:              │
│  **Headless Reflex Arc**                     │
│  (gated local shell · allowlist · confirm) │
│                                              │
│  Also exposes:                               │
│  **Freebuff** — Linux/glibc dev capability   │
│  (Debian 13 runtime · console-invoked)       │
└──────────────────────────────────────────────┘
```

---

## 3. Headless Reflex Arc (first concrete implementation)

| Field | Value |
|-------|--------|
| Code / internal name | `headless_reflex_arc` |
| Slot | Agent X |
| Tier | Reflex |
| UI | None (headless) |
| Safety | Allowlist + human confirmation |
| Spec | `Headless-Reflex-Arc.md` |

**Exoskeleton** remains the substrate name only. Do not call Reflex Arc an Exoskeleton.

---

## 4. Freebuff — Linux Development Capability

**Slot:** Agent X  
**Runtime:** Debian 13 (aarch64 · glibc 2.41) guest on S26 Ultra  
**Binary:** linux-arm64 · **0.0.142** — owner-verified good · **do not reinstall or rebuild**  
**Provisioning:** `provision_freebuff.sh` (run inside Debian)

### 4.1 Verified runtime boundary (owner-proven, 2026-09-10)

```text
S26 Ultra
└── Termux (Android / bionic libc)
    └── cannot execute Linux/glibc ELF directly — expected, not a defect
    └── Debian 13 (aarch64 · glibc 2.41)
        └── Freebuff 0.0.142 (linux-arm64)
            └── Agent-X Development Capability
```

- Direct Termux execution fails **by design** (bionic ≠ glibc) — the boundary is correct.
- Debian guest execution succeeds: `freebuff --version` → `0.0.142`.
- There is exactly **one** clean execution surface; no Termux-native port is planned.

### 4.2 Ownership ruling

- **Ava does not contain Freebuff.** The binary and its Debian runtime remain outside the Intellect.
- **Agent X exposes it** as a capability that the unified Ava/Agent-Browser Console invokes.
- Intent authority is unchanged: only Cybernetic Ava007 (L4) authorizes; Agent X never issues intent.

### 4.3 Provisioning + invocation

Inside Debian (installs to `/opt/freebuff/freebuff`, symlinks `/usr/local/bin/freebuff`, verifies):

```bash
bash provision_freebuff.sh
```

From Termux, invoke through the Debian guest:

```bash
proot-distro login debian -- freebuff --version
# → /usr/local/bin/freebuff · 0.0.142
```

## 5. Capability Contract (Model-Facing)

| Capability Name | Purpose |
|-----------------|--------|
| `agent_x_run` | Execute experimental / provisional task |
| `headless_reflex_arc` | Gated local shell reflex path |
| `freebuff` | Linux/glibc development capability (Debian runtime) — invoked by the unified Ava/Agent-Browser Console |
| `latent_skill_acquire` | Acquisition / adaptation of a new skill |
| `experimental_compose` | Candidate capability generation |
| `agent_x_status` | Health / resource status |

Call shape remains one Intent-facing primitive; substrate fills isolation details.

---

## 6. What Agent X Owns

| Concern | Ownership |
|---------|-----------|
| Experimental task execution | Agent X |
| Headless Reflex Arc lifecycle | Agent X |
| Freebuff capability **exposure** (invocation surface) | Agent X |
| Latent skill acquisition | Agent X |
| Untrusted / provisional code (sandboxed) | Agent X |
| Candidate generation for promotion | Agent X |

---

## 7. What Agent X Does Not Own

| Concern | Correct Owner |
|---------|----------------|
| Intellect / Intent | Cybernetic Ava007 |
| Memory retain | Core-Membrain + Ava embedded DB |
| Substrate / Arrow highway | Exoskeleton |
| Freebuff binary / Debian guest runtime | External Linux runtime on device (Agent X only exposes the capability) |
| Deep reasoning methods | RIM / Cortex reasoning stacks (external — not applied here) |
| Device mesh as identity | Dedicated connectivity skills (e.g. Onomondo, SIF) |

---

## 8. Promotion Path

1. Run inside Agent X (sandboxed / gated).  
2. Result + metrics → retain path (DB / MemBrain).  
3. Operator or policy evaluates.  
4. Promote into stable capability registry.  
5. Ava007 never lives inside the experiment.

---

## 9. Behavioral Directives

1. Default maximum isolation.  
2. Headless Reflex Arc: no auto-approve shell without gate (unless future policy + stronger isolation).  
3. Structured observation only — no raw log dumps into Intellect context.  
4. Record meaningful outcomes on the retain path.  
5. Fail fast and fail closed.  
6. Never claim to be Ava or the Exoskeleton.  
7. Freebuff stays in its Debian guest — never embed, fork, or rebuild it into Ava; Agent X exposes it, the console invokes it.

---

## 10. One-Line Summary

> **Agent X is the slot. Headless Reflex Arc is the first concrete local gated shell path.  
> Freebuff is the exposed Linux dev capability — Debian hosts it, the console invokes it.  
> Ava thinks. The Exoskeleton carries. Agent X experiments.**
