import { NextResponse } from "next/server";
import { listBackendStatuses, probeBackend } from "@/lib/backends/registry";

/**
 * GET /api/ai/backends — status of the model backend capability adapters
 * (Hugging Face Hub substrate + Mercury2 cortex tier). Secrets never cross
 * the boundary: keys are reported as masked tails only.
 *
 * POST /api/ai/backends — probe a backend:
 *   { "id": "huggingface" }  → doctrine reflex `hf auth whoami`
 *   { "id": "mercury2" }     → minimal 16-token diffusion block probe
 */

export async function GET() {
  return NextResponse.json({ backends: listBackendStatuses() });
}

export async function POST(request: Request) {
  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.id) {
    return NextResponse.json(
      { ok: false, error: "Missing backend id" },
      { status: 400 }
    );
  }

  const result = await probeBackend(body.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
