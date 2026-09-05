<script lang="ts">
  import { DAD_HIKE_FINISH_LABEL } from '../dad-hike';
  import { resolve } from '$app/paths';
  import type { JourneySummary } from '$lib/server/journey';

  interface Props {
    journey: JourneySummary;
  }

  const { journey }: Props = $props();

  function fmt(n: number): string {
    return typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 1 }) : String(n);
  }

  const isPreview = $derived(journey?.isPreview ?? true);
  const pct = $derived(Math.max(0, Math.min(100, journey?.percentComplete ?? 0)));
</script>

<aside class="scout-demo-banner" aria-label="Scout app, demoed by Dad's completed thru-hike">
  <div class="sdb-inner">
    <div class="sdb-copy">
      <p class="sdb-kicker">Scout · The trail app</p>
      <h2 class="sdb-headline">
        {#if journey.completedOn}
          💯 Dad finished the Appalachian Trail on {DAD_HIKE_FINISH_LABEL}. Springer to Katahdin — every mile complete.
        {:else if isPreview}
          Dad steps onto the AT Feb&nbsp;2026. <span class="sdb-em">Scout</span> is being shaped around the planning, packing, and trail checks this hike actually needs.
        {:else}
          Dad is at <span class="sdb-em">mile&nbsp;{fmt(journey.currentMile)}</span>{#if journey.currentStateName}, {journey.currentStateName}{/if}. <span class="sdb-em">Scout</span> is the trail app we're building toward the kind of help he can actually use out there.
        {/if}
      </h2>
      <p class="sdb-sub">
        hoggcountry.com is the proving ground. The product is a phone app — a field-grade trail assistant for planning miles, watching weather, finding water, and saying what it can't verify.
      </p>

      <div class="sdb-stats" role="list" aria-label="Live trail status">
        <div class="sdb-stat" role="listitem">
          <span class="sdb-stat-label">Progress</span>
          <span class="sdb-stat-value">{journey.completedOn ? '💯 100%' : isPreview ? 'Mile 0' : `${pct}%`}</span>
        </div>
        <div class="sdb-stat" role="listitem">
          <span class="sdb-stat-label">{isPreview ? 'Trail to go' : 'To Katahdin'}</span>
          <span class="sdb-stat-value">{fmt(journey?.milesRemaining ?? 2197.4)} <small>mi</small></span>
        </div>
        {#if !isPreview && journey?.daysOnTrail}
          <div class="sdb-stat" role="listitem">
            <span class="sdb-stat-label">{journey.completedOn ? 'Days on trail' : 'On trail'}</span>
            <span class="sdb-stat-value">{journey.completedOn ? '' : 'Day '}{journey.daysOnTrail}</span>
          </div>
        {/if}
        {#if !isPreview && journey?.paceMilesPerDay}
          <div class="sdb-stat" role="listitem">
            <span class="sdb-stat-label">Pace</span>
            <span class="sdb-stat-value">{journey.paceMilesPerDay} <small>mi/day</small></span>
          </div>
        {/if}
      </div>

      <div class="sdb-rail" aria-hidden="true">
        <span class="sdb-rail-fill" style:width={`${pct}%`}></span>
        <span class="sdb-rail-marker" style:left={`${pct}%`}></span>
      </div>

      <div class="sdb-actions">
        <a class="sdb-btn sdb-btn--primary" href={resolve('/scout')}>
          <span>See what Scout does</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
        <a class="sdb-btn" href={resolve('/journey')}>See the completed hike</a>
      </div>
      <p class="sdb-note">App Store and Google Play listings are not live yet — get on the waitlist below and we'll send the link the day it ships.</p>
    </div>
  </div>
</aside>

<style>
  .scout-demo-banner {
    background: linear-gradient(135deg, #2c3a2e 0%, var(--pine) 60%, #3a4438 100%);
    color: #f5f2e8;
    border-bottom: 3px solid rgba(217, 119, 6, 0.55);
  }

  .sdb-inner {
    width: min(1120px, calc(100% - 2rem));
    margin: 0 auto;
    padding: clamp(1.4rem, 4vw, 2.4rem) 0;
    display: grid;
    gap: 1.1rem;
  }

  .sdb-copy {
    display: grid;
    gap: 0.85rem;
    max-width: 64ch;
  }

  .sdb-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(245, 242, 232, 0.7);
  }

  .sdb-headline {
    margin: 0;
    font-family: Oswald, Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: clamp(1.55rem, 4.6vw, 2.4rem);
    line-height: 1.08;
    letter-spacing: 0.005em;
    color: #f7f3e6;
    text-wrap: balance;
  }

  .sdb-em {
    color: #f4c674;
  }

  .sdb-sub {
    margin: 0;
    font-size: clamp(0.95rem, 2.4vw, 1.05rem);
    line-height: 1.55;
    color: rgba(245, 242, 232, 0.85);
    max-width: 56ch;
  }

  .sdb-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 0.85rem;
    margin-top: 0.2rem;
  }

  .sdb-stat {
    display: grid;
    gap: 0.05rem;
    padding: 0.4rem 0.7rem 0.45rem;
    border: 1px solid rgba(245, 242, 232, 0.22);
    background: rgba(0, 0, 0, 0.18);
    border-radius: 0.55rem;
    min-width: 5.6rem;
  }

  .sdb-stat-label {
    font-size: 0.62rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(245, 242, 232, 0.65);
  }

  .sdb-stat-value {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.15rem;
    line-height: 1;
    color: #f7f3e6;
  }

  .sdb-stat-value small {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: rgba(245, 242, 232, 0.7);
    margin-left: 0.15rem;
  }

  .sdb-rail {
    position: relative;
    width: min(100%, 32rem);
    height: 6px;
    border-radius: 999px;
    background: rgba(245, 242, 232, 0.18);
    margin-top: 0.1rem;
  }

  .sdb-rail-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--alpine), #f4c674);
  }

  .sdb-rail-marker {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--terra);
    border: 2px solid #f5f2e8;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.3);
  }

  .sdb-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.15rem;
  }

  .sdb-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.6rem;
    padding: 0 1rem;
    border-radius: 999px;
    border: 1px solid rgba(245, 242, 232, 0.35);
    background: transparent;
    color: #f5f2e8;
    font-weight: 800;
    text-decoration: none;
    font-size: 0.92rem;
  }

  .sdb-btn--primary {
    background: var(--terra);
    border-color: var(--terra);
    color: #fff;
  }

  .sdb-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .sdb-note {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    color: rgba(245, 242, 232, 0.65);
    max-width: 56ch;
    line-height: 1.5;
  }
</style>
