"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import gsap from "gsap";
import {
  Shield, ShieldCheck, ClipboardCheck, Wrench, Package, PlusCircle,
  ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle2,
  Search, Send, ImagePlus, Paperclip, Mic, ScanBarcode, StopCircle,
  Loader2, Sparkles, ArrowLeft, Bot, BarChart3, Flame, Droplets,
  Wind, Thermometer, Phone, Zap, FileText, X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   ESA WEB CONSOLE — Green Shield Edition

   Layout:
   - LEFT SIDEBAR: Green Shield daily to-dos (from real SOPs),
     pending/new maint requests, checklist dropdown
   - MIDDLE: Only 3 cards — Maintenance, Parts, Inventory
   - BOTTOM: Input Ingestion Interface (text + send + model selector)

   Data sourced from ESA Green Shield SOPs (A through I)
   ═══════════════════════════════════════════════════════════ */

/* ── Types ──────────────────────────────── */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  cardContext?: string;
}

interface ESAWorkCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

interface SOPStep {
  step: number;
  task: string;
  materials: string[];
}

interface GreenShieldSOP {
  id: string;
  code: string;
  title: string;
  frequency: "Daily" | "2X Week" | "Weekly" | "Monthly" | "Quarterly" | "Semi-Annual" | "Annual";
  timeToComplete: string;
  steps: SOPStep[];
  icon: React.ElementType;
  color: string;
}

interface PendingRequest {
  id: string;
  roomNumber: string;
  description: string;
  requestedBy: string;
  date: string;
  status: "pending" | "waiting_supplies" | "completed";
}

/* ── The 3 Cards (only these render in the middle) ── */
const ESA_CARDS: ESAWorkCard[] = [
  {
    id: "maintenance",
    title: "Maintenance",
    subtitle: "Work orders & completions",
    icon: ClipboardCheck,
    color: "#7ec8a0",
    description: "Close out work orders, log parts used, toggle waiting-for-supplies status.",
    badge: "4 Open",
    badgeColor: "#d9a441",
  },
  {
    id: "parts",
    title: "Parts",
    subtitle: "Inventory & ordering",
    icon: Package,
    color: "#c8a882",
    description: "Search parts, check stock levels, scan barcodes, and submit HD Supply orders.",
    badge: "7 Low",
    badgeColor: "#ef4444",
  },
  {
    id: "inventory",
    title: "Inventory",
    subtitle: "Real-time stock dashboard",
    icon: BarChart3,
    color: "#22d3ee",
    description: "Live SKU tracking, low-stock alerts, bin locations, and HD Supply sync status.",
  },
];

/* ═══════════════════════════════════════════════════════════
   REAL GREEN SHIELD SOP DATA — Extracted from ESA PDF SOPs
   ═══════════════════════════════════════════════════════════ */

