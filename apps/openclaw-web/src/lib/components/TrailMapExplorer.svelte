<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  // Relative import (not $lib) so the legacy Astro site can mount this
  // component cross-tree until the Forge cutover retires that build.
  import type {
    LatLon,
    TrailMapElevationPoint,
    TrailMapMilepoint,
    TrailMapPack,
    TrailMapPoint,
    TrailMapWaypoint
  } from '../map-pack-types';
  // Relative import (same reason as map-pack-types) so the legacy Astro site
  // can mount this component cross-tree until the Forge cutover retires it.
  import {
    TRAIL_TIME_ZONE,
    buildDayOptions,
    dayKeyFor,
    listTrackedDays,
    pointsForDay,
    relativeDayLabel,
    shortDayLabel,
    summarizeDay,
    type DayElevationSample,
    type DayOption,
    type DaySummary
  } from '../trail/day-replay';

  type TerrainMode = 'grade' | 'rockiness' | 'difficulty';
  type PlaceMode = 'core' | 'access' | 'camp' | 'view';

  const {
    endpoint = '/track/map-pack',
    title = 'Trail Map',
    appMode = false,
    publicRoute = false
  } = $props<{
    endpoint?: string;
    title?: string;
    appMode?: boolean;
    publicRoute?: boolean;
  }>();

  let host = $state<HTMLDivElement | null>(null);
  let pack = $state<TrailMapPack | null>(null);
  let loading = $state(true);
  let errorMessage = $state('');
  let terrainMode = $state<TerrainMode>('difficulty');
  let placeMode = $state<PlaceMode>('core');
  let selectedHistoryIndex = $state(0);
  let inspectedMile = $state<number | null>(null);
  let scrubbing = $state(false);
  let lastScrubUpdate = 0;
  let scrubHintVisible = $state(false);
  const SCRUB_HINT_KEY = 'hoggcountry.atmap.scrubHint.v1';

  function dismissScrubHint() {
    if (!scrubHintVisible) return;
    scrubHintVisible = false;
    try {
      localStorage.setItem(SCRUB_HINT_KEY, 'seen');
    } catch {
      // private mode etc.
    }
  }
  let layersOpen = $state(false);
  // Day replay: an optional "what did Dad do on <day>?" filter layered over the
  // default live view. `viewMode` stays 'live' unless a day is picked.
  let daysOpen = $state(false);
  let viewMode = $state<'live' | 'day'>('live');
  let selectedDay = $state<string | null>(null);
  // Desktop docks the bottom sheet as a left side panel (maps-app style) so the
  // map stays visible instead of a full-bleed sheet burying it. Mobile keeps
  // the draggable bottom sheet untouched.
  let isWide = $state(false);
  // Bottom-sheet snap state: 0 = peek (glanceable summary), 1 = full. Two rest
  // positions only — no in-between half-snap.
  let sheetSnap = $state<0 | 1>(0);
  let shellEl = $state<HTMLElement | null>(null);
  let capEl = $state<HTMLElement | null>(null);
  let capHeight = $state(170);
  let viewHeight = $state(0);
  let dragging = $state(false);
  let dragHeight = $state<number | null>(null);
  let dragStartY = 0;
  let dragStartHeight = 0;
  const detailsOpen = $derived(sheetSnap >= 1);

  // Snap to explicit sheet heights rather than translating a full-height
  // panel: peek shows exactly the measured header, full is a viewport
  // fraction. Setting height directly keeps the collapsed state pinned to
  // the header no matter how the detail body reflows after data loads.
  function snapHeights(): [number, number] {
    const vh = viewHeight || shellEl?.clientHeight || 800;
    return [capHeight, Math.round(vh * 0.86)];
  }

  const sheetHeight = $derived.by(() => {
    if (dragging && dragHeight !== null) return dragHeight;
    void sheetSnap;
    void capHeight;
    void viewHeight;
    return snapHeights()[sheetSnap];
  });

  function beginSheetDrag(event: PointerEvent) {
    dragging = true;
    dragStartY = event.clientY;
    dragStartHeight = snapHeights()[sheetSnap];
    dragHeight = dragStartHeight;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function moveSheetDrag(event: PointerEvent) {
    if (!dragging) return;
    const heights = snapHeights();
    // Dragging up (clientY decreases) grows the sheet.
    dragHeight = clamp(dragStartHeight + (dragStartY - event.clientY), heights[0], heights[1]);
  }

  function endSheetDrag() {
    if (!dragging) return;
    dragging = false;
    const heights = snapHeights();
    const current = dragHeight ?? heights[sheetSnap];
    let best: 0 | 1 = 0;
    let bestDist = Infinity;
    heights.forEach((height, index) => {
      const dist = Math.abs(height - current);
      if (dist < bestDist) {
        bestDist = dist;
        best = index as 0 | 1;
      }
    });
    sheetSnap = best;
    dragHeight = null;
  }

  function cycleSheet() {
    sheetSnap = sheetSnap === 1 ? 0 : 1;
  }

  function zoomBy(delta: number) {
    if (!map) return;
    map.setZoom(clamp(map.getZoom() + delta, 3, 17));
  }

  let lastRenderedTerrainMode: TerrainMode | null = null;
  let lastRenderedPlaceMode: PlaceMode | null = null;
  let lastRenderedMile = -1;

  let mediaCleanup: (() => void) | null = null;
  let L: any = null;
  // $state so the render effects below stay subscribed: their `!map || !pack`
  // guard short-circuits on map while it is still null, and a non-reactive
  // map would leave a first run with zero tracked dependencies — dead forever.
  let map = $state<any>(null);
  let routeLayer: any = null;
  let terrainLayer: any = null;
  let placesLayer: any = null;
  let trackerLayer: any = null;
  let mileLayer: any = null;
  let selectedMarker: any = null;

  const history = $derived.by(() => pack?.tracker.history ?? []);
  const currentPoint = $derived.by(() => pack?.tracker.current ?? null);
  const selectedPoint = $derived.by(() => {
    if (!history.length) return currentPoint;
    return history[Math.max(0, Math.min(history.length - 1, selectedHistoryIndex))] ?? currentPoint;
  });
  const selectedMile = $derived.by(() => inspectedMile ?? selectedPoint?.mile ?? currentPoint?.mile ?? 0);
  // Waypoints/terrain/elevation are on the OSM measured scale (~2106 mi);
  // selection miles are canonical 2197.4. Convert at the lookup boundary.
  const measuredFactor = $derived.by(() => {
    const route = pack?.route;
    return route && route.measuredMiles > 0 && route.displayMiles > 0
      ? route.measuredMiles / route.displayMiles
      : 1;
  });
  const selectedMileMeasured = $derived(selectedMile * measuredFactor);
  // The product's mile frame: the tracker pipeline reports each milepost's
  // scaledTrailMiles (the source data's official mileage), not the uniformly
  // rescaled `mile` label, which drifts up to ~23 mi away from it mid-trail.
  // Every mile the map shows must sit in the same frame as the live banner.
  function milepostMile(post: { mile: number; scaledTrailMiles: number | null }): number {
    return post.scaledTrailMiles ?? post.mile;
  }
  // Cumulative mile index over the dense route, calibrated against the
  // milepost skeleton. Raw flat-earth distance along the downsampled vector
  // underruns the official mileage unevenly (uniform normalization drifted
  // ~35 mi off the milepost frame mid-trail), so each milepost is matched to
  // its spot along the route and every point's raw distance is interpolated
  // between those control pairs. Miles here are banner-frame (milepostMile),
  // so tap/drag readouts agree with the live tracker.
  const routeMileIndex = $derived.by(() => {
    const segments = pack?.route.segments ?? [];
    const mileposts = pack?.milepoints ?? [];
    if (!segments.length) return [] as { miles: number[]; points: LatLon[] }[];

    let cumulative = 0;
    const indexed = segments.map((points) => {
      const miles: number[] = [];
      for (let i = 0; i < points.length; i += 1) {
        if (i > 0) {
          const [lat1, lon1] = points[i - 1];
          const [lat2, lon2] = points[i];
          const cosLat = Math.cos((lat1 * Math.PI) / 180);
          const dLat = (lat2 - lat1) * 69.05;
          const dLon = (lon2 - lon1) * 69.17 * cosLat;
          cumulative += Math.hypot(dLat, dLon);
        }
        miles.push(cumulative);
      }
      return { miles, points };
    });

    if (!mileposts.length || cumulative <= 0) return indexed;

    const flatPoints: LatLon[] = [];
    const flatRaw: number[] = [];
    for (const segment of indexed) {
      for (let i = 0; i < segment.points.length; i += 1) {
        flatPoints.push(segment.points[i]);
        flatRaw.push(segment.miles[i]);
      }
    }

    // Forward sweep: match each milepost to the nearest route point at or
    // ahead of the previous match, producing monotonic
    // (raw distance, canonical mile) control pairs.
    const WINDOW = 400;
    const controlRaw: number[] = [];
    const controlMile: number[] = [];
    let cursor = 0;
    for (const post of mileposts) {
      const cosLat = Math.cos((post.lat * Math.PI) / 180);
      const limit = Math.min(flatPoints.length - 1, cursor + WINDOW);
      let bestIndex = -1;
      let bestDistSq = Infinity;
      for (let i = cursor; i <= limit; i += 1) {
        const dLat = flatPoints[i][0] - post.lat;
        const dLon = (flatPoints[i][1] - post.lon) * cosLat;
        const distSq = dLat * dLat + dLon * dLon;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestIndex = i;
        }
      }
      if (bestIndex < 0) continue;
      const raw = flatRaw[bestIndex];
      const postMile = milepostMile(post);
      const last = controlRaw.length - 1;
      if (last >= 0 && (raw <= controlRaw[last] + 1e-6 || postMile <= controlMile[last])) {
        cursor = Math.max(cursor, bestIndex);
        continue;
      }
      controlRaw.push(raw);
      controlMile.push(postMile);
      cursor = bestIndex;
    }

    if (controlRaw.length < 2) return indexed;

    // Remap every point's raw distance through the control pairs. Points are
    // visited in ascending raw order, so a single advancing pointer suffices;
    // the ends extrapolate linearly from the outermost pairs.
    let pair = 0;
    const rawToMile = (raw: number): number => {
      while (pair < controlRaw.length - 2 && controlRaw[pair + 1] < raw) pair += 1;
      const r0 = controlRaw[pair];
      const r1 = controlRaw[pair + 1];
      const t = r1 > r0 ? (raw - r0) / (r1 - r0) : 0;
      return controlMile[pair] + (controlMile[pair + 1] - controlMile[pair]) * t;
    };
    for (const segment of indexed) {
      for (let i = 0; i < segment.miles.length; i += 1) {
        segment.miles[i] = rawToMile(segment.miles[i]);
      }
    }

    return indexed;
  });

  // Nearest position ON the dense route to a lat/lon: coarse stride pass,
  // then exact projection onto segments in the winning neighborhood. Returns
  // the banner-frame mile so callers match the live tracker readout.
  function nearestRoutePosition(lat: number, lon: number): { lat: number; lon: number; mile: number } | null {
    const indexed = routeMileIndex;
    if (!indexed.length) return null;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    const STRIDE = 16;
    let bestSegment = -1;
    let bestIndex = 0;
    let bestDistSq = Infinity;

    for (let si = 0; si < indexed.length; si += 1) {
      const points = indexed[si].points;
      for (let i = 0; i < points.length; i += STRIDE) {
        const dLat = points[i][0] - lat;
        const dLon = (points[i][1] - lon) * cosLat;
        const distSq = dLat * dLat + dLon * dLon;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestSegment = si;
          bestIndex = i;
        }
      }
    }

    if (bestSegment < 0) return null;
    const segment = indexed[bestSegment];
    const from = Math.max(0, bestIndex - STRIDE);
    const to = Math.min(segment.points.length - 2, bestIndex + STRIDE);
    let best: { lat: number; lon: number; mile: number } | null = null;
    let bestProjDistSq = Infinity;

    for (let i = from; i <= to; i += 1) {
      const [aLat, aLon] = segment.points[i];
      const [bLat, bLon] = segment.points[i + 1];
      const abLat = bLat - aLat;
      const abLon = (bLon - aLon) * cosLat;
      const lengthSq = abLat * abLat + abLon * abLon;
      const t = lengthSq > 0
        ? clamp(((lat - aLat) * abLat + (lon - aLon) * cosLat * abLon) / lengthSq, 0, 1)
        : 0;
      const projLat = aLat + (bLat - aLat) * t;
      const projLon = aLon + (bLon - aLon) * t;
      const dLat = projLat - lat;
      const dLon = (projLon - lon) * cosLat;
      const distSq = dLat * dLat + dLon * dLon;
      if (distSq < bestProjDistSq) {
        bestProjDistSq = distSq;
        best = {
          lat: projLat,
          lon: projLon,
          mile: segment.miles[i] + (segment.miles[i + 1] - segment.miles[i]) * t
        };
      }
    }

    return best;
  }

  // Exact position on the dense route for a canonical mile (binary search the
  // calibrated index). Falls back to milepost interpolation off-route.
  function routePositionAtMile(canonicalMile: number): LatLon | null {
    for (const segment of routeMileIndex) {
      const miles = segment.miles;
      if (!miles.length || canonicalMile < miles[0] || canonicalMile > miles[miles.length - 1]) continue;
      let lo = 0;
      let hi = miles.length - 1;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (miles[mid] <= canonicalMile) lo = mid;
        else hi = mid;
      }
      const span = miles[hi] - miles[lo];
      const t = span > 0 ? (canonicalMile - miles[lo]) / span : 0;
      const [aLat, aLon] = segment.points[lo];
      const [bLat, bLon] = segment.points[hi];
      return [aLat + (bLat - aLat) * t, aLon + (bLon - aLon) * t];
    }
    return coordForMile(canonicalMile);
  }

  // Slice the dense route between two measured-frame miles (terrain data
  // lives on the ~2,106 OSM scale); the index itself is canonical, so convert
  // at this boundary. Returns one or more polyline paths (the route can have
  // gaps between segments).
  function pathsForMileRange(startMile: number, endMile: number): LatLon[][] {
    const startCanonical = startMile / measuredFactor;
    const endCanonical = endMile / measuredFactor;
    const paths: LatLon[][] = [];
    for (const segment of routeMileIndex) {
      const run: LatLon[] = [];
      for (let i = 0; i < segment.points.length; i += 1) {
        const mile = segment.miles[i];
        if (mile >= startCanonical && mile <= endCanonical) {
          run.push(segment.points[i]);
        } else if (run.length) {
          break;
        }
      }
      if (run.length >= 2) paths.push(run);
    }
    return paths;
  }
  // What the orange marker and "Selected" tile represent: a tapped trail mile
  // when inspecting, otherwise the scrubbed/live Garmin point.
  const displayedSelection = $derived.by(() => {
    if (inspectedMile !== null) {
      const coord = routePositionAtMile(inspectedMile) ?? coordForMile(inspectedMile);
      if (coord) return { lat: coord[0], lon: coord[1], mile: inspectedMile, observedAt: null as string | null };
    }
    if (!selectedPoint) return null;
    return {
      lat: selectedPoint.lat,
      lon: selectedPoint.lon,
      mile: selectedPoint.mile,
      observedAt: selectedPoint.observedAt as string | null
    };
  });
  // Official display frame (2,197.4) — the same total /journey, /app/progress,
  // and the homepage teaser use, so every surface agrees on percent and total.
  const totalMiles = $derived(pack?.route.displayMiles ?? null);
  const progressLine = $derived.by(() => {
    if (!currentPoint || !totalMiles) return '';
    const pct = clamp((currentPoint.mile / totalMiles) * 100, 0, 100);
    const remaining = Math.max(0, totalMiles - currentPoint.mile);
    return `${pct.toFixed(0)}% of ${Math.round(totalMiles).toLocaleString()} mi · ${Math.round(remaining).toLocaleString()} mi to Katahdin`;
  });
  const progressPct = $derived.by(() => {
    if (!currentPoint || !totalMiles) return 0;
    return clamp((currentPoint.mile / totalMiles) * 100, 0, 100);
  });
  const remainingMiles = $derived.by(() =>
    currentPoint && totalMiles ? Math.max(0, totalMiles - currentPoint.mile) : 0
  );
  const signalIsLive = $derived.by(() => {
    if (!currentPoint?.observedAt) return false;
    const observed = new Date(currentPoint.observedAt).getTime();
    if (Number.isNaN(observed)) return false;
    const staleAfterMinutes = pack?.tracker.staleAfterMinutes ?? 360;
    return Date.now() - observed <= staleAfterMinutes * 60000;
  });
  // --- Freshness / confidence -------------------------------------------
  // Garmin only shows a dot; the HUD explains how much to trust it.
  type SignalState = 'live' | 'stale' | 'preview' | 'none';
  const signalState = $derived.by<SignalState>(() => {
    if (!currentPoint) return 'none';
    if (pack?.tracker.source === 'preview') return 'preview';
    return signalIsLive ? 'live' : 'stale';
  });
  const freshnessLabel = $derived.by(() => {
    if (!currentPoint) return loading ? 'Locating…' : 'Tracker offline';
    if (signalState === 'preview') return 'Preview · awaiting first fix';
    if (signalState === 'live') return `Live · ${relativeTime(currentPoint.observedAt)}`;
    return `Last fix ${relativeTime(currentPoint.observedAt)}`;
  });
  const freshChipLabel = $derived.by(() =>
    signalState === 'live' ? 'Live' : signalState === 'stale' ? 'Stale' : signalState === 'preview' ? 'Preview' : 'Offline'
  );
  // Composed in script so the " · state" separator keeps its spaces (Svelte
  // trims whitespace at the start of an {#if} block in the template).
  const pillSubtitle = $derived.by(() => (currentState ? `${freshnessLabel} · ${currentState}` : freshnessLabel));
  // Dad's current position in the measured frame used by the terrain lookups
  // (matches selectedMileMeasured; collapses to the official mile once the
  // pack is calibrated, which production always is). Null when the fix has no
  // calibrated mile — never fall back to 0, which would falsely report the
  // mile-0 state (Georgia) and a Springer-area "just passed" as if true.
  const currentMileMeasured = $derived.by(() =>
    currentPoint && Number.isFinite(currentPoint.mile) ? (currentPoint.mile as number) * measuredFactor : null
  );
  const currentState = $derived.by(() =>
    currentMileMeasured !== null ? nearestElevation(currentMileMeasured)?.state ?? '' : ''
  );
  // What Dad most recently passed (nearest shelter / town / summit behind his
  // current mile) — answers "what did he just pass?".
  const justPassed = $derived.by<TrailMapWaypoint | null>(() => {
    if (currentMileMeasured === null) return null;
    const behind = [
      prevWaypoint(pack?.waypoints.shelters ?? [], currentMileMeasured),
      prevWaypoint(pack?.waypoints.towns ?? [], currentMileMeasured),
      prevWaypoint(pack?.waypoints.summits ?? [], currentMileMeasured)
    ].filter((point): point is TrailMapWaypoint => point !== null);
    if (!behind.length) return null;
    return behind.reduce((best, point) => (point.mile > best.mile ? point : best));
  });

  // --- Day replay --------------------------------------------------------
  // Terrain miles arrive on the calibrated official frame in production
  // (measuredFactor === 1). The fast path avoids re-allocating the big arrays;
  // the divide keeps the pure day-summary correct if the pack ever ships the
  // raw measured frame, so its slices line up with the official tracker miles.
  const officialElevation = $derived.by<DayElevationSample[]>(() => {
    const list = pack?.terrain.elevation ?? [];
    const factor = measuredFactor;
    return factor === 1 ? list : list.map((point) => ({ mile: point.mile / factor, elevationFt: point.elevationFt }));
  });
  const officialDifficulty = $derived.by(() => {
    const list = pack?.terrain.difficulty ?? [];
    const factor = measuredFactor;
    return factor === 1
      ? list
      : list.map((segment) => ({
          startMile: segment.startMile / factor,
          endMile: segment.endMile / factor,
          score: segment.score,
          label: segment.label
        }));
  });
  const todayKey = $derived.by(() => dayKeyFor(new Date().toISOString(), TRAIL_TIME_ZONE) ?? '');
  const trackedDays = $derived.by(() => listTrackedDays(history, TRAIL_TIME_ZONE));
  // The most recent days for the always-visible browse rail; older/arbitrary
  // days stay reachable through the calendar sheet.
  const dayStripDays = $derived.by(() => trackedDays.slice(0, 14));
  const dayOptions = $derived.by<DayOption[]>(() =>
    history.length ? buildDayOptions(history, todayKey, TRAIL_TIME_ZONE, 10) : []
  );
  const dayBounds = $derived.by(() =>
    trackedDays.length ? { min: trackedDays[trackedDays.length - 1], max: trackedDays[0] } : { min: '', max: '' }
  );
  const selectedDayLabel = $derived.by(() => (selectedDay ? relativeDayLabel(selectedDay, todayKey) : ''));
  // Step through days that actually have fixes (trackedDays is newest-first).
  const selectedDayIndex = $derived.by(() => (selectedDay ? trackedDays.indexOf(selectedDay) : -1));
  const canStepOlder = $derived(selectedDayIndex >= 0 && selectedDayIndex < trackedDays.length - 1);
  const canStepNewer = $derived(selectedDayIndex > 0);
  const daySubLabel = $derived.by(() => {
    if (!daySummary) return '';
    const fixes = `${daySummary.pointCount} fix${daySummary.pointCount === 1 ? '' : 'es'}`;
    return daySummary.milesCovered !== null ? `${fixes} · ${daySummary.milesCovered} mi covered` : fixes;
  });
  const dayPoints = $derived.by(() =>
    viewMode === 'day' && selectedDay ? pointsForDay(history, selectedDay, TRAIL_TIME_ZONE) : []
  );
  const daySummary = $derived.by<DaySummary | null>(() => {
    if (viewMode !== 'day' || !selectedDay) return null;
    return summarizeDay(history, selectedDay, TRAIL_TIME_ZONE, {
      elevation: officialElevation,
      difficulty: officialDifficulty
    });
  });
  const dayProfileWindow = $derived.by(() => {
    if (!daySummary || daySummary.startMile === null || daySummary.endMile === null) return [];
    const lo = Math.min(daySummary.startMile, daySummary.endMile);
    const hi = Math.max(daySummary.startMile, daySummary.endMile);
    if (hi <= lo) return [];
    return officialElevation.filter((point) => point.mile >= lo && point.mile <= hi);
  });
  const dayProfileD = $derived(profilePath(dayProfileWindow));

  const selectedElevation = $derived.by(() => nearestElevation(selectedMileMeasured));
  const selectedTerrain = $derived.by(() => nearestTerrainSegment(selectedMileMeasured));
  const selectedRockiness = $derived.by(() => nearestRockiness(selectedMileMeasured));
  const selectedDifficulty = $derived.by(() => nearestDifficulty(selectedMileMeasured));
  const nextShelter = $derived.by(() => nextWaypoint(pack?.waypoints.shelters ?? [], selectedMileMeasured));
  const nextWater = $derived.by(() => nextWaypoint(pack?.waypoints.water ?? [], selectedMileMeasured));
  const nextTown = $derived.by(() => nextWaypoint(pack?.waypoints.towns ?? [], selectedMileMeasured));
  const nextRoad = $derived.by(() => nextWaypoint(pack?.waypoints.roads ?? [], selectedMileMeasured));
  const elevationWindow = $derived.by(() => profileWindow(selectedMileMeasured, 18 * measuredFactor));
  const profileD = $derived(profilePath(elevationWindow));
  const profileStats = $derived.by(() => {
    if (elevationWindow.length < 2) return null;
    const elevations = elevationWindow.map((point) => point.elevationFt);
    return {
      minFt: Math.round(Math.min(...elevations)),
      maxFt: Math.round(Math.max(...elevations)),
      startMile: elevationWindow[0].mile / measuredFactor,
      endMile: elevationWindow[elevationWindow.length - 1].mile / measuredFactor
    };
  });
  const selectedDifficultyClass = $derived(difficultyClass(selectedDifficulty?.score ?? 0));
  const scoutPrompt = $derived.by(() => {
    const mile = Number.isFinite(selectedMile) ? selectedMile.toFixed(1) : 'the current trail location';
    return `Use the Scout map data around AT mile ${mile}. Summarize Dad's current location, next shelters, water candidates, road bailouts, elevation gain/loss, steep sections, rockiness, and what needs live verification before relying on it.`;
  });

  function fmt(value: unknown, digits = 0): string {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toFixed(digits);
  }

  function timeLabel(iso?: string | null): string {
    if (!iso) return 'No timestamp';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // "12 min ago" / "3 hr ago" / "2 days ago" — the freshness phrasing the HUD
  // leads with so a watcher knows how stale the fix is at a glance.
  function relativeTime(iso?: string | null): string {
    if (!iso) return 'time unknown';
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return 'time unknown';
    const diffMin = Math.round((Date.now() - t) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.round(diffHr / 24);
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  }

  // Time-of-day in trail time (Eastern) so a day's start/end read consistently
  // with how the day was bucketed.
  function clockLabel(iso?: string | null): string {
    if (!iso) return '--';
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return '--';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: TRAIL_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(t));
  }

  function elapsedLabel(minutes: number | null): string {
    if (minutes === null) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function dateHeading(key: string): string {
    const t = Date.parse(`${key}T12:00:00Z`);
    if (!Number.isFinite(t)) return key;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(new Date(t));
  }

  function confidenceWord(confidence: DaySummary['confidence']): string {
    if (confidence === 'good') return 'Good data';
    if (confidence === 'fair') return 'Fair data';
    if (confidence === 'sparse') return 'Sparse data';
    return 'No data';
  }

  function colorForGrade(grade: number): string {
    if (grade >= 22) return '#b91c1c';
    if (grade >= 16) return '#dc2626';
    if (grade >= 11) return '#f97316';
    if (grade >= 7) return '#eab308';
    return '#4d7c0f';
  }

  function colorForRock(score: number): string {
    if (score >= 8) return '#6d28d9';
    if (score >= 6.5) return '#9333ea';
    if (score >= 5) return '#c026d3';
    if (score >= 3.5) return '#f97316';
    return '#3f6212';
  }

  function colorForDifficulty(score: number): string {
    if (score >= 8.5) return '#991b1b';
    if (score >= 7) return '#ea580c';
    if (score >= 5) return '#ca8a04';
    return '#15803d';
  }

  function difficultyClass(score: number): string {
    if (score >= 8.5) return 'severe';
    if (score >= 7) return 'hard';
    if (score >= 5) return 'steady';
    return 'cruise';
  }

  function displayLabel(value: string | undefined): string {
    return value?.replace(/_/gu, ' ') || 'model screen';
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  function coordForMile(mile: number): LatLon | null {
    if (!pack?.milepoints.length || !Number.isFinite(mile)) return null;
    const points = pack.milepoints;
    let lower = points[0];
    let upper = points[points.length - 1];

    for (const point of points) {
      if (milepostMile(point) <= mile) lower = point;
      if (milepostMile(point) >= mile) {
        upper = point;
        break;
      }
    }

    if (!lower || !upper) return null;
    if (milepostMile(lower) === milepostMile(upper)) return [lower.lat, lower.lon];
    const progress = (mile - milepostMile(lower)) / (milepostMile(upper) - milepostMile(lower));
    return [
      lower.lat + (upper.lat - lower.lat) * progress,
      lower.lon + (upper.lon - lower.lon) * progress
    ];
  }

  function nearestElevation(mile: number): TrailMapElevationPoint | null {
    const list = pack?.terrain.elevation ?? [];
    if (!list.length || !Number.isFinite(mile)) return null;
    return list.reduce((best, item) => Math.abs(item.mile - mile) < Math.abs(best.mile - mile) ? item : best, list[0]);
  }

  function nearestTerrainSegment(mile: number) {
    return (pack?.terrain.segments ?? []).find((segment) => mile >= segment.startMile && mile <= segment.endMile) ?? null;
  }

  function nearestRockiness(mile: number) {
    return (pack?.terrain.rockiness ?? []).find((segment) => mile >= segment.startMile && mile <= segment.endMile) ?? null;
  }

  function nearestDifficulty(mile: number) {
    return (pack?.terrain.difficulty ?? []).find((segment) => mile >= segment.startMile && mile <= segment.endMile) ?? null;
  }

  function nextWaypoint(list: TrailMapWaypoint[], mile: number): TrailMapWaypoint | null {
    if (!Number.isFinite(mile)) return null;
    return list.find((point) => point.mile >= mile) ?? null;
  }

  // Nearest waypoint at or behind `mile` (lists are sorted ascending by mile).
  function prevWaypoint(list: TrailMapWaypoint[], mile: number): TrailMapWaypoint | null {
    if (!Number.isFinite(mile)) return null;
    let found: TrailMapWaypoint | null = null;
    for (const point of list) {
      if (point.mile <= mile) found = point;
      else break;
    }
    return found;
  }

  function distanceAhead(point: TrailMapWaypoint | null): string {
    if (!point || !Number.isFinite(selectedMileMeasured)) return '--';
    return `${Math.max(0, (point.mile - selectedMileMeasured) / measuredFactor).toFixed(1)} mi`;
  }

  function profileWindow(mile: number, radiusMiles: number): TrailMapElevationPoint[] {
    const list = pack?.terrain.elevation ?? [];
    if (!list.length || !Number.isFinite(mile)) return [];
    const start = mile - radiusMiles;
    const end = mile + radiusMiles;
    return list.filter((point) => point.mile >= start && point.mile <= end);
  }

  function profilePath(points: readonly { readonly mile: number; readonly elevationFt: number }[], width = 340, height = 82): string {
    if (points.length < 2) return '';
    const minMile = points[0].mile;
    const maxMile = points[points.length - 1].mile;
    const minElev = Math.min(...points.map((point) => point.elevationFt));
    const maxElev = Math.max(...points.map((point) => point.elevationFt));
    const mileSpan = Math.max(0.1, maxMile - minMile);
    const elevSpan = Math.max(1, maxElev - minElev);

    return points
      .map((point, index) => {
        const x = ((point.mile - minMile) / mileSpan) * width;
        const y = height - ((point.elevationFt - minElev) / elevSpan) * height;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function profileMarkerX(points: TrailMapElevationPoint[], mile: number, width = 340): number {
    if (points.length < 2) return 0;
    const minMile = points[0].mile;
    const maxMile = points[points.length - 1].mile;
    return clamp(((mile - minMile) / Math.max(0.1, maxMile - minMile)) * width, 0, width);
  }

  function layerGroup(): any {
    return L.layerGroup().addTo(map);
  }

  function clearLayer(layer: any) {
    if (layer) layer.clearLayers();
  }

  // Leaflet's interactive layers swallow clicks that land exactly on them,
  // so the trail line and terrain overlays forward their clicks into the
  // same tap-to-inspect path the bare map uses.
  function forwardMapClick(event: { latlng: { lat: number; lng: number } }) {
    inspectFromLatLng(event.latlng.lat, event.latlng.lng);
  }

  function addRouteLayer() {
    clearLayer(routeLayer);
    if (!pack || !L || !routeLayer) return;
    for (const segment of pack.route.segments) {
      L.polyline(segment, {
        color: '#f97316',
        weight: 3,
        opacity: 0.82,
        lineCap: 'round',
        lineJoin: 'round'
      }).on('click', forwardMapClick).addTo(routeLayer);
    }
  }

  function addMileLayer() {
    clearLayer(mileLayer);
    if (!pack || !L || !mileLayer) return;
    let lastLabeled = -1;
    for (const point of pack.milepoints) {
      const mile = Math.round(milepostMile(point));
      if (mile % 25 !== 0 || mile === lastLabeled) continue;
      lastLabeled = mile;
      L.circleMarker([point.lat, point.lon], {
        radius: mile % 100 === 0 ? 4.5 : 3,
        color: '#162018',
        fillColor: '#fef3c7',
        fillOpacity: 0.9,
        weight: 1
      }).bindTooltip(`Mile ${mile}`, { direction: 'top' })
        .on('click', () => { inspectedMile = mile; })
        .addTo(mileLayer);
    }
  }

  function addTerrainLayer() {
    clearLayer(terrainLayer);
    if (!pack || !L || !terrainLayer) return;

    if (terrainMode === 'grade') {
      for (const segment of pack.terrain.segments) {
        if (segment.maxGradePercent < 6) continue;
        for (const path of pathsForMileRange(segment.startMile, segment.endMile)) {
          L.polyline(path, {
            color: colorForGrade(segment.maxGradePercent),
            weight: segment.maxGradePercent >= 16 ? 7 : 5,
            opacity: 0.72
          }).bindTooltip(`${segment.maxGradePercent.toFixed(0)}% max grade · ${segment.gainFt.toFixed(0)} ft gain`).on('click', forwardMapClick).addTo(terrainLayer);
        }
      }
      return;
    }

    if (terrainMode === 'rockiness') {
      for (const segment of pack.terrain.rockiness) {
        if (segment.score < 3.2) continue;
        for (const path of pathsForMileRange(segment.startMile, segment.endMile)) {
          L.polyline(path, {
            color: colorForRock(segment.score),
            weight: segment.score >= 6.5 ? 7 : 5,
            opacity: 0.68
          }).bindTooltip(`Rockiness ${segment.score.toFixed(1)}/10 · ${segment.label.replace(/_/gu, ' ')}`).on('click', forwardMapClick).addTo(terrainLayer);
        }
      }
      return;
    }

    for (const segment of pack.terrain.difficulty) {
      for (const path of pathsForMileRange(segment.startMile, segment.endMile)) {
        L.polyline(path, {
          color: colorForDifficulty(segment.score),
          weight: segment.score >= 8 ? 8 : 6,
          opacity: 0.76
        }).bindTooltip(`Difficulty ${segment.score.toFixed(1)}/10 · ${displayLabel(segment.label)}`).on('click', forwardMapClick).addTo(terrainLayer);
      }
    }
  }

  function iconForWaypoint(type: TrailMapWaypoint['type']): { color: string; fill: string; radius: number } {
    if (type === 'water') return { color: '#075985', fill: '#38bdf8', radius: 4.5 };
    if (type === 'town') return { color: '#7c2d12', fill: '#fb923c', radius: 5.5 };
    if (type === 'road') return { color: '#334155', fill: '#cbd5e1', radius: 4 };
    if (type === 'summit' || type === 'vista') return { color: '#365314', fill: '#bef264', radius: 4.5 };
    if (type === 'campsite') return { color: '#78350f', fill: '#facc15', radius: 4.5 };
    return { color: '#422006', fill: '#f59e0b', radius: 5 };
  }

  function visibleWaypoints(): TrailMapWaypoint[] {
    if (!pack) return [];
    const radius = 36;
    const near = (list: TrailMapWaypoint[], max = 80) => list
      .filter((point) => Math.abs(point.mile - selectedMile) <= radius)
      .sort((a, b) => Math.abs(a.mile - selectedMile) - Math.abs(b.mile - selectedMile))
      .slice(0, max);

    if (placeMode === 'access') return [...near(pack.waypoints.roads, 95), ...near(pack.waypoints.towns, 28)];
    if (placeMode === 'camp') return [...near(pack.waypoints.shelters, 55), ...near(pack.waypoints.campsites, 60), ...near(pack.waypoints.water, 70)];
    if (placeMode === 'view') return [...near(pack.waypoints.summits, 55), ...near(pack.waypoints.vistas, 55)];
    return [...near(pack.waypoints.shelters, 45), ...near(pack.waypoints.water, 65), ...near(pack.waypoints.towns, 22)];
  }

  function addPlacesLayer() {
    clearLayer(placesLayer);
    if (!L || !placesLayer) return;
    for (const point of visibleWaypoints()) {
      const icon = iconForWaypoint(point.type);
      L.circleMarker([point.lat, point.lon], {
        radius: icon.radius,
        color: icon.color,
        fillColor: icon.fill,
        fillOpacity: 0.86,
        weight: 1.4
      })
        .bindPopup(`<b>${point.name}</b><br/>Mile ${point.mile.toFixed(1)}${point.detail ? `<br/>${point.detail}` : ''}<br/><small>${point.confidence}</small>`)
        .addTo(placesLayer);
    }
  }

  function samplePoints(points: TrailMapPoint[], maxCount: number): TrailMapPoint[] {
    if (points.length <= maxCount) return points;
    const step = Math.ceil(points.length / maxCount);
    return points.filter((_, index) => index % step === 0 || index === points.length - 1);
  }

  function dayFlagIcon(kind: 'start' | 'end') {
    return L.divIcon({
      className: `day-flag day-flag--${kind}`,
      html: `<span>${kind === 'start' ? 'S' : 'F'}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  }

  // Day mode: draw only the selected day's track with explicit start (S) and
  // finish (F) flags, so a family member sees exactly that day's hike.
  function renderDayLayer() {
    const points = dayPoints.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
    if (!points.length) return;

    if (points.length >= 2) {
      L.polyline(points.map((point) => [point.lat, point.lon]), {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(trackerLayer);
    }

    for (const point of points.slice(1, -1)) {
      L.circleMarker([point.lat, point.lon], {
        radius: 3,
        color: '#7c2d12',
        fillColor: '#fbbf24',
        fillOpacity: 0.92,
        weight: 1
      }).bindTooltip(timeLabel(point.observedAt)).addTo(trackerLayer);
    }

    const start = points[0];
    L.marker([start.lat, start.lon], { icon: dayFlagIcon('start'), zIndexOffset: 820 })
      .bindPopup(`<b>Day start</b><br/>${timeLabel(start.observedAt)}${Number.isFinite(start.mile) ? `<br/>Mile ${fmt(start.mile, 1)}` : ''}`)
      .addTo(trackerLayer);

    if (points.length > 1) {
      const end = points[points.length - 1];
      L.marker([end.lat, end.lon], { icon: dayFlagIcon('end'), zIndexOffset: 860 })
        .bindPopup(`<b>Day end</b><br/>${timeLabel(end.observedAt)}${Number.isFinite(end.mile) ? `<br/>Mile ${fmt(end.mile, 1)}` : ''}`)
        .addTo(trackerLayer);
    }
  }

  function addTrackerLayer(recenter = false) {
    if (scrubbing) return;
    clearLayer(trackerLayer);
    if (!pack || !L || !trackerLayer) return;

    if (viewMode === 'day') {
      renderDayLayer();
      return;
    }

    const path = history.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));

    // Sparse history (e.g. just the start fix and today's) must not be
    // connected — a straight chord across five states is not a track. Break
    // the path wherever consecutive fixes are more than ~20 miles apart and
    // only draw runs of genuinely adjacent points.
    const MAX_SEGMENT_GAP_DEG = 0.3;
    let run: TrailMapPoint[] = [];
    const runs: TrailMapPoint[][] = [];
    for (const point of path) {
      const previous = run[run.length - 1];
      if (
        previous &&
        Math.hypot(point.lat - previous.lat, (point.lon - previous.lon) * Math.cos((point.lat * Math.PI) / 180)) > MAX_SEGMENT_GAP_DEG
      ) {
        if (run.length >= 2) runs.push(run);
        run = [];
      }
      run.push(point);
    }
    if (run.length >= 2) runs.push(run);

    for (const segment of runs) {
      L.polyline(segment.map((point) => [point.lat, point.lon]), {
        color: '#2563eb',
        weight: 4,
        opacity: 0.86,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(trackerLayer);
    }

    for (const point of samplePoints(path, 260)) {
      L.circleMarker([point.lat, point.lon], {
        radius: 3,
        color: '#172554',
        fillColor: '#60a5fa',
        fillOpacity: 0.9,
        weight: 1
      }).bindTooltip(timeLabel(point.observedAt)).addTo(trackerLayer);
    }

    if (currentPoint) {
      L.marker([currentPoint.lat, currentPoint.lon], {
        icon: L.divIcon({
          className: 'trail-current-pin',
          html: '<span></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      }).bindPopup(`<b>HoggCountry</b><br/>Mile ${fmt(currentPoint.mile, 1)}<br/>${timeLabel(currentPoint.observedAt)}`).addTo(trackerLayer);
    }

    if (displayedSelection) {
      const selectionLabel = inspectedMile !== null
        ? 'Inspecting trail mile'
        : `Selected point<br/>${timeLabel(displayedSelection.observedAt)}`;
      selectedMarker = L.marker([displayedSelection.lat, displayedSelection.lon], {
        draggable: true,
        zIndexOffset: 900,
        icon: L.divIcon({ className: 'scrub-marker', iconSize: [44, 44], iconAnchor: [22, 22] }),
        title: 'Drag along the trail to scout any mile'
      }).bindPopup(`<b>Mile ${fmt(displayedSelection.mile, 1)}</b><br/>${selectionLabel}`).addTo(trackerLayer);

      selectedMarker.on('dragstart', () => {
        scrubbing = true;
      });
      selectedMarker.on('drag', handleScrubDrag);
      selectedMarker.on('dragend', handleScrubEnd);

      if (recenter) {
        map.setView([displayedSelection.lat, displayedSelection.lon], Math.max(map.getZoom(), 11), {
          animate: true,
          duration: 0.28
        });
      }
    }
  }

  // Continuous position on the trail: nearest milepost, refined by projecting
  // onto the polyline segments to its neighbors. Gives smooth sliding and
  // fractional miles instead of 1-mile jumps.
  function nearestTrailPosition(lat: number, lon: number): { mile: number; lat: number; lon: number } | null {
    const points = pack?.milepoints;
    if (!points?.length) return null;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    let bestIndex = 0;
    let bestDistSq = Infinity;

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const dLat = point.lat - lat;
      const dLon = (point.lon - lon) * cosLat;
      const distSq = dLat * dLat + dLon * dLon;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIndex = index;
      }
    }

    let best = { mile: milepostMile(points[bestIndex]), lat: points[bestIndex].lat, lon: points[bestIndex].lon };
    let bestProjectionDistSq = bestDistSq;

    for (const neighborIndex of [bestIndex - 1, bestIndex + 1]) {
      if (neighborIndex < 0 || neighborIndex >= points.length) continue;
      const a = points[bestIndex];
      const b = points[neighborIndex];
      const abLat = b.lat - a.lat;
      const abLon = (b.lon - a.lon) * cosLat;
      const lengthSq = abLat * abLat + abLon * abLon;
      if (lengthSq <= 0) continue;

      const apLat = lat - a.lat;
      const apLon = (lon - a.lon) * cosLat;
      const t = clamp((apLat * abLat + apLon * abLon) / lengthSq, 0, 1);
      const projLat = a.lat + (b.lat - a.lat) * t;
      const projLon = a.lon + (b.lon - a.lon) * t;
      const dLat = projLat - lat;
      const dLon = (projLon - lon) * cosLat;
      const distSq = dLat * dLat + dLon * dLon;

      if (distSq < bestProjectionDistSq) {
        bestProjectionDistSq = distSq;
        best = {
          mile: milepostMile(a) + (milepostMile(b) - milepostMile(a)) * t,
          lat: projLat,
          lon: projLon
        };
      }
    }

    return best;
  }

  // Constrained drag: the dot rides the trail. Every drag event re-pins the
  // marker to the nearest on-trail position, so it cannot leave the vector;
  // stat updates are throttled to keep derived churn sane.
  function handleScrubDrag(event: { target: { getLatLng: () => { lat: number; lng: number }; setLatLng: (latlng: [number, number]) => void } }) {
    const position = event.target.getLatLng();
    const nearest = nearestRoutePosition(position.lat, position.lng) ?? nearestTrailPosition(position.lat, position.lng);
    if (!nearest) return;

    event.target.setLatLng([nearest.lat, nearest.lon]);
    dismissScrubHint();

    const now = Date.now();
    if (now - lastScrubUpdate < 90) return;
    lastScrubUpdate = now;
    inspectedMile = Math.round(nearest.mile * 10) / 10;
  }

  function handleScrubEnd(event: { target: { getLatLng: () => { lat: number; lng: number }; setLatLng: (latlng: [number, number]) => void } }) {
    const position = event.target.getLatLng();
    const nearest = nearestRoutePosition(position.lat, position.lng) ?? nearestTrailPosition(position.lat, position.lng);
    if (nearest) {
      inspectedMile = Math.round(nearest.mile * 10) / 10;
      event.target.setLatLng([nearest.lat, nearest.lon]);
    }
    scrubbing = false;
  }

  // fitBounds padding that reserves the desktop left panel so the focus point
  // / day track land in the visible map area, not behind the docked sheet.
  function boundsPadding(mobilePad = 60): Record<string, unknown> {
    return isWide
      ? { paddingTopLeft: [430, 48], paddingBottomRight: [60, 60] }
      : { padding: [mobilePad, mobilePad] };
  }

  // Center a single point, panel-aware on desktop. Mobile keeps the simple
  // setView behavior; desktop fits a zero-size bounds with left padding so the
  // pin clears the panel.
  function focusPoint(lat: number, lon: number, zoom: number, animate = true) {
    if (!map || !L) return;
    if (!isWide) {
      map.setView([lat, lon], zoom, animate ? { animate: true, duration: 0.28 } : undefined);
      return;
    }
    map.fitBounds(L.latLngBounds([[lat, lon], [lat, lon]]), { ...boundsPadding(), maxZoom: zoom, animate });
  }

  function fitInitialView() {
    if (!map || !L || !pack) return;
    if (currentPoint) {
      focusPoint(currentPoint.lat, currentPoint.lon, 11, false);
      return;
    }

    const bounds = L.latLngBounds([]);
    for (const segment of pack.route.segments) {
      for (const point of segment) bounds.extend(point);
    }
    if (bounds.isValid()) map.fitBounds(bounds, boundsPadding(28));
  }

  function renderAll(recenter = false) {
    addRouteLayer();
    addMileLayer();
    addTerrainLayer();
    addPlacesLayer();
    addTrackerLayer(recenter);
    lastRenderedTerrainMode = terrainMode;
    lastRenderedPlaceMode = placeMode;
    lastRenderedMile = selectedMile;
  }

  async function loadPack(recenter = false) {
    loading = true;
    errorMessage = '';

    try {
      const response = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=1600`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Map pack returned ${response.status}`);
      pack = await response.json() as TrailMapPack;
      selectedHistoryIndex = Math.max(0, (pack.tracker.history.length || 1) - 1);
      try {
        if (!localStorage.getItem(SCRUB_HINT_KEY)) scrubHintVisible = true;
      } catch {
        // private mode etc.
      }
      renderAll(recenter);
      fitInitialView();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Could not load the map pack.';
    } finally {
      loading = false;
    }
  }

  function recenterOnSelected() {
    if (!displayedSelection || !map) return;
    focusPoint(displayedSelection.lat, displayedSelection.lon, Math.max(map.getZoom(), 12));
  }

  function clearInspect() {
    inspectedMile = null;
    recenterOnLive();
  }

  function recenterOnLive() {
    if (!currentPoint || !map) return;
    focusPoint(currentPoint.lat, currentPoint.lon, Math.max(map.getZoom(), 11));
  }

  function fitDay() {
    if (!map || !L) return;
    const points = dayPoints.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
    if (!points.length) return;
    if (points.length === 1) {
      focusPoint(points[0].lat, points[0].lon, Math.max(map.getZoom(), 12));
      return;
    }
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
    if (bounds.isValid()) map.fitBounds(bounds, { ...boundsPadding(), maxZoom: 14, animate: true });
  }

  function enterDay(dateKey: string) {
    selectedDay = dateKey;
    viewMode = 'day';
    daysOpen = false;
    inspectedMile = null;
    dismissScrubHint();
    // Keep the current snap: tapping a day in the rail leaves the map + rail
    // visible (the peek shows the day's summary line) so browsing stays fluid;
    // the full stats are a pull-up away. Auto-expanding to full would cover the
    // map and, on short screens, the rail itself.
    addTrackerLayer(false);
    fitDay();
  }

  function backToLive() {
    viewMode = 'live';
    selectedDay = null;
    addTrackerLayer(false);
    recenterOnLive();
  }

  function onDatePick(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (value) enterDay(value);
  }

  // Step to the adjacent day that has fixes (trackedDays is newest-first, so
  // older = higher index, newer = lower index).
  function olderDay() {
    if (canStepOlder) enterDay(trackedDays[selectedDayIndex + 1]);
  }

  function newerDay() {
    if (canStepNewer) enterDay(trackedDays[selectedDayIndex - 1]);
  }

  // Tapping near the trail inspects that mile's terrain, even where Dad
  // hasn't hiked yet. The hit area is a finger-sized 36px regardless of zoom,
  // so taps far from the corridor still behave as plain map panning.
  function inspectFromLatLng(lat: number, lon: number) {
    // Day mode is a read-only replay; map taps just pan, they don't scout.
    if (viewMode === 'day') return;
    const points = pack?.milepoints;
    if (!points?.length || !map) return;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    let best: TrailMapMilepoint | null = null;
    let bestDistSq = Infinity;

    for (const point of points) {
      const dLat = point.lat - lat;
      const dLon = (point.lon - lon) * cosLat;
      const distSq = dLat * dLat + dLon * dLon;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = point;
      }
    }

    if (!best) return;
    const clickPoint = map.latLngToContainerPoint([lat, lon]);
    const trailPoint = map.latLngToContainerPoint([best.lat, best.lon]);
    const pixelDistance = Math.hypot(clickPoint.x - trailPoint.x, clickPoint.y - trailPoint.y);
    if (pixelDistance > 36) return;

    const exact = nearestRoutePosition(lat, lon);
    inspectedMile = exact ? Math.round(exact.mile * 10) / 10 : Math.round(milepostMile(best) * 10) / 10;
    dismissScrubHint();
    // The peek updates with the tapped mile; leave the sheet where it is so a
    // tap on the map never covers the spot the hiker just tapped. They can pull
    // up for the full per-mile detail.
  }

  onMount(async () => {
    // Track wide viewports so the sheet can dock as a left panel on desktop.
    const wideQuery = window.matchMedia('(min-width: 1024px)');
    isWide = wideQuery.matches;
    const onWideChange = (event: MediaQueryListEvent) => {
      isWide = event.matches;
      if (map) setTimeout(() => map.invalidateSize(), 60);
    };
    wideQuery.addEventListener('change', onWideChange);
    mediaCleanup = () => wideQuery.removeEventListener('change', onWideChange);

    const leaflet = await import('leaflet');
    L = leaflet.default ?? leaflet;
    if (!host) return;

    map = L.map(host, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap'
    }).addTo(map);

    map.on('click', (event: { latlng: { lat: number; lng: number } }) => {
      inspectFromLatLng(event.latlng.lat, event.latlng.lng);
    });
    routeLayer = layerGroup();
    terrainLayer = layerGroup();
    placesLayer = layerGroup();
    mileLayer = layerGroup();
    trackerLayer = layerGroup();
    map.setView([39, -76], 5);

    await loadPack(true);
  });

  onDestroy(() => {
    mediaCleanup?.();
    if (map) {
      map.remove();
      map = null;
    }
  });

  $effect(() => {
    if (!map || !pack) return;
    if (terrainMode !== lastRenderedTerrainMode) {
      addTerrainLayer();
      lastRenderedTerrainMode = terrainMode;
    }
  });

  $effect(() => {
    if (!map || !pack) return;
    if (placeMode !== lastRenderedPlaceMode || Math.abs(selectedMile - lastRenderedMile) >= 1) {
      addPlacesLayer();
      lastRenderedPlaceMode = placeMode;
      lastRenderedMile = selectedMile;
    }
  });

  $effect(() => {
    if (!map || !pack) return;
    void selectedHistoryIndex;
    void viewMode;
    void selectedDay;
    addTrackerLayer(false);
  });

  // Track header height (peek size) and the shell's height (the basis for the
  // full snap) so the snap math reflects the live layout. offsetHeight
  // is not reactive, so observe both with a ResizeObserver.
  $effect(() => {
    if (!capEl || !shellEl) return;
    const measure = () => {
      if (capEl) capHeight = capEl.offsetHeight;
      if (shellEl) viewHeight = shellEl.clientHeight;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(capEl);
    observer.observe(shellEl);
    return () => observer.disconnect();
  });
</script>

<section class="trail-map-shell" class:publicRoute class:appMode class:wide={isWide} class:sheet-full={sheetSnap === 1} aria-label={title} bind:this={shellEl} style:--sheet-h={`${sheetHeight}px`}>
  <div class="map-host" bind:this={host}></div>
  <div class="map-shade" aria-hidden="true"></div>
  <svg class="icon-sprite" aria-hidden="true" focusable="false">
    <symbol id="trail-map-icon-arrow-left" viewBox="0 0 24 24">
      <path d="M15 18l-6-6 6-6"></path>
      <path d="M10 12h11"></path>
    </symbol>
    <symbol id="trail-map-icon-layers" viewBox="0 0 24 24">
      <path d="M12 3l9 5-9 5-9-5 9-5z"></path>
      <path d="M3 12l9 5 9-5"></path>
      <path d="M3 16l9 5 9-5"></path>
    </symbol>
    <symbol id="trail-map-icon-route" viewBox="0 0 24 24">
      <path d="M6 18c3.5-7 8.5.5 12-6"></path>
      <circle cx="6" cy="18" r="2"></circle>
      <circle cx="18" cy="12" r="2"></circle>
    </symbol>
    <symbol id="trail-map-icon-difficulty" viewBox="0 0 24 24">
      <path d="M4 15a8 8 0 0 1 16 0"></path>
      <path d="M12 15l4-6"></path>
      <path d="M8 19h8"></path>
    </symbol>
    <symbol id="trail-map-icon-elevation" viewBox="0 0 24 24">
      <path d="M3 19l6-10 4 6 3-4 5 8H3z"></path>
      <path d="M9 9l2.2 3.2L13 10"></path>
    </symbol>
    <symbol id="trail-map-icon-grade" viewBox="0 0 24 24">
      <path d="M4 18h16"></path>
      <path d="M6 16l10-10"></path>
      <path d="M12 6h4v4"></path>
    </symbol>
    <symbol id="trail-map-icon-rock" viewBox="0 0 24 24">
      <path d="M5 17l3-9 7-3 4 6-2 7H8l-3-1z"></path>
      <path d="M8 8l4 5 5-2"></path>
    </symbol>
    <symbol id="trail-map-icon-panel" viewBox="0 0 24 24">
      <path d="M5 7h14"></path>
      <path d="M5 12h14"></path>
      <path d="M5 17h8"></path>
    </symbol>
    <symbol id="trail-map-icon-shelter" viewBox="0 0 24 24">
      <path d="M3 13l9-8 9 8"></path>
      <path d="M6 11v8h12v-8"></path>
      <path d="M10 19v-5h4v5"></path>
    </symbol>
    <symbol id="trail-map-icon-water" viewBox="0 0 24 24">
      <path d="M12 3c4 5 6 8.2 6 11a6 6 0 0 1-12 0c0-2.8 2-6 6-11z"></path>
    </symbol>
    <symbol id="trail-map-icon-town" viewBox="0 0 24 24">
      <path d="M4 20V8l6-3v15"></path>
      <path d="M10 20V4l10 5v11"></path>
      <path d="M7 11h.1M7 15h.1M14 11h.1M17 13h.1M14 16h.1"></path>
    </symbol>
    <symbol id="trail-map-icon-road" viewBox="0 0 24 24">
      <path d="M9 21l2-18"></path>
      <path d="M15 21L13 3"></path>
      <path d="M12 6v2M12 11v2M12 16v2"></path>
    </symbol>
    <symbol id="trail-map-icon-camp" viewBox="0 0 24 24">
      <path d="M3 20h18"></path>
      <path d="M6 20l6-14 6 14"></path>
      <path d="M9 20l3-7 3 7"></path>
    </symbol>
    <symbol id="trail-map-icon-view" viewBox="0 0 24 24">
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </symbol>
    <symbol id="trail-map-icon-refresh" viewBox="0 0 24 24">
      <path d="M20 12a8 8 0 1 1-2.3-5.7"></path>
      <path d="M20 4v6h-6"></path>
    </symbol>
    <symbol id="trail-map-icon-locate" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.4"></circle>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
    </symbol>
    <symbol id="trail-map-icon-calendar" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2"></rect>
      <path d="M3 9h18M8 3v4M16 3v4"></path>
    </symbol>
  </svg>

  <!-- Top: slim floating status pill (tap to recenter on the live position) -->
  <div class="top-bar">
    <a class="circle-btn back" href={appMode ? '/app' : '/'} aria-label="Back">
      <svg aria-hidden="true"><use href="#trail-map-icon-arrow-left"></use></svg>
    </a>
    <button class="status-pill" type="button" onclick={recenterOnLive} aria-label="Recenter on current location">
      <span
        class="status-dot"
        class:live={signalState === 'live'}
        class:stale={signalState === 'stale'}
        class:preview={signalState === 'preview'}
      ></span>
      <span class="status-text">
        <strong>{currentPoint ? `Mile ${fmt(currentPoint.mile, 1)}` : loading ? 'Locating…' : 'No signal'}</strong>
        <small>{pillSubtitle}</small>
      </span>
      {#if currentPoint && totalMiles}
        <span class="status-progress" aria-hidden="true"><i style:width={`${progressPct}%`}></i></span>
      {/if}
    </button>
  </div>

  <!-- Day browse rail: one-tap Live + recent days (older dates via calendar) -->
  {#if history.length}
    <div class="day-rail" aria-label="Browse days">
      <button class="day-pill" class:active={viewMode === 'live'} type="button" onclick={backToLive}>
        <span class="rail-dot" class:live={signalState === 'live'} class:stale={signalState === 'stale'}></span>Live
      </button>
      {#each dayStripDays as key (key)}
        <button class="day-pill" class:active={viewMode === 'day' && selectedDay === key} type="button" onclick={() => enterDay(key)}>
          {shortDayLabel(key, todayKey)}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Right edge: floating map tools -->
  <div class="edge-tools">
    <button class="circle-btn" class:on={viewMode === 'day' || daysOpen} type="button" aria-expanded={daysOpen} aria-controls="map-days-sheet" onclick={() => { daysOpen = !daysOpen; if (daysOpen) layersOpen = false; }} aria-label="Replay a day" disabled={!history.length}>
      <svg aria-hidden="true"><use href="#trail-map-icon-calendar"></use></svg>
    </button>
    <button class="circle-btn" class:on={layersOpen} type="button" aria-expanded={layersOpen} aria-controls="map-layer-sheet" onclick={() => { layersOpen = !layersOpen; if (layersOpen) daysOpen = false; }} aria-label="Map layers">
      <svg aria-hidden="true"><use href="#trail-map-icon-layers"></use></svg>
    </button>
    <button class="circle-btn" type="button" onclick={recenterOnLive} aria-label="Recenter on current location" disabled={!currentPoint}>
      <svg aria-hidden="true"><use href="#trail-map-icon-locate"></use></svg>
    </button>
    <div class="zoom-pill">
      <button type="button" onclick={() => zoomBy(1)} aria-label="Zoom in">+</button>
      <i aria-hidden="true"></i>
      <button type="button" onclick={() => zoomBy(-1)} aria-label="Zoom out">−</button>
    </div>
  </div>

  <!-- Floating context chip (day browsing lives in the day rail above) -->
  {#if inspectedMile !== null}
    <button class="floating-chip inspect" type="button" onclick={clearInspect}>
      <span>Scouting mi {fmt(inspectedMile, 1)}</span>
      <strong>Back to live</strong>
    </button>
  {:else if scrubHintVisible && viewMode === 'live'}
    <button class="floating-chip hint" type="button" onclick={dismissScrubHint}>
      <span>Tap the trail to scout any mile — drag the dot to glide</span>
      <strong>Got it</strong>
    </button>
  {/if}

  <!-- Layers sheet -->
  {#if layersOpen}
    <button class="sheet-scrim" type="button" aria-label="Close layers" onclick={() => (layersOpen = false)}></button>
    <aside id="map-layer-sheet" class="layers-sheet" aria-label="Map layers">
      <div class="layers-head">
        <h2>Map layers</h2>
        <button class="layers-close" type="button" onclick={() => (layersOpen = false)} aria-label="Close layers">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg>
        </button>
      </div>

      <div class="seg-group">
        <span class="seg-label">Terrain</span>
        <div class="seg three">
          <button class:active={terrainMode === 'difficulty'} type="button" onclick={() => (terrainMode = 'difficulty')}><svg aria-hidden="true"><use href="#trail-map-icon-difficulty"></use></svg><span>Difficulty</span></button>
          <button class:active={terrainMode === 'grade'} type="button" onclick={() => (terrainMode = 'grade')}><svg aria-hidden="true"><use href="#trail-map-icon-grade"></use></svg><span>Grade</span></button>
          <button class:active={terrainMode === 'rockiness'} type="button" onclick={() => (terrainMode = 'rockiness')}><svg aria-hidden="true"><use href="#trail-map-icon-rock"></use></svg><span>Rock</span></button>
        </div>
      </div>

      {#if terrainMode === 'difficulty'}
        <div class="difficulty-legend" aria-label="Difficulty color key">
          <span><i class="cruise"></i>Cruise</span>
          <span><i class="steady"></i>Steady</span>
          <span><i class="hard"></i>Hard</span>
          <span><i class="severe"></i>Severe</span>
        </div>
      {/if}

      <div class="seg-group">
        <span class="seg-label">Places</span>
        <div class="seg four">
          <button class:active={placeMode === 'core'} type="button" onclick={() => (placeMode = 'core')}><svg aria-hidden="true"><use href="#trail-map-icon-shelter"></use></svg><span>Core</span></button>
          <button class:active={placeMode === 'access'} type="button" onclick={() => (placeMode = 'access')}><svg aria-hidden="true"><use href="#trail-map-icon-road"></use></svg><span>Roads</span></button>
          <button class:active={placeMode === 'camp'} type="button" onclick={() => (placeMode = 'camp')}><svg aria-hidden="true"><use href="#trail-map-icon-camp"></use></svg><span>Camp</span></button>
          <button class:active={placeMode === 'view'} type="button" onclick={() => (placeMode = 'view')}><svg aria-hidden="true"><use href="#trail-map-icon-view"></use></svg><span>Views</span></button>
        </div>
      </div>

      <button class="layers-refresh" type="button" onclick={() => loadPack(true)} disabled={loading}>
        <svg aria-hidden="true"><use href="#trail-map-icon-refresh"></use></svg>
        <span>{loading ? 'Refreshing…' : 'Refresh trail data'}</span>
      </button>
      <p class="layers-credit">OpenTopoMap · OSM · USGS 3DEP · Scout RC1</p>
    </aside>
  {/if}

  <!-- Day replay sheet -->
  {#if daysOpen}
    <button class="sheet-scrim" type="button" aria-label="Close day replay" onclick={() => (daysOpen = false)}></button>
    <aside id="map-days-sheet" class="layers-sheet days-sheet" aria-label="Replay a day">
      <div class="layers-head">
        <h2>Replay a day</h2>
        <button class="layers-close" type="button" onclick={() => (daysOpen = false)} aria-label="Close day replay">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"></path></svg>
        </button>
      </div>

      {#if dayOptions.length}
        <p class="days-intro">See what Dad hiked on a given day — start, finish, miles, and climb.</p>
        <div class="day-chips">
          {#each dayOptions as opt (opt.key)}
            <button class:active={viewMode === 'day' && selectedDay === opt.key} type="button" onclick={() => enterDay(opt.key)}>
              <strong>{opt.label}</strong>
              <small>{opt.count} fix{opt.count === 1 ? '' : 'es'}</small>
            </button>
          {/each}
        </div>
        <label class="day-pick">
          <span>Pick any date</span>
          <input type="date" min={dayBounds.min} max={dayBounds.max} value={selectedDay ?? ''} onchange={onDatePick} />
        </label>
        {#if viewMode === 'day'}
          <button class="layers-refresh" type="button" onclick={backToLive}>
            <svg aria-hidden="true"><use href="#trail-map-icon-locate"></use></svg>
            <span>Back to live</span>
          </button>
        {/if}
      {:else}
        <p class="day-empty">No Garmin history yet. Day replay lights up once Dad's tracker logs fixes on the trail.</p>
      {/if}
      <p class="layers-credit">Days use trail time (Eastern)</p>
    </aside>
  {/if}

  <!-- Bottom sheet: peek summary always visible, drag/tap to expand -->
  <section
    class="sheet"
    class:dragging
    style:height={isWide ? undefined : `${sheetHeight}px`}
    style:--difficulty-accent={colorForDifficulty(selectedDifficulty?.score ?? 0)}
    aria-label="Trail detail"
  >
    <div class="sheet-head" bind:this={capEl}>
      <div
        class="sheet-grab"
        role="button"
        tabindex="0"
        aria-label="Resize trail detail panel"
        aria-expanded={detailsOpen}
        onpointerdown={beginSheetDrag}
        onpointermove={moveSheetDrag}
        onpointerup={endSheetDrag}
        onpointercancel={endSheetDrag}
        onclick={cycleSheet}
        onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cycleSheet(); } }}
      >
        <span class="grab-bar"></span>
      </div>

      {#if !errorMessage}
        {#if viewMode === 'day' && daySummary}
          <div class="peek">
            <div class="peek-lead">
              <span class="peek-eyebrow">Replaying</span>
              <strong class="peek-mile">{selectedDayLabel}</strong>
              <small class="peek-sub">{daySubLabel}</small>
            </div>
            <span class={`day-conf day-conf--${daySummary.confidence}`}>{confidenceWord(daySummary.confidence)}</span>
          </div>
        {:else}
          <div class="peek">
            <div class="peek-lead">
              <span class="peek-eyebrow">{inspectedMile !== null ? 'Scouting' : 'Live position'}</span>
              <strong class="peek-mile">mi {fmt(selectedMile, 1)}</strong>
              <small class="peek-sub">{inspectedMile !== null ? 'Tapped on the map' : selectedPoint ? timeLabel(selectedPoint.observedAt) : 'No point selected'}</small>
            </div>
            <span class={`diff-chip ${selectedDifficultyClass}`}>
              <em>{selectedDifficulty ? fmt(selectedDifficulty.score, 1) : '--'}</em>
              <span>{selectedDifficulty ? displayLabel(selectedDifficulty.label) : 'difficulty'}</span>
            </span>
          </div>
        {/if}
      {/if}
    </div>

    {#if errorMessage}
      <div class="error">{errorMessage}</div>
    {:else if viewMode === 'day' && daySummary}
      <div class="sheet-body">
        <div class="day-head">
          <button class="day-step" type="button" onclick={olderDay} disabled={!canStepOlder} aria-label="Previous tracked day">‹</button>
          <div class="day-head-mid">
            <strong>{dateHeading(daySummary.dateKey)}</strong>
            <span class={`day-conf day-conf--${daySummary.confidence}`}>{confidenceWord(daySummary.confidence)}</span>
          </div>
          <button class="day-step" type="button" onclick={newerDay} disabled={!canStepNewer} aria-label="Next tracked day">›</button>
        </div>

        <div class="metric-row">
          <div class="metric">
            <span class="metric-label">Tracking window</span>
            <strong>{elapsedLabel(daySummary.elapsedMinutes)}</strong>
            <small>{clockLabel(daySummary.startTime)} – {clockLabel(daySummary.endTime)}</small>
          </div>
          <div class="metric">
            <span class="metric-label">Miles covered</span>
            <strong>{daySummary.milesCovered !== null ? daySummary.milesCovered : '--'}</strong>
            <small>{daySummary.startMile !== null ? `mi ${fmt(daySummary.startMile, 1)} → ${fmt(daySummary.endMile, 1)}` : 'no mile data'}</small>
          </div>
          <div class="metric">
            <span class="metric-label">Difficulty</span>
            <strong>{daySummary.difficultyScore !== null ? fmt(daySummary.difficultyScore, 1) : '--'}</strong>
            <small>{daySummary.difficultyLabel ?? 'unavailable'}</small>
          </div>
        </div>

        <div class="metric-row">
          <div class="metric">
            <span class="metric-label"><svg aria-hidden="true"><use href="#trail-map-icon-elevation"></use></svg>Elev gain</span>
            <strong>{daySummary.elevationGainFt !== null ? `${daySummary.elevationGainFt.toLocaleString()} ft` : '--'}</strong>
            <small>{daySummary.elevationModeled ? `${(daySummary.elevationLossFt ?? 0).toLocaleString()} ft down · modeled` : 'unavailable'}</small>
          </div>
          <div class="metric">
            <span class="metric-label">High / low</span>
            <strong>{daySummary.highestFt !== null ? `${daySummary.highestFt.toLocaleString()} ft` : '--'}</strong>
            <small>{daySummary.elevationModeled ? `low ${(daySummary.lowestFt ?? 0).toLocaleString()} ft` : 'unavailable'}</small>
          </div>
          <div class="metric">
            <span class="metric-label">Fixes</span>
            <strong>{daySummary.pointCount}</strong>
            <small>Garmin</small>
          </div>
        </div>

        {#if dayProfileD}
          <div class="profile-row">
            <svg viewBox="0 0 340 92" role="img" aria-label="Modeled elevation across the day">
              <path class="profile-fill" d={`${dayProfileD} L340 92 L0 92 Z`}></path>
              <path class="profile-line" d={dayProfileD}></path>
            </svg>
            <div class="profile-x-labels">
              <span>mi {fmt(daySummary.startMile, 1)}</span>
              <span class="profile-cursor-label">modeled elevation</span>
              <span>mi {fmt(daySummary.endMile, 1)}</span>
            </div>
          </div>
        {/if}

        {#if daySummary.confidenceNote}
          <p class="day-note">{daySummary.confidenceNote}</p>
        {/if}

        <div class="action-row">
          <button class="back-live-btn" type="button" onclick={backToLive}>Back to live</button>
          <span>Day uses trail time (Eastern)</span>
        </div>
      </div>
    {:else}
      <div class="sheet-body">
        <div class="today-card">
          <div class="today-top">
            <div class="today-lead">
              <span class="today-eyebrow">Today on trail</span>
              <strong>Mile {currentPoint ? fmt(currentPoint.mile, 1) : '--'}{#if totalMiles}<small> of {Math.round(totalMiles).toLocaleString()}</small>{/if}</strong>
            </div>
            <span class={`fresh-chip fresh-chip--${signalState}`}>{freshChipLabel}</span>
          </div>
          {#if currentPoint && totalMiles}
            <div class="today-rail" aria-hidden="true"><i style:width={`${progressPct}%`}></i></div>
            <div class="today-foot">
              <span>{progressPct.toFixed(0)}% done</span>
              <span>{Math.round(remainingMiles).toLocaleString()} mi to Katahdin</span>
            </div>
          {/if}
          {#if currentState || justPassed}
            <div class="today-context">
              {#if currentState}<span class="ctx-here">📍 {currentState}</span>{/if}
              {#if justPassed}<span class="ctx-passed">Just passed {justPassed.name}</span>{/if}
            </div>
          {/if}
        </div>

        <div class="metric-row">
          <div class="metric">
            <span class="metric-label"><svg aria-hidden="true"><use href="#trail-map-icon-elevation"></use></svg>Elevation</span>
            <strong>{selectedElevation ? `${fmt(selectedElevation.elevationFt)} ft` : '--'}</strong>
            <small>{selectedElevation?.state || 'USGS screen'}</small>
          </div>
          <div class="metric">
            <span class="metric-label"><svg aria-hidden="true"><use href="#trail-map-icon-grade"></use></svg>Grade</span>
            <strong>{selectedTerrain ? `${fmt(selectedTerrain.maxGradePercent)}%` : '--'}</strong>
            <small>{selectedTerrain ? `${fmt(selectedTerrain.gainFt)}↑ / ${fmt(selectedTerrain.lossFt)}↓ ft` : 'nearest mile'}</small>
          </div>
          <div class="metric">
            <span class="metric-label"><svg aria-hidden="true"><use href="#trail-map-icon-rock"></use></svg>Rock</span>
            <strong>{selectedRockiness ? `${fmt(selectedRockiness.score, 1)}` : '--'}</strong>
            <small>{displayLabel(selectedRockiness?.label)}</small>
          </div>
        </div>

        <div class="profile-row">
          {#if profileStats}
            <div class="profile-y-labels" aria-hidden="true">
              <span>{profileStats.maxFt.toLocaleString()} ft</span>
              <span>{profileStats.minFt.toLocaleString()} ft</span>
            </div>
          {/if}
          <svg viewBox="0 0 340 92" role="img" aria-label="Elevation profile around selected mile">
            {#if profileD}
              <path class="profile-fill" d={`${profileD} L340 92 L0 92 Z`}></path>
              <path class="profile-line" d={profileD}></path>
              <line class="profile-cursor" x1={profileMarkerX(elevationWindow, selectedMileMeasured)} x2={profileMarkerX(elevationWindow, selectedMileMeasured)} y1="0" y2="92"></line>
            {/if}
          </svg>
          {#if profileStats}
            <div class="profile-x-labels">
              <span>mi {fmt(profileStats.startMile, 0)}</span>
              <span class="profile-cursor-label">mi {fmt(selectedMile, 1)} · {selectedElevation ? `${fmt(selectedElevation.elevationFt)} ft` : '--'}</span>
              <span>mi {fmt(profileStats.endMile, 0)}</span>
            </div>
          {/if}
        </div>

        {#if history.length > 1}
          <div class="history-row">
            <button type="button" onclick={() => (selectedHistoryIndex = Math.max(0, selectedHistoryIndex - 1))} aria-label="Previous fix">−</button>
            <input
              type="range"
              min="0"
              max={history.length - 1}
              step="1"
              bind:value={selectedHistoryIndex}
              aria-label="Historical Garmin point"
            />
            <button type="button" onclick={() => (selectedHistoryIndex = Math.min(history.length - 1, selectedHistoryIndex + 1))} aria-label="Next fix">+</button>
            <button class="center" type="button" onclick={recenterOnSelected}>Center</button>
          </div>
        {/if}

        <div class="next-grid">
          <button type="button" onclick={() => nextShelter && map?.setView([nextShelter.lat, nextShelter.lon], 12)}>
            <span class="next-head"><svg aria-hidden="true"><use href="#trail-map-icon-shelter"></use></svg><span>Shelter</span></span>
            <strong>{distanceAhead(nextShelter)}</strong><small>{nextShelter?.name ?? '--'}</small>
          </button>
          <button type="button" onclick={() => nextWater && map?.setView([nextWater.lat, nextWater.lon], 12)}>
            <span class="next-head"><svg aria-hidden="true"><use href="#trail-map-icon-water"></use></svg><span>Water</span></span>
            <strong>{distanceAhead(nextWater)}</strong><small>{nextWater?.name ?? '--'}</small>
          </button>
          <button type="button" onclick={() => nextTown && map?.setView([nextTown.lat, nextTown.lon], 11)}>
            <span class="next-head"><svg aria-hidden="true"><use href="#trail-map-icon-town"></use></svg><span>Town</span></span>
            <strong>{distanceAhead(nextTown)}</strong><small>{nextTown?.name ?? '--'}</small>
          </button>
          <button type="button" onclick={() => nextRoad && map?.setView([nextRoad.lat, nextRoad.lon], 12)}>
            <span class="next-head"><svg aria-hidden="true"><use href="#trail-map-icon-road"></use></svg><span>Road</span></span>
            <strong>{distanceAhead(nextRoad)}</strong><small>{nextRoad?.name ?? '--'}</small>
          </button>
        </div>

        <div class="action-row">
          <div class="action-links">
            {#if appMode}
              <a href={`/app/scout?prompt=${encodeURIComponent(scoutPrompt)}`}>Ask Scout</a>
            {:else}
              <a href="/app/map">Open in Scout</a>
            {/if}
            <a class="ghost" href="/updates">Latest update</a>
          </div>
          <span>{pack ? `${pack.terrain.elevation.length.toLocaleString()} elevation pts · ${pack.terrain.rockiness.length.toLocaleString()} rockiness mi` : ''}</span>
        </div>
      </div>
    {/if}
  </section>
</section>

<style>
  :global(.public-shell:has(.trail-map-shell.publicRoute)) {
    background: #10130f;
  }

  :global(.public-shell:has(.trail-map-shell.publicRoute) #site-header),
  :global(.public-shell:has(.trail-map-shell.publicRoute) .public-meta-footer),
  :global(.public-shell:has(.trail-map-shell.publicRoute) #version-stamp) {
    display: none;
  }

  :global(body:has(.trail-map-shell.publicRoute)) {
    overflow: hidden;
  }

  .icon-sprite {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  /* Shared stroke icon styling across every control. */
  .circle-btn svg,
  .seg button svg,
  .layers-refresh svg,
  .layers-close svg,
  .metric-label svg,
  .next-head svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  :global(.trail-current-pin) {
    background: transparent;
    border: none;
  }

  :global(.trail-current-pin span) {
    display: block;
    width: 18px;
    height: 18px;
    border: 3px solid #fff7ed;
    border-radius: 999px;
    background: #dc2626;
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.2), 0 10px 28px rgba(0, 0, 0, 0.35);
  }

  /* Leaflet's stylesheet is code-split and can load AFTER this component's
     CSS; double up the class selector and absolutely position the dot so
     cascade order can't collapse it. */
  :global(.leaflet-marker-icon.scrub-marker) {
    background: transparent;
    border: 0;
    cursor: grab;
  }

  :global(.leaflet-marker-icon.scrub-marker::after) {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 22px;
    height: 22px;
    margin: -11px 0 0 -11px;
    box-sizing: border-box;
    border: 3px solid #fff7ed;
    border-radius: 999px;
    background: #ea580c;
    box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.25), 0 4px 10px rgba(0, 0, 0, 0.35);
  }

  :global(.leaflet-marker-icon.scrub-marker:active) {
    cursor: grabbing;
  }

  /* Day-replay start (S) / finish (F) flags. */
  :global(.leaflet-marker-icon.day-flag) {
    background: transparent;
    border: 0;
  }

  :global(.leaflet-marker-icon.day-flag span) {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 2px solid #fffdf8;
    border-radius: 999px;
    color: #fffdf8;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  :global(.leaflet-marker-icon.day-flag--start span) {
    background: #16a34a;
  }

  :global(.leaflet-marker-icon.day-flag--end span) {
    background: #dc2626;
  }

  :global(.trail-map-shell .leaflet-control-attribution) {
    display: none;
  }

  /* ---- Shell ---------------------------------------------------------- */
  .trail-map-shell {
    position: relative;
    width: min(100vw, 100%);
    height: calc(100svh - 84px);
    min-height: 540px;
    overflow: hidden;
    background: #10130f;
    color: #fffdf8;
    -webkit-tap-highlight-color: transparent;
  }

  .trail-map-shell.publicRoute {
    width: 100vw;
    height: 100svh;
    min-height: 100svh;
  }

  :global(.site-main .container > .trail-map-shell) {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  }

  .map-host,
  .map-shade {
    position: absolute;
    inset: 0;
  }

  .map-host {
    z-index: 0;
  }

  /* Subtle legibility scrim only behind the floating chrome — the topo map
     itself stays bright, the way a real maps app keeps it. */
  .map-shade {
    z-index: 1;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(8, 13, 9, 0.42), transparent 16%),
      linear-gradient(0deg, rgba(8, 13, 9, 0.34), transparent 22%);
  }

  /* ---- Shared glass surfaces ----------------------------------------- */
  .circle-btn,
  .status-pill,
  .zoom-pill,
  .floating-chip,
  .layers-sheet,
  .sheet {
    border: 1px solid rgba(255, 253, 248, 0.16);
    background: rgba(18, 26, 20, 0.82);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.4);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
  }

  .circle-btn {
    display: grid;
    place-items: center;
    width: 2.85rem;
    height: 2.85rem;
    flex: 0 0 auto;
    border-radius: 999px;
    color: #fffdf8;
    cursor: pointer;
    transition: transform 120ms ease, background 140ms ease, border-color 140ms ease;
  }

  .circle-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .circle-btn:active {
    transform: scale(0.94);
  }

  .circle-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .circle-btn.on {
    border-color: rgba(217, 249, 157, 0.6);
    background: rgba(217, 249, 157, 0.2);
    color: #ecfccb;
  }

  /* ---- Top bar -------------------------------------------------------- */
  .top-bar {
    position: absolute;
    z-index: 4;
    top: max(0.7rem, env(safe-area-inset-top));
    left: max(0.7rem, env(safe-area-inset-left));
    right: max(0.7rem, env(safe-area-inset-right));
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .status-pill {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
    gap: 0.6rem;
    overflow: hidden;
    border-radius: 999px;
    padding: 0.5rem 1rem 0.5rem 0.85rem;
    color: #fffdf8;
    cursor: pointer;
    text-align: left;
  }

  .status-dot {
    width: 0.62rem;
    height: 0.62rem;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #64748b;
  }

  .status-dot.live {
    background: #22c55e;
    box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.16);
  }

  .status-dot.stale {
    background: #f59e0b;
    box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.14);
  }

  .status-dot.preview {
    background: #38bdf8;
    box-shadow: 0 0 0 5px rgba(56, 189, 248, 0.16);
  }

  .status-text {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.05rem;
    line-height: 1.05;
  }

  .status-text strong {
    overflow: hidden;
    font-size: 1.02rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    text-transform: none;
    white-space: nowrap;
  }

  .status-text small {
    overflow: hidden;
    color: rgba(255, 253, 248, 0.64);
    font-size: 0.7rem;
    font-weight: 600;
    text-overflow: ellipsis;
    text-transform: none;
    white-space: nowrap;
  }

  .status-progress {
    position: absolute;
    left: 0.85rem;
    right: 0.85rem;
    bottom: 0.32rem;
    height: 2px;
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.16);
  }

  .status-progress i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #d9f99d, #f97316);
  }

  /* ---- Edge tools ----------------------------------------------------- */
  /* Float just above the sheet's top edge and ride up with it as it expands,
     the way a maps app keeps its controls reachable. */
  .edge-tools {
    position: absolute;
    z-index: 7;
    right: max(0.7rem, env(safe-area-inset-right));
    bottom: calc(var(--sheet-h, 170px) + 0.7rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    transition: bottom 0.34s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease, transform 0.2s ease;
  }

  .trail-map-shell:has(.sheet.dragging) .edge-tools {
    transition: none;
  }

  .trail-map-shell.sheet-full .edge-tools {
    opacity: 0;
    transform: translateY(0.6rem);
    pointer-events: none;
  }

  .zoom-pill {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 2.85rem;
    border-radius: 1.42rem;
    overflow: hidden;
  }

  .zoom-pill button {
    display: grid;
    place-items: center;
    height: 2.5rem;
    border: 0;
    background: transparent;
    color: #fffdf8;
    cursor: pointer;
    font-size: 1.4rem;
    font-weight: 600;
    line-height: 1;
  }

  .zoom-pill button:active {
    background: rgba(255, 253, 248, 0.1);
  }

  .zoom-pill i {
    height: 1px;
    margin: 0 0.55rem;
    background: rgba(255, 253, 248, 0.18);
  }

  /* ---- Day browse rail ------------------------------------------------ */
  .day-rail {
    position: absolute;
    z-index: 5;
    top: calc(max(0.7rem, env(safe-area-inset-top)) + 3.55rem);
    left: max(0.7rem, env(safe-area-inset-left));
    right: max(0.7rem, env(safe-area-inset-right));
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding: 0.1rem 0.05rem;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .day-rail::-webkit-scrollbar {
    display: none;
  }

  /* On phones the full sheet rises over the rail; fade it out like the edge
     tools (collapse the sheet to browse days again). Desktop keeps it — the
     sheet is a left panel there, not a full-screen cover. */
  .trail-map-shell.sheet-full:not(.wide) .day-rail {
    opacity: 0;
    transform: translateY(-0.4rem);
    pointer-events: none;
  }

  .day-pill {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.32rem;
    height: 2rem;
    padding: 0 0.7rem;
    border: 1px solid rgba(255, 253, 248, 0.16);
    border-radius: 999px;
    background: rgba(18, 26, 20, 0.82);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    color: rgba(255, 253, 248, 0.86);
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  }

  .day-pill.active {
    border-color: rgba(56, 189, 248, 0.6);
    background: rgba(56, 189, 248, 0.22);
    color: #e0f2fe;
  }

  .rail-dot {
    width: 0.5rem;
    height: 0.5rem;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #64748b;
  }

  .rail-dot.live {
    background: #22c55e;
  }

  .rail-dot.stale {
    background: #f59e0b;
  }

  /* ---- Floating chip -------------------------------------------------- */
  .floating-chip {
    position: absolute;
    z-index: 4;
    top: calc(max(0.7rem, env(safe-area-inset-top)) + 6.3rem);
    left: 50%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    max-width: min(92vw, 30rem);
    padding: 0.5rem 0.55rem 0.5rem 0.95rem;
    transform: translateX(-50%);
    border: 1px solid rgba(255, 253, 248, 0.16);
    border-radius: 999px;
    background: rgba(18, 26, 20, 0.88);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.42);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    color: rgba(255, 253, 248, 0.92);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .floating-chip span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .floating-chip strong {
    flex: 0 0 auto;
    border-radius: 999px;
    background: rgba(217, 249, 157, 0.16);
    color: #d9f99d;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    padding: 0.28rem 0.6rem;
    text-transform: uppercase;
  }

  .floating-chip.inspect strong {
    background: rgba(249, 115, 22, 0.2);
    color: #fdba74;
  }

  /* ---- Layers sheet --------------------------------------------------- */
  .sheet-scrim {
    position: absolute;
    inset: 0;
    z-index: 8;
    border: 0;
    background: rgba(6, 10, 7, 0.5);
    cursor: pointer;
    animation: fade-in 160ms ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .layers-sheet {
    position: absolute;
    z-index: 9;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    gap: 0.9rem;
    /* Cap + scroll so a long day list (or a short device) can't push the
       heading/close button off the top of the viewport. */
    max-height: calc(100svh - 2rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    border-radius: 22px 22px 0 0;
    padding: 1rem 1.1rem calc(1.1rem + env(safe-area-inset-bottom));
    animation: slide-up 240ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .layers-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .layers-head h2 {
    margin: 0;
    color: #fffdf8;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .layers-close {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.1);
    color: #fffdf8;
    cursor: pointer;
  }

  .layers-close svg {
    width: 1rem;
    height: 1rem;
  }

  .seg-group {
    display: grid;
    gap: 0.45rem;
  }

  .seg-label {
    color: rgba(255, 253, 248, 0.6);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .seg {
    display: grid;
    gap: 0.4rem;
    padding: 0.28rem;
    border-radius: 14px;
    background: rgba(255, 253, 248, 0.06);
  }

  .seg.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .seg.four {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .seg button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.28rem;
    min-height: 3.1rem;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent;
    color: rgba(255, 253, 248, 0.78);
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .seg button svg {
    width: 1.2rem;
    height: 1.2rem;
    color: rgba(255, 253, 248, 0.66);
  }

  .seg button.active {
    border-color: rgba(217, 249, 157, 0.5);
    background: rgba(217, 249, 157, 0.18);
    color: #ecfccb;
  }

  .seg button.active svg {
    color: #d9f99d;
  }

  .difficulty-legend {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.3rem;
  }

  .difficulty-legend span {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.3rem;
    color: rgba(255, 253, 248, 0.72);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .difficulty-legend i {
    width: 0.55rem;
    height: 0.55rem;
    flex: 0 0 auto;
    border-radius: 999px;
  }

  .difficulty-legend .cruise,
  .diff-chip.cruise {
    background: rgba(21, 128, 61, 0.4);
  }

  .difficulty-legend .steady,
  .diff-chip.steady {
    background: rgba(202, 138, 4, 0.36);
  }

  .difficulty-legend .hard,
  .diff-chip.hard {
    background: rgba(234, 88, 12, 0.36);
  }

  .difficulty-legend .severe,
  .diff-chip.severe {
    background: rgba(153, 27, 27, 0.4);
  }

  .layers-refresh {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.8rem;
    border: 1px solid rgba(255, 253, 248, 0.16);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.08);
    color: #fffdf8;
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .layers-refresh:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  .layers-credit {
    margin: 0;
    color: rgba(255, 253, 248, 0.4);
    font-size: 0.66rem;
    font-weight: 600;
    text-align: center;
  }

  /* ---- Day replay sheet ----------------------------------------------- */
  .days-intro {
    margin: 0;
    color: rgba(255, 253, 248, 0.66);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .day-chips {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
    gap: 0.5rem;
  }

  .day-chips button {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    align-items: flex-start;
    border: 1px solid rgba(255, 253, 248, 0.14);
    border-radius: 12px;
    background: rgba(255, 253, 248, 0.06);
    color: #fffdf8;
    cursor: pointer;
    padding: 0.55rem 0.7rem;
    text-align: left;
  }

  .day-chips button strong {
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .day-chips button small {
    color: rgba(255, 253, 248, 0.56);
    font-size: 0.68rem;
    font-weight: 600;
  }

  .day-chips button.active {
    border-color: rgba(56, 189, 248, 0.6);
    background: rgba(56, 189, 248, 0.18);
    color: #e0f2fe;
  }

  .day-pick {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-radius: 12px;
    background: rgba(255, 253, 248, 0.06);
    padding: 0.6rem 0.8rem;
  }

  .day-pick span {
    color: rgba(255, 253, 248, 0.66);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .day-pick input {
    flex: 0 1 auto;
    min-width: 0;
    border: 1px solid rgba(255, 253, 248, 0.18);
    border-radius: 8px;
    background: rgba(8, 13, 9, 0.5);
    color: #fffdf8;
    font: inherit;
    padding: 0.35rem 0.5rem;
    color-scheme: dark;
  }

  .day-empty {
    margin: 0;
    border-radius: 12px;
    background: rgba(255, 253, 248, 0.06);
    color: rgba(255, 253, 248, 0.74);
    font-size: 0.84rem;
    line-height: 1.45;
    padding: 0.85rem;
  }

  /* ---- Bottom sheet --------------------------------------------------- */
  .sheet {
    --difficulty-accent: #15803d;
    position: absolute;
    z-index: 6;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    height: 170px;
    overflow: hidden;
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -10px 44px rgba(0, 0, 0, 0.46);
    will-change: height;
    transition: height 0.34s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .sheet.dragging {
    transition: none;
  }

  .sheet::before {
    content: '';
    position: absolute;
    top: 0;
    left: 1.2rem;
    right: 1.2rem;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, var(--difficulty-accent), transparent);
    opacity: 0.85;
  }

  .sheet-head {
    flex: 0 0 auto;
  }

  .sheet-grab {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    height: 1.5rem;
    cursor: grab;
    touch-action: none;
  }

  .sheet-grab:active {
    cursor: grabbing;
  }

  .grab-bar {
    width: 2.6rem;
    height: 0.28rem;
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.4);
  }

  .peek {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0 1.05rem 0.55rem;
  }

  .peek-lead {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.04rem;
  }

  .peek-eyebrow {
    color: #d9f99d;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .peek-mile {
    font-size: 1.65rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .peek-sub {
    overflow: hidden;
    color: rgba(255, 253, 248, 0.6);
    font-size: 0.74rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .diff-chip {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 4.6rem;
    gap: 0.05rem;
    border-radius: 14px;
    padding: 0.45rem 0.7rem;
  }

  .diff-chip em {
    font-size: 1.4rem;
    font-style: normal;
    font-weight: 800;
    line-height: 1;
  }

  .diff-chip span {
    color: rgba(255, 253, 248, 0.78);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ---- Expanded body -------------------------------------------------- */
  .sheet-body {
    display: grid;
    flex: 1 1 auto;
    min-height: 0;
    align-content: start;
    gap: 0.6rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    padding: 0.2rem 1.05rem calc(1rem + env(safe-area-inset-bottom));
  }

  /* ---- Today card (live mode) ---------------------------------------- */
  .today-card {
    display: grid;
    gap: 0.5rem;
    border-radius: 14px;
    border: 1px solid rgba(217, 249, 157, 0.2);
    background: rgba(217, 249, 157, 0.07);
    padding: 0.7rem 0.8rem;
  }

  .today-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .today-lead {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .today-eyebrow {
    color: #d9f99d;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .today-lead strong {
    font-size: 1.18rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  .today-lead strong small {
    margin-left: 0.3rem;
    color: rgba(255, 253, 248, 0.6);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .fresh-chip {
    flex: 0 0 auto;
    align-self: center;
    border-radius: 999px;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 0.24rem 0.6rem;
    text-transform: uppercase;
  }

  .fresh-chip--live {
    background: rgba(34, 197, 94, 0.22);
    color: #bbf7d0;
  }

  .fresh-chip--stale {
    background: rgba(245, 158, 11, 0.22);
    color: #fde68a;
  }

  .fresh-chip--preview {
    background: rgba(56, 189, 248, 0.2);
    color: #bae6fd;
  }

  .fresh-chip--none {
    background: rgba(148, 163, 184, 0.24);
    color: #e2e8f0;
  }

  .today-rail {
    height: 7px;
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.12);
    overflow: hidden;
  }

  .today-rail i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #d9f99d, #f97316);
  }

  .today-foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    color: rgba(255, 253, 248, 0.72);
    font-size: 0.74rem;
    font-weight: 700;
  }

  .today-context {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .today-context span {
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.08);
    color: rgba(255, 253, 248, 0.82);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.22rem 0.55rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .today-context .ctx-here {
    color: #fdba74;
  }

  /* ---- Day summary (day mode) ---------------------------------------- */
  .day-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .day-head-mid {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .day-head strong {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .day-step {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    border: 1px solid rgba(255, 253, 248, 0.16);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.08);
    color: #fffdf8;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding-bottom: 0.12rem;
  }

  .day-step:active {
    background: rgba(255, 253, 248, 0.16);
  }

  .day-step:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .day-conf {
    flex: 0 0 auto;
    border-radius: 999px;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 0.24rem 0.6rem;
    text-transform: uppercase;
  }

  .day-conf--good {
    background: rgba(34, 197, 94, 0.2);
    color: #bbf7d0;
  }

  .day-conf--fair {
    background: rgba(245, 158, 11, 0.2);
    color: #fde68a;
  }

  .day-conf--sparse,
  .day-conf--none {
    background: rgba(148, 163, 184, 0.24);
    color: #e2e8f0;
  }

  .day-note {
    margin: 0;
    border-radius: 12px;
    border-left: 3px solid rgba(56, 189, 248, 0.6);
    background: rgba(56, 189, 248, 0.08);
    color: rgba(255, 253, 248, 0.82);
    font-size: 0.78rem;
    line-height: 1.45;
    padding: 0.6rem 0.7rem;
  }

  .back-live-btn {
    flex: 0 0 auto;
    border: 0;
    border-radius: 999px;
    background: #fff7ed;
    color: #1c1917;
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 0.65rem 1rem;
    text-transform: uppercase;
  }

  .metric-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .metric {
    min-width: 0;
    border-radius: 13px;
    background: rgba(255, 253, 248, 0.07);
    padding: 0.55rem 0.6rem;
  }

  .metric-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: rgba(255, 253, 248, 0.6);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .metric-label svg {
    flex: 0 0 auto;
    color: rgba(217, 249, 157, 0.8);
  }

  .metric strong {
    display: block;
    overflow: hidden;
    margin: 0.18rem 0 0.04rem;
    font-size: 1.32rem;
    font-weight: 800;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric small,
  .next-grid small,
  .action-row span {
    display: block;
    overflow: hidden;
    color: rgba(255, 253, 248, 0.62);
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-row {
    position: relative;
    overflow: hidden;
    border-radius: 13px;
    background: rgba(255, 253, 248, 0.06);
    padding: 0.4rem 0.5rem 0.25rem;
  }

  .profile-row svg {
    display: block;
    width: 100%;
    height: 76px;
  }

  .profile-fill {
    fill: rgba(217, 249, 157, 0.12);
  }

  .profile-line {
    fill: none;
    stroke: #d9f99d;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
  }

  .profile-cursor {
    stroke: #fb923c;
    stroke-dasharray: 4 4;
    stroke-width: 2;
  }

  .profile-y-labels {
    position: absolute;
    top: 0.45rem;
    bottom: 1.7rem;
    left: 0.55rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: rgba(255, 253, 248, 0.55);
    font-size: 0.6rem;
    font-weight: 700;
    pointer-events: none;
  }

  .profile-x-labels {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.2rem;
    color: rgba(255, 253, 248, 0.55);
    font-size: 0.64rem;
    font-weight: 700;
  }

  .profile-cursor-label {
    color: #fdba74;
    font-size: 0.7rem;
  }

  .history-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: 0.5rem;
    align-items: center;
  }

  .history-row button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.1rem;
    min-height: 2.1rem;
    border: 1px solid rgba(255, 253, 248, 0.16);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.08);
    color: #fffdf8;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 800;
  }

  .history-row .center {
    padding: 0 0.85rem;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.74rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .history-row input {
    width: 100%;
    accent-color: #f97316;
  }

  .next-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .next-grid button {
    min-width: 0;
    border: 1px solid rgba(255, 253, 248, 0.12);
    border-radius: 13px;
    background: rgba(255, 253, 248, 0.06);
    color: #fffdf8;
    cursor: pointer;
    padding: 0.5rem 0.55rem;
    text-align: left;
    transition: transform 140ms ease, border-color 140ms ease, background 140ms ease;
  }

  .next-grid button:active {
    transform: translateY(1px);
    background: rgba(255, 253, 248, 0.1);
  }

  .next-head {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.3rem;
  }

  .next-head svg {
    flex: 0 0 auto;
    color: rgba(217, 249, 157, 0.82);
  }

  .next-head span {
    overflow: hidden;
    color: rgba(255, 253, 248, 0.6);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .next-grid strong {
    display: block;
    margin: 0.12rem 0 0.02rem;
    color: #fff7ed;
    font-size: 1.02rem;
    font-weight: 800;
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.1rem;
  }

  .action-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-row a {
    flex: 0 0 auto;
    border-radius: 999px;
    background: #fff7ed;
    color: #1c1917;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 0.65rem 1rem;
    text-decoration: none;
    text-transform: uppercase;
  }

  .action-row a.ghost {
    background: transparent;
    border: 1px solid rgba(255, 253, 248, 0.28);
    color: #fffdf8;
  }

  .error {
    margin: 0 1.05rem 1.05rem;
    border-radius: 16px;
    background: rgba(127, 29, 29, 0.85);
    color: #fee2e2;
    font-weight: 700;
    padding: 0.85rem;
  }

  @media (max-width: 820px) {
    .trail-map-shell,
    .trail-map-shell.publicRoute {
      height: 100svh;
      min-height: 100svh;
    }

    .trail-map-shell.appMode {
      height: calc(100svh - 5rem - env(safe-area-inset-bottom));
      min-height: calc(100svh - 5rem - env(safe-area-inset-bottom));
    }
  }

  @media (max-width: 420px) {
    .status-text strong {
      font-size: 0.96rem;
    }

    .next-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .action-row {
      flex-direction: column;
      align-items: stretch;
    }

    .action-row a {
      text-align: center;
    }
  }

  @media (min-width: 821px) {
    .status-pill {
      flex: 0 1 24rem;
    }

    .top-bar {
      justify-content: flex-start;
    }
  }

  /* ---- Desktop: dock the sheet as a left panel (maps-app style) -------- */
  /* Gated on the `wide` class (matchMedia ≥1024px) so the inline sheet height
     is dropped in JS first — otherwise it would beat these rules. */
  .trail-map-shell.wide .sheet {
    left: max(1rem, env(safe-area-inset-left));
    right: auto;
    top: 5rem;
    bottom: 1rem;
    width: 25rem;
    height: auto;
    border-radius: 20px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
    transition: none;
  }

  .trail-map-shell.wide .sheet::before {
    left: 1.2rem;
    right: 1.2rem;
  }

  /* No drag-to-resize on desktop; the panel is a fixed-height scroller. */
  .trail-map-shell.wide .sheet-grab {
    height: 0.9rem;
    cursor: default;
  }

  .trail-map-shell.wide .sheet-grab .grab-bar {
    display: none;
  }

  /* Keep the map controls bottom-right of the map, not pinned above a sheet
     that no longer spans the width — and never hide them on desktop. */
  .trail-map-shell.wide .edge-tools,
  .trail-map-shell.wide.sheet-full .edge-tools {
    bottom: 1rem;
    right: max(1rem, env(safe-area-inset-right));
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  /* Layers / day-replay sheets become left-docked cards too. */
  .trail-map-shell.wide .layers-sheet {
    left: max(1rem, env(safe-area-inset-left));
    right: auto;
    bottom: 1rem;
    width: 25rem;
    border-radius: 20px;
  }

  /* The floating context chip clears the left panel instead of centering
     over it. */
  .trail-map-shell.wide .floating-chip {
    left: auto;
    right: 1rem;
    transform: none;
  }

  /* Day rail sits along the top of the map area, clear of the left panel. */
  .trail-map-shell.wide .day-rail {
    top: 1rem;
    left: calc(25rem + 2rem);
    right: 1rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet,
    .layers-sheet,
    .sheet-scrim {
      transition: none;
      animation: none;
    }
  }
</style>
