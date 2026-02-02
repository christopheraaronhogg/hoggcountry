<script lang="ts">
  import { onMount } from 'svelte';
  import { trailContext, loadContext, updateContext } from '../stores/trailContext.svelte';
  import 'leaflet/dist/leaflet.css';

  type Milepost = { mile: number; lat: number; lon: number; scaledTrailMiles?: number };

  let container: HTMLDivElement;

  const PREVIEW_KEY = 'hcAtWeather.previewMile';

  function parseMileParam(): number | null {
    if (typeof window === 'undefined') return null;
    const u = new URL(window.location.href);
    const raw = u.searchParams.get('mile');
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return clamp(Math.round(n), 0, 2197);
  }

  function readSavedPreviewMile(): number | null {
    if (typeof window === 'undefined') return null;
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
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PREVIEW_KEY, String(Math.round(m)));
    } catch {}
  }

  // Initial preview mile selection priority:
  // 1) ?mile= (share link)
  // 2) Character current mile (anchor)
  // 3) last preview mile (local)
  // 4) 0
  function getInitialMile(): number {
    const fromUrl = parseMileParam();
    if (fromUrl != null) return fromUrl;

    const c = Number(trailContext.currentMile);
    const onTrail = Boolean(trailContext.isOnTrail);

    // If we're on trail (or current mile is non-zero), anchor to Character by default.
    if (Number.isFinite(c) && (onTrail || c > 0)) return clamp(Math.round(c), 0, 2197);

    const fromSaved = readSavedPreviewMile();
    if (fromSaved != null) return fromSaved;

    return 0;
  }

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  // Preview mile (explore-mode). This does NOT update Character unless user explicitly confirms.
  let mile = $state<number>(0);
  let characterMile = $derived.by(() => Number(trailContext.currentMile) || 0);

  let savedMsg = $state('');
  let milepostsByMile = $state<Milepost[]>([]);
  let milepostsList = $state<Milepost[]>([]);

  let lat = $derived.by(() => {
    const mp = milepostsByMile[mile];
    return mp?.lat ?? 0;
  });
  let lon = $derived.by(() => {
    const mp = milepostsByMile[mile];
    return mp?.lon ?? 0;
  });

  let loading = $state(true);
  let err = $state('');

  // Weather state
  type WeatherNow = {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
  };

  type OpenMeteoResponse = {
    timezone?: string;
    timezone_abbreviation?: string;
    utc_offset_seconds?: number;
    latitude?: number;
    longitude?: number;
    elevation?: number; // model/grid elevation (meters)
    current?: WeatherNow;
    hourly?: Record<string, any>;
    daily?: Record<string, any>;
  };

  let wxLoading = $state(false);
  let wxErr = $state('');
  let wx = $state<OpenMeteoResponse | null>(null);

  // Trail elevation (meters) from Open-Meteo elevation API (terrain/SRTM-like)
  let trailElevM = $state<number | null>(null);
  let elevLoading = $state(false);
  let elevErr = $state('');

  // Location assist
  let locating = $state(false);
  let locationErr = $state('');
  let userDistMeters = $state<number | null>(null);

  function wxCodeLabel(code: unknown): string {
    const c = Number(code);
    if (!Number.isFinite(c)) return '—';
    // Open-Meteo weathercode mapping (condensed)
    if (c === 0) return 'Clear';
    if (c === 1) return 'Mostly clear';
    if (c === 2) return 'Partly cloudy';
    if (c === 3) return 'Overcast';
    if (c === 45 || c === 48) return 'Fog';
    if (c === 51 || c === 53 || c === 55) return 'Drizzle';
    if (c === 56 || c === 57) return 'Freezing drizzle';
    if (c === 61 || c === 63 || c === 65) return 'Rain';
    if (c === 66 || c === 67) return 'Freezing rain';
    if (c === 71 || c === 73 || c === 75) return 'Snow';
    if (c === 77) return 'Snow grains';
    if (c === 80 || c === 81 || c === 82) return 'Rain showers';
    if (c === 85 || c === 86) return 'Snow showers';
    if (c === 95) return 'Thunderstorm';
    if (c === 96 || c === 99) return 'Thunderstorm + hail';
    return `Weather (${c})`;
  }

  function fmt(n: unknown, digits = 0): string {
    const x = Number(n);
    if (!Number.isFinite(x)) return '—';
    return x.toFixed(digits);
  }

  function mToFt(m: unknown) {
    const x = Number(m);
    if (!Number.isFinite(x)) return NaN;
    return x * 3.28084;
  }

  const LAPSE_F_PER_1000_FT = 3.6;

  let modelElevFt = $derived.by(() => mToFt(wx?.elevation));
  let trailElevFt = $derived.by(() => mToFt(trailElevM));
  let tempModelF = $derived.by(() => Number(wx?.current?.temperature_2m));

  let deltaElevFt = $derived.by(() => {
    if (!Number.isFinite(modelElevFt) || !Number.isFinite(trailElevFt)) return NaN;
    return trailElevFt - modelElevFt;
  });

  let deltaTempF = $derived.by(() => {
    if (!Number.isFinite(deltaElevFt)) return NaN;
    return -(deltaElevFt / 1000) * LAPSE_F_PER_1000_FT;
  });

  let tempTrailEstF = $derived.by(() => {
    if (!Number.isFinite(tempModelF) || !Number.isFinite(deltaTempF)) return NaN;
    return tempModelF + deltaTempF;
  });

  // Only show the elevation-adjusted temp when it meaningfully differs.
  // If the model point elevation ~= trail elevation, the “estimate” adds no value.
  let showElevationAdjustedCard = $derived.by(() => {
    if (elevLoading) return true;
    if (elevErr) return true;
    const dt = Number(deltaTempF);
    return Number.isFinite(dt) && Math.abs(dt) >= 1.0;
  });

  function updateUrl(nextMile: number) {
    if (typeof window === 'undefined') return;
    const u = new URL(window.location.href);
    u.searchParams.set('mile', String(nextMile));
    window.history.replaceState({}, '', u.toString());
  }

  function copyLink() {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  }

  function fmtMi(meters: unknown) {
    const m = Number(meters);
    if (!Number.isFinite(m)) return '—';
    return (m / 1609.344).toFixed(1);
  }

  function useMyLocation() {
    // Preview-only: locate and snap preview mile, but do NOT update Character.
    if (typeof window === 'undefined') return;
    locationErr = '';
    savedMsg = '';

    if (!('geolocation' in navigator)) {
      locationErr = 'Geolocation not supported on this device.';
      return;
    }

    locating = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locating = false;
        const la = pos?.coords?.latitude;
        const lo = pos?.coords?.longitude;
        if (typeof la !== 'number' || typeof lo !== 'number') {
          locationErr = 'Could not read location.';
          return;
        }

        const m = nearestMileForLatLng(la, lo);
        if (m == null) {
          locationErr = 'Could not match your location to a trail mile.';
          return;
        }

        const clamped = clamp(m, 0, 2197);
        mile = clamped;

        const mp = milepostsByMile[clamped];
        if (mp) {
          userDistMeters = haversineMeters([la, lo], [mp.lat, mp.lon]);
        } else {
          userDistMeters = null;
        }
      },
      (e) => {
        locating = false;
        userDistMeters = null;
        locationErr = e?.message || 'Location permission denied.';
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60_000,
      }
    );
  }

  function setAsCurrentMile() {
    savedMsg = '';
    locationErr = '';
    try {
      updateContext({ currentMile: mile });
      savedMsg = `Saved: current mile set to ${mile}.`;
    } catch {
      savedMsg = 'Saved.';
    }
  }

  function syncGpsToCurrentMile() {
    // Locate + snap to nearest mile AND update Character.
    if (typeof window === 'undefined') return;
    locationErr = '';
    savedMsg = '';

    if (!('geolocation' in navigator)) {
      locationErr = 'Geolocation not supported on this device.';
      return;
    }

    locating = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locating = false;
        const la = pos?.coords?.latitude;
        const lo = pos?.coords?.longitude;
        if (typeof la !== 'number' || typeof lo !== 'number') {
          locationErr = 'Could not read location.';
          return;
        }

        const m = nearestMileForLatLng(la, lo);
        if (m == null) {
          locationErr = 'Could not match your location to a trail mile.';
          return;
        }

        const clamped = clamp(m, 0, 2197);
        mile = clamped;

        const mp = milepostsByMile[clamped];
        if (mp) {
          userDistMeters = haversineMeters([la, lo], [mp.lat, mp.lon]);
        } else {
          userDistMeters = null;
        }

        updateContext({ currentMile: clamped });
        savedMsg = `Synced: current mile set to ${clamped}.`;
      },
      (e) => {
        locating = false;
        userDistMeters = null;
        locationErr = e?.message || 'Location permission denied.';
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60_000,
      }
    );
  }

  // Nearest mile for click
  function haversineMeters(a: [number, number], b: [number, number]) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function nearestMileForLatLng(lat: number, lon: number): number | null {
    if (!milepostsList.length) return null;
    let best = milepostsList[0].mile;
    let bestD = Infinity;

    for (const mp of milepostsList) {
      const d = haversineMeters([lat, lon], [mp.lat, mp.lon]);
      if (d < bestD) {
        bestD = d;
        best = mp.mile;
      }
    }

    return best;
  }

  let _debounce: any = null;
  function fetchWeatherDebounced() {
    if (_debounce) clearTimeout(_debounce);
    _debounce = setTimeout(fetchWeather, 450);
  }

  async function fetchElevation() {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0 || lon === 0) return;

    elevLoading = true;
    elevErr = '';

    try {
      const url = new URL('https://api.open-meteo.com/v1/elevation');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lon));
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`elevation fetch failed: ${res.status}`);
      const data = await res.json();
      const arr = data?.elevation;
      const val = Array.isArray(arr) ? Number(arr[0]) : Number(arr);
      trailElevM = Number.isFinite(val) ? val : null;
    } catch (e: any) {
      elevErr = e?.message || 'Failed to load elevation.';
      trailElevM = null;
    } finally {
      elevLoading = false;
    }
  }

  async function fetchWeather() {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0 || lon === 0) return;

    wxLoading = true;
    wxErr = '';

    // Reset derived inputs
    trailElevM = null;
    elevErr = '';

    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lon));
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('temperature_unit', 'fahrenheit');
      url.searchParams.set('wind_speed_unit', 'mph');
      url.searchParams.set('precipitation_unit', 'inch');

      url.searchParams.set('current', [
        'temperature_2m',
        'apparent_temperature',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_gusts_10m',
      ].join(','));

      url.searchParams.set('hourly', [
        'temperature_2m',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
      ].join(','));

      url.searchParams.set('daily', [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'weather_code',
        'wind_speed_10m_max',
      ].join(','));

      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`);
      wx = await res.json();

      // Terrain elevation is separate from the model/grid elevation in the forecast response.
      // We fetch it explicitly so we can show an estimated temp at trail elevation.
      fetchElevation();
    } catch (e: any) {
      wxErr = e?.message || 'Failed to load weather.';
      wx = null;
    } finally {
      wxLoading = false;
    }
  }

  // When mile changes, keep URL + weather + marker in sync.
  let _marker: any = null;
  $effect(() => {
    if (!milepostsByMile.length) return;
    updateUrl(mile);
    savePreviewMile(mile);
    fetchWeatherDebounced();
    if (_marker) _marker.setLatLng([lat, lon]);
  });

  onMount(async () => {
    loadContext();
    mile = getInitialMile();

    try {
      const res = await fetch('/at-mileposts.json', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`mileposts fetch failed: ${res.status}`);
      const data = await res.json();
      const mps: Milepost[] = Array.isArray(data) ? data : data?.mileposts || [];

      // Index for fast mile→coord, plus a dense list for nearest-mile search.
      const byMile: Milepost[] = [];
      for (const mp of mps) byMile[mp.mile] = mp;

      milepostsByMile = byMile;
      milepostsList = mps;
      loading = false;

      // Map init
      const L = await import('leaflet');
      const map = L.map(container, { zoomControl: true, attributionControl: true });

      const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
          '<a href="https://www.openstreetmap.org/copyright">SRTM</a> | ' +
          'Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      });

      topo.addTo(map);
      L.control.scale({ imperial: true, metric: false }).addTo(map);

      map.setView([39.0, -76.0], 5);

      // Trail line
      try {
        const trailRes = await fetch('/data/appalachian-trail.geojson', {
          headers: { Accept: 'application/geo+json, application/json' },
        });
        if (trailRes.ok) {
          const geojson = await trailRes.json();
          const layer = L.geoJSON(geojson, {
            style: { color: '#f97316', weight: 3, opacity: 0.9 },
          }).addTo(map);
          const bounds = layer.getBounds();
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [18, 18] });
        }
      } catch {}

      const markerIcon = L.divIcon({
        className: 'at-mile-dot',
        html: '<div class="at-mile-dot__inner"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      _marker = L.marker([lat, lon], { icon: markerIcon, draggable: true }).addTo(map);

      _marker.on('dragend', () => {
        const ll = _marker.getLatLng();
        const m = nearestMileForLatLng(ll.lat, ll.lng);
        if (m == null) return;
        mile = clamp(m, 0, 2197);
      });

      map.on('click', (ev: any) => {
        const la = ev?.latlng?.lat;
        const lo = ev?.latlng?.lng;
        if (typeof la !== 'number' || typeof lo !== 'number') return;
        const m = nearestMileForLatLng(la, lo);
        if (m == null) return;
        mile = clamp(m, 0, 2197);
      });
    } catch (e: any) {
      err = e?.message || 'Failed to initialize.';
      loading = false;
    }
  });
</script>

<div class="wrap">
  <div class="controls card">
    <div class="row">
      <div>
        <div class="k">Mile</div>
        <div class="v">{mile}</div>
        <div class="sub">Lat {lat.toFixed(4)} • Lon {lon.toFixed(4)}</div>
        <div class="sub small">Saved current mile: <b>{characterMile}</b></div>
        {#if savedMsg}
          <div class="sub saved">{savedMsg}</div>
        {/if}
        {#if userDistMeters != null}
          <div class="sub small">Nearest mile to you: ~{fmtMi(userDistMeters)} mi away</div>
        {/if}
        {#if locationErr}
          <div class="sub err">{locationErr}</div>
        {/if}
      </div>
      <div class="actions">
        <button class="btn" type="button" onclick={useMyLocation} disabled={locating}>
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        {#if mile !== characterMile}
          <button class="btn" type="button" onclick={setAsCurrentMile}>
            Set as Current
          </button>
        {/if}
        <button
          class="btn ghost icon"
          type="button"
          onclick={copyLink}
          title="Copy link"
          aria-label="Copy link"
        >
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16h-9V7h9v14Z"
            />
          </svg>
        </button>
      </div>
    </div>

    <input
      class="slider"
      type="range"
      min="0"
      max="2197"
      step="1"
      bind:value={mile}
      aria-label="Mile marker"
    />

    <div class="hint">Tip: drag the slider or click the map to set your mile.</div>
  </div>

  <div class="grid">
    <div class="wx card">
      <h2 class="h">Forecast</h2>

      {#if loading}
        <p class="p">Loading…</p>
      {:else if err}
        <p class="p err">{err}</p>
      {:else}
        {#if wxLoading}
          <p class="p">Fetching weather…</p>
        {:else if wxErr}
          <p class="p err">{wxErr}</p>
        {:else if wx?.current}
          <div class="temps">
            <div class="tempCard">
              <div class="label">Forecast (Open‑Meteo model point)</div>
              <div class="temp">{fmt(tempModelF, 0)}°F</div>
              <div class="subline">Model elevation: {fmt(modelElevFt, 0)} ft</div>
              <div class="cond">{wxCodeLabel(wx.current.weather_code)}</div>
            </div>

            {#if showElevationAdjustedCard}
              <div class="tempCard">
                <div class="label">Estimated at trail elevation</div>
                <div class="temp">~{fmt(tempTrailEstF, 0)}°F</div>
                <div class="subline">
                  {#if elevLoading}
                    Loading elevation…
                  {:else if elevErr}
                    <span class="err">{elevErr}</span>
                  {:else}
                    Trail elevation: {fmt(trailElevFt, 0)} ft
                  {/if}
                </div>
                <div class="tiny">
                  {#if Number.isFinite(deltaElevFt) && Number.isFinite(deltaTempF)}
                    Δ {fmt(deltaElevFt, 0)} ft → {fmt(deltaTempF, 1)}°F (lapse‑rate estimate)
                  {:else}
                    Lapse‑rate estimate: ~{LAPSE_F_PER_1000_FT}°F per 1000 ft
                  {/if}
                </div>
              </div>
            {:else}
              <div class="tempCard">
                <div class="label">Trail elevation</div>
                <div class="temp">{fmt(trailElevFt, 0)} ft</div>
                <div class="subline">Matches model point — no adjustment needed.</div>
                <div class="tiny">(We only show an elevation-adjusted temperature when it changes things by ~1°F+.)</div>
              </div>
            {/if}
          </div>

          <div class="hr"></div>

          <div class="meta">
            <div><span class="mk">Feels</span> {fmt(wx.current.apparent_temperature, 0)}°</div>
            <div><span class="mk">Wind</span> {fmt(wx.current.wind_speed_10m, 0)} mph</div>
            <div><span class="mk">Gust</span> {fmt(wx.current.wind_gusts_10m, 0)} mph</div>
            <div><span class="mk">Now</span> {wx.current.time ?? '—'} {wx.timezone_abbreviation ? `(${wx.timezone_abbreviation})` : ''}</div>
          </div>

          <div class="hr"></div>

          {#if showElevationAdjustedCard}
            <p class="p small">
              Ranger note: inversions happen. Treat the elevation-adjusted number as an estimate, not a promise.
            </p>
          {/if}
        {:else}
          <p class="p">No weather available for this point.</p>
        {/if}
      {/if}
    </div>

    <div class="map card">
      <div bind:this={container} class="map-inner" aria-label="Appalachian Trail map"></div>
      <div class="mapHint">Tip: click or drag the marker to set your mile.</div>
    </div>
  </div>
</div>

<style>
  .wrap {
    display: grid;
    gap: 14px;
  }

  .card {
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  }

  .controls {
    padding: 12px 12px 10px;
  }

  .row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .k {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--pine, #4d594a);
    font-family: Oswald, system-ui, sans-serif;
  }

  .v {
    font-size: 1.6rem;
    font-weight: 900;
    color: var(--ink, #1f2937);
    line-height: 1.1;
  }

  .sub {
    margin-top: 2px;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .sub.small {
    font-size: 0.85rem;
  }

  .sub.err {
    color: #b91c1c;
    font-weight: 700;
  }

  .sub.saved {
    color: rgba(22, 101, 52, 0.95);
    font-weight: 800;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    font-weight: 700;
  }

  .btn:hover {
    background: rgba(240, 224, 0, 0.18);
    border-color: rgba(0, 0, 0, 0.16);
  }

  .btn.ghost {
    background: rgba(255, 255, 255, 0.0);
    border-color: rgba(0, 0, 0, 0.08);
    color: rgba(31, 41, 55, 0.75);
  }

  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.55);
  }

  .btn.icon {
    padding: 0.5rem 0.55rem;
    min-width: 42px;
    justify-content: center;
  }

  .ico {
    width: 18px;
    height: 18px;
    display: block;
  }

  .slider {
    width: 100%;
    margin-top: 10px;
  }

  .hint {
    margin-top: 6px;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .grid {
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    grid-template-areas: "map wx";
    gap: 14px;
  }

  .map { grid-area: map; }
  .wx { grid-area: wx; }

  /* Mobile/tablet: forecast first, map second */
  @media (max-width: 980px) {
    .grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        "wx"
        "map";
    }
  }

  .map {
    padding: 0;
    overflow: hidden;
    position: relative;
  }

  .map-inner {
    width: 100%;
    height: 62vh;
    min-height: 420px;
  }

  .mapHint {
    position: absolute;
    left: 10px;
    bottom: 10px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 0.85rem;
    color: rgba(31, 41, 55, 0.85);
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    max-width: calc(100% - 20px);
  }

  @media (max-width: 600px) {
    .map-inner {
      height: 45vh;
      min-height: 300px;
    }
  }

  .wx {
    padding: 14px;
  }

  .h {
    margin: 0 0 10px;
    font-family: Oswald, system-ui, sans-serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.95rem;
    color: rgba(52, 66, 58, 0.85);
  }

  .temps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  @media (max-width: 600px) {
    .temps {
      grid-template-columns: 1fr;
    }
  }

  .tempCard {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.65);
  }

  .label {
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(52, 66, 58, 0.78);
    font-weight: 900;
    margin-bottom: 6px;
  }

  .subline {
    margin-top: 2px;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .tiny {
    margin-top: 6px;
    font-size: 0.85rem;
    color: rgba(52, 66, 58, 0.75);
  }

  .err {
    color: #b91c1c;
    font-weight: 800;
  }

  .p {
    margin: 0.5rem 0;
    color: rgba(31, 41, 55, 0.85);
  }

  .p.small {
    font-size: 0.92rem;
    color: var(--muted);
  }

  .p.err {
    color: #b91c1c;
  }

  .now {
    display: grid;
    gap: 10px;
  }

  .big {
    display: grid;
    gap: 2px;
  }

  .temp {
    font-size: 2.2rem;
    font-weight: 900;
    color: var(--ink, #1f2937);
    line-height: 1.05;
  }

  .cond {
    color: var(--pine, #4d594a);
    font-weight: 800;
  }

  .meta {
    display: grid;
    gap: 6px;
    font-size: 0.95rem;
    color: rgba(31, 41, 55, 0.86);
  }

  .mk {
    display: inline-block;
    min-width: 54px;
    color: rgba(52, 66, 58, 0.75);
    font-weight: 800;
  }

  .hr {
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    margin: 12px 0;
  }

  /* Leaflet divIcon marker */
  :global(.at-mile-dot) {
    background: transparent;
    border: none;
  }

  :global(.at-mile-dot__inner) {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #f0e000;
    border: 2px solid #111827;
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
  }
</style>
