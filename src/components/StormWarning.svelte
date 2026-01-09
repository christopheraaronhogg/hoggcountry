<script lang="ts">
  import { onMount } from 'svelte';

  // Accept trailContext prop for consistency with other tools
  let { trailContext = {} } = $props();

  // Types
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
    pulse?: boolean;
  }

  // Warning level configurations
  const WARNING_LEVELS: Record<string, WarningConfig> = {
    clear: {
      level: 'Clear',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      icon: '☀️',
      message: 'Conditions stable. Enjoy your hike!'
    },
    improving: {
      level: 'Improving',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      icon: '📈',
      message: 'Pressure rising. Weather should be improving.'
    },
    watch: {
      level: 'Watch',
      color: '#eab308',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      icon: '👀',
      message: 'Pressure dropping slowly. Keep an eye on the sky.'
    },
    warning: {
      level: 'Warning',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      icon: '⚠️',
      message: 'Weather likely changing in 6-12 hours. Know where your next shelter is.'
    },
    danger: {
      level: 'Danger',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: '🏃',
      message: 'Storm approaching. Get to shelter soon.'
    },
    imminent: {
      level: 'Imminent',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      icon: '⛈️',
      message: 'Rapid pressure drop! Seek shelter NOW.',
      pulse: true
    }
  };

  // State
  let actualElevation = $state('');
  let watchElevation = $state('');
  let readings = $state<Reading[]>([]);
  let mounted = $state(false);
  let validationError = $state('');
  let showStalePrompt = $state(false);
  let showEducation = $state(false);

  // Derived calculations
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

    return {
      totalDrift,
      driftRate,
      elapsedHours,
      hasData: true,
      readingCount: readings.length
    };
  });

  let warningLevel = $derived.by((): string => {
    if (readings.length < 2) return 'clear';

    const { totalDrift, driftRate, elapsedHours } = session;

    // Minimum 15 minutes of data required
    if (elapsedHours < 0.25) return 'clear';

    // Check for rapid drop (special case)
    if (totalDrift > 100 && elapsedHours < 1) return 'imminent';

    // Check for improving conditions (negative drift = rising pressure)
    if (driftRate < -25) return 'improving';

    // Standard thresholds (positive drift = falling pressure)
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
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  });

  let driftRateDisplay = $derived.by(() => {
    if (!session.hasData || readings.length < 2) return null;
    const rate = Math.round(session.driftRate);
    if (rate > 0) {
      return `+${rate} ft/hr (climbing)`;
    } else if (rate < 0) {
      return `${rate} ft/hr (descending)`;
    }
    return 'Stable';
  });

  // Timing guidance for next reading
  let timingGuidance = $derived.by(() => {
    if (readings.length === 0) return null;

    const lastReading = readings[readings.length - 1];
    const msSinceLast = Date.now() - lastReading.timestamp;
    const minutesSinceLast = Math.floor(msSinceLast / (1000 * 60));
    const hoursSinceLast = msSinceLast / (1000 * 60 * 60);

    if (readings.length === 1) {
      // First reading taken, waiting for second
      if (hoursSinceLast < 1) {
        const minutesRemaining = Math.max(0, 60 - minutesSinceLast);
        return {
          status: 'waiting',
          message: `Keep hiking. Take next reading in ${minutesRemaining}+ min at any known elevation.`,
          ready: false
        };
      } else if (hoursSinceLast < 3) {
        return {
          status: 'ready',
          message: `Good time for reading #2. ${Math.floor(hoursSinceLast)}h elapsed — data will be meaningful.`,
          ready: true
        };
      } else {
        return {
          status: 'ideal',
          message: `Ideal timing for reading #2. ${Math.floor(hoursSinceLast)}h elapsed — excellent data quality.`,
          ready: true
        };
      }
    } else {
      // Multiple readings exist
      if (hoursSinceLast < 0.5) {
        return {
          status: 'recent',
          message: 'Reading just recorded. Continue hiking to your next checkpoint.',
          ready: false
        };
      } else if (hoursSinceLast < 2) {
        return {
          status: 'ready',
          message: 'Ready for another reading at your next known elevation point.',
          ready: true
        };
      } else {
        return {
          status: 'due',
          message: `${Math.floor(hoursSinceLast)}h since last reading. Record at next known elevation.`,
          ready: true
        };
      }
    }
  });

  // localStorage persistence
  const STORAGE_KEY = 'storm-warning-session';
  const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.readings)) {
          readings = data.readings;

          // Check if session is stale
          if (readings.length > 0) {
            const lastReading = readings[readings.length - 1];
            if (Date.now() - lastReading.timestamp > STALE_THRESHOLD) {
              showStalePrompt = true;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load storm warning data:', e);
    }
    mounted = true;
  });

  $effect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        readings,
        lastUpdated: new Date().toISOString()
      }));
    }
  });

  // Input validation
  function validateInputs(): boolean {
    validationError = '';

    const actual = parseFloat(actualElevation);
    const watch = parseFloat(watchElevation);

    if (isNaN(actual) || isNaN(watch)) {
      validationError = 'Please enter valid numbers for both elevations.';
      return false;
    }

    if (actual < -500 || actual > 20000) {
      validationError = 'Actual elevation must be between -500 and 20,000 feet.';
      return false;
    }

    if (watch < -500 || watch > 20000) {
      validationError = 'Watch elevation must be between -500 and 20,000 feet.';
      return false;
    }

    const drift = Math.abs(watch - actual);
    if (drift > 2000) {
      validationError = 'Watch reading differs by more than 2,000 feet from actual. Check for typos.';
      return false;
    }

    return true;
  }

  function recordReading() {
    if (!validateInputs()) return;

    const actual = parseFloat(actualElevation);
    const watch = parseFloat(watchElevation);
    const drift = watch - actual;

    readings = [...readings, {
      timestamp: Date.now(),
      actualElevation: actual,
      watchElevation: watch,
      drift
    }];

    // Clear inputs for next reading
    actualElevation = '';
    watchElevation = '';
    showStalePrompt = false;
  }

  function resetSession() {
    readings = [];
    actualElevation = '';
    watchElevation = '';
    validationError = '';
    showStalePrompt = false;
  }

  function dismissStalePrompt() {
    showStalePrompt = false;
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="storm-warning">
  <!-- Giant Warning Indicator -->
  <div class="warning-display" style="--warning-color: {warningDisplay.color}; --warning-bg: {warningDisplay.bgColor}">
    <div class="warning-circle" class:pulse={warningDisplay.pulse}>
      <span class="warning-icon">{warningDisplay.icon}</span>
    </div>
    <p class="warning-message">{warningDisplay.message}</p>
    {#if driftRateDisplay}
      <p class="drift-rate">Phantom drift: {driftRateDisplay}</p>
    {/if}
  </div>

  <!-- Stale Session Prompt -->
  {#if showStalePrompt}
    <div class="stale-prompt">
      <p>Your last reading was over 24 hours ago.</p>
      <div class="stale-actions">
        <button class="btn btn-reset" onclick={resetSession}>Start Fresh</button>
        <button class="btn btn-secondary" onclick={dismissStalePrompt}>Continue</button>
      </div>
    </div>
  {/if}

  <!-- Input Section -->
  <div class="input-section">
    <div class="input-group">
      <label for="actual-elevation">Actual Elevation</label>
      <input
        id="actual-elevation"
        type="number"
        bind:value={actualElevation}
        placeholder="From FarOut or trail marker"
        min="-500"
        max="20000"
      />
      <span class="input-hint">feet</span>
    </div>

    <div class="input-group">
      <label for="watch-elevation">Watch Shows</label>
      <input
        id="watch-elevation"
        type="number"
        bind:value={watchElevation}
        placeholder="Your altimeter reading"
        min="-500"
        max="20000"
      />
      <span class="input-hint">feet</span>
    </div>

    {#if validationError}
      <div class="validation-error">{validationError}</div>
    {/if}

    <button class="btn btn-record" onclick={recordReading}>
      Record Reading
    </button>

    <!-- Timing Guidance -->
    {#if timingGuidance}
      <div class="timing-guidance" class:ready={timingGuidance.ready} class:waiting={!timingGuidance.ready}>
        <span class="timing-icon">{timingGuidance.ready ? '✓' : '⏱️'}</span>
        <span class="timing-message">{timingGuidance.message}</span>
      </div>
    {:else if readings.length === 0}
      <div class="timing-guidance intro">
        <span class="timing-icon">📍</span>
        <span class="timing-message">Record reading #1 at any known elevation (FarOut, trail marker, summit).</span>
      </div>
    {/if}

    {#if readings.length > 0}
      <div class="session-info">
        <span>Started {elapsedTimeDisplay} ago</span>
        <span class="dot"></span>
        <span>{readings.length} reading{readings.length !== 1 ? 's' : ''}</span>
        <button class="reset-link" onclick={resetSession}>Reset</button>
      </div>
    {/if}
  </div>

  <!-- Educational Section -->
  <div class="education-section">
    <button
      class="education-toggle"
      onclick={() => showEducation = !showEducation}
      aria-expanded={showEducation}
    >
      {showEducation ? '▼' : '▶'} Learn More
    </button>

    {#if showEducation}
      <div class="education-content">
        <h3>How This Works</h3>
        <p>
          Your altimeter measures air pressure and converts it to elevation. When atmospheric
          pressure drops (storm approaching), your altimeter shows you've climbed higher than you actually have —
          because lower pressure exists at higher elevations.
        </p>
        <p>
          <strong>The key insight:</strong> Compare what your altimeter <em>should</em> show vs what it <em>actually</em> shows.
          If your watch reads 50' higher than your true elevation, that's +50' of "phantom drift." Track this over time — if the drift is growing, pressure is falling and weather may be changing.
        </p>
        <p>
          <strong>You don't need to stay in one place.</strong> Take Reading 1 at any known elevation, then keep hiking.
          An hour+ later at your next known elevation point (summit, shelter, trail junction marked on FarOut), take Reading 2.
          The tool compares drift-to-drift, so your actual hiking elevation change doesn't matter.
        </p>

        <h3>Understanding the Thresholds</h3>
        <div class="threshold-table">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Drift Rate</th>
                <th>What It Means</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="level-badge clear">☀️ Clear</span></td>
                <td>&lt; 25 ft/hr</td>
                <td>Normal fluctuation</td>
              </tr>
              <tr>
                <td><span class="level-badge watch">👀 Watch</span></td>
                <td>25-50 ft/hr</td>
                <td>Minor change possible in 12-24 hours</td>
              </tr>
              <tr>
                <td><span class="level-badge warning">⚠️ Warning</span></td>
                <td>50-100 ft/hr</td>
                <td>Weather change likely in 6-12 hours</td>
              </tr>
              <tr>
                <td><span class="level-badge danger">🏃 Danger</span></td>
                <td>&gt; 100 ft/hr</td>
                <td>Storm approaching within 6-12 hours</td>
              </tr>
              <tr>
                <td><span class="level-badge imminent">⛈️ Imminent</span></td>
                <td>&gt; 100 ft in &lt;1 hr</td>
                <td>Seek shelter immediately</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Tips for Accurate Readings</h3>
        <ul>
          <li><strong>Use known elevations</strong> — FarOut, trail markers, summits, and shelters all work. Don't guess.</li>
          <li><strong>Wait 1+ hour between readings</strong> — Shorter intervals show noise, not meaningful trends.</li>
          <li><strong>Stop briefly when recording</strong> — Hold your watch still for a consistent reading.</li>
          <li><strong>Temperature affects readings</strong> — Cold air makes altimeters read high even without pressure change.</li>
          <li><strong>More readings = better data</strong> — Take a reading at each known-elevation point throughout the day.</li>
        </ul>

        <h3>The Science</h3>
        <p>
          The fundamental conversion: <strong>27 feet per millibar (hPa)</strong> or about
          <strong>1,000 feet per inch of mercury</strong>. These thresholds are based on
          mountaineering training programs and the Suunto storm alarm standard (4 hPa / 3 hours).
        </p>

        {#if readings.length > 0}
          <h3>Your Reading History</h3>
          <div class="reading-history">
            {#each readings as reading, i}
              <div class="reading-row">
                <span class="reading-time">{formatTime(reading.timestamp)}</span>
                <span class="reading-values">
                  Actual: {reading.actualElevation}' | Watch: {reading.watchElevation}'
                </span>
                <span class="reading-drift" class:positive={reading.drift > 0} class:negative={reading.drift < 0}>
                  {reading.drift > 0 ? '+' : ''}{reading.drift}'
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .storm-warning {
    font-family: system-ui, sans-serif;
  }

  /* Warning Display */
  .warning-display {
    text-align: center;
    padding: 2rem 1.5rem;
    background: var(--warning-bg);
    border-radius: 16px;
    margin-bottom: 1.5rem;
  }

  .warning-circle {
    width: 120px;
    height: 120px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    background: var(--warning-color);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .warning-circle.pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }

  .warning-icon {
    font-size: 3.5rem;
    line-height: 1;
  }

  .warning-message {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink, #1f2937);
    margin: 0 0 0.5rem;
  }

  .drift-rate {
    font-size: 1rem;
    color: var(--muted, #6b7c6e);
    margin: 0;
  }

  /* Stale Prompt */
  .stale-prompt {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .stale-prompt p {
    margin: 0 0 0.75rem;
    color: #92400e;
  }

  .stale-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  /* Input Section */
  .input-section {
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .input-group label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin-bottom: 0.375rem;
  }

  .input-group input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-size: 1.125rem;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
  }

  .input-group input:focus {
    outline: none;
    border-color: var(--pine, #4d594a);
  }

  .input-hint {
    display: block;
    font-size: 0.8rem;
    color: var(--muted, #6b7c6e);
    margin-top: 0.25rem;
  }

  .validation-error {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
  }

  .btn-record {
    width: 100%;
    background: var(--pine, #4d594a);
    color: white;
  }

  .btn-record:hover {
    background: #3d473a;
  }

  .btn-reset {
    background: #ef4444;
    color: white;
  }

  .btn-reset:hover {
    background: #dc2626;
  }

  .btn-secondary {
    background: var(--card, #fff);
    color: var(--pine, #4d594a);
    border: 1px solid var(--border, #e6e1d4);
  }

  .btn-secondary:hover {
    background: var(--bg, #f5f2e8);
  }

  .session-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: var(--muted, #6b7c6e);
    flex-wrap: wrap;
  }

  .session-info .dot {
    width: 4px;
    height: 4px;
    background: var(--muted, #6b7c6e);
    border-radius: 50%;
  }

  .reset-link {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 0.9rem;
    text-decoration: underline;
    padding: 0;
    margin-left: auto;
  }

  .reset-link:hover {
    color: #b91c1c;
  }

  /* Timing Guidance */
  .timing-guidance {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .timing-guidance.intro {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #1e40af;
  }

  .timing-guidance.ready {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #15803d;
  }

  .timing-guidance.waiting {
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #a16207;
  }

  .timing-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .timing-message {
    line-height: 1.4;
  }

  /* Education Section */
  .education-section {
    margin-top: 1rem;
  }

  .education-toggle {
    background: none;
    border: none;
    color: var(--pine, #4d594a);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .education-toggle:hover {
    color: var(--ink, #1f2937);
  }

  .education-content {
    padding: 1.5rem;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 12px;
    margin-top: 0.5rem;
  }

  .education-content h3 {
    font-size: 1.1rem;
    color: var(--pine, #4d594a);
    margin: 1.5rem 0 0.75rem;
  }

  .education-content h3:first-child {
    margin-top: 0;
  }

  .education-content p {
    line-height: 1.7;
    color: var(--fg, #333);
    margin: 0.75rem 0;
  }

  .education-content ul {
    margin: 0.75rem 0;
    padding-left: 1.25rem;
  }

  .education-content li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  /* Threshold Table */
  .threshold-table {
    overflow-x: auto;
    margin: 1rem 0;
  }

  .threshold-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .threshold-table th {
    text-align: left;
    padding: 0.625rem 0.75rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 2px solid var(--border, #e6e1d4);
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  .threshold-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
    vertical-align: middle;
  }

  .level-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .level-badge.clear { background: rgba(34, 197, 94, 0.15); color: #15803d; }
  .level-badge.watch { background: rgba(234, 179, 8, 0.15); color: #a16207; }
  .level-badge.warning { background: rgba(249, 115, 22, 0.15); color: #c2410c; }
  .level-badge.danger { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  .level-badge.imminent { background: rgba(239, 68, 68, 0.2); color: #dc2626; }

  /* Reading History */
  .reading-history {
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    padding: 0.75rem;
    margin-top: 0.5rem;
  }

  .reading-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border, #e6e1d4);
    font-size: 0.85rem;
  }

  .reading-row:last-child {
    border-bottom: none;
  }

  .reading-time {
    font-weight: 600;
    color: var(--pine, #4d594a);
    min-width: 60px;
  }

  .reading-values {
    flex: 1;
    color: var(--muted, #6b7c6e);
  }

  .reading-drift {
    font-weight: 600;
    min-width: 50px;
    text-align: right;
  }

  .reading-drift.positive { color: #dc2626; }
  .reading-drift.negative { color: #15803d; }

  /* Mobile */
  @media (max-width: 480px) {
    .storm-warning {
      /* Mobile adjustments */
    }

    .warning-circle {
      width: 100px;
      height: 100px;
    }

    .warning-icon {
      font-size: 2.5rem;
    }

    .warning-message {
      font-size: 1.1rem;
    }

    .threshold-table {
      font-size: 0.8rem;
    }

    .reading-row {
      flex-wrap: wrap;
    }

    .reading-values {
      width: 100%;
      order: 3;
      margin-top: 0.25rem;
    }
  }
</style>
