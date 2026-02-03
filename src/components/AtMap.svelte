<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { landmarks, loadContext, trailContext, updateContext } from "../stores/trailContext.svelte";
  import { LIVE_TRACKING_URL } from "../lib/config";
  import "leaflet/dist/leaflet.css";

  import atWaterSources from "../data/at-water-sources.json";
  import atHydroCrossings from "../data/at-hydro-crossings.json";
  import { TRAIL_EMERGENCY_TOOL, TRAIL_TOOL_GROUPS } from "../data/trailTools";
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
  let showMyLocation = $state(true);
  let showMailDrops = $state(false);
  let showMilestones = $state(true);

  type HoggFix = { mile: number; lat: number; lon: number; when?: string };
  let hoggFix = $state<HoggFix | null>(null);
  let hoggLoading = $state(false);
  let hoggError = $state<string>("");
  let centerOnHoggFn: (() => void) | null = null;
  let _hoggPoll: number | null = null;

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

  type GpsFix = {
    mile: number;
    lat: number;
    lon: number;
    when: number;
    accuracyM?: number;
  };

  let gpsFix = $state<GpsFix | null>(null);
  let gpsWatching = $state(false);
  let gpsLock = $state(true);
  let gpsHighAccuracy = $state(true);
  let gpsError = $state<string>("");
  let centerOnUserFn: (() => void) | null = null;
  let startGpsWatchFn: (() => void) | null = null;
  let stopGpsWatchFn: (() => void) | null = null;

  // Panel State
  let layersOpen = $state(false);
  let characterOpen = $state(false);
  let budgetOpen = $state(false);

  type HudMode = "navigate" | "plan";
  let mode = $state<HudMode>("navigate");

  let toolsOpen = $state(false);
  let searchOpen = $state(false);
  let searchMile = $state<string>("");

  // Mile selection
  const PREVIEW_KEY = "hcAtMap.previewMile";
  const TRAIL_MAX_MILE = 2197;
  const TRAIL_TOTAL_MILES = 2197.4;

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
    return clamp(Math.round(n), 0, TRAIL_MAX_MILE);
  }

  function readSavedPreviewMile(): number | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(PREVIEW_KEY);
      if (!raw) return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      return clamp(Math.round(n), 0, TRAIL_MAX_MILE);
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

  let previewMile = $state<number>(0);
  let liveMile = $state<number>(0);
  let savedMile = $derived.by(() => Number(trailContext.currentMile) || 0);

  // Derived Journey Data
  const hudMile = $derived.by(() => {
    const base =
      mode === "plan"
        ? previewMile
        : gpsFix?.mile ?? (Number.isFinite(liveMile) && liveMile > 0 ? liveMile : savedMile);
    return clamp(Number(base) || 0, 0, TRAIL_MAX_MILE);
  });

  const progressPercent = $derived.by(() => Math.round((hudMile / TRAIL_TOTAL_MILES) * 100));
  const currentSection = $derived.by(() => getSectionProgress(hudMile));
  const nextMilestone = $derived.by(() => getNextMilestone(hudMile));

  // Selected marker coordinate
  let hudLat = $state<number>(0);
  let hudLon = $state<number>(0);

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
    if (!Number.isFinite(hudLat) || !Number.isFinite(hudLon) || hudLat === 0 || hudLon === 0) return;
    const key = `${hudLat.toFixed(2)},${hudLon.toFixed(2)}`;
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
      url.searchParams.set('latitude', String(hudLat));
      url.searchParams.set('longitude', String(hudLon));
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
    previewMile = clamp(previewMile + delta, 0, TRAIL_MAX_MILE);
  }

  function switchToNavigateMode() {
    mode = "navigate";
    if (gpsFix) {
      hudLat = gpsFix.lat;
      hudLon = gpsFix.lon;
      fetchWeatherDebounced();
    }
    if (gpsLock) centerOnUserFn?.();
  }

  function switchToPlanMode(targetMile?: number) {
    const m = targetMile ?? Math.round(hudMile);
    mode = "plan";
    gpsLock = false;
    previewMile = clamp(Math.round(m), 0, TRAIL_MAX_MILE);
    centerOnPreviewFn?.();
  }

  function toggleGpsTracking() {
    if (mode !== "navigate") switchToNavigateMode();

    if (!gpsWatching) {
      gpsLock = true;
      startGpsWatchFn?.();
      locateMeOnceFn?.(); // warm-start a fix while the watch spins up
      return;
    }

    gpsLock = !gpsLock;
    if (gpsLock) centerOnUserFn?.();
  }

  function jumpToMile() {
    const n = Number(searchMile);
    if (!Number.isFinite(n)) return;
    switchToPlanMode(clamp(Math.round(n), 0, TRAIL_MAX_MILE));
    searchOpen = false;
  }

  // Map hooks
  let mapReady = $state(false);
  let syncOverlaysFn: (() => void) | null = null;
  let locateMeOnceFn: (() => void) | null = null;
  let centerOnPreviewFn: (() => void) | null = null;

  function updateUrl(nextMile: number) {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    u.searchParams.set("mile", String(Math.round(nextMile)));
    window.history.replaceState({}, "", u.toString());
  }

  function getInitialState(): { mode: HudMode; previewMile: number } {
    const fromUrl = parseMileParam();
    if (fromUrl != null) return { mode: "plan", previewMile: fromUrl };

    const fromSaved = readSavedPreviewMile();
    const c = Number(trailContext.currentMile);
    const fromContext = Number.isFinite(c) && c > 0 ? clamp(Math.round(c), 0, TRAIL_MAX_MILE) : 0;

    return {
      mode: "navigate",
      previewMile: fromSaved ?? fromContext,
    };
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
      return (item.mile - hudMile).toFixed(1);
  }

  function waterName(item: any): string {
    if (!item) return "—";
    const name = typeof item?.name === "string" ? item.name : "";
    const flow = typeof item?.flow === "string" ? item.flow : "";

    if (flow === "perennial") {
      if (!name || name.toLowerCase().includes("unnamed")) return "Reliable water";
      return name;
    }

    return name || "Water";
  }

  const hydroCrossingsSorted = (Array.isArray(atHydroCrossings) ? atHydroCrossings : [])
    .filter(s => typeof s?.mile === "number")
    .sort((a, b) => a.mile - b.mile);

  const perennialStreams = hydroCrossingsSorted.filter(s => s.flow === "perennial");
  
  // Shelter dataset indexed (populated on mount)
  let sheltersWithMile = $state<Array<{ name: string; mile: number; lat: number; lon: number }>>([]);

  const nextResupply = $derived.by(() => nextAfter(RESUPPLY_STOPS as any[], hudMile));
  const nextReliableWater = $derived.by(() => nextAfter(perennialStreams as any[], hudMile));
  const nextWaterSource = $derived.by(() => nextAfter(atWaterSources as any[], hudMile));
  const nextWater = $derived.by(() => nextReliableWater ?? nextWaterSource);
  const nextShelter = $derived.by(() => nextAfter(sheltersWithMile as any[], hudMile));

  function flyToMile(mile: number | undefined) {
      if (mile == null) return;
      mode = "plan";
      gpsLock = false;
      previewMile = clamp(Math.round(mile), 0, TRAIL_MAX_MILE);
      centerOnPreviewFn?.();
  }

  // Effect: Sync URL/Local
  $effect(() => {
    if (mode !== "plan") return;
    updateUrl(previewMile);
    savePreviewMile(previewMile);
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
    void showMyLocation;
    void showMailDrops;
    void showMilestones;

    syncOverlaysFn();
  });

  // Effect: Move Marker
  $effect(() => {
    if (!mapReady || !centerOnPreviewFn) return;
    void previewMile;
    if (mode !== "plan") return;
    centerOnPreviewFn();
  });

  // --- LEAFLET INIT ---
  onMount(async () => {
    loadContext();
    const initial = getInitialState();
    mode = initial.mode;
    previewMile = initial.previewMile;
    liveMile = savedMile;
    if (mode === "plan") gpsLock = false;
    
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
    const userLayer = L.layerGroup();
    const mailDropLayer = L.layerGroup();
    const milestoneLayer = L.layerGroup();
    const boundaryLayer = L.layerGroup();

    const userIcon = L.divIcon({
      className: "hc-user-pin",
      html: '<div class="hc-user-pin__dot"></div><div class="hc-user-pin__ring"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    let userMarker: any = null;
    let userAccuracyCircle: any = null;

    function renderUserFix(lat: number, lon: number, accuracyM?: number) {
      const ll: [number, number] = [lat, lon];

      if (!userMarker) {
        userMarker = L.marker(ll, { icon: userIcon }).addTo(userLayer);
        userMarker.bindPopup("<b>You</b>");
      } else {
        userMarker.setLatLng(ll);
      }

      if (typeof accuracyM === "number" && Number.isFinite(accuracyM)) {
        if (!userAccuracyCircle) {
          userAccuracyCircle = L.circle(ll, {
            radius: Math.max(5, accuracyM),
            color: "rgba(96,165,250,0.9)",
            weight: 1,
            fillColor: "rgba(96,165,250,0.25)",
            fillOpacity: 0.35,
          }).addTo(userLayer);
        } else {
          userAccuracyCircle.setLatLng(ll);
          userAccuracyCircle.setRadius(Math.max(5, accuracyM));
        }
      }
    }

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
          mode = "plan";
          gpsLock = false;
          previewMile = clamp(Math.round(mile), 0, TRAIL_MAX_MILE);
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
    _hoggPoll = window.setInterval(refreshHoggTracker, 60 * 1000);

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
        const ll = coordForMile(previewMile);
        if (!ll) return;
        if (mode === "plan") {
          hudLat = ll[0];
          hudLon = ll[1];
          fetchWeatherDebounced();
        }

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
                if (m != null) {
                  mode = "plan";
                  gpsLock = false;
                  previewMile = clamp(m, 0, TRAIL_MAX_MILE);
                }
            });
        } else {
            animateTo(ll);
        }

        if (recenter) map.setView(ll, Math.max(map.getZoom(), 12), { animate: true, duration: 0.35 } as any);
    }

    centerOnPreviewFn = () => moveSelectedMarker(true);
    moveSelectedMarker(true);

    // Initial HUD point (used for weather + POI when GPS is off)
    if (mode === "navigate" && !gpsFix) {
      const ll = coordForMile(Number.isFinite(savedMile) && savedMile > 0 ? savedMile : previewMile);
      if (ll) {
        hudLat = ll[0];
        hudLon = ll[1];
        fetchWeatherDebounced();
      }
    }

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
        toggle(userLayer, showMyLocation);
        toggle(mailDropLayer, showMailDrops);
        toggle(milestoneLayer, showMilestones);
        toggle(boundaryLayer, true); // Always show state lines
    }

    syncOverlaysFn = syncOverlays;
    map.on("zoomend", syncOverlays);
    mapReady = true;
    syncOverlays();

    // If the user manually drags the map while navigating, drop out of "follow" mode.
    map.on("dragstart", () => {
      if (mode === "navigate") gpsLock = false;
    });

    // Hogg Tracker (Simplified)
    // ... (omitted polling logic for brevity, assumed preserved or simplified)
    
    // Geolocation (real-time capable)
    let _gpsWatch: number | null = null;

    function centerOnUser() {
      if (!gpsFix) return;
      map.setView([gpsFix.lat, gpsFix.lon], Math.max(map.getZoom(), 13), { animate: true, duration: 0.35 } as any);
    }
    centerOnUserFn = centerOnUser;

    function stopGpsWatch() {
      if (_gpsWatch != null) {
        try {
          navigator.geolocation.clearWatch(_gpsWatch);
        } catch {}
      }
      _gpsWatch = null;
      gpsWatching = false;
    }
    stopGpsWatchFn = stopGpsWatch;

    function applyGpsFix(lat: number, lon: number, accuracyM: number | undefined, when: number) {
      const m = nearestMileForLatLng(lat, lon);
      if (m != null) liveMile = m;

      gpsFix = {
        mile: m ?? liveMile ?? 0,
        lat,
        lon,
        when,
        accuracyM,
      };

      renderUserFix(lat, lon, accuracyM);

      if (mode !== "navigate") return;

      hudLat = lat;
      hudLon = lon;
      fetchWeatherDebounced();

      if (m != null) {
        updateContext({ currentMile: m }, { persist: false });
      }

      if (gpsLock) {
        map.setView([lat, lon], Math.max(map.getZoom(), 13), { animate: true, duration: 0.35 } as any);
      }
    }

    function startGpsWatch() {
      if (typeof window === "undefined") return;
      if (!navigator.geolocation) {
        gpsError = "Geolocation not supported in this browser.";
        return;
      }
      if (_gpsWatch != null) return;

      gpsError = "";
      gpsWatching = true;
      _gpsWatch = navigator.geolocation.watchPosition(
        (pos) => {
          gpsError = "";
          applyGpsFix(
            pos.coords.latitude,
            pos.coords.longitude,
            typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : undefined,
            typeof pos.timestamp === "number" ? pos.timestamp : Date.now()
          );
        },
        (err) => {
          gpsError = err?.message || "Location error";
          gpsFix = null;
          stopGpsWatch();
        },
        {
          enableHighAccuracy: gpsHighAccuracy,
          maximumAge: 5_000,
          timeout: 15_000,
        }
      );
    }
    startGpsWatchFn = startGpsWatch;

    locateMeOnceFn = () => {
      if (!navigator.geolocation) {
        gpsError = "Geolocation not supported in this browser.";
        return;
      }
      gpsError = "";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyGpsFix(
            pos.coords.latitude,
            pos.coords.longitude,
            typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : undefined,
            typeof pos.timestamp === "number" ? pos.timestamp : Date.now()
          );
        },
        (err) => {
          gpsError = err?.message || "Location error";
        },
        { enableHighAccuracy: gpsHighAccuracy, maximumAge: 0, timeout: 15_000 }
      );
    };
  });

  onDestroy(() => {
    stopGpsWatchFn?.();

    if (_hoggPoll != null) {
      try {
        window.clearInterval(_hoggPoll);
      } catch {}
      _hoggPoll = null;
    }

    try {
      clearTimeout(_wxTimer);
    } catch {}

    _wxAbort?.abort();
  });
