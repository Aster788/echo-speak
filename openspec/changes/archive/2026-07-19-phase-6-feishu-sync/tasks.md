## 1. Spike & fixture

- [x] 1.1 Spike Feishu Doc API: confirm Markdown/plain export path; document in ADR
- [x] 1.2 Add `tests/fixtures/feishu-learning-english-from-vlog.md`
- [x] 1.3 Unit tests: `parseFeishuDoc` — H1/H3/Section/tables/bullets

## 2. Schema & migrations

- [x] 2.1 Migration: `sync_logs` + RLS; `user_settings.last_feishu_sync_at`
- [x] 2.2 Migration: `videos.creator`; `videos.source` includes `feishu`
- [x] 2.3 Migration: `expressions.feishu_section` only (no creator on expressions); `topic_id` nullable for feishu
- [x] 2.4 Update `docs/database.md`

## 3. Parsers

- [x] 3.1 `src/lib/feishu-doc-parser.ts`
- [x] 3.2 `src/lib/feishu-table-parser.ts` + `src/lib/feishu-vocab-filter.ts`
- [x] 3.3 Unit tests: parser + subsumption

## 4. Feishu API & data layer

- [x] 4.1 `src/lib/feishu-client.ts`
- [x] 4.2 `resolveVideoForFeishuSection` — match/create video; set `title`, `creator` from H3/H1
- [x] 4.3 `src/db/sync-logs.ts`; stale check (6h); sync debounce

## 5. Expression ingest

- [x] 5.1 `prompts/feishu-extract-sentences.md`
- [x] 5.2 `src/services/feishu-expression-ingest.ts` — `feishu_section` + static Section→Topic map; `topic_locked` respected on re-sync
- [x] 5.3 `src/lib/feishu-section-topic-map.ts` + unit tests (slug/name match, null default, lock on re-sync)

## 6. Sync orchestration

- [x] 6.1 `syncFeishuNotes`; `POST /api/feishu/sync`; CLI
- [x] 6.2 Settings: manual **Sync now** (optional)

## 7. Home: silent sync + status line

- [x] 7.1 Background incremental sync when stale >6h (non-blocking)
- [x] 7.2 Below review CTA: `Feishu ✓ Synced 2 hours ago` / `Not synced yet` / `Add credentials in Settings`
- [x] 7.3 No button, spinner, or toast; in-progress shows last success time
- [x] 7.4 Manual test at 430×932

## 8. Integration & docs

- [x] 8.1 Collections: feishu expressions under video; creator via `videos.creator` join
- [x] 8.2 Transcript video matched by URL gets `creator` backfill from Feishu
- [x] 8.3 Phase 6 ADR: normalized video metadata, Section on expression only, Home status line
- [x] 8.4 Update `docs/progress.md`, `docs/next-task.md`; `npm run build` passes
