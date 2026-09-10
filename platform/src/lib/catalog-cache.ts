import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * HD Supply catalog cache — RocksDB-backed fast rendering for the ESA
 * Product card (owner directive 2026-09-10).
 *
 * Control plane : modules/esa/data/rocksdb (meta CF, job esa-service)
 *                 driven through scripts/rocks_stack.py meta-list — the
 *                 same bounded control plane the render stacks use.
 * Payload tier  : modules/esa/data/catalog/hdsupply.json (+ item-*.json)
 *                 written by scripts/seed_hdsupply_catalog.py.
 * Fallback      : BUILTIN_CATALOG (parity with seed + STREAM_CATALOG in
 *                 inventory-store.ts) when the housing/rocksdict is absent
 *                 — the card never blocks on the cache.
 *
 * The first call warms an in-process cache; every later call is a plain
 * memory read (fast rendering). `revalidate()` forces a RocksDB re-scan.
 */

export type CatalogItem = {
  sku: string;
  name: string;
  barcode?: string;
  unit?: string;
  vendor: string;
  location?: string;
  catalogUrl: string;
  punchInUrl: string;
};

export type CatalogSnapshot = {
  vendor: string;
  items: CatalogItem[];
  source: "rocksdb" | "builtin";
  loadedAt: string;
};

export const PUNCH_IN_BASE = "https://www.hdsupplysolutions.com/search?text=";

/** Parity fallback — mirrors STREAM_CATALOG (inventory-store.ts) + seed script. */
export const BUILTIN_CATALOG: CatalogItem[] = [
  {
    sku: "HD-4421",
    name: "Bath tissue 2-ply case",
    barcode: "000442100001",
    unit: "case",
    vendor: "HD Supply",
    location: "Housekeeping",
    catalogUrl: "https://hdsupplysolutions.com",
    punchInUrl: PUNCH_IN_BASE + "bath+tissue+2-ply",
  },
  {
    sku: "HD-1180",
    name: "LED A19 60W equiv bulb 6-pack",
    barcode: "000118000006",
    unit: "pack",
    vendor: "HD Supply",
    location: "Maintenance",
    catalogUrl: "https://hdsupplysolutions.com",
    punchInUrl: PUNCH_IN_BASE + "LED+A19+60W",
  },
  {
    sku: "HD-9033",
    name: "HVAC filter 20x25x1 MERV-8",
    barcode: "000903300001",
    unit: "each",
    vendor: "HD Supply",
    location: "Mechanical",
    catalogUrl: "https://hdsupplysolutions.com",
    punchInUrl: PUNCH_IN_BASE + "HVAC+filter+20x25x1+MERV-8",
  },
  {
    sku: "HD-2205",
    name: "Toilet fill valve universal",
    barcode: "000220500001",
    unit: "each",
    vendor: "HD Supply",
    location: "Plumbing",
    catalogUrl: "https://hdsupplysolutions.com",
    punchInUrl: PUNCH_IN_BASE + "toilet+fill+valve",
  },
];

const ESA_DB = "modules/esa/data/rocksdb";
const SNAPSHOT = "modules/esa/data/catalog/hdsupply.json";

let cache: CatalogSnapshot | null = null;
let warming: Promise<CatalogSnapshot> | null = null;

async function repoRoot(): Promise<string> {
  const { stdout } = await exec("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function rocksListCatalogMeta(root: string): Promise<string[]> {
  const py = process.env.ROCKS_PY || "python3";
  const script = path.join(root, "scripts", "rocks_stack.py");
  const { stdout } = await exec(
    py,
    [script, "meta-list", "--db", path.join(root, ESA_DB), "--job", "esa-service"],
    { cwd: root, timeout: 20_000, maxBuffer: 4 * 1024 * 1024 }
  );
  const parsed = JSON.parse(stdout) as {
    ok: boolean;
    assets?: { name: string; path: string; kind: string }[];
  };
  if (!parsed.ok) throw new Error("rocks meta-list failed");
  return (parsed.assets ?? [])
    .filter((a) => a.kind === "catalog")
    .map((a) => a.path);
}

async function loadFromRocks(): Promise<CatalogSnapshot> {
  const root = await repoRoot();
  const paths = await rocksListCatalogMeta(root);
  // Prefer the whole-snapshot row (one file read = one warm render).
  const snapRel =
    paths.find((p) => p.endsWith("hdsupply.json")) ?? paths[0];
  if (!snapRel) throw new Error("no catalog rows in ESA housing");
  const raw = await readFile(path.join(root, snapRel), "utf8");
  const parsed = JSON.parse(raw) as { vendor?: string; items?: CatalogItem[] };
  const items = parsed.items ?? [];
  if (!items.length) throw new Error("empty catalog snapshot");
  return {
    vendor: parsed.vendor ?? "HD Supply",
    items,
    source: "rocksdb",
    loadedAt: new Date().toISOString(),
  };
}

export function getCatalog(): CatalogSnapshot {
  if (cache) return cache;
  if (!warming) {
    warming = loadFromRocks()
      .then((snap) => {
        cache = snap;
        return snap;
      })
      .catch(() => {
        cache = {
          vendor: "HD Supply",
          items: BUILTIN_CATALOG,
          source: "builtin",
          loadedAt: new Date().toISOString(),
        };
        return cache;
      })
      .finally(() => {
        warming = null;
      });
  }
  // First caller gets the fallback immediately (never block the render);
  // the warmed RocksDB snapshot replaces it for every later call.
  return (
    cache ?? {
      vendor: "HD Supply",
      items: BUILTIN_CATALOG,
      source: "builtin",
      loadedAt: new Date().toISOString(),
    }
  );
}

export async function revalidateCatalog(): Promise<CatalogSnapshot> {
  cache = null;
  try {
    return await loadFromRocks();
  } catch {
    cache = {
      vendor: "HD Supply",
      items: BUILTIN_CATALOG,
      source: "builtin",
      loadedAt: new Date().toISOString(),
    };
    return cache;
  } finally {
    // Warm the process cache for the next synchronous getCatalog().
    void getCatalog();
  }
}

export function catalogItem(sku: string): CatalogItem | undefined {
  return getCatalog().items.find(
    (i) => i.sku === sku || i.barcode === sku
  );
}

export function punchInUrl(skuOrText: string): string {
  const item = catalogItem(skuOrText);
  if (item) return item.punchInUrl;
  return PUNCH_IN_BASE + encodeURIComponent(skuOrText);
}
