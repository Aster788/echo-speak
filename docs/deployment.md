# Deployment (Supabase Cloud + Vercel)

Mac + phone share one **cloud** Postgres via deployed Next.js. Local Supabase CLI remains for development only.

## Projects

| Environment | Supabase | Next.js |
|-------------|----------|---------|
| **Production** | [echo-speak](https://supabase.com/dashboard/project/ejgybfiywdbnfzckjqao) (`ejgybfiywdbnfzckjqao`, `ap-northeast-1`) | [echo-speak on Vercel](https://vercel.com/aster788s-projects/echo-speak) → **https://echo-speak-gray.vercel.app** |
| **Local dev** | `supabase start` → `http://127.0.0.1:54321` | `npm run dev` |

GitHub repo: `Aster788/echo-speak`

## 1. Link Supabase CLI (optional, for `db push` / diffs)

```bash
supabase login
supabase link --project-ref ejgybfiywdbnfzckjqao
supabase db push   # when local migrations change
```

Cloud migrations are also tracked in the Supabase dashboard (MCP / dashboard apply). Repo source of truth: `supabase/migrations/`.

## 2. Environment variables

Copy `.env.local.example` → `.env.local` for local dev.

**Production / Vercel** — set in [Vercel → echo-speak → Settings → Environment Variables](https://vercel.com/aster788s-projects/echo-speak/settings/environment-variables):

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ejgybfiywdbnfzckjqao.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` `secret` (**server-only**, never in Settings UI) |
| `LLM_API_KEY` | Your DeepSeek (or other) API key |
| `LLM_BASE_URL` | e.g. `https://api.deepseek.com` |
| `LLM_MODEL` | e.g. `deepseek-chat` |
| `FEISHU_APP_ID` / `FEISHU_APP_SECRET` | Optional |

Sync from a machine that has keys in `.env.local` + cloud service role:

```bash
export SUPABASE_SERVICE_ROLE_KEY='<from Supabase Dashboard → Settings → API → service_role secret>'
./scripts/sync-vercel-env.sh
npx vercel --prod
```

Until `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel, `/review` and `/topics` return 500 at runtime (build succeeds).

**Validate before sync** (catches local demo key pasted by mistake):

```bash
# After pasting cloud service_role into .env.local or export:
./scripts/validate-cloud-supabase-env.sh
./scripts/sync-vercel-env.sh
npx vercel --prod
```

Cloud `service_role` JWT payload must include `"ref": "ejgybfiywdbnfzckjqao"`. Local `supabase start` keys use `"iss": "supabase-demo"` and will not work with the cloud URL.

## 3. Deploy

**CLI (first time or manual):**

```bash
npx vercel link          # project: echo-speak, team: aster788s-projects
./scripts/sync-vercel-env.sh
npx vercel --prod
```

**Git (recommended after connect):** push to `main` → Vercel auto-deploy.

Connect repo in Vercel if needed: Settings → Git → `Aster788/echo-speak`.

## 4. Smoke test (Mac + phone)

1. Open production URL on Mac: `/import` → paste a short bilingual transcript → extract.
2. Open `/review` → Video or Topic mode → confirm cards load.
3. Repeat on phone (same URL); confirm imported expressions appear.
4. Rate one card → check `review_history` in Supabase Table Editor.

## 5. Local vs cloud (when to use which)

See ADR in `docs/decisions.md` (2026-06-25).

**Rule of thumb:** `supabase start` + local `.env.local` for schema work and fast iteration; cloud + Vercel for real data and phone use. Never `supabase db reset` against production.

## 6. Copy local data to cloud (optional)

See `docs/cloud-data.md`.
