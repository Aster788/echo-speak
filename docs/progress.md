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

## In Progress

- **Pre-Phase 5 Hardening** — planning complete; implementation not started on `main`

Workstreams (see `openspec/changes/pre-phase-5-hardening/tasks.md`):

| Priority | Workstream | Status |
|----------|------------|--------|
| P0 | Review UI polish (finish page, Back stack, small fixes) | pending |
| P0 | Supabase cloud + deploy (Mac + phone shared DB) | pending |
| P0 | `example_zh` quality (alignment + backfill) | pending |
| P1 | Extraction depth tuning | pending |
| P1 | Collections page (Topic / Video / All; replaces Library + Topics) | pending |
| P2 | Home page redesign | pending |
| P2 | Settings + Auth (`user_settings`) | pending |

## Current Focus

Ship Pre-Phase 5 workstreams before starting Phase 5 SRS. First implementation PR: **Review UI polish** or **Supabase cloud** (see `docs/next-task.md`).

## Next Milestone

Pre-Phase 5 gate: cloud DB live, `example_zh` improved, extraction cap calibrated, Collections + core polish on `main` — then Phase 5 spaced repetition.

## Not Started

- Phase 5: Spaced Repetition (blocked until Pre-Phase 5 gate)
