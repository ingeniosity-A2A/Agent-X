# UI v6 push status

Commit message includes `[skip ci]` — do not rely on Actions.

## On main

- `esa-exoskeleton/public/v6-exoskel-polish.css`
- `esa-exoskeleton/public/esa-console/v6-exoskel-polish.css`
- `esa-exoskeleton/CLASS-HOOKS.md`
- `docs/agent-browser/VIEWPORT.md`
- `docs/ui-v6-APPLY.md`
- `platform/src/components/shell/ActuatorFurnitureCard4.tsx`
- `platform/src/components/shell/TelemetryShareCard.tsx`
- `platform/src/app/console/ava-shell-v6.css`

## Still local only (optional follow-up push)

- Full `DevExoskelCard.tsx` + `ProductLensPanel.tsx` + full `ava-shell.css` token sheet (in session artifacts)

## Device steps that are NOT replaced by git push

1. `git pull` on the machine that serves Agent-X
2. Link CSS in Help/ESA `index.html` head if not already
3. Agent Browser: `set viewport 1920 1080` then open consoles
