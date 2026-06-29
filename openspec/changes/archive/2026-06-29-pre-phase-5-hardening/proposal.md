## Why

Phase 4 (`phase-4` tag) delivered Active Recall, but several product gaps block a trustworthy Phase 5 (SRS): `/library` is a redundant stub, `example_zh` quality is uneven, extraction volume was deferred, Collections (née Topics) and Settings need design parity with Import/Review, and **Mac + phone usage requires a shared cloud database**. These are preconditions—not Phase 5 itself.

**Why now:** Phase 3.5 curation is live; the user has imported and curated many transcripts. Phase 5 should schedule expressions users actually keep, on data and surfaces that work across devices.

---

## Delivery model

One **umbrella** OpenSpec change (`pre-phase-5-hardening`) for planning; **implement as separate PRs**. Do **not** use `phase-4.1` numbering.

Recommended merge order:

| Priority | Workstream | Branch (suggested) | Est. size |
|----------|------------|--------------------|-----------|
| **P0** | `example_zh` quality | `feat/example-zh-quality` | M |
| **P0** | Supabase cloud + deploy path | `chore/supabase-cloud` | S–M |
| **P1** | Extraction depth tuning | `feat/extraction-depth-tuning` | M |
| **P1** | Collections page (ex-Topics) | `feat/collections-page` | L |
| **P2** | Home page redesign | `feat/home-page-redesign` | S |
| **P2** | Settings + Auth (`user_settings`) | `feat/settings-auth` | L |

**Design pass (shared):** One round in `docs/design/` covers **Home + Collections** visual language before implementation PRs.

Phase 5 (`feat/phase-5-srs`) starts **after P0 + P1** merge to `main`. P2 Home/Settings may parallel Phase 5; **Collections** should land before or early in Phase 5 if SRS surfaces link to expression browsing.

---

## What Changes

### Library → Collections (Option A — **decided**)

**Decision:** Drop standalone `/library`. Rename **Topics** → **Collections** with three views:

| View | Content | Sort (a→z) |
|------|---------|------------|
| **All** | Every expression (flat) | By `phrase` |
| **Video** | Grouped by source video | Videos by `title`; expressions by `phrase` within each video |
| **Topic** | Grouped by topic tree (current Topics behavior, redesigned) | Topics by `name`; expressions by `phrase` within each topic |

- Navbar: **Collections** replaces Topics + Library; remove Library link
- Route: `/collections` (redirect `/topics` and `/library` → `/collections`)
- **Default tab:** Topic; **tab order (L→R):** Topic | Video | All
- Preserve Phase 3.5 curation: dismiss, dock, merge, move, `topic_locked` (Topic view + shared expression row actions)

**Out of scope:** Search, SRS due badges, CET difficulty tags

**Definition of Done:**

- [ ] `/library` removed or redirects to `/collections`
- [ ] `/topics` redirects to `/collections` (default view: Topic or last-used tab)
- [ ] All / Video / Topic tabs render real data; counts match DB
- [ ] All lists sorted a→z per rules above
- [ ] Phase 3.5 curation flows pass manual regression on Topic view
- [ ] `npm run build` passes

---

### P0 — `example_zh` quality (`example-zh-quality`)

**Problem:** Review card front uses `example_zh`. Pipeline aligns from bilingual `raw_text` then LLM fallback; many rows null or misaligned.

**Scope (折中, not full LLM on every row):**

1. Agent runs DB stats (`null` %, per-video breakdown)
2. Improve alignment parser for more transcript shapes
3. Backfill `example_zh IS NULL` via `scripts/backfill-example-zh.ts`
4. User provides **sample audit** per video (see `design.md` §校准数据格式)—not full-table manual review

**Definition of Done:**

- [ ] Before/after alignment metrics in `docs/decisions.md`
- [ ] Backfill idempotent
- [ ] ≥80% non-null `example_zh` **or** documented per-class exceptions
- [ ] ≥1 new alignment unit test
- [ ] Spot-check ≥5 Review cards improved

---

### P0 — Supabase cloud + dual-device (`supabase-cloud`)

**Problem:** Mac localhost + phone Safari cannot share local CLI DB. User scenarios: Mac import/delete; phone Review (primary) and occasional mobile import.

**Scope:** Hosted Supabase project; migrations applied; deployed Next.js (e.g. Vercel); Mac and phone use same `NEXT_PUBLIC_SUPABASE_URL`. Local CLI remains for dev; document when to use which.

