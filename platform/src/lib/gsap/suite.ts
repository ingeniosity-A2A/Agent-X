/**
 * GSAP Full Suite Registry — every single GSAP plugin, versioned in git.
 *
 * Since GSAP 3.13 (Webflow acquisition) the COMPLETE plugin roster — every
 * previously-premium "bonus" plugin included — ships free in the public npm
 * `gsap` package. This file is the repo-borne proof: `node_modules` is
 * gitignored, so GitHub shows nothing; THIS module shows everything.
 *
 * Installed: gsap 3.15.0 (platform/package.json → "gsap": "^3.13.0", root
 * → "^3.15.0" — both resolve to the full-suite 3.15.0 on disk).
 *
 * Usage:
 *   import { registerGsapSuite } from "@/lib/gsap/suite";
 *   // client-side, once per app:
 *   registerGsapSuite();
 */

import { gsap } from "gsap";
import { CSSPlugin } from "gsap/CSSPlugin";
import { CSSRulePlugin } from "gsap/CSSRulePlugin";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomEase } from "gsap/CustomEase";
import { CustomWiggle } from "gsap/CustomWiggle";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { EaselPlugin } from "gsap/EaselPlugin";
import { EasePack } from "gsap/EasePack";
import { Flip } from "gsap/Flip";
import { GSDevTools } from "gsap/GSDevTools";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Observer } from "gsap/Observer";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { PixiPlugin } from "gsap/PixiPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

export type SuiteTier = "core" | "plugin" | "bonus";

export interface SuiteEntry {
  name: string;
  importPath: string;
  tier: SuiteTier;
  role: string;
  plugin: object; // the actual GSAP plugin object, for registerPlugin()
}

/** The full roster — every GSAP plugin in the 3.13+ free suite. */
export const GSAP_SUITE: SuiteEntry[] = [
  { name: "gsap (core)", importPath: "gsap", tier: "core", role: "Tween engine — the master timeline", plugin: gsap },
  { name: "CSSPlugin", importPath: "gsap/CSSPlugin", tier: "core", role: "CSS property tweening (auto-loaded)", plugin: CSSPlugin },
  { name: "EasePack", importPath: "gsap/EasePack", tier: "core", role: "Classic eases (Power/Back/Elastic/Bounce)", plugin: EasePack },
  { name: "Observer", importPath: "gsap/Observer", tier: "core", role: "Unified pointer/touch/wheel/scroll detection", plugin: Observer },
  { name: "ScrollTrigger", importPath: "gsap/ScrollTrigger", tier: "plugin", role: "Scroll-driven animation", plugin: ScrollTrigger },
  { name: "ScrollSmoother", importPath: "gsap/ScrollSmoother", tier: "bonus", role: "Smooth scrolling + parallax", plugin: ScrollSmoother },
  { name: "ScrollToPlugin", importPath: "gsap/ScrollToPlugin", tier: "plugin", role: "Tween scroll position to targets", plugin: ScrollToPlugin },
  { name: "Draggable", importPath: "gsap/Draggable", tier: "plugin", role: "Touch/mouse drag with snap/bounds", plugin: Draggable },
  { name: "InertiaPlugin", importPath: "gsap/InertiaPlugin", tier: "bonus", role: "Momentum tracking for Draggable", plugin: InertiaPlugin },
  { name: "Flip", importPath: "gsap/Flip", tier: "plugin", role: "State-transition FLIP animation", plugin: Flip },
  { name: "SplitText", importPath: "gsap/SplitText", tier: "bonus", role: "Text splitting into chars/words/lines", plugin: SplitText },
  { name: "MorphSVGPlugin", importPath: "gsap/MorphSVGPlugin", tier: "bonus", role: "SVG shape morphing with point matching", plugin: MorphSVGPlugin },
  { name: "DrawSVGPlugin", importPath: "gsap/DrawSVGPlugin", tier: "bonus", role: "SVG stroke drawing/outline animation", plugin: DrawSVGPlugin },
  { name: "MotionPathPlugin", importPath: "gsap/MotionPathPlugin", tier: "plugin", role: "Animate along any path/curve", plugin: MotionPathPlugin },
  { name: "MotionPathHelper", importPath: "gsap/MotionPathHelper", tier: "bonus", role: "Visual editor for motion paths", plugin: MotionPathHelper },
  { name: "TextPlugin", importPath: "gsap/TextPlugin", tier: "plugin", role: "Typewriter text replacement", plugin: TextPlugin },
  { name: "ScrambleTextPlugin", importPath: "gsap/ScrambleTextPlugin", tier: "bonus", role: "Character-scramble text reveals", plugin: ScrambleTextPlugin },
  { name: "CSSRulePlugin", importPath: "gsap/CSSRulePlugin", tier: "plugin", role: "Tween raw CSS stylesheet rules", plugin: CSSRulePlugin },
  { name: "EaselPlugin", importPath: "gsap/EaselPlugin", tier: "plugin", role: "EaselJS property tweening", plugin: EaselPlugin },
  { name: "PixiPlugin", importPath: "gsap/PixiPlugin", tier: "plugin", role: "PixiJS property tweening", plugin: PixiPlugin },
  { name: "CustomEase", importPath: "gsap/CustomEase", tier: "bonus", role: "Arbitrary cubic-bezier ease curves", plugin: CustomEase },
  { name: "CustomBounce", importPath: "gsap/CustomBounce", tier: "bonus", role: "Configurable physics bounce eases", plugin: CustomBounce },
  { name: "CustomWiggle", importPath: "gsap/CustomWiggle", tier: "bonus", role: "Configurable wiggle eases", plugin: CustomWiggle },
  { name: "Physics2DPlugin", importPath: "gsap/Physics2DPlugin", tier: "bonus", role: "Velocity/gravity/friction tweens", plugin: Physics2DPlugin },
  { name: "PhysicsPropsPlugin", importPath: "gsap/PhysicsPropsPlugin", tier: "bonus", role: "Physics on any object property", plugin: PhysicsPropsPlugin },
  { name: "GSDevTools", importPath: "gsap/GSDevTools", tier: "bonus", role: "Timeline scrubber/debug UI", plugin: GSDevTools },
];

export const SUITE_VERSION = "3.15.0";
export const SUITE_COUNT = GSAP_SUITE.length;

let registered = false;

/**
 * Register EVERY plugin with the gsap core. Idempotent + SSR-safe:
 * on the server this is a no-op (gsap defers window access), on the
 * client the whole suite goes live in one call.
 */
export function registerGsapSuite(): boolean {
  if (registered || typeof window === "undefined") return registered;
  gsap.registerPlugin(...GSAP_SUITE.map((e) => e.plugin));
  registered = true;
  return true;
}

export { gsap };
