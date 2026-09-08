# AETHERIS — Memory Timeline File System (Tier 1 Skill)

**skill_id:** `aetheris-memory-fs` · **tier:** 1 · **status:** present
**execution_surface:** Agent Browser (operating environment) + Agent-X platform API
**housing:** `modules/aetheris/data` · **engine:** `scripts/memory_tdai.py` (+ `scripts/rev_ike_streamer.py`, `scripts/rev_ike_benchmark.py`)
**ui:** `/agent-browser/interface/aetheris` (Bento UI8 plugin on the Forge UI8 Canvas)

## What it provides

- `fs.memory-tdai` — the 4-tier memory file system:
  `L3_Persona/` (cognitive anchor) → `L2_Scenario/` (active projects) →
  `L1_Atoms/` (distilled JSONL fact atoms) → `L0_Trace/` (sequential raw logs)
  + `refs/` (out-of-band payload archives) + `.meta/` (governance + manifests)
- `ingest.rev-ike.zero-copy` — Sovereign Ingestion: sequential Python
  iterators (`streaming=True` for `hf:` sources, generators for
  `.jsonl/.parquet/.json`/`synthetic:N`). Distills L1 Fact Atoms, offloads
  bulk payloads to `refs/*.md`, and holds the **verified flat-RAM contract**
  (Delta RSS ~0.00 MB, sub-MB tracemalloc heap at any stream length).
- `context.tdai-offloading` — Symbolic In-Context Graphing: the UI and agent
  viewports render the deterministic symbol graph (Mermaid + structured);
  `node_id` recall hooks pull raw payloads on demand — nothing heavy enters a
  context window un-referenced.
- `ui.bento-ui8.aetheris` — the 3D scroll-driven Memory Timeline Explorer:
  perspective 1200px, 250vh native-physics scroll driver, scoop-corner cards
  (32px clip-path), lock-and-slide governance (0.6s back.out(1.1) unprepared
  window), 100ms perceptual-fusion feedback, pulsating-cyan live telemetry,
  governance auto-lock on stream completion.

## Invariants

- Tier cards are **LOCKED by default**; unlocking is an explicit recorded
  transition (`.meta/state.json`). Streams auto-lock their targets.
- L0/L1/refs tier outputs are immutable stream artifacts — append-only per
  stream_id. Corrections happen as new streams, never rewrites.
- The `node_id` space is content-addressed (`nd-<sha256[:12]>`) — recall is
  deterministic and grep-able across L1, L0, and refs.
- Dedup is bounded-window (`DEDUP_WINDOW=1024`): stream memory stays flat
  regardless of dataset scale.

## Boundary

Aetheris is the lived-in file system of the Agent Browser environment. The
Forged File Vault (FORGE-ORG, F0→F3) is the governance pipeline that promotes
assets into RocksDB Skills / DuckDB Intelligence — Aetheris feeds it, it does
not replace it. Hugging Face remains the vendor boundary OUTSIDE F0→F3
(`hf:` sources in Rev.ike are vendor imports, not vault writes).

## Canonical specs

Uploaded corpus (Studio panel): "Aetheris: The GSAP-Powered File-Memory
Explorer", "Aetheris: 3D Memory Timeline File Explorer", "Building a
Scroll-Driven 3D Interactive Memory Timeline", "Bento UI8 Pluggable
Architecture", "Sovereign Ingestion and Streamed Exploration Protocol",
"The Rev.ike Zero-Copy Streaming Architecture", "Rev.ike Zero-Copy Streaming
Benchmark and Engineering Report", "The Exoskeleton Framework".