const GREEN_SHIELD_SOPS: GreenShieldSOP[] = [
  {
    id: "sop-a-telephone",
    code: "A",
    title: "Daily Telephone Room Check",
    frequency: "Daily",
    timeToComplete: "3 min",
    icon: Phone,
    color: "#22d3ee",
    steps: [
      { step: 1, task: "Verify temperature gauge is installed on wall opposite HVAC/PTAC", materials: ["Tissue Paper"] },
      { step: 2, task: "Verify temperature reading is between 70-75 degrees Fahrenheit", materials: ["Visual Inspection"] },
      { step: 3, task: "If room has exhaust fan, verify operation and that it is set to go on at 75F", materials: ["Visual Inspection"] },
      { step: 4, task: "Test PTAC/AC unit (tissue test), verify operation, fan setting set to ON", materials: ["Tissue Paper"] },
      { step: 5, task: "If any AC component inoperable and unfixable, create service ticket and report to manager immediately", materials: [] },
    ],
  },
  {
    id: "sop-b-mech-room",
    code: "B",
    title: "Daily Mechanical Room Check",
    frequency: "Daily",
    timeToComplete: "3 min",
    icon: Thermometer,
    color: "#eab308",
    steps: [
      { step: 1, task: "Check temperature of each boiler/water heater — verify maintaining 140F hot water output", materials: ["Visual Inspection"] },
      { step: 2, task: "Check hot water temperature AFTER mixing valve(s) — verify no higher than 120F", materials: ["Visual Inspection"] },
      { step: 3, task: "Check each pressure gauge for incoming domestic water pre and post boiler/water heater", materials: ["Visual Inspection"] },
      { step: 4, task: "Report deviations of 20% +/- psi to manager immediately", materials: ["Visual Inspection"] },
      { step: 5, task: "During below-freezing temps, verify ambient room temp is above freezing; check wall/ceiling heaters", materials: ["Visual Inspection"] },
    ],
  },
  {
    id: "sop-c-fire-alarm",
    code: "C",
    title: "Daily Fire Alarm Status Check",
    frequency: "Daily",
    timeToComplete: "3 min",
    icon: Flame,
    color: "#ef4444",
    steps: [
      { step: 1, task: "Verify main fire panel shows system as 'normal' — free of trouble, supervisory, or alarm indicators", materials: ["Visual Inspection"] },
      { step: 2, task: "If 'trouble' status: identify individual issues, create service ticket to troubleshoot same day", materials: ["Visual Inspection"] },
      { step: 3, task: "If 'supervisory' status: alert manager immediately, create service request for fire repair technician", materials: ["Visual Inspection"] },
      { step: 4, task: "If 'alarm' status: investigate source immediately; if emergency call fire department; if not, clear and reset panel", materials: ["Visual Inspection"] },
    ],
  },
  {
    id: "sop-e-water-softener",
    code: "E",
    title: "2X Week Water Softener Salt Assessment",
    frequency: "2X Week",
    timeToComplete: "10 min",
    icon: Droplets,
    color: "#60a5fa",
    steps: [
      { step: 1, task: "Remove brine tank cover and set aside", materials: [] },
      { step: 2, task: "Verify correct level of salt is present; if top of salt appears wet, add salt", materials: ["Salt"] },
      { step: 3, task: "Use large screwdriver to penetrate salt in multiple areas — verify no salt bridge has formed", materials: ["Large slotted screwdriver"] },
      { step: 4, task: "If salt bridge identified, alert manager and create service request to dispatch technician", materials: [] },
    ],
  },
  {
    id: "sop-f-drum-drip",
    code: "F",
    title: "2X Week Drum Drip Draining",
    frequency: "2X Week",
    timeToComplete: "15 min",
    icon: Droplets,
    color: "#38bdf8",
    steps: [
      { step: 1, task: "Close Valve #1 (turn clockwise), put bucket under Valve #2, remove drain plug if applicable", materials: ["Bucket", "Adjustable wrench"] },
      { step: 2, task: "Open Valve #2 (turn counter-clockwise), allow water to drain into bucket", materials: ["Bucket"] },
      { step: 3, task: "Close Valve #2, open Valve #1 — return system to original position. Repeat until all water drained", materials: ["Bucket"] },
      { step: 4, task: "If you drain over 1/2 gallon of water, alert manager immediately for fire repair service request", materials: [] },
    ],
  },
  {
    id: "sop-g-co-alarm",
    code: "G",
    title: "Weekly CO Alarm Check",
    frequency: "Weekly",
    timeToComplete: "54 min",
    icon: Wind,
    color: "#f472b6",
    steps: [
      { step: 1, task: "Push and hold Test/Silence button until LED flashes — alarm horn sounds 4 beeps, pause, 4 more beeps; RED LED flashes", materials: ["Visual Inspection"] },
      { step: 2, task: "Alarm sequence should last 5-6 seconds. If not, ensure fresh batteries correctly installed; mark replacement date on battery", materials: ["9 Volt Battery", "Permanent Marker"] },
      { step: 3, task: "If unit still does not alarm, replace it immediately. Repeat for every CO alarm on site", materials: ["New CO Alarm", "Visual Inspection"] },
      { step: 4, task: "Each room containing or adjacent to an appliance burning natural gas must have a CO alarm installed on wall", materials: [] },
    ],
  },
  {
    id: "sop-h-elevator",
    code: "H",
    title: "Monthly Elevator Operation Inspection",
    frequency: "Monthly",
    timeToComplete: "10 min",
    icon: Zap,
    color: "#22c55e",
    steps: [
      { step: 1, task: "Enter elevator equipment room — verify free of storage, comfortable temp, no hydraulic fluid leaks", materials: ["Inspection Log", "Pen"] },
      { step: 2, task: "Insert fire service key at 1st floor lobby, turn ON — car should return to 1st floor, doors open, stay open", materials: ["Fire Service Key"] },
      { step: 3, task: "Enter each car, insert key in red slot, operate elevator to 1+ floor, open/close door, return to lobby", materials: ["Fire Service Key"] },
      { step: 4, task: "Open phone box, verify phone rings to service company/call center, verify form 858B posted, confirm hotel name/address known", materials: ["Visual Inspection"] },
      { step: 5, task: "Ensure current elevator permit posted in each car", materials: ["Visual Inspection"] },
      { step: 6, task: "Re-insert key at lobby, turn left to restore normal operation", materials: ["Fire Service Key"] },
      { step: 7, task: "If all OK, write 'OK' on inspection form. If problems, write description; correct within 14 days", materials: ["Inspection Log", "Pen"] },
    ],
  },
  {
    id: "sop-i-mech-room-pm",
    code: "I",
    title: "Monthly Mechanical Room PM",
    frequency: "Monthly",
    timeToComplete: "35 min",
    icon: Wrench,
    color: "#fbbf24",
    steps: [
      { step: 1, task: "Flush boiler/water heater — connect hose to drain valve, open to full, flow until effluent clear (min 2 min), close and cap", materials: ["Water hose", "Adjustable wrench"] },
      { step: 2, task: "Verify boiler/water heater operation — note set points (PVI: 160 upper / 140 lower), turn up 20 deg, verify flame, check draft fans/dampers", materials: ["Visual Inspection Only"] },
      { step: 3, task: "Clean area around water heaters, use shop vacuum for dirt and lint. Return set points and re-install cover", materials: ["Visual Inspection Only"] },
      { step: 4, task: "Verify circulation pump(s) — touch motor (should be ~120F, slightly vibrating/humming). If cool or shaking/loud, investigate further", materials: ["20 wt Oil"] },
      { step: 5, task: "If pump has lube ports, add several drops of oil in each port (B&G: 2 ports; Grundfos: cannot be lubricated)", materials: ["20 wt Oil"] },
      { step: 6, task: "Verify mixing valve(s) — note current setting, turn knobs fully left/right several times, check for leaks", materials: ["1/8in Allen Key"] },
      { step: 7, task: "If Y-strainers in mixing valve piping can be isolated, clean them one at a time. Reset valves to proper setting", materials: ["1/8in Allen Key"] },
    ],
  },
];

