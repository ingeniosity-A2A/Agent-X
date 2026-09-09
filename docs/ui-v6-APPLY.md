# Apply V6 polish everywhere + Agent Browser viewport

## 1. Platform (Next shell)
Files under `platform/src/` (ava-shell.css + shell cards + lens).

## 2. Help Assembly + ESA — shared CSS
- `esa-exoskeleton/public/v6-exoskel-polish.css`
- `esa-exoskeleton/public/esa-console/v6-exoskel-polish.css`

In both `public/index.html` and `public/esa-console/index.html` head:
```html
<link rel="stylesheet" href="./v6-exoskel-polish.css" />
```

Class hooks: `esa-exoskeleton/CLASS-HOOKS.md`

## 3. Agent Browser viewport
See `docs/agent-browser/VIEWPORT.md`.
