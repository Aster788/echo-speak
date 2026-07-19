## Why

Phase 6 imported Feishu keep-lists into Echo Speak (`source_type = feishu`), while transcript extraction still produces a separate set of candidate phrases (`source_type = transcript`). Learners cannot yet see **blind spots**: useful expressions that appear in the transcript extract but were never collected into notes. Phase 7 closes that loop so Gaps stops being an empty stub and becomes a real discovery surface.

## What Changes

- **Deterministic gap detection** per video: compare transcript-sourced expressions against Feishu-sourced expressions using existing `canonicalKey` (no LLM required for the core set difference).
- **`gaps` table** (planned in `docs/database.md`): link to the transcript expression, store reason, and track `pending` / `accepted` / `ignored` status.
- **Detection triggers**: refresh gaps after transcript extraction and after Feishu sync for affected videos; optional manual refresh from the Gaps page.
- **Gaps UI** (`/gaps`): list pending gaps with Accept / Ignore; replace the current placeholder empty state when data exists.
- **Accept / Ignore actions**: Accept keeps the transcript expression as a confirmed keep (status → `accepted`); Ignore dismisses it for that video (status → `ignored`) so it does not reappear on the next refresh unless the underlying expression set changes in a way that recreates the gap.
- **Retire LLM-first stub path** for Phase 7 success criteria: replace or bypass `src/services/gap-detector.ts` + `prompts/gap-detection.md` as the primary detector (those assume “known library vs raw text,” which is the wrong model now that Feishu rows exist).

### In Scope

- Per-video scope: gap = transcript phrase present, no matching Feishu phrase on the same `video_id` by `canonicalKey`
- Persist + list + accept/ignore
- Wire Gaps nav page to real data
- Migration for `gaps` + RLS consistent with other user-owned tables

### Out of Scope (defer)

- LLM ranking / “usefulness” scoring of gaps (optional later enhancement)
- Cross-video global gaps (phrase missing across the whole library)
- Write-back of accepted gaps into Feishu notes
- Auto-adding gaps into review queue without explicit Accept (unless Accept already implies review eligibility via existing expression rows)
- Topic suggestion (Phase 8)

## Capabilities

### New Capabilities

- `gap-detection`: Detect, persist, and manage knowledge gaps (transcript extract vs Feishu notes), including schema, service rules, triggers, and Gaps page actions.

### Modified Capabilities

- `expression-storage`: Clarify that gap detection reads transcript vs Feishu rows via `canonicalKey` and MUST NOT delete or merge across `source_type` as a side effect of detection.

## Impact

- `supabase/migrations/` — create `gaps` (+ indexes, RLS)
- `src/db/` — gaps data access
- `src/services/` — replace stub `gap-detector.ts` with deterministic detector; call from extract / Feishu sync paths
- `src/app/gaps/page.tsx`, `src/components/GapCard.tsx` — real list + actions
- `docs/database.md`, `docs/decisions.md`, `docs/progress.md`, `docs/next-task.md`
- Existing `canonicalKey` in `src/lib/phrase-canonical.ts` (reuse; no new LLM dependency for core detection)
