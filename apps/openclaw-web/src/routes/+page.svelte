<script lang="ts">
  import type { PageData } from './$types';
  import ProtoF from '../../../../src/components/prototypes/ProtoF_Ranger.svelte';

  const { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Hogg Country (v8)</title>
  <meta
    name="description"
    content="Jimmy Hogg — Triple O Crowner, Sassafras Award recipient, and 2026 AT NOBO thru-hiker. Trail logs, field guide, and planning tools."
  />
</svelte:head>

<ProtoF videos={data.videos} journey={data.journey} />
