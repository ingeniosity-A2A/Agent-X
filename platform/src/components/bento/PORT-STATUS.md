# Bento port status (main)

## On main under `platform/src/components/bento/`

- [x] `core.tsx` — BentoCard, hooks
- [x] `cardsE.tsx` — ProductLensDemo
- [x] `index.ts`
- [ ] `theme.tsx`
- [ ] `cardsA.tsx` … `cardsD.tsx`, `todo.tsx`
- [ ] CSS tokens from bento-board `src/app/globals.css` (`--bk-*`, `.bento-card`)

## Finish remaining (from bento-board, into platform only)

```bash
git fetch origin bento-board
for f in theme.tsx cardsA.tsx cardsB.tsx cardsC.tsx cardsD.tsx todo.tsx; do
  git show origin/bento-board:src/components/bento/$f \
    > platform/src/components/bento/$f
done
# optional: extract --bk-* / .bento-* from
#   git show origin/bento-board:src/app/globals.css
```

Then expand `index.ts` exports. Ensure `gsap` is in platform package.json.

**One framework:** Bento is the upgrade path — not a second system.
