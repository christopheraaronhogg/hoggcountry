<script lang="ts">
  import { onMount } from 'svelte';
  import { getSections, getTools, hasManual, listImportedDocuments } from '$lib/manual-db';
  import { spacetimeStatus } from '$lib/spacetime';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let manualReady = $state(false);
  let sectionCount = $state(0);
  let docCount = $state(0);
  let toolCount = $state(0);

  onMount(async () => {
    manualReady = await hasManual();

    if (manualReady) {
      const [sections, docs, tools] = await Promise.all([getSections(), listImportedDocuments(), getTools()]);
      sectionCount = sections.length;
      docCount = docs.length;
      toolCount = tools.length;
    }
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Overview</p>
    <h1>Manual-first hiking, now under a real gate.</h1>
    <p class="lede">
      {#if manualReady}
        Your private trail workspace is live. Use Today, Manual, Tools, Docs, and Scout to keep it tightening into something you can actually hike from.
      {:else}
        The beta profile is in. Next step is to seed your own manual, starter tools, and first private workspace from Dad's guide and your trail preferences.
      {/if}
    </p>
    <div class="subtle-actions">
      <a class="btn btn-primary" href={manualReady ? '/app/today' : '/app/setup'}>
        {manualReady ? 'Open Today' : 'Run setup'}
      </a>
      <a class="btn btn-ghost" href="/app/claw">Open Scout</a>
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

{#if manualReady}
  <section class="stats-grid" style="margin-top:1rem;">
    <article class="card panel-copy">
      <p class="eyebrow">Manual sections</p>
      <strong>{sectionCount}</strong>
      <p class="muted" style="margin-bottom:0;">The standing document set the app is protecting.</p>
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Trail tools</p>
      <strong>{toolCount}</strong>
      <p class="muted" style="margin-bottom:0;">Safe checklist tools, seeded from setup and expandable by you.</p>
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Imported docs</p>
      <strong>{docCount}</strong>
      <p class="muted" style="margin-bottom:0;">Private source files the workspace can search beside the manual.</p>
    </article>
  </section>
{/if}

<div class="grid-two" style="margin-top:1rem;">
  <article class="card panel-copy">
    <p class="eyebrow">Today</p>
    <h3>Current operating screen</h3>
    <p class="muted">Focus on the next clear weather, water, sleep, and town decision.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Tools</p>
    <h3>Safe trail routines</h3>
    <p class="muted">Turn repeatable trail decisions into reusable checklists instead of hiding them in chat or memory.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Docs</p>
    <h3>Private source locker</h3>
    <p class="muted">Import the PDFs and text you legally own, then search them beside the manual and your tool set.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Scout</p>
    <h3>Personal trail assistant</h3>
    <p class="muted">The operator surface keeps telling you which brittle parts of the manual and plan still need attention.</p>
  </article>
</div>
