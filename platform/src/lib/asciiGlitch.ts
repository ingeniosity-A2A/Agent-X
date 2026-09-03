/**
 * ASCII Glitch Ripple — `createASCIIShift` from the architecture doc's
 * rendering pipeline. Resolves a character element's glyph through random
 * ASCII substitutions for `dur` ms, with `spread` controlling the per-call
 * ripple jitter (delay = spread × dur, randomized per char so a staggered
 * ripple emerges when callers fire it across a row of chars).
 *
 * React-safe contract: the function operates ONLY on an element whose content
 * is a single text node (exactly what SplitText's char spans contain). Any
 * other shape is skipped untouched. Honors prefers-reduced-motion.
 * Returns a cancel() that restores the original text immediately.
 */

const DEFAULT_GLYPHS = "!<>-_\\/[]{}—=+*^?#01";

export interface ASCIIShiftOptions {
  /** Total shift duration in ms (default 300). */
  dur?: number;
  /** Ripple spread as a fraction of dur (default 0.2). */
  spread?: number;
  /** Glyph pool for substitutions. */
  glyphs?: string;
}

export function createASCIIShift(el: HTMLElement | null, opts: ASCIIShiftOptions = {}): () => void {
  if (typeof window === "undefined" || !el) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  // Only shift a plain text leaf — never descend into structured children.
  const first = el.firstChild;
  if (!first || el.childNodes.length !== 1 || first.nodeType !== Node.TEXT_NODE) return () => {};
  const textNode = first as Text;
  const original = textNode.data;
  if (!original) return () => {};

  const dur = Math.max(16, opts.dur ?? 300);
  const spread = Math.max(0, opts.spread ?? 0.2);
  const glyphs = opts.glyphs ?? DEFAULT_GLYPHS;

  let raf = 0;
  let timer = 0;
  let done = false;
  let t0 = 0;

  function scramble(progress: number): string {
    let out = "";
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      if (ch === " " || ch === "\n" || ch === "\t") {
        out += ch;
      } else if (Math.random() < progress) {
        out += ch; // resolved back to the real character
      } else {
        out += glyphs[(Math.random() * glyphs.length) | 0];
      }
    }
    return out;
  }

  function restore() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(timer);
    // The node may have been detached by a SplitText revert in the meantime;
    // writing data on a detached node is harmless, skipping guards nothing.
    textNode.data = original;
  }

  function frame(now: number) {
    if (done) return;
    const p = (now - t0) / dur;
    if (p >= 1) {
      restore();
      return;
    }
    textNode.data = scramble(p);
    raf = requestAnimationFrame(frame);
  }

  timer = window.setTimeout(() => {
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }, Math.round(spread * dur * Math.random()));

  return restore;
}
