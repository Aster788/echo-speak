## Context

Phase 4 shipped Active Recall on `main` (`phase-4` tag). The app is a **single-user**, English-learning tool: import → extract → curate → review. Data today lives on **local Supabase CLI** when developing on Mac; `/library` is an unused stub; `/topics` holds all curation but only exposes a **per-topic** list; phone use requires a **hosted** app + database.

Stakeholder usage (confirmed):

1. **Mac + Chrome:** import, extract, delete/curation (majority of editorial work)
2. **Phone + Safari/Chrome:** Review cards (majority); occasional paste import + delete (minority)

---

## Goals / Non-Goals

**Goals:**

- Replace Library + Topics with one **Collections** page (All / Video / Topic), sorted a→z
- Improve `example_zh` with measurable before/after and lightweight user audit input
- Tune extraction caps from user's per-video delete counts (scheme 2)
- Enable Mac + phone against **one cloud Supabase** via deployed Next.js
- Shared design pass for Home + Collections; ship Home in a small PR separate from Collections

**Non-Goals:**

- Multi-user auth, RLS per user, "others use my product" tenancy
- Full-app i18n / arbitrary target language (English ↔ Chinese recall remains the product)
- CET4/CET6 labeling, ML on dismiss reasons
- Phase 5 SRS schema/UI
- Bulk destructive re-curation solely for analytics (scheme 1 mass dismiss)

---

## Library 去留

### Decision

**Remove `/library` as a product surface.** Implement **Option A**: evolve Topics into **Collections** with three views. Do not build a separate flat library page.

### Rationale

| Alternative | Why not |
|-------------|---------|
| Keep Library + Topics | Duplicate mental model; Library was only a stub; Topics already owns expression rows |
| Library as read-only tab | Extra nav slot on mobile; Collections All view is the same data |
| Only Topic view | User cannot browse by video or see full corpus without clicking every topic |

### Collections UX

**Nav label:** `Collections` (replaces `Topics` and `Library`).

**Route:** `/collections`  
**Redirects:** `/topics` → `/collections`; `/library` → `/collections` (301 or Next.js redirect).

**View switcher** (tabs or segmented control, mobile-first):

```
[ Topic ] [ Video ] [ All ]
```

- **Default tab on first visit:** **Topic** (preserves familiar tree/curation workflow)
- **Tab order (left → right):** Topic → Video → All

#### All view

- Flat list of all expressions (join `videos` for source title optional in row subtitle)
- **Sort:** `phrase` ascending (case-insensitive, locale `en`)
- Row actions: same as today (`ExpressionRow`: dismiss, move, unlock, drag-to-dock where applicable)
- Empty: only when `expressions` count = 0

#### Video view

- **Groups:** one section per video that has ≥1 expression
- **Sort groups:** `videos.title` a→z
- **Sort within group:** `phrase` a→z
- Section header = video title; tap to collapse optional (v1: expanded ok)
- Curation actions unchanged per row

#### Topic view

- **Groups:** topic tree + expression list (successor to current `TopicsManager` Topic mode)
- **Sort topics:** `name` a→z at each tree level (siblings only; parent/child hierarchy preserved, not flattened alphabetically across levels)
- **Sort within topic:** `phrase` a→z
- Preserve: rename, merge, child create, dock, drag-to-trash, `topic_locked`

### Sorting implementation notes

- DB: `order by lower(phrase)` / `lower(title)` / `lower(name)` in `src/db/expressions.ts` and video/topic list helpers
- Do not sort by `created_at` or extraction order in these views (explicit product rule: **a→z**)
- Tie-break: `id` uuid for stable order

### API / data layer

| View | Query strategy |
|------|----------------|
| All | `listExpressions` + order by phrase (new or extend existing) |
| Video | `listExpressions` grouped by `video_id`, or per-video fetch; videos ordered by title |
| Topic | Existing `listExpressionsByTopicId` / subtree queries + ordered topics from `listTopics` |

No new tables required for v1.

### Migration / nav

1. Add `/collections` page and components (may refactor `TopicsManager` → `CollectionsManager`)
2. Update `Navbar` links array: remove `library`, rename `topics` → `collections`
3. Add redirects in `next.config` or route handlers
4. Update `PageHeader` copy: Collections description TBD in design pass (not "Curate topic tree" only—mention All/Video)

---

## 云端双端

### Decision

**Cloud Supabase + deployed Next.js is P0**, not optional, for the user's real workflow. Local CLI remains for development only.

### Architecture

