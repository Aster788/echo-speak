# Next Task

Objective:

Build expression extraction pipeline (Phase 3).

Scope:

- AI extraction from `transcripts.cleaned_text`
- Topic classification
- Store in `expressions` table (new migration)

Definition of Done:

- Imported transcript yields extracted expressions in database
- Each expression has phrase, meaning, example, topic

Do Not Build Yet:

- Review engine (Phase 4–5)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Files Expected:

- `supabase/migrations/*` (expressions table)
- `src/services/expression-extractor.ts`
- `prompts/extract-expressions.md`

Reference:

- Phase 2 import: `src/services/transcript-importer.ts`
- `docs/database.md`
