<script lang="ts">
  import { onMount } from 'svelte';

  let AdaptiveGuideWizard = $state<any>(null);
  let loadError = $state<string | null>(null);

  onMount(async () => {
    try {
      const module = await import('../../../../../../src/components/AdaptiveGuideWizard.svelte');
      AdaptiveGuideWizard = module.default;
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error);
      console.error('Failed to load guide wizard', error);
    }
  });
</script>

<svelte:head>
  <title>Personalize Your AT Guide | Hogg Country</title>
  <meta
    name="description"
    content="Answer 6 questions and get a personalized reading order for the AT Field Guide, tailored to your goals, experience, and hiking style."
  />
  <!-- Unlisted prototype - not ready for public -->
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="personalize-page">
  <a href="/guide/" class="back-link">&larr; Back to Full Guide</a>

  <header class="page-header">
    <h1 class="page-title">Your Personalized AT Guide</h1>
    <p class="page-subtitle">
      Answer 6 quick questions and we'll create a customized reading order
      based on your goals, experience, and hiking style.
    </p>
  </header>

  <section class="intro-section">
    <h2>Why Personalize?</h2>
    <p>
      The full AT Field Guide is over 140 pages covering everything from gear to town strategy.
      But you don't need to read it all with equal attention. Your personalized guide will:
    </p>
    <ul>
      <li>Prioritize chapters most relevant to your situation</li>
      <li>Identify areas where you might need extra preparation</li>
      <li>Give you a focused reading order that respects your time</li>
    </ul>
  </section>

  {#if AdaptiveGuideWizard}
    <AdaptiveGuideWizard />
  {:else if loadError}
    <p class="load-state">The wizard failed to load. Refresh to try again.</p>
  {:else}
    <p class="load-state">Loading the guide wizard…</p>
  {/if}
</main>

<style>
  .personalize-page {
    background: var(--color-background, #121212);
    color: var(--color-text, #f5f5f5);
    min-height: 100vh;
    padding: 1rem;
    border-radius: 16px;
  }

  .page-header {
    max-width: 700px;
    margin: 0 auto 2rem;
    text-align: center;
  }

  .page-title {
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 2.5rem;
    margin: 0 0 0.5rem;
    background: linear-gradient(135deg, var(--color-evergreen, #4a7c59) 0%, #7cb98b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-subtitle {
    color: var(--color-text-muted, #888);
    font-size: 1.1rem;
    margin: 0;
    line-height: 1.5;
  }

  .intro-section {
    max-width: 700px;
    margin: 0 auto 2rem;
    padding: 1.5rem;
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
  }

  .intro-section h2 {
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 1.3rem;
    margin: 0 0 1rem;
    color: var(--color-campfire, #d4763a);
  }

  .intro-section p {
    margin: 0 0 0.75rem;
    line-height: 1.6;
    color: var(--color-text-muted, #aaa);
  }

  .intro-section ul {
    margin: 0.5rem 0 0 1.25rem;
    padding: 0;
    color: var(--color-text-muted, #aaa);
  }

  .intro-section li {
    margin: 0.35rem 0;
  }

  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
    color: var(--color-text-muted, #888);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .back-link:hover {
    color: var(--color-evergreen, #4a7c59);
  }

  .load-state {
    max-width: 700px;
    margin: 0 auto;
    color: var(--color-text-muted, #888);
  }

  @media (max-width: 600px) {
    .page-title {
      font-size: 1.8rem;
    }

    .page-subtitle {
      font-size: 1rem;
    }
  }
</style>
