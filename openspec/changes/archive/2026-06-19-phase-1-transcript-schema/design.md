## Context

Echo Speak is a Next.js + Supabase app. `docs/database.md` documents the full long-term schema (7 tables), but Phase 1 (Roadmap) only requires **storing transcripts**. The repo has placeholder `src/db/videos.ts` and `src/db/transcripts.ts` that call Supabase, but no migration exists. Types use camelCase (`sourceUrl`) while `docs/database.md` uses snake_case (`youtube_url`, `source`).

## Goals / Non-Goals

**Goals:**

- Create migration `supabase/migrations/<timestamp>_phase1_videos_transcripts.sql`
- Tables: `videos`, `transcripts` with FK and indexes
- RLS enabled; policies for authenticated user (single-user v1)
- Align `Video` / `Transcript` types and DB helpers with snake_case columns
- Verify locally: `supabase db reset` succeeds; tables visible in Studio
- Update `docs/database.md` with Phase 1 status note

**Non-Goals:**

- Creating `expressions`, `review_queue`, `review_history`, `gaps`, `sync_logs`
- Building import UI, transcript cleaner, or seed data beyond minimal examples
- Changing SRS/scoring code (1–5 rating) — deferred to Phase 4–5
- Production Supabase project linking (local only for this change)

## Decisions

### 1. Phase 1 tables: videos + transcripts only

**Decision:** Ship two tables now; defer the rest.

**Rationale:** Matches `roadmap.md` Phase 1 success criterion ("Store transcript") and keeps migration reviewable. `next-task.md` lists more tables, but explicitly says "Do Not Build Yet" for review/gap/feishu — schema for those tables can land in later migrations.

**Alternative considered:** Create all tables upfront. Rejected — adds unused tables, RLS policies, and review surface with no Phase 1 consumer.

### 2. Column naming: snake_case in DB, map in TypeScript

**Decision:** Migration uses snake_case per Postgres convention. Update types to match:

| Table | Columns |
|-------|---------|
| `videos` | `id`, `title`, `youtube_url`, `source`, `created_at` |
| `transcripts` | `id`, `video_id`, `raw_text`, `cleaned_text`, `created_at` |

**Rationale:** Aligns with `docs/database.md`. Supabase client returns snake_case by default unless aliased.

**Alternative considered:** Keep camelCase in DB. Rejected — inconsistent with existing docs and Postgres norms.

### 3. `source` on videos

**Decision:** `source text not null default 'manual'` with check constraint `source in ('youtube', 'manual')`.

**Rationale:** Documented in `database.md`; supports future YouTube import (Phase 2).

### 4. `cleaned_text` nullable

**Decision:** `cleaned_text text null` — nullable until cleaner runs (Phase 2).

**Rationale:** Import may store raw text first; cleaning is a separate step.

### 5. RLS: authenticated-only, permissive for v1

**Decision:** Enable RLS on both tables. Policy: authenticated users have full CRUD on their data. For single-user v1 without multi-tenancy, use a simple `auth.role() = 'authenticated'` policy (no `user_id` column yet).

**Rationale:** `database.md` requires RLS. Adding `user_id` is premature until auth is implemented; document as follow-up when auth lands.

**Alternative considered:** Disable RLS for local dev. Rejected — violates project DB doc and creates prod mismatch.

### 6. UUID primary keys

**Decision:** `id uuid primary key default gen_random_uuid()`.

**Rationale:** Matches `database.md` and existing TypeScript types (`string` ids).

### 7. Indexes

**Decision:** Index `transcripts(video_id)` for FK lookups.

## Risks / Trade-offs

- **[Risk] RLS without `user_id`** → Any authenticated session sees all rows. **Mitigation:** Acceptable for solo v1; add `user_id` + policies when auth ships.
- **[Risk] `next-task.md` lists 5 tables** → Doc drift. **Mitigation:** Update `next-task.md` and `progress.md` in apply phase to reflect phased approach.
- **[Risk] `src/db/` insert uses wrong column names** → Runtime errors. **Mitigation:** Tasks include aligning helpers and a smoke insert in seed or test.
- **[Risk] Local Supabase not running** → Migration untested. **Mitigation:** Task requires `supabase db reset` verification.

## Migration Plan

1. Add SQL migration file under `supabase/migrations/`
2. Run `supabase db reset` locally
3. Confirm tables in Studio
4. Update types + db helpers
5. Optionally uncomment `seed.sql` placeholders

**Rollback:** Delete migration file and reset DB (no production deploy in this change).

## Open Questions

- None blocking Phase 1. Auth/`user_id` column timing to be decided in a future change.
