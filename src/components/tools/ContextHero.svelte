<script lang="ts">
  import { trailContext } from '../../stores/trailContext.svelte';

  let { onEdit } = $props<{ onEdit?: () => void }>();
</script>

<section class="card hero-card" aria-label="Trail context">
  <div class="hero-head">
    <div class="hero-mile">
      <span class="mile-num">{trailContext.currentMile}</span>
      <span class="mile-unit">mi</span>
    </div>

    <div class="hero-meta">
      <div class="hero-landmark">
        {#if trailContext.currentMile === 0}
          at {trailContext.nearestLandmark.name}
        {:else}
          near {trailContext.nearestLandmark.name}
        {/if}
      </div>
      <div class="badges" role="list">
        <span class="badge" role="listitem"><strong>Mode</strong> {trailContext.mode}</span>
        <span class="badge" role="listitem"><strong>Pace</strong> {trailContext.targetPace} mi/day</span>
        <span class="badge" role="listitem"><strong>Zeros</strong> {trailContext.zeroDaysPerMonth}/mo</span>
      </div>
    </div>

    <div class="hero-actions">
      <button class="btn btn-primary" type="button" onclick={() => onEdit?.()}>
        Edit settings
      </button>
    </div>
  </div>

  <div class="hero-progress" aria-label="Progress">
    <div class="progress-track" aria-hidden="true">
      <div class="progress-fill" style={`width: ${Math.min(100, Math.max(0, trailContext.percentComplete))}%`}></div>
    </div>
    <div class="progress-meta">
      <span class="muted">{trailContext.percentComplete}% complete</span>
      <span class="muted">Projected finish: {trailContext.projectedFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    </div>
  </div>
</section>

<style>
  .hero-card {
    padding: 1rem;
  }

  .hero-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
  }

  @media (max-width: 820px) {
    .hero-head {
      grid-template-columns: 1fr;
      align-items: start;
    }
    .hero-actions {
      justify-self: start;
    }
  }

  .hero-mile {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  .mile-num {
    font-family: Oswald, Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
    font-size: clamp(2.25rem, 6vw, 3.2rem);
    line-height: 1;
    color: var(--ink);
  }

  .mile-unit {
    font-weight: 700;
    color: var(--muted);
  }

  .hero-landmark {
    color: var(--pine);
    font-weight: 700;
    margin-bottom: 0.35rem;
  }

  .hero-progress {
    margin-top: 0.9rem;
  }

  .progress-track {
    height: 10px;
    background: rgba(204, 204, 204, 0.45);
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid var(--border);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--marker));
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  .muted {
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>

