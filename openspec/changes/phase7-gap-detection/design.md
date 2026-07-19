## Context

Phase 6 ships Feishu notes as `expressions` with `source_type = feishu`, alongside transcript extraction (`source_type = transcript`). Both share `video_id` and can be compared with existing `canonicalKey` (`src/lib/phrase-canonical.ts`).

Today:

- `/gaps` is a stub (“No gaps detected.”)
- `src/services/gap-detector.ts` + `prompts/gap-detection.md` are an early **LLM** design (known phrases vs raw text) that does not match the Phase 7 success criterion
- `gaps` table is documented as planned but not migrated

Product definition (PRD / roadmap): compare **transcript extract vs Feishu notes** and surface useful phrases the learner missed collecting.

## Goals / Non-Goals

**Goals:**

- Deterministic per-video set difference: transcript keys minus Feishu keys
- Persist gaps with Accept / Ignore lifecycle
- Wire Gaps page to real pending rows
- Refresh after extract and Feishu sync for affected videos
- Reuse `canonicalKey`; no LLM required for Phase 7 success

**Non-Goals:**

- LLM usefulness ranking / priority colors as the primary detector
- Cross-video “global library gaps”
- Writing accepted gaps back to Feishu
- Auto-enqueue into Today's Review without Accept
- Changing extract quality or Feishu ingest rules

## Architecture

```text
extract / feishu sync
        │
        ▼
 refreshGapsForVideo(videoId)
        │
        ├─ load transcript expressions for video
        ├─ load feishu expressions for video
        ├─ key sets via canonicalKey(phrase)
        └─ upsert pending gaps for transcript rows
           whose key ∉ feishu keys
           (skip ignored keys; clear stale pending)

        ▼
     gaps table
  expression_id → transcript row
  status: pending | accepted | ignored

        ▼
     /gaps UI
  list pending → Accept | Ignore
```

## Decisions

### D1. Gap definition = transcript not in Feishu (per video)

A gap exists when:

1. Expression `E` has `source_type = transcript` and `video_id = V`
2. No expression on `V` with `source_type = feishu` shares `canonicalKey(E.phrase)`
3. Gap status is not `ignored` for that expression (see D4)

**Rationale:** Matches PRD (“useful expressions user missed”) and `docs/database.md` (“discovered from transcript but not collected in notes”). Feishu is the keep-list source of truth; transcript extract is the candidate pool.

**Alternative considered:** Feishu-not-in-transcript (notes ahead of extract). Useful for extract QA, but not Phase 7 “blind spots” — defer.

### D2. Deterministic detector; retire LLM stub as primary path

Replace `detectGaps(knownPhrases, newText)` as the product path with `refreshGapsForVideo(videoId)` (and batch helpers). Keep or delete the prompt file in implementation; do not call LLM for core detection in v1.

**Rationale:** After Phase 6, both sides are structured rows — set difference is cheaper, testable, and aligned with `canonicalKey` already used in extract/Feishu upsert.

**Alternative considered:** LLM filter on top of set difference for “usefulness.” Deferred; can layer later without changing the `gaps` schema.

### D3. Schema: `gaps` as planned, plus uniqueness

```text
gaps
├── id uuid PK
├── expression_id uuid FK → expressions (transcript row), UNIQUE
├── reason text          -- e.g. "in_transcript_not_in_feishu"
├── status text          -- pending | accepted | ignored
└── created_at timestamptz
```

- Unique on `expression_id`: one gap row per transcript expression
- Index `(status, created_at desc)` for Gaps list
- `ON DELETE CASCADE` from expressions so re-extract cleanup removes orphan gaps
- Follow existing app data-access pattern (server service role); add RLS if sibling tables for expressions gain user-scoped policies later — v1 mirrors Phase 4/5 service-role access

**Optional column (if needed in impl):** `video_id` denormalized for query convenience — prefer join via `expressions.video_id` unless list query proves painful.

