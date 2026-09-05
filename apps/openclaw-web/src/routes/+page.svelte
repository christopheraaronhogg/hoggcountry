<script lang="ts">
  import type { PageData } from './$types';
  import ProtoF from '../../../../src/components/prototypes/ProtoF_Ranger.svelte';
  import ScoutDemoBanner from '$lib/components/ScoutDemoBanner.svelte';
  import ScoutCapabilities from '$lib/components/ScoutCapabilities.svelte';

  const { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Hogg Country — Scout, the Appalachian Trail app</title>
  <meta
    name="description"
    content="Scout is a field-grade Appalachian Trail assistant on your phone. Dad's completed 2026 NOBO thru-hike — pack, pace, weather, water, shelters — is the demo. Get on the waitlist for the iOS and Android launch."
  />
  <meta property="og:title" content="Scout — the AT app, demoed by a real thru-hike" />
  <meta
    property="og:description"
    content="Plan the next 20 miles, find the next water, watch the weather that matters, and see source receipts on every answer. Built from Jimmy 'HoggCountry' Hogg's 2026 NOBO."
  />
</svelte:head>

<ProtoF videos={data.videos} journey={data.journey} showFooter={false} />

<ScoutDemoBanner journey={data.journey} />

<ScoutCapabilities />
