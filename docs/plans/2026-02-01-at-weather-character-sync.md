# AT Weather ↔ Character Sync (v1)

Date: 2026-02-01

## Goal
Make `/at-weather` feel like a first-class part of the Character system:

- `/at-weather` defaults to the Character’s current mile when available.
- Users can freely explore (slider/drag/click) without changing their “official” mile.
- Users can explicitly **lock in** their current mile via:
  - manual confirm (set preview → current)
  - GPS sync (find nearest mile → set current)
- Character page provides a fast, mobile-friendly path into weather and GPS syncing.

## Definitions
- **Preview mile**: the mile currently displayed on the weather page (explore-mode).
- **Current mile (Character)**: the canonical mile stored in `character.trail.currentMile` via `trailContext.updateContext()`.

## Source of Truth
- Canonical: `trailContext` (which persists to the Character store).

## `/at-weather` initial mile selection priority
1) URL param `?mile=` (shareable deep-link) → preview
2) Character current mile (if Character exists) → preview
3) localStorage `hcAtWeather.previewMile` → preview
4) fallback `0`

## `/at-weather` interactions
- Slider / map click / marker drag:
  - updates **preview mile**
  - updates URL `?mile=` (share link)
  - persists last preview mile to localStorage (`hcAtWeather.previewMile`)
  - DOES NOT update Character current mile

- Buttons:
  - **Set as Current Mile**: `updateContext({ currentMile: previewMile })`
  - **Use my location (preview)**: geolocate → nearest mile → set preview mile
  - **Sync GPS → Current Mile**: geolocate → nearest mile → set preview mile AND `updateContext({ currentMile: mile })`

## Temperature display (transparent)
- **Forecast (Open‑Meteo model point)**:
  - temperature from forecast response
  - model elevation from forecast response (`wx.elevation`, meters)

- **Estimated at trail elevation**:
  - trail elevation from Open‑Meteo elevation endpoint (`/v1/elevation`, meters)
  - lapse-rate adjustment: ~3.6°F / 1000 ft
  - show Δft and Δ°F explicitly

## Character page integration
In Character → Trail tab:
- Add quick actions:
  - **Open AT Weather** → `/at-weather?mile=<currentMile>`
  - **Sync GPS → Current Mile** → same nearest-mile logic + `updateContext({ currentMile })`

## Mobile friendliness
- On mobile, forecast content is shown before the map.
- GPS and lock-in controls have large tap targets.
- Keep “current vs preview” status visible and obvious.
