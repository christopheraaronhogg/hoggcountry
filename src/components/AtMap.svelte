<script lang="ts">
  import { onMount } from "svelte";
  import { loadContext, trailContext, updateContext } from "../stores/trailContext.svelte";
  import "leaflet/dist/leaflet.css";

  import atWaterSources from "../data/at-water-sources.json";
  import { RESUPPLY_STOPS } from "../data/resupplyStops";
  import { AT_ROAD_CROSSINGS } from "../data/at-road-crossings";

  let container: HTMLDivElement;

  // UI state (Layers)
  let showMileMarkers = $state(true);
  let showWaterSources = $state(false);
  let showResupplyStops = $state(true);
  let showRoadCrossings = $state(false);
  let showShelters = $state(true);
  // Per request: tracker on by default.
  let showHoggTracker = $state(true);

  // (Deprecated) bottom-sheet UI removed in favor of always-visible Explorer panel.

  // Mile selection (like AT Weather)
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

  let selectedMile = $state<number>(0); // preview mile
  let savedMile = $derived.by(() => Number(trailContext.currentMile) || 0);

  // Shelter dataset indexed to nearest mile (used for Nearby panel)
  let sheltersWithMile = $state<Array<{ name: string; mile: number; lat: number; lon: number }>>([]);

  // Reserved for future “time horizon” exploration, but AT Map stays POI-first (no temps on-map).
  let timeOffsetHours = $state<number>(0); // 0..24 step 3 (unused for now)

  // Map hooks (wired after Leaflet init)
  let mapReady = $state(false);
  let syncOverlaysFn: (() => void) | null = null;
  let locatePreviewFn: (() => void) | null = null;
  let centerOnSelectedFn: (() => void) | null = null;

  function timeLabel(h: number) {
    return h === 0 ? "Now" : `+${h}h`;
  }

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
    const onTrail = Boolean(trailContext.isOnTrail);
    if (Number.isFinite(c) && (onTrail || c > 0)) return clamp(Math.round(c), 0, 2197);

    const fromSaved = readSavedPreviewMile();
    if (fromSaved != null) return fromSaved;

    return 0;
  }

  function nextAfter<T extends { mile: number }>(list: T[], mile: number): T | null {
    let best: T | null = null;
    for (const item of list) {
      if (typeof item?.mile !== "number") continue;
      if (item.mile < mile) continue;
      if (!best || item.mile < best.mile) best = item;
    }
    return best;
  }

  function withinAhead<T extends { mile: number }>(list: T[], mile: number, milesAhead: number, limit: number): T[] {
    return list
      .filter((x) => typeof x?.mile === "number" && x.mile >= mile && x.mile <= mile + milesAhead)
      .slice()
      .sort((a, b) => a.mile - b.mile)
      .slice(0, limit);
  }

  const nextResupply = $derived.by(() => nextAfter(RESUPPLY_STOPS as any[], selectedMile));
  const nextWater = $derived.by(() => nextAfter(atWaterSources as any[], selectedMile));
  const nextCrossing = $derived.by(() => nextAfter(AT_ROAD_CROSSINGS as any[], selectedMile));
  const nextShelter = $derived.by(() => nextAfter(sheltersWithMile as any[], selectedMile));

  const upcomingResupply = $derived.by(() => withinAhead(RESUPPLY_STOPS as any[], selectedMile, 40, 4));
  const upcomingWater = $derived.by(() => withinAhead(atWaterSources as any[], selectedMile, 12, 6));
  const upcomingCrossings = $derived.by(() => withinAhead(AT_ROAD_CROSSINGS as any[], selectedMile, 25, 5));
  const upcomingShelters = $derived.by(() => withinAhead(sheltersWithMile as any[], selectedMile, 25, 5));

  // Keep URL + local "last mile" in sync as user explores.
  $effect(() => {
    updateUrl(selectedMile);
    savePreviewMile(selectedMile);
  });

  // When toggles change, sync Leaflet overlays.
  $effect(() => {
    if (!mapReady || !syncOverlaysFn) return;
    // touch reactive inputs
    void showMileMarkers;
    void showWaterSources;
    void showResupplyStops;
    void showRoadCrossings;
    void showShelters;
    void showHoggTracker;

    syncOverlaysFn();
  });

  // When selected mile changes, move the selected-mile marker.
  $effect(() => {
    if (!mapReady || !centerOnSelectedFn) return;
    void selectedMile;
    centerOnSelectedFn();
  });

  function haversineMeters(a: [number, number], b: [number, number]) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // Keep map init client-only.
  onMount(async () => {
    loadContext();
    selectedMile = getInitialMile();
    updateUrl(selectedMile);
    savePreviewMile(selectedMile);

    const L = await import("leaflet");

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
    });

    // Base maps (no API key). Note: CSP must allow tile domains.
    const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        '<a href="https://www.openstreetmap.org/copyright">SRTM</a> | ' +
        'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    });

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });

    // Default to topo
    topo.addTo(map);

    L.control
      .layers(
        {
          Topo: topo,
          Streets: osm,
        },
        undefined,
        { position: "topleft", collapsed: true }
      )
      .addTo(map);

    L.control.scale({ imperial: true, metric: false }).addTo(map);

    // Fallback view (roughly AT bounds)
    map.setView([39.0, -76.0], 5);

    // Trail line
    try {
      const res = await fetch("/data/appalachian-trail.geojson", {
        headers: { Accept: "application/geo+json, application/json" },
      });
      if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);

      const geojson = await res.json();

      const layer = L.geoJSON(geojson, {
        style: {
          color: "#f97316", // orange
          weight: 3,
          opacity: 0.9,
        },
      }).addTo(map);

      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [18, 18] });
      }
    } catch (err) {
      console.error(err);
    }

    // Layers
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const mileLayer = L.layerGroup();
    const waterLayer = L.layerGroup();
    const resupplyLayer = L.layerGroup();
    const crossingLayer = L.layerGroup();
    const shelterLayer = L.layerGroup();
    const hoggLayer = L.layerGroup();

    // Mile coordinate lookup (used to "place" things that only have a mile number)
    const mileCoord = new Map<number, { lat: number; lon: number }>();

    function coordForMile(mile: number): [number, number] | null {
      if (!Number.isFinite(mile)) return null;

      const lo = Math.floor(mile);
      const hi = Math.ceil(mile);
      const a = mileCoord.get(lo);
      const b = mileCoord.get(hi);

      if (!a && !b) return null;
      if (a && !b) return [a.lat, a.lon];
      if (!a && b) return [b.lat, b.lon];
      if (lo === hi) return [a!.lat, a!.lon];

      const t = (mile - lo) / (hi - lo);
      return [a!.lat + (b!.lat - a!.lat) * t, a!.lon + (b!.lon - a!.lon) * t];
    }

    const milepostsRaw: { mile: number; lat: number; lon: number }[] = [];

    async function loadMilepostsAndBuildLayers() {
      const res = await fetch("/at-mileposts.json", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`mileposts fetch failed: ${res.status}`);
      const data = await res.json();

      const mileposts = data?.mileposts || [];

      for (const mp of mileposts) {
        if (typeof mp?.mile !== "number") continue;
        if (typeof mp?.lat !== "number" || typeof mp?.lon !== "number") continue;
        mileCoord.set(mp.mile, { lat: mp.lat, lon: mp.lon });
        milepostsRaw.push({ mile: mp.mile, lat: mp.lat, lon: mp.lon });
      }

      // Mile markers (every 10)
      const step = 10;
      for (const mp of mileposts) {
        const mile = mp.mile;
        if (typeof mile !== "number") continue;
        if (mile % step !== 0) continue;

        const lat = mp.lat;
        const lon = mp.lon;
        if (typeof lat !== "number" || typeof lon !== "number") continue;

        L.circleMarker([lat, lon], {
          radius: 4,
          color: "#0f172a", // slate-900
          weight: 1,
          opacity: 0.9,
          fillColor: "#22c55e", // green-500
          fillOpacity: 0.85,
          renderer: canvasRenderer,
        })
          .bindPopup(`<b>Mile ${mile}</b>`)
          .addTo(mileLayer);
      }

      // Resupply stops
      for (const stop of RESUPPLY_STOPS) {
        const ll = coordForMile(stop.mile);
        if (!ll) continue;

        const title = `${stop.name}${stop.state ? ", " + stop.state : ""}`;
        const services = stop.services?.length ? stop.services.join(", ") : "";

        L.circleMarker(ll, {
          radius: 6,
          color: "#7f1d1d", // red-900
          weight: 2,
          opacity: 0.95,
          fillColor: "#ef4444", // red-500
          fillOpacity: 0.75,
          renderer: canvasRenderer,
        })
          .bindPopup(
            `<b>${title}</b><br/>Mile ${stop.mile}<br/><small>${stop.type}${services ? " • " + services : ""}</small>`
          )
          .addTo(resupplyLayer);
      }

      // Water sources (approx placed by mile; shown at higher zoom)
      for (const src of atWaterSources as any[]) {
        const mile = src?.mile;
        if (typeof mile !== "number") continue;
        const ll = coordForMile(mile);
        if (!ll) continue;

        const name = src?.name || "Water";
        const type = src?.type || "";
        const offTrail = src?.offTrail ? " (off-trail)" : "";

        L.circleMarker(ll, {
          radius: 4,
          color: "#0c4a6e", // sky-900
          weight: 1,
          opacity: 0.9,
          fillColor: "#38bdf8", // sky-400
          fillOpacity: 0.75,
          renderer: canvasRenderer,
        })
          .bindPopup(`<b>${name}</b><br/>Mile ${mile}<br/><small>${type}${offTrail}</small>`)
          .addTo(waterLayer);
      }

      // Road crossings / bailouts
      for (const x of AT_ROAD_CROSSINGS) {
        const ll = coordForMile(x.mile);
        if (!ll) continue;

        const subtitle = `${x.road} • ${x.nearestTown} (${x.townDist}mi)`;

        L.circleMarker(ll, {
          radius: 5,
          color: "#312e81", // indigo-900
          weight: 2,
          opacity: 0.95,
          fillColor: "#a78bfa", // violet-400
          fillOpacity: 0.7,
          renderer: canvasRenderer,
        })
          .bindPopup(
            `<b>${x.name}</b><br/>Mile ${x.mile}<br/><small>${subtitle}</small>${x.notes ? `<br/><small>${x.notes}</small>` : ""}`
          )
          .addTo(crossingLayer);
      }
    }

    const sheltersRaw: { name: string; type?: string; lat: number; lon: number }[] = [];

    async function loadShelters() {
      try {
        const res = await fetch("/data/at-shelters.geojson", {
          headers: { Accept: "application/geo+json, application/json" },
        });
        if (!res.ok) throw new Error(`shelters fetch failed: ${res.status}`);
        const data = await res.json();

        const features = data?.features || [];
        for (const ft of features) {
          const coords = ft?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) continue;
          const lon = coords[0];
          const lat = coords[1];
          if (typeof lat !== "number" || typeof lon !== "number") continue;

          const props = ft?.properties || {};
          const name = props?.name || props?.tags?.name || "Shelter";
          const shelterType = props?.shelter_type ? String(props.shelter_type) : "";

          sheltersRaw.push({ name, type: shelterType || undefined, lat, lon });

          L.circleMarker([lat, lon], {
            radius: 5,
            color: "#92400e", // amber-800
            weight: 2,
            opacity: 0.95,
            fillColor: "#f59e0b", // amber-500
            fillOpacity: 0.75,
            renderer: canvasRenderer,
          })
            .bindPopup(
              `<b>${name}</b>${shelterType ? `<br/><small>${shelterType}</small>` : ""}`
            )
            .addTo(shelterLayer);
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await loadMilepostsAndBuildLayers();
      await loadShelters();
    } catch (err) {
      console.error(err);
    }

    // Precompute shelter→mile (used by the Explorer panel)
    try {
      const indexed = sheltersRaw
        .map((s) => {
          const m = nearestMileForLatLng(s.lat, s.lon);
          return m == null ? null : { name: s.name, mile: m, lat: s.lat, lon: s.lon };
        })
        .filter(Boolean) as any[];

      indexed.sort((a, b) => a.mile - b.mile);
      sheltersWithMile = indexed as any;
    } catch (err) {
      console.warn(err);
    }

    // Selected mile marker (draggable)
    const mileIcon = L.divIcon({
      className: "hc-mile-pin",
      html: '<div class="hc-mile-pin__dot"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    let selectedMarker: any = null;

    function moveSelectedMarker(recenter: boolean = false) {
      const ll = coordForMile(selectedMile);
      if (!ll) return;

      if (!selectedMarker) {
        selectedMarker = L.marker(ll, { icon: mileIcon, draggable: true }).addTo(map);
        selectedMarker.on("dragend", () => {
          const pos = selectedMarker.getLatLng();
          const m = nearestMileForLatLng(pos.lat, pos.lng);
          if (m == null) return;
          selectedMile = clamp(m, 0, 2197);
        });
      } else {
        selectedMarker.setLatLng(ll);
      }

      if (recenter) {
        map.setView(ll, Math.max(map.getZoom(), 12));
      }
    }

    // Expose marker sync to Svelte UI
    centerOnSelectedFn = () => moveSelectedMarker(false);

    // Initial: jump to selected mile (Character/current) if available.
    // (Do this after mileCoord is loaded so coordForMile works.)
    moveSelectedMarker(true);

    // HoggCountry Tracker (Garmin inReach MapShare → Netlify Function → GeoJSON)
    let hoggLastFetchedAt = 0;
    let hoggLastUpdatedWhen: string | null = null;
    let hoggRefreshTimer: any = null;

    function clearHoggLayer() {
      hoggLayer.clearLayers();
    }

    async function refreshHoggTracker() {
      // Avoid hammering on rapid toggles.
      const now = Date.now();
      if (now - hoggLastFetchedAt < 15_000) return;
      hoggLastFetchedAt = now;

      try {
        const res = await fetch("/.netlify/functions/garmin-track?id=hoggcountry", {
          headers: { Accept: "application/geo+json, application/json" },
        });
        if (!res.ok) throw new Error(`garmin-track fetch failed: ${res.status}`);

        const data = await res.json();
        const feats = data?.features || [];

        // Extract best track + last point.
        let lineCoords: [number, number][] | null = null;
        let pointCoord: [number, number] | null = null;
        let pointWhen: string | null = null;

        for (const ft of feats) {
          const g = ft?.geometry;
          const p = ft?.properties || {};

          if (g?.type === "LineString" && Array.isArray(g.coordinates)) {
            const coords = g.coordinates
              .map((c: any) => (Array.isArray(c) && c.length >= 2 ? [c[1], c[0]] : null))
              .filter(Boolean);
            if (coords.length >= 2) lineCoords = coords as any;
          }

          if (g?.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
            pointCoord = [g.coordinates[1], g.coordinates[0]];
            if (typeof p.when === "string") pointWhen = p.when;
          }
        }

        // If we have a line but no point, use the last line point as the marker.
        if (!pointCoord && lineCoords && lineCoords.length) {
          pointCoord = lineCoords[lineCoords.length - 1];
        }

        // Prefer the function's latestPoint.when if available.
        const latestWhen =
          typeof data?.properties?.latestPoint?.when === "string"
            ? data.properties.latestPoint.when
            : pointWhen;
        hoggLastUpdatedWhen = latestWhen || null;

        clearHoggLayer();

        if (lineCoords && lineCoords.length >= 2) {
          const poly = L.polyline(lineCoords, {
            color: "#06b6d4", // cyan-500
            weight: 4,
            opacity: 0.9,
          });
          poly.addTo(hoggLayer);
        }

        if (pointCoord) {
          const label = `HoggCountry${hoggLastUpdatedWhen ? `\n${hoggLastUpdatedWhen}` : ""}`;

          const marker = L.circleMarker(pointCoord, {
            radius: 7,
            color: "#0e7490", // cyan-700
            weight: 2,
            opacity: 0.95,
            fillColor: "#22d3ee", // cyan-400
            fillOpacity: 0.85,
          })
            .bindPopup(
              `<b>HoggCountry Tracker</b><br/>${hoggLastUpdatedWhen ? `<small>Updated: ${hoggLastUpdatedWhen}</small>` : "<small>(No timestamp)</small>"}`
            )
            .bindTooltip(label, { direction: "top", opacity: 0.85 });

          marker.addTo(hoggLayer);
        }

        // If toggled on, ensure it is visible after refresh.
        if (showHoggTracker && !map.hasLayer(hoggLayer)) hoggLayer.addTo(map);
      } catch (err) {
        console.error(err);
      }
    }

    function startHoggTrackerPolling() {
      if (hoggRefreshTimer) return;
      // Client polls; server function caches ~5 min at edge.
      hoggRefreshTimer = setInterval(() => {
        if (!showHoggTracker) return;
        refreshHoggTracker();
      }, 120_000);
    }

    function stopHoggTrackerPolling() {
      if (!hoggRefreshTimer) return;
      clearInterval(hoggRefreshTimer);
      hoggRefreshTimer = null;
    }

    function syncOverlays() {
      // Mile markers
      if (showMileMarkers) {
        if (!map.hasLayer(mileLayer)) mileLayer.addTo(map);
      } else {
        if (map.hasLayer(mileLayer)) map.removeLayer(mileLayer);
      }

      // Resupply stops
      if (showResupplyStops) {
        if (!map.hasLayer(resupplyLayer)) resupplyLayer.addTo(map);
      } else {
        if (map.hasLayer(resupplyLayer)) map.removeLayer(resupplyLayer);
      }

      // Road crossings
      if (showRoadCrossings) {
        if (!map.hasLayer(crossingLayer)) crossingLayer.addTo(map);
      } else {
        if (map.hasLayer(crossingLayer)) map.removeLayer(crossingLayer);
      }

      const zoom = map.getZoom();

      // Water sources (only show when zoomed in enough)
      const waterAllowed = zoom >= 11;
      if (showWaterSources && waterAllowed) {
        if (!map.hasLayer(waterLayer)) waterLayer.addTo(map);
      } else {
        if (map.hasLayer(waterLayer)) map.removeLayer(waterLayer);
      }

      // Shelters (OSM-derived)
      const shelterAllowed = zoom >= 10;
      if (showShelters && shelterAllowed) {
        if (!map.hasLayer(shelterLayer)) shelterLayer.addTo(map);
      } else {
        if (map.hasLayer(shelterLayer)) map.removeLayer(shelterLayer);
      }

      // HoggCountry Tracker (live-ish)
      if (showHoggTracker) {
        if (!map.hasLayer(hoggLayer)) hoggLayer.addTo(map);
      } else {
        if (map.hasLayer(hoggLayer)) map.removeLayer(hoggLayer);
      }
    }

    // Initial overlay sync
    syncOverlays();
    map.on("zoomend", syncOverlays);

    // Wire Svelte UI ↔ Leaflet
    syncOverlaysFn = syncOverlays;
    mapReady = true;

    // Tracker ON by default
    if (showHoggTracker) {
      startHoggTrackerPolling();
      refreshHoggTracker();
    }

    // Click-to-mile + nearest info
    let infoPopup: any = null;

    function nearestMileForLatLng(lat: number, lon: number): number | null {
      if (!milepostsRaw.length) return null;

      // Small N (2198) so O(n) scan is fine.
      let bestMile = milepostsRaw[0].mile;
      let bestD = Infinity;

      for (const mp of milepostsRaw) {
        const d = haversineMeters([lat, lon], [mp.lat, mp.lon]);
        if (d < bestD) {
          bestD = d;
          bestMile = mp.mile;
        }
      }

      return bestMile;
    }

    function nearestByMile<T extends { mile: number }>(
      list: T[],
      mile: number
    ): { prev: T | null; next: T | null } {
      let prev: T | null = null;
      let next: T | null = null;

      for (const item of list) {
        if (item.mile <= mile) {
          if (!prev || item.mile > prev.mile) prev = item;
        } else {
          if (!next || item.mile < next.mile) next = item;
        }
      }

      return { prev, next };
    }

    function nearestShelter(lat: number, lon: number) {
      if (!sheltersRaw.length) return null;

      let best = sheltersRaw[0];
      let bestD = Infinity;

      for (const s of sheltersRaw) {
        const d = haversineMeters([lat, lon], [s.lat, s.lon]);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }

      return { shelter: best, distMeters: bestD };
    }

    map.on("click", (ev: any) => {
      const lat = ev?.latlng?.lat;
      const lon = ev?.latlng?.lng;
      if (typeof lat !== "number" || typeof lon !== "number") return;

      const mile = nearestMileForLatLng(lat, lon);
      if (mile != null) {
        selectedMile = clamp(mile, 0, 2197);
        moveSelectedMarker(false);
      }

      const water = mile == null ? { prev: null, next: null } : nearestByMile(atWaterSources as any[], mile);
      const resupply = mile == null ? { prev: null, next: null } : nearestByMile(RESUPPLY_STOPS, mile);
      const crossings = mile == null ? { prev: null, next: null } : nearestByMile(AT_ROAD_CROSSINGS, mile);
      const shelter = nearestShelter(lat, lon);

      const fmtMiles = (m: number) => (Math.round(m * 10) / 10).toFixed(1);
      const fmtMi = (meters: number) => (meters / 1609.344).toFixed(1);

      const html = `
        <div style="min-width: 220px">
          <div style="font-weight: 800; margin-bottom: 6px;">${mile == null ? "Map point" : `Mile ${fmtMiles(mile)}`}</div>
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}</div>

          <div style="font-size: 12px; margin-bottom: 6px;"><b>Resupply</b>: ${resupply.next ? `${resupply.next.name} (${fmtMiles(resupply.next.mile)})` : "—"}</div>
          <div style="font-size: 12px; margin-bottom: 6px;"><b>Water</b>: ${water.next ? `${water.next.name} (${fmtMiles(water.next.mile)})` : "—"}</div>
          <div style="font-size: 12px; margin-bottom: 6px;"><b>Road</b>: ${crossings.next ? `${crossings.next.name} (${fmtMiles(crossings.next.mile)})` : "—"}</div>
          <div style="font-size: 12px; margin-bottom: 6px;"><b>Nearest shelter</b>: ${shelter ? `${shelter.shelter.name} (~${fmtMi(shelter.distMeters)} mi)` : "—"}</div>

          <div style="font-size: 11px; opacity: 0.75; margin-top: 8px;">Tip: zoom in for more layers.</div>
        </div>
      `;

      if (infoPopup) map.closePopup(infoPopup);
      infoPopup = L.popup({ maxWidth: 340 }).setLatLng([lat, lon]).setContent(html).openOn(map);
    });

    // Location (no API key): show a marker + center on it.
    let myLocationMarker: any = null;

    function locateMe() {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported on this device/browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          if (myLocationMarker) {
            map.removeLayer(myLocationMarker);
          }

          myLocationMarker = L.circleMarker([lat, lon], {
            radius: 7,
            color: "#1d4ed8", // blue-700
            weight: 2,
            fillColor: "#60a5fa", // blue-400
            fillOpacity: 0.75,
          })
            .addTo(map)
            .bindPopup("<b>Your location</b>");

          // Snap the selected mile to the nearest trail mile.
          const m = nearestMileForLatLng(lat, lon);
          if (m != null) {
            selectedMile = clamp(m, 0, 2197);
            moveSelectedMarker(true);
          } else {
            map.setView([lat, lon], Math.max(map.getZoom(), 12));
          }

          myLocationMarker.openPopup();
        },
        (err) => {
          console.warn(err);
          alert(
            "Couldn’t get your location. If you’re on iPhone, make sure Location Services are enabled and the browser has permission."
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }

    // Wire locate to the Svelte UI (bottom sheet button)
    locatePreviewFn = () => locateMe();

    // Mobile-first UI: Leaflet's in-map checkbox panel removed.
    // Controls now live in a bottom sheet (Svelte UI).
  });
</script>

<div class="explorer">
  <aside class="panel" aria-label="AT map explorer">
    <div class="panelTop">
      <div>
        <div class="k">Mile</div>
        <div class="mile">{selectedMile}</div>
        <div class="sub">Saved current: <b>{savedMile}</b></div>
      </div>

      <div class="panelActions">
        <button class="btn" type="button" on:click={() => locatePreviewFn?.()}>Use my location</button>
        <button class="btn" type="button" disabled={selectedMile === savedMile} on:click={() => updateContext({ currentMile: selectedMile })}>
          Set as current
        </button>
        <a class="btn ghost" href={`/at-weather?mile=${selectedMile}`}>Weather →</a>
      </div>
    </div>

    <input class="mileSlider" type="range" min="0" max="2197" step="1" bind:value={selectedMile} aria-label="Mile slider" />

    <div class="hint">Drag the slider or drag the dot on the map to explore what’s ahead.</div>

    <details class="layers">
      <summary>Layers</summary>
      <div class="toggles">
        <label class="toggle"><input type="checkbox" bind:checked={showHoggTracker} /> <span>Hogg tracker</span></label>
        <label class="toggle"><input type="checkbox" bind:checked={showResupplyStops} /> <span>Resupply</span></label>
        <label class="toggle"><input type="checkbox" bind:checked={showShelters} /> <span>Shelters</span></label>
        <label class="toggle"><input type="checkbox" bind:checked={showWaterSources} /> <span>Water (zoom 11+)</span></label>
        <label class="toggle"><input type="checkbox" bind:checked={showRoadCrossings} /> <span>Road crossings</span></label>
        <label class="toggle"><input type="checkbox" bind:checked={showMileMarkers} /> <span>Mile markers</span></label>
      </div>
    </details>

    <div class="nearby" aria-label="Nearby points of interest">
      <div class="k">Nearby</div>

      <div class="nextUp">
        <div class="row2">
          <div class="nk">Next resupply</div>
          <div class="nv">{nextResupply ? `${nextResupply.name} (mile ${nextResupply.mile})` : '—'}</div>
        </div>
        <div class="row2">
          <div class="nk">Next shelter</div>
          <div class="nv">{nextShelter ? `${nextShelter.name} (mile ${nextShelter.mile})` : '—'}</div>
        </div>
        <div class="row2">
          <div class="nk">Next water</div>
          <div class="nv">{nextWater ? `${nextWater.name} (mile ${nextWater.mile})` : '—'}</div>
        </div>
        <div class="row2">
          <div class="nk">Next road crossing</div>
          <div class="nv">{nextCrossing ? `${nextCrossing.name} (mile ${nextCrossing.mile})` : '—'}</div>
        </div>
      </div>

      <div class="lists">
        <div class="list">
          <div class="lk">Upcoming shelters (≤ 25 mi)</div>
          {#if !upcomingShelters.length}
            <div class="lv">—</div>
          {:else}
            {#each upcomingShelters as s (s.name + s.mile)}
              <div class="li">• {s.name} — mile {s.mile}</div>
            {/each}
          {/if}
        </div>

        <div class="list">
          <div class="lk">Upcoming water (≤ 12 mi)</div>
          {#if !upcomingWater.length}
            <div class="lv">—</div>
          {:else}
            {#each upcomingWater as w (w.name + w.mile)}
              <div class="li">• {w.name} — mile {w.mile}</div>
            {/each}
          {/if}
        </div>

        <div class="list">
          <div class="lk">Upcoming road crossings (≤ 25 mi)</div>
          {#if !upcomingCrossings.length}
            <div class="lv">—</div>
          {:else}
            {#each upcomingCrossings as c (c.name + c.mile)}
              <div class="li">• {c.name} — mile {c.mile}</div>
            {/each}
          {/if}
        </div>
      </div>

      <div class="nearbyHint">Tap the map to move the dot. Drag the dot to fine‑tune.</div>
    </div>
  </aside>

  <div class="mapWrap">
    <div class="at-map" bind:this={container} aria-label="Appalachian Trail map" />
  </div>
</div>

<style>
  .explorer {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 14px;
    align-items: start;
  }

  @media (max-width: 920px) {
    .explorer {
      grid-template-columns: 1fr;
    }
  }

  .panel {
    border: 1px solid rgba(0,0,0,0.10);
    border-radius: 16px;
    background: rgba(255,255,255,0.78);
    box-shadow: 0 18px 52px rgba(0,0,0,0.12);
    padding: 12px;
    backdrop-filter: blur(8px);
  }

  .panelTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .k {
    font-family: Oswald, system-ui, sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(52, 66, 58, 0.82);
    font-weight: 800;
  }

  .mile {
    font-family: Anton, Oswald, system-ui, sans-serif;
    font-size: 2.1rem;
    line-height: 1.05;
    letter-spacing: 0.02em;
    color: rgba(31, 41, 55, 0.92);
  }

  .sub {
    margin-top: 2px;
    font-size: 0.92rem;
    color: rgba(55, 65, 81, 0.72);
  }

  .panelActions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .panel .btn {
    height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.12);
    background: rgba(255,255,255,0.86);
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(31, 41, 55, 0.88);
  }

  .panel .btn:hover {
    background: rgba(240, 224, 0, 0.18);
    border-color: rgba(0,0,0,0.16);
  }

  .panel .btn:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .panel .btn.ghost {
    background: rgba(255,255,255,0.0);
  }

  .mileSlider {
    width: 100%;
    margin-top: 10px;
  }

  .panel .hint {
    margin-top: 6px;
    font-size: 0.92rem;
    color: rgba(55, 65, 81, 0.72);
  }

  details.layers {
    margin-top: 10px;
    border-top: 1px solid rgba(0,0,0,0.08);
    padding-top: 10px;
  }

  details.layers summary {
    cursor: pointer;
    user-select: none;
    font-family: Oswald, system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 800;
    color: rgba(31, 41, 55, 0.86);
    margin-bottom: 10px;
  }

  .panel .toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 12px;
  }

  .panel .toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
    color: rgba(31, 41, 55, 0.86);
    user-select: none;
  }

  .nearby {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0,0,0,0.08);
  }

  .nearbyHint {
    margin-top: 10px;
    font-size: 0.92rem;
    color: rgba(55, 65, 81, 0.72);
  }

  .nextUp {
    margin-top: 10px;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 14px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.65);
  }

  .row2 {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 10px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }

  .row2:last-child {
    border-bottom: none;
  }

  .nk {
    font-family: Oswald, system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.75rem;
    color: rgba(52, 66, 58, 0.75);
    font-weight: 800;
  }

  .nv {
    font-size: 0.95rem;
    color: rgba(31, 41, 55, 0.88);
  }

  .lists {
    margin-top: 12px;
    display: grid;
    gap: 10px;
  }

  .list {
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: 14px;
    padding: 10px 12px;
    background: rgba(255,255,255,0.55);
  }

  .lk {
    font-family: Oswald, system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.78rem;
    color: rgba(31, 41, 55, 0.78);
    font-weight: 800;
    margin-bottom: 6px;
  }

  .li {
    font-size: 0.95rem;
    color: rgba(31, 41, 55, 0.86);
    line-height: 1.35;
    padding: 3px 0;
  }

  .lv {
    font-size: 0.95rem;
    color: rgba(55, 65, 81, 0.7);
  }

  @media (max-width: 520px) {
    .row2 { grid-template-columns: 1fr; }
  }

  .mapWrap {
    position: relative;
  }

  .at-map {
    width: 100%;
    height: min(72vh, 720px);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

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
    background: #f0e000;
    border: 2px solid #111827;
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
  }

  @media (max-width: 520px) {
    .panel .toggles { grid-template-columns: 1fr; }
  }
</style>
