<script lang="ts">
  import ShelvedFeature from '$components/ShelvedFeature.svelte';
</script>

<svelte:head>
  <title>Sprite Catalog Shelved | Hogg Country</title>
  <meta
    name="description"
    content="The TrailHogg sprite catalog is preserved in the repo but not part of the live Hogg Country product."
  />
</svelte:head>

<ShelvedFeature
  feature="ROUTE_CAT"
  heading="The sprite catalog is shelved."
  body="TrailHogg is still preserved in the codebase, but the main product is now centered on dad's field guide, the video feed, and the personal field manual workspace."
  primary={{ href: '/lab/', label: 'View lab index' }}
  secondary={{ href: '/guide/', label: "Open dad's field guide" }}
/>
