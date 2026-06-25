#!/usr/bin/env bash
# Verify Supabase keys match cloud project ejgybfiywdbnfzckjqao before Vercel sync.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CLOUD_REF="ejgybfiywdbnfzckjqao"
CLOUD_URL="https://${CLOUD_REF}.supabase.co"

if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env.local
  set +a
fi

decode_ref() {
  local jwt="$1"
  node -e "
    const p = JSON.parse(Buffer.from('${jwt}'.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
    console.log(p.ref || p.iss || '');
  "
}

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "FAIL: SUPABASE_SERVICE_ROLE_KEY is not set." >&2
  exit 1
fi

role_ref="$(decode_ref "$SUPABASE_SERVICE_ROLE_KEY")"
if [[ "$role_ref" == "supabase-demo" ]]; then
  echo "FAIL: SUPABASE_SERVICE_ROLE_KEY is the local supabase-demo key." >&2
  echo "      Copy service_role secret from Dashboard → Settings → API (cloud project)." >&2
  exit 1
fi
if [[ "$role_ref" != "$CLOUD_REF" ]]; then
  echo "FAIL: service_role JWT ref is '$role_ref', expected '$CLOUD_REF'." >&2
  exit 1
fi

if ! node -e "
  const { createClient } = require('@supabase/supabase-js');
  createClient('$CLOUD_URL', process.env.SUPABASE_SERVICE_ROLE_KEY)
    .from('videos').select('id').limit(1)
    .then(({ error }) => process.exit(error ? 1 : 0));
" 2>/dev/null; then
  echo "FAIL: service_role key rejected by cloud API (Invalid API key)." >&2
  exit 1
fi

echo "OK: cloud service_role key valid for $CLOUD_REF"
