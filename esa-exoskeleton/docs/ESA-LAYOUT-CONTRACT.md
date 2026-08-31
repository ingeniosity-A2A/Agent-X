# ESA layout contract (application — not infra)

**Wrong:** “Consoles” as a product surface. Multiple competing chat docks.

**Right:**

```text
┌─────────────────────────────────────────────────────────┐
│ LEFT                CENTER (viewport)              │
│ Service: ESA        Card stage (above chat)        │
│  └ expand           One card at a time (or multi)  │
│     card types                                     │
│       Diagnostic                                   │
│       Parts                                        │
│       Workorder                                    │
│       Checklist                                    │
│       …                                            │
│                                                    │
│ ───────────────────────────────────────────────── │
│ BOTTOM: single AI chatbot (ingest + mic + send)    │
│   merged Ingestion Interface + speaker ends + chat │
│   pattern ref: elements.ai-sdk.dev/examples/chatbot│
└──────────────────────────────────────────────────────────┘
```

## Rules

1. **Service title** on the left is **ESA** (not “Console”).
2. Click **ESA** → dropdown / tree of **card types** attached to that service.
3. Click a card type → that card **renders in the middle viewport, above the chatbot**.
4. Default: **one card visible**. Multi-select only when explicitly enabled.
5. **One AI chatbot only** — merge ingestion box + end speakers + chat input into a single bottom dock.
6. **Mobile:** only **active card + bottom chatbot** visible (sidebar collapses / drawer).

## Card registry (service-attached)

| id | Label |
|----|--------|
| `esa-diagnostics` | Diagnostic |
| `esa-parts-card` | Parts / Broadcast |
| `esa-workorder` | Workorder |
| `esa-maintenance-checklist` | Checklist |
| (optional) PTAC / Sound | when mounted |

## Implementation files

- `public/esa-console/shell-nav.js` — service tree + show/hide cards
- `public/esa-console/shell-layout.css` — grid + mobile
- Wire from `index.html` after integration mounts
