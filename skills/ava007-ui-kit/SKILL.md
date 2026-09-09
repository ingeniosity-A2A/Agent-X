---
name: ava007-ui-kit
description: Unified Bento + Ava007 master skill for premium chat-facing UI. Merges the Bento UI8 visual language (soft depth, generous radius, glassmorphism, adaptive dual-shadow) with the Ava007 prompt-widget spec (aurora gradient stroke red→purple→blue, 23–24px hardware curvature, model flyout, image upload, generate/style-assistant states, dark/light tokens). Canonical implementation ships in the Agent-X platform under components/ui-kit.
---

# Ava007 UI Kit — Unified Bento + Prompt Widget Master Skill

One skill, one brand: **Ava007**. This skill merges the Bento UI8 master skill
(`bento-ui8-master-skills-set-gsap.md` — visual language) with the Nocra
prompt-widget spec (rebranded to Ava007 — brands do not mingle) into a single
reusable kit for chat-facing interfaces on the Agent Browser platform.

**Brand rule (binding):** client brands (ESA, Help Assembly, Nocra or any
external spec source) never appear in the kit's naming. External specs are
implemented under Ava007 naming, on Ava007 surfaces.

---

## 1. Visual Language (Bento pillar + Ava007 aurora)

| Pillar | Value |
|--------|-------|
| Hardware curvature | 23–24px radius (`--ava007-radius: 23px`, `--ava007-radius-lg: 24px`), pills 9999px, flyouts 18px |
| Gradient stroke | Aurora: red `#ff4d5e` → purple `#8b5cf6` → blue `#3b82f6`, 1.5px ring + soft bloom halo |
| Shadows | Adaptive dual-shadow — ambient + contact in light, deep elevation in dark; never flat gray |
| Dark scale | ink-950 `#07070c` → ink-600 `#2a2a38` |
| Light scale | panel `#ffffff`, page `#f4f4f8`, inset top highlight |
| Motion | shimmer (200% bg-position loop), fade-up (8px, 0.45s expo-out), pulse-dot (status) |
| Generate button | solid **black** in light mode / solid **white** in dark mode |
| Secondary buttons | borders-only ghost, aurora tint on hover |

---

## 2. Token System (Tailwind CSS v4, CSS-first)

Canonical file: `platform/src/components/ui-kit/ava007-prompt-widget.css`

- `@theme` registers Tailwind v4 tokens: `--color-ava007-aurora-*`,
  `--color-ava007-ink-*`, `--radius-ava007*`, `--animate-ava007-*`.
- Raw custom properties on `.ava007-kit` (light default) and `.ava007-kit.dark`
  keep component classes working even without utility generation.
- All theming is **scoped to the `.ava007-kit` root** — the kit never leaks
  variables into host surfaces, and hosts never leak into the kit.

Import the CSS once per surface (e.g. in the route file):

```ts
import "@/components/ui-kit/ava007-prompt-widget.css";
```

---

## 3. Prompt Widget Anatomy

Canonical file: `platform/src/components/ui-kit/ava007-prompt-widget.tsx`
(`Ava007PromptWidget`, typed, lucide-react only — no other deps).

State machine (all real, wired):

| State | Wiring |
|-------|--------|
| Prompt input | controlled `<textarea>`; Enter fires, Shift+Enter newlines |
| Model flyout | bottom-right indicator → `role="listbox"`; Ava007 Aurora 1.4 (flagship), Ava007 NeuroFlux v2.1 (fast); outside-click + Escape close |
| Image upload | camera badge (hover lift + aurora tint) → hidden file input → removable chips + action line "Reference images ride along with the next Generate." (max 4) |
| Style Assistant | borders-only secondary → reveals style chips (Cinematic, Neon Noir, Watercolor, 3D Render, Blueprint); toggle-select |
| Generate | primary solid; disabled while generating; `Loader2` rotating spinner + "Generating…" |
| Generating | controlled via `busy` prop, or uncontrolled ~2.2s local simulation when no prop |

API:

```ts
export interface Ava007GeneratePayload {
  prompt: string;
  model: "aurora-1.4" | "neuroflux-2.1";
  images: string[];
  style: Ava007Style | null;
}
props: { onGenerate?, busy?, placeholder?, className? }
```

---

## 4. Chat Page Shell

Canonical file: `platform/src/components/ui-kit/ava007-chat-page-demo.tsx`
(`Ava007ChatPageDemo`).

- Left-rail navigation drawer: static ≥lg, slide-over with backdrop below;
  Aperture mark inside a mini aurora ring; Chats/Studio/Models/Files/Settings.
- Header status indicators: engine chip, online pulse-dot, dark/light toggle
  (scoped to kit root), new-chat reset.
- Message stream: user bubbles on aurora-soft tint, assistant bubbles on panel
  with avatar ring; generating state renders a shimmer skeleton, never a fake
  instant answer.
- Widget merged at the bottom (this is the "merge into AI chat bot").
- **Honesty rule:** with no model backend mounted, assistant replies must say
  they are local demo replies. Never fake a live model.

---

## 5. File Map (canonical implementation)

```
agent-x/
├── bento-ui8-master-skills-set-gsap.md      ← deep Bento visual language (GSAP patterns)
└── platform/src/
    ├── components/ui-kit/
    │   ├── ava007-prompt-widget.css         ← tokens + aurora ring + shimmer/fade
    │   ├── ava007-prompt-widget.tsx         ← the widget (all states)
    │   └── ava007-chat-page-demo.tsx        ← full chat workspace shell
    └── app/agent-browser/interface/ui-kit/page.tsx   ← mounting surface
```

## 6. Interface Surface Rules

- Routes speak **Agent Browser/Interface/...** — never "consoles":
  `/agent-browser/interface/terminal`, `/agent-browser/interface/bento-ui-editor`,
  `/agent-browser/interface/3d-rendering/esa`,
  `/agent-browser/interface/3d-rendering/helpassembly`,
  `/agent-browser/interface/ui-kit`.
- Legacy `/consoles/*` paths redirect (302) via `next.config.ts redirects()`.
- Wire identifiers that leak into protocols (e.g. browser session
  `ava007-console`) stay stable — rename surfaces and labels, not wire names.

## 7. Usage

1. Import the CSS once, render `Ava007PromptWidget` (standalone) or
   `Ava007ChatPageDemo` (full workspace).
2. Pass `onGenerate` to route generations to a real backend when one exists;
   the kit renders the same states either way.
3. For new chat-facing surfaces, start from the chat shell and swap rail
   items — do not restyle tokens per client (brand rule).
