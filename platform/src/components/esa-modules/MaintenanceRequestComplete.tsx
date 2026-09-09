"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import {
  CheckCircle2,
  Clock,
  User,
  CalendarDays,
  MessageSquare,
  Building2,
  Wrench,
  ChevronDown,
  Minus,
  Plus,
  PackageOpen,
  X,
} from "lucide-react";
import { StepperWheel } from "./StepperWheel";

/* ═══════════════════════════════════════════════════════════
   MAINTENANCE REQUEST COMPLETE CARD — ESA Field Tech Edition

   Based on the paper Maintenance Request Form (bilingual EN/ES).
   Stepper wheel scrubs through separate requests.
   27 icon grid represents inventory categories.
   3 dropdowns below 3D zone for parts used with live inventory.
   Mark Complete / Waiting for Supplies status flow.
   ═══════════════════════════════════════════════════════════ */

/* ── Types ──────────────────────────────── */

export interface MaintenanceRequest {
  id: string;
  roomNumber: string;
  requestedBy: string;
  date: string;
  remarks: string;
  status: "completed" | "waiting_supplies";
  partsUsed: PartUsed[];
}

export interface PartUsed {
  partName: string;
  categoryId: number;
  qty: number;
}

interface MaintenanceRequestCompleteProps {
  requests: MaintenanceRequest[];
  inventory: InventoryItem[];
  onStatusChange?: (requestId: string, status: "completed" | "waiting_supplies") => void;
  onPartsUsedChange?: (requestId: string, parts: PartUsed[]) => void;
  onRequestSubmit?: (request: MaintenanceRequest) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  sku: string;
}

/* ── The 27 ESA Maintenance Categories ── */
export const ESA_CATEGORIES = [
  { id: 1, name: "Wallpaper", icon: "🧱" },
  { id: 2, name: "Telephone", icon: "📞" },
  { id: 3, name: "Television", icon: "📺" },
  { id: 4, name: "Faucet", icon: "🚰" },
  { id: 5, name: "Lights", icon: "💡" },
  { id: 6, name: "Drapes", icon: "🪟" },
  { id: 7, name: "Table", icon: "🪑" },
  { id: 8, name: "Picture", icon: "🖼️" },
  { id: 9, name: "Drawers", icon: "🗄️" },
  { id: 10, name: "Toilet", icon: "🚽" },
  { id: 11, name: "Door", icon: "🚪" },
  { id: 12, name: "Carpet", icon: "🟫" },
  { id: 13, name: "Radio", icon: "📻" },
  { id: 14, name: "Remote", icon: "📡" },
  { id: 15, name: "Thermostat", icon: "🌡️" },
  { id: 16, name: "Light Switch", icon: "🔘" },
  { id: 17, name: "Refrigerator", icon: "🧊" },
  { id: 18, name: "Vents", icon: "🌀" },
  { id: 19, name: "Sink", icon: "🚿" },
  { id: 20, name: "Microwave", icon: "📦" },
  { id: 21, name: "Bath Tub", icon: "🛁" },
  { id: 22, name: "Chair", icon: "💺" },
  { id: 23, name: "Sofa", icon: "🛋️" },
  { id: 24, name: "Bed", icon: "🛏️" },
  { id: 25, name: "Ice Machine", icon: "🧊" },
  { id: 26, name: "Door Locks", icon: "🔒" },
  { id: 27, name: "Security Bar", icon: "🛡️" },
] as const;

/* ── Palette (matches InventoryPartCard) ── */
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
  waiting: "#d9a441",
  completed: "#7ec8a0",
  anim: "cubic-bezier(0.22, 1, 0.36, 1)",
};

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  completed: { color: C.completed, label: "Completed" },
  waiting_supplies: { color: C.waiting, label: "Waiting for Supplies" },
};

