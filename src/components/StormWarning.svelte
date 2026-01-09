<script lang="ts">
  import { onMount } from 'svelte';

  // Accept trailContext prop for consistency with other tools
  let { trailContext = {} } = $props();

  interface Reading {
    id: string;
    timestamp: number;
    elevation: number;
    note: string;
  }

  interface DriftResult {
    rate: number;
    direction: 'rising' | 'falling' | 'stable';
    timeSpanMinutes: number;
  }

  interface WarningLevel {
    icon: string;
    label: string;
    action: string;
    explanation: string;
    threshold: string;
    color: string;
    bgColor: string;
  }

  // State
  let readings = $state<Reading[]>([]);
  let newElevation = $state<string>('');
  let newNote = $state<string>('');
  let showGraph = $state<boolean>(false);
  let showFieldGuide = $state<boolean>(false);
  let mounted = $state(false);

  // localStorage persistence
  const STORAGE_KEY = 'storm-warning-journal';

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

  // Calculate drift between two most recent readings
  let drift = $derived.by<DriftResult | null>(() => {
    if (readings.length < 2) return null;

    const latest = readings[0];
    const previous = readings[1];

    const elevationChange = latest.elevation - previous.elevation;
    const timeSpanMs = latest.timestamp - previous.timestamp;
    const timeSpanMinutes = timeSpanMs / (1000 * 60);
    const timeSpanHours = timeSpanMinutes / 60;

    if (timeSpanHours === 0) return null;

    const rate = Math.abs(elevationChange / timeSpanHours);
    const direction: 'rising' | 'falling' | 'stable' =
      elevationChange > 5 ? 'rising' : elevationChange < -5 ? 'falling' : 'stable';

    return { rate, direction, timeSpanMinutes };
  });

  // Determine warning level based on drift rate
  let warningLevel = $derived.by<WarningLevel>(() => {
    if (!drift) {
      return {
        icon: '☀️',
        label: 'Clear',
        action: 'Keep hiking - conditions look stable.',
        explanation: 'Normal atmospheric fluctuation. No weather concerns.',
        threshold: '< 25 ft/hr',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.1)'
      };
    }

    const rate = drift.rate;
    const timeSpanMinutes = drift.timeSpanMinutes;

    // Imminent: > 100 ft in < 1 hour
    if (rate > 100 && timeSpanMinutes < 60) {
      return {
        icon: '⛈️',
        label: 'Imminent',
        action: 'Seek shelter immediately! Rapid pressure change detected.',
        explanation: 'Extreme pressure shift indicates storm arriving within minutes.',
        threshold: '> 100 ft in < 1 hr',
        color: '#7c3aed',
        bgColor: 'rgba(124, 58, 237, 0.15)'
      };
    }

    // Danger: > 100 ft/hr
    if (rate > 100) {
      return {
        icon: '🏃',
        label: 'Danger',
        action: 'Find shelter now. Storm approaching within 6-12 hours.',
        explanation: 'Significant pressure drop. Plan for severe weather.',
        threshold: '> 100 ft/hr',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)'
      };
    }

    // Warning: 50-100 ft/hr
    if (rate > 50) {
      return {
        icon: '⚠️',
        label: 'Warning',
        action: 'Weather change likely in 6-12 hours. Consider shelter options.',
        explanation: 'Notable pressure trend. Monitor conditions closely.',
        threshold: '50-100 ft/hr',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)'
      };
    }

    // Watch: 25-50 ft/hr
    if (rate > 25) {
      return {
        icon: '👀',
        label: 'Watch',
        action: 'Minor change possible in 12-24 hours. Stay aware.',
        explanation: 'Subtle pressure drift. Worth noting but not urgent.',
        threshold: '25-50 ft/hr',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)'
      };
    }

    // Clear: < 25 ft/hr
    return {
      icon: '☀️',
      label: 'Clear',
      action: 'Keep hiking - conditions look stable.',
      explanation: 'Normal atmospheric fluctuation. No weather concerns.',
      threshold: '< 25 ft/hr',
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)'
    };
  });

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function addReading() {
    const elevation = parseFloat(newElevation);
    if (isNaN(elevation)) return;

    const reading: Reading = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      elevation,
      note: newNote.trim()
    };

    readings = [reading, ...readings];
    newElevation = '';
    newNote = '';
  }

  function deleteReading(id: string) {
    readings = readings.filter(r => r.id !== id);
  }

  function clearAll() {
    readings = [];
  }

  function getDriftBetween(current: Reading, previous: Reading): DriftResult | null {
    const elevationChange = current.elevation - previous.elevation;
    const timeSpanMs = current.timestamp - previous.timestamp;
    const timeSpanMinutes = timeSpanMs / (1000 * 60);
    const timeSpanHours = timeSpanMinutes / 60;

    if (timeSpanHours === 0) return null;

    const rate = Math.abs(elevationChange / timeSpanHours);
    const direction: 'rising' | 'falling' | 'stable' =
      elevationChange > 5 ? 'rising' : elevationChange < -5 ? 'falling' : 'stable';

    return { rate, direction, timeSpanMinutes };
  }

  function formatDriftRate(d: DriftResult | null): string {
    if (!d) return '--';
    const sign = d.direction === 'rising' ? '+' : d.direction === 'falling' ? '-' : '';
    return `${sign}${Math.round(d.rate)} ft/hr`;
  }

  // Graph calculations
  let graphData = $derived.by(() => {
    if (readings.length < 2) return null;

    const sorted = [...readings].reverse();
    const elevations = sorted.map(r => r.elevation);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const range = maxElev - minElev || 100;
    const padding = range * 0.1;

    return {
      readings: sorted,
      minElev: minElev - padding,
      maxElev: maxElev + padding,
      range: range + padding * 2
    };
  });
