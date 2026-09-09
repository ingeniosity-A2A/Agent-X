# Aetheris Trial — Validation Record

**Status:** trial system KEPT (owner ruling 2026-09-09) · **Pipeline position:** candidate to become the next FORGED — Forged File Standard §11

The owner ruling requires that Aetheris **be tested and validated**. This page
is the standing evidence record. Re-run the instruments below after any engine
change; a regression invalidates the trial status until fixed.

## What was validated (2026-09-09)

### 1. Flat-RAM zero-copy streaming — PASSED (fail-closed)

Instrument: `scripts/rev_ike_benchmark.py` (exits 1 if RAM is not flat).

| Metric | Result |
|--------|--------|
| Records ingested | 50,000 (synthetic) |
| Throughput | 3,904.74 records/sec |
| First-record latency | 2.49 ms (warm start) |
| **Delta RSS (active ingestion memory)** | **0.0 MB — VERIFIED FLAT RAM** |
| Peak PyAllocated heap (tracemalloc) | 0.45 MB |
| Raw stream ingested | 10.98 MB |
| L0_Trace output | 11.03 MB sequential trace log |
| L1_Atoms output | 14.57 MB fact-atom metadata |
| Refs offload | 14.75 MB across 100 out-of-band parts |
| Duplicates skipped | 0 |
| Exit code | 0 (fail-closed verdict passed) |

### 2. Tier state + stream history — PASSED

`scripts/memory_tdai.py stats` over `modules/aetheris/data/memory-tdai`:

| Tier | Files | Bytes |
|------|-------|-------|
| L3_Persona | 1 | 806 |
| L2_Scenario | 1 | 808 |
| L1_Atoms | 7 | 57,745,460 |
| L0_Trace | 7 | 37,822,747 |
| refs | 328 | 46,950,075 |

Every stream in the recorded history (actors `rev-ike-benchmark`, `rev-ike`,
`rev-ike-live`) reports `verified_flat_ram: true` with the bounded dedup window
(`DEDUP_WINDOW=1024`) — stream memory stays flat regardless of dataset scale.

### 3. Deterministic content-addressed recall — PASSED

`scripts/memory_tdai.py node nd-2458e2fcf4b7` returned **byte-identical
payloads on repeated invocations** (`L3_Persona/system_pref.md`, 806 bytes,
governance state `locked: true`) — recall is deterministic and grep-able
across L1, L0, and refs as the invariants claim.

## Claims still owned by the invariants (spot-checked, not exhausted)

- Tier outputs immutable / append-only per `stream_id`; corrections as new streams.
- Lock-and-slide governance via `.meta/state.json` (recall showed `locked: true`).
- Symbol-graph context offloading (UI claim; exercised via `tree`, output too
  large to inline — run `python3 scripts/memory_tdai.py tree`).

## Promotion path (Standard §11)

1. Keep this record green (re-run benchmark after engine changes).
2. Exercise real-source ingestion (`hf:` vendor imports + `.jsonl`/`.parquet`)
   — vendor boundary applies exactly as in Standard §6.
3. On owner promotion, §11 is replaced by the promotion spec and Aetheris's
   lifecycle graduates INTO the Forged File Standard as the next FORGED.
