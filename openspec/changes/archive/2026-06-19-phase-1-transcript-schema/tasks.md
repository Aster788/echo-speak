## 1. Migration

- [x] 1.1 Create `supabase/migrations/<timestamp>_phase1_videos_transcripts.sql` with `videos` and `transcripts` tables per design.md
- [x] 1.2 Add FK `transcripts.video_id → videos.id`, index on `transcripts(video_id)`, and `source` check constraint
- [x] 1.3 Enable RLS and add authenticated CRUD policies on both tables
- [x] 1.4 Run `supabase db reset` locally and confirm both tables appear in Studio

## 2. TypeScript alignment

- [x] 2.1 Update `src/types/transcript.ts`: `Video` uses `youtube_url`, `source`; `Transcript` uses snake_case field names matching DB
- [x] 2.2 Update `src/db/videos.ts` and `src/db/transcripts.ts` inserts/selects to use correct column names
- [x] 2.3 Add minimal seed rows in `supabase/seed.sql` (one video + one transcript) for local smoke test

## 3. Documentation

- [x] 3.1 Update `docs/database.md`: note Phase 1 implements `videos` + `transcripts` only; mark other tables as planned
- [x] 3.2 Update `docs/progress.md` and `docs/next-task.md` to reflect Phase 1 scope and next step (Phase 2 import)

## 4. Verification

- [x] 4.1 Verify migration applies without errors on fresh `supabase db reset`
- [x] 4.2 Confirm seed data visible in Supabase Studio (or document if Supabase not available locally)

**Verified 2026-06-19:** `supabase start` + `db reset` succeeded. Tables `videos`, `transcripts` exist; seed row `Sample Video` confirmed via `supabase db query`.
