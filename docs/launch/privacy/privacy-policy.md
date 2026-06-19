# Trail Assistant — Privacy Policy

**Effective date:** June 18, 2026
**App:** Trail Assistant (iOS and Android) — bundle ID `com.hoggcountry.trailassistant`
**Published by:** Hogg Country

Trail Assistant is built to be a quiet, trustworthy companion on the Appalachian Trail. It was made with love for one specific 2026 thru-hiker — the developer's dad — and for other hikers walking the same miles. The whole app is designed around one idea: **your phone is yours.** Almost everything happens on the device in your pocket. This policy explains, plainly and honestly, the very small amount of data that ever leaves it, and the much larger amount that never does.

We don't believe in burying the truth in legal boilerplate, so here it is up front.

---

## The short version

- **No accounts. No login.** You don't create an account or give us your name, email, or phone number to use the app.
- **No ads. No analytics. No tracking.** There are no advertising IDs, no third-party analytics or tracking SDKs, and no data is ever sold, rented, or used to profile you.
- **The AI runs on your phone.** Scout — the trail and scripture assistant — runs Google's Gemma model *locally* on your device via LiteRT. **No question, prompt, or answer is ever sent to any server or AI cloud.** Your conversations with Scout never leave your phone.
- **The only data that ever leaves your device** is what you deliberately choose to send: when you tap **Report Trail Conditions** (Trail Pulse), the app sends a condition chip and/or a short note you typed, your optional trail name, an **approximate** position along the trail, and a timestamp — so other hikers benefit from current conditions. It does **not** send your GPS coordinates.
- **Everything else stays on the device** — your journal, your gear list, your settings, your on-phone check-in log, and all AI inference.
- **One large download, once.** On first run, *if you choose to enable the on-device AI*, the app downloads the Gemma model (~2.6 GB) one time from Hugging Face. The app is fully usable before and without it.
- **The Bible is bundled.** The King James Bible (Pure Cambridge Edition) is public domain and ships inside the app — reading and searching it requires no network and sends nothing anywhere.

If you only read this far, you've got the gist. The rest is detail.

---

## 1. Who we are

Trail Assistant is published by **Hogg Country**, an independent project centered on the 2026 Appalachian Trail thru-hike. We are responsible for the small amount of data described below.

- **Website:** hoggcountry.com
- **Privacy contact:** privacy@hoggcountry.com

If you have a question about your privacy that this policy doesn't answer, email the address above and a real person will read it.

---

## 2. What data is processed, and where

We've split this into two buckets, because the difference is the whole point of the app.

### A. Data that stays entirely on your device (never sent to us or anyone)

