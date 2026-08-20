import { NextRequest, NextResponse } from "next/server";
import { orderPart, getPart, listParts, inventoryBootstrapRequired } from "@/lib/inventory-store";

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
  const result = orderPart(body.sku || body.id, Number(body.quantity ?? 1));
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({
    ...result,
    message: `Order ${result.orderId} queued for ${result.part?.sku} (HD Supply / Punch-In fallback)`,
  });
}
