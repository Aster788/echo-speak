#!/usr/bin/env bash
# Run next dev against cloud Supabase from .env.local (ignores .env.development.local overrides).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "FAIL: .env.local not found. Add cloud Supabase URL and keys first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

echo "Using cloud Supabase from .env.local (${NEXT_PUBLIC_SUPABASE_URL})"
exec next dev "$@"
