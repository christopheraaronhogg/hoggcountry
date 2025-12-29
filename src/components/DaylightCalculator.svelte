<script>
  import { onMount } from 'svelte';

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

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
    const tzOffset = 0;

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
    if (sunTimes.daylight >= 14) return { label: 'Long summer day', quality: 'excellent', icon: '☀️' };
    if (sunTimes.daylight >= 12) return { label: 'Good daylight', quality: 'good', icon: '🌤️' };
    if (sunTimes.daylight >= 10) return { label: 'Moderate daylight', quality: 'moderate', icon: '⛅' };
    return { label: 'Short winter day', quality: 'short', icon: '🌥️' };
  })();

  // Format date for display
  $: displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate SVG arc data
  $: arcData = (() => {
    const width = 320;
    const height = 160;
    const centerX = width / 2;
    const centerY = height - 20;
    const radius = 120;

    // Map time to angle: 4am = -90°, 12pm = 0°, 8pm = 90°
    const timeToAngle = (time) => ((time - 12) / 8) * 90;

    const sunriseAngle = timeToAngle(sunTimes.sunrise || 6);
    const sunsetAngle = timeToAngle(sunTimes.sunset || 18);

    // Convert angle to SVG coordinates
    const angleToPoint = (angle, r = radius) => {
      const rad = (angle - 90) * Math.PI / 180;
      return {
        x: centerX + r * Math.cos(rad),
        y: centerY + r * Math.sin(rad)
      };
    };

    const sunrisePoint = angleToPoint(sunriseAngle);
    const sunsetPoint = angleToPoint(sunsetAngle);
    const noonPoint = angleToPoint(0);

    // Create arc path
    const largeArc = (sunsetAngle - sunriseAngle) > 180 ? 1 : 0;

    return {
      width,
      height,
      centerX,
      centerY,
      radius,
      sunrise: sunrisePoint,
      sunset: sunsetPoint,
      noon: noonPoint,
      arcPath: `M ${sunrisePoint.x} ${sunrisePoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${sunsetPoint.x} ${sunsetPoint.y}`,
      horizonY: centerY,
    };
  })();
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
      <label class="control-label">
        <span class="label-icon">📅</span>
        <span>Date</span>
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
        <span>Trail Mile</span>
      </label>
      <div class="mile-slider-wrapper">
        <input
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

  <!-- Sun Arc Visualization -->
  <div class="sun-visual">
    <svg viewBox="0 0 {arcData.width} {arcData.height}" class="sun-arc-svg">
      <!-- Gradient definitions -->
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#87CEEB" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#87CEEB" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="sunArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f97316"/>
          <stop offset="50%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#f97316"/>
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="70%" stop-color="#fbbf24" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Sky background arc -->
      <path
        d="M 40 {arcData.horizonY} A 120 120 0 0 1 280 {arcData.horizonY}"
        fill="url(#skyGradient)"
      />

      <!-- Horizon line -->
      <line
        x1="20" y1={arcData.horizonY}
        x2="300" y2={arcData.horizonY}
        stroke="var(--pine, #4d594a)"
        stroke-width="2"
        stroke-linecap="round"
      />

      <!-- Night portion of arc (background) -->
      <path
        d="M 40 {arcData.horizonY} A 120 120 0 0 1 280 {arcData.horizonY}"
        fill="none"
        stroke="var(--stone, #d4d0c4)"
        stroke-width="6"
        stroke-linecap="round"
        opacity="0.4"
      />

      <!-- Daylight arc -->
      <path
        d={arcData.arcPath}
        fill="none"
        stroke="url(#sunArcGradient)"
        stroke-width="6"
        stroke-linecap="round"
      />

      <!-- Hour markers on horizon -->
      <text x="40" y={arcData.horizonY + 16} class="hour-text">4 AM</text>
      <text x="100" y={arcData.horizonY + 16} class="hour-text">8 AM</text>
      <text x="160" y={arcData.horizonY + 16} class="hour-text" text-anchor="middle">NOON</text>
      <text x="220" y={arcData.horizonY + 16} class="hour-text">4 PM</text>
      <text x="280" y={arcData.horizonY + 16} class="hour-text" text-anchor="end">8 PM</text>

      <!-- Sunrise marker -->
      <circle
        cx={arcData.sunrise.x}
        cy={arcData.sunrise.y}
        r="8"
        fill="#f97316"
        stroke="#fff"
        stroke-width="2"
      />
      <text
        x={arcData.sunrise.x}
        y={arcData.sunrise.y - 14}
        class="time-label"
        text-anchor="middle"
      >
        {formatTime(sunTimes.sunrise)}
      </text>

      <!-- Sun at noon -->
      <circle
        cx={arcData.noon.x}
        cy={arcData.noon.y}
        r="24"
        fill="url(#sunGlow)"
      />
      <circle
        cx={arcData.noon.x}
        cy={arcData.noon.y}
        r="14"
        fill="#fbbf24"
        stroke="#f97316"
        stroke-width="2"
      />

      <!-- Sunset marker -->
      <circle
        cx={arcData.sunset.x}
        cy={arcData.sunset.y}
        r="8"
        fill="#f97316"
        stroke="#fff"
        stroke-width="2"
      />
      <text
        x={arcData.sunset.x}
        y={arcData.sunset.y - 14}
        class="time-label"
        text-anchor="middle"
      >
        {formatTime(sunTimes.sunset)}
      </text>

      <!-- Labels for sunrise/sunset -->
      <text x={arcData.sunrise.x} y={arcData.horizonY - 4} class="marker-label" text-anchor="middle">RISE</text>
      <text x={arcData.sunset.x} y={arcData.horizonY - 4} class="marker-label" text-anchor="middle">SET</text>
    </svg>
  </div>

  <!-- Stats Section -->
  <div class="stats-section">
    <div class="stat-primary">
      <div class="stat-ring" style="--progress: {(sunTimes.daylight / 24) * 100}%; --color: {dayContext.quality === 'excellent' ? '#22c55e' : dayContext.quality === 'good' ? '#a6b589' : dayContext.quality === 'moderate' ? '#d97706' : '#6b8cae'}">
        <div class="ring-inner">
          <span class="stat-icon">{dayContext.icon}</span>
          <span class="stat-big">{formatDuration(sunTimes.daylight)}</span>
          <span class="stat-small">daylight</span>
        </div>
      </div>
      <span class="stat-context" style="color: {dayContext.quality === 'excellent' ? '#22c55e' : dayContext.quality === 'good' ? '#4d594a' : dayContext.quality === 'moderate' ? '#d97706' : '#6b8cae'}">{dayContext.label}</span>
    </div>

    <div class="stat-grid">
      <div class="stat-card sunrise">
        <span class="card-icon">🌅</span>
        <div class="card-content">
          <span class="card-label">Sunrise</span>
          <span class="card-value">{formatTime(sunTimes.sunrise)}</span>
        </div>
      </div>

      <div class="stat-card sunset">
        <span class="card-icon">🌇</span>
        <div class="card-content">
          <span class="card-label">Sunset</span>
          <span class="card-value">{formatTime(sunTimes.sunset)}</span>
        </div>
      </div>

      <div class="stat-card hiking">
        <span class="card-icon">🥾</span>
        <div class="card-content">
          <span class="card-label">Hiking Window</span>
          <span class="card-value">{formatDuration(hikingHours)}</span>
          <span class="card-sub">{formatTime(hikingStart)} – {formatTime(hikingEnd)}</span>
        </div>
      </div>

      <div class="stat-card location">
        <span class="card-icon">🧭</span>
        <div class="card-content">
          <span class="card-label">Latitude</span>
          <span class="card-value">{latitude.toFixed(1)}°N</span>
          <span class="card-sub">{locationName}</span>
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

    <div class="tips-grid">
      <div class="tip">
        <span class="tip-icon">💡</span>
        <div class="tip-content">
          <strong>Hiking Window</strong> allows 30 min after sunrise for breaking camp and 30 min before sunset for setting up.
        </div>
      </div>

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
    padding: 2rem 1.5rem 1.5rem;
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
    letter-spacing: 0.15em;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    padding: 0.25rem 0.6rem;
    border-radius: 3px;
    margin-bottom: 0.75rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    letter-spacing: -0.01em;
  }

  .header-sub {
    font-size: 0.85rem;
    opacity: 0.8;
    margin: 0;
  }

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
    .controls {
      grid-template-columns: 1fr;
      gap: 1.25rem;
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

  .mile-slider-wrapper {
    position: relative;
  }

  .mile-slider {
    width: 100%;
    height: 10px;
    -webkit-appearance: none;
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

  /* Sun Visual */
  .sun-visual {
    padding: 1rem 1.5rem;
    background: linear-gradient(to bottom, rgba(135, 206, 235, 0.05), transparent);
  }

  .sun-arc-svg {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: block;
  }

  .sun-arc-svg .hour-text {
    font-family: Oswald, sans-serif;
    font-size: 9px;
    fill: var(--muted, #5c665a);
    letter-spacing: 0.02em;
  }

  .sun-arc-svg .time-label {
    font-family: Oswald, sans-serif;
    font-size: 11px;
    font-weight: 600;
    fill: var(--pine, #4d594a);
  }

  .sun-arc-svg .marker-label {
    font-family: Oswald, sans-serif;
    font-size: 8px;
    font-weight: 600;
    fill: var(--muted, #5c665a);
    letter-spacing: 0.1em;
  }

  /* Stats Section */
  .stats-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .stat-primary {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .stat-ring {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: conic-gradient(
      var(--color) 0% var(--progress),
      var(--stone, #d4d0c4) var(--progress) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }

  .ring-inner {
    width: 100%;
    height: 100%;
    background: var(--card, #fff);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .stat-icon {
    font-size: 1.5rem;
    margin-bottom: 0.15rem;
  }

  .stat-big {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink, #2b2f26);
    line-height: 1;
  }

  .stat-small {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-context {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 500px) {
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    border-left: 3px solid var(--alpine, #a6b589);
  }

  .stat-card.sunrise {
    border-left-color: #f97316;
  }

  .stat-card.sunset {
    border-left-color: #f97316;
  }

  .stat-card.hiking {
    border-left-color: var(--pine, #4d594a);
  }

  .stat-card.location {
    border-left-color: var(--terra, #d97706);
  }

  .card-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .card-label {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
    line-height: 1.2;
  }

  .card-sub {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  /* Tips Section */
  .tips-section {
    padding: 1.25rem 1.5rem 1.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pine, #4d594a);
    margin: 0 0 1rem;
  }

  .title-blaze {
    width: 6px;
    height: 14px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  .tips-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

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

  .tip-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
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
    color: #92400e;
  }

  .tip.success .tip-content {
    color: #166534;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .calc-header {
      padding: 1.5rem 1rem 1.25rem;
    }

    .header-title {
      font-size: 1.35rem;
    }

    .stats-section,
    .tips-section {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .sun-visual {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }
</style>
