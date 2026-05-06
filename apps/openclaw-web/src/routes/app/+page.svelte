<script lang="ts">
  import { onMount } from 'svelte';
  import { getProfile, hasManual, listImportedDocuments, listWorkspaceResources } from '$lib/manual-db';
  import type { ManualProfile } from '@hoggcountry/manual-core';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let manualReady = $state(false);
  let profile = $state<ManualProfile | null>(null);
  let docCount = $state(0);
  let resourceCount = $state(0);
  let prompt = $state('');

  const quickPrompts = [
    {
      label: 'Trail brief',
      detail: 'Plan today’s miles',
      icon: '▣',
      prompt: "Build today's trail plan. Keep it practical: miles, water, weather, bailout, body risk, and what I should verify before I move."
    },
    {
      label: 'Water',
      detail: 'Check next water risk',
      icon: '◎',
      prompt: 'Check water assumptions for my next hiking day. Tell me what is known, what needs a current source check, and how much water capacity I should leave with.'
    },
    {
      label: 'Resupply',
      detail: 'Estimate food carry',
      icon: '▱',
      prompt: 'Plan my next resupply. Keep it conservative, show likely food carry, town options, and the assumptions that need confirming before I leave.'
    }
  ];

  onMount(async () => {
    manualReady = await hasManual();
    const [workspaceProfile, docs, resources] = await Promise.all([
      getProfile().catch(() => null),
      listImportedDocuments().catch(() => []),
      listWorkspaceResources().catch(() => [])
    ]);

    profile = workspaceProfile;
    docCount = docs.length;
    resourceCount = resources.length;
  });

  function currentMileLabel(): string {
    if (!profile || profile.currentMile <= 0) return 'Mile not set';
    return `AT mile ${profile.currentMile.toFixed(0)}`;
  }

  function routeLabel(): string {
    const direction = profile?.direction?.trim() || 'NOBO';
    return profile && profile.currentMile > 0 ? `AT · ${direction.toUpperCase()} · ${currentMileLabel().toUpperCase()}` : `AT · ${direction.toUpperCase()} · SET MILE WHEN READY`;
  }

  function statusMileLabel(): string {
    if (!profile || profile.currentMile <= 0) return 'Set location';
    return currentMileLabel();
  }

  function paceLabel(): string {
    if (!profile || profile.targetPace <= 0) return 'Set pace';
    return `${profile.targetPace.toFixed(0)} mpd`;
  }

  function askHref(text = prompt): string {
    const url = new URL('/app/claw', 'https://hoggcountry.local');
    if (text.trim()) url.searchParams.set('prompt', text.trim());
    return `${url.pathname}${url.search}`;
  }
</script>

