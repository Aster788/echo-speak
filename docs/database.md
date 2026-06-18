# Database Schema

> Schema lives in `supabase/migrations/`. Update this doc when migrations change.

## Tables (planned)

### videos

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| source_url | text | optional |
| created_at | timestamptz | |

### transcripts

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| video_id | uuid | FK → videos |
| raw_text | text | original import |
| cleaned_text | text | after cleaner |
| created_at | timestamptz | |

### expressions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| phrase | text | |
| definition | text | |
| example | text | |
| source_transcript_id | uuid | FK |
| score | numeric | mastery 0–1 |
| created_at | timestamptz | |

### reviews

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| expression_id | uuid | FK |
| due_at | timestamptz | SRS |
| completed_at | timestamptz | nullable |
| rating | int | 1–5 recall quality |

## RLS

Enable RLS on all tables. Single-user v1: policies scoped to authenticated user or service role for scripts.
