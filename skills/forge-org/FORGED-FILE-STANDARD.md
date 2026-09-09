# The Forged File Standard

**Status: canonical.** This document is the governing ingestion / asset-governance
specification for Mastering-Ava007-Curation. Where any other file, ZIP, demo, or
interface disagrees with this Standard, **this Standard wins**. Nothing competes
with it; existing material is brought INTO compliance.

Spec version: `1.1.0` · Owner directive: 2026-09-07 · Naming revision: 2026-09-09

**Naming authority (owner rulings, 2026-09-09):**

1. The file system is **ForgedxFolders**. "Forged File Vault", "AVA007 Vault",
   and every "vault" alias are retired — the names entered at commits `762d626`
   / `41a286e` without owner sanction (evidence: wiki Naming Register).
2. **ESA is Extended Stay America** — the client. The ESA brand appears ONLY on
   the cards that perform their service (maintenance work, supply ordering,
   maintenance inventory). It is never a shell, console, sandbox, or framework name.
3. **Aetheris is KEPT** as a trial system: its pipeline is the candidate to
   become the next FORGED. It must be tested and validated; until then its
   outputs enter the canonical lifecycle through F0 like any upload (§11).
4. **We don't do harnesses. We apply Exoskeleton.** Harness→Exoskeleton is a
   redesign: documents are rewritten for the framework or removed — never
   relabeled. The forge stage is **Exoskeleton Application** (§1, §4).

---

## 1. Canonical architecture

```text
FORGEDXFOLDERS
                    │
                    ▼
    THE CURATED EXOSKELETON CONFIGURATION
                    │
                    ▼
             ┌──────────────┐
             │ PRE-CHECK    │   F0 Boundary — is this a forgeable
             │ F0 Boundary  │   upload or a vendor asset?
             └──────┬───────┘
                    ▼
             ┌──────────────┐
             │ INTERCEPT /  │   stream intercepted, hashed, staged
             │ STREAM       │
             └──────┬───────┘
                    ▼
             ┌──────────────┐
             │ F1 CHUNK     │   deterministic chunking; GSAP SplitText
             │ GSAP SPLIT   │   is the MANDATORY visual language for
             │ TEXT         │   the chunking stage
             └──────┬───────┘
                    ▼
             ┌──────────────┐
             │ REFACTOR /   │   normalize (CRLF→LF, BOM strip, NFC,
             │ NORMALIZE    │   trailing-ws trim) — never mutates F0
             └──────┬───────┘
                    ▼
             ┌──────────────┐
             │ EXOSKELETON │   measurable static checks; deterministic
             │ APPLICATION │   replay verification
             └──────┬───────┘
                    ▼
             ┌──────────────┐
             │ F2 FORGED    │   governed, classified, immutable artifact
             │ FILE         │
             └──────┬───────┘
             ┌──────┴───────┐
             ▼              ▼
      ┌────────────┐  ┌──────────────┐
      │  ROCKSDB   │  │   DUCKDB     │
      │   SKILLS   │  │ INTELLIGENCE │
      └─────┬──────┘  └──────┬───────┘
             └───────┬───────┘
                     ▼
             ┌──────────────┐
             │ F3 MANIFEST  │   provenance + backlinks
             │ append-only  │
             └──────────────┘

HUGGING FACE VENDOR ── whole-model vendoring ── OUTSIDE F0 → F3
AETHERIS (trial — next-FORGED candidate) ── feeds F0 ── see §11
```

## 2. The four-tier role lock

| Tier | Role | Stores |
|------|------|--------|
| **RocksDB** | Skills — executable procedural knowledge; the **control plane** | namespaces (§5), never model weights, never blobs |
| **DuckDB** | Intelligence — structured knowledge, metadata, facts | SQL tables over the forged corpus + vendor facts |
| **Hugging Face** | Vendor / input boundary — **NOT a fourth intelligence layer** | models / tokenizers / configs in the vendor store; only metadata crosses into ForgedxFolders |
| **F0–F3** | The forging lifecycle | governed artifacts + append-only provenance |

