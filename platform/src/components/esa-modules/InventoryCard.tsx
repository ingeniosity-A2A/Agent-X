"use client";

import { useRef, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  Snowflake,
  Droplets,
  Refrigerator,
  DoorOpen,
  Zap,
  QrCode,
  ChevronRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import gsap from "gsap";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
export interface InventoryPart {
  id: string;
  sku: string;
  name: string;
  brand: string;
  qty: number;
  reorderPoint: number;
  image?: string | null;
  usageTags: string;
  locationBin?: string | null;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCardProps {
  part: InventoryPart;
  onSelect: (part: InventoryPart) => void;
  index: number;
}

/* ═══════════════════════════════════════════════════════════
   USAGE ICON MAP
   ═══════════════════════════════════════════════════════════ */
const USAGE_ICONS: Record<string, React.ElementType> = {
  HVAC: Snowflake,
  Plumbing: Droplets,
  Appliance: Refrigerator,
  "Door Hardware": DoorOpen,
  "Guest Room": Package,
  Corridor: Package,
  Kitchenette: Refrigerator,
  Rooftop: Snowflake,
  Electrical: Zap,
  Safety: AlertTriangle,
};

/* ═══════════════════════════════════════════════════════════
   INVENTORY CARD (evolved quote card)
   ═══════════════════════════════════════════════════════════ */
export function InventoryCard({ part, onSelect, index }: InventoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isLow = part.qty < part.reorderPoint;
  const tags = part.usageTags ? part.usageTags.split(",").map((t) => t.trim()) : [];

  // GSAP entrance animation (staggered barrel-roll)
  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      {
        opacity: 0,
        y: 30,
        rotateX: 15,
        scale: 0.92,
        transformPerspective: 600,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.6,
        delay: index * 0.08,
        ease: "power3.out",
      }
    );
  }, [index]);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: -4,
      scale: 1.015,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(part)}
      className={`ava-card cursor-pointer group p-[14px_16px] ${isLow ? "ava-card-low" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: "flex", gap: 12 }}
    >
      {/* Image placeholder */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          background: "rgba(39,39,42,0.8)",
          border: "1px solid rgba(63,63,70,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {part.image ? (
          <img
            src={part.image}
            alt={part.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Package className="w-6 h-6 text-zinc-500" />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: SKU + name + badge */}
        <div className="flex items-start justify-between gap-2">
          <div style={{ minWidth: 0 }}>
            <div className="text-[11px] font-mono tracking-wider ava-glow-cyan" style={{ color: "#22d3ee" }}>
              HD {part.sku}
            </div>
            <div className="text-[13px] font-medium text-zinc-100 leading-tight mt-0.5" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {part.name}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{part.brand}</div>
          </div>
          {isLow && (
            <span className="ava-pulse-low flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "rgba(234,179,8,0.15)", color: "#eab308", border: "1px solid rgba(234,179,8,0.3)", flexShrink: 0 }}>
              <AlertTriangle className="w-3 h-3" /> LOW
            </span>
          )}
        </div>

        {/* Bottom row: qty + bin + tags */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <div className="font-mono">
              <span className={`text-[15px] font-bold ${isLow ? "text-yellow-500" : "text-emerald-400"}`}>
                {part.qty}
              </span>
              <span className="text-[10px] text-zinc-500 ml-1">/ {part.reorderPoint} min</span>
            </div>
            {part.locationBin && (
              <span className="text-[9px] font-mono text-zinc-500 px-1.5 py-0.5 rounded" style={{ background: "rgba(24,24,27,0.8)" }}>
                BIN {part.locationBin}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {tags.slice(0, 2).map((tag) => {
              const Icon = USAGE_ICONS[tag] || Package;
              return (
                <span
                  key={tag}
                  title={tag}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(24,24,27,0.8)" }}
                >
                  <Icon className="w-3 h-3 text-zinc-400" />
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STAT PILL
   ═══════════════════════════════════════════════════════════ */
export interface StatPillProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
  delay?: number;
}

export function StatPill({ label, value, color, icon: Icon, delay = 0 }: StatPillProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, x: -20, scale: 0.9 },
      { opacity: 1, x: 0, scale: 1, duration: 0.5, delay, ease: "power2.out" }
    );
  }, [delay]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: "rgba(24,24,27,0.7)", border: `1px solid ${color}33` }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
        <div className="text-[14px] font-semibold font-mono" style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PART DETAIL SHEET CONTENT
   ═══════════════════════════════════════════════════════════ */
export interface PartDetailContentProps {
  part: InventoryPart;
  onReceive: (part: InventoryPart) => void;
  onReorder: (part: InventoryPart) => void;
  onAdjustQty: (part: InventoryPart, delta: number) => void;
  onClose: () => void;
}

export function PartDetailContent({
  part,
  onReceive,
  onReorder,
  onAdjustQty,
}: PartDetailContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLow = part.qty < part.reorderPoint;
  const tags = part.usageTags ? part.usageTags.split(",").map((t) => t.trim()) : [];

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 40, rotateX: -8, transformPerspective: 600 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.7, ease: "power3.out" }
    );
  }, []);

  return (
    <div ref={containerRef} className="p-5 space-y-5 ava-scroll" style={{ maxHeight: "80vh", overflowY: "auto" }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="relative ava-scanlines"
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: "rgba(39,39,42,0.8)",
            border: "1px solid rgba(63,63,70,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {part.image ? (
            <img src={part.image} alt={part.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} />
          ) : (
            <Package className="w-8 h-8 text-zinc-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono tracking-wider ava-glow-cyan" style={{ color: "#22d3ee" }}>
            HD {part.sku}
          </div>
          <div className="text-[16px] font-semibold text-zinc-100 mt-1">{part.name}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{part.brand}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => {
              const Icon = USAGE_ICONS[tag] || Package;
              return (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono"
                  style={{ background: "rgba(39,39,42,0.8)", border: "1px solid rgba(63,63,70,0.4)", color: "#a1a1aa" }}
                >
                  <Icon className="w-3 h-3" />
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* QR / Barcode placeholder */}
      <div
        className="flex items-center justify-center rounded-xl p-4 ava-scanlines"
        style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(63,63,70,0.4)" }}
      >
        <div className="text-center">
          <QrCode className="w-16 h-16 mx-auto text-zinc-600" />
          <div className="text-[10px] font-mono text-zinc-500 mt-2">{part.sku}</div>
          <div className="text-[9px] font-mono text-zinc-600 mt-0.5">SCAN TO LOOKUP</div>
        </div>
      </div>

      {/* Stock Level */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">Stock Level</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg overflow-hidden" style={{ height: 8, background: "rgba(39,39,42,0.8)" }}>
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${Math.min((part.qty / (part.reorderPoint * 2)) * 100, 100)}%`,
                background: isLow ? "linear-gradient(90deg, #eab308, #facc15)" : "linear-gradient(90deg, #10b981, #34d399)",
              }}
            />
          </div>
          <span className={`text-[13px] font-bold font-mono ${isLow ? "text-yellow-500" : "text-emerald-400"}`}>
            {part.qty}
          </span>
        </div>
        <div className="text-[10px] text-zinc-600 font-mono">Reorder at: {part.reorderPoint} units</div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3" style={{ background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.3)" }}>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Location</div>
          <div className="text-[13px] font-mono text-zinc-300 mt-0.5">{part.locationBin || "Unassigned"}</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.3)" }}>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Last Updated</div>
          <div className="text-[13px] font-mono text-zinc-300 mt-0.5">
            {new Date(part.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Quick quantity adjust */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">Quick Adjust</div>
        <div className="flex gap-2">
          <button
            onClick={() => onAdjustQty(part, -1)}
            className="ava-neu-btn flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-semibold text-red-400"
          >
            -1
          </button>
          <button
            onClick={() => onAdjustQty(part, 1)}
            className="ava-neu-btn flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-semibold text-emerald-400"
          >
            +1
          </button>
          <button
            onClick={() => onReceive(part)}
            className="ava-neu-btn flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Receive Shipment
          </button>
        </div>
      </div>

      {/* Reorder button */}
      {isLow && (
        <button
          onClick={() => onReorder(part)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white ava-reorder-glow"
          style={{ background: "linear-gradient(135deg, #22c55e, #166534)", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          <ExternalLink className="w-4 h-4" />
          Quick Reorder via HD Supply Punch-In
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
