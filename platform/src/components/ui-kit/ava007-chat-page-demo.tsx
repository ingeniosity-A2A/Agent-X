"use client";

/**
 * AVA007 UI KIT — Chat Page Demo
 * ------------------------------------------------------------
 * High-fidelity, interactive full-page chatbot workspace that puts
 * Ava007PromptWidget in action (Nocra chat-page spec, rebranded to
 * Ava007 — brands do not mingle):
 *
 * · elegant left-rail navigation drawer (static on desktop,
 *   slide-over on mobile)
 * · message bubbles + generating shimmer skeleton
 * · header status indicators (engine chip, online pulse, theme)
 * · live dark/light mode toggle (scoped to the kit root — never
 *   leaks into host surfaces)
 *
 * Honest wiring: no model backend is mounted on this route yet
 * (platform /api/ai exposes intent + tts only), so the assistant
 * reply is a clearly labeled local demo reply. The widget state
 * machine (prompt, model flyout, image upload, style assistant,
 * generating spinner) is fully real.
 *
 * Styling: ./ava007-prompt-widget.css (Tailwind v4 CSS-first).
 * No new dependencies: lucide-react only.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Aperture,
  Cpu,
  FolderOpen,
  LayoutGrid,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import Ava007PromptWidget, {
  type Ava007GeneratePayload,
} from "./ava007-prompt-widget";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  meta?: string;
  generating?: boolean;
}

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    text: "Ava007 Studio online. This workspace runs the Ava007 UI Kit — the unified Bento + prompt-widget skill. Describe a build and press Generate.",
  },
  {
    id: 2,
    role: "user",
    text: "Draft a bento landing hero with the aurora gradient stroke.",
  },
  {
    id: 3,
    role: "assistant",
    text: "Locked in — 23px hardware curvature, adaptive dual-shadow, red → purple → blue stroke. Refine it below or describe the next screen.",
  },
];

const RAIL_ITEMS = [
  { icon: MessageSquare, label: "Chats", active: true },
  { icon: LayoutGrid, label: "Studio" },
  { icon: Cpu, label: "Models" },
  { icon: FolderOpen, label: "Files" },
  { icon: Settings, label: "Settings" },
] as const;

let nextId = 100;

export default function Ava007ChatPageDemo() {
  const [dark, setDark] = useState(true);
  const [railOpen, setRailOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    []
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleGenerate = useCallback((payload: Ava007GeneratePayload) => {
    const userText =
      payload.prompt ||
      (payload.images.length
        ? `(reference images: ${payload.images.join(", ")})`
        : "(empty prompt)");

    const userMsg: ChatMessage = {
      id: ++nextId,
      role: "user",
      text: userText,
      meta: [
        payload.model,
        payload.style ? `style: ${payload.style}` : null,
        payload.images.length ? `${payload.images.length} image(s)` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    };
    const pendingId = ++nextId;
    const pendingMsg: ChatMessage = {
      id: pendingId,
      role: "assistant",
      text: "",
      generating: true,
    };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);

    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                generating: false,
                text:
                  `Local demo reply — the Ava007 UI Kit state machine accepted ` +
                  `"${userText.slice(0, 80)}" on ${payload.model}` +
                  (payload.style ? ` with the ${payload.style} style` : "") +
                  `. No model backend is wired to this route yet; when the ` +
                  `chat engine lands it plugs into this exact surface.`,
              }
            : m
        )
      );
    }, 2200);
  }, []);

  return (
    <div
      className={`ava007-kit ${dark ? "dark" : ""} flex h-[100dvh] w-full overflow-hidden bg-[var(--ava007-bg)] text-[var(--ava007-text)]`}
      data-testid="ava007-chat-demo"
    >
      {/* ── left-rail navigation drawer ─────────────────────── */}
      {railOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 cursor-default bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setRailOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-[var(--ava007-line)] bg-[var(--ava007-panel)] transition-transform duration-200 lg:static lg:translate-x-0 ${
          railOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="ava007-rail"
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="ava007-aurora-ring !p-[1.5px]">
            <span className="ava007-aurora-inner flex size-8 items-center justify-center rounded-full">
              <Aperture size={16} aria-hidden />
            </span>
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">
              Ava007
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--ava007-text-3)]">
              UI Kit
            </span>
          </span>
          <button
            type="button"
            className="ml-auto cursor-pointer text-[var(--ava007-text-3)] lg:hidden"
            aria-label="Close navigation"
            onClick={() => setRailOpen(false)}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-2">
          {RAIL_ITEMS.map(({ icon: Icon, label, ...rest }) => {
            const isActive = "active" in rest && rest.active;
            return (
              <button
                key={label}
                type="button"
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--ava007-chip)] text-[var(--ava007-text)]"
                    : "text-[var(--ava007-text-2)] hover:bg-[var(--ava007-chip)] hover:text-[var(--ava007-text)]"
                }`}
              >
                <Icon size={15} aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[var(--ava007-line)] px-4 py-3">
          <p className="text-[10px] text-[var(--ava007-text-3)]">
            Ava007 UI Kit v0.1 · unified Bento + prompt widget
          </p>
        </div>
      </aside>

      {/* ── main column ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header with status indicators */}
        <header className="flex items-center gap-3 border-b border-[var(--ava007-line)] bg-[var(--ava007-panel)] px-4 py-3 sm:px-6">
          <button
            type="button"
            className="cursor-pointer text-[var(--ava007-text-2)] lg:hidden"
            aria-label="Open navigation"
            onClick={() => setRailOpen(true)}
            data-testid="ava007-rail-toggle"
          >
            <Menu size={18} aria-hidden />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight">
              AVA007 Studio — chat
            </h1>
            <p className="text-[10px] text-[var(--ava007-text-3)]">
              Agent Browser · Interface · UI Kit
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="ava007-chip">
              <Cpu size={11} aria-hidden />
              <span className="hidden sm:inline">Ava007 Aurora 1.4</span>
              <span className="sm:hidden">Aurora</span>
            </span>
            <span className="ava007-chip">
              <span className="ava007-pulse-dot inline-block size-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
            <button
              type="button"
              className="ava007-action-badge size-8 cursor-pointer"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
              onClick={() => setDark((v) => !v)}
              data-testid="ava007-theme-toggle"
            >
              {dark ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
            </button>
            <button
              type="button"
              className="ava007-action-badge size-8 cursor-pointer"
              aria-label="New chat"
              title="New chat"
              onClick={() => setMessages(SEED_MESSAGES)}
            >
              <Plus size={14} aria-hidden />
            </button>
          </div>
        </header>

        {/* message stream */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
          data-testid="ava007-stream"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ava007-fade-up flex gap-3 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <span className="ava007-aurora-ring mt-1 !p-[1.5px]">
                    <span className="ava007-aurora-inner flex size-7 items-center justify-center rounded-full">
                      <Aperture size={13} aria-hidden />
                    </span>
                  </span>
                )}
                <div
                  className={`max-w-[78%] rounded-[18px] border px-4 py-3 text-xs leading-relaxed sm:text-[13px] ${
                    m.role === "user"
                      ? "border-transparent bg-[var(--ava007-aurora-soft)] text-[var(--ava007-text)]"
                      : "border-[var(--ava007-line)] bg-[var(--ava007-panel)]"
                  }`}
                  data-role={m.role}
                >
                  {m.generating ? (
                    <span className="block space-y-2 py-1" aria-label="Generating reply">
                      <span className="ava007-shimmer block h-3 w-56" />
                      <span className="ava007-shimmer block h-3 w-44" />
                      <span className="ava007-shimmer block h-3 w-32" />
                    </span>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      {m.meta && (
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--ava007-text-3)]">
                          {m.meta}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* prompt widget — the kit in action */}
        <div className="px-4 pb-5 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Ava007PromptWidget onGenerate={handleGenerate} />
            <p className="mt-2 text-center text-[10px] text-[var(--ava007-text-3)]">
              Ava007 UI Kit · prompt widget demo — generation states simulated
              locally, no model backend wired yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
