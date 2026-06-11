<script lang="ts">
  import ShelvedFeature from '$components/ShelvedFeature.svelte';
  import { WORKSPACE_URL } from '../../../../../src/lib/config';
</script>

<svelte:head>
  <title>Comparison Prototype Shelved | Hogg Country</title>
  <meta
    name="description"
    content="The comparison prototype is preserved in the repo but not part of the current Hogg Country product surface."
  />
</svelte:head>

<ShelvedFeature
  feature="ROUTE_COMPARE"
  heading="This comparison prototype is shelved."
  body="The current product focus is the field guide plus the personal manual workspace. Experimental AI comparison work is still in the repo, but it is not part of the live experience."
  primary={{ href: '/lab/', label: 'View lab index' }}
  secondary={{ href: WORKSPACE_URL, label: 'Open workspace' }}
/>
