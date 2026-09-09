import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { createASCIIShift } from "./asciiGlitch";

/**
 * Zero-lag diff presentation — the GSAP SplitText pipeline from the
 * architecture doc: split the container into lines/words/chars, slide lines
 * up under per-line masks, and fire the ASCII glitch ripple across the char
 * nodes. Hardware-accelerated transforms/opacity only; SplitText's per-line
 * `mask` (overflow:hidden) is what makes the yPercent reveal clean.
 *
 * NOTE on two deliberate adaptations from the doc's sketch:
 * 1. `mask: true` in the sketch maps to SplitText's real API value
 *    `mask: "lines"` (per-line overflow:hidden) — same effect, real option.
 * 2. The ASCII shift fires WHILE the slide-in plays (with its own ripple
 *    jitter), not after `split.revert()` — revert unwraps the char spans, so
 *    per-char triggers must run while the spans exist. All shifts are
 *    cancelled before revert.
 */

gsap.registerPlugin(SplitText);

export interface CodeDiffAnimationOptions {
  /** Per-line slide duration in seconds (default 0.4). */
  duration?: number;
  /** Stagger between lines in seconds (default 0.03). */
  stagger?: number;
  /** Fire the ASCII glitch ripple on chars (default true). */
  glitch?: boolean;
  /** Max chars to shift — caps rAF loops for large diffs (default 400). */
  maxGlitchChars?: number;
}

export function animateCodeDiff(codeContainerEl: HTMLElement, opts: CodeDiffAnimationOptions = {}): void {
  if (typeof window === "undefined" || !codeContainerEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!codeContainerEl.textContent || !codeContainerEl.textContent.trim()) return;

  const duration = opts.duration ?? 0.4;
  const stagger = opts.stagger ?? 0.03;
  const maxGlitchChars = opts.maxGlitchChars ?? 400;

  const split = new SplitText(codeContainerEl, {
    type: "lines,words,chars",
    linesClass: "diff-line-parent",
    wordsClass: "diff-word",
    charsClass: "diff-char",
    mask: "lines",
  });

  const cancelers: Array<() => void> = [];
  if (opts.glitch !== false && split.chars.length) {
    // Sample when the diff is large: one rAF loop per shifted char — a hard
    // cap keeps the main thread free for the transform tween.
    const chars =
      split.chars.length <= maxGlitchChars
        ? split.chars
        : split.chars.filter((_, i) => i % Math.ceil(split.chars.length / maxGlitchChars) === 0);
    chars.forEach((charEl) => {
      const cancel = createASCIIShift(charEl, { dur: 300, spread: 0.2 });
      if (cancel) cancelers.push(cancel);
    });
  }

  gsap.from(split.lines, {
    duration,
    yPercent: 100,
    opacity: 0,
    stagger,
    ease: "power3.out",
    onComplete: () => {
      cancelers.forEach((cancel) => cancel());
      // Clean up masks/splits to preserve layout responsiveness.
      split.revert();
    },
  });
}
