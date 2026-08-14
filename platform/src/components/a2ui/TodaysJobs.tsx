"use client";

/**
 * Detached "Today's Jobs" list card.
 * NOT connected to ESA Input Ingestion — schedule/ops observation only.
 */

export type TodayJob = {
  id: string;
  title: string;
  timeRange: string;
  service: string;
  status: "in_progress" | "scheduled" | "completed" | string;
  assigneeAvatar?: string | null;
  assigneeName?: string | null;
};

const STATUS_BAR: Record<string, string> = {
  in_progress: "bg-amber-400",
  scheduled: "bg-sky-400",
  completed: "bg-emerald-400",
};

export function TodaysJobs({
  jobs,
  inProgress = 0,
  scheduled = 0,
  completed = 0,
  greeting = "Good morning, here's what's happening today",
  onViewAll,
}: {
  jobs: TodayJob[];
  inProgress?: number;
  scheduled?: number;
  completed?: number;
  greeting?: string;
  onViewAll?: () => void;
}) {
  return (
    <section
      className="rounded-2xl border border-[#e8e8ec] bg-white text-[#1a1a1a] shadow-sm"
      data-surface="todays-jobs"
      data-ingestion="detached"
    >
      <div className="border-b border-[#f0f0f3] px-5 py-4">
        <p className="text-sm text-[#6b6b76]">
          <span className="font-medium text-[#1a1a1a]">
            {greeting.split(",")[0]}
          </span>
          {greeting.includes(",") ? (
            <span>,{greeting.slice(greeting.indexOf(",") + 1)}</span>
          ) : null}
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Today&apos;s Jobs</h2>
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm text-[#6b6b76] hover:text-[#1a1a1a]"
          >
            View All &gt;
          </button>
        </div>

        <div className="mb-3 flex gap-4 text-sm">
          <span className="font-medium text-[#1a1a1a]">
            In Progress ({inProgress})
          </span>
          <span className="text-[#9a9aa3]">Scheduled ({scheduled})</span>
          <span className="text-[#9a9aa3]">Completed ({completed})</span>
        </div>

        <ul className="space-y-2">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="flex items-center gap-3 rounded-xl border border-[#f0f0f3] bg-[#fafafa] px-3 py-2.5"
            >
              <span
                className={`h-10 w-1 shrink-0 rounded-full ${
                  STATUS_BAR[j.status] ?? "bg-zinc-300"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{j.title}</p>
                <p className="truncate text-xs text-[#8a8a93]">
                  {j.timeRange}
                  <span className="mx-1.5">·</span>
                  {j.service}
                </p>
              </div>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-400 text-xs font-semibold text-white"
                title={j.assigneeName ?? undefined}
              >
                {j.assigneeAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={j.assigneeAvatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (j.assigneeName ?? "?").slice(0, 1).toUpperCase()
                )}
              </div>
            </li>
          ))}
          {jobs.length === 0 && (
            <li className="rounded-xl border border-dashed border-[#e8e8ec] px-3 py-6 text-center text-sm text-[#9a9aa3]">
              No jobs scheduled today
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