/* ── Master schedule frequencies from Green Shield SOP (Page 1) ── */
const SCHEDULE_FREQUENCIES = [
  { label: "Daily", color: "#ef4444", sops: ["A", "B", "C"] },
  { label: "2X Week", color: "#eab308", sops: ["E", "F"] },
  { label: "Weekly", color: "#fbbf24", sops: ["G"] },
  { label: "Monthly", color: "#22c55e", sops: ["H", "I", "House Laundry PM", "Asset Inspection", "HVAC Filter Replace", "Life Safety"] },
  { label: "Quarterly", color: "#60a5fa", sops: ["Guest Laundry Appliance PM"] },
  { label: "Semi-Annual", color: "#f472b6", sops: ["Snow Blower PM", "HVAC/PTAC System PM", "CO Alarm Battery Replace"] },
];

/* ── Pending Maintenance Requests ── */
const PENDING_REQUESTS: PendingRequest[] = [
  { id: "pr-1", roomNumber: "204", description: "Thermostat replacement — non-responsive", requestedBy: "Guest Complaint", date: "2026-08-03", status: "waiting_supplies" },
  { id: "pr-2", roomNumber: "108", description: "Faucet cartridge — leaking at base", requestedBy: "Abdou", date: "2026-08-02", status: "pending" },
  { id: "pr-3", roomNumber: "312", description: "Full PM — kitchen & bathroom", requestedBy: "PM Schedule", date: "2026-08-04", status: "pending" },
  { id: "pr-4", roomNumber: "401", description: "Door lock sticks — hard to open from inside", requestedBy: "Guest Complaint", date: "2026-08-03", status: "pending" },
];

const MODEL_OPTIONS = [
  { id: "grok-4.5", label: "Grok 4.5", provider: "xAI" },
  { id: "grok-4.20-multi-agent", label: "Grok 4.20 Multi-Agent", provider: "xAI" },
  { id: "llama-3.3-70b", label: "Llama 3.3 70B", provider: "Meta" },
  { id: "ava-finetuned-v1", label: "AVA Fine-Tuned v1", provider: "ESA" },
];

/* ── Simulated responses ── */
function getSimulatedResponse(cardId: string): string {
  const responses: Record<string, string[]> = {
    maintenance: [
      "Work order for Room 204 has been closed out.\n\nParts logged:\n- Thermostat Honeywell TH3110D1003 x 1 (Bin C1: 1 to 0)\n- Wire Nut Connector x 2 (Bin D4: 45 to 43)\n\nInventory updated. Low stock alert triggered for Thermostat — now at 0, below reorder point of 4.",
      "Parts pull list for Room 312 PM (Kitchen + Bathroom):\n\nKitchen:\n- Air Filter 20x25x1 x 1\n- Stove Drip Pan x 2\n- Garbage Disposer Splash Guard x 1\n\nBathroom:\n- Toilet Flapper Kit x 1\n- Showerhead x 1\n- Caulk (tubing) x 1\n\nTotal: 9 items. All in stock.",
      "Room 108 faucet repair logged.\n\n- Moen 4551EC Cartridge x 1 used\n- Bin A3: 5 to 4 (reorder point: 4)\n\nWarning: Faucet cartridge at reorder point. Recommend adding to next HD Supply order.",
    ],
    parts: [
      "Found 3 matching results for bathroom faucet brushed nickel:\n\n1. Delta Faucet 2599LF - $89.50 - HD Supply #HD-3321\n2. Moen 4551EC - $74.99 - HD Supply #HD-4102\n3. Peerless 23931LF - $52.00 - HD Supply #HD-5543\n\nAll 3 in stock. Shall I add one to the order?",
      "Barcode: HD-44821\n- Product: Honeywell TH3110D1003 Non-Programmable Thermostat\n- Category: HVAC\n- Bin: C1\n- Current Stock: 1 unit\n- Reorder Point: 4 units\n\nThis item is below reorder point.",
      "Comparing prices:\n- Honeywell TH3110D1003: $34.50/unit (HD Supply)\n- FilterBuy 20x25x1 MERV-8: $42.00/4-pack (HD Supply)\n\nYour backup vendor shows 12-18% higher on average. HD Supply recommended.",
    ],
    inventory: [
      "Scanning inventory database... Found 7 parts below reorder point:\n\n1. Toilet Flapper Kit - Bin A1 - 2 units (reorder: 5)\n2. Air Filter 20x25x1 - Bin B2 - 3 units (reorder: 10)\n3. Thermostat Honeywell - Bin C1 - 1 unit (reorder: 4)\n\nRecommendation: Submit batch reorder for these 3 items. Estimated cost: $187.50",
      "Last HD Supply sync: 14:22 EST today. 3 new SKUs were added to the catalog. No pending sync items.\n\nYour local DB is up to date.",
      "Bin A3 contains:\n- Door Lock Set (KW1) - Qty: 8\n- Deadbolt Single Cylinder - Qty: 4\n- Strike Plate - Qty: 12\n\nTotal: 24 units across 3 SKUs.",
    ],
  };
  const cardResponses = responses[cardId] || responses.maintenance!;
  return cardResponses[Math.floor(Math.random() * cardResponses.length)];
}

