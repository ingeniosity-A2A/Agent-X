import { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send, ScanBarcode, ImagePlus, Package, ShoppingCart, FileText, Eye, Music, Check, Plus, X,
} from "lucide-react";
import { IngeniosityLens } from "./IngeniosityLens";
import { PianoWaverPanel } from "./PianoWaverPanel";
import type { LensPipelineResult, SpatialElement } from "@/lib/exoskeleton/ingeniosity-lens";
import "./esa-input-interface.css";

/* ─────────────────────────────────────────────────────────
   BARREL TEXT  (animated cycling placeholder)
───────────────────────────────────────────────────────── */
function BarrelText({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % texts.length), 2800);
    return () => clearInterval(id);
  }, [texts.length]);
  return (
    <div className="relative overflow-hidden" style={{ height: "1.7em" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={idx}
          initial={{ y:"100%", opacity:0 }} animate={{ y:"0%", opacity:1 }} exit={{ y:"-100%", opacity:0 }}
          transition={{ duration:0.38, ease:[0.16,1,0.3,1] }}
          className="absolute inset-0 flex items-center"
          style={{ color:"rgba(34,197,94,0.3)", fontSize:"15px", lineHeight:1.7, whiteSpace:"nowrap" }}>
          {texts[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TODO TASK ITEM
───────────────────────────────────────────────────────── */
interface TodoTask {
  id: string;
  text: string;
  done: boolean;
}

function TodoItem({ task, onToggle, onRemove }: { task: TodoTask; onToggle: () => void; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.4rem 0.6rem", borderRadius: "0.5rem",
        background: task.done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${task.done ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.12)"}`,
        transition: "all 0.2s",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 16, height: 16, borderRadius: "50%",
          border: `2px solid ${task.done ? "#22c55e" : "rgba(234,179,8,0.5)"}`,
          background: task.done ? "#22c55e" : "transparent",
          display: "grid", placeItems: "center", cursor: "pointer",
          flexShrink: 0, transition: "all 0.2s",
        }}
      >
        {task.done && <Check style={{ width: 9, height: 9, color: "#000" }} />}
      </button>
      <span style={{
        fontSize: "0.72rem", color: task.done ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.75)",
        textDecoration: task.done ? "line-through" : "none",
        flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {task.text}
      </span>
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", padding: 2, display: "grid", placeItems: "center" }}>
        <X style={{ width: 9, height: 9 }} />
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const DEV_BARREL = [
  'Sourcing HD Supply catalog data\u2026',
  'Routing part lookup through pipeline\u2026',
  'Parsing barcode from camera feed\u2026',
  'Indexing inventory to DuckDB\u2026',
  'Scanning shipment manifest\u2026',
];

const GREEN_BORDER = "p-[1.5px] bg-gradient-to-br from-[#22c55e]/70 via-[#166534]/30 to-[#22c55e]/70";
const GREEN_SHADOW = "0 0 0 1px rgba(34,197,94,0.12),0 30px 80px -20px rgba(0,0,0,0.95),0 0 60px -20px rgba(34,197,94,0.18)";
const MATTE       = "#080808";

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
   ESA Exoskeleton \u00b7 Ingestion Interface
───────────────────────────────────────────────────────── */
interface ESAInputInterfaceProps {
  capturedImage: string | null;
  capturedBarcode: string | null;
  onClearCapture: () => void;
  selectedPart: any;
  onOpenCamera: () => void;
  inventoryMode: boolean;
  onInventoryModeChange: (mode: boolean) => void;
  onSend?: (text: string) => void;
  avaActivated?: boolean;
}

export function ESAInputInterface({
  capturedImage,
  capturedBarcode,
  onClearCapture,
  selectedPart,
  onOpenCamera,
  inventoryMode,
  onInventoryModeChange,
  onSend,
  avaActivated = false,
}: ESAInputInterfaceProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [lensActive, setLensActive] = useState(false);
  const [waverOpen, setWaverOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [tasks, setTasks] = useState<TodoTask[]>([
    { id: "t1", text: "Inspect HVAC Room air filters", done: false },
    { id: "t2", text: "Order Moen faucet cartridge (B-04)", done: false },
    { id: "t3", text: "Check LCN door closer lobby", done: false },
    { id: "t4", text: "Count Honeywell thermostats Rm 204", done: false },
    { id: "t5", text: "Submit end-of-day inventory report", done: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--glow-x', String(e.clientX - rect.left));
    e.currentTarget.style.setProperty('--glow-y', String(e.clientY - rect.top));
  }, []);

  const showPlaceholder = !isFocused && !hasContent && !capturedImage && !capturedBarcode;

  const handleLensCapture = useCallback((imageDataUrl: string, _result?: LensPipelineResult) => {
    console.log('[ESAInput] Lens capture complete');
  }, []);

  const handleSpatialAction = useCallback((_element: SpatialElement) => {
    console.log('[ESAInput] Spatial action:', _element.id, _element.type);
  }, []);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    onSend?.(text);
    setInputValue("");
    setHasContent(false);
    if (textareaRef.current) textareaRef.current.value = "";
  }, [inputValue, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addTask = useCallback(() => {
    const text = newTask.trim();
    if (!text) return;
    setTasks(prev => [...prev, { id: `t${Date.now()}`, text, done: false }]);
    setNewTask("");
  }, [newTask]);

  useEffect(() => {
    if (avaActivated) setWaverOpen(true);
  }, [avaActivated]);

  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;

  return (
    <div className="w-full px-3 py-3 flex flex-col items-center bg-transparent">
      <div className="relative w-full max-w-[1024px]">

        {/* Green chassis */}
        <motion.div layout className={"relative rounded-[28px] " + GREEN_BORDER}
          style={{ boxShadow: GREEN_SHADOW, animationName: "greenPulse", animationDuration: "3.5s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <div className="relative rounded-[27px] overflow-hidden flex flex-col p-5 gap-3"
            style={{ background: MATTE, border: "1px solid rgba(34,197,94,0.12)" }}>

            <div className="ava-grid-bg" />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.06), transparent 70%)" }} />

            {/* Header */}
            <div className="relative flex items-center gap-2">
              <span className="h-2 w-2 rounded-full"
                style={{ background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse 2s infinite" }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(34,197,94,0.7)" }}>
                {'Things To Do Today'}
              </span>
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "rgba(234,179,8,0.7)", marginLeft: "auto" }}>
                {doneCount}/{totalCount}
              </span>
              <button
                onClick={() => setWaverOpen(w => !w)}
                className={"ava-action-btn" + (waverOpen ? " ava-action-btn--active" : "")}
                title="Toggle Audio Panel"
                style={{ width: 28, height: 28 }}>
                <Music style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Todo List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: "160px", overflowY: "auto", position: "relative", zIndex: 1 }} className="ava-scroll">
              <AnimatePresence>
                {tasks.map(task => (
                  <TodoItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} onRemove={() => removeTask(task.id)} />
                ))}
              </AnimatePresence>
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.15rem" }}>
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                  placeholder="Add task\u2026"
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(234,179,8,0.15)",
                    borderRadius: "0.5rem", padding: "0.3rem 0.55rem", fontSize: "0.68rem",
                    color: "rgba(255,255,255,0.8)", outline: "none",
                  }}
                />
                <button onClick={addTask} style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.25)",
                  display: "grid", placeItems: "center", cursor: "pointer",
                }}>
                  <Plus style={{ width: 11, height: 11, color: "#eab308" }} />
                </button>
              </div>
            </div>

            {/* Input container */}
            <div ref={inputRef} className="ava-input-controls" onPointerMove={handlePointerMove}>
              {capturedImage && (
                <div className="flex items-center gap-2 mb-2 relative z-1">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(34,197,94,0.3)" }}>
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono" style={{ color: "rgba(34,197,94,0.7)" }}>IMAGE CAPTURED</div>
                    <div className="text-[10px] text-zinc-500 truncate">Ready for ingestion</div>
                  </div>
                  <button onClick={onClearCapture} className="text-[10px] px-2 py-1 rounded-md" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Clear</button>
                </div>
              )}

              {capturedBarcode && (
                <div className="flex items-center gap-2 mb-2 relative z-1">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <ScanBarcode className="w-5 h-5" style={{ color: "#22c55e" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono" style={{ color: "rgba(34,197,94,0.7)" }}>BARCODE</div>
                    <div className="text-[11px] text-zinc-300 font-mono truncate">{capturedBarcode}</div>
                  </div>
                  <button onClick={onClearCapture} className="text-[10px] px-2 py-1 rounded-md" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Clear</button>
                </div>
              )}

              {showPlaceholder && (
                <div className="absolute top-3 left-4 pointer-events-none z-0">
                  <BarrelText texts={DEV_BARREL} />
                </div>
              )}

              <textarea
                ref={textareaRef}
                className="ava-textarea"
                placeholder=" "
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setHasContent(e.target.value.length > 0); }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
              />

              <div className="ava-ai-badge">
                <span className="ava-ai-badge-dot" />
                <span>Agent X</span>
              </div>

              <div className="ava-actions">
                <button className="ava-action-btn" title="Scan Barcode" onClick={onOpenCamera}><ScanBarcode /></button>
                <button className="ava-action-btn" title="Upload Image" onClick={onOpenCamera}><ImagePlus /></button>
                <button
                  className={"ava-action-btn" + (inventoryMode ? " ava-action-btn--active" : "")}
                  title={inventoryMode ? "Inventory Mode (active)" : "Switch to Inventory Mode"}
                  onClick={() => onInventoryModeChange(!inventoryMode)}>
                  <Package />
                </button>
                <button
                  className={"ava-action-btn" + (!inventoryMode ? " ava-action-btn--active" : "")}
                  title={!inventoryMode ? "Order Mode (active)" : "Switch to Order Mode"}
                  onClick={() => onInventoryModeChange(false)}>
                  <ShoppingCart />
                </button>
                <button
                  className={"ava-action-btn ava-lens-btn" + (lensActive ? " ava-lens-btn--active" : "")}
                  title="Ingeniosity Lens"
                  onClick={() => setLensActive(true)}>
                  <Eye />
                </button>
                <button
                  className={"ava-text-send-btn" + (hasContent ? " ava-text-send-btn--active" : "")}
                  title="Send"
                  onClick={handleSend}>
                  <Send style={{ width: 14, height: 14 }} />
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="ava-email-btn">
                  <div className="flex items-center gap-1.5">
                    <FileText style={{ width: 13, height: 13 }} />
                    <span>Email PDF</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PianoWaver slide-down panel */}
        <PianoWaverPanel isOpen={waverOpen} onClose={() => setWaverOpen(false)} />

      </div>

      <IngeniosityLens
        active={lensActive}
        onClose={() => setLensActive(false)}
        onCapture={handleLensCapture}
        onSpatialAction={handleSpatialAction}
      />
    </div>
  );
}
