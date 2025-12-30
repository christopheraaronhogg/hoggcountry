<script>
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';

  let { trailContext = {} } = $props();

  // Active section
  let activeSection = $state('temp'); // 'temp', 'heat', 'wind', 'warning', 'rain', 'daylight'

  // Temperature calculator inputs
  let townTemp = $state(35);
  let elevationGain = $state(3000);
  let windSpeed = $state(15);

  // Current mile (for heat zone)
  let currentMile = $state(trailContext?.currentMile || 500);

  // Update currentMile when trailContext changes
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
    // Simplified wind chill approximation
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
        color: 'var(--alpine)',
        desc: 'Cold/cool conditions. Focus on layering and staying warm.',
        tips: ['Layer management is key', 'Cold mornings common', 'Watch for ice/frost'],
      };
    }
    if (currentMile < 700) {
      return {
        phase: 'onset',
        name: 'Heat Onset',
        color: 'var(--marker)',
        desc: 'Heat begins. Daytime highs in 70s-80s. Humidity increases.',
        tips: ['Start hydration discipline', 'Early morning hiking helps', 'Electrolytes become important'],
        dates: 'April 20 - May 10',
      };
    }
    if (currentMile < 900) {
      return {
        phase: 'building',
        name: 'Heat Building',
        color: '#e67e22',
        desc: 'Summer conditions establishing. Consistent heat and humidity.',
        tips: ['Mandatory water planning', 'Shade breaks help', 'Sweat management critical'],
      };
    }
    if (currentMile < 1450) {
      return {
        phase: 'worst',
        name: 'PEAK HEAT',
        color: 'var(--terra)',
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
        color: 'var(--marker)',
        desc: 'Heat easing. Cooler nights. Fewer oppressive days.',
        tips: ['Heat still present but manageable', 'Focus shifts to terrain', 'Whites approaching'],
        dates: 'Mid - Late August',
      };
    }
    return {
      phase: 'post-heat',
      name: 'Post Heat',
      color: 'var(--alpine)',
      desc: 'Heat no longer primary challenge. Focus on cold weather prep for Maine.',
      tips: ['Watch for cold snaps', 'Prepare for Whites/Maine', 'Variable conditions'],
    };
  });

  // Wind action based on speed AND temperature (guide trigger: cold + wind = shelter)
  let windAction = $derived.by(() => {
    const isCold = summitTemp <= 25; // Guide threshold: ~25°F
    const isWindy = windSpeed >= 15; // Guide threshold: 15+ mph sustained

    // GUIDE TRIGGER: Wind + Cold = SHELTER (setup danger)
    if (isCold && isWindy) {
      return {
        level: 'shelter-trigger',
        action: 'SHELTER',
        color: 'var(--terra)',
        tips: [
          'Wind + Cold trigger activated',
          'Tent setup dangerous — hands fail fast',
          'Shelter reduces complexity',
          'Walk in, drop pack, done'
        ],
        warning: true,
        trigger: true,
      };
    }

    // Light wind (0-10 mph) — either option fine
    if (windSpeed < 10) {
      return {
        level: 'light',
        action: 'Shelter or Tent OK',
        color: 'var(--alpine)',
        tips: ['Normal camping conditions', 'Either option fine'],
      };
    }

    // Moderate wind (10-20 mph)
    if (windSpeed < 20) {
      if (summitTemp <= 35) {
        // Cool + moderate wind — caution
        return {
          level: 'moderate',
          action: 'Tent OK (watch temp)',
          color: 'var(--marker)',
          tips: [
            'Find wind-protected site',
            'If temp drops below 25°F → shelter trigger',
            'Have shelter backup plan'
          ],
        };
      }
      // Warm + moderate wind — tent is fine
      return {
        level: 'moderate',
        action: 'Tent OK',
        color: 'var(--marker)',
        tips: ['Wind is cooling in warm temps', 'Choose protected terrain', 'Tent gives control'],
      };
    }

    // Strong wind (20-30 mph)
    if (windSpeed < 30) {
      if (summitTemp <= 35) {
        // Cool + strong wind — strongly consider shelter
        return {
          level: 'strong',
          action: 'Lean SHELTER',
          color: '#e67e22',
          tips: [
            'Near cold+wind trigger threshold',
            'Setup will be very difficult',
            'Shelter strongly recommended'
          ],
          warning: true,
        };
      }
      // Warm + strong wind — tent in protected terrain
      return {
        level: 'strong',
        action: 'TENT — Protected terrain',
        color: '#e67e22',
        tips: ['Below ridges', 'Dense trees', 'Use all stakes', 'Low pitch'],
      };
    }

    // Severe (30+ mph) — always seek cover
    return {
      level: 'severe',
      action: 'SEEK COVER',
      color: '#c0392b',
      tips: ['Do not camp exposed', 'Shelter or bail to lower elevation', 'Emergency conditions'],
      warning: true,
    };
  });

  // Warning count for 2-out-of-5 rule
  let warningCount = $derived(Object.values(warnings).filter(Boolean).length);
  let warningTriggered = $derived(warningCount >= 2);

  // Warning info
  const warningInfo = {
    pressureDropping: { icon: '📉', text: 'Pressure dropping (elevation drift on watch)' },
    windIncreasing: { icon: '💨', text: 'Wind increasing or shifting' },
    cloudsThickening: { icon: '☁️', text: 'Clouds thickening or lowering' },
    forecastWorsens: { icon: '📱', text: 'Garmin/phone forecast worsens' },
    tempDropping: { icon: '🌡️', text: 'Sudden temperature drop' },
  };

  // Pressure interpretation
  const pressurePatterns = [
    { drift: '±3-5 ft', time: 'settles quickly', status: 'stable', desc: 'Normal — Weather stable', color: 'var(--alpine)' },
    { drift: '10-20 ft drop', time: '3-6 hours', status: 'caution', desc: 'Caution — Weather in 12-24 hrs', color: 'var(--marker)' },
    { drift: '20-30+ ft drop', time: '1-3 hours', status: 'danger', desc: 'Danger — Weather imminent', color: 'var(--terra)' },
  ];

  // Get temp color
  function getTempColor(temp) {
    if (temp <= 10) return 'var(--terra)';
    if (temp <= 25) return '#e67e22';
    if (temp <= 40) return 'var(--marker)';
    if (temp <= 55) return 'var(--alpine)';
    return 'var(--pine)';
  }

  // ========== DAYLIGHT CALCULATOR ==========
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
  let dayQualityColor = $derived(sunTimes.daylightHours >= 14 ? '#22c55e' : sunTimes.daylightHours >= 12 ? 'var(--alpine)' : sunTimes.daylightHours >= 10 ? 'var(--terra)' : '#6b8cae');

  let terrainMultiplier = $derived((dlMile > 1750 && dlMile < 1912) ? 0.6 : 1.0);
  let maxMilesNormal = $derived(hikingHours * 2.5 * terrainMultiplier);

  let startPct = $derived((sunTimes.sunriseHours / 24) * 100);
  let endPct = $derived((sunTimes.sunsetHours / 24) * 100);
  let dayPct = $derived(endPct - startPct);
