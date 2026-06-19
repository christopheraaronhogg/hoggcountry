#!/usr/bin/env bash
# Build the Android App Bundle used for Google Play submission.
#
# This script is intentionally on-device-model-only. It turns on the mobile
# Gemma-only policy at build time so the app cannot route Scout chat to a cloud
# model in release builds.
#
# Optional signing env vars:
#   HC_ANDROID_KEYSTORE_FILE
#   HC_ANDROID_KEYSTORE_PASSWORD
#   HC_ANDROID_KEY_ALIAS
#   HC_ANDROID_KEY_PASSWORD
set -euo pipefail

cd "$(dirname "$0")/.."

java_major() {
	"$1" -version 2>&1 | awk -F\" '/version/ { split($2, parts, "."); print parts[1]; exit }'
}

jbr="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [ -x "$jbr/bin/java" ]; then
	current_java_major=""
	if command -v java >/dev/null 2>&1; then
		current_java_major="$(java_major "$(command -v java)" || true)"
	fi
	if [ -z "${JAVA_HOME:-}" ] || [ -z "$current_java_major" ] || [ "$current_java_major" -lt 21 ]; then
		export JAVA_HOME="$jbr"
		export PATH="$JAVA_HOME/bin:$PATH"
	fi
fi
if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
	export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
export VITE_SCOUT_MODEL_POLICY="gemma4-only"

command -v java >/dev/null 2>&1 || { echo "FAIL: no JDK. Install Android Studio or set JAVA_HOME."; exit 1; }
[ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME" ] || { echo "FAIL: Android SDK not found. Install Android Studio or set ANDROID_HOME."; exit 1; }

npm run build
node scripts/preflight.mjs --platform android
npx cap sync android

( cd android && ./gradlew bundleRelease )

aab="android/app/build/outputs/bundle/release/app-release.aab"
echo
if [ -f "$aab" ]; then
	echo "AAB: $(pwd)/$aab"
	if [ -z "${HC_ANDROID_KEYSTORE_FILE:-}" ]; then
		echo "WARN: AAB is unsigned. Configure Play App Signing/upload-key env vars before uploading to Play Console."
	fi
else
	echo "FAIL: expected AAB not found at $aab"
	exit 1
fi
