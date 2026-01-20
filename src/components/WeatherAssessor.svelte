<script>
  import { fade } from 'svelte/transition';
  import StormWarningFieldStation from './StormWarningFieldStation.svelte';


  let { trailContext = {} } = $props();

  // Active section
  let activeSection = $state('temp');

  // Temperature calculator inputs
  let townTemp = $state(35);
  let elevationGain = $state(3000);
  let windSpeed = $state(15);

  // Temperature calculations (worst-case: 5.5°F per 1000ft)

  let tempDrop = $derived((elevationGain / 1000) * 5.5);
  let summitTemp = $derived(townTemp - tempDrop);

  // Wind chill calculation
  let windChill = $derived.by(() => {
    if (windSpeed < 5) return 0;
    const temp = summitTemp;
    if (windSpeed <= 5) return Math.round(temp - 4);
    if (windSpeed <= 10) return Math.round(temp - 8);
    if (windSpeed <= 15) return Math.round(temp - 12);
    if (windSpeed <= 20) return Math.round(temp - 18);
    return Math.round(temp - 25);
  });

  let feelsLike = $derived(windSpeed >= 5 ? windChill : summitTemp);


  // Wind action based on speed AND temperature
  let windAction = $derived.by(() => {
    const isCold = summitTemp <= 25;
    const isWindy = windSpeed >= 15;

    if (isCold && isWindy) {
      return {
        level: 'shelter-trigger',
        action: 'SHELTER',
        color: '#ef4444',
        tips: ['Wind + Cold trigger activated', 'Tent setup dangerous — hands fail fast', 'Shelter reduces complexity', 'Walk in, drop pack, done'],

        trigger: true,
      };
    }

    if (windSpeed < 10) {
      return {
        level: 'light',
        action: 'Shelter or Tent OK',
        color: '#22c55e',
        tips: ['Normal camping conditions', 'Either option fine'],
      };
    }

    if (windSpeed < 20) {
      if (summitTemp <= 35) {
        return {
          level: 'moderate',
          action: 'Tent OK (watch temp)',
          color: '#fbbf24',
          tips: ['Find wind-protected site', 'If temp drops below 25°F → shelter trigger', 'Have shelter backup plan'],
        };
      }
      return {
        level: 'moderate',
        action: 'Tent OK',
        color: '#fbbf24',
        tips: ['Wind is cooling in warm temps', 'Choose protected terrain', 'Tent gives control'],
      };
    }

    if (windSpeed < 30) {
      if (summitTemp <= 35) {
        return {
          level: 'strong',
          action: 'Lean SHELTER',
          color: '#f97316',
          tips: ['Near cold+wind trigger threshold', 'Setup will be very difficult', 'Shelter strongly recommended'],

        };
      }
      return {
        level: 'strong',
        action: 'TENT — Protected terrain',
        color: '#f97316',
        tips: ['Below ridges', 'Dense trees', 'Use all stakes', 'Low pitch'],
      };
    }

    return {
      level: 'severe',
      action: 'SEEK COVER',
      color: '#dc2626',
      tips: ['Do not camp exposed', 'Shelter or bail to lower elevation', 'Emergency conditions'],

    };
  });

  const pressurePatterns = [
    { drift: '±3-5 ft', time: 'settles quickly', status: 'stable', desc: 'Normal — Weather stable', color: '#22c55e' },
    { drift: '10-20 ft drop', time: '3-6 hours', status: 'caution', desc: 'Caution — Weather in 12-24 hrs', color: '#fbbf24' },
    { drift: '20-30+ ft drop', time: '1-3 hours', status: 'danger', desc: 'Danger — Weather imminent', color: '#ef4444' },
  ];


  function getTempColor(temp) {
    if (temp <= 10) return '#ef4444';
    if (temp <= 25) return '#f97316';
    if (temp <= 40) return '#fbbf24';
    if (temp <= 55) return '#22c55e';
    return '#059669';
  }

  // Pressure tracking via elevation drift
  // When stopped: if watch reads HIGHER than actual elevation, pressure is DROPPING
  let actualElevation = $state(3200);  // From map/GPS at known point
  let watchElevation = $state(3200);   // What your watch/phone shows
  let previousDrift = $state(0);       // Previous reading's drift (ft)
  let hoursElapsed = $state(3);

  // Calculate elevation drift (phantom gain = pressure drop)
  let elevationDrift = $derived(watchElevation - actualElevation);
  let driftChange = $derived(elevationDrift - previousDrift);
  let driftRatePerHour = $derived(hoursElapsed > 0 ? driftChange / hoursElapsed : 0);

  let pressureAssessment = $derived.by(() => {
    const drift = elevationDrift;
    const ratePerHour = driftRatePerHour;

    // Determine trend based on drift change
    let trend, trendIcon;
    if (ratePerHour < -20) {
      trend = 'rising';
      trendIcon = '📈';
    } else if (ratePerHour > 20) {
      trend = 'falling';
      trendIcon = '📉';
    } else {
      trend = 'steady';
      trendIcon = '➡️';
    }

    // Assess severity based on rate of phantom climb (positive = pressure dropping)
    if (ratePerHour <= 0) {
      return {
        trend,
        trendIcon,
        level: 'good',
        color: '#22c55e',
        headline: trend === 'rising' ? 'Improving Weather' : 'Stable Conditions',
        message: 'Pressure steady or rising. Fair weather ahead.',
        action: 'Continue as planned',
        urgency: 'none',
        driftDesc: drift === 0 ? 'Calibrated' : drift < 0 ? `${Math.abs(drift)} ft low` : `${drift} ft high`,
      };
    }

    // Positive drift rate = pressure dropping = storm approaching
    if (ratePerHour < 50) {
      return {
        trend,
        trendIcon,
        level: 'watch',
        color: '#fbbf24',
        headline: 'Slow Pressure Drop',
        message: 'Weather may change in 12-24 hours.',
        action: 'Monitor conditions, have backup plan',
        urgency: 'low',
        driftDesc: `+${Math.round(ratePerHour)} ft/hr drift`,
      };
    }

    if (ratePerHour < 150) {
      return {
        trend,
        trendIcon,
        level: 'caution',
        color: '#f97316',
        headline: 'Moderate Pressure Drop',
        message: 'Weather change likely in 6-12 hours.',
        action: 'Plan for shelter, reduce exposed time',
        urgency: 'moderate',
        driftDesc: `+${Math.round(ratePerHour)} ft/hr drift`,
      };
    }

    if (ratePerHour < 300) {
      return {
        trend,
        trendIcon,

        color: '#ef4444',
        headline: 'Rapid Pressure Drop',
        message: 'Storm approaching in 2-6 hours.',
        action: 'Seek shelter soon, avoid exposed ridges',
        urgency: 'high',
        driftDesc: `+${Math.round(ratePerHour)} ft/hr drift`,
      };
    }

    return {
      trend,
      trendIcon,
      level: 'emergency',
      color: '#dc2626',
      headline: 'PRESSURE CRASH',
      message: 'Severe weather imminent. Act now.',
      action: 'SHELTER IMMEDIATELY',
      urgency: 'critical',
      driftDesc: `+${Math.round(ratePerHour)} ft/hr drift`,
    };
  });

  // Daylight calculator
  let dlDate = $state(new Date().toISOString().split('T')[0]);
  let dlMile = $state(trailContext?.currentMile || 500);



  const GEORGIA_LAT = 34.6;
  const MAINE_LAT = 45.9;
  const TOTAL_MILES = 2198;

  let dlLatitude = $derived(GEORGIA_LAT + (dlMile / TOTAL_MILES) * (MAINE_LAT - GEORGIA_LAT));

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
    const solarNoon = 12;
    const sunriseHours = solarNoon - (daylightHours / 2);
    const sunsetHours = solarNoon + (daylightHours / 2);

    return { sunrise: hoursToTime(sunriseHours), sunset: hoursToTime(sunsetHours), sunriseHours, sunsetHours, daylightHours };
  }

  function hoursToTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  let sunTimes = $derived(calculateSunTimes(dlDate, dlLatitude));
  let hikingHours = $derived(sunTimes.daylightHours ? (sunTimes.daylightHours - 1).toFixed(1) : 0);
  let dayQuality = $derived(sunTimes.daylightHours >= 14 ? 'Long Day' : sunTimes.daylightHours >= 12 ? 'Solid Day' : sunTimes.daylightHours >= 10 ? 'Short Day' : 'Winter Day');
  let dayQualityColor = $derived(sunTimes.daylightHours >= 14 ? '#22c55e' : sunTimes.daylightHours >= 12 ? '#059669' : sunTimes.daylightHours >= 10 ? '#ef4444' : '#6b8cae');

  let terrainMultiplier = $derived((dlMile > 1750 && dlMile < 1912) ? 0.6 : 1.0);
  let maxMilesNormal = $derived(hikingHours * 2.5 * terrainMultiplier);

  let startPct = $derived((sunTimes.sunriseHours / 24) * 100);
  let endPct = $derived((sunTimes.sunsetHours / 24) * 100);
  let dayPct = $derived(endPct - startPct);
