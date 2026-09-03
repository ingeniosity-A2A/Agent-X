/**
 * Ambient types for gsap/SplitText.
 *
 * Verified on gsap 3.15: the package ships SplitText.js at its root and
 * types/split-text.d.ts, but has NO "./SplitText" export-map key and no
 * sibling SplitText.d.ts, so the specifier "gsap/SplitText" resolves to an
 * untyped JS file. This ambient module supplies the surface the render
 * pipeline uses. If a future gsap release wires proper types for that
 * specifier, delete this file to avoid shadowing them.
 */

declare module "gsap/SplitText" {
  export interface SplitTextVars {
    type?: string;
    linesClass?: string;
    wordsClass?: string;
    charsClass?: string;
    /** "lines" | "words" | "chars" — adds overflow:hidden wrappers. */
    mask?: boolean | string;
    [key: string]: unknown;
  }

  export class SplitText {
    constructor(target: Element | Element[] | string | NodeList | null, vars?: SplitTextVars);
    lines: HTMLElement[];
    words: HTMLElement[];
    chars: HTMLElement[];
    revert(): void;
    split(vars?: SplitTextVars): this;
  }
}
