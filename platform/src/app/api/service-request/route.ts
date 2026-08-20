import { NextRequest, NextResponse } from "next/server";
import {
  addServiceRequest,
  listServiceRequests,
  updateServiceRequestStatus,
  type ServiceRequestStatus,
} from "@/lib/inventory-store";

const ALLOWED: ServiceRequestStatus[] = [
  "completed",
  "incomplete_parts",
  "follow_up",
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    requests: listServiceRequests(),
    statuses: ALLOWED,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "set_status") {
    const status = body.status as ServiceRequestStatus;
    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        { ok: false, error: "status must be completed | incomplete_parts | follow_up" },
        { status: 400 }
      );
    }
    const row = updateServiceRequestStatus(body.id, status);
    if (!row) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, request: row });
  }

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
  }
  const status =
    body.status && ALLOWED.includes(body.status) ? body.status : "incomplete_parts";
  const reqRow = addServiceRequest({
    title: body.title,
    service: body.service ?? "Service request",
    partSku: body.partSku,
    notes: body.notes,
    assigneeName: body.assigneeName,
    status,
  });
  return NextResponse.json({
    ok: true,
    request: reqRow,
    todo: "Added to Daily To-Dos",
  });
}
