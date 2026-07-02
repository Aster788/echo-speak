## Context

Phase 4: Video/Topic flip cards, `review_history` with `mode` + `scope_id`. Pre-Phase 5: empty `review_queue` schema. Echo is a **continuously growing** library—not a one-time import. Product goal is speaking retrieval, not Anki-style graduation.

Prior proposal over-indexed on `due_at` (engineer model). Revised model centers on **`memory_state`** with `due_at` as a scheduling output.

## Goals / Non-Goals

**Goals:**

- One global SRS state per `expression_id`; all modes update it
- `New` = `first_reviewed_at IS NULL` (query state, no New queue table)
- Today's Review: Due first, then weighted-random New to fill daily budget
- Session Queue: Unsure reinsert 4–8 cards later, max 3× per session
- Learning → Reviewing after two consecutive `mastered` (any adjacent review events; reset on `again`/`unsure`)
- Max interval 365 days; never permanently graduate
- UI: "Today's Review" never "Due"; Home CTA → direct session
- Default daily budget 40; settings 10/20/30/40/50/Unlimited

**Non-Goals:**

- Dormant, Random Recall, persistent New queue
- Volume-based eligibility (v1)
- backfill-all-to-due-at-now
- Per-user RLS scheduling (v1 uses service role like Phase 4)
- Recognition-direction cards (EN → CN)

## Architecture

```text
                 Rating
                    │
                    ▼
            Memory Engine
      (New → Learning → Reviewing)
                    │
          scheduleAfterRating()
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
 Session Queue           Review Queue (DB)
 (client only)           due_at, interval_days
 Unsure reinsert         memory_state
 4–8 cards, max 3×      first_reviewed_at
         │               last_reviewed_at
         └──────────┬──────────┘
                    ▼
           Today's Review
```

## Decisions

### D1. Memory states

| State | Definition |
|-------|------------|
| **New** | `first_reviewed_at IS NULL` |
| **Learning** | Reviewed at least once; not yet two consecutive `mastered` |
| **Reviewing** | Two consecutive `mastered` events; on SRS interval schedule |

Lifecycle:

```text
New → (first review) → Learning → (2× mastered) → Reviewing → SRS forever (max 365d interval)
```

`again` / `unsure` keep or return to `Learning` and break consecutive `mastered` streak.

### D2. Rating rules

| Rating | Session | Next `due_at` | `memory_state` |
|--------|---------|---------------|----------------|
| `unsure` | Reinsert after random 4–8 cards (max 3/session) | +1 day (after session ends for that card) | `Learning` |
| `again` | No reinsert | +2 days | `Learning` |
| `mastered` | No reinsert | SRS grow (cap 365d) | `Learning` until 2nd consecutive `mastered` → `Reviewing` |

Consecutive `mastered`: any two adjacent `review_history` rows for the expression are both `mastered`; `again`/`unsure` resets streak.

On first review: set `first_reviewed_at`; expression is no longer New.

### D3. New expressions (no queue)

- **Not** defined by missing `review_queue` row.
- **Only** `first_reviewed_at IS NULL`.
- New imports automatically satisfy this; no queue maintenance.
- Selected only when Today's Review budget remains after Due fill.

### D4. Today's Review selection

**PRD logic:**

1. Fill with due expressions (`due_at <= now`), `due_at` ascending, exclude dismissed, up to daily budget.
2. If budget not reached, fill with New (`first_reviewed_at IS NULL`) via **weighted random**:
   - Slightly prioritize recently imported (`expressions.created_at` or `videos.created_at`).
   - Penalize picking same `video_id` or `topic_id` as previous card in session (de-cluster).
   - Floor weight for old unseen expressions (anti-starvation).
3. Every reviewed expression enters scheduler; no longer New.

**Examples (budget 40):**

- Due 35, New 500 → Today's: 35 due + 5 new
- Due 120, New 500 → Today's: 40 due (0 new today)

### D5. Daily budget & caught up

- Default **40**; user setting in Settings: 10 / 20 / 30 / 40 / 50 / Unlimited.
- Home / Review display: `18 / 40` (today's slice / budget) or `40 / 120` + `Continue later` when eligible > budget.
- **Caught up** = today's budget slice complete **and** no more Due/New to roll into today—not database empty.
- UI: line 1 `🎉 You're all caught up.` line 2 `Continue Today` button.
- **Continue Today**: new round from Due + New **not yet shown today** (same priority rules).

Track `shown_today` in session/server for the calendar day (implementation: client session state + optional server-side daily session log, or re-query excluding expressions reviewed today before budget was met).

### D6. Video / Topic practice

- All expressions in scope; random shuffle; **not** filtered by due.
- Ratings update same global `review_queue` row.
- `review_history.mode` + `scope_id` retained for analytics only.

### D7. Schema (`review_queue`)

Per `expression_id` (unique):

| Column | Phase 5 use |
|--------|-------------|
| `memory_state` | `learning` \| `reviewing` (New inferred from `first_reviewed_at`) |
| `due_at` | v1 eligibility |
| `interval_days` | current interval |
| `last_reviewed_at` | scheduler input |
| `first_reviewed_at` | New definition; set on first review |

Reserve for future: `reviews_since_last`, `difficulty_score`.

`user_settings`: `daily_review_budget` (default 40).

No backfill script that marks all expressions due. Existing library: expressions stay New until selected in Today's Review.

### D8. UI naming

| Layer | Term |
|-------|------|
| UI | Today's Review, Video Practice, Topic Practice |
| Code mode enum | `todays_review` \| `video` \| `topic` |
| DB | `review_queue`, `due_at` (OK) |
| Forbidden in UI | "Due" |

Home CTA: `Today's Review (18 / 40)` → direct session, skip mode picker.

Review page: three tiles; Today's Review first with count.

### D9. Session Queue (client)

Pure logic in `src/services/session-queue.ts` (testable):

- On `unsure`: enqueue reinsert at `currentIndex + random(4..8)`, cap 3 reinserts per expression per session.
- On `again` / `mastered`: no reinsert.
- Session end: persist SRS via `scheduleAfterRating` for each rated card (including final `unsure`).

### D10. Scheduler extensibility

v1: `eligible ⟺ due_at <= now`.

Interface:

```ts
scheduleAfterRating({ expressionId, rating, reviewedAt, queueRow, history })
  → { dueAt, intervalDays, memoryState, firstReviewedAt }
```

Future: add `reviews_since_last` threshold without rewriting call sites.

## Risks / Trade-offs

- **[Risk] Weighted random complexity** → Start with simple weights + tests; tune constants in `decisions.md` if needed.
- **[Risk] "Shown today" tracking** → Use `review_history.reviewed_at` today + session dedup for Continue Today.
- **[Trade-off] No backfill** → First weeks heavily New-weighted until library gets first pass; acceptable for growing library product.

## Migration Plan

1. Migration: alter `review_queue` columns; unique `expression_id`; `user_settings.daily_review_budget` default 40.
2. Deploy app; no mass enqueue.
3. Smoke: Today's Review fills Due then New; Unsure reinserts; Home direct entry.

## Open Questions

- Exact weight constants for New selection → implement with named constants + unit tests; tune after dogfooding.
