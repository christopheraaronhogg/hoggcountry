<script>
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';

  let { trailContext = {} } = $props();

  // Active section
  let activeSection = $state('temp');

  // Temperature calculator inputs
  let townTemp = $state(35);
  let elevationGain = $state(3000);
  let windSpeed = $state(15);

  // Current mile (for heat zone)
  let currentMile = $state(trailContext?.currentMile || 500);

  $effect(() => {
    if (trailContext?.currentMile !== undefined) {
      currentMile = trailContext.currentMile;
    }
  });

  // Weather warning checkboxes (2-out-of-5 rule)
  let warnings = $state({
    pressureDropping: false,
    windIncreasing: false,
    cloudsThickening: false,
    forecastWorsens: false,
    tempDropping: false,
  });

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

  // Heat zone based on mile
  let heatZone = $derived.by(() => {
    if (currentMile < 600) {
      return {
        phase: 'pre-heat',
        name: 'Before Heat',
        color: '#22c55e',
        desc: 'Cold/cool conditions. Focus on layering and staying warm.',
        tips: ['Layer management is key', 'Cold mornings common', 'Watch for ice/frost'],
      };
    }
    if (currentMile < 700) {
      return {
        phase: 'onset',
        name: 'Heat Onset',
        color: '#fbbf24',
        desc: 'Heat begins. Daytime highs in 70s-80s. Humidity increases.',
        tips: ['Start hydration discipline', 'Early morning hiking helps', 'Electrolytes become important'],
        dates: 'April 20 - May 10',
      };
    }
    if (currentMile < 900) {
      return {
        phase: 'building',
        name: 'Heat Building',
        color: '#f97316',
        desc: 'Summer conditions establishing. Consistent heat and humidity.',
        tips: ['Mandatory water planning', 'Shade breaks help', 'Sweat management critical'],
      };
    }
    if (currentMile < 1450) {
      return {
        phase: 'worst',
        name: 'PEAK HEAT',
        color: '#ef4444',
        desc: 'Most demanding heat stretch. Green tunnel traps heat. Hot sticky nights.',
        tips: ['Early starts essential', 'Consistent hydration', 'Electrolytes mandatory', 'Controlled pacing', 'Shade management'],
        dates: 'Late May - Early August',
        warning: true,
      };
    }
    if (currentMile < 1750) {
      return {
        phase: 'taper',
        name: 'Heat Tapering',
        color: '#fbbf24',
        desc: 'Heat easing. Cooler nights. Fewer oppressive days.',
        tips: ['Heat still present but manageable', 'Focus shifts to terrain', 'Whites approaching'],
        dates: 'Mid - Late August',
      };
    }
    return {
      phase: 'post-heat',
      name: 'Post Heat',
      color: '#22c55e',
      desc: 'Heat no longer primary challenge. Focus on cold weather prep for Maine.',
      tips: ['Watch for cold snaps', 'Prepare for Whites/Maine', 'Variable conditions'],
    };
  });

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
        warning: true,
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
          warning: true,
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
      warning: true,
    };
  });

  // Warning count for 2-out-of-5 rule
  let warningCount = $derived(Object.values(warnings).filter(Boolean).length);
  let warningTriggered = $derived(warningCount >= 2);

  const warningInfo = {
    pressureDropping: { icon: '📉', text: 'Pressure dropping (elevation drift on watch)' },
    windIncreasing: { icon: '💨', text: 'Wind increasing or shifting' },
    cloudsThickening: { icon: '☁️', text: 'Clouds thickening or lowering' },
    forecastWorsens: { icon: '📱', text: 'Garmin/phone forecast worsens' },
    tempDropping: { icon: '🌡️', text: 'Sudden temperature drop' },
  };

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

  // Daylight calculator
  let dlDate = $state(new Date().toISOString().split('T')[0]);
  let dlMile = $state(trailContext?.currentMile || 500);
  let targetMiles = $state(15);

  $effect(() => {
    if (trailContext?.currentMile !== undefined) dlMile = trailContext.currentMile;
  });

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
      <p class="wx-subtitle">Temperature • Heat Zones • Wind • Warnings</p>
    </div>
    {#if warningTriggered}
      <div class="wx-alert-banner">
        <span class="alert-pulse"></span>
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">{warningCount}/5 WARNINGS ACTIVE</span>
      </div>
    {/if}
  </header>

  <!-- Navigation Tabs -->
  <nav class="wx-nav">
    <button class="nav-tab" class:active={activeSection === 'temp'} onclick={() => activeSection = 'temp'}>
      <span class="tab-icon">🌡️</span>
      <span class="tab-label">Temp</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'heat'} onclick={() => activeSection = 'heat'}>
      <span class="tab-icon">🔥</span>
      <span class="tab-label">Heat</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'wind'} onclick={() => activeSection = 'wind'}>
      <span class="tab-icon">💨</span>
      <span class="tab-label">Wind</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'warning'} class:alert={warningTriggered} onclick={() => activeSection = 'warning'}>
      <span class="tab-icon">{warningTriggered ? '🚨' : '📡'}</span>
      <span class="tab-label">Warn</span>
      {#if warningTriggered}<span class="tab-dot"></span>{/if}
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

  <!-- Heat Zone Section -->
  {#if activeSection === 'heat'}
    <section class="wx-section" transition:fade>
      <div class="mile-control">
        <div class="mile-header">
          <label class="field-label">Current Mile</label>
          <span class="mile-number">{currentMile}</span>
        </div>
        <input type="range" bind:value={currentMile} min="0" max="2198" class="mile-slider" />
        <div class="mile-track">
          <div class="track-progress" style="width: {(currentMile / 2198) * 100}%"></div>
          <div class="track-marker" style="left: {(currentMile / 2198) * 100}%"></div>
        </div>
        <div class="mile-labels">
          <span>GA</span>
          <span style="left: {(600/2198)*100}%">600</span>
          <span style="left: {(1450/2198)*100}%">1450</span>
          <span>ME</span>
        </div>
      </div>

      <div class="heat-card" class:danger={heatZone.warning} style="--zone-color: {heatZone.color}">
        <div class="heat-header">
          <span class="heat-badge" style="background: {heatZone.color}">{heatZone.phase}</span>
          <span class="heat-name">{heatZone.name}</span>
        </div>
        <p class="heat-desc">{heatZone.desc}</p>
        {#if heatZone.dates}
          <div class="heat-dates">📅 {heatZone.dates}</div>
        {/if}
        <ul class="heat-tips">
          {#each heatZone.tips as tip}
            <li>{tip}</li>
          {/each}
        </ul>
      </div>

      <div class="heat-timeline">
        <div class="timeline-title">Heat Timeline (Feb NOBO)</div>
        <div class="timeline-bar">
          <div class="tl-seg cold" style="width: {(600/2198)*100}%"><span>Cold</span></div>
          <div class="tl-seg onset" style="width: {((700-600)/2198)*100}%"></div>
          <div class="tl-seg build" style="width: {((900-700)/2198)*100}%"></div>
          <div class="tl-seg peak" style="width: {((1450-900)/2198)*100}%"><span>PEAK</span></div>
          <div class="tl-seg taper" style="width: {((1750-1450)/2198)*100}%"></div>
          <div class="tl-seg post" style="width: {((2198-1750)/2198)*100}%"><span>Post</span></div>
          <div class="tl-needle" style="left: {(currentMile/2198)*100}%"></div>
        </div>
      </div>

      <div class="truth-box">
        <h4 class="truth-title">Strategic Truth</h4>
        <ul class="truth-list">
          <li>A February NOBO cannot avoid summer heat</li>
          <li>You hit heat with strong legs and lower injury risk</li>
          <li>The worst heat is predictable and finite</li>
          <li>You exit oppressive heat before September</li>
        </ul>
      </div>
    </section>
  {/if}

  <!-- Wind Section -->
  {#if activeSection === 'wind'}
    <section class="wx-section" transition:fade>
      <div class="wind-hero">
        <div class="wind-gauge">
          <svg viewBox="0 0 200 120" class="gauge-svg">
            <defs>
              <linearGradient id="windGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#22c55e" />
                <stop offset="40%" stop-color="#fbbf24" />
                <stop offset="70%" stop-color="#f97316" />
                <stop offset="100%" stop-color="#ef4444" />
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="16" stroke-linecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#windGrad)" stroke-width="16" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="{251 - (windSpeed / 50) * 251}" />
            <circle cx="{20 + (windSpeed / 50) * 160}" cy="{100 - Math.sin(Math.acos((windSpeed / 50) * 2 - 1)) * 80}" r="12" fill="#fff" stroke="{windAction.color}" stroke-width="4" />
          </svg>
          <div class="gauge-reading">
            <span class="gauge-value" style="color: {windAction.color}">{windSpeed}</span>
            <span class="gauge-unit">mph</span>
          </div>
        </div>
        <input type="range" bind:value={windSpeed} min="0" max="50" step="5" class="wind-slider" />
      </div>

      <div class="wind-action" class:danger={windAction.warning} style="--action-color: {windAction.color}">
        <div class="action-level">{windAction.level.toUpperCase()}</div>
        <div class="action-text">{windAction.action}</div>
        <ul class="action-tips">
          {#each windAction.tips as tip}
            <li>{tip}</li>
          {/each}
        </ul>
      </div>

      {#if windAction.trigger}
        <div class="shelter-alert">
          <div class="shelter-header">
            <span class="shelter-icon">🏠</span>
            <span class="shelter-title">SHELTER TRIGGER ACTIVE</span>
          </div>
          <div class="shelter-body">
            <p><strong>Wind + Cold combination detected</strong></p>
            <p>Summit temp {summitTemp.toFixed(0)}°F + {windSpeed} mph wind</p>
            <p class="shelter-reason">Tent setup is dangerous when hands fail fast. Shelter reduces complexity.</p>
          </div>
        </div>
      {/if}

      <div class="wind-matrix">
        <div class="matrix-title">Wind + Temperature Matrix</div>
        <div class="matrix-grid">
          <div class="matrix-row" class:active={windSpeed < 10}>
            <span class="m-speed">0-10 mph</span>
            <span class="m-cond">Any temp</span>
            <span class="m-action" style="color: #22c55e">Either OK</span>
          </div>
          <div class="matrix-row" class:active={windSpeed >= 10 && windSpeed < 20 && summitTemp > 35}>
            <span class="m-speed">10-20 mph</span>
            <span class="m-cond">Warm</span>
            <span class="m-action" style="color: #fbbf24">Tent OK</span>
          </div>
          <div class="matrix-row" class:active={windSpeed >= 10 && windSpeed < 20 && summitTemp <= 35}>
            <span class="m-speed">10-20 mph</span>
            <span class="m-cond">Cool</span>
            <span class="m-action" style="color: #fbbf24">Watch temp</span>
          </div>
          <div class="matrix-row" class:active={windSpeed >= 20 && windSpeed < 30 && summitTemp > 35}>
            <span class="m-speed">20-30 mph</span>
            <span class="m-cond">Warm</span>
            <span class="m-action" style="color: #f97316">Protected site</span>
          </div>
          <div class="matrix-row warning" class:active={windSpeed >= 20 && windSpeed < 30 && summitTemp <= 35}>
            <span class="m-speed">20-30 mph</span>
            <span class="m-cond">Cool</span>
            <span class="m-action" style="color: #f97316">Lean SHELTER</span>
          </div>
          <div class="matrix-row trigger" class:active={windSpeed >= 15 && summitTemp <= 25}>
            <span class="m-speed">15+ + ≤25°F</span>
            <span class="m-cond">TRIGGER</span>
            <span class="m-action" style="color: #ef4444">SHELTER</span>
          </div>
          <div class="matrix-row severe" class:active={windSpeed >= 30}>
            <span class="m-speed">30+ mph</span>
            <span class="m-cond">Any</span>
            <span class="m-action" style="color: #dc2626">SEEK COVER</span>
          </div>
        </div>
      </div>

      <div class="tent-tips">
        <h4 class="tips-title">🎪 Tent Setup in Wind</h4>
        <div class="tips-grid">
          <div class="tip-card">
            <span class="tip-icon">🧭</span>
            <span class="tip-text">Narrow end INTO wind</span>
          </div>
          <div class="tip-card">
            <span class="tip-icon">📐</span>
            <span class="tip-text">Stakes 30-45° away</span>
          </div>
          <div class="tip-card">
            <span class="tip-icon">🔧</span>
            <span class="tip-text">Windward corners FIRST</span>
          </div>
          <div class="tip-card">
            <span class="tip-icon">⬇️</span>
            <span class="tip-text">High wind = LOW pitch</span>
          </div>
        </div>
        <p class="wind-rule"><strong>Wind + Cold = SHELTER (setup danger)</strong></p>
      </div>
    </section>
  {/if}

  <!-- Warning Section -->
  {#if activeSection === 'warning'}
    <section class="wx-section" transition:fade>
      <div class="warning-intro">
        <h3 class="warning-title">2-Out-of-5 Rule</h3>
        <p class="warning-sub">If ANY TWO occur together, act conservatively</p>
      </div>

      <div class="warning-counter" class:triggered={warningTriggered}>
        <span class="counter-num">{warningCount}</span>
        <span class="counter-of">/5</span>
        <span class="counter-status">{warningTriggered ? 'ACT NOW' : 'monitoring'}</span>
      </div>

      <div class="warning-list">
        {#each Object.entries(warnings) as [key, value]}
          {@const info = warningInfo[key]}
          <button class="warning-item" class:checked={value} onclick={() => warnings[key] = !warnings[key]}>
            <span class="item-check">{value ? '✓' : ''}</span>
            <span class="item-icon">{info.icon}</span>
            <span class="item-text">{info.text}</span>
          </button>
        {/each}
      </div>

      {#if warningTriggered}
        <div class="warning-banner" transition:slide>
          <span class="banner-icon">🚨</span>
          <div class="banner-content">
            <strong>Weather likely incoming</strong>
            <p>Adjust plans: earlier stop, lower elevation, more protection</p>
          </div>
        </div>
      {/if}

      <div class="pressure-panel">
        <h4 class="panel-title">📊 Pressure Reading</h4>
        <p class="panel-note">Watch elevation while stopped — drift indicates pressure change</p>
        <div class="pressure-rows">
          {#each pressurePatterns as p}
            <div class="p-row" style="--p-color: {p.color}">
              <span class="p-drift">{p.drift}</span>
              <span class="p-time">{p.time}</span>
              <span class="p-desc">{p.desc}</span>
            </div>
          {/each}
        </div>
        <p class="pressure-warn"><strong>Never evaluate pressure while hiking</strong></p>
      </div>
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

  <!-- Guide Link -->
  <a href="/guide/12-weather-strategy" class="guide-link">
    <span class="link-icon">📖</span>
    <span class="link-text">Full Weather Strategy Guide</span>
    <span class="link-arrow">→</span>
  </a>
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

  .wx-alert-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
    margin-top: 1rem;
    padding: 0.6rem 1rem;
    background: rgba(239, 68, 68, 0.9);
    border-radius: 10px;
  }

  .alert-pulse {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #fff;
    border-radius: 10px 0 0 10px;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .alert-icon { font-size: 1rem; }

  .alert-text {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
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

  .nav-tab.alert {
    border-color: #ef4444;
  }

  .nav-tab.alert.active {
    background: #ef4444;
    border-color: #ef4444;
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

  .tab-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: pulse 1s ease-in-out infinite;
  }

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

  /* Heat Section */
  .mile-control {
    margin-bottom: 1.5rem;
  }

  .mile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .mile-number {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .mile-slider {
    width: 100%;
    height: 10px;
    -webkit-appearance: none;
    background: transparent;
    margin-bottom: 0.5rem;
    position: relative;
    z-index: 2;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    margin-top: -7px;
  }

  .mile-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
  }

  .mile-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .mile-track {
    position: relative;
    height: 10px;
    background: linear-gradient(90deg, #22c55e 0%, #22c55e 27%, #fbbf24 27%, #fbbf24 32%, #f97316 32%, #f97316 41%, #ef4444 41%, #ef4444 66%, #fbbf24 66%, #fbbf24 80%, #22c55e 80%);
    border-radius: 5px;
    margin-top: -20px;
    z-index: 1;
    pointer-events: none;
  }

  .track-progress {
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
  }

  .track-marker {
    position: absolute;
    top: -3px;
    width: 4px;
    height: 16px;
    background: var(--ink);
    border-radius: 2px;
    transform: translateX(-50%);
  }

  .mile-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.6rem;
    color: var(--muted);
    position: relative;
  }

  .mile-labels span:not(:first-child):not(:last-child) {
    position: absolute;
    transform: translateX(-50%);
  }

  .heat-card {
    padding: 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-left: 5px solid var(--zone-color);
    border-radius: 14px;
    margin-bottom: 1.25rem;
    transition: all 0.2s ease;
  }

  .heat-card.danger {
    border-color: var(--zone-color);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, #fff 100%);
    animation: heat-glow 2s ease-in-out infinite;
  }

  @keyframes heat-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    50% { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.15); }
  }

  .heat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .heat-badge {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    color: #fff;
    letter-spacing: 0.05em;
  }

  .heat-name {
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--ink);
  }

  .heat-desc {
    font-size: 0.9rem;
    color: var(--ink);
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }

  .heat-dates {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  .heat-tips {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .heat-tips li { margin-bottom: 0.3rem; }

  /* Heat Timeline */
  .heat-timeline {
    margin-bottom: 1.25rem;
  }

  .timeline-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .timeline-bar {
    display: flex;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .tl-seg {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.55rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #fff;
  }

  .tl-seg.cold { background: #22c55e; }
  .tl-seg.onset { background: #fbbf24; }
  .tl-seg.build { background: #f97316; }
  .tl-seg.peak { background: #ef4444; }
  .tl-seg.taper { background: #fbbf24; }
  .tl-seg.post { background: #22c55e; }

  .tl-needle {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 4px;
    background: var(--ink);
    border-radius: 2px;
    transform: translateX(-50%);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
  }

  .truth-box {
    background: var(--bg);
    border-radius: 12px;
    padding: 1rem;
  }

  .truth-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .truth-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .truth-list li { margin-bottom: 0.3rem; }

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

  .matrix-row.warning { background: rgba(249, 115, 22, 0.1); }
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

  /* Warning Section */
  .warning-intro {
    text-align: center;
    margin-bottom: 1rem;
  }

  .warning-title {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    text-transform: uppercase;
  }

  .warning-sub {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0;
  }

  .warning-counter {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    padding: 1.25rem;
    background: var(--bg);
    border-radius: 14px;
    margin-bottom: 1rem;
    border: 2px solid transparent;
  }

  .warning-counter.triggered {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }

  .counter-num {
    font-family: Oswald, sans-serif;
    font-size: 3.5rem;
    font-weight: 700;
    color: var(--alpine);
    line-height: 1;
  }

  .warning-counter.triggered .counter-num { color: #ef4444; }

  .counter-of {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    color: var(--muted);
  }

  .counter-status {
    margin-left: 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted);
  }

  .warning-counter.triggered .counter-status { color: #ef4444; }

  .warning-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .warning-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .warning-item:hover { border-color: var(--alpine); }

  .warning-item.checked {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }

  .item-check {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 6px;
    font-weight: bold;
    color: #ef4444;
  }

  .warning-item.checked .item-check {
    background: #ef4444;
    border-color: #ef4444;
    color: #fff;
  }

  .item-icon { font-size: 1.25rem; }
  .item-text { font-size: 0.9rem; color: var(--ink); flex: 1; }

  .warning-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
    border-radius: 14px;
    margin-bottom: 1rem;
  }

  .banner-icon { font-size: 2rem; }
  .banner-content strong { color: #ef4444; }
  .banner-content p { margin: 0.25rem 0 0; font-size: 0.85rem; }

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

  /* Guide Link */
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
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
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
