<script lang="ts">
  import ShelvedFeature from '$components/ShelvedFeature.svelte';
</script>

<svelte:head>
  <title>KJV Search Moved | Hogg Country</title>
  <meta
    name="description"
    content="Scripture search now lives with the Field Manual instead of a standalone public route."
  />
</svelte:head>

<ShelvedFeature
  feature="ROUTE_KJV_STANDALONE"
  kicker="Moved"
  heading="Scripture now lives inside the Field Manual."
  body="The standalone KJV route is retired. Scripture remains part of Hogg Country, but it now belongs beside trail wisdom instead of living on its own."
  primary={{ href: '/guide/manual-builder/?tab=scripture', label: 'Open scripture in Field Manual' }}
  secondary={{ href: '/guide/', label: "Open dad's field guide" }}
/>
