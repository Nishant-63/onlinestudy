#!/bin/bash
# Production smoke test: hits /api/health and exits non-zero on failure.
# Usage: ./scripts/smoke-test.sh [BASE_URL]
# Example: ./scripts/smoke-test.sh https://onlinestudy-backend-4u8y.onrender.com

set -e
BASE_URL="${1:-http://localhost:3001}"
HEALTH_URL="${BASE_URL}/api/health"

echo "Smoke test: GET $HEALTH_URL"
RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: health returned HTTP $HTTP_CODE"
  echo "$HTTP_BODY"
  exit 1
fi

if echo "$HTTP_BODY" | grep -q 'success.*true' && echo "$HTTP_BODY" | grep -q 'connected'; then
  echo "OK: health check passed"
  exit 0
else
  echo "FAIL: unexpected response body"
  echo "$HTTP_BODY"
  exit 1
fi
