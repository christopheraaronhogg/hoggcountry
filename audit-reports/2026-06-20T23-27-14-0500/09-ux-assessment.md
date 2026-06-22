# UX Assessment Report

**Project:** Hogg Country Trail Assistant iOS app
**Date:** 2026-06-20 23:27 -0500
**Consultant:** Codex UX Consultant
**Scope:** Persona QA for older thru-hiker Dad / low tech / bright sun / tired hands / fatigue.
**Proof surface:** Source review of the current working tree plus Capacitor/iOS expectations. No browser/web preview was used. No app source files were edited.

## Executive Summary

The current iOS app has moved in the right direction: first run no longer silently drops a hiker into Dad's pilot context, Today answers "where am I and what is next," Scout has an inline model-download path, Map is honest that it is an offline trace rather than a basemap, and Safety correctly avoids pretending it is 911 or satellite SOS.

The Dad-ready risks are now mostly around discoverability, touch comfort, and trust language. Safety is buried under Settings with an empty support circle by default. Scout and Bible use nested scroll regions that will be punishing on iOS with tired hands. Several field-critical controls are below the 44 px touch target standard, and the app repeatedly uses 0.6-0.8 rem helper/status text in places Dad must read outdoors.

## Scores

**UX Score:** 6.2/10
**Accessibility Score:** 6.0/10

## Step-by-Step Flow Notes

### First-Run Setup

Good: `HikeSetupSheet.svelte` forces a choice between self-tracking and following Dad instead of silently using Dad's pilot pack (`mobile/src/lib/components/HikeSetupSheet.svelte:58-127`). The self path persists as a real profile and recenters the pack on calibration (`mobile/src/lib/trailState.svelte.ts:844-855`).

Risk: the setup asks for an exact "Current AT mile" numeric entry before "Start my hike" can succeed (`mobile/src/lib/components/HikeSetupSheet.svelte:95-118`). For a low-tech tired hiker, exact AT mile is a high-friction first-run question. GPS exists later in Settings (`mobile/src/lib/components/AccountTab.svelte:160-164`) but not in first run.

Accessibility risk: the setup is a custom absolute overlay with `role="dialog"` (`mobile/src/lib/components/HikeSetupSheet.svelte:58`) while app header, nav, and page content remain mounted behind it (`mobile/src/routes/+page.svelte:17-40`). There is no visible focus trap or inert treatment in code.

### Today

Good: Today prioritizes day, mile, weather, next water/camp, and a fast "I'm safe" check-in (`mobile/src/lib/components/TodayTab.svelte:132-201`). The UI explicitly labels cached versus NWS weather (`mobile/src/lib/components/TodayTab.svelte:25-38`, `mobile/src/lib/components/TodayTab.svelte:173-198`).

Risk: the large mile readout is not directly actionable; the manual correction path is hidden in Settings. The "AI not installed" / "Runtime missing" chip is informative but not a tap target or repair path (`mobile/src/lib/components/TodayTab.svelte:17-23`, `mobile/src/lib/components/TodayTab.svelte:134-138`).

### Scout Chat / Model Status

Good: Scout now attempts to start the model download from chat when the model is missing (`mobile/src/lib/trailState.svelte.ts:691-701`) and shows inline download / metered / error states (`mobile/src/lib/components/ScoutModelStatusBubble.svelte:16-52`).

Risk: Scout has nested scrolling. The Scout outer screen disables scrolling (`mobile/src/routes/+page.svelte:44-50`), then the message log scrolls internally at `max-height: 50vh` (`mobile/src/lib/components/CoachTab.svelte:300-307`) with the composer below it (`mobile/src/lib/components/CoachTab.svelte:224-245`). On iOS, this is prone to scroll traps when the keyboard opens.

Trust risk: Settings tells users the model download "continues in the background" and they can lock the phone (`mobile/src/lib/components/AccountTab.svelte:185-194`), but the iOS native code uses a foreground/default `URLSession` (`mobile/ios/App/App/scout/ScoutModelDownloader.swift:24-28`) and explicitly states iOS downloads do not survive app termination (`mobile/ios/App/App/scout/ScoutGemmaPlugin.swift:186-189`). For Dad on trail Wi-Fi, this can feel like the app lied if a 2.6 GB download stops.

### Map

