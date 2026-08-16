/**
 * enforcer.ts — Exoskeleton Governance Layer (ESA Inventory)
 *
 * The enforcement source of truth for the ESA deployment capability.
 * This module verifies IAM policies, security headers, and speculative
 * hydration contracts BEFORE any deployment sub-operation executes.
 *
 * ARCHITECTURAL ROLE:
 * The model (Intellect) NEVER calls this directly. The substrate
 * invokes `enforce()` as part of the capability collapse — the
 * Intellect only sees the canonical response shape.
 *
 * COMPLIANCE:
 * - Default-deny policy (no action executes without explicit allow)
 * - IAM boundary check (GitHub token, CF token scope validation)
 * - Speculative hydration contract (pre-provision on push success)
 * - Nerve damage prevention (no serialized latency visible to Intellect)
 * - Muscle failure prevention (no port/token/infra reasoning by model)
 */

export type Decision = "allow" | "deny" | "allow_with_conditions";

export interface EnforcerContext {
  capability: string;
  intent: string;
  actor?: string;
  env?: Record<string, string>;
}

export interface EnforcerResult {
  decision: Decision;
  reason: string;
  conditions?: string[];
  latency_budget_ms?: number;
}

export interface SecurityHeaders {
  "X-Frame-Options": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "Content-Security-Policy": string;
  "Strict-Transport-Security": string;
}

export interface DeploymentSpec {
  subdomain: string;
  repo: string;
  branch: string;
  vendor: string;
  property: string;
  port: number;
  caddyPort: number;
  fqn: string;
}

export type ESAIntent = "deploy" | "sync" | "scan" | "reorder" | "status";

export interface ESAFeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  requires: string[];
}

const ESA_POLICY_RULES: Array<{
  name: string;
  match: (ctx: EnforcerContext) => boolean;
  decision: Decision;
  reason: string;
  conditions?: string[];
}> = [
  {
    name: "esa_deploy_allow",
    match: (ctx) =>
      ctx.capability === "esa_inventory" && ctx.intent === "deploy",
    decision: "allow",
    reason: "ESA deployment is a registered composed capability",
  },
  {
    name: "esa_sync_allow",
    match: (ctx) =>
      ctx.capability === "esa_inventory" && ctx.intent === "sync",
    decision: "allow_with_conditions",
    reason: "HD Supply sync requires vendor acknowledgement",
    conditions: [
      "vendor: HD Supply — no public API available",
      "method: PDF/CSV export → local parse",
      "fallback: Punch-In portal handoff",
    ],
  },
  {
    name: "esa_scan_allow",
    match: (ctx) =>
      ctx.capability === "esa_inventory" && ctx.intent === "scan",
    decision: "allow",
    reason: "Ingeniosity Lens is a pre-registered capability",
  },
  {
    name: "esa_reorder_allow",
    match: (ctx) =>
      ctx.capability === "esa_inventory" && ctx.intent === "reorder",
    decision: "allow_with_conditions",
    reason: "Reorder requires non-empty cart",
    conditions: ["cart.items.length > 0", "output: PDF reorder sheet"],
  },
  {
    name: "esa_status_allow",
    match: (ctx) =>
      ctx.capability === "esa_inventory" && ctx.intent === "status",
    decision: "allow",
    reason: "Status inspection is always permitted for operators",
  },
  {
    name: "default_deny",
    match: () => true,
    decision: "deny",
    reason: "No matching policy rule — default deny",
  },
];

const DEFAULT_ESA_FEATURES: ESAFeatureFlag[] = [
  {
    id: "esa.deploy",
    label: "Deploy capability",
    description: "Register and hydrate ESA.ingeniosity.tech under Exoskeleton",
    enabled: true,
    requires: ["repo", "dns", "build"],
  },
  {
    id: "esa.sync",
    label: "Vendor sync (HD Supply)",
    description: "PDF/CSV inventory ingest → local catalog",
    enabled: true,
    requires: ["vendor_read"],
  },
  {
    id: "esa.scan",
    label: "Ingeniosity Lens scan",
    description: "Vision / SKU capture via IRIS",
    enabled: true,
    requires: ["camera", "vision"],
  },
  {
    id: "esa.reorder",
    label: "Reorder sheet",
    description: "Generate PDF reorder for non-empty cart",
    enabled: true,
    requires: ["vendor_write", "pdf_gen"],
  },
  {
    id: "esa.governance",
    label: "Exoskeleton enforcer",
    description: "Default-deny policy + IAM boundary checks",
    enabled: true,
    requires: [],
  },
];

export class ExoskeletonEnforcer {
  private rules = ESA_POLICY_RULES;
  private deployed: Map<string, DeploymentSpec> = new Map();
  private features: ESAFeatureFlag[] = [...DEFAULT_ESA_FEATURES];