```
┌─────────────┐     ┌─────────────┐
│ Mac Chrome  │     │ Phone Safari│
│ (import)    │     │ (review)    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
        ┌────────────────┐
        │ Vercel (or host)│  Next.js App Router
        │ echo-speak      │
        └────────┬───────┘
                 │ service role / server actions
                 ▼
        ┌────────────────┐
        │ Supabase Cloud  │  Postgres + migrations
        └────────────────┘

Dev-only (Mac):
  localhost:3000 → 127.0.0.1:54321 (CLI) — optional; not used by phone
```

### Environment model

| Environment | `NEXT_PUBLIC_SUPABASE_URL` | Used by |
|-------------|---------------------------|---------|
| Local dev | `http://127.0.0.1:54321` | `npm run dev` on Mac |
| Production / preview | `https://<project>.supabase.co` | Deployed URL; **phone + Mac browser** |

Use **separate** Supabase projects or at minimum separate DBs for local vs prod to avoid `db reset` wiping production.

### Deployment checklist

1. Create Supabase cloud project (same org)
2. `supabase link` + `supabase db push` (or run migrations in dashboard)
3. Set Vercel env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_API_KEY`, etc.
4. Deploy; verify `/review` and `/import` on phone against cloud data
5. Document in `docs/decisions.md` ADR: when to use local CLI vs cloud

### What this does **not** provide

- **Multi-user:** App still uses admin client server-side; no login. Anyone with the URL shares one database. "Others use my product" requires future Auth + RLS (out of scope).
- **Offline phone:** Review requires network.
- **Language swap:** Cloud does not change English-centric prompts or zh/en card layout.

### Phone import caveat

Paste import on phone works if deploy is live and UI is mobile-tested (`Import` notebook layout). Same cloud DB ensures expressions appear in Review on phone after Mac import.

---

## 校准数据格式

Two calibration streams: **`example_zh` quality** (sample audit) and **extraction depth** (per-video counts). Different formats, different purposes.

### A. `example_zh` sample audit (P0)

**Purpose:** Classify failure modes for alignment/LLM fixes—not to count every row.

**User delivers** one table per calibration batch (start with 6 imported videos):

```markdown
| video_title | cards_sampled | null | misaligned | bad_translation | ok | notes |
|-------------|---------------|------|------------|-----------------|-----|-------|
| Internship advice | 5 | 1 | 1 | 0 | 3 | misaligned: phrase "meet the team" paired wrong zh |
```

**Sampling rule:** Per video, open Review or Collections All view, pick **3–5 expressions** that have `example_zh` (or note if null). Mark each sampled row **one** category:

| Code | Meaning |
|------|---------|
| `null` | `example_zh` empty |
| `misaligned` | Chinese does not match the English example sentence |
| `bad_translation` | Pairing plausible but Chinese unnatural/wrong |
| `ok` | Acceptable for review |

**Optional:** Up to 2 **concrete bad examples** per video in free text:

```
video: Internship advice
phrase: meet the team
example_en: Set up chats to meet your manager...
example_zh: (current) ...
expected_zh: (user) ...
```

**Agent delivers** SQL summary:

```sql
-- example: null rate by video
select v.title, count(*) filter (where e.example_zh is null) as nulls, count(*) as total
from expressions e join videos v on v.id = e.video_id
group by v.title;
```

**Success metric:** Document before/after null % and sample audit improvement after parser/backfill.

---

### B. Extraction depth calibration (P1) — Scheme 2 (primary)

**Purpose:** Set per-chunk cap or Standard/Deep toggle from **keep rate**, not from dismiss table analytics.

**User delivers** after stable curation pass (or from memory of recent sessions):

```markdown
| video_title | extracted | deleted | kept | clean_text_chars | notes |
|-------------|-----------|---------|------|------------------|-------|
| Internship advice | 20 | 3 | 17 | 8420 | trivial phrasing |
| ... | | | | | |
```

- **extracted:** count after last extract (before deletes)
- **deleted:** dismiss count user would remove as noise
- **kept:** extracted − deleted
- **clean_text_chars:** optional; from DB `transcripts.clean_text` length for elastic formula

**Minimum:** 5 videos (user has 6—use all 6).

**Agent derives:**

```
keep_rate = kept / extracted
median_keep_rate, median_deleted
→ propose cap: e.g. if median delete ≈ 3 per 20, target extract = kept + buffer
```

Document chosen formula in `docs/decisions.md` before coding.

---

### C. Extraction scheme 1 (deferred)

**Bulk dismiss + `expression_dismissals` analytics** is **not** the primary path because:

- `expression_dismissals` stores only `video_id`, `phrase_key`, `dismissed_at`—no topic, reason, or difficulty at dismiss time
- Mass delete destroys live rows needed for Topic/Video context
- CET4/CET6 not in schema

**Future (if needed):** extend dismissals with optional `reason` enum + `topic_id` snapshot on dismiss; then sample analytics on **new** dismissals only.

---

## Decisions (summary)

| Topic | Choice |
|-------|--------|
| Library | Remove; Collections All/Video/Topic |
| Sorting | a→z on phrase / video title / topic name |
| Cloud | P0; single cloud DB for Mac + phone |
| example_zh input | Sample audit table, not full DB scan |
| Extraction input | Scheme 2 per-video counts first |
| Home vs Collections | One design pass; **Home PR** small and separate; **Collections PR** larger |
| Settings storage | Auth + `user_settings`; server-only keys in `.env.local` only |
| Settings UI | User-editable keys only; **no** `SUPABASE_SERVICE_ROLE_KEY` in UI |
| Review Back | One level up; finish Back → scope picker |
| Merge / Dock | **Removed** from Collections |
| Topic L1 Add | **Keep** New topic name + Add |
| Topic icons | arrow = expand/collapse + rotate; target = leaf |
| Topic move/delete | Reparent subtree; seed topics not protected |

### Extraction cap (pending calibration)

Will choose after scheme 2 table:

- **Option A:** UI toggle Standard (20) vs Deep (30–40) per extract
- **Option B:** Elastic `min(30, max(10, chunkChars / 500))`

Decision recorded in ADR when calibration lands.

---

## Risks / Trade-offs

- **[Risk] Collections All view performance** with large libraries → Mitigation: server-side sort; paginate if >200 rows (defer until needed)
- **[Risk] Redirect breaks bookmarks** to `/topics` → Mitigation: permanent redirect + short note in changelog
- **[Risk] Cloud cost / LLM keys on deploy** → Mitigation: env only on Vercel; no keys in repo; Settings shows hints not values
- **[Risk] User expects multi-tenant** → Mitigation: document single-user; Settings copy clarifies
- **[Risk] a→z sort ignores "recently added"** → Mitigation: explicit product choice; revisit if user asks for sort toggle later

---

## Migration Plan

1. **Cloud:** Create project → push migrations → deploy → point phone at prod URL
2. **example_zh:** Stats → user sample audit → parser/backfill → re-audit sample
3. **Extraction:** User scheme 2 table → ADR → implement cap → re-extract test video
4. **Collections:** Implement views → nav change → redirects → remove library route
5. **Home / Settings:** Design assets → implement PRs

Rollback: redirects can keep `/topics` working; cloud rollback = revert env to previous project URL (document backup).

---

## Open Questions

- Collections default tab on first visit: **Topic**; tab order left→right: **Topic | Video | All** (decided)
- Paginate All view at v1 or ship full list? (Decide after expression count on cloud import)

---

## Vintage surfaces UX (user spec 2026-06-24)

### Review finish

- Copy: `You have completed.` + link `choose another mode` → mode selector
- Asset: `congrats.jpeg` → transparent → hero below copy
- Keep: Video/Topic Mode Now bar, Back → **scope picker**, Header, Divider

### Home

- Order: Header tagline → Divider → Import transcript → Start review → Hello illustration (`Hello.jpeg` transparent)
- Tagline unchanged

### Settings (Auth + frames)

- Decorative label frames + `input.jpeg` value fields; horizontal scroll for long secrets
- **Settings UI fields only:** `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FEISHU_APP_ID`, `FEISHU_APP_SECRET`
- **`SUPABASE_SERVICE_ROLE_KEY` MUST NOT appear in Settings**—server-only; documented in `.env.local` / Vercel env only
- Login required to save user-editable fields into `user_settings`
- Page line retained plus helper: env vars for deploy; logged-in users override via Settings

### Collections

- Tabs: **Topic | Video | All** in `title.jpeg`; default Topic; active tab floats
- Description: `Build your personal library of natural English expressions.`
- **Topic L1:** tree only + New topic + Add + bin/move per row; drill to L2 cards in `Rectangle.jpeg`
- **arrow.jpeg:** parent with children—tap toggles expand/collapse + **rotate arrow**
- **target.png:** leaf topics only (no children)
- **Topic move:** reparent `parent_id`; **entire subtree moves**; seed topics (Daily/Food/…) **not immutable**—same move/delete rules as user topics
- **Topic L2 / Video L2 / All:** phrase, meaning, example_en, example_zh (omit phrase row if empty)
- **Video L2 header:** italic video title left, back right
- **All header:** `共 N 个 video ｜ M 条 expressions` left, back right → returns to Topic L1
- **Move:** paper modal (`paper.jpeg`, clip, stars)—not inline dropdown
- **Remove:** merge panel, topic dock, drag-to-trash, swipe delete

### Review polish (can ship early)

1. Lighter sticky-note on scope picker (`#E0DBC8` family)
2. Darker card footer divider
3. Again `+1` uses card `textColor`
4. New `broken-heart.png`
5. Report: 标点有误 replaces 其他; darken success toast
