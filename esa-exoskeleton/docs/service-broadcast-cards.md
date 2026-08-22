# 📡 Service Broadcasting Cards — B-Side Pair

**Files**: `public/components/ESA.InvPartsCard-B.js` · `public/components/ESA.Ptac-B.js`

The broadcasting **Service cards** are the "B-side" of the parts catalog: where the
rendering-area parts card (`ESA.invpartscard-B.js`, the React product card) *displays*
the Seasons PTAC unit, the two B-side cards *operate* it — inventory, service
scheduling, diagnostics, and live service broadcasts. They are a parent/child pair:

| Card | Export | Role |
|------|--------|------|
| **ESA.InvPartsCard-B** | `ESAInvPartsCardB` | Inventory + broadcast service parts card (parent) |
| **ESA.Ptac-B** | `ESAPtacB` | Service broadcasting sliding panel for HD Supply PTAC Unit #223532 (child) |

---

## 1. How they are built

Both cards are **Arrow.js components** wrapped by `ESAVerifyComponent`
(`public/components/ESA.VerifiedWrapper.js`) — the same verified-component contract
used by the rest of the Arrow.js exoskeleton. Arrow.js here **sandboxes** these cards;
the Ingestion interface is the React module.

Each card exports:

- `ESAInvPartsCardB` / `ESAPtacB` — the verified component (`.component` from the wrapper)
- a default export of the same object

The wrapper exposes a `.mount(container)` contract, so `integration.js` can attach
either card to a DOM container the same way it mounts every other module:

```js
import { ESAInvPartsCardB } from './components/ESA.InvPartsCard-B.js';
const instance = ESAInvPartsCardB.mount(document.querySelector('#esa-invparts-b'));
```

## 2. ESA.InvPartsCard-B — inventory & broadcast panel (parent)

Purpose: track and broadcast the **physical inventory** behind a PTAC model.

### Data — `PTAC_PARTS_INVENTORY`
Keyed by model (`SP09EA2-20`). Each entry carries the HD Supply part number
(`223532`), warranty years, specs (BTU, voltage, amperage, refrigerant, EER),
and — most importantly — the **inventory quantities**:

```js
inventory: { warranty: 2, processing: 1, recycle: 0, total: 3 }
```

`total` is recomputed whenever a quantity changes:
`warranty + processing + recycle`.

### State
- `isBroadcastOpen` — broadcast panel open/closed
- `activeTab` — `inventory` | `parts` | `manuals` | `features`
- `selectedFeatures` — which broadcast features are enabled
  (`diagnostics`, `partsLookup`, `warrantyCheck`, `inventoryScan`, `orderParts`)
- `isScanning` / `lastScanResult` — verbal-inventory scan lifecycle

### Methods
| Method | What it does |
|--------|--------------|
| `toggleBroadcast` | Opens/closes the broadcast panel; speaks an activation prompt |
| `startVerbalInventory` | Simulates a lens scan (2s), fills `lastScanResult`, **announces the inventory counts by voice**, then fires `esa:inventory-scan` |
| `updateQuantity` | ±1 on warranty/processing/recycle, recalculates `total`, speaks the change |
| `orderPart` | Logs + speaks the order, fires `esa:order-part` |
| `openManual` | Opens a manual/document URL in a new tab |
| `toggleFeature` | Enables/disables a broadcast feature |
| `speak` | Web Speech API (female voice preference), logged as `[ESA.Ava007]` |

### Broadcast features (`BROADCAST_FEATURES`)
The toggleable service capabilities: AI Diagnostics 🔍, Parts Database 📦,
Warranty Verification ✅, Verbal Inventory 🎤, One-Click Ordering 🛒.

## 3. ESA.Ptac-B — service broadcasting panel (child)

