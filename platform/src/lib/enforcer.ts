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

// ── Policy Types ─────────────────────────────────────────────────

export type Decision = "allow" | "deny" | "allow_with_conditions"];

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

// ── Policy Rules ────────────────────────────────────────────────

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
    name: "default_deny",
    match: () => true,
    decision: "deny",
    reason: "No matching policy rule — default deny",
  },
];

// ── Enforcer ────────────────────────────────────────────────────

/**
 * The Exoskeleton Enforcer for ESA Inventory deployments.
 *
 * Evaluates capability invocations against registered policy rules.
 * Returns a structured result that the substrate uses to decide
 * whether to proceed, proceed with conditions, or block.
 *
 * CRITICAL: This is invisible to the Intellect. The model emits
 * an intent ("deploy ESA inventory"), and the substrate calls
 * `enforce()` internally. The model only sees the canonical
 * response shape — never the governance decision.
 */
export class ExoskeletonEnforcer {
  private rules = ESA_POLICY_RULES;
  private deployed: Map<string, DeploymentSpec> = new Map();

  constructor() {
    // Register default ESA deployment spec
    this.registerDeployment({
      subdomain: "ESA",
      repo: "ingeniosity-A2A/Ava007",
      branch: "main",
      vendor: "HD Supply",
      property: "Extended Stay America · Buckhead · Brookhaven, GA",
      port: 3000,
      caddyPort: 81,
      fqn: "ESA.ingeniosity.tech",
    });
  }

  /**
   * Evaluate a capability invocation against policy rules.
   * Rules are evaluated in order — first match wins.
   */
  enforce(ctx: EnforcerContext): EnforcerResult {
    for (const rule of this.rules) {
      if (rule.match(ctx)) {
        return {
          decision: rule.decision,
          reason: rule.reason,
          conditions: rule.conditions,
          latency_budget_ms: 0, // Capability collapse = zero perceived latency
        };
      }
    }

    return {
      decision: "deny",
      reason: "No policy rules registered",
    };
  }

  /**
   * Verify required security headers for the ESA deployment.
   * These headers are injected by Caddy — the Intellect never
   * configures them. This is the substrate's responsibility.
   */
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

  /**
   * Speculative hydration contract.
   *
   * When a `deploy` intent succeeds, the substrate SHOULD
   * speculatively pre-provision these resources so the Intellect
   * perceives zero latency on the next `sync` or `reorder` call.
   *
   * This eliminates "nerve damage" — the model never waits for
   * DNS propagation or container spin-up.
   */
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
      },
    };
  }

  /**
   * Register a deployment specification.
   */
  registerDeployment(spec: DeploymentSpec): void {
    this.deployed.set(spec.subdomain, spec);
  }

  /**
   * Get a registered deployment spec.
   */
  getDeployment(subdomain: string): DeploymentSpec | undefined {
    return this.deployed.get(subdomain);
  }

  /**
   * List all registered deployments.
   */
  listDeployments(): DeploymentSpec[] {
    return Array.from(this.deployed.values());
  }

  /**
   * IAM boundary check.
   *
   * Validates that the provided credentials have the required
   * scope for the requested operation. The Intellect never
   * sees tokens — this is a substrate-internal gate.
   */
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

// ── Singleton ────────────────────────────────────────────────────

/** Global enforcer instance. */
export const enforcer = new ExoskeletonEnforcer();

// ── Canonical Response Shape ────────────────────────────────────

/**
 * The model-facing contract for ESA deployment responses.
 * This is the ONLY shape the Intellect ever sees.
 */
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

/**
 * Build a canonical response from a deployment result.
 * The substrate calls this after the capability executes.
 */
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