Good: the map explicitly says "Real AT trace · offline" and "No basemap · no routing" (`mobile/src/lib/components/MapTab.svelte:171-180`), which prevents overtrust.

Risk: the Map is a full-screen non-scrolling surface with several tiny overlays and controls (`mobile/src/lib/components/MapTab.svelte:242-247`). The zoom buttons are 26 x 22 px (`mobile/src/lib/components/MapTab.svelte:491-499`), far below the 44 x 44 px mobile target baseline. Pin labels and map tags use 0.62-0.72 rem text (`mobile/src/lib/components/MapTab.svelte:306-318`, `mobile/src/lib/components/MapTab.svelte:345-356`, `mobile/src/lib/components/MapTab.svelte:372-421`).

### Trail Docs / Bible

Good: Trail consolidates guide, Bible, docs, and gear, and docs can be saved offline (`mobile/src/lib/components/TrailTab.svelte:141-229`). Bible search and Ask can return source-backed verses even before full model synthesis (`mobile/src/lib/components/BibleReader.svelte:123-150`, `mobile/src/lib/components/BibleReader.svelte:310-333`).

Risk: the flow is tab-heavy. Trail has four sections (`mobile/src/lib/components/TrailTab.svelte:141-154`), then Bible has four more modes (`mobile/src/lib/components/BibleReader.svelte:160-174`). Chapter selection uses an internal scroll region capped at 108 px (`mobile/src/lib/components/BibleReader.svelte:491-497`). This is a recognition load problem for low-tech / tired use.

### Manual Mile

Good: manual mile exists in Settings, GPS snap exists, and Scout chat detects conservative "I'm at mile..." / "need help at mile..." intents before applying them (`mobile/src/lib/components/AccountTab.svelte:141-165`, `mobile/src/lib/scout/hike-profile.ts:341-397`, `mobile/src/lib/scout/action-intents.ts:49-85`).

Risk: the main day and map views show the mile but do not let Dad correct it in place. A hiker who sees the wrong mile must know to tap the gear, scroll into "My hike," and use the mile field.

### Safety / Settings

Good: Safety is honest that "Need help" only logs locally and opens SMS if there is signal, not 911 / satellite SOS (`mobile/src/lib/components/SafetyTab.svelte:143-148`, `mobile/src/lib/safety.ts:72-90`).

Risk: Safety is buried. Bottom nav exposes only Today, Scout, Map, Trail (`mobile/src/lib/components/TabNavigation.svelte:9-14`). Settings is only the header gear (`mobile/src/lib/components/AppHeader.svelte:39-47`). Safety is the second group under Settings (`mobile/src/lib/components/SettingsTab.svelte:26-34`). Support circle starts empty (`mobile/src/lib/trail-state-defaults.ts:52-87`), so "Need help" can degrade to only a local log and a note to add contacts (`mobile/src/lib/components/SafetyTab.svelte:20-31`).

## P0 Findings

### P0-1: Emergency-adjacent help is hidden behind Settings and starts unwired

**Evidence:** Bottom nav excludes Safety (`mobile/src/lib/components/TabNavigation.svelte:9-14`), Settings is a gear-only entry (`mobile/src/lib/components/AppHeader.svelte:39-47`), Safety is below Account/on-device AI (`mobile/src/lib/components/SettingsTab.svelte:26-34`), support contacts default empty (`mobile/src/lib/trail-state-defaults.ts:52-87`), and no-contact help only logs locally plus asks for a contact (`mobile/src/lib/components/SafetyTab.svelte:20-31`).

**Impact:** A low-tech older hiker under stress may not find "Need help," and if they do, it may not reach anyone. The copy is honest, but the path is not Dad-ready.

**Fix direction:** Add support-circle setup to first run, and surface a persistent "Help / Check-in" affordance from Today and header. Keep the non-911 caveat, but make the reachable path obvious before the trail day starts.

## P1 Findings

### P1-1: First-run setup depends on an exact mile with no low-tech fallback

**Evidence:** The first-run form requires a valid numeric "Current AT mile" before save (`mobile/src/lib/components/HikeSetupSheet.svelte:95-118`). GPS correction is only later in Settings (`mobile/src/lib/components/AccountTab.svelte:160-164`).