### D4. Refresh semantics (pending / ignored / accepted)

On `refreshGapsForVideo(V)`:

1. Compute candidate transcript expression IDs (keys not in Feishu set).
2. For each candidate:
   - If no gap row → insert `pending` with reason `in_transcript_not_in_feishu`
   - If gap row `ignored` → **leave ignored** (do not reopen)
   - If gap row `accepted` → leave accepted
   - If gap row `pending` → keep (idempotent)
3. For existing `pending` rows whose expression is no longer a candidate (Feishu catch-up, or transcript row deleted):
   - Delete the pending gap (or mark resolved — prefer **delete** pending when closed by Feishu match)

**Accept:** set `status = accepted`. Transcript expression remains; user has confirmed it as a keep-worthy blind spot. v1 does **not** invent a feishu row or write to Feishu.

**Ignore:** set `status = ignored`. Future refreshes skip recreating pending for that `expression_id`.

### D5. Triggers

| Event | Action |
|-------|--------|
| Transcript extraction completes for `video_id` | `refreshGapsForVideo(videoId)` |
| Feishu sync upserts expressions for a video | `refreshGapsForVideo(videoId)` for each touched video |
| Gaps page “Refresh” (optional lightweight control) | refresh all videos that have both sources, or videos with transcript rows |

Silent Home Feishu sync already runs in background — piggyback gap refresh there for touched videos so Gaps stays fresh without a new Home UI.

### D6. Gaps UI

- Replace stub empty state with pending list when `count > 0`
- Card shows phrase, meaning (from expression), video title/creator (join), short reason
- Actions: Accept / Ignore (optimistic or await API)
- Drop LLM-era `priority` / `evidence` as required fields; optional later
- Visual language: follow existing Collections / Settings density at 430×932 — avoid inventing a new dashboard look; reuse page header pattern

### D7. What Accept does *not* do in v1

Accept does not:

- Create a `source_type = feishu` duplicate
- Bump weight
- Auto-insert into `review_queue` beyond whatever eligibility the transcript expression already has

If product later wants “Accept → ensure in review,” that is a small follow-up using existing review eligibility rules.

## Risks / Trade-offs

- **[Noise from weak extracts]** → Mitigation: Ignore is first-class; extract quality stays a separate track; do not LLM-filter in v1.
- **[canonicalKey false negatives/positives]** → Mitigation: same key as Feishu upsert/extract merge; document known normalization rules; fix key function globally if gaps look wrong.
- **[Videos with only one source]** → Mitigation: no gaps until both transcript and Feishu sides exist for that video (or transcript-only with empty Feishu set = all transcript phrases are gaps — **accept this**: empty Feishu set means nothing collected, so all extracts are blind spots). Clarify in UX copy when Feishu side is empty.
- **[Re-extract deletes transcript rows]** → Mitigation: `ON DELETE CASCADE` on `expression_id`; refresh after extract rebuilds pending from the new batch.
- **[Ignored forever]** → Mitigation: acceptable for v1; optional “show ignored” later.

## Migration Plan

1. Add migration `*_phase7_gaps.sql` creating `gaps` + indexes + FK cascade.
2. Deploy code: db layer → service → hook extract/sync → Gaps UI.
3. One-time backfill: `refreshGapsForAllEligibleVideos()` after migrate (script or first Gaps page load).
4. Rollback: drop `gaps` table; Gaps page returns to empty stub; extract/sync hooks no-op.

## Open Questions

1. Should Accept also set `topic_locked` or move the expression under a Topic? → **Default no** for v1.
2. Should Gaps list group by video? → Prefer grouped by video for scanability; flat list OK for MVP if faster.
3. Empty-Feishu video: surface all transcript phrases as gaps, or require at least one Feishu row on that video before detecting? → **Default: detect even when Feishu set is empty** (true blind-spot signal); copy can explain “nothing collected for this video yet.”
