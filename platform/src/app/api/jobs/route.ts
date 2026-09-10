import { NextResponse } from "next/server";
import { listServiceRequests } from "@/lib/inventory-store";
import { greenShieldSummary, todayISO } from "@/lib/green-shield";

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

  // Green Shield focus for TODAY — owner directive: the to-do card shows
  // the correct Green Shield for today (local date, weekday-due contract).
  const summary = greenShieldSummary();
  const gs = summary.today;
  const requiredTotal = gs.checklist.length;
  const requiredLeft = gs.checklist.filter((c) => c.required && !c.done).length;
  const greenShieldToday = {
    id: `GS-${gs.date}`,
    title: `Green Shield — ${gs.title}`,
    timeRange: gs.date === todayISO() ? "Today" : gs.date,
    service:
      `Inspection · ${requiredLeft}/${requiredTotal} checks open` +
      (gs.roomsOutOfService.length
        ? ` · rooms OOS: ${gs.roomsOutOfService.join(", ")}`
        : ""),
    status: (gs.completed ? "completed" : "in_progress") as
      | "in_progress"
      | "completed",
    assigneeName: "Open",
    greenShield: true,
    due: gs.due,
  };

  const jobs = [greenShieldToday, ...serviceTodos];
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const scheduled = jobs.filter((j) => j.status === "scheduled").length;
  const completed = jobs.filter((j) => j.status === "completed").length;

  return NextResponse.json({
    surface: "daily_todos",
    ingestion: "detached",
    greeting: "Daily To-Dos",
    greenShield: {
      date: gs.date,
      title: gs.title,
      due: gs.due,
      completed: gs.completed,
      roomsOutOfService: summary.roomsOutOfService,
    },
    counts: { inProgress, scheduled, completed },
    jobs,
  });
}
