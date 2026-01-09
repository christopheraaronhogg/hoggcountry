<script lang="ts">
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  interface Reading {
    timestamp: number;
    actualElevation: number;
    watchElevation: number;
    drift: number;
  }

  interface WarningConfig {
    level: string;
    color: string;
    bgColor: string;
    icon: string;
    message: string;
    threshold: string;
    meaning: string;
    pulse?: boolean;
  }

  const WARNING_LEVELS: Record<string, WarningConfig> = {
    clear: {
      level: 'Clear',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      icon: '☀️',
      message: 'Conditions stable. Enjoy your hike!',
      threshold: '< 25 ft/hr',
      meaning: 'Normal atmospheric fluctuation'
    },
    improving: {
      level: 'Improving',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: '📈',
      message: 'Pressure rising. Weather should be improving.',
      threshold: 'Negative drift',
      meaning: 'Clearing skies likely'
    },
    watch: {
      level: 'Watch',
      color: '#eab308',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      icon: '👀',
      message: 'Pressure dropping slowly. Keep an eye on the sky.',
      threshold: '25-50 ft/hr',
      meaning: 'Minor change possible in 12-24 hours'
    },
    warning: {
      level: 'Warning',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      icon: '⚠️',
      message: 'Weather likely changing. Know your shelter options.',
      threshold: '50-100 ft/hr',
      meaning: 'Weather change likely in 6-12 hours'
    },
    danger: {
      level: 'Danger',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: '🏃',
      message: 'Storm approaching. Get to shelter soon.',
      threshold: '> 100 ft/hr',
      meaning: 'Storm approaching within 6-12 hours'
    },
    imminent: {
      level: 'Imminent',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      icon: '⛈️',
      message: 'Rapid pressure drop! Seek shelter NOW.',
      threshold: '> 100 ft in < 1 hr',
      meaning: 'Seek shelter immediately',
      pulse: true
    }
  };

  let actualElevation = $state('');
  let watchElevation = $state('');
  let readings = $state<Reading[]>([]);
  let mounted = $state(false);
  let validationError = $state('');
  let showDataView = $state(false);
  let showEducation = $state(false);

  let session = $derived.by(() => {
    if (readings.length < 1) {
      return { totalDrift: 0, driftRate: 0, elapsedHours: 0, hasData: false };
    }
    const firstReading = readings[0];
    const latestReading = readings[readings.length - 1];
    const totalDrift = latestReading.drift - firstReading.drift;
    const elapsedMs = latestReading.timestamp - firstReading.timestamp;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const driftRate = elapsedHours > 0.05 ? totalDrift / elapsedHours : 0;
    return { totalDrift, driftRate, elapsedHours, hasData: true, readingCount: readings.length };
  });

  let warningLevel = $derived.by((): string => {
    if (readings.length < 2) return 'clear';
    const { totalDrift, driftRate, elapsedHours } = session;
    if (elapsedHours < 0.25) {
      if (totalDrift > 100) return 'danger';
      if (totalDrift > 50) return 'warning';
      if (totalDrift > 25) return 'watch';
      return 'clear';
    }
    if (totalDrift > 100 && elapsedHours < 1) return 'imminent';
    if (driftRate < -25) return 'improving';
    if (driftRate > 100) return 'danger';
    if (driftRate > 50) return 'warning';
    if (driftRate > 25) return 'watch';
    return 'clear';
  });

  let warningDisplay = $derived(WARNING_LEVELS[warningLevel]);

  let elapsedTimeDisplay = $derived.by(() => {
    if (readings.length === 0) return '';
    const ms = Date.now() - readings[0].timestamp;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  });

  let driftRateDisplay = $derived.by(() => {
    if (!session.hasData || readings.length < 2) return null;
    if (session.elapsedHours < 0.25) {
      const drift = Math.round(session.totalDrift);
      if (drift > 0) return `+${drift} ft total`;
      if (drift < 0) return `${drift} ft total`;
      return 'No change yet';
    }
    const rate = Math.round(session.driftRate);
    if (rate > 0) return `+${rate} ft/hr`;
    if (rate < 0) return `${rate} ft/hr`;
    return 'Stable';
  });

  const STORAGE_KEY = 'storm-warning-field-station';

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.readings)) {
          readings = data.readings;
        }
      }
    } catch (e) {
      console.warn('Failed to load data:', e);
    }
    mounted = true;
  });

  $effect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ readings, lastUpdated: new Date().toISOString() }));
    }
  });

  function validateInputs(): boolean {
    validationError = '';
    const actual = parseFloat(actualElevation);
    const watch = parseFloat(watchElevation);
    if (isNaN(actual) || isNaN(watch)) {
      validationError = 'Please enter valid numbers.';
      return false;
    }
    if (actual < -500 || actual > 20000 || watch < -500 || watch > 20000) {
      validationError = 'Elevation must be between -500 and 20,000 feet.';
      return false;
    }
    return true;
  }

  function recordReading() {
    if (!validateInputs()) return;
    const actual = parseFloat(actualElevation);
    const watch = parseFloat(watchElevation);
    readings = [...readings, { timestamp: Date.now(), actualElevation: actual, watchElevation: watch, drift: watch - actual }];
    actualElevation = '';
    watchElevation = '';
  }

  function resetSession() {
    readings = [];
    actualElevation = '';
    watchElevation = '';
    validationError = '';
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function relativeTime(timestamp: number): string {
    const ms = Date.now() - timestamp;
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  }

  let recentReadings = $derived(readings.slice(-5).reverse());
  let olderCount = $derived(Math.max(0, readings.length - 5));
</script>

<div class="field-station">
  <!-- Station Header -->
  <div class="station-header">
    <span class="station-badge">FIELD STATION</span>
    <span class="data-status" class:active={readings.length > 0}>
      {readings.length > 0 ? '● TRACKING' : '○ STANDBY'}
    </span>
  </div>

  <!-- Warning Panel -->
  <div class="warning-panel" style="--warning-color: {warningDisplay.color}; --warning-bg: {warningDisplay.bgColor}">
    <div class="warning-circle" class:pulse={warningDisplay.pulse}>
      <span class="warning-icon">{warningDisplay.icon}</span>
    </div>
    <div class="warning-badge" style="background: {warningDisplay.color}">{warningDisplay.level.toUpperCase()}</div>
    <p class="warning-message">{warningDisplay.message}</p>

    <div class="warning-metrics">
      {#if driftRateDisplay}
        <div class="metric">
          <span class="metric-label">Current Drift</span>
          <span class="metric-value" style="color: {warningDisplay.color}">{driftRateDisplay}</span>
        </div>
      {/if}
      <div class="metric">
        <span class="metric-label">Threshold</span>
        <span class="metric-value">{warningDisplay.threshold}</span>
      </div>
    </div>

    <div class="warning-explanation">
      <span class="explanation-label">What it means:</span>
      <span class="explanation-text">{warningDisplay.meaning}</span>
    </div>
  </div>

  <!-- Input Section -->
  <div class="input-section">
    <div class="input-row">
      <div class="input-group">
        <label>Actual Elevation</label>
        <div class="input-wrapper">
          <input type="number" bind:value={actualElevation} placeholder="3450" />
          <span class="unit">ft</span>
        </div>
      </div>
      <div class="input-group">
        <label>Watch Shows</label>
        <div class="input-wrapper">
          <input type="number" bind:value={watchElevation} placeholder="3475" />
          <span class="unit">ft</span>
        </div>
      </div>
    </div>

    {#if validationError}
      <div class="error">{validationError}</div>
    {/if}

    <div class="action-row">
      <button class="btn-record" onclick={recordReading}>Record Reading</button>
      {#if readings.length > 0}
        <button class="btn-reset" onclick={resetSession}>Reset</button>
      {/if}
    </div>

    {#if readings.length > 0}
      <div class="session-badge">
        <span>Session: {elapsedTimeDisplay}</span>
        <span class="separator">|</span>
        <span>{readings.length} readings</span>
      </div>
    {/if}
  </div>

  <!-- Compact Reading History (Always Visible) -->
  {#if readings.length > 0}
    <div class="history-section">
      <div class="history-header">
        <span class="history-title">Recent Readings</span>
        {#if olderCount > 0}
          <span class="history-more">+{olderCount} earlier</span>
        {/if}
      </div>
      <div class="history-list">
        {#each recentReadings as reading, i}
          {@const isLatest = i === 0}
          {@const cumulativeDrift = reading.drift - readings[0].drift}
          <div class="history-item" class:latest={isLatest}>
            <div class="history-time">
              <span class="time-value">{formatTime(reading.timestamp)}</span>
              <span class="time-relative">{relativeTime(reading.timestamp)}</span>
            </div>
            <div class="history-data">
              <span class="data-actual">{reading.actualElevation}'</span>
              <span class="data-arrow">→</span>
              <span class="data-watch">{reading.watchElevation}'</span>
            </div>
            <div class="history-drift" class:positive={cumulativeDrift > 0} class:negative={cumulativeDrift < 0}>
              {cumulativeDrift > 0 ? '+' : ''}{cumulativeDrift}'
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Data View Toggle (Chart) -->
  {#if readings.length >= 2}
    <button class="toggle-btn" onclick={() => showDataView = !showDataView}>
      <span>{showDataView ? '▼' : '▶'}</span>
      <span>Data View</span>
      {#if !showDataView && driftRateDisplay}
        <span class="toggle-preview">{driftRateDisplay}</span>
      {/if}
    </button>

    {#if showDataView}
      <div class="chart-panel">
        <svg viewBox="0 0 300 120" class="drift-chart">
          {#if readings.length > 0}
            {@const firstDrift = readings[0].drift}
            {@const points = readings.map(r => r.drift - firstDrift)}
            {@const minY = Math.min(...points, 0)}
            {@const maxY = Math.max(...points, 25)}
            {@const range = maxY - minY || 25}
            {@const zeroY = 15 + ((maxY - 0) / range) * 90}

            <!-- Grid -->
            {#each [0, 0.5, 1] as y}
              <line x1="40" y1={15 + y * 90} x2="290" y2={15 + y * 90} stroke="#e5e5e5" stroke-width="1" />
            {/each}

            <!-- Zero line -->
            <line x1="40" y1={zeroY} x2="290" y2={zeroY} stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,2" />

            <!-- Data line -->
            <polyline
              fill="none"
              stroke={warningDisplay.color}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              points={readings.map((r, i) => {
                const x = 50 + (i / Math.max(readings.length - 1, 1)) * 230;
                const y = 15 + ((maxY - (r.drift - firstDrift)) / range) * 90;
                return `${x},${y}`;
              }).join(' ')}
            />

            <!-- Points -->
            {#each readings as r, i}
              {@const x = 50 + (i / Math.max(readings.length - 1, 1)) * 230}
              {@const y = 15 + ((maxY - (r.drift - firstDrift)) / range) * 90}
              <circle cx={x} cy={y} r="4" fill={warningDisplay.color} />
            {/each}

            <!-- Labels -->
            <text x="35" y="20" class="axis-label" text-anchor="end">+{Math.round(maxY)}</text>
            <text x="35" y="110" class="axis-label" text-anchor="end">{Math.round(minY)}</text>
          {/if}
        </svg>
        <div class="chart-legend">
          <span>Cumulative drift (ft) over time</span>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Education Toggle -->
  <button class="toggle-btn" onclick={() => showEducation = !showEducation}>
    <span>{showEducation ? '▼' : '▶'}</span>
    <span>How This Works</span>
  </button>

  {#if showEducation}
    <div class="education-panel">
      <h4>The Principle</h4>
      <p>Your altimeter measures air pressure and converts it to elevation. When atmospheric pressure drops (storm approaching), your altimeter reads higher even when you haven't moved.</p>

      <h4>Threshold Reference</h4>
      <div class="threshold-grid">
        {#each Object.entries(WARNING_LEVELS) as [key, config]}
          {#if key !== 'improving'}
            <div class="threshold-row">
              <span class="t-icon">{config.icon}</span>
              <span class="t-level">{config.level}</span>
              <span class="t-range">{config.threshold}</span>
              <span class="t-meaning">{config.meaning}</span>
            </div>
          {/if}
        {/each}
      </div>

      <h4>Tips</h4>
      <ul>
        <li>Use known elevations (FarOut, trail markers, summits)</li>
        <li>Wait 30-60 min between readings for meaningful data</li>
        <li>More readings = better trend detection</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .field-station {
    font-family: Lato, system-ui, -apple-system, sans-serif;
  }

  .station-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--border, #e6e1d4);
  }

  .station-badge {
    font-family: Anton, Oswald, Impact, sans-serif;
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    color: var(--pine, #4d594a);
    background: var(--bg, #f5f2e8);
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    border: 2px solid var(--pine, #4d594a);
  }

  .data-status {
    font-family: Lato, system-ui, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted, #6b7c6e);
  }

  .data-status.active {
    color: var(--alpine, #a6b589);
  }

  .warning-panel {
    text-align: center;
    padding: 1.5rem;
    background: var(--warning-bg);
    border-radius: 14px;
    margin-bottom: 1.25rem;
    border: 1px solid var(--border, #e6e1d4);
    box-shadow: 0 10px 22px rgba(0,0,0,.06);
  }

  .warning-circle {
    width: 80px;
    height: 80px;
    margin: 0 auto 0.75rem;
    border-radius: 50%;
    background: var(--warning-color);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }

  .warning-circle.pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .warning-icon {
    font-size: 2.5rem;
  }

  .warning-badge {
    display: inline-block;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    margin-bottom: 0.5rem;
  }

  .warning-message {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink, #1f2937);
    margin: 0 0 0.75rem;
  }

  .warning-metrics {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 0.75rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .metric-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #6b7c6e);
    margin-bottom: 0.15rem;
  }

  .metric-value {
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 1rem;
    font-weight: 600;
  }

  .warning-explanation {
    font-size: 0.85rem;
    color: var(--muted, #6b7c6e);
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0,0,0,0.08);
  }

  .explanation-label {
    font-weight: 600;
  }

  .input-section {
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 10px 22px rgba(0,0,0,.06);
  }

  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .input-group label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin-bottom: 0.35rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
  }

  .input-wrapper input {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--stone, #cccccc);
    border-radius: 10px;
    font-family: Lato, system-ui, sans-serif;
    font-size: 1rem;
    background: #fff;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: var(--pine, #4d594a);
    box-shadow: 0 0 0 3px var(--alpine, #a6b589);
  }

  .unit {
    font-size: 0.85rem;
    color: var(--muted, #6b7c6e);
    margin-left: 0.35rem;
    font-weight: 600;
  }

  .error {
    background: #fee2e2;
    color: #b91c1c;
    padding: 0.6rem 0.75rem;
    border-radius: 10px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
    border: 1px solid #fecaca;
  }

  .action-row {
    display: flex;
    gap: 0.75rem;
  }

  .btn-record {
    flex: 1;
    padding: 0.6rem 1rem;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    border: 1px solid #e0d400;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }

  .btn-record:hover {
    background: #e6d600;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,.08);
  }

  .btn-reset {
    padding: 0.6rem 1rem;
    background: #fff;
    color: var(--pine, #4d594a);
    border: 1px solid var(--stone, #cccccc);
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }

  .btn-reset:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,.08);
  }

  .session-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    font-size: 0.8rem;
    color: var(--muted, #6b7c6e);
  }

  .separator {
    color: var(--border, #e6e1d4);
  }

  .history-section {
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 10px 22px rgba(0,0,0,.06);
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .history-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine, #4d594a);
  }

  .history-more {
    font-size: 0.7rem;
    color: var(--muted, #6b7c6e);
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .history-item.latest {
    background: rgba(166, 181, 137, 0.2);
    border: 1px solid var(--alpine, #a6b589);
  }

  .history-time {
    display: flex;
    flex-direction: column;
    min-width: 65px;
  }

  .time-value {
    font-family: Lato, system-ui, sans-serif;
    font-weight: 700;
    color: var(--ink, #1f2937);
  }

  .time-relative {
    font-size: 0.7rem;
    color: var(--muted, #6b7c6e);
  }

  .history-data {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--muted, #6b7c6e);
  }

  .data-arrow {
    color: var(--stone, #cccccc);
  }

  .history-drift {
    font-family: Lato, system-ui, sans-serif;
    font-weight: 700;
    min-width: 50px;
    text-align: right;
  }

  .history-drift.positive { color: #dc2626; }
  .history-drift.negative { color: #16a34a; }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 1rem;
    background: #fff;
    border: 1px solid var(--stone, #cccccc);
    border-radius: 10px;
    color: var(--pine, #4d594a);
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 0.75rem;
    transition: transform .12s ease, box-shadow .12s ease;
  }

  .toggle-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,.08);
  }

  .toggle-preview {
    margin-left: auto;
    font-family: Lato, system-ui, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--muted, #6b7c6e);
  }

  .chart-panel {
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 10px 22px rgba(0,0,0,.06);
  }

  .drift-chart {
    width: 100%;
    height: auto;
  }

  .drift-chart .axis-label {
    font-size: 10px;
    fill: var(--muted, #6b7c6e);
    font-family: Lato, system-ui, sans-serif;
  }

  .chart-legend {
    text-align: center;
    font-size: 0.75rem;
    color: var(--muted, #6b7c6e);
    margin-top: 0.5rem;
  }

  .education-panel {
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 10px 22px rgba(0,0,0,.06);
  }

  .education-panel h4 {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin: 1rem 0 0.5rem;
  }

  .education-panel h4:first-child {
    margin-top: 0;
  }

  .education-panel p {
    font-size: 0.9rem;
    line-height: 1.75;
    color: var(--fg, #333333);
    margin: 0 0 0.75rem;
  }

  .education-panel ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    line-height: 1.75;
  }

  .education-panel li {
    margin-bottom: 0.35rem;
  }

  .threshold-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0.5rem 0;
  }

  .threshold-row {
    display: grid;
    grid-template-columns: 24px 60px 80px 1fr;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem 0.6rem;
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    font-size: 0.8rem;
  }

  .t-level {
    font-weight: 700;
    color: var(--ink, #1f2937);
  }

  .t-range {
    font-family: Lato, system-ui, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted, #6b7c6e);
  }

  .t-meaning {
    color: var(--muted, #6b7c6e);
    font-size: 0.75rem;
  }

  @media (max-width: 480px) {
    .input-row {
      grid-template-columns: 1fr;
    }

    .warning-metrics {
      flex-direction: column;
      gap: 0.5rem;
    }

    .threshold-row {
      grid-template-columns: 24px 1fr;
    }

    .t-range, .t-meaning {
      grid-column: 2;
    }
  }
</style>
