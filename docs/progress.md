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
- **Pre-Phase 5 library cleanup — cloud data prep** (2026-06-30): migrations applied (`user_id`, `examples`, `review_queue`, `dismissal_reasons`); merge backfill no-op (0 within-video dups); 27-video calibration refresh (median delete rate 16.7%, constants unchanged); `example_zh` 100% non-null

## In Progress

- **Pre-Phase 5 library cleanup** (`openspec/changes/pre-phase-5-library-cleanup`): code complete; cloud DB ready. Pending: Vercel deploy + browser smoke tests (dismiss reason, merged All view, re-extract).
- **Phase 5 — Spaced Repetition** (`feat/phase-5-spaced-repetition`)

## Current Focus

Deploy pre-phase-5-library-cleanup to Vercel, run smoke tests at 430×932, then merge/tag. `review_queue` schema is in place for Phase 5 SRS scheduling. See `docs/roadmap.md` Phase 5 and `docs/next-task.md`.

## Next Milestone

Phase 5 success: expressions reappear automatically per SRS schedule.

## Not Started

- Phase 6: Feishu Sync
- Phase 7: Gap Detection
