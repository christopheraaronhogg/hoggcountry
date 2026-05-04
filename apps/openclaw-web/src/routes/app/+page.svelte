<script lang="ts">
  import { onMount } from 'svelte';
  import { getSections, getTools, hasManual, listImportedDocuments, listWorkspaceResources } from '$lib/manual-db';
  import { spacetimeStatus } from '$lib/spacetime';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let manualReady = $state(false);
  let sectionCount = $state(0);
  let docCount = $state(0);
  let resourceCount = $state(0);
  let toolCount = $state(0);

  onMount(async () => {
    manualReady = await hasManual();

    if (manualReady) {
      const [sections, docs, resources, tools] = await Promise.all([getSections(), listImportedDocuments(), listWorkspaceResources(), getTools()]);
      sectionCount = sections.length;
      docCount = docs.length;
      resourceCount = resources.length;
      toolCount = tools.length;
    }
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Overview</p>
    <h1>Your private Scout workspace.</h1>
    <p class="lede">
      {#if manualReady}
        Your private trail workspace is live. Use Scout, Today, Docs, Resources, and Setup to keep the next decision practical.
      {:else}
        You do not need a finished profile to start. Ask Scout now; it can ask for pace, gear, health, route, or budget details only when they matter.
      {/if}
    </p>
    <div class="subtle-actions">
      <a class="btn btn-primary" href="/app/claw">Ask Scout</a>
      <a class="btn btn-ghost" href={manualReady ? '/app/today' : '/app/setup'}>
        {manualReady ? 'Open Today' : 'Optional setup'}
      </a>
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
      <p class="eyebrow">Documents</p>
      <strong>{docCount}</strong>
      <p class="muted" style="margin-bottom:0;">Living plans, reports, and notes Scout can revise with history.</p>
    </article>

    <article class="card panel-copy">
      <p class="eyebrow">Resources</p>
      <strong>{resourceCount}</strong>
      <p class="muted" style="margin-bottom:0;">Private source material Scout can read without turning it into a document.</p>
    </article>
  </section>
{/if}

<div class="grid-two" style="margin-top:1rem;">
  <article class="card panel-copy">
    <p class="eyebrow">Today</p>
    <h3>Current operating screen</h3>
    <p class="muted">Focus on the next clear weather, water, sleep, body, and town decision when you have enough context.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Tools</p>
    <h3>Safe trail routines</h3>
    <p class="muted">Turn repeatable trail decisions into reusable checklists instead of hiding them in chat or memory.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Docs</p>
    <h3>Living artifacts</h3>
    <p class="muted">Keep standard plans, extra reports, and Scout revisions reviewable instead of buried in chat.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Resources</p>
    <h3>Private source locker</h3>
    <p class="muted">Upload files, save links, or paste notes Scout can use as context without rewriting the original source.</p>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">Scout</p>
    <h3>Personal trail assistant</h3>
    <p class="muted">Start with a plain question. Scout can build the profile and docs over time instead of front-loading forms.</p>
  </article>
</div>
