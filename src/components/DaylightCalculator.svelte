<script>
  import { onMount } from 'svelte';

  let mounted = false;
  onMount(() => { mounted = true; });

  // Trail latitude data (Georgia 34.6°N to Maine 45.9°N)
  function getLatitude(mile) {
    const startLat = 34.6;
    const endLat = 45.9;
    const totalMiles = 2198;
    return startLat + (mile / totalMiles) * (endLat - startLat);
  }

  // Trail regions by mile marker
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

  // Solar position calculation
  function calculateSunTimes(date, latitude) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const declination = 23.45 * Math.sin((360/365) * (dayOfYear - 81) * Math.PI / 180);
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

    // Handle polar day/night (shouldn't happen on AT but safety check)
    if (cosHourAngle < -1) return { sunrise: null, sunset: null, daylight: 24, polar: 'day' };
    if (cosHourAngle > 1) return { sunrise: null, sunset: null, daylight: 0, polar: 'night' };

    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    const sunriseHour = 12 - hourAngle / 15;
    const sunsetHour = 12 + hourAngle / 15;
    const daylight = sunsetHour - sunriseHour;

    return { sunrise: sunriseHour, sunset: sunsetHour, daylight, polar: null };
  }

  // Format decimal hours to readable time
  function formatTime(decimalHours) {
    if (decimalHours === null) return '--:--';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Format duration
  function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  // State
  let selectedDate = new Date().toISOString().split('T')[0];
  let mileMarker = 500;

  // Computed values
  $: dateObj = new Date(selectedDate + 'T12:00:00');
  $: latitude = getLatitude(mileMarker);
  $: locationName = getLocationName(mileMarker);
  $: sunTimes = calculateSunTimes(dateObj, latitude);

  // Hiking window (30 min buffer each end)
  $: hikingStart = sunTimes.sunrise !== null ? sunTimes.sunrise + 0.5 : null;
  $: hikingEnd = sunTimes.sunset !== null ? sunTimes.sunset - 0.5 : null;
  $: hikingHours = hikingStart !== null && hikingEnd !== null ? hikingEnd - hikingStart : 0;

  // Season info
  $: season = (() => {
    const month = dateObj.getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', icon: '🌸', color: '#a6b589' };
    if (month >= 5 && month <= 7) return { name: 'Summer', icon: '☀️', color: '#d97706' };
    if (month >= 8 && month <= 10) return { name: 'Fall', icon: '🍂', color: '#c45d2c' };
    return { name: 'Winter', icon: '❄️', color: '#6b8cae' };
  })();

  // Day quality assessment
  $: dayQuality = (() => {
    if (sunTimes.daylight >= 14) return { label: 'Long summer day', class: 'excellent', icon: '☀️', tip: 'Plenty of time for big miles or leisurely breaks' };
    if (sunTimes.daylight >= 12) return { label: 'Good daylight', class: 'good', icon: '🌤️', tip: 'Solid hiking window for normal pace' };
    if (sunTimes.daylight >= 10) return { label: 'Moderate daylight', class: 'moderate', icon: '⛅', tip: 'Plan ahead and start early' };
    return { label: 'Short winter day', class: 'short', icon: '🌥️', tip: 'Start at first light, plan shorter miles' };
  })();

  // Format display date
  $: displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Daylight bar percentage (for visualization)
  $: sunrisePercent = sunTimes.sunrise !== null ? ((sunTimes.sunrise / 24) * 100) : 25;
  $: sunsetPercent = sunTimes.sunset !== null ? ((sunTimes.sunset / 24) * 100) : 75;
  $: daylightPercent = sunsetPercent - sunrisePercent;
</script>

<div class="daylight-calc" class:mounted>
  <!-- Header -->
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">{season.icon} {season.name.toUpperCase()} DAYLIGHT</span>
      <h2 class="header-title">Daylight Calculator</h2>
      <p class="header-sub">Plan your hiking day from sunrise to sunset</p>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">📅</span>
        <span class="label-text">Date</span>
      </label>
      <input
        type="date"
        bind:value={selectedDate}
        class="date-input"
      />
      <span class="date-display">{displayDate}</span>
    </div>

    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">📍</span>
        <span class="label-text">Trail Mile</span>
      </label>
      <div class="mile-control">
        <input
          type="range"
          min="0"
          max="2198"
          bind:value={mileMarker}
          class="mile-slider"
        />
        <div class="mile-labels">
          <span>GA</span>
          <span>VA</span>
          <span>PA</span>
          <span>ME</span>
        </div>
      </div>
      <div class="mile-display">
        <span class="mile-num">{mileMarker}</span>
        <span class="mile-region">{locationName}</span>
      </div>
    </div>
  </div>

  <!-- Summary Bar -->
  <div class="summary-bar">
    <div class="stat sunrise">
      <span class="stat-icon">🌅</span>
      <div class="stat-content">
        <span class="stat-value">{formatTime(sunTimes.sunrise)}</span>
        <span class="stat-label">sunrise</span>
      </div>
    </div>
    <div class="stat primary">
      <span class="stat-big">{formatDuration(sunTimes.daylight)}</span>
      <span class="stat-label">total daylight</span>
      <span class="quality-badge {dayQuality.class}">{dayQuality.icon} {dayQuality.label}</span>
    </div>
    <div class="stat sunset">
      <span class="stat-icon">🌇</span>
      <div class="stat-content">
        <span class="stat-value">{formatTime(sunTimes.sunset)}</span>
        <span class="stat-label">sunset</span>
      </div>
    </div>
  </div>

  <!-- Daylight Visualization -->
  <div class="daylight-visual">
    <div class="day-bar">
      <div class="night-left" style="width: {sunrisePercent}%"></div>
      <div class="daylight-span" style="width: {daylightPercent}%">
        <span class="sun-marker rise">☀️</span>
        <span class="daylight-label">{Math.round(sunTimes.daylight)}h daylight</span>
        <span class="sun-marker set">🌙</span>
      </div>
      <div class="night-right" style="width: {100 - sunsetPercent}%"></div>
    </div>
    <div class="hour-labels">
      <span>12 AM</span>
      <span>6 AM</span>
      <span>12 PM</span>
      <span>6 PM</span>
      <span>12 AM</span>
    </div>
  </div>

  <!-- Hiking Window -->
  <div class="hiking-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Hiking Window</span>
    </h3>

    <div class="hiking-card">
      <div class="hiking-header">
        <span class="hiking-icon">🥾</span>
        <div class="hiking-info">
          <span class="hiking-times">{formatTime(hikingStart)} — {formatTime(hikingEnd)}</span>
          <span class="hiking-duration">{formatDuration(hikingHours)} of safe hiking time</span>
        </div>
      </div>
      <p class="hiking-note">
        Includes 30 minutes after sunrise for breaking camp and 30 minutes before sunset for setting up.
      </p>
    </div>
  </div>

  <!-- Location Details -->
  <div class="location-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Location Details</span>
    </h3>

    <div class="location-grid">
      <div class="loc-card">
        <span class="loc-icon">🧭</span>
        <div class="loc-info">
          <span class="loc-label">Latitude</span>
          <span class="loc-value">{latitude.toFixed(1)}°N</span>
        </div>
      </div>
      <div class="loc-card">
        <span class="loc-icon">📍</span>
        <div class="loc-info">
          <span class="loc-label">Region</span>
          <span class="loc-value">{locationName}</span>
        </div>
      </div>
      <div class="loc-card">
        <span class="loc-icon">🛤️</span>
        <div class="loc-info">
          <span class="loc-label">Mile Marker</span>
          <span class="loc-value">{mileMarker} / 2198</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Planning Tips -->
  <div class="tips-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Planning Tips</span>
    </h3>

    <div class="tips-list">
      <!-- Dynamic tip based on day quality -->
      <div class="tip {dayQuality.class}">
        <span class="tip-icon">{dayQuality.icon}</span>
        <div class="tip-content">
          <strong>{dayQuality.label}:</strong> {dayQuality.tip}
        </div>
      </div>

      {#if dayQuality.class === 'short'}
        <div class="tip warning">
          <span class="tip-icon">⚠️</span>
          <div class="tip-content">
            <strong>Short day alert!</strong> Keep headlamp accessible, plan bail-out options.
          </div>
        </div>
      {/if}

      <div class="tip">
        <span class="tip-icon">🏔️</span>
        <div class="tip-content">
          Mountain terrain can delay sunrise and advance sunset by 15-30 minutes.
        </div>
      </div>

      <div class="tip">
        <span class="tip-icon">💡</span>
        <div class="tip-content">
          Northern latitudes have longer summer days but much shorter winter days than Georgia.
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

  .daylight-calc.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    position: relative;
    padding: 2.5rem 2rem 2rem;
    background: linear-gradient(135deg, var(--pine, #4d594a) 0%, #3a4238 100%);
    color: #fff;
    overflow: hidden;
  }

  .header-topo {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px),
      repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px);
  }

  .header-content {
    position: relative;
  }

  .header-badge {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    padding: 0.25rem 0.6rem;
    border-radius: 3px;
    margin-bottom: 0.75rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    letter-spacing: -0.01em;
  }

  .header-sub {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }

  /* Controls */
  .controls {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .controls {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1.25rem 1rem;
    }
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label-icon {
    font-size: 1rem;
  }

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

  .date-input:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
  }

  .date-display {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .mile-control {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mile-slider {
    width: 100%;
    height: 10px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(90deg,
      var(--alpine, #a6b589) 0%,
      var(--pine, #4d594a) 50%,
      var(--terra, #d97706) 100%
    );
    border-radius: 5px;
    cursor: pointer;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .mile-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
  }

  .mile-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .mile-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 2px;
  }

  .mile-display {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 0.25rem;
  }

  .mile-num {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }

  .mile-num::after {
    content: ' mi';
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--muted, #5c665a);
  }

  .mile-region {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--terra, #d97706);
  }

  /* Summary Bar */
  .summary-bar {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 1.5rem;
    padding: 1.25rem 2rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .summary-bar {
      gap: 0.75rem;
      padding: 1rem;
      flex-wrap: wrap;
    }
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted, #5c665a);
  }

  .stat.primary {
    flex-direction: column;
    align-items: center;
    padding: 0 1.5rem;
    border-left: 2px solid var(--border, #e6e1d4);
    border-right: 2px solid var(--border, #e6e1d4);
  }

  .stat-big {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    line-height: 1;
  }

  .quality-badge {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.6rem;
    border-radius: 10px;
    margin-top: 0.35rem;
  }

  .quality-badge.excellent {
    background: rgba(34, 197, 94, 0.15);
    color: #16a34a;
  }

  .quality-badge.good {
    background: rgba(166, 181, 137, 0.2);
    color: var(--pine, #4d594a);
  }

  .quality-badge.moderate {
    background: rgba(217, 119, 6, 0.15);
    color: #b45309;
  }

  .quality-badge.short {
    background: rgba(107, 140, 174, 0.15);
    color: #4b6584;
  }

  /* Daylight Visualization */
  .daylight-visual {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .daylight-visual {
      padding: 1.25rem 1rem;
    }
  }

  .day-bar {
    display: flex;
    height: 40px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
  }

  .night-left, .night-right {
    background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    position: relative;
  }

  .night-left::before, .night-right::before {
    content: '✦';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.3);
    font-size: 0.6rem;
  }

  .night-left::before {
    right: 10px;
  }

  .night-right::before {
    left: 10px;
  }

  .daylight-span {
    background: linear-gradient(180deg, #87CEEB 0%, #fbbf24 60%, #f97316 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-width: 100px;
  }

  .sun-marker {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.25rem;
    text-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .sun-marker.rise {
    left: 8px;
  }

  .sun-marker.set {
    right: 8px;
  }

  .daylight-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hour-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.6rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  /* Hiking Section */
  .hiking-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .hiking-section {
      padding: 1.25rem 1rem;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--pine, #4d594a);
    margin: 0 0 1.25rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  .hiking-card {
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    padding: 1.25rem;
    border-left: 4px solid var(--pine, #4d594a);
  }

  .hiking-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hiking-icon {
    font-size: 2rem;
  }

  .hiking-info {
    display: flex;
    flex-direction: column;
  }

  .hiking-times {
    font-family: Oswald, sans-serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    line-height: 1.2;
  }

  .hiking-duration {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
  }

  .hiking-note {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    margin: 1rem 0 0;
    padding-top: 1rem;
    border-top: 1px dashed var(--border, #e6e1d4);
    font-style: italic;
  }

  /* Location Section */
  .location-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .location-section {
      padding: 1.25rem 1rem;
    }
  }

  .location-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 600px) {
    .location-grid {
      grid-template-columns: 1fr;
    }
  }

  .loc-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    border-left: 3px solid var(--alpine, #a6b589);
  }

  .loc-icon {
    font-size: 1.35rem;
  }

  .loc-info {
    display: flex;
    flex-direction: column;
  }

  .loc-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #5c665a);
  }

  .loc-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  /* Tips Section */
  .tips-section {
    padding: 1.5rem 2rem 2rem;
  }

  @media (max-width: 600px) {
    .tips-section {
      padding: 1.25rem 1rem 1.5rem;
    }
  }

  .tips-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .tip {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: rgba(166, 181, 137, 0.1);
    border-radius: 8px;
    border-left: 3px solid var(--alpine, #a6b589);
  }

  .tip.excellent {
    background: rgba(34, 197, 94, 0.08);
    border-left-color: #22c55e;
  }

  .tip.good {
    background: rgba(166, 181, 137, 0.1);
    border-left-color: var(--alpine, #a6b589);
  }

  .tip.moderate {
    background: rgba(217, 119, 6, 0.08);
    border-left-color: var(--terra, #d97706);
  }

  .tip.short {
    background: rgba(107, 140, 174, 0.1);
    border-left-color: #6b8cae;
  }

  .tip.warning {
    background: rgba(220, 38, 38, 0.08);
    border-left-color: #dc2626;
  }

  .tip-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .tip-content {
    font-size: 0.8rem;
    color: var(--pine, #4d594a);
    line-height: 1.5;
  }

  .tip-content strong {
    font-weight: 600;
  }

  .tip.warning .tip-content {
    color: #991b1b;
  }
</style>
