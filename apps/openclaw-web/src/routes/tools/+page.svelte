<script lang="ts">
  import ToolsDashboard from '../../../../../src/components/tools/ToolsDashboard.svelte';
</script>

<svelte:head>
  <title>Trail Tools | Hogg Country</title>
  <meta
    name="description"
    content="A trail operations workbench for the Appalachian Trail: mile-aware planners, on-trail decisions, town-day logistics, and emergency info."
  />
</svelte:head>

<section class="tools-page">
  <header class="tools-hero">
    <div class="hero-eyebrow">
      <span class="eyebrow-dot" aria-hidden="true"></span>
      <span class="eyebrow-label">Trail Workbench</span>
    </div>
    <h1 class="font-display">Trail Tools</h1>
    <p class="hero-lede">
      Plan the timeline, decide in the field, run a town day. Every tool reads from your
      current mile and pace below, so swap one number and the whole kit catches up.
    </p>
  </header>

  <div class="tools-container">
    <ToolsDashboard />
  </div>
</section>

<style>
  .tools-page {
    padding-bottom: 4rem;
    overflow-x: clip;
  }

  .tools-hero {
    padding: 2.25rem 1rem 1.25rem;
    text-align: center;
  }

  .tools-hero h1 {
    margin: 0.35rem 0 0.5rem;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.3rem 0.7rem;
    background: rgba(123, 158, 107, 0.12);
    border: 1px solid rgba(123, 158, 107, 0.28);
    border-radius: 999px;
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--marker, #f0e000);
    box-shadow: 0 0 0 2px rgba(240, 224, 0, 0.18);
  }

  .hero-lede {
    max-width: 56ch;
    margin: 0 auto;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .tools-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  :global(.public-page-wrap) {
    max-width: 1100px;
  }

  @media (max-width: 480px) {
    .tools-hero {
      padding: 1.5rem 0.75rem 0.75rem;
    }

    .hero-lede {
      font-size: 0.88rem;
    }
  }
</style>
