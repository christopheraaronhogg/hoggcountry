<script lang="ts">
  import { trailContext } from '../../stores/trailContext.svelte';
  import QuickMileControl from './QuickMileControl.svelte';
  import MileScrubber from './MileScrubber.svelte';
  import ContextSettingsPanel from './ContextSettingsPanel.svelte';

  let settingsOpen = $state(false);

  // Format date for display
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div class="context-hero">
  <div class="hero-content">
    <!-- Header -->
    <div class="hero-header">
      <div class="hero-primary">
        <div class="eyebrow">Mile marker</div>
        <QuickMileControl />
        <div class="primary-meta" aria-label="Current trail context">
          <span class="landmark">
            {#if trailContext.currentMile === 0}
              At Springer Mountain
            {:else}
              Near {trailContext.nearestLandmark.name}
            {/if}
          </span>
          <span class="dot">•</span>
          <span class="date">{formatDate(new Date(trailContext.effectiveDate))}</span>
        </div>
      </div>

      <div class="hero-actions">
        <div class="mode-badge" class:on-trail={trailContext.isOnTrail}>
          {#if trailContext.isOnTrail}
            <span class="badge-dot"></span>
            On Trail
          {:else}
            Planning
          {/if}
        </div>

        <button
          class="edit-btn"
          type="button"
          aria-expanded={settingsOpen}
          aria-controls="trail-settings-panel"
          onclick={() => (settingsOpen = !settingsOpen)}
        >
          Settings
        </button>
      </div>
    </div>

    <div id="trail-settings-panel">
      <ContextSettingsPanel isOpen={settingsOpen} onClose={() => (settingsOpen = false)} />
    </div>

    <!-- Progress -->
    <div class="progress-section">
      <MileScrubber />

      <div class="progress-metrics" aria-label="Progress metrics">
        <span class="progress-pct">{trailContext.percentComplete.toFixed(0)}%</span>
        <span class="progress-left">{trailContext.milesRemaining} mi left</span>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat">
        <span class="stat-label">Projected Finish</span>
        <span class="stat-value">{formatDate(trailContext.projectedFinish)}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Target Pace</span>
        <span class="stat-value">{trailContext.targetPace} <small>mi/day</small></span>
      </div>
      <div class="stat">
        <span class="stat-label">Days Left</span>
        <span class="stat-value">{trailContext.daysToFinish}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .context-hero {
    background: linear-gradient(135deg, #3d4a38 0%, #2c362a 100%);
    border-radius: 16px;
    padding: 1.5rem;
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  .context-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 30 Q25 10 50 30 T100 30' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q25 50 50 70 T100 70' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3C/svg%3E");
    background-size: 80px 80px;
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  /* Header */
  .hero-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    align-items: start;
    margin-bottom: 1.1rem;
  }

  .hero-primary {
    display: grid;
    gap: 0.5rem;
  }

  .eyebrow {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }

  .primary-meta {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.35);
  }

  .hero-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding-top: 0.15rem;
  }

  .edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0 0.75rem;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  .edit-btn:hover {
    background: rgba(255,255,255,0.2);
    color: #fff;
  }

  /* Progress Section */
  .progress-section {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.1rem;
  }

  .progress-metrics {
    display: grid;
    justify-items: end;
    gap: 0.1rem;
    min-width: 4.25rem;
  }

  .progress-pct {
    font-family: Oswald, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    text-align: right;
  }

  .progress-left {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.55);
  }

  .landmark {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.8);
  }

  .date {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.6);
  }

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
  }

  .stat {
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.5);
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }

  .stat-value small {
    font-size: 0.7rem;
    font-weight: 400;
    color: rgba(255,255,255,0.5);
  }

  /* Mode Badge */
  .mode-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    background: rgba(240, 224, 0, 0.15);
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--marker, #f0e000);
  }

  .mode-badge.on-trail {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Responsive */
  @media (max-width: 480px) {
    .context-hero {
      padding: 1.25rem;
    }

    .stats-row {
      gap: 0.5rem;
    }

    .stat-value {
      font-size: 1rem;
    }

    .hero-header {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .hero-actions {
      justify-content: flex-start;
    }
  }

  @media (max-width: 560px) {
    .edit-btn {
      width: 100%;
    }
  }
</style>
