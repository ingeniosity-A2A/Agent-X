import { NextRequest, NextResponse } from "next/server";
import {
  snapshot as inventorySnapshot,
  listServiceRequests,
} from "@/lib/inventory-store";
import { greenShieldSummary } from "@/lib/green-shield";
import {
  AVA_EMAIL,
  MANAGER_EMAIL,
  sendViaAgentMail,
} from "@/lib/esa-email";

function buildEodBody() {
  const inv = inventorySnapshot();
  const services = listServiceRequests();
  const gs = greenShieldSummary();

  const serviceComplete = services.filter((s) => s.status === "completed");
  const serviceMissed = services.filter(
    (s) => s.status === "incomplete_parts" || s.status === "follow_up"
  );
  const outOfStock = inv.parts.filter((p) => p.status === "out_of_stock");

  const subject = `EOD ESA Exoskeleton snapshot — ${new Date().toISOString().slice(0, 10)}`;
  const text = [
    `From: Ava007 <${AVA_EMAIL}>`,
    `To: Manager <${MANAGER_EMAIL}>`,
    subject,
    "",
    "=== Inventory ===",
    `Parts tracked: ${inv.counts.total}`,
    `In stock: ${inv.counts.inStock} · Low: ${inv.counts.low} · Out of stock: ${inv.counts.outOfStock}`,
    ...outOfStock.map((p) => `  OOS: ${p.sku} ${p.name}`),
    "",
    "=== Green Shield ===",
    `Today (${gs.today.date}): ${gs.today.title}`,
    `Checklist complete: ${gs.today.completed ? "YES" : "NO"}`,
    `Items done: ${gs.today.checklist.filter((c) => c.done).length}/${gs.today.checklist.length}`,
    `Month completed days: ${gs.completedDays} · still due: ${gs.dueDays}`,
    "",
    "=== Service requests ===",
    `Completed: ${serviceComplete.length}`,
    ...serviceComplete.map((s) => `  ✓ ${s.id} ${s.title}`),
    `Missed / open (incomplete parts + follow-up): ${serviceMissed.length}`,
    ...serviceMissed.map((s) => `  • ${s.status}: ${s.id} ${s.title}`),
    "",
    "=== Out of service rooms ===",
    gs.roomsOutOfService.length
      ? gs.roomsOutOfService.map((r) => `  Room ${r}`).join("\n")
      : "  None reported today",
    "",
    "=== Out of stock ===",
    outOfStock.length
      ? outOfStock.map((p) => `  ${p.sku} — ${p.name}`).join("\n")
      : "  None",
    "",
    "— ESA Exoskeleton Console · Agent-X",
  ].join("\n");

  return {
    subject,
    text,
    snapshot: {
      inventory: inv.counts,
      outOfStock: outOfStock.map((p) => ({ sku: p.sku, name: p.name })),
      greenShield: {
        date: gs.today.date,
        title: gs.today.title,
        completed: gs.today.completed,
        roomsOutOfService: gs.roomsOutOfService,
      },
      service: {
        complete: serviceComplete.map((s) => s.id),
        missed: serviceMissed.map((s) => ({ id: s.id, status: s.status })),
      },
    },
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "alone" ? "alone" : "batch";
  const to = body.to || MANAGER_EMAIL;

  if (mode === "alone" && body.context) {
    const subject = `ESA Card · ${body.context.type ?? "card"} — ${body.context.id ?? "item"}`;
    const text = [
      `From: Ava007 <${AVA_EMAIL}>`,
      `To: Manager <${to}>`,
      subject,
      "",
      JSON.stringify(body.context, null, 2),
      "",
      "— ESA Exoskeleton · Select Card send-alone",
    ].join("\n");

    const result = await sendViaAgentMail({ to, subject, text });
    return NextResponse.json({
      ...result,
      mode: "alone",
      email: { from: AVA_EMAIL, to, subject, text },
    });
  }

  const eod = buildEodBody();
  const result = await sendViaAgentMail({
    to,
    subject: eod.subject,
    text: eod.text,
  });

  return NextResponse.json({
    ...result,
    mode: "batch",
    email: { from: AVA_EMAIL, to, subject: eod.subject, text: eod.text },
    snapshot: eod.snapshot,
  });
}
