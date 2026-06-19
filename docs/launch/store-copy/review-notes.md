# App Review notes — paste into each store's reviewer field

These pre-empt the predictable reviewer questions about the large model download,
the iOS AI state, and the foreground service. Paste into:
- **Apple:** App Store Connect → your version → **App Review Information → Notes**
  (and set "Sign-in required" = **No**).
- **Google Play:** Console → **App content → App access** = *All functionality
  available without special access*, plus the **Review notes** field.

---

## Apple — App Review Information → Notes

> Hogg Country "Trail Assistant" is an offline-first Appalachian Trail companion. **No account or login is required — every feature is reachable immediately.**
>
> **On-device AI ("Scout"):** Scout runs a Google Gemma model **locally on the device** (via LiteRT). The model is **on-device ML weights (data), interpreted by a bundled inference runtime — it is not downloaded executable code and does not change the app's behavior from its reviewed state (re: Guideline 2.5.2).** It is a one-time ~2.6 GB download that the user starts manually over Wi-Fi (Settings → On-device AI). **The app is fully functional before/without that download** — Today, the Map, the full offline King James Bible (browse/read/search), the journal, and the gear list all work with no network and no model. No prompt, question, answer, or scripture query ever leaves the device.
>
> *(Include this line only if the AI engine ships stubbed on iOS:)* On-device AI is rolling out by platform; on this build the iOS Scout engine returns a graceful "on-device model isn't installed" message rather than an AI answer. This is intentional, not a defect — all other features are complete.
>
> **Location:** used **on-device only** to place the hiker on the trail map. The only value ever transmitted is an **approximate trail-mile** (not GPS coordinates), and only when the user chooses to submit an optional trail-condition report. There is no background location use and no tracking.
>
> **Data & privacy:** no accounts, no ads, no analytics/tracking SDKs, nothing sold. The King James Bible text is public domain (Pure Cambridge Edition), bundled offline. Full details: [privacy policy URL].
>
> Built by a small family team for the developer's father's 2026 thru-hike. Questions: [support email].

---

## Google Play — App access + Review notes

**App access:** select **"All functionality is available without special access"** (no login, no account, no special configuration).

**Review notes:**

> Hogg Country "Trail Assistant" is an offline-first Appalachian Trail companion. No login or account is required.
>
> **On-device AI ("Scout")** runs a Google Gemma model locally via LiteRT. It requires a **one-time ~2.6 GB model download** that the user starts manually over Wi-Fi. **The rest of the app is fully functional offline without it** — Today, Map, the full King James Bible (browse/read/search), journal, and gear all work with no network and no model. A reviewer who does not complete the download will still see every non-AI feature working; **please do not read the pre-download state as a broken feature.** No prompt or answer leaves the device.
>
> **Foreground service (`dataSync`):** used **solely** for that user-initiated model download. A multi-GB download needs to continue with visible progress and survive the app being backgrounded or killed, so it runs as a short-lived, user-initiated `dataSync` foreground service with a progress notification. It does not run in the background otherwise. (See the Foreground Service declaration.)
>
> **Data:** the only data that leaves the device is an optional, user-initiated trail-condition report — an approximate trail-mile (not GPS coordinates) plus a note the user types — sent to our own real-time trail service. No accounts, no ads, no analytics, nothing sold. Privacy policy: [privacy policy URL].

---

**DECISION:** fill `[support email]` and `[privacy policy URL]` once confirmed (see morning brief). Remove the iOS-stub paragraph if the LiteRT Swift package is wired before submission.
