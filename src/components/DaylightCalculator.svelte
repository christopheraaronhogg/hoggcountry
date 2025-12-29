<script>
  import { onMount } from 'svelte';

  // Trail sections with mile ranges
  const sections = [
    { name: 'Georgia', startMile: 0, endMile: 78.5, emoji: '🏔️' },
    { name: 'North Carolina', startMile: 78.5, endMile: 241, emoji: '🌲' },
    { name: 'Great Smokies', startMile: 165.7, endMile: 241, emoji: '⛰️' },
    { name: 'Tennessee', startMile: 241, endMile: 386, emoji: '🌾' },
    { name: 'Virginia', startMile: 386, endMile: 863, emoji: '🛤️' },
    { name: 'West Virginia', startMile: 863, endMile: 1025, emoji: '🎢' },
    { name: 'Maryland', startMile: 1025, endMile: 1065, emoji: '🦀' },
    { name: 'Pennsylvania', startMile: 1065, endMile: 1290, emoji: '🪨' },
    { name: 'New Jersey', startMile: 1290, endMile: 1360, emoji: '🌿' },
    { name: 'New York', startMile: 1360, endMile: 1440, emoji: '🗽' },
    { name: 'Connecticut', startMile: 1440, endMile: 1510, emoji: '🍂' },
    { name: 'Massachusetts', startMile: 1510, endMile: 1580, emoji: '🏛️' },
    { name: 'Vermont', startMile: 1580, endMile: 1750, emoji: '🌿' },
    { name: 'New Hampshire', startMile: 1750, endMile: 1912, emoji: '🏔️' },
    { name: 'Maine', startMile: 1912, endMile: 2198, emoji: '🎯' },
  ];

  // State
  let date = '2026-04-15';
  let mile = 500;
  let mounted = false;

  onMount(() => {
    mounted = true;
    const today = new Date();
    date = today.toISOString().split('T')[0];
  });

  // Latitude interpolation
  const GEORGIA_LAT = 34.6;
  const MAINE_LAT = 45.9;
  const TOTAL_MILES = 2198;

  $: latitude = GEORGIA_LAT + (mile / TOTAL_MILES) * (MAINE_LAT - GEORGIA_LAT);
  $: currentSection = sections.find(s => mile >= s.startMile && mile < s.endMile) || sections[sections.length - 1];

  // Solar calculations
  function calculateSunTimes(dateStr, lat) {
    const d = new Date(dateStr);
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
    const latRad = lat * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

    if (cosHourAngle > 1) return { sunrise: null, sunset: null, daylightHours: 0 };
    if (cosHourAngle < -1) return { sunrise: null, sunset: null, daylightHours: 24 };

    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    const daylightHours = 2 * hourAngle / 15;
    const solarNoon = 12; // Simplified
    const sunriseHours = solarNoon - (daylightHours / 2);
    const sunsetHours = solarNoon + (daylightHours / 2);

    return {
      sunrise: hoursToTime(sunriseHours),
      sunset: hoursToTime(sunsetHours),
      sunriseHours,
      sunsetHours,
      daylightHours
    };
  }

  function hoursToTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  function addMinutesToHours(hours, minutes) {
    return hours + minutes / 60;
  }

  $: sunTimes = calculateSunTimes(date, latitude);
  
  // Safe hiking window (sunrise+30m to sunset-30m)
  $: hikingStart = sunTimes.sunriseHours ? hoursToTime(addMinutesToHours(sunTimes.sunriseHours, 30)) : '--';
  $: hikingEnd = sunTimes.sunsetHours ? hoursToTime(addMinutesToHours(sunTimes.sunsetHours, -30)) : '--';
  $: hikingHours = sunTimes.daylightHours ? (sunTimes.daylightHours - 1).toFixed(1) : 0;

  // Day quality logic
  $: dayQuality = sunTimes.daylightHours >= 14 ? 'Long Summer Day'
    : sunTimes.daylightHours >= 12 ? 'Solid Hiking Day'
    : sunTimes.daylightHours >= 10 ? 'Short Day'
    : 'Winter Day';

  $: dayQualityColor = sunTimes.daylightHours >= 14 ? '#22c55e'
    : sunTimes.daylightHours >= 12 ? 'var(--alpine)'
    : sunTimes.daylightHours >= 10 ? 'var(--terra)'
    : '#6b8cae';

  // Visual percentages
  $: startPct = (sunTimes.sunriseHours / 24) * 100;
  $: endPct = (sunTimes.sunsetHours / 24) * 100;
  $: dayPct = endPct - startPct;

  // Planning tips
  $: tips = generateTips(sunTimes.daylightHours, mile, date);

  function generateTips(daylight, currentMile, currentDate) {
    const tips = [];
    const month = new Date(currentDate).getMonth();

    if (daylight >= 14.5) tips.push({ icon: '🌅', text: 'Consider a siesta or split day to avoid peak afternoon heat.' });
    else if (daylight < 10.5) tips.push({ icon: '🔦', text: 'Headlamp hiking likely needed. Camp near water to save time.' });

    if (currentMile > 1750 && currentMile < 1912) tips.push({ icon: '⛰️', text: 'White Mountains: Reduce planned mileage by 40-50%.' });
    if (month >= 5 && month <= 7 && currentMile > 500) tips.push({ icon: '⛈️', text: 'Summer storms: Aim to be below treeline by 2 PM.' });
    if (currentMile > 1912) tips.push({ icon: '🌲', text: '100-Mile Wilderness: Plan for slower terrain and heavier carries.' });

    return tips.slice(0, 3);
  }

  function formatDateLong(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric'
    });
  }
