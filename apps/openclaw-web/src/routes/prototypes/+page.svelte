<script lang="ts">
  import ShelvedFeature from '$components/ShelvedFeature.svelte';
</script>

<svelte:head>
  <title>Prototype Shelf | Hogg Country</title>
  <meta
    name="description"
    content="The prototype sandbox is preserved but not part of the live Hogg Country experience."
  />
</svelte:head>

<ShelvedFeature
  feature="ROUTE_PROTOTYPES"
  heading="These prototypes are shelved."
  body="The prototype sandbox is still in the repo for reference, but it is no longer part of the shipped product. The public experience now points hikers toward the guide, the workspace, and dad's trail videos."
  primary={{ href: '/lab/', label: 'View lab index' }}
  secondary={{ href: '/', label: 'Back to homepage' }}
/>