**Impact:** Dad may not know his exact AT mile at setup. This increases abandonment or pushes him to "Follow Dad" when he meant "my hike."

**Fix direction:** Add "Use GPS," "Start at Springer," and "Pick nearby shelter/town" options directly in first run. Make exact mile an advanced path.

### P1-2: Scout chat is prone to iOS nested-scroll traps

**Evidence:** Scout disables outer scrolling (`mobile/src/routes/+page.svelte:44-50`) and creates an inner message scroll at 50vh (`mobile/src/lib/components/CoachTab.svelte:300-307`), with composer controls below (`mobile/src/lib/components/CoachTab.svelte:224-245`).

**Impact:** On iOS with the keyboard open, Dad can get stuck dragging the wrong area or lose the latest answer/input. This is high-friction under fatigue.

**Fix direction:** Make Scout one vertical scroll surface with a sticky composer above the safe area/keyboard. Preserve the "jump to latest" behavior without an inner 50vh log.

### P1-3: iOS model-download copy overpromises background reliability

**Evidence:** UI says the 2.6 GB download continues in background and lock screen (`mobile/src/lib/components/AccountTab.svelte:185-194`). iOS code uses default URLSession (`mobile/ios/App/App/scout/ScoutModelDownloader.swift:24-28`) and explicitly says download state is inactive after relaunch/termination (`mobile/ios/App/App/scout/ScoutGemmaPlugin.swift:186-189`).

**Impact:** A hiker may leave Wi-Fi or lock/kill the app believing offline Scout will finish. The mismatch damages trust in the most important "works with no signal" promise.

**Fix direction:** Make iOS copy precise: "keep the app open/on charger/on Wi-Fi" unless a true background session is implemented. Add app-resume reconciliation and a clear "download paused/stopped" state.

### P1-4: Map controls and labels are too small for tired hands and bright sun

**Evidence:** Zoom controls are 26 x 22 px (`mobile/src/lib/components/MapTab.svelte:491-499`), pin/current-position labels use 0.62-0.7 rem (`mobile/src/lib/components/MapTab.svelte:306-318`, `mobile/src/lib/components/MapTab.svelte:345-356`), and important map caveats are small chips (`mobile/src/lib/components/MapTab.svelte:372-421`).

**Impact:** The Map may be factually honest but physically hard to use outdoors. Small "no basemap/no routing" text is also easy to miss, increasing overtrust risk.

**Fix direction:** Promote zoom to 44 px controls, make caveats a single large plain-language banner, and enlarge current position / next water labels.

### P1-5: Manual mile correction is too hidden from the primary trail views

**Evidence:** Today shows the mile (`mobile/src/lib/components/TodayTab.svelte:139-145`) and Map shows current position (`mobile/src/lib/components/MapTab.svelte:197-201`), but the edit controls live under Settings > My hike (`mobile/src/lib/components/AccountTab.svelte:123-165`).

**Impact:** If the app's mile is wrong, every recommendation feels fake. Dad needs a direct correction path where he notices the wrong value.

**Fix direction:** Add "Fix mile" / "Update from GPS" actions on Today and Map, with a confirmation sheet using the same `updateCurrentMile` flow.

## P2 Findings

### P2-1: Field-critical text frequently falls below outdoor readability

**Evidence:** Global text floor is 0.8125 rem (`mobile/src/app.css:29`), and many critical labels go smaller: quick prompts 0.62-0.78 rem (`mobile/src/lib/components/CoachTab.svelte:261-289`), model chips 0.62-0.78 rem (`mobile/src/lib/components/ScoutModelStatusBubble.svelte:101-150`), Map labels 0.62-0.72 rem (`mobile/src/lib/components/MapTab.svelte:345-421`), Bible labels 0.6-0.7 rem (`mobile/src/lib/components/BibleReader.svelte:395-400`, `mobile/src/lib/components/BibleReader.svelte:631-643`).

**Impact:** The app will feel polished indoors and brittle outdoors. Bright sun plus older eyes turns secondary labels into invisible instructions.

**Fix direction:** Raise field-critical minimums to 15-16 px, reserve 12-13 px for nonessential metadata, and verify iOS Dynamic Type behavior.

### P2-2: Custom first-run modal lacks visible focus management

