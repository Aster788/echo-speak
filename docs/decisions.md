# Architecture Decision Records

## # Decision Log

---

2026-06-19

Decision:

No speech recognition.

Reason:

Speaking assessment is unnecessary.

User can self-evaluate.

---

2026-06-19

Decision:

Active Recall is the core feature.

Reason:

The goal is speaking recall, not expression collection.

---

2026-06-19

Decision:

Feishu is source of truth.

Reason:

Notes are maintained there.

---

2026-06-19

Decision:

Transcript is imported once.

Reason:

Transcript rarely changes.

---

2026-06-21

Decision:

Phase 4 review ratings use `mastered` | `again` | `unsure` (design-system is source of truth).

Reason:

Consistent API, UI, and SRS prep; replaces informal `review_again` / `forgotten` naming.

---

2026-06-21

Decision:

Rename `expressions.example` → `example_en`; add `example_zh` for review card front.

Reason:

Imports use bilingual transcripts; front card needs Chinese sentence aligned to English example.

**Fill order:** align `example_zh` from `transcripts.raw_text` first; DeepSeek single-sentence translation on alignment failure (approved fallback).

---

2026-06-21

Decision:

Import `raw_text` is always bilingual paste (English + Chinese blocks); `cleaned_text` remains English-only for extraction.

Reason:

User workflow always pastes paired EN/ZH subtitles. Chinese is stripped only in `cleaned_text`, not in `raw_text`, so `example_zh` can be aligned without re-importing.

**Alignment model:** split `raw_text` into alternating EN/ZH blocks (multi-line blocks OK); map `example_en` to the paired ZH block. Messy ASR lines (`>>`, `[music]`) may fail → DeepSeek fallback.

---

2026-06-25

Decision:

**Local Supabase CLI for development; Supabase Cloud + Vercel for production** (Mac + phone).

Context:

Single-user app; phone needs the same DB as Mac. Local `supabase start` is fast for migrations and `db reset`; production must not share that database.

Decision:

| Use case | Supabase | Next.js |
|----------|----------|---------|
| Dev on Mac | `supabase start` + `.env.local` → `127.0.0.1:54321` | `npm run dev` |
| Mac + phone daily use | Cloud project `echo-speak` (`ejgybfiywdbnfzckjqao`) | Vercel `echo-speak` |

Consequences:

- Migrations live in `supabase/migrations/`; apply to cloud via `supabase db push` or dashboard.
- `SUPABASE_SERVICE_ROLE_KEY` only on server (`.env.local` / Vercel); never Settings UI.
- Optional data copy: `docs/cloud-data.md`.
- Smoke test: import + review on production URL from Mac and phone.

---

2026-06-21

Decision:

Use DeepSeek API for `example_zh` when transcript alignment fails.

Reason:

Per-sentence cost is negligible at personal scale (~$0.0001 per expression). Cheaper than blocking review UX. Prefer alignment from `raw_text` to avoid unnecessary API calls.