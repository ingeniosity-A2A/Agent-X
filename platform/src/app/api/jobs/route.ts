import { NextResponse } from "next/server";
import { listServiceRequests } from "@/lib/inventory-store";

/** Map service-request statuses into daily todo list presentation. */
function todoStatus(
  s: string
): "in_progress" | "scheduled" | "completed" {
  if (s === "completed") return "completed";
  if (s === "follow_up") return "scheduled";
  return "in_progress"; // incomplete_parts
}

export async function GET() {
  const serviceTodos = listServiceRequests().map((r) => ({
    id: r.id,
    title: r.title,
    timeRange: r.timeRange,
    service:
      r.service +
      (r.partSku ? ` · ${r.partSku}` : "") +
      ` · ${r.status.replace("_", " ")}`,
    status: todoStatus(r.status),
    assigneeName: r.assigneeName ?? "Open",
    serviceRequestStatus: r.status,
  }));

  const inProgress = serviceTodos.filter((j) => j.status === "in_progress").length;
  const scheduled = serviceTodos.filter((j) => j.status === "scheduled").length;
  const completed = serviceTodos.filter((j) => j.status === "completed").length;

  return NextResponse.json({
    surface: "daily_todos",
    ingestion: "detached",
    greeting: "Daily To-Dos",
    counts: { inProgress, scheduled, completed },
    jobs: serviceTodos,
  });
}