Purpose: the **service operations deck** for one HD Supply PTAC unit
(Seasons 9000 BTU, Part #223532). It renders as a **right-edge sliding panel**
(400px, `right: 0` when open, `-420px` when closed) with a vertical "📡 PTAC-B"
tab when closed.

### Data — `PTAC_UNIT_223532`
Full product record: HD Supply link/price/brand/model, technical specs
(BTU 9000/10900, 230/208V, 20A, R-32, 12.8 EER), warranty tiers,
7 common parts with SKUs, and **service intervals** (filter 30d, condensate 90d,
coil 180d, inspection 365d — each with `lastService`/`nextDue`).

### State
- `isOpen` / `slidePosition` — sliding panel animation (`closed → opening → open → closing`)
- `activeTab` — `overview` | `parts` | `service` | `diagnostics` | `broadcast`
- `broadcastMode` — 🔴 LIVE vs ⚫ OFF
- `currentBroadcast` / `broadcastHistory` (capped at 50)
- `connections` — live link check to InvPartsCard, Workorder, DiagnosticCard, DuckDB, transport

### Tabs
| Tab | Contents |
|-----|----------|
| **Overview** | HD Supply product card (price + open link), quick specs, quick actions: Create Workorder / Run Diagnostics / Send Broadcast |
| **Parts** | Common parts for #223532 — `+ WO` adds the part to the workorder, 🔍 runs `part:lookup` |
| **Service** | Maintenance intervals colored by status (OK / Due Soon / OVERDUE / never) + service history timeline |
| **Diagnostics** | Diagnostic code input + common codes (F1, F2, F3, C3, C7, FP, Fd, Eo), link to the full DiagnosticCard |
| **Broadcast** | The broadcasting center (below) |

### The broadcast lifecycle
1. **Toggle** — `startBroadcast()` / `stopBroadcast()` flip `broadcastMode` and
   send `broadcast:start` / `broadcast:stop` through the transport.
2. **Send** — `broadcastMessage(state, type, custom?)` picks a template from
   `BROADCAST_TEMPLATES` (`scheduled` / `urgent` / `completed`), fills
   placeholders (`{unit}`, `{code}`, `{interval}`, `{part}`), prepends the result
   to `broadcastHistory` (max 50), and sets `currentBroadcast`.
3. **Transport** — the message is ingested into **GSAP Transport** as a
   `broadcast:message` intent with a temporal tween atom:

   ```js
   window.ESA.transport.ingest({
     intent: 'broadcast:message',
     cognitive_state: { intent: 'service:broadcast' },
     temporal_tween: { start: 0, end: 1, duration_ms: 500, easing: 'power2.out' },
     metadata: { ...broadcast, source: 'ESA-Ptac-B', transportType: 'tween-atom' }
   });
   ```

4. **Voice** — if broadcasting is LIVE (or the message is `urgent`), the message is
   **spoken aloud** via `speak()` (Web Speech API, female voice preference, 0.9 rate).
5. **Broadcast event** — the card fires `esa:broadcast` on `window` so the Ingestion
   hub and console can surface it as a system message.
6. **History** — the last 5 broadcasts render in the Broadcast tab with a
   color-coded left border (red = urgent, green = completed, blue = otherwise).

### The speak() voice
`speak(state, text)` cancels any ongoing speech, prefers a female voice
(Samantha/Zira/`Female` + `en`), sets rate 0.9 / pitch 1.1, and also pushes a
`voice:speak` transport message. Broadcast volume is controlled by
`state.broadcastVolume`.

## 4. How the two cards connect (the "broadcast" wiring)

```
┌─────────────────────┐   window.ESA events / transport   ┌──────────────────────┐
│ ESA.InvPartsCard-B   │ ─────────────────────────────────▶ │ ESA.Ptac-B           │
│ (inventory parent)   │  esa:inventory-scan, esa:order-part│ (service deck child) │
└──────────┬──────────┘ ◀───────────────────────────────── └──────────┬───────────┘
           │                                                        │
           └────────── window.ESA.transport + esa:* events ─────────┘
                          │                 │
                          ▼                 ▼
                 ESA.Ingestion hub    console log feed
                 (system messages)    (esa:* listeners)
```

Both cards speak the same integration language:

**Custom events dispatched on `window`** (consumed by the Ingestion hub,
Workorder, DiagnosticCard, and the console logger):

| Event | Dispatcher | Detail |
|-------|-----------|--------|
| `esa:inventory-scan` | InvPartsCard-B | `{ timestamp, part, model, inventory }` |
| `esa:order-part` | InvPartsCard-B | `{ part, timestamp }` |
| `esa:broadcast` | Ptac-B | `{ broadcast, source: 'ESA-Ptac-B' }` |
| `esa:create-workorder` | Ptac-B | `{ workorder, source }` |
| `esa:run-diagnostic` | Ptac-B | `{ code, unit, source }` |
| `esa:lookup-part` | Ptac-B | `{ sku, source }` |
| `esa:add-part-to-workorder` | Ptac-B | `{ part, unit, source }` |
| `esa:open-diagnostics` | Ptac-B | `{ source }` |

**GSAP Transport messages** (`window.ESA.transport.send(topic, value, opts)`):

| Topic | Meaning |
|-------|---------|
| `ptac-b:panel` / `ptac-b:tab` | Panel open/close, tab switches |
| `ptac-b:hd-supply` | HD Supply page opened |
| `broadcast:start` / `broadcast:stop` | Broadcast LIVE/OFF |
| `broadcast:message` (via `ingest`) | The broadcast itself (tween atom) |
| `part:lookup` / `part:add` | Parts actions |
| `diagnostic:code` | Quick diagnostic triggered |
| `workorder:create` | Workorder created for the unit |
| `voice:speak` | Voice announcement emitted |

## 5. Mount status & wiring it in

**Current status:** the two B-side cards are fixed, verified (`node --check` clean),
and importable — but they are **not yet mounted** in the active console.
`integration.js` currently mounts the React product card
(`ESA.invpartscard-B.js`) as the 📦 Broadcast Parts card in the rendering area.

To mount either B-side card (e.g. the Ptac-B service deck), add a dynamic import
alongside the others in `integration.js` and call `.mount()` on a container:

```js
import('./components/ESA.Ptac-B.js').then(m => {
  const ptac = m.ESAPtacB;
  const el = document.getElementById('esa-ptac-b-deck'); // any container you add
  window.ESA.mountedComponents.push(ptac.mount(el));
});
```

They render as fixed-position panels by design (Ptac-B slides from the right
edge), so they can coexist with the rendering-card grid rather than living
inside a 24rem card.
