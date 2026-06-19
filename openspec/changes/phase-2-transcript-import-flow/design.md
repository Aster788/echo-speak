## Context

Phase 1 provides `videos` and `transcripts` tables plus `createVideo` / `createTranscript` helpers using the anon Supabase client. RLS requires `authenticated` role, but v1 has no login UI yet. The import page is a static form stub; `import-transcript.ts` is unimplemented. `transcript-cleaner.ts` already calls OpenAI with a prompt template and exposes `cleanTranscriptSync` for tests.

User workflow (from PRD): export transcript from YouTube → paste or upload into Echo → get cleaned, stored text.

## Goals / Non-Goals

**Goals:**

- Single import pipeline shared by UI and CLI
- Support inputs: paste, `.txt`, `.srt`
- Store `raw_text` (as received/parsed) and `cleaned_text` (after cleaner)
- Roadmap success: **Import YouTube transcript** (file or paste representing exported transcript)
- Mobile-first layout (`max-width: 430px`, centered) per `docs/design-system.md`

**Non-Goals:**

- Fetching transcripts from YouTube API by URL alone
- Expression extraction after import
- Auth/login flow
- Feishu, gaps, reviews

## Decisions

### 1. Orchestration service: `transcript-importer.ts`

**Decision:** New service `importTranscript({ title, youtube_url?, rawText, source? })` that:
1. Creates video
2. Runs cleaner on raw text
3. Creates transcript with raw + cleaned

**Rationale:** Keeps UI and CLI thin; matches existing `src/services/` pattern.

### 2. Server-side writes via service role

**Decision:** Import uses `getSupabaseAdmin()` in server context (Server Action + CLI script), not browser anon client.

**Rationale:** Phase 1 RLS requires `authenticated`; no auth UI exists. Service role avoids blocked inserts while keeping RLS enabled for future client use.

**Alternative considered:** Add permissive anon INSERT policies. Rejected — widens attack surface; service role on server is safer for solo v1.

### 3. Cleaning strategy

**Decision:**
- **Primary:** `cleanTranscript()` (OpenAI) when `OPENAI_API_KEY` set
- **Fallback:** `cleanTranscriptSync()` when key missing or `IMPORT_USE_SYNC_CLEANER=1` (CLI/dev)

**Rationale:** Tests already use sync cleaner; avoids hard dependency on API for local dev.

### 4. File parsing

**Decision:** Add `src/lib/transcript-parse.ts`:
- `.txt` → read as UTF-8 text
- `.srt` → strip sequence numbers, timestamps, join cue text with newlines
- Paste → use as-is

**Rationale:** YouTube exports are commonly `.srt` or plain text.

### 5. UI: Server Action on import page

**Decision:** Client form (title, optional URL, file input, textarea) submits to Server Action calling `importTranscript`.

**Rationale:** No separate API route needed; keeps secrets server-side.

**UX:** Show loading state, success message with video/transcript IDs, inline error on failure.

### 6. CLI

**Decision:** `npx tsx scripts/import-transcript.ts <file> --title "..." [--url "..."]`

Loads env from `.env.local`, reuses `importTranscript`.

### 7. Design system (minimal compliance)

**Decision:** Refactor import page to centered `max-w-[430px]` container; use `#222` / `#fff` text only; no dashboard styling. Full paper/card palette deferred — functional form first.

**Rationale:** Phase 2 success is functional import; visual polish can iterate.

## Risks / Trade-offs

- **[Risk] OpenAI latency/cost on large transcripts** → Mitigation: chunk if > N chars (future); v1 accept full text with gpt-4o-mini.
- **[Risk] Service role in Server Action** → Mitigation: only callable from server; no key exposed to client.
- **[Risk] SRT parse edge cases** → Mitigation: unit tests with sample SRT fixtures.

## Migration Plan

No schema migration required. Deploy: merge code, ensure `.env.local` has Supabase + OpenAI keys.

## Open Questions

- Max transcript length for v1? **Default:** 100k chars, reject with clear error if exceeded.
