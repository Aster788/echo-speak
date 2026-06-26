# Next Task

Objective:

Start **extraction depth tuning** (`feat/extraction-depth-tuning`) — Pre-Phase 5 P1.

Scope (this PR):

- User fills scheme-2 calibration table (6 videos: extracted / deleted / kept)
- ADR: cap formula or Standard/Deep toggle
- Update `prompts/extract-expressions.md` + pipeline + tests
- User validates 2 sample videos

Definition of Done:

- Calibration table ≥5 videos documented
- Cap/toggle implemented; documented in `docs/decisions.md`
- Test video re-extract within expected range

Then (Pre-Phase 5 queue):

1. `feat/collections-page` — Topic | Video | All, Move sheet, redirects
2. `feat/home-page-redesign` + `feat/settings-auth`

Do Not Build Yet:

- **Phase 5 SRS** (`review_queue`, due dates) — blocked until Pre-Phase 5 gate (P0 + P1 on `main`)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Reference:

- OpenSpec: `openspec/changes/pre-phase-5-hardening/tasks.md` §4
- A/B clean reports: `docs/ab-clean-extract-*.md`