<section class="home-screen" aria-label="Scout home">
  <header class="home-hero">
    <p class="home-kicker">Hogg Country</p>
    <h1>Scout</h1>
    <p class="route-chip">{routeLabel()}</p>
  </header>

  <form class="ask-card" action="/app/claw" method="get" aria-label="Ask Scout">
    <label class="sr-only" for="home-prompt">Ask Scout</label>
    <input id="home-prompt" name="prompt" bind:value={prompt} placeholder="Ask about miles, water, weather, or resupply" autocomplete="off" />
    <button type="submit" aria-label="Send to Scout" disabled={!prompt.trim()}>
      <span aria-hidden="true">➤</span>
    </button>
  </form>

  <a class="primary-link" href={askHref('Build my daily trail brief. Include weather, water, sleep target, body risk, resupply pressure, and the assumptions I should verify before relying on it.')}>Build trail brief</a>

  <div class="quick-list" aria-label="Quick Scout prompts">
    {#each quickPrompts as item}
      <a class="quick-card" href={askHref(item.prompt)}>
        <span aria-hidden="true">{item.icon}</span>
        <strong>{item.label}</strong>
        <small>{item.detail}</small>
      </a>
    {/each}
  </div>

  <section class="status-row" aria-label="Workspace status">
    <a href="/app/profile">
      <strong>{statusMileLabel()}</strong>
      <small>Location</small>
    </a>
    <a href="/app/profile">
      <strong>{paceLabel()}</strong>
      <small>Pace</small>
    </a>
    <a href="/app/resources">
      <strong>{docCount + resourceCount}</strong>
      <small>Resources</small>
    </a>
  </section>

  {#if !manualReady}
    <p class="quiet-note">Profile is optional. Scout can still answer one trail question at a time.</p>
  {/if}
</section>

<style>
  .home-screen {
    display: grid;
    gap: 0.9rem;
    width: min(100%, 720px);
    margin: 0 auto;
    padding: clamp(0.2rem, 2vw, 1rem) 0 1rem;
  }

  .home-hero {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    text-align: center;
  }

  .home-kicker {
    margin: 0;
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .home-hero h1 {
    margin: 0;
    color: #2c2116;
    font-size: clamp(2.65rem, 9vw, 4.55rem);
    font-weight: 900;
    letter-spacing: 0.045em;
    line-height: 0.92;
    text-transform: uppercase;
  }

  .route-chip {
    width: fit-content;
    max-width: 100%;
    margin: 0;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.7);
    color: #52604d;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.075em;
    padding: 0.36rem 0.72rem;
  }

  .ask-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    border: 1px solid rgba(77, 89, 74, 0.13);
    border-radius: 24px;
    background: rgba(255, 253, 248, 0.93);
    box-shadow: 0 16px 36px rgba(31, 41, 55, 0.08);
    padding: 0.72rem;
  }

  .ask-card input {
    min-height: 3.7rem;
    min-width: 0;
    border: 1.5px solid rgba(51, 51, 51, 0.24);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.78);
    color: #27332b;
    font-size: clamp(1.02rem, 3.5vw, 1.28rem);
    font-weight: 800;
    padding: 0.8rem 0.9rem;
  }

  .ask-card input::placeholder {
    color: rgba(39, 51, 43, 0.56);
  }

  .ask-card button {
    display: grid;
    place-items: center;
    width: 3.35rem;
    height: 3.35rem;
    border-radius: 14px;
    background: var(--pine);
    color: #fffdf8;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 900;
  }

  .ask-card button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .quick-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.58rem;
  }

  .quick-card,
  .status-row a {
    border: 1px solid rgba(77, 89, 74, 0.12);
    background: rgba(255, 253, 248, 0.88);
    box-shadow: 0 10px 24px rgba(31, 41, 55, 0.055);
    color: #27332b;
    text-decoration: none;
  }

  .quick-card {
    display: grid;
    gap: 0.2rem;
    min-height: 5rem;
    border-radius: 18px;
    padding: 0.72rem;
  }

  .quick-card span {
    color: var(--pine);
    font-size: 1.3rem;
    line-height: 1;
  }

  .quick-card strong,
  .status-row strong {
    font-family: Oswald, Impact, sans-serif;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .quick-card small,
  .status-row small,
  .quiet-note {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 780;
    line-height: 1.25;
  }

  .primary-link {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 3.05rem;
    border-radius: 18px;
    background: #24362c;
    color: #fffdf8;
    box-shadow: 0 12px 26px rgba(36, 54, 44, 0.14);
    font-family: Oswald, Impact, sans-serif;
    font-weight: 900;
    letter-spacing: 0.075em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .status-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .status-row a {
    display: grid;
    gap: 0.18rem;
    border-radius: 16px;
    padding: 0.72rem;
  }

  .status-row strong {
    overflow: hidden;
    color: #27332b;
    font-size: 0.92rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quiet-note {
    margin: -0.1rem 0 0;
    text-align: center;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 560px) {
    .home-screen {
      gap: 0.72rem;
      padding-top: 0.1rem;
      padding-bottom: calc(6.2rem + env(safe-area-inset-bottom));
    }


    .home-hero h1 {
      font-size: clamp(2.55rem, 13vw, 3.55rem);
    }

    .primary-link {
      min-height: 2.95rem;
      width: 100%;
    }

    .route-chip {
      font-size: 0.7rem;
      letter-spacing: 0.06em;
    }

    .ask-card {
      border-radius: 20px;
      padding: 0.58rem;
    }

    .ask-card input {
      min-height: 3.45rem;
      border-radius: 13px;
      font-size: 0.98rem;
      padding-inline: 0.78rem;
    }

    .ask-card button {
      width: 3rem;
      height: 3rem;
      border-radius: 12px;
    }

    .quick-list {
      grid-template-columns: 1fr;
      gap: 0.44rem;
    }

    .quick-card {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 0 0.6rem;
      min-height: 3.45rem;
      border-radius: 15px;
      padding: 0.62rem 0.72rem;
    }

    .quick-card span {
      grid-row: span 2;
    }

    .quick-card small {
      font-size: 0.74rem;
    }


    .status-row {
      grid-template-columns: 1fr 1fr;
    }

    .status-row a:last-child {
      display: none;
    }

  }
</style>
