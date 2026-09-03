import { NextResponse } from "next/server";

/**
 * POST /api/ai/intent — reserved dispatch point for the Intellect intent
 * queue (BottomAIBar + UniversalFeatureStack both POST here).
 *
 * The queue backend is NOT wired in this deployment, so the route answers 501
 * with an explicit hint instead of pretending to enqueue. When the Intellect
 * endpoint exists, replace this handler with the real dispatch.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { text?: string; current_surface?: string } | null;

  if (!body?.text) {
    return NextResponse.json({ ok: false, hint: "text is required" }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      hint: `Intellect intent queue not wired yet — dispatch point reserved (received ${JSON.stringify(body.text)} for surface ${JSON.stringify(body.current_surface ?? "unknown")}).`,
    },
    { status: 501 },
  );
}
