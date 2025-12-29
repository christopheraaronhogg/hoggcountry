<script>
  import { onMount } from 'svelte';

  let mounted = false;
  onMount(() => { mounted = true; });

  // Trail latitude data (approximate by mile marker)
  function getLatitude(mile) {
    const startLat = 34.6;
    const endLat = 45.9;
    const totalMiles = 2198;
    return startLat + (mile / totalMiles) * (endLat - startLat);
  }

  // Get location name by mile
  function getLocationName(mile) {
    if (mile < 79) return 'Georgia';
    if (mile < 166) return 'Southern NC';
    if (mile < 241) return 'Great Smokies';
    if (mile < 386) return 'NC/TN Border';
    if (mile < 550) return 'Southern VA';
    if (mile < 785) return 'Central VA';
    if (mile < 863) return 'Shenandoah';
    if (mile < 1025) return 'Northern VA';
    if (mile < 1290) return 'Mid-Atlantic';
    if (mile < 1525) return 'NY/NJ';
    if (mile < 1630) return 'CT/MA';
    if (mile < 1791) return 'Vermont';
    if (mile < 1912) return 'White Mountains';
    return 'Maine';
  }

  // Calculate sunrise/sunset using simplified solar position algorithm
  function calculateSunTimes(date, latitude) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const declination = 23.45 * Math.sin((360/365) * (dayOfYear - 81) * Math.PI / 180);
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

    if (cosHourAngle < -1) return { sunrise: null, sunset: null, daylight: 24, polar: 'day' };
    if (cosHourAngle > 1) return { sunrise: null, sunset: null, daylight: 0, polar: 'night' };

    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    const sunriseHour = 12 - hourAngle / 15;
    const sunsetHour = 12 + hourAngle / 15;
    const daylight = sunsetHour - sunriseHour;

    return { sunrise: sunriseHour, sunset: sunsetHour, daylight, polar: null };
  }

  // Format decimal hours to HH:MM
  function formatTime(decimalHours) {
    if (decimalHours === null) return '--:--';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Format hours and minutes
  function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  // State
  let selectedDate = new Date().toISOString().split('T')[0];
  let mileMarker = 500;

  // Computed
  $: dateObj = new Date(selectedDate + 'T12:00:00');
  $: latitude = getLatitude(mileMarker);
  $: locationName = getLocationName(mileMarker);
  $: sunTimes = calculateSunTimes(dateObj, latitude);

  // Hiking hours (30 min after sunrise to 30 min before sunset)
  $: hikingStart = sunTimes.sunrise !== null ? sunTimes.sunrise + 0.5 : null;
  $: hikingEnd = sunTimes.sunset !== null ? sunTimes.sunset - 0.5 : null;
  $: hikingHours = hikingStart !== null && hikingEnd !== null ? hikingEnd - hikingStart : 0;

  // Season context
  $: season = (() => {
    const month = dateObj.getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', icon: '🌸' };
    if (month >= 5 && month <= 7) return { name: 'Summer', icon: '☀️' };
    if (month >= 8 && month <= 10) return { name: 'Fall', icon: '🍂' };
    return { name: 'Winter', icon: '❄️' };
  })();

  // Day length context
  $: dayContext = (() => {
    if (sunTimes.daylight >= 14) return { label: 'Long summer day', quality: 'excellent' };
    if (sunTimes.daylight >= 12) return { label: 'Good daylight', quality: 'good' };
    if (sunTimes.daylight >= 10) return { label: 'Moderate daylight', quality: 'moderate' };
    return { label: 'Short winter day', quality: 'short' };
  })();

  // Format date for display
  $: displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Daylight percentage of 24h
  $: daylightPct = Math.round((sunTimes.daylight / 24) * 100);
</script>

<div class="daylight-calc" class:mounted>
  <!-- Header -->
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">{season.icon} {season.name.toUpperCase()}</span>
      <h2 class="header-title">Daylight Calculator</h2>
      <p class="header-sub">Plan your hiking day with sunrise & sunset times</p>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="control-label" for="date-input">
        <span class="label-icon">📅</span>
        <span>Date</span>
      </label>
      <input
        id="date-input"
        type="date"
        bind:value={selectedDate}
        class="date-input"
      />
      <span class="date-display">{displayDate}</span>
    </div>

    <div class="control-group">
      <label class="control-label" for="mile-slider">
        <span class="label-icon">📍</span>
        <span>Trail Mile</span>
      </label>
      <div class="mile-slider-wrapper">
        <input
          id="mile-slider"
          type="range"
          min="0"
          max="2198"
          bind:value={mileMarker}
          class="mile-slider"
        />
        <div class="mile-markers">
          <span>GA</span>
          <span>VA</span>
          <span>PA</span>
          <span>ME</span>
        </div>
      </div>
      <div class="mile-display">
        <span class="mile-value">{mileMarker}</span>
        <span class="mile-location">{locationName}</span>
      </div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="summary-bar">
    <div class="stat sunrise-stat">
      <span class="stat-icon">🌅</span>
      <span class="stat-value">{formatTime(sunTimes.sunrise)}</span>
      <span class="stat-label">Sunrise</span>
    </div>
    <div class="stat primary-stat">
      <span class="stat-big">{formatDuration(sunTimes.daylight)}</span>
      <span class="stat-label">Total Daylight</span>
      <span class="stat-context {dayContext.quality}">{dayContext.label}</span>
    </div>
    <div class="stat sunset-stat">
      <span class="stat-icon">🌇</span>
      <span class="stat-value">{formatTime(sunTimes.sunset)}</span>
      <span class="stat-label">Sunset</span>
    </div>
  </div>

  <!-- Daylight Bar Visualization -->
  <div class="daylight-visual">
    <div class="daylight-track">
      <div class="night-portion left"></div>
      <div class="daylight-portion" style="width: {daylightPct}%">
        <span class="day-label">{daylightPct}% daylight</span>
      </div>
      <div class="night-portion right"></div>
    </div>
    <div class="time-markers">
      <span>12 AM</span>
      <span>6 AM</span>
      <span>12 PM</span>
      <span>6 PM</span>
      <span>12 AM</span>
    </div>
  </div>

  <!-- Hiking Window Card -->
  <div class="hiking-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Hiking Window</span>
    </h3>

    <div class="hiking-card">
      <div class="hiking-main">
        <span class="hiking-icon">🥾</span>
        <div class="hiking-times">
          <span class="hiking-range">{formatTime(hikingStart)} — {formatTime(hikingEnd)}</span>
          <span class="hiking-duration">{formatDuration(hikingHours)} of safe hiking time</span>
        </div>
      </div>
      <p class="hiking-note">
        Allows 30 min after sunrise for breaking camp and 30 min before sunset for setup.
      </p>
    </div>
  </div>

  <!-- Location Info -->
  <div class="location-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Location Details</span>
    </h3>

    <div class="location-grid">
      <div class="location-card">
        <span class="loc-icon">🧭</span>
        <div class="loc-content">
          <span class="loc-label">Latitude</span>
          <span class="loc-value">{latitude.toFixed(1)}°N</span>
        </div>
      </div>
      <div class="location-card">
        <span class="loc-icon">📍</span>
        <div class="loc-content">
          <span class="loc-label">Region</span>
          <span class="loc-value">{locationName}</span>
        </div>
      </div>
      <div class="location-card">
        <span class="loc-icon">🛤️</span>
        <div class="loc-content">
          <span class="loc-label">Mile Marker</span>
          <span class="loc-value">{mileMarker} / 2198</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Tips Section -->
  <div class="tips-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Planning Tips</span>
    </h3>

    <div class="tips-list">
      {#if dayContext.quality === 'short'}
        <div class="tip warning">
          <span class="tip-icon">⚠️</span>
          <div class="tip-content">
            <strong>Short day alert!</strong> Plan shorter miles, start early, and keep your headlamp accessible.
          </div>
        </div>
      {:else if dayContext.quality === 'excellent'}
        <div class="tip success">
          <span class="tip-icon">✨</span>
          <div class="tip-content">
            <strong>Great hiking conditions!</strong> Long days mean more flexibility for high mileage or leisurely breaks.
          </div>
        </div>
      {/if}

      <div class="tip">
        <span class="tip-icon">🏔️</span>
        <div class="tip-content">
          Times are approximate. Mountain terrain can delay sunrise and advance sunset by 15-30 minutes.
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">💡</span>
        <div class="tip-content">
          Northern latitudes (Vermont, NH, Maine) have longer summer days but much shorter winter days than Georgia.
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .daylight-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .daylight-calc.mounted { opacity: 1; transform: translateY(0); }

  /* Header */
  .calc-header {
    position: relative;
    padding: 2rem 1.5rem 1.5rem;
    background: linear-gradient(135deg, var(--pine, #4d594a) 0%, #3a4238 100%);
    color: #fff;
  }
  .header-topo {
    position: absolute; inset: 0; opacity: 0.06;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.4) 18px, rgba(255,255,255,0.4) 19px),
      repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(255,255,255,0.3) 18px, rgba(255,255,255,0.3) 19px);
  }
  .header-content { position: relative; }
  .header-badge {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    padding: 0.25rem 0.6rem;
    border-radius: 3px;
    margin-bottom: 0.5rem;
  }
  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }
  .header-sub { font-size: 0.85rem; opacity: 0.8; margin: 0; }

  /* Controls */
  .controls {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }
  @media (max-width: 600px) {
    .controls { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }
  }

  .control-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .control-label {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.8rem; font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .label-icon { font-size: 1rem; }

  .date-input {
    padding: 0.75rem 1rem;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    background: #fff;
    color: var(--ink, #2b2f26);
    transition: border-color 0.15s ease;
  }
  .date-input:focus { outline: none; border-color: var(--alpine, #a6b589); }
  .date-display { font-size: 0.75rem; color: var(--muted, #5c665a); }

  .mile-slider-wrapper { position: relative; }
  .mile-slider {
    width: 100%;
    height: 10px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--pine, #4d594a), var(--terra, #d97706));
    border-radius: 5px;
    cursor: pointer;
  }
  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 24px; height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .mile-slider::-moz-range-thumb {
    width: 24px; height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
  }

  .mile-markers {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
    font-size: 0.6rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mile-display {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 0.25rem;
  }
  .mile-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }
  .mile-value::after {
    content: ' mi';
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--muted, #5c665a);
  }
  .mile-location {
    font-size: 0.9rem;
    color: var(--terra, #d97706);
    font-weight: 600;
  }

  /* Summary Bar */
  .summary-bar {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    background: var(--card, #fff);
    border-radius: 10px;
    border: 2px solid var(--border, #e6e1d4);
    min-width: 90px;
  }
  .stat-icon { font-size: 1.25rem; margin-bottom: 0.25rem; }
  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }
  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #5c665a);
    margin-top: 0.15rem;
  }

  .primary-stat {
    padding: 1rem 1.5rem;
    border-color: var(--alpine, #a6b589);
  }
  .stat-big {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    line-height: 1;
  }
  .stat-context {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    margin-top: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .stat-context.excellent { background: rgba(34,197,94,0.15); color: #16a34a; }
  .stat-context.good { background: rgba(166,181,137,0.2); color: #4d594a; }
  .stat-context.moderate { background: rgba(217,119,6,0.15); color: #b45309; }
  .stat-context.short { background: rgba(107,140,174,0.15); color: #4b6584; }

  @media (max-width: 600px) {
    .summary-bar { flex-wrap: wrap; gap: 0.75rem; }
    .stat { min-width: 80px; padding: 0.6rem 0.75rem; }
    .stat-big { font-size: 1.5rem; }
  }

  /* Daylight Visual */
  .daylight-visual {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }
  .daylight-track {
    position: relative;
    height: 32px;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    background: #1e293b;
  }
  .night-portion {
    background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
  }
  .night-portion.left { flex: 1; }
  .night-portion.right { flex: 1; }
  .daylight-portion {
    background: linear-gradient(180deg, #87CEEB 0%, #fbbf24 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    position: relative;
  }
  .day-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .time-markers {
    display: flex;
    justify-content: space-between;
    margin-top: 0.4rem;
    font-size: 0.6rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  /* Sections */
  .hiking-section, .location-section, .tips-section {
    padding: 1.25rem 1.5rem;
  }
  .hiking-section { border-bottom: 1px solid var(--border, #e6e1d4); }
  .location-section { border-bottom: 1px solid var(--border, #e6e1d4); }

  .section-title {
    display: flex; align-items: center; gap: 0.6rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--pine, #4d594a);
    margin: 0 0 1rem;
  }
  .title-blaze {
    width: 6px; height: 14px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  /* Hiking Card */
  .hiking-card {
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    border-left: 4px solid var(--pine, #4d594a);
  }
  .hiking-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .hiking-icon { font-size: 1.75rem; }
  .hiking-times { display: flex; flex-direction: column; }
  .hiking-range {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }
  .hiking-duration {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
  }
  .hiking-note {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
    margin: 0.75rem 0 0;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--border, #e6e1d4);
    font-style: italic;
  }

  /* Location Grid */
  .location-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  @media (max-width: 500px) {
    .location-grid { grid-template-columns: 1fr; }
  }
  .location-card {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.85rem 1rem;
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    border-left: 3px solid var(--alpine, #a6b589);
  }
  .loc-icon { font-size: 1.25rem; }
  .loc-content { display: flex; flex-direction: column; }
  .loc-label {
    font-size: 0.65rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .loc-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  /* Tips */
  .tips-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .tip {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.85rem 1rem;
    background: rgba(166, 181, 137, 0.08);
    border-radius: 8px;
    border-left: 3px solid var(--alpine, #a6b589);
  }
  .tip.warning {
    background: rgba(217, 119, 6, 0.08);
    border-left-color: var(--terra, #d97706);
  }
  .tip.success {
    background: rgba(34, 197, 94, 0.08);
    border-left-color: #22c55e;
  }
  .tip-icon { font-size: 1.1rem; flex-shrink: 0; }
  .tip-content {
    font-size: 0.8rem;
    color: var(--pine, #4d594a);
    line-height: 1.5;
  }
  .tip-content strong { font-weight: 600; }
  .tip.warning .tip-content { color: #92400e; }
  .tip.success .tip-content { color: #166534; }

  /* Mobile */
  @media (max-width: 600px) {
    .calc-header { padding: 1.5rem 1rem 1.25rem; }
    .header-title { font-size: 1.35rem; }
    .hiking-section, .location-section, .tips-section { padding: 1rem; }
  }
</style>
