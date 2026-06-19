## 1. Parsing & service layer

- [x] 1.1 Add `src/lib/transcript-parse.ts` with `parseTxt`, `parseSrt`, and `parseTranscriptFile(buffer, filename)`
- [x] 1.2 Add tests for SRT and TXT parsing in `tests/transcript-parse.test.ts`
- [x] 1.3 Create `src/services/transcript-importer.ts` with `importTranscript()` orchestrating video create → clean → transcript create
- [x] 1.4 Use `getSupabaseAdmin()` for DB writes in importer (server/CLI context)

## 2. Cleaner integration

- [x] 2.1 Wire importer to `cleanTranscript()` with fallback to `cleanTranscriptSync()` when OpenAI unavailable
- [x] 2.2 Add max length validation (100k chars) with clear error message

## 3. Import page (UI)

- [x] 3.1 Add Server Action for import on `src/app/import/page.tsx`
- [x] 3.2 Support fields: title, optional youtube_url, file upload (.txt/.srt), paste textarea
- [x] 3.3 Show loading, success, and error states; mobile-centered layout (`max-w-[430px]`)
- [x] 3.4 Align colors with design system basics (`#222` / `#fff` only for text)

## 4. CLI

- [x] 4.1 Implement `scripts/import-transcript.ts` using `importTranscript` and file parser
- [x] 4.2 Support `--title` and optional `--url` flags

## 5. Verification & docs

- [x] 5.1 Add `tests/transcript-importer.test.ts` (mock DB/cleaner or integration with sync cleaner)
- [x] 5.2 Manual test: import sample transcript via UI and CLI; confirm rows in Supabase Studio
- [x] 5.3 Update `docs/progress.md` and `docs/next-task.md` for Phase 2 completion / Phase 3 next

**Note:** Added migration `20250619200000_grant_service_role.sql` so service_role can write during import.
