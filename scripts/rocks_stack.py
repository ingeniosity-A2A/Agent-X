#!/usr/bin/env python3
"""RocksDB Stacking Engine — interactive file-folder system for render stacks.

Implements the owner's RocksDB asset-stacking architecture for the ESA and
Help Assembly services (each service HOUSES its own database, filled with
its respective content):

    modules/esa/data/rocksdb/
    modules/helpassembly/data/rocksdb/

Design (per the architecture spec, 2026-09-07):

- Key format   : render_job_id # frame_number # layer_depth  (byte-sorted so
                 depth order survives sorting; L01 < L02 < ... streams
                 bottom-to-top in a single bounded prefix scan)
- Value format : file path reference (BlobDB byte payloads are the next tier
                 — rocksdict exposes set_enable_blob_files for that step)
- Column family "layers": active render layers
- Column family "meta"  : asset metadata / cached paths (the virtual folder)
- Atomic restacks go through WriteBatch
- Render hand-off goes through a bounded prefix-scan iterator (lower/upper
  read bounds on job#frame#), streamed strictly in byte-sorted depth order

Requires: rocksdict (bundled real RocksDB) — installed in the workspace venv.
All output is JSON on stdout. Failures exit non-zero with a JSON error.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from rocksdict import Options, Rdict, ReadOptions, WriteBatch

CF_LAYERS = "layers"
CF_META = "meta"
STACK_CAP = 64


def as_text(x):
    """rocksdict round-trips str as str and bytes as bytes — normalize."""
    return x.decode() if isinstance(x, (bytes, bytearray)) else x


def layer_key(job: str, frame: str, depth: int) -> bytes:
    """job923#f0001#L01 — zero-padded depth so byte order == stack order."""
    return f"{job}#{frame}#L{depth:02d}".encode()


def open_db(path: str, create: bool = True) -> Rdict:
    if not create and not Path(path).exists():
        raise SystemExit(json.dumps({"ok": False, "error": f"db not found: {path}"}))
    opts = Options()
    opts.create_if_missing(create)
    opts.create_missing_column_families(create)
    return Rdict(path, opts)


def prefix_bounds(job: str, frame: str) -> tuple[bytes, bytes]:
    prefix = f"{job}#{frame}#".encode()
    return prefix, prefix[:-1] + bytes([prefix[-1] + 1])


def read_opts_for(job: str, frame: str) -> ReadOptions:
    prefix, upper = prefix_bounds(job, frame)
    ro = ReadOptions()
    ro.set_iterate_lower_bound(prefix)
    ro.set_iterate_upper_bound(upper)
    return ro


def scan_stack(layers: Rdict, job: str, frame: str) -> list[tuple[bytes, bytes]]:
    """Bounded prefix scan — streams the stack bottom→top, byte-sorted."""
    layers.set_read_options(read_opts_for(job, frame))
    return list(layers.items())


def cmd_init(args: argparse.Namespace) -> dict:
    p = Path(args.db)
    if p.exists():
        raise SystemExit(json.dumps({"ok": False, "error": f"db already exists: {args.db}"}))
    p.mkdir(parents=True, exist_ok=False)
    db = open_db(args.db)
    db.create_column_family(CF_LAYERS)
    db.create_column_family(CF_META)
    seq = db.latest_sequence_number()
    db.close()
    return {"ok": True, "db": args.db, "column_families": [CF_LAYERS, CF_META], "sequence": seq}


def cmd_stack(args: argparse.Namespace) -> dict:
    """Atomic restack: WriteBatch deletes the old depths and writes the new
    order in ONE atomic unit — a crash mid-write never leaves a torn stack."""
    layers_paths = json.loads(args.layers)
    if not isinstance(layers_paths, list) or not all(isinstance(x, str) for x in layers_paths):
        raise SystemExit(json.dumps({"ok": False, "error": "layers must be a JSON array of path strings"}))
    if not (1 <= len(layers_paths) <= STACK_CAP):
        raise SystemExit(json.dumps({"ok": False, "error": f"stack depth must be 1..{STACK_CAP}"}))
    db = open_db(args.db)
    layers = db.get_column_family(CF_LAYERS)
    wb = WriteBatch()
    for k, _ in scan_stack(layers, args.job, args.frame):
        wb.delete(k, db.get_column_family_handle(CF_LAYERS))
    for depth, value in enumerate(layers_paths, start=1):
        wb.put(layer_key(args.job, args.frame, depth), value, db.get_column_family_handle(CF_LAYERS))
    db.write(wb)
    n = len(layers_paths)
    db.close()
    return {"ok": True, "op": "stack", "job": args.job, "frame": args.frame, "layers": n, "atomic": "WriteBatch"}


