#!/usr/bin/env bash
# Run Blueprint AI locally with debug-friendly settings.
# Usage: ./scripts/dev-debug.sh [backend|frontend|both]

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

run_backend() {
  cd "$ROOT/backend"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  export APP_ENV=development
  export LOG_LEVEL=DEBUG
  export AUTH_DEV_BYPASS=true
  export DB_ECHO=true
  echo "→ Backend http://localhost:8000 (docs: /docs, AUTH_DEV_BYPASS=true)"
  exec uvicorn app.main:app --reload --port 8000 --log-level debug
}

run_frontend() {
  cd "$ROOT/frontend"
  echo "→ Frontend http://localhost:5173"
  exec npm run dev
}

case "${1:-both}" in
  backend) run_backend ;;
  frontend) run_frontend ;;
  both)
    trap 'kill 0' EXIT
    run_backend &
    run_frontend &
    wait
    ;;
  *)
    echo "Usage: $0 [backend|frontend|both]"
    exit 1
    ;;
esac
