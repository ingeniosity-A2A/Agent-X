#!/usr/bin/env python3
"""
rev-ike-benchmark.py — verified Zero-Copy Streaming Benchmark runner.

Published module per the "Rev.ike Zero-Copy Streaming Benchmark and
Engineering Report" spec: simulates a heavy dataset workload as a pure
generator, streams it through the memory-tdai pipeline, prints the exact
engineering report block, and FAILS (exit 1) if RAM is not flat.

    python3 scripts/rev_ike_benchmark.py [--records 50000] [--max-delta-mb 1.0]
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from rev_ike_streamer import run_stream  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--records", type=int, default=50_000)
    ap.add_argument("--max-delta-mb", type=float, default=1.0, help="flat-RAM verdict threshold")
    ap.add_argument("--housing", default=os.path.join("modules", "aetheris", "data"))
    args = ap.parse_args()

    root = os.path.join(args.housing, "memory-tdai")
    for tier in ("L3_Persona", "L2_Scenario", "L1_Atoms", "L0_Trace", "refs", ".meta"):
        os.makedirs(os.path.join(root, tier), exist_ok=True)

    r = run_stream(f"synthetic:{args.records}", root, actor="rev-ike-benchmark")
    m = r["memory"]
    l0 = r["outputs"]["L0_Trace"]["bytes"] / (1024 * 1024)
    l1 = r["outputs"]["L1_Atoms"]["bytes"] / (1024 * 1024)
    refs = r["outputs"]["Refs_Offload"]["bytes"] / (1024 * 1024)
    raw = r["raw_bytes"] / (1024 * 1024)

    print("=" * 50)
    print("      REV.IKE ZERO-COPY STREAMING BENCHMARK REPORT       ")
    print("=" * 50)
    print()
    print(f"Total Records Ingested : {r['records']:,}")
    print(f"Elapsed Time           : {r['elapsed_seconds']} seconds")
    print(f"Pipeline Throughput    : {r['throughput_rps']:,.2f} records/sec")
    print(f"First Record Latency   : {r['first_record_ms']} ms  (warm start)")
    print("-" * 50)
    print()
    print(f"Baseline RSS Memory    : {m['baseline_rss_mb']} MB")
    print(f"Peak Operational RSS   : {m['peak_rss_mb']} MB")
    print(f"Active RAM Ingestion   : {m['delta_rss_mb']} MB (Delta RSS)  <-- "
          f"[{'VERIFIED FLAT RAM' if m['verified_flat_ram'] else 'DELTA DETECTED'}]")
    print(f"Peak PyAllocated Heap  : {m['peak_heap_mb']} MB (Tracemalloc)")
    print("-" * 50)
    print()
    print(f"Raw Stream Ingested    : {raw:.2f} MB")
    print("Exoskeleton Output Directories verified:")
    print(f" - L0_Trace Log        : {l0:.2f} MB (Sequential Trace Log)")
    print(f" - L1_Atoms (JSONL)    : {l1:.2f} MB (Fact Atoms metadata)")
    print(f" - Refs_Offload (MD)   : {refs:.2f} MB ({r['outputs']['Refs_Offload']['parts']} out-of-band parts)")
    print(f" - Duplicates Skipped  : {r['duplicates']:,}")
    print("=" * 50)

    flat = abs(m["delta_rss_mb"]) <= args.max_delta_mb
    print(json.dumps({
        "ok": True,
        "verified_flat_ram": flat,
        "records": r["records"],
        "throughput_rps": r["throughput_rps"],
        "delta_rss_mb": m["delta_rss_mb"],
        "peak_heap_mb": m["peak_heap_mb"],
        "stream_id": r["stream_id"],
    }))
    return 0 if flat else 1


if __name__ == "__main__":
    sys.exit(main())
