#!/usr/bin/env python3
"""Seed the ESA RocksDB housing with the HD Supply product catalog snapshot.

Owner directive (2026-09-10): the ESA Product card is wired to the HD Supply
catalog/website for fast rendering with RocksDB. The catalog payload lives as
a JSON snapshot file (payload tier); the ESA RocksDB housing (control plane)
holds meta rows pointing at it — same path-reference doctrine as the render
stacks ("BlobDB byte payloads are the next tier").

    modules/esa/data/rocksdb                    ← ESA housing (meta CF rows)
    modules/esa/data/catalog/hdsupply.json      ← catalog snapshot (payload)

Meta rows written (idempotent — re-running refreshes the same rows):
    esa-service:hdsupply-catalog        kind=catalog   (whole snapshot file)
    esa-service:catalog-hd-<SKU>        kind=catalog-item (one per SKU)

Parity contract: the SKU set mirrors STREAM_CATALOG in
platform/src/lib/inventory-store.ts (the no-RocksDB fallback). Keep both
lists in sync when the catalog changes.

The Punch-In deep link format used by the platform:
    https://www.hdsupplysolutions.com/search?text=<SKU>

Requires: rocksdict (bundled real RocksDB) — same dependency as rocks_stack.py.
All output is JSON on stdout. Failures exit non-zero with a JSON error.
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
CATALOG_DIR = REPO / "modules" / "esa" / "data" / "catalog"
SNAPSHOT = CATALOG_DIR / "hdsupply.json"
ESA_JOB = "esa-service"

HD_SEARCH = "https://www.hdsupplysolutions.com/search?text="
HD_HOME = "https://hdsupplysolutions.com"

# HD Supply catalog snapshot — parity with STREAM_CATALOG (inventory-store.ts).
# vendor/catalogUrl/punchIn are part of the Product card order hand-off.
HD_CATALOG = [
    {
        "sku": "HD-4421",
        "name": "Bath tissue 2-ply case",
        "barcode": "000442100001",
        "unit": "case",
        "vendor": "HD Supply",
        "location": "Housekeeping",
        "catalogUrl": HD_HOME,
        "punchInUrl": HD_SEARCH + "bath+tissue+2-ply",
    },
    {
        "sku": "HD-1180",
        "name": "LED A19 60W equiv bulb 6-pack",
        "barcode": "000118000006",
        "unit": "pack",
        "vendor": "HD Supply",
        "location": "Maintenance",
        "catalogUrl": HD_HOME,
        "punchInUrl": HD_SEARCH + "LED+A19+60W",
    },
    {
        "sku": "HD-9033",
        "name": "HVAC filter 20x25x1 MERV-8",
        "barcode": "000903300001",
        "unit": "each",
        "vendor": "HD Supply",
        "location": "Mechanical",
        "catalogUrl": HD_HOME,
        "punchInUrl": HD_SEARCH + "HVAC+filter+20x25x1+MERV-8",
    },
    {
        "sku": "HD-2205",
        "name": "Toilet fill valve universal",
        "barcode": "000220500001",
        "unit": "each",
        "vendor": "HD Supply",
        "location": "Plumbing",
        "catalogUrl": HD_HOME,
        "punchInUrl": HD_SEARCH + "toilet+fill+valve",
    },
]


def rocks(*args: str) -> dict:
    """Drive rocks_stack.py exactly the way the platform API routes do."""
    proc = subprocess.run(
        [sys.executable, str(CLI), *args],
        cwd=str(REPO),
        capture_output=True,
        text=True,
        timeout=30,
    )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout).strip()[:300])
    return json.loads(proc.stdout)


def main() -> int:
    # 1. Housing exists? (init if missing — meta CF comes with it)
    if not ESA_DB.exists():
        r = rocks("init", "--db", str(ESA_DB))
    else:
        r = {"ok": True, "db": str(ESA_DB), "note": "housing already exists"}

    # 2. Payload tier — write/refresh the catalog snapshot (atomic replace)
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    snapshot = {
        "vendor": "HD Supply",
        "sealedAt": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
        "source": "scripts/seed_hdsupply_catalog.py",
        "punchInBase": HD_SEARCH,
        "items": HD_CATALOG,
    }
    tmp = SNAPSHOT.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(snapshot, indent=2) + "\n")
    tmp.replace(SNAPSHOT)

    rel_snapshot = SNAPSHOT.relative_to(REPO).as_posix()

    # 3. Control plane — meta rows (idempotent refresh)
    r_cat = rocks(
        "meta-put", "--db", str(ESA_DB), "--job", ESA_JOB,
        "--name", "hdsupply-catalog", "--path", rel_snapshot, "--kind", "catalog",
    )
    item_rows = []
    for item in HD_CATALOG:
        item_file = CATALOG_DIR / f"item-{item['sku'].lower()}.json"
        item_file.write_text(json.dumps(item, indent=2) + "\n")
        rel_item = item_file.relative_to(REPO).as_posix()
        rocks(
            "meta-put", "--db", str(ESA_DB), "--job", ESA_JOB,
            "--name", f"catalog-{item['sku'].lower()}",
            "--path", rel_item, "--kind", "catalog-item",
        )
        item_rows.append(item["sku"])

    # 4. Verify — read back through the same control plane the API uses
    listing = rocks("meta-list", "--db", str(ESA_DB), "--job", ESA_JOB)
    catalog_assets = [a for a in listing.get("assets", []) if str(a.get("kind", "")).startswith("catalog")]

    print(json.dumps({
        "ok": True,
        "db": r.get("db", str(ESA_DB)),
        "snapshot": rel_snapshot,
        "items": item_rows,
        "catalog_meta_rows": len(catalog_assets),
        "verify": "meta-list read-back OK",
    }))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001 — CLI boundary, JSON error contract
        print(json.dumps({"ok": False, "error": str(e)[:300]}))
        sys.exit(1)
