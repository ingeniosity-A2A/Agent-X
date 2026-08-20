"use client";

import type { JobCardData } from "./types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  assigned: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  quoted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function JobCard({
  id,
  status,
  imageUrl,
  assigned,
  quote,
  createdAt,
  service,
  item,
  address,
}: JobCardData) {
  const statusClass =
    STATUS_STYLES[String(status).toLowerCase()] ??
    "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";

  return (
    <article
      className="overflow-hidden rounded-xl border border-[#1e1e2e] bg-[#12121a] shadow-sm"
      data-a2ui="JobCard"
      data-job-id={id}
    >
      {imageUrl ? (
        <div className="relative aspect-[16/10] bg-[#0a0a0f]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={item || service || `Job ${id}`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-[#0a0a0f] text-xs text-[#555]">
          No image
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-[#666]">{id}</p>
            <h3 className="mt-0.5 text-sm font-semibold text-[#e8e8ed]">
              {item || service || "Assembly job"}
            </h3>
            {service && item && (
              <p className="text-xs text-[#888]">{service}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusClass}`}
          >
            {status}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {assigned != null && assigned !== "" && (
            <>
              <dt className="text-[#555]">Assigned</dt>
              <dd className="text-right text-[#ccc]">{assigned}</dd>
            </>
          )}
          {quote != null && (
            <>
              <dt className="text-[#555]">Quote</dt>
              <dd className="text-right font-medium text-[#00d4ff]">
                ${Number(quote).toFixed(0)}
              </dd>
            </>
          )}
          {address && (
            <>
              <dt className="text-[#555]">Address</dt>
              <dd className="text-right text-[#aaa] line-clamp-2">{address}</dd>
            </>
          )}
          {createdAt && (
            <>
              <dt className="text-[#555]">Created</dt>
              <dd className="text-right text-[#888]">
                {formatWhen(createdAt)}
              </dd>
            </>
          )}
        </dl>
      </div>
    </article>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
