<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { buildPlanLanes } from '@hoggcountry/trail-data';
  import { getProfile } from '$lib/manual-db';
  import type { ManualProfile } from '@hoggcountry/manual-core';

  let profile: ManualProfile | null = null;
  let lanes = [] as ReturnType<typeof buildPlanLanes>;

  onMount(async () => {
    const loaded = await getProfile();
    if (!loaded) {
      await goto('/setup');
      return;
    }

    profile = loaded;
    lanes = buildPlanLanes(loaded);
  });
</script>

<section class="hero card">
  <p class="eyebrow">Plan</p>
  <h1>Keep the next month clear.</h1>
  <p class="lede">Plan is where pace, town stops, and transitions get compressed into a few deliberate rules instead of a pile of calculators.</p>
</section>

{#if profile}
  <div class="lanes">
    {#each lanes as lane}
      <article class="card lane">
        <p class="eyebrow">{lane.title}</p>
        <h2>{lane.summary}</h2>
        <ul>
          {#each lane.actions as action}
            <li>{action}</li>
          {/each}
        </ul>
        <p class="citation">{lane.citation}</p>
      </article>
    {/each}
  </div>
{/if}

<style>
  .card {
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }

  .hero,
  .lane {
    padding: 1.1rem;
  }

  .hero {
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.4rem;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b45309;
  }

  h1,
  h2 {
    margin: 0;
    color: #1f2937;
  }

  .lede {
    max-width: 58ch;
    color: #5d675c;
    line-height: 1.7;
  }

  .lanes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }

  ul {
    margin: 1rem 0 0;
    padding-left: 1.2rem;
    color: #304136;
    line-height: 1.65;
  }

  li + li {
    margin-top: 0.6rem;
  }

  .citation {
    margin: 1rem 0 0;
    font-size: 0.84rem;
    color: #5d675c;
  }
</style>
