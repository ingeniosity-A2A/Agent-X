# Aetheris memory-tdai housing

The lived-in file system of the Aetheris 3D Memory Timeline Explorer.

- `memory-tdai/L3_Persona` — Persona Block (system_pref.md, cognitive anchor)
- `memory-tdai/L2_Scenario` — Active Scenarios (runtime_ctx.md)
- `memory-tdai/L1_Atoms` — distilled Fact Atoms (JSONL, deduped)
- `memory-tdai/L0_Trace` — sequential raw trace logs (JSONL)
- `memory-tdai/refs` — out-of-band payload archives (markdown)
- `memory-tdai/.meta` — governance locks + stream manifests

Bulk tier outputs and stream manifests are runtime artifacts (gitignored);
L3/L2 persona + scenario seeds are tracked. Engine: `scripts/memory_tdai.py`.
Canonical specs: upload corpus — Aetheris / Sovereign Ingestion / Rev.ike Zero-Copy.
