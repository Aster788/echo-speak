## Context

Phase 3 stores expressions with `meaning`, `example`, `video_id`, and `topic_id`. Phase 3.5 adds topic curation. `/review` is still a placeholder ("No reviews due") and the legacy `reviews` table/types assume numeric SRS ratings—out of sync with the product spec.

Phase 4 delivers **Active Recall**: bilingual flip cards scoped by video or topic subtree, with `mastered | again | unsure` ratings persisted for Phase 5 scheduling. Visual and interaction details are defined in `docs/design-system.md` (Review Page / Review Card) and assets in `docs/design/phase-4-review/`.

Existing data access already supports `listExpressionsByVideo` and `listExpressionsByTopicSubtree` in `src/db/expressions.ts`.

## Goals / Non-Goals

**Goals:**

- Mobile-first `/review` session: mode selector → pick video or topic → flip-card deck
- Tarot / vintage paper card UX per design system (front CN recall, back EN check)
- Rename `example` → `example_en`; add `example_zh` with alignment + DeepSeek fallback
- Persist ratings to `review_history` (`mastered` | `again` | `unsure`)
- Rating micro-animations (fireworks / +1 / rain) per design-system Phase 4 exception
- Server actions for deck load and rate; no direct client writes to Supabase for ratings

**Non-Goals:**

- SRS queue, `due_at`, or automatic resurfacing (Phase 5)
- Shuffling algorithm beyond stable `created_at` order in v1
- Video/topic picker beyond simple list or reuse existing library patterns
- Speech recognition or AI oral scoring
- Updating legacy `reviews` table (deprecate in favor of `review_history`)

## Decisions

### 1. Review session state machine

**Decision:** Three UI states on `/review`:

| State | UI |
|-------|-----|
| `select-mode` | Video / Topic mode selector + alphabet empty decoration |
| `pick-scope` | Picker for video list or topic tree (depends on mode) |
| `reviewing` | Active bar (`Video Mode Now` / `Topic Mode Now` + Back) + flip card |

`Back` from `reviewing` → `select-mode` (clears deck). `Back` from `pick-scope` → `select-mode`.

**Rationale:** Matches design-system mode selector; user must consciously choose dimension before recall.

**Alternative considered:** Single combined picker — rejected; design spec requires explicit Video vs Topic entry.

### 2. Deck ordering and filtering

**Decision:** Load expressions ordered by `created_at` ascending. No SRS filter in Phase 4—all expressions in scope are reviewable.

**Rationale:** Phase 5 adds due filtering; Phase 4 validates recall UX on full library scope.

### 3. Card component architecture

**Decision:** Client components under `src/components/review/`:

- `ReviewModeSelector` — initial Video/Topic tiles + active bar
- `ReviewCard` — flip container, front/back content, source footer
- `ReviewRatingActions` — three-column back footer with motion hooks
- `ReviewEmptyDecoration` — alphabet background (conditional)

Card background color: random pick from existing Card Palette in design system. Text color auto `#FFFFFF` / `#222222` for contrast.

**Rationale:** Isolates review UX from generic `PageShell`; assets already scaffolded in `public/review/` and `docs/design/phase-4-review/`.

### 4. Schema: bilingual examples

**Decision:** Migration:

1. Rename column `expressions.example` → `example_en` (copy data in place)
2. Add `expressions.example_zh` (text, nullable)

Update TypeScript types and all DB insert/select paths.

**Rationale:** ADR in `docs/decisions.md`; front card needs Chinese sentence aligned to English example.

### 5. `example_zh` resolution service

**Decision:** `src/services/example-zh.ts`:

1. Parse `transcripts.raw_text` into alternating EN/ZH blocks (multi-line blocks OK)
2. Find block containing `example_en` substring → paired ZH block is `example_zh`
3. On failure → DeepSeek single-sentence translate `example_en` → Chinese

Call from extraction pipeline on insert and from a one-off backfill script for existing rows.

**Rationale:** User always pastes bilingual transcripts; alignment avoids API cost; DeepSeek approved fallback per ADR.

**Alternative considered:** LLM-only translation — rejected; wastes cost when alignment works.

### 6. Rating persistence

**Decision:** New `review_history` table:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| expression_id | uuid | FK → expressions |
| rating | text | `mastered` \| `again` \| `unsure` |
| reviewed_at | timestamptz | default now |
| mode | text | `video` \| `topic` |
| scope_id | uuid | video_id or topic_id at time of review |

Server action `submitReviewRating(expressionId, rating, mode, scopeId)` inserts row. No `next_review_at` computation in Phase 4.

**Rationale:** Clean contract for Phase 5 SRS; avoids overloading expressions table with last-rating columns in v1.

**Alternative considered:** Reuse legacy `reviews` table with numeric rating — rejected; schema and design-system use text ratings.

### 7. API surface

**Decision:**

- Server Actions (preferred): `loadReviewDeck(mode, scopeId)`, `submitReviewRating(...)`
- Optional read routes if needed: reuse existing expression list helpers server-side

No new public REST endpoints required unless client caching demands it.

### 8. Missing `example_zh` at review time

**Decision:** If card loads with null `example_zh`, show front second line as em dash or hide line; trigger lazy fill via server action in background for that expression (alignment → DeepSeek). Do not block card flip.

**Rationale:** Backfill may lag; recall UX should still work with `meaning` alone.

### 9. Asset pipeline

**Decision:** Optimize sources from `docs/design/phase-4-review/sources/` into `public/review/` (URL-safe names). Run `npm run audit:filenames` after adding assets.

**Rationale:** User rule for static resource naming; Next.js serves from `public/`.

## Risks / Trade-offs

- **[Risk] Raw-text alignment fails on messy ASR** → DeepSeek fallback; log alignment misses for manual inspection
- **[Risk] Large topic subtree decks feel endless** → v1 accepts full deck; Phase 5 can cap by due count
- **[Risk] Legacy `example` references in code** → grep and update in same PR; migration is breaking for column name only at DB layer
- **[Risk] Rating animations feel gamey** → design system caps duration and scope (button-local only)
- **[Trade-off] No shuffle** → predictable order; user can revisit same sequence until Phase 5 scheduling

## Migration Plan

1. Apply Supabase migration: rename `example`, add `example_zh`, create `review_history`
2. Deploy app code with updated types
3. Run backfill script for `example_zh` on existing expressions
4. Verify `/review` manual flow on one video and one topic
5. Rollback: revert app; DB rollback requires down migration restoring `example` column name (data preserved in rename)

## Open Questions

- Video/topic picker UX: inline list on `/review` vs navigate from library — **default v1:** minimal inline picker on `/review` after mode select
- Session completion screen when deck exhausted — **default v1:** quiet empty message + Back to mode select (no celebration full-screen)
