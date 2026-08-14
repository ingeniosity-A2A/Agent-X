/**
 * ESA inventory store — mandatory when no catalog DB exists.
 * In-process for dev; swap for DuckDB/Arrow later without changing API shapes.
 */

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

function statusFromQty(q: number): PartStatus {
  if (q <= 0) return "out_of_stock";
  if (q <= 3) return "low";
  return "in_stock";
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Empty until first inventory session — system treats missing DB as mandatory inventory. */
const parts = new Map<string, PartRecord>();
const serviceRequests: ServiceRequest[] = [];

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
  qty: number
): { ok: boolean; part?: PartRecord; orderId?: string; error?: string } {
  const p = getPart(skuOrId);
  if (!p) return { ok: false, error: "Part not in inventory — run inventory first" };
  if (qty <= 0) return { ok: false, error: "Order quantity must be > 0" };
  const orderId = id("ORD");
  return { ok: true, part: p, orderId };
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

export function snapshot() {
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
    catalogLinks: listCatalogLinks(),
    streamCatalog: streamCatalog(),
    serviceRequests: listServiceRequests(),
  };
}
