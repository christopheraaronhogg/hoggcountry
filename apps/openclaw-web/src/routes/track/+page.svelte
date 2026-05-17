<script lang="ts">
  import TrailMapExplorer from '$components/TrailMapExplorer.svelte';
</script>

<svelte:head>
  <title>Live Trail Map | Hogg Country</title>
  <meta name="description" content="Live Garmin tracking, AT position history, elevation, rockiness, and trail context for Hogg Country." />
</svelte:head>

<TrailMapExplorer endpoint="/track/map-pack" title="Live Trail Map" publicRoute />
