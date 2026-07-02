# Next Task

Objective:

**Phase 5 deploy & smoke** on branch `feat/phase-5-spaced-repetition`.

Checklist:

1. Apply migration `20260702120000_phase5_srs_scheduling.sql` to Supabase cloud
2. Smoke at 430×932: Home → Today's Review (`?start=todays`), Due-then-New fill, Unsure reinsert, Continue Today
3. Verify Video/Topic practice updates same global SRS row
4. Merge PR, tag `phase-5` on `main`

Reference:

- Plan: `openspec/changes/phase-5-spaced-repetition/`
- ADRs: `docs/decisions.md` (2026-07-02 entries)
- Database: `docs/database.md` (`review_queue`, `user_settings.daily_review_budget`)

Optional (ops):

- Resend SMTP + email OTP template on Supabase cloud
