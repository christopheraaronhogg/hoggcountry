<script lang="ts">
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  interface Reading {
    id: number;
    altitude: number;
    time: Date;
    driftRate: number | null;
    warningLevel: WarningLevel;
  }

  type WarningLevel = 'clear' | 'watch' | 'warning' | 'danger' | 'imminent';

  const WARNING_CONFIG: Record<WarningLevel, {
    icon: string;
    label: string;
    color: string;
    description: string;
    minRate: number;
    maxRate: number;
  }> = {
    clear: {
      icon: '☀️',
      label: 'Clear',
      color: '#22c55e',
      description: 'Normal atmospheric fluctuation. Safe hiking conditions.',
      minRate: 0,
      maxRate: 25
    },
    watch: {
      icon: '👀',
      label: 'Watch',
      color: '#f0e000',
      description: 'Minor pressure change detected. Weather may shift in 12-24 hours.',
      minRate: 25,
      maxRate: 50
    },
    warning: {
      icon: '⚠️',
      label: 'Warning',
      color: '#d97706',
      description: 'Significant pressure drop. Weather change likely in 6-12 hours.',
      minRate: 50,
      maxRate: 100
    },
    danger: {
      icon: '🏃',
      label: 'Danger',
      color: '#ef4444',
      description: 'Rapid pressure drop. Storm approaching within 6-12 hours.',
      minRate: 100,
      maxRate: 150
    },
    imminent: {
      icon: '⛈️',
      label: 'Imminent',
      color: '#9333ea',
      description: 'Extreme pressure drop. Seek shelter immediately!',
      minRate: 150,
      maxRate: 200
    }
  };

  let altitudeInput = $state('');
  let readings = $state<Reading[]>([]);
  let showTrendPanel = $state(false);
  let showManual = $state(false);
  let expandedReadingId = $state<number | null>(null);
  let readingIdCounter = $state(0);
  let mounted = $state(false);

  const STORAGE_KEY = 'storm-gauge-session';

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.readings)) {
          readings = data.readings.map((r: any) => ({
            ...r,
            time: new Date(r.time)
          }));
          readingIdCounter = data.readingIdCounter || readings.length;
        }
      }
    } catch (e) {
      console.warn('Failed to load storm gauge data:', e);
    }
    mounted = true;
  });

  $effect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        readings: readings.map(r => ({ ...r, time: r.time.toISOString() })),
        readingIdCounter,
        lastUpdated: new Date().toISOString()
      }));
    }
  });

  let currentWarningLevel = $derived.by((): WarningLevel => {
    if (readings.length < 2) return 'clear';
    const latestDrift = readings[readings.length - 1].driftRate;
    if (latestDrift === null) return 'clear';
    const absRate = Math.abs(latestDrift);

    if (readings.length >= 2) {
      const latest = readings[readings.length - 1];
      const previous = readings[readings.length - 2];
      const timeDiffMs = latest.time.getTime() - previous.time.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      const altDiff = Math.abs(latest.altitude - previous.altitude);

      if (altDiff > 100 && timeDiffHours < 1) {
        return 'imminent';
      }
    }

    if (absRate >= 100) return 'danger';
    if (absRate >= 50) return 'warning';
    if (absRate >= 25) return 'watch';
    return 'clear';
  });

  let currentDriftRate = $derived.by(() => {
    if (readings.length < 2) return null;
    return readings[readings.length - 1].driftRate;
  });

  let elapsedTime = $derived.by(() => {
    if (readings.length < 2) return null;
    const first = readings[0].time;
    const last = readings[readings.length - 1].time;
    const diffMs = last.getTime() - first.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  });

  let needleRotation = $derived.by(() => {
    if (currentDriftRate === null) return -135;
    const rate = Math.min(Math.abs(currentDriftRate), 200);
    const normalized = rate / 200;
    return -135 + (normalized * 270);
  });

  function calculateWarningLevel(rate: number | null): WarningLevel {
    if (rate === null) return 'clear';
    const absRate = Math.abs(rate);
    if (absRate >= 100) return 'danger';
    if (absRate >= 50) return 'warning';
    if (absRate >= 25) return 'watch';
    return 'clear';
  }

  function addReading() {
    const altitude = parseFloat(altitudeInput);
    if (isNaN(altitude)) return;

    const now = new Date();
    let driftRate: number | null = null;
    let warningLevel: WarningLevel = 'clear';

    if (readings.length > 0) {
      const lastReading = readings[readings.length - 1];
      const timeDiffHours = (now.getTime() - lastReading.time.getTime()) / (1000 * 60 * 60);
      if (timeDiffHours > 0) {
        driftRate = (altitude - lastReading.altitude) / timeDiffHours;
        warningLevel = calculateWarningLevel(driftRate);

        const altDiff = Math.abs(altitude - lastReading.altitude);
        if (altDiff > 100 && timeDiffHours < 1) {
          warningLevel = 'imminent';
        }
      }
    }

    const newReading: Reading = {
      id: readingIdCounter++,
      altitude,
      time: now,
      driftRate,
      warningLevel
    };

    readings = [...readings, newReading];
    altitudeInput = '';
  }

  function clearReadings() {
    readings = [];
    expandedReadingId = null;
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function toggleReadingExpand(id: number) {
    expandedReadingId = expandedReadingId === id ? null : id;
  }
</script>

<div class="storm-instrument">
  <!-- Instrument Header -->
  <div class="instrument-header">
    <div class="instrument-title">
      <span class="title-icon">⏱</span>
      <span class="title-text">Barometric Drift Gauge</span>
    </div>
    <div class="instrument-subtitle">Pressure Altitude Monitor</div>
  </div>

  <!-- Main Gauge -->
  <div class="gauge-container">
    <svg viewBox="0 0 200 140" class="gauge-svg">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#22c55e" />
          <stop offset="25%" stop-color="#f0e000" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="75%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#9333ea" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.15"/>
        </filter>
      </defs>

      <circle cx="100" cy="100" r="92" fill="none" stroke="#e6e1d4" stroke-width="6" />

      <!-- Clear: 0-25 ft/hr -->
      <path d="M 26.5 141.5 A 85 85 0 0 1 36.8 68.2" fill="none" stroke="#22c55e" stroke-width="12" stroke-linecap="round" />
      <!-- Watch: 25-50 ft/hr -->
      <path d="M 36.8 68.2 A 85 85 0 0 1 66.5 29.5" fill="none" stroke="#f0e000" stroke-width="12" />
      <!-- Warning: 50-100 ft/hr -->
      <path d="M 66.5 29.5 A 85 85 0 0 1 133.5 29.5" fill="none" stroke="#d97706" stroke-width="12" />
      <!-- Danger: 100-150 ft/hr -->
      <path d="M 133.5 29.5 A 85 85 0 0 1 163.2 68.2" fill="none" stroke="#ef4444" stroke-width="12" />
      <!-- Imminent: 150-200+ ft/hr -->
      <path d="M 163.2 68.2 A 85 85 0 0 1 173.5 141.5" fill="none" stroke="#9333ea" stroke-width="12" stroke-linecap="round" />

      <!-- Tick marks -->
      <line x1="28" y1="125" x2="38" y2="118" stroke="#4d594a" stroke-width="2" />
      <text x="22" y="138" class="tick-label">0</text>

      <line x1="32" y1="72" x2="44" y2="78" stroke="#4d594a" stroke-width="2" />
      <text x="24" y="64" class="tick-label">25</text>

      <line x1="58" y1="36" x2="66" y2="48" stroke="#4d594a" stroke-width="2" />
      <text x="52" y="28" class="tick-label">50</text>

      <line x1="100" y1="18" x2="100" y2="32" stroke="#4d594a" stroke-width="2" />
      <text x="100" y="12" class="tick-label" text-anchor="middle">100</text>

      <line x1="142" y1="36" x2="134" y2="48" stroke="#4d594a" stroke-width="2" />
      <text x="148" y="28" class="tick-label">150</text>

      <line x1="172" y1="125" x2="162" y2="118" stroke="#4d594a" stroke-width="2" />
      <text x="178" y="138" class="tick-label">200+</text>

      <!-- Center circle -->
      <circle cx="100" cy="100" r="45" fill="#ffffff" stroke="#e6e1d4" stroke-width="2" filter="url(#shadow)" />

      <!-- Needle -->
      <g transform="rotate({needleRotation}, 100, 100)">
        <polygon points="100,25 96,100 104,100" fill="#1f2937" filter="url(#shadow)" />
        <circle cx="100" cy="100" r="8" fill="#1f2937" />
        <circle cx="100" cy="100" r="4" fill="#ef4444" />
      </g>

      <text x="100" y="125" class="unit-label" text-anchor="middle">ft/hr</text>
    </svg>

    <!-- Center icon overlay -->
    <div class="gauge-center-icon" style="color: {WARNING_CONFIG[currentWarningLevel].color}">
      <span class="status-icon">{WARNING_CONFIG[currentWarningLevel].icon}</span>
      <span class="status-label">{WARNING_CONFIG[currentWarningLevel].label}</span>
    </div>
  </div>

  <!-- Current Stats Panel -->
  <div class="stats-panel">
    <div class="stat">
      <span class="stat-label">Drift Rate</span>
      <span class="stat-value" style="color: {WARNING_CONFIG[currentWarningLevel].color}">
        {#if currentDriftRate !== null}
          {currentDriftRate > 0 ? '+' : ''}{currentDriftRate.toFixed(1)} ft/hr
        {:else}
          --
        {/if}
      </span>
    </div>
    <div class="stat">
      <span class="stat-label">Readings</span>
      <span class="stat-value">{readings.length}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Elapsed</span>
      <span class="stat-value">{elapsedTime ?? '--'}</span>
    </div>
  </div>

  <!-- Status Description -->
  <div class="status-description" style="border-left-color: {WARNING_CONFIG[currentWarningLevel].color}">
    <p>{WARNING_CONFIG[currentWarningLevel].description}</p>
  </div>

  <!-- Calibration Input -->
  <div class="calibration-section">
    <div class="calibration-header">
      <span class="calibration-icon">⚙</span>
      <span>Calibrate Instrument</span>
    </div>
    <div class="input-group">
      <label for="altitude-input" class="input-label">Current Pressure Altitude (ft)</label>
      <div class="input-row">
        <input
          id="altitude-input"
          type="number"
          bind:value={altitudeInput}
          placeholder="e.g., 4250"
          class="altitude-input"
          onkeydown={(e) => e.key === 'Enter' && addReading()}
        />
        <button class="record-btn" onclick={addReading} disabled={!altitudeInput}>
          <span class="btn-icon">◉</span>
          Record
        </button>
      </div>
      <p class="input-hint">Read from altimeter watch or GPS device</p>
    </div>
  </div>

  <!-- Timeline Strip -->
  {#if readings.length > 0}
    <div class="timeline-section">
      <div class="timeline-header">
        <span>Reading Timeline</span>
        {#if readings.length > 0}
          <button class="clear-btn" onclick={clearReadings}>Clear All</button>
        {/if}
      </div>
      <div class="timeline-strip">
        {#each readings as reading, index (reading.id)}
          <button
            class="reading-pin"
            class:expanded={expandedReadingId === reading.id}
            style="--pin-color: {WARNING_CONFIG[reading.warningLevel].color}"
            onclick={() => toggleReadingExpand(reading.id)}
            title="Reading #{index + 1}: {reading.altitude} ft at {formatTime(reading.time)}"
          >
            <span class="pin-number">{index + 1}</span>
            {#if expandedReadingId === reading.id}
              <div class="pin-details">
                <div class="detail-row">
                  <span class="detail-icon">{WARNING_CONFIG[reading.warningLevel].icon}</span>
                  <span class="detail-alt">{reading.altitude.toLocaleString()} ft</span>
                </div>
                <div class="detail-time">{formatTime(reading.time)}</div>
                {#if reading.driftRate !== null}
                  <div class="detail-drift" style="color: {WARNING_CONFIG[reading.warningLevel].color}">
                    {reading.driftRate > 0 ? '+' : ''}{reading.driftRate.toFixed(1)} ft/hr
                  </div>
                {/if}
              </div>
            {/if}
          </button>
          {#if index < readings.length - 1}
            <div class="timeline-connector" style="background: {WARNING_CONFIG[reading.warningLevel].color}"></div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Trend Panel Toggle -->
  {#if readings.length >= 2}
    <div class="trend-section">
      <button class="trend-toggle" onclick={() => showTrendPanel = !showTrendPanel}>
        <span class="toggle-icon">{showTrendPanel ? '▼' : '▶'}</span>
        Trend Panel
      </button>

      {#if showTrendPanel}
        <div class="trend-chart">
          <div class="chart-header">
            <span>Altitude Over Time</span>
          </div>
          <div class="chart-container">
            <svg viewBox="0 0 300 120" class="chart-svg">
              {#each [0, 1, 2, 3, 4] as i}
                <line x1="30" y1={20 + i * 20} x2="290" y2={20 + i * 20} stroke="#e6e1d4" stroke-width="1" stroke-dasharray="2,2" />
              {/each}

              {#if readings.length >= 2}
                {@const minAlt = Math.min(...readings.map(r => r.altitude))}
                {@const maxAlt = Math.max(...readings.map(r => r.altitude))}
                {@const range = maxAlt - minAlt || 100}
                {@const points = readings.map((r, i) => {
                  const x = 30 + (i / (readings.length - 1)) * 260;
                  const y = 100 - ((r.altitude - minAlt) / range) * 80;
                  return `${x},${y}`;
                }).join(' ')}

                <polyline
                  points={points}
                  fill="none"
                  stroke={WARNING_CONFIG[currentWarningLevel].color}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                {#each readings as reading, i}
                  {@const x = 30 + (i / (readings.length - 1)) * 260}
                  {@const y = 100 - ((reading.altitude - minAlt) / range) * 80}
                  <circle cx={x} cy={y} r="4" fill={WARNING_CONFIG[reading.warningLevel].color} stroke="#fff" stroke-width="2" />
                {/each}
              {/if}

              {#if readings.length >= 2}
                {@const minAlt = Math.min(...readings.map(r => r.altitude))}
                {@const maxAlt = Math.max(...readings.map(r => r.altitude))}
                <text x="25" y="24" class="chart-label" text-anchor="end">{maxAlt.toLocaleString()}</text>
                <text x="25" y="104" class="chart-label" text-anchor="end">{minAlt.toLocaleString()}</text>
              {/if}
            </svg>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Instrument Manual -->
  <div class="manual-section">
    <button class="manual-toggle" onclick={() => showManual = !showManual}>
      <span class="toggle-icon">{showManual ? '▼' : '▶'}</span>
      Instrument Manual
    </button>

    {#if showManual}
      <div class="manual-content">
        <h4>Reading the Gauge</h4>
        <p>The gauge displays your current pressure drift rate in feet per hour. Track changes in your altimeter's pressure altitude reading over time.</p>

        <h4>Warning Thresholds</h4>
        <div class="threshold-table">
          {#each Object.entries(WARNING_CONFIG) as [key, config]}
            <div class="threshold-row">
              <span class="threshold-icon" style="background: {config.color}">{config.icon}</span>
              <span class="threshold-label">{config.label}</span>
              <span class="threshold-range">
                {#if key === 'clear'}
                  &lt; 25 ft/hr
                {:else if key === 'watch'}
                  25-50 ft/hr
                {:else if key === 'warning'}
                  50-100 ft/hr
                {:else if key === 'danger'}
                  &gt; 100 ft/hr
                {:else}
                  &gt; 100 ft in &lt; 1 hr
                {/if}
              </span>
            </div>
          {/each}
        </div>

        <h4>How to Use</h4>
        <ol>
          <li>Stand stationary at a known elevation</li>
          <li>Record your altimeter's pressure altitude reading</li>
          <li>Wait 15-30 minutes, record again</li>
          <li>Watch the gauge for drift rate changes</li>
          <li>Rising drift = pressure dropping = weather incoming</li>
        </ol>

        <h4>Why This Works</h4>
        <p>Altimeters measure pressure, not true elevation. When pressure drops (storm approaching), your altimeter shows you "gaining elevation" even while stationary. Fast drops mean fast-moving weather systems.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .storm-instrument {
    font-family: Lato, system-ui, sans-serif;
    background: var(--card, #ffffff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 16px;
    padding: 1.5rem;
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .instrument-header {
    text-align: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--border, #e6e1d4);
  }

  .instrument-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink, #1f2937);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .title-icon { font-size: 1.5rem; }

  .instrument-subtitle {
    font-size: 0.75rem;
    color: var(--muted, #6b7c6e);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  .gauge-container {
    position: relative;
    width: 100%;
    max-width: 280px;
    margin: 0 auto 1rem;
  }

  .gauge-svg { width: 100%; height: auto; }

  .gauge-svg .tick-label {
    font-size: 8px;
    font-family: Oswald, sans-serif;
    fill: var(--muted, #6b7c6e);
  }

  .gauge-svg .unit-label {
    font-size: 10px;
    font-family: Oswald, sans-serif;
    fill: var(--muted, #6b7c6e);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gauge-center-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -30%);
    text-align: center;
    pointer-events: none;
  }

  .status-icon { display: block; font-size: 1.75rem; line-height: 1; }

  .status-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  .stats-panel {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .stat { text-align: center; }

  .stat-label {
    display: block;
    font-size: 0.65rem;
    color: var(--muted, #6b7c6e);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink, #1f2937);
  }

  .status-description {
    padding: 0.75rem;
    padding-left: 1rem;
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    border-left: 4px solid;
    margin-bottom: 1rem;
  }

  .status-description p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--ink, #1f2937);
    line-height: 1.5;
  }

  .calibration-section {
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .calibration-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .calibration-icon { font-size: 1rem; }

  .input-group { display: flex; flex-direction: column; gap: 0.5rem; }

  .input-label { font-size: 0.75rem; color: var(--muted, #6b7c6e); font-weight: 500; }

  .input-row { display: flex; gap: 0.5rem; }

  .altitude-input {
    flex: 1;
    padding: 0.625rem 0.75rem;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-size: 1rem;
    font-family: Oswald, sans-serif;
    background: white;
    transition: border-color 0.2s;
  }

  .altitude-input:focus { outline: none; border-color: var(--pine, #4d594a); }
  .altitude-input::placeholder { color: var(--muted, #6b7c6e); opacity: 0.6; }

  .record-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1rem;
    background: var(--pine, #4d594a);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  }

  .record-btn:hover:not(:disabled) { background: #3d493a; transform: translateY(-1px); }
  .record-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-icon { font-size: 1rem; color: #ef4444; }

  .input-hint { font-size: 0.7rem; color: var(--muted, #6b7c6e); margin: 0; font-style: italic; }

  .timeline-section { margin-bottom: 1rem; }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .clear-btn {
    font-size: 0.7rem;
    color: var(--muted, #6b7c6e);
    background: none;
    border: 1px solid var(--border, #e6e1d4);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.2s, border-color 0.2s;
  }

  .clear-btn:hover { color: #ef4444; border-color: #ef4444; }

  .timeline-strip {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0.75rem;
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .reading-pin {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 32px;
    padding: 0.25rem;
    background: white;
    border: 2px solid var(--pin-color);
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    font-family: inherit;
  }

  .reading-pin:hover { transform: scale(1.1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); z-index: 1; }

  .reading-pin.expanded {
    border-radius: 16px;
    min-width: auto;
    padding: 0.5rem;
    z-index: 2;
  }

  .pin-number {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ink, #1f2937);
  }

  .pin-details { margin-top: 0.375rem; text-align: center; white-space: nowrap; }

  .detail-row { display: flex; align-items: center; gap: 0.25rem; justify-content: center; }
  .detail-icon { font-size: 0.875rem; }
  .detail-alt { font-family: Oswald, sans-serif; font-size: 0.75rem; font-weight: 600; color: var(--ink, #1f2937); }
  .detail-time { font-size: 0.625rem; color: var(--muted, #6b7c6e); }
  .detail-drift { font-family: Oswald, sans-serif; font-size: 0.7rem; font-weight: 600; }

  .timeline-connector { width: 16px; height: 2px; flex-shrink: 0; }

  .trend-section { margin-bottom: 1rem; }

  .trend-toggle, .manual-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: var(--bg, #f5f2e8);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background 0.2s;
  }

  .trend-toggle:hover, .manual-toggle:hover { background: #eae7db; }

  .toggle-icon { font-size: 0.625rem; color: var(--muted, #6b7c6e); }

  .trend-chart {
    margin-top: 0.75rem;
    padding: 1rem;
    background: white;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
  }

  .chart-header {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    color: var(--muted, #6b7c6e);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .chart-container { width: 100%; }
  .chart-svg { width: 100%; height: auto; }
  .chart-svg .chart-label { font-size: 8px; font-family: Oswald, sans-serif; fill: var(--muted, #6b7c6e); }

  .manual-section { margin-bottom: 0; }

  .manual-content {
    margin-top: 0.75rem;
    padding: 1rem;
    background: white;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .manual-content h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin: 1rem 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .manual-content h4:first-child { margin-top: 0; }
  .manual-content p { color: var(--ink, #1f2937); margin: 0 0 0.75rem; }
  .manual-content ol { margin: 0 0 0.75rem; padding-left: 1.25rem; color: var(--ink, #1f2937); }
  .manual-content li { margin-bottom: 0.25rem; }

  .threshold-table { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }

  .threshold-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem;
    background: var(--bg, #f5f2e8);
    border-radius: 6px;
  }

  .threshold-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.875rem;
  }

  .threshold-label { font-family: Oswald, sans-serif; font-weight: 600; color: var(--ink, #1f2937); min-width: 60px; }
  .threshold-range { font-size: 0.75rem; color: var(--muted, #6b7c6e); margin-left: auto; }

  @media (max-width: 400px) {
    .storm-instrument { padding: 1rem; border-radius: 12px; }
    .gauge-container { max-width: 240px; }
    .stats-panel { padding: 0.5rem; }
    .stat-value { font-size: 0.875rem; }
    .calibration-section { padding: 0.75rem; }
    .input-row { flex-direction: column; }
    .record-btn { justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .reading-pin, .record-btn, .trend-toggle, .manual-toggle { transition: none; }
  }
</style>
