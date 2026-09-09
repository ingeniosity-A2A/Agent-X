"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import {
  Package,
  Hash,
  MapPin,
  FileText,
  Building2,
  Truck,
  Mail,
} from "lucide-react";
import { StepperWheel } from "./StepperWheel";
import "./esa-input-interface.css";

/* ═══════════════════════════════════════════════════════════
   INVENTORY PART CARD — ESA Field Tech Edition
   
   Layout: header row (logo + status pill), product name, 3D model zone
   with meta column + metal stepper on right, specs grid, priority row,
   reorder qty + Order / Reorder console + Order Request Complete.
   
   Area/Room is a mandatory field. AVA prompts for it; N/A ok for
   first-time orders and inventory.
   ═══════════════════════════════════════════════════════════ */

export interface PartItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  qty: number;
  reorderPoint: number;
  installMin: number;
  techs: number;
  dataSheet: string;
  priority: string;
  bin?: string;
  /** HD Supply Part Number — primary metadata */
  partNumber: string;
  /** Area / Room — mandatory field, N/A ok for first orders */
  areaRoom: string;
  /** Image data-URL from camera/upload, displayed in 3D zone */
  image?: string | null;
  /** GLB model URL for THREE.js loader.load() */
  modelUrl?: string | null;
}

interface InventoryPartCardProps {
  parts: PartItem[];
  onReorderNow?: (partIndex: number) => void;
  onReorderLater?: (partIndex: number) => void;
  onImageCapture?: () => void;
  onBarcodeScan?: () => void;
  onPartSelect?: (part: PartItem) => void;
  /**
   * Inventory mode flag from ESAInputInterface.
   * When true: card builds a live inventory list, generates shareable link
   * for manager, tracks loss prevention (expected vs actual counts).
   * When false: normal parts ordering with Order/Reorder flow.
   */
  inventoryMode?: boolean;
  /**
   * Called when the complete button is tapped.
   * Parts mode: sends order request PDF via email.
   * Inventory mode: creates inventory list + generates live shareable link.
   */
  onOrderComplete?: (parts: PartItem[]) => void;
}

