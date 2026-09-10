# Agent Browser owns the card surfaces — viewport contract

## Stack (S26 Ultra)

```
/opt/agent-browser  (0.35.1)
        |
        +-- open Ava007 Cards (production) ->  https://www.Ava007.Ingeniosity.tech
        +-- open ESA rendering cards (dev) ->  http://127.0.0.1:3000/agent-browser/interface/3d-rendering/esa
        +-- open Help Assembly             ->  file:// or http://…/esa-exoskeleton/public/
        +-- open Platform                  ->  …/platform  (Next /console)
```

## Problem

Agent Browser can navigate and snapshot, but **render viewport** must be set or cards clip / empty canvas on ARM Chromium.

## Required viewport

```bash
agent-browser set viewport 1920 1080
agent-browser open https://www.Ava007.Ingeniosity.tech
agent-browser open http://127.0.0.1:3000/agent-browser/interface/3d-rendering/esa
agent-browser snapshot -i
```

## Card surface ownership (owner ruling 2026-09-10)

Cards render on the Agent Browser. The browser session is wired to
**www.Ava007.Ingeniosity.tech** — `esa.ingeniosity.tech` is REMOVED
(there is no ESA console and no ESA exoskeleton entity; the only
exoskeleton is the A2A-Exoskeleton). The Agent Browser is **not a chat
interface** and there are no harnesses — cards only.

| Card surface | Owner process | Served by |
|--------------|---------------|-----------|
| Ava007 Cards (production) | Agent Browser session `ava007-console` | `www.Ava007.Ingeniosity.tech` |
| ESA rendering cards (dev) | Agent Browser or Chromium | Agent-X `platform` Next — `/agent-browser/interface/3d-rendering/esa` |
| Help Assembly | Agent Browser surface | `esa-exoskeleton/public` static |

Ava007 intellect does **not** host these UIs.

## Cards rendered (ESA surface)

- Daily To-Dos — shows the correct Green Shield for today (local date,
  weekday-due contract)
- Parts + Inventory (the ESA Product card) — conducts inventory and
  product orders; catalog fast-rendered from the ESA RocksDB housing;
  orders hand off to HD Supply Punch-In
- Service Request
- Green Shield Inspection (calendar + daily checklist)
- Asset Stack (RocksDB housing)

## Missing viewport checklist

1. `agent-browser` binary on PATH or `/opt/agent-browser`
2. Chromium 133 ARM64 installed (Termux or agent-browser install)
3. Explicit `set viewport` before first `open`
4. Next server listening (`pnpm dev` / `bun start` in `platform`)
5. `rocksdict` in the workspace venv for the ESA RocksDB housing
   (`pip install rocksdict`, then `scripts/seed_hdsupply_catalog.py`)
