'use client';

import React, { useRef, useState } from 'react';
import { Line, PlusIcon, WindowDots } from './core';
import { CursorArrow } from './cardsA';

/* ================================================================== */
/* Expense Tracker — finance rows                                      */
/* ================================================================== */

export function ExpenseTrackerDemo() {
  const rows = [
    { icon: '◆', w: 58, amt: '-$24.00', c: 'var(--bk-accent)' },
    { icon: '●', w: 72, amt: '-$8.50', c: 'var(--bk-accent-2)' },
    { icon: '▲', w: 46, amt: '+$120.00', c: 'var(--bk-accent-3)' },
  ];
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <WindowDots />
      <div className="mt-4 flex items-center justify-between px-1" aria-hidden>
        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--bk-text-3)' }}>
          This week
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}
        >
          $ 152.50
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2" aria-hidden>
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
          >
            <span
              className="grid h-7 w-7 place-items-center rounded-lg text-[10px]"
              style={{ background: 'var(--bk-chip)', color: r.c }}
            >
              {r.icon}
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <Line w={r.w} h={5} />
              <Line w={r.w - 18} h={4} tone="soft" />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--bk-text-2)' }}>
              {r.amt}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="bk-btn mx-auto mt-auto"
        style={{ marginTop: 'auto' }}
        aria-hidden
        tabIndex={-1}
      >
        <PlusIcon className="h-2.5 w-2.5" /> Add expense
      </button>
    </div>
  );
}

/* ================================================================== */
/* Team Hub — collaboration avatars                                    */
/* ================================================================== */

export function TeamHubDemo() {
  const members = [
    { i: 'AK', g: 'linear-gradient(135deg, var(--bk-accent), var(--bk-accent-2))' },
    { i: 'MJ', g: 'linear-gradient(135deg, var(--bk-accent-2), var(--bk-accent-3))' },
    { i: 'RS', g: 'linear-gradient(135deg, var(--bk-accent-3), var(--bk-accent))' },
    { i: '+4', g: 'none' },
  ];
  const [assigned, setAssigned] = useState(false);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-5">
      <div className="flex -space-x-3">
        {members.map((m, i) => (
          <span
            key={i}
            className="grid h-12 w-12 place-items-center rounded-full text-xs font-bold transition-transform hover:-translate-y-1"
            style={{
              background: m.g === 'none' ? 'var(--bk-chip)' : m.g,
              color: m.g === 'none' ? 'var(--bk-text-2)' : 'var(--bk-on-accent)',
              border: '2px solid var(--bk-card)',
              zIndex: members.length - i,
            }}
          >
            {m.i}
          </span>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5" aria-hidden>
        <Line w={120} h={6} />
        <Line w={78} h={5} tone="soft" />
      </div>
      <button
        type="button"
        onClick={() => setAssigned((a) => !a)}
        className="bk-btn"
        style={{ marginTop: 0 }}
      >
        {assigned ? 'Assigned ✓' : 'Assign task'}
      </button>
      <span className="text-[10px]" style={{ color: 'var(--bk-text-3)' }}>
        {assigned ? '3 teammates notified' : 'Tap to assign a task'}
      </span>
    </div>
  );
}

/* ================================================================== */
/* Profile Board — avatar + detail grid                                */
/* ================================================================== */

export function ProfileBoardDemo() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-5">
      {/* avatar with glow */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: 'var(--bk-accent)', opacity: 0.3 }}
          aria-hidden
        />
        <div
          className="relative grid h-20 w-20 place-items-center rounded-full text-xl font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--bk-accent), var(--bk-accent-2))',
            color: 'var(--bk-on-accent)',
            border: '2px solid var(--bk-border)',
          }}
        >
          JD
        </div>
        <span
          className="absolute bottom-1 right-1 h-4 w-4 rounded-full"
          style={{ background: 'var(--bk-accent-3)', border: '2px solid var(--bk-card)' }}
          title="Online"
          aria-hidden
        />
      </div>
      <div className="text-center">
        <p className="text-base font-bold" style={{ color: 'var(--bk-text)' }}>
          Jamie Doe
        </p>
        <p className="text-xs" style={{ color: 'var(--bk-text-3)' }}>
          Product Designer
        </p>
      </div>
      {/* detail grid */}
      <div className="grid w-full max-w-[240px] grid-cols-2 gap-x-5 gap-y-2.5" aria-hidden>
        {[
          ['First name', 'Jamie'],
          ['Last name', 'Doe'],
          ['Job title', 'Designer'],
          ['Level', 'Senior'],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--bk-text-3)' }}>
              {k}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--bk-text-2)' }}>
              {v}
            </span>
          </div>
        ))}
      </div>
      {/* tool chips */}
      <div className="flex gap-2" aria-hidden>
        {['F', 'S', 'N'].map((t) => (
          <span
            key={t}
            className="grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold"
            style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)', color: 'var(--bk-text-2)' }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Adaptive Settings — interactive toggle stack                        */
/* ================================================================== */

export function AdaptiveSettingsDemo() {
  const [rows, setRows] = useState([true, false, true]);
  const labels = ['Smart reminders', 'Auto-archive done', 'Focus mode'];

  const flip = (i: number) =>
    setRows((prev) => prev.map((v, j) => (j === i ? !v : v)));

  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6">
      {rows.map((on, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border-soft)' }}
        >
          <div className="flex flex-col gap-1.5" aria-hidden>
            <Line w={i === 1 ? 78 : 96} h={5} />
            <Line w={54} h={4} tone="soft" />
          </div>
          <span className="sr-only">{labels[i]}</span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={labels[i]}
            onClick={() => flip(i)}
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{
              background: on ? 'var(--bk-check-bg)' : 'var(--bk-chip)',
              border: '1px solid var(--bk-border-soft)',
            }}
          >
            <span
              className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-300"
              style={{
                left: on ? 26 : 3,
                background: on ? 'var(--bk-on-accent)' : 'var(--bk-text-3)',
                boxShadow: '0 1px 4px rgba(0,0,0,.35)',
              }}
            />
          </button>
        </div>
      ))}
      <p className="text-center text-[10px]" style={{ color: 'var(--bk-text-3)' }}>
        Toggles are live — try them
      </p>
    </div>
  );
}

