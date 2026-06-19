# Database Schema

Schema lives in:

supabase/migrations/

永远只记录：最终表结构。

## Implementation status

| Table | Status | Migration |
|-------|--------|-----------|
| videos | **implemented** (Phase 1) | `20250619120000_phase1_videos_transcripts.sql` |
| transcripts | **implemented** (Phase 1) | `20250619120000_phase1_videos_transcripts.sql` |
| expressions | planned (Phase 3) | — |
| review_queue | planned (Phase 5) | — |
| review_history | planned (Phase 4–5) | — |
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

| youtube_url | text | optional |

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

| raw_text | text | original transcript |

| cleaned_text | text | cleaned transcript |

| created_at | timestamptz | |

---

# expressions

**Status: planned (Phase 3)**

Core learning unit.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| video_id | uuid | FK → videos |

| phrase | text | English expression |

| meaning | text | Chinese explanation |

| example | text | Source sentence |

| topic | text | food / shopping / workout |

| source_type | text | transcript / feishu |

| weight | numeric | importance score |

| created_at | timestamptz | |

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

**Status: planned (Phase 4–5)**

Review records.

| Column | Type | Notes |

|----------|----------|----------|

| id | uuid | PK |

| expression_id | uuid | FK → expressions |

| rating | text | mastered / review_again / forgotten |

| reviewed_at | timestamptz | |

| next_review_at | timestamptz | |

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

expressions

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