<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  // Relative import (not $lib) so the legacy Astro site can mount this
  // component cross-tree until the Forge cutover retires that build.
  import type {
    LatLon,
    TrailMapElevationPoint,
    TrailMapPack,
    TrailMapPoint,
    TrailMapWaypoint
  } from '../map-pack-types';

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
  let detailsOpen = $state(false);
  let layersOpen = $state(false);
  let lastRenderedTerrainMode: TerrainMode | null = null;
  let lastRenderedPlaceMode: PlaceMode | null = null;
  let lastRenderedMile = -1;

  let L: any = null;
  let map: any = null;
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
  // What the orange marker and "Selected" tile represent: a tapped trail mile
  // when inspecting, otherwise the scrubbed/live Garmin point.
  const displayedSelection = $derived.by(() => {
    if (inspectedMile !== null) {
      const coord = coordForMile(inspectedMile);
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
  const totalMiles = $derived.by(() => {
    const points = pack?.milepoints;
    return points?.length ? points[points.length - 1].mile : null;
  });
  const progressLine = $derived.by(() => {
    if (!currentPoint || !totalMiles) return '';
    const pct = clamp((currentPoint.mile / totalMiles) * 100, 0, 100);
    const remaining = Math.max(0, totalMiles - currentPoint.mile);
    return `${pct.toFixed(0)}% of ${Math.round(totalMiles).toLocaleString()} mi · ${Math.round(remaining).toLocaleString()} mi to Katahdin`;
  });
  const signalIsLive = $derived.by(() => {
    if (!currentPoint?.observedAt) return false;
    const observed = new Date(currentPoint.observedAt).getTime();
    if (Number.isNaN(observed)) return false;
    const staleAfterMinutes = pack?.tracker.staleAfterMinutes ?? 360;
    return Date.now() - observed <= staleAfterMinutes * 60000;
  });
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
      if (point.mile <= mile) lower = point;
      if (point.mile >= mile) {
        upper = point;
        break;
      }
    }

    if (!lower || !upper) return null;
    if (lower.mile === upper.mile) return [lower.lat, lower.lon];
    const progress = (mile - lower.mile) / (upper.mile - lower.mile);
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

  function profilePath(points: TrailMapElevationPoint[], width = 340, height = 82): string {
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
    for (const point of pack.milepoints) {
      if (point.mile % 25 !== 0) continue;
      L.circleMarker([point.lat, point.lon], {
        radius: point.mile % 100 === 0 ? 4.5 : 3,
        color: '#162018',
        fillColor: '#fef3c7',
        fillOpacity: 0.9,
        weight: 1
      }).bindTooltip(`Mile ${point.mile}`, { direction: 'top' })
        .on('click', () => { inspectedMile = point.mile; })
        .addTo(mileLayer);
    }
  }

  function addTerrainLayer() {
    clearLayer(terrainLayer);
    if (!pack || !L || !terrainLayer) return;

    if (terrainMode === 'grade') {
      for (const segment of pack.terrain.segments) {
        if (segment.maxGradePercent < 6) continue;
        const start = coordForMile(segment.startMile);
        const end = coordForMile(segment.endMile);
        if (!start || !end) continue;
        L.polyline([start, end], {
          color: colorForGrade(segment.maxGradePercent),
          weight: segment.maxGradePercent >= 16 ? 7 : 5,
          opacity: 0.72
        }).bindTooltip(`${segment.maxGradePercent.toFixed(0)}% max grade · ${segment.gainFt.toFixed(0)} ft gain`).on('click', forwardMapClick).addTo(terrainLayer);
      }
      return;
    }

    if (terrainMode === 'rockiness') {
      for (const segment of pack.terrain.rockiness) {
        if (segment.score < 3.2) continue;
        const start = coordForMile(segment.startMile);
        const end = coordForMile(segment.endMile);
        if (!start || !end) continue;
        L.polyline([start, end], {
          color: colorForRock(segment.score),
          weight: segment.score >= 6.5 ? 7 : 5,
          opacity: 0.68
        }).bindTooltip(`Rockiness ${segment.score.toFixed(1)}/10 · ${segment.label.replace(/_/gu, ' ')}`).on('click', forwardMapClick).addTo(terrainLayer);
      }
      return;
    }

    for (const segment of pack.terrain.difficulty) {
      const start = coordForMile(segment.startMile);
      const end = coordForMile(segment.endMile);
      if (!start || !end) continue;
      L.polyline([start, end], {
        color: colorForDifficulty(segment.score),
        weight: segment.score >= 8 ? 8 : 6,
        opacity: 0.76
      }).bindTooltip(`Difficulty ${segment.score.toFixed(1)}/10 · ${displayLabel(segment.label)}`).on('click', forwardMapClick).addTo(terrainLayer);
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

  function addTrackerLayer(recenter = false) {
    if (scrubbing) return;
    clearLayer(trackerLayer);
    if (!pack || !L || !trackerLayer) return;
    const path = history.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));

    if (path.length >= 2) {
      L.polyline(path.map((point) => [point.lat, point.lon]), {
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
        icon: L.divIcon({ className: 'scrub-marker', iconSize: [22, 22], iconAnchor: [11, 11] }),
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

  function nearestMilepointTo(lat: number, lon: number): { mile: number; lat: number; lon: number } | null {
    const points = pack?.milepoints;
    if (!points?.length) return null;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    let best: { mile: number; lat: number; lon: number } | null = null;
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

    return best;
  }

  function handleScrubDrag(event: { target: { getLatLng: () => { lat: number; lng: number } } }) {
    const now = Date.now();
    if (now - lastScrubUpdate < 90) return;
    lastScrubUpdate = now;

    const position = event.target.getLatLng();
    const nearest = nearestMilepointTo(position.lat, position.lng);
    if (nearest) inspectedMile = nearest.mile;
  }

  function handleScrubEnd(event: { target: { getLatLng: () => { lat: number; lng: number }; setLatLng: (latlng: [number, number]) => void } }) {
    const position = event.target.getLatLng();
    const nearest = nearestMilepointTo(position.lat, position.lng);
    if (nearest) {
      inspectedMile = nearest.mile;
      event.target.setLatLng([nearest.lat, nearest.lon]);
    }
    scrubbing = false;
  }

  function fitInitialView() {
    if (!map || !L || !pack) return;
    if (currentPoint) {
      map.setView([currentPoint.lat, currentPoint.lon], 11);
      return;
    }

    const bounds = L.latLngBounds([]);
    for (const segment of pack.route.segments) {
      for (const point of segment) bounds.extend(point);
    }
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28] });
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
    map.setView([displayedSelection.lat, displayedSelection.lon], Math.max(map.getZoom(), 12), {
      animate: true,
      duration: 0.25
    });
  }

  function clearInspect() {
    inspectedMile = null;
    recenterOnLive();
  }

  function recenterOnLive() {
    if (!currentPoint || !map) return;
    map.setView([currentPoint.lat, currentPoint.lon], Math.max(map.getZoom(), 11), {
      animate: true,
      duration: 0.25
    });
  }

  // Tapping near the trail inspects that mile's terrain, even where Dad
  // hasn't hiked yet. The hit area is a finger-sized 36px regardless of zoom,
  // so taps far from the corridor still behave as plain map panning.
  function inspectFromLatLng(lat: number, lon: number) {
    const points = pack?.milepoints;
    if (!points?.length || !map) return;

    const cosLat = Math.cos((lat * Math.PI) / 180);
    let best: { mile: number; lat: number; lon: number } | null = null;
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
    inspectedMile = best.mile;
  }

  onMount(async () => {
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

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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
    addTrackerLayer(false);
  });
</script>

<section class="trail-map-shell" class:publicRoute aria-label={title}>
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
  </svg>

  <header class="map-hud map-hud-top">
    <div class="identity">
      <a class="back-link" href={appMode ? '/app' : '/'} aria-label="Back">
        <svg aria-hidden="true"><use href="#trail-map-icon-arrow-left"></use></svg>
      </a>
      <div>
        <p class="eyebrow">{title}</p>
        <h1>{currentPoint ? `Mile ${fmt(currentPoint.mile, 1)}` : 'Loading trail signal'}</h1>
        {#if progressLine}
          <p class="progress-line">{progressLine}</p>
        {/if}
      </div>
    </div>

    <div class="hud-actions">
      <div class="signal">
        <span class="signal-dot" class:live={signalIsLive} class:stale={Boolean(currentPoint) && !signalIsLive}></span>
        <span>
          {#if currentPoint}
            {signalIsLive ? timeLabel(currentPoint.observedAt) : `Last seen ${timeLabel(currentPoint.observedAt)}`}
          {:else}
            {loading ? 'Loading' : 'No signal'}
          {/if}
        </span>
      </div>
      <button class="layers-toggle" type="button" aria-expanded={layersOpen} aria-controls="map-layer-panel" onclick={() => (layersOpen = !layersOpen)}>
        <svg class="control-icon" aria-hidden="true"><use href="#trail-map-icon-layers"></use></svg>
        <span>Layers</span>
        <strong>{terrainMode === 'difficulty' ? 'Diff' : terrainMode === 'rockiness' ? 'Rock' : 'Grade'} / {placeMode === 'access' ? 'Roads' : placeMode === 'view' ? 'Views' : placeMode === 'camp' ? 'Camp' : 'Core'}</strong>
      </button>
    </div>
  </header>

  {#if layersOpen}
    <aside id="map-layer-panel" class="map-hud mode-panel" aria-label="Map layers">
      <div class="mode-group">
        <span class="mode-label">Terrain</span>
        <button class:active={terrainMode === 'difficulty'} type="button" onclick={() => (terrainMode = 'difficulty')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-difficulty"></use></svg>
          <span>Diff</span>
        </button>
        <button class:active={terrainMode === 'grade'} type="button" onclick={() => (terrainMode = 'grade')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-grade"></use></svg>
          <span>Grade</span>
        </button>
        <button class:active={terrainMode === 'rockiness'} type="button" onclick={() => (terrainMode = 'rockiness')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-rock"></use></svg>
          <span>Rock</span>
        </button>
      </div>
      {#if terrainMode === 'difficulty'}
        <div class="difficulty-legend" aria-label="Difficulty color key">
          <span><i class="cruise"></i>Cruise</span>
          <span><i class="steady"></i>Steady</span>
          <span><i class="hard"></i>Hard</span>
          <span><i class="severe"></i>Severe</span>
        </div>
      {/if}
      <div class="mode-group">
        <span class="mode-label">Places</span>
        <button class:active={placeMode === 'core'} type="button" onclick={() => (placeMode = 'core')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-shelter"></use></svg>
          <span>Core</span>
        </button>
        <button class:active={placeMode === 'access'} type="button" onclick={() => (placeMode = 'access')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-road"></use></svg>
          <span>Roads</span>
        </button>
        <button class:active={placeMode === 'camp'} type="button" onclick={() => (placeMode = 'camp')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-camp"></use></svg>
          <span>Camp</span>
        </button>
        <button class:active={placeMode === 'view'} type="button" onclick={() => (placeMode = 'view')}>
          <svg aria-hidden="true"><use href="#trail-map-icon-view"></use></svg>
          <span>Views</span>
        </button>
      </div>
      <button class="refresh" type="button" onclick={() => loadPack(true)} disabled={loading}>
        <svg aria-hidden="true"><use href="#trail-map-icon-refresh"></use></svg>
        <span>{loading ? '...' : 'Refresh'}</span>
      </button>
    </aside>
  {/if}

  {#if inspectedMile !== null}
    <button class="map-hud inspect-chip" type="button" onclick={clearInspect}>
      <span>Inspecting mi {fmt(inspectedMile, 1)}</span>
      <strong>Back to live</strong>
    </button>
  {/if}

  <section class="map-hud detail-panel" class:expanded={detailsOpen} aria-label="Trail detail" style:--difficulty-accent={colorForDifficulty(selectedDifficulty?.score ?? 0)}>
    <button class="sheet-handle" type="button" aria-expanded={detailsOpen} aria-label={detailsOpen ? 'Collapse trail details' : 'Expand trail details'} onclick={() => (detailsOpen = !detailsOpen)}>
      <span></span>
    </button>
    {#if errorMessage}
      <div class="error">{errorMessage}</div>
    {:else}
      <div class="detail-summary">
        <div class="detail-grid">
          <div class="metric primary">
            <div class="metric-head">
              <svg aria-hidden="true"><use href="#trail-map-icon-route"></use></svg>
              <span>Selected</span>
            </div>
            <strong>mi {fmt(selectedMile, 1)}</strong>
            <small>{inspectedMile !== null ? 'Scouted on the map' : selectedPoint ? timeLabel(selectedPoint.observedAt) : 'No point selected'}</small>
          </div>
          <div class={`metric difficulty ${selectedDifficultyClass}`}>
            <div class="metric-head">
              <svg aria-hidden="true"><use href="#trail-map-icon-difficulty"></use></svg>
              <span>Difficulty</span>
            </div>
            <strong>{selectedDifficulty ? `${fmt(selectedDifficulty.score, 1)}/10` : '--'}</strong>
            <small>{displayLabel(selectedDifficulty?.label)}</small>
          </div>
          <div class="metric">
            <div class="metric-head">
              <svg aria-hidden="true"><use href="#trail-map-icon-elevation"></use></svg>
              <span>Elevation</span>
            </div>
            <strong>{selectedElevation ? `${fmt(selectedElevation.elevationFt)} ft` : '--'}</strong>
            <small>{selectedElevation?.state || 'USGS screen'}</small>
          </div>
          <div class="metric">
            <div class="metric-head">
              <svg aria-hidden="true"><use href="#trail-map-icon-grade"></use></svg>
              <span>Grade</span>
            </div>
            <strong>{selectedTerrain ? `${fmt(selectedTerrain.maxGradePercent)}%` : '--'}</strong>
            <small>{selectedTerrain ? `${fmt(selectedTerrain.gainFt)} ft up / ${fmt(selectedTerrain.lossFt)} ft down` : 'nearest mile'}</small>
          </div>
          <div class="metric">
            <div class="metric-head">
              <svg aria-hidden="true"><use href="#trail-map-icon-rock"></use></svg>
              <span>Rock</span>
            </div>
            <strong>{selectedRockiness ? `${fmt(selectedRockiness.score, 1)}/10` : '--'}</strong>
            <small>{displayLabel(selectedRockiness?.label)}</small>
          </div>
          <button class="details-toggle metric-action" type="button" aria-expanded={detailsOpen} onclick={() => (detailsOpen = !detailsOpen)}>
            <svg aria-hidden="true"><use href="#trail-map-icon-panel"></use></svg>
            <span>Details</span>
            <strong>{detailsOpen ? 'Less' : 'More'}</strong>
          </button>
        </div>
      </div>

      {#if detailsOpen}
        {#if history.length > 1}
          <div class="history-row">
            <button type="button" onclick={() => (selectedHistoryIndex = Math.max(0, selectedHistoryIndex - 1))}>−</button>
            <input
              type="range"
              min="0"
              max={history.length - 1}
              step="1"
              bind:value={selectedHistoryIndex}
              aria-label="Historical Garmin point"
            />
            <button type="button" onclick={() => (selectedHistoryIndex = Math.min(history.length - 1, selectedHistoryIndex + 1))}>+</button>
            <button class="center" type="button" onclick={recenterOnSelected}>Center</button>
          </div>
        {/if}

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
          {#if appMode}
            <a href={`/app/scout?prompt=${encodeURIComponent(scoutPrompt)}`}>Ask Scout</a>
          {:else}
            <a href="/app/map">Open in Scout</a>
          {/if}
          <span>{pack ? `${pack.terrain.elevation.length.toLocaleString()} elevation points · ${pack.terrain.rockiness.length.toLocaleString()} rockiness miles` : ''}</span>
        </div>
      {/if}
    {/if}
  </section>

  <div class="map-credit">OpenTopoMap · OSM · USGS 3DEP · Scout RC1</div>
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

  .back-link svg,
  .layers-toggle svg,
  .mode-group button svg,
  .refresh svg,
  .metric-head svg,
  .details-toggle svg,
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

  .trail-map-shell {
    position: relative;
    width: min(100vw, 100%);
    height: calc(100svh - 84px);
    min-height: 680px;
    overflow: hidden;
    border-radius: 0;
    background: #10130f;
    color: #fffdf8;
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

  .map-shade {
    z-index: 1;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(8, 13, 9, 0.62), rgba(8, 13, 9, 0.05) 30%, rgba(8, 13, 9, 0.18) 62%, rgba(8, 13, 9, 0.72)),
      radial-gradient(circle at 0% 100%, rgba(4, 10, 6, 0.58), transparent 42%);
  }

  .map-hud {
    position: absolute;
    z-index: 2;
    border: 1px solid rgba(255, 253, 248, 0.14);
    background: rgba(20, 28, 22, 0.78);
    box-shadow: 0 20px 70px rgba(0, 0, 0, 0.32);
    backdrop-filter: blur(14px);
  }

  .map-hud-top {
    top: max(0.75rem, env(safe-area-inset-top));
    left: max(0.75rem, env(safe-area-inset-left));
    right: max(0.75rem, env(safe-area-inset-right));
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-radius: 18px;
    padding: 0.75rem 0.85rem;
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 0.72rem;
    min-width: 0;
  }

  .hud-actions {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 0.55rem;
  }

  .back-link,
  .layers-toggle,
  .mode-group button,
  .refresh,
  .history-row button,
  .details-toggle,
  .next-grid button,
  .action-row a {
    border: 1px solid rgba(255, 253, 248, 0.16);
    color: #fffdf8;
    background: rgba(255, 253, 248, 0.08);
    text-decoration: none;
  }

  .back-link {
    display: grid;
    place-items: center;
    width: 2.55rem;
    height: 2.55rem;
    flex: 0 0 auto;
    border-radius: 999px;
    font-weight: 900;
  }

  .back-link svg {
    width: 1.28rem;
    height: 1.28rem;
  }

  .eyebrow {
    margin: 0 0 0.08rem;
    color: #d9f99d;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    line-height: 1;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    overflow: hidden;
    color: #fffdf8;
    font-size: clamp(1.55rem, 4vw, 2.8rem);
    line-height: 0.95;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .signal {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 7rem;
    gap: 0.45rem;
    color: rgba(255, 253, 248, 0.82);
    font-size: 0.84rem;
    font-weight: 800;
    text-align: right;
  }

  .signal-dot {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 999px;
    background: #64748b;
  }

  .signal-dot.live {
    background: #22c55e;
    box-shadow: 0 0 0 7px rgba(34, 197, 94, 0.15);
  }

  :global(.scrub-marker) {
    box-sizing: border-box;
    border: 3px solid #fff7ed;
    border-radius: 999px;
    background: #ea580c;
    box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.25), 0 4px 10px rgba(0, 0, 0, 0.35);
    cursor: grab;
  }

  :global(.scrub-marker:active) {
    cursor: grabbing;
  }

  .profile-row {
    position: relative;
  }

  .profile-y-labels {
    position: absolute;
    top: 0.2rem;
    bottom: 1.6rem;
    left: 0.35rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: rgba(255, 253, 248, 0.55);
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    pointer-events: none;
  }

  .profile-x-labels {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.25rem;
    color: rgba(255, 253, 248, 0.55);
    font-size: 0.64rem;
    font-weight: 800;
  }

  .profile-cursor-label {
    color: #fdba74;
    font-size: 0.7rem;
  }

  .signal-dot.stale {
    background: #d97706;
    box-shadow: 0 0 0 7px rgba(217, 119, 6, 0.14);
  }

  .progress-line {
    margin: 0.22rem 0 0;
    overflow: hidden;
    color: rgba(255, 253, 248, 0.66);
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .inspect-chip {
    top: calc(max(0.75rem, env(safe-area-inset-top)) + 5.4rem);
    left: 50%;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.5rem 0.8rem;
    transform: translateX(-50%);
    border-radius: 999px;
    color: #fffdf8;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
  }

  .inspect-chip span {
    color: rgba(255, 253, 248, 0.78);
  }

  .inspect-chip strong {
    color: #d9f99d;
    font-family: Oswald, Impact, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .layers-toggle {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    min-width: 6.45rem;
    min-height: 2.42rem;
    align-content: center;
    align-items: center;
    column-gap: 0.48rem;
    border-radius: 999px;
    cursor: pointer;
    padding: 0.34rem 0.7rem;
    text-align: left;
  }

  .layers-toggle .control-icon {
    grid-row: 1 / span 2;
    width: 1.05rem;
    height: 1.05rem;
    color: #d9f99d;
  }

  .layers-toggle span {
    color: rgba(255, 253, 248, 0.58);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.56rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
  }

  .layers-toggle strong {
    grid-column: 2;
    overflow: hidden;
    color: #fffdf8;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.78rem;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .layers-toggle[aria-expanded='true'] {
    border-color: rgba(217, 249, 157, 0.55);
    background: rgba(217, 249, 157, 0.18);
  }

  .mode-panel {
    top: 6.3rem;
    right: max(0.75rem, env(safe-area-inset-right));
    display: grid;
    width: min(17rem, calc(100vw - 1.5rem));
    gap: 0.65rem;
    border-radius: 18px;
    padding: 0.68rem;
  }

  .mode-group {
    display: grid;
    grid-template-columns: 4.2rem repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
    align-items: center;
  }

  .mode-group:nth-of-type(2) {
    grid-template-columns: 4.2rem repeat(4, minmax(0, 1fr));
  }

  .mode-group > .mode-label {
    color: rgba(255, 253, 248, 0.68);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .mode-group button,
  .refresh,
  .details-toggle,
  .history-row button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
    min-height: 2rem;
    border-radius: 999px;
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .mode-group button svg,
  .refresh svg {
    width: 0.86rem;
    height: 0.86rem;
    color: rgba(255, 253, 248, 0.74);
  }

  .mode-group button.active {
    border-color: rgba(217, 249, 157, 0.55);
    background: rgba(217, 249, 157, 0.18);
    color: #ecfccb;
  }

  .mode-group button.active svg {
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
    gap: 0.25rem;
    color: rgba(255, 253, 248, 0.7);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.58rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .difficulty-legend i {
    width: 0.5rem;
    height: 0.5rem;
    flex: 0 0 auto;
    border-radius: 999px;
  }

  .difficulty-legend .cruise,
  .metric.difficulty.cruise {
    background: rgba(21, 128, 61, 0.34);
  }

  .difficulty-legend .steady,
  .metric.difficulty.steady {
    background: rgba(202, 138, 4, 0.3);
  }

  .difficulty-legend .hard,
  .metric.difficulty.hard {
    background: rgba(234, 88, 12, 0.32);
  }

  .difficulty-legend .severe,
  .metric.difficulty.severe {
    background: rgba(153, 27, 27, 0.34);
  }

  .refresh:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  .detail-panel {
    --difficulty-accent: #15803d;
    left: max(0.75rem, env(safe-area-inset-left));
    right: max(0.75rem, env(safe-area-inset-right));
    bottom: max(0.75rem, env(safe-area-inset-bottom));
    display: grid;
    gap: 0.55rem;
    border-radius: 18px;
    padding: clamp(0.68rem, 1.4vw, 0.9rem) clamp(0.55rem, 1.4vw, 0.8rem) clamp(0.55rem, 1.4vw, 0.8rem);
  }

  .detail-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 1.15rem;
    right: 1.15rem;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, var(--difficulty-accent), transparent);
    opacity: 0.82;
  }

  .sheet-handle {
    position: absolute;
    top: 0.28rem;
    left: 50%;
    display: grid;
    width: 3.9rem;
    height: 1.05rem;
    place-items: center;
    transform: translateX(-50%);
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 0;
  }

  .sheet-handle span {
    display: block;
    width: 2.3rem;
    height: 0.22rem;
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.42);
  }

  .detail-summary {
    min-width: 0;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1.15fr repeat(4, minmax(0, 1fr)) minmax(4.2rem, 0.52fr);
    gap: 0.55rem;
  }

  .metric {
    position: relative;
    min-width: 0;
    border-radius: 13px;
    background: rgba(255, 253, 248, 0.08);
    padding: 0.52rem 0.58rem 0.5rem;
    box-shadow: inset 0 1px 0 rgba(255, 253, 248, 0.08);
  }

  .metric.primary {
    background: rgba(217, 119, 6, 0.22);
  }

  .metric.difficulty {
    box-shadow: inset 0 1px 0 rgba(255, 253, 248, 0.1), inset 0 -2px 0 var(--difficulty-accent);
  }

  .metric-head,
  .next-head {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.34rem;
  }

  .metric-head svg,
  .next-head svg {
    flex: 0 0 auto;
    color: rgba(217, 249, 157, 0.82);
  }

  .metric-head span,
  .next-head span {
    display: block;
    overflow: hidden;
    color: rgba(255, 253, 248, 0.62);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .metric strong {
    display: block;
    overflow: hidden;
    margin: 0.08rem 0;
    font-size: clamp(1.05rem, 2.3vw, 1.55rem);
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric small,
  .next-grid small,
  .action-row span {
    display: block;
    overflow: hidden;
    color: rgba(255, 253, 248, 0.64);
    font-size: 0.72rem;
    font-weight: 740;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .details-toggle {
    display: grid;
    min-width: 0;
    align-content: center;
    justify-items: center;
    gap: 0.1rem;
    border-radius: 13px;
    padding: 0.42rem 0.45rem;
  }

  .details-toggle svg {
    width: 1.04rem;
    height: 1.04rem;
    color: #d9f99d;
  }

  .details-toggle span {
    color: rgba(255, 253, 248, 0.62);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    line-height: 1;
    text-transform: uppercase;
  }

  .details-toggle strong {
    color: #fffdf8;
    font-size: 1.2rem;
    line-height: 0.95;
  }

  .history-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: 0.5rem;
    align-items: center;
  }

  .history-row input {
    width: 100%;
    accent-color: #f97316;
  }

  .history-row .center {
    padding: 0 0.8rem;
  }

  .profile-row {
    overflow: hidden;
    border-radius: 13px;
    background: rgba(255, 253, 248, 0.07);
    padding: 0.35rem 0.45rem 0.2rem;
  }

  .profile-row svg {
    display: block;
    width: 100%;
    height: 72px;
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

  .next-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .next-grid button {
    min-width: 0;
    border-radius: 13px;
    cursor: pointer;
    padding: 0.5rem 0.58rem;
    text-align: left;
    transition: transform 140ms ease, border-color 140ms ease, background 140ms ease;
  }

  .next-grid button:hover {
    transform: translateY(-1px);
    border-color: rgba(217, 249, 157, 0.38);
    background: rgba(255, 253, 248, 0.11);
  }

  .next-grid strong {
    display: block;
    margin: 0.08rem 0;
    color: #fff7ed;
    font-size: 1rem;
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .action-row a {
    border-radius: 999px;
    background: #fff7ed;
    color: #1c1917;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    padding: 0.68rem 1rem;
    text-transform: uppercase;
  }

  .error {
    border-radius: 16px;
    background: rgba(127, 29, 29, 0.82);
    color: #fee2e2;
    font-weight: 850;
    padding: 0.8rem;
  }

  .map-credit {
    position: absolute;
    z-index: 2;
    top: 19.6rem;
    right: max(0.75rem, env(safe-area-inset-right));
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.58);
    color: rgba(255, 253, 248, 0.68);
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.35rem 0.55rem;
    z-index: 2;
  }

  @media (max-width: 820px) {
    .trail-map-shell,
    .trail-map-shell.publicRoute {
      height: 100svh;
      min-height: 100svh;
    }

    .map-hud-top {
      align-items: center;
      padding-right: 0.7rem;
    }

    .hud-actions {
      gap: 0.38rem;
    }

    .signal {
      min-width: 5.5rem;
      font-size: 0.72rem;
    }

    .mode-panel {
      top: 5.85rem;
      left: max(0.75rem, env(safe-area-inset-left));
      right: max(0.75rem, env(safe-area-inset-right));
      width: auto;
    }

    .detail-panel {
      max-height: 49svh;
      overflow-y: auto;
    }

    .detail-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .next-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .map-credit {
      display: none;
    }
  }

  @media (max-width: 520px) {
    .map-hud-top {
      gap: 0.45rem;
      border-radius: 16px;
      padding: 0.58rem;
    }

    .back-link {
      width: 2.25rem;
      height: 2.25rem;
    }

    h1 {
      max-width: 7.8rem;
      font-size: 1.45rem;
    }

    .hud-actions {
      align-items: flex-end;
      flex-direction: column;
      gap: 0.28rem;
    }

    .signal {
      min-width: 0;
      gap: 0.34rem;
      font-size: 0.64rem;
    }

    .signal-dot {
      width: 0.56rem;
      height: 0.56rem;
    }

    .layers-toggle {
      min-width: 4.8rem;
      min-height: 1.7rem;
      padding: 0.22rem 0.54rem;
    }

    .layers-toggle span {
      display: none;
    }

    .layers-toggle strong {
      font-size: 0.68rem;
    }

    .mode-group,
    .mode-group:nth-of-type(2) {
      grid-template-columns: 1fr;
    }

    .mode-group {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .mode-panel {
      gap: 0.48rem;
      padding: 0.52rem;
    }

    .mode-group {
      gap: 0.28rem;
    }

    .mode-group button,
    .refresh,
    .details-toggle,
    .history-row button {
      min-height: 1.85rem;
      font-size: 0.66rem;
    }

    .mode-group > .mode-label {
      grid-column: 1 / -1;
    }

    .detail-panel {
      gap: 0.42rem;
      padding: 0.72rem 0.5rem 0.5rem;
    }

    .detail-summary {
      display: block;
    }

    .detail-grid {
      grid-template-columns: 1fr 1fr;
      gap: 0.42rem;
    }

    .metric {
      padding: 0.42rem 0.48rem;
    }

    .metric-head span,
    .next-head span {
      font-size: 0.58rem;
    }

    .metric-head svg,
    .next-head svg {
      width: 0.86rem;
      height: 0.86rem;
    }

    .metric strong {
      font-size: 1.22rem;
    }

    .metric small,
    .next-grid small,
    .action-row span {
      font-size: 0.66rem;
    }

    .details-toggle {
      width: auto;
      min-height: 3.8rem;
      padding: 0.38rem 0.45rem;
    }

    .details-toggle strong {
      font-size: 1rem;
    }

    .history-row {
      grid-template-columns: auto minmax(0, 1fr) auto;
    }

    .history-row .center {
      grid-column: 1 / -1;
    }

    .action-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