The vendor system may provide model metadata to the Capability system, but the
original model artifact remains an independently governed vendor asset. A model
does not become a Forged File merely because a Capability uses it.

## 3. Immutability contract

| Stage | Mutable? | Purpose |
|-------|----------|---------|
| F0 Raw | **No** | Original evidence (write-once, sha256-addressed; identical re-upload dedupes to the same F0) |
| F1 Chunk | **No** | Deterministic chunk artifact (content-addressed; same input → same chunk hashes, proven by replay) |
| F2 Forged | **No** | Governed classified artifact |
| F3 Manifest | **Append-only** | Relationships / provenance (new seq keys only; no updates, no deletes) |

If something changes, generate a **new version**: `forged_id`, `forged_id:v2`,
`forged_id:v3` — never silently modify a historical artifact. This is what gives
Ava007 traceability:

```text
Why does this skill exist?
  → Which Forged File produced it?
  → Which chunk produced that?
  → Which upload produced that?
  → Which vendor/model/dependency contributed?
```

That chain is the real purpose of F3.

## 4. Capability is the compile-time unit

Dependencies, Skill, and the Exoskeleton binding are not unrelated objects —
they are compiled into one **CAPABILITY** the runtime can actually load:

```json
{
  "capability_id": "cap_<slug>_v<n>",
  "dependencies": {},
  "skill":      { "skill_id": "skill_...", "provides": [], "source_forged": "..." },
  "exoskeleton": { "checks": [], "verdict": "pass|fail", "measured": {} },
  "inputs":     { "schema": "text" },
  "outputs":    { "schema": "text" },
  "permissions": [],
  "validation": { "deterministic": true, "replay": "chunk hashes stable" },
  "provenance": { "f0_id": "...", "sha256": "...", "manifest": "manifest:..." }
}
```

## 5. RocksDB namespaces (control plane)

Namespaces, not one giant composite string:

```text
skill:{skill_id}               forged skill record
capability:{capability_id}     compiled capability unit
asset:{asset_id}               vendor asset record (metadata)
layer:{stack_id}:{layer_id}    stack layer
idx:hash:{hash}                reverse index: content hash → location
idx:asset:{asset_id}           asset reverse index
manifest:{forged_id}:{seq}     F3 append-only provenance slice
stack:{job_id}:{frame_id}:{depth}   render stack plane
```

RocksDB stores the control plane. The renderer (and any runtime) owns the actual
asset lifecycle. Values are JSON documents.

## 6. Hugging Face vendor boundary — artifact detector

**Never blindly truncate a model stream and assume the first bytes contain
everything.** The interceptor must understand the actual artifact format:

```text
HF Repository / upload
        │
        ▼
 Artifact Detector
   ├── safetensors parser   (u64 LE header len + JSON header → tensors, dtypes)
   ├── GGUF parser          (magic + version + tensor count + metadata KV)
   ├── ONNX parser          (protobuf sniff → graph facts when parseable)
   ├── tokenizer/config parser (JSON → architectures, model_type, vocab)
   └── unknown → QUARANTINE
        │
        ▼
 Model Intelligence
   ├── DuckDB      metadata / facts
   └── RocksDB     reusable skills (asset records, control plane only)
```

- Multi-GB weights **stay in the Hugging Face vendor / content-addressed store**.
  ForgedxFolders records metadata + facts only; bytes never enter `modules/forge-org/data`.
- Known-but-unparsed weight archives (.pt/.pth/.ckpt/.bin/.h5) register with
  `classification: weight-archive (not parsed)` — recorded, not quarantined.
- **Quarantine is fail-safe**: unknown format → `quarantine/` + DuckDB row with
  `quarantined: true`. Quarantined assets produce no capabilities.

## 7. UI contract (absolute)

### Three colors only

| Color | Applies to |
|-------|-----------|
| **NEUTRAL** | F0 / F1 / F3 / Vendor / system infrastructure |
| **ORANGE** | RocksDB / Skills |
| **YELLOW** | DuckDB / Intelligence |

