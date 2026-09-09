# ESA layout contract

## Surfaces

| Region | Name | Role |
|--------|------|------|
| Left | **ESA** (service) | Expand → card types |
| Center | Card stage | One card above chat (multi only if selected) |
| Bottom | **AI Chatbot Ingestion** | **Only** AI chat surface — not “esa-ingestion” product |

**Forbidden product names:** Console, esa-ingestion (as a label).

**DOM note:** mount node may keep `id="esa-ai-chatbot"` (preferred) with legacy alias `esa-ingestion` for existing `ESA.Ingestion.mount` until integration is retargeted.

## Bottom dock rules

1. **One** unified AI Chatbot Ingestion (input + mic + send + actions).
2. **Toolbar is fixed, clickable, non-scrolling** — no horizontal scroll-snap dock for primary actions.
3. Toolbar actions are buttons (not scroll-driven icons).
4. Speakers / ingest affordances live **inside** this bar, not as a second chat card in the stage.
5. Mobile: active card + this dock only.

## Card types (service-attached)

Diagnostic · Parts · Workorder · Checklist (+ optional PTAC / Sound when mounted)

## Files

- `shell-layout.css` / `shell-nav.js`
- `ai-chatbot-dock.css` — fixed toolbar
- `mount-alias.js` — `esa-ai-chatbot` ↔ legacy mount