</script>

<div class="weather-assessor">
  <!-- Header -->
  <div class="assessor-header">
    <div class="header-content">
      <h2 class="tool-title">Weather Assessor</h2>
      <p class="tool-desc">Temperature, heat zones, wind, and warnings</p>
    </div>
    {#if warningTriggered}
      <div class="header-warning" transition:fade>
        <span class="hw-icon">⚠️</span>
        <span class="hw-text">{warningCount}/5 warnings</span>
      </div>
    {/if}
  </div>

  <!-- Section Tabs -->
  <div class="section-tabs">
    <button class="stab" class:active={activeSection === 'temp'} onclick={() => activeSection = 'temp'}>
      <span class="stab-icon">🌡️</span>
      <span class="stab-text">Temp</span>
    </button>
    <button class="stab" class:active={activeSection === 'heat'} onclick={() => activeSection = 'heat'}>
      <span class="stab-icon">🔥</span>
      <span class="stab-text">Heat Zone</span>
    </button>
    <button class="stab" class:active={activeSection === 'wind'} onclick={() => activeSection = 'wind'}>
      <span class="stab-icon">💨</span>
      <span class="stab-text">Wind</span>
    </button>
    <button class="stab" class:active={activeSection === 'warning'} class:alert={warningTriggered} onclick={() => activeSection = 'warning'}>
      <span class="stab-icon">{warningTriggered ? '🚨' : '📡'}</span>
      <span class="stab-text">Warnings</span>
    </button>
    <button class="stab" class:active={activeSection === 'rain'} onclick={() => activeSection = 'rain'}>
      <span class="stab-icon">🌧️</span>
      <span class="stab-text">Rain</span>
    </button>
    <button class="stab" class:active={activeSection === 'daylight'} onclick={() => activeSection = 'daylight'}>
      <span class="stab-icon">🌅</span>
      <span class="stab-text">Daylight</span>
    </button>
  </div>

  <!-- Temperature Section -->
  {#if activeSection === 'temp'}
    <div class="section temp-section" transition:fade>
      <div class="temp-result-card">
        <div class="temp-visual">
          <div class="temp-stack">
            <div class="temp-item town">
              <span class="ti-label">Town</span>
              <span class="ti-val">{townTemp}°F</span>
            </div>
            <div class="temp-arrow">
              <span>↓ -{tempDrop.toFixed(0)}°</span>
              <small>{elevationGain.toLocaleString()}' gain</small>
            </div>
            <div class="temp-item summit" style="--temp-color: {getTempColor(summitTemp)}">
              <span class="ti-label">Summit</span>
              <span class="ti-val">{summitTemp.toFixed(0)}°F</span>
            </div>
            {#if windSpeed >= 5}
              <div class="temp-arrow wind">
                <span>↓ wind</span>
                <small>{windSpeed} mph</small>
              </div>
              <div class="temp-item feels" style="--temp-color: {getTempColor(feelsLike)}">
                <span class="ti-label">Feels Like</span>
                <span class="ti-val">{feelsLike}°F</span>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <div class="temp-inputs">
        <div class="input-group">
          <label>Town Temperature</label>
          <div class="input-row">
            <input type="range" bind:value={townTemp} min="-10" max="90" class="temp-slider" />
            <input type="number" bind:value={townTemp} min="-10" max="90" class="temp-num" />
            <span class="input-unit">°F</span>
          </div>
        </div>

        <div class="input-group">
          <label>Elevation Gain to Summit</label>
          <div class="input-row">
            <input type="range" bind:value={elevationGain} min="0" max="5000" step="100" class="elev-slider" />
            <input type="number" bind:value={elevationGain} min="0" max="5000" step="100" class="temp-num" />
            <span class="input-unit">ft</span>
          </div>
        </div>

        <div class="input-group">
          <label>Expected Wind Speed</label>
          <div class="input-row">
            <input type="range" bind:value={windSpeed} min="0" max="50" step="5" class="wind-slider" />
            <input type="number" bind:value={windSpeed} min="0" max="50" step="5" class="temp-num" />
            <span class="input-unit">mph</span>
          </div>
        </div>
      </div>

      <div class="temp-rule">
        <span class="rule-icon">📐</span>
        <span class="rule-text">Worst-case: <strong>5.5°F colder per 1,000 ft</strong> of elevation gain</span>
      </div>

      <div class="wind-chill-table">
        <h4>Wind Chill Reference (at summit temp {summitTemp.toFixed(0)}°F)</h4>
        <div class="wc-grid">
          {#each [[5, 4], [10, 8], [15, 12], [20, 18]] as [wind, penalty]}
            <div class="wc-item" class:active={windSpeed >= wind && windSpeed < wind + 5}>
              <span class="wc-wind">{wind} mph</span>
              <span class="wc-feels">≈ {Math.round(summitTemp - penalty)}°F</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Heat Zone Section -->
  {#if activeSection === 'heat'}
    <div class="section heat-section" transition:fade>
      <div class="mile-input">
        <label>Current Mile</label>
        <div class="mile-row">
          <input type="range" bind:value={currentMile} min="0" max="2198" class="mile-slider" />
          <span class="mile-val">{currentMile}</span>
        </div>
        <div class="mile-bar">
          <div class="mile-fill" style="width: {(currentMile / 2198) * 100}%"></div>
          <div class="mile-markers">
            <span style="left: {(600/2198)*100}%">600</span>
            <span style="left: {(900/2198)*100}%">900</span>
            <span style="left: {(1450/2198)*100}%">1450</span>
            <span style="left: {(1750/2198)*100}%">1750</span>
          </div>
        </div>
      </div>

      <div class="heat-zone-card" class:warning={heatZone.warning} style="--zone-color: {heatZone.color}">
        <div class="hz-header">
          <span class="hz-phase">{heatZone.phase}</span>
          <span class="hz-name">{heatZone.name}</span>
        </div>
        <p class="hz-desc">{heatZone.desc}</p>
        {#if heatZone.dates}
          <span class="hz-dates">📅 {heatZone.dates}</span>
        {/if}
        <ul class="hz-tips">
          {#each heatZone.tips as tip}
            <li>{tip}</li>
          {/each}
        </ul>
      </div>

      <div class="heat-timeline">
        <h4>Heat Timeline (Feb 1 NOBO)</h4>
        <div class="timeline-track">
          <div class="tl-segment pre" style="width: {(600/2198)*100}%">
            <span>Cold</span>
          </div>
          <div class="tl-segment onset" style="width: {((700-600)/2198)*100}%">
            <span>Onset</span>
          </div>
          <div class="tl-segment build" style="width: {((900-700)/2198)*100}%">
            <span>Build</span>
          </div>
          <div class="tl-segment worst" style="width: {((1450-900)/2198)*100}%">
            <span>WORST</span>
          </div>
          <div class="tl-segment taper" style="width: {((1750-1450)/2198)*100}%">
            <span>Taper</span>
          </div>
          <div class="tl-segment post" style="width: {((2198-1750)/2198)*100}%">
            <span>Post</span>
          </div>
          <div class="tl-marker" style="left: {(currentMile/2198)*100}%"></div>
        </div>
      </div>

      <div class="heat-truth">
        <h4>Strategic Truth</h4>
        <ul>
          <li>A February NOBO cannot avoid summer heat</li>
          <li>You hit heat with strong legs and lower injury risk</li>
          <li>The worst heat is predictable and finite</li>
          <li>You exit oppressive heat before September</li>
        </ul>
      </div>
    </div>
  {/if}

  <!-- Wind Section -->
  {#if activeSection === 'wind'}
    <div class="section wind-section" transition:fade>
      <div class="wind-input">
        <label>Wind Speed</label>
        <div class="wind-row">
          <input type="range" bind:value={windSpeed} min="0" max="50" step="5" class="wind-range" />
          <div class="wind-display" style="--wind-color: {windAction.color}">
            <span class="wd-val">{windSpeed}</span>
            <span class="wd-unit">mph</span>
          </div>
        </div>
      </div>

      <div class="wind-action-card" class:warning={windAction.warning} style="--action-color: {windAction.color}">
        <div class="wa-level">{windAction.level.toUpperCase()}</div>
        <div class="wa-action">{windAction.action}</div>
        <ul class="wa-tips">
          {#each windAction.tips as tip}
            <li>{tip}</li>
          {/each}
        </ul>
      </div>

      <!-- Guide Shelter Trigger Alert -->
      {#if windAction.trigger}
        <div class="shelter-trigger-alert">
          <div class="sta-header">
            <span class="sta-icon">🏠</span>
            <span class="sta-title">SHELTER TRIGGER ACTIVE</span>
          </div>
          <div class="sta-body">
            <p><strong>Wind + Cold combination detected</strong></p>
            <p>Summit temp {summitTemp.toFixed(0)}°F + {windSpeed} mph wind</p>
            <p class="sta-reason">Tent setup is dangerous when hands fail fast. Shelter reduces complexity.</p>
          </div>
        </div>
      {/if}

      <div class="wind-table">
        <h4>Guide Logic: Wind + Temperature</h4>
        <div class="wt-grid">
          <div class="wt-row" class:active={windSpeed < 10}>
            <span class="wt-speed">0-10 mph</span>
            <span class="wt-label">Light</span>
            <span class="wt-action">Either OK (any temp)</span>
          </div>
          <div class="wt-row" class:active={windSpeed >= 10 && windSpeed < 20 && summitTemp > 35}>
            <span class="wt-speed">10-20 mph</span>
            <span class="wt-label">Moderate + Warm</span>
            <span class="wt-action">Tent OK</span>
          </div>
          <div class="wt-row" class:active={windSpeed >= 10 && windSpeed < 20 && summitTemp <= 35}>
            <span class="wt-speed">10-20 mph</span>
            <span class="wt-label">Moderate + Cool</span>
            <span class="wt-action">Tent OK (watch temp)</span>
          </div>
          <div class="wt-row" class:active={windSpeed >= 20 && windSpeed < 30 && summitTemp > 35}>
            <span class="wt-speed">20-30 mph</span>
            <span class="wt-label">Strong + Warm</span>
            <span class="wt-action">Tent — protected terrain</span>
          </div>
          <div class="wt-row caution" class:active={windSpeed >= 20 && windSpeed < 30 && summitTemp <= 35}>
            <span class="wt-speed">20-30 mph</span>
            <span class="wt-label">Strong + Cool</span>
            <span class="wt-action">Lean SHELTER</span>
          </div>
          <div class="wt-row trigger" class:active={windSpeed >= 15 && summitTemp <= 25}>
            <span class="wt-speed">15+ mph + ≤25°F</span>
            <span class="wt-label">TRIGGER</span>
            <span class="wt-action">SHELTER — setup danger</span>
          </div>
          <div class="wt-row severe" class:active={windSpeed >= 30}>
            <span class="wt-speed">30+ mph</span>
            <span class="wt-label">Severe</span>
            <span class="wt-action">Seek cover immediately</span>
          </div>
        </div>
      </div>

      <div class="wind-tips-card">
        <h4>🎪 Tent Setup in Wind (when appropriate)</h4>
        <div class="tips-grid">
          <div class="tip-item">
            <span class="tip-icon">🧭</span>
            <span class="tip-text">Narrow end INTO wind</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">📐</span>
            <span class="tip-text">Stakes 30-45° away from tent</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🔧</span>
            <span class="tip-text">Windward corners FIRST</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">⬇️</span>
            <span class="tip-text">High wind = LOW pitch</span>
          </div>
        </div>
        <p class="wind-rule"><strong>Wind + Cold = SHELTER (setup danger)</strong></p>
      </div>
    </div>
  {/if}

  <!-- Warning Section -->
  {#if activeSection === 'warning'}
    <div class="section warning-section" transition:fade>
      <div class="warning-header">
        <h3>2-Out-of-5 Rule</h3>
        <p>If ANY TWO occur together, act conservatively</p>
      </div>

      <div class="warning-count" class:triggered={warningTriggered}>
        <span class="wc-num">{warningCount}</span>
        <span class="wc-of">/5</span>
        <span class="wc-status">{warningTriggered ? 'ACT NOW' : 'monitoring'}</span>
      </div>

      <div class="warning-checks">
        {#each Object.entries(warnings) as [key, value]}
          {@const info = warningInfo[key]}
          <button
            class="warning-btn"
            class:active={value}
            onclick={() => warnings[key] = !warnings[key]}
          >
            <span class="wb-check">{value ? '✓' : ''}</span>
            <span class="wb-icon">{info.icon}</span>
            <span class="wb-text">{info.text}</span>
          </button>
        {/each}
      </div>

      {#if warningTriggered}
        <div class="warning-alert" transition:slide>
          <span class="wa-icon">🚨</span>
          <div class="wa-content">
            <strong>Weather likely incoming</strong>
            <p>Adjust plans: earlier stop, lower elevation, more protection</p>
          </div>
        </div>
      {/if}

      <div class="pressure-card">
        <h4>📊 Pressure Reading (While Stopped)</h4>
        <p class="pressure-note">Watch elevation while stationary — drift indicates pressure change</p>
        <div class="pressure-table">
          {#each pressurePatterns as p}
            <div class="pr-row" style="--pr-color: {p.color}">
              <div class="pr-drift">{p.drift}</div>
              <div class="pr-time">{p.time}</div>
              <div class="pr-desc">{p.desc}</div>
            </div>
          {/each}
        </div>
        <p class="pressure-rule"><strong>Never evaluate pressure while hiking</strong> — elevation changes from walking mask weather signals</p>
      </div>
    </div>
  {/if}

  <!-- Rain Section -->
  {#if activeSection === 'rain'}
    <div class="section rain-section" transition:fade>
      <div class="rain-header">
        <h3>Multi-Day Rain Protocol</h3>
        <p>Operate in two phases: WET → DRY</p>
      </div>

      <div class="phase-cards">
        <div class="phase-card wet">
          <div class="pc-header">
            <span class="pc-icon">💦</span>
            <span class="pc-title">WET PHASE</span>
          </div>
          <ol class="pc-steps">
            <li><strong>Pitch tent FIRST</strong> — Do NOT open dry bags</li>
            <li><strong>Cook & eat</strong> — Outside or at vestibule, rain gear ON</li>
            <li><strong>Bear hang IMMEDIATELY</strong> — Before entering tent</li>
          </ol>
        </div>

        <div class="phase-arrow">→</div>

        <div class="phase-card dry">
          <div class="pc-header">
            <span class="pc-icon">✨</span>
            <span class="pc-title">DRY PHASE</span>
          </div>
          <ol class="pc-steps">
            <li>Enter tent, close door</li>
            <li>Strip wet clothes</li>
            <li>Put on dry sleep clothes</li>
            <li>Get into quilt</li>
          </ol>
          <p class="pc-note">If you forgot something outside — it waits</p>
        </div>
      </div>

      <div class="morning-card">
        <h4>☀️ Morning Reset (Continued Rain)</h4>
        <ol class="morning-steps">
          <li>Pack quilt + sleep clothes FIRST</li>
          <li>Seal them inside pack liner</li>
          <li>Put wet clothes back on</li>
          <li>Exit tent</li>
          <li>Retrieve food</li>
          <li>Eat, pack, hike</li>
        </ol>
        <p class="morning-note">You only endure the wet once per cycle</p>
      </div>

      <div class="rain-principles">
        <h4>Core Principles</h4>
        <ul>
          <li><strong>Rain alone is manageable</strong> — Wind + rain is the threat</li>
          <li><strong>Sleep system must stay dry</strong> at all costs</li>
          <li><strong>Decisions made early</strong>, not at dark</li>
          <li><strong>Stay warm by movement</strong>, not by stopping</li>
        </ul>
      </div>
    </div>
  {/if}

  <!-- Daylight Section -->
  {#if activeSection === 'daylight'}
    <div class="section daylight-section" transition:fade>
      <div class="dl-controls">
        <div class="dl-row">
          <div class="dl-input">
            <label>Date</label>
            <input type="date" bind:value={dlDate} class="dl-date" />
          </div>
          <div class="dl-input mile">
            <label>Mile {dlMile} • {dlLatitude.toFixed(1)}°N</label>
            <input type="range" bind:value={dlMile} min="0" max="2198" class="dl-slider" />
          </div>
        </div>
      </div>

      <div class="dl-hero">
        <div class="dl-times">
          <div class="dl-time">
            <span class="dl-label">Sunrise</span>
            <span class="dl-val">{sunTimes.sunrise || '--'}</span>
          </div>
          <div class="dl-daylight">
            <span class="dl-hours">{sunTimes.daylightHours?.toFixed(1) || '--'}</span>
            <span class="dl-unit">hrs daylight</span>
            <span class="dl-quality" style="color: {dayQualityColor}">{dayQuality}</span>
          </div>
          <div class="dl-time">
            <span class="dl-label">Sunset</span>
            <span class="dl-val">{sunTimes.sunset || '--'}</span>
          </div>
        </div>

        <div class="solar-bar">
          <div class="sb-night" style="width: {startPct}%"></div>
          <div class="sb-day" style="width: {dayPct}%"></div>
          <div class="sb-night" style="width: {100 - endPct}%"></div>
        </div>
        <div class="sb-labels">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
        </div>
      </div>

      <div class="dl-stats">
        <div class="dl-stat">
          <span class="ds-label">Safe Hiking</span>
          <span class="ds-val">{hikingHours} hrs</span>
          <span class="ds-note">30min buffer each side</span>
        </div>
        <div class="dl-stat highlight">
          <span class="ds-label">Max Miles</span>
          <span class="ds-val">{maxMilesNormal.toFixed(0)} mi</span>
          <span class="ds-note">@ 2.5 mph{terrainMultiplier < 1 ? ' (terrain adj)' : ''}</span>
        </div>
      </div>

      {#if terrainMultiplier < 1}
        <div class="terrain-note">
          <span class="tn-icon">⛰️</span>
          <span class="tn-text">White Mountains: Reduce planned mileage by 40-50%</span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/07-weather-strategy" class="guide-link">
    <span class="gl-icon">📖</span>
    <span class="gl-text">Read Full Chapter: Weather Strategy</span>
    <span class="gl-arrow">→</span>
  </a>
</div>

<style>
  .weather-assessor {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header */
  .assessor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, var(--pine) 0%, #3a4538 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    color: #fff;
  }

  .tool-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tool-desc {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }

  .header-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--terra);
    border-radius: 8px;
    animation: pulse 1s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from { opacity: 1; }
    to { opacity: 0.7; }
  }

  .hw-icon { font-size: 1.25rem; }
  .hw-text { font-family: Oswald, sans-serif; font-weight: 700; }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .stab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.6rem 0.4rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
  }

  .stab:hover { border-color: var(--alpine); color: var(--pine); }
  .stab.active { background: var(--pine); border-color: var(--pine); color: #fff; }
  .stab.alert { border-color: var(--terra); color: var(--terra); }
  .stab.alert.active { background: var(--terra); }

  .stab-icon { font-size: 1.1rem; }

  /* Sections */
  .section {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  /* Temperature Section */
  .temp-result-card {
    background: var(--bg);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .temp-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .temp-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 2rem;
    border-radius: 10px;
  }

  .temp-item.town {
    background: rgba(166, 181, 137, 0.2);
  }

  .temp-item.summit, .temp-item.feels {
    background: rgba(0,0,0,0.05);
    border: 2px solid var(--temp-color, var(--alpine));
  }

  .ti-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
  }

  .ti-val {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
  }

  .temp-item.summit .ti-val, .temp-item.feels .ti-val {
    color: var(--temp-color, var(--ink));
  }

  .temp-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .temp-arrow.wind {
    color: var(--pine);
  }

  .temp-arrow small {
    font-size: 0.7rem;
  }

  .temp-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .input-group label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .input-row input[type="range"] {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }

  .input-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: var(--pine);
    border-radius: 50%;
    cursor: grab;
  }

  .temp-num {
    width: 70px;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
  }

  .input-unit {
    font-size: 0.85rem;
    color: var(--muted);
    min-width: 25px;
  }

  .temp-rule {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(166, 181, 137, 0.1);
    border-radius: 8px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .rule-icon { font-size: 1.1rem; }

  .wind-chill-table h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    color: var(--muted);
  }

  .wc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .wc-item {
    text-align: center;
    padding: 0.5rem;
    background: var(--bg);
    border-radius: 6px;
    border: 1px solid transparent;
  }

  .wc-item.active {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.15);
  }

  .wc-wind {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .wc-feels {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
  }

  /* Heat Section */
  .mile-input {
    margin-bottom: 1.25rem;
  }

  .mile-input label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .mile-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mile-slider {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(to right, var(--alpine), var(--marker), var(--terra), var(--marker), var(--alpine));
    border-radius: 4px;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    cursor: grab;
  }

  .mile-val {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    min-width: 60px;
    text-align: right;
  }

  .mile-bar {
    position: relative;
    height: 6px;
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
    margin-top: 0.5rem;
  }

  .mile-fill {
    height: 100%;
    background: var(--pine);
    border-radius: 3px;
  }

  .mile-markers {
    position: absolute;
    top: 10px;
    left: 0;
    right: 0;
    font-size: 0.6rem;
    color: var(--muted);
  }

  .mile-markers span {
    position: absolute;
    transform: translateX(-50%);
  }

  .heat-zone-card {
    padding: 1.25rem;
    border-radius: 12px;
    border-left: 4px solid var(--zone-color, var(--alpine));
    background: rgba(166, 181, 137, 0.1);
    margin-bottom: 1.25rem;
  }

  .heat-zone-card.warning {
    background: rgba(201, 115, 58, 0.1);
    animation: heat-pulse 2s ease-in-out infinite;
  }

  @keyframes heat-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(201, 115, 58, 0); }
    50% { box-shadow: 0 0 15px 3px rgba(201, 115, 58, 0.2); }
  }

  .hz-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .hz-phase {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    background: var(--zone-color);
    color: #fff;
    border-radius: 4px;
  }

  .hz-name {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .hz-desc {
    font-size: 0.9rem;
    color: var(--ink);
    margin: 0 0 0.5rem 0;
  }

  .hz-dates {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .hz-tips {
    margin: 0.75rem 0 0 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .hz-tips li { margin-bottom: 0.25rem; }

  .heat-timeline h4, .heat-truth h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    color: var(--ink);
  }

  .timeline-track {
    display: flex;
    height: 28px;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
  }

  .tl-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #fff;
  }

  .tl-segment.pre { background: var(--alpine); }
  .tl-segment.onset { background: var(--marker); }
  .tl-segment.build { background: #e67e22; }
  .tl-segment.worst { background: var(--terra); }
  .tl-segment.taper { background: var(--marker); }
  .tl-segment.post { background: var(--alpine); }

  .tl-marker {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 3px;
    background: var(--ink);
    border-radius: 2px;
    transform: translateX(-50%);
  }

  .heat-truth {
    background: var(--bg);
    border-radius: 10px;
    padding: 1rem;
  }

  .heat-truth ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .heat-truth li { margin-bottom: 0.25rem; }

  /* Wind Section */
  .wind-input {
    margin-bottom: 1.25rem;
  }

  .wind-input label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .wind-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .wind-range {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(to right, var(--alpine), var(--marker), var(--terra));
    border-radius: 4px;
  }

  .wind-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: #fff;
    border: 3px solid var(--wind-color, var(--pine));
    border-radius: 50%;
    cursor: grab;
  }

  .wind-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background: var(--bg);
    border: 2px solid var(--wind-color, var(--alpine));
    border-radius: 8px;
  }

  .wd-val {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--wind-color);
  }

  .wd-unit {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .wind-action-card {
    padding: 1.25rem;
    border-radius: 12px;
    border-left: 4px solid var(--action-color);
    background: var(--bg);
    margin-bottom: 1.25rem;
  }

  .wind-action-card.warning {
    background: rgba(201, 115, 58, 0.1);
  }

  .wa-level {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--action-color);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .wa-action {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0.25rem 0 0.75rem 0;
  }

  .wa-tips {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .wind-table h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    color: var(--ink);
  }

  .wt-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1.25rem;
  }

  .wt-row {
    display: grid;
    grid-template-columns: 90px 80px 1fr;
    gap: 0.5rem;
    padding: 0.6rem 0.85rem;
    background: var(--bg);
    border-radius: 8px;
    font-size: 0.85rem;
    border: 1px solid transparent;
  }

  .wt-row.active {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.15);
  }

  .wt-row.severe { background: rgba(201, 115, 58, 0.1); }
  .wt-row.caution { background: rgba(230, 190, 0, 0.1); }
  .wt-row.trigger {
    background: rgba(217, 119, 6, 0.15);
    border-color: var(--terra);
  }
  .wt-row.trigger.active {
    background: rgba(217, 119, 6, 0.25);
    border-color: var(--terra);
  }

  /* Shelter Trigger Alert */
  .shelter-trigger-alert {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%);
    border: 2px solid var(--terra);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.25rem;
  }

  .sta-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .sta-icon {
    font-size: 1.5rem;
  }

  .sta-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--terra);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sta-body p {
    margin: 0 0 0.35rem 0;
    font-size: 0.9rem;
  }

  .sta-reason {
    font-style: italic;
    color: var(--muted);
    font-size: 0.85rem !important;
  }
  .wt-row.severe.active { border-color: var(--terra); }

  .wt-speed { font-weight: 600; }
  .wt-label { color: var(--muted); }
  .wt-action { color: var(--ink); }

  .wind-tips-card {
    background: var(--bg);
    border-radius: 10px;
    padding: 1rem;
  }

  .wind-tips-card h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .tip-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border-radius: 6px;
    font-size: 0.8rem;
  }

  .wind-rule {
    margin: 1rem 0 0 0;
    text-align: center;
    font-size: 0.9rem;
    color: var(--terra);
  }

  /* Warning Section */
  .warning-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .warning-header h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
  }

  .warning-header p {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0;
  }

  .warning-count {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
    padding: 1rem;
    background: var(--bg);
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .warning-count.triggered {
    background: rgba(201, 115, 58, 0.15);
    border: 2px solid var(--terra);
  }

  .wc-num {
    font-family: Oswald, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--alpine);
  }

  .warning-count.triggered .wc-num {
    color: var(--terra);
  }

  .wc-of {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    color: var(--muted);
  }

  .wc-status {
    margin-left: 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted);
  }

  .warning-count.triggered .wc-status {
    color: var(--terra);
  }

  .warning-checks {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .warning-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
  }

  .warning-btn:hover { border-color: var(--alpine); }

  .warning-btn.active {
    background: rgba(201, 115, 58, 0.1);
    border-color: var(--terra);
  }

  .wb-check {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 6px;
    font-weight: bold;
    color: var(--terra);
  }

  .warning-btn.active .wb-check {
    background: var(--terra);
    border-color: var(--terra);
    color: #fff;
  }

  .wb-icon { font-size: 1.25rem; }
  .wb-text { font-size: 0.9rem; color: var(--ink); }

  .warning-alert {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(201, 115, 58, 0.15);
    border: 2px solid var(--terra);
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .wa-icon { font-size: 2rem; }
  .wa-content strong { color: var(--terra); }
  .wa-content p { margin: 0.25rem 0 0 0; font-size: 0.85rem; }

  .pressure-card {
    background: var(--bg);
    border-radius: 10px;
    padding: 1rem;
  }

  .pressure-card h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
  }

  .pressure-note {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0 0 0.75rem 0;
  }

  .pressure-table {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .pr-row {
    display: grid;
    grid-template-columns: 90px 80px 1fr;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border-radius: 6px;
    border-left: 3px solid var(--pr-color);
    font-size: 0.8rem;
  }

  .pr-drift { font-weight: 600; }
  .pr-time { color: var(--muted); }
  .pr-desc { color: var(--ink); }

  .pressure-rule {
    font-size: 0.8rem;
    color: var(--terra);
    margin: 0;
  }

  /* Rain Section */
  .rain-header {
    text-align: center;
    margin-bottom: 1.25rem;
  }

  .rain-header h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
  }

  .rain-header p {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0;
  }

  .phase-cards {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
    margin-bottom: 1.25rem;
  }

  .phase-card {
    flex: 1;
    padding: 1rem;
    border-radius: 12px;
  }

  .phase-card.wet {
    background: rgba(106, 168, 220, 0.15);
    border: 1px solid rgba(106, 168, 220, 0.4);
  }

  .phase-card.dry {
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid rgba(166, 181, 137, 0.4);
  }

  .phase-arrow {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    color: var(--muted);
  }

  .pc-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .pc-icon { font-size: 1.25rem; }

  .pc-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .pc-steps {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8rem;
  }

  .pc-steps li { margin-bottom: 0.35rem; }

  .pc-note {
    font-size: 0.75rem;
    font-style: italic;
    color: var(--muted);
    margin: 0.5rem 0 0 0;
  }

  .morning-card {
    background: var(--bg);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .morning-card h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
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
    color: var(--alpine);
    margin: 0.75rem 0 0 0;
    font-weight: 600;
  }

  .rain-principles h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
  }

  .rain-principles ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
  }

  .rain-principles li { margin-bottom: 0.35rem; }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    color: var(--ink);
    transition: all 0.2s ease;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }

  .gl-icon { font-size: 1.25rem; }

  .gl-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .gl-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .gl-arrow { transform: translateX(4px); }

  /* ========== DAYLIGHT SECTION ========== */
  .dl-controls {
    margin-bottom: 1.25rem;
  }

  .dl-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 1rem;
  }

  .dl-input label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .dl-date {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .dl-slider {
    width: 100%;
    height: 24px;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .dl-slider::-webkit-slider-runnable-track {
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
  }

  .dl-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--pine);
    margin-top: -7px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }

  .dl-hero {
    background: var(--bg);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  .dl-times {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .dl-time {
    text-align: center;
  }

  .dl-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .dl-val {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .dl-daylight {
    text-align: center;
    padding: 0.75rem 1.5rem;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .dl-hours {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .dl-unit {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .dl-quality {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 0.35rem;
  }

  .solar-bar {
    display: flex;
    height: 24px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  }

  .sb-night {
    background: #1e293b;
    transition: width 0.3s ease;
  }

  .sb-day {
    background: linear-gradient(180deg, #fbbf24, #d97706);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
    transition: width 0.3s ease;
  }

  .sb-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
    font-size: 0.6rem;
    color: var(--muted);
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
    border-radius: 10px;
  }

  .dl-stat.highlight {
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid var(--alpine);
  }

  .ds-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .ds-val {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .ds-note {
    display: block;
    font-size: 0.65rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .terrain-note {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(201, 115, 58, 0.1);
    border: 1px solid var(--terra);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--terra);
  }

  .tn-icon { font-size: 1.25rem; }

  /* Responsive */
  @media (max-width: 640px) {
    .section-tabs { flex-wrap: wrap; }
    .stab { flex: 0 0 calc(33.33% - 0.25rem); }
    .stab-text { font-size: 0.55rem; }

    .wc-grid { grid-template-columns: repeat(2, 1fr); }
    .tips-grid { grid-template-columns: 1fr; }

    .phase-cards { flex-direction: column; }
    .phase-arrow { transform: rotate(90deg); justify-content: center; }

    .wt-row { grid-template-columns: 1fr; gap: 0.25rem; }
    .pr-row { grid-template-columns: 1fr; gap: 0.15rem; }

    .dl-row { grid-template-columns: 1fr; }
    .dl-times { flex-direction: column; gap: 0.75rem; }
    .dl-daylight { width: 100%; }
    .dl-stats { grid-template-columns: 1fr; }
  }
</style>