/* ── Demo data ─────────────────────────── */
export const DEMO_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  {
    id: "mr-001",
    roomNumber: "126",
    requestedBy: "Abdou",
    date: "2026-08-02",
    remarks: "PM Process — preventive maintenance full room check",
    status: "completed",
    partsUsed: [
      { partName: "Air Filter – 20x25x1 MERV-8", categoryId: 18, qty: 2 },
      { partName: "Faucet Cartridge – Single Lever", categoryId: 4, qty: 1 },
    ],
  },
  {
    id: "mr-002",
    roomNumber: "204",
    requestedBy: "Maria G.",
    date: "2026-08-03",
    remarks: "Guest reported AC not cooling, thermostat unresponsive",
    status: "waiting_supplies",
    partsUsed: [
      { partName: "Thermostat – Digital Programmable", categoryId: 15, qty: 1 },
    ],
  },
  {
    id: "mr-003",
    roomNumber: "312",
    requestedBy: "James T.",
    date: "2026-08-03",
    remarks: "Bathroom faucet leaking, carpet stain near entrance",
    status: "completed",
    partsUsed: [
      { partName: "Faucet Cartridge – Single Lever", categoryId: 4, qty: 1 },
      { partName: "Carpet Cleaner – Commercial Grade", categoryId: 12, qty: 1 },
    ],
  },
  {
    id: "mr-004",
    roomNumber: "108",
    requestedBy: "Keisha W.",
    date: "2026-08-04",
    remarks: "Door lock jammed, security bar loose on window",
    status: "waiting_supplies",
    partsUsed: [
      { partName: "Door Lock – Deadbolt Replacement", categoryId: 26, qty: 1 },
      { partName: "Security Bar – Window Mount", categoryId: 27, qty: 2 },
    ],
  },
];

export const DEMO_INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Air Filter – 20x25x1 MERV-8", category: "Vents", qty: 24, sku: "HD-77630" },
  { id: "inv-2", name: "Faucet Cartridge – Single Lever", category: "Faucet", qty: 8, sku: "HD-33109" },
  { id: "inv-3", name: "Thermostat – Digital Programmable", category: "Thermostat", qty: 3, sku: "HD-88421" },
  { id: "inv-4", name: "Door Lock – Deadbolt Replacement", category: "Door Locks", qty: 2, sku: "HD-55217" },
  { id: "inv-5", name: "Security Bar – Window Mount", category: "Security Bar", qty: 6, sku: "HD-66102" },
  { id: "inv-6", name: "Carpet Cleaner – Commercial Grade", category: "Carpet", qty: 4, sku: "HD-22045" },
  { id: "inv-7", name: "Light Switch – Toggle Single Pole", category: "Light Switch", qty: 15, sku: "HD-11030" },
  { id: "inv-8", name: "Refrigerator Shelf – Glass", category: "Refrigerator", qty: 5, sku: "HD-33412" },
  { id: "inv-9", name: "Microwave Plate – 12 inch Turntable", category: "Microwave", qty: 3, sku: "HD-44501" },
  { id: "inv-10", name: "Showerhead – Adjustable Spray", category: "Bath Tub", qty: 7, sku: "HD-55210" },
  { id: "inv-11", name: "Drapes – Standard Room Darkening", category: "Drapes", qty: 10, sku: "HD-66001" },
  { id: "inv-12", name: "Wallpaper Patch Kit", category: "Wallpaper", qty: 12, sku: "HD-11050" },
];

