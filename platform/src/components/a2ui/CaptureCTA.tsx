"use client";

import Link from "next/link";
import type { CaptureCTAData } from "./types";

export function CaptureCTA({
  label = "Capture item",
  href = "/capture",
  hint = "Photo or file → job + A2UI card",
}: CaptureCTAData) {
  return (
    <Link
      href={href}
      data-a2ui="CaptureCTA"
      className="flex items-center justify-between gap-3 rounded-xl border border-[#2a2a3a] bg-[#0d0d14] px-4 py-3 transition hover:border-[#00d4ff]"
    >
      <div>
        <p className="text-sm font-medium text-[#e8e8ed]">{label}</p>
        {hint && <p className="text-xs text-[#666]">{hint}</p>}
      </div>
      <span className="text-[#00d4ff]" aria-hidden>
        →
      </span>
    </Link>
  );
}