</script>

<div class="daylight-calc">
  <!-- Header -->
  <header class="calc-header">
    <div class="header-inner">
      <span class="header-badge">SOLAR DATA</span>
      <h2 class="header-title">Daylight Calculator</h2>
      <p class="header-sub">Sunrise and sunset planning for the trail</p>
    </div>
  </header>

  <!-- Controls -->
  <div class="controls-section">
    <div class="control-row">
      <div class="control-group date-group">
        <label class="control-label">Date</label>
        <input type="date" bind:value={date} class="date-input" />
      </div>
      
      <div class="control-group location-group">
        <div class="loc-header">
          <label class="control-label">Trail Mile: {mile}</label>
          <span class="loc-lat">{latitude.toFixed(1)}°N</span>
        </div>
        <div class="slider-container">
          <input type="range" min="0" max="2198" bind:value={mile} class="mile-slider" />
          <div class="slider-track-bg"></div>
        </div>
        <div class="loc-detail">
          <span class="loc-icon">{currentSection.emoji}</span>
          <span class="loc-name">{currentSection.name}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Sun Visualization -->
  <div class="viz-section">
    <div class="day-stats">
      <div class="stat-box">
        <span class="stat-icon">🌅</span>
        <div class="stat-data">
          <span class="stat-time">{sunTimes.sunrise || '--'}</span>
          <span class="stat-label">Sunrise</span>
        </div>
      </div>
      
      <div class="stat-box main">
        <div class="stat-data">
          <span class="stat-time large">{sunTimes.daylightHours?.toFixed(1) || '--'}h</span>
          <span class="stat-label">Total Daylight</span>
        </div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">🌇</span>
        <div class="stat-data">
          <span class="stat-time">{sunTimes.sunset || '--'}</span>
          <span class="stat-label">Sunset</span>
        </div>
      </div>
    </div>

    <!-- Timeline Bar -->
    <div class="timeline-viz">
      <div class="timeline-track">
        <!-- Night (Morning) -->
        <div class="zone night" style="width: {startPct}%"></div>
        <!-- Day -->
        <div class="zone day" style="width: {dayPct}%">
          <div class="sun-path"></div>
        </div>
        <!-- Night (Evening) -->
        <div class="zone night" style="width: {100 - endPct}%"></div>

        <!-- Markers -->
        <div class="marker start" style="left: {startPct}%"></div>
        <div class="marker end" style="left: {endPct}%"></div>
      </div>
      <div class="timeline-labels">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>12am</span>
      </div>
    </div>
  </div>

  <!-- Safe Hiking Window -->
  <div class="hiking-window">
    <div class="window-header">
      <h3 class="window-title">Safe Hiking Window</h3>
      <span class="window-badge" style="background: {dayQualityColor}15; color: {dayQualityColor}">
        {dayQuality}
      </span>
    </div>

    <div class="window-card">
      <div class="time-block">
        <span class="time-label">Start Hiking</span>
        <span class="time-val">{hikingStart}</span>
        <span class="time-sub">Sunrise + 30m</span>
      </div>
      
      <div class="window-duration">
        <span class="duration-line"></span>
        <span class="duration-val">{hikingHours} hrs</span>
        <span class="duration-line"></span>
      </div>

      <div class="time-block">
        <span class="time-label">Make Camp</span>
        <span class="time-val">{hikingEnd}</span>
        <span class="time-sub">Sunset - 30m</span>
      </div>
    </div>
  </div>

  <!-- Tips -->
  {#if tips.length > 0}
    <div class="tips-list">
      {#each tips as tip}
        <div class="tip-item">
          <span class="tip-icon">{tip.icon}</span>
          <span class="tip-text">{tip.text}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .daylight-calc {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
    overflow: hidden;
  }

  /* Header */
  .calc-header {
    padding: 2rem 2rem 1.5rem;
    background: linear-gradient(to bottom, #fdfcf9, #f5f2e8);
    border-bottom: 1px solid var(--border);
  }

  .header-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--terra);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 0.5rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    margin: 0;
    color: var(--ink);
    line-height: 1.1;
  }

  .header-sub {
    margin: 0.5rem 0 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  /* Controls */
  .controls-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .control-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
  }

  .control-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .date-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--stone);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    color: var(--ink);
  }

  .loc-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .loc-lat {
    font-size: 0.75rem;
    color: var(--muted);
    font-family: monospace;
  }

  .slider-container {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .mile-slider {
    width: 100%;
    position: absolute;
    z-index: 2;
    height: 24px;
    opacity: 0;
    cursor: pointer;
    margin: 0;
  }

  .slider-track-bg {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px;
    width: 24px;
    cursor: grab;
  }

  /* We need a visible thumb since we hid the input */
  .slider-container::after {
    content: '';
    position: absolute;
    left: var(--thumb-pos, 0%); /* JS would need to set this, but let's stick to standard styling for simplicity in Svelte */
    display: none; 
  }
  
  /* Revert to standard styling for slider to avoid complexity with custom thumbs without JS binding for position */
  .mile-slider {
    opacity: 1;
    -webkit-appearance: none;
    background: transparent;
  }
  
  .mile-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
  }
  
  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--terra);
    margin-top: -9px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  .loc-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--ink);
    font-weight: 500;
  }

  /* Visual Section */
  .viz-section {
    padding: 2rem;
    background: linear-gradient(to bottom, #fff, var(--bg));
    border-bottom: 1px solid var(--border);
  }

  .day-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 2rem;
  }

  .stat-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-time {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
  }

  .stat-time.large {
    font-size: 2rem;
    color: var(--terra);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timeline-track {
    height: 40px;
    background: #1e293b;
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    display: flex;
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.2);
  }

  .zone { height: 100%; transition: width 0.3s ease; }
  .zone.night { background: #1e293b; }
  .zone.day { 
    background: linear-gradient(180deg, #fbbf24, #d97706);
    position: relative;
  }

  .timeline-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--muted);
    padding: 0 0.5rem;
  }

  /* Hiking Window */
  .hiking-window {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .window-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .window-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine);
    margin: 0;
  }

  .window-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 99px;
  }

  .window-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg);
    padding: 1rem 1.5rem;
    border-radius: 12px;
  }

  .time-block {
    text-align: center;
  }

  .time-label {
    display: block;
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .time-val {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
  }

  .time-sub {
    font-size: 0.7rem;
    color: var(--muted);
    opacity: 0.8;
  }

  .window-duration {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem;
  }

  .duration-line {
    flex: 1;
    height: 1px;
    background: var(--stone);
  }

  .duration-val {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine);
    white-space: nowrap;
    background: #fff;
    padding: 0.2rem 0.6rem;
    border-radius: 99px;
    border: 1px solid var(--border);
  }

  /* Tips */
  .tips-list {
    padding: 1.5rem 2rem;
    background: #fafaf9;
    display: grid;
    gap: 0.75rem;
  }

  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .tip-icon { font-size: 1.1rem; }

  @media (max-width: 600px) {
    .calc-header { padding: 1.5rem; }
    .controls-section { padding: 1.5rem; }
    .control-row { grid-template-columns: 1fr; gap: 1.5rem; }
    .viz-section { padding: 1.5rem; }
    .window-card { flex-direction: column; gap: 1.5rem; }
    .window-duration { transform: rotate(90deg); width: 40px; }
    .duration-line { width: 20px; }
  }
</style>
