'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCountUp, Line, PlusIcon, WindowDots } from './core';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================== */
/* Task Analytics — big counter + smooth line chart + tooltip pill     */
/* ================================================================== */

export function TaskAnalyticsDemo() {
  const countRef = useCountUp(1632);
  const pathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const p = pathRef.current;
    if (!p || prefersReducedMotion()) return;
    const len = p.getTotalLength();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        p,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: p, start: 'top 90%', once: true },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col p-5">
      {/* ruler ticks */}
      <div className="flex justify-between px-1" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="w-px"
            style={{ height: i % 2 ? 5 : 9, background: 'var(--bk-line)', opacity: 0.7 }}
          />
        ))}
      </div>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <p className="text-4xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--bk-text)' }}>
            <span ref={countRef}>0</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--bk-text-3)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--bk-accent)' }} />
            Tasks completed
          </p>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          <Line w={34} h={5} tone="soft" />
        </div>
      </div>

      {/* chart */}
      <div className="relative mt-auto">
        <svg viewBox="0 0 320 130" className="w-full" fill="none" aria-hidden>
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--bk-accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--bk-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* dashed marker */}
          <line x1="118" y1="8" x2="118" y2="122" stroke="var(--bk-line)" strokeWidth="1" strokeDasharray="3 5" />
          <path d="M0 96 C 30 88, 44 64, 66 62 S 100 84, 118 66 C 138 46, 150 22, 176 30 S 216 92, 244 84 S 296 34, 320 40 L 320 130 L 0 130 Z" fill="url(#chartFill)" stroke="none" />
          <path
            ref={pathRef}
            d="M0 96 C 30 88, 44 64, 66 62 S 100 84, 118 66 C 138 46, 150 22, 176 30 S 216 92, 244 84 S 296 34, 320 40"
            stroke="var(--bk-accent)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* marker dot */}
          <circle cx="118" cy="66" r="4.5" fill="var(--bk-text)" />
        </svg>
        {/* tooltip pill */}
        <div
          className="absolute left-[30%] top-[8%] flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-xs font-semibold shadow-lg"
          style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border)', color: 'var(--bk-text)' }}
        >
          Chrome
          <span
            className="grid h-5 w-5 place-items-center rounded-full"
            style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}
          >
            <PlusIcon className="h-2 w-2" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Session Streak — circular interaction counter                       */
/* ================================================================== */

export function SessionStreakDemo() {
  const [streak, setStreak] = useState(8);
  const [activeIdx, setActiveIdx] = useState(1);
  const days = [
    { d: 7, x: '6%' },
    { d: 8, x: '28%' },
    { d: 9, x: '62%' },
    { d: 10, x: '82%' },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-5">
      <div className="relative h-32 w-full max-w-[280px]" aria-hidden={false}>
        {/* dots sprinkles */}
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full"
            style={{
              background: 'var(--bk-line)',
              left: `${8 + i * 9.4}%`,
              top: i % 2 ? 6 : 88,
              opacity: 0.6,
            }}
          />
        ))}
        {days.map((day, i) => {
          const isActive = activeIdx === i;
          return (
            <button
              key={day.d}
              type="button"
              onClick={() => {
                setActiveIdx(i);
                setStreak((s) => s + 1);
              }}
              aria-label={`Day ${day.d} check-in`}
              className="absolute grid place-items-center rounded-full text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
              style={
                isActive
                  ? {
                      left: day.x,
                      top: '14%',
                      width: 56,
                      height: 76,
                      borderRadius: 26,
                      background: 'var(--bk-panel)',
                      border: '1px solid var(--bk-border)',
                      boxShadow: 'var(--bk-shadow)',
                      color: 'var(--bk-text)',
                      zIndex: 2,
                    }
                  : {
                      left: day.x,
                      top: '34%',
                      width: 48,
                      height: 48,
                      background: 'var(--bk-chip)',
                      border: '1px solid var(--bk-border-soft)',
                      boxShadow: 'var(--bk-inset-soft)',
                      color: 'var(--bk-text-3)',
                      fontStyle: 'italic',
                    }
              }
            >
              {day.d}
            </button>
          );
        })}
      </div>
      <div
        className="flex w-full max-w-[280px] items-center justify-between rounded-2xl px-4 py-3"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
      >
        <span className="text-xs" style={{ color: 'var(--bk-text-3)' }}>
          Current streak
        </span>
        <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--bk-text)' }}>
          {streak}
        </span>
      </div>
      <span className="sr-only">Streak counter, click a day to check in</span>
    </div>
  );
}

