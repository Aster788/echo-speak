## 1. Schema & migrations

- [x] 1.1 Migration: `review_queue` add `memory_state`, `interval_days`, `last_reviewed_at`, `first_reviewed_at`; unique `expression_id`
- [x] 1.2 Migration: RLS update/upsert policies; grant `update` to `service_role`
- [x] 1.3 Migration or seed: `user_settings.daily_review_budget` default 40 (options 10/20/30/40/50/unlimited)
- [x] 1.4 Update `docs/database.md` with new columns and New = `first_reviewed_at IS NULL`

## 2. Memory engine & scheduler

- [x] 2.1 Extend `src/lib/srs.ts`: rating rules, 365-day cap, consecutive `mastered` helper
- [x] 2.2 Add `src/services/srs-scheduler.ts`: `scheduleAfterRating()` → due_at, interval, memory_state, first_reviewed_at
- [x] 2.3 Add `src/services/todays-review-selection.ts`: Due fill + weighted random New (recency, de-cluster, anti-starvation)
- [x] 2.4 Add `src/services/session-queue.ts`: Unsure reinsert 4–8 cards, max 3/session (pure, testable)
- [x] 2.5 Unit tests: rating intervals, 365 cap, streak promotion, weighted New, session queue

## 3. Review queue data layer

- [x] 3.1 `upsertReviewQueue`, `getQueueRow`, `listDueExpressions`, `listNewExpressions`, eligibility counts
- [x] 3.2 `src/types/review.ts`: `ReviewMode` = `todays_review` | `video` | `topic`; memory state types
- [x] 3.3 Track expressions shown today for Continue Today (query `review_history` + session state)

## 4. Server actions

- [x] 4.1 `buildTodaysReviewDeck({ budget, excludeIds })` — Due then weighted New
- [x] 4.2 `getTodaysReviewSummary()` — slice/budget/eligible counts for Home + Review
- [x] 4.3 `submitReviewRating` → history + `scheduleAfterRating` (global, mode ignored for schedule)
- [x] 4.4 Video/Topic deck loaders: full scope, random shuffle, same submit path

## 5. Today's Review UI

- [x] 5.1 Home CTA: `Today's Review (slice / budget)` → direct session (no mode picker)
- [x] 5.2 Review page: Today's Review | Video Practice | Topic Practice (no "Due" in UI)
- [x] 5.3 `ReviewSession`: integrate Session Queue for Unsure; active bar `Today's Review Now`
- [x] 5.4 Caught up: `🎉 You're all caught up.` + `Continue Today` when rollover exists
- [x] 5.5 Display `40 / 120` + `Continue later` when eligible > budget

## 6. Settings

- [x] 6.1 Settings UI: daily review budget selector (10/20/30/40/50/Unlimited)
- [x] 6.2 Wire budget into deck builder and summary

## 7. Integration & docs

- [x] 7.1 Manual test (430×932): Due 35 + New 5 fill; Due 120 → 40 only; Unsure reinsert; Again no reinsert
- [x] 7.2 Manual test: Video Practice updates same expression as Today's Review
- [x] 7.3 Manual test: Continue Today excludes already-shown cards
- [x] 7.4 Manual test: two consecutive Mastered → Reviewing; Again breaks streak
- [x] 7.5 Add Phase 5 ADRs to `docs/decisions.md`
- [x] 7.6 Update `docs/progress.md` and `docs/next-task.md`
- [x] 7.7 `npm run build` passes
