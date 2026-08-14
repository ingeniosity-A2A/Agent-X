import { NextRequest, NextResponse } from "next/server";
import {
  getMonthDays,
  getDay,
  toggleChecklistItem,
  setRoomsOutOfService,
  greenShieldSummary,
} from "@/lib/green-shield";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("date");
  const year = Number(sp.get("year") ?? new Date().getFullYear());
  const month = Number(sp.get("month") ?? new Date().getMonth());

  if (date) {
    return NextResponse.json({ ok: true, day: getDay(date), summary: greenShieldSummary(date) });
  }

  return NextResponse.json({
    ok: true,
    year,
    month,
    days: getMonthDays(year, month),
    summary: greenShieldSummary(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "toggle" && body.date && body.itemId) {
    const day = toggleChecklistItem(body.date, body.itemId);
    return NextResponse.json({ ok: true, day });
  }
  if (body.action === "rooms" && body.date && Array.isArray(body.rooms)) {
    const day = setRoomsOutOfService(body.date, body.rooms.map(String));
    return NextResponse.json({ ok: true, day });
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
