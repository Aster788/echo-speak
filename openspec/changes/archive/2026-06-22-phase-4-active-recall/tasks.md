## 1. Schema & migrations

- [x] 1.1 Add migration: rename `expressions.example` → `example_en` (preserve data)
- [x] 1.2 Add migration: `expressions.example_zh` (text, nullable)
- [x] 1.3 Add migration: `review_history` table (`expression_id`, `rating`, `reviewed_at`, `mode`, `scope_id`) with RLS
- [x] 1.4 Update `docs/database.md` with bilingual columns and `review_history` (status: implemented)

## 2. Types & data layer

- [x] 2.1 Update `src/types/expression.ts`: `example_en`, `example_zh`; update `CreateExpressionInput`
- [x] 2.2 Update `src/db/expressions.ts` inserts/selects for renamed columns
- [x] 2.3 Add `src/db/review-history.ts`: `insertReviewRating`, `listReviewHistoryForExpression`
- [x] 2.4 Grep and update all `example` field references across codebase

## 3. example_zh service & pipeline

- [x] 3.1 Add `src/services/example-zh.ts`: parse `raw_text` EN/ZH blocks, align to `example_en`
- [x] 3.2 Add DeepSeek single-sentence fallback when alignment fails
- [x] 3.3 Wire `expression-pipeline.ts` to populate `example_zh` on insert
- [x] 3.4 Add `scripts/backfill-example-zh.ts` for existing null rows
- [x] 3.5 Add tests for block alignment parser and fallback behavior

## 4. Server actions

- [x] 4.1 Add `loadReviewDeck(mode, scopeId)` — video or topic subtree expressions + scope metadata
- [x] 4.2 Add `submitReviewRating(expressionId, rating, mode, scopeId)` with validation (`mastered` | `again` | `unsure`)
- [x] 4.3 Add helpers to list videos/topics with expression counts for scope pickers

## 5. Review UI components

- [x] 5.1 Optimize and copy assets to `public/review/` (microphone, alphabet background); run `npm run audit:filenames`
- [x] 5.2 `ReviewModeSelector` — Video/Topic tiles + active bar (`… Mode Now` / Back)
- [x] 5.3 `ReviewEmptyDecoration` — alphabet collage (visible only in empty / pre-card states)
- [x] 5.4 `ReviewCard` — flip animation (150–200ms), front/back layout, source footer, palette + paper texture
- [x] 5.5 `ReviewRatingActions` — mastered/again/unsure row with design-system motion feedback
- [x] 5.6 Scope pickers: video list and topic tree selection after mode tap

## 6. Review page integration

- [x] 6.1 Rebuild `src/app/review/page.tsx` with session state machine (select-mode → pick-scope → reviewing)
- [x] 6.2 Wire deck navigation: rate → next card; end-of-deck empty state + Back
- [x] 6.3 Handle null `example_zh` gracefully on front card
- [x] 6.4 Mobile-first layout within `PageShell` / `PageHeader` (description only, no duplicate h1)

## 7. Integration & docs

- [x] 7.1 Manual test: Video mode — pick video, flip cards, rate all three values, verify `review_history` rows
- [x] 7.2 Manual test: Topic mode — pick parent topic, deck includes subtree expressions
- [x] 7.3 Manual test: Back returns to mode selector; empty scopes show decoration
- [x] 7.4 Update `docs/progress.md` and `docs/next-task.md` for Phase 4 completion / Phase 5 next