/* ================================================================== */
/* Focus Balance — gradient circular gauge (scroll-scrubbed)           */
/* ================================================================== */

export function FocusBalanceDemo() {
  const R = 74;
  const C = 2 * Math.PI * R;
  const value = 72;
  const circleRef = useRef<SVGCircleElement>(null);

  useLayoutEffect(() => {
    if (!circleRef.current) return;
    if (prefersReducedMotion()) {
      circleRef.current.style.strokeDashoffset = `${C - (value / 100) * C}`;
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        circleRef.current,
        { strokeDashoffset: C },
        {
          strokeDashoffset: C - (value / 100) * C,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: circleRef.current, start: 'top 88%', once: true },
        },
      );
    });
    return () => ctx.revert();
  }, [C]);

  return (
    <div className="absolute inset-0 grid place-items-center p-4">
      <div className="relative grid h-48 w-48 place-items-center">
        <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--bk-ring-1)" />
              <stop offset="52%" stopColor="var(--bk-ring-2)" />
              <stop offset="100%" stopColor="var(--bk-ring-3)" />
            </linearGradient>
          </defs>
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--bk-chip)" strokeWidth="13" />
          <circle
            ref={circleRef}
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C}
          />
        </svg>
        {/* inner neumorphic disc */}
        <div
          className="grid h-32 w-32 place-items-center rounded-full text-center"
          style={{
            background: 'var(--bk-panel-2)',
            boxShadow: 'var(--bk-inset)',
          }}
        >
          <div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--bk-text)' }}>
              {value}
              <span className="text-sm">%</span>
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--bk-text-3)' }}>
              Balanced
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Route Planner — map with animated route                             */
/* ================================================================== */

export function RoutePlannerDemo() {
  const routeRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!routeRef.current || prefersReducedMotion()) return;
    const path = routeRef.current;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      duration: 2.2,
      ease: 'power2.inOut',
      repeat: -1,
      repeatDelay: 1.2,
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" style={{ background: 'var(--bk-panel-2)' }} aria-hidden />
      <svg viewBox="0 0 320 260" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
        {/* street grid */}
        {[40, 90, 140, 190, 240].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="320" y2={y} stroke="var(--bk-line)" strokeWidth="1" opacity="0.5" />
        ))}
        {[30, 100, 170, 240, 300].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="260" stroke="var(--bk-line)" strokeWidth="1" opacity="0.5" />
        ))}
        {/* diagonal avenue */}
        <line x1="0" y1="230" x2="320" y2="30" stroke="var(--bk-line)" strokeWidth="1.4" opacity="0.6" />
        {/* route */}
        <path
          d="M40 220 L100 220 Q110 220 110 210 L110 150 Q110 140 120 140 L170 140 Q180 140 180 130 L180 90"
          stroke="var(--bk-line)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          ref={routeRef}
          d="M40 220 L100 220 Q110 220 110 210 L110 150 Q110 140 120 140 L170 140 Q180 140 180 130 L180 90"
          stroke="var(--bk-accent)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* origin */}
        <circle cx="40" cy="220" r="6" fill="var(--bk-text-2)" />
        {/* destination X */}
        <g stroke="var(--bk-text)" strokeWidth="3.4" strokeLinecap="round">
          <line x1="173" y1="83" x2="187" y2="97" />
          <line x1="187" y1="83" x2="173" y2="97" />
        </g>
        {/* waypoint dots */}
        <circle cx="110" cy="150" r="4" fill="var(--bk-line)" />
        <circle cx="170" cy="140" r="4" fill="var(--bk-line)" />
      </svg>
      {/* floating pill */}
      <div
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-xs font-semibold shadow-lg"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border)', color: 'var(--bk-text)' }}
      >
        40% Faster
        <span
          className="grid h-5 w-5 place-items-center rounded-full"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}
        >
          <PlusIcon className="h-2 w-2" />
        </span>
      </div>
      {/* cursor */}
      <CursorArrow className="absolute left-[54%] top-[52%]" />
    </div>
  );
}

