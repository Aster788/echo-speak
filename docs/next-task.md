# Next Task

Objective:

Build transcript import flow (Phase 2).

Scope:

- Transcript upload (txt / srt / paste)
- Transcript cleaner integration
- Save cleaned transcript to `transcripts` table

Definition of Done:

- User can import a YouTube transcript file
- Raw text stored in `transcripts.raw_text`
- Cleaned text stored in `transcripts.cleaned_text`

Do Not Build Yet:

- Expression extraction (Phase 3)
- Review engine (Phase 4–5)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Files Expected:

- `src/app/import/page.tsx`
- `scripts/import-transcript.ts`
- `src/services/transcript-cleaner.ts`

Reference:

- Phase 1 migration: `supabase/migrations/20250619120000_phase1_videos_transcripts.sql`
- `docs/database.md`
