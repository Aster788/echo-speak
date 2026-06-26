## 0. Design assets pipeline

- [ ] 0.1 Add `scripts/process-collections-assets.ts` (or extend review script): transparent JPEG/PNG → `public/collections/`, `public/home/`, `public/review/`
- [ ] 0.2 Process: congrats, Hello, input, title, arrow, target, Rectangle, paper, bin, move, back, down-arrow
- [ ] 0.3 Re-tint review sticky-note lighter (`#E0DBC8`); re-process broken-heart
- [ ] 0.4 Run `npm run audit:filenames`
- [ ] 0.5 Add `docs/design/phase-4-review/README.md` asset map (sources → public paths)

## 1. P0 — Review UI polish (`feat/review-ui-polish`) — can ship first

- [x] 1.1 Fix Back stack: reviewing → scope picker; complete → scope picker; scope picker → mode selector
- [x] 1.2 Finish page: `You have completed.`, congrats illustration, `choose another mode` link
- [x] 1.3 Sticky note lighter tint on scope picker
- [x] 1.4 Review card footer divider darker
- [x] 1.5 Again +1 color = card textColor
- [x] 1.6 Report dialog: 标点有误 replaces 其他; success toast darker
- [x] 1.7 Manual test Back paths on `/review` at 430×932

## 2. P0 — Supabase cloud (`chore/supabase-cloud`)

- [x] 2.1 Create cloud Supabase project; link repo
- [x] 2.2 Apply all migrations including Phase 4
- [x] 2.3 Deploy Next.js (Vercel); env vars documented
- [x] 2.4 ADR: local CLI vs cloud; phone + Mac smoke test
- [x] 2.5 Optional: export/import guide from local to cloud

## 3. P0 — example_zh quality (`feat/example-zh-quality`)

- [x] 3.1 SQL stats: null % by video (`scripts/example-zh-stats.ts`)
- [x] 3.2 User sample audit table (6 videos × 3–5 cards)
- [x] 3.3 Always LLM `example_zh`; alignment moved to `example-zh-alignment.ts` (audit only)
- [x] 3.4 Default sync clean; `IMPORT_USE_LLM_CLEANER=1` opt-in; backfill + ADR
- [x] 3.5 Tests + A/B clean reports (`docs/ab-clean-extract-*.md`)

## 4. P1 — Extraction depth (`feat/extraction-depth-tuning`)

- [ ] 4.1 User fills scheme-2 table (6 videos: extracted/deleted/kept)
- [ ] 4.2 ADR: cap formula or Standard/Deep toggle
- [ ] 4.3 Update prompt + pipeline + tests
- [ ] 4.4 User validates 2 sample videos

## 5. P1 — Collections (`feat/collections-page`)

- [ ] 5.1 Route `/collections`; redirects from `/topics`, `/library`
- [ ] 5.2 Navbar: Collections only (drop Library)
- [ ] 5.3 View tabs Topic | Video | All (`title.jpeg`); default Topic
- [ ] 5.4 Page description copy update
- [ ] 5.5 Topic L1: tree, Add topic, bin/move, a→z sort; arrow expand/collapse + rotate; target on leaves
- [ ] 5.6 Topic L1: reparent API; remove `is_system` blocks for move/delete on seed topics
- [ ] 5.6 Topic L2: Rectangle cards, back, bin/move
- [ ] 5.7 Video L1 + L2 (mirror Topic pattern); video title header
- [ ] 5.8 All view: flat cards + count header + back → Topic L1
- [ ] 5.9 Move sheet modal (paper.jpeg); fireworks on success
- [ ] 5.10 Remove TopicDock, merge UI, drag/swipe dismiss
- [ ] 5.11 API: topic reparent on topic move; expression move unchanged semantics + topic_locked
- [ ] 5.12 Regression: dismiss, move expression, add topic, delete empty topic
- [ ] 5.13 Update delta specs archive on merge

## 6. P2 — Home (`feat/home-page-redesign`)

- [ ] 6.1 Layout per spec: tagline → divider → buttons → Hello illustration
- [ ] 6.2 Link CTAs to /import and /review
- [ ] 6.3 430×932 visual check vs echo-speak-homepage-ref.png

## 7. P2 — Settings + Auth (`feat/settings-auth`)

- [ ] 7.1 Migration: `user_settings` (user_id FK, encrypted or vault columns for secrets)
- [ ] 7.2 Supabase Auth: email or magic link (decide provider in design)
- [ ] 7.3 Settings UI: decorative frames + input.jpeg for **user-editable fields only** (exclude SERVICE_ROLE)
- [ ] 7.4 Document SERVICE_ROLE in `.env.local.example` only; server reads from `process.env`
- [ ] 7.5 Server actions: load/save user_settings; merge with env fallback
- [ ] 7.6 Wire LLM client to read user settings when authenticated
- [ ] 7.7 Login gate before save

## 8. Docs & archive

- [ ] 8.1 Update `docs/design-system.md` Collections / Home / Settings / Review finish sections
- [ ] 8.2 Update `docs/progress.md` when workstreams complete
- [ ] 8.3 `openspec archive pre-phase-5-hardening` after all PRs merge

## Phase 5 gate

Do **not** start `phase-5-spaced-repetition` until sections **2, 3, 4, 5** are on `main` (Review polish 1 strongly recommended before cloud QA).