</script>

<div class="storm-tracker">
  <!-- Warning Ribbon -->
  <div class="warning-ribbon" style="background: {warningLevel.bgColor}; border-color: {warningLevel.color};">
    <div class="ribbon-main">
      <span class="ribbon-icon">{warningLevel.icon}</span>
      <div class="ribbon-content">
        <div class="ribbon-header">
          <span class="ribbon-label" style="color: {warningLevel.color};">{warningLevel.label}</span>
          {#if drift}
            <span class="ribbon-rate">
              {formatDriftRate(drift)}
              <span class="rate-direction">({drift.direction === 'falling' ? 'pressure falling' : drift.direction === 'rising' ? 'pressure rising' : 'stable'})</span>
            </span>
          {/if}
        </div>
        <p class="ribbon-action">{warningLevel.action}</p>
        <div class="ribbon-details">
          <span class="threshold">Threshold: {warningLevel.threshold}</span>
          <span class="separator">|</span>
          <span class="explanation">{warningLevel.explanation}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- New Entry Section -->
  <div class="entry-section">
    <div class="entry-header">
      <span class="hand entry-title">New Field Entry</span>
      <span class="entry-date">{formatCurrentDate()}</span>
    </div>

    <div class="entry-form">
      <div class="form-row">
        <label class="form-label">
          <span class="label-text">Altimeter Reading</span>
          <div class="input-wrapper">
            <input
              type="number"
              bind:value={newElevation}
              placeholder="3450"
              class="elevation-input"
            />
            <span class="input-suffix">ft</span>
          </div>
        </label>

        <label class="form-label note-label">
          <span class="label-text">Trail Notes (optional)</span>
          <input
            type="text"
            bind:value={newNote}
            placeholder="At McAfee Knob, clouds building..."
            class="note-input"
          />
        </label>
      </div>

      <div class="form-actions">
        <button onclick={addReading} class="add-button" disabled={!newElevation}>
          <span class="hand">Log Entry</span>
        </button>
        {#if readings.length > 0}
          <button onclick={clearAll} class="clear-button" title="Clear all entries">
            Clear All
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Journal Entries -->
  <div class="journal-section">
    <div class="journal-header">
      <span class="hand section-title">Pressure Log</span>
      <span class="entry-count">{readings.length} {readings.length === 1 ? 'entry' : 'entries'}</span>
    </div>

    {#if readings.length === 0}
      <div class="empty-journal">
        <div class="empty-icon">📓</div>
        <p class="hand empty-text">Your trail journal awaits...</p>
        <p class="empty-hint">Log your first altimeter reading above to start tracking pressure changes.</p>
      </div>
    {:else}
      <div class="journal-entries">
        {#each readings as reading, index}
          {@const previousReading = readings[index + 1]}
          {@const entryDrift = previousReading ? getDriftBetween(reading, previousReading) : null}

          <div class="journal-entry">
            <div class="entry-timestamp">
              <span class="hand timestamp-time">{formatTime(reading.timestamp)}</span>
              <span class="timestamp-date">{formatDate(reading.timestamp)}</span>
            </div>

            <div class="entry-body">
              <div class="elevation-display">
                <span class="elevation-value">{reading.elevation.toLocaleString()}</span>
                <span class="elevation-unit">ft</span>
              </div>

              {#if entryDrift}
                <div class="drift-badge" class:rising={entryDrift.direction === 'rising'} class:falling={entryDrift.direction === 'falling'}>
                  <span class="drift-arrow">{entryDrift.direction === 'rising' ? '↑' : entryDrift.direction === 'falling' ? '↓' : '→'}</span>
                  <span class="drift-value">{formatDriftRate(entryDrift)}</span>
                </div>
              {:else if index === readings.length - 1}
                <div class="drift-badge first">
                  <span class="drift-value">First entry</span>
                </div>
              {/if}

              {#if reading.note}
                <p class="entry-note hand">"{reading.note}"</p>
              {/if}
            </div>

            <button class="delete-btn" onclick={() => deleteReading(reading.id)} title="Delete entry">
              x
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Analytics Panel Toggle -->
  {#if readings.length >= 2}
    <button class="toggle-section" onclick={() => showGraph = !showGraph}>
      <span>{showGraph ? '▼' : '▶'}</span>
      <span class="hand">Trend Chart</span>
    </button>

    {#if showGraph && graphData}
      <div class="graph-panel">
        <div class="graph-container">
          <svg viewBox="0 0 300 120" class="trend-graph">
            <!-- Grid lines -->
            {#each [0, 0.25, 0.5, 0.75, 1] as y}
              <line
                x1="40" y1={10 + y * 100}
                x2="290" y2={10 + y * 100}
                stroke="var(--border)"
                stroke-width="1"
                stroke-dasharray={y === 0.5 ? "none" : "2,2"}
              />
            {/each}

            <!-- Y-axis labels -->
            <text x="35" y="15" class="axis-label" text-anchor="end">
              {Math.round(graphData.maxElev).toLocaleString()}
            </text>
            <text x="35" y="65" class="axis-label" text-anchor="end">
              {Math.round((graphData.maxElev + graphData.minElev) / 2).toLocaleString()}
            </text>
            <text x="35" y="113" class="axis-label" text-anchor="end">
              {Math.round(graphData.minElev).toLocaleString()}
            </text>

            <!-- Line path -->
            <polyline
              fill="none"
              stroke="var(--pine)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              points={graphData.readings.map((r, i) => {
                const x = 50 + (i / Math.max(graphData.readings.length - 1, 1)) * 230;
                const y = 10 + ((graphData.maxElev - r.elevation) / graphData.range) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />

            <!-- Data points -->
            {#each graphData.readings as reading, i}
              {@const x = 50 + (i / Math.max(graphData.readings.length - 1, 1)) * 230}
              {@const y = 10 + ((graphData.maxElev - reading.elevation) / graphData.range) * 100}
              <circle
                cx={x} cy={y} r="4"
                fill="var(--card)"
                stroke="var(--pine)"
                stroke-width="2"
              />
            {/each}
          </svg>
        </div>
        <p class="graph-caption">Elevation readings over time - falling indicates dropping pressure</p>
      </div>
    {/if}
  {/if}

  <!-- Field Guide Toggle -->
  <button class="toggle-section" onclick={() => showFieldGuide = !showFieldGuide}>
    <span>{showFieldGuide ? '▼' : '▶'}</span>
    <span class="hand">Field Guide: Reading Pressure</span>
  </button>

  {#if showFieldGuide}
    <div class="field-guide">
      <div class="guide-intro">
        <p>Your altimeter reads barometric pressure as elevation. When weather changes, pressure shifts - causing your altimeter to show a different elevation even when you have not moved.</p>
      </div>

      <div class="guide-section">
        <h4 class="hand">How It Works</h4>
        <p>While stationary, record your altimeter. Check again after 30-60 minutes. The "drift" reveals pressure changes:</p>
        <ul class="guide-list">
          <li><strong>Falling reading</strong> = Pressure dropping = Weather moving in</li>
          <li><strong>Rising reading</strong> = Pressure rising = Clearing skies</li>
          <li><strong>Stable reading</strong> = Pressure steady = Current conditions continue</li>
        </ul>
      </div>

      <div class="guide-section">
        <h4 class="hand">Warning Thresholds</h4>
        <div class="threshold-grid">
          <div class="threshold-item">
            <span class="t-icon">☀️</span>
            <span class="t-range">&lt; 25 ft/hr</span>
            <span class="t-meaning">Normal</span>
          </div>
          <div class="threshold-item">
            <span class="t-icon">👀</span>
            <span class="t-range">25-50 ft/hr</span>
            <span class="t-meaning">Watch</span>
          </div>
          <div class="threshold-item">
            <span class="t-icon">⚠️</span>
            <span class="t-range">50-100 ft/hr</span>
            <span class="t-meaning">Warning</span>
          </div>
          <div class="threshold-item">
            <span class="t-icon">🏃</span>
            <span class="t-range">&gt; 100 ft/hr</span>
            <span class="t-meaning">Danger</span>
          </div>
          <div class="threshold-item">
            <span class="t-icon">⛈️</span>
            <span class="t-range">&gt; 100 ft in &lt; 1hr</span>
            <span class="t-meaning">Imminent</span>
          </div>
        </div>
      </div>

      <div class="guide-section">
        <h4 class="hand">Best Practices</h4>
        <ul class="guide-list">
          <li>Take readings every 30-60 minutes when conditions look uncertain</li>
          <li>Always calibrate at known elevations (trail markers, summits)</li>
          <li>Combine with sky observation - clouds + pressure drop = action time</li>
          <li>Rapid drops (&gt; 100 ft/hr) mean seek shelter within hours, not days</li>
        </ul>
      </div>
    </div>
  {/if}
</div>

<style>
  .storm-tracker {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }

  /* Warning Ribbon */
  .warning-ribbon {
    border: 2px solid;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    background: var(--card);
  }

  .ribbon-main {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .ribbon-icon {
    font-size: 2rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .ribbon-content {
    flex: 1;
    min-width: 0;
  }

  .ribbon-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.25rem;
  }

  .ribbon-label {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 1.25rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .ribbon-rate {
    font-size: 0.9rem;
    color: var(--ink);
    font-weight: 600;
  }

  .rate-direction {
    font-weight: 400;
    color: var(--muted);
  }

  .ribbon-action {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: var(--ink);
    line-height: 1.4;
  }

  .ribbon-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .separator {
    color: var(--border);
  }

  .threshold {
    font-weight: 600;
  }

  /* Entry Section */
  .entry-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    position: relative;
  }

  .entry-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--pine), var(--alpine));
    border-radius: 12px 12px 0 0;
  }

  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px dashed var(--border);
  }

  .entry-title {
    font-size: 1.5rem;
    color: var(--pine);
  }

  .entry-date {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .entry-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
  }

  @media (max-width: 500px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  .form-label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .note-label {
    min-width: 0;
  }

  .label-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .elevation-input {
    width: 100px;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 1.1rem;
    font-family: inherit;
    background: #fdfcf7;
  }

  .elevation-input:focus {
    outline: none;
    border-color: var(--pine);
    box-shadow: 0 0 0 3px rgba(77, 89, 74, 0.1);
  }

  .input-suffix {
    font-size: 0.9rem;
    color: var(--muted);
    font-weight: 500;
  }

  .note-input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    font-family: Caveat, cursive;
    background: #fdfcf7;
  }

  .note-input:focus {
    outline: none;
    border-color: var(--pine);
    box-shadow: 0 0 0 3px rgba(77, 89, 74, 0.1);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .add-button {
    padding: 0.6rem 1.5rem;
    background: var(--pine);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .add-button:hover:not(:disabled) {
    background: #3d4a3a;
    transform: translateY(-1px);
  }

  .add-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear-button {
    padding: 0.5rem 0.75rem;
    background: transparent;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .clear-button:hover {
    background: #fee2e2;
  }

  /* Journal Section */
  .journal-section {
    margin-bottom: 1.5rem;
  }

  .journal-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: 1.75rem;
    color: var(--pine);
  }

  .entry-count {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .empty-journal {
    text-align: center;
    padding: 3rem 1.5rem;
    background: var(--card);
    border: 2px dashed var(--border);
    border-radius: 12px;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  .empty-text {
    font-size: 1.5rem;
    color: var(--pine);
    margin: 0 0 0.5rem;
  }

  .empty-hint {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0;
  }

  /* Journal Entries */
  .journal-entries {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .journal-entry {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: start;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    position: relative;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .journal-entry::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: var(--alpine);
    border-radius: 0 3px 3px 0;
  }

  .journal-entry:hover {
    border-color: #d6d1c4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .entry-timestamp {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 70px;
  }

  .timestamp-time {
    font-size: 1.25rem;
    color: var(--ink);
    line-height: 1.2;
  }

  .timestamp-date {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .entry-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .elevation-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .elevation-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--ink);
  }

  .elevation-unit {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .drift-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    background: #f0f0f0;
    color: var(--muted);
    width: fit-content;
  }

  .drift-badge.rising {
    background: rgba(34, 197, 94, 0.15);
    color: #16a34a;
  }

  .drift-badge.falling {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }

  .drift-badge.first {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .drift-arrow {
    font-size: 0.9rem;
  }

  .entry-note {
    font-size: 1.1rem;
    color: var(--pine);
    margin: 0;
    font-style: italic;
  }

  .delete-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease, color 0.15s ease;
    border-radius: 4px;
  }

  .journal-entry:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  /* Toggle Sections */
  .toggle-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--pine);
    margin-bottom: 0.75rem;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .toggle-section:hover {
    background: rgba(77, 89, 74, 0.05);
    border-color: var(--alpine);
  }

  .toggle-section span:first-child {
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Graph Panel */
  .graph-panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .graph-container {
    width: 100%;
    overflow-x: auto;
  }

  .trend-graph {
    width: 100%;
    height: auto;
    min-height: 120px;
  }

  .axis-label {
    font-size: 8px;
    fill: var(--muted);
  }

  .graph-caption {
    text-align: center;
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0.75rem 0 0;
  }

  /* Field Guide */
  .field-guide {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .guide-intro {
    padding-bottom: 1rem;
    border-bottom: 1px dashed var(--border);
    margin-bottom: 1rem;
  }

  .guide-intro p {
    margin: 0;
    color: var(--ink);
    line-height: 1.6;
  }

  .guide-section {
    margin-bottom: 1.25rem;
  }

  .guide-section:last-child {
    margin-bottom: 0;
  }

  .guide-section h4 {
    font-size: 1.35rem;
    color: var(--pine);
    margin: 0 0 0.5rem;
  }

  .guide-section p {
    margin: 0 0 0.75rem;
    color: var(--ink);
    line-height: 1.5;
  }

  .guide-list {
    margin: 0;
    padding-left: 1.25rem;
    color: var(--ink);
  }

  .guide-list li {
    margin-bottom: 0.35rem;
    line-height: 1.5;
  }

  .threshold-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .threshold-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fdfcf7;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .t-icon {
    font-size: 1.25rem;
  }

  .t-range {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ink);
  }

  .t-meaning {
    font-size: 0.75rem;
    color: var(--muted);
    margin-left: auto;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .journal-entry,
    .add-button,
    .toggle-section,
    .delete-btn {
      transition: none;
    }
  }
</style>
