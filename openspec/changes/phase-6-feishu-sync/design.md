## Context

- **`videos` today**: `id`, `title`, `youtube_url`, `source`, `created_at`. **Video title** is on `videos.title`. **Creator is not stored yet** — and for transcript imports there is no H1 to derive it from.
- **Feishu note shape**: H1 = creator (`Leah's Diary` + optional channel link), H3 = video title + `watch?v=` URL, `【闲逛】` = Section.
- **Creator rule**: Creator is **derived only from Feishu H1** at sync time (`# 🌟 Leah's Diary` → `Leah's Diary`). No LLM, no oEmbed, no expression-level copy.

## Goals / Non-Goals

**Goals:**

- Normalize metadata: **creator + video title on `videos`**; **Section on `expressions.feishu_section` only**
- Silent Home auto-sync (>6h) + light status line for psychological confirmation
- Sentence-first ingest; table subsumption; static Section → Topic mapping (default unmapped)

**Non-Goals:**

- `feishu_creator` / `video_title` columns on expressions
- LLM topic classification during sync; auto-guess Section → Topic

## Data model (normalized)

```text
videos                          expressions
├── title          ← H3         ├── video_id      → FK
├── youtube_url    ← H3         ├── source_type   transcript | feishu
├── creator   ← H1 (NEW)   ├── feishu_section nullable (feishu only)
└── source                     ├── topic_id      nullable; set when Section maps to leaf Topic
                               └── phrase, meaning, examples…
```

**Transcript today**: `video_id` → `videos.title` ✅; creator ❌ (no H1 in import flow).

**Feishu sync**: parse H1 → `creator`; parse H3 → `title` + `youtube_url`. Write both onto `videos` once per sync so the app can join later without re-parsing the doc. Expressions store only `feishu_section` + `source_type=feishu`.

## Decisions

### D1–D3. Credentials, token, API spike

Unchanged.

### D4. Document parser

H1 → `creatorName` for following H3s. H3 → `videoTitle`, `youtubeUrl`. `【…】` → Section label on subsequent bullets (stored on `feishu_section`, not written to `topic_id` directly).

### D5. Video resolve + creator from H1

For each H3 section under current H1:

1. **Derive creator** from H1 heading text (strip emoji/markdown link; e.g. `# 🌟 [Leah's Diary](…)` → `Leah's Diary`).
2. Resolve `video_id` via `youtube_url` match or create (`source = feishu`).
3. Set `videos.title` from H3; set `videos.creator` from derived H1 creator.
4. On URL match with existing transcript video: backfill `creator` only if null.

Creator is never stored on `expressions` — only the parse result written to `videos.creator` for stable joins.

### D6. Ingest order and pipelines

1. Sentences (LLM) → persist with `feishu_section`; resolve `topic_id` via static map when matched.
2. Tables (rules) → subsumption filter → persist same metadata.

### D7. Section vs Topic (static mapping, default null)

| Field | Table | Phase 6 |
|-------|-------|---------|
| Video title | `videos.title` | From H3 |
| Creator | `videos.creator` | From H1 |
| Section | `expressions.feishu_section` | Verbatim Feishu label |
| Topic | `expressions.topic_id` | Set when Section maps to a **leaf** Topic; else null |

**Mapping rules** (`src/lib/feishu-section-topic-map.ts`):

1. Always persist `feishu_section` (raw note structure).
2. Resolve `topic_id` at ingest using static rules — **no LLM**.
3. Default match: section label equals a topic **slug** or **name** (case-insensitive), including topics that still have children. Example: `【Shopping】` → Shopping even if Shopping has subtopics; `Social Media` → slug `social-media`.
4. Optional slug overrides in `FEISHU_SECTION_TOPIC_SLUG_OVERRIDES` when label differs from slug/name.
5. Unmapped sections → `topic_id = null` (never Uncategorized).
6. Re-sync: update `topic_id` from map unless `topic_locked = true` (respect manual Move).
7. Sync content source: Docx **blocks** API → Markdown (keeps heading links + tables); do not use `raw_content` for ingest.

### D8. Schema migration

```sql
alter table videos add column creator text;

alter table expressions
  add column feishu_section text;

alter table expressions alter column topic_id drop not null;
-- transcript rows: application continues to require topic_id on insert

alter table videos drop constraint if exists videos_source_check;
alter table videos add constraint videos_source_check
  check (source in ('youtube', 'manual', 'feishu'));
```

No `feishu_creator` on expressions.

### D9. Upsert, weight, incremental

Unchanged from prior design (per-video feishu upsert, weight bump, doc-level cursor).

### D10. Silent auto-sync + Home status line

**Auto-sync** (unchanged logic):

- Home load → if credentials + stale >6h → background incremental sync (non-blocking).

**Status line** (new — user-facing confirmation, not a control):

- Placement: directly **below** "Start today's review" CTA.
- Copy examples:
  - `Feishu ✓ Synced 2 hours ago`
  - `Feishu · Not synced yet` (credentials ok, never synced)
  - `Feishu · Add credentials in Settings` (missing credentials)
  - Omit line or show last successful time only — **no spinner, no toast, no button**
- While background sync runs: keep showing **last successful** sync time (stale label ok); do not show in-progress state.
- Data source: `sync_logs` last success `synced_at`, or `last_feishu_sync_at`.

### D11. Manual sync

Settings only: **Sync now** with optional result message.

## Risks / Trade-offs

- **[Risk] `creator` null on old transcript videos** — Until Feishu sync backfills or import adds it → Mitigation: nullable; UI joins show title only.
- **[Trade-off] oEmbed doesn't provide channel** — Transcript import won't set `creator` in Phase 6 → Feishu path is primary source for vlog learners.

## Migration Plan

1. Add `videos.creator`, `expressions.feishu_section`, `sync_logs`, cursor column.
2. Deploy; Feishu sync backfills `creator` on matched videos.

## Open Questions

- Feishu doc list API filter (spike).
- Whether to show status line when logged out (default: hide).
