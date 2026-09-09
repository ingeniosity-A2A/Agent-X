"use client";

/**
 * AVA007 UI KIT — Prompt Widget
 * ------------------------------------------------------------
 * Unified Bento + Ava007 master skill component (Nocra spec,
 * rebranded to Ava007 — brands do not mingle).
 *
 * Spec implemented here:
 * · adaptive dual-shadow + 23px–24px hardware curvature (aurora ring)
 * · outer gradient stroke red → purple → blue
 * · wide prompt field wired with real input events
 * · fully styled model dropdown flyout (Ava007 Aurora 1.4 /
 *   Ava007 NeuroFlux v2.1)
 * · camera action badge with hover states + action line for
 *   uploading reference images
 * · stacked action buttons — Generate (primary: solid black in
 *   light mode / solid white in dark mode, rotating spinner while
 *   generating) and Style Assistant (secondary, borders-only,
 *   reveals creative style options)
 *
 * Styling comes from ./ava007-prompt-widget.css (Tailwind v4
 * CSS-first tokens). No new dependencies: lucide-react only.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Cpu,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

export type Ava007ModelId = "aurora-1.4" | "neuroflux-2.1";

export interface Ava007Model {
  id: Ava007ModelId;
  name: string;
  tag: string;
  description: string;
}

export const AVA007_MODELS: Ava007Model[] = [
  {
    id: "aurora-1.4",
    name: "Ava007 Aurora 1.4",
    tag: "flagship",
    description: "Deep reasoning · richest detail",
  },
  {
    id: "neuroflux-2.1",
    name: "Ava007 NeuroFlux v2.1",
    tag: "fast",
    description: "Low-latency drafts · high volume",
  },
];

export const AVA007_STYLES = [
  "Cinematic",
  "Neon Noir",
  "Watercolor",
  "3D Render",
  "Blueprint",
] as const;

export type Ava007Style = (typeof AVA007_STYLES)[number];

export interface Ava007GeneratePayload {
  prompt: string;
  model: Ava007ModelId;
  images: string[];
  style: Ava007Style | null;
}

export interface Ava007PromptWidgetProps {
  /** Fired when Generate is pressed. Optional — the widget still
   * runs its own visible generating state so it demos standalone. */
  onGenerate?: (payload: Ava007GeneratePayload) => void;
  /** External generating state (controlled). When omitted the
   * widget simulates a ~2.2s generation locally. */
  busy?: boolean;
  placeholder?: string;
  className?: string;
}

