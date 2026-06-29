## 0. Design assets pipeline

- [x] 0.1 Add `scripts/process-collections-assets.ts` (or extend review script): transparent JPEG/PNG → `public/collections/`, `public/home/`, `public/review/`
- [x] 0.2 Process: congrats, Hello, input, title, arrow, target, Rectangle, paper, bin, move, back, down-arrow
- [ ] 0.3 Re-tint review sticky-note lighter (`#E0DBC8`); re-process broken-heart
- [x] 0.4 Run `npm run audit:filenames`
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

- [x] 4.1 User fills scheme-2 table (6 videos: extracted/deleted/kept) — auto via `extraction-depth-stats.ts`
- [x] 4.2 ADR: cap formula or Standard/Deep toggle
- [x] 4.3 Update prompt + pipeline + tests
- [x] 4.4 User validates 2 sample videos — 3-video re-extract (internship, 29 easy, Getting Married)

## 5. P1 — Collections (`feat/collections-page`)

- [x] 5.1 Route `/collections`; redirects from `/topics`, `/library`
- [x] 5.2 Navbar: Collections only (drop Library)
- [x] 5.3 View tabs Topic | Video | All (`title.jpeg`); default Topic
- [x] 5.4 Page description copy update
- [x] 5.5 Topic L1: tree, Add topic, bin/move, a→z sort; arrow expand/collapse + rotate; target on leaves
- [x] 5.6 Topic L1: reparent API; remove `is_system` blocks for move/delete on seed topics
- [x] 5.6 Topic L2: Rectangle cards, back, bin/move
- [x] 5.7 Video L1 + L2 (mirror Topic pattern); video title header
- [x] 5.8 All view: flat cards + count header + back → Topic L1
- [x] 5.9 Move sheet modal (paper.jpeg); fireworks on success
- [x] 5.10 Remove TopicDock, merge UI, drag/swipe dismiss
- [x] 5.11 API: topic reparent on topic move; expression move unchanged semantics + topic_locked
- [x] 5.12 Regression: dismiss, move expression, add topic, delete empty topic
- [x] 5.13 Update delta specs archive on merge

## 6. P2 — Home (`feat/home-page-redesign`)

- [x] 6.1 Layout per spec: tagline → divider → buttons → Hello illustration
- [x] 6.2 Link CTAs to /import and /review
- [x] 6.3 430×932 visual check vs echo-speak-homepage-ref.png

## 7. P2 — Settings + Auth (`feat/settings-auth`)

- [x] 7.1 Migration: `user_settings` (user_id FK, RLS; secrets plaintext at rest — encryption deferred)
- [x] 7.2 Supabase Auth: email magic link (`@supabase/ssr`, 5 min OTP)
- [x] 7.3 Settings UI: decorative frames + input.jpeg for **user-editable fields only** (LLM + Feishu; exclude SERVICE_ROLE and public Supabase)
- [x] 7.4 Document SERVICE_ROLE in `.env.local.example` only; server reads from `process.env`
- [x] 7.5 Load/save via API routes + `user_settings`; per-user LLM/Feishu only (no env fallback when authenticated); Supabase URL/anon site-provided
- [x] 7.6 Wire LLM client to read user settings when authenticated
- [x] 7.7 Login gate before save

## 8. Docs & archive

- [x] 8.1 Update `docs/design-system.md` Collections / Home / Settings / Review finish sections
- [x] 8.2 Update `docs/progress.md` when workstreams complete
- [ ] 8.3 `openspec archive pre-phase-5-hardening` after all PRs merge

## Phase 5 gate

Do **not** start `phase-5-spaced-repetition` until sections **2, 3, 4, 5** are on `main` (Review polish 1 strongly recommended before cloud QA).
