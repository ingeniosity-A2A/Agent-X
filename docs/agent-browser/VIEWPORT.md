# Agent Browser owns the consoles — viewport contract

## Stack (S26 Ultra)

```
/opt/agent-browser  (0.35.1)
        |
        +-- open Help Assembly  ->  file:// or http://…/esa-exoskeleton/public/
        +-- open ESA console    ->  …/public/esa-console/
        +-- open Platform       ->  …/platform  (Next /console)
```

## Problem

Agent Browser can navigate and snapshot, but **render viewport** must be set or cards clip / empty canvas on ARM Chromium.

## Required viewport

```bash
agent-browser set viewport 1920 1080
agent-browser open http://127.0.0.1:8787/
agent-browser open http://127.0.0.1:8787/esa-console/
agent-browser open http://127.0.0.1:3000/console
agent-browser snapshot -i
```

## Console ownership

| Console | Owner process | Served by |
|---------|---------------|-----------|
| Help Assembly | Agent Browser surface | `esa-exoskeleton/public` static |
| ESA EXOSKELETON | Agent Browser surface | `esa-exoskeleton/public/esa-console` |
| Platform shell cards | Agent Browser or Chromium | Agent-X `platform` Next |

Ava007 intellect does **not** host these UIs.

## Missing viewport checklist

1. `agent-browser` binary on PATH or `/opt/agent-browser`
2. Chromium 133 ARM64 installed (Termux or agent-browser install)
3. Explicit `set viewport` before first `open`
4. Static server or Next `pnpm dev` listening
5. v6 CSS linked in Help + ESA `index.html` head