/* ── Action Button (toolbar icons) ── */
function ActionButton({ title, icon: Icon, onClick }: { title: string; icon: React.ElementType; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        appearance: "none", border: 0, background: "transparent",
        color: hovered ? "#d4af37" : "rgba(255,255,255,0.3)",
        width: 36, height: 36, display: "grid", placeItems: "center",
        borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <Icon style={{ width: 16, height: 16 }} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR — Green Shield To-Dos, Pending Requests, SOP Checklist
   ═══════════════════════════════════════════════════════════ */
function ESASidebar({
  onSelectRequest,
  onNewRequest,
  onSelectSOP,
}: {
  onSelectRequest: (req: PendingRequest) => void;
  onNewRequest: () => void;
  onSelectSOP: (sop: GreenShieldSOP) => void;
}) {
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [selectedSOPId, setSelectedSOPId] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Track completion state for today's SOPs
  const [completedSOPs, setCompletedSOPs] = useState<Set<string>>(new Set(["sop-a-telephone", "sop-c-fire-alarm"]));

  const totalSOPs = GREEN_SHIELD_SOPS.length;
  const completedCount = completedSOPs.size;

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(sidebarRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" });
    }
  }, []);

  const toggleSOPComplete = useCallback((sopId: string) => {
    setCompletedSOPs((prev) => {
      const next = new Set(prev);
      if (next.has(sopId)) next.delete(sopId);
      else next.add(sopId);
      return next;
    });
  }, []);

  const statusIcon = (s: string) => {
    if (s === "completed") return <CheckCircle2 style={{ width: 12, height: 12, color: "#7ec8a0" }} />;
    if (s === "waiting_supplies") return <AlertTriangle style={{ width: 12, height: 12, color: "#d9a441" }} />;
    return <Clock style={{ width: 12, height: 12, color: "#eab308" }} />;
  };

  const selectedSOP = GREEN_SHIELD_SOPS.find((s) => s.id === selectedSOPId);

  return (
    <div ref={sidebarRef} style={{ width: 290, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* ESA Branding */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0" }}>
        <div style={{ width: 34, height: 34, borderRadius: "0.55rem", background: "linear-gradient(135deg, #003B71, #0055A4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(0,59,113,0.4)" }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>E</span>
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#f5f0eb", letterSpacing: "0.02em" }}>ESA Exoskeleton</div>
          <div style={{ fontSize: "0.5rem", color: "rgba(245,240,235,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Extended Stay America · Green Shield</div>
        </div>
      </div>

      {/* ── GREEN SHIELD TO-DOs (Today's SOPs) ── */}
      <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: "0.85rem", padding: "0.65rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <ShieldCheck style={{ width: 14, height: 14, color: "#22c55e" }} />
            <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em", textTransform: "uppercase" }}>Green Shield — Today</span>
          </div>
          <span style={{ fontSize: "0.46rem", fontWeight: 600, color: "rgba(245,240,235,0.4)", fontFamily: "ui-monospace, monospace" }}>{completedCount}/{totalSOPs}</span>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: "0.5rem" }}>
          <div style={{ width: `${(completedCount / totalSOPs) * 100}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #22c55e, #4ade80)", transition: "width 0.5s ease" }} />
        </div>

        <div className="ava-scroll" style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {GREEN_SHIELD_SOPS.map((sop) => {
            const SOPIcon = sop.icon;
            const isComplete = completedSOPs.has(sop.id);
            return (
              <div
                key={sop.id}
                onClick={() => { toggleSOPComplete(sop.id); onSelectSOP(sop); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.4rem",
                  borderRadius: "0.4rem", cursor: "pointer", transition: "background 0.15s",
                  background: isComplete ? "rgba(16,185,129,0.06)" : "transparent",
                  opacity: isComplete ? 0.5 : 1,
                }}
              >
                <SOPIcon style={{ width: 11, height: 11, color: isComplete ? "rgba(34,197,94,0.5)" : sop.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.54rem", color: isComplete ? "rgba(245,240,235,0.3)" : "rgba(245,240,235,0.7)", lineHeight: 1.2, textDecoration: isComplete ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sop.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: 1 }}>
                    <span style={{ fontSize: "0.38rem", fontWeight: 600, color: sop.color, fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}>{sop.code}</span>
                    <span style={{ fontSize: "0.36rem", color: "rgba(245,240,235,0.25)" }}>{sop.frequency} · {sop.timeToComplete}</span>
                  </div>
                </div>
                {isComplete && <CheckCircle2 style={{ width: 10, height: 10, color: "#22c55e", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PENDING REQUESTS ── */}
      <div style={{ background: "rgba(24,24,27,0.5)", border: "1px solid rgba(63,63,70,0.25)", borderRadius: "0.85rem", padding: "0.65rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Wrench style={{ width: 13, height: 13, color: "#eab308" }} />
            <span style={{ fontSize: "0.52rem", fontWeight: 600, color: "rgba(245,240,235,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Pending Requests</span>
          </div>
          <span style={{ fontSize: "0.44rem", fontWeight: 600, color: "#eab308", fontFamily: "ui-monospace, monospace" }}>{PENDING_REQUESTS.length}</span>
        </div>
        <div className="ava-scroll" style={{ maxHeight: "115px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {PENDING_REQUESTS.map((req) => (
            <button
              key={req.id}
              onClick={() => onSelectRequest(req)}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.45rem",
                borderRadius: "0.45rem", background: "rgba(24,24,27,0.4)", border: "1px solid rgba(63,63,70,0.2)",
                cursor: "pointer", transition: "all 0.15s", textAlign: "left", width: "100%",
                color: "rgba(245,240,235,0.7)",
              }}
            >
              {statusIcon(req.status)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.56rem", fontWeight: 600, color: "#f5f0eb", lineHeight: 1.2 }}>Rm {req.roomNumber}</div>
                <div style={{ fontSize: "0.46rem", color: "rgba(245,240,235,0.4)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.description}</div>
              </div>
              <ChevronRight style={{ width: 10, height: 10, color: "rgba(245,240,235,0.2)", flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* New Request Button */}
        <button
          onClick={onNewRequest}
          style={{
            marginTop: "0.4rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
            padding: "0.4rem", borderRadius: "0.45rem", border: "1px dashed rgba(124,58,237,0.3)",
            background: "rgba(124,58,237,0.06)",
            color: "#c4b5fd", fontSize: "0.54rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <PlusCircle style={{ width: 12, height: 12 }} />
          New Maintenance Request
        </button>
      </div>

      {/* ── GREEN SHIELD CHECKLIST DROPDOWN ── */}
      <div style={{ background: "rgba(24,24,27,0.5)", border: "1px solid rgba(63,63,70,0.25)", borderRadius: "0.85rem", padding: "0.65rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.4rem" }}>
          <Shield style={{ width: 13, height: 13, color: "#22c55e" }} />
          <span style={{ fontSize: "0.52rem", fontWeight: 600, color: "rgba(245,240,235,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Green Shield Checklists</span>
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setChecklistOpen(!checklistOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.4rem 0.55rem", borderRadius: "0.45rem",
              background: "rgba(24,24,27,0.7)", border: checklistOpen ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(63,63,70,0.3)",
              color: "rgba(245,240,235,0.7)", fontSize: "0.56rem", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <span>{selectedSOP ? `${selectedSOP.code} — ${selectedSOP.title}` : "Select a checklist..."}</span>
            <ChevronDown style={{ width: 12, height: 12, color: "rgba(245,240,235,0.4)", transform: checklistOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {checklistOpen && (
            <div className="ava-scroll" style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
              marginTop: "0.2rem", maxHeight: "220px", overflowY: "auto",
              background: "rgba(13,13,13,0.97)", border: "1px solid rgba(63,63,70,0.4)",
              borderRadius: "0.45rem", padding: "0.2rem",
            }}
            >
              {GREEN_SHIELD_SOPS.map((sop) => {
                const SOPIcon = sop.icon;
                return (
                  <button
                    key={sop.id}
                    onClick={() => { setSelectedSOPId(sop.id); setChecklistOpen(false); onSelectSOP(sop); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.35rem 0.5rem", borderRadius: "0.3rem", background: "transparent",
                      border: "none",
                      color: selectedSOPId === sop.id ? sop.color : "rgba(245,240,235,0.6)",
                      fontSize: "0.54rem", fontWeight: 500, cursor: "pointer", transition: "background 0.1s", textAlign: "left",
                    }}
                  >
                    <SOPIcon style={{ width: 12, height: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sop.code} — {sop.title}</div>
                      <div style={{ fontSize: "0.4rem", color: "rgba(245,240,235,0.3)" }}>{sop.frequency} · {sop.timeToComplete} · {sop.steps.length} steps</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Show selected SOP steps */}
        {selectedSOP && (
          <div className="ava-scroll" style={{ maxHeight: "160px", overflowY: "auto", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.4rem", fontWeight: 600, color: selectedSOP.color, fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}>SOP {selectedSOP.code}</span>
              <span style={{ fontSize: "0.4rem", color: "rgba(245,240,235,0.3)", fontFamily: "ui-monospace, monospace" }}>{selectedSOP.frequency} · {selectedSOP.timeToComplete}</span>
            </div>
            {selectedSOP.steps.map((step) => (
              <div key={step.step} style={{ display: "flex", gap: "0.35rem", padding: "0.2rem 0.35rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: "0.44rem", fontWeight: 700, color: selectedSOP.color, fontFamily: "ui-monospace, monospace", flexShrink: 0, width: "1.2rem", textAlign: "right" }}>{step.step}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.5rem", color: "rgba(245,240,235,0.6)", lineHeight: 1.35 }}>{step.task}</div>
                  {step.materials.length > 0 && (
                    <div style={{ fontSize: "0.38rem", color: "rgba(245,240,235,0.3)", marginTop: 1, fontFamily: "ui-monospace, monospace" }}>
                      Needs: {step.materials.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Frequency Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {SCHEDULE_FREQUENCIES.map((freq) => (
          <div key={freq.label} style={{ display: "flex", alignItems: "center", gap: "0.2rem", padding: "0.15rem 0.35rem", borderRadius: "0.25rem", background: `${freq.color}08`, border: `1px solid ${freq.color}15` }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: freq.color }} />
            <span style={{ fontSize: "0.38rem", fontWeight: 600, color: freq.color, letterSpacing: "0.04em", textTransform: "uppercase" }}>{freq.label}</span>
          </div>
        ))}
      </div>

      {/* Harness Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0", marginTop: "auto" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
        <span style={{ fontSize: "0.46rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7ec8a0" }}>ESA Harness Active</span>
        <span style={{ fontSize: "0.38rem", color: "rgba(245,240,235,0.2)", marginLeft: "auto", fontFamily: "monospace" }}>v2.4.1</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN ESA WEB CONSOLE
   ═══════════════════════════════════════════════════════════ */
export default function ESAWebUI({ onLaunchCard }: { onLaunchCard?: (cardId: string) => void }) {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [currentModel, setCurrentModel] = useState("grok-4.5");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const filteredCards = ESA_CARDS.filter(
    (c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedModel = MODEL_OPTIONS.find((m) => m.id === currentModel) || MODEL_OPTIONS[0];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (activeCard) return;
    const ctx = gsap.context(() => {
      if (headerRef.current) gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.15 });
      if (gridRef.current) gsap.fromTo(gridRef.current.children, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out", stagger: 0.08, delay: 0.25 });
    });
    return () => ctx.revert();
  }, [activeCard]);

  useEffect(() => {
    if (!activeCard) return;
    const ctx = gsap.context(() => {
      if (chatBodyRef.current) gsap.fromTo(chatBodyRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      if (inputWrapperRef.current) gsap.fromTo(inputWrapperRef.current, { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out", delay: 0.2 });
    });
    return () => ctx.revert();
  }, [activeCard]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || loading) return;
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content: msgText.trim(), timestamp: new Date(), cardContext: activeCard || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setHasContent(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const response = getSimulatedResponse(activeCard || "maintenance");
    const assistantMsg: ChatMessage = { id: `msg-${Date.now()}-resp`, role: "assistant", content: response, timestamp: new Date(), cardContext: activeCard || undefined };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }, [input, loading, activeCard]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setHasContent(e.target.value.length > 0);
  }, []);

  const handleCardSelect = useCallback((card: ESAWorkCard) => {
    setActiveCard(card.id);
    setMessages([]);
    onLaunchCard?.(card.id);
  }, [onLaunchCard]);

  const handleBackToCards = useCallback(() => { setActiveCard(null); setMessages([]); }, []);

  const handleSidebarRequest = useCallback((_req: PendingRequest) => {
    setActiveCard("maintenance");
    onLaunchCard?.("maintenance");
  }, [onLaunchCard]);

  const handleSelectSOP = useCallback((_sop: GreenShieldSOP) => {
    // SOP selected — could expand into detail view or pre-fill chat
  }, []);

  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const activeCardData = ESA_CARDS.find((c) => c.id === activeCard);
  const ActiveIcon = activeCardData?.icon || Bot;

  return (
    <div style={{ display: "flex", gap: "1.25rem", minHeight: "calc(100vh - 160px)", padding: "1.25rem 0" }}>
      {/* ═══ LEFT SIDEBAR ═══ */}
      <ESASidebar
        onSelectRequest={handleSidebarRequest}
        onNewRequest={() => { setActiveCard("maintenance"); onLaunchCard?.("maintenance"); }}
        onSelectSOP={handleSelectSOP}
      />

      {/* ═══ MIDDLE + BOTTOM ═══ */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* ── MIDDLE: Card Grid or Chat ── */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {!activeCard ? (
            <>
              <div ref={headerRef} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#f5f0eb", margin: 0, letterSpacing: "-0.02rem" }}>Choose a Card</h2>
                  <p style={{ fontSize: "0.65rem", color: "rgba(245,240,235,0.4)", margin: "0.2rem 0 0", letterSpacing: "0.02em" }}>Select an ESA operations card to begin</p>
                </div>
                <div style={{ position: "relative", width: "220px" }}>
                  <Search style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(245,240,235,0.3)", pointerEvents: "none" }} />
                  <input type="text" placeholder="Search cards..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "0.45rem 0.7rem 0.45rem 2rem", borderRadius: "0.6rem", background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.3)", color: "#f5f0eb", fontSize: "0.65rem", outline: "none", transition: "border-color 0.2s", fontFamily: "'DM Sans', sans-serif" }} />
                </div>
              </div>
              <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", maxWidth: 900 }}>
                {filteredCards.map((card) => {
                  const Icon = card.icon;
                  const isHovered = hoveredCard === card.id;
                  return (
                    <div
                      key={card.id} onClick={() => handleCardSelect(card)}
                      onMouseEnter={() => setHoveredCard(card.id)} onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        position: "relative", borderRadius: "1rem", padding: "1.2rem 1rem", cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                        background: isHovered ? "rgba(24,24,27,0.8)" : "rgba(24,24,27,0.6)",
                        border: isHovered ? `1px solid ${card.color}33` : "1px solid rgba(63,63,70,0.3)",
                        boxShadow: isHovered ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
                        transform: isHovered ? "translateY(-2px)" : "none",
                      }}
                    >
                      <div style={{ position: "absolute", top: "-2rem", right: "-2rem", width: "6rem", height: "6rem", borderRadius: "50%", background: `radial-gradient(circle, ${card.color}15 0%, transparent 70%)`, pointerEvents: "none", opacity: isHovered ? 1 : 0, transition: "opacity 0.3s" }} />
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.7rem" }}>
                        <div style={{ width: "2.4rem", height: "2.4rem", borderRadius: "0.6rem", background: `${card.color}15`, border: `1px solid ${card.color}25`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isHovered ? `0 0 12px ${card.color}20` : "none" }}>
                          <Icon style={{ width: 20, height: 20, color: card.color, transform: isHovered ? "scale(1.1)" : "scale(1)", transition: "transform 0.3s" }} />
                        </div>
                        {card.badge && <div style={{ padding: "0.15rem 0.5rem", borderRadius: "2rem", background: `${card.badgeColor}18`, border: `1px solid ${card.badgeColor}33`, fontSize: "0.48rem", fontWeight: 600, color: card.badgeColor, letterSpacing: "0.04em" }}>{card.badge}</div>}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#f5f0eb", marginBottom: "0.15rem", letterSpacing: "-0.01rem" }}>{card.title}</div>
                      <div style={{ fontSize: "0.6rem", color: card.color, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{card.subtitle}</div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(245,240,235,0.45)", lineHeight: 1.5 }}>{card.description}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "0.7rem", opacity: isHovered ? 1 : 0.4, transition: "opacity 0.2s" }}>
                        <span style={{ fontSize: "0.5rem", fontWeight: 600, color: card.color, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: "0.3rem" }}>Open Console</span>
                        <ChevronRight style={{ width: 12, height: 12, color: card.color, transform: isHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.2s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* CHAT VIEW */
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexShrink: 0 }}>
                <button onClick={handleBackToCards} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "0.5rem", background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.4)", color: "rgba(245,240,235,0.7)", cursor: "pointer", transition: "all 0.2s" }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                </button>
                <div style={{ width: 36, height: 36, borderRadius: "0.6rem", background: `${activeCardData?.color || "#22d3ee"}15`, border: `1px solid ${activeCardData?.color || "#22d3ee"}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ActiveIcon style={{ width: 20, height: 20, color: activeCardData?.color || "#22d3ee" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#f5f0eb", letterSpacing: "-0.01rem" }}>{activeCardData?.title}</div>
                  <div style={{ fontSize: "0.55rem", color: activeCardData?.color, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{activeCardData?.subtitle}</div>
                </div>
                <div style={{ position: "relative" }}>
                  <select value={currentModel} onChange={(e) => setCurrentModel(e.target.value)} style={{ appearance: "none", padding: "0.4rem 1.8rem 0.4rem 0.65rem", borderRadius: "0.5rem", background: "rgba(24,24,27,0.8)", border: "1px solid rgba(63,63,70,0.4)", color: "rgba(245,240,235,0.8)", fontSize: "0.6rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
                    {MODEL_OPTIONS.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.provider})</option>)}
                  </select>
                  <ChevronDown style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "rgba(245,240,235,0.4)", pointerEvents: "none" }} />
                </div>
              </div>
              <div ref={chatBodyRef} className="ava-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "0.5rem" }}>
                {messages.length === 0 && !loading && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem", padding: "1rem 0" }}>
                    <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                      <div style={{ width: 52, height: 52, borderRadius: "1rem", background: `${activeCardData?.color || "#22d3ee"}12`, border: `1px solid ${activeCardData?.color || "#22d3ee"}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                        <Sparkles style={{ width: 24, height: 24, color: activeCardData?.color || "#22d3ee" }} />
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#f5f0eb", marginBottom: "0.25rem" }}>{activeCardData?.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(245,240,235,0.4)", lineHeight: 1.5, maxWidth: 420, margin: "0 auto" }}>{activeCardData?.description}</div>
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", padding: "0 0.25rem" }}>
                    <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <div style={{ fontSize: "0.45rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: msg.role === "user" ? "rgba(245,240,235,0.3)" : activeCardData?.color, padding: "0 0.25rem" }}>
                        {msg.role === "user" ? "You" : `ESA - ${selectedModel.label}`}
                      </div>
                      <div style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: msg.role === "user" ? "0.75rem 0.75rem 0.2rem 0.75rem" : "0.75rem 0.75rem 0.75rem 0.2rem",
                        background: msg.role === "user" ? `linear-gradient(135deg, ${activeCardData?.color || "#22d3ee"}25, ${activeCardData?.color || "#22d3ee"}12)` : "rgba(24,24,27,0.7)",
                        border: msg.role === "user" ? `1px solid ${activeCardData?.color || "#22d3ee"}35` : "1px solid rgba(63,63,70,0.35)",
                        color: "rgba(245,240,235,0.85)", fontSize: "0.72rem", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: "0.38rem", color: "rgba(245,240,235,0.2)", padding: "0 0.25rem", textAlign: msg.role === "user" ? "right" : "left" }}>{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start", padding: "0 0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.85rem", borderRadius: "0.75rem", background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.35)" }}>
                      <Loader2 style={{ width: 14, height: 14, color: activeCardData?.color || "#22d3ee" }} />
                      <span style={{ fontSize: "0.6rem", color: "rgba(245,240,235,0.4)", fontFamily: "'DM Sans', sans-serif" }}>ESA is reasoning...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        {/* ═══ BOTTOM: INPUT INGESTION INTERFACE ═══ */}
        <div ref={inputWrapperRef} style={{ flexShrink: 0, paddingTop: "0.75rem" }}>
          <div className="esa-chat-input-controls" style={{
            position: "relative", background: "rgba(0, 0, 0, 0.55)",
            border: isFocused || hasContent ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "0.75rem 1rem 0.6rem",
            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
            boxShadow: isFocused ? "inset 0 0.5px rgba(255,255,255,0.5), 0 0 40px -10px rgba(201,168,76,0.12)" : "inset 0 0.5px rgba(255,255,255,0.25)",
          }}>
            <div style={{ position: "absolute", top: 8, right: 12, zIndex: 2, display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, fontFamily: "ui-monospace, monospace", color: "rgba(201,168,76,0.8)", letterSpacing: "0.04em", userSelect: "none" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4af37", boxShadow: "0 0 6px #d4af37" }} />
              <span>{activeCardData?.title || "ESA"}</span>
            </div>
            <textarea
              ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? " " : `Ask ESA about ${activeCardData?.title?.toLowerCase() || "maintenance"}...`}
              rows={1}
              style={{ width: "100%", background: "transparent", border: 0, resize: "none", outline: "none", color: "rgba(245,240,235,0.9)", caretColor: "#d4af37", fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, minHeight: "3lh", maxHeight: "8lh", overflowY: "auto", paddingTop: "0.25rem" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.5rem", position: "relative", zIndex: 1 }}>
              <ActionButton title="Attach File" icon={Paperclip} onClick={() => {}} />
              <ActionButton title="Scan Barcode" icon={ScanBarcode} onClick={() => {}} />
              <ActionButton title="Upload Image" icon={ImagePlus} onClick={() => {}} />
              <ActionButton title="Voice Input" icon={Mic} onClick={() => {}} />
              <div style={{ flex: 1 }} />
              {loading ? (
                <button title="Stop Generating" style={{ appearance: "none", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, cursor: "pointer" }}>
                  <StopCircle style={{ width: 16, height: 16 }} />
                </button>
              ) : (
                <button onClick={() => sendMessage()} disabled={!hasContent} title="Send Message" style={{ appearance: "none", border: hasContent ? "1px solid rgba(201,168,76,0.35)" : "1px solid rgba(255,255,255,0.08)", background: hasContent ? "rgba(201,168,76,0.12)" : "transparent", color: hasContent ? "#d4af37" : "rgba(255,255,255,0.2)", width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, cursor: hasContent ? "pointer" : "default", transition: "all 0.2s" }}>
                  <Send style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.4rem", padding: "0 0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
              <span style={{ fontSize: "0.45rem", color: "rgba(245,240,235,0.3)", fontFamily: "ui-monospace, monospace", letterSpacing: "0.06em" }}>{selectedModel.label} - {selectedModel.provider} - {messages.length} messages</span>
            </div>
            <span style={{ fontSize: "0.4rem", color: "rgba(245,240,235,0.15)", fontFamily: "ui-monospace, monospace" }}>Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
