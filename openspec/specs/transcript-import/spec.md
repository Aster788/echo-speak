# transcript-import

## Purpose

Import YouTube or manual transcripts via UI and CLI; clean and persist linked video + transcript records (Phase 2).

## Requirements

### Requirement: Accept transcript input formats

The system SHALL accept transcript content via pasted text, `.txt` file upload, or `.srt` file upload on the import page and CLI.

#### Scenario: Paste plain text

- **WHEN** user pastes transcript text and submits with a video title
- **THEN** the system uses the pasted string as `raw_text`

#### Scenario: Upload TXT file

- **WHEN** user uploads a `.txt` file
- **THEN** the system reads file contents as UTF-8 and uses it as `raw_text`

#### Scenario: Upload SRT file

- **WHEN** user uploads a `.srt` file
- **THEN** the system strips timing/sequence markup and extracts spoken text as `raw_text`

### Requirement: Clean transcript before storage

The system SHALL run the transcript cleaner on `raw_text` and produce `cleaned_text` before persisting.

#### Scenario: Successful cleaning

- **WHEN** import is submitted with valid raw text and OpenAI is configured
- **THEN** the system stores non-empty `cleaned_text` derived from the cleaner output

#### Scenario: Fallback cleaner without OpenAI

- **WHEN** OpenAI is not configured and sync fallback is used
- **THEN** the system still produces `cleaned_text` via the sync cleaner and stores both fields

### Requirement: Persist video and transcript on import

The system SHALL create a `videos` record and a linked `transcripts` record containing both `raw_text` and `cleaned_text`.

#### Scenario: Import with YouTube URL

- **WHEN** user provides title, transcript content, and optional `youtube_url`
- **THEN** the system creates a video with `source` set to `youtube` and a transcript linked by `video_id`

#### Scenario: Import without URL

- **WHEN** user provides title and transcript content without URL
- **THEN** the system creates a video with `source` set to `manual` and stores the transcript

### Requirement: CLI import command

The system SHALL provide `scripts/import-transcript.ts` that imports a transcript file using the same pipeline as the web UI.

#### Scenario: CLI imports file

- **WHEN** developer runs `npx tsx scripts/import-transcript.ts <file> --title "..."`
- **THEN** the system creates video and transcript records and prints their IDs

### Requirement: Import feedback

The system SHALL show success or error feedback after an import attempt on the import page.

#### Scenario: Successful web import

- **WHEN** import completes successfully
- **THEN** the user sees a confirmation that the transcript was saved

#### Scenario: Failed web import

- **WHEN** import fails (validation, parse, API, or database error)
- **THEN** the user sees an error message without losing their input
