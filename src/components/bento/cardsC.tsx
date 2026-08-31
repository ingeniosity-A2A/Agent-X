'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================== */
/* Shared UI8 primitives                                               */
/* ================================================================== */

/** Exact UI8 rounded pill button */
export function UI8Button({
  label,
  onClick,
  tone = 'glass',
}: {
  label: string;
  onClick?: () => void;
  tone?: 'glass' | 'neutral' | 'blue';
}) {
  const styles: Record<string, React.CSSProperties> = {
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    neutral: { background: '#e5e5e0', color: '#3f3f46', border: '1px solid rgba(0,0,0,0.05)' },
    blue: { background: '#2563eb', color: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)' },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-6 py-2.5 text-xs font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
      style={styles[tone]}
    >
      {label}
    </button>
  );
}

/** Floating collaborative cursor pill — "Artur" */
export function CursorBadge({ name = 'Artur', className = '' }: { name?: string; className?: string }) {
  return (
    <div className={`ui8-cursor-badge ${className}`} aria-hidden>
      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
        <path d="M3 3l7 18 3-7 7-3L3 3z" />
      </svg>
      <span className="text-[11px] font-medium">{name}</span>
    </div>
  );
}

const SHARE_WAVE = [40, 70, 30, 90, 100, 60, 40, 85, 50, 30, 75, 45];

