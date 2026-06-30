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
| review_queue | **implemented** (schema only; scheduling deferred to Phase 5) | `20260629230000_review_queue.sql` |
| review_history | **implemented** (Phase 4) | `20250621160000_phase4_active_recall.sql` |
| gaps | planned (Phase 7) | — |
| sync_logs | planned (Phase 6) | — |
| user_settings | **implemented** (Pre-Phase 5 P2) | `20250626180000_user_settings.sql` |

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

**`example_zh` 填充策略：**

Always LLM：对 `example_en` 调用 DeepSeek 单句翻译（见 `docs/decisions.md` 2026-06-26）。`raw_text` 保留双语供参考；对齐逻辑仅在 `example-zh-alignment.ts`（审计脚本用）。

提取 pipeline 写入时填充；`scripts/backfill-example-zh.ts --force` 可重译历史行。

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

**Status: implemented (schema only; scheduling deferred to Phase 5)**

Expressions waiting for review. Scheduling (enqueue / `due_at` computation) is deferred to Phase 5 Spaced Repetition.

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

# user_settings

**Status: implemented (Pre-Phase 5 P2)**

Per-user API configuration. Requires Supabase Auth; RLS + grants restrict rows to `auth.uid()`.

| Column | Type | Notes |
|----------|----------|----------|
| user_id | uuid | PK, FK → `auth.users` |
| llm_api_key | text | user's own; required for AI when authenticated |
| llm_base_url | text | user's own |
| llm_model | text | user's own |
| supabase_url | text | legacy column; not shown in Settings UI |
| supabase_anon_key | text | legacy column; not shown in Settings UI |
| feishu_app_id | text | user's own |
| feishu_app_secret | text | user's own |
| created_at | timestamptz | |
| updated_at | timestamptz | |

`SUPABASE_SERVICE_ROLE_KEY` is **not** stored here — server reads it from `process.env` only. Public Supabase URL/anon key are **site-provided** via deployment env, not user-editable in Settings.

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