export function CursorArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 drop-shadow-md ${className}`} aria-hidden>
      <path
        d="M4 2 L16 10 L10.5 11.4 L13.6 17.2 L11.2 18.4 L8.2 12.6 L4 16 Z"
        fill="var(--bk-text)"
        stroke="var(--bk-bg)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/* ================================================================== */
/* Quick Blocks — mini bento grid (Manage Components)                  */
/* ================================================================== */

export function QuickBlocksDemo() {
  const cell = (
    key: string,
    style: React.CSSProperties,
    highlight = false,
  ) => (
    <div
      key={key}
      className="grid place-items-center rounded-xl transition-transform duration-300 hover:scale-[1.04]"
      style={{
        border: highlight ? '1.5px solid var(--bk-line)' : '1.5px dashed var(--bk-line)',
        opacity: highlight ? 1 : 0.55,
        background: highlight ? 'var(--bk-panel)' : 'transparent',
        ...style,
      }}
    >
      {highlight && (
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{
            background: 'var(--bk-chip)',
            border: '1px solid var(--bk-border)',
            boxShadow: 'var(--bk-inset-soft)',
            color: 'var(--bk-text-2)',
          }}
        >
          <PlusIcon className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <div className="grid h-[210px] w-full max-w-[260px] grid-cols-3 gap-2.5" aria-hidden>
        {cell('a', { gridRow: 'span 2' })}
        {cell('b', { gridColumn: 'span 2', height: 60 })}
        {cell('c', { height: 60 }, true)}
        {cell('d', {})}
        {cell('e', {})}
        {cell('f', { gridColumn: 'span 2', height: 54 })}
        {cell('g', { height: 54 })}
      </div>
      <CursorArrow className="absolute left-[56%] top-[46%]" />
    </div>
  );
}

/* ================================================================== */
/* Imports Queue — file rows + folder (Download Manager)               */
/* ================================================================== */

export function ImportsQueueDemo() {
  const rows = [
    { w1: 46, w2: 26, p: 82 },
    { w1: 62, w2: 34, p: 47 },
    { w1: 38, w2: 22, p: 65 },
  ];
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <WindowDots />
      {/* tab pills */}
      <div className="mt-4 flex items-center gap-2" aria-hidden>
        <span
          className="rounded-full px-4 py-1.5 text-[11px] font-semibold"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border)', color: 'var(--bk-text-2)' }}
        >
          <Line w={44} h={5} />
        </span>
        <Line w={30} h={5} tone="soft" />
      </div>
      {/* search pill */}
      <div
        className="mt-3 flex items-center justify-between rounded-full py-2 pl-4 pr-2"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
        aria-hidden
      >
        <Line w="52%" h={5} tone="soft" />
        <span
          className="rounded-full px-3 py-1"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border)' }}
        >
          <Line w={34} h={4} />
        </span>
      </div>
      {/* file rows */}
      <div className="mt-3 flex flex-col gap-1" aria-hidden>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-1 py-2">
            <span
              className="grid h-5 w-5 place-items-center rounded-full"
              style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}
            >
              <PlusIcon className="h-2 w-2" />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <Line w={r.w1} h={5} />
              <Line w={r.w2} h={4} tone="soft" />
            </div>
            {/* mini progress */}
            <div className="h-1 w-14 overflow-hidden rounded-full" style={{ background: 'var(--bk-chip)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${r.p}%`, background: 'var(--bk-accent)' }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* folder */}
      <div
        className="relative mt-auto grid place-items-center rounded-2xl py-6"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
        aria-hidden
      >
        <div className="relative">
          <svg viewBox="0 0 44 36" className="h-9 w-11" fill="none">
            <path
              d="M2 8 Q2 4 6 4 L16 4 Q19 4 20 7 L21 9 L38 9 Q42 9 42 13 L42 30 Q42 34 38 34 L6 34 Q2 34 2 30 Z"
              fill="var(--bk-chip)"
              stroke="var(--bk-border)"
            />
          </svg>
          <span
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full shadow"
            style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border)', color: 'var(--bk-text-2)' }}
          >
            <PlusIcon className="h-2.5 w-2.5" />
          </span>
        </div>
        <CursorArrow className="absolute -right-3 bottom-4" />
      </div>
    </div>
  );
}

