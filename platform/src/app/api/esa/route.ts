import { NextRequest, NextResponse } from "next/server";
import {
  enforcer,
  buildCanonicalResponse,
  type ESAIntent,
} from "@/lib/enforcer";

/**
 * ESA Console API — operator surface only.
 * Not a general dashboard. Intellect never hits these routes;
 * substrate uses enforcer internally during capability collapse.
 */

export async function GET() {
  const snapshot = enforcer.getConsoleSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(req: NextRequest) {
  let body: {
    action?: string;
    intent?: ESAIntent;
    featureId?: string;
    enabled?: boolean;
    scopes?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "error", error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const action = body.action ?? "enforce";

  if (action === "set_feature") {
    if (!body.featureId || typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { status: "error", error: "featureId and enabled required" },
        { status: 400 }
      );
    }
    const updated = enforcer.setFeatureEnabled(body.featureId, body.enabled);
    if (!updated) {
      return NextResponse.json(
        { status: "error", error: "Unknown feature" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      status: "ok",
      feature: updated,
      snapshot: enforcer.getConsoleSnapshot(),
    });
  }

  if (action === "verify_iam") {
    const intent = body.intent ?? "status";
    const scopes = body.scopes ?? [];
    const result = enforcer.verifyIAM(intent, scopes);
    return NextResponse.json({ status: "ok", intent, ...result });
  }

  const intent: ESAIntent = body.intent ?? "status";
  const decision = enforcer.enforce({
    capability: "esa_inventory",
    intent,
  });

  if (decision.decision === "deny") {
    return NextResponse.json(
      {
        status: "error",
        governance: decision,
        result: null,
      },
      { status: 403 }
    );
  }

  const deployment = enforcer.getDeployment("ESA");
  if (!deployment) {
    return NextResponse.json(
      { status: "error", error: "ESA deployment not registered" },
      { status: 500 }
    );
  }

  const canonical = buildCanonicalResponse(
    deployment,
    decision.decision === "allow"
      ? "allow"
      : `allow_with_conditions:${(decision.conditions ?? []).join(";")}`
  );

  return NextResponse.json({
    ...canonical,
    governance: decision,
    hydration:
      intent === "deploy"
        ? enforcer.speculativeHydrationPlan(deployment)
        : undefined,
  });
}
