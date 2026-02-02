# Unified Trail Map: Implementation Plan

**Goal:** Transform the AT Map into a video-game-style HUD that consolidates journey, navigation, and planning into one full-screen experience. Mobile-first.

## Current State

The existing `AtMap.svelte` (~1800 lines) already has:
- Full-screen Leaflet map with trail line
- Yellow draggable position marker
- Mile scrubber (0-2197) with ±5 buttons
- Weather card with forecast ribbon
- "Next" cards (water, shelter, resupply, crossing, stream)
- Layers modal (toggles for different POI types)
- Nearby drawer with tabbed lists
- GPS location support

**What's missing:**
- Journey context (which section you're in, progress %)
- Milestones and state boundaries on map
- Quick access to character/gear and budget
- Mail drop layer
- Prominent "ahead only" POI indicators in the HUD
- Progress visualization

---

## Design Spec: Mobile-First Video Game HUD

```
┌─────────────────────────────────────────┐
│ ┌─────────┐                 [👤] [$] [⚙] │  ← Top HUD
│ │Mile 847 │  VIRGINIA                    │
│ │ 38.5%   │  12% through section         │
│ └─────────┘                              │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              F U L L                     │
│              S C R E E N                 │
│              M A P                       │
│                                         │
│           [current position]            │
│                  ●                       │
│                                         │
├─────────────────────────────────────────┤
│ 🏠 3.2mi   💧 0.8mi   🛒 12.4mi   🌤️ 52°│  ← POI Bar (ahead only)
│ Springer  Creek     Damascus    Clear   │
├─────────────────────────────────────────┤
│ [-5] ═══════════●══════════════════ [+5]│  ← Scrubber
│              Mile 847                    │
└─────────────────────────────────────────┘
```

### Touch Targets
- All buttons ≥ 44px
- Bottom controls within thumb reach
- Swipe gestures for panels

---

## Implementation Tasks

### Phase 1: Reorganize Existing HUD

**1.1 Consolidate Top HUD**

Current top HUD shows:
```
[Mile box]                    [📍] [🌤️] [≡] [📍]
```

New top HUD:
```
[Mile + Progress]             [👤] [$] [⚙]
```

Changes:
- Combine mile display with progress percentage
- Add section name badge below mile number
- Replace weather/layers/nearby buttons with:
  - `👤` Character sheet (opens slide-in panel)
  - `$` Budget tracker (opens slide-in panel)
  - `⚙` Settings (replaces Layers button, same modal)
- Move location button to within the settings modal

**File:** `src/components/AtMap.svelte` lines 1319-1344

**New markup:**
```svelte
<div class="hudTop">
  <div class="hudLeft">
    <div class="hudMile">{selectedMile}</div>
    <div class="hudProgress">{progressPercent}% complete</div>
    <div class="hudSection">{currentSection?.name || 'Appalachian Trail'}</div>
  </div>

  <div class="hudRight">
    <button class="iconBtn" title="Character" on:click={() => characterOpen = true}>
      <svg><!-- hiker icon --></svg>
    </button>
    <button class="iconBtn" title="Budget" on:click={() => budgetOpen = true}>
      <svg><!-- dollar icon --></svg>
    </button>
    <button class="iconBtn" title="Settings" on:click={() => layersOpen = true}>
      <svg><!-- gear icon --></svg>
    </button>
  </div>
</div>
```

**1.2 Add POI Bar Above Scrubber**

New element between map and scrubber showing the next 3-4 POIs ahead:

```svelte
<div class="poiBar">
  <button class="poiItem" on:click={() => flyToMile(nextShelter?.mile)}>
    <span class="poiIcon">🏠</span>
    <span class="poiDist">{distAhead(nextShelter)}mi</span>
    <span class="poiName">{nextShelter?.name || '—'}</span>
  </button>
  <button class="poiItem" on:click={() => flyToMile(nextWater?.mile)}>
    <span class="poiIcon">💧</span>
    <span class="poiDist">{distAhead(nextWater)}mi</span>
    <span class="poiName">{nextWater?.name || '—'}</span>
  </button>
  <button class="poiItem" on:click={() => flyToMile(nextResupply?.mile)}>
    <span class="poiIcon">🛒</span>
    <span class="poiDist">{distAhead(nextResupply)}mi</span>
    <span class="poiName">{nextResupply?.name || '—'}</span>
  </button>
  <div class="poiWeather" on:click={() => wxDrawerOpen = true}>
    <span class="poiIcon">{wxIcon(wx?.current?.weather_code)}</span>
    <span class="poiTemp">{fmt(wx?.current?.temperature_2m, 0)}°</span>
  </div>
</div>
```

Styling: horizontal scroll if needed, glass-morphism background, compact.

**1.3 Simplify Bottom Scrubber**

Remove the "peek" button (info now in POI bar). Keep scrubber minimal:

```svelte
<div class="hudBottom">
  <div class="scrubRow">
    <button class="nudge" on:click={() => adjustMile(-5)}>−5</button>
    <input type="range" min="0" max="2197" bind:value={selectedMile} />
    <button class="nudge" on:click={() => adjustMile(5)}>+5</button>
  </div>
</div>
```

---

### Phase 2: Journey Context Data

**2.1 Add Trail Sections Data**

Create or import section boundaries. Source: `MilestoneCalculator.svelte` already has this:

```typescript
// src/data/trailSections.ts
export const TRAIL_SECTIONS = [
  { name: 'Georgia', state: 'GA', startMile: 0, endMile: 79, emoji: '🍑' },
  { name: 'North Carolina', state: 'NC', startMile: 79, endMile: 166, emoji: '🌲' },
  { name: 'Smokies', state: 'TN', startMile: 166, endMile: 241, emoji: '🐻' },
  { name: 'Tennessee', state: 'TN', startMile: 241, endMile: 298, emoji: '🎸' },
  { name: 'Virginia', state: 'VA', startMile: 298, endMile: 550, emoji: '🏔️' },
  { name: 'Shenandoah', state: 'VA', startMile: 550, endMile: 634, emoji: '🦌' },
  { name: 'West Virginia', state: 'WV', startMile: 634, endMile: 1025, emoji: '⛰️' },
  { name: 'Maryland', state: 'MD', startMile: 1025, endMile: 1065, emoji: '🦀' },
  { name: 'Pennsylvania', state: 'PA', startMile: 1065, endMile: 1290, emoji: '🪨' },
  { name: 'New Jersey', state: 'NJ', startMile: 1290, endMile: 1360, emoji: '🌳' },
  { name: 'New York', state: 'NY', startMile: 1360, endMile: 1469, emoji: '🗽' },
  { name: 'Connecticut', state: 'CT', startMile: 1469, endMile: 1538, emoji: '🍂' },
  { name: 'Massachusetts', state: 'MA', startMile: 1538, endMile: 1623, emoji: '🦃' },
  { name: 'Vermont', state: 'VT', startMile: 1623, endMile: 1773, emoji: '🧀' },
  { name: 'New Hampshire', state: 'NH', startMile: 1773, endMile: 1912, emoji: '🏔️' },
  { name: 'Maine', state: 'ME', startMile: 1912, endMile: 2197.4, emoji: '🦞' },
];

export function getSectionForMile(mile: number) {
  return TRAIL_SECTIONS.find(s => mile >= s.startMile && mile < s.endMile);
}

export function getSectionProgress(mile: number) {
  const section = getSectionForMile(mile);
  if (!section) return null;
  const sectionLength = section.endMile - section.startMile;
  const milesIntoSection = mile - section.startMile;
  return {
    section,
    percent: Math.round((milesIntoSection / sectionLength) * 100),
    milesInto: milesIntoSection,
    milesRemaining: sectionLength - milesIntoSection,
  };
}
```

**2.2 Add Milestones Data**

```typescript
// src/data/trailMilestones.ts
export const MILESTONES = [
  { mile: 100, name: 'First Century', emoji: '💯' },
  { mile: 500, name: 'Quarter Done', emoji: '🎉' },
  { mile: 1000, name: 'Thousand Miles', emoji: '🏆' },
  { mile: 1099, name: 'Halfway!', emoji: '⚡' },
  { mile: 2000, name: 'Almost Home', emoji: '🔥' },
  { mile: 2197.4, name: 'Summit!', emoji: '🎊' },
];

export function getNextMilestone(mile: number) {
  return MILESTONES.find(m => m.mile > mile);
}
```

**2.3 Add State Boundaries**

```typescript
// src/data/stateBoundaries.ts
export const STATE_BOUNDARIES = [
  { mile: 79, from: 'GA', to: 'NC' },
  { mile: 166, from: 'NC', to: 'TN' },
  // ... etc
];
```

**2.4 Derive Progress in AtMap**

```svelte
<script>
  import { TRAIL_SECTIONS, getSectionForMile, getSectionProgress } from '../data/trailSections';
  import { getNextMilestone } from '../data/trailMilestones';

  const progressPercent = $derived.by(() =>
    Math.round((selectedMile / 2197.4) * 100)
  );

  const currentSection = $derived.by(() =>
    getSectionProgress(selectedMile)
  );

  const nextMilestone = $derived.by(() =>
    getNextMilestone(selectedMile)
  );
</script>
```

---

### Phase 3: New Slide-in Panels

**3.1 Character Panel**

Triggered by 👤 button. Shows quick gear summary from `character.svelte.ts`:

```svelte
{#if characterOpen}
  <div class="slidePanel right">
    <div class="panelHeader">
      <h2>Gear</h2>
      <button class="closeBtn" on:click={() => characterOpen = false}>×</button>
    </div>
    <div class="panelContent">
      <div class="statRow">
        <span class="label">Base Weight</span>
        <span class="value">{baseWeight} lb</span>
      </div>
      <div class="statRow">
        <span class="label">Pack Weight</span>
        <span class="value">{packWeight} lb</span>
      </div>
      <div class="statRow">
        <span class="label">Warmth Index</span>
        <span class="value">{warmthIndex}</span>
      </div>
      <a class="panelLink" href="/character">Full gear list →</a>
    </div>
  </div>
{/if}
```

**3.2 Budget Panel**

Triggered by $ button. Shows budget summary:

```svelte
{#if budgetOpen}
  <div class="slidePanel right">
    <div class="panelHeader">
      <h2>Budget</h2>
      <button class="closeBtn" on:click={() => budgetOpen = false}>×</button>
    </div>
    <div class="panelContent">
      <div class="statRow">
        <span class="label">Daily Budget</span>
        <span class="value">${dailyBudget}</span>
      </div>
      <div class="statRow">
        <span class="label">Next Town Cost</span>
        <span class="value">${nextTownCost}</span>
      </div>
      <div class="statRow">
        <span class="label">Projected Total</span>
        <span class="value">${projectedTotal}</span>
      </div>
      <a class="panelLink" href="/tools#budget">Full budget →</a>
    </div>
  </div>
{/if}
```

---

### Phase 4: Enhanced Map Layers

**4.1 Add Mail Drop Layer**

Add to existing layer system:

```typescript
let showMailDrops = $state(false);

// In loadMilepostsAndBuildLayers:
for (const stop of RESUPPLY_STOPS) {
  if (!stop.mailDrop) continue;
  const ll = coordForMile(stop.mile);
  if (!ll) continue;

  L.marker(ll, {
    icon: L.divIcon({
      className: 'mail-drop-icon',
      html: '📫',
      iconSize: [24, 24],
    })
  })
    .bindPopup(`<b>${stop.name}</b><br/>Mile ${stop.mile}<br/>Mail drop available`)
    .addTo(mailDropLayer);
}
```

Add toggle to Layers modal:
```svelte
<label class="t">
  <input type="checkbox" bind:checked={showMailDrops} />
  <span>Mail drops (📫)</span>
</label>
```

**4.2 Add Milestone Markers**

```typescript
// In loadMilepostsAndBuildLayers:
for (const m of MILESTONES) {
  const ll = coordForMile(m.mile);
  if (!ll) continue;

  L.marker(ll, {
    icon: L.divIcon({
      className: 'milestone-icon',
      html: m.emoji,
      iconSize: [28, 28],
    })
  })
    .bindPopup(`<b>${m.name}</b><br/>Mile ${m.mile}`)
    .addTo(milestoneLayer);
}
```

**4.3 Add State Boundary Lines**

```typescript
// Draw a short perpendicular line at each state boundary
for (const b of STATE_BOUNDARIES) {
  const ll = coordForMile(b.mile);
  if (!ll) continue;

  // Create a small marker or line segment
  L.circleMarker(ll, {
    radius: 8,
    color: '#f97316',
    fillColor: '#fff',
    fillOpacity: 1,
    weight: 3,
  })
    .bindPopup(`<b>${b.from} → ${b.to}</b><br/>Mile ${b.mile}`)
    .addTo(boundaryLayer);
}
```

---

### Phase 5: Remove Dashboard Cards

The current "dashboard" cards below the map duplicate info now in the POI bar. Remove them entirely to keep focus on the map.

Delete lines ~1466-1572 (the `<div class="dashboard">` block and related styles).

---

### Phase 6: Polish & Animations

**6.1 Fly-to on POI Click**

When user taps a POI in the bar, smoothly fly the map to that location:

```typescript
function flyToMile(mile: number | undefined) {
  if (mile == null) return;
  selectedMile = mile;
  centerOnSelectedFn?.();
}
```

**6.2 Section Change Animation**

When crossing into a new section, briefly show a celebration toast:

```svelte
let sectionToast = $state<string | null>(null);

$effect(() => {
  const section = getSectionForMile(selectedMile);
  // Compare to previous section, show toast if changed
});
```

**6.3 Progress Ring (Optional)**

For extra visual flair, add a small progress ring around the position marker:

```css
:global(.hc-mile-pin__ring) {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #f97316;
  animation: spin 2s linear infinite;
}
```

---

## Data Dependencies

Files to create:
1. `src/data/trailSections.ts` - Section boundaries and helpers
2. `src/data/trailMilestones.ts` - Milestone definitions

Files to modify:
1. `src/components/AtMap.svelte` - Main implementation
2. `src/data/resupplyStops.ts` - Already has mailDrop field ✓

Stores to import:
1. `src/stores/character.svelte.ts` - For gear stats
2. `src/stores/trailContext.svelte.ts` - For saved position

---

## Mobile Considerations

- POI bar should scroll horizontally if cramped
- Panels slide from right edge (80% width max)
- Scrubber must be thick enough for thumb control (current is good)
- Consider hiding section name on very small screens
- Weather in POI bar shows icon + temp only (no text)

---

## Testing Checklist

- [ ] Mile scrubber updates all derived values
- [ ] POI bar shows correct "ahead" distances
- [ ] Tapping POI flies map to that location
- [ ] Character panel opens and shows gear stats
- [ ] Budget panel opens and shows budget summary
- [ ] Mail drops layer toggles correctly
- [ ] Milestone markers appear on map
- [ ] State boundaries visible
- [ ] Section name updates as you scrub
- [ ] Progress percentage is accurate
- [ ] Works on iPhone Safari (thumb reach)
- [ ] Works on Android Chrome
- [ ] Panels close with Escape key
- [ ] No console errors

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/data/trailSections.ts` | CREATE |
| `src/data/trailMilestones.ts` | CREATE |
| `src/components/AtMap.svelte` | MODIFY (extensive) |

---

## Implementation Order

1. Create data files (sections, milestones)
2. Refactor top HUD (remove old buttons, add new)
3. Add POI bar
4. Remove dashboard cards
5. Add slide-in panels (character, budget)
6. Add new map layers (mail drops, milestones, boundaries)
7. Polish animations and transitions
8. Mobile testing pass

---

## Notes for Implementing Agent

- The current `AtMap.svelte` is ~1800 lines. Read it carefully before modifying.
- Use existing patterns (glass-morphism, backdrop-filter, Oswald font)
- The `$derived.by()` pattern is used throughout - maintain consistency
- Weather fetching is already debounced - don't duplicate
- The Leaflet instance is created in `onMount` - any new layers go there
- Test on mobile frequently - this is mobile-first
