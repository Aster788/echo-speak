# reextract

## Purpose

Re-run expression extraction for an existing video without re-importing the transcript (pre-Phase 5).

## Requirements

### Requirement: Re-extract API endpoint by video id

The system SHALL provide `POST /api/videos/[id]/reextract` that resolves the video's latest transcript and runs the extraction pipeline on it without re-importing the transcript. The pipeline SHALL apply the current global dismiss blocklist, dynamic topic tree, and canonical-key dedup, and SHALL preserve `topic_locked` expressions.

#### Scenario: Successful re-extract

- **WHEN** client sends `POST /api/videos/{id}/reextract` for a video with a non-empty latest `cleaned_text`
- **THEN** the system replaces that video's unlocked transcript-sourced expressions with a fresh extraction batch and returns `{ ok: true, expressionCount, videoId, transcriptId }`

#### Scenario: Video not found

- **WHEN** client sends `POST /api/videos/{id}/reextract` for a non-existent video id
- **THEN** the system responds with HTTP 404

#### Scenario: No transcript

- **WHEN** the video exists but has no transcript with non-empty `cleaned_text`
- **THEN** the system responds with HTTP 404 and a clear message

#### Scenario: Locked expressions preserved

- **WHEN** re-extract runs on a video where some expressions have `topic_locked = true`
- **THEN** those expressions are not deleted or modified; only unlocked transcript-sourced rows are replaced

#### Scenario: Global blocklist applied on re-extract

- **WHEN** a phrase was dismissed globally by the user and the LLM returns it during re-extract
- **THEN** no row is inserted for that phrase

### Requirement: Re-extract UI entry in Collections Video view

The Collections Video L2 view (the page showing a single video's expressions) SHALL expose a "Re-extract" action that, after confirmation, calls `POST /api/videos/[id]/reextract` and reloads the video's expression list.

#### Scenario: Re-extract button visible

- **WHEN** the user opens a video's expression list in Collections Video view
- **THEN** a "Re-extract" action is visible in the page header

#### Scenario: Confirm before replacing

- **WHEN** the user taps Re-extract
- **THEN** a confirm dialog warns that non-locked expressions will be replaced and asks to continue

#### Scenario: List reloads after success

- **WHEN** re-extract returns success
- **THEN** the video's expression list reloads with the new batch

### Requirement: Re-extract respects depth override

The Re-extract endpoint SHALL accept an optional `depth` body parameter (`standard` | `deep`) passed through to the extraction pipeline.

#### Scenario: Deep re-extract

- **WHEN** client sends `POST /api/videos/{id}/reextract` with body `{ "depth": "deep" }`
- **THEN** the pipeline runs with deep extraction caps