/** Micro-waveform strip rendered inside the dark glass module */
function MicroWave({ heights = SHARE_WAVE }: { heights?: number[] }) {
  return (
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>
      {heights.map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-white/80" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/* ================================================================== */
/* CARD — One-Click File Sharing                                       */
/* Dark viewport + 3×3 grid lines + floating glass folder overlay      */
/* with micro-waveform + "Artur" cursor badge. Click = copy link.      */
/* ================================================================== */

const SHARE_URL = 'https://bento.app/f/8x42KQ';

export function FileSharingDemo() {
  const [copied, setCopied] = useState(false);
  const folderRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const share = () => {
    try {
      if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(SHARE_URL);
    } catch {
      /* clipboard unavailable in some contexts — visual feedback still fires */
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
    if (folderRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        folderRef.current,
        { scale: 1, rotate: -1 },
        { scale: 1.045, rotate: 0.5, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 },
      );
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-5">
      <div className="ui8-gridlines" aria-hidden />

      {/* Floating Glass Folder Overlay */}
      <div ref={folderRef} className="ui8-glass-overlay relative z-10 flex w-52 -rotate-1 flex-col gap-2 rounded-2xl p-3">
        {/* Main visualizer area */}
        <div className="flex h-20 w-full items-center justify-center rounded-xl border border-white/10 bg-black/40 px-3">
          <MicroWave />
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-[9px] font-semibold tracking-wider text-white/60"
            aria-hidden
          >
            AUDIO
          </div>
          <button
            type="button"
            onClick={share}
            aria-label={copied ? 'Link copied' : 'Copy share link'}
            className="gradient-mask-btn grid h-10 w-10 place-items-center rounded-lg border border-white/20 bg-white/10 text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
          >
            {copied ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>

        {/* Copied toast pill */}
        {copied && (
          <span
            className="absolute -top-3 right-2 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-900 shadow-lg"
            role="status"
          >
            Link copied
          </span>
        )}

        {/* Floating cursor badge */}
        <CursorBadge className="absolute -bottom-3 -right-6" />
      </div>
    </div>
  );
}

/* ================================================================== */
/* CARD — AI File Converter                                            */
/* DOC → MP4 file stack + dynamic audio visualizer.                    */
/* Click convert: icon spins, bars redraw, progress pill fills.        */
/* ================================================================== */

const VIS_BARS = [20, 30, 40, 60, 80, 50, 90, 100, 70, 40, 60, 80, 50, 30, 20];

export function AIConverterDemo() {
  const [state, setState] = useState<'idle' | 'converting' | 'done'>('idle');
  const barsRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const convert = () => {
    if (state === 'converting') return;
    setState('converting');
    const finish = () => setState('done');
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const bars = barsRef.current?.children;
    const tl = gsap.timeline({ onComplete: finish });
    if (iconRef.current) {
      tl.fromTo(iconRef.current, { rotate: 0 }, { rotate: 360, duration: 0.8, ease: 'power2.inOut' }, 0);
    }
    if (bars && bars.length) {
      tl.fromTo(
        bars,
        { scaleY: 0.12 },
        {
          scaleY: 1,
          duration: 0.75,
          ease: 'sine.inOut',
          transformOrigin: 'center',
          stagger: { amount: 0.45, from: 'center' },
        },
        0.1,
      );
    }
    if (progRef.current) {
      tl.fromTo(progRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, 0.15);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-5">
      {/* Top file stack container */}
      <div className="flex h-[38%] items-center justify-center gap-4 rounded-2xl border border-black/[0.04] bg-black/[0.16] shadow-sm dark:bg-black/20" style={{ border: '1px solid var(--bk-viewport-border)' }}>
        <div
          className="rounded-xl px-4 py-2.5 text-xs font-bold shadow-inner"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text)', border: '1px solid var(--bk-border-soft)' }}
        >
          DOC
        </div>
        <div
          ref={iconRef}
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border)', color: 'var(--bk-text-2)' }}
          aria-hidden
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div
          className="rounded-xl px-4 py-2.5 text-xs font-bold shadow-inner"
          style={{
            background: state === 'done' ? 'color-mix(in srgb, var(--bk-accent) 18%, transparent)' : 'var(--bk-chip)',
            color: 'var(--bk-text)',
            border: `1px solid ${state === 'done' ? 'color-mix(in srgb, var(--bk-accent) 45%, transparent)' : 'var(--bk-border-soft)'}`,
          }}
        >
          MP4
        </div>
      </div>

      {/* Audio visualizer viewport */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center rounded-2xl p-4"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-viewport-border)' }}
      >
        <div ref={barsRef} className="flex h-12 w-full items-center justify-center gap-[2px] opacity-80" aria-hidden>
          {VIS_BARS.map((h, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full"
              style={{ height: `${h}%`, background: 'var(--bk-accent)', opacity: 0.85 }}
            />
          ))}
        </div>
        <div
          ref={progRef}
          className="mt-4 h-1.5 w-12 origin-left rounded-full"
          style={{
            background: state === 'done' ? 'var(--bk-accent)' : 'var(--bk-line)',
            transform: state === 'done' ? 'scaleX(1)' : undefined,
            width: state === 'done' ? '5.5rem' : undefined,
            transition: 'background 0.4s ease, width 0.4s ease',
          }}
          aria-hidden
        />
        <button
          type="button"
          onClick={convert}
          className="absolute bottom-3 right-3 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)', border: '1px solid var(--bk-border-soft)' }}
        >
          {state === 'converting' ? 'Working…' : state === 'done' ? 'Convert again' : 'Convert'}
        </button>
        {state === 'done' && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: 'color-mix(in srgb, var(--bk-accent) 16%, transparent)', color: 'var(--bk-accent)' }}
            role="status"
          >
            ✓ Ready
          </span>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* CARD — Smart Asset Vault                                            */
/* The beige raised layer: light cream card + inset canvas, floating   */
/* white disc gauge, Top up / Send pills. Deliberate contrast card —   */
/* stays beige across every theme (multi-layer depth anchor).          */
/* ================================================================== */

export function SmartAssetVaultDemo() {
  const [balance, setBalance] = useState(1024);
  const prev = useRef(1024);
  const numRef = useRef<HTMLSpanElement>(null);
  const discRef = useRef<HTMLDivElement>(null);

  /* entrance pop for the disc */
  useLayoutEffect(() => {
    if (!discRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(discRef.current, {
        scale: 0.75,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.6)',
        scrollTrigger: { trigger: discRef.current, start: 'top 92%', once: true },
      });
    });
    return () => ctx.revert();
  }, []);

  /* springy number tween whenever balance changes */
  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    const obj = { v: prev.current };
    prev.current = balance;
    if (prefersReducedMotion()) {
      el.textContent = String(balance);
      return;
    }
    const tween = gsap.to(obj, {
      v: balance,
      duration: 0.7,
      ease: 'power2.out',
      snap: { v: 1 },
      onUpdate: () => {
        el.textContent = String(Math.round(obj.v));
      },
    });
    return () => {
      tween.kill();
    };
  }, [balance]);

  const bump = (delta: number) => () => setBalance((b) => Math.max(0, b + delta));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-5">
      {/* Embedded light canvas viewport (beige inset) */}
      <div
        className="flex h-full w-full flex-col items-center justify-center rounded-2xl"
        style={{ background: '#e5e5e0', boxShadow: 'inset 2px 2px 8px rgba(0,0,0,0.09), inset -2px -2px 8px rgba(255,255,255,0.9)' }}
      >
        {/* Floating ring gauge disc */}
        <div
          ref={discRef}
          className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white shadow-md"
          style={{ border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 24px rgba(0,0,0,0.1), inset 0 -2px 6px rgba(0,0,0,0.04)' }}
        >
          {/* gradient progress ring */}
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" fill="none" aria-hidden>
            <circle cx="50" cy="50" r="46" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - Math.min(balance, 2048) / 2048)}`}
              style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>
          <div className="text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">Balance</span>
            <span className="text-2xl font-black tabular-nums text-neutral-800">
              <span ref={numRef}>1024</span>
            </span>
            <span className="block text-[10px] font-semibold text-emerald-600">● ETH</span>
          </div>
        </div>

        {/* Bottom pill action row */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={bump(64)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-700 transition-all hover:bg-neutral-300 active:scale-95"
            style={{ background: '#e0e0da' }}
          >
            Top up
          </button>
          <button
            type="button"
            onClick={bump(-64)}
            className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