/* ================================================================== */
/* Smart Search — search pill + result rows                            */
/* ================================================================== */

export function SmartSearchDemo() {
  const [q, setQ] = useState('');
  const results = ['Design review notes', 'Q3 roadmap draft', 'Launch checklist'];
  const filtered = results.filter((r) => r.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 p-6">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border)' }}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="var(--bk-text-3)" strokeWidth="1.6" aria-hidden>
          <circle cx="7" cy="7" r="4.6" />
          <path d="M10.5 10.5 L14 14" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks, files, people…"
          aria-label="Search"
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: 'var(--bk-text)' }}
        />
        <span
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-3)' }}
          aria-hidden
        >
          ⌘K
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {(q ? filtered : results).map((r, i) => (
          <div
            key={r}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-transform hover:translate-x-1"
            style={{ background: i === 0 && !q ? 'var(--bk-chip)' : 'transparent' }}
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
              style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}
              aria-hidden
            >
              <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="1" y="1" width="8" height="8" rx="2" />
              </svg>
            </span>
            <span className="text-sm" style={{ color: 'var(--bk-text-2)' }}>
              {r}
            </span>
            <span className="ml-auto" aria-hidden>
              <CursorArrow className="opacity-0" />
            </span>
          </div>
        ))}
        {q && filtered.length === 0 && (
          <p className="px-3 text-sm" style={{ color: 'var(--bk-text-3)' }}>
            No matches for “{q}”
          </p>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Archive Vault — stacked folders (One-Click File Sharing)            */
/* ================================================================== */

export function ArchiveVaultDemo() {
  return (
    <div className="absolute inset-0 grid place-items-center p-6" aria-hidden>
      <div className="relative h-40 w-44">
        {[
          { r: -8, y: 0, o: 0.45 },
          { r: 5, y: 16, o: 0.7 },
          { r: -3, y: 32, o: 1 },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute inset-x-0 flex h-24 items-center gap-3 rounded-2xl px-4 transition-transform duration-300 hover:-translate-y-2"
            style={{
              top: s.y,
              transform: `rotate(${s.r}deg)`,
              opacity: s.o,
              background: 'var(--bk-panel)',
              border: '1px solid var(--bk-border-soft)',
              zIndex: i,
            }}
          >
            <svg viewBox="0 0 44 36" className="h-8 w-10 shrink-0" fill="none">
              <path
                d="M2 8 Q2 4 6 4 L16 4 Q19 4 20 7 L21 9 L38 9 Q42 9 42 13 L42 30 Q42 34 38 34 L6 34 Q2 34 2 30 Z"
                fill="var(--bk-chip)"
                stroke="var(--bk-border)"
              />
            </svg>
            <div className="flex flex-col gap-1.5">
              <Line w={72} h={5} />
              <Line w={44} h={4} tone="soft" />
            </div>
            <span
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full"
              style={{ background: 'var(--bk-panel)', border: '1px solid var(--bk-border)', color: 'var(--bk-text-2)' }}
            >
              <PlusIcon className="h-2.5 w-2.5" />
            </span>
          </div>
        ))}
      </div>
      <span
        className="absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-bold"
        style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)' }}
      >
        12 files · 4.2 MB
      </span>
      <CursorArrow className="absolute bottom-8 right-10" />
    </div>
  );
}