### Animation semantics (a language, not decoration)

| Event | Animation |
|-------|-----------|
| UPLOAD | ASCII glitch ripple |
| F1 CHUNK | GSAP SplitText — characters / words physically separate |
| NUMERIC DATA | Odometer |
| F0→F1→F2→F3 stage change | SLIDE — never generic fade transitions |
| DEV-LOCKED | visible, inert, reduced opacity + lock glyph |

### Geometry preservation

The File Explorer Canvas preserves the reference explorer's geometry, navigation,
inspector, grid/list behavior, breadcrumbs, search, sorting, and interaction model.
They change only where the Forged File architecture requires it. The reference
ZIP (`configurable-sidebar-w-grid-transitions`) is brought INTO compliance:
its `sidebar-tree` accessibility model (role=tree, aria-level/setsize/posinset,
keyboard nav, `/` search hotkey, match/related/filtered filter states) is retained.

## 8. Folder schema

```text
modules/forge-org/data/
├── raw/<f0_id>/            F0: original.bin (exact bytes) + f0.json
├── forged/<forged_id>.json F2: governed immutable artifact (chunk records inside)
├── vendor/<asset_id>.json  vendor metadata records (bytes NEVER stored here)
├── quarantine/<asset_id>.json
├── rocksdb/                control plane (gitignored, regenerable from raw+forged)
└── forgedxfolders.duckdb  intelligence (gitignored)
```

## 9. UI state model

```ts
type Folder = "f0"|"f1"|"f2"|"f3"|"skills"|"intelligence"|"vendor"|"quarantine"|"curation";
interface ExplorerState {
  folder: Folder;               // sidebar-tree selection (aria-current)
  mode: "grid" | "list";        // preserved explorer behavior
  sort: "name"|"size"|"time"|"kind";
  search: string;               // "/" hotkey; <3 chars resets; match/related/filtered
  selection: string | null;     // inspector target
  transition: "slide";          // stage changes always slide
}
```

## 10. Mastering-Ava007-Curation tabs

```text
MASTERING-AVA007-CURATION
├── CORE PARAMETERS                       DEV-LOCKED
├── THE CURATED EXOSKELETON CONFIGURATION DEV-LOCKED
│   ├── Manifesto Collection / Beyond The Rainbow Learning / VLA / Voice-Audio
├── FORGEDXFOLDERS
│   ├── F0 Raw / F1 Chunk / F2 Forge / F3 Manifest
├── CAPABILITY CATALOG
│   ├── Dependencies / Skills / Exoskeleton Bindings
├── ROCKSDB        → Forged Skills        (orange)
├── DUCKDB         → Forged Intelligence  (yellow)
├── HUGGING FACE   → Vendor Assets        (neutral; weights DEV-LOCKED)
└── REALTIME SANDBOX → Ava007 output      DEV-LOCKED (downstream of curation)
```

Curation **selects/refines** what Ava007 should use; forging **governs** what has
been produced, classified, stored, and traced. The Sandbox is downstream of
curation — it shows what the current configuration produces; it is not another
place where architecture is defined.

## 11. Aetheris — trial pipeline, next-FORGED candidate (owner ruling 2026-09-09)

Aetheris is **kept** as a trial system. Its pipeline (memory-tdai tiers
L3→L2→L1→L0, Rev.ike zero-copy ingestion, symbol-graph context offloading) is
the candidate to become the next FORGED. Consequences:

- Aetheris is **not** a second file system competing with ForgedxFolders; it is
  a pipeline on trial whose outputs enter F0 like any upload until validated.
- It **must be tested and validated** (engine, streaming, flat-RAM contract,
  tier immutability, content-addressed recall). Evidence is recorded in the
  wiki (`Aetheris-Trial`) and referenced here.
- On a passing validation, its lifecycle graduates INTO this Standard as the
  next FORGED revision (this section is replaced by the promotion spec).
- Until then: no capability may claim authority from Aetheris alone
  (`registry.json` keeps its `status` honest), and the HF vendor boundary
  applies to `hf:` sources exactly as it does here (§6).
