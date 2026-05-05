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
      label: "Today's Weather",
      icon: '☼',
      prompt: "Give me today's trail weather check. Focus on the next 24-48 hours, storm risk, heat/cold risk, and what would change my plan."
    },
    {
      label: 'Water Sources',
      icon: '♢',
      prompt: 'Check water assumptions for my next hiking day. Tell me what is known, what needs a current source check, and how much water capacity I should leave with.'
    },
    {
      label: 'Next Resupply',
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

  function paceLabel(): string {
    if (!profile || profile.targetPace <= 0) return 'Pace not set';
    return `${profile.targetPace.toFixed(0)} mpd target`;
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
    <p>One simple trail workspace for the next plan, map check, and hiker profile.</p>
  </header>

  <form class="ask-card" action="/app/claw" method="get" aria-label="Ask Scout">
    <label class="sr-only" for="home-prompt">Ask Scout</label>
    <span class="ask-icon" aria-hidden="true">⌕</span>
    <input id="home-prompt" name="prompt" bind:value={prompt} placeholder="Ask Scout…" autocomplete="off" />
    <button type="submit" aria-label="Send to Scout" disabled={!prompt.trim()}>➤</button>
  </form>

  <div class="quick-row" aria-label="Quick Scout prompts">
    {#each quickPrompts as item}
      <a class="quick-chip" href={askHref(item.prompt)}>
        <span aria-hidden="true">{item.icon}</span>
        <strong>{item.label}</strong>
      </a>
    {/each}
  </div>

  <article class="daily-card">
    <div class="daily-head">
      <strong>Scout</strong>
      <span>Today</span>
    </div>
    <h2>Start with the next trail decision.</h2>
    <p>
      {#if profile && profile.currentMile > 0}
        You are around {currentMileLabel()}. Ask Scout to turn that into today’s miles, water, weather, bailout, and resupply plan.
      {:else}
        Tell Scout where you are, where you want to go, or what you are worried about. It will ask only for details that change the plan.
      {/if}
    </p>

    <div class="status-grid" aria-label="Workspace status">
      <span><strong>{currentMileLabel()}</strong><small>Current location</small></span>
      <span><strong>{paceLabel()}</strong><small>Planning pace</small></span>
    </div>

    <div class="home-accordion" aria-label="Scout support cards">
      <details open>
        <summary><span aria-hidden="true">△</span><strong>Trail Brief</strong></summary>
        <div class="detail-body warning-body">
          <strong>{manualReady ? 'Ready for a live brief.' : 'Profile is optional.'}</strong>
          <p>{manualReady ? 'Scout can check your saved profile, docs, resources, and available source lanes before giving a compact trail brief.' : 'You can ask first and fill profile details later when they matter.'}</p>
          <a href={askHref('Build my daily trail brief. Include weather, water, sleep target, body risk, resupply pressure, and the assumptions I should verify before relying on it.')}>Build brief</a>
        </div>
      </details>

      <details>
        <summary><span aria-hidden="true">▭</span><strong>Docs</strong></summary>
        <div class="detail-body">
          <p>{docCount} saved doc{docCount === 1 ? '' : 's'} live in this workspace.</p>
          <a href="/app/docs">Open docs</a>
        </div>
      </details>

      <details>
        <summary><span aria-hidden="true">◎</span><strong>Sources</strong></summary>
        <div class="detail-body">
          <p>{resourceCount} private resource{resourceCount === 1 ? '' : 's'} available for Scout context.</p>
          <a href="/app/resources">Manage resources</a>
        </div>
      </details>
    </div>
  </article>

  <section class="home-destinations" aria-label="Main Scout destinations">
    <a href="/app/claw">
      <span>▣</span>
      <strong>Plan</strong>
      <small>Chat with Scout</small>
    </a>
    <a href="/app/map">
      <span>◇</span>
      <strong>Map</strong>
      <small>Trail context</small>
    </a>
    <a href="/app/profile">
      <span>○</span>
      <strong>Profile</strong>
      <small>Hiker details</small>
    </a>
  </section>
</section>

<style>
  .home-screen {
    display: grid;
    gap: 1.1rem;
    max-width: 760px;
    margin: 0 auto;
    padding: clamp(0.25rem, 2vw, 1.25rem) 0 1rem;
  }

  .home-hero {
    display: grid;
    gap: 0.28rem;
    text-align: center;
  }

  .home-kicker {
    margin: 0;
    color: var(--pine);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .home-hero h1 {
    margin: 0;
    color: #332416;
    font-size: clamp(3.3rem, 12vw, 5.4rem);
    font-weight: 900;
    letter-spacing: 0.08em;
    line-height: 0.92;
    text-transform: uppercase;
  }

  .home-hero p:not(.home-kicker) {
    max-width: 34rem;
    margin: 0 auto;
    color: var(--muted);
    line-height: 1.45;
  }

  .ask-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.7rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 28px;
    background: rgba(255, 253, 248, 0.92);
    box-shadow: 0 18px 44px rgba(31, 41, 55, 0.1);
    padding: clamp(0.8rem, 3vw, 1.3rem);
  }

  .ask-icon {
    display: grid;
    place-items: center;
    width: 2.35rem;
    height: 2.35rem;
    color: var(--pine);
    font-size: 1.7rem;
  }

  .ask-card input {
    min-height: 3.75rem;
    border: 3px solid rgba(77, 89, 74, 0.48);
    border-radius: 18px;
    background: rgba(255, 253, 248, 0.7);
    color: #332416;
    font-size: clamp(1.15rem, 4vw, 1.55rem);
    padding: 0.7rem 0.9rem;
  }

  .ask-card input::placeholder {
    color: rgba(51, 36, 22, 0.55);
  }

  .ask-card button {
    display: grid;
    place-items: center;
    width: 3.15rem;
    height: 3.15rem;
    border-radius: 999px;
    background: var(--pine);
    color: #fffdf8;
    cursor: pointer;
    font-size: 1.35rem;
    font-weight: 900;
  }

  .ask-card button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .quick-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .quick-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 4rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.9);
    color: #241b12;
    box-shadow: 0 10px 24px rgba(31, 41, 55, 0.07);
    text-align: left;
    text-decoration: none;
  }

  .quick-chip span {
    color: var(--pine);
    font-size: 1.65rem;
    line-height: 1;
  }

  .quick-chip strong {
    max-width: 7.5rem;
    font-size: clamp(0.92rem, 2.6vw, 1.08rem);
    line-height: 1.04;
  }

  .daily-card {
    display: grid;
    gap: 1rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 26px;
    background: rgba(255, 253, 248, 0.91);
    box-shadow: 0 18px 44px rgba(31, 41, 55, 0.08);
    padding: clamp(1.05rem, 4vw, 1.55rem);
  }

  .daily-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--muted);
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .daily-head strong {
    color: var(--pine);
  }

  .daily-card h2 {
    margin: 0;
    color: #191815;
    font-family: Lato, system-ui, sans-serif;
    font-size: clamp(1.5rem, 5vw, 2rem);
    letter-spacing: 0;
    line-height: 1.18;
  }

  .daily-card > p {
    margin: 0;
    color: #191815;
    font-size: clamp(1.04rem, 3vw, 1.18rem);
    line-height: 1.45;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .status-grid span {
    display: grid;
    gap: 0.2rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 18px;
    background: rgba(237, 243, 229, 0.66);
    padding: 0.78rem;
  }

  .status-grid strong {
    color: #27332b;
    font-size: 1rem;
  }

  .status-grid small {
    color: var(--muted);
    font-weight: 800;
  }

  .home-accordion {
    display: grid;
    gap: 0.7rem;
  }

  .home-accordion details {
    overflow: hidden;
    border-radius: 18px;
    background: #4e6a83;
    color: white;
  }

  .home-accordion summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 4.3rem;
    cursor: pointer;
    list-style: none;
    padding: 0 1rem;
  }

  .home-accordion summary::-webkit-details-marker {
    display: none;
  }

  .home-accordion summary::after {
    content: '⌄';
    margin-left: auto;
    font-size: 1.25rem;
    font-weight: 900;
  }

  .home-accordion details[open] summary::after {
    transform: rotate(180deg);
  }

  .home-accordion summary span {
    font-size: 1.45rem;
  }

  .home-accordion summary strong {
    font-size: 1.2rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .detail-body {
    display: grid;
    gap: 0.45rem;
    background: rgba(255, 253, 248, 0.96);
    color: #27332b;
    padding: 0.95rem 1rem 1.05rem;
  }

  .warning-body {
    background: #342316;
    color: #fff8ed;
  }

  .detail-body p {
    margin: 0;
    line-height: 1.4;
  }

  .detail-body a {
    justify-self: start;
    color: inherit;
    font-weight: 900;
    text-underline-offset: 0.16rem;
  }

  .home-destinations {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .home-destinations a {
    display: grid;
    gap: 0.28rem;
    place-items: center;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.86);
    color: #2f382e;
    min-height: 6rem;
    padding: 0.75rem;
    text-align: center;
    text-decoration: none;
  }

  .home-destinations span {
    color: var(--pine);
    font-size: 1.7rem;
    line-height: 1;
  }

  .home-destinations strong {
    font-size: 1.04rem;
  }

  .home-destinations small {
    color: var(--muted);
    font-weight: 800;
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
      gap: 1rem;
      padding-top: 0.15rem;
      padding-bottom: calc(6.4rem + env(safe-area-inset-bottom));
    }

    .home-hero p:not(.home-kicker) {
      display: none;
    }

    .ask-card {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.55rem;
      border-radius: 24px;
      padding: 0.95rem;
    }

    .ask-icon {
      display: none;
    }

    .ask-card input {
      min-height: 3.65rem;
    }

    .quick-row {
      gap: 0.5rem;
    }

    .quick-chip {
      min-height: 3.7rem;
      border-radius: 18px;
      padding: 0.45rem;
    }

    .quick-chip strong {
      max-width: 5.5rem;
    }

    .daily-card {
      gap: 0.82rem;
      border-radius: 24px;
    }

    .daily-card > p {
      font-size: 1rem;
    }

    .status-grid {
      display: none;
    }

    .home-accordion details:not(:first-child) {
      display: none;
    }

    .detail-body {
      padding: 0.74rem 0.85rem 0.82rem;
    }

    .warning-body p {
      display: none;
    }

    .home-destinations {
      display: none;
    }
  }
</style>