/* ================================================================== */
/* Workspaces Orbit — center node + orbiting instances                 */
/* ================================================================== */

export function WorkspacesOrbitDemo() {
  return (
    <div className="absolute inset-0 grid place-items-center p-6" aria-hidden>
      <div className="relative grid h-52 w-52 place-items-center">
        {/* orbit rings */}
        {[104, 72].map((d) => (
          <span
            key={d}
            className="absolute rounded-full"
            style={{ width: d * 2, height: d * 2, border: '1px dashed var(--bk-line)', opacity: 0.5 }}
          />
        ))}
        {/* center */}
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl text-lg font-bold"
          style={{
            background: 'var(--bk-panel)',
            border: '1px solid var(--bk-border)',
            boxShadow: 'var(--bk-shadow)',
            color: 'var(--bk-text)',
          }}
        >
          @
        </div>
        {/* orbiting nodes */}
        {[
          { x: '50%', y: '-6%', c: 'var(--bk-accent)' },
          { x: '-8%', y: '62%', c: 'var(--bk-accent-2)' },
          { x: '86%', y: '70%', c: 'var(--bk-accent-3)' },
        ].map((n, i) => (
          <span
            key={i}
            className="absolute grid h-9 w-9 place-items-center rounded-full text-[10px] font-bold"
            style={{
              left: n.x,
              top: n.y,
              transform: 'translate(-50%,-50%)',
              background: 'var(--bk-panel)',
              border: '1px solid var(--bk-border)',
              color: n.c,
              boxShadow: 'var(--bk-inset-soft)',
            }}
          >
            {['P', 'D', 'M'][i]}
          </span>
        ))}
        {/* connection lines */}
        <svg viewBox="0 0 208 208" className="absolute inset-0 h-full w-full" fill="none">
          <line x1="104" y1="104" x2="104" y2="12" stroke="var(--bk-line)" strokeDasharray="3 5" opacity="0.7" />
          <line x1="104" y1="104" x2="16" y2="138" stroke="var(--bk-line)" strokeDasharray="3 5" opacity="0.7" />
          <line x1="104" y1="104" x2="184" y2="150" stroke="var(--bk-line)" strokeDasharray="3 5" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Invoicing — receipt                                                 */
/* ================================================================== */
/* (Furniture Card 4 moved to cardsD.tsx as FurnitureCard4Demo —       */
/*  patch v5: Glass Tinted Finish Variant + embedded scroll wheel)     */

export function InvoicingDemo() {
  const items = [
    ['Design sprint', '$1,800'],
    ['Prototype kit', '$640'],
    ['Handoff audit', '$320'],
  ];
  return (
    <div className="absolute inset-0 flex flex-col p-5">
      <WindowDots />
      <div
        className="relative mt-4 flex flex-1 flex-col rounded-xl p-4"
        style={{
          background: 'var(--bk-panel)',
          border: '1px solid var(--bk-border-soft)',
        }}
        aria-hidden
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--bk-text-3)' }}>
            Invoice #042
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
            style={{ background: 'var(--bk-chip)', color: 'var(--bk-accent-3)' }}
          >
            Paid
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {items.map(([label, amt]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: 'var(--bk-text-2)' }}>
                {label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--bk-text-2)' }}>
                {amt}
              </span>
            </div>
          ))}
        </div>
        <div className="my-4 border-t border-dashed" style={{ borderColor: 'var(--bk-line)' }} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--bk-text)' }}>
            Total
          </span>
          <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--bk-text)' }}>
            $2,760
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between" style={{ paddingTop: 12 }}>
          <Line w={64} h={4} tone="soft" />
          <Line w={40} h={4} tone="soft" />
        </div>
      </div>
    </div>
  );
}