**Out of scope:** Multi-user auth, per-user RLS, Feishu sync

**Definition of Done:**

- [ ] ADR in `docs/decisions.md` (local dev vs cloud production)
- [ ] `.env.local.example` + deploy env documented
- [ ] Cloud DB migrated; smoke test read/write from deployed URL
- [ ] Phone can open deployed `/review` against same data Mac imported

---

### P1 — Extraction depth tuning (`extraction-depth-tuning`)

**Problem:** Fixed 20 expressions/chunk; deferred since Phase 3.5.

**Calibration:** **Scheme 2 first**—user supplies per-video `extracted / deleted / kept` for ≥5 videos (template in `design.md`). Scheme 1 (bulk dismiss analytics) deferred unless cap tuning needs root-cause data; see design for enriched-dismissal future work.

**Scope:** Implement cap formula or Standard/Deep toggle per design decision after calibration table.

**Definition of Done:**

- [ ] Calibration table ≥5 videos (user + agent)
- [ ] Cap/toggle implemented; documented in `docs/decisions.md`
- [ ] Test video re-extract within expected range
- [ ] Pipeline tests updated
- [ ] User validates 2 sample videos (recall vs noise)

---

### P1 — Collections page (`collections-page`)

Implements **Library → Collections (Option A)** above. Shares design pass with Home but **separate PR** from home redesign.

**Definition of Done:** See Library → Collections section.

---

### P2 — Home page redesign (`home-page-redesign`)

**Problem:** `/` is minimal two-link shell; user wants branded entry aligned with Import/Review.

**Scope:** Design + implement mobile-first landing; primary CTA Review, secondary Import; consistent with design system. **Implement after or in parallel with Collections design artifacts**, ship in its own PR before or after Collections implementation (design first).

**Definition of Done:**

- [ ] Design reference in `docs/design/`
- [ ] Home matches design system at 430×932
- [ ] Links to Import and Review work
- [ ] `npm run build` passes

---

### P2 — Settings page UI (`settings-page-ui`)

**Scope:** Structured settings (LLM env hints, deploy note, about). **No secrets stored in DB.** Document that app is English-learning-first; other languages are future work.

**Definition of Done:**

- [ ] Design in `docs/design/`
- [ ] `/settings` non-placeholder sections
- [ ] Dev `.env.local` workflow documented
- [ ] `npm run build` passes

---

## Capabilities

### New Capabilities

- `collections-page`: Collections surface with All / Video / Topic views, a→z sorting, curation actions; replaces Library + Topics entry points.
- `settings-page`: Structured settings UI and documented configuration surfaces.
- `example-zh-quality`: Alignment improvements, backfill tooling, quality metrics.
- `extraction-depth`: Configurable or elastic per-chunk caps from user calibration data.

### Modified Capabilities

- `topic-tree-management`: Renamed UX context (Collections / Topic view); requirement deltas for All and Video views; preserve dismissal/merge/dock rules.
- `expression-extraction`: Cap limits and/or extract UI toggle.
- `expression-storage`: List queries for All/Video views; optional `example_zh` quality bar.

### Removed / Deprecated

- Standalone **Library** page and nav item (redirect only).

---

## Impact

| Area | Workstreams |
|------|-------------|
| `src/app/collections/` (new), retire `/library`, redirect `/topics` | P1 Collections |
| `src/components/Navbar.tsx`, routes | Collections |
| `src/services/example-zh.ts`, backfill script | P0 example_zh |
| Supabase cloud + Vercel env | P0 cloud |
| `prompts/extract-expressions.md`, pipeline | P1 extraction |
| `src/app/page.tsx` | P2 Home |
| `src/app/settings/` | P2 Settings |
| `docs/design/`, `docs/decisions.md` | All |

Phase 5 (`review_queue`, `src/lib/srs.ts`): **untouched** until P0 + P1 done.

---

## Relationship to Phase 5

**Gate:** Open `phase-5-spaced-repetition` after **P0 (example_zh + cloud) + P1 (extraction depth + Collections)** on `main`.

---

## Artifacts

- [x] `proposal.md`
- [x] `design.md` — includes §Library 去留, §云端双端, §校准数据格式
- [ ] `specs/<capability>/spec.md`
- [ ] `tasks.md`
