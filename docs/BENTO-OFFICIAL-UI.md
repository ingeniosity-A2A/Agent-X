# Bento = official UI and cards (Agent-X)

**Rule:** All console cards (ESA, Help, platform shell) use the **Bento** system.

Destiny (and any other legacy card skin) may **merge into Bento only after** it is rewritten to Bento contracts. Destiny is not a parallel UI brand.

## Source of truth

| Location | Status |
|----------|--------|
| Branch `bento-board` → `src/components/bento/*` | **Source** (do not merge branch root into `main`) |
| Target on `main` | `platform/src/components/bento/` |
| ESA / Help static | Consume same CSS tokens + class names; no second card framework |

### Canonical modules (from `bento-board`)

```
src/components/bento/
  core.tsx     # BentoCard, useBentoReveal, useTilt3D, useCountUp, micro-UI
  theme.tsx    # BentoProvider, themes, layouts, ControlDock
  cardsA.tsx … cardsE.tsx, todo.tsx   # card library
```

Base contract: **`BentoCard`** (`title`, `desc`, demo `children`, optional grid `span`).
Classes: `.bento-card`, `.bento-demo`, `.bento-text`, `.bento-title`, `.bento-desc`, `.bk-btn`.
Motion: GSAP + ScrollTrigger + Flip (respect `prefers-reduced-motion`).

## Destiny → Bento

| Destiny remnant | Action |
|-----------------|--------|
| `destiny_build/` on `main` | **Not** a card UI — training corpus only. Archive to QAG or keep as data, **never** as UI skin |
| Old Destiny visual cards (if any reappear) | Re-implement as `BentoCard` children under `platform/src/components/bento/` |
| Gel / punch / gradient-mask (v6 polish) | Allowed **inside** Bento demos as class hooks — not a second system |

### Migration checklist for a Destiny-style card

1. Wrap content in `BentoCard` (or extend with same `.bento-card` structure).
2. Put interactive demo in `.bento-demo` only.
3. Title / desc / Discover (or domain CTA) in `.bento-text`.
4. Use `BentoProvider` theme tokens (`--bk-*`), not Destiny-only CSS vars.
5. Optional: `gradient-mask-btn` / `punch-border` / gel meters as **add-ons** on Bento, size-stable.
6. Delete Destiny-only stylesheet once ported.

## Wire path (safe)

```text
bento-board branch
  │  copy only
  ▼
platform/src/components/bento/     on main
platform/src/app/consoles/...      optional gallery route
esa-exoskeleton/public/            token CSS if needed
```

**Forbidden:** merging entire `bento-board` root over `main` (would replace Agent-X tree).

## Official three-repo note

Bento lives in **Agent-X** only (capability/console surface).
Cybernetic-Ava007 does not host Bento.
a2a-exoskeleton does not host Bento.
