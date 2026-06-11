<script lang="ts">
  import ShelvedFeature from '$components/ShelvedFeature.svelte';
  import { WORKSPACE_URL } from '../../../../../src/lib/config';
</script>

<svelte:head>
  <title>Trail AI Shelved | Hogg Country</title>
  <meta
    name="description"
    content="The old Trail AI route has been shelved while Hogg Country focuses on the field guide and personal workspace."
  />
</svelte:head>

<ShelvedFeature
  feature="ROUTE_ASK"
  heading="Trail AI is shelved."
  body="The generic chat route is no longer part of the front door. Hogg Country is now centered on dad's field guide, the video dispatches, and the personal field manual workspace."
  primary={{ href: '/guide/', label: "Open dad's field guide" }}
  secondary={{ href: WORKSPACE_URL, label: 'Open workspace' }}
/>
