# Wire shell + AI Chatbot Ingestion

In `index.html` **before** `integration.js` (after the inline `<style>` block so
the dock wins the cascade):

```html
<link rel="stylesheet" href="./shell-layout.css">
<link rel="stylesheet" href="./ai-chatbot-dock.css">
<script src="./mount-alias.js"></script>
<script src="./shell-nav.js" defer></script>
```

Bottom node — product name is **AI Chatbot Ingestion** (no "esa" in titles):

```html
<div id="ai-chatbot" data-legacy-mount="esa-ingestion"></div>
```

`mount-alias.js` prefers `#ai-chatbot`, still resolves legacy
`esa-ingestion` / `esa-ai-chatbot` mounts for `ESA.Ingestion.mount`.

Locked dock layout (`ai-chatbot-dock.css`) — speakers OUTSIDE the chatbot:

```text
 🔊  ┌────────────────────────────┬────────┐  🔊
     │  typing / input            │        │
     ├────────────────────────────┤  LENS  │  ← Lens spans TOP + BOTTOM
     │  [icons + tooltips] [Send] │        │  ← Send on BOTTOM row
     └────────────────────────────┴────────┘
```

- `.ai-dock-row` — flex bookends: speaker | shell | speaker
- `.ai-lens` — tall column on the far right (spans prompt + bottom)
- `.ai-send` — bottom row only, with the icon dock
- `.ai-icon-dock` — bottom-left under the input, tooltips via `data-tip`
- `.ai-speaker` — OUTSIDE the shell (left = Sound I mic, right = agent
  voice); `.active` marks an open channel

Toolbar: use class `ai-toolbar` / `ai-icon-dock` — **fixed, clickable, no
horizontal scroll**.
