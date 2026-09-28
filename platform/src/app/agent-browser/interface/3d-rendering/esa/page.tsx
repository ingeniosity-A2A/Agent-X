"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PartsCard } from "@/components/esa/PartsCard";
import { ServiceRequestCard } from "@/components/esa/ServiceRequestCard";
import { GreenShieldPanel } from "@/components/esa/GreenShieldPanel";
import { SendEmailButtons } from "@/components/esa/SendEmailButtons";
import { TodaysJobs } from "@/components/a2ui";
import type { TodayJob } from "@/components/a2ui/TodaysJobs";

type CardTab = "maintenance" | "inventory" | "todos";

/**
 * ESA rendering surface — Select Card (never "select console").
 * Cards: Daily To-Dos · Parts + Inventory · Service Request · Green Shield
 */
export default function ESARenderingCards() {
  const [card, setCard] = useState<CardTab>("maintenance");
  const [jobs, setJobs] = useState<TodayJob[]>([]);
  const [counts, setCounts] = useState({
    inProgress: 0,
    scheduled: 0,
    completed: 0,
  });
  const [mobileParts, setMobileParts] = useState(false);

  const loadTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      const d = await res.json();
      setJobs(d.jobs ?? []);
      setCounts(d.counts ?? { inProgress: 0, scheduled: 0, completed: 0 });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing refetch pattern (reload todos on card/toggle change); runtime deliberately untouched
    loadTodos();
  }, [loadTodos, card]);

  if (mobileParts) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="flex items-center justify-between border-b border-[#1e1e2e] px-3 py-2">
          <button
            type="button"
            className="text-xs text-[#00d4ff]"
            onClick={() => setMobileParts(false)}
          >
            ← Cards
          </button>
          <span className="text-xs text-[#888]">Parts Card · mobile</span>
        </div>
        <PartsCard mobileStandalone />
      </div>
    );
  }

  const cardBtn = (
    id: CardTab,
    label: string,
    hint: string,
    activeClass: string
  ) => (
    <button
      type="button"
      onClick={() => setCard(id)}
      className={`rounded-xl px-2 py-3 text-left text-xs sm:px-3 ${
        card === id ? activeClass : "hover:bg-[#1a1a24]"
      }`}
    >
      <span className="block font-medium">{label}</span>
      <span className="hidden text-[10px] text-[#666] sm:block">{hint}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-[#e8e8ed]">
      <aside className="flex w-16 shrink-0 flex-col border-r border-[#1e1e2e] bg-[#0d0d14] sm:w-56">
        <div className="border-b border-[#1e1e2e] px-3 py-4">
          <p className="hidden text-[10px] uppercase tracking-[0.15em] text-[#7c3aed] sm:block">
            Rendering Cards
          </p>
          <h1 className="hidden text-sm font-semibold sm:block">Select Card</h1>
          <p className="text-center text-xs font-semibold text-[#7c3aed] sm:hidden">Cards</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          <p className="hidden px-2 pb-1 text-[10px] uppercase tracking-wide text-[#444] sm:block">
            Cards
          </p>
          {cardBtn(
            "maintenance",
            "Maintenance Calls",
            "Requests · parts · follow-up",
            "bg-[#00d4ff]/15 text-[#00d4ff] ring-1 ring-[#00d4ff]/30"
          )}
          {cardBtn(
            "inventory",
            "Inventory",
            "Scan · order · catalog",
            "bg-[#7c3aed]/20 text-[#ddd] ring-1 ring-[#7c3aed]/40"
          )}
          {cardBtn(
            "todos",
            "Daily To-Do",
            "Jobs · Green Shield · checklist",
            "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40"
          )}
        </nav>

        <div className="space-y-2 border-t border-[#1e1e2e] p-2">
          <p className="hidden px-1 text-[10px] text-[#555] sm:block">Ava → manager</p>
          <p className="hidden truncate px-1 text-[9px] text-[#444] sm:block">ava007@agentmail.to</p>
          <p className="hidden truncate px-1 text-[9px] text-[#444] sm:block">→ bmccray02@gmail.com</p>
          <SendEmailButtons className="flex-col items-stretch" />
          <button
            type="button"
            onClick={() => setMobileParts(true)}
            className="w-full rounded-lg border border-[#2a2a3a] px-2 py-1.5 text-[10px] text-[#aaa]"
          >
            Mobile Parts Card
          </button>
          <Link
            href="/agent-browser/interface/3d-rendering/helpassembly"
            className="block rounded-lg border border-[#2a2a3a] px-2 py-1.5 text-center text-[10px] text-[#aaa]"
          >
            Help Assembly
          </Link>
          <Link href="/" className="block px-2 py-1 text-center text-[10px] text-[#555]">
            Home
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#555]">
          ESA Rendering Cards · {card === "maintenance" ? "Maintenance Calls Card" : card === "inventory" ? "Inventory Card" : "Daily To-Do Card"}
        </p>

        {card === "maintenance" && (
          <div className="mx-auto max-w-2xl">
            <ServiceRequestCard />
          </div>
        )}

        {card === "inventory" && (
          <div className="mx-auto max-w-2xl">
            <PartsCard />
          </div>
        )}

        {card === "todos" && (
          <div className="mx-auto max-w-5xl space-y-4">
            <TodaysJobs
              jobs={jobs}
              inProgress={counts.inProgress}
              scheduled={counts.scheduled}
              completed={counts.completed}
              greeting="Daily To-Do — service requests & open work"
            />
            <GreenShieldPanel />
          </div>
        )}
      </main>

    </div>
  );
}