| What | Where it lives | Notes |
|------|----------------|-------|
| **Your journal entries** | On-device storage only | We never see them. They are not backed up to our servers. |
| **Your gear loadout** (items, weights, what's packed) | On-device storage only | Stays on your phone. |
| **App settings & preferences** | On-device storage only | Includes things like your Wi-Fi-only download preference. |
| **All Scout AI activity** — every question you ask and every answer Scout gives, for both trail and scripture questions | Processed on-device by the local Gemma model | **Nothing about your AI use is transmitted anywhere.** No prompt, no question, no answer, no usage record leaves the phone. |
| **Bible reading & verse search** | Bundled King James Bible, read locally | No network used; nothing sent. |
| **Your "check-in" / "I'm safe" status** | On-device log only | In this version, a check-in is recorded **on your phone only**. It does **not** transmit. We do not offer "let your family see you're okay" as a shipping feature. |
| **Your position on the Today, Map, and elevation views** | Computed and used on-device to place you on the trail ribbon | If your device shares its location with the app, that location is used **on the device** to figure out where you are on the trail. Your raw GPS coordinates are **never** transmitted or stored off the device. |

We cannot read, recover, or sell any of this. It lives on your phone. If you delete the app, this data is deleted with it.

### B. The only data that leaves your device — optional and user-initiated

There is exactly **one** path by which data goes from your phone to us, and it never happens automatically:

**When you choose to Report Trail Conditions** (also called *Trail Pulse*) while online, the app sends the following to our real-time trail service:

- a **condition chip** (e.g. "Water," "Rocks") and/or a **short note** you typed;
- your **trail name**, if you chose to provide one (optional);
- an **approximate position along the trail** — a "snapped trail-mile" (for example, mile 1,438.4), **not** your latitude/longitude and **not** your precise GPS location; and
- a **timestamp** of when you observed the condition.

**Why:** so that other hikers nearby on the trail benefit from current conditions — water status, hazards, rough terrain, and the like.

**Where it goes:** to **SpacetimeDB**, a real-time database service that we operate as our own backend, over an **encrypted** connection. It is not shared with advertising or analytics companies, and it is not sold.

**It's your choice every time.** Nothing is sent unless *you* tap to send a report. If you never send one, this data never leaves your phone. There is no background location tracking and no automatic reporting.

> **A note on how your position is shared:** Your phone *may* read precise GPS **on the device** in order to place you on the map and calculate the trail-mile. But only that derived **trail-mile** — an approximate point along a one-dimensional trail — is ever included in a report. Your exact coordinates stay on the phone.

> **Android build note (honest disclosure):** The current **Android** build does not request location permission, so on Android the trail-mile is derived **without** a live GPS fix. Precise GPS is not captured on Android in this build. We're flagging this openly and will keep the policy accurate as the build evolves.

---

## 3. The one-time model download (Hugging Face)

Scout's intelligence comes from Google's **Gemma** model, which runs **on your device** via LiteRT. To make that possible, the model file itself (~2.6 GB) is downloaded **once**, on first run, **only if you choose to enable on-device AI**:

- The download is **user-initiated** — you decide to start it.
- By default it happens **only over Wi-Fi**, so it won't burn your cellular data.
- The file is **checksum-verified** after download to confirm it arrived intact.
- It is downloaded from **Hugging Face** (huggingface.co), a third-party model host. When your device fetches the file, Hugging Face necessarily receives standard network request information (such as your IP address) as part of delivering the file — the same as any file download from the internet. **We do not send Hugging Face any of your personal data, questions, or content,** and Hugging Face's handling of that request is governed by their own privacy policy.
- The app is **fully usable before and without** this download. You can use the day timeline, map, journal, gear, Bible reading and search, and field guide without ever downloading the model.

After the model is on your device, Scout runs entirely offline. Asking Scout a question after that point involves **no network connection at all**.

> **On-device AI availability (honest disclosure):** On Android, the on-device AI is fully wired. On **iOS**, the very first build may ship the AI engine as a graceful "model unavailable" state until the native component is fully connected. Where that's the case, Scout will tell you clearly rather than pretending to work. This doesn't change the privacy promise: when the AI *does* run, it runs on your device and sends nothing out.

---

## 4. What we deliberately do **not** do

To be completely clear, Trail Assistant does **not**:

- require or offer **user accounts or logins**;
- show **advertising** of any kind;
- include **third-party analytics, tracking, or telemetry SDKs**. (Firebase is **not** active in this app — the `google-services.json` configuration file is absent, which we have verified — so no Firebase data collection occurs.)
- use **advertising identifiers** (IDFA, GAID) or build any advertising / cross-app tracking profile;
- transmit your **precise GPS coordinates** off the device — only an approximate trail-mile is shared, and only when you send a report;
- **sell, rent, or trade** your data, ever;
- send your **AI prompts or answers** to any server or cloud;
- run **remote / push notifications**. The only notifications are **local** ones on your own device (for example, model-download progress). Nothing is pushed from a server.

---

## 5. Notifications

The app uses **local notifications only** — generated on your device, for example to show progress while the Gemma model downloads. There is **no remote push notification** service active, which means no third party is given a device token to message you.

---

## 6. Children's privacy

Trail Assistant is a general-audience hiking and scripture companion. It is **not directed at children under 13**, and we do not knowingly collect personal information from children under 13. Because the app has no accounts and collects no personal data except the optional, user-initiated trail-condition report described above, there is effectively no profile of any user to collect. If you believe a child has submitted a trail report and you'd like it removed, contact us at privacy@hoggcountry.com and we'll delete it.

---

## 7. Data retention and how to request deletion

**On-device data** (journal, gear, settings, AI activity, Bible data, your on-phone check-in log) is retained on **your** device for as long as you keep the app. You can clear it at any time by deleting your entries within the app or by uninstalling the app — uninstalling removes this data from your phone. We never had a copy, so there is nothing for us to delete on our side.

**Trail-condition reports** (the chip, note, optional trail name, approximate trail-mile, and timestamp you chose to send) are stored on our real-time trail service so that current conditions can be shared with other hikers. These reports are intended to be timely and are aged out as they become stale. To request access to, correction of, or **deletion** of reports you have submitted, email **privacy@hoggcountry.com**. Because there are no accounts, please include enough detail for us to locate the relevant entries (for example, the approximate dates, the trail name you used, and the approximate mile). We will act on verified deletion requests promptly.

---

## 8. Security

- Data sent during a **trail-condition report** travels over an **encrypted** connection to our backend.
- The downloaded Gemma model is **checksum-verified** to confirm integrity.
- Your **raw GPS coordinates never leave the device** — only a derived, approximate trail-mile is ever shared.
- On-device data is protected by your **device's own security** (lock screen, OS sandboxing, and any device encryption you have enabled). Because so little data ever leaves the phone, the attack surface is intentionally small.
- No system is perfectly secure, and we can't guarantee absolute security — but we've designed Trail Assistant to need as little of your data as possible, which is the strongest privacy protection of all.

---

## 9. A safety note (not strictly privacy, but it matters)

Trail Assistant is a planning and reading companion. It helps you *think* — it is **not an emergency device** and **not a substitute** for official weather forecasts, official maps, or your own judgment in the field. Trail and weather data may be candidate-grade and is labeled as such; always **confirm conditions in the field** and carry appropriate emergency equipment.

---

## 10. Changes to this policy

If we change how the app handles data, we'll update this policy and revise the **effective date** at the top. Where a change is material, we'll make a reasonable effort to surface it in the app or on hoggcountry.com. Continuing to use the app after an update means you accept the revised policy.

---

## 11. Contact

**Hogg Country**
Privacy: **privacy@hoggcountry.com**
Web: hoggcountry.com

*Made with love for Dad, and for everyone walking north.*
