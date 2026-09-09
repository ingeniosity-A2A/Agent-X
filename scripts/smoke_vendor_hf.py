#!/usr/bin/env python3
"""Hugging Face vendor-boundary smoke test — OPTIONAL, network-dependent.

Core smoke (smoke_forgedxfolders.py) stays offline and must always pass.
This script additionally proves the live HF path end-to-end:

  1. dry-run: resolve revision → pinned commit hash + size (no download)
  2. real fetch of a small public artifact through the vendor boundary
  3. classification + facts parsing (tokenizer-config)
  4. write-once dedupe on identical bytes (same repo pin)
  5. fail-safe gates: size cap refuses BEFORE download; missing file / bad repo die clean

Exit 0 = all green. Runs against an isolated --db (never touches live data).
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "scripts" / "forgedxfolders.py"

PASS = FAIL = 0


def ck(got, want, label: str) -> None:
    global PASS, FAIL
    ok = got == want
    if ok:
        PASS += 1
        print(f"  PASS: {label}")
    else:
        FAIL += 1
        print(f"  FAIL: {label} (got: {got!r} / want: {want!r})")


DB_DIR = Path(tempfile.mkdtemp(prefix="hf-smoke-")) / "db"  # one housing for the whole run — dedupe needs state


def run(*args: str) -> dict:
    r = subprocess.run(
        [sys.executable, str(V), "--db", str(DB_DIR), *args],
        capture_output=True, text=True, cwd=ROOT, timeout=120,
    )
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return {"ok": False, "error": f"bad engine output: {r.stdout[:200]} {r.stderr[:300]}"}


def main() -> int:
    repo = "gpt2"
    fname = "config.json"

    print("== HF dry-run (pin + size, no download) ==")
    r = run("vendor-hf", "--repo", repo, "--filename", fname, "--dry-run")
    ck(r.get("ok"), True, "dry-run ok")
    commit = r.get("commit", "")
    ck(len(commit), 40, f"revision resolved to full commit hash ({r.get('repo_pin')})")
    ck(r.get("dry_run"), True, "dry-run flag honest (no bytes fetched)")
    ck(r.get("size_bytes", 0) > 0, True, "listing size present (fail-safe gate armed)")

    print("== HF real fetch → vendor store ==")
    r = run("vendor-hf", "--repo", repo, "--filename", fname)
    ck(r.get("ok"), True, "vendor-hf ok")
    ck(r.get("repo"), f"{repo}@{commit[:12]}", "repo provenance carries commit pin")
    ck(r.get("format"), "tokenizer-config", "artifact classified (tokenizer-config)")
    ck(r.get("facts", {}).get("model_type"), "gpt2", "facts parsed (model_type)")
    ck(r.get("quarantined"), False, "not quarantined")
    ck(r.get("deduped"), False, "first fetch is fresh (write-once)")

    print("== HF dedupe (same pin, same bytes) ==")
    r2 = run("vendor-hf", "--repo", repo, "--filename", fname)
    ck(r2.get("deduped"), True, "re-fetch deduped (content-addressed asset id)")

    print("== fail-safe gates ==")
    r = run("vendor-hf", "--repo", repo, "--filename", fname, "--max-bytes", "10")
    ck(r.get("ok"), False, "size cap refuses before download")
    ck("fail-safe" in r.get("error", ""), True, "size-cap error names the gate (Standard §6)")
    r = run("vendor-hf", "--repo", repo, "--filename", "definitely-not-here.bin")
    ck(r.get("ok"), False, "missing file dies clean (pinned listing)")
    ck(commit[:12] in r.get("error", ""), True, "missing-file error carries the pin")
    r = run("vendor-hf", "--repo", "no-such-org-xyz/no-such-repo-xyz", "--filename", "x.bin")
    ck(r.get("ok"), False, "unreachable repo dies clean")

    print(f"\nHF VENDOR SMOKE: {PASS} passed, {FAIL} failed")
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
