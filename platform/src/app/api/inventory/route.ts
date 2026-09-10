import { NextRequest, NextResponse } from "next/server";
import {
  snapshot,
  upsertPartFromScan,
  addFromCatalogStream,
  setQuantity,
  inventoryBootstrapRequired,
} from "@/lib/inventory-store";
import { getCatalog, revalidateCatalog } from "@/lib/catalog-cache";

export async function GET() {
  // HD Supply catalog via RocksDB housing (fast rendering — the process
  // cache makes every call after the first a plain memory read).
  const catalog = getCatalog();
  const snap = await snapshot();
  return NextResponse.json({
    ok: true,
    mandatoryInventory: inventoryBootstrapRequired(),
    message: inventoryBootstrapRequired()
      ? "No inventory database — inventory session is mandatory before ordering."
      : "Inventory loaded",
    catalog: {
      vendor: catalog.vendor,
      source: catalog.source,
      loadedAt: catalog.loadedAt,
      items: catalog.items,
    },
    ...snap,
    // streamCatalog kept for card compat — served from the RocksDB snapshot
    streamCatalog: catalog.items,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "catalog_refresh") {
      const catalog = await revalidateCatalog();
      return NextResponse.json({
        ok: true,
        message: `Catalog revalidated from ${catalog.source} (${catalog.items.length} items)`,
        catalog,
      });
    }

    if (action === "scan_add" || action === "photo_add") {
      const quantity = Number(body.quantity ?? 0);
      const part = upsertPartFromScan({
        sku: body.sku,
        name: body.name || body.sku || "Scanned part",
        barcode: body.barcode ?? null,
        quantity,
        unit: body.unit,
        location: body.location,
        imageUrl: body.imageUrl ?? null,
        catalogUrl: body.catalogUrl ?? null,
        vendor: body.vendor ?? "HD Supply",
        source: body.source ?? "scan",
      });
      return NextResponse.json({
        ok: true,
        part,
        conversational: {
          role: "ava007",
          prompt:
            quantity === 0
              ? `${part.name} marked out of stock (red). Add a service request?`
              : `Recorded ${part.name} at qty ${part.quantity}. Scan next or order parts?`,
        },
        ...(await snapshot()),
      });
    }

    if (action === "stream_add") {
      const qty = Number(body.quantity ?? 0);
      const part = addFromCatalogStream(body.sku, qty);
      if (!part) {
        return NextResponse.json(
          { ok: false, error: "SKU not in streamed catalog" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, part, ...(await snapshot()) });
    }

    if (action === "set_quantity") {
      const part = setQuantity(body.sku || body.id, Number(body.quantity ?? 0));
      if (!part) {
        return NextResponse.json({ ok: false, error: "Part not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, part, ...(await snapshot()) });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Inventory error" },
      { status: 500 }
    );
  }
}
