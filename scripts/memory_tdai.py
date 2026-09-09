#!/usr/bin/env python3
"""
memory-tdai — the Aetheris 4-tier memory file system engine.

Folder schema (canonical, per the Aetheris spec corpus):

    memory-tdai/
    ├── L3_Persona/     Persona Block     — system_pref.md      (the cognitive anchor)
    ├── L2_Scenario/    Scenario Blocks   — runtime_ctx.md      (active project state)
    ├── L1_Atoms/       Fact Atoms        — *.jsonl             (distilled, dedup'd)
    ├── L0_Trace/       Raw Session Trace — *.jsonl             (sequential ground truth)
    ├── refs/           Offload Archive   — *.partNNN.md        (out-of-band payloads)
    └── .meta/          governance state + stream manifests (JSONL)

Memory Timeline axis: L3 (top, always visible) -> L0 (bottom, offloaded).
Governance: every tier card is LOCKED by default; unlock is an explicit,
recorded state transition (lock-and-slide interaction model).

Engine contract: every subcommand prints {ok:true, ...} JSON on stdout and
exits 0, or {ok:false, error} and exits 1 — the /api/memory/* routes drive
this script exactly the way /api/forge/* drives forgedxfolders.py.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from rev_ike_streamer import (  # noqa: E402
    canonical,
    node_id_for,
    run_stream,
    read_rss_kb,
)

DEFAULT_HOUSING = os.path.join("modules", "aetheris", "data")
TIERS = ["L3_Persona", "L2_Scenario", "L1_Atoms", "L0_Trace"]
TIER_META = {
    "L3_Persona": {"label": "L3", "name": "Persona Block", "desc": "User guidelines, system roles, and developer preferences.", "seed": "system_pref.md"},
    "L2_Scenario": {"label": "L2", "name": "Active Scenarios", "desc": "Sourced task directories mapped directly to current deployment goals.", "seed": "runtime_ctx.md"},
    "L1_Atoms": {"label": "L1", "name": "Fact Atoms", "desc": "Deduplicated information segments extracted during similarity indexing.", "seed": None},
    "L0_Trace": {"label": "L0", "name": "Dialogue Trace", "desc": "Complete trace archives offloaded dynamically to protect context budgets.", "seed": None},
}

SEEDS = {
    "system_pref.md": """# Persona Profile — L3 Cognitive Anchor

## Identity
- name: Aetheris (File-Memory Explorer of the Exoskeleton Agent Browser)
- operator: ingeniosity-A2A
- kernel: GSAP Timeline Kernel (100ms perceptual fusion / 0.6s unprepared slideout)

## Terminal color matrices
- base:      #18181b  (dark canvas foundation)
- card-dark: #242427  (white/10 border)
- beige:     #f4f4ee  (active focus / unlocked)
- glass:     rgba(20, 20, 25, 0.75) + blur(20px) saturate(160%)

## Agent behaviors
- Memory paradigm: 4-tier pipeline L0-L3 (TencentDB shared-memory architecture)
- Ingress: substrate-level (App-less Ingress Protocol) — no interception gateway
- Routing: Tier 0 reflexes -> Tier 1 local skills -> Tier 2 remote specialists
- Context: TDAI offloading — raw logs never enter the prompt un-referenced
""",
    "runtime_ctx.md": """# Runtime Context — L2 Active Scenarios

## Scenario: memory-tdai completion
- goal: complete the Aetheris pipeline (streamer + tiers + explorer)
- surfaces: /agent-browser/interface/aetheris (Bento UI8 plugin slot)
- engine: scripts/rev_ike_streamer.py + scripts/memory_tdai.py

## Scenario: forge-org boundary
- ForgedxFolders (F0-F3) is the canonical file system — retires "Forged File Vault".
- Aetheris (memory-tdai) is the trial pipeline to become the next FORGED
  (Forged File Standard §11) — not a competing file system.
- Vendor boundary: Hugging Face (huggingface_hub) — content-addressed, outside F0-F3.

