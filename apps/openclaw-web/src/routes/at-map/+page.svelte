<script lang="ts">
  import AtMap from '../../../../../src/components/AtMap.svelte';
</script>

<svelte:head>
  <title>Appalachian Trail Map | Hogg Country</title>
  <meta name="description" content="Interactive Appalachian Trail map for Hogg Country trail tracking and planning." />
</svelte:head>

<div class="at-map-page">
  <AtMap />
</div>

<style>
  .at-map-page {
    min-height: 100vh;
    background: #0b0b0b;
  }

  :global(.public-shell:has(.at-map-page)) {
    background: #0b0b0b;
  }

  :global(.public-shell:has(.at-map-page) .public-site-main) {
    min-height: 100vh;
  }

  :global(.public-shell:has(.at-map-page) #site-header),
  :global(.public-shell:has(.at-map-page) .public-meta-footer),
  :global(.public-shell:has(.at-map-page) #version-stamp) {
    display: none;
  }

  :global(body:has(.at-map-page)) {
    overflow: hidden;
  }
</style>
