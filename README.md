# Echo Speak

Personal English learning app: import video transcripts, extract expressions, detect knowledge gaps, and review with spaced repetition.

## Setup

```bash
npm install
cp .env.local.example .env.local  # or edit .env.local directly
```

Fill in `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, and Supabase credentials.

Example (DeepSeek):

```bash
LLM_API_KEY=your-deepseek-key
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
```

### Supabase

```bash
supabase init   # if not already linked
supabase start
supabase db reset
```

## Development

```bash
npm run dev      # http://localhost:3000
npm test         # vitest
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npx tsx scripts/import-transcript.ts` | Import a transcript file |
| `npx tsx scripts/sync-feishu.ts` | Sync Feishu notes |
| `npx tsx scripts/reprocess-expressions.ts` | Re-extract expressions |
| `npx tsx scripts/seed-dev-data.ts` | Seed dev data |

## Project structure

See `docs/architecture.md` and `docs/next-task.md` for current status.
