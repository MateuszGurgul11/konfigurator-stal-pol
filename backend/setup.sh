#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

echo ""
echo "Środowisko gotowe. Uruchom backend:"
echo "  ./run-dev.sh"
echo ""
echo "Lub ręcznie:"
echo "  source .venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
