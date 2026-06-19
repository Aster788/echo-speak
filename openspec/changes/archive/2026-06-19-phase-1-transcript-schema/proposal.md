## Why

Echo Speak Phase 1 (Foundation) requires a working database before any import or learning features can persist data. Today `supabase/migrations/` is empty and `src/db/` assumes tables that do not exist. Without a schema, the roadmap success criterion — **store transcript** — cannot be met.

## What Changes

- Add initial Supabase migration creating **`videos`** and **`transcripts`** tables only.
- Enable RLS on both tables (single-user v1: authenticated access).
- Align TypeScript types and `src/db/` helpers with the migration column names.
- Update `docs/database.md` to mark Phase 1 tables as implemented; defer later-phase tables.
- Resolve known doc/code drift (e.g. `sourceUrl` vs `youtube_url`) within Phase 1 scope.

### In Scope (Phase 1)

- `videos` table
- `transcripts` table (FK → videos)
- Local migration runs via `supabase db reset`
- Tables visible in local Supabase Studio

### Out of Scope (defer to later phases)

- `expressions`, `review_queue`, `review_history` (Phase 3–5)
- `gaps` (Phase 7)
- `sync_logs` (Phase 6)
- Transcript upload UI, cleaner pipeline, import scripts (Phase 2)
- Review engine, SRS scheduling logic changes (Phase 4–5)
- Feishu sync (Phase 6)

## Capabilities

### New Capabilities

- `transcript-storage`: Persist video metadata and transcript content (raw + cleaned) in Supabase.

### Modified Capabilities

<!-- No existing main specs yet (openspec/specs/ is empty) -->

## Impact

- `supabase/migrations/*` — new migration file(s)
- `supabase/seed.sql` — optional sample rows for local dev
- `src/types/transcript.ts` — align field names with DB
- `src/db/videos.ts`, `src/db/transcripts.ts` — align inserts/selects with schema
- `docs/database.md`, `docs/progress.md`, `docs/next-task.md` — reflect Phase 1 completion state
