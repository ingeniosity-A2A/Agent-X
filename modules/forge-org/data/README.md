# forge-org — ForgedxFolders Housing

FORGE-ORG is a Tier 1 skill (`skills/forge-org/`). This directory is its data housing,
same doctrine as `modules/esa/data/rocksdb` and `modules/helpassembly/data/rocksdb`.

Canonical contract: `skills/forge-org/FORGED-FILE-STANDARD.md` (immutable F0/F1/F2,
append-only F3, HF vendor boundary outside F0→F3).

```text
raw/          F0 write-once originals (<f0_id>/original.bin + f0.json)
forged/       F2 governed immutable artifacts (<forged_id>.json, chunks inside)
vendor/       HF vendor metadata ONLY — model bytes never land here
quarantine/   unknown artifacts (fail-safe classification)
rocksdb/      control plane — gitignored internals (regenerable from raw/ + forged/)
forgedxfolders.duckdb  intelligence — gitignored
```
