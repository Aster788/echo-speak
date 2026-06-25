# Local → cloud data migration (optional)

Use when you already have videos/expressions on **local** Supabase and want them on **cloud** (`ejgybfiywdbnfzckjqao`).

## Prerequisites

- Local stack running: `supabase start`
- Cloud schema applied (`supabase/migrations/` — already on cloud as of Pre-Phase 5)
- `pg_dump` / `psql` (bundled with Supabase CLI or Postgres.app)

## Option A — data-only dump (recommended)

```bash
# Export public data from local (no schema)
supabase db dump --local --data-only -f /tmp/echo-speak-data.sql

# Import into cloud (get DB URL from Supabase Dashboard → Settings → Database)
psql "$SUPABASE_DB_URL" -f /tmp/echo-speak-data.sql
```

`SUPABASE_DB_URL` is the **direct** Postgres connection string (not the API URL). Use session mode pooler if IPv4-only.

## Option B — selective tables

```bash
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --data-only \
  --table=public.videos \
  --table=public.transcripts \
  --table=public.expressions \
  --table=public.review_history \
  -f /tmp/echo-speak-core.sql

psql "$SUPABASE_DB_URL" -f /tmp/echo-speak-core.sql
```

`topics` and `expression_dismissals` are included if you modified them locally; cloud already has system topic seeds.

## After import

1. Vercel env points at cloud (`NEXT_PUBLIC_SUPABASE_URL`, keys).
2. Smoke test `/review` and `/topics` on production URL.
3. Keep local DB for experiments; do not reset cloud.

## Rollback

Cloud has no automatic undo. Take a logical backup before import:

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" -f /tmp/echo-speak-cloud-backup.sql
```
