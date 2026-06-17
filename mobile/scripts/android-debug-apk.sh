#!/usr/bin/env bash
# Build a sideloadable Android debug APK for the Hogg Country mobile pilot.
#
# This is the "backup" install path: a debug APK is auto-signed with Gradle's
# debug keystore, so there is zero developer-account / provisioning ceremony
# (unlike an iPhone device install). The toolchain on this machine is already
# complete (Android Studio JBR + SDK platform-35 + build-tools 35.0.0); the only
# missing pieces are the JAVA_HOME / ANDROID_HOME env vars, which this script
# wires from their known locations.
#
# It deliberately does NOT install npm packages or run `cap add`, so it can't
# race or clobber concurrent package.json work. If a prerequisite is missing it
# prints the exact one-time command and stops.
#
# Usage (from mobile/):
#   bash scripts/android-debug-apk.sh           # build the debug APK
#   bash scripts/android-debug-apk.sh --install  # build, then adb install if a device is attached
set -euo pipefail

cd "$(dirname "$0")/.."
mobile_dir="$(pwd)"

# --- Wire the toolchain env from known macOS locations ----------------------
jbr="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [ -z "${JAVA_HOME:-}" ] && [ -x "$jbr/bin/java" ]; then
	export JAVA_HOME="$jbr"
	export PATH="$JAVA_HOME/bin:$PATH"
fi
if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
	export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"

command -v java >/dev/null 2>&1 || { echo "FAIL: no JDK. Install Android Studio (ships a JBR) or set JAVA_HOME."; exit 1; }
[ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME" ] || { echo "FAIL: Android SDK not found. Install via Android Studio, then set ANDROID_HOME."; exit 1; }

# --- Prerequisites this script will not auto-create (avoids mutating deps) ---
if [ ! -d node_modules/@capacitor/android ]; then
	echo "FAIL: @capacitor/android is not installed."
	echo "      Run once:  npm install @capacitor/android@7.6.6"
	exit 1
fi
if [ ! -d android ]; then
	echo "FAIL: native android/ project not generated."
	echo "      Run once:  npm run cap:add:android"
	exit 1
fi

# Capacitor's Gradle reads the SDK path from android/local.properties or env.
# We exported ANDROID_HOME above, so a build works without writing the file.

echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo

# --- Build web assets, sync into the native project, assemble the APK --------
npm run build
node scripts/preflight.mjs --platform android
npx cap sync android

( cd android && ./gradlew assembleDebug )

apk="$mobile_dir/android/app/build/outputs/apk/debug/app-debug.apk"
echo
if [ -f "$apk" ]; then
	echo "APK: $apk"
else
	echo "WARN: expected APK not found at $apk (check Gradle output above)."
	exit 1
fi

if [ "${1:-}" = "--install" ]; then
	if [ -n "$("$ANDROID_HOME/platform-tools/adb" devices | sed '1d' | grep -w device || true)" ]; then
		echo "Installing on attached device..."
		"$ANDROID_HOME/platform-tools/adb" install -r "$apk"
	else
		echo "No device attached. Plug in the phone (USB debugging on) or sideload the APK manually."
	fi
fi
