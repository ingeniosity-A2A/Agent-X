---
name: forge-org
description: "FORGE-ORG — Tier 1 skill running within the Agent Browser operating environment. Governs the Forged File lifecycle F0→F3 (Raw Upload → Chunk/GSAP SplitText → Refactor/Normalize → Exoskeleton Application → Forged File → RocksDB Skills / DuckDB Intelligence → Manifest with provenance + backlinks). Enforces the Forged File Standard: immutable F0/F1/F2, append-only F3, Hugging Face as vendor/input boundary OUTSIDE the pipeline, three-color UI contract (neutral/orange/yellow), semantic animation language."
read_when:
  - Ingesting or forging files into ForgedxFolders
  - Registering HF vendor assets (models / tokenizers / configs)
  - Querying forged skills (RocksDB) or forged intelligence (DuckDB)
  - Modifying the File Explorer Canvas or curation surfaces
allowed-tools: Bash(python3:*), Read, Write
---

# FORGE-ORG — Tier 1 Skill

FORGE-ORG is a **skill running within the Agent Browser environment** — Agent Browser is
the operating environment / tool surface (Document Ingestion, Product Lens, Bash, Linux,
Termux, Benchmark, CodeBluff capabilities); FORGE-ORG is NOT an agent and NOT a parallel
subsystem. It is the governed ingestion / asset-governance lifecycle for
**ForgedxFolders** — the file system (canonical name, owner ruling 2026-09-09;
retires "Forged File Vault" / "vault").

**Canonical contract: [`FORGED-FILE-STANDARD.md`](./FORGED-FILE-STANDARD.md)** — this file
defers to the Standard everywhere they overlap. The Standard is the governing ingestion /
asset-governance specification for Mastering-Ava007-Curation.

## Position in the architecture

```text
EXOSKELETON FRAMEWORK
                    │
        ┌───────────┴───────────┐
   AGENT BROWSER              AVA007
   (operating environment)    (consumes capabilities/intelligence)
        │
   FORGE-ORG (Tier 1 skill)
        │
   F0→F3 ── RocksDB (Skills) ── DuckDB (Intelligence)
```

- **Orchestration stays outside Ava007.** The pipeline is infrastructure around
  ForgedxFolders, not an Ava007 cognitive capability.
- **Hugging Face is a vendor/input boundary, not a fourth intelligence layer.**
  Whole-model vendoring happens OUTSIDE F0→F3; multi-GB weights never enter RocksDB.
- **RocksDB = Skills** (executable procedural knowledge, the control plane).
- **DuckDB = Intelligence** (structured knowledge, metadata, facts).
- **F3 = provenance and relationship graph** (append-only).

## Execution surface

- Engine: `scripts/forgedxfolders.py` (rocksdict control plane + DuckDB intelligence).
- Housing: `modules/forge-org/data/` (raw/ forged/ vendor/ quarantine/ rocksdb/ forgedxfolders.duckdb).
- UI: `/agent-browser/interface/forge` — the File Explorer Canvas implementation
  (sidebar-tree geometry preserved from the reference ZIP; three-color contract).
- API: `/api/forge/ingest | chunk | forge | manifest | tree | entry | vendor`.

## DEV-LOCKED

Sections marked DEV-LOCKED in the Standard are **specified but not yet operational**:
visible in the UI, inert, reduced opacity, lock glyph. They MUST NOT be stubbed with
fake behavior.
