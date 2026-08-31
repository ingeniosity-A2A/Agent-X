'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Aperture, Lock, Pause, Play, Unlock } from 'lucide-react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================== */
/* CARD — Actuator Preset (Furniture Card 4)                           */
/* Tactical joint-torque viewport with the far-right scroll wheel of   */
/* preset tiles P1–P5. Selecting a tile tweens the torque readout      */
/* and the torque scale bar in real time.                              */
/* ================================================================== */

const PRESETS = [
  { id: 'P1', torque: 120 },
  { id: 'P2', torque: 220 },
  { id: 'P3', torque: 320 },
  { id: 'P4', torque: 420 },
  { id: 'P5', torque: 520 },
] as const;

const MAX_TORQUE = 520;

export function ActuatorPresetDemo() {
  const [active, setActive] = useState<(typeof PRESETS)[number]['id']>('P3');
  const torqueRef = useRef<HTMLSpanElement>(null);
  const gelRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const prev = useRef(320);

  const torque = PRESETS.find((p) => p.id === active)?.torque ?? 320;
  /* patch v6: gel meter percentage computed from the REAL torque state,
     never hardcoded — mirrors ActuatorFurnitureCard4's torquePct */
  const torquePct = Math.min(100, (torque / MAX_TORQUE) * 100);

  /* springy torque readout whenever the preset changes; the gel fill
     rides its own 0.5s CSS width transition driven by --gel-progress */
  useEffect(() => {
    const el = torqueRef.current;
    if (!el) return;
    const obj = { v: prev.current };
    prev.current = torque;
    const apply = (v: number) => {
      el.textContent = String(Math.round(v));
    };
    if (prefersReducedMotion()) {
      apply(torque);
      return;
    }
    const tween = gsap.to(obj, {
      v: torque,
      duration: 0.6,
      ease: 'power2.out',
      snap: { v: 1 },
      onUpdate: () => apply(obj.v),
    });
    return () => {
      tween.kill();
    };
  }, [torque]);

  /* gel meter target — CSS transition handles the motion */
  useEffect(() => {
    if (gelRef.current) {
      gelRef.current.style.setProperty('--gel-progress', `${torquePct}%`);
    }
  }, [torquePct]);

  const spinGear = () => {
    if (!gearRef.current || prefersReducedMotion()) return;
    gsap.to(gearRef.current, { rotate: '+=180', duration: 0.5, ease: 'power2.inOut' });
  };

  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-5">
      {/* Header row: status dot + label + settings trigger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-emerald-400"
            style={{ boxShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }}
            aria-hidden
          />
          <span className="text-sm font-semibold" style={{ color: 'var(--bk-text)' }}>
            Actuator Preset
          </span>
        </div>
        <button
          ref={gearRef}
          type="button"
          onClick={spinGear}
          aria-label="Actuator settings"
          className="bk-icon-btn h-8 w-8"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      {/* Main viewport container */}
      <div
        className="relative flex flex-1 items-stretch justify-between gap-3 rounded-2xl p-4"
        style={{
          background: 'var(--bk-panel-2)',
          border: '1px solid var(--bk-viewport-border)',
          boxShadow: 'var(--bk-inset-soft)',
        }}
      >
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--bk-text)' }}>
            <span ref={torqueRef}>320</span> Nm
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: 'var(--bk-text-3)' }}>
            Joint Torque
          </span>
          {/* glass-gel torque meter (patch v6) — fixed 8px track, contained,
              never affects the card's outer size */}
          <div
            className="gel-progress-track mt-3"
            style={{ maxWidth: 112, ['--gel-progress-color' as string]: 'var(--bk-accent-3)', ['--gel-progress-color-2' as string]: 'var(--bk-accent)' } as React.CSSProperties}
            aria-hidden
          >
            <div ref={gelRef} className="gel-progress-fill" style={{ ['--gel-progress' as string]: '61.5%' } as React.CSSProperties} />
          </div>
        </div>

        {/* Far-right viewport scroll wheel — P1–P5 preset tiles
            (patch v6: curved scrollbar visible via .bento-wheel) */}
        <div
          className="bento-wheel flex w-12 shrink-0 flex-col items-center gap-2 overflow-y-scroll border-l py-1 pl-2"
          style={{ borderColor: 'var(--bk-border)', justifyContent: 'safe center' }}
          role="listbox"
          aria-label="Actuator presets"
        >
          {PRESETS.map((p) => {
            const isActive = p.id === active;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => setActive(p.id)}
                title={`${p.id} — ${p.torque} Nm`}
                className="h-8 w-8 shrink-0 rounded-lg text-[10px] font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--bk-accent) 22%, transparent)'
                    : 'color-mix(in srgb, var(--bk-text) 6%, transparent)',
                  border: `1px solid ${
                    isActive
                      ? 'color-mix(in srgb, var(--bk-accent) 55%, transparent)'
                      : 'var(--bk-border-soft)'
                  }`,
                  color: isActive ? 'var(--bk-accent)' : 'var(--bk-text-2)',
                }}
              >
                {p.id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CARD — DEV Capabilities (exploded lock + inline GSAP drawer)        */
/* Inverted-corner capability card. The lock trigger slides out a      */
/* glass-black kernel diagnostics drawer inline — no redirects,        */
/* no page reloads.                                                    */
/* ================================================================== */

const DIAG_LINES = ['SYS_BUS: OPTIMAL', 'ACTUATOR_TEMP: 38.2°C', 'LATENCY: 0.42ms'];

export function DevCapabilitiesDemo() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (prefersReducedMotion()) {
      gsap.set(panel, {
        xPercent: isUnlocked ? -100 : 0,
        x: isUnlocked ? -20 : 0,
        opacity: isUnlocked ? 1 : 0,
      });
      return;
    }
    if (isUnlocked) {
      gsap.to(panel, { xPercent: -100, x: -20, opacity: 1, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo(
        panel.querySelectorAll('.diag-line'),
        { opacity: 0, x: 14 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', stagger: 0.07, delay: 0.18 },
      );
    } else {
      gsap.to(panel, { xPercent: 0, x: 0, opacity: 0, duration: 0.4, ease: 'power3.in' });
    }
  }, [isUnlocked]);

  return (
    <div className="absolute inset-0">
      {/* Inverted-corner capability card (patch v5 DevFeatureCard structure:
          the exploded-lock trigger lives INSIDE the clipped card, tucked
          under the 32px corner notch) */}
      <div
        className="bento-card-inverted-corner absolute inset-x-5 top-5 bottom-5 flex flex-col justify-between rounded-2xl p-4"
        style={{
          background: 'var(--bk-card)',
          border: '1px solid var(--bk-border)',
          filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.22))',
        }}
      >
        {/* Inverted Corner Exploded Lock File Trigger */}
        <button
          type="button"
          className="exploded-lock-trigger"
          onClick={() => setIsUnlocked((v) => !v)}
          aria-pressed={isUnlocked}
          aria-label={isUnlocked ? 'Lock DEV panel' : 'Unlock DEV capabilities'}
          title={isUnlocked ? 'Lock Content' : 'Unlock Additional Content'}
          data-testid="dev-lock-trigger"
        >
          {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
        </button>

        <div className="pr-8">
          <h4 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--bk-text)' }}>
            DEV Capabilities
          </h4>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--bk-text-3)' }}>
            Slide card to expand feature set
          </p>
        </div>

        {/* status strip */}
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: isUnlocked ? '#34d399' : 'var(--bk-line)' }}
            aria-hidden
          />
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--bk-text-3)' }}
          >
            {isUnlocked ? 'drawer engaged' : 'system nominal'}
          </span>
        </div>
      </div>

      {/* GSAP slide-out glass drawer */}
      <div
        ref={panelRef}
        className="ui8-glass-overlay absolute inset-y-5 left-full z-10 flex w-[calc(100%-2.5rem)] flex-col justify-between rounded-2xl p-4 opacity-0"
        aria-hidden={!isUnlocked}
      >
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Kernel Diagnostics</h4>
          <div className="space-y-1 rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-emerald-400">
            {DIAG_LINES.map((line) => (
              <div key={line} className="diag-line">
                {line}
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsUnlocked(false)}
          className="gradient-mask-btn self-start rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/20"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CARD — Furniture Design (Furniture Card 4, patch v5)                */
/* Maintains exact card dimensions while embedding the scroll wheel    */
/* inside the right viewport. Wrapped in the new Glass Tinted Finish   */
/* Variant surface — toggleable live from the card footer.             */
/* ================================================================== */

const FURNITURE_WHEEL = ['Quote 1', 'Quote 2', 'Item A', 'Item B', 'Item C'] as const;

const FURNITURE_RENDERS: { piece: string; meta: string; paths: React.ReactNode }[] = [
  {
    piece: 'Lounge Chair',
    meta: 'glTF · 12.4k tris',
    paths: (
      <>
        <path d="M22 44 V30 Q22 20 32 20 H88 Q98 20 98 30 V44" />
        <rect x="14" y="44" width="18" height="30" rx="8" />
        <rect x="88" y="44" width="18" height="30" rx="8" />
        <rect x="30" y="52" width="60" height="22" rx="8" />
        <line x1="26" y1="74" x2="22" y2="88" strokeLinecap="round" />
        <line x1="94" y1="74" x2="98" y2="88" strokeLinecap="round" />
        <line x1="14" y1="96" x2="106" y2="96" strokeWidth="1" strokeDasharray="3 4" />
      </>
    ),
  },
  {
    piece: 'Studio Sofa',
    meta: 'glTF · 18.1k tris',
    paths: (
      <>
        <path d="M18 42 V30 Q18 22 26 22 H94 Q102 22 102 30 V42" />
        <rect x="10" y="42" width="100" height="24" rx="8" />
        <rect x="10" y="42" width="16" height="24" rx="7" />
        <rect x="94" y="42" width="16" height="24" rx="7" />
        <line x1="60" y1="26" x2="60" y2="42" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="24" y1="66" x2="20" y2="80" strokeLinecap="round" />
        <line x1="96" y1="66" x2="100" y2="80" strokeLinecap="round" />
        <line x1="12" y1="94" x2="108" y2="94" strokeWidth="1" strokeDasharray="3 4" />
      </>
    ),
  },
  {
    piece: 'Side Table',
    meta: 'glTF · 6.2k tris',
    paths: (
      <>
        <ellipse cx="60" cy="32" rx="42" ry="9" />
        <line x1="30" y1="38" x2="26" y2="78" strokeLinecap="round" />
        <line x1="90" y1="38" x2="94" y2="78" strokeLinecap="round" />
        <line x1="60" y1="41" x2="60" y2="78" strokeLinecap="round" />
        <line x1="22" y1="90" x2="98" y2="90" strokeWidth="1" strokeDasharray="3 4" />
      </>
    ),
  },
  {
    piece: 'Floor Lamp',
    meta: 'glTF · 4.8k tris',
    paths: (
      <>
        <path d="M46 12 H74 L66 38 H54 Z" />
        <line x1="60" y1="38" x2="60" y2="78" strokeLinecap="round" />
        <path d="M44 82 Q60 72 76 82" />
        <line x1="42" y1="86" x2="78" y2="86" strokeLinecap="round" />
      </>
    ),
  },
  {
    piece: 'Shelf Unit',
    meta: 'glTF · 9.6k tris',
    paths: (
      <>
        <rect x="26" y="12" width="68" height="74" rx="4" />
        <line x1="26" y1="37" x2="94" y2="37" />
        <line x1="26" y1="62" x2="94" y2="62" />
        <rect x="34" y="19" width="14" height="11" rx="2" />
        <rect x="52" y="44" width="18" height="11" rx="2" />
        <rect x="66" y="69" width="16" height="10" rx="2" />
      </>
    ),
  },
];

export function FurnitureCard4Demo() {
  const [selected, setSelected] = useState(0);
  const [glass, setGlass] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  /* Glass Tinted Finish Variant — flip the surface token on the host card.
     Tailwind's backdrop utilities are toggled alongside the spec class so
     the blur compiles to BOTH prefixed and unprefixed backdrop-filter. */
  useEffect(() => {
    const card = rootRef.current?.closest('.bento-card');
    if (!card) return;
    card.classList.toggle('bento-card-glass-tinted', glass);
    card.classList.toggle('backdrop-blur-[16px]', glass);
    card.classList.toggle('backdrop-saturate-[1.8]', glass);
    if (!prefersReducedMotion()) {
      gsap.fromTo(card, { scale: 0.985 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' });
    }
  }, [glass]);

  /* render-engine crossfade whenever the wheel selection changes */
  useEffect(() => {
    const el = renderRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: 12, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' },
    );
  }, [selected]);

  const render = FURNITURE_RENDERS[selected];

  return (
    <div ref={rootRef} className="absolute inset-0 flex flex-col justify-between px-5 py-4">
      {/* Header row — status dot + label + AI Chat Box Lens Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-emerald-400"
            style={{ boxShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }}
            aria-hidden
          />
          <span className="text-sm font-semibold" style={{ color: 'var(--bk-text)' }}>
            Furniture Design
          </span>
        </div>
        <button type="button" className="bk-icon-btn h-8 w-8" title="AI lens — upload a photo" aria-label="AI lens upload">
          <Aperture size={15} strokeWidth={1.7} />
        </button>
      </div>

      {/* Main Viewport Container (spec: h-48 · rounded-xl · bg-black/20) */}
      <div
        className="furniture-viewport relative flex h-48 w-full items-stretch justify-between gap-2 overflow-hidden rounded-xl p-4"
        style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        data-testid="furniture-viewport"
      >
        {/* Render Engine Viewport */}
        <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1.5">
          <div
            ref={renderRef}
            className="flex h-[100px] items-center justify-center"
            style={{ color: 'var(--bk-line)' }}
            aria-hidden
          >
            <svg viewBox="0 0 120 100" className="h-full" fill="none" stroke="currentColor" strokeWidth="2">
              {render.paths}
            </svg>
          </div>
          <span
            className="truncate font-mono text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--bk-text-3)' }}
          >
            {render.piece} · {render.meta}
          </span>
        </div>

        {/* Embedded scroll wheel — far right viewport position (spec array)
            (patch v6: curved scrollbar visible via .bento-wheel) */}
        <div
          className="bento-wheel flex h-full w-12 shrink-0 flex-col items-center justify-center gap-2 overflow-y-scroll border-l pl-2"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          role="listbox"
          aria-label="Furniture render wheel"
          data-testid="furniture-wheel"
        >
          {FURNITURE_WHEEL.map((item, idx) => {
            const isActive = idx === selected;
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={isActive}
                title={item}
                onClick={() => setSelected(idx)}
                className="h-8 w-8 shrink-0 cursor-pointer rounded-lg text-[10px] font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--bk-accent) 24%, transparent)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${
                    isActive
                      ? 'color-mix(in srgb, var(--bk-accent) 55%, transparent)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  color: isActive ? 'var(--bk-accent)' : 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Glass Tinted Finish Variant toggle */}
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: 'var(--bk-text-3)' }}
        >
          Glass Tinted Finish
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={glass}
          onClick={() => setGlass((v) => !v)}
          data-testid="glass-toggle"
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors"
          style={{
            background: glass
              ? 'color-mix(in srgb, var(--bk-accent) 20%, transparent)'
              : 'var(--bk-chip)',
            border: `1px solid ${
              glass ? 'color-mix(in srgb, var(--bk-accent) 50%, transparent)' : 'var(--bk-border-soft)'
            }`,
            color: glass ? 'var(--bk-accent)' : 'var(--bk-text-2)',
          }}
        >
          {glass ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CARD — AVA-007 Voice Console (Universal Feature Stack, patch v5)    */
/* Every module inherits: slide visual, audio visualizer, streaming /  */
/* pre-recorded voice playback, optional UI prompt + Audio Library.    */
/* ================================================================== */

function WaveformBars({
  bars = 32,
  playing,
  library,
  pulse,
}: {
  bars?: number;
  playing: boolean;
  library: boolean;
  pulse: number;
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    tlRef.current?.kill();
    const els = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    if (!playing) {
      gsap.to(els, { scaleY: 0.22, duration: 0.5, ease: 'power2.out' });
      return;
    }
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    els.forEach((bar, i) => {
      const amp = library
        ? 0.3 + Math.abs(Math.sin(i * 0.9)) * 0.45
        : 0.2 + Math.abs(Math.sin(i * 0.55)) * 0.8;
      tl.to(bar, { scaleY: amp, duration: 0.26 + (i % 5) * 0.06, ease: 'sine.inOut' }, (i % 9) * 0.03);
    });
    tlRef.current = tl;
    return () => {
      tl.kill();
    };
  }, [playing, library]);

  /* UI prompt burst — bars spike from center, then settle */
  useEffect(() => {
    if (!pulse) return;
    const els = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length || prefersReducedMotion()) return;
    gsap.to(els, {
      scaleY: 1,
      duration: 0.18,
      ease: 'power2.out',
      stagger: { amount: 0.12, from: 'center' },
      overwrite: true,
    });
    gsap.to(els, { scaleY: 0.22, duration: 0.7, ease: 'power2.out', delay: 0.32 });
  }, [pulse]);

  return (
    <div className="flex min-h-20 flex-1 items-center justify-center gap-[3px] py-1" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className="w-[3px] origin-center rounded-full"
          style={{
            height: '100%',
            transform: 'scaleY(0.22)',
            background:
              i % 6 === 2
                ? 'var(--bk-accent-2)'
                : 'linear-gradient(to top, color-mix(in srgb, var(--bk-accent) 60%, transparent), var(--bk-accent))',
          }}
        />
      ))}
    </div>
  );
}

export function UniversalConsoleDemo() {
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState<'stream' | 'prerecorded'>('stream');
  const [prompt, setPrompt] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  const submitPrompt = () => {
    const value = prompt.trim();
    if (!value) return;
    setSent(value);
    setPrompt('');
    setPulse((p) => p + 1);
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between gap-2.5 p-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: 'var(--bk-accent-3)' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: 'var(--bk-accent-3)' }}
            />
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--bk-text)' }}>
            AVA-007 Console
          </span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-3)', border: '1px solid var(--bk-border-soft)' }}
        >
          UFS v5
        </span>
      </div>

      {/* Audio Visualizer (Standard Feature) */}
      <WaveformBars bars={32} playing={playing} library={source === 'prerecorded'} pulse={pulse} />

      {/* UI prompt echo */}
      <div
        className="min-h-4 truncate font-mono text-[10px] tracking-wide"
        style={{ color: 'var(--bk-text-3)' }}
        aria-live="polite"
        data-testid="ufs-echo"
      >
        {sent ? `» ${sent}` : '» awaiting prompt…'}
      </div>

      {/* Audio Controls & Library Selector */}
      <div className="ufs-row flex items-center justify-between gap-2 p-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
          aria-label={playing ? 'Pause voice' : 'Play voice'}
          className="ufs-play-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          data-testid="ufs-play"
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {source === 'stream' ? 'Stream Voice' : 'Play Recorded'}
        </button>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as 'stream' | 'prerecorded')}
          className="ufs-select px-2 py-1 text-xs outline-none"
          aria-label="Audio source"
          data-testid="ufs-source"
        >
          <option value="stream">Live Stream</option>
          <option value="prerecorded">Audio Library Item</option>
        </select>
      </div>

      {/* Optional UI Prompt Capability */}
      <div className="ufs-row flex items-center gap-2 p-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitPrompt();
          }}
          placeholder="Type UI Prompt..."
          className="ufs-input w-full bg-transparent text-xs focus:outline-none"
          aria-label="UI prompt"
          data-testid="ufs-prompt"
        />
      </div>
    </div>
  );
}
