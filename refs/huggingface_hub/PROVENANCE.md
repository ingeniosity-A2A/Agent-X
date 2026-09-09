# Hugging Face — Vendored Reference (`refs/huggingface_hub/`)

**Status:** reference copy, read-only · **Version:** `huggingface_hub 1.9.2` ·
**Vendored:** 2026-09-09 · **Source:** installed wheel
(`python3.12/site-packages/huggingface_hub` → `src/`, `__pycache__` excluded)

## Position in the architecture

Hugging Face is a **vendor / input boundary** — it sits **outside** the F0→F3
forging lifecycle (Forged File Standard §6). Artifacts arriving from the Hub are
recorded by the vendor boundary (`forgedxfolders.py vendor` / `vendor-hf`);
Foraged metadata only — original bytes stay in the vendor store and are never
ingested as F0 unless explicitly routed through the Standard lifecycle.

Registry: `skills/registry.json` → `forgedxfolders.hf.vendor.boundary`.

## Why this copy exists (owner doctrine)

Documents and code that a boundary depends on are kept as file-level evidence.
This vendored source is the ground truth for the security properties the vendor
boundary relies on — verified line-level, not from memory:

| Property | Evidence (this copy) |
|---|---|
| **ETag = sha256 content addressing** | `src/file_download.py:71` — "Regex to check if the file etag IS a valid sha256"; LFS blobs expose their sha256 as ETag |
| **Commit-pin immutability** | `src/file_download.py:689-694` — `_cache_commit_hash_for_specific_revision`: tag/branch revisions resolve to a pinned `commit_hash`; downloads at a pinned hash are immutable |
| **`dry_run` gates** | `src/hf_api.py`, `src/_snapshot_download.py`, `src/cli/download.py` — destructive/bulk paths expose `dry_run` before touching the cache or a repo |
| **`RepoFile.security`** | `src/hf_api.py:698` `class RepoFile`; `:716-717` + `:727` — `security: BlobSecurityInfo` carries the Hub's security-scan verdict per file (`expand=True` on `list_repo_tree` / `get_paths_info`) |

## Rules of engagement

1. **Pin, then download.** The `vendor-hf` engine command resolves a revision to
   a commit hash and downloads at that hash (no floating `main`).
2. **Every artifact is classified.** safetensors / GGUF / tokenizer-config /
   weight-archive → vendor store; unknown → QUARANTINE (fail-safe).
3. **Re-vendor with a new PROVENANCE entry.** Never edit `src/` in place — a
   modified vendored copy is invalid evidence; bump the version and re-verify.
4. **Restoring after an environment reset:** `pip install -r requirements.txt`
   reinstalls the pinned dependency; this directory survives in git regardless.
