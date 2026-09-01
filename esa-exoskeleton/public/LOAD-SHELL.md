# Wire AI Chatbot Ingestion

## Layout (AI Elements–style PromptInput + dual speakers)

```
[ SPEAKER L ]  [ + ✨ input 🎤 Send Lens ]  [ SPEAKER R ]
```

Ref: https://elements.ai-sdk.dev/examples/chatbot  
(`PromptInput` body + tools + submit; dual audio ends are product-specific.)

## index.html (before integration.js)

```html
<link rel="stylesheet" href="./esa-bento-theme.css">
<link rel="stylesheet" href="./shell-layout.css">
<link rel="stylesheet" href="./ai-chatbot-dock.css">
<script src="./mount-alias.js"></script>
<script src="./shell-nav.js" defer></script>
```

## Chat titles

No **ESA** in chatbot chrome labels — use **Ingestion Hub**, **AGENT**, **HUB ACTIVE**.

Service name **ESA** stays on the **left service nav only**.
