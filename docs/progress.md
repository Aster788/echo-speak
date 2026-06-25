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
- Pre-Phase 5 planning (`openspec/changes/pre-phase-5-hardening`: proposal, design, specs, tasks)
- Pre-Phase 5 Review UI polish (finish page, Back stack, card/report fixes) — PR #5 on `main`
- Supabase cloud schema (all migrations on `ejgybfiywdbnfzckjqao`); Vercel project `echo-speak` linked

## In Progress

- **Pre-Phase 5 Hardening** — cloud deploy env + smoke test; then example_zh, extraction, Collections

Workstreams (see `openspec/changes/pre-phase-5-hardening/tasks.md`):

| Priority | Workstream | Status |
|----------|------------|--------|
| P0 | Review UI polish | **done** (merged) |
| P0 | Supabase cloud + deploy | in progress (schema on cloud; Vercel env + smoke test) |
| P0 | `example_zh` quality | pending |
| P1 | Extraction depth tuning | pending |
| P1 | Collections page | pending |
| P2 | Home page redesign | pending |
| P2 | Settings + Auth | pending |

## Current Focus

Finish Vercel production env (`SUPABASE_SERVICE_ROLE_KEY`) + deploy smoke test; then **example_zh quality** (`feat/example-zh-quality`). See `docs/next-task.md`.

## Next Milestone

Pre-Phase 5 gate: cloud DB live, `example_zh` improved, extraction cap calibrated, Collections + core polish on `main` — then Phase 5 spaced repetition.

## Not Started

- Phase 5: Spaced Repetition (blocked until Pre-Phase 5 gate)
