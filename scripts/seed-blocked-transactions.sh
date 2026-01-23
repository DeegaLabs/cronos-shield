#!/bin/bash

# Script to seed test blocked transactions for demo
# Usage: ./seed-blocked-transactions.sh [count]

BACKEND_URL="${BACKEND_URL:-https://cronos-shield-backend-production.up.railway.app}"
COUNT="${1:-89}"

echo "🌱 Seeding $COUNT test blocked transactions..."
echo "Backend URL: $BACKEND_URL"

curl -X POST "$BACKEND_URL/api/observability/seed-blocked-transactions" \
  -H "Content-Type: application/json" \
  -d "{\"count\": $COUNT}"

echo ""
echo "✅ Done! Check the dashboard to see the blocked transactions."