## Active task directories
- modules/aetheris/data/memory-tdai   (housing)
- platform/src/app/api/memory         (API layer)
- platform/src/components/aetheris    (explorer surface)
""",
}


def tdai_root(housing: str) -> str:
    return os.path.join(housing, "memory-tdai")


def state_path(root: str) -> str:
    return os.path.join(root, ".meta", "state.json")


def load_state(root: str) -> Dict[str, Any]:
    p = state_path(root)
    if os.path.isfile(p):
        with open(p, "r", encoding="utf-8") as fh:
            return json.load(fh)
    return {"locks": {}, "unlocked_at": {}}


def save_state(root: str, state: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(state_path(root)), exist_ok=True)
    with open(state_path(root), "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2, sort_keys=True)


def ok(**kw: Any) -> None:
    print(json.dumps({"ok": True, **kw}, ensure_ascii=False))


def fail(msg: str) -> None:
    print(json.dumps({"ok": False, "error": msg[:400]}))
    sys.exit(1)


# ---------------------------------------------------------------------------
# subcommands
# ---------------------------------------------------------------------------


def cmd_init(args: argparse.Namespace) -> None:
    root = tdai_root(args.housing)
    for tier in TIERS:
        os.makedirs(os.path.join(root, tier), exist_ok=True)
    os.makedirs(os.path.join(root, "refs"), exist_ok=True)
    os.makedirs(os.path.join(root, ".meta"), exist_ok=True)
    seeded = []
    for tier in ("L3_Persona", "L2_Scenario"):
        seed_name = TIER_META[tier]["seed"]
        p = os.path.join(root, tier, seed_name)
        if not os.path.isfile(p):
            with open(p, "w", encoding="utf-8") as fh:
                fh.write(SEEDS[seed_name])
            seeded.append(f"{tier}/{seed_name}")
    state = load_state(root)
    save_state(root, state)  # persist default governance (all locked)
    ok(root=root, seeded=seeded, tiers=TIERS)


def _file_entry(rel: str, full: str, tier: str, state: Dict[str, Any]) -> Dict[str, Any]:
    st = os.stat(full)
    key = rel
    locked = state.get("locks", {}).get(key, True)
    nid_seed = hashlib.sha256(rel.encode()).hexdigest()[:12]
    return {
        "node_id": f"nd-{nid_seed}",
        "path": rel,
        "tier": tier,
        "name": os.path.basename(rel),
        "bytes": st.st_size,
        "updated": int(st.st_mtime),
        "locked": bool(locked),
    }


def cmd_tree(args: argparse.Namespace) -> None:
    root = tdai_root(args.housing)
    if not os.path.isdir(root):
        fail("memory-tdai not initialized — run: memory_tdai.py init")
    state = load_state(root)
    tiers_out = []
    for tier in TIERS:
        tdir = os.path.join(root, tier)
        entries: List[Dict[str, Any]] = []
        if os.path.isdir(tdir):
            for name in sorted(os.listdir(tdir)):
                full = os.path.join(tdir, name)
                if os.path.isfile(full):
                    entries.append(_file_entry(f"{tier}/{name}", full, tier, state))
        meta = TIER_META[tier]
        tiers_out.append({
            "tier": meta["label"],
            "folder": tier,
            "name": meta["name"],
            "desc": meta["desc"],
            "entries": entries,
            "bytes": sum(e["bytes"] for e in entries),
        })
    refs_dir = os.path.join(root, "refs")
    refs_entries = []
    if os.path.isdir(refs_dir):
        for name in sorted(os.listdir(refs_dir)):
            full = os.path.join(refs_dir, name)
            if os.path.isfile(full):
                refs_entries.append(_file_entry(f"refs/{name}", full, "refs", state))
    ok(root=root, tiers=tiers_out, refs=refs_entries, symbols=build_symbols(tiers_out, refs_entries))


def build_symbols(tiers: List[Dict[str, Any]], refs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Deterministic symbol graph (Mermaid source + structured nodes/edges).

    Symbolic In-Context Graphing: the explorer (and any agent viewport) renders
    ONLY this lightweight graph; raw payloads stay one node_id drill-down away
    (deterministic recall hook)."""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    tier_chain = [("L3", "L2"), ("L2", "L1"), ("L1", "L0")]
    for tier in tiers:
        nodes.append({"id": f"tier-{tier['tier']}", "kind": "tier", "label": f"{tier['tier']} {tier['name']}", "bytes": tier["bytes"]})
    for a, b in tier_chain:
        edges.append({"from": f"tier-{a}", "to": f"tier-{b}", "rel": "cognitive-depth"})
    for tier in tiers:
        for e in tier["entries"][:6]:
            nid = f"file-{hashlib.sha256(e['path'].encode()).hexdigest()[:8]}"
            nodes.append({"id": nid, "kind": "file", "label": e["name"], "bytes": e["bytes"], "ref": e["node_id"]})
            edges.append({"from": f"tier-{tier['tier']}", "to": nid, "rel": "contains"})
    nodes.append({"id": "refs-archive", "kind": "refs", "label": f"refs/ ({len(refs)} parts)", "bytes": sum(r["bytes"] for r in refs)})
    for tier in ("L1", "L0"):
        edges.append({"from": f"tier-{tier}", "to": "refs-archive", "rel": "offload"})
    # Mermaid source for display / copy
    lines = ["graph TD"]
    for n in nodes:
        lines.append(f'  {n["id"]}["{n["label"]}"]')
    for e in edges:
        lines.append(f'  {e["from"]} -->|{e["rel"]}| {e["to"]}')
    return {"mermaid": "\n".join(lines), "nodes": nodes, "edges": edges}


