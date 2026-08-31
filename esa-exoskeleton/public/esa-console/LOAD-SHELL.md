# Wire shell + AI Chatbot Ingestion

In `index.html` **before** `integration.js`:

```html
<link rel="stylesheet" href="./shell-layout.css">
<link rel="stylesheet" href="./ai-chatbot-dock.css">
<script src="./mount-alias.js"></script>
<script src="./shell-nav.js" defer></script>
```

Rename bottom node (optional but preferred):

```html
<div id="esa-ai-chatbot" data-legacy-mount="esa-ingestion"></div>
```

`mount-alias.js` keeps `ESA.Ingestion.mount` working while the product name is **AI Chatbot Ingestion**.

Toolbar: use class `esa-ai-toolbar` — **fixed, clickable, no horizontal scroll**.
