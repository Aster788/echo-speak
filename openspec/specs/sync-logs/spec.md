# sync-logs

## Purpose

Persist Feishu synchronization run history and the incremental sync cursor (Phase 6).

## Requirements

### Requirement: sync_logs table schema

The system SHALL persist Feishu synchronization runs in a `sync_logs` table with columns: `id` (uuid PK), `user_id` (uuid FK → auth.users, not null), `sync_type` (text: `full` or `incremental`), `status` (text: `success` or `failed`), `synced_at` (timestamptz, not null), and `details` (jsonb, nullable).

#### Scenario: Successful sync log row

- **WHEN** a sync completes successfully after parsing multiple H3 sections
- **THEN** the system inserts a row with `status = success` and `details` containing `docsProcessed`, `videoSectionsProcessed`, `expressionsUpserted`, `tablesParsed`, and `sentencesExtracted`

#### Scenario: Failed sync log row

- **WHEN** a sync fails
- **THEN** the system inserts a row with `status = failed` and `details.error` describing the failure

### Requirement: Log every sync attempt

The system SHALL create exactly one `sync_logs` row per sync invocation, whether or not any expressions were ingested.

#### Scenario: Empty incremental run

- **WHEN** incremental sync finds no documents updated since the cursor
- **THEN** the system still writes a `success` log with `details.docsProcessed = 0`

### Requirement: Query last successful sync

The system SHALL provide a data-access function to return the most recent `sync_logs` row with `status = success` for a given `user_id`.

#### Scenario: Home last-sync label

- **WHEN** Home page loads for an authenticated user with a prior successful sync
- **THEN** the UI can display a human-readable last-sync time from `synced_at`

#### Scenario: No prior sync

- **WHEN** user has no successful sync logs
- **THEN** the query returns null and UI shows `Not synced yet`

### Requirement: Row Level Security on sync_logs

The system SHALL enable RLS on `sync_logs` so authenticated users can read only their own rows; service_role may insert and select all rows for server actions.

#### Scenario: User isolation

- **WHEN** user A queries sync logs
- **THEN** rows belonging to user B are not returned

### Requirement: user_settings last sync cursor column

The system SHALL add nullable `last_feishu_sync_at` (timestamptz) to `user_settings` for incremental cursor storage.

#### Scenario: Column migration

- **WHEN** Phase 6 migration runs
- **THEN** `user_settings.last_feishu_sync_at` exists and defaults to null for existing users
