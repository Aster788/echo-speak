## Why

Phase 3 built the expression library and Phase 3.5 made topics curatable, but users still cannot **actively recall** expressions in a focused session. The core product promise—turning collected phrases into speaking memory—requires a bilingual flip-card review flow scoped by **video** or **topic subtree**, with self-ratings that Phase 5 SRS can schedule later.

## What Changes

- **Review page (`/review`)**: Mode selector (Video / Topic) → scoped card session → `Back` to mode pick; active bar shows `Video Mode Now` or `Topic Mode Now`.
- **Tarot-style flip cards**: Front = `meaning` + `example_zh`; back = `phrase` + `example_en`; 150–200ms flip; rating row `mastered | again | unsure` (English only).
- **Video mode**: User picks a video → review all expressions for that video.
- **Topic mode**: User picks a topic → review expressions in that topic **subtree** (reuse Phase 3 query).
- **Empty states**: Alphabet collage decoration when no mode selected or no cards in scope; hidden during active card review.
- **Schema**: Rename `expressions.example` → `example_en`; add `example_zh` (nullable until filled).
- **`example_zh` fill**: Align from `transcripts.raw_text` EN/ZH blocks at import/extraction; DeepSeek single-sentence fallback on alignment failure.
- **Rating persistence**: Record each rating (`mastered` | `again` | `unsure`) per expression in `review_history` (no SRS scheduling yet).
- **Rating feedback motion**: Per `docs/design-system.md` Phase 4 exceptions (fireworks / +1 float / rain).

### In Scope (Phase 4)

- Mobile-first layout (`max-w-[430px]`, design system palette, paper texture)
- Mode selector assets from `docs/design/phase-4-review/`
- Server actions / API for listing review deck + submitting rating
- Backfill `example_zh` for existing expressions (alignment first, DeepSeek for gaps)
- Update `docs/progress.md`, `docs/next-task.md`, `docs/database.md` after apply

### Out of Scope (defer)

- SRS queue, due dates, automatic resurfacing (Phase 5)
- Feishu sync (Phase 6)
- Gap detection (Phase 7)
- Speech recognition or AI oral scoring
- Desktop-specific layout beyond responsive mobile container

## Capabilities

### New Capabilities

- `active-recall-review`: Review page session flow—mode selector, scoped deck loading (video or topic subtree), tarot flip card UI, empty-state decoration, and rating action UX per design system.
- `review-ratings`: Persist self-evaluations (`mastered` | `again` | `unsure`) to `review_history` for each expression review event; API/server action contract for Phase 5 scheduling.

### Modified Capabilities

- `expression-storage`: Column rename `example` → `example_en`; add `example_zh`; migration copies existing data; list queries return bilingual fields for review cards.
- `expression-extraction`: Pipeline writes `example_en` and attempts `example_zh` via raw-text block alignment at insert time; DeepSeek fallback when alignment fails.

## Impact

- `src/app/review/page.tsx` — full review session (replace placeholder)
- `src/components/review/` — `ReviewCard`, mode selector, rating actions, flip animation
- `public/review/` — optimized static assets (microphone, alphabet background)
- `src/db/expressions.ts` — bilingual column names; review deck queries
- `src/db/review-history.ts` (new) — insert/list review events
- `src/services/example-zh.ts` (new) — raw-text alignment + DeepSeek fallback
- `src/services/expression-pipeline.ts` — populate `example_zh` on extract
- `supabase/migrations/` — rename column, add `example_zh`, `review_history` table
- `src/types/expression.ts`, `src/types/review.ts` — align types with schema
- `docs/design-system.md` — already defines Review Page / Card (reference, minimal delta)
- `docs/decisions.md` — ratings and bilingual schema ADRs already recorded
