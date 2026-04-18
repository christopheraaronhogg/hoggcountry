<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { buildClawLanes } from '$lib/claw';
  import { getProfile, getSections, getTools, listImportedDocuments } from '$lib/manual-db';
  import { spacetimeStatus } from '$lib/spacetime';
  import SpacetimePreview from '$components/SpacetimePreview.svelte';
  import type { ClawLane } from '$lib/claw';

  let lanes = $state<ClawLane[]>([]);
  let error = $state('');

  onMount(async () => {
    try {
      const profile = await getProfile();
      if (!profile) {
        await goto('/app/setup');
        return;
      }

      const [sections, docs, tools] = await Promise.all([getSections(), listImportedDocuments(), getTools()]);
      lanes = buildClawLanes(profile, sections, docs, tools);
    } catch (caught) {
      console.error(caught);
      error = 'Could not load the Claw console.';
    }
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Claw</p>
    <h1>The operator surface is here to strengthen the manual.</h1>
    <p class="lede">
      This is the OpenClaw-style layer for hikers: not general chat, but a bounded console whose job is to point at the
      next weak spot in the manual, source locker, or tool set and tell you what should be tightened next.
    </p>
  </div>

  <article class="card card-soft panel-copy">
    <p class="eyebrow">Connection</p>
    {#if $spacetimeStatus.enabled}
      <span class={`status-pill ${$spacetimeStatus.connected ? 'live' : 'warn'}`}>
        {$spacetimeStatus.connected ? 'Realtime module active' : 'Waiting on Spacetime module'}
      </span>
      {#if $spacetimeStatus.lastError}
        <p class="meta-line">{$spacetimeStatus.lastError}</p>
      {/if}
    {:else}
      <span class="status-pill warn">Preview mode</span>
      <p class="meta-line">The frontend is wired for SpacetimeDB. Set the host and db env vars to activate live module data.</p>
    {/if}
  </article>
</section>

{#if error}
  <p style="color:#8a2f2f; font-weight:700;">{error}</p>
{/if}

<div class="grid-two" style="margin-top:1rem;">
  <section class="stack">
    {#each lanes as lane}
      <article class="card panel-copy">
        <p class="eyebrow">{lane.title}</p>
        <h3>{lane.prompt}</h3>
        <p class="muted">{lane.action}</p>
        <p class="meta-line">{lane.source}</p>
      </article>
    {/each}
  </section>

  {#if $spacetimeStatus.enabled}
    <SpacetimePreview />
  {:else}
    <article class="card panel-copy">
      <p class="eyebrow">Why this matters</p>
      <h2>Spacetime is for live shared state, not for replacing the manual.</h2>
      <p class="muted">
        The manual still stays source-of-truth first. Spacetime adds realtime collaboration and public updates once the
        module is published, but the hiker product remains manual-first.
      </p>
    </article>
  {/if}
</div>