export default function Ava007PromptWidget({
  onGenerate,
  busy,
  placeholder = "Ask Ava007 to build, draft, or render anything…",
  className = "",
}: Ava007PromptWidgetProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<Ava007Model>(AVA007_MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Ava007Style | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [localBusy, setLocalBusy] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generating = busy ?? localBusy;

  /* close the model flyout on outside click / Escape */
  useEffect(() => {
    if (!modelOpen) return;
    function handlePointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModelOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [modelOpen]);

  useEffect(
    () => () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    },
    []
  );

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => f.name);
    if (added.length) setImages((prev) => [...prev, ...added].slice(0, 4));
  }, []);

  const fire = useCallback(() => {
    if (generating) return;
    const payload: Ava007GeneratePayload = {
      prompt: prompt.trim(),
      model: model.id,
      images,
      style: selectedStyle,
    };
    onGenerate?.(payload);
    if (busy === undefined) {
      /* uncontrolled: run the visible generating state locally */
      setLocalBusy(true);
      if (localTimer.current) clearTimeout(localTimer.current);
      localTimer.current = setTimeout(() => setLocalBusy(false), 2200);
    }
  }, [busy, generating, images, model.id, onGenerate, prompt, selectedStyle]);

  const activeModel = AVA007_MODELS.find((m) => m.id === model.id) ?? model;

  return (
    <div
      ref={rootRef}
      className={`ava007-widget relative ${className}`}
      data-widget="ava007-prompt"
    >
      {/* Aurora gradient stroke (red → purple → blue) + dual shadow */}
      <div className="ava007-aurora-ring">
        <div className="ava007-aurora-inner p-4 sm:p-5">
          {/* prompt field */}
          <textarea
            rows={3}
            value={prompt}
            disabled={generating}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                fire();
              }
            }}
            placeholder={placeholder}
            aria-label="Prompt"
            className="text-sm leading-relaxed"
          />

          {/* attached reference images + action line */}
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {images.map((name, i) => (
                <span key={`${name}-${i}`} className="ava007-chip">
                  <Camera size={11} aria-hidden />
                  <span className="max-w-40 truncate">{name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() =>
                      setImages((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    <X size={11} aria-hidden />
                  </button>
                </span>
              ))}
              <span className="text-[10px] text-[var(--ava007-text-3)]">
                Reference images ride along with the next Generate.
              </span>
            </div>
          )}

          {/* style assistant options */}
          {styleOpen && (
            <div
              className="ava007-fade-up mt-3 flex flex-wrap items-center gap-2"
              data-testid="ava007-style-options"
            >
              {AVA007_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStyle((cur) => (cur === s ? null : s))}
                  className={`ava007-chip cursor-pointer ${
                    selectedStyle === s
                      ? "!border-[rgba(139,92,246,0.65)] !text-[var(--ava007-text)]"
                      : ""
                  }`}
                  data-active={selectedStyle === s}
                >
                  <Wand2 size={11} aria-hidden />
                  {s}
                  {selectedStyle === s && <Check size={11} aria-hidden />}
                </button>
              ))}
            </div>
          )}

          {/* bottom action row */}
          <div className="mt-3 flex items-center gap-2">
            {/* camera upload badge */}
            <button
              type="button"
              className="ava007-action-badge size-9 cursor-pointer"
              title="Upload reference images"
              aria-label="Upload reference images"
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={15} aria-hidden />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="flex-1" />

            {/* Style Assistant — secondary, borders-only */}
            <button
              type="button"
              className="ava007-btn-ghost cursor-pointer px-3.5 py-2 text-xs"
              aria-expanded={styleOpen}
              onClick={() => setStyleOpen((v) => !v)}
            >
              <Wand2 size={13} aria-hidden />
              Style Assistant
            </button>

            {/* model indicator + flyout */}
            <div className="relative">
              <button
                type="button"
                className="ava007-btn-ghost cursor-pointer px-3 py-2 text-xs"
                aria-expanded={modelOpen}
                aria-haspopup="listbox"
                onClick={() => setModelOpen((v) => !v)}
                data-testid="ava007-model-trigger"
              >
                <Cpu size={13} aria-hidden />
                <span className="hidden sm:inline">{activeModel.name}</span>
                <span className="sm:hidden">Model</span>
                <ChevronDown
                  size={12}
                  aria-hidden
                  style={{
                    transform: modelOpen ? "rotate(180deg)" : undefined,
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>

              {modelOpen && (
                <div
                  role="listbox"
                  aria-label="Ava007 models"
                  className="ava007-flyout absolute bottom-full right-0 z-30 mb-2 w-64 p-1"
                  data-testid="ava007-model-flyout"
                >
                  {AVA007_MODELS.map((m) => (
                    <button
                      key={m.id}
                      role="option"
                      aria-selected={m.id === model.id}
                      type="button"
                      className="ava007-flyout-item cursor-pointer rounded-xl"
                      data-active={m.id === model.id}
                      onClick={() => {
                        setModel(m);
                        setModelOpen(false);
                      }}
                    >
                      <Cpu
                        size={14}
                        aria-hidden
                        className="text-[var(--ava007-aurora-purple,theme(colors.violet.500))]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-xs font-semibold">
                          {m.name}
                          <span className="rounded-full border border-[var(--ava007-line)] px-1.5 py-px text-[9px] uppercase tracking-wide text-[var(--ava007-text-3)]">
                            {m.tag}
                          </span>
                        </span>
                        <span className="block text-[10px] text-[var(--ava007-text-3)]">
                          {m.description}
                        </span>
                      </span>
                      {m.id === model.id && (
                        <Check size={14} aria-hidden className="shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate — primary */}
            <button
              type="button"
              className="ava007-btn-solid cursor-pointer px-4 py-2 text-xs"
              disabled={generating}
              onClick={fire}
              data-testid="ava007-generate"
            >
              {generating ? (
                <>
                  <Loader2 size={13} aria-hidden className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} aria-hidden />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
