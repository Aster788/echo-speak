#!/usr/bin/env bash
# Push Echo Speak env vars to Vercel (production + preview).
# Requires: vercel CLI logged in, project linked (.vercel/project.json).
#
# Usage:
#   export SUPABASE_SERVICE_ROLE_KEY='<cloud service_role from Dashboard → API>'
#   ./scripts/sync-vercel-env.sh
#
# LLM_* values are read from .env.local if present.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .vercel/project.json ]]; then
  echo "Run: npx vercel link --project echo-speak" >&2
  exit 1
fi

EXPORTED_SERVICE_ROLE="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env.local
  set +a
fi

if [[ -n "$EXPORTED_SERVICE_ROLE" ]]; then
  SUPABASE_SERVICE_ROLE_KEY="$EXPORTED_SERVICE_ROLE"
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY_OVERRIDE." >&2
  exit 1
fi

CLOUD_URL="${NEXT_PUBLIC_SUPABASE_CLOUD_URL:-https://ejgybfiywdbnfzckjqao.supabase.co}"
# Legacy anon JWT (public; Dashboard → Settings → API)
CLOUD_ANON="${NEXT_PUBLIC_SUPABASE_CLOUD_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZ3liZml5d2RibmZ6Y2tqcWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MDExODQsImV4cCI6MjA5NzQ3NzE4NH0.prOHAS_LILpANhneS9-YMISbBQt9cNLJWLSH06QEcqk}"

if [[ -z "$CLOUD_ANON" ]]; then
  echo "Set NEXT_PUBLIC_SUPABASE_CLOUD_ANON_KEY." >&2
  exit 1
fi

if [[ -z "${LLM_API_KEY:-}" ]]; then
  echo "LLM_API_KEY missing (add to .env.local)." >&2
  exit 1
fi

add_env() {
  local name="$1"
  local value="$2"
  local sensitive="${3:-yes}"
  # Production only — avoids interactive "Git branch?" on Preview.
  if [[ "$sensitive" == "yes" ]]; then
    npx vercel env add "$name" production --value "$value" --force --yes --sensitive
  else
    npx vercel env add "$name" production --value "$value" --force --yes --no-sensitive
  fi
}

echo "Syncing Vercel env for echo-speak…"

add_env NEXT_PUBLIC_SUPABASE_URL "$CLOUD_URL" no
add_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$CLOUD_ANON" no
add_env SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" yes
add_env LLM_API_KEY "$LLM_API_KEY"
add_env LLM_BASE_URL "${LLM_BASE_URL:-https://api.deepseek.com}"
add_env LLM_MODEL "${LLM_MODEL:-deepseek-chat}"

if [[ -n "${FEISHU_APP_ID:-}" ]]; then
  add_env FEISHU_APP_ID "$FEISHU_APP_ID"
fi
if [[ -n "${FEISHU_APP_SECRET:-}" ]]; then
  add_env FEISHU_APP_SECRET "$FEISHU_APP_SECRET"
fi

echo "Done. Redeploy: npx vercel --prod"
