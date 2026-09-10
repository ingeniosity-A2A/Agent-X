import { NextRequest, NextResponse } from "next/server";
import { orderPart, getPart, listParts, inventoryBootstrapRequired } from "@/lib/inventory-store";
import { punchInUrl } from "@/lib/catalog-cache";

export async function GET() {
  return NextResponse.json({
    ok: true,
    bootstrapRequired: inventoryBootstrapRequired(),
    parts: listParts(),
  });
}

export async function POST(req: NextRequest) {
  if (inventoryBootstrapRequired()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Inventory mandatory — no parts database yet. Complete an inventory session first.",
        bootstrapRequired: true,
      },
      { status: 409 }
    );
  }

  const body = await req.json();
  const sku = body.sku || body.id;
  const qty = Number(body.quantity ?? 1);
  // HD Supply Punch-In deep link — resolved from the RocksDB catalog when
  // the SKU is known, generic SKU search otherwise.
  const handoff = punchInUrl(sku);
  const result = orderPart(sku, qty, handoff);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({
    ...result,
    orderUrl: handoff,
    message: `Order ${result.orderId} queued for ${result.part?.sku} — HD Supply Punch-In ready (${result.order?.quantity} × ${result.order?.name})`,
  });
}
