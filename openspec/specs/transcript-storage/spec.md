# transcript-storage

## Purpose

Persist video metadata and transcript content in Supabase for Echo Speak Phase 1 (Foundation).

## Requirements

### Requirement: Video metadata storage

The system SHALL persist video metadata in a `videos` table with columns: `id` (uuid), `title` (text), `youtube_url` (text, optional), `source` (text: `youtube` or `manual`), and `created_at` (timestamptz).

#### Scenario: Create video record

- **WHEN** a video is inserted with a title and optional youtube_url
- **THEN** the system stores the record and returns a uuid `id`

#### Scenario: Source defaults to manual

- **WHEN** a video is inserted without an explicit source
- **THEN** the system sets `source` to `manual`

### Requirement: Transcript content storage

The system SHALL persist transcript content in a `transcripts` table linked to a video via `video_id` (uuid FK → videos.id), with `raw_text` (text), `cleaned_text` (text, nullable), and `created_at` (timestamptz). After Phase 2 import, `cleaned_text` SHALL be populated by the import pipeline for user-imported transcripts.

#### Scenario: Store raw transcript

- **WHEN** a transcript is inserted with `video_id` and `raw_text`
- **THEN** the system stores the record and `cleaned_text` may be null

#### Scenario: Transcript requires valid video

- **WHEN** a transcript is inserted with a `video_id` that does not exist
- **THEN** the system rejects the insert (FK constraint violation)

#### Scenario: Import stores cleaned text

- **WHEN** a user completes transcript import via UI or CLI
- **THEN** the system stores both `raw_text` and non-null `cleaned_text` on the new transcript record

### Requirement: Local schema migration

The system SHALL provide a Supabase migration that creates `videos` and `transcripts` tables and applies successfully via `supabase db reset` in local development.

#### Scenario: Migration runs cleanly

- **WHEN** a developer runs `supabase db reset` with Supabase CLI
- **THEN** both tables exist with expected columns and constraints

### Requirement: Row Level Security

The system SHALL enable RLS on `videos` and `transcripts` with policies allowing authenticated users to read and write rows.

#### Scenario: RLS enabled

- **WHEN** the migration is applied
- **THEN** RLS is enabled on both tables and at least one policy exists per table for authenticated access