/* ================================================================== */
/* Weekly Performance — 49% + mini kanban (Stats Performance)          */
/* ================================================================== */

export function WeeklyPerformanceDemo() {
  const pctRef = useCountUp(49);
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-5xl font-bold tabular-nums tracking-tight" style={{ color: 'var(--bk-text)' }}>
            <span ref={pctRef}>0</span>%
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--bk-text-3)' }}>
            Weekly performance
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-accent-3)', border: '1px solid var(--bk-border-soft)' }}
        >
          On track
        </span>
      </div>
      {/* mini kanban */}
      <div className="mt-auto grid grid-cols-3 gap-2.5" aria-hidden>
        {[
          ['24%', 34, 54, 40],
          ['58%', 50, 30, 62],
          ['82%', 42, 58, 30],
        ].map(([label, a, b, c], col) => (
          <div
            key={col}
            className="flex flex-col gap-2 rounded-xl p-2"
            style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
          >
            <span className="text-[9px] font-bold" style={{ color: 'var(--bk-text-3)' }}>
              {label as string}
            </span>
            <div className="rounded-md" style={{ height: a as number, background: 'var(--bk-chip)' }} />
            <div className="rounded-md" style={{ height: b as number, background: 'var(--bk-chip)', opacity: 0.7 }} />
            <div
              className="rounded-md"
              style={{ height: c as number, background: col === 1 ? 'var(--bk-accent)' : 'var(--bk-chip)', opacity: col === 1 ? 0.9 : 0.5 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Drag & Drop Builder                                                 */
/* ================================================================== */

export function DragDropDemo() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-4 p-6" aria-hidden>
      <div className="flex flex-col gap-3">
        <div
          className="flex h-24 w-36 flex-col justify-between rounded-2xl p-3"
          style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
        >
          <Line w={52} h={5} />
          <div className="flex gap-1.5">
            <Line w={20} h={4} tone="soft" />
            <Line w={14} h={4} tone="soft" />
          </div>
        </div>
        <div
          className="flex h-16 w-36 items-center gap-2 rounded-2xl p-3"
          style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: 'var(--bk-chip)' }}>
            <Line w={12} h={4} />
          </span>
          <div className="flex flex-col gap-1.5">
            <Line w={60} h={5} />
            <Line w={38} h={4} tone="soft" />
          </div>
        </div>
      </div>
      {/* dragged card */}
      <div className="relative">
        <div
          className="grid h-20 w-28 rotate-6 place-items-center rounded-2xl shadow-xl"
          style={{
            background: 'var(--bk-panel)',
            border: '1.5px solid var(--bk-line)',
            boxShadow: 'var(--bk-shadow-hover)',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <Line w={54} h={5} />
            <Line w={34} h={4} tone="soft" />
          </div>
        </div>
        {/* dashed target */}
        <div
          className="absolute -bottom-10 -right-8 h-16 w-20 rounded-2xl"
          style={{ border: '1.5px dashed var(--bk-line)', opacity: 0.6 }}
        />
        <CursorArrow className="absolute -right-3 top-8" />
      </div>
    </div>
  );
}
