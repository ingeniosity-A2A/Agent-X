'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export type ThemeId =
  | 'ui8-dark'
  | 'ui8-light'
  | 'obsidian'
  | 'graphite'
  | 'neon'
  | 'gruvbox-dark'
  | 'gruvbox-light'
  | 'clay';

export type LayoutId = 'default' | 'square' | 'horizontal';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  swatch: [string, string, string];
  dark: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'ui8-dark', name: 'UI8 Charcoal', swatch: ['#18181b', '#3b82f6', '#8b5cf6'], dark: true },
  { id: 'ui8-light', name: 'UI8 Linen', swatch: ['#e5e5e0', '#2563eb', '#8b5cf6'], dark: false },
  { id: 'obsidian', name: 'Obsidian', swatch: ['#0a0a0f', '#3b82f6', '#8b5cf6'], dark: true },
  { id: 'graphite', name: 'Graphite', swatch: ['#28282c', '#e4e4e7', '#a1a1aa'], dark: true },
  { id: 'neon', name: 'Neon Orchid', swatch: ['#0c0916', '#a78bfa', '#f0abfc'], dark: true },
  { id: 'gruvbox-dark', name: 'Gruvbox Dark', swatch: ['#1d2021', '#fe8019', '#fabd2f'], dark: true },
  { id: 'gruvbox-light', name: 'Gruvbox Light', swatch: ['#ebdbb2', '#d65d0e', '#427b58'], dark: false },
  { id: 'clay', name: 'Warm Clay', swatch: ['#f7f2ea', '#ff7a6b', '#f97316'], dark: false },
];

export const LAYOUTS: { id: LayoutId; name: string }[] = [
  { id: 'default', name: 'Default' },
  { id: 'square', name: 'Square' },
  { id: 'horizontal', name: 'Horizontal' },
];

interface BentoCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  layout: LayoutId;
  setLayout: (l: LayoutId) => void;
  themeDef: ThemeDef;
}

const Ctx = createContext<BentoCtx | null>(null);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function BentoProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('ui8-dark');
  const [layout, setLayoutState] = useState<LayoutId>('default');
  const busy = useRef(false);

  useEffect(() => {
    const t = window.localStorage.getItem('bento-theme') as ThemeId | null;
    const l = window.localStorage.getItem('bento-layout') as LayoutId | null;
    if (t && THEMES.some((x) => x.id === t)) setThemeState(t);
    if (l && LAYOUTS.some((x) => x.id === l)) setLayoutState(l);
  }, []);

  useEffect(() => {
    const def = THEMES.find((t) => t.id === theme)!;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-scheme', def.dark ? 'dark' : 'light');
    root.style.colorScheme = def.dark ? 'dark' : 'light';
    window.localStorage.setItem('bento-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('bento-layout', layout);
  }, [layout]);

  const setTheme = useCallback(
    (t: ThemeId) => {
      if (t === theme || busy.current) return;
      busy.current = true;
      const grid = document.getElementById('bento-root');
      const apply = () => {
        setThemeState(t);
        window.localStorage.setItem('bento-theme', t);
      };
      if (prefersReducedMotion() || !grid) {
        apply();
        busy.current = false;
        return;
      }
      gsap
        .timeline({ onComplete: () => (busy.current = false) })
        .to(grid, { opacity: 0.25, scale: 0.985, duration: 0.22, ease: 'power2.in' })
        .add(apply)
        .to(grid, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' });
    },
    [theme],
  );

  const setLayout = useCallback(
    (l: LayoutId) => {
      if (l === layout || busy.current) return;
      const grid = document.getElementById('bento-root');
      if (!grid || prefersReducedMotion()) {
        setLayoutState(l);
        return;
      }
      busy.current = true;
      const cards = grid.querySelectorAll<HTMLElement>('.bento-card');
      const state = Flip.getState(cards, { props: 'borderRadius' });
      setLayoutState(l);
      requestAnimationFrame(() => {
        Flip.from(state, {
          duration: 0.75,
          ease: 'expo.inOut',
          stagger: 0.015,
          scale: false,
          onComplete: () => {
            busy.current = false;
            window.dispatchEvent(new Event('bento:layout-done'));
          },
        });
      });
    },
    [layout],
  );

  const themeDef = THEMES.find((t) => t.id === theme)!;

  return (
    <Ctx.Provider value={{ theme, setTheme, layout, setLayout, themeDef }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBento() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBento must be used inside BentoProvider');
  return ctx;
}

export function ControlDock() {
  const { theme, setTheme, layout, setLayout, themeDef } = useBento();

  const IconDefault = (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="1" y="2" width="14" height="5.4" rx="1.6" />
      <rect x="1" y="8.6" width="14" height="5.4" rx="1.6" />
    </svg>
  );
  const IconSquare = (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="2.4" />
    </svg>
  );
  const IconHorizontal = (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="2.2" />
      <line x1="7.5" y1="3.6" x2="7.5" y2="12.4" />
    </svg>
  );

  return (
    <div
      aria-label="Theme and layout controls"
      className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:top-6 md:left-6 md:translate-x-0 flex md:flex-col items-center gap-2 rounded-3xl md:rounded-[22px] border p-2.5 backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--bk-card) 72%, transparent)',
        borderColor: 'var(--bk-border)',
        boxShadow: 'var(--bk-shadow)',
      }}
    >
      <div className="flex md:flex-col items-center gap-2 px-1" role="group" aria-label="Color theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            title={t.name}
            aria-label={`Theme ${t.name}`}
            aria-pressed={theme === t.id}
            onClick={() => setTheme(t.id)}
            className={`h-7 w-7 rounded-full border transition-transform duration-200 hover:scale-110 active:scale-95 ${
              theme === t.id ? 'theme-dot-active' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${t.swatch[1]} 0%, ${t.swatch[1]} 45%, ${t.swatch[2]} 46%, ${t.swatch[2]} 100%)`,
              borderColor: 'var(--bk-border)',
            }}
          >
            <span
              className="mx-auto block h-2 w-2 rounded-full"
              style={{ background: t.swatch[0], marginTop: '9px' }}
            />
          </button>
        ))}
      </div>
      <div className="hidden md:block h-px w-8" style={{ background: 'var(--bk-border)' }} aria-hidden />
      <div className="flex md:flex-col items-center gap-1.5 px-1" role="group" aria-label="Card layout">
        {LAYOUTS.map((l) => {
          const active = layout === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              title={l.name}
              aria-label={`${l.name} layout`}
              aria-pressed={active}
              className="bk-icon-btn h-8 w-8"
              style={active ? { background: 'var(--bk-chip)', color: 'var(--bk-text)' } : undefined}
            >
              {l.id === 'default' ? IconDefault : l.id === 'square' ? IconSquare : IconHorizontal}
            </button>
          );
        })}
      </div>
      <span
        className="hidden md:block pt-1 text-center text-[9px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--bk-text-3)' }}
      >
        {themeDef.name.split(' ')[0]}
      </span>
    </div>
  );
}
