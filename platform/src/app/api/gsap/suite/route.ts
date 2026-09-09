import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * GET /api/gsap/suite
 *
 * Live proof of the full GSAP suite + API-key readiness.
 * - Suite: reads the installed gsap package and verifies EVERY plugin
 *   file exists on disk (roster from src/lib/gsap/suite.ts).
 * - Env: reports which API-contract keys are CONFIGURED (boolean only —
 *   values are never returned).
 */

// Must read the filesystem → Node runtime.
export const runtime = "nodejs";

const ROSTER: Array<{ name: string; file: string; dir?: string }> = [
  { name: "gsap (core)", file: "gsap-core.js", dir: "." },
  { name: "CSSPlugin", file: "CSSPlugin.js", dir: "." },
  { name: "CSSRulePlugin", file: "CSSRulePlugin.js" },
  { name: "CustomBounce", file: "CustomBounce.js" },
  { name: "CustomEase", file: "CustomEase.js" },
  { name: "CustomWiggle", file: "CustomWiggle.js" },
  { name: "Draggable", file: "Draggable.js" },
  { name: "DrawSVGPlugin", file: "DrawSVGPlugin.js" },
  { name: "EaselPlugin", file: "EaselPlugin.js" },
  { name: "EasePack", file: "EasePack.js" },
  { name: "Flip", file: "Flip.js" },
  { name: "GSDevTools", file: "GSDevTools.js" },
  { name: "InertiaPlugin", file: "InertiaPlugin.js" },
  { name: "MorphSVGPlugin", file: "MorphSVGPlugin.js" },
  { name: "MotionPathHelper", file: "MotionPathHelper.js" },
  { name: "MotionPathPlugin", file: "MotionPathPlugin.js" },
  { name: "Observer", file: "Observer.js" },
  { name: "Physics2DPlugin", file: "Physics2DPlugin.js" },
  { name: "PhysicsPropsPlugin", file: "PhysicsPropsPlugin.js" },
  { name: "PixiPlugin", file: "PixiPlugin.js" },
  { name: "ScrambleTextPlugin", file: "ScrambleTextPlugin.js" },
  { name: "ScrollSmoother", file: "ScrollSmoother.js" },
  { name: "ScrollToPlugin", file: "ScrollToPlugin.js" },
  { name: "ScrollTrigger", file: "ScrollTrigger.js" },
  { name: "SplitText", file: "SplitText.js" },
  { name: "TextPlugin", file: "TextPlugin.js" },
];

const ENV_CONTRACT: Array<{ key: string; service: string }> = [
  { key: "HF_TOKEN", service: "Hugging Face (substrate inference + repo read)" },
  { key: "MERCURY2_API_KEY", service: "Mercury 2 (cortex dLLM)" },
  { key: "MERCURY2_ENDPOINT", service: "Mercury 2 (endpoint override)" },
  { key: "MERCURY2_MODEL", service: "Mercury 2 (model override)" },
  { key: "DATABASE_URL", service: "Prisma + SQLite persistence" },
  { key: "AGENTMAIL_API_KEY", service: "AgentMail (ESA email)" },
  { key: "AGENTMAIL_INBOX_ID", service: "AgentMail (inbox)" },
  { key: "ESA_AVA_EMAIL", service: "ESA (ava identity)" },
  { key: "ESA_MANAGER_EMAIL", service: "ESA (manager routing)" },
  { key: "R2_ACCESS_KEY_ID", service: "Cloudflare R2 (storage)" },
  { key: "R2_SECRET_ACCESS_KEY", service: "Cloudflare R2 (storage)" },
  { key: "NEXT_PUBLIC_SITE_URL", service: "ESA site surface" },
];

export async function GET() {
  let gsapVersion = "not installed";
  const gsapPkg = join(process.cwd(), "node_modules", "gsap", "package.json");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    gsapVersion = JSON.parse(readFileSync(gsapPkg, "utf8")).version ?? gsapVersion;
  } catch {
    /* keep "not installed" — honest */
  }

  const gsapRoot = join(process.cwd(), "node_modules", "gsap");
  const plugins = ROSTER.map((p) => ({
    name: p.name,
    installed: existsSync(join(gsapRoot, p.dir ?? "dist", p.file)),
  }));
  const missing = plugins.filter((p) => !p.installed).map((p) => p.name);

  const envContract = ENV_CONTRACT.map((e) => ({
    ...e,
    configured: Boolean(process.env[e.key]?.trim()),
  }));

  return NextResponse.json({
    suite: {
      package: "gsap",
      version_on_disk: gsapVersion,
      license: "Webflow — 100% free since 3.13 (ALL plugins incl. bonus)",
      plugin_count: plugins.length,
      plugins,
      all_installed: missing.length === 0,
      missing,
      registry_module: "src/lib/gsap/suite.ts",
    },
    api_readiness: {
      contract_source: "platform/.env.example (versioned in git)",
      secrets_location: ".env.local — gitignored BY DESIGN, re-add per session or via dashboard sources",
      keys: envContract,
      configured_count: envContract.filter((k) => k.configured).length,
      total: envContract.length,
    },
  });
}
