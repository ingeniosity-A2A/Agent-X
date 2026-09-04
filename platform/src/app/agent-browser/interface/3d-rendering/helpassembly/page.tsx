"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TodaysJobs, CaptureCTA, A2UIRenderer } from "@/components/a2ui";
import type { TodayJob } from "@/components/a2ui/TodaysJobs";
import type { A2UINode } from "@/components/a2ui/types";

/**
 * Agent Browser / Interface / 3D-Rendering / HelpAssembly
 * Help Assembly rendering surface (not Ava007 Dashboard).
 */
export default function HelpAssemblySurface() {
  const [jobs, setJobs] = useState<TodayJob[]>([]);
  const [counts, setCounts] = useState({
    inProgress: 0,
    scheduled: 0,
    completed: 0,
  });

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs ?? []);
        setCounts(d.counts ?? { inProgress: 0, scheduled: 0, completed: 0 });
      })
      .catch(() => {});
  }, []);

  const demo: A2UINode = {
    component: "JobCard",
    data: {
      id: "HA-demo",
      status: "scheduled",
      service: "Standard Assembly",
      item: "Sample booking",
      assigned: "Marcus",
      quote: 150,
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8ed]">
      <header className="border-b border-[#1e1e2e] bg-[#0d0d14] px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#7c3aed]">
              Agent-X · Interface · 3D-Rendering
            </p>
            <h1 className="text-lg font-semibold">Help Assembly</h1>
            <p className="text-xs text-[#666]">
              Services surface · bookings, capture, A2UI cards
            </p>
          </div>
          <nav className="flex gap-2 text-xs">
            <Link
              href="/agent-browser/interface/3d-rendering/esa"
              className="rounded-lg border border-[#2a2a3a] px-3 py-1.5 hover:border-[#00d4ff]"
            >
              ESA Maintenance
            </Link>
            <Link
              href="/capture"
              className="rounded-lg border border-[#2a2a3a] px-3 py-1.5 hover:border-[#00d4ff]"
            >
              Capture
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[#2a2a3a] px-3 py-1.5"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-12">
        <aside className="lg:col-span-5">
          <TodaysJobs
            jobs={jobs}
            inProgress={counts.inProgress}
            scheduled={counts.scheduled}
            completed={counts.completed}
          />
        </aside>
        <main className="space-y-4 lg:col-span-7">
          <CaptureCTA
            label="Assembly capture / ingest"
            href="/capture"
            hint="Photo → job card (Help Assembly)"
          />
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[#555]">
              A2UI preview
            </p>
            <A2UIRenderer node={demo} />
          </div>
        </main>
      </div>
    </div>
  );
}