</script>

<svelte:window onkeydown={(e) => {
  if (e.key !== 'Escape') return;
  layersOpen = false;
  characterOpen = false;
  budgetOpen = false;
  toolsOpen = false;
  searchOpen = false;
}} />

<div class="mapShell" class:plan={mode === "plan"}>
  <div class="at-map" bind:this={container}></div>
  <div class="mapAttribution">Map data © OpenStreetMap • Tiles © OpenTopoMap</div>

  <!-- HUD TOP: Progress & Sections -->
  <div class="hudTop">
    <div class="statusCard">
      <div class="statusGrid">
        <!-- Row 1 -->
        <div class="statusRow">
          <div class="mile">{Math.round(hudMile)}</div>
          <div class="sectionTag">{currentSection?.section.state || "—"}</div>
        </div>
        <div class="modeTag" class:plan={mode === "plan"}>{mode === "plan" ? "PLAN" : "NAV"}</div>

        <!-- Row 2 -->
        <div class="statusSub">
          <span class="pct">{progressPercent}%</span>
          {#if currentSection}
            <span class="sub">• {currentSection.percent}% thru {currentSection.section.name} {currentSection.section.emoji}</span>
          {/if}
        </div>
        <div class="gpsPill" class:live={Boolean(gpsFix)} title={gpsError || ""}>
          <span class="gpsDot"></span>
          {#if mode === "plan"}
            <span>Exploring</span>
          {:else if gpsFix}
            <span>GPS</span>
            {#if typeof gpsFix.accuracyM === "number" && Number.isFinite(gpsFix.accuracyM)}
              <span class="gpsAcc">±{Math.round(gpsFix.accuracyM * 3.28084)}ft</span>
            {/if}
          {:else if gpsWatching}
            <span>GPS…</span>
          {:else}
            <span>GPS off</span>
          {/if}
        </div>

        <!-- Row 3 -->
        <div class="hudHoggRow">
          {#if hoggFix}
            <button class="hoggChip" onclick={() => centerOnHoggFn?.()} title={hoggFix.when || ""} type="button">
              <span class="hoggLeft">🐗 Hogg</span>
              <span class="hoggRight">@ {hoggFix.mile.toFixed(1)}{hoggFix.when ? ` • ${timeAgo(hoggFix.when)}` : ""}</span>
            </button>
          {:else}
            <div class="hoggChip muted" title={hoggError || ""}>
              <span class="hoggLeft">{hoggLoading ? "📡 Acquiring signal…" : "📡 No recent signal"}</span>
            </div>
          {/if}
        </div>
        <div class="miniTabs" role="tablist" aria-label="Map mode">
          <button class="tab" class:active={mode === "navigate"} onclick={() => switchToNavigateMode()} type="button">Nav</button>
          <button class="tab" class:active={mode === "plan"} onclick={() => switchToPlanMode()} type="button">Plan</button>
        </div>
      </div>
    </div>

    <div class="hudActions" aria-label="Map actions">
      <button
        class="hudBtn"
        class:active={gpsWatching && gpsLock}
        title={gpsWatching ? (gpsLock ? "Following you (tap to free-pan)" : "Free-pan (tap to follow)") : "Start GPS tracking"}
        onclick={() => toggleGpsTracking()}
        type="button"
      >
        <span class="hudBtnIcon">{gpsWatching ? (gpsLock ? "📍" : "⌖") : "⌖"}</span>
      </button>

      <button
        class="hudBtn"
        title="Layers & settings"
        onclick={() => {
          layersOpen = !layersOpen;
          characterOpen = false;
          budgetOpen = false;
          toolsOpen = false;
          searchOpen = false;
        }}
        type="button"
      >
        <span class="hudBtnIcon">⚙</span>
      </button>

      <button
        class="hudBtn"
        title="Trail tools"
        onclick={() => {
          toolsOpen = !toolsOpen;
          layersOpen = false;
          characterOpen = false;
          budgetOpen = false;
          searchOpen = false;
        }}
        type="button"
      >
        <span class="hudBtnIcon">🎒</span>
      </button>

      <button
        class="hudBtn"
        title="Search / jump"
        onclick={() => {
          const next = !searchOpen;
          searchOpen = next;
          if (next) searchMile = String(Math.round(hudMile));
          toolsOpen = false;
          layersOpen = false;
          characterOpen = false;
          budgetOpen = false;
        }}
        type="button"
      >
        <span class="hudBtnIcon">🔎</span>
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
        <div class="poiName">{waterName(nextWater)}</div>
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
    <a class="poiItem weather" href={`/at-weather?mile=${Math.round(hudMile)}`}>
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
  {#if mode === "plan"}
    <div class="hudBottom">
      <div class="scrubRow">
        <button class="nudge" onclick={() => adjustMile(-5)} type="button">−5</button>
        <input class="heroSlider" type="range" min="0" max={TRAIL_MAX_MILE} step="1" bind:value={previewMile} />
        <button class="nudge" onclick={() => adjustMile(5)} type="button">+5</button>
      </div>
    </div>
  {/if}

  <!-- PANELS -->
  {#if characterOpen}
    <CharacterPanel onClose={() => characterOpen = false} />
  {/if}

  {#if budgetOpen}
    <BudgetPanel onClose={() => budgetOpen = false} />
  {/if}

  {#if toolsOpen}
    <div class="overlay" onclick={() => toolsOpen = false}></div>
    <div class="sheet" role="dialog" aria-label="Trail tools">
      <div class="sheetHandle"></div>
      <div class="sheetHeader">
        <div class="sheetTitle">Trail Tools</div>
        <button class="sheetClose" onclick={() => toolsOpen = false} type="button">×</button>
      </div>

      <div class="sheetBody">
        <div class="sheetNav">
          <a class="sheetPill" href="/">Home</a>
          <a class="sheetPill" href="/guide/">Guide</a>
          <a class="sheetPill" href="/tools/">All tools</a>
        </div>

        <div class="quickRow" aria-label="Quick panels">
          <button
            class="quickBtn"
            onclick={() => {
              toolsOpen = false;
              budgetOpen = false;
              layersOpen = false;
              searchOpen = false;
              characterOpen = true;
            }}
            type="button"
          >
            👤 Gear snapshot
          </button>
          <button
            class="quickBtn"
            onclick={() => {
              toolsOpen = false;
              characterOpen = false;
              layersOpen = false;
              searchOpen = false;
              budgetOpen = true;
            }}
            type="button"
          >
            💰 Budget snapshot
          </button>
        </div>

        <div class="toolList">
          <a class="toolLink emergency" href={TRAIL_EMERGENCY_TOOL.href}>
            <span class="toolIcon">{TRAIL_EMERGENCY_TOOL.icon}</span>
            <span class="toolText">
              <span class="toolName">{TRAIL_EMERGENCY_TOOL.name}</span>
              <span class="toolDesc">{TRAIL_EMERGENCY_TOOL.desc}</span>
            </span>
          </a>
        </div>

        {#each TRAIL_TOOL_GROUPS as group}
          <div class="sheetGroup">
            <div class="groupName">{group.name}</div>
            <div class="toolList">
              {#each group.tools as tool}
                <a class="toolLink" href={tool.href}>
                  <span class="toolIcon">{tool.icon}</span>
                  <span class="toolText">
                    <span class="toolName">{tool.name}</span>
                    <span class="toolDesc">{tool.desc}</span>
                  </span>
                </a>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if searchOpen}
    <div class="overlay" onclick={() => searchOpen = false}></div>
    <div class="sheet" role="dialog" aria-label="Search">
      <div class="sheetHandle"></div>
      <div class="sheetHeader">
        <div class="sheetTitle">Search / Jump</div>
        <button class="sheetClose" onclick={() => searchOpen = false} type="button">×</button>
      </div>

      <div class="sheetBody">
        <form
          class="searchForm"
          onsubmit={(e) => {
            e.preventDefault();
            jumpToMile();
          }}
        >
          <div class="searchField">
            <label class="searchLabel" for="search-mile">Mile</label>
            <input
              id="search-mile"
              class="searchInput"
              inputmode="numeric"
              placeholder="0–2197"
              bind:value={searchMile}
            />
          </div>
          <button class="searchGo" type="submit">Go</button>
        </form>

        <div class="chipGrid" aria-label="Landmarks">
          {#each landmarks as lm}
            <button
              class="chip"
              onclick={() => {
                switchToPlanMode(lm.mile);
                searchOpen = false;
              }}
              type="button"
            >
              <span class="chipName">{lm.name}</span>
              <span class="chipMile">mi {lm.mile}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- LAYERS MODAL -->
  {#if layersOpen}
    <div class="overlay" onclick={() => layersOpen = false}></div>
    <div class="modal">
      <div class="modalTitle">HUD Settings</div>
      <div class="modalRow">
        {#if gpsWatching}
          <button class="modalBtn" onclick={() => { stopGpsWatchFn?.(); gpsLock = false; layersOpen = false; }} type="button">Stop GPS</button>
        {:else}
          <button class="modalBtn" onclick={() => { gpsLock = true; startGpsWatchFn?.(); locateMeOnceFn?.(); layersOpen = false; }} type="button">Start GPS</button>
        {/if}

        <button class="modalBtn" onclick={() => { locateMeOnceFn?.(); layersOpen = false; }} type="button">Ping location</button>
      </div>
      <div class="modalRow">
        <button class="modalBtn" disabled={Math.round(hudMile) === savedMile} onclick={() => { updateContext({ currentMile: Math.round(hudMile) }); layersOpen = false; }} type="button">
          Set as current mile
        </button>
      </div>
      <div class="modalToggles">
        <label class="t"><input type="checkbox" bind:checked={gpsHighAccuracy} /> <span>High accuracy GPS</span></label>
        <label class="t"><input type="checkbox" bind:checked={gpsLock} disabled={!gpsWatching} /> <span>Follow me</span></label>
        <label class="t"><input type="checkbox" bind:checked={showHoggTracker} /> <span>Hogg Tracker</span></label>
        <label class="t"><input type="checkbox" bind:checked={showMyLocation} /> <span>My Location</span></label>
        <label class="t"><input type="checkbox" bind:checked={showResupplyStops} /> <span>Resupply</span></label>
        <label class="t"><input type="checkbox" bind:checked={showShelters} /> <span>Shelters</span></label>
        <label class="t"><input type="checkbox" bind:checked={showMailDrops} /> <span>Mail Drops (📫)</span></label>
        <label class="t"><input type="checkbox" bind:checked={showMilestones} /> <span>Milestones (🎉)</span></label>
        <label class="t"><input type="checkbox" bind:checked={showWaterSources} /> <span>Water (Zoom 11+)</span></label>
      </div>

      <div class="credits">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
        <span class="dot">•</span>
        <a href="https://opentopomap.org" target="_blank" rel="noreferrer">OpenTopoMap</a>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.leaflet-container) {
    background: #0b0b0b;
    font: inherit;
  }

  :global(.hc-mile-pin) {
    background: transparent;
    border: none;
  }
  :global(.hc-mile-pin__dot) {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: var(--marker, #f0e000);
    border: 2px solid #111827;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    position: relative;
    z-index: 2;
  }
  :global(.hc-mile-pin__ring) {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: var(--terra, #d97706);
    animation: spin 2s linear infinite;
  }

  :global(.hc-hogg-pin) {
    background: transparent;
    border: none;
  }
  :global(.hc-hogg-pin__dot) {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #dc2626;
    border: 2px solid #111827;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    position: relative;
    z-index: 2;
  }
  :global(.hc-hogg-pin__pulse) {
    position: absolute;
    inset: -7px;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.18);
    animation: hoggPulse 1.8s ease-out infinite;
  }

  :global(.hc-user-pin) {
    background: transparent;
    border: none;
  }
  :global(.hc-user-pin__dot) {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #60a5fa;
    border: 2px solid #111827;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    position: relative;
    z-index: 2;
  }
  :global(.hc-user-pin__ring) {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid rgba(96, 165, 250, 0.55);
    animation: userPulse 2.2s ease-out infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes hoggPulse {
    from {
      transform: scale(0.65);
      opacity: 0.9;
    }
    to {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  @keyframes userPulse {
    from {
      transform: scale(0.7);
      opacity: 0.85;
    }
    to {
      transform: scale(1.35);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.hc-mile-pin__ring),
    :global(.hc-hogg-pin__pulse),
    :global(.hc-user-pin__ring) {
      animation: none;
    }
  }

  :global(.mail-drop-icon),
  :global(.milestone-icon) {
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mapShell {
    --hud-safe-top: env(safe-area-inset-top);
    --hud-safe-bottom: env(safe-area-inset-bottom);
    --hud-radius: 18px;
    --hud-bg: rgba(17, 24, 39, 0.62);
    --hud-bg-strong: rgba(17, 24, 39, 0.74);
    --hud-text: rgba(255, 255, 255, 0.92);
    --hud-muted: rgba(255, 255, 255, 0.72);
    --hud-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
    --hud-poi-bottom: 20px;

    position: relative;
    height: 100svh;
    max-height: 100svh;
    overflow: hidden;
    background: #000;
    color: var(--hud-text);
  }

  .mapShell.plan {
    --hud-poi-bottom: 96px;
  }

  .at-map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .mapAttribution {
    position: absolute;
    bottom: calc(var(--hud-poi-bottom) + var(--hud-safe-bottom) + 72px);
    left: 12px;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.55);
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    z-index: 500;
  }

  /* HUD Top */
  .hudTop {
    position: absolute;
    top: calc(12px + var(--hud-safe-top));
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    z-index: 600;
    pointer-events: none;
  }

  .statusCard {
    pointer-events: auto;
    min-width: 0;
    flex: 1;
    max-width: 560px;
    background: var(--hud-bg);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--hud-radius);
    padding: 12px 14px;
    backdrop-filter: blur(14px);
    box-shadow: var(--hud-shadow);
  }

  .statusGrid {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "row mode"
      "sub gps"
      "hogg tabs";
    gap: 8px 10px;
    align-items: center;
  }

  .statusRow {
    grid-area: row;
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
  }

  .mile {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 2rem;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.02em;
    color: var(--hud-text);
  }

  .sectionTag {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--hud-muted);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 3px 8px;
    border-radius: 999px;
  }

  .modeTag {
    grid-area: mode;
    justify-self: end;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(240, 224, 0, 0.24);
    border: 1px solid rgba(240, 224, 0, 0.35);
    color: rgba(19, 23, 19, 0.95);
  }

  .modeTag.plan {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.14);
    color: var(--hud-text);
  }

  .statusSub {
    grid-area: sub;
    margin-top: 0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: baseline;
    color: var(--hud-muted);
    font-size: 0.86rem;
    min-width: 0;
  }

  .pct {
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--hud-text);
  }

  .sub {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .miniTabs {
    grid-area: tabs;
    justify-self: end;
    display: flex;
    padding: 2px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .tab {
    border: none;
    background: transparent;
    color: var(--hud-muted);
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    user-select: none;
  }

  .tab:hover {
    color: var(--hud-text);
  }

  .tab.active {
    background: var(--marker, #f0e000);
    color: rgba(19, 23, 19, 0.95);
  }

  .gpsPill {
    grid-area: gps;
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 0.75rem;
    color: var(--hud-muted);
    white-space: nowrap;
  }

  .gpsPill.live {
    color: var(--hud-text);
  }

  .gpsDot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.24);
  }

  .gpsPill.live .gpsDot {
    background: #22c55e;
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
  }

  .gpsAcc {
    opacity: 0.9;
  }

  .hudHoggRow {
    grid-area: hogg;
    margin-top: 0;
    min-width: 0;
  }

  .hoggChip {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    color: var(--hud-text);
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
  }

  .hoggChip.muted {
    cursor: default;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.06);
  }

  .hoggLeft {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hoggRight {
    flex: 0 0 auto;
    white-space: nowrap;
    opacity: 0.9;
  }

  .hudActions {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .hudBtn {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    background: var(--hud-bg);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--hud-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(14px);
    box-shadow: var(--hud-shadow);
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
  }

  .hudBtn:active {
    transform: translateY(1px) scale(0.98);
  }

  .hudBtn.active {
    border-color: rgba(240, 224, 0, 0.45);
    background: var(--hud-bg-strong);
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.55);
  }

  .hudBtnIcon {
    font-size: 1.15rem;
    line-height: 1;
  }

  /* POI Bar */
  .poiBar {
    position: absolute;
    bottom: calc(var(--hud-poi-bottom) + var(--hud-safe-bottom));
    left: 12px;
    right: 12px;
    height: 64px;
    background: var(--hud-bg);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    padding: 0 6px;
    z-index: 550;
    box-shadow: var(--hud-shadow);
    backdrop-filter: blur(14px);
    pointer-events: auto;
    max-width: 720px;
    margin: 0 auto;
  }

  .poiItem {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    border: none;
    background: none;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    padding: 0 6px;
    border-radius: 16px;
    -webkit-tap-highlight-color: transparent;
  }

  .poiItem:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .poiIcon {
    font-size: 1.25rem;
  }

  .poiText {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    min-width: 0;
  }

  .poiDist {
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 900;
    font-size: 0.95rem;
    line-height: 1.1;
    color: var(--hud-text);
    letter-spacing: 0.01em;
  }

  .poiName {
    font-size: 0.72rem;
    color: var(--hud-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .spin {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  /* Scrubber */
  .hudBottom {
    position: absolute;
    bottom: calc(16px + var(--hud-safe-bottom));
    left: 12px;
    right: 12px;
    z-index: 600;
    pointer-events: none;
    display: flex;
    justify-content: center;
  }

  .scrubRow {
    pointer-events: auto;
    width: 100%;
    max-width: 720px;
    background: var(--hud-bg-strong);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 10px 12px;
    border-radius: 22px;
    display: flex;
    gap: 10px;
    align-items: center;
    box-shadow: var(--hud-shadow);
    backdrop-filter: blur(14px);
  }

  .nudge {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    font-weight: 900;
    cursor: pointer;
    color: var(--hud-text);
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }

  .heroSlider {
    flex: 1;
    height: 28px;
    accent-color: var(--marker, #f0e000);
    cursor: grab;
  }

  /* Modal/Overlay */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 2000;
    backdrop-filter: blur(4px);
  }

  .modal {
    position: fixed;
    bottom: calc(16px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    width: 92%;
    max-width: 460px;
    background: rgba(17, 24, 39, 0.82);
    color: var(--hud-text);
    padding: 18px;
    border-radius: 22px;
    z-index: 2100;
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(16px);
  }

  .modalTitle {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 1.15rem;
    margin-bottom: 14px;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .modalRow {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .modalBtn {
    flex: 1;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    color: var(--hud-text);
    font-weight: 800;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .modalBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modalToggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .t {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--hud-text);
  }

  /* Bottom Sheets (Tools / Search) */
  .sheet {
    position: fixed;
    bottom: calc(16px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    width: 92%;
    max-width: 560px;
    max-height: min(82svh, 680px);
    background: rgba(17, 24, 39, 0.84);
    color: var(--hud-text);
    border-radius: 24px;
    z-index: 2100;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(16px);
    padding: 10px 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sheetHandle {
    width: 54px;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    margin: 2px auto 0;
  }

  .sheetHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 4px;
  }

  .sheetTitle {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 1.05rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .sheetClose {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--hud-text);
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .sheetBody {
    overflow-y: auto;
    padding: 0 4px 2px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sheetNav {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .quickRow {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .quickBtn {
    border-radius: 16px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--hud-text);
    cursor: pointer;
    font-weight: 900;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
  }

  .quickBtn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .sheetPill {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--hud-text);
    text-decoration: none;
    font-weight: 900;
    font-size: 0.78rem;
    -webkit-tap-highlight-color: transparent;
  }

  .sheetPill:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .sheetGroup {
    margin-top: 2px;
  }

  .groupName {
    margin: 8px 2px 6px;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--hud-muted);
  }

  .toolList {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toolLink {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-decoration: none;
    color: var(--hud-text);
    -webkit-tap-highlight-color: transparent;
  }

  .toolLink:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .toolLink.emergency {
    background: rgba(220, 38, 38, 0.12);
    border-color: rgba(220, 38, 38, 0.35);
  }

  .toolIcon {
    width: 26px;
    display: grid;
    place-items: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .toolText {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .toolName {
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: 0.02em;
    line-height: 1.1;
  }

  .toolDesc {
    font-size: 0.78rem;
    color: var(--hud-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .searchForm {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .searchField {
    flex: 1;
    min-width: 0;
  }

  .searchLabel {
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--hud-muted);
    margin-bottom: 4px;
    display: block;
  }

  .searchInput {
    flex: 1;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
    color: var(--hud-text);
    font-weight: 800;
    font-size: 0.95rem;
  }

  .searchGo {
    padding: 10px 14px;
    border-radius: 14px;
    border: 1px solid rgba(240, 224, 0, 0.35);
    background: rgba(240, 224, 0, 0.24);
    color: rgba(19, 23, 19, 0.95);
    font-weight: 900;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .chipGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .chip {
    text-align: left;
    border-radius: 16px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--hud-text);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .chip:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .chipName {
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: 0.01em;
    display: block;
    line-height: 1.1;
  }

  .chipMile {
    margin-top: 2px;
    display: block;
    font-size: 0.78rem;
    color: var(--hud-muted);
  }

  .credits {
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.72);
  }

  .credits a {
    color: rgba(255, 255, 255, 0.78);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .credits a:hover {
    color: var(--marker, #f0e000);
  }

  .credits .dot {
    opacity: 0.6;
  }

  @media (max-width: 480px) {
    .statusCard {
      padding: 10px 12px;
    }

    .poiName {
      max-width: 84px;
    }

    .poiDist {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 420px) {
    .chipGrid {
      grid-template-columns: 1fr;
    }

    .quickRow {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 360px) {
    .tab {
      padding: 4px 8px;
      font-size: 0.72rem;
    }
  }
</style>
