## Why

Phase 5 closed the review loop with SRS scheduling, but expression **curation** still depends on transcript extraction alone. Users maintain personal keep-lists in Feishu notes while watching videos; those phrases often never appear in auto-extract output. Phase 6 imports that curated knowledge into Echo Speak. **Feishu remains source of truth** — Echo reads and mirrors, never overwrites notes.

Real note structure (`Learning English from Vlog.md`): H1 = creator, H3 = video (title + YouTube URL), `【…】` = **Section** (note structure, not Echo Topic), tables + bullets.

## What Changes

- **Feishu Open API client** + structure-aware doc parser (H1 / H3 / Section / tables / bullets).
- **Video linking**: H3 → `videos` row via `youtube_url`; **creator on `videos.creator`**, not duplicated on expressions.
- **Expression fields (feishu only)**: `feishu_section` (nullable); `topic_id` from static Section→Topic map when matched, else null; `source_type = feishu`. Video title + creator via `video_id` join.
- **Dual ingest**: sentences first (LLM), then tables (rules) with subsumption filter.
- **Silent auto-sync on Home** (>6h stale) + **light status line** below Today's Review (`Feishu ✓ Synced 2 hours ago`).
- **`sync_logs`** + `user_settings.last_feishu_sync_at`.

### In Scope (Phase 6)

- `videos.creator` (nullable) — populated from Feishu H1; backfill on match by `youtube_url`
- `expressions.feishu_section` only — no `feishu_creator` / `video_title` on expressions
- Silent Home auto-sync + subtle sync status (no button / spinner / toast)
- Section stored verbatim; no Section → Topic mapping; no LLM topic guess
- Table subsumption, per-video upsert, weight bump
- Settings manual sync (optional)

### Out of Scope (defer)

- Gap detection (Phase 7), write-back to Feishu, block-level incremental
- AI suggest Topic (Phase 8)
- `creator` on transcript import via YouTube API (optional backfill later)

## Capabilities

### New Capabilities

- `feishu-sync`: Auth, fetch, parse, video resolve, dual ingest, silent auto-sync, Home status line, incremental cursor.
- `sync-logs`: `sync_logs` schema and persistence.

### Modified Capabilities

- `expression-storage`: `feishu_section` only on expressions; nullable `topic_id` for feishu; creator/title via `video_id`.
- `transcript-storage`: `videos.creator` for creator name at video level (derived from Feishu H1).

## Impact

- `supabase/migrations/` — `sync_logs`, `last_feishu_sync_at`, `videos.creator`, `expressions.feishu_section`, nullable `topic_id` for feishu, `videos.source` includes `feishu`
- `src/app/page.tsx` — background sync + light Feishu status under review CTA
- Parser, ingest, sync services (as prior design)
- `docs/database.md`, `docs/decisions.md`
