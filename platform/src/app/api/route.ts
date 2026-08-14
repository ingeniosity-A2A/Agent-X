import { NextResponse } from "next/server";

/** Platform health — not a dashboard. ESA operator API is /api/esa. */
export async function GET() {
  return NextResponse.json({
    service: "agent-x",
    surface: "exo.help_assembly",
    esa_console: "/console",
    esa_api: "/api/esa",
    dashboard: "retired",
  });
}
