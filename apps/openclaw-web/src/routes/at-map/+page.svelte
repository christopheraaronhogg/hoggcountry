<script lang="ts">
  import TrailMapExplorer from '$components/TrailMapExplorer.svelte';
</script>

<svelte:head>
  <title>Appalachian Trail Map | Hogg Country</title>
  <meta name="description" content="A live Appalachian Trail map with Garmin history, elevation, rockiness, water, shelters, roads, and resupply context." />
</svelte:head>

<TrailMapExplorer endpoint="/track/map-pack" title="AT Map" publicRoute />
