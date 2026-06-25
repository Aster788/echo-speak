# Next Task

Objective:

Finish **Supabase cloud deploy** on `chore/supabase-cloud`, then start **example_zh quality** (`feat/example-zh-quality`).

Scope (finish cloud PR):

- [ ] Set Vercel env: `SUPABASE_SERVICE_ROLE_KEY` (cloud) + run `./scripts/sync-vercel-env.sh`
- [ ] `npx vercel --prod` — smoke test `/import` + `/review` on Mac and phone
- [ ] Optional: copy local data → cloud (`docs/cloud-data.md`)

Definition of Done:

- Production URL reads/writes cloud DB; ADR + `docs/deployment.md` on `main`

Then (Pre-Phase 5 queue):

1. `feat/example-zh-quality` — stats, user sample audit, parser/backfill
2. `feat/extraction-depth-tuning` — scheme-2 calibration table → cap/toggle
3. `feat/collections-page` — Topic | Video | All, Move sheet, redirects
4. `feat/home-page-redesign` + `feat/settings-auth`

Do Not Build Yet:

- **Phase 5 SRS** (`review_queue`, due dates) — blocked until Pre-Phase 5 gate (P0 + P1 on `main`)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)

Reference:

- Deploy: `docs/deployment.md`, `scripts/sync-vercel-env.sh`
- Cloud project: `ejgybfiywdbnfzckjqao`
- Vercel: https://vercel.com/aster788s-projects/echo-speak
