# settings-page

## Purpose

Vintage-framed Settings at `/settings` with authenticated per-user API configuration stored server-side. **Server-only secrets never appear in the Settings UI.**

## ADDED Requirements

### Requirement: Settings visual layout

The system SHALL show page description:

```text
Sign in to save your own keys. The site provides the shared database.
```

Logged-in users see grouped hints above each field block:

- **LLM block:** `Use your own API keys. AI features won't work if left empty.`
- **Feishu block:** `Use your own Feishu app credentials. Feishu sync won't work if left empty.`

Deployment-only secrets (Supabase service role, public Supabase URL/anon key) are configured in `.env.local` / hosting env — never in Settings.

Each **user-editable** field SHALL use a decorative label frame (reference: settings-page-ref.png) and an `input.jpeg` input frame for the value. Long values SHALL scroll horizontally inside the input frame. Password-type fields SHALL mask characters with a reveal toggle. Empty fields SHALL show placeholder `请输入` in muted gray after the label colon (`gap-[1ch]`).

**Settings UI fields (in order):** `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `FEISHU_APP_ID`, `FEISHU_APP_SECRET`.

**NOT in Settings UI (site-provided):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**MUST NOT appear in Settings UI:** `SUPABASE_SERVICE_ROLE_KEY` and any other server-only credential. Those SHALL be documented only in `.env.local.example` and hosting env configuration.

#### Scenario: Decorative frames

- **WHEN** user opens Settings
- **THEN** each user-editable key appears in a decorative container with input.jpeg value frame
- **AND** `SUPABASE_SERVICE_ROLE_KEY` is not listed on the page

#### Scenario: Focus input

- **WHEN** user taps after the colon in a field
- **THEN** the system focuses the input and shows a text cursor

#### Scenario: Server-only env documented offline

- **WHEN** developer reads `.env.local.example`
- **THEN** `SUPABASE_SERVICE_ROLE_KEY` is documented with a note that it is never shown in Settings

### Requirement: Authenticated user settings storage

The system SHALL require Supabase Auth login before saving Settings. User-provided values for the **user-editable fields** SHALL persist in a server-side `user_settings` table keyed by `user_id`.

The application server SHALL read `SUPABASE_SERVICE_ROLE_KEY` exclusively from `process.env` (`.env.local` / Vercel), never from `user_settings` or client input.

**Per-user keys (LLM, Feishu):** when authenticated, the server SHALL use only values saved in `user_settings` for that user — no deployment env fallback. Empty fields mean the feature is unavailable for that user.

**Site infrastructure (Supabase URL/anon):** deployment env vars apply; not user-editable in Settings.

#### Scenario: Save settings after login

- **WHEN** authenticated user edits LLM_API_KEY and saves
- **THEN** the value persists in `user_settings` and subsequent server LLM calls use the stored value for that user

#### Scenario: Authenticated user with empty LLM key

- **WHEN** authenticated user has no LLM_API_KEY saved
- **THEN** AI features do not use the site owner's deployment LLM keys

#### Scenario: Unauthenticated access

- **WHEN** unauthenticated user opens Settings
- **THEN** the system prompts login before enabling save (read-only labels MAY show)

#### Scenario: Service role never in client

- **WHEN** Settings page or any client API loads
- **THEN** `SUPABASE_SERVICE_ROLE_KEY` is never returned in responses and never rendered in the DOM

### Requirement: Multi-user product note

Documentation SHALL state that shared deployments require each user to authenticate; user-editable settings bind to account. English-learning prompts remain default; arbitrary target language is future work.

#### Scenario: Docs updated

- **WHEN** Settings ships
- **THEN** `docs/decisions.md` includes ADR for auth + user_settings vs env vars and the server-only split
