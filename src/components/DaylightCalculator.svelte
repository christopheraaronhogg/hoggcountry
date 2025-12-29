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
    <div class="controls-grid">
      <!-- Date Input -->
      <div class="control-group">
        <label class="control-label">Planned Date</label>
        <input type="date" bind:value={date} class="date-input" />
      </div>

      <!-- Mile Slider -->
      <div class="control-group">
        <div class="pace-header">
          <label class="control-label">Trail Mile: {mile}</label>
          <span class="pace-val" style="font-size: 1rem;">
            {currentSection.emoji} {currentSection.name}
          </span>
        </div>
        <div class="slider-container">
          <input 
            type="range" 
            min="0" 
            max="2198" 
            bind:value={mile} 
            class="pace-slider" 
          />
        </div>
        <div class="weight-zones">
          <span>GA</span>
          <span class="loc-lat">{latitude.toFixed(1)}°N</span>
          <span>ME</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Big Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-label">Total Daylight</span>
      <div class="stat-main">
        <span class="stat-num">{sunTimes.daylightHours?.toFixed(1) || '--'}</span>
        <span class="stat-unit">hours</span>
      </div>
      <div class="stat-badge" style="background: {dayQualityColor}15; color: {dayQualityColor}">
        {dayQuality}
      </div>
    </div>
    
    <div class="stat-card highlight">
      <div class="mini-stats">
        <div class="mini-stat-row">
          <span class="stat-label">Sunrise</span>
          <span class="mini-val">{sunTimes.sunrise || '--'}</span>
        </div>
        <div class="mini-stat-row">
          <span class="stat-label">Sunset</span>
          <span class="mini-val">{sunTimes.sunset || '--'}</span>
        </div>
        <div class="mini-stat-row" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--stone);">
          <span class="stat-label">Safe Window</span>
          <span class="mini-val total">{hikingHours} hrs</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Timeline Visual -->
  <div class="timeline-container">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Solar Cycle</span>
    </h3>
    
    <div class="solar-viz">
      <div class="viz-track">
        <!-- Night (Morning) -->
        <div class="zone night" style="width: {startPct}%"></div>
        <!-- Day -->
        <div class="zone day" style="width: {dayPct}%">
          <div class="sun-arc"></div>
        </div>
        <!-- Night (Evening) -->
        <div class="zone night" style="width: {100 - endPct}%"></div>
        
        <!-- Markers -->
        <div class="viz-marker start" style="left: {startPct}%">
          <div class="marker-line"></div>
          <span class="marker-label">Rise</span>
        </div>
        <div class="viz-marker end" style="left: {endPct}%">
          <div class="marker-line"></div>
          <span class="marker-label">Set</span>
        </div>
      </div>
      
      <div class="viz-labels">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>12am</span>
      </div>
    </div>

    {#if tips.length > 0}
      <div class="tips-grid">
        {#each tips as tip}
          <div class="tip-card">
            <span class="tip-icon">{tip.icon}</span>
            <span class="tip-text">{tip.text}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
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

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
    padding: 0.6rem;
    border: 1px solid var(--stone);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    color: var(--ink);
    background: #fff;
  }

  /* Slider */
  .pace-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .pace-val {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  .slider-container {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .pace-slider {
    width: 100%;
    opacity: 1;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    margin: 0;
  }

  .pace-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
  }

  .pace-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--pine);
    margin-top: -9px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  .weight-zones {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    font-weight: 600;
  }
  
  .loc-lat { font-family: monospace; font-weight: 400; }

  /* Stats */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--border);
  }

  .stat-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid var(--border);
  }

  .stat-card:last-child { border-right: none; }
  .stat-card.highlight { background: #fdfdfc; }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .stat-main {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-unit {
    font-size: 1rem;
    color: var(--muted);
  }

  .stat-badge {
    align-self: flex-start;
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mini-stats {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mini-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .mini-val {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--ink);
  }
  
  .mini-val.total { color: var(--terra); }

  /* Solar Viz */
  .timeline-container {
    padding: 2rem;
    background: var(--bg);
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
    color: var(--pine);
    margin: 0 0 1.5rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker);
    border-radius: 2px;
  }

  .solar-viz {
    margin-bottom: 2rem;
  }

  .viz-track {
    height: 32px;
    background: #1e293b;
    border-radius: 16px;
    position: relative;
    overflow: hidden;
    display: flex;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }

  .zone { height: 100%; transition: width 0.3s ease; }
  .zone.night { background: #1e293b; }
  .zone.day { 
    background: linear-gradient(180deg, #fbbf24, #d97706);
    position: relative;
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  }

  .viz-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--muted);
    padding: 0 0.25rem;
  }

  .viz-marker {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .marker-line {
    width: 2px;
    height: 100%;
    background: rgba(255,255,255,0.8);
  }

  .marker-label {
    position: absolute;
    top: -1.2rem;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }

  /* Tips */
  .tips-grid {
    display: grid;
    gap: 0.75rem;
  }

  .tip-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.05);
    font-size: 0.9rem;
    align-items: flex-start;
  }

  .tip-icon { font-size: 1.25rem; }
  .tip-text { color: var(--muted); line-height: 1.5; }

  @media (max-width: 600px) {
    .calc-header { padding: 1.5rem; }
    .controls-section { padding: 1.5rem; }
    .controls-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    .stats-grid { grid-template-columns: 1fr; }
    .stat-card { border-right: none; border-bottom: 1px solid var(--border); }
    .stat-card:last-child { border-bottom: none; }
    .timeline-container { padding: 1.5rem 1rem; }
  }
</style>