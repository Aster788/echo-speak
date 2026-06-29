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
- Supabase cloud + Vercel deploy (`docs/deployment.md`, production https://echo-speak-gray.vercel.app) — PR merged
- Pre-Phase 5 `example_zh` + sync clean default (`example-zh-quality`)
- Pre-Phase 5 extraction depth tuning (`feat/extraction-depth-tuning`)
- Pre-Phase 5 Collections page (`feat/collections-page`)
- Pre-Phase 5 Home page redesign (`feat/home-page-redesign`)
- Pre-Phase 5 Settings + Auth (`feat/settings-auth`: magic link, `user_settings`, per-user LLM/Feishu)

## In Progress

- **Pre-Phase 5 Hardening** — ship `feat/settings-auth` PR; then archive openspec change

Workstreams (see `openspec/changes/pre-phase-5-hardening/tasks.md`):

| Priority | Workstream | Status |
|----------|------------|--------|
| P0 | Review UI polish | **done** |
| P0 | Supabase cloud + deploy | **done** |
| P0 | `example_zh` quality | **done** |
| P1 | Extraction depth tuning | **done** |
| P1 | Collections page | **done** |
| P2 | Home page redesign | **done** |
| P2 | Settings + Auth | **done** (branch `feat/settings-auth`, PR pending) |

## Current Focus

**Settings + Auth PR** — commit, push `feat/settings-auth`, merge to `main`, tag if milestone. See `docs/next-task.md`.

## Next Milestone

Pre-Phase 5 gate complete → `openspec archive pre-phase-5-hardening` → Phase 5 spaced repetition.

## Not Started

- Phase 5: Spaced Repetition (blocked until Pre-Phase 5 gate PRs on `main`)
