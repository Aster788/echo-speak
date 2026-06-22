Planned UI for `/review`:

- `ReviewModeSelector` — Video Mode / Topic Mode（上下分布，全圆角胶囊内含图标）
- `ReviewEmptyDecoration` — alphabet PNG; only when no mode or no cards
- `ReviewFlipCard` — tarot-style front/back
- `ReviewCard` — migrate from `src/components/ReviewCard.tsx`

Import production images from `/public/review/` when optimized.

Rating keys: `mastered` | `again` | `unsure` (English UI only).
