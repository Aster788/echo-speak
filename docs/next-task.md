# Next Task

Objective:

**Ship Settings + Auth** — commit, push, and open PR for `feat/settings-auth`.

Scope:

- Branch: `feat/settings-auth` (magic link, `user_settings`, per-user LLM/Feishu UI)
- Smoke test: sign in → save LLM keys → import uses user's key
- Merge PR to `main`; then `openspec archive pre-phase-5-hardening`

Optional (not blocking PR):

- Cloud Auth: sync magic-link email template + OTP 300s in Supabase Dashboard
- Daily use on https://echo-speak-gray.vercel.app with real email

Reference:

- OpenSpec: `openspec/changes/pre-phase-5-hardening/tasks.md` §7–8
- ADR: `docs/decisions.md` (Settings + Auth)
- Design: `docs/design-system.md` (Settings Page)
