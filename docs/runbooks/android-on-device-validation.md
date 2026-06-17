# Android on-device validation (Dad pilot / concept check)

Goal: prove the Android build actually downloads, verifies, loads, and answers
with on-device Gemma 4 — on a real phone (the only place the 2.6 GB model + real
inference can run; emulators on this Mac aren't viable). This is the concept
check before any paid iOS enrollment.

## Prereqs

- An Android phone, **Android 12+**, ideally **6 GB+ RAM** and **~4 GB free
  storage** (the model is ~2.6 GB; E2B wants a couple GB of RAM to run).
- The phone on **Wi-Fi** (the one-time model download is 2.6 GB).
- For install + logs: USB cable + **USB debugging** on (Settings → Developer
  options), and `adb` (ships in the Android SDK platform-tools).

## 1. Install the app (no rebuild needed)

The debug APK is already built and committed-adjacent at:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

With the phone plugged in (USB debugging authorized):
```sh
cd mobile && bash scripts/android-debug-apk.sh --install
```
(That rebuilds the APK and `adb install`s it. To skip the rebuild, just
`adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.)
No phone cable? Transfer the `.apk` to the phone and tap it (allow "install from
this source").

> The debug build is intentionally **not** the gemma4-only Play build, so if the
> model isn't installed yet, Scout still answers from the deterministic offline
> pack. That's expected — the model card tells you the real engine state.

## 2. Download + verify the model

In the app: **Account tab → "On-device AI · Gemma 4" card → Download model**.
- Watch the progress bar to ~2.6 GB. It is resumable — if Wi-Fi drops, reopen
  and tap Download again; it continues, it doesn't restart.
- Success looks like: **"✓ Installed and verified — Scout works fully offline."**
  (The file is SHA-256 verified before it's ever marked ready — fail-closed.)

## 3. Prove it runs offline

1. Put the phone in **airplane mode** (proves no cloud).
2. Ask Scout a trail question (e.g. "what's my next water and shelter?").
3. A real on-device answer should come back. First answer is slow (the engine
   does a one-time load of seconds); later answers are faster.

## Diagnostics — if anything looks off

**WebView console (best for the JS contract).** On desktop Chrome:
`chrome://inspect` → find the app's WebView → **Inspect** → Console:
```js
await Capacitor.Plugins.ScoutGemma.getModelStatus()   // { state: 'ready' | 'needs_download' | ... }
await Capacitor.Plugins.ScoutGemma.isAvailable()       // { available: true/false, reason }
await Capacitor.Plugins.ScoutGemma.describeModel()     // tier / modelId / maxContextTokens
```
- `state: 'ready'` + `isAvailable.available: true` ⇒ engine is live.
- `state: 'ready'` but `available: false` ⇒ the model verified but the engine
  failed to load → check logcat below.

**Native log (best for engine load / inference).** With USB:
```sh
adb logcat -s ScoutGemma:*
```
What you'll see:
- `Initializing LiteRT-LM engine from …` then `LiteRT-LM engine initialized` ⇒ model loaded.
- `On-device Gemma generation failed: …` ⇒ inference threw (send me the message).
- `Gemma produced no text parts …` ⇒ engine ran but the response shape differs
  from what we parse (send me this — it's a quick fix).

**If it fails, send me:** the `getModelStatus()` JSON + the `adb logcat -s
ScoutGemma:*` output around the failure. That pinpoints it fast.

## Known constraints

- Low-RAM phones may not hold the E2B model — if it OOMs, that's a device-class
  limit, not a code bug (E4B/E2B tiering is the planned answer).
- Per-call token cap + token streaming are not wired yet (answers are
  non-streamed and use the model's default decode length).
