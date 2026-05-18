<script lang="ts">
  import ToolsDashboard from '../../../../../src/components/tools/ToolsDashboard.svelte';
</script>

<svelte:head>
  <title>Trail Tools | Hogg Country</title>
  <meta
    name="description"
    content="Interactive tools for AT thru-hiking: milestone planner, gear calculator, daylight calculator, and more."
  />
</svelte:head>

<section class="tools-page">
  <header class="hero tools-hero">
    <span class="chapter font-chapter">AT 2026</span>
    <h1 class="font-display">Trail Tools</h1>
    <p>Interactive planning tools for the Appalachian Trail</p>
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
    padding-top: 2.5rem;
  }

  .tools-hero h1 {
    margin: 0;
  }

  .tools-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  :global(.public-page-wrap) {
    max-width: 1100px;
  }
</style>
