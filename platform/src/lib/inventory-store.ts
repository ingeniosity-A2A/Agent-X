/**
 * ESA inventory store — mandatory when no catalog DB exists.
 * In-process for dev; swap for DuckDB/Arrow later without changing API shapes.
 *
 * Owner directive (2026-09-10): the Product card conducts inventory AND
 * product orders. Orders are durable — appended to
 * modules/esa/data/orders/orders.jsonl (append-only log, survives restarts)
 * — and every order carries the HD Supply Punch-In deep link so the
 * hand-off to the vendor site is one click from the card.
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type PartStatus = "in_stock" | "low" | "out_of_stock";

export type PartRecord = {
  id: string;
  sku: string;
  name: string;
  barcode?: string | null;
  quantity: number;
  unit?: string;
  location?: string | null;
  vendor: string;
  catalogUrl?: string | null;
  imageUrl?: string | null;
  status: PartStatus;
  updatedAt: string;
  source: "scan" | "catalog_stream" | "manual" | "seed";
};

/** Service Request statuses only — no separate "Service complete" card. */
export type ServiceRequestStatus =
  | "completed"
  | "incomplete_parts"
  | "follow_up";

export type ServiceRequest = {
  id: string;
  title: string;
  timeRange: string;
  service: string;
  status: ServiceRequestStatus;
  assigneeName?: string;
  partSku?: string;
  notes?: string;
  createdAt: string;
};

export type CatalogLink = {
  id: string;
  label: string;
  url: string;
  vendor: string;
};

/** Product order — recorded durably, handed off to HD Supply Punch-In. */
export type ProductOrder = {
  orderId: string;
  sku: string;
  name: string;
  quantity: number;
  vendor: string;
  status: "queued_punch_in" | "handed_off";
  punchInUrl: string;
  catalogUrl?: string | null;
  createdAt: string;
};

