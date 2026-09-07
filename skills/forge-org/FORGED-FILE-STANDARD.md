# The Forged File Standard

**Status: canonical.** This document is the governing ingestion / asset-governance
specification for Mastering-Ava007-Curation. Where any other file, ZIP, demo, or
interface disagrees with this Standard, **this Standard wins**. Nothing competes
with it; existing material is brought INTO compliance.

Spec version: `1.0.0` · Owner directive: 2026-09-07

---

## 1. Canonical architecture

```text
AVA007 VAULT
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
             │ CAPABILITY   │   measurable static checks; deterministic
             │ HARNESS      │   replay verification
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
```

## 2. The four-tier role lock

| Tier | Role | Stores |
|------|------|--------|
| **RocksDB** | Skills — executable procedural knowledge; the **control plane** | namespaces (§5), never model weights, never blobs |
| **DuckDB** | Intelligence — structured knowledge, metadata, facts | SQL tables over the forged corpus + vendor facts |
| **Hugging Face** | Vendor / input boundary — **NOT a fourth intelligence layer** | models / tokenizers / configs in the vendor store; only metadata crosses into the vault |
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

Dependencies, Skill, and Harness are not unrelated objects — they are compiled
into one **CAPABILITY** the runtime can actually load:

```json
{
  "capability_id": "cap_<slug>_v<n>",
  "dependencies": {},
  "skill":      { "skill_id": "skill_...", "provides": [], "source_forged": "..." },
  "harness":    { "checks": [], "verdict": "pass|fail", "measured": {} },
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
  The vault records metadata + facts only; bytes never enter `modules/forge-org/data`.
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
└── vault.duckdb            intelligence (gitignored)
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
├── FORGED FILE ENGINE
│   ├── F0 Raw / F1 Chunk / F2 Forge / F3 Manifest
├── CAPABILITY CATALOG
│   ├── Dependencies / Skills / Harnesses
├── ROCKSDB        → Forged Skills        (orange)
├── DUCKDB         → Forged Intelligence  (yellow)
├── HUGGING FACE   → Vendor Assets        (neutral; weights DEV-LOCKED)
└── REALTIME SANDBOX → Ava007 output      DEV-LOCKED (downstream of curation)
```

Curation **selects/refines** what Ava007 should use; forging **governs** what has
been produced, classified, stored, and traced. The Sandbox is downstream of
curation — it shows what the current configuration produces; it is not another
place where architecture is defined.
