# Database Schema

Schema lives in:

supabase/migrations/

永远只记录：最终表结构。

## Implementation status

| Table | Status | Migration |
|-------|--------|-----------|
| videos | **implemented** (Phase 1) | `20250619120000_phase1_videos_transcripts.sql` |
| transcripts | **implemented** (Phase 1) | `20250619120000_phase1_videos_transcripts.sql` |
| topics | **implemented** (Phase 3) | `20250620120000_phase3_topics_expressions.sql` |
| expressions | **implemented** (Phase 3–4) | `20250620120000_phase3_topics_expressions.sql`, `20250621160000_phase4_active_recall.sql` |
| expression_dismissals | **implemented** (Phase 3.5) | `20250620180000_phase35_topic_curation.sql` |
| review_queue | planned (Phase 5) | — |
| review_history | **implemented** (Phase 4) | `20250621160000_phase4_active_recall.sql` |
| gaps | planned (Phase 7) | — |
| sync_logs | planned (Phase 6) | — |

---

# videos

**Status: implemented (Phase 1)**

Stores imported videos.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| title | text | |

| youtube_url | text | optional; unique when set (import dedup) |

| source | text | youtube / manual |

| created_at | timestamptz | |

---

# transcripts

**Status: implemented (Phase 1)**

Stores transcript content.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| video_id | uuid | FK → videos |

| raw_text | text | 用户粘贴的**双语**原文（英+中）；import 时完整保留，供 `example_zh` 对齐 |

| cleaned_text | text | 英文-only（cleaner 去掉中文行）；expression 提取用 |

| content_hash | text | SHA-256 of normalized raw text; unique when set (import dedup) |

| created_at | timestamptz | |

---

# topics

**Status: implemented (Phase 3)**

Hierarchical topic taxonomy for multi-dimensional review.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| name | text | display name |

| slug | text | unique, URL-safe key |

| parent_id | uuid | FK → topics, null for roots |

| is_system | boolean | true for seed topics |

| merged_into_id | uuid | FK → topics, audit trail after merge (Phase 3.5) |

| created_at | timestamptz | |

Seed tree defined in `src/lib/topic-seeds.ts`.

---

# expressions

**Status: implemented (Phase 3–4)**

Core learning unit.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| video_id | uuid | FK → videos |

| phrase | text | English expression |

| meaning | text | Chinese explanation（Review 正面第一行） |

| example_en | text | Source sentence in English（Review 背面第二行；原 `example` 列重命名） |

| example_zh | text | nullable; Chinese sentence for review front |

| topic_id | uuid | FK → topics (leaf or leaf-root) |

| topic_locked | boolean | true when user manually moved topic (Phase 3.5) |

| source_type | text | transcript / feishu |

| weight | numeric | importance score |

| created_at | timestamptz | |

**`example_zh` 填充策略（按优先级）：**

1. 从 `transcripts.raw_text` 解析英/中块（交替块），按 `example_en` 子串对齐，取对应中文块
2. 对齐失败 → DeepSeek 单句翻译（见 `docs/decisions.md`）

提取 pipeline 写入时尽量同时填充；`scripts/backfill-example-zh.ts` 可补全历史行。

---

# expression_dismissals

**Status: implemented (Phase 3.5)**

Records phrases the user permanently removed so re-extraction does not re-insert them.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| video_id | uuid | FK → videos |

| phrase_key | text | normalized phrase (lowercase, collapsed whitespace) |

| dismissed_at | timestamptz | |

Unique on `(video_id, phrase_key)`.

---

# review_queue

**Status: planned (Phase 5)**

Expressions waiting for review.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| expression_id | uuid | FK → expressions |

| due_at | timestamptz | next review date |

| source | text | video / topic / gap |

| created_at | timestamptz | |

---

# review_history

**Status: implemented (Phase 4)**

Active Recall self-ratings; SRS scheduling deferred to Phase 5.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| expression_id | uuid | FK → expressions |

| rating | text | `mastered` / `again` / `unsure` |

| reviewed_at | timestamptz | |

| mode | text | `video` / `topic` |

| scope_id | uuid | video_id or topic_id for the session |

---

# gaps

**Status: planned (Phase 7)**

Expressions discovered from transcript but not collected in notes.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| expression_id | uuid | FK → expressions |

| reason | text | why flagged |

| status | text | pending / accepted / ignored |

| created_at | timestamptz | |

---

# sync_logs

**Status: planned (Phase 6)**

Feishu synchronization records.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| sync_type | text | full / incremental |

| status | text | success / failed |

| synced_at | timestamptz | |

| details | jsonb | optional |

---

# Relationships

videos

↓

transcripts

↓

expressions ──→ topics (hierarchical)

↓

review_queue

↓

review_history

---

videos

↓

expressions

↓

gaps

---

# Review Rating System

Only three states exist.

mastered

→ user can recall easily

review_again

→ user partially remembers

forgotten

→ user cannot recall

No numeric rating system.

No 1~5 scoring.

No pronunciation score.

---

# RLS

Enable RLS on all tables.

Single-user v1:

authenticated user only.