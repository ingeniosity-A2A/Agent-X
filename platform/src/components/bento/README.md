# Official Bento card library (target)

This directory is the **home on `main`** for the official UI card system.

**Populate from** branch `bento-board`:

```bash
# from a worktree of bento-board — copy only components, not whole app root
cp -R src/components/bento/* platform/src/components/bento/
# plus globals theme CSS tokens from bento-board src/app/globals.css (bk-* section)
```

Required files:
- `core.tsx` — `BentoCard`, hooks
- `theme.tsx` — `BentoProvider`, themes
- `cardsA.tsx` … as needed for ESA/Help/platform

See `docs/BENTO-OFFICIAL-UI.md`.

Destiny cards: rewrite to `BentoCard` before merge; do not keep a Destiny skin.
