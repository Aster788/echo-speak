# Progress

永远只记录：当前开发结构。

## Completed

- Project structure
- Documentation
- Phase 1 database schema (`videos`, `transcripts` migration)
- Phase 1 local verification (`supabase db reset`, seed data confirmed)
- Phase 2 transcript import flow (UI, CLI, cleaner, parser)
- Phase 3 expression extraction (`topics`, `expressions`, pipeline, API, CLI)
- Phase 3.5 topic curation UI (`/topics`, dismissals, topic dock, merge, `topic_locked`)
- Phase 4 design spec (`docs/design-system.md` Review Page / Review Card)
- Phase 4 Active Recall (`/review`, flip cards, Video/Topic modes, `review_history`, bilingual examples)
- Phase 4 release (`phase-4` tag on `main`)
- **Pre-Phase 5 Hardening** (archived `openspec/changes/archive/2026-06-29-pre-phase-5-hardening`): Review polish, cloud deploy, `example_zh`, extraction depth, Collections, Home, Settings + Auth
- Tags: `pre-phase-5-collections`, `pre-phase-5-settings-and-auth`
- **Pre-Phase 5 library cleanup** (2026-06-30): cloud data prep, `review_queue` schema, extraction quality loop
- **Phase 5 — Spaced Repetition** (`phase-5` tag): Today's Review, memory engine, daily budget, Unsure session reinsert
- **Phase 6 — Feishu Sync** (in progress on `feat/phase-6-feishu-sync`): structure parse, dual ingest, silent Home sync, `videos.creator`, `feishu_section`

## In Progress

- Phase 6: apply migration to cloud; smoke sync with real Feishu credentials

## Current Focus

Merge Phase 6 PR, tag `phase-6`, verify Home status line + background sync at 430×932.

## Next Milestone

Phase 7: Gap Detection

## Not Started

- Phase 7: Gap Detection