**Evidence:** The sheet is a custom dialog (`mobile/src/lib/components/HikeSetupSheet.svelte:58`) mounted over still-present app controls (`mobile/src/routes/+page.svelte:17-40`). There is no code-backed focus capture, initial focus, escape/back handling, or inert background.

**Impact:** VoiceOver / switch-control users may navigate behind the setup blocker or lose context.

**Fix direction:** Add focus trap/inert background and initial focus to the first actionable field. On iOS, verify VoiceOver rotor order.

### P2-3: Trail/Bible has too many small segmented modes

**Evidence:** Trail has Guide/Bible/Docs/Gear tabs (`mobile/src/lib/components/TrailTab.svelte:141-154`), Bible then has Browse/Read/Search/Ask (`mobile/src/lib/components/BibleReader.svelte:160-174`), and chapter selection is another scrollable strip (`mobile/src/lib/components/BibleReader.svelte:491-497`).

**Impact:** The library is powerful but mode-heavy. Dad has to remember whether to search Bible, ask Bible, ask Scout, or search Docs.

**Fix direction:** Make Search/Ask the default entry, preserve Browse for deliberate reading, and add recent/favorite passages with larger chapter controls.

### P2-4: On-device Scout status can imply more readiness than exists

**Evidence:** `OfflineStatus` hardcodes `Scout Gemma 4 (compact)` and labels the card "On-device Scout" from field-pack status (`mobile/src/lib/components/OfflineStatus.svelte:4-42`), while actual model readiness is separate in Account (`mobile/src/lib/components/AccountTab.svelte:185-255`).

**Impact:** A user can read "On-device Scout" and "Offline ready" as "AI is installed," when only the field pack may be ready.

**Fix direction:** Split "Field pack ready" from "AI model ready" everywhere. Use one consistent status vocabulary in Today, Scout, and Settings.

## Accessibility Notes

- WCAG 2.2 target-size risk: Map zoom controls, Trail segmented tabs, HikeSetup direction tabs, and Account compact buttons are below or near the 44 px mobile target (`mobile/src/lib/components/MapTab.svelte:491-499`, `mobile/src/lib/components/TrailTab.svelte:353-359`, `mobile/src/lib/components/HikeSetupSheet.svelte:284-289`, `mobile/src/lib/components/AccountTab.svelte:670-676`).
- WCAG 2.4.7 focus-visible is present globally (`mobile/src/app.css:71-77`), which is good.
- WCAG 3.3.2 labels are mostly present on forms, but first-run needs clearer instructions for non-mile-literate users.
- Nielsen status visibility is mixed: online/offline, weather source, and model progress exist, but too much status is compressed into tiny chips.

## Prioritized Fix Script

1. Add first-run support-circle setup: one required or strongly prompted contact step, plus "Need help opens SMS only when signal exists" in plain language.
2. Put a Safety/Help affordance on Today and/or the header. Keep Settings as the detailed place, but do not make distressed users hunt there.
3. Add first-run low-tech position options: Use GPS, Start at Springer, Pick nearby shelter/town, and exact AT mile.
4. Add "Fix mile" and "Update from GPS" beside the Today mile and Map current-position label.
5. Rebuild Scout as a single scroll surface with sticky composer and iOS keyboard-safe positioning.
6. Correct iOS model-download copy or implement true background download semantics. Until then, say the app must stay open/on Wi-Fi and show paused/stopped states.
7. Increase Map controls and labels: 44 px zoom buttons, larger current-position/next-water labels, one prominent "not navigation" banner.
8. Raise outdoor text minimums for operational content to 15-16 px; remove 0.6-0.7 rem labels from anything safety/model/map-related.
9. Simplify Trail/Bible entry: default to search/ask, make reading/browse a secondary path, and remove the internal chapter scroll trap.
10. Run iOS simulator/persona verification on small and large iPhones with VoiceOver, Dynamic Type, Reduce Motion, Low Power Mode, airplane mode, cellular/metered, no support contacts, no model, partial model download, and wrong-mile correction.

## Residual Risk

This assessment did not use browser preview and did not claim physical-device proof. The findings are code-backed and iOS-expectation-backed; final release confidence still requires an iOS simulator/physical-device pass for keyboard behavior, VoiceOver order, Dynamic Type, notification/download behavior, location prompts, SMS deep links, and real outdoor readability.
