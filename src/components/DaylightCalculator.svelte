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
    // Set default date to today
    const today = new Date();
    date = today.toISOString().split('T')[0];
  });

  // Latitude interpolation: Georgia (34.6°N) to Maine (45.9°N)
  const GEORGIA_LAT = 34.6;
  const MAINE_LAT = 45.9;
  const TOTAL_MILES = 2198;

  $: latitude = GEORGIA_LAT + (mile / TOTAL_MILES) * (MAINE_LAT - GEORGIA_LAT);

  // Get current section
  $: currentSection = sections.find(s => mile >= s.startMile && mile < s.endMile) || sections[sections.length - 1];

  // Solar calculations
  function calculateSunTimes(dateStr, lat) {
    const d = new Date(dateStr);
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

    // Solar declination
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);

    // Hour angle at sunrise/sunset
    const latRad = lat * Math.PI / 180;
    const decRad = declination * Math.PI / 180;

    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

    // Handle polar day/night
    if (cosHourAngle > 1) {
      return { sunrise: null, sunset: null, daylightHours: 0, polarNight: true };
    }
    if (cosHourAngle < -1) {
      return { sunrise: null, sunset: null, daylightHours: 24, polarDay: true };
    }

    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    const daylightHours = 2 * hourAngle / 15;

    // Solar noon (approximate - ignoring longitude/timezone complexity)
    const solarNoon = 12; // Simplified to noon

    const sunriseHours = solarNoon - (daylightHours / 2);
    const sunsetHours = solarNoon + (daylightHours / 2);

    return {
      sunrise: hoursToTime(sunriseHours),
      sunset: hoursToTime(sunsetHours),
      sunriseHours,
      sunsetHours,
      daylightHours,
      polarDay: false,
      polarNight: false
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

  // Hiking window: sunrise + 30min to sunset - 30min
  $: hikingStart = sunTimes.sunriseHours ? hoursToTime(addMinutesToHours(sunTimes.sunriseHours, 30)) : '--';
  $: hikingEnd = sunTimes.sunsetHours ? hoursToTime(addMinutesToHours(sunTimes.sunsetHours, -30)) : '--';
  $: hikingHours = sunTimes.daylightHours ? (sunTimes.daylightHours - 1).toFixed(1) : 0;

  // Day quality
  $: dayQuality = sunTimes.daylightHours >= 14 ? 'Long Summer Day'
    : sunTimes.daylightHours >= 12 ? 'Good Hiking Day'
    : sunTimes.daylightHours >= 10 ? 'Shorter Day'
    : 'Short Winter Day';

  $: dayQualityColor = sunTimes.daylightHours >= 14 ? '#22c55e'
    : sunTimes.daylightHours >= 12 ? 'var(--alpine)'
    : sunTimes.daylightHours >= 10 ? 'var(--terra)'
    : '#6b8cae';

  $: dayQualityIcon = sunTimes.daylightHours >= 14 ? '☀️'
    : sunTimes.daylightHours >= 12 ? '🌤️'
    : sunTimes.daylightHours >= 10 ? '⛅'
    : '🌙';

  // Visual day/night percentages
  $: daylightPercent = (sunTimes.daylightHours / 24) * 100;
  $: nightPercent = 100 - daylightPercent;

  // Planning tips based on conditions
  $: tips = generateTips(sunTimes.daylightHours, mile, date);

  function generateTips(daylight, currentMile, currentDate) {
    const tips = [];
    const month = new Date(currentDate).getMonth();

    if (daylight >= 14) {
      tips.push({ icon: '🌅', text: 'Long days! Consider starting early to beat afternoon heat and thunderstorms.' });
    } else if (daylight < 10) {
      tips.push({ icon: '🔦', text: 'Short days - headlamp hiking may be needed. Start at first light.' });
    }

    if (currentMile > 1750 && currentMile < 1912) {
      tips.push({ icon: '⛰️', text: 'White Mountains require extra time. Budget 1.5x normal hiking pace.' });
    }

    if (month >= 5 && month <= 7 && currentMile > 500) {
      tips.push({ icon: '⛈️', text: 'Summer storm season. Plan to be below treeline by 2 PM.' });
    }

    if (daylight >= 12 && daylight < 14) {
      tips.push({ icon: '⏰', text: 'Balanced daylight. Aim for early starts to maximize afternoon flexibility.' });
    }

    if (currentMile > 1912) {
      tips.push({ icon: '🎯', text: 'Maine\'s 100-Mile Wilderness - longer hiking days, resupply carries.' });
    }

    return tips.slice(0, 3);
  }

  // Format date nicely
  function formatDateLong(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="daylight-calc">
  <!-- Header -->
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">SOLAR DATA</span>
      <h2 class="header-title">Daylight Calculator</h2>
      <p class="header-sub">Plan your hiking day with sunrise and sunset times</p>
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
        bind:value={date}
        class="date-input"
      />
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
          bind:value={mile}
          class="mile-slider"
        />
        <span class="mile-value">{mile.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <!-- Location Info -->
  <div class="location-bar">
    <div class="location-main">
      <span class="location-emoji">{currentSection.emoji}</span>
      <div class="location-info">
        <span class="location-name">{currentSection.name}</span>
        <span class="location-lat">{latitude.toFixed(2)}°N latitude</span>
      </div>
    </div>
    <div class="location-date">{formatDateLong(date)}</div>
  </div>

  <!-- Sun Times Summary -->
  <div class="sun-summary">
    <div class="sun-stat sunrise">
      <span class="sun-icon">🌅</span>
      <div class="sun-info">
        <span class="sun-time">{sunTimes.sunrise || '--'}</span>
        <span class="sun-label">Sunrise</span>
      </div>
    </div>

    <div class="sun-stat daylight">
      <span class="sun-icon">{dayQualityIcon}</span>
      <div class="sun-info">
        <span class="sun-time">{sunTimes.daylightHours?.toFixed(1) || '--'}h</span>
        <span class="sun-label">Daylight</span>
      </div>
    </div>

    <div class="sun-stat sunset">
      <span class="sun-icon">🌇</span>
      <div class="sun-info">
        <span class="sun-time">{sunTimes.sunset || '--'}</span>
        <span class="sun-label">Sunset</span>
      </div>
    </div>
  </div>

  <!-- Day/Night Visual Bar -->
  <div class="daynight-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Day & Night</span>
    </h3>

    <div class="daynight-bar">
      <div class="night-segment morning" style="width: {(sunTimes.sunriseHours / 24) * 100}%">
        <span class="segment-label">Night</span>
      </div>
      <div class="day-segment" style="width: {daylightPercent}%">
        <span class="segment-label">{sunTimes.daylightHours?.toFixed(1)}h daylight</span>
      </div>
      <div class="night-segment evening" style="width: {((24 - sunTimes.sunsetHours) / 24) * 100}%">
        <span class="segment-label">Night</span>
      </div>
    </div>

    <div class="daynight-times">
      <span class="time-marker">12 AM</span>
      <span class="time-marker">6 AM</span>
      <span class="time-marker">12 PM</span>
      <span class="time-marker">6 PM</span>
      <span class="time-marker">12 AM</span>
    </div>
  </div>

  <!-- Hiking Window -->
  <div class="hiking-window">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Safe Hiking Window</span>
    </h3>

    <div class="window-card">
      <div class="window-times">
        <div class="window-time start">
          <span class="window-icon">🥾</span>
          <span class="window-value">{hikingStart}</span>
          <span class="window-label">Start hiking</span>
          <span class="window-note">30 min after sunrise</span>
        </div>

        <div class="window-arrow">
          <span class="arrow-line"></span>
          <span class="arrow-duration">{hikingHours}h</span>
          <span class="arrow-line"></span>
        </div>

        <div class="window-time end">
          <span class="window-icon">🏕️</span>
          <span class="window-value">{hikingEnd}</span>
          <span class="window-label">Make camp</span>
          <span class="window-note">30 min before sunset</span>
        </div>
      </div>

      <div class="window-quality" style="background: {dayQualityColor}20; border-color: {dayQualityColor}">
        <span class="quality-icon">{dayQualityIcon}</span>
        <span class="quality-text" style="color: {dayQualityColor}">{dayQuality}</span>
      </div>
    </div>
  </div>

  <!-- Planning Tips -->
  {#if tips.length > 0}
    <div class="tips-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Planning Tips</span>
      </h3>

      <div class="tips-list">
        {#each tips as tip, i}
          <div
            class="tip-card"
            class:mounted
            style="animation-delay: {i * 100}ms"
          >
            <span class="tip-icon">{tip.icon}</span>
            <p class="tip-text">{tip.text}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Mile Progress -->
  <div class="progress-section">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {(mile / TOTAL_MILES) * 100}%"></div>
      <div class="progress-marker" style="left: {(mile / TOTAL_MILES) * 100}%"></div>
    </div>
    <div class="progress-endpoints">
      <span class="endpoint">
        <span class="endpoint-icon">🏕️</span>
        Springer
      </span>
      <span class="endpoint-mile">Mile {mile.toLocaleString()} of {TOTAL_MILES.toLocaleString()}</span>
      <span class="endpoint">
        Katahdin
        <span class="endpoint-icon">🏔️</span>
      </span>
    </div>
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
    position: relative;
    padding: 2.5rem 2rem 2rem;
    background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
    color: #fff;
    overflow: hidden;
  }

  .header-topo {
    position: absolute;
    inset: 0;
    opacity: 0.06;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(255,200,100,0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(255,150,50,0.2) 0%, transparent 40%);
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
    background: var(--terra, #d97706);
    color: #fff;
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
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(to bottom, rgba(217, 119, 6, 0.05), transparent);
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
    border-color: var(--terra, #d97706);
  }

  .mile-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mile-slider {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--pine, #4d594a));
    border-radius: 4px;
    cursor: pointer;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: var(--terra, #d97706);
    border: 3px solid #fff;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .mile-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--terra, #d97706);
    border: 3px solid #fff;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .mile-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    min-width: 3.5rem;
    text-align: right;
  }

  /* Location Bar */
  .location-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .location-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .location-emoji {
    font-size: 1.75rem;
  }

  .location-info {
    display: flex;
    flex-direction: column;
  }

  .location-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
  }

  .location-lat {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .location-date {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
  }

  /* Sun Summary */
  .sun-summary {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .sun-stat {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem;
  }

  .sun-stat.sunrise {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.02));
  }

  .sun-stat.daylight {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.1), rgba(166, 181, 137, 0.02));
  }

  .sun-stat.sunset {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(217, 119, 6, 0.02));
  }

  .sun-icon {
    font-size: 1.75rem;
  }

  .sun-info {
    display: flex;
    flex-direction: column;
  }

  .sun-time {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink, #2b2f26);
    line-height: 1;
  }

  .sun-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted, #5c665a);
    margin-top: 0.2rem;
  }

  @media (max-width: 600px) {
    .sun-summary {
      grid-template-columns: 1fr;
    }

    .sun-stat {
      border-bottom: 1px solid var(--border, #e6e1d4);
    }

    .sun-stat:last-child {
      border-bottom: none;
    }
  }

  /* Day/Night Section */
  .daynight-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
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
    background: var(--terra, #d97706);
    border-radius: 2px;
  }

  .daynight-bar {
    display: flex;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
  }

  .night-segment {
    background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
  }

  .day-segment {
    background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .segment-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 0.5rem;
  }

  .daynight-times {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .time-marker {
    font-size: 0.65rem;
    color: var(--muted, #5c665a);
  }

  /* Hiking Window */
  .hiking-window {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .window-card {
    background: var(--bg, #f5f2e8);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .window-times {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .window-time {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .window-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .window-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink, #2b2f26);
  }

  .window-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
  }

  .window-note {
    font-size: 0.65rem;
    color: var(--muted, #5c665a);
    margin-top: 0.1rem;
  }

  .window-arrow {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.5rem;
  }

  .arrow-line {
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--terra, #d97706));
  }

  .arrow-duration {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    white-space: nowrap;
  }

  .window-quality {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    border: 2px solid;
  }

  .quality-icon {
    font-size: 1.1rem;
  }

  .quality-text {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Tips Section */
  .tips-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .tips-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tip-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    opacity: 0;
    transform: translateX(-10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .tip-card.mounted {
    opacity: 1;
    transform: translateX(0);
  }

  .tip-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .tip-text {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    margin: 0;
    line-height: 1.4;
  }

  /* Progress Section */
  .progress-section {
    padding: 1.5rem 2rem 2rem;
  }

  .progress-bar {
    position: relative;
    height: 10px;
    background: var(--stone, #d4d0c4);
    border-radius: 5px;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--pine, #4d594a));
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .progress-marker {
    position: absolute;
    top: 50%;
    width: 16px;
    height: 16px;
    background: var(--terra, #d97706);
    border: 3px solid #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    transition: left 0.3s ease;
  }

  .progress-endpoints {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .endpoint {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .endpoint-icon {
    font-size: 1rem;
  }

  .endpoint-mile {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  /* Mobile */
  @media (max-width: 600px) {
    .calc-header,
    .location-bar,
    .daynight-section,
    .hiking-window,
    .tips-section,
    .progress-section {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .window-times {
      flex-direction: column;
      gap: 1rem;
    }

    .window-arrow {
      transform: rotate(90deg);
      width: 60px;
      padding: 0;
    }
  }
</style>
