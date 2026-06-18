# Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Next.js    │────▶│  src/services/   │────▶│  OpenAI API │
│  App Router │     │  (business logic)│     └─────────────┘
└──────┬──────┘     └────────┬─────────┘
       │                     │
       ▼                     ▼
┌─────────────┐     ┌──────────────────┐
│ components/ │     │  src/db/         │
└─────────────┘     │  (Supabase)      │
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │  Supabase        │
                    │  (Postgres)      │
                    └──────────────────┘
```

## Layers

| Layer | Responsibility |
|-------|----------------|
| `app/` | Routes, page composition |
| `components/` | Presentational UI |
| `services/` | Transcript cleaning, extraction, gaps, reviews |
| `db/` | CRUD and queries |
| `lib/` | Clients (OpenAI, Supabase), SRS, scoring |

## Data flow

1. Transcript imported → `transcript-cleaner` → stored in `transcripts`
2. `expression-extractor` → `expressions` with scores
3. `gap-detector` → gap records linked to expressions
4. `review-generator` + `srs` → `reviews` due today
