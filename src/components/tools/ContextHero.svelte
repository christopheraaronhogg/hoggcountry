<script lang="ts">
  import { trailContext, updateContext, TRAIL_TOTAL_MILES } from '../../stores/trailContext.svelte';

  interface Props {
    onEditClick?: () => void;
  }

  let { onEditClick }: Props = $props();

  // Format date for display
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div class="context-hero">
  <div class="hero-content">
    <!-- Mile Display -->
    <div class="mile-section">
      <div class="mile-display">
        <span class="mile-current">{trailContext.currentMile}</span>
        <span class="mile-divider">/</span>
        <span class="mile-total">{Math.round(TRAIL_TOTAL_MILES)}</span>
      </div>

      <button class="edit-btn" onclick={onEditClick} aria-label="Edit trail settings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {trailContext.percentComplete}%"></div>
      </div>
      <span class="progress-pct">{trailContext.percentComplete.toFixed(0)}%</span>
    </div>

    <!-- Context Info -->
    <div class="context-info">
      <span class="landmark">
        {#if trailContext.currentMile === 0}
          At Springer Mountain
        {:else}
          Near {trailContext.nearestLandmark.name}
        {/if}
      </span>
      <span class="divider">*</span>
      <span class="date">{formatDate(new Date(trailContext.effectiveDate))}</span>
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

    <!-- Mode Badge -->
    <div class="mode-badge" class:on-trail={trailContext.isOnTrail}>
      {#if trailContext.isOnTrail}
        <span class="badge-dot"></span>
        On Trail
      {:else}
        Planning
      {/if}
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

  /* Mile Section */
  .mile-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .mile-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .mile-current {
    font-family: Oswald, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
  }

  .mile-divider {
    font-size: 1.5rem;
    color: rgba(255,255,255,0.4);
    margin: 0 0.25rem;
  }

  .mile-total {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    color: rgba(255,255,255,0.5);
  }

  .edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn:hover {
    background: rgba(255,255,255,0.2);
    color: #fff;
  }

  /* Progress Section */
  .progress-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine, #7b9e6b), var(--marker, #f0e000));
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-pct {
    font-family: Oswald, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    min-width: 3rem;
    text-align: right;
  }

  /* Context Info */
  .context-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }

  .landmark {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.8);
  }

  .divider {
    color: rgba(255,255,255,0.3);
    font-size: 0.75rem;
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
    position: absolute;
    top: 1rem;
    right: 1rem;
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

    .mile-current {
      font-size: 2.5rem;
    }

    .stats-row {
      gap: 0.5rem;
    }

    .stat-value {
      font-size: 1rem;
    }

    .mode-badge {
      position: static;
      margin-top: 1rem;
      justify-content: center;
    }
  }
</style>
