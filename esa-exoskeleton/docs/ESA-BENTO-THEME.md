# ESA + HAS Bento theme

**Palette only:** beige · green · black.

| Token | Value |
|-------|--------|
| Black | `#0a0a0a` / `#121212` |
| Beige | `#f4f4ee` / `#e8ebe0` |
| Green | `#7ec8a0` / `#5aaf84` |

**Removed:** brown / warm clay (`#c8a882`, `#b07d4f`, gruvbox gold `#d79921` as brand).

## Chatbot chrome

```
[ input ……………………………… ] [ Send ] [ Big Lens ]
[ icon+tooltip ] [ icon+tooltip ] …     ← bottom-left under typing
```

- Lens is **far right** of the prompt row
- Send is **immediately left of Lens**
- Icons use `data-tip="Label"` for tooltips

## Wire

```html
<link rel="stylesheet" href="./esa-bento-theme.css">
<link rel="stylesheet" href="./shell-layout.css">
<link rel="stylesheet" href="./ai-chatbot-dock.css">
```

Apply same theme file to HAS surfaces under `esa-exoskeleton` / Help packages.