function statusFromQty(q: number): PartStatus {
  if (q <= 0) return "out_of_stock";
  if (q <= 3) return "low";
  return "in_stock";
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Cross-route singletons — Next.js bundles each route handler separately in
 * dev; plain module-level maps would give /api/inventory and /api/parts two
 * different stores. Pin them on globalThis (Prisma-singleton pattern) so
 * the Product card's inventory session is visible to the order endpoint.
 * Inventory stays mandatory (gate = empty store) until the first session.
 */
type InventoryGlobal = {
  __avaInventory?: {
    parts: Map<string, PartRecord>;
    serviceRequests: ServiceRequest[];
    orders: ProductOrder[];
    ordersLoaded: boolean;
  };
};
const g = globalThis as InventoryGlobal;
if (!g.__avaInventory) {
  g.__avaInventory = {
    parts: new Map<string, PartRecord>(),
    serviceRequests: [],
    orders: [],
    ordersLoaded: false,
  };
}
const parts = g.__avaInventory.parts;
const serviceRequests = g.__avaInventory.serviceRequests;
const orders = g.__avaInventory.orders;
const ordersLoaded = () => g.__avaInventory!.ordersLoaded;
function markOrdersLoaded() {
  g.__avaInventory!.ordersLoaded = true;
}

/**
 * Durable order log — append-only JSONL under the ESA data housing
 * (next to the RocksDB DB). In-process mirror kept for fast reads.
 */
const ORDERS_LOG = "modules/esa/data/orders/orders.jsonl";

function ordersLogAbs(): string {
  // Server runs with cwd = platform/ → repo root is one level up.
  // AVA007_REPO_ROOT overrides for non-standard launch dirs.
  const root = process.env.AVA007_REPO_ROOT || path.join(process.cwd(), "..");
  return path.isAbsolute(ORDERS_LOG) ? ORDERS_LOG : path.join(root, ORDERS_LOG);
}

async function appendOrderLog(order: ProductOrder): Promise<void> {
  orders.unshift(order);
  // Durable tier — the API response never waits on disk; mirror is
  // already updated above so the card renders instantly.
  try {
    const abs = ordersLogAbs();
    await mkdir(path.dirname(abs), { recursive: true });
    await appendFile(abs, JSON.stringify(order) + "\n", "utf8");
  } catch {
    /* durable tier best-effort; in-process mirror always authoritative */
  }
}

async function loadOrders(): Promise<void> {
  if (ordersLoaded()) return;
  markOrdersLoaded();
  try {
    const abs = ordersLogAbs();
    const raw = await readFile(abs, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    for (const line of lines.reverse()) {
      try {
        orders.push(JSON.parse(line) as ProductOrder);
      } catch {
        /* skip torn line */
      }
    }
  } catch {
    /* no log yet */
  }
}

export async function listOrders(): Promise<ProductOrder[]> {
  await loadOrders();
  return [...orders];
}

/** HD Supply-style catalog links (scan/add or stream). */
const CATALOG_LINKS: CatalogLink[] = [
  {
    id: "hd-main",
    label: "HD Supply Facilities Maintenance",
    url: "https://hdsupplysolutions.com",
    vendor: "HD Supply",
  },
  {
    id: "hd-punch",
    label: "HD Supply Punch-In (fallback portal)",
    url: "https://hdsupplysolutions.com",
    vendor: "HD Supply",
  },
];

/** Streamed catalog stubs until live HD Supply feed is attached. */
const STREAM_CATALOG: Omit<PartRecord, "id" | "quantity" | "status" | "updatedAt" | "source">[] =
  [
    {
      sku: "HD-4421",
      name: "Bath tissue 2-ply case",
      barcode: "000442100001",
      unit: "case",
      vendor: "HD Supply",
      catalogUrl: "https://hdsupplysolutions.com",
      location: "Housekeeping",
    },
    {
      sku: "HD-1180",
      name: "LED A19 60W equiv bulb 6-pack",
      barcode: "000118000006",
      unit: "pack",
      vendor: "HD Supply",
      catalogUrl: "https://hdsupplysolutions.com",
      location: "Maintenance",
    },
    {
      sku: "HD-9033",
      name: "HVAC filter 20x25x1 MERV-8",
      barcode: "000903300001",
      unit: "each",
      vendor: "HD Supply",
      catalogUrl: "https://hdsupplysolutions.com",
      location: "Mechanical",
    },
    {
      sku: "HD-2205",
      name: "Toilet fill valve universal",
      barcode: "000220500001",
      unit: "each",
      vendor: "HD Supply",
      catalogUrl: "https://hdsupplysolutions.com",
      location: "Plumbing",
    },
  ];

export function inventoryBootstrapRequired(): boolean {
  return parts.size === 0;
}

export function listParts(): PartRecord[] {
  return Array.from(parts.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getPart(skuOrId: string): PartRecord | undefined {
  for (const p of parts.values()) {
    if (p.id === skuOrId || p.sku === skuOrId || p.barcode === skuOrId) return p;
  }
  return undefined;
}

export function listCatalogLinks(): CatalogLink[] {
  return [...CATALOG_LINKS];
}

export function streamCatalog(): typeof STREAM_CATALOG {
  return [...STREAM_CATALOG];
}

export function upsertPartFromScan(input: {
  sku?: string;
  name: string;
  barcode?: string | null;
  quantity: number;
  unit?: string;
  location?: string | null;
  imageUrl?: string | null;
  catalogUrl?: string | null;
  vendor?: string;
  source?: PartRecord["source"];
}): PartRecord {
  const existing =
    (input.sku && getPart(input.sku)) ||
    (input.barcode ? getPart(input.barcode) : undefined);

  const quantity = Math.max(0, Math.floor(input.quantity));
  const record: PartRecord = {
    id: existing?.id ?? id("PART"),
    sku: input.sku || existing?.sku || `SCAN-${Date.now().toString(36).toUpperCase()}`,
    name: input.name || existing?.name || "Unknown part",
    barcode: input.barcode ?? existing?.barcode ?? null,
    quantity,
    unit: input.unit ?? existing?.unit ?? "each",
    location: input.location ?? existing?.location ?? null,
    vendor: input.vendor ?? existing?.vendor ?? "HD Supply",
    catalogUrl: input.catalogUrl ?? existing?.catalogUrl ?? null,
    imageUrl: input.imageUrl ?? existing?.imageUrl ?? null,
    status: statusFromQty(quantity),
    updatedAt: new Date().toISOString(),
    source: input.source ?? "scan",
  };
  parts.set(record.id, record);
  return record;
}

export function addFromCatalogStream(sku: string, quantity: number): PartRecord | null {
  const row = STREAM_CATALOG.find((c) => c.sku === sku);
  if (!row) return null;
  return upsertPartFromScan({
    ...row,
    quantity,
    source: "catalog_stream",
  });
}

export function setQuantity(skuOrId: string, quantity: number): PartRecord | undefined {
  const p = getPart(skuOrId);
  if (!p) return undefined;
  p.quantity = Math.max(0, Math.floor(quantity));
  p.status = statusFromQty(p.quantity);
  p.updatedAt = new Date().toISOString();
  parts.set(p.id, p);
  return p;
}

export function orderPart(
  skuOrId: string,
  qty: number,
  punchInUrl: string
): { ok: boolean; part?: PartRecord; order?: ProductOrder; orderId?: string; error?: string } {
  const p = getPart(skuOrId);
  if (!p) return { ok: false, error: "Part not in inventory — run inventory first" };
  if (qty <= 0) return { ok: false, error: "Order quantity must be > 0" };
  const orderId = id("ORD");
  const order: ProductOrder = {
    orderId,
    sku: p.sku,
    name: p.name,
    quantity: qty,
    vendor: p.vendor,
    status: "queued_punch_in",
    punchInUrl,
    catalogUrl: p.catalogUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  void appendOrderLog(order); // durable tier — mirror already updated
  return { ok: true, part: p, order, orderId };
}

export function listServiceRequests(): ServiceRequest[] {
  return [...serviceRequests].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
}

export function addServiceRequest(input: {
  title: string;
  service?: string;
  partSku?: string;
  notes?: string;
  assigneeName?: string;
  status?: ServiceRequestStatus;
}): ServiceRequest {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const req: ServiceRequest = {
    id: id("SR"),
    title: input.title,
    timeRange: `${hh}:${mm} – open`,
    service: input.service ?? "Service request",
    status: (input.status as ServiceRequestStatus) ?? "incomplete_parts",
    assigneeName: input.assigneeName,
    partSku: input.partSku,
    notes: input.notes,
    createdAt: now.toISOString(),
  };
  serviceRequests.unshift(req);
  return req;
}

export function updateServiceRequestStatus(
  idOrTitle: string,
  status: ServiceRequestStatus
): ServiceRequest | undefined {
  const row = serviceRequests.find(
    (r) => r.id === idOrTitle || r.title === idOrTitle
  );
  if (!row) return undefined;
  row.status = status;
  return row;
}

export async function snapshot() {
  const list = listParts();
  return {
    bootstrapRequired: inventoryBootstrapRequired(),
    counts: {
      total: list.length,
      outOfStock: list.filter((p) => p.status === "out_of_stock").length,
      low: list.filter((p) => p.status === "low").length,
      inStock: list.filter((p) => p.status === "in_stock").length,
    },
    parts: list,
    orders: await listOrders(),
    catalogLinks: listCatalogLinks(),
    streamCatalog: streamCatalog(),
    serviceRequests: listServiceRequests(),
  };
}
