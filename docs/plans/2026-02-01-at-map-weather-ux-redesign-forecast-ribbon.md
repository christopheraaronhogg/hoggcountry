# AT Map Weather UX Redesign — Forecast Ribbon Plan (2026-02-01)

Context: `/at-map` is now map-first with a custom HUD + mile scrubber + dashboard cards. The current weather time selection (many chips: Now, +3h, +6h, … +10d) is too dense for mobile.

## Goals
- Keep the **map usable/visible** (no giant panels)
- **Thumb-friendly** interactions
- Weather + POIs update reactively to the selected mile marker
- Support both **near-term hourly** (+3/+6/+9/+12/+24h) and **multi-day** outlook
- Avoid excessive Open‑Meteo calls while scrubbing miles

---

## 1) UX critique (current)
- Chip row causes scroll fatigue and precision tapping issues on small screens.
- Hourly vs multi-day has no hierarchy; everything looks “equally important.”
- Spatial vs temporal controls feel disconnected (mile scrub + time chips).
- Gesture conflicts (vertical page scroll + horizontal chip scroll).

---

## 2) Alternative interaction models

### A) Dual-axis scrubber (vertical swipe for time)
- Swipe up/down on weather card to move through discrete time offsets.
- Pros: removes chips; aligns with gesture-based exploration.
- Cons: discoverability; conflicts with page scrolling.

### B) Forecast Ribbon (recommended)
- A compact horizontal ribbon of segments.
- Each segment: icon + temp + label (Now, +3h, +6h, +12h, Tomorrow…) + optional POP badge.
- Tap segment => expand details.
- Scroll ribbon to reveal extended days (+2d..+10d) without overwhelming.
- Pros: glanceable + progressive disclosure; larger hit targets; mobile-friendly.
- Cons: still horizontal, needs careful layout for 320px.

### C) Hourly/Multi-day modes (time dial)
- Segmented control toggles Hourly vs Multi-day.
- Pros: clean separation.
- Cons: adds mode friction; radial UI learning curve.

---

## 3) Recommended model: Forecast Ribbon + Detail Panel

### Components
- **Weather Card Header**: “Weather at Mile {mile}” (optionally add nearest landmark later)
- **Forecast Ribbon**: 6 visible segments, horizontally scrollable.
  - Default visible: Now, +3h, +6h, +12h, Tomorrow, “More ›” (fade cue)
  - Scroll reveals: +2d, +3d, +5d, +7d, +10d
- **Detail Panel** (inside the weather card)
  - For hourly selections: conditions, temp/feels, wind/gust, precip/POP
  - For daily selections: High/Low, wind max, POP max

### Behaviors
- Tap segment => select + show detail
- Ribbon scroll => browse time; no giant chip row
- Mile scrub => show lightweight loading state; update forecast when scrub settles (debounced)
- Error/offline state: show cached forecast when available + microcopy

### Microcopy
- Loading: “Loading forecast…”
- Offline: “Offline — showing cached forecast”
- Error: “Forecast unavailable — tap to retry”

---

## 4) Implementation plan (repo-specific)

### Files
- Primary: `src/components/AtMap.svelte`
- Reference/logic reuse: `src/components/AtWeather.svelte`
- New components (suggested):
  - `src/components/atmap/ForecastRibbon.svelte`
  - `src/components/atmap/ForecastSegment.svelte`
  - `src/components/atmap/WeatherDetail.svelte`
- Shared util/store (suggested):
  - `src/lib/weather/openMeteo.ts` (fetch + parse)
  - `src/lib/weather/cache.ts` (TTL + bucketed coords)

### Data flow
- Fetch Open‑Meteo **once per coordinate bucket** (e.g. lat/lon rounded) and cache for TTL (10 min).
- Parse response once; derive:
  - Hourly values by selecting index relative to `current.time`
  - Daily values by date index

### Debounce/caching strategy
- **Trailing debounce** for mile scrub: fetch only after ~300ms idle.
- **AbortController** to cancel in-flight request when mile changes.
- **Coordinate bucketing** (e.g. `lat.toFixed(2), lon.toFixed(2)`) to reduce redundant calls.
- **LRU-ish cache cap** (e.g. max 100 buckets) to prevent unbounded growth.

---

## 5) Accessibility + performance
- 44×44px min touch targets for ribbon segments.
- Segment listbox semantics (`role=listbox` / `role=option`, `aria-selected`).
- Keyboard: arrows navigate; Enter selects; Escape returns to “Now.”
- Respect `prefers-reduced-motion` (disable transitions).
- Avoid jank: keep Leaflet overlays independent; do not re-render map on time selection.

---

## 6) Mobile validation checklist
- 320px width: no overflow; segment labels readable.
- 428px width: ribbon shows more segments without cramping.
- Mile scrubbing: no flood of API calls; forecast updates after settle.
- Segment selection: haptic optional (`navigator.vibrate`) and visible selected state.
- Offline/error: good fallback + retry.

---

## Next steps
- Replace current time-chip UI in `AtMap.svelte` with Forecast Ribbon.
- Keep “Full forecast →” deep-link to `/at-weather?mile=...` as an escape hatch.
