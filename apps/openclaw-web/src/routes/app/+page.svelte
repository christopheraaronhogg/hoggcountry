<script lang="ts">
  import { onMount } from 'svelte';
  import { hasManual } from '$lib/manual-db';
  import { spacetimeStatus } from '$lib/spacetime';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let manualReady = $state(false);

  onMount(async () => {
    manualReady = await hasManual();
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Overview</p>
    <h1>Manual-first hiking, now under a real gate.</h1>
    <p class="lede">
      {#if manualReady}
        Your manual already exists on this device. Use Today, Docs, and Claw to keep it getting better.
      {:else}
        The beta profile is in. Next step is to seed your own manual from Dad's guide and your trail preferences.
      {/if}
    </p>
    <div class="subtle-actions">
      <a class="btn btn-primary" href={manualReady ? '/app/today' : '/app/setup'}>
        {manualReady ? 'Open Today' : 'Run setup'}
      </a>
      <a class="btn btn-ghost" href="/app/claw">Open Claw</a>
    </div>
  </div>

  <article class="card card-soft panel-copy">
    <p class="eyebrow">Beta profile</p>
    <h2>{data.betaProfile?.trailName}</h2>
    <p class="meta-line">{data.betaProfile?.name} | {data.betaProfile?.email}</p>
    {#if $spacetimeStatus.enabled}
      <span class={`status-pill ${$spacetimeStatus.connected ? 'live' : 'warn'}`}>
        {$spacetimeStatus.connected ? 'Spacetime connected' : 'Spacetime waiting'}
      </span>
    {:else}
      <span class="status-pill warn">Preview mode</span>
    {/if}
  </article>
</section>

<div class="grid-three" style="margin-top:1rem;">
  <article class="card panel-copy">
    <p class="eyebrow">Today</p>
    <h3>Current operating screen</h3>
    <p class="muted">Focus on the next clear weather, water, sleep, and town decision.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Docs</p>
    <h3>Private source locker</h3>
    <p class="muted">Import the PDFs and text you legally own so the manual can point back to them.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Claw</p>
    <h3>Manual steward</h3>
    <p class="muted">The operator surface keeps telling you which brittle parts of the manual still need attention.</p>
  </article>
</div>