def _resolve(root: str, node: str) -> Optional[str]:
    """node_id or relative path -> absolute path inside the housing."""
    if not node.startswith("nd-"):
        cand = os.path.join(root, node)
        return cand if os.path.isfile(cand) else None
    for tier in TIERS + ["refs"]:
        tdir = os.path.join(root, tier)
        if not os.path.isdir(tdir):
            continue
        for dirpath, _dirnames, filenames in os.walk(tdir):
            for name in filenames:
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, root)
                if hashlib.sha256(rel.encode()).hexdigest()[:12] == node[3:]:
                    return full
    return None


def cmd_node(args: argparse.Namespace) -> None:
    root = tdai_root(args.housing)
    full = _resolve(root, args.node)
    if not full:
        fail(f"node not found: {args.node}")
    rel = os.path.relpath(full, root)
    state = load_state(root)
    locked = state.get("locks", {}).get(rel, True)
    size = os.path.getsize(full)
    head_len = min(args.bytes if args.bytes else 4096, size)
    with open(full, "rb") as fh:
        head = fh.read(head_len)
    tier = rel.split(os.sep)[0] if os.sep in rel or "/" in rel else "root"
    # streaming anchors: for L1 atom files expose the last stream report
    last_stream = read_last_stream(root)
    ok(node=args.node, path=rel, tier=tier, bytes=size, locked=bool(locked),
       encoding="utf-8", head=head.decode("utf-8", errors="replace"),
       truncated=size > head_len, last_stream=last_stream)


