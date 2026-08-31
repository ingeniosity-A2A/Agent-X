# Load shell on device

After `git pull`:

```html
<link rel="stylesheet" href="./shell-layout.css">
<script src="./shell-nav.js" defer></script>
```

Place before `integration.js` in `index.html` (already documented in ESA-LAYOUT-CONTRACT.md).

Or append once:

```bash
cd esa-exoskeleton/public/esa-console
grep -q shell-nav.js index.html || sed -i 's|integration.js|shell-layout.css" rel="stylesheet">\n  <script src="./shell-nav.js" defer></script>\n  <script type="module" src="./integration.js|' index.html
```

Hard refresh Chromium, then:

```bash
agent-browser --cdp 9222 open http://127.0.0.1:8787/
agent-browser --cdp 9222 snapshot -i
```

Expect left **ESA** control; card types in tree; one card in stage; bottom dock = only chatbot.
