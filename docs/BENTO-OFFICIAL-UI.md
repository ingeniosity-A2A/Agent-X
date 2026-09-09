# Bento = the UI upgrade (one framework only)

**Bento is not a second framework.** It is the **upgrade** of Agent-X console cards.

Everything that was Destiny-style, ad-hoc shell cards, or v6 polish hooks **folds into Bento**. There is no parallel card system to maintain.

```text
Before:  Destiny skin  |  random cards  |  polish classes
After:   Bento only    (upgrade path)
```

## One contract

- **Component:** `BentoCard` (title, desc, demo children, grid span)
- **Classes:** `.bento-card`, `.bento-demo`, `.bento-text`, `.bento-title`, `.bento-desc`, `.bk-btn`
- **Theme:** `BentoProvider` + `--bk-*` tokens
- **Motion:** GSAP reveal / tilt / Flip (respect reduced motion)

Gel progress, gradient-mask buttons, punch-border = **optional styles on Bento**, not a competing kit.

## Source → home on main

| | |
|--|--|
| Source | branch `bento-board` → `src/components/bento/*` |
| Official home | `platform/src/components/bento/` on **main** |
| ESA / Help | Same Bento tokens/classes inside sandboxed consoles |

**Never** merge the whole `bento-board` app root over `main`. **Copy** the bento package into `platform/`.

## Destiny

Destiny is not a living UI brand. Any Destiny *card* is upgraded **into** Bento (same `BentoCard` shape). `destiny_build/` data is not UI.

## Rule

```text
One framework: Bento.
Upgrade in place. No second card system.
```