def read_last_stream(root: str) -> Optional[Dict[str, Any]]:
    p = os.path.join(root, ".meta", "streams.jsonl")
    if not os.path.isfile(p):
        return None
    last = None
    with open(p, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                last = line
    return json.loads(last) if last else None


def cmd_lock(args: argparse.Namespace) -> None:
    root = tdai_root(args.housing)
    full = _resolve(root, args.node)
    if not full:
        fail(f"node not found: {args.node}")
    rel = os.path.relpath(full, root)
    state = load_state(root)
    state.setdefault("locks", {})
    state.setdefault("unlocked_at", {})
    state["locks"][rel] = (args.state == "locked")
    if args.state == "unlocked":
        state["unlocked_at"][rel] = int(time.time())
    else:
        state["unlocked_at"].pop(rel, None)
    save_state(root, state)
    ok(node=args.node, path=rel, locked=(args.state == "locked"), governance="lock-and-slide")


def cmd_ingest(args: argparse.Namespace) -> None:
    root = tdai_root(args.housing)
    if not os.path.isdir(root):
        cmd_init(args)
    take = args.take

    def progress_sink(evt: Dict[str, Any]) -> None:
        # NDJSON line for /api/memory/stream SSE forwarding
        print(json.dumps(evt), flush=True)

    report = run_stream(
        args.source, root, take=take, actor=args.actor,
        progress_every=args.progress_every or 0,
        progress_sink=progress_sink if args.progress_every else None,
    )
    ok(stream=report, governance="auto-locked-on-complete")


def cmd_stats(args: argparse.Namespace) -> None:
    root = tdai_root(args.housing)
    if not os.path.isdir(root):
        fail("memory-tdai not initialized — run: memory_tdai.py init")
    per_tier: Dict[str, Dict[str, int]] = {}
    for tier in TIERS + ["refs"]:
        tdir = os.path.join(root, tier)
        files = bytes_ = 0
        if os.path.isdir(tdir):
            for name in os.listdir(tdir):
                full = os.path.join(tdir, name)
                if os.path.isfile(full):
                    files += 1
                    bytes_ += os.path.getsize(full)
        per_tier[tier] = {"files": files, "bytes": bytes_}
    streams = []
    p = os.path.join(root, ".meta", "streams.jsonl")
    if os.path.isfile(p):
        with open(p, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    streams.append(json.loads(line))
    ok(root=root, per_tier=per_tier, total_bytes=sum(v["bytes"] for v in per_tier.values()),
       rss_mb=round(read_rss_kb() / 1024.0, 2), streams=streams[-5:], stream_count=len(streams))


def cmd_benchmark(args: argparse.Namespace) -> None:
    """The verified Rev.ike benchmark — simulated heavy dataset, report block
    in the exact engineering format, then a flat-RAM verdict."""
    root = tdai_root(args.housing)
    if not os.path.isdir(root):
        cmd_init(args)
    report = run_stream(f"synthetic:{args.records}", root, take=None, actor="rev-ike-benchmark")
    r = report
    lines = [
        "=" * 50,
        "      REV.IKE ZERO-COPY STREAMING BENCHMARK REPORT       ",
        "=" * 50,
        "",
        f"Total Records Ingested : {r['records']:,}",
        f"Elapsed Time           : {r['elapsed_seconds']} seconds",
        f"Pipeline Throughput    : {r['throughput_rps']:,.2f} records/sec",
        "-" * 50,
        "",
        f"Baseline RSS Memory    : {r['memory']['baseline_rss_mb']} MB",
        f"Peak Operational RSS   : {r['memory']['peak_rss_mb']} MB",
        f"Active RAM Ingestion   : {r['memory']['delta_rss_mb']} MB (Delta RSS)  "
        f"<-- [{'VERIFIED FLAT RAM' if r['memory']['verified_flat_ram'] else 'DELTA DETECTED'}]",
        f"Peak PyAllocated Heap  : {r['memory']['peak_heap_mb']} MB (Tracemalloc)",
        "-" * 50,
        "",
        "Exoskeleton Output Directories verified:",
        f" - L0_Trace Log        : {r['outputs']['L0_Trace']['bytes'] / (1024*1024):.2f} MB (Sequential Trace Log)",
        f" - L1_Atoms (JSONL)    : {r['outputs']['L1_Atoms']['bytes'] / (1024*1024):.2f} MB (Fact Atoms metadata)",
        f" - Refs_Offload (MD)   : {r['outputs']['Refs_Offload']['bytes'] / (1024*1024):.2f} MB "
        f"({r['outputs']['Refs_Offload']['parts']} out-of-band parts)",
        "=" * 50,
    ]
    ok(benchmark=report, report_block="\n".join(lines), verified_flat_ram=r["memory"]["verified_flat_ram"])


def main() -> None:
    ap = argparse.ArgumentParser(description="Aetheris memory-tdai file system engine")
    ap.add_argument("--housing", default=DEFAULT_HOUSING, help="housing dir (default: modules/aetheris/data)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("init", help="create the 4-tier tree + refs + governance state")
    p.set_defaults(fn=cmd_init)

    p = sub.add_parser("tree", help="tiered tree + symbol graph")
    p.set_defaults(fn=cmd_tree)

    p = sub.add_parser("node", help="deterministic recall hook (node_id or path)")
    p.add_argument("node")
    p.add_argument("--bytes", type=int, default=None, help="head bytes to return (default 4096)")
    p.set_defaults(fn=cmd_node)

    p = sub.add_parser("lock", help="governance lock-and-slide state")
    p.add_argument("node")
    p.add_argument("--state", choices=["locked", "unlocked"], default="locked")
    p.set_defaults(fn=cmd_lock)

    p = sub.add_parser("ingest", help="Rev.ike zero-copy stream into the tiers")
    p.add_argument("--source", required=True, help="file.jsonl|.parquet|.json | hf:repo[:split] | synthetic:N")
    p.add_argument("--take", type=int, default=None, help=".take(k) precise slice (hf streams)")
    p.add_argument("--actor", default="rev-ike")
    p.add_argument("--progress-every", type=int, default=0, help="emit NDJSON progress lines every N records")
    p.set_defaults(fn=cmd_ingest)

    p = sub.add_parser("stats", help="per-tier byte/file counts + recent streams")
    p.set_defaults(fn=cmd_stats)

    p = sub.add_parser("benchmark", help="verified zero-copy benchmark (flat RAM proof)")
    p.add_argument("--records", type=int, default=50_000)
    p.set_defaults(fn=cmd_benchmark)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
