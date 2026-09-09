#!/usr/bin/env python3
"""FORGE-ORG engine — ForgedxFolders — Forged File Standard 1.1.0.

Control plane : real RocksDB (rocksdict) — namespaces per the Standard:
    skill:{skill_id}  capability:{capability_id}  asset:{asset_id}
    layer:{stack_id}:{layer_id}  idx:hash:{hash}  idx:asset:{asset_id}
    manifest:{forged_id}:{seq} (append-only)  stack:{job}:{frame}:{depth}
Intelligence  : real DuckDB (forgedxfolders.duckdb) — SQL facts over the forged corpus.
Lifecycle     : F0 write-once → F1 deterministic chunks (replay-proven) →
                normalize → Exoskeleton Application → F2 immutable (versioned on
                change) → housing (skills/intelligence) → F3 manifest append.
Vendor        : Hugging Face boundary OUTSIDE F0→F3. Artifact detector
                (safetensors / GGUF / ONNX-sniff / tokenizer-config JSON /
                weight-archive / unknown→quarantine). Bytes never stored.

Honesty rules: every number is measured; parse failures degrade to quarantine
or recorded-without-facts, never fabricated. No fake behavior anywhere.

Output: single JSON object on stdout (consumed by /api/forge/* routes).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import struct
import sys
import tempfile
import time
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path

import rocksdict
from rocksdict import Options, Rdict, ReadOptions, WriteBatch

SPEC = "forged-file-standard/1.1.0"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "modules" / "forge-org" / "data"
RAW = DATA / "raw"
FORGED_DIR = DATA / "forged"
VENDOR_DIR = DATA / "vendor"
QUAR = DATA / "quarantine"
ROCKS = DATA / "rocksdb"
DUCK = DATA / "forgedxfolders.duckdb"
MAX_UPLOAD = 32 * 1024 * 1024  # honest cap, documented in the Standard

CF_CONTROL = "control"
CF_IDX = "idx"
CF_MANIFEST = "manifest"
CF_META = "meta"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def out(obj: dict) -> None:
    print(json.dumps(obj, ensure_ascii=False))


def die(msg: str, code: int = 1) -> None:
    out({"ok": False, "error": msg})
    sys.exit(code)


# ── Control plane ────────────────────────────────────────────────────────────

def open_db(path: Path, create: bool = True) -> Rdict:
    """Single Rdict with real column families (same pattern as rocks_stack.py)."""
    opts = Options()
    opts.create_if_missing(create)
    opts.create_missing_column_families(create)
    return Rdict(str(path), opts)


def cf_bounds(prefix: str) -> tuple[bytes, bytes]:
    p = prefix.encode()
    return p, p[:-1] + bytes([p[-1] + 1])


def read_opts_for(prefix: str) -> ReadOptions:
    lo, hi = cf_bounds(prefix)
    ro = ReadOptions()
    ro.set_iterate_lower_bound(lo)
    ro.set_iterate_upper_bound(hi)
    return ro


def duck_connect(retries: int = 10, delay: float = 0.25):
    """Open the DuckDB intelligence file with bounded retry (single-writer
    file lock — a sibling process holding it is expected, not an error)."""
    import duckdb

    last: Exception | None = None
    for _ in range(retries):
        try:
            return duckdb.connect(str(DUCK))
        except Exception as e:
            last = e
            time.sleep(delay)
    print(json.dumps({"duckdb_lock_warning": str(last)[:200]}), file=sys.stderr)
    return None


def init_duck() -> None:
    """Create intelligence tables if missing (best-effort; control plane is
    authoritative — a duckdb failure never blocks the lifecycle)."""
    try:
        con = duck_connect()
        if con is None:
            return
        con.execute(
            """CREATE TABLE IF NOT EXISTS f0_uploads (
                f0_id VARCHAR PRIMARY KEY, sha256 VARCHAR, name VARCHAR,
                size_bytes BIGINT, mime VARCHAR, received_at TIMESTAMP,
                source VARCHAR, spec VARCHAR)"""
        )
        con.execute(
            """CREATE TABLE IF NOT EXISTS chunks (
                chunk_hash VARCHAR PRIMARY KEY, f0_id VARCHAR, forged_id VARCHAR,
                seq INTEGER, bytes INTEGER, endline INTEGER, parent_kind VARCHAR,
                parent_name VARCHAR, signals_json VARCHAR)"""
        )
        con.execute(
            """CREATE TABLE IF NOT EXISTS forged_files (
                forged_id VARCHAR PRIMARY KEY, version INTEGER, f0_id VARCHAR,
                sha256 VARCHAR, name VARCHAR, chunk_count INTEGER,
                skills_forged INTEGER, exoskeleton_verdict VARCHAR,
                forged_at TIMESTAMP, spec VARCHAR)"""
        )
        con.execute(
            """CREATE TABLE IF NOT EXISTS capabilities (
                capability_id VARCHAR PRIMARY KEY, forged_id VARCHAR, kind VARCHAR,
                inputs_json VARCHAR, outputs_json VARCHAR, permissions_json VARCHAR,
                validation_json VARCHAR, forged_at TIMESTAMP)"""
        )
        con.execute(
            """CREATE TABLE IF NOT EXISTS vendor_assets (
                asset_id VARCHAR PRIMARY KEY, repo VARCHAR, filename VARCHAR,
                format VARCHAR, classification VARCHAR, facts_json VARCHAR,
                quarantined BOOLEAN, vendored_at TIMESTAMP, sha256 VARCHAR,
                size_bytes BIGINT)"""
        )
        con.close()
    except Exception:
        pass


class ForgedXFolders:
    """One RocksDB instance, four column families, WriteBatch + bounded scans.

    RocksDB is single-writer: concurrent engine processes (e.g. parallel API
    calls) retry the open on lock contention instead of failing — bounded,
    honest retries (12 x 250ms)."""

    def __init__(self, retries: int = 12, delay: float = 0.25) -> None:
        DATA.mkdir(parents=True, exist_ok=True)
        for d in (RAW, FORGED_DIR, VENDOR_DIR, QUAR):
            d.mkdir(parents=True, exist_ok=True)
        last: Exception | None = None
        self.db = None
        for _ in range(retries):
            try:
                open_db(ROCKS).close()  # ensure dir exists before CF creation
                self.db = open_db(ROCKS)
                break
            except Exception as e:  # lock held by a sibling process
                last = e
                time.sleep(delay)
        if self.db is None:
            die(f"engine busy (rocksdb lock): {last}", 2)
        existing = set(Rdict.list_cf(str(ROCKS)))
        for name in (CF_CONTROL, CF_IDX, CF_MANIFEST, CF_META):
            if name not in existing:
                cf_opts = Options()
                cf_opts.create_if_missing(True)
                self.db.create_column_family(name, cf_opts)
        self.cfs = {name: self.db.get_column_family(name) for name in (CF_CONTROL, CF_IDX, CF_MANIFEST, CF_META)}
        init_duck()

    def put(self, cf: str, key: str, val: str) -> None:
        self.cfs[cf][key.encode()] = val.encode()

    def get(self, cf: str, key: str) -> str | None:
        v = self.cfs[cf].get(key.encode())
        return v.decode() if v is not None else None

    def has(self, cf: str, key: str) -> bool:
        return self.get(cf, key) is not None

    def scan(self, cf: str, prefix: str) -> list[tuple[str, str]]:
        """Bounded prefix scan. NOTE (honest engine note): this rocksdict build
        ignores ReadOptions iterate bounds in items(), so the bound is enforced
        with from_key seek + explicit upper-bound break — same semantics."""
        lo, hi = cf_bounds(prefix)
        rows: list[tuple[str, str]] = []
        for k, v in self.cfs[cf].items(from_key=lo):
            if k >= hi:
                break
            rows.append((k.decode(), v.decode()))
        return rows

    def count(self, cf: str) -> int:
        return sum(1 for _ in self.cfs[cf].keys())

    def batch_put_if_absent(self, cf: str, items: list[tuple[str, str]]) -> int:
        handle = self.db.get_column_family_handle(cf)
        wb = WriteBatch()
        added = 0
        for k, v in items:
            if not self.has(cf, k):
                wb.put(k.encode(), v.encode(), handle)
                added += 1
        self.db.write(wb)
        return added

    def close(self) -> None:
        for cf in self.cfs.values():
            cf.close()
        self.db.close()

    # -- manifest append-only ------------------------------------------------
    def manifest_append(self, forged_id: str, event: dict) -> int:
        prefix = f"manifest:{forged_id}:"
        seq = len(self.scan(CF_MANIFEST, prefix))
        key = f"{prefix}{seq:04d}"
        self.put(CF_MANIFEST, key, json.dumps(event, ensure_ascii=False))
        return seq

    def manifest_chain(self, forged_id: str) -> list[dict]:
        pairs = self.scan(CF_MANIFEST, f"manifest:{forged_id}:")
        pairs.sort(key=lambda kv: kv[0])
        return [json.loads(v) for _, v in pairs]


# ── F1 deterministic chunker (mirrors platform recursive-splitter) ──────────

SEPARATORS = ["\nclass ", "\nfunction ", "\nexport ", "\n\n", ";\n", "\n", " ", ""]
CODE_KEYWORDS = re.compile(r"\b(def|class|function|export|import|const|return|async)\b")
PARENT_RES = [
    (re.compile(r"^\s*class\s+([A-Za-z_][\w]*)", re.M), "class"),
    (re.compile(r"^\s*def\s+([A-Za-z_][\w]*)", re.M), "function"),
    (re.compile(r"^\s*(?:export\s+)?function\s+([A-Za-z_][\w]*)", re.M), "function"),
    (re.compile(r"^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_][\w]*)", re.M), "export"),
]


def fnv1a(text: str) -> str:
    """FNV-1a 32-bit over UTF-16-LE code units — matches the TS hashChunk."""
    h = 0x811C9DC5
    for byte in text.encode("utf-16-le"):
        h ^= byte
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def split_text(text: str, max_size: int, sep_index: int = 0) -> list[str]:
    """Recursive separator-priority split, honest character fallback.

    Termination: an oversized piece recurses with the NEXT separator index —
    the boundary separator is consumed by that split, so re-splitting with the
    same separator could never make progress (piece ends with it). Pieces at
    every level concatenate back to their input, so the chunk set always
    reconstructs the normalized text exactly.
    """
    if len(text) <= max_size:
        return [text] if text else []
    for i in range(sep_index, len(SEPARATORS)):
        sep = SEPARATORS[i]
        if sep == "":
            return [text[j : j + max_size] for j in range(0, len(text), max_size)]
        parts = text.split(sep)
        if len(parts) > 1:
            out_parts: list[str] = []
            for j, p in enumerate(parts):
                piece = p + (sep if j < len(parts) - 1 else "")
                if not piece:
                    continue
                if len(piece) <= max_size:
                    out_parts.append(piece)
                else:
                    out_parts.extend(split_text(piece, max_size, i + 1))
            return out_parts
    return [text]


def line_bounds(text: str, start_char: int, end_char: int) -> tuple[int, int]:
    sl = text.count("\n", 0, start_char) + 1
    el = text.count("\n", 0, min(end_char, len(text))) + 1
    return sl, el


def parent_header(text: str, start_char: int) -> dict | None:
    head = text[:start_char]
    tail = head[-6000:]
    best: tuple[int, str, str] | None = None
    for rx, kind in PARENT_RES:
        for m in rx.finditer(tail):
            if best is None or m.start() > best[0]:
                best = (m.start(), kind, m.group(1))
    return {"kind": best[1], "name": best[2]} if best else None


def chunk_signals(text: str) -> dict:
    braces = (text.count("{") - text.count("}"), text.count("(") - text.count(")"), text.count("[") - text.count("]"))
    kw = len(CODE_KEYWORDS.findall(text))
    words = len(re.findall(r"[A-Za-z][A-Za-z'-]*", text))
    sentences = max(1, len(re.findall(r"[.!?](?:\s|$)", text)))
    return {
        "balance": {"curly": braces[0], "paren": braces[1], "square": braces[2]},
        "code_keyword_hits": kw,
        "words": words,
        "avg_sentence_words": round(words / sentences, 1),
    }


# ── Normalize (never mutates F0) ─────────────────────────────────────────────

def normalize(text: str) -> tuple[str, dict]:
    stats = {"crlf": 0, "bom": False, "trailing_ws": 0, "blank_collapse": 0, "nfc_changed": 0}
    if text.startswith("\ufeff"):
        stats["bom"] = True
        text = text[1:]
    stats["crlf"] = text.count("\r\n")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    nfc = unicodedata.normalize("NFC", text)
    stats["nfc_changed"] = 0 if nfc == text else 1
    text = nfc
    lines = text.split("\n")
    stripped = sum(1 for l in lines if l != l.rstrip())
    stats["trailing_ws"] = stripped
    lines = [l.rstrip() for l in lines]
    out_lines: list[str] = []
    blank = 0
    for l in lines:
        if l == "":
            blank += 1
            if blank >= 3:
                stats["blank_collapse"] += 1
                continue
        else:
            blank = 0
        out_lines.append(l)
    return "\n".join(out_lines), stats


# ── Exoskeleton application ───────────────────────────────────────────────────────

def apply_exoskeleton(text: str, chunk_hashes: list[str]) -> dict:
    """Exoskeleton Application stage — measurable static checks + deterministic
    Exoskeleton replay verification (re-chunk must reproduce the hashes)."""
    t0 = time.perf_counter()
    replay = [c["hash"] for c in make_chunks(text)]
    deterministic = replay == chunk_hashes
    checks = {
        "deterministic_rechunk": deterministic,
        "hashes_stable": len(chunk_hashes),
        "ascii_ratio": round(sum(1 for ch in text if ord(ch) < 128) / max(1, len(text)), 4),
        "unbalanced_braces": sum(1 for c in [text.count("{") - text.count("}"), text.count("(") - text.count(")")] if c != 0),
    }
    verdict = "pass" if deterministic and checks["unbalanced_braces"] == 0 else "fail"
    return {"checks": checks, "verdict": verdict, "measured_us": int((time.perf_counter() - t0) * 1e6)}


def make_chunks(text: str, max_size: int = 1200) -> list[dict]:
    pieces = split_text(text, max_size)
    chunks = []
    pos = 0
    for i, p in enumerate(pieces):
        start = text.find(p, pos)
        start = start if start >= 0 else pos
        end = start + len(p)
        sl, el = line_bounds(text, start, end)
        chunks.append(
            {
                "seq": i,
                "hash": fnv1a(p),
                "bytes": len(p.encode("utf-8")),
                "chars": len(p),
                "startLine": sl,
                "endLine": el,
                "parent": parent_header(text, start),
                "signals": chunk_signals(p),
                "content": p,
            }
        )
        pos = end
    return chunks


# ── Lifecycle commands ───────────────────────────────────────────────────────

def cmd_ingest(args, fx: ForgedXFolders) -> None:
    src = Path(args.path)
    if not src.is_file():
        die(f"upload path not found: {args.path}")
    data = src.read_bytes()
    if len(data) > MAX_UPLOAD:
        die(f"upload exceeds documented {MAX_UPLOAD // (1024 * 1024)}MB cap ({len(data)} bytes)")
    digest = sha256(data)
    f0_id = f"f0-{digest[:12]}"
    target = RAW / f0_id
    deduped = target.is_dir()
    if not deduped:
        target.mkdir(parents=True)
        (target / "original.bin").write_bytes(data)  # exact bytes, write-once
    meta = {
        "f0_id": f0_id,
        "sha256": digest,
        "size_bytes": len(data),
        "name": args.name or src.name,
        "source": args.source or "upload",
        "received_at": now_iso(),
        "deduped": deduped,
        "spec": SPEC,
    }
    if not deduped:
        (target / "f0.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        # idx:hash reverse index + DuckDB intelligence (idempotent write-once)
        fx.put(CF_IDX, f"idx:hash:{digest}", json.dumps({"f0_id": f0_id, "kind": "f0"}))
        try:
            con = duck_connect()
            con.execute(
                "INSERT OR REPLACE INTO f0_uploads VALUES (?,?,?,?,?,?,?,?)",
                [f0_id, digest, meta["name"], len(data), args.mime or "application/octet-stream", datetime.now(), meta["source"], SPEC],
            )
            con.close()
        except Exception as e:  # intelligence is best-effort; control plane is authoritative
            meta["duckdb_warning"] = str(e)[:200]
    out({"ok": True, **meta})


def cmd_chunk(args, fx: ForgedXFolders) -> None:
    f0_id = args.f0
    d = RAW / f0_id
    if not (d / "f0.json").is_file():
        die(f"unknown f0_id: {f0_id}")
    meta = json.loads((d / "f0.json").read_text())
    raw_bytes = (d / "original.bin").read_bytes()
    try:
        text = raw_bytes.decode("utf-8")
        decode = "utf-8"
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1")
        decode = "latin-1"
    normalized, nstats = normalize(text)
    chunks = make_chunks(normalized, args.max_bytes)
    t0 = time.perf_counter()
    hashes = [c["hash"] for c in chunks]
    h = apply_exoskeleton(normalized, hashes)
    exoskeleton_us = int((time.perf_counter() - t0) * 1e6)
    # persist content-addressed chunks to the idx plane + intelligence
    fx.batch_put_if_absent(
        CF_IDX,
        [(f"idx:hash:{c['hash']}", json.dumps({"kind": "chunk", "f0_id": f0_id, "seq": c["seq"], "bytes": c["bytes"]})) for c in chunks],
    )
    try:
        con = duck_connect()
        for c in chunks:
            con.execute(
                "INSERT OR REPLACE INTO chunks VALUES (?,?,?,?,?,?,?,?,?)",
                [c["hash"], f0_id, None, c["seq"], c["bytes"], c["endLine"], (c["parent"] or {}).get("kind"), (c["parent"] or {}).get("name"), json.dumps(c["signals"])],
            )
        con.close()
    except Exception:
        pass
    out(
        {
            "ok": True,
            "f0_id": f0_id,
            "name": meta["name"],
            "decode": decode,
            "normalize": nstats,
            "chunk_count": len(chunks),
            "chunks": [{k: v for k, v in c.items() if k != "content"} for c in chunks],
            "exoskeleton": h,
            "exoskeleton_us": exoskeleton_us,
            "preview": normalized[:400],
        }
    )


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", Path(name).stem.lower()).strip("-")
    return (s or "file")[:40]


def cmd_forge(args, fx: ForgedXFolders) -> None:
    f0_id = args.f0
    d = RAW / f0_id
    if not (d / "f0.json").is_file():
        die(f"unknown f0_id: {f0_id}")
    meta = json.loads((d / "f0.json").read_text())
    raw_bytes = (d / "original.bin").read_bytes()
    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1")
    normalized, nstats = normalize(text)
    chunks = make_chunks(normalized, args.max_bytes)
    hashes = [c["hash"] for c in chunks]
    h = apply_exoskeleton(normalized, hashes)

    # versioning: same sha → new immutable version, never modify history
    existing = sorted(FORGED_DIR.glob(f"ff-{meta['sha256'][:8]}-v*.json"))
    version = len(existing) + 1
    forged_id = f"ff-{meta['sha256'][:8]}-v{version}"

    # forged skills: symbol extraction for code-bearing content
    symbols: list[str] = []
    for rx, _kind in PARENT_RES:
        symbols += [m.group(1) for m in rx.finditer(normalized)]
    symbols = sorted(set(symbols))[:64]
    skills = []
    if symbols or h["verdict"] == "pass":
        skill_id = f"skill_{slugify(meta['name'])}_{meta['sha256'][:8]}"
        skill = {
            "skill_id": skill_id,
            "provides": symbols,
            "source_forged": forged_id,
            "kind": "procedural" if symbols else "reference",
            "spec": SPEC,
        }
        skills.append(skill)
        fx.put(CF_CONTROL, f"skill:{skill_id}", json.dumps(skill, ensure_ascii=False))

    # compiled capability unit (the runtime-loadable object)
    capabilities = []
    if skills:
        cap_id = f"cap_{slugify(meta['name'])}_v{version}"
        cap = {
            "capability_id": cap_id,
            "dependencies": {},
            "skill": {"skill_id": skills[0]["skill_id"], "provides": skills[0]["provides"], "source_forged": forged_id},
            "exoskeleton": {"checks": h["checks"], "verdict": h["verdict"], "measured_us": h["measured_us"]},
            "inputs": {"schema": "text"},
            "outputs": {"schema": "text"},
            "permissions": [],
            "validation": {"deterministic": h["checks"]["deterministic_rechunk"], "replay": "chunk hashes stable"},
            "provenance": {"f0_id": f0_id, "sha256": meta["sha256"], "manifest": f"manifest:{forged_id}"},
        }
        capabilities.append(cap)
        fx.put(CF_CONTROL, f"capability:{cap_id}", json.dumps(cap, ensure_ascii=False))
        fx.put(CF_IDX, f"idx:asset:{cap_id}", json.dumps({"forged_id": forged_id, "kind": "capability"}))

    artifact = {
        "spec": SPEC,
        "forged_id": forged_id,
        "version": version,
        "f0_id": f0_id,
        "sha256": meta["sha256"],
        "name": meta["name"],
        "size_bytes": meta["size_bytes"],
        "forged_at": now_iso(),
        "normalize": nstats,
        "exoskeleton": h,
        "chunk_count": len(chunks),
        "chunks": [{k: v for k, v in c.items() if k != "content"} for c in chunks],
        "skills": [s["skill_id"] for s in skills],
        "capabilities": [c["capability_id"] for c in capabilities],
        "backlinks": {"f0": f0_id, "manifest_prefix": f"manifest:{forged_id}:"},
    }
    (FORGED_DIR / f"{forged_id}.json").write_text(json.dumps(artifact, ensure_ascii=False, indent=2))

    # F3 append-only manifest event
    seq = fx.manifest_append(
        forged_id,
        {
            "event": "forged",
            "ts": artifact["forged_at"],
            "f0_id": f0_id,
            "sha256": meta["sha256"],
            "version": version,
            "chunks": len(chunks),
            "skills": artifact["skills"],
            "capabilities": artifact["capabilities"],
            "exoskeleton": h["verdict"],
            "spec": SPEC,
        },
    )

    # intelligence tier
    try:
        con = duck_connect()
        con.execute(
            "INSERT OR REPLACE INTO forged_files VALUES (?,?,?,?,?,?,?,?,?,?)",
            [forged_id, version, f0_id, meta["sha256"], meta["name"], len(chunks), len(skills), h["verdict"], datetime.now(), SPEC],
        )
        for c in chunks:
            con.execute("UPDATE chunks SET forged_id = ? WHERE chunk_hash = ? AND f0_id = ?", [forged_id, c["hash"], f0_id])
        for cap in capabilities:
            con.execute(
                "INSERT OR REPLACE INTO capabilities VALUES (?,?,?,?,?,?,?,?)",
                [cap["capability_id"], forged_id, "compiled", json.dumps(cap["inputs"]), json.dumps(cap["outputs"]), json.dumps(cap["permissions"]), json.dumps(cap["validation"]), datetime.now()],
            )
        con.close()
    except Exception as e:
        artifact["duckdb_warning"] = str(e)[:200]
    artifact["manifest_seq"] = seq
    out({"ok": True, **{k: v for k, v in artifact.items() if k != "chunks"}})


def cmd_manifest(args, fx: ForgedXFolders) -> None:
    forges = []
    for p in sorted(FORGED_DIR.glob("ff-*-v*.json")):
        a = json.loads(p.read_text())
        chain = fx.manifest_chain(a["forged_id"])
        forges.append(
            {
                "forged_id": a["forged_id"],
                "name": a["name"],
                "sha256": a["sha256"],
                "version": a["version"],
                "f0_id": a["f0_id"],
                "chunk_count": a["chunk_count"],
                "skills": a["skills"],
                "capabilities": a["capabilities"],
                "exoskeleton": a["exoskeleton"]["verdict"],
                "forged_at": a["forged_at"],
                "provenance_events": len(chain),
            }
        )
    uploads = sorted(RAW.glob("f0-*"))
    vendor = sorted(VENDOR_DIR.glob("*.json"))
    quarantined = sorted(QUAR.glob("*.json"))
    out(
        {
            "ok": True,
            "spec": SPEC,
            "f0_count": len(uploads),
            "f2_count": len(forges),
            "vendor_count": len(vendor),
            "quarantine_count": len(quarantined),
            "forged": forges,
        }
    )


def cmd_tree(args, fx: ForgedXFolders) -> None:
    def entries(kind: str):
        rows = []
        if kind == "f0":
            for d in sorted(RAW.glob("f0-*")):
                m = json.loads((d / "f0.json").read_text())
                rows.append({"id": m["f0_id"], "name": m["name"], "bytes": m["size_bytes"], "ts": m["received_at"]})
        elif kind == "f2":
            for p in sorted(FORGED_DIR.glob("ff-*-v*.json")):
                a = json.loads(p.read_text())
                rows.append({"id": a["forged_id"], "name": a["name"], "bytes": a["size_bytes"], "ts": a["forged_at"], "exoskeleton": a["exoskeleton"]["verdict"], "chunks": a["chunk_count"]})
        elif kind == "skills":
            for k, v in fx.scan(CF_CONTROL, "skill:"):
                s = json.loads(v)
                rows.append({"id": s["skill_id"], "name": s["skill_id"], "bytes": len(v), "provides": len(s.get("provides", [])), "ts": s.get("source_forged", "")})
        elif kind == "capabilities":
            for k, v in fx.scan(CF_CONTROL, "capability:"):
                c = json.loads(v)
                rows.append({"id": c["capability_id"], "name": c["capability_id"], "bytes": len(v), "verdict": c["exoskeleton"]["verdict"], "ts": c["provenance"]["f0_id"]})
        elif kind == "vendor":
            for p in sorted(VENDOR_DIR.glob("*.json")):
                a = json.loads(p.read_text())
                rows.append({"id": a["asset_id"], "name": a["filename"], "bytes": a.get("size_bytes", 0), "format": a["format"], "ts": a["vendored_at"]})
        elif kind == "quarantine":
            for p in sorted(QUAR.glob("*.json")):
                a = json.loads(p.read_text())
                rows.append({"id": a["asset_id"], "name": a["filename"], "bytes": a.get("size_bytes", 0), "format": a["format"], "ts": a["vendored_at"]})
        return rows

    out(
        {
            "ok": True,
            "f0": entries("f0"),
            "f2": entries("f2"),
            "skills": entries("skills"),
            "capabilities": entries("capabilities"),
            "vendor": entries("vendor"),
            "quarantine": entries("quarantine"),
        }
    )


def cmd_entry(args, fx: ForgedXFolders) -> None:
    kind, eid = args.kind, args.id
    if kind == "f0":
        d = RAW / eid
        if not (d / "f0.json").is_file():
            die(f"unknown f0: {eid}")
        m = json.loads((d / "f0.json").read_text())
        b = (d / "original.bin").read_bytes()
        try:
            preview = b[:2048].decode("utf-8")
        except UnicodeDecodeError:
            preview = b[:2048].decode("latin-1")
        out({"ok": True, "kind": "f0", **m, "preview": preview, "truncated": len(b) > 2048})
    elif kind == "f2":
        p = FORGED_DIR / f"{eid}.json"
        if not p.is_file():
            die(f"unknown forged: {eid}")
        a = json.loads(p.read_text())
        a["provenance"] = fx.manifest_chain(eid)
        out({"ok": True, "kind": "f2", **a})
    elif kind in ("skill", "capability"):
        key = f"{kind}:{eid}"
        v = fx.get(CF_CONTROL, key)
        if v is None:
            die(f"unknown {kind}: {eid}")
        out({"ok": True, "kind": kind, **json.loads(v)})
    elif kind in ("vendor", "quarantine"):
        d = VENDOR_DIR if kind == "vendor" else QUAR
        p = d / f"{eid}.json"
        if not p.is_file():
            die(f"unknown {kind}: {eid}")
        out({"ok": True, "kind": kind, **json.loads(p.read_text())})
    else:
        die(f"unknown kind: {kind}")


def cmd_stats(args, fx: ForgedXFolders) -> None:
    tables = {}
    try:
        con = duck_connect()
        if con is None:
            tables = {"error": "intelligence file busy (lock) — control plane unaffected"}
        else:
            for t in ("f0_uploads", "chunks", "forged_files", "capabilities", "vendor_assets"):
                tables[t] = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            con.close()
    except Exception as e:
        tables = {"error": str(e)[:200]}
    out(
        {
            "ok": True,
            "spec": SPEC,
            "rocksdb": {
                "control_keys": fx.count(CF_CONTROL),
                "idx_keys": fx.count(CF_IDX),
                "manifest_keys": fx.count(CF_MANIFEST),
                "meta_keys": fx.count(CF_META),
            },
            "duckdb": tables,
            "files": {
                "raw": len(list(RAW.glob("f0-*"))),
                "forged": len(list(FORGED_DIR.glob("ff-*-v*.json"))),
                "vendor": len(list(VENDOR_DIR.glob("*.json"))),
                "quarantine": len(list(QUAR.glob("*.json"))),
            },
        }
    )


# ── HF vendor boundary: artifact detector ───────────────────────────────────

WEIGHT_EXTS = {".pt", ".pth", ".ckpt", ".bin", ".h5", ".msgpack", ".pkl", ".model"}


def parse_safetensors(buf: bytes) -> dict | None:
    if len(buf) < 12:
        return None
    n = int.from_bytes(buf[:8], "little")
    if n <= 0 or n > 100 * 1024 * 1024 or 8 + n > len(buf):
        return None
    try:
        header = json.loads(buf[8 : 8 + n])
    except Exception:
        return None
    meta = header.pop("__metadata__", {})
    dtypes: dict[str, int] = {}
    params = 0
    for k, v in header.items():
        if not isinstance(v, dict):
            continue
        dt = v.get("dtype", "?")
        dtypes[dt] = dtypes.get(dt, 0) + 1
        shape = v.get("shape", [])
        p = 1
        try:
            for dim in shape:
                p *= int(dim)
            params += p
        except Exception:
            pass
    return {"tensors": len(header), "dtypes": dtypes, "total_params": params, "metadata": {k: str(v)[:120] for k, v in list(meta.items())[:8]}}


def parse_gguf(buf: bytes) -> dict | None:
    if buf[:4] != b"GGUF" or len(buf) < 24:
        return None
    version, tensor_count, kv_count = struct.unpack_from("<IQQ", buf, 4)
    facts: dict = {"gguf_version": version, "tensor_count": tensor_count, "kv_count": kv_count}
    off = 24

    def read_str() -> str | None:
        nonlocal off
        if off + 8 > len(buf):
            return None
        (ln,) = struct.unpack_from("<Q", buf, off)
        off += 8
        if ln > 1_000_000 or off + ln > len(buf):
            return None
        s = buf[off : off + ln].decode("utf-8", "replace")
        off += ln
        return s

    def read_val(vtype: int):
        nonlocal off
        sizes = {0: 1, 1: 1, 2: 2, 3: 2, 4: 4, 5: 4, 6: 4, 7: 1, 10: 8, 11: 8, 12: 8}
        if vtype == 8:
            return read_str()
        if vtype == 9:
            if off + 12 > len(buf):
                return None
            etype, cnt = struct.unpack_from("<IQ", buf, off)
            off += 12
            step = sizes.get(etype)
            if etype == 8:
                return [read_str() for _ in range(min(cnt, 8))] if cnt else []
            fmtmap = {4: "I", 5: "i", 10: "Q", 11: "q", 6: "f", 12: "d", 0: "B", 1: "b", 2: "H", 3: "h", 7: "B"}
            if etype not in fmtmap or step is None or off + step * min(cnt, 8) > len(buf):
                off += step * cnt if step else 0
                return None
            vals = [struct.unpack_from("<" + fmtmap[etype], buf, off + i * step)[0] for i in range(min(cnt, 8))]
            off += step * cnt
            return vals
        step = sizes.get(vtype)
        if step is None or off + step > len(buf):
            return None
        fmt = {0: "B", 1: "b", 2: "H", 3: "h", 4: "I", 5: "i", 6: "f", 7: "B", 10: "Q", 11: "q", 12: "d"}[vtype]
        (v,) = struct.unpack_from("<" + fmt, buf, off)
        off += step
        return v

    try:
        for _ in range(min(kv_count, 64)):
            key = read_str()
            if key is None or off >= len(buf):
                break
            (vtype,) = struct.unpack_from("<I", buf, off)
            off += 4
            val = read_val(vtype)
            if key in ("general.architecture", "general.name", "general.file_type", "general.quantization_version", "tokenizer.ggml.model"):
                facts[key.split(".", 1)[1] if key.startswith("general.") else key] = val
            if len(facts) > 12:
                break
    except Exception:
        pass
    return facts


def parse_onnx_sniff(buf: bytes) -> dict | None:
    """Minimal protobuf top-level sniff: ir_version (f1 varint),
    producer_name (f2 string), graph presence (f7). Honest: facts only when
    parseable; classification even when facts are empty."""
    if not buf:
        return None
    off = 0
    facts: dict = {"onnx_fields": []}

    def varint(o: int) -> tuple[int, int] | None:
        shift = result = 0
        while o < len(buf) and (b := buf[o]) & 0x80:
            result |= (b & 0x7F) << shift
            shift += 7
            o += 1
            if shift > 63:
                return None
        if o >= len(buf):
            return None
        return result | (buf[o] & 0x7F) << shift, o + 1

    try:
        while off < min(len(buf), 4096):
            tag = varint(off)
            if tag is None:
                break
            key, off = tag
            field, wire = key >> 3, key & 7
            if wire == 0:
                v = varint(off)
                if v is None:
                    break
                val, off = v
                if field == 1:
                    facts["ir_version"] = val
                facts["onnx_fields"].append(field)
            elif wire == 2:
                ln = varint(off)
                if ln is None:
                    break
                l, off = ln
                if field == 2:
                    facts["producer_name"] = buf[off : off + l].decode("utf-8", "replace")[:80]
                facts["onnx_fields"].append(field)
                off += l
            elif wire == 5:
                off += 4
            elif wire == 1:
                off += 8
            else:
                break
            if off > len(buf):
                return None
    except Exception:
        return None
    if 7 in facts["onnx_fields"] or "ir_version" in facts:
        facts["graph_present"] = 7 in facts["onnx_fields"]
        return facts
    return None


def detect_artifact(buf: bytes, filename: str) -> tuple[str, str, dict, bool]:
    """Returns (format, classification, facts, quarantined)."""
    ext = Path(filename).suffix.lower()
    st = parse_safetensors(buf)
    if st is not None:
        return "safetensors", "model-weights (header parsed; bytes stay in vendor store)", st, False
    gg = parse_gguf(buf)
    if gg is not None:
        return "gguf", "model-weights (header parsed; bytes stay in vendor store)", gg, False
    if ext == ".json":
        try:
            cfg = json.loads(buf.decode("utf-8"))
            if isinstance(cfg, dict):
                keys = ["architectures", "model_type", "vocab_size", "hidden_size", "tokenizer_class", "bos_token_id", "transformers_version"]
                facts = {k: cfg[k] for k in keys if k in cfg}
                if facts:
                    return "tokenizer-config", "vendor config/tokenizer metadata", facts, False
                return "json", "vendor JSON asset", {"top_keys": list(cfg.keys())[:12]}, False
        except Exception:
            pass
    if ext in (".onnx", ".ort"):
        facts = parse_onnx_sniff(buf[:4096])
        return "onnx", "onnx protobuf (sniffed; facts when parseable)", facts or {}, False
    if ext in WEIGHT_EXTS:
        return ext.lstrip("."), "weight-archive (not parsed; bytes stay in vendor store)", {}, False
    return "unknown", "unrecognized artifact", {}, True


def _vendor_store(fx: ForgedXFolders, buf: bytes, repo: str, filename: str) -> dict:
    """Artifact detection + vendor-store record — shared by `vendor` and `vendor-hf`."""
    digest = sha256(buf)
    asset_id = f"asset-{digest[:12]}"
    fmt, classification, facts, quarantined = detect_artifact(buf, filename)
    record = {
        "asset_id": asset_id,
        "repo": repo,
        "filename": filename,
        "sha256": digest,
        "size_bytes": len(buf),
        "format": fmt,
        "classification": classification,
        "facts": facts,
        "quarantined": quarantined,
        "vendored_at": now_iso(),
        "spec": SPEC,
        "note": "Hugging Face is a vendor/input boundary — original artifact stays in the vendor store; ForgedxFolders holds metadata only.",
    }
    (QUAR if quarantined else VENDOR_DIR).mkdir(parents=True, exist_ok=True)
    target = (QUAR if quarantined else VENDOR_DIR) / f"{asset_id}.json"
    existing = target.exists()
    if not existing:
        target.write_text(json.dumps(record, ensure_ascii=False, indent=2))
        fx.put(CF_CONTROL, f"asset:{asset_id}", json.dumps(record, ensure_ascii=False))
        fx.put(CF_IDX, f"idx:asset:{asset_id}", json.dumps({"format": fmt, "quarantined": quarantined}))
        try:
            con = duck_connect()
            con.execute(
                "INSERT OR REPLACE INTO vendor_assets VALUES (?,?,?,?,?,?,?,?,?,?)",
                [asset_id, record["repo"], record["filename"], fmt, classification, json.dumps(facts), quarantined, datetime.now(), digest, len(buf)],
            )
            con.close()
        except Exception as e:
            record["duckdb_warning"] = str(e)[:200]
    return {"ok": True, "deduped": existing, **record}


def cmd_vendor(args, fx: ForgedXFolders) -> None:
    src = Path(args.path)
    if not src.is_file():
        die(f"vendor path not found: {args.path}")
    out(_vendor_store(fx, src.read_bytes(), args.repo or "(direct upload)", args.filename or src.name))


def cmd_vendor_hf(args, fx: ForgedXFolders) -> None:
    """Hugging Face → vendor boundary. Pin revision → commit hash, fail-safe on
    size, classify, record metadata only (bytes stay in the vendor store).
    Standard §6: HF is an input boundary — nothing here enters F0→F3."""
    try:
        from huggingface_hub import HfApi, hf_hub_download
    except ImportError:
        die("huggingface_hub not installed — restore with: pip install -r requirements.txt (see refs/huggingface_hub/PROVENANCE.md)", 3)

    api = HfApi()
    # 1. resolve the revision to a pinned commit hash (no floating refs)
    try:
        info = api.repo_info(args.repo, repo_type=args.repo_type, revision=args.revision, files_metadata=True)
    except Exception as e:
        die(f"repo not reachable: {args.repo} (revision={args.revision}): {e}", 4)
    commit = info.sha
    if not commit:
        die(f"could not resolve {args.repo}@{args.revision} to a commit hash", 4)
    pin = f"{args.repo}@{commit[:12]}"

    # 2. fail-safe size check BEFORE downloading (siblings carry file sizes)
    size = next((s.size for s in (info.siblings or []) if s.rfilename == args.filename), None)
    if size is None:
        die(f"file not in repo listing: {args.filename} ({pin})", 4)
    if size > args.max_bytes:
        die(f"refusing download: {args.filename} is {size:,} bytes > --max-bytes {args.max_bytes:,} (fail-safe, Standard §6)", 5)

    # 3. best-effort Hub security scan verdict (RepoFile.security / BlobSecurityInfo)
    security = None
    if not args.no_security:
        try:
            for entry in api.list_repo_tree(args.repo, repo_type=args.repo_type, revision=commit, expand=True, recursive=False):
                if getattr(entry, "path", "") == args.filename and getattr(entry, "security", None):
                    security = {"file_status": getattr(entry.security, "fileStatus", None), "scanner": getattr(entry.security, "scanner", None)}
                    break
        except Exception:
            security = None  # best-effort only — never blocks vendoring

    if args.dry_run:
        out({"ok": True, "dry_run": True, "repo_pin": pin, "commit": commit, "filename": args.filename, "size_bytes": size, "would_classify_route": "vendor-store → artifact detection", "security": security})
        return

    path = hf_hub_download(repo_id=args.repo, repo_type=args.repo_type, filename=args.filename, revision=commit)
    buf = Path(path).read_bytes()
    if len(buf) != size:  # listing-size vs downloaded-size agreement gate
        die(f"post-download size mismatch: got {len(buf):,}, listing said {size:,}", 5)
    result = _vendor_store(fx, buf, pin, args.filename)
    result["commit"] = commit
    result["security"] = security
    out(result)


def main() -> None:
    ap = argparse.ArgumentParser(prog="forgedxfolders.py")
    ap.add_argument("--db", default=None, help=argparse.SUPPRESS)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("ingest")
    p.add_argument("--path", required=True)
    p.add_argument("--name", default=None)
    p.add_argument("--source", default="upload")
    p.add_argument("--mime", default=None)

    p = sub.add_parser("chunk")
    p.add_argument("--f0", required=True)
    p.add_argument("--max-bytes", type=int, default=1200)

    p = sub.add_parser("forge")
    p.add_argument("--f0", required=True)
    p.add_argument("--max-bytes", type=int, default=1200)

    sub.add_parser("manifest")
    sub.add_parser("tree")
    sub.add_parser("stats")

    p = sub.add_parser("entry")
    p.add_argument("--kind", required=True)
    p.add_argument("--id", required=True)

    p = sub.add_parser("vendor")
    p.add_argument("--path", required=True)
    p.add_argument("--repo", default=None)
    p.add_argument("--filename", default=None)

    p = sub.add_parser("vendor-hf")
    p.add_argument("--repo", required=True)
    p.add_argument("--filename", required=True)
    p.add_argument("--repo-type", default="model", choices=["model", "dataset", "space"])
    p.add_argument("--revision", default="main")
    p.add_argument("--max-bytes", type=int, default=209_715_200, help="fail-safe cap before download (default 200 MiB)")
    p.add_argument("--dry-run", action="store_true", help="resolve pin + size + security verdict; download nothing")
    p.add_argument("--no-security", action="store_true", help="skip best-effort Hub security-scan lookup")

    args = ap.parse_args()

    if getattr(args, "db", None):
        global DATA, RAW, FORGED_DIR, VENDOR_DIR, QUAR, ROCKS, DUCK
        DATA = Path(args.db)
        RAW = DATA / "raw"
        FORGED_DIR = DATA / "forged"
        VENDOR_DIR = DATA / "vendor"
        QUAR = DATA / "quarantine"
        ROCKS = DATA / "rocksdb"
        DUCK = DATA / "forgedxfolders.duckdb"

    fx = ForgedXFolders()
    try:
        if args.cmd == "ingest":
            cmd_ingest(args, fx)
        elif args.cmd == "chunk":
            cmd_chunk(args, fx)
        elif args.cmd == "forge":
            cmd_forge(args, fx)
        elif args.cmd == "manifest":
            cmd_manifest(args, fx)
        elif args.cmd == "tree":
            cmd_tree(args, fx)
        elif args.cmd == "entry":
            cmd_entry(args, fx)
        elif args.cmd == "vendor":
            cmd_vendor(args, fx)
        elif args.cmd == "vendor-hf":
            cmd_vendor_hf(args, fx)
        elif args.cmd == "stats":
            cmd_stats(args, fx)
    finally:
        fx.close()


if __name__ == "__main__":
    main()