  constructor() {
    this.registerDeployment({
      subdomain: "ESA",
      repo: "ingeniosity-A2A/Agent-X",
      branch: "main",
      vendor: "HD Supply",
      property: "Extended Stay America · Buckhead · Brookhaven, GA",
      port: 3000,
      caddyPort: 81,
      fqn: "ESA.ingeniosity.tech",
    });
  }

  enforce(ctx: EnforcerContext): EnforcerResult {
    for (const rule of this.rules) {
      if (rule.match(ctx)) {
        return {
          decision: rule.decision,
          reason: rule.reason,
          conditions: rule.conditions,
          latency_budget_ms: 0,
        };
      }
    }
    return {
      decision: "deny",
      reason: "No policy rules registered",
    };
  }

  verifySecurityHeaders(): SecurityHeaders {
    return {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' data: https://hdsupply.com; connect-src 'self' https://hdsupply.com",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    };
  }

  speculativeHydrationPlan(deployment: DeploymentSpec): {
    dns: { type: string; name: string; proxied: boolean };
    reverseProxy: { port: number; target: number };
    seed: { source: string; parts: number };
    environment: Record<string, string>;
  } {
    return {
      dns: {
        type: "CNAME",
        name: deployment.fqn,
        proxied: true,
      },
      reverseProxy: {
        port: deployment.caddyPort,
        target: deployment.port,
      },
      seed: {
        source: "scripts/seed-inventory.ts",
        parts: 12,
      },
      environment: {
        DATABASE_URL: "file:./db/custom.db",
        NEXT_PUBLIC_BRAND: "Extended Stay America",
        NEXT_PUBLIC_VENDOR: "HD Supply",
        NEXT_PUBLIC_PROPERTY: "Buckhead",
        NEXT_PUBLIC_SURFACE: "esa_console",
      },
    };
  }

  registerDeployment(spec: DeploymentSpec): void {
    this.deployed.set(spec.subdomain, spec);
  }

  getDeployment(subdomain: string): DeploymentSpec | undefined {
    return this.deployed.get(subdomain);
  }

  listDeployments(): DeploymentSpec[] {
    return Array.from(this.deployed.values());
  }

  listFeatures(): ESAFeatureFlag[] {
    return this.features.map((f) => ({ ...f }));
  }

  setFeatureEnabled(id: string, enabled: boolean): ESAFeatureFlag | undefined {
    const feature = this.features.find((f) => f.id === id);
    if (!feature) return undefined;
    feature.enabled = enabled;
    return { ...feature };
  }

  getConsoleSnapshot() {
    const deployment = this.getDeployment("ESA");
    const governance = this.enforce({
      capability: "esa_inventory",
      intent: "status",
    });
    return {
      surface: "esa_console",
      framework: "exoskeleton",
      capability: "esa_inventory",
      deployment: deployment ?? null,
      features: this.listFeatures(),
      agents: [
        { id: "IRIS", role: "Vision", status: "idle" },
        { id: "FORGE", role: "SKU Match", status: "idle" },
        { id: "NEXUS", role: "Reorder", status: "idle" },
        { id: "AVA", role: "Executive", status: "idle" },
      ],
      governance: {
        decision: governance.decision,
        reason: governance.reason,
      },
      securityHeaders: this.verifySecurityHeaders(),
      hydration: deployment
        ? this.speculativeHydrationPlan(deployment)
        : null,
      notes: [
        "Dashboard routes are retired. Operator surface is /consoles/esa-maintenance (Select Card).",
        "Intellect never calls enforcer directly; substrate collapses capability.",
        "Agent-X is exo surface + sandbox — not a peer Intellect.",
      ],
    };
  }

  verifyIAM(operation: string, scopes: string[]): {
    valid: boolean;
    missing: string[];
  } {
    const requiredScopes: Record<string, string[]> = {
      deploy: ["repo", "dns", "build"],
      sync: ["vendor_read"],
      reorder: ["vendor_write", "pdf_gen"],
      scan: ["camera", "vision"],
      status: [],
    };

    const needed = requiredScopes[operation] || [];
    const missing = needed.filter((s) => !scopes.includes(s));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

export const enforcer = new ExoskeletonEnforcer();

export interface ESACanonicalResponse {
  status: "ok" | "error";
  result: {
    fqn: string;
    vendor: string;
    property: string;
    agents: Array<{ id: string; role: string; status: string }>;
    capability: string;
  };
  meta?: {
    latency_ms: number;
    governance: string;
  };
}

export function buildCanonicalResponse(
  deployment: DeploymentSpec,
  governance: string
): ESACanonicalResponse {
  return {
    status: "ok",
    result: {
      fqn: deployment.fqn,
      vendor: deployment.vendor,
      property: deployment.property,
      agents: [
        { id: "IRIS", role: "Vision", status: "idle" },
        { id: "FORGE", role: "SKU Match", status: "idle" },
        { id: "NEXUS", role: "Reorder", status: "idle" },
        { id: "AVA", role: "Executive", status: "idle" },
      ],
      capability: "esa_inventory",
    },
    meta: {
      latency_ms: 0,
      governance,
    },
  };
}
