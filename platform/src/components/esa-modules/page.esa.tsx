"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import {
  Package,
  AlertTriangle,
  Camera,
  QrCode,
  Truck,
  Search,
  RefreshCw,
  MapPin,
  ChevronRight,
  BarChart3,
  Send,
  ImagePlus,
  FileText,
  Wrench,
  X,
  ArrowDownToLine,
  ExternalLink,
  XCircle,
  Check,
  Loader2,
  Cpu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  InventoryPulseOrb,
} from "@/components/ava/InventoryPulseOrb";
import {
  InventoryCard,
  StatPill,
  PartDetailContent,
  type InventoryPart,
} from "@/components/ava/InventoryCard";
import {
  InventoryPartCard,
  DEMO_PARTS,
} from "@/components/ava/InventoryPartCard";
import {
  MaintenanceRequestComplete,
  DEMO_MAINTENANCE_REQUESTS,
} from "@/components/ava/MaintenanceRequestComplete";
import ESAMaintenanceCard from "@/components/ava/ESAMaintenanceCard";
import { ESAHarness } from "@/components/ava/ESAHarness";
// Ingestion components (ESAInputInterface, CameraLens, IngeniosityLens, PianoWaver)
// are NOT part of the ESA UI. They belong to the Ava007 ingestion/exoskeleton layer.
// Removed from this file — ESA is self-contained.
import ExoskeletonDashboard from "@/components/ava/ExoskeletonDashboard";
import ESAWebUI from "@/components/ava/ESAWebUI";
import GrokConsole from "@/components/ava/GrokConsole";
import { useReorderStore } from "@/lib/reorder-store";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type ViewMode = "dashboard" | "add" | "receive";
type CardMode = "inventory" | "partcard" | "maintenance" | "maintenance-legacy" | "exoskeleton" | "console";

/* ═══════════════════════════════════════════════════════════
   MAIN INTERFACE
   ═══════════════════════════════════════════════════════════ */
