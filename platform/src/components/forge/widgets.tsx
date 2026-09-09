"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap/suite";

/** Tone type per the Standard's three-color rule. */
export type TreeTone = "neutral" | "orange" | "yellow";

/** DEV-LOCKED glyph — visible, inert, reduced opacity (Standard §7). */
export function LockGlyph({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/**
 * Odometer — the Standard's NUMERIC DATA animation: digits roll, they don't
 * fade in. gsap number tween with snap; honors prefers-reduced-motion.
 */
export function Odometer({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = format ?? ((n: number) => n.toLocaleString("en-US"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = fmt(value);
      shown.current = value;
      return;
    }
    const obj = { v: shown.current };
    const tween = gsap.to(obj, {
      v: value,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = fmt(Math.round(obj.v));
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = fmt(value);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, format]);

  return <span ref={ref}>{value.toLocaleString("en-US")}</span>;
}

/**
 * SplitTextStage — the Standard's F1 CHUNK animation: GSAP SplitText splits
 * the text into chars/words and the characters PHYSICALLY SEPARATE
 * (staggered x/y drift), driven by the registered full gsap suite.
 * Reduced-motion renders the text statically.
 */
export function SplitTextStage({ text, runId }: { text: string; runId: number }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !text) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage.textContent = text.slice(0, 1200);
    if (reduce) return;

    let split: { revert: () => void } | null = null;
    let tweens: gsap.core.Tween[] = [];
    try {
      void runId;
      // SplitText ships inside the registered full suite (gsap/SplitText)
      import("gsap/SplitText").then(({ SplitText }) => {
        if (!stageRef.current) return;
        gsap.registerPlugin(SplitText);
        split = new SplitText(stageRef.current, { type: "chars,words" }) as unknown as { revert: () => void };
        const chars = (split as unknown as { chars: HTMLElement[] }).chars ?? [];
        const words = (split as unknown as { words: HTMLElement[] }).words ?? [];
        gsap.set(words, { display: "inline-block", willChange: "transform" });
        gsap.set(chars, { display: "inline-block", willChange: "transform" });
        // chars physically separate: words drift horizontally, chars jitter
        tweens = [
          gsap.fromTo(
            words,
            { x: 0, y: 0 },
            {
              x: (i: number) => ((i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 4)) as number,
              y: (i: number) => (-4 - (i % 3) * 5) as number,
              duration: 0.85,
              ease: "power3.out",
              stagger: 0.02,
            },
          ),
          gsap.fromTo(
            chars,
            { rotate: 0 },
            { rotate: (i: number) => ((i % 2 === 0 ? 1 : -1) * (2 + ((i * 7) % 9))) as number, duration: 0.8, ease: "power2.out", stagger: 0.004 },
          ),
        ];
      });
    } catch {
      // SplitText unavailable — static text remains (honest degradation)
    }
    return () => {
      tweens.forEach((t) => t.kill());
      try {
        split?.revert();
      } catch {
        /* element may already be gone */
      }
    };
  }, [text, runId]);

  return (
    <div
      ref={stageRef}
      className="forge-ascii"
      style={{ minHeight: 44, maxHeight: 150, overflow: "auto", fontSize: 11, lineHeight: 1.55 }}
    />
  );
}

/** Small verdict pill reused across the canvas + inspector. */
export function VerdictPill({ verdict }: { verdict: string }) {
  const pass = verdict === "pass";
  return <span className={`forge-pill ${pass ? "forge-pill--pass" : "forge-pill--fail"}`}>{pass ? "EXOSKELETON APPLIED" : `EXOSKELETON ${verdict.toUpperCase()}`}</span>;
}
