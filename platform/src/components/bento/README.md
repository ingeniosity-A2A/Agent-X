# Official Bento (upgrade — one framework)

Ported from `bento-board` → `platform/src/components/bento/` on **main**.

```ts
import { BentoCard, BentoProvider, useBentoReveal } from '@/components/bento';
```

Needs `gsap` (ScrollTrigger, Flip) in platform dependencies.

Copy remaining from bento-board if missing: `cardsA.tsx`–`cardsD.tsx`, `todo.tsx`, CSS tokens from `src/app/globals.css`.