/* ═════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function MaintenanceRequestComplete({
  requests = DEMO_MAINTENANCE_REQUESTS,
  inventory = DEMO_INVENTORY,
  onStatusChange,
  onPartsUsedChange,
  onRequestSubmit,
}: MaintenanceRequestCompleteProps) {
  const [idx, setIdx] = useState(0);
  const [showDropdowns, setShowDropdowns] = useState(false);
  const [selectedParts, setSelectedParts] = useState<PartUsed[]>([]);
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(inventory);
  const cardWrapRef = useRef<HTMLDivElement>(null);

  const req = requests[idx];
  const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.completed;

  const applyRequest = useCallback((i: number) => {
    setIdx(i);
    setShowDropdowns(false);
    setSelectedParts(requests[i].partsUsed);
  }, [requests]);

  // Sync selected parts when request changes
  useEffect(() => {
    setSelectedParts(req.partsUsed);
  }, [req.partsUsed]);

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

  // Handle adding a part from dropdown
  const handleAddPart = (invItem: InventoryItem) => {
    const existing = selectedParts.find((p) => p.partName === invItem.name);
    if (existing) {
      // Increment qty
      const updated = selectedParts.map((p) =>
        p.partName === invItem.name ? { ...p, qty: p.qty + 1 } : p
      );
      setSelectedParts(updated);
      // Decrement inventory
      setLocalInventory((prev) =>
        prev.map((i) => (i.id === invItem.id ? { ...i, qty: i.qty - 1 } : i))
      );
    } else {
      const catMatch = ESA_CATEGORIES.find(
        (c) => c.name.toLowerCase() === invItem.category.toLowerCase()
      );
      setSelectedParts([
        ...selectedParts,
        {
          partName: invItem.name,
          categoryId: catMatch?.id ?? 1,
          qty: 1,
        },
      ]);
      setLocalInventory((prev) =>
        prev.map((i) => (i.id === invItem.id ? { ...i, qty: i.qty - 1 } : i))
      );
    }
  };

  // Adjust part qty
  const handleAdjustQty = (partName: string, delta: number) => {
    const part = selectedParts.find((p) => p.partName === partName);
    if (!part) return;
    if (part.qty + delta <= 0) return;
    setSelectedParts(
      selectedParts.map((p) =>
        p.partName === partName ? { ...p, qty: p.qty + delta } : p
      )
    );
    setLocalInventory((prev) =>
      prev.map((i) =>
        i.name === partName ? { ...i, qty: i.qty - delta } : i
      )
    );
  };

  // Remove part
  const handleRemovePart = (partName: string) => {
    const part = selectedParts.find((p) => p.partName === partName);
    if (!part) return;
    setSelectedParts(selectedParts.filter((p) => p.partName !== partName));
    setLocalInventory((prev) =>
      prev.map((i) =>
        i.name === partName ? { ...i, qty: i.qty + part.qty } : i
      )
    );
  };

  // Toggle status
  const handleToggleStatus = () => {
    const newStatus: "completed" | "waiting_supplies" =
      req.status === "completed" ? "waiting_supplies" : "completed";
    onStatusChange?.(req.id, newStatus);
  };

  // Submit
  const handleSubmit = () => {
    const updatedReq: MaintenanceRequest = {
      ...req,
      partsUsed: selectedParts,
    };
    onRequestSubmit?.(updatedReq);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "transparent",
        padding: "0 1rem",
      }}
    >
      {/* Card Wrap (tilt target) */}
      <div
        ref={cardWrapRef}
        style={{
          position: "relative",
          transformStyle: "preserve-3d" as React.CSSProperties,
        }}
      >
        {/* Card */}
        <div
          className="main-glass-panel"
          style={{
            borderRadius: "2rem",
            padding: "0.8rem 1rem",
            width: "24rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top shimmer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(200,168,130,0.5), transparent)",
            }}
          />

          {/* Ambient blob */}
          <div
            style={{
              position: "absolute",
              width: "12rem",
              height: "12rem",
              background:
                "radial-gradient(circle, rgba(126,200,160,0.18) 0%, transparent 70%)",
              top: "-3rem",
              right: "-3rem",
              pointerEvents: "none",
              borderRadius: "50%",
            }}
          />

          {/* ── Header Row ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "0.25rem",
            }}
          >
            {/* ESA Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                opacity: 0.92,
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
              }}
            >
              <Building2
                style={{ width: 22, height: 22, color: C.warm }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: C.paper,
                    letterSpacing: "0.04em",
                    lineHeight: 1.1,
                  }}
                >
                  EXTENDED STAY
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.42rem",
                    fontWeight: 500,
                    color: C.warm,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                  }}
                >
                  America
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <button
              onClick={handleToggleStatus}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                background: `linear-gradient(135deg, ${statusInfo.color}22, ${statusInfo.color}14)`,
                border: `1px solid ${statusInfo.color}44`,
                borderRadius: "3rem",
                padding: "0.18rem 0.55rem",
                fontSize: "0.5rem",
                fontWeight: 600,
                color: statusInfo.color,
                letterSpacing: "0.08rem",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.25s",
              }}
            >
              <div
                style={{
                  width: "0.35rem",
                  height: "0.35rem",
                  background: statusInfo.color,
                  borderRadius: "50%",
                  boxShadow: `0 0 6px ${statusInfo.color}`,
                  animation: "ipc-pulse 1.4s ease infinite",
                }}
              />
              {statusInfo.label}
            </button>
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "1.3rem",
              lineHeight: 1.15,
              margin: "0.5rem 0 0.15rem",
              letterSpacing: "-0.02rem",
              color: C.paper,
            }}
          >
            Maintenance Request{" "}
            <em style={{ color: C.status, fontStyle: "italic" }}>
              Complete
            </em>
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              color: "rgba(245,240,235,0.35)",
              letterSpacing: "0.04rem",
              textTransform: "uppercase",
            }}
          >
            MAINTENANCE REQUEST FORM · {req.id.toUpperCase()}
          </div>

          {/* ── Service Middle: Meta + Category Grid + Stepper ── */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: "0.5rem",
              height: "10rem",
              margin: "0.3rem 0",
            }}
          >
            {/* Meta Column (Left) */}
            <div
              style={{
                width: "5.6rem",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "0.1rem 0",
              }}
            >
              <MetaItem
                icon={<User style={{ width: 12, height: 12 }} />}
                label="Requested By"
                value={req.requestedBy}
              />
              <MetaItem
                icon={<CalendarDays style={{ width: 12, height: 12 }} />}
                label="Date"
                value={req.date}
              />
              <MetaItem
                icon={<MessageSquare style={{ width: 12, height: 12 }} />}
                label="Remarks"
                value={
                  req.remarks.length > 28
                    ? req.remarks.slice(0, 28) + "..."
                    : req.remarks
                }
              />
              <div
                className="ipc-status-mini"
                style={{ color: statusInfo.color }}
              >
                <div
                  className="ipc-status-dot"
                  style={{
                    background: statusInfo.color,
                    boxShadow: `0 0 6px ${statusInfo.color}`,
                    width: "0.3rem",
                    height: "0.3rem",
                    borderRadius: "50%",
                    animation: "ipc-pulse 1.4s ease infinite",
                  }}
                />
                <span style={{ fontSize: "0.58rem" }}>{statusInfo.label}</span>
              </div>
            </div>

            {/* Middle: 27-Category Icon Grid (3D Zone) */}
            <div
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="glass-subcard"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "1rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(9, 1fr)",
                  gridTemplateRows: "repeat(3, 1fr)",
                  gap: "2px",
                  padding: "0.35rem",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {ESA_CATEGORIES.map((cat) => {
                  const usedInReq = selectedParts.some(
                    (p) => p.categoryId === cat.id
                  );
                  return (
                    <div
                      key={cat.id}
                      title={`${cat.name} (Category ${cat.id})`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.4rem",
                        padding: "1px",
                        background: usedInReq
                          ? `${statusInfo.color}18`
                          : "transparent",
                        border: usedInReq
                          ? `1px solid ${statusInfo.color}44`
                          : "1px solid transparent",
                        transition: "all 0.2s",
                        cursor: "default",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          lineHeight: 1,
                          filter: usedInReq ? "none" : "grayscale(0.6) opacity(0.6)",
                          transition: "filter 0.2s",
                        }}
                      >
                        {cat.icon}
                      </span>
                      <span
                        style={{
                          fontSize: "0.28rem",
                          color: usedInReq
                            ? statusInfo.color
                            : "rgba(245,240,235,0.3)",
                          fontWeight: usedInReq ? 600 : 400,
                          letterSpacing: "0.02em",
                          textTransform: "uppercase",
                          lineHeight: 1.1,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                          transition: "color 0.2s",
                        }}
                      >
                        {cat.name.length > 6
                          ? cat.name.slice(0, 5) + ".."
                          : cat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Grid shadow */}
              <div
                style={{
                  position: "absolute",
                  bottom: "0.25rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "7rem",
                  height: "1.2rem",
                  background:
                    "radial-gradient(ellipse, rgba(126,200,160,0.25) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Stepper Wheel — scrubs through separate requests */}
            {requests.length > 1 && (
              <StepperWheel
                items={requests.map(
                  (r) => `#${r.roomNumber} ${r.requestedBy}`
                )}
                activeItemIndex={idx}
                onSelectStep={applyRequest}
                accentColor="#7ec8a0"
                className="stepper-rail"
                style={{
                  width: "3.5rem",
                  flexShrink: 0,
                  alignSelf: "center",
                  height: "100%",
                  padding: "0.2rem 0.1rem",
                  borderRadius: "0.75rem",
                }}
              />
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,
              margin: "0.4rem 0",
            }}
          />

          {/* ── Room # Highlight Bar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.1rem",
                textTransform: "uppercase",
                color: "rgba(245,240,235,0.35)",
                flexShrink: 0,
              }}
            >
              Suite / Room
            </span>
            <div
              className="glass-subcard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                borderRadius: "0.5rem",
                padding: "0.3rem 0.7rem",
              }}
            >
              <Wrench style={{ width: 12, height: 12, color: C.status }} />
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: C.paper,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {req.roomNumber}
              </span>
            </div>
            <div className="flex-1" />
            <span
              style={{
                fontSize: "0.48rem",
                color: "rgba(245,240,235,0.3)",
              }}
            >
              Request {idx + 1} of {requests.length}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,
              margin: "0.4rem 0",
            }}
          />

          {/* ── Parts Used with Live Inventory Adjustments (3 Dropdowns) ── */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.55rem",
                  letterSpacing: "0.1rem",
                  textTransform: "uppercase",
                  color: "rgba(245,240,235,0.35)",
                }}
              >
                Inventory Used to Complete
              </span>
              <button
                onClick={() => setShowDropdowns(!showDropdowns)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.5rem",
                  fontWeight: 600,
                  color: C.warm,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.06rem",
                  textTransform: "uppercase",
                }}
              >
                <PackageOpen style={{ width: 11, height: 11 }} />
                {showDropdowns ? "Hide" : "Add Parts"}
                <ChevronDown
                  style={{
                    width: 10,
                    height: 10,
                    transform: showDropdowns
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Selected Parts List */}
            {selectedParts.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {selectedParts.map((part, pi) => {
                  const catInfo = ESA_CATEGORIES.find(
                    (c) => c.id === part.categoryId
                  );
                  const invItem = localInventory.find(
                    (i) => i.name === part.partName
                  );
                  return (
                    <div
                      key={pi}
                      className="glass-subcard"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        borderRadius: "0.5rem",
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      {/* Category icon */}
                      <span style={{ fontSize: "0.7rem" }}>
                        {catInfo?.icon ?? "📦"}
                      </span>
                      {/* Part name + category label */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.55rem",
                            fontWeight: 600,
                            color: C.paper,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {part.partName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.38rem",
                            color: "rgba(245,240,235,0.3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04rem",
                          }}
                        >
                          {catInfo?.name ?? "General"} · Stock: {invItem?.qty ?? 0}
                        </div>
                      </div>
                      {/* Qty controls */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem",
                        }}
                      >
                        <button
                          onClick={() => handleAdjustQty(part.partName, -1)}
                          style={{
                            width: "1.1rem",
                            height: "1.1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "0.3rem",
                            background: C.glass,
                            border: `1px solid ${C.border}`,
                            color: C.paper,
                            cursor: "pointer",
                          }}
                        >
                          <Minus style={{ width: 10, height: 10 }} />
                        </button>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: C.paper,
                            minWidth: "1rem",
                            textAlign: "center",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {part.qty}
                        </span>
                        <button
                          onClick={() => handleAdjustQty(part.partName, 1)}
                          style={{
                            width: "1.1rem",
                            height: "1.1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "0.3rem",
                            background: C.glass,
                            border: `1px solid ${C.border}`,
                            color: C.paper,
                            cursor: "pointer",
                          }}
                        >
                          <Plus style={{ width: 10, height: 10 }} />
                        </button>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => handleRemovePart(part.partName)}
                        style={{
                          width: "1.1rem",
                          height: "1.1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "0.3rem",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          color: "#ef4444",
                          cursor: "pointer",
                          opacity: 0.6,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "0.6")
                        }
                        title="Remove part"
                      >
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dropdowns — 3 columns of parts selection */}
            {showDropdowns && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.3rem",
                  marginTop: "0.3rem",
                }}
              >
                {localInventory.slice(0, 3).map((invItem) => {
                  const catInfo = ESA_CATEGORIES.find(
                    (c) =>
                      c.name.toLowerCase() ===
                      invItem.category.toLowerCase()
                  );
                  return (
                    <div
                      key={invItem.id}
                      className="glass-subcard"
                      style={{
                        borderRadius: "0.5rem",
                        padding: "0.3rem",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.2rem",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span style={{ fontSize: "0.55rem" }}>
                          {catInfo?.icon ?? "📦"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.35rem",
                            color: "rgba(245,240,235,0.3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04rem",
                          }}
                        >
                          {invItem.category}
                        </span>
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddPart(invItem);
                          }
                          e.target.value = "";
                        }}
                        style={{
                          width: "100%",
                          background: "rgba(13,13,13,0.6)",
                          border: `1px solid ${C.border}`,
                          borderRadius: "0.35rem",
                          color: C.paper,
                          fontSize: "0.45rem",
                          padding: "0.2rem 0.3rem",
                          outline: "none",
                          cursor: "pointer",
                          appearance: "none",
                          WebkitAppearance: "none",
                        }}
                      >
                        <option value="">Select {invItem.category}...</option>
                        <option value={invItem.id}>{invItem.name}</option>
                      </select>
                      <div
                        style={{
                          fontSize: "0.35rem",
                          color: invItem.qty > 0 ? C.status : "#ef4444",
                          marginTop: "0.15rem",
                          textAlign: "right",
                          fontFamily: "monospace",
                        }}
                      >
                        {invItem.qty} in stock
                      </div>
                    </div>
                  );
                })}

                {/* Additional category selectors */}
                <div
                  className="glass-subcard"
                  style={{
                    borderRadius: "0.5rem",
                    padding: "0.3rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span style={{ fontSize: "0.55rem" }}>🔧</span>
                    <span
                      style={{
                        fontSize: "0.35rem",
                        color: "rgba(245,240,235,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04rem",
                      }}
                    >
                      Plumbing
                    </span>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const item = localInventory.find(
                          (i) => i.id === e.target.value
                        );
                        if (item) handleAddPart(item);
                      }
                      e.target.value = "";
                    }}
                    style={{
                      width: "100%",
                      background: "rgba(13,13,13,0.6)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "0.35rem",
                      color: C.paper,
                      fontSize: "0.45rem",
                      padding: "0.2rem 0.3rem",
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                    }}
                  >
                    <option value="">Select part...</option>
                    {localInventory
                      .filter((i) => ["Faucet", "Sink", "Bath Tub"].includes(i.category))
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div
                  className="glass-subcard"
                  style={{
                    borderRadius: "0.5rem",
                    padding: "0.3rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span style={{ fontSize: "0.55rem" }}>⚡</span>
                    <span
                      style={{
                        fontSize: "0.35rem",
                        color: "rgba(245,240,235,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04rem",
                      }}
                    >
                      Electrical
                    </span>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const item = localInventory.find(
                          (i) => i.id === e.target.value
                        );
                        if (item) handleAddPart(item);
                      }
                      e.target.value = "";
                    }}
                    style={{
                      width: "100%",
                      background: "rgba(13,13,13,0.6)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "0.35rem",
                      color: C.paper,
                      fontSize: "0.45rem",
                      padding: "0.2rem 0.3rem",
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                    }}
                  >
                    <option value="">Select part...</option>
                    {localInventory
                      .filter((i) =>
                        ["Thermostat", "Light Switch", "Lights"].includes(
                          i.category
                        )
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div
                  className="glass-subcard"
                  style={{
                    borderRadius: "0.5rem",
                    padding: "0.3rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <span style={{ fontSize: "0.55rem" }}>🪟</span>
                    <span
                      style={{
                        fontSize: "0.35rem",
                        color: "rgba(245,240,235,0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04rem",
                      }}
                    >
                      Room Fixtures
                    </span>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const item = localInventory.find(
                          (i) => i.id === e.target.value
                        );
                        if (item) handleAddPart(item);
                      }
                      e.target.value = "";
                    }}
                    style={{
                      width: "100%",
                      background: "rgba(13,13,13,0.6)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "0.35rem",
                      color: C.paper,
                      fontSize: "0.45rem",
                      padding: "0.2rem 0.3rem",
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                    }}
                  >
                    <option value="">Select part...</option>
                    {localInventory
                      .filter((i) =>
                        ["Drapes", "Carpet", "Wallpaper", "Door Locks", "Security Bar"].includes(
                          i.category
                        )
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {selectedParts.length === 0 && !showDropdowns && (
              <div
                style={{
                  textAlign: "center",
                  padding: "0.5rem",
                  color: "rgba(245,240,235,0.2)",
                  fontSize: "0.5rem",
                  fontStyle: "italic",
                }}
              >
                No parts recorded — tap "Add Parts" to select
                inventory used
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,
              margin: "0.4rem 0",
            }}
          />

          {/* ── Bottom Control Bar ── */}
          <div
            className="glass-control-bar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              padding: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <div
                style={{
                  width: "0.4rem",
                  height: "0.4rem",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e",
                  animation: "ipc-greenPulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: "0.5rem",
                  fontWeight: 600,
                  letterSpacing: "0.08rem",
                  textTransform: "uppercase",
                  color: C.status,
                }}
              >
                HD Supply Connected
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button
                onClick={handleToggleStatus}
                className="ipc-book-btn"
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: "0.75rem",
                  background:
                    req.status === "waiting_supplies"
                      ? "linear-gradient(135deg, #c9a84c, #8a6a1a)"
                      : C.glass,
                  border: `1px solid ${req.status === "waiting_supplies" ? C.warm : C.border}`,
                  color:
                    req.status === "waiting_supplies"
                      ? C.ink
                      : C.paper,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.06rem",
                  cursor: "pointer",
                  transition: "all 0.25s",
                }}
              >
                <Clock style={{
                  width: 11,
                  height: 11,
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: "0.2rem",
                }} />
                Waiting
              </button>
              <button
                onClick={() => {
                  onStatusChange?.(req.id, "completed");
                  handleSubmit();
                }}
                className="ipc-book-btn"
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: "0.75rem",
                  background:
                    req.status === "completed"
                      ? "linear-gradient(135deg, #c9a84c, #8a6a1a)"
                      : C.glass,
                  border: `1px solid ${req.status === "completed" ? C.warm : C.border}`,
                  color:
                    req.status === "completed" ? C.ink : C.paper,
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.06rem",
                  cursor: "pointer",
                  transition: "all 0.25s",
                }}
              >
                <CheckCircle2 style={{
                  width: 11,
                  height: 11,
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: "0.2rem",
                }} />
                Complete
              </button>
            </div>
          </div>

          {/* ── Submit Button ── */}
          <button
            onClick={handleSubmit}
            className="glass-btn-pay ipc-order-complete-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              width: "100%",
              marginTop: "0.8rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.06rem",
              cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            Maintenance Request Complete — Submit
          </button>
        </div>
      </div>

      {/* Hint */}
      <p
        style={{
          marginTop: "0.4rem",
          fontSize: "0.65rem",
          fontFamily: "monospace",
          color: "rgba(200,168,130,0.3)",
        }}
      >
        Stepper scrubs requests · Status pill toggles Completed / Waiting
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

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.4rem",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          color: C.warm,
          opacity: 0.85,
          marginTop: "0.12rem",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: "0.42rem",
            letterSpacing: "0.08rem",
            textTransform: "uppercase",
            color: "rgba(245,240,235,0.35)",
            marginBottom: "0.15rem",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "0.6rem",
            fontWeight: 600,
            lineHeight: 1.25,
            color: C.paper,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
