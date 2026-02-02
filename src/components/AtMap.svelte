<script lang="ts">
  import { onMount } from "svelte";
  import { loadContext, trailContext, updateContext } from "../stores/trailContext.svelte";
  import { LIVE_TRACKING_URL } from "../lib/config";
  import "leaflet/dist/leaflet.css";

  import atWaterSources from "../data/at-water-sources.json";
  import atHydroCrossings from "../data/at-hydro-crossings.json";
  import { RESUPPLY_STOPS } from "../data/resupplyStops";
  import { AT_ROAD_CROSSINGS } from "../data/at-road-crossings";
  import { TRAIL_SECTIONS, getSectionForMile, getSectionProgress, STATE_BOUNDARIES } from "../data/trailSections";
  import { MILESTONES, getNextMilestone } from "../data/trailMilestones";
  
  import CharacterPanel from "./map/CharacterPanel.svelte";
  import BudgetPanel from "./map/BudgetPanel.svelte";

  let container: HTMLDivElement;

  // UI state (Layers)
  let showMileMarkers = $state(true);
  let showWaterSources = $state(false);
  let showPerennialStreams = $state(false);
  let showIntermittentStreams = $state(false);
  let showResupplyStops = $state(true);
  let showRoadCrossings = $state(false);
  let showShelters = $state(true);
  let showHoggTracker = $state(true);
  let showMailDrops = $state(false);
  let showMilestones = $state(true);

  type HoggFix = { mile: number; lat: number; lon: number; when?: string };
  let hoggFix = $state<HoggFix | null>(null);
  let hoggLoading = $state(false);
  let hoggError = $state<string>("");
  let centerOnHoggFn: (() => void) | null = null;

  function timeAgo(iso?: string): string {
    if (!iso) return "";
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  // Panel State
  let layersOpen = $state(false);
  let characterOpen = $state(false);
  let budgetOpen = $state(false);
  
  // Nearby / Weather Drawer State
  let wxDrawerOpen = $state(false);

  // Mile selection
  const PREVIEW_KEY = "hcAtMap.previewMile";

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function parseMileParam(): number | null {
    if (typeof window === "undefined") return null;
    const u = new URL(window.location.href);
    const raw = u.searchParams.get("mile");
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return clamp(Math.round(n), 0, 2197);
  }

  function readSavedPreviewMile(): number | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(PREVIEW_KEY);
      if (!raw) return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      return clamp(Math.round(n), 0, 2197);
    } catch {
      return null;
    }
  }

  function savePreviewMile(m: number) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREVIEW_KEY, String(Math.round(m)));
    } catch {}
  }

  let selectedMile = $state<number>(0); 
  let savedMile = $derived.by(() => Number(trailContext.currentMile) || 0);

  // Derived Journey Data
  const progressPercent = $derived.by(() => Math.round((selectedMile / 2197.4) * 100));
  const currentSection = $derived.by(() => getSectionProgress(selectedMile));
  const nextMilestone = $derived.by(() => getNextMilestone(selectedMile));

  // Selected marker coordinate
  let selectedLat = $state<number>(0);
  let selectedLon = $state<number>(0);

  // Weather (Open-Meteo)
  type WeatherNow = {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
  };

  type OpenMeteoResponse = {
    current?: WeatherNow;
  };

  let wxLoading = $state(false);
  let wxErr = $state('');
  let wx = $state<OpenMeteoResponse | null>(null);

  function fmt(n: unknown, digits = 0): string {
    const x = Number(n);
    if (!Number.isFinite(x)) return '—';
    return x.toFixed(digits);
  }

  function wxIcon(code: unknown): string {
    const c = Number(code);
    if (!Number.isFinite(c)) return "•";
    if (c === 0) return "☀️";
    if (c === 1 || c === 2) return "⛅";
    if (c === 3) return "☁️";
    if (c >= 45 && c <= 48) return "🌫️";
    if (c >= 51 && c <= 67) return "🌧️";
    if (c >= 71 && c <= 77) return "🌨️";
    if (c >= 80 && c <= 82) return "🌧️";
    if (c >= 85 && c <= 86) return "🌨️";
    if (c >= 95) return "⛈️";
    return "⛅";
  }

  let _wxTimer: any = null;
  let _wxAbort: AbortController | null = null;
  const WX_CACHE_TTL_MS = 10 * 60 * 1000;
  const wxCache = new Map<string, { ts: number; data: OpenMeteoResponse }>();

  function fetchWeatherDebounced() {
    if (typeof window === 'undefined') return;
    clearTimeout(_wxTimer);
    _wxTimer = setTimeout(() => {
      fetchWeather();
    }, 350);
  }

  async function fetchWeather() {
    if (!Number.isFinite(selectedLat) || !Number.isFinite(selectedLon) || selectedLat === 0 || selectedLon === 0) return;
    const key = `${selectedLat.toFixed(2)},${selectedLon.toFixed(2)}`;
    const cached = wxCache.get(key);
    if (cached && Date.now() - cached.ts < WX_CACHE_TTL_MS) {
      wx = cached.data;
      return;
    }

    _wxAbort?.abort();
    _wxAbort = new AbortController();
    wxLoading = true;

    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(selectedLat));
      url.searchParams.set('longitude', String(selectedLon));
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('temperature_unit', 'fahrenheit');
      url.searchParams.set('current', 'temperature_2m,weather_code');

      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' }, signal: _wxAbort.signal });
      if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`);
      wx = await res.json();
      if (wx) wxCache.set(key, { ts: Date.now(), data: wx });
    } catch (e: any) {
        if (e.name !== 'AbortError') wxErr = e.message;
    } finally {
      wxLoading = false;
    }
  }

  function adjustMile(delta: number) {
    selectedMile = clamp(selectedMile + delta, 0, 2197);
  }

  // Map hooks
  let mapReady = $state(false);
  let syncOverlaysFn: (() => void) | null = null;
  let locatePreviewFn: (() => void) | null = null;
  let centerOnSelectedFn: (() => void) | null = null;

  function updateUrl(nextMile: number) {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    u.searchParams.set("mile", String(Math.round(nextMile)));
    window.history.replaceState({}, "", u.toString());
  }

  function getInitialMile(): number {
    const fromUrl = parseMileParam();
    if (fromUrl != null) return fromUrl;
    const c = Number(trailContext.currentMile);
    if (Number.isFinite(c) && c > 0) return clamp(Math.round(c), 0, 2197);
    const fromSaved = readSavedPreviewMile();
    return fromSaved ?? 0;
  }

  // POI Helpers
  function nextAfter<T extends { mile: number }>(list: T[], mile: number): T | null {
    let best: T | null = null;
    for (const item of list) {
      if (item.mile < mile) continue;
      if (!best || item.mile < best.mile) best = item;
    }
    return best;
  }
  
  function distAhead(item: { mile: number } | null | undefined): string {
      if (!item) return '—';
      return (item.mile - selectedMile).toFixed(1);
  }

  const hydroCrossingsSorted = (Array.isArray(atHydroCrossings) ? atHydroCrossings : [])
    .filter(s => typeof s?.mile === "number")
    .sort((a, b) => a.mile - b.mile);

  const perennialStreams = hydroCrossingsSorted.filter(s => s.flow === "perennial");
  
  // Shelter dataset indexed (populated on mount)
  let sheltersWithMile = $state<Array<{ name: string; mile: number; lat: number; lon: number }>>([]);

  const nextResupply = $derived.by(() => nextAfter(RESUPPLY_STOPS as any[], selectedMile));
  const nextWater = $derived.by(() => nextAfter(atWaterSources as any[], selectedMile));
  const nextShelter = $derived.by(() => nextAfter(sheltersWithMile as any[], selectedMile));

  function flyToMile(mile: number | undefined) {
      if (mile == null) return;
      selectedMile = mile;
      centerOnSelectedFn?.();
  }

  // Effect: Sync URL/Local
  $effect(() => {
    updateUrl(selectedMile);
    savePreviewMile(selectedMile);
  });

  // Effect: Sync Layers
  $effect(() => {
    if (!mapReady || !syncOverlaysFn) return;
    // touch reactive inputs
    void showMileMarkers;
    void showWaterSources;
    void showPerennialStreams;
    void showIntermittentStreams;
    void showResupplyStops;
    void showRoadCrossings;
    void showShelters;
    void showHoggTracker;
    void showMailDrops;
    void showMilestones;

    syncOverlaysFn();
  });

  // Effect: Move Marker
  $effect(() => {
    if (!mapReady || !centerOnSelectedFn) return;
    void selectedMile;
    centerOnSelectedFn();
  });

  // --- LEAFLET INIT ---
  onMount(async () => {
    loadContext();
    selectedMile = getInitialMile();
    
    const L = await import("leaflet");

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    });

    const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
    });
    topo.addTo(map);
    map.setView([39.0, -76.0], 5);

    // Trail Line
    try {
      const res = await fetch("/data/appalachian-trail.geojson");
      if (res.ok) {
        const geojson = await res.json();
        const layer = L.geoJSON(geojson, { style: { color: "#f97316", weight: 3, opacity: 0.9 } }).addTo(map);
        const bounds = layer.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [18, 18] });
      }
    } catch (e) { console.error(e); }

    // Layers
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const mileLayer = L.layerGroup();
    const waterLayer = L.layerGroup();
    const streamLayer = L.layerGroup();
    const resupplyLayer = L.layerGroup();
    const crossingLayer = L.layerGroup();
    const shelterLayer = L.layerGroup();
    const hoggLayer = L.layerGroup();
    const mailDropLayer = L.layerGroup();
    const milestoneLayer = L.layerGroup();
    const boundaryLayer = L.layerGroup();

    const mileCoord = new Map<number, { lat: number; lon: number }>();

    function coordForMile(mile: number): [number, number] | null {
      if (!Number.isFinite(mile)) return null;
      const lo = Math.floor(mile), hi = Math.ceil(mile);
      const a = mileCoord.get(lo), b = mileCoord.get(hi);
      if (!a || !b) return a ? [a.lat, a.lon] : null;
      if (lo === hi) return [a.lat, a.lon];
      const t = (mile - lo) / (hi - lo);
      return [a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t];
    }

    const milepostsRaw: { mile: number; lat: number; lon: number }[] = [];

    async function loadData() {
        // Mileposts
        const resMP = await fetch("/at-mileposts.json");
        if (resMP.ok) {
            const data = await resMP.json();
            for (const mp of data.mileposts || []) {
                mileCoord.set(mp.mile, { lat: mp.lat, lon: mp.lon });
                milepostsRaw.push(mp);
            }
        }

        // Mile Markers
        for (const mp of milepostsRaw) {
            if (mp.mile % 10 === 0) {
                L.circleMarker([mp.lat, mp.lon], {
                    radius: 4, color: "#0f172a", weight: 1, fillColor: "#22c55e", fillOpacity: 0.85, renderer: canvasRenderer
                }).bindPopup(`<b>Mile ${mp.mile}</b>`).addTo(mileLayer);
            }
        }

        // Resupply & Mail Drops
        for (const stop of RESUPPLY_STOPS) {
            const ll = coordForMile(stop.mile);
            if (!ll) continue;
            
            // Standard resupply marker
            L.circleMarker(ll, {
                radius: 6, color: "#7f1d1d", weight: 2, fillColor: "#ef4444", fillOpacity: 0.75, renderer: canvasRenderer
            }).bindPopup(`<b>${stop.name}</b><br/>Mile ${stop.mile}`).addTo(resupplyLayer);

            // Mail Drop
            if (stop.mailDrop) {
                L.marker(ll, {
                    icon: L.divIcon({ className: 'mail-drop-icon', html: '📫', iconSize: [20, 20] })
                }).bindPopup(`<b>${stop.name}</b><br/>Mail Drop Available`).addTo(mailDropLayer);
            }
        }

        // Milestones
        for (const m of MILESTONES) {
            const ll = coordForMile(m.mile);
            if (ll) {
                L.marker(ll, {
                    icon: L.divIcon({ className: 'milestone-icon', html: m.emoji, iconSize: [24, 24] })
                }).bindPopup(`<b>${m.name}</b><br/>Mile ${m.mile}`).addTo(milestoneLayer);
            }
        }

        // State Boundaries
        for (const b of STATE_BOUNDARIES) {
            const ll = coordForMile(b.mile);
            if (ll) {
                L.circleMarker(ll, {
                    radius: 6, color: "#f97316", weight: 2, fillColor: "#fff", fillOpacity: 1
                }).bindPopup(`<b>${b.from} → ${b.to}</b><br/>Mile ${b.mile}`).addTo(boundaryLayer);
            }
        }

        // Water
        for (const src of atWaterSources as any[]) {
            const ll = coordForMile(src.mile);
            if (ll) L.circleMarker(ll, {
                radius: 4, color: "#0c4a6e", weight: 1, fillColor: "#38bdf8", fillOpacity: 0.75, renderer: canvasRenderer
            }).bindPopup(`<b>${src.name}</b><br/>Mile ${src.mile}`).addTo(waterLayer);
        }

        // Shelters
        try {
            const resS = await fetch("/data/at-shelters.geojson");
            if (resS.ok) {
                const data = await resS.json();
                const tempShelters: any[] = [];
                for (const ft of data.features || []) {
                    const [lon, lat] = ft.geometry.coordinates;
                    const name = ft.properties.name || "Shelter";
                    tempShelters.push({ name, lat, lon });
                    
                    L.circleMarker([lat, lon], {
                        radius: 5, color: "#92400e", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.75, renderer: canvasRenderer
                    }).bindPopup(`<b>${name}</b>`).addTo(shelterLayer);
                }
                
                // Index shelters
                sheltersWithMile = tempShelters.map(s => {
                    const m = nearestMileForLatLng(s.lat, s.lon);
                    return m != null ? { ...s, mile: m } : null;
                }).filter(Boolean).sort((a, b) => a.mile - b.mile);
            }
        } catch (e) { console.error(e); }
    }

    await loadData();

    // Hogg Tracker (Garmin MapShare → Netlify Function)
    const trackingId = (() => {
      try {
        const u = new URL(LIVE_TRACKING_URL);
        return u.pathname.replace(/^\/+/, "").split("/")[0] || "hoggcountry";
      } catch {
        return "hoggcountry";
      }
    })();

    const hoggIcon = L.divIcon({
      className: "hc-hogg-pin",
      html: '<div class="hc-hogg-pin__dot"></div><div class="hc-hogg-pin__pulse"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    let hoggMarker: any = null;

    async function refreshHoggTracker() {
      hoggLoading = true;
      hoggError = "";

      try {
        const url = new URL("/.netlify/functions/garmin-track", window.location.origin);
        url.searchParams.set("id", trackingId);

        const res = await fetch(url.toString(), {
          headers: { Accept: "application/geo+json,application/json" },
        });
        if (!res.ok) throw new Error(`garmin-track failed: ${res.status}`);

        const geojson: any = await res.json();

        const lp = geojson?.properties?.latestPoint;
        const coords = lp?.coords;
        const when = lp?.when;

        if (!Array.isArray(coords) || coords.length < 2) {
          hoggFix = null;
          return;
        }

        const lat = Number(coords[0]);
        const lon = Number(coords[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          hoggFix = null;
          return;
        }

        const mile = nearestMileForLatLng(lat, lon);
        if (mile == null) {
          hoggFix = null;
          return;
        }

        hoggFix = {
          mile,
          lat,
          lon,
          when: typeof when === "string" ? when : undefined,
        };

        const ll: [number, number] = [lat, lon];
        if (!hoggMarker) {
          hoggMarker = L.marker(ll, { icon: hoggIcon });
          hoggMarker.addTo(hoggLayer);
        } else {
          hoggMarker.setLatLng(ll);
        }

        hoggMarker.bindPopup(
          `<b>HoggCountry</b><br/>Mile ~${mile.toFixed(1)}${when ? `<br/>Updated: ${when}` : ""}`
        );

        centerOnHoggFn = () => {
          map.setView(ll, Math.max(map.getZoom(), 12), { animate: true, duration: 0.35 } as any);
          selectedMile = clamp(Math.round(mile), 0, 2197);
        };
      } catch (e: any) {
        hoggError = e?.message || String(e);
        hoggFix = null;
      } finally {
        hoggLoading = false;
      }
    }

    // Initial fetch + periodic refresh (edge-cached for 5 minutes)
    refreshHoggTracker();
    window.setInterval(refreshHoggTracker, 60 * 1000);

    // Marker Logic
    const mileIcon = L.divIcon({
        className: "hc-mile-pin",
        html: '<div class="hc-mile-pin__dot"></div><div class="hc-mile-pin__ring"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });

    let selectedMarker: any = null;
    let _selAnim: number | null = null;

    function moveSelectedMarker(recenter = false) {
        const ll = coordForMile(selectedMile);
        if (!ll) return;
        selectedLat = ll[0];
        selectedLon = ll[1];
        fetchWeatherDebounced();

        const animateTo = (target: [number, number]) => {
            if (!selectedMarker) return;
            const from = selectedMarker.getLatLng();
            const start = performance.now();
            const tick = (t: number) => {
                const p = Math.min(1, (t - start) / 180);
                const ease = 1 - Math.pow(1 - p, 3);
                selectedMarker.setLatLng([from.lat + (target[0] - from.lat) * ease, from.lng + (target[1] - from.lng) * ease]);
                if (p < 1) _selAnim = requestAnimationFrame(tick);
            };
            if (_selAnim) cancelAnimationFrame(_selAnim);
            _selAnim = requestAnimationFrame(tick);
        };

        if (!selectedMarker) {
            selectedMarker = L.marker(ll, { icon: mileIcon, draggable: true }).addTo(map);
            selectedMarker.on("dragend", () => {
                const pos = selectedMarker.getLatLng();
                const m = nearestMileForLatLng(pos.lat, pos.lng);
                if (m != null) selectedMile = clamp(m, 0, 2197);
            });
        } else {
            animateTo(ll);
        }

        if (recenter) map.setView(ll, Math.max(map.getZoom(), 12), { animate: true, duration: 0.35 } as any);
    }

    centerOnSelectedFn = () => moveSelectedMarker(false);
    moveSelectedMarker(true);

    // Helpers
    function nearestMileForLatLng(lat: number, lon: number): number | null {
        if (!milepostsRaw.length) return null;
        let best = milepostsRaw[0].mile, bestD = Infinity;
        for (const mp of milepostsRaw) {
            const d = (lat - mp.lat)**2 + (lon - mp.lon)**2; // simple euclidean sufficient for nearest
            if (d < bestD) { bestD = d; best = mp.mile; }
        }
        return best;
    }

    function syncOverlays() {
        const toggle = (l: any, show: boolean) => show ? (!map.hasLayer(l) && l.addTo(map)) : (map.hasLayer(l) && map.removeLayer(l));
        const z = map.getZoom();
        
        toggle(mileLayer, showMileMarkers);
        toggle(resupplyLayer, showResupplyStops);
        toggle(crossingLayer, showRoadCrossings);
        toggle(shelterLayer, showShelters && z >= 9);
        toggle(waterLayer, showWaterSources && z >= 11);
        toggle(streamLayer, (showPerennialStreams || showIntermittentStreams) && z >= 12);
        toggle(hoggLayer, showHoggTracker);
        toggle(mailDropLayer, showMailDrops);
        toggle(milestoneLayer, showMilestones);
        toggle(boundaryLayer, true); // Always show state lines
    }

    syncOverlaysFn = syncOverlays;
    map.on("zoomend", syncOverlays);
    mapReady = true;
    syncOverlays();

    // Hogg Tracker (Simplified)
    // ... (omitted polling logic for brevity, assumed preserved or simplified)
    
    // Geolocation
    locatePreviewFn = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude, lon = pos.coords.longitude;
            L.circleMarker([lat, lon], { radius: 7, color: "#1d4ed8", fillColor: "#60a5fa", fillOpacity: 0.75 }).addTo(map).bindPopup("You").openPopup();
            const m = nearestMileForLatLng(lat, lon);
            if (m != null) { selectedMile = clamp(m, 0, 2197); moveSelectedMarker(true); }
            else map.setView([lat, lon], 12);
        });
    };
  });
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') { layersOpen = false; characterOpen = false; budgetOpen = false; } }} />

<div class="mapShell">
  <div class="at-map" bind:this={container}></div>
  <div class="mapAttribution">Map data © OpenStreetMap • Tiles © OpenTopoMap</div>

  <!-- HUD TOP: Progress & Sections -->
  <div class="hudTop">
    <div class="hudLeft">
      <div class="hudRow">
        <div class="hudMile">{selectedMile}</div>
        <div class="hudSectionBadge">{currentSection?.section.state}</div>
      </div>
      <div class="hudProgressRow">
        <span class="hudPct">{progressPercent}% complete</span>
        {#if currentSection}
            <span class="hudSectionSub">• {currentSection.percent}% thru {currentSection.section.name} {currentSection.section.emoji}</span>
        {/if}
      </div>

      <div class="hudHoggRow">
        {#if hoggFix}
          <button class="hoggChip" onclick={() => centerOnHoggFn?.()} title={hoggFix.when || ''}>
            🦾 Hogg @ mile {hoggFix.mile.toFixed(1)}{hoggFix.when ? ` • ${timeAgo(hoggFix.when)}` : ''}
          </button>
        {:else}
          <div class="hoggChip muted" title={hoggError || ''}>
            {hoggLoading ? '🦾 Acquiring signal…' : '🦾 No recent signal'}
          </div>
        {/if}
      </div>
    </div>

    <div class="hudRight">
      <button class="iconBtn" title="Center on Hogg" onclick={() => centerOnHoggFn?.()}>
        <span>🦾</span>
      </button>
      <button class="iconBtn" title="Character" onclick={() => { characterOpen = !characterOpen; budgetOpen = false; layersOpen = false; }}>
        <span>👤</span>
      </button>
      <button class="iconBtn" title="Budget" onclick={() => { budgetOpen = !budgetOpen; characterOpen = false; layersOpen = false; }}>
        <span>$</span>
      </button>
      <button class="iconBtn" title="Settings" onclick={() => { layersOpen = !layersOpen; characterOpen = false; budgetOpen = false; }}>
        <span>⚙</span>
      </button>
    </div>
  </div>

  <!-- POI BAR (Floating above scrubber) -->
  <div class="poiBar">
    <button class="poiItem" onclick={() => flyToMile(nextShelter?.mile)}>
      <span class="poiIcon">🏠</span>
      <div class="poiText">
        <div class="poiDist">{distAhead(nextShelter)} mi</div>
        <div class="poiName">{nextShelter?.name || '—'}</div>
      </div>
    </button>
    <button class="poiItem" onclick={() => flyToMile(nextWater?.mile)}>
      <span class="poiIcon">💧</span>
      <div class="poiText">
        <div class="poiDist">{distAhead(nextWater)} mi</div>
        <div class="poiName">{nextWater?.name || '—'}</div>
      </div>
    </button>
    <button class="poiItem" onclick={() => flyToMile(nextResupply?.mile)}>
      <span class="poiIcon">🛒</span>
      <div class="poiText">
        <div class="poiDist">{distAhead(nextResupply)} mi</div>
        <div class="poiName">{nextResupply?.name || '—'}</div>
      </div>
    </button>
    
    <!-- Weather Widget -->
    <a class="poiItem weather" href={`/at-weather?mile=${selectedMile}`}>
        {#if wxLoading}
            <span class="poiIcon spin">↻</span>
        {:else}
            <span class="poiIcon">{wxIcon(wx?.current?.weather_code)}</span>
            <div class="poiText">
                <div class="poiDist">{wx?.current?.temperature_2m ? fmt(wx.current.temperature_2m) + '°' : '—'}</div>
                <div class="poiName">Forecast</div>
            </div>
        {/if}
    </a>
  </div>

  <!-- BOTTOM SCRUBBER -->
  <div class="hudBottom">
    <div class="scrubRow">
      <button class="nudge" onclick={() => adjustMile(-5)}>−5</button>
      <input class="heroSlider" type="range" min="0" max="2197" step="1" bind:value={selectedMile} />
      <button class="nudge" onclick={() => adjustMile(5)}>+5</button>
    </div>
  </div>

  <!-- PANELS -->
  {#if characterOpen}
    <CharacterPanel onClose={() => characterOpen = false} />
  {/if}

  {#if budgetOpen}
    <BudgetPanel onClose={() => budgetOpen = false} />
  {/if}

  <!-- LAYERS MODAL -->
  {#if layersOpen}
    <div class="overlay" onclick={() => layersOpen = false}></div>
    <div class="modal">
      <div class="modalTitle">Map Layers</div>
      <div class="modalRow">
        <button class="modalBtn" onclick={() => { locatePreviewFn?.(); layersOpen = false; }}>Use my location</button>
        <button class="modalBtn" disabled={selectedMile === savedMile} onclick={() => { updateContext({ currentMile: selectedMile }); layersOpen = false; }}>Set as current</button>
      </div>
      <div class="modalToggles">
        <label class="t"><input type="checkbox" bind:checked={showHoggTracker} /> <span>Hogg Tracker</span></label>
        <label class="t"><input type="checkbox" bind:checked={showResupplyStops} /> <span>Resupply</span></label>
        <label class="t"><input type="checkbox" bind:checked={showShelters} /> <span>Shelters</span></label>
        <label class="t"><input type="checkbox" bind:checked={showMailDrops} /> <span>Mail Drops (📫)</span></label>
        <label class="t"><input type="checkbox" bind:checked={showMilestones} /> <span>Milestones (🎉)</span></label>
        <label class="t"><input type="checkbox" bind:checked={showWaterSources} /> <span>Water (Zoom 11+)</span></label>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.leaflet-container) { background: #0b0b0b; font: inherit; }

  :global(.hc-mile-pin) { background: transparent; border: none; }
  :global(.hc-mile-pin__dot) { width: 14px; height: 14px; border-radius: 999px; background: #f0e000; border: 2px solid #111827; box-shadow: 0 10px 24px rgba(0,0,0,0.18); position: relative; z-index: 2; }
  :global(.hc-mile-pin__ring) { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid transparent; border-top-color: #f97316; animation: spin 2s linear infinite; }

  :global(.hc-hogg-pin) { background: transparent; border: none; }
  :global(.hc-hogg-pin__dot) { width: 14px; height: 14px; border-radius: 999px; background: #dc2626; border: 2px solid #111827; box-shadow: 0 10px 24px rgba(0,0,0,0.18); position: relative; z-index: 2; }
  :global(.hc-hogg-pin__pulse) { position: absolute; inset: -7px; border-radius: 50%; background: rgba(220, 38, 38, 0.18); animation: hoggPulse 1.8s ease-out infinite; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes hoggPulse { from { transform: scale(0.65); opacity: 0.9; } to { transform: scale(1.5); opacity: 0; } }

  :global(.mail-drop-icon), :global(.milestone-icon) { font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }

  .mapShell { position: relative; height: 100vh; max-height: 100vh; overflow: hidden; background: #000; color: #374151; }
  .at-map { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
  .mapAttribution { position: absolute; bottom: 80px; left: 12px; font-size: 0.7rem; color: rgba(255,255,255,0.6); pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.8); z-index: 500; }

  /* HUD Top */
  .hudTop { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 600; pointer-events: none; }
  .hudLeft { pointer-events: auto; background: rgba(255,255,255,0.9); padding: 10px 14px; border-radius: 14px; backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.5); }
  .hudRow { display: flex; align-items: baseline; gap: 8px; }
  .hudMile { font-family: 'Oswald', sans-serif; font-size: 1.8rem; font-weight: 700; line-height: 1; color: #111827; }
  .hudSectionBadge { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #4b5563; }
  .hudProgressRow { font-size: 0.8rem; color: #4b5563; margin-top: 2px; white-space: nowrap; }

  .hudHoggRow { margin-top: 6px; }
  .hoggChip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.92);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    color: #111827;
  }
  .hoggChip.muted {
    cursor: default;
    color: #6b7280;
    background: rgba(255,255,255,0.65);
  }

  .hudRight { pointer-events: auto; display: flex; gap: 8px; }
  .iconBtn { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.1s; }
  .iconBtn:active { transform: scale(0.95); }

  /* POI Bar */
  .poiBar { position: absolute; bottom: 80px; left: 12px; right: 12px; height: 56px; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); border-radius: 16px; display: flex; align-items: center; justify-content: space-evenly; padding: 0 4px; z-index: 550; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.4); pointer-events: auto; max-width: 600px; margin: 0 auto; }
  .poiItem { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; border: none; background: none; cursor: pointer; text-decoration: none; color: inherit; padding: 0; }
  .poiIcon { font-size: 1.2rem; }
  .poiText { display: flex; flex-direction: column; align-items: flex-start; text-align: left; min-width: 0; }
  .poiDist { font-family: 'Oswald', sans-serif; font-weight: 700; font-size: 0.9rem; line-height: 1.1; color: #111827; }
  .poiName { font-size: 0.7rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px; }
  .spin { display: inline-block; animation: spin 1s linear infinite; }

  /* Scrubber */
  .hudBottom { position: absolute; bottom: 20px; left: 12px; right: 12px; z-index: 600; pointer-events: none; display: flex; justify-content: center; }
  .scrubRow { pointer-events: auto; width: 100%; max-width: 600px; background: rgba(255,255,255,0.9); padding: 8px 12px; border-radius: 20px; display: flex; gap: 10px; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); backdrop-filter: blur(10px); }
  .nudge { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; font-weight: 700; cursor: pointer; color: #374151; flex-shrink: 0; }
  .heroSlider { flex: 1; height: 24px; accent-color: #f0e000; cursor: grab; }

  /* Modal/Overlay */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2000; backdrop-filter: blur(2px); }
  .modal { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; background: #fff; padding: 20px; border-radius: 20px; z-index: 2100; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
  .modalTitle { font-family: 'Oswald', sans-serif; font-size: 1.2rem; margin-bottom: 16px; font-weight: 700; }
  .modalRow { display: flex; gap: 10px; margin-bottom: 20px; }
  .modalBtn { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; cursor: pointer; }
  .modalBtn:disabled { opacity: 0.5; }
  .modalToggles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .t { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer; }

  @media (max-width: 480px) {
      .poiName { max-width: 50px; }
      .poiDist { font-size: 0.85rem; }
  }
</style>