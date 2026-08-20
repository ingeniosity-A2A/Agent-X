"use client";

import type { A2UINode, JobCardData, InventoryCardData, CaptureCTAData } from "./types";
import { JobCard } from "./JobCard";
import { InventoryCard } from "./InventoryCard";
import { CaptureCTA } from "./CaptureCTA";

/**
 * Maps A2UI JSON nodes to React cards.
 * Unknown components render a safe fallback — never crash the surface.
 */
export function A2UIRenderer({
  node,
  className,
}: {
  node: A2UINode | null | undefined;
  className?: string;
}) {
  if (!node || !node.component) {
    return null;
  }

  const data = (node.data ?? {}) as Record<string, unknown>;

  switch (node.component) {
    case "JobCard":
      return (
        <div className={className}>
          <JobCard {...(data as unknown as JobCardData)} />
        </div>
      );
    case "InventoryCard":
      return (
        <div className={className}>
          <InventoryCard {...(data as unknown as InventoryCardData)} />
        </div>
      );
    case "CaptureCTA":
      return (
        <div className={className}>
          <CaptureCTA {...(data as unknown as CaptureCTAData)} />
        </div>
      );
    case "Stack":
      return (
        <div className={`flex flex-col gap-3 ${className ?? ""}`}>
          {(node.children ?? []).map((child, i) => (
            <A2UIRenderer key={i} node={child} />
          ))}
        </div>
      );
    default:
      return (
        <div
          className={`rounded-lg border border-dashed border-[#333] px-3 py-2 text-xs text-[#666] ${className ?? ""}`}
          data-a2ui-unknown={node.component}
        >
          Unknown A2UI component: {node.component}
        </div>
      );
  }
}
