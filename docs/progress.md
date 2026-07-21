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
- **Phase 6 — Feishu Sync** (`phase-6` tag; archived `openspec/changes/archive/2026-07-19-phase-6-feishu-sync`): structure parse, dual ingest, silent Home sync, Settings Sync all (chunked), `videos.creator`, `feishu_section`, nullable table examples
- **Phase 7 — Gap Detection** (`phase-7` tag; archived `openspec/changes/archive/2026-07-19-phase7-gap-detection`): `gaps` table, deterministic per-video refresh, Gaps UI grouped A–Z, Accept/Ignore
- **Phase 7.1a — Gap feedback loop** (PR #23; archived `openspec/changes/archive/2026-07-19-extend-phase7-gap-feedback-loop`): Ignore → dismiss/`gap_ignore`; Accept → weight + `topic_locked`
- **Phase 7.1b — Feedback → extract precision** (PR #24; archived `openspec/changes/archive/2026-07-21-extend-phase7b-gap-feedback-loop`): full-history runtime preference context, bounded Topic-aware prompt examples, pre-rank canonical hard filter, precision-first rank prompt, per-run diagnostics

## In Progress

- (none)

## Current Focus

Observe real-world Gaps/Collections triage reduction after Phase 7.1b ships; tune the 12+12 sample cap only from evidence.

## Next Milestone

Measure post-7.1b import quality and triage load over subsequent Feishu syncs and Re-extracts.

## Not Started

- (none)
