"use client";

import type { InventoryCardData } from "./types";

export function InventoryCard({
  sku,
  name,
  confidence,
  vendor,
  qty,
  imageUrl,
  agent,
  status,
}: InventoryCardData) {
  const conf =
    confidence != null ? Math.round(Number(confidence) * 100) : null;

  return (
    <article
      className="overflow-hidden rounded-xl border border-[#1e1e2e] bg-[#12121a]"
      data-a2ui="InventoryCard"
      data-sku={sku ?? undefined}
    >
      <div className="flex gap-3 p-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#0a0a0f]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[#444]">
              SKU
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-[#e8e8ed]">{name}</h3>
            {agent && (
              <span className="shrink-0 font-mono text-[10px] text-[#7c3aed]">
                {agent}
              </span>
            )}
          </div>
          {sku && (
            <p className="mt-0.5 font-mono text-[11px] text-[#666]">{sku}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#999]">
            {vendor && <span>{vendor}</span>}
            {qty != null && <span>qty {qty}</span>}
            {conf != null && (
              <span className="text-[#00d4ff]">{conf}% match</span>
            )}
            {status && <span className="capitalize">{status}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
