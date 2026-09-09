#!/usr/bin/env python3
"""Seed the ESA and Help Assembly RocksDB housing with respective content.

Doctrine (owner, 2026-09-07): ESA and Help Assembly live in the Agent-X repo
and ONLY house RocksDB databases filled with their respective content.

- modules/esa/data/rocksdb            ← ESA service assets (the 5 ESA cards,
                                        calendar, DB config, green shield)
- modules/helpassembly/data/rocksdb   ← Help Assembly service assets
                                        (console, docs pipeline, build docs)

Layer values are path references into the real working tree (spec default);
BlobDB byte payloads are the next tier. Idempotent: re-running re-seeds the
same stacks atomically (WriteBatch restacks).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
CLI = HERE / "rocks_stack.py"

ESA_DB = REPO / "modules" / "esa" / "data" / "rocksdb"
HA_DB = REPO / "modules" / "helpassembly" / "data" / "rocksdb"

ESA_JOB, HA_JOB = "esa-service", "helpassembly-service"
FRAME = "f0001"

ESA_ASSETS = [
    ("ESA.DiagnosticCard", "esa-exoskeleton/public/components/ESA.DiagnosticCard.js", "render-card"),
    ("ESA.InvPartsCard-B", "esa-exoskeleton/public/components/ESA.invpartscard-B.js", "render-card"),
    ("ESA.WorkOrder", "esa-exoskeleton/public/components/ESA.workorder.js", "render-card"),
    ("ESA.MaintenanceChecklist", "esa-exoskeleton/public/components/ESA.MaintenanceChecklist.js", "render-card"),
    ("ESA.Ptac-B", "esa-exoskeleton/public/components/ESA.Ptac-B.js", "render-card"),
    ("ESA.Calendar", "esa-exoskeleton/public/components/ESA.Calendar.js", "render-card"),
    ("green-shield-config", "esa-exoskeleton/public/config/green-shield.js", "config"),
    ("duckdb-setup", "esa-exoskeleton/public/config/duckdb-setup.js", "config"),
    ("EsaConsoleContent", "modules/esa/EsaConsoleContent.tsx", "console"),
]

HA_ASSETS = [
    ("HelpAssemblyConsole", "modules/helpassembly/HelpAssemblyConsole.tsx", "console"),
    ("architecture-doc", "docs/helpassembly/ARCHITECTURE-HELPASSEMBLY.md", "doc"),
    ("topology", "docs/helpassembly/helpassembly-platform.topology.json", "config"),
    ("worker-infrastructure", "docs/helpassembly/WORKER-INFRASTRUCTURE-COMPLETE.md", "doc"),
    ("build-deploy-guide", "docs/helpassembly/BUILD-AND-DEPLOY-GUIDE.md", "doc"),
    ("docs-publisher", "modules/document-ingestion/docs-pipeline/src/docs-publisher.js", "pipeline"),
    ("docs-server", "modules/document-ingestion/docs-pipeline/src/server.js", "pipeline"),
    ("docs-config", "modules/document-ingestion/docs-pipeline/src/config.js", "pipeline"),
]


def run(*args: str) -> dict:
    out = subprocess.run([sys.executable, str(CLI), *args], capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError(f"{args[0]} failed: {out.stderr.strip() or out.stdout.strip()}")
    return json.loads(out.stdout)


def seed(db: Path, job: str, assets: list[tuple[str, str, str]]) -> dict:
    if not db.exists():
        print(run("init", "--db", str(db)))
    # virtual folder: every asset registered in the meta CF
    for name, rel, kind in assets:
        p = REPO / rel
        if not p.exists():
            print(f"  !! missing asset, skipped from folder: {rel}", file=sys.stderr)
            continue
        print(run("meta-put", "--db", str(db), "--job", job, "--name", name, "--path", rel, "--kind", kind))
    # initial stack: L01.. = assets in listed order (bottom → top)
    order = run("order", "--db", str(db), "--job", job, "--frame", FRAME)
    if not order["render_order"]:
        layers = [rel for _, rel, _ in assets if (REPO / rel).exists()]
        print(run("stack", "--db", str(db), "--job", job, "--frame", FRAME, "--layers", json.dumps(layers)))
    return run("order", "--db", str(db), "--job", job, "--frame", FRAME)


def main() -> int:
    for db, job, assets, label in (
        (ESA_DB, ESA_JOB, ESA_ASSETS, "ESA"),
        (HA_DB, HA_JOB, HA_ASSETS, "HelpAssembly"),
    ):
        print(f"== {label} → {db}")
        result = seed(db, job, assets)
        for entry in result["render_order"]:
            print(f"   {entry['key']} → {entry['path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