/* ── palette ─────────────────────────────────── */
const C = {
  ink: "#0d0d0d",
  paper: "#f5f0eb",
  warm: "#c8a882",
  accent: "#b07d4f",
  muted: "rgba(13,13,13,0.35)",
  glass: "rgba(245,240,235,0.08)",
  border: "rgba(200,168,130,0.18)",
  glow: "rgba(200,168,130,0.25)",
  status: "#7ec8a0",
  anim: "cubic-bezier(0.22, 1, 0.36, 1)",
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ── Animate number counter ────────────────── */
function useCounter(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const ref = useRef(target);

  useEffect(() => {
    const obj = { val: ref.current };
    gsap.to(obj, {
      val: target,
      duration: duration / 1000,
      ease: "power2.out",
      onUpdate: () => setDisplay(Math.round(obj.val)),
    });
    ref.current = target;
  }, [target, duration]);

  return display;
}

/* ── STATUS COLORS ─────────────────────────── */
const STATUS_MAP: Record<string, { color: string; label: string }> = {
  matching: { color: "#d9a441", label: "Matching SKU" },
  ready: { color: C.status, label: "In Stock" },
  reordered: { color: C.warm, label: "Reordered" },
  low: { color: "#ef4444", label: "Low Stock" },
};

/* ═════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function InventoryPartCard({
  parts,
  onReorderNow,
  onReorderLater,
  onImageCapture,
  onBarcodeScan,
  onPartSelect,
  inventoryMode = false,
  onOrderComplete,
}: InventoryPartCardProps) {
  const [idx, setIdx] = useState(0);
  const [priority, setPriority] = useState("standard");
  const [cardState, setCardState] = useState<"matching" | "ready" | "reordered">("ready");
  const [reorderMode, setReorderMode] = useState<"now" | "later" | null>(null);


  const cardWrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const qtyRef = useRef<HTMLSpanElement>(null);

  const part = parts[idx];
  const totalParts = parts.length;

  // Animated reorder qty counter
  const displayQty = useCounter(part.qty + (priority === "expedited" ? 2 : priority === "emergency" ? 5 : 0));

  const applyPart = useCallback((i: number) => {
    setIdx(i);
    setReorderMode(null);
    setCardState("ready");
  }, []);

  // GSAP card entrance
  useEffect(() => {
    if (!cardWrapRef.current) return;
    gsap.fromTo(
      cardWrapRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: C.anim as string }
    );
  }, []);

  // Tilt effect
  useEffect(() => {
    const el = cardWrapRef.current;
    if (!el) return;
    let bounds: DOMRect | null = null;

    const onMove = (e: MouseEvent) => {
      if (!bounds) bounds = el.getBoundingClientRect();
      const rx = ((e.clientY - bounds.top - bounds.height / 2) / bounds.height) * -8;
      const ry = ((e.clientX - bounds.left - bounds.width / 2) / bounds.width) * 8;
      gsap.to(el, { rotateX: rx, rotateY: ry, duration: 0.3, ease: "power2.out" });
    };
    const onLeave = () => {
      bounds = null;
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.5, ease: C.anim as string });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);



  const handlePriorityClick = (p: string) => {
    setPriority(p);
  };

  const handleReorderNow = () => {
    setReorderMode("now");
    setCardState("reordered");
    onReorderNow?.(idx);
  };

  const handleReorderLater = () => {
    setReorderMode("later");
    setCardState("reordered");
    onReorderLater?.(idx);
  };

  const handleOrderComplete = () => {
    onOrderComplete?.(parts);
  };

  const statusInfo = part.qty < part.reorderPoint
    ? STATUS_MAP.low
    : STATUS_MAP[cardState] || STATUS_MAP.ready;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "transparent", padding: "0 1rem" }}>
      {/* Card Wrap (tilt target) */}
      <div ref={cardWrapRef} style={{ position: "relative", transformStyle: "preserve-3d" as React.CSSProperties }}>
        {/* Card */}
        <div
          ref={cardRef}
          className="main-glass-panel"
          style={{
            borderRadius: "2rem",
            padding: "0.8rem 1rem",
            width: "26rem",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Top shimmer */}
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(200,168,130,0.5), transparent)" }} />

          {/* Ambient blob */}
          <div style={{ position: "absolute", width: "12rem", height: "12rem", background: "radial-gradient(circle, rgba(176,125,79,0.18) 0%, transparent 70%)", top: "-3rem", right: "-3rem", pointerEvents: "none", borderRadius: "50%" }} />

          {/* ── Header Row ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
            {/* ESA Logo (text-based) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.92, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))" }}>
              <Building2 style={{ width: 22, height: 22, color: C.warm }} />
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: C.paper, letterSpacing: "0.04em", lineHeight: 1.1 }}>
                  EXTENDED STAY
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.42rem", fontWeight: 500, color: C.warm, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.1 }}>
                  America
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.3rem",
              background: `linear-gradient(135deg, ${statusInfo.color}22, ${statusInfo.color}14)`,
              border: `1px solid ${statusInfo.color}44`,
              borderRadius: "3rem", padding: "0.18rem 0.55rem",
              fontSize: "0.5rem", fontWeight: 600, color: statusInfo.color,
              letterSpacing: "0.08rem", textTransform: "uppercase",
            }}>
              <div style={{ width: "0.35rem", height: "0.35rem", background: statusInfo.color, borderRadius: "50%", boxShadow: `0 0 6px ${statusInfo.color}`, animation: "ipc-pulse 1.4s ease infinite" }} />
              {statusInfo.label}
            </div>
          </div>

          {/* Product Name */}
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.55rem", lineHeight: 1.15, margin: "0.6rem 0 0.15rem", letterSpacing: "-0.02rem", color: C.paper }}>
            {part.name.split(" – ").map((seg, i) =>
              i === 1 ? <em key={i} style={{ color: C.warm, fontStyle: "italic" }}>{seg}</em> : <span key={i}>{seg}</span>
            )}
          </div>
          <div style={{ fontSize: "0.62rem", color: "rgba(245,240,235,0.35)", letterSpacing: "0.04rem", textTransform: "uppercase" }}>
            {part.sku} · {part.brand}{part.bin ? ` · BIN ${part.bin}` : ""}
          </div>

          {/* ── Service Middle: Meta + 3D Model + Fitness Stepper ── */}
          <div style={{ display: "flex", alignItems: "stretch", gap: "0.5rem", height: "9rem", margin: "0.3rem 0", position: "relative", paddingRight: "2.5rem" }}>
            {/* Meta Column */}
            <div style={{ width: "5.6rem", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0.1rem 0" }}>
              {/* Part Number — replaces Assembly Time */}
              <MetaItem icon={<Hash style={{ width: 12, height: 12 }} />} label="Part Number" value={part.partNumber || part.sku} highlight />
              {/* Area/Room — replaces Techs, mandatory field */}
              <MetaItem icon={<MapPin style={{ width: 12, height: 12 }} />} label="Area / Room" value={part.areaRoom || "—"} required />
              <MetaItem icon={<FileText style={{ width: 12, height: 12 }} />} label="Data Sheet" value={part.dataSheet} />
              <div className="ipc-status-mini" style={{ color: statusInfo.color }}>
                <div className="ipc-status-dot" style={{ background: statusInfo.color, boxShadow: `0 0 6px ${statusInfo.color}`, width: "0.3rem", height: "0.3rem", borderRadius: "50%", animation: "ipc-pulse 1.4s ease infinite" }} />
                <span style={{ fontSize: "0.58rem" }}>{statusInfo.label}</span>
              </div>
            </div>

            {/* 3D Model / Image Zone */}
            <div style={{ position: "relative", flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
              <div
                className="glass-subcard"
                style={{
                  width: "100%", height: "100%",
                  borderRadius: "1rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {part.image ? (
                  <img
                    src={part.image}
                    alt={part.name}
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      borderRadius: "1rem",
                      filter: "contrast(1.1) saturate(0.8)",
                    }}
                  />
                ) : part.modelUrl ? (
                  /* 3D model placeholder — in production: THREE.js loader.load(part.modelUrl) */
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                    <Package style={{ width: 48, height: 48, color: "rgba(200,168,130,0.3)" }} />
                    <span style={{ fontSize: "0.4rem", color: "rgba(200,168,130,0.2)", fontFamily: "monospace" }}>
                      loader.load(&quot;{part.modelUrl}&quot;)
                    </span>
                  </div>
                ) : null}
              </div>
              {/* Rendering area — no overlay icons, wired to Cybernetic Ingestion Interface */}
              {/* Model shadow */}
              <div style={{ position: "absolute", bottom: "0.25rem", left: "50%", transform: "translateX(-50%)", width: "7rem", height: "1.2rem", background: "radial-gradient(ellipse, rgba(176,125,79,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
            </div>

            {/* Fitness Stepper Wheel — proximity-scaled bars */}
            {totalParts > 1 && (
              <StepperWheel
                items={parts.map((p) => p.name.split(" – ")[0])}
                activeItemIndex={idx}
                onSelectStep={applyPart}
                stepCount={Math.min(parts.length * 4, 22)}
                style={{
                  width: "2.5rem",
                  height: "100%",
                }}
              />
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, margin: "0.4rem 0" }} />

          {/* ── Priority Row ── */}
          {(
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.55rem", letterSpacing: "0.1rem", textTransform: "uppercase", color: "rgba(245,240,235,0.35)", flexShrink: 0 }}>Priority</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[
                  { key: "standard", label: "Standard" },
                  { key: "expedited", label: "Expedited" },
                  { key: "emergency", label: "Emergency" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePriorityClick(p.key)}
                    className="ipc-priority-chip"
                    style={{
                      padding: "0.25rem 0.55rem", borderRadius: "3rem",
                      border: `1px solid ${priority === p.key ? C.warm : C.border}`,
                      background: priority === p.key ? `${C.warm}22` : C.glass,
                      fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.02rem",
                      color: priority === p.key ? C.warm : "rgba(245,240,235,0.55)",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, margin: "0.4rem 0" }} />

          {/* ── Reorder Qty + On Hand / ETA inline ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.1rem", textTransform: "uppercase", color: "rgba(245,240,235,0.35)", marginBottom: "0.25rem" }}>
                {"Reorder Quantity"}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
                <span ref={qtyRef} style={{ fontSize: "2rem", fontWeight: 700, color: C.paper, fontFamily: "'DM Sans', sans-serif" }}>
                  {displayQty}
                </span>
                <span style={{ fontSize: "0.55rem", color: "rgba(245,240,235,0.3)", marginLeft: "0.3rem" }}>units</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="glass-subcard" style={{ display: "flex", alignItems: "center", gap: "0.3rem", borderRadius: "0.5rem", padding: "0.3rem 0.55rem" }}>
                <Package style={{ width: 11, height: 11, color: C.warm }} />
                <span style={{ fontSize: "0.48rem", letterSpacing: "0.06rem", textTransform: "uppercase", color: "rgba(245,240,235,0.35)" }}>On Hand</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: C.paper }}>{part.qty}</span>
              </div>
              <div className="glass-subcard" style={{ display: "flex", alignItems: "center", gap: "0.3rem", borderRadius: "0.5rem", padding: "0.3rem 0.55rem" }}>
                <Truck style={{ width: 11, height: 11, color: C.warm }} />
                <span style={{ fontSize: "0.48rem", letterSpacing: "0.06rem", textTransform: "uppercase", color: "rgba(245,240,235,0.35)" }}>ETA</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: C.paper }}>2-3 days</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, margin: "0.4rem 0" }} />

          {/* ── Bottom Action Buttons ── */}
          <div className="glass-control-bar" style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "0.4rem", height: "0.4rem", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "ipc-greenPulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.08rem", textTransform: "uppercase", color: C.status }}>
                {"HD Supply Connected"}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <React.Fragment>
                  <button
                    onClick={handleReorderNow}
                    className="ipc-book-btn"
                    style={{
                      padding: "0.35rem 0.8rem", borderRadius: "0.75rem",
                      background: reorderMode === "now" ? "linear-gradient(135deg, #c9a84c, #8a6a1a)" : C.glass,
                      border: `1px solid ${reorderMode === "now" ? C.warm : C.border}`,
                      color: reorderMode === "now" ? C.ink : C.paper,
                      fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06rem",
                      cursor: "pointer", transition: "all 0.25s",
                    }}
                  >
                    Order
                  </button>
                  <button
                    onClick={handleReorderLater}
                    className="ipc-book-btn"
                    style={{
                      padding: "0.35rem 0.8rem", borderRadius: "0.75rem",
                      background: reorderMode === "later" ? "linear-gradient(135deg, #c9a84c, #8a6a1a)" : C.glass,
                      border: `1px solid ${reorderMode === "later" ? C.warm : C.border}`,
                      color: reorderMode === "later" ? C.ink : C.paper,
                      fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06rem",
                      cursor: "pointer", transition: "all 0.25s",
                    }}
                  >
                    Reorder
                  </button>
                </React.Fragment>
            </div>
          </div>

          {/* ── Complete Button ── */}
          <button
            onClick={handleOrderComplete}
            className="glass-btn-pay ipc-order-complete-btn"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              width: "100%", marginTop: "0.8rem",
              padding: "0.5rem 1rem", borderRadius: "0.75rem",
              fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.06rem", cursor: "pointer", transition: "all 0.25s",
            }}
          >
            <Mail style={{ width: 14, height: 14 }} />
            {"Order Request Complete — Send PDF"}
          </button>
        </div>
      </div>

      {/* Hint */}
      <p style={{ marginTop: "0.4rem", fontSize: "0.65rem", fontFamily: "monospace", color: "rgba(200,168,130,0.3)" }}>
        {`Scan barcode or upload part photo → <code style={{ color: "rgba(200,168,130,0.5)" }}>loader.load(&quot;your-part.glb&quot;)</code>`}
      </p>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes ipc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes ipc-greenPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes ipc-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ipc-order-complete-btn:hover {
          box-shadow: 0 0 24px rgba(34,197,94,0.35);
          transform: translateY(-1px);
        }
        .ipc-order-complete-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

/* ── SUB-COMPONENTS ────────────────────────── */

function MetaItem({ icon, label, value, highlight, required }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean; required?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
      <div style={{ flexShrink: 0, color: highlight ? "#22d3ee" : C.warm, opacity: 0.85, marginTop: "0.12rem" }}>{icon}</div>
      <div>
        <div style={{ fontSize: "0.42rem", letterSpacing: "0.08rem", textTransform: "uppercase", color: "rgba(245,240,235,0.35)", marginBottom: "0.15rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.2rem" }}>
          {label}
          {required && (
            <span style={{ color: "#ef4444", fontSize: "0.5rem", lineHeight: 1 }}>*</span>
          )}
        </div>
        <div style={{ fontSize: "0.6rem", fontWeight: highlight ? 700 : 600, lineHeight: 1.25, color: highlight ? "#22d3ee" : C.paper }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SpecBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        background: C.glass,
        border: `1px solid ${C.border}`,
        borderRadius: "0.75rem",
        padding: "0.6rem 0.5rem",
        textAlign: "center",
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem", marginBottom: "0.35rem" }}>
        {icon}
        <span style={{ fontSize: "0.5rem", letterSpacing: "0.1rem", textTransform: "uppercase", color: "rgba(245,240,235,0.35)" }}>{label}</span>
      </div>
      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.paper, letterSpacing: "-0.01rem" }}>{value}</div>
    </div>
  );
}

