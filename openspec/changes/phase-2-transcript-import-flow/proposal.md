## Why

Phase 1 established database tables (`videos`, `transcripts`) but users cannot yet import content. The core learning workflow starts with bringing a YouTube transcript into Echo Speak. Phase 2 closes the gap between raw export files and persisted, cleaned transcript text.

## What Changes

- Implement end-to-end **transcript import**: upload `.txt` / `.srt`, or paste text, with video title and optional YouTube URL.
- Integrate **`transcript-cleaner`** (OpenAI + sync fallback) before save.
- Persist **`raw_text`** and **`cleaned_text`** via existing Phase 1 schema.
- Wire **`/import` page** (mobile-first per design system) and **`scripts/import-transcript.ts`** CLI.
- Add **`src/services/transcript-importer.ts`** orchestration service (no UI logic).

### In Scope (Phase 2)

- File upload + paste on import page
- Parse `.txt` and `.srt` (strip timestamps/cues from SRT)
- Create `videos` row (`source: youtube` when URL provided, else `manual`)
- Clean transcript, then insert `transcripts` row
- CLI script with same pipeline
- Basic success/error feedback on import page

### Out of Scope (defer)

- Expression extraction (Phase 3)
- YouTube API / automatic transcript fetch from URL only
- Feishu sync, gap detection, review engine
- Full auth UI (use server-side service role for writes until auth ships)
- Design-system visual polish beyond functional mobile layout

## Capabilities

### New Capabilities

- `transcript-import`: Accept transcript input (file or paste), clean it, and store video + transcript records.

### Modified Capabilities

- `transcript-storage`: Extend requirements to cover import pipeline writing both `raw_text` and `cleaned_text` after cleaning.

## Impact

- `src/app/import/page.tsx` — functional import form + server action
- `src/services/transcript-importer.ts` — new orchestration service
- `src/services/transcript-cleaner.ts` — reuse; may add SRT-aware pre-parse helper
- `src/lib/` — optional file parse utilities
- `scripts/import-transcript.ts` — implement CLI
- `src/db/videos.ts`, `src/db/transcripts.ts` — may add server-side helpers using admin client
- `tests/` — importer + parser tests
- `docs/progress.md`, `docs/next-task.md` — update after apply
