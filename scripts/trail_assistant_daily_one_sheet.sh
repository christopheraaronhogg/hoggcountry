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
ASSET_SOURCES="$ASSET_DIR/_sources.tsv"
PY_SCRIPT="$REPO_ROOT/scripts/trail_assistant_daily_one_sheet.py"
REPORT_PATH="$REPO_ROOT/docs/business/daily-updates/$DATE.html"
LATEST_PATH="$REPO_ROOT/docs/business/daily-updates/latest.html"
PUBLIC_URL="https://raw.githack.com/christopheraaronhogg/hoggcountry/main/docs/business/daily-updates/latest.html"
SCREENSHOT_REPORT_URL="https://cdn.jsdelivr.net/gh/christopheraaronhogg/hoggcountry@main/docs/business/daily-updates/latest.html"

mkdir -p "$ASSET_DIR"

cleanup_screenshots() {
  find "$ASSET_DIR" -maxdepth 1 -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) -delete
}

http_status() {
  local url="$1"
  local status
  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$url" || true)"
  if [[ -z "$status" ]]; then
    status="000"
  fi
  echo "$status"
}

is_live_status() {
  [[ "$1" =~ ^[23][0-9][0-9]$ ]]
}

choose_capture_url() {
  local first_url="${1:?at least one URL is required}"
  local selected_url="$first_url"
  local selected_status
  selected_status="$(http_status "$first_url")"

  if is_live_status "$selected_status"; then
    printf "%s\t%s\n" "$selected_url" "$selected_status"
    return 0
  fi

  shift
  for url in "$@"; do
    local status
    status="$(http_status "$url")"
    if is_live_status "$status"; then
      printf "%s\t%s\n" "$url" "$status"
      return 0
    fi
  done

  # Fallback to the first URL if no candidate is live.
  printf "%s\t%s\n" "$selected_url" "$selected_status"
}

capture_best() {
  local file="$1"
  local label="$2"
  shift 2

  if [[ $# -lt 1 ]]; then
    echo "[daily-one-sheet] capture_best requires at least one URL"
    return 1
  fi

  local selected
  local url
  local status
  selected="$(choose_capture_url "$@")"
  url="${selected%%$'\t'*}"
  status="${selected##*$'\t'}"

  echo "[daily-one-sheet] screenshot target: $label -> $url (HTTP $status)"

  if ! command -v playwright-cli >/dev/null 2>&1; then
    echo "[daily-one-sheet] playwright-cli not found; skipping screenshot for: $label"
    printf "%s\t%s\t%s\t%s\n" "$(basename "$file")" "$label" "$url" "$status" >> "$ASSET_SOURCES"
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

  printf "%s\t%s\t%s\t%s\n" "$(basename "$file")" "$label" "$url" "$status" >> "$ASSET_SOURCES"
}

cleanup_screenshots
printf "file\tlabel\turl\thttp_status\n" > "$ASSET_SOURCES"

capture_best "$ASSET_DIR/01-live-homepage.png" "Live homepage" \
  "https://hoggcountry.com/" \
  "https://hoggcountry.on-forge.com/"

capture_best "$ASSET_DIR/02-trail-assistant-surface.png" "Trail Assistant surface" \
  "https://hoggcountry.com/trail-assistant" \
  "https://hoggcountry.on-forge.com/trail-assistant" \
  "$SCREENSHOT_REPORT_URL"

capture_best "$ASSET_DIR/03-backend-api-health.png" "Backend API health" \
  "https://hoggcountry.on-forge.com/api/v1/health" \
  "https://hoggcountry.com/"

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
