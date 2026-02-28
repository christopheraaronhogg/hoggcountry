#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATE="$(TZ=America/Chicago date +%F)"
PUBLISH="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --date)
      DATE="${2:?missing value for --date}"
      shift 2
      ;;
    --publish)
      PUBLISH="1"
      shift
      ;;
    *)
      # Backwards-compatible positional date argument
      DATE="$1"
      shift
      ;;
  esac
done

ASSET_DIR="$REPO_ROOT/docs/business/daily-updates/assets/$DATE"
PY_SCRIPT="$REPO_ROOT/scripts/trail_assistant_daily_one_sheet.py"
REPORT_PATH="$REPO_ROOT/docs/business/daily-updates/$DATE.html"
LATEST_PATH="$REPO_ROOT/docs/business/daily-updates/latest.html"
PUBLIC_URL="https://raw.githack.com/christopheraaronhogg/hoggcountry/main/docs/business/daily-updates/latest.html"

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

echo "[daily-one-sheet] ready: $REPORT_PATH"
echo "[daily-one-sheet] latest: $LATEST_PATH"

git_publish() {
  git -C "$REPO_ROOT" add docs/business/daily-updates

  if git -C "$REPO_ROOT" diff --cached --quiet; then
    echo "[daily-one-sheet] no report changes to publish"
    return 0
  fi

  if git -C "$REPO_ROOT" commit -m "chore(trail-assistant): publish daily one-sheet $DATE"; then
    if git -C "$REPO_ROOT" push origin main; then
      echo "[daily-one-sheet] published to web: $PUBLIC_URL"
      return 0
    else
      echo "[daily-one-sheet] commit created, but push failed"
      return 1
    fi
  else
    echo "[daily-one-sheet] commit failed"
    return 1
  fi
}

if [[ "$PUBLISH" == "1" ]]; then
  git_publish || true
fi