/* ── Demo data ─────────────────────────── */
export const DEMO_PARTS: PartItem[] = [
  { id: "p1", sku: "HD-88421", name: "Thermostat – Digital Programmable", brand: "Honeywell", qty: 3, reorderPoint: 5, installMin: 15, techs: 1, dataSheet: "Included", priority: "standard", bin: "A-12", partNumber: "88421", areaRoom: "Room 204" },
  { id: "p2", sku: "HD-33109", name: "Cartridge – Single Lever Faucet", brand: "Moen", qty: 8, reorderPoint: 6, installMin: 25, techs: 1, dataSheet: "Attached", priority: "standard", bin: "B-04", partNumber: "33109", areaRoom: "Kitchen 101" },
  { id: "p3", sku: "HD-55217", name: "Door Closer – Heavy Duty", brand: "LCN", qty: 2, reorderPoint: 4, installMin: 30, techs: 2, dataSheet: "Included", priority: "standard", bin: "C-01", partNumber: "55217", areaRoom: "Lobby" },
  { id: "p4", sku: "HD-77630", name: "Air Filter – 20×25×1 MERV-8", brand: "Filtrete", qty: 24, reorderPoint: 12, installMin: 5, techs: 1, dataSheet: "Included", priority: "standard", bin: "A-01", partNumber: "77630", areaRoom: "HVAC Room" },
];
