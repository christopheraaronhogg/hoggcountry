<script lang="ts">
  import TrailMapExplorer from '$components/TrailMapExplorer.svelte';
</script>

<svelte:head>
  <title>Scout Map | Hogg Country</title>
  <meta name="description" content="Scout map with live trail position, terrain overlays, route history, and planning handoff." />
</svelte:head>

<TrailMapExplorer endpoint="/app-api/map/pack" title="Scout Map" appMode />
