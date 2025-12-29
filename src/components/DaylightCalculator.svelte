<script>
  import { onMount } from 'svelte';

  // Trail latitude data (approximate by mile marker)
  // Georgia starts ~34.6°N, Maine ends ~45.9°N
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

    // Solar declination
    const declination = 23.45 * Math.sin((360/365) * (dayOfYear - 81) * Math.PI / 180);

    // Hour angle at sunrise/sunset
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;

    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

    // Handle polar day/night
    if (cosHourAngle < -1) {
      return { sunrise: null, sunset: null, daylight: 24, polar: 'day' };
    }
    if (cosHourAngle > 1) {
      return { sunrise: null, sunset: null, daylight: 0, polar: 'night' };
    }

    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;

    // Convert to hours (solar noon is 12:00)
    const sunriseHour = 12 - hourAngle / 15;
    const sunsetHour = 12 + hourAngle / 15;

    // Adjust for timezone (approximate - AT is mostly Eastern time)
    // Add ~4 minutes per degree of longitude difference from time zone center (75°W for Eastern)
    // This is simplified - real calculation would need longitude
    const tzOffset = 0; // Keep it simple for now

    const sunrise = sunriseHour + tzOffset;
    const sunset = sunsetHour + tzOffset;
    const daylight = sunset - sunrise;

    return {
      sunrise,
      sunset,
      daylight,
      polar: null
    };
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
    if (month >= 2 && month <= 4) return { name: 'Spring', icon: '🌸', color: '#a6b589' };
    if (month >= 5 && month <= 7) return { name: 'Summer', icon: '☀️', color: '#d97706' };
    if (month >= 8 && month <= 10) return { name: 'Fall', icon: '🍂', color: '#c45d2c' };
    return { name: 'Winter', icon: '❄️', color: '#6b8cae' };
  })();

  // Day length context
  $: dayContext = (() => {
    if (sunTimes.daylight >= 14) return { label: 'Long summer day', quality: 'excellent' };
    if (sunTimes.daylight >= 12) return { label: 'Good daylight', quality: 'good' };
    if (sunTimes.daylight >= 10) return { label: 'Moderate daylight', quality: 'moderate' };
    return { label: 'Short winter day', quality: 'short' };
  })();

  // SVG arc calculations
  $: arcData = (() => {
    const centerX = 150;
    const centerY = 120;
    const radius = 100;

    // Convert times to angles (6am = -90°, 12pm = 0°, 6pm = 90°)
    const sunriseAngle = sunTimes.sunrise !== null
      ? ((sunTimes.sunrise - 12) / 12) * 180
      : -90;
    const sunsetAngle = sunTimes.sunset !== null
      ? ((sunTimes.sunset - 12) / 12) * 180
      : 90;

    // Current time position (for visual interest, show noon)
    const noonAngle = 0;

    // Arc path
    const startX = centerX + radius * Math.cos((sunriseAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((sunriseAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((sunsetAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((sunsetAngle - 90) * Math.PI / 180);

    // Sun position at noon
    const sunX = centerX + radius * Math.cos((noonAngle - 90) * Math.PI / 180);
    const sunY = centerY + radius * Math.sin((noonAngle - 90) * Math.PI / 180);

    return {
      centerX,
      centerY,
      radius,
      startX,
      startY,
      endX,
      endY,
      sunX,
      sunY,
      sunriseAngle,
      sunsetAngle,
    };
  })();
</script>

<div class="daylight-calc">
  <!-- Header -->
  <div class="calc-header">
    <div class="header-icon">🌅</div>
    <div class="header-text">
      <h3>Daylight Calculator</h3>
      <p>Plan your hiking day with sunrise & sunset times</p>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">📅</span>
        <span>Date</span>
      </label>
      <input
        type="date"
        bind:value={selectedDate}
        class="date-input"
      />
    </div>

    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">📍</span>
        <span>Trail Mile</span>
      </label>
      <div class="mile-control">
        <input
          type="range"
          min="0"
          max="2198"
          bind:value={mileMarker}
          class="mile-slider"
        />
        <div class="mile-info">
          <span class="mile-value">{mileMarker}</span>
          <span class="mile-location">{locationName}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Sun Arc Visualization -->
  <div class="sun-visual">
    <svg viewBox="0 0 300 140" class="sun-arc-svg">
      <!-- Horizon line -->
      <line x1="20" y1="120" x2="280" y2="120" stroke="var(--border, #e6e1d4)" stroke-width="2"/>

      <!-- Hour markers -->
      <text x="20" y="135" class="hour-label">6 AM</text>
      <text x="150" y="135" class="hour-label" text-anchor="middle">NOON</text>
      <text x="280" y="135" class="hour-label" text-anchor="end">6 PM</text>

      <!-- Night arc (background) -->
      <path
        d="M 20 120 A 100 100 0 0 1 280 120"
        fill="none"
        stroke="var(--stone, #d4d0c4)"
        stroke-width="8"
        stroke-linecap="round"
        opacity="0.3"
      />

      <!-- Daylight arc -->
      <path
        d="M {arcData.startX} {arcData.startY} A {arcData.radius} {arcData.radius} 0 0 1 {arcData.endX} {arcData.endY}"
        fill="none"
        stroke="url(#sunGradient)"
        stroke-width="8"
        stroke-linecap="round"
      />

      <!-- Gradient definition -->
      <defs>
        <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="50%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
      </defs>

      <!-- Sun at noon -->
      <circle
        cx={arcData.sunX}
        cy={arcData.sunY}
        r="12"
        fill="#fbbf24"
        stroke="#f59e0b"
        stroke-width="2"
      />
      <circle
        cx={arcData.sunX}
        cy={arcData.sunY}
        r="16"
        fill="none"
        stroke="#fbbf24"
        stroke-width="1"
        opacity="0.5"
      />

      <!-- Sunrise marker -->
      <circle cx={arcData.startX} cy={arcData.startY} r="4" fill="var(--terra, #d97706)"/>

      <!-- Sunset marker -->
      <circle cx={arcData.endX} cy={arcData.endY} r="4" fill="var(--terra, #d97706)"/>
    </svg>
  </div>

  <!-- Stats Grid -->
  <div class="stats-grid">
    <div class="stat-card sunrise">
      <span class="stat-icon">🌅</span>
      <span class="stat-label">Sunrise</span>
      <span class="stat-value">{formatTime(sunTimes.sunrise)}</span>
    </div>

    <div class="stat-card sunset">
      <span class="stat-icon">🌇</span>
      <span class="stat-label">Sunset</span>
      <span class="stat-value">{formatTime(sunTimes.sunset)}</span>
    </div>

    <div class="stat-card daylight">
      <span class="stat-icon">☀️</span>
      <span class="stat-label">Total Daylight</span>
      <span class="stat-value">{formatDuration(sunTimes.daylight)}</span>
    </div>

    <div class="stat-card hiking">
      <span class="stat-icon">🥾</span>
      <span class="stat-label">Hiking Window</span>
      <span class="stat-value">{formatDuration(hikingHours)}</span>
      <span class="stat-note">{formatTime(hikingStart)} – {formatTime(hikingEnd)}</span>
    </div>
  </div>

  <!-- Context Badge -->
  <div class="context-section">
    <div class="context-badge" style="background: {season.color}15; border-color: {season.color}40">
      <span class="badge-icon">{season.icon}</span>
      <span class="badge-text">{season.name}</span>
    </div>
    <div class="context-badge quality-{dayContext.quality}">
      <span class="badge-text">{dayContext.label}</span>
    </div>
    <div class="context-badge location">
      <span class="badge-icon">📍</span>
      <span class="badge-text">{latitude.toFixed(1)}°N</span>
    </div>
  </div>

  <!-- Pro Tips -->
  <div class="tips-section">
    <div class="tip">
      <span class="tip-icon">💡</span>
      <span class="tip-text">
        <strong>Hiking Window</strong> accounts for 30 min after sunrise (breaking camp) and 30 min before sunset (setting up camp).
      </span>
    </div>
    {#if dayContext.quality === 'short'}
      <div class="tip warning">
        <span class="tip-icon">⚠️</span>
        <span class="tip-text">
          <strong>Short day alert!</strong> Plan for earlier camp arrival and bring a headlamp ready.
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  .daylight-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  /* Header */
  .calc-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-text h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
    margin: 0;
  }

  .header-text p {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    margin: 0.15rem 0 0;
  }

  /* Controls */
  .controls {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.06), transparent);
  }

  @media (max-width: 600px) {
    .controls {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1rem;
    }
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine, #4d594a);
  }

  .label-icon {
    font-size: 0.9rem;
  }

  .date-input {
    padding: 0.65rem 0.85rem;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    background: #fff;
    color: var(--ink, #2b2f26);
    transition: border-color 0.15s ease;
  }

  .date-input:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
  }

  .mile-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .mile-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--pine, #4d594a));
    border-radius: 4px;
    cursor: pointer;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  .mile-info {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .mile-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  .mile-value::after {
    content: ' mi';
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--muted, #5c665a);
  }

  .mile-location {
    font-size: 0.85rem;
    color: var(--terra, #d97706);
    font-weight: 500;
  }

  /* Sun Arc */
  .sun-visual {
    padding: 1rem 1.5rem 0.5rem;
  }

  .sun-arc-svg {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: block;
  }

  .sun-arc-svg .hour-label {
    font-family: Oswald, sans-serif;
    font-size: 10px;
    fill: var(--muted, #5c665a);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    padding: 1rem 1.5rem;
  }

  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      padding: 1rem;
    }
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem 0.5rem;
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
  }

  .stat-icon {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #5c665a);
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
  }

  .stat-note {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    margin-top: 0.15rem;
  }

  .stat-card.hiking {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15), rgba(166, 181, 137, 0.05));
  }

  .stat-card.hiking .stat-value {
    color: var(--pine, #4d594a);
  }

  /* Context Badges */
  .context-section {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1.5rem 1rem;
    flex-wrap: wrap;
  }

  .context-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.65rem;
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid rgba(166, 181, 137, 0.3);
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--pine, #4d594a);
  }

  .context-badge.quality-excellent {
    background: rgba(166, 181, 137, 0.2);
    border-color: var(--alpine, #a6b589);
    color: var(--pine, #4d594a);
  }

  .context-badge.quality-good {
    background: rgba(166, 181, 137, 0.15);
    color: var(--pine, #4d594a);
  }

  .context-badge.quality-moderate {
    background: rgba(217, 119, 6, 0.1);
    border-color: rgba(217, 119, 6, 0.3);
    color: var(--terra, #d97706);
  }

  .context-badge.quality-short {
    background: rgba(107, 140, 174, 0.15);
    border-color: rgba(107, 140, 174, 0.3);
    color: #4a6b8a;
  }

  .context-badge.location {
    background: rgba(43, 47, 38, 0.08);
    border-color: rgba(43, 47, 38, 0.15);
  }

  .badge-icon {
    font-size: 0.85rem;
  }

  /* Tips */
  .tips-section {
    padding: 0 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tip {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(166, 181, 137, 0.08);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--pine, #4d594a);
    line-height: 1.4;
  }

  .tip.warning {
    background: rgba(217, 119, 6, 0.1);
    color: var(--terra, #d97706);
  }

  .tip-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .tip-text strong {
    font-weight: 600;
  }
</style>
