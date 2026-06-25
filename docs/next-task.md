# Next Task

Objective:

Start **example_zh quality** (`feat/example-zh-quality`) — Pre-Phase 5 P0.

Scope (this PR):

- SQL stats: null % by video
- User sample audit table (6 videos × 3–5 cards)
- Improve `alignExampleZhFromRawText`
- Backfill null rows; document before/after in `docs/decisions.md`
- Tests + spot-check 5 Review cards

Definition of Done:

- Measurable drop in `example_zh` null rate; sample audit documented
- `npm run build` and relevant tests pass

Then (Pre-Phase 5 queue):

1. `feat/extraction-depth-tuning` — scheme-2 calibration table → cap/toggle
2. `feat/collections-page` — Topic | Video | All, Move sheet, redirects
3. `feat/home-page-redesign` + `feat/settings-auth`

Do Not Build Yet:

- **Phase 5 SRS** (`review_queue`, due dates) — blocked until Pre-Phase 5 gate (P0 + P1 on `main`)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Reference:

- OpenSpec: `openspec/changes/pre-phase-5-hardening/tasks.md` §3
- Cloud deploy: `docs/deployment.md` (production https://echo-speak-gray.vercel.app)
