## Why

Phase 4 delivered Active Recall—users flip bilingual cards and self-rate (`mastered` | `again` | `unsure`)—but ratings do not shape what comes back, and there is no daily review rhythm. Echo Speak is **not** an Anki clone. The goal is:

> Help me naturally retrieve English expressions when speaking.

Phase 5 closes the loop with a **memory-state-driven** scheduler, **Today's Review** as the primary daily workflow, and session-level Unsure reinforcement—optimizing **retrieval strength** for long-term speaking, not minimizing card count or permanent graduation.

## Product Principles

1. **Echo exists to improve long-term speaking recall, not minimize review time.**
2. **Expressions never permanently graduate.** Maximum interval is 365 days; expressions remain in the SRS cycle forever.
3. **Active recall is always more important than recognition.** Card direction is always Chinese → English (meaning/`example_zh` front → phrase/`example_en` back).
4. **Every interaction should feel lightweight enough to finish during a commute.** A typical review session targets 5–15 minutes (daily budget default 40 cards, user-configurable).

## What Changes

- **Memory engine**: Global per-expression states `New` → `Learning` → `Reviewing`; scheduling reads/writes `review_queue` by `expression_id` only (never by video or topic).
- **Rating semantics**:
  - `unsure` — complete retrieval failure; reinsert in session after 4–8 cards (max 3×/session); next review in 1 day; stays `Learning`.
  - `again` — retrieved with difficulty; **no** session reinsert; next review in 2 days; stays `Learning`.
  - `mastered` — natural recall; SRS interval grows (cap 365 days); **two consecutive** `mastered` events → `Reviewing`.
- **Two-layer architecture**: **Session Queue** (client, Unsure reinsert only) + **Review Queue** (DB, `due_at` / `memory_state` / intervals).
- **Today's Review** (UI label; never "Due"): Home CTA enters directly; Review page shows `Today's Review` | `Video Practice` | `Topic Practice`.
- **Daily budget** (default 40): Settings options 10 / 20 / 30 / 40 / 50 / Unlimited. Display `18 / 40` or `40 / 120` + `Continue later`. Budget complete → `🎉 You're all caught up.` + `Continue Today` (extra round from unseen Due + New only).
- **Today's Review selection**: (1) `due_at <= now` ascending; (2) if budget remains, **New** via weighted random (`first_reviewed_at IS NULL`—no persistent New queue).
- **New definition**: `first_reviewed_at IS NULL` only—not absence of a queue row.
- **Video / Topic**: intentional practice; all expressions in scope, random order; ratings update the same global SRS state.
- **Schema**: `review_queue` gains `memory_state`, `interval_days`, `last_reviewed_at`, `first_reviewed_at`; unique `expression_id`; v1 scheduler uses `due_at` only (reserve `reviews_since_last`, `difficulty_score` for future).
- **Docs**: `docs/decisions.md` ADRs for global state, never graduate, Today's Review workflow.

### In Scope (Phase 5)

- Today's Review session + daily budget + Continue Today
- Session Queue (Unsure 4–8 card reinsert, max 3)
- Memory engine + `scheduleAfterRating`
- Weighted random New selection (recent import slight boost, source de-clustering, anti-starvation)
- Settings: daily review budget
- Unit tests for scheduler, selection, session rules
- Mobile 430×932

### Out of Scope (defer)

- Dormant state, Random Recall channel, extra randomness in Today's Review
- `reviews_since_last` / volume-based eligibility (schema reserve only)
- Due badges on Collections rows
- Feishu (Phase 6), gap detection (Phase 7), speech scoring
- English → Chinese card direction
- UI word "Due" anywhere

## Capabilities

### New Capabilities

- `srs-scheduling`: Memory engine (`New` / `Learning` / `Reviewing`), rating rules, interval cap 365d, `scheduleAfterRating`, weighted New selection helper.
- `daily-review-budget`: Daily card cap, Today's Review deck builder (Due then New), budget display, Continue Today, caught-up state.

### Modified Capabilities

- `review-queue`: Full scheduling row per expression (`memory_state`, `due_at`, `interval_days`, `last_reviewed_at`, `first_reviewed_at`).
- `review-ratings`: Rating updates global SRS; `review_history` keeps `mode` + `scope_id` for analytics only.
- `active-recall-review`: Today's Review primary UX; Home direct entry; Video/Topic practice modes; Session Queue for Unsure.

## Impact

- `supabase/migrations/` — extend `review_queue`; optional `user_settings.daily_review_budget`
- `src/lib/srs.ts`, `src/services/srs-scheduler.ts`, `src/services/todays-review-selection.ts` (new)
- `src/services/session-queue.ts` (new, client-side or shared pure logic)
- `src/db/review-queue.ts`, `src/app/review/actions.ts`
- `src/components/review/`, `src/app/page.tsx`, `src/app/settings/`
- `src/types/review.ts` — `ReviewMode`: `todays_review` | `video` | `topic`
- `docs/decisions.md`, `docs/database.md`, `docs/progress.md`, `docs/next-task.md`
