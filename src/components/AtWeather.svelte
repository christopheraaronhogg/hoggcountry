<script lang="ts">
  import { onMount } from 'svelte';
  import 'leaflet/dist/leaflet.css';

  type Milepost = { mile: number; lat: number; lon: number; scaledTrailMiles?: number };

  let container: HTMLDivElement;

  // URL params
  function getInitialMile(): number {
    if (typeof window === 'undefined') return 0;
    const u = new URL(window.location.href);
    const raw = u.searchParams.get('mile');
    const n = raw == null ? NaN : Number(raw);
    if (!Number.isFinite(n)) return 0;
    return clamp(Math.round(n), 0, 2197);
  }

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  let mile = $state<number>(0);
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
    current?: WeatherNow;
    hourly?: Record<string, any>;
    daily?: Record<string, any>;
  };

  let wxLoading = $state(false);
  let wxErr = $state('');
  let wx = $state<OpenMeteoResponse | null>(null);

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

  async function fetchWeather() {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0 || lon === 0) return;

    wxLoading = true;
    wxErr = '';

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
    fetchWeatherDebounced();
    if (_marker) _marker.setLatLng([lat, lon]);
  });

  onMount(async () => {
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

      _marker = L.circleMarker([lat, lon], {
        radius: 8,
        color: '#111827',
        weight: 2,
        fillColor: '#f0e000',
        fillOpacity: 0.95,
      }).addTo(map);

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
        <div class="k">Mile marker</div>
        <div class="v">{mile}</div>
        <div class="sub">Lat {lat.toFixed(4)} • Lon {lon.toFixed(4)}</div>
      </div>
      <div class="actions">
        <button class="btn" type="button" onclick={copyLink}>Copy link</button>
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
    <div class="map card">
      <div bind:this={container} class="map-inner" aria-label="Appalachian Trail map"></div>
    </div>

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
          <div class="now">
            <div class="big">
              <div class="temp">{fmt(wx.current.temperature_2m, 0)}°F</div>
              <div class="cond">{wxCodeLabel(wx.current.weather_code)}</div>
            </div>
            <div class="meta">
              <div><span class="mk">Feels</span> {fmt(wx.current.apparent_temperature, 0)}°</div>
              <div><span class="mk">Wind</span> {fmt(wx.current.wind_speed_10m, 0)} mph</div>
              <div><span class="mk">Gust</span> {fmt(wx.current.wind_gusts_10m, 0)} mph</div>
              <div><span class="mk">Now</span> {wx.current.time ?? '—'} {wx.timezone_abbreviation ? `(${wx.timezone_abbreviation})` : ''}</div>
            </div>
          </div>

          <div class="hr"></div>

          <p class="p small">
            Ranger note: treat mountain forecasts like suggestions. If clouds drop and wind picks up, slow down early.
          </p>
        {:else}
          <p class="p">No weather available for this point.</p>
        {/if}
      {/if}
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

  .actions {
    display: flex;
    gap: 8px;
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
    gap: 14px;
  }

  @media (max-width: 980px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  .map {
    padding: 0;
    overflow: hidden;
  }

  .map-inner {
    width: 100%;
    height: 62vh;
    min-height: 420px;
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
</style>
