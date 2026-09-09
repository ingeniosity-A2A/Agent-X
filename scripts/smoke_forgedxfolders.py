#!/usr/bin/env python3
"""FORGE-ORG engine smoke test — Forged File Standard 1.0.0.

Exercises the real lifecycle against modules/forge-org/data:
F0 write-once + dedupe → F1 deterministic chunking + replay →
normalize stats → F2 forge + skills + compiled capability →
immutability (re-forge = v2, never silent modify) → F3 append-only
manifest → tree/entry/stats → HF artifact detector routing
(safetensors / GGUF / tokenizer-config / unknown→quarantine).
"""
import json
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "scripts" / "forgedxfolders.py"
DATA_DIR = Path(tempfile.gettempdir()) / f"forge-smoke-fx-{id(object())}"

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


def run(*args: str) -> dict:
    # isolated housing — the smoke test never touches live ForgedxFolders
    r = subprocess.run(
        [sys.executable, str(V), "--db", str(DATA_DIR), *args],
        capture_output=True,
        text=True,
        cwd=ROOT,
        timeout=60,
    )
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return {"ok": False, "error": f"bad engine output: {r.stdout[:200]} {r.stderr[:300]}"}


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="forge-smoke-"))
    try:
        # ── corpus ──
        (tmp / "tokenizer.py").write_text(
            "class Tokenizer:\n    def encode(self, text):\n        return [ord(c) for c in text]\n\n"
            "export function compile(src) {\n  const out = src.trim();\n  return out;\n}\n"
        )
        # regression: huge single line (forces char fallback) + trailing separator
        (tmp / "huge.txt").write_text("x" * 5000 + "\nclass ")
        hdr = json.dumps(
            {"w": {"dtype": "F32", "shape": [2, 2], "data_offsets": [0, 16]}, "__metadata__": {"format": "pt"}}
        ).encode()
        (tmp / "model.safetensors").write_bytes(struct.pack("<Q", len(hdr)) + hdr + b"\x00" * 16)
        kv = struct.pack("<Q", 12) + b"general.name" + struct.pack("<I", 8) + struct.pack("<Q", 8) + b"ava-mini"
        (tmp / "model.gguf").write_bytes(b"GGUF" + struct.pack("<IQQ", 3, 1, 1) + kv)
        (tmp / "config.json").write_text(json.dumps({"architectures": ["LlamaForCausalLM"], "model_type": "llama", "vocab_size": 32000}))
        (tmp / "blob.bin").write_bytes(bytes(range(256)) * 4)
        (tmp / "blob.xyz").write_bytes(bytes(range(256)) * 4)

        print("== F0 ingest ==")
        r = run("ingest", "--path", str(tmp / "tokenizer.py"), "--name", "tokenizer.py")
        ck(r.get("ok"), True, "F0 ingest ok")
        f0 = r.get("f0_id", "")
        ck(f0.startswith("f0-"), True, f"F0 id content-addressed ({f0})")
        r2 = run("ingest", "--path", str(tmp / "tokenizer.py"), "--name", "tokenizer.py")
        ck(r2.get("deduped"), True, "F0 dedupe on identical bytes (write-once)")

        print("== F1 chunk ==")
        r = run("chunk", "--f0", f0)
        ck(r.get("ok"), True, "F1 chunk ok")
        ck(r.get("exoskeleton", {}).get("verdict"), "pass", "F1 exoskeleton verdict pass")
        ck(r.get("exoskeleton", {}).get("checks", {}).get("deterministic_rechunk"), True, "F1 deterministic replay")
        ck("normalize" in r, True, "F1 normalize stats present")
        ck(r.get("chunk_count", 0) >= 1, True, f"F1 chunk count measurable ({r.get('chunk_count')})")
        r2 = run("ingest", "--path", str(tmp / "huge.txt"), "--name", "huge.txt")
        r3 = run("chunk", "--f0", r2.get("f0_id", ""))
        ck(r3.get("ok"), True, "F1 chunk: huge single line + trailing sep terminates (recursion regression)")

        print("== F2 forge ==")
        r = run("forge", "--f0", f0)
        ck(r.get("ok"), True, "F2 forge ok")
        fid = r.get("forged_id", "")
        ck(r.get("exoskeleton", {}).get("verdict"), "pass", "F2 exoskeleton pass")
        ck(len(r.get("skills", [])) >= 1, True, f"F2 forged skill(s) {r.get('skills')}")
        ck(len(r.get("capabilities", [])) >= 1, True, f"F2 compiled capability {r.get('capabilities')}")
        r2 = run("forge", "--f0", f0)
        ck(r2.get("version"), 2, "immutability: re-forge → v2 (no silent modify)")

        print("== F3 manifest ==")
        r = run("manifest")
        ck(r.get("f2_count"), 2, "F3 counts both immutable versions")
        ck(all(f["provenance_events"] >= 1 for f in r.get("forged", [])), True, "F3 provenance chain exists")

        print("== tree + entry + stats ==")
        t = run("tree")
        ck(len(t.get("f0", [])), 2, "tree f0 entries (spec corpus + regression file)")
        ck(len(t.get("f2", [])), 2, "tree f2 entries")
        ck(len(t.get("skills", [])) >= 1, True, "tree skills (RocksDB control plane)")
        skill_id = t["skills"][0]["id"]
        r = run("entry", "--kind", "skill", "--id", skill_id)
        ck(r.get("ok"), True, f"skill entry readable ({skill_id})")
        r = run("stats")
        ck(r.get("duckdb", {}).get("forged_files"), 2, "DuckDB intelligence rows")
        ck(r.get("rocksdb", {}).get("manifest_keys", 0) >= 2, True, f"RocksDB manifest keys {r.get('rocksdb')}")

        print("== HF vendor boundary (artifact detector) ==")
        r = run("vendor", "--path", str(tmp / "model.safetensors"), "--repo", "test/ava", "--filename", "model.safetensors")
        ck(r.get("format"), "safetensors", "safetensors classified")
        ck(r.get("facts", {}).get("tensors"), 1, "safetensors header parsed (tensor count)")
        ck(r.get("quarantined"), False, "safetensors NOT quarantined")
        r = run("vendor", "--path", str(tmp / "model.gguf"), "--repo", "test/ava", "--filename", "model.gguf")
        ck(r.get("format"), "gguf", "gguf classified")
        ck(r.get("facts", {}).get("name"), "ava-mini", "gguf general.name fact parsed")
        r = run("vendor", "--path", str(tmp / "config.json"), "--repo", "test/ava", "--filename", "config.json")
        ck(r.get("format"), "tokenizer-config", "tokenizer/config classified")
        ck(r.get("facts", {}).get("model_type"), "llama", "config model_type fact")
        r = run("vendor", "--path", str(tmp / "blob.bin"), "--repo", "test/ava", "--filename", "blob.bin")
        ck(r.get("quarantined"), False, "weight-archive .bin recorded, not quarantined (Standard §6)")
        r = run("vendor", "--path", str(tmp / "blob.xyz"), "--repo", "test/ava", "--filename", "blob.xyz")
        ck(r.get("quarantined"), True, "unknown → QUARANTINE (fail-safe)")

        print(f"\nSMOKE: {PASS} passed, {FAIL} failed")
        return 0 if FAIL == 0 else 1
    finally:
        import shutil

        shutil.rmtree(tmp, ignore_errors=True)
        shutil.rmtree(DATA_DIR, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
