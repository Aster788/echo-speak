## 1. Schema & types

- [x] 1.1 Migration: allow `gap_ignore` on `expression_dismissals.reason` check constraint
- [x] 1.2 Add `gap_ignore` to `DISMISS_REASONS` + label in `src/types/dismiss-reason.ts` (and any hint/label maps)
- [x] 1.3 ADR in `docs/decisions.md` for Gaps Ignore=dismiss and Accept=weight+lock

## 2. Accept / Ignore side effects

- [x] 2.1 Add helper to bump expression weight (`min(w+0.5, 3.0)`) and set `topic_locked = true`
- [x] 2.2 Update `POST /api/gaps/[id]/accept` to set gap accepted + apply weight/lock on linked expression
- [x] 2.3 Update `POST /api/gaps/[id]/ignore` to dismiss linked expression with `gap_ignore` (authenticated user id when present); rely on CASCADE for gap row
- [x] 2.4 Unit/integration tests: Ignore creates dismissal + removes expression; Accept bumps weight/cap and locks; dismissed phrase does not become pending on refresh

## 3. Gaps UI

- [x] 3.1 Microcopy: clarify Ignore removes the phrase from Collections (430×932 density)
- [x] 3.2 Ensure client removes card after Ignore/Accept success (Ignore: gone; Accept: leave pending list)
- [x] 3.3 Smoke at iPhone 15 Plus viewport (430×932)

## 4. Docs close-out

- [x] 4.1 Update `docs/progress.md` and `docs/next-task.md` for feedback-loop implementation status
- [x] 4.2 Apply reason-check migration to cloud; smoke Accept/Ignore on production-like data
