# Hugging Face Vendor Boundary

**Status:** operational · **Verified live:** 2026-09-09 · **Scope:** input
boundary only — **outside** F0→F3 (Forged File Standard §6) · **Registry:**
`forgedxfolders.hf.vendor.boundary`

## Position

Hugging Face is a **vendor**: artifacts arrive from it, but nothing it serves
is trusted or forged automatically. The engine records **metadata only**;
original bytes stay in the vendor store (`modules/forge-org/data/vendor/`,
gitignored housing). Promotion of any vendored artifact into the canonical
lifecycle happens only by an explicit F0 ingest — same as any other upload.

## What was installed (2026-09-09)

| Piece | Location | Purpose |
|-------|----------|---------|
| Dependency pin | `requirements.txt` | `huggingface_hub>=1.9,<2` + engine deps (`rocksdict`, `duckdb`) — restores after any environment reset |
| Vendored reference | `refs/huggingface_hub/src/` + `PROVENANCE.md` | 1.9.2 source as file-level evidence of the security model (ETag=sha256, commit-pin, dry_run, `RepoFile.security`) |
| Engine command | `scripts/forgedxfolders.py vendor-hf` | Pin → size gate → fetch → classify → vendor store |
| Network smoke | `scripts/smoke_vendor_hf.py` | 16 checks, live HF path (optional; core smoke stays offline) |
| Env contract | `.env.example` | Optional `HF_TOKEN` (public repos work unauthenticated, rate-limited) |

## `vendor-hf` — rules enforced

1. **Pin, then download.** The revision (default `main`) is resolved to a full
   commit hash first; the download happens at that hash. Provenance records
   `repo@commit[:12]` — no floating refs in the ledger.
2. **Fail-safe size gate.** The repo listing carries file sizes; anything over
   `--max-bytes` (default 200 MiB) is refused **before** a single byte is
   downloaded (Standard §6).
3. **Dry-run first.** `--dry-run` resolves pin + size + security verdict and
   fetches nothing.
4. **Classify everything.** safetensors / GGUF / tokenizer-config /
   weight-archive → vendor store with parsed facts; **unknown → QUARANTINE**
   (fail-safe, never dropped silently).
5. **Write-once dedupe.** Content-addressed `asset-<sha256[:12]>` — re-fetching
   the same bytes is a no-op.
6. **Security verdict is best-effort.** The Hub's per-file security scan
   (`RepoFile.security`) is recorded when available but never blocks vendoring.

## Verified live (2026-09-09, gpt2@607a30d783df)

- `--dry-run`: pinned commit, 665 bytes, no download — PASS
- Real fetch: classified `tokenizer-config`, facts `{model_type: gpt2, vocab_size: 50257}`, sha256 recorded — PASS
- Dedupe on identical bytes — PASS
- Size cap refuses (`--max-bytes 10`) before download — PASS
- Missing file / unreachable repo die with clean JSON errors — PASS
- **HF VENDOR SMOKE: 16/16** · **Core smoke (offline): 31/31**

## Restoring after an environment reset

```bash
pip install -r requirements.txt          # rocksdict + duckdb + huggingface_hub
python scripts/smoke_forgedxfolders.py   # offline core lifecycle (must be 31/31)
python scripts/smoke_vendor_hf.py        # live HF boundary (optional, network)
```

The vendored reference survives in git regardless of environment resets — that
is its point: evidence does not depend on the sandbox staying up.
