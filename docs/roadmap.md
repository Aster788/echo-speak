# Echo Roadmap

## Phase 1 — Foundation

- Next.js
- Supabase
- Database

**Success:** Store transcript. 数据库具备存储能力（非用户导入流程）

---

## Phase 2 — Import System

- Transcript upload
- Cleaner
- Transcript storage

**Success:** Import YouTube transcript.

---

## Phase 3 — Expression Extraction

- AI extraction
- Topic classification
- Expression library

**Success:** Expression database created.

---

## Phase 4 — Active Recall

- Review page (Video + Topic mode selector)
- Tarot-style flip review cards
- Self evaluation (`mastered` / `again` / `unsure`)
- `example_en` + `example_zh` for bilingual recall

**Success:** User can review expressions by video or topic with physical-card UX.

---

## Pre-Phase 5 — Hardening

Bridge work before SRS. Not numbered as Phase 4.x; tracked as `pre-phase-5-hardening`.

- **Collections** — `/collections` with Topic | Video | All views (replaces `/topics` + `/library`); vintage scrapbook UI; Move sheet; no dock/merge
- **Home + Settings** — Hello hero; framed Settings with Auth + `user_settings` (server-only keys stay in `.env`)
- **Review polish** — Finish page, hierarchical Back, sticky-note/divider/report tweaks
- **`example_zh` quality** — alignment improvements + backfill
- **Extraction depth** — cap calibration from per-video delete counts
- **Supabase cloud + deploy** — Mac import and phone Review share one database

**Success:** Data and primary surfaces are trustworthy across devices; user can curate and review without placeholders — ready for scheduling.

**Gate:** Phase 5 starts only after P0 + P1 workstreams above merge to `main`.

---

## Phase 5 — Spaced Repetition

- Review queue
- Scheduling
- Due reviews

**Success:** Expressions reappear automatically.

---

## Phase 6 — Feishu Sync

- Feishu API
- Incremental sync

**Success:** One-click sync.

---

## Phase 7 — Gap Detection

- Compare transcript and notes
- Missing expression discovery

**Success:** Find blind spots.