</script>

<div class="weather-assessor">
  <!-- Atmospheric Header -->
  <header class="wx-header">
    <div class="wx-clouds">
      <div class="cloud c1"></div>
      <div class="cloud c2"></div>
      <div class="cloud c3"></div>
    </div>
    <div class="wx-header-content">
      <div class="wx-badge">
        <span class="wx-badge-icon">🌤️</span>
        <span class="wx-badge-text">WEATHER STATION</span>
      </div>
      <h2 class="wx-title">Weather Assessor</h2>
        <p class="wx-subtitle">Temperature • Wind • Rain • Daylight</p>

    </div>

  </header>

  <!-- Navigation Tabs -->
  <nav class="wx-nav">
    <button class="nav-tab" class:active={activeSection === 'temp'} onclick={() => activeSection = 'temp'}>
      <span class="tab-icon">🌡️</span>
      <span class="tab-label">Temp</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'pressure'} class:alert={pressureAssessment.urgency === 'high' || pressureAssessment.urgency === 'critical'} onclick={() => activeSection = 'pressure'}>
      <span class="tab-icon">📊</span>
      <span class="tab-label">Pressure</span>
    </button>

    <button class="nav-tab" class:active={activeSection === 'rain'} onclick={() => activeSection = 'rain'}>
      <span class="tab-icon">🌧️</span>
      <span class="tab-label">Rain</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'daylight'} onclick={() => activeSection = 'daylight'}>
      <span class="tab-icon">🌅</span>
      <span class="tab-label">Sun</span>
    </button>
  </nav>

  <!-- Temperature Section -->
  {#if activeSection === 'temp'}
    <section class="wx-section" transition:fade>
      <div class="temp-hero">
        <div class="thermometer-visual">
          <div class="thermo-column">
            <div class="thermo-label">Town</div>
            <div class="thermo-tube">
              <div class="thermo-mercury" style="height: {Math.max(5, (townTemp + 20) / 110 * 100)}%; background: {getTempColor(townTemp)}"></div>
            </div>
            <div class="thermo-reading" style="color: {getTempColor(townTemp)}">{townTemp}°F</div>
          </div>
          <div class="thermo-arrow">
            <span class="arrow-text">-{tempDrop.toFixed(0)}°</span>
            <span class="arrow-note">{elevationGain.toLocaleString()}' elev</span>
          </div>
          <div class="thermo-column">
            <div class="thermo-label">Summit</div>
            <div class="thermo-tube">
              <div class="thermo-mercury" style="height: {Math.max(5, (summitTemp + 20) / 110 * 100)}%; background: {getTempColor(summitTemp)}"></div>
            </div>
            <div class="thermo-reading" style="color: {getTempColor(summitTemp)}">{summitTemp.toFixed(0)}°F</div>
          </div>
          {#if windSpeed >= 5}
            <div class="thermo-arrow wind">
              <span class="arrow-text">wind</span>
              <span class="arrow-note">{windSpeed} mph</span>
            </div>
            <div class="thermo-column feels">
              <div class="thermo-label">Feels</div>
              <div class="thermo-tube">
                <div class="thermo-mercury" style="height: {Math.max(5, (feelsLike + 20) / 110 * 100)}%; background: {getTempColor(feelsLike)}"></div>
              </div>
              <div class="thermo-reading" style="color: {getTempColor(feelsLike)}">{feelsLike}°F</div>
            </div>
          {/if}
        </div>
      </div>

      <div class="input-panel">
        <div class="input-field">
          <label class="field-label">Town Temperature</label>
          <div class="field-row">
            <input type="range" bind:value={townTemp} min="-10" max="90" class="slider-input" />
            <div class="field-value">
              <input type="number" bind:value={townTemp} min="-10" max="90" class="num-input" />
              <span class="unit">°F</span>
            </div>
          </div>
        </div>

        <div class="input-field">
          <label class="field-label">Elevation Gain to Summit</label>
          <div class="field-row">
            <input type="range" bind:value={elevationGain} min="0" max="5000" step="100" class="slider-input" />
            <div class="field-value">
              <input type="number" bind:value={elevationGain} min="0" max="5000" step="100" class="num-input" />
              <span class="unit">ft</span>
            </div>
          </div>
        </div>

        <div class="input-field">
          <label class="field-label">Expected Wind Speed</label>
          <div class="field-row">
            <input type="range" bind:value={windSpeed} min="0" max="50" step="5" class="slider-input wind" />
            <div class="field-value">
              <input type="number" bind:value={windSpeed} min="0" max="50" step="5" class="num-input" />
              <span class="unit">mph</span>
            </div>
          </div>
        </div>
      </div>

      <div class="formula-card">
        <span class="formula-icon">📐</span>
        <span class="formula-text">Worst-case: <strong>5.5°F colder per 1,000 ft</strong> of elevation gain</span>
      </div>

      <div class="chill-table">
        <div class="table-header">Wind Chill at {summitTemp.toFixed(0)}°F Summit</div>
        <div class="chill-grid">
          {#each [[5, 4], [10, 8], [15, 12], [20, 18], [25, 25]] as [wind, penalty]}
            <div class="chill-cell" class:active={windSpeed >= wind && windSpeed < wind + 5}>
              <span class="chill-wind">{wind} mph</span>
              <span class="chill-result">{Math.round(summitTemp - penalty)}°F</span>
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}


  <!-- Pressure Section - Storm Warning Tool -->
  {#if activeSection === 'pressure'}
    <section class="wx-section" transition:fade>
      <StormWarningFieldStation {trailContext} />
    </section>
  {/if}


  <!-- Rain Section -->
  {#if activeSection === 'rain'}
    <section class="wx-section" transition:fade>
      <div class="rain-header">
        <h3 class="rain-title">Multi-Day Rain Protocol</h3>
        <p class="rain-sub">Operate in two phases: WET → DRY</p>
      </div>

      <div class="phase-row">
        <div class="phase-box wet">
          <div class="phase-head">
            <span class="phase-icon">💦</span>
            <span class="phase-name">WET PHASE</span>
          </div>
          <ol class="phase-steps">
            <li><strong>Pitch tent FIRST</strong> — Do NOT open dry bags</li>
            <li><strong>Cook & eat</strong> — Outside or at vestibule</li>
            <li><strong>Bear hang IMMEDIATELY</strong> — Before entering</li>
          </ol>
        </div>

        <div class="phase-arrow">→</div>

        <div class="phase-box dry">
          <div class="phase-head">
            <span class="phase-icon">✨</span>
            <span class="phase-name">DRY PHASE</span>
          </div>
          <ol class="phase-steps">
            <li>Enter tent, close door</li>
            <li>Strip wet clothes</li>
            <li>Put on dry sleep clothes</li>
            <li>Get into quilt</li>
          </ol>
          <p class="phase-note">If you forgot something outside — it waits</p>
        </div>
      </div>

      <div class="morning-box">
        <h4 class="morning-title">☀️ Morning Reset</h4>
        <ol class="morning-steps">
          <li>Pack quilt + sleep clothes FIRST</li>
          <li>Seal them inside pack liner</li>
          <li>Put wet clothes back on</li>
          <li>Exit tent → Retrieve food → Hike</li>
        </ol>
        <p class="morning-note">You only endure the wet once per cycle</p>
      </div>

      <div class="rain-principles">
        <h4 class="principles-title">Core Principles</h4>
        <ul class="principles-list">
          <li><strong>Rain alone is manageable</strong> — Wind + rain is the threat</li>
          <li><strong>Sleep system must stay dry</strong> at all costs</li>
          <li><strong>Decisions made early</strong>, not at dark</li>
          <li><strong>Stay warm by movement</strong>, not by stopping</li>
        </ul>
      </div>
    </section>
  {/if}

  <!-- Daylight Section -->
  {#if activeSection === 'daylight'}
    <section class="wx-section" transition:fade>
      <div class="dl-controls">
        <div class="dl-field">
          <label class="field-label">Date</label>
          <input type="date" bind:value={dlDate} class="date-input" />
        </div>
        <div class="dl-field mile">
          <label class="field-label">Mile {dlMile} • {dlLatitude.toFixed(1)}°N</label>
          <input type="range" bind:value={dlMile} min="0" max="2198" class="slider-input" />
        </div>
      </div>

      <div class="sun-display">
        <div class="sun-times">
          <div class="sun-time">
            <span class="sun-label">🌅 Sunrise</span>
            <span class="sun-val">{sunTimes.sunrise || '--'}</span>
          </div>
          <div class="sun-center">
            <span class="sun-hours">{sunTimes.daylightHours?.toFixed(1) || '--'}</span>
            <span class="sun-unit">hrs daylight</span>
            <span class="sun-quality" style="color: {dayQualityColor}">{dayQuality}</span>
          </div>
          <div class="sun-time">
            <span class="sun-label">🌇 Sunset</span>
            <span class="sun-val">{sunTimes.sunset || '--'}</span>
          </div>
        </div>

        <div class="solar-arc">
          <div class="arc-night" style="width: {startPct}%"></div>
          <div class="arc-day" style="width: {dayPct}%"></div>
          <div class="arc-night" style="width: {100 - endPct}%"></div>
        </div>
        <div class="arc-labels">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
        </div>
      </div>

      <div class="dl-stats">
        <div class="dl-stat">
          <span class="stat-label">Safe Hiking</span>
          <span class="stat-val">{hikingHours} hrs</span>
          <span class="stat-note">30min buffer each side</span>
        </div>
        <div class="dl-stat highlight">
          <span class="stat-label">Max Miles</span>
          <span class="stat-val">{maxMilesNormal.toFixed(0)} mi</span>
          <span class="stat-note">@ 2.5 mph{terrainMultiplier < 1 ? ' (terrain adj)' : ''}</span>
        </div>
      </div>

      {#if terrainMultiplier < 1}
        <div class="terrain-alert">
          <span class="terrain-icon">⛰️</span>
          <span class="terrain-text">White Mountains: Reduce planned mileage by 40-50%</span>
        </div>
      {/if}
    </section>
  {/if}

  <!-- Guide Links -->
  <div class="guide-links">
    <a href="/guide/12-weather-strategy" class="guide-link chapter-link">
      <span class="link-icon">📚</span>
      <span class="link-text">Full Weather Strategy Guide</span>
      <span class="link-arrow">→</span>
    </a>
    <a href="/guide#12-weather-strategy" class="guide-link field-guide-link">
      <span class="link-icon">📖</span>
      <span class="link-text">Field Guide</span>
      <span class="link-arrow">→</span>
    </a>
  </div>
</div>

<style>
  .weather-assessor {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Atmospheric Header */
  .wx-header {
    position: relative;
    background: linear-gradient(180deg, #1e3a5f 0%, #2d5a87 50%, #4a90b5 100%);
    border-radius: 20px;
    padding: 2rem 1.5rem;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .wx-clouds {
    position: absolute;
    inset: 0;
    overflow: hidden;
    opacity: 0.3;
  }

  .cloud {
    position: absolute;
    background: #fff;
    border-radius: 50px;
  }

  .cloud.c1 {
    width: 80px;
    height: 30px;
    top: 20%;
    left: 10%;
    animation: drift 20s linear infinite;
  }

  .cloud.c2 {
    width: 60px;
    height: 24px;
    top: 40%;
    left: 60%;
    animation: drift 25s linear infinite reverse;
  }

  .cloud.c3 {
    width: 100px;
    height: 36px;
    top: 60%;
    left: 30%;
    animation: drift 30s linear infinite;
  }

  @keyframes drift {
    from { transform: translateX(-100px); }
    to { transform: translateX(calc(100% + 100px)); }
  }

  .wx-header-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: #fff;
  }

  .wx-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.15);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    margin-bottom: 0.75rem;
  }

  .wx-badge-icon { font-size: 1rem; }

  .wx-badge-text {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  .wx-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .wx-subtitle {
    font-size: 0.85rem;
    opacity: 0.8;
    margin: 0;
  }



  /* Navigation Tabs */
  .wx-nav {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 1.25rem;
  }

  .nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.65rem 0.4rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-tab:hover {
    border-color: var(--alpine);
  }

  .nav-tab.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .tab-icon { font-size: 1.15rem; }

  .tab-label {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--muted);
  }

  .nav-tab.active .tab-label { color: #fff; }


  /* Sections */
  .wx-section {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 18px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  /* Temperature Section */
  .temp-hero {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 14px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .thermometer-visual {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 1rem;
  }

  .thermo-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .thermo-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
  }

  .thermo-tube {
    width: 24px;
    height: 100px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  }

  .thermo-mercury {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 12px;
    transition: height 0.3s ease, background 0.3s ease;
  }

  .thermo-reading {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .thermo-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0.5rem;
    color: var(--muted);
  }

  .thermo-arrow.wind { color: var(--pine); }

  .arrow-text {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .arrow-note {
    font-size: 0.6rem;
    text-align: center;
  }

  /* Input Panel */
  .input-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    letter-spacing: 0.03em;
  }

  .field-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .slider-input {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, #22c55e, #fbbf24, #ef4444);
    border-radius: 4px;
  }

  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .slider-input.wind {
    background: linear-gradient(90deg, #22c55e 0%, #fbbf24 40%, #f97316 70%, #ef4444 100%);
  }

  .field-value {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .num-input {
    width: 65px;
    padding: 0.5rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .num-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .unit {
    font-size: 0.85rem;
    color: var(--muted);
    min-width: 24px;
  }

  .formula-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15) 0%, rgba(166, 181, 137, 0.08) 100%);
    border: 1px solid var(--alpine);
    border-radius: 10px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .formula-icon { font-size: 1.1rem; }

  /* Chill Table */
  .chill-table {
    background: var(--bg);
    border-radius: 12px;
    padding: 1rem;
  }

  .table-header {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  .chill-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }

  .chill-cell {
    text-align: center;
    padding: 0.6rem 0.4rem;
    background: #fff;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .chill-cell.active {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.15);
  }

  .chill-wind {
    display: block;
    font-size: 0.65rem;
    color: var(--muted);
  }

  .chill-result {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
  }



  /* Pressure Section */
  .pressure-hero {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.12) 0%, rgba(166, 181, 137, 0.05) 100%);
    border: 2px solid var(--pressure-color, var(--alpine));
    border-radius: 16px;
    margin-bottom: 1rem;
  }

  .pressure-trend {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .trend-icon { font-size: 2rem; }

  .trend-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .pressure-assessment { flex: 1; }

  .assessment-headline {
    font-family: Oswald, sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .assessment-message {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .pressure-action {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(251, 191, 36, 0.1);
    border: 2px solid #fbbf24;
    border-radius: 12px;
    margin-bottom: 1.25rem;
  }

  .pressure-action.critical {
    background: rgba(220, 38, 38, 0.15);
    border-color: #dc2626;
    animation: pulse-border 1s infinite;
  }

  @keyframes pulse-border {
    0%, 100% { border-color: #dc2626; }
    50% { border-color: #ef4444; }
  }


  .action-icon { font-size: 1.5rem; }

  .action-text {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .pressure-inputs {
    background: var(--bg);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .pressure-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.75rem;
    letter-spacing: 0.03em;
  }

  .pressure-concept {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(45, 90, 135, 0.08) 0%, rgba(45, 90, 135, 0.03) 100%);
    border: 2px solid rgba(45, 90, 135, 0.2);
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .concept-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .concept-text {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--ink);
  }

  .drift-compare {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 8px;
    text-align: center;
  }

  .drift-result {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .input-hint {
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.35rem;
    font-style: italic;
  }

  .rate-explain {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .pressure-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pressure-input-group {
    background: #fff;
    padding: 0.75rem;
    border-radius: 10px;
  }

  .pressure-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .pressure-value-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .pressure-num {
    width: 80px;
    padding: 0.4rem 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    text-align: center;
    border: 2px solid var(--alpine);
    border-radius: 8px;
    color: var(--ink);
  }

  .pressure-unit {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .pressure-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, var(--alpine) 0%, var(--pine) 100%);
    border-radius: 4px;
  }

  .pressure-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .hours-options {
    display: flex;
    gap: 0.5rem;
  }

  .hour-btn {
    flex: 1;
    padding: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hour-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .rate-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
    background: #fff;
    border: 2px solid var(--alpine);
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }

  .rate-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .rate-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .pressure-reference {
    background: var(--bg);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1.25rem;
    position: relative;
  }

  .ref-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.75rem;
    letter-spacing: 0.03em;
  }

  .ref-scale {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .ref-zone {
    flex: 1;
    padding: 0.75rem 0.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .ref-zone.low { background: rgba(239, 68, 68, 0.15); }
  .ref-zone.normal { background: rgba(251, 191, 36, 0.15); }
  .ref-zone.high { background: rgba(34, 197, 94, 0.15); }

  .ref-range {
    font-size: 0.65rem;
    color: var(--muted);
  }

  .ref-name {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
  }

  .ref-weather {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .ref-current {
    position: absolute;
    bottom: 1rem;
    transform: translateX(-50%);
  }

  .ref-needle {
    display: block;
    width: 2px;
    height: 12px;
    background: var(--pine);
    margin: 0 auto 0.25rem;
  }

  .ref-reading {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .drop-rates {
    background: #fff;
    border: 2px solid var(--alpine);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1.25rem;
  }

  .drop-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--pine);
    margin-bottom: 0.75rem;
    letter-spacing: 0.03em;
  }

  .drop-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .drop-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border-radius: 8px;
  }

  .drop-rate {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ink);
    min-width: 90px;
  }

  .drop-timing {
    flex: 1;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .drop-action {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .drop-action.good { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  .drop-action.caution { background: rgba(251, 191, 36, 0.15); color: #d97706; }

  .drop-action.critical { background: #dc2626; color: #fff; }

  .pressure-tips {
    background: rgba(166, 181, 137, 0.1);
    border-radius: 12px;
    padding: 1rem;
  }

  .tips-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--pine);
    margin-bottom: 0.75rem;
  }

  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tips-list li {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.4;
  }

  .tips-list li strong {
    color: var(--ink);
  }


  /* Wind Section */
  .wind-hero {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-radius: 14px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    text-align: center;
  }

  .wind-gauge {
    position: relative;
    width: 200px;
    height: 120px;
    margin: 0 auto 1rem;
  }

  .gauge-svg {
    width: 100%;
    height: 100%;
  }

  .gauge-reading {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .gauge-value {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .gauge-unit {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .wind-slider {
    width: 100%;
    max-width: 200px;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, #22c55e 0%, #fbbf24 40%, #f97316 70%, #ef4444 100%);
    border-radius: 4px;
  }

  .wind-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .wind-action {
    padding: 1.25rem;
    border-left: 5px solid var(--action-color);
    background: var(--bg);
    border-radius: 14px;
    margin-bottom: 1.25rem;
  }

  .wind-action.danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--bg) 100%);
  }

  .action-level {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--action-color);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .action-text {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0.25rem 0 0.75rem;
  }

  .action-tips {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .action-tips li { margin-bottom: 0.25rem; }

  /* Shelter Alert */
  .shelter-alert {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%);
    border: 2px solid #ef4444;
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1.25rem;
  }

  .shelter-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .shelter-icon { font-size: 1.5rem; }

  .shelter-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #ef4444;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .shelter-body p {
    margin: 0 0 0.35rem;
    font-size: 0.9rem;
  }

  .shelter-reason {
    font-style: italic;
    color: var(--muted);
    font-size: 0.85rem !important;
  }

  /* Wind Matrix */
  .wind-matrix {
    margin-bottom: 1.25rem;
  }

  .matrix-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  .matrix-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .matrix-row {
    display: grid;
    grid-template-columns: 100px 70px 1fr;
    gap: 0.5rem;
    padding: 0.6rem 0.85rem;
    background: var(--bg);
    border-radius: 8px;
    font-size: 0.85rem;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .matrix-row.active {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.15);
  }


  .matrix-row.trigger { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); }
  .matrix-row.trigger.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); }
  .matrix-row.severe { background: rgba(220, 38, 38, 0.1); }
  .matrix-row.severe.active { border-color: #dc2626; }

  .m-speed { font-weight: 600; }
  .m-cond { color: var(--muted); }
  .m-action { font-weight: 600; }

  /* Tent Tips */
  .tent-tips {
    background: var(--bg);
    border-radius: 12px;
    padding: 1rem;
  }

  .tips-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .tip-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #fff;
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .tip-icon { font-size: 1rem; }

  .wind-rule {
    text-align: center;
    font-size: 0.9rem;
    color: #ef4444;
    margin: 0;
  }



  /* Pressure Panel */
  .pressure-panel {
    background: var(--bg);
    border-radius: 12px;
    padding: 1rem;
  }

  .panel-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    text-transform: uppercase;
  }

  .panel-note {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0 0 0.75rem;
  }

  .pressure-rows {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .p-row {
    display: grid;
    grid-template-columns: 90px 80px 1fr;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border-radius: 6px;
    border-left: 4px solid var(--p-color);
    font-size: 0.8rem;
  }

  .p-drift { font-weight: 600; }
  .p-time { color: var(--muted); }
  .p-desc { color: var(--ink); }

  .pressure-warn {
    font-size: 0.8rem;
    color: #ef4444;
    margin: 0;
  }

  /* Rain Section */
  .rain-header {
    text-align: center;
    margin-bottom: 1.25rem;
  }

  .rain-title {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    text-transform: uppercase;
  }

  .rain-sub {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0;
  }

  .phase-row {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
    margin-bottom: 1.25rem;
  }

  .phase-box {
    flex: 1;
    padding: 1rem;
    border-radius: 14px;
  }

  .phase-box.wet {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
    border: 2px solid rgba(59, 130, 246, 0.3);
  }

  .phase-box.dry {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%);
    border: 2px solid rgba(34, 197, 94, 0.3);
  }

  .phase-arrow {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    color: var(--muted);
  }

  .phase-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .phase-icon { font-size: 1.25rem; }

  .phase-name {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .phase-steps {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8rem;
  }

  .phase-steps li { margin-bottom: 0.35rem; }

  .phase-note {
    font-size: 0.75rem;
    font-style: italic;
    color: var(--muted);
    margin: 0.5rem 0 0;
  }

  .morning-box {
    background: var(--bg);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .morning-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .morning-steps {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .morning-steps li { margin-bottom: 0.25rem; }

  .morning-note {
    font-size: 0.8rem;
    font-style: italic;
    color: #22c55e;
    font-weight: 600;
    margin: 0.75rem 0 0;
  }

  .rain-principles {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
  }

  .principles-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .principles-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .principles-list li { margin-bottom: 0.35rem; }

  /* Daylight Section */
  .dl-controls {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .dl-field.mile { grid-column: span 1; }

  .date-input {
    width: 100%;
    padding: 0.5rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .date-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .sun-display {
    background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    color: #fff;
  }

  .sun-times {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .sun-time { text-align: center; }

  .sun-label {
    display: block;
    font-size: 0.7rem;
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }

  .sun-val {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .sun-center {
    text-align: center;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .sun-hours {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .sun-unit {
    display: block;
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }

  .sun-quality {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 0.35rem;
  }

  .solar-arc {
    display: flex;
    height: 24px;
    border-radius: 12px;
    overflow: hidden;
  }

  .arc-night {
    background: #1e293b;
    transition: width 0.3s ease;
  }

  .arc-day {
    background: linear-gradient(90deg, #f97316, #fbbf24, #f97316);
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
    transition: width 0.3s ease;
  }

  .arc-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
    font-size: 0.6rem;
    opacity: 0.5;
  }

  .dl-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .dl-stat {
    text-align: center;
    padding: 1rem;
    background: var(--bg);
    border-radius: 12px;
  }

  .dl-stat.highlight {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.2) 0%, rgba(166, 181, 137, 0.1) 100%);
    border: 2px solid var(--alpine);
  }

  .stat-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .stat-val {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .stat-note {
    display: block;
    font-size: 0.65rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .terrain-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.85rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
    border-radius: 10px;
    font-size: 0.9rem;
    color: #ef4444;
  }

  .terrain-icon { font-size: 1.25rem; }

  /* Guide Links */
  .guide-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 200px;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .field-guide-link {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .link-icon { font-size: 1.25rem; }

  .link-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .link-arrow { transform: translateX(4px); }

  /* Responsive */
  @media (max-width: 640px) {
    .wx-nav { flex-wrap: wrap; gap: 0.5rem; }
    .nav-tab {
      flex: 0 0 calc(33.33% - 0.35rem);
      padding: 0.75rem 0.35rem;
      min-height: 60px;
    }
    .tab-label { font-size: 0.65rem; }
    .tab-icon { font-size: 1.25rem; }

    .thermometer-visual { gap: 0.5rem; }
    .thermo-tube { height: 80px; }
    .thermo-reading { font-size: 1.25rem; }

    .chill-grid { grid-template-columns: repeat(3, 1fr); }
    .tips-grid { grid-template-columns: 1fr; }

    .phase-row { flex-direction: column; }
    .phase-arrow { transform: rotate(90deg); justify-content: center; }

    .matrix-row { grid-template-columns: 1fr; gap: 0.25rem; }
    .p-row { grid-template-columns: 1fr; gap: 0.15rem; }

    .dl-controls { grid-template-columns: 1fr; }
    .sun-times { flex-direction: column; gap: 0.75rem; }
    .sun-center { width: 100%; }
    .dl-stats { grid-template-columns: 1fr; }

    .num-input { min-height: 44px; }
  }
</style>
