'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  BentoProvider,
  ControlDock,
  useBento,
} from '@/components/bento/theme';
import { TodoProvider } from '@/components/bento/todo';
import {
  TodoBoard,
  TodoUpNext,
  Waveform,
} from '@/components/bento/todo';
import { BentoCard, useBentoReveal } from '@/components/bento/core';
import {
  TaskAnalyticsDemo,
  SessionStreakDemo,
  FocusBalanceDemo,
  RoutePlannerDemo,
  QuickBlocksDemo,
  ImportsQueueDemo,
  WeeklyPerformanceDemo,
  DragDropDemo,
} from '@/components/bento/cardsA';
import {
  ExpenseTrackerDemo,
  TeamHubDemo,
  ProfileBoardDemo,
  AdaptiveSettingsDemo,
  SmartSearchDemo,
  ArchiveVaultDemo,
  WorkspacesOrbitDemo,
  InvoicingDemo,
} from '@/components/bento/cardsB';
import {
  FileSharingDemo,
  AIConverterDemo,
  SmartAssetVaultDemo,
} from '@/components/bento/cardsC';
import {
  ActuatorPresetDemo,
  DevCapabilitiesDemo,
  FurnitureCard4Demo,
  UniversalConsoleDemo,
} from '@/components/bento/cardsD';
import { ProductLensDemo } from '@/components/bento/cardsE';

/* ------------------------------------------------------------------ */
/* Hero header with GSAP entrance                                      */
/* ------------------------------------------------------------------ */

function HeroHeader() {
  const ref = useRef<HTMLElement>(null);
  const { themeDef } = useBento();

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.hero-el', {
        opacity: 0,
        y: 34,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.1,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <header ref={ref} className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-16 sm:px-6 md:pt-24 md:pl-24">
      <div className="hero-el flex items-center gap-3">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-sm font-black"
          style={{
            background: 'linear-gradient(135deg, var(--bk-accent), var(--bk-accent-2))',
            color: 'var(--bk-on-accent)',
          }}
        >
          B
        </span>
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--bk-text)' }}>
          Bento
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: 'var(--bk-chip)', color: 'var(--bk-text-2)', border: '1px solid var(--bk-border-soft)' }}
        >
          To-Do Edition · v1.0
        </span>
      </div>

      <h1 className="hero-el mt-8 max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl" style={{ color: 'var(--bk-text)' }}>
        Your shift, sorted
        <br />
        from{' '}
        <span
          style={{
            background: 'linear-gradient(90deg, var(--bk-accent), var(--bk-accent-2), var(--bk-accent-3))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          keys to handover
        </span>
        .
      </h1>

      <p className="hero-el mt-5 max-w-xl text-base leading-relaxed" style={{ color: 'var(--bk-text-2)' }}>
        The full Daily Maintenance Workflow — all 15 SOP tasks across five phases — wrapped
        in the complete Bento card family. Check tasks off as you walk the property, log
        Green Shield notes, and close the shift with a manager sign-off. The Bento-Exoskel
        tactical suite — actuator torque wheels, kernel diagnostic drawers, glass-tinted
        finishes and power-cell telemetry — rides on the same grid.
      </p>

      <div className="hero-el mt-6 flex flex-wrap items-center gap-2">
        <span
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)', color: 'var(--bk-text-2)' }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--bk-accent)' }} />
          27 bento cards
        </span>
        <span
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)', color: 'var(--bk-text-2)' }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--bk-accent-3)' }} />
          8 color varieties
        </span>
        <span
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)', color: 'var(--bk-text-2)' }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--bk-accent)' }} />
          15 SOP tasks · 5 phases
        </span>
        <span
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--bk-chip)', border: '1px solid var(--bk-border-soft)', color: 'var(--bk-text-2)' }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--bk-accent-2)' }} />
          Theme: {themeDef.name}
        </span>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* The grid                                                            */
/* ------------------------------------------------------------------ */