export default function AVAInventoryInterface() {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [selected, setSelected] = useState<InventoryPart | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("dashboard");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [orbStatus, setOrbStatus] = useState<
    "idle" | "listening" | "reasoning" | "tooling" | "speaking"
  >("idle");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state for Add Part
  const [addName, setAddName] = useState("");
  const [addBrand, setAddBrand] = useState("");
  const [addSku, setAddSku] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addReorder, setAddReorder] = useState("5");
  const [addTags, setAddTags] = useState("");
  const [addBin, setAddBin] = useState("");
  const [adding, setAdding] = useState(false);

  // Receive stock form
  const [receiveQty, setReceiveQty] = useState("");
  const [receiving, setReceiving] = useState(false);

  // Card / view mode
  const [cardMode, setCardMode] = useState<CardMode>("inventory");
  const cartCount = useReorderStore((s) => s.items.length);

  // Refs for GSAP
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const chassisRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    if (toastRef.current) {
      gsap.fromTo(
        toastRef.current,
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
    const t = setTimeout(() => {
      if (toastRef.current) {
        gsap.to(toastRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setToast(null),
        });
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Fetch inventory
  const fetchParts = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setParts(data);
      }
    } catch (err) {
      console.error("Failed to fetch parts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Computed
  const lowStock = parts.filter((p) => p.qty < p.reorderPoint);
  const totalQty = parts.reduce((s, p) => s + p.qty, 0);
  const filtered = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  // GSAP entrance animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (gridRef.current) {
      tl.fromTo(
        gridRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5 },
        0
      );
    }
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.1
      );
    }
    if (sidebarRef.current) {
      tl.fromTo(
        sidebarRef.current,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.7 },
        0.2
      );
    }
    if (mainRef.current) {
      tl.fromTo(
        mainRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7 },
        0.3
      );
    }
  }, []);

  // Animate chassis panel
  useEffect(() => {
    if (!chassisRef.current) return;
    if (view !== "dashboard") {
      gsap.fromTo(
        chassisRef.current,
        { opacity: 0, y: 60, scale: 0.95, transformPerspective: 800, rotateX: 6 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.6, ease: "power3.out" }
      );
      setOrbStatus("tooling");
    } else {
      setOrbStatus("idle");
    }
  }, [view]);

  // Handlers
  const handleSelectPart = (part: InventoryPart) => {
    setSelected(part);
    setDetailOpen(true);
    setOrbStatus("speaking");
    setTimeout(() => setOrbStatus("idle"), 1500);
  };

  const handleAddPart = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    setOrbStatus("reasoning");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: addSku || undefined,
          name: addName,
          brand: addBrand || undefined,
          qty: parseInt(addQty) || 0,
          reorderPoint: parseInt(addReorder) || 5,
          usageTags: addTags,
          locationBin: addBin || undefined,
        }),
      });
      if (res.ok) {
        await fetchParts();
        setAddName("");
        setAddBrand("");
        setAddSku("");
        setAddQty("");
        setAddReorder("5");
        setAddTags("");
        setAddBin("");
        setView("dashboard");
        setToast({ message: "Part added to inventory", type: "success" });
      } else {
        setToast({ message: "Failed to add part", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setAdding(false);
      setOrbStatus("idle");
    }
  };

  const handleReceiveStock = async (part?: InventoryPart) => {
    const target = part || selected;
    const qty = parseInt(receiveQty) || 1;
    if (!target) return;
    setReceiving(true);
    setOrbStatus("tooling");
    try {
      const res = await fetch(`/api/inventory/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: target.qty + qty, lastUpdated: new Date().toISOString() }),
      });
      if (res.ok) {
        await fetchParts();
        setReceiveQty("");
        setView("dashboard");
        setDetailOpen(false);
        setSelected(null);
        setToast({ message: `Received ${qty} units of ${target.name}`, type: "success" });
      }
    } catch {
      setToast({ message: "Failed to receive stock", type: "error" });
    } finally {
      setReceiving(false);
      setOrbStatus("idle");
    }
  };

  const handleAdjustQty = async (part: InventoryPart, delta: number) => {
    setOrbStatus("tooling");
    try {
      const res = await fetch(`/api/inventory/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: Math.max(0, part.qty + delta), lastUpdated: new Date().toISOString() }),
      });
      if (res.ok) {
        await fetchParts();
        // Update selected part if detail is open
        if (selected?.id === part.id) {
          setSelected((prev) => prev ? { ...prev, qty: Math.max(0, prev.qty + delta) } : prev);
        }
      }
    } finally {
      setOrbStatus("idle");
    }
  };

  const handleReorder = (part: InventoryPart) => {
    setToast({ message: `HD Supply Punch-In handoff for ${part.sku} — ${part.name}`, type: "success" });
    // In production this would redirect to HD Supply Punch-In
  };

  const handleSync = () => {
    setOrbStatus("reasoning");
    setTimeout(() => {
      fetchParts();
      setOrbStatus("idle");
      setToast({ message: "HD Supply catalog synced", type: "success" });
    }, 1500);
  };

  return (
    <ESAHarness>
      <div style={{ minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      {/* Grid overlay */}
      <div
        ref={gridRef}
        className="ava-grid-overlay"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0 }}
      />

      {/* Toast */}
      {toast && (
        <div
          ref={toastRef}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
            color: toast.type === "success" ? "#34d399" : "#f87171",
            boxShadow: `0 0 20px ${toast.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span className="text-[12px] font-medium">{toast.message}</span>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header
        ref={headerRef}
        className="relative z-10"
        style={{
          borderBottom: "1px solid rgba(63,63,70,0.4)",
          background: "linear-gradient(to bottom, rgba(9,9,11,0.95), rgba(9,9,11,0.8))",
          opacity: 0,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "linear-gradient(135deg,#003B71,#0055A4)",
                border: "1px solid rgba(0,59,113,0.6)",
                overflow: "hidden",
              }}
            >
              {/* Extended Stay America brand mark */}
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                <rect x="0" y="0" width="32" height="32" rx="6" fill="#003B71"/>
                <text x="16" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="bold" fontFamily="Arial,sans-serif">E</text>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-semibold tracking-wide">AVA Inventory</div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                <MapPin className="w-3 h-3" />
                Extended Stay America · Buckhead · Brookhaven, GA
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lowStock.length > 0 && (
              <div className="ava-pulse-low flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.4)", color: "#fb923c" }}>
                <AlertTriangle className="w-3 h-3" />
                {lowStock.length} LOW STOCK
              </div>
            )}
            <span className="text-[10px] font-mono text-zinc-500 px-2 py-1 rounded-full" style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(63,63,70,0.4)" }}>
              HD Supply · Punch-In Ready
            </span>
          </div>
        </div>
      </header>

      {/* ═══ VIEW MODE TABS ═══ */}
      <div className="relative z-10" style={{ background: "rgba(9,9,11,0.85)", borderBottom: "1px solid rgba(63,63,70,0.3)" }}>
        <div className="max-w-[1200px] mx-auto px-5 flex items-center gap-1 py-2">
          {([
            { key: "inventory", label: "Dashboard", icon: BarChart3 },
            { key: "partcard", label: "Part Card", icon: Package },
            { key: "maintenance", label: "ESA Maint.", icon: Wrench },
            { key: "maintenance-legacy", label: "Maint. Complete", icon: Wrench },
            { key: "exoskeleton", label: "Exoskeleton", icon: Cpu },
            { key: "console", label: "Console", icon: Bot },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCardMode(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: cardMode === tab.key ? "rgba(124,58,237,0.15)" : "transparent",
                border: cardMode === tab.key ? "1px solid rgba(124,58,237,0.35)" : "1px solid transparent",
                color: cardMode === tab.key ? "#c4b5fd" : "#71717a",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
        </div>
      </div>

      {/* ═══ ALTERNATIVE VIEWS ═══ */}
      {cardMode === "partcard" && (
        <div className="relative z-10 flex flex-col items-center gap-4 py-4" style={{ minHeight: "auto" }}>
          <InventoryPartCard
            parts={DEMO_PARTS}
            onOrderComplete={(parts) => {
              setToast({ message: `Order request submitted for ${parts.length} parts — PDF will be emailed.`, type: "success" });
            }}
          />
        </div>
      )}
      {cardMode === "maintenance" && (
        <div className="relative z-10 flex flex-col items-center gap-4 py-4" style={{ minHeight: "auto" }}>
          <ESAMaintenanceCard />
        </div>
      )}
      {cardMode === "maintenance-legacy" && (
        <div className="relative z-10 flex flex-col items-center gap-4 py-4" style={{ minHeight: "auto" }}>
          <MaintenanceRequestComplete
            requests={DEMO_MAINTENANCE_REQUESTS}
            onStatusChange={(id, status) => {
              setToast({ message: `Request ${id} marked as ${status === 'completed' ? 'Completed' : 'Waiting for Supplies'}`, type: "success" });
            }}
            onRequestSubmit={(req) => {
              setToast({ message: `Maintenance request for Room ${req.roomNumber} submitted — ${req.partsUsed.length} parts used.`, type: "success" });
            }}
          />
        </div>
      )}
      {/* Ingestion mode removed — ingestion is not an ESA module.
          Use the main Ava007 console for barcode/image ingestion. */}
      {cardMode === "exoskeleton" && (
        <div className="relative z-10" style={{ minHeight: "calc(100vh - 160px)" }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <ESAWebUI
              onLaunchCard={(cardId) => {
                const modeMap: Record<string, CardMode> = {
                  dashboard: "inventory",
                  partcard: "partcard",
                  maintenance: "maintenance",
                  console: "console",
                  lens: "exoskeleton",
                  reorder: "inventory",
                };
                const target = modeMap[cardId];
                if (target) {
                  setCardMode(target);
                  setToast({ message: `Launched: ${cardId}`, type: "success" });
                }
              }}
            />
          </div>
        </div>
      )}
      {/* Audio module removed — not an ESA module. */}
      {cardMode === "console" && (
        <div className="relative z-10" style={{ minHeight: "calc(100vh - 96px)" }}>
          <GrokConsole />
        </div>
      )}

      {/* Camera Lens removed — ingestion is not an ESA module. */}

      {/* ═══ BODY ═══ (only shown in inventory dashboard mode) ═══ */}
      {cardMode === "inventory" && (
      <React.Fragment>
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-5 flex flex-col lg:flex-row gap-5">
        {/* LEFT: Pulse + Stats + Actions */}
        <aside ref={sidebarRef} className="w-full lg:w-[280px] flex-shrink-0 space-y-4" style={{ opacity: 0 }}>
          {/* Pulse Orb */}
          <div className="flex justify-center">
            <InventoryPulseOrb lowStockCount={lowStock.length} totalParts={parts.length} status={orbStatus} />
          </div>

          {/* Agent Status Labels */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { label: "IRIS", sub: "Vision", color: "#a78bfa" },
              { label: "FORGE", sub: "SKU Match", color: "#22d3ee" },
              { label: "NEXUS", sub: "Reorder", color: "#fb923c" },
              { label: "AVA", sub: "Executive", color: "#34d399" },
            ].map((agent) => (
              <div key={agent.label} className="text-center">
                <div
                  className="text-[9px] font-mono font-bold tracking-wider"
                  style={{ color: agent.color }}
                >
                  {agent.label}
                </div>
                <div className="text-[8px] font-mono text-zinc-600">{agent.sub}</div>
              </div>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatPill label="SKUs" value={parts.length} color="#22d3ee" icon={Package} delay={0.2} />
            <StatPill label="On Hand" value={totalQty} color="#34d399" icon={BarChart3} delay={0.3} />
            <StatPill label="Low" value={lowStock.length} color="#fb923c" icon={AlertTriangle} delay={0.4} />
            <StatPill label="Bins" value="12" color="#a78bfa" icon={MapPin} delay={0.5} />
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setView(view === "add" ? "dashboard" : "add");
                if (view !== "add") setOrbStatus("listening");
                else setOrbStatus("idle");
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: view === "add" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                boxShadow: "0 0 18px rgba(124,58,237,0.35)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#fff",
              }}
            >
              <Camera className="w-4 h-4" />
              Add Part (Photo / Model)
            </button>
            <button
              onClick={() => {
                setView(view === "receive" ? "dashboard" : "receive");
                if (view !== "receive") setOrbStatus("listening");
                else setOrbStatus("idle");
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-zinc-300 ava-neu-btn"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              Receive Stock
            </button>
            <button
              onClick={handleSync}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-zinc-300 ava-neu-btn"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Sync HD Supply
            </button>
          </div>

          {/* Low Stock Attention Panel */}
          {lowStock.length > 0 && (
            <div
              className="rounded-xl p-3 ava-scroll"
              style={{
                background: "rgba(251,146,60,0.06)",
                border: "1px solid rgba(251,146,60,0.25)",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              <div className="text-[10px] font-mono text-orange-400/80 tracking-wider mb-2">
                NEEDS ATTENTION
              </div>
              <div className="space-y-1.5">
                {lowStock.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPart(p)}
                    className="flex items-center justify-between text-[11px] cursor-pointer hover:bg-orange-500/10 rounded px-1.5 py-1 transition-colors"
                  >
                    <span className="truncate text-zinc-300">{p.name}</span>
                    <span className="font-mono text-orange-400 ml-2 flex-shrink-0">
                      {p.qty}/{p.reorderPoint}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER: Main Content */}
        <main ref={mainRef} className="flex-1 min-w-0 space-y-4" style={{ opacity: 0 }}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU, name, brand..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
              style={{ background: "rgba(24,24,27,0.8)", border: "1px solid rgba(63,63,70,0.5)" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(0,212,255,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(63,63,70,0.5)")}
            />
          </div>

          {/* Inventory Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((part, i) => (
                <InventoryCard
                  key={part.id}
                  part={part}
                  index={i}
                  onSelect={handleSelectPart}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-zinc-600 text-sm">
              No parts match your search
            </div>
          )}
        </main>
      </div>

      {/* ═══ BOTTOM CHASSIS ═══ */}
      <AnimateChassis
        chassisRef={chassisRef}
        view={view}
        addName={addName}
        setAddName={setAddName}
        addBrand={addBrand}
        setAddBrand={setAddBrand}
        addSku={addSku}
        setAddSku={setAddSku}
        addQty={addQty}
        setAddQty={setAddQty}
        addReorder={addReorder}
        setAddReorder={setAddReorder}
        addTags={addTags}
        setAddTags={setAddTags}
        addBin={addBin}
        setAddBin={setAddBin}
        adding={adding}
        onAddPart={handleAddPart}
        onClose={() => setView("dashboard")}
        receiveQty={receiveQty}
        setReceiveQty={setReceiveQty}
        receiving={receiving}
        onReceive={handleReceiveStock}
      />
      </React.Fragment>
      )}

      {/* ═══ PART DETAIL SHEET ═══ */}
      <Sheet open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setOrbStatus("idle"); }}>
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-md border-l"
          style={{
            background: "linear-gradient(180deg, rgba(9,9,11,0.98), rgba(9,9,11,1))",
            borderLeftColor: "rgba(63,63,70,0.4)",
          }}
        >
          <SheetHeader className="px-5 pt-4 pb-0">
            <SheetTitle className="text-[13px] font-mono text-zinc-400 tracking-wider">
              INVENTORY DETAIL
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <PartDetailContent
              part={selected}
              onReceive={(p) => {
                setSelected(p);
                handleReceiveStock(p);
              }}
              onReorder={handleReorder}
              onAdjustQty={handleAdjustQty}
              onClose={() => setDetailOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
      </div>
    </ESAHarness>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED CHASSIS PANEL
   ═══════════════════════════════════════════════════════════ */
function AnimateChassis({
  chassisRef,
  view,
  addName,
  setAddName,
  addBrand,
  setAddBrand,
  addSku,
  setAddSku,
  addQty,
  setAddQty,
  addReorder,
  setAddReorder,
  addTags,
  setAddTags,
  addBin,
  setAddBin,
  adding,
  onAddPart,
  onClose,
  receiveQty,
  setReceiveQty,
  receiving,
  onReceive,
}: {
  chassisRef: React.RefObject<HTMLDivElement | null>;
  view: ViewMode;
  addName: string; setAddName: (v: string) => void;
  addBrand: string; setAddBrand: (v: string) => void;
  addSku: string; setAddSku: (v: string) => void;
  addQty: string; setAddQty: (v: string) => void;
  addReorder: string; setAddReorder: (v: string) => void;
  addTags: string; setAddTags: (v: string) => void;
  addBin: string; setAddBin: (v: string) => void;
  adding: boolean;
  onAddPart: () => void;
  onClose: () => void;
  receiveQty: string; setReceiveQty: (v: string) => void;
  receiving: boolean;
  onReceive: (part?: InventoryPart) => void;
}) {
  const inputStyle = {
    background: "rgba(24,24,27,0.8)",
    border: "1px solid rgba(63,63,70,0.5)",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: "12px",
    color: "#f4f4f5",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = "text-[10px] font-mono text-zinc-500 tracking-wider uppercase";

  if (view === "dashboard") return null;

  return (
    <div
      ref={chassisRef}
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "linear-gradient(to top, rgba(9,9,11,0.98), rgba(9,9,11,0.92))",
        borderTop: "1px solid rgba(63,63,70,0.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Close handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ background: "rgba(63,63,70,0.5)" }} />
      </div>

      <div className="max-w-[800px] mx-auto px-5 pb-5">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {view === "add" ? (
              <Camera className="w-4 h-4 text-violet-400" />
            ) : (
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-[13px] font-semibold text-zinc-200">
              {view === "add" ? "Add New Part" : "Receive Stock"}
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {view === "add" && (
          <div className="space-y-4">
            {/* Upload area row */}
            <div className="flex gap-2">
              <button className="ava-neu-btn flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-medium text-zinc-400 flex-1">
                <ImagePlus className="w-4 h-4 text-cyan-400" />
                Upload Photo
              </button>
              <button className="ava-neu-btn flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-medium text-zinc-400 flex-1">
                <QrCode className="w-4 h-4 text-violet-400" />
                Scan Barcode
              </button>
              <button className="ava-neu-btn flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-medium text-zinc-400 flex-1">
                <FileText className="w-4 h-4 text-orange-400" />
                Docs / Invoice
              </button>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={labelStyle}>Part Name *</div>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Thermostat - Digital..."
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <div className={labelStyle}>Brand</div>
                <input
                  value={addBrand}
                  onChange={(e) => setAddBrand(e.target.value)}
                  placeholder="Honeywell"
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <div className={labelStyle}>HD Supply SKU</div>
                <input
                  value={addSku}
                  onChange={(e) => setAddSku(e.target.value)}
                  placeholder="HD-88421"
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <div className={labelStyle}>Location Bin</div>
                <input
                  value={addBin}
                  onChange={(e) => setAddBin(e.target.value)}
                  placeholder="A-12"
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <div className={labelStyle}>Initial Qty</div>
                <input
                  type="number"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <div className={labelStyle}>Reorder Point</div>
                <input
                  type="number"
                  value={addReorder}
                  onChange={(e) => setAddReorder(e.target.value)}
                  placeholder="5"
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
            </div>

            <div>
              <div className={labelStyle}>Usage Tags (comma-separated)</div>
              <input
                value={addTags}
                onChange={(e) => setAddTags(e.target.value)}
                placeholder="HVAC, Guest Room"
                style={inputStyle}
                className="w-full mt-1"
              />
            </div>

            {/* Submit */}
            <button
              onClick={onAddPart}
              disabled={adding || !addName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                boxShadow: "0 0 18px rgba(124,58,237,0.35)",
                border: "1px solid rgba(167,139,250,0.3)",
              }}
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {adding ? "Processing..." : "Generate Inventory Card"}
            </button>
          </div>
        )}

        {view === "receive" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(24,24,27,0.7)", border: "1px solid rgba(63,63,70,0.4)" }}>
              <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
              <div className="flex-1">
                <div className="text-[11px] font-mono text-zinc-500 tracking-wider">RECEIVING MODE</div>
                <div className="text-[13px] text-zinc-300 mt-0.5">Scan barcode or select a part to receive stock</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={labelStyle}>Quantity to Receive</div>
                <input
                  type="number"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  placeholder="1"
                  min="1"
                  style={inputStyle}
                  className="w-full mt-1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => onReceive()}
                  disabled={receiving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 0 16px rgba(16,185,129,0.3)",
                    border: "1px solid rgba(52,211,153,0.3)",
                  }}
                >
                  {receiving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirm Receipt
                </button>
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-600 text-center">
              Tip: Open a part detail card first, then click Receive Shipment for faster workflow
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
