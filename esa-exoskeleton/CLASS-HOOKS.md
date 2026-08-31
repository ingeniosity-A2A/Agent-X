# Class hooks (no size change)

Add these class names to **existing** elements only:

| Class | Where |
|-------|--------|
| `punch-border` | Card outer frame (must already have `overflow: hidden` or add it without changing dimensions) |
| `gradient-mask-btn` | Existing buttons: ORDER PART, WORK ORDER, QUOTE, BOOK, Broadcast, MIC, etc. |
| `gel-progress-track` + inner `gel-progress-fill` | Inside fixed-height meter zones only; set `--gel-progress: N%` |
| scroll classes | Existing wheel / thread scroll containers |

Help Assembly root: `public/`
ESA console: `public/esa-console/`
