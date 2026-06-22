# Next Task

Objective:

Build spaced repetition scheduling (Phase 5) on top of Active Recall ratings.

Scope:

- `review_queue` table and due-date computation from `review_history` ratings
- Surface due cards on `/review` (or dedicated queue entry)
- Scheduling rules using existing `src/lib/srs.ts` (adapt to `mastered` / `again` / `unsure`)

Definition of Done:

- After rating in Phase 4 flow, expressions get a next review date
- User sees expressions when due, not the full deck every time

Do Not Build Yet:

- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Reference:

- Ratings: `review_history` (`src/db/review-history.ts`)
- SRS helper: `src/lib/srs.ts`
- Phase 4 review UI: `src/app/review/`, `src/components/review/`