def cmd_add(args: argparse.Namespace) -> dict:
    db = open_db(args.db)
    layers = db.get_column_family(CF_LAYERS)
    depth = len(scan_stack(layers, args.job, args.frame)) + 1
    if depth > STACK_CAP:
        raise SystemExit(json.dumps({"ok": False, "error": f"stack depth cap is {STACK_CAP}"}))
    key = layer_key(args.job, args.frame, depth)
    wb = WriteBatch()
    wb.put(key, args.path, db.get_column_family_handle(CF_LAYERS))
    db.write(wb)
    db.close()
    return {"ok": True, "op": "add", "key": key.decode(), "path": args.path, "depth": depth}


def cmd_order(args: argparse.Namespace) -> dict:
    """The render hand-off: sequential stream, bottom layer first."""
    db = open_db(args.db, create=False)
    layers = db.get_column_family(CF_LAYERS)
    order = [
        {"key": as_text(k), "depth": i, "path": as_text(v)}
        for i, (k, v) in enumerate(scan_stack(layers, args.job, args.frame), start=1)
    ]
    db.close()
    return {
        "ok": True,
        "job": args.job,
        "frame": args.frame,
        "render_order": order,
        "stream": "bounded prefix scan, byte-sorted bottom→top",
    }


def cmd_meta_put(args: argparse.Namespace) -> dict:
    db = open_db(args.db)
    meta = db.get_column_family(CF_META)
    meta[f"{args.job}:{args.name}".encode()] = json.dumps({"path": args.path, "kind": args.kind}).encode()
    db.close()
    return {"ok": True, "op": "meta-put", "asset": args.name, "path": args.path}


def cmd_meta_list(args: argparse.Namespace) -> dict:
    db = open_db(args.db, create=False)
    meta = db.get_column_family(CF_META)
    prefix = f"{args.job}:"
    out = []
    for k, v in meta.items():
        if as_text(k).startswith(prefix):
            out.append({"name": as_text(k).split(":", 1)[1], **json.loads(as_text(v))})
    db.close()
    return {"ok": True, "assets": out}


def cmd_stats(args: argparse.Namespace) -> dict:
    db = open_db(args.db, create=False)
    keys = 0
    for cf in (CF_LAYERS, CF_META):
        try:
            v = db.get_column_family(cf).property_value("rocksdb.estimate-num-keys")
            keys += int(v) if v else 0
        except Exception:
            pass

    def prop(p: str):
        return db.property_value(p)

    stats = {
        "keys_layers_meta": keys,
        "level0_files": prop("rocksdb.num-files-at-level0"),
        "sst_files_bytes": prop("rocksdb.total-sst-files-size"),
        "memtables_bytes": prop("rocksdb.size-all-mem-tables"),
    }
    db.close()
    return {"ok": True, "db": args.db, "stats": stats}


def cmd_destroy(args: argparse.Namespace) -> dict:
    shutil.rmtree(args.db)
    return {"ok": True, "destroyed": args.db}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("init"); p.add_argument("--db", required=True); p.set_defaults(fn=cmd_init)
    p = sub.add_parser("stack"); p.add_argument("--db", required=True); p.add_argument("--job", required=True); p.add_argument("--frame", required=True); p.add_argument("--layers", required=True); p.set_defaults(fn=cmd_stack)
    p = sub.add_parser("add"); p.add_argument("--db", required=True); p.add_argument("--job", required=True); p.add_argument("--frame", required=True); p.add_argument("--path", required=True); p.set_defaults(fn=cmd_add)
    p = sub.add_parser("order"); p.add_argument("--db", required=True); p.add_argument("--job", required=True); p.add_argument("--frame", required=True); p.set_defaults(fn=cmd_order)
    p = sub.add_parser("meta-put"); p.add_argument("--db", required=True); p.add_argument("--job", required=True); p.add_argument("--name", required=True); p.add_argument("--path", required=True); p.add_argument("--kind", default="asset"); p.set_defaults(fn=cmd_meta_put)
    p = sub.add_parser("meta-list"); p.add_argument("--db", required=True); p.add_argument("--job", required=True); p.set_defaults(fn=cmd_meta_list)
    p = sub.add_parser("stats"); p.add_argument("--db", required=True); p.set_defaults(fn=cmd_stats)
    p = sub.add_parser("destroy"); p.add_argument("--db", required=True); p.set_defaults(fn=cmd_destroy)

    args = parser.parse_args()
    result = args.fn(args)
    json.dump(result, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
