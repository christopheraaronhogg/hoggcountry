<script lang="ts">
  import { onMount } from 'svelte';
  import { getProfile } from '$lib/manual-db';
  import type { ManualProfile } from '@hoggcountry/manual-core';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let profile = $state<ManualProfile | null>(null);

  onMount(async () => {
    profile = await getProfile().catch(() => null);
  });

  function valueOrUnset(value: string | number | null | undefined, suffix = ''): string {
    if (value === null || value === undefined || value === '') return 'Not set';
    return `${value}${suffix}`;
  }
</script>

<section class="profile-page" aria-label="Scout profile">
  <header class="profile-hero card">
    <div>
      <p class="eyebrow">Profile</p>
      <h1>{data.betaProfile?.trailName || data.betaProfile?.name || 'Hiker'}</h1>
      <p>Keep the profile light. Scout should infer and ask over time, not force a giant setup form before it can help.</p>
    </div>
    <a class="btn btn-secondary" href="/app/setup">Edit trail details</a>
  </header>

  <section class="profile-grid" aria-label="Profile details">
    <article class="profile-card card">
      <span>Direction</span>
      <strong>{valueOrUnset(profile?.direction)}</strong>
    </article>
    <article class="profile-card card">
      <span>Current mile</span>
      <strong>{profile && profile.currentMile > 0 ? profile.currentMile.toFixed(1) : 'Not set'}</strong>
    </article>
    <article class="profile-card card">
      <span>Target pace</span>
      <strong>{profile && profile.targetPace > 0 ? `${profile.targetPace.toFixed(0)} mpd` : 'Not set'}</strong>
    </article>
    <article class="profile-card card">
      <span>Water capacity</span>
      <strong>{profile && profile.waterCapacityLiters > 0 ? `${profile.waterCapacityLiters.toFixed(1)}L` : 'Not set'}</strong>
    </article>
  </section>

  <article class="profile-note card">
    <p class="eyebrow">Design rule</p>
    <h2>Ask first. Profile later.</h2>
    <p>Profile details should appear only when they improve a plan: pace, location, water capacity, health constraints, shelter preference, and town style.</p>
  </article>
</section>

<style>
  .profile-page {
    display: grid;
    gap: 1rem;
    max-width: 920px;
    margin: 0 auto;
  }

  .profile-hero {
    display: grid;
    gap: 1rem;
    align-items: end;
    padding: clamp(1.1rem, 4vw, 1.5rem);
    background: rgba(255, 253, 248, 0.9);
  }

  .profile-hero h1 {
    margin: 0;
    font-size: clamp(2.6rem, 9vw, 5rem);
    line-height: 0.95;
  }

  .profile-hero p:not(.eyebrow) {
    max-width: 54ch;
    margin: 0.55rem 0 0;
    color: var(--muted);
    line-height: 1.55;
  }

  .profile-hero .btn {
    justify-self: start;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .profile-card {
    display: grid;
    gap: 0.3rem;
    min-height: 7rem;
    align-content: center;
    padding: 1rem;
    background: rgba(255, 253, 248, 0.88);
  }

  .profile-card span {
    color: var(--muted);
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .profile-card strong {
    color: #27332b;
    font-size: clamp(1.35rem, 5vw, 2rem);
    line-height: 1;
  }

  .profile-note {
    padding: 1.1rem;
    background: rgba(237, 243, 229, 0.76);
  }

  .profile-note h2,
  .profile-note p {
    margin-top: 0;
  }

  .profile-note p:last-child {
    margin-bottom: 0;
    color: var(--muted);
    line-height: 1.55;
  }

  @media (max-width: 760px) {
    .profile-page {
      gap: 0.75rem;
      padding-bottom: calc(6.8rem + env(safe-area-inset-bottom));
    }

    .profile-hero {
      padding: 1rem;
    }

    .profile-hero h1 {
      font-size: clamp(2.4rem, 12vw, 3.4rem);
    }

    .profile-hero p:not(.eyebrow) {
      display: none;
    }

    .profile-card {
      min-height: 5.35rem;
      padding: 0.82rem;
    }

    .profile-note {
      display: none;
    }
  }

  @media (min-width: 760px) {
    .profile-hero {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .profile-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
