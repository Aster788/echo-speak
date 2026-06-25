# Next Task

Objective:

Start **Pre-Phase 5 Hardening** implementation — first PR: **Review UI polish** (`feat/review-ui-polish`).

Scope (this PR):

- Review finish page: `You have completed.`, congrats illustration, `choose another mode` link
- Hierarchical Back: reviewing → scope picker; complete → scope picker; scope picker → mode selector
- Lighter scope sticky notes; darker card footer divider; Again `+1` uses card text color
- Report dialog: 标点有误 replaces 其他; darker success toast
- Updated `broken-heart.png` asset

Definition of Done:

- Manual test on `/review` at 430×932: Back paths and finish page match `openspec/changes/pre-phase-5-hardening/specs/review-ui-polish/spec.md`
- `npm run build` passes

Then (Pre-Phase 5 queue):

1. `chore/supabase-cloud` — cloud project, migrations, Vercel deploy, phone + Mac smoke test
2. `feat/example-zh-quality` — stats, user sample audit, parser/backfill
3. `feat/extraction-depth-tuning` — scheme-2 calibration table → cap/toggle
4. `feat/collections-page` — Topic | Video | All, Move sheet, redirects
5. `feat/home-page-redesign` + `feat/settings-auth`

Do Not Build Yet:

- **Phase 5 SRS** (`review_queue`, due dates) — blocked until Pre-Phase 5 gate (P0 + P1 on `main`)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Reference:

- OpenSpec: `openspec/changes/pre-phase-5-hardening/` (proposal, design, specs, tasks)
- Review ratings (Phase 4): `src/db/review-history.ts`
- SRS helper (Phase 5): `src/lib/srs.ts`
