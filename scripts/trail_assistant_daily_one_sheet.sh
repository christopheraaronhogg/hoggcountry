#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATE="${1:-$(TZ=America/Chicago date +%F)}"
ASSET_DIR="$REPO_ROOT/docs/business/daily-updates/assets/$DATE"
PY_SCRIPT="$REPO_ROOT/scripts/trail_assistant_daily_one_sheet.py"

mkdir -p "$ASSET_DIR"

capture() {
  local url="$1"
  local file="$2"

  if ! command -v playwright-cli >/dev/null 2>&1; then
    echo "[daily-one-sheet] playwright-cli not found; skipping screenshot: $url"
    return 0
  fi

  # Keep screenshot capture best-effort; never fail entire report run.
  if playwright-cli open "$url" >/tmp/pw_daily_open.log 2>&1 \
    && playwright-cli screenshot --filename "$file" --full-page >/tmp/pw_daily_shot.log 2>&1 \
    && playwright-cli close >/tmp/pw_daily_close.log 2>&1; then
    echo "[daily-one-sheet] captured: $file"
  else
    echo "[daily-one-sheet] screenshot capture failed for $url"
    playwright-cli close >/tmp/pw_daily_close.log 2>&1 || true
  fi
}

capture "https://hoggcountry.on-forge.com/" "$ASSET_DIR/01-live-root-status.png"
capture "https://hoggcountry.on-forge.com/trail-assistant" "$ASSET_DIR/02-live-trail-assistant-route.png"

"$PY_SCRIPT" --date "$DATE"

echo "[daily-one-sheet] ready: $REPO_ROOT/docs/business/daily-updates/$DATE.html"