function BentoGrid() {
  const { layout } = useBento();
  const gridRef = useBentoReveal();

  return (
    <main
      id="bento-root"
      ref={gridRef}
      className={`bento-grid-layout-${layout} relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 pb-24 sm:px-6 md:grid-cols-2 md:pl-24`}
    >
      {/* 1 — HERO: functional to-do board */}
      <TodoBoard />

      {/* 2 — Task Analytics */}
      <BentoCard
        title="Task Analytics"
        desc="Track completions in real time. Hover the line, read the story."
      >
        <TaskAnalyticsDemo />
      </BentoCard>

      {/* 3 — Focus Balance gauge */}
      <BentoCard
        title="Focus Balance"
        desc="A gradient ring that mirrors how balanced your workload feels."
      >
        <FocusBalanceDemo />
      </BentoCard>

      {/* 4 — Up Next (companion to-do card) */}
      <BentoCard
        title="Up Next"
        desc="Your open tasks, surfaced. Tap one to check it off instantly."
      >
        <TodoUpNext />
      </BentoCard>

      {/* 5 — Session Streak */}
      <BentoCard
        title="Session Streak"
        desc="Check in day by day. Consistency is the whole trick."
      >
        <SessionStreakDemo />
      </BentoCard>

      {/* 6 — Voice Memos (waveform + universal audio stack) */}
      <BentoCard
        title="Voice Memos"
        desc="Scrub through spoken notes with a live waveform and audio picker."
      >
        <Waveform />
      </BentoCard>

      {/* 7 — One-Click File Sharing (glass folder + Artur cursor; patch v6:
          punch-out border dots + gradient-mask sheen on arrow & Discover) */}
      <BentoCard
        title="One-Click File Sharing"
        desc="Simplify sharing with a single click for any file size. Try it."
        className="punch-border"
        buttonClassName="gradient-mask-btn"
      >
        <FileSharingDemo />
      </BentoCard>

      {/* 8 — AI File Converter (DOC → MP4 stack + visualizer) */}
      <BentoCard
        title="AI File Converter"
        desc="Convert files between formats quickly and accurately."
      >
        <AIConverterDemo />
      </BentoCard>

      {/* 9 — Power Cell Vault (beige raised layer, gauge-metered contrast card) */}
      <BentoCard
        title="Power Cell Vault"
        desc="Gauge-metered power cells on the soft beige layer. Top up or send."
      >
        <SmartAssetVaultDemo />
      </BentoCard>

      {/* 10 — Actuator Preset (Furniture Card 4: viewport scroll wheel;
          patch v6: punch-out dots + glass-gel torque meter) */}
      <BentoCard
        title="Limb Calibration"
        desc="Actuator presets P1–P5 tune joint torque in real time. Click a tile."
        className="punch-border"
      >
        <ActuatorPresetDemo />
      </BentoCard>

      {/* 11 — DEV Capabilities (inverted corner + exploded lock + GSAP drawer;
          patch v6: punch-out border dots + Close Panel sheen) */}
      <BentoCard
        title="DEV Capabilities"
        desc="Unlock to slide out the inline kernel diagnostics drawer."
        className="punch-border"
      >
        <DevCapabilitiesDemo />
      </BentoCard>

      {/* 12 — AVA-007 Voice Console (Universal Feature Stack v5) */}
      <BentoCard
        title="AVA-007 Voice Console"
        desc="The universal stack — audio visualizer, stream or library voice playback and UI prompts."
      >
        <UniversalConsoleDemo />
      </BentoCard>

      {/* 13 — Route Planner */}
      <BentoCard
        title="Route Planner"
        desc="Errands, mapped. The fastest path redraws itself as plans change."
      >
        <RoutePlannerDemo />
      </BentoCard>

      {/* 14 — Weekly Performance */}
      <BentoCard
        title="Weekly Performance"
        desc="A tiny kanban that sums up your week at a glance."
      >
        <WeeklyPerformanceDemo />
      </BentoCard>

      {/* 15 — Quick Blocks */}
      <BentoCard
        title="Quick Blocks"
        desc="Snap new tasks into the grid wherever they fit best."
      >
        <QuickBlocksDemo />
      </BentoCard>

      {/* 16 — Imports Queue */}
      <BentoCard
        title="Imports Queue"
        desc="Pull tasks in from anywhere — files land here first."
      >
        <ImportsQueueDemo />
      </BentoCard>

      {/* 17 — Expense Tracker */}
      <BentoCard
        title="Expense Tracker"
        desc="Log spending without leaving the board."
      >
        <ExpenseTrackerDemo />
      </BentoCard>

      {/* 18 — Drag & Drop Builder */}
      <BentoCard
        title="Drag & Drop Builder"
        desc="Compose your own board from cards that snap into place."
      >
        <DragDropDemo />
      </BentoCard>

      {/* 19 — Team Hub */}
      <BentoCard
        title="Team Hub"
        desc="Assign a task, ping the squad, keep everyone honest."
      >
        <TeamHubDemo />
      </BentoCard>

      {/* 20 — Profile Board */}
      <BentoCard
        title="Profile Board"
        desc="Your identity, tools and level — glassmorphic and proud."
      >
        <ProfileBoardDemo />
      </BentoCard>

      {/* 21 — Adaptive Settings */}
      <BentoCard
        title="Adaptive Settings"
        desc="Smart reminders, auto-archive and focus mode. Live toggles."
      >
        <AdaptiveSettingsDemo />
      </BentoCard>

      {/* 22 — Smart Search */}
      <BentoCard
        title="Smart Search"
        desc="One field to rule every task, file and teammate. Try typing."
      >
        <SmartSearchDemo />
      </BentoCard>

      {/* 23 — Archive Vault */}
      <BentoCard
        title="Archive Vault"
        desc="Done and dusted. Completed work files itself away."
      >
        <ArchiveVaultDemo />
      </BentoCard>

      {/* 24 — Workspaces */}
      <BentoCard
        title="Workspaces"
        desc="Personal, design and moves — one hub, many orbits."
      >
        <WorkspacesOrbitDemo />
      </BentoCard>

      {/* 25 — Furniture Design (Furniture Card 4: glass-tinted variant + wheel) */}
      <BentoCard
        title="Furniture Design"
        desc="Render viewport with the embedded scroll wheel. Toggle the glass-tinted finish."
      >
        <FurnitureCard4Demo />
      </BentoCard>

      {/* 26 — Invoicing */}
      <BentoCard
        title="Invoicing"
        desc="Billable hours become tidy receipts, automatically."
      >
        <InvoicingDemo />
      </BentoCard>

      {/* 27 — Product Lens (patch v6: real getUserMedia camera capture) */}
      <BentoCard
        title="Product Lens"
        desc="Point, capture, identify. The lens feeds the catalog match endpoint."
        buttonLabel="Open Lens"
      >
        <ProductLensDemo />
      </BentoCard>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function Footer() {
  const { themeDef } = useBento();
  return (
    <footer
      className="relative z-10 mt-auto border-t py-8 text-center text-xs"
      style={{ borderColor: 'var(--bk-border-soft)', color: 'var(--bk-text-3)' }}
    >
      <p>
        Bento To-Do Edition — built with Next.js, Tailwind &amp; GSAP ·{' '}
        <span style={{ color: 'var(--bk-text-2)' }}>{themeDef.name}</span> variety
      </p>
      <p className="mt-1">Todos save to your browser. Switch themes from the dock.</p>
    </footer>
  );
}

export default function Page() {
  return (
    <BentoProvider>
      <TodoProvider>
        <div className="bento-page flex min-h-screen flex-col">
          <ControlDock />
          <HeroHeader />
          <BentoGrid />
          <Footer />
        </div>
      </TodoProvider>
    </BentoProvider>
  );
}
