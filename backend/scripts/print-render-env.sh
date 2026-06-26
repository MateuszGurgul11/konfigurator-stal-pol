#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
KEY_FILE="${1:-./serviceAccountKey.json}"

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Brak pliku: $KEY_FILE" >&2
  echo "Użycie: ./scripts/print-render-env.sh [ścieżka/do/serviceAccountKey.json]" >&2
  exit 1
fi

echo "=== FIREBASE_SERVICE_ACCOUNT_JSON (jedna linia — wklej w Render) ==="
python3 -c "import json,sys; print(json.dumps(json.load(open(sys.argv[1]))))" "$KEY_FILE"
echo ""
echo "=== CORS_ORIGINS (przykład) ==="
echo "https://konfigurator-stal-pol.vercel.app,http://localhost:3000,http://localhost:3001"
echo ""
echo "=== Po deployu Render ==="
echo "Skopiuj URL usługi (np. https://konfigurator-stal-pol-api.onrender.com)"
echo "Ustaw w Vercel: NEXT_PUBLIC_API_URL=<ten URL>"
