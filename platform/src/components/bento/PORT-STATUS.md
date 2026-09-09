# Bento port status (main)

| File | Status |
|------|--------|
| core.tsx | on main |
| theme.tsx | on main |
| cardsE.tsx | on main |
| cardsA–D, todo | still on `bento-board` — copy with git show |
| CSS `--bk-*` | still on bento-board globals |

```bash
git fetch origin bento-board
for f in cardsA.tsx cardsB.tsx cardsC.tsx cardsD.tsx todo.tsx; do
  git show origin/bento-board:src/components/bento/$f \
    > platform/src/components/bento/$f
done
```
