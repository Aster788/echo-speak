## MODIFIED Requirements

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
