<script lang="ts">
  import type { PageData } from './$types';
  import ScoutLabWorkbench from '$lib/components/ScoutLabWorkbench.svelte';

  const { data } = $props<{ data: PageData }>();
</script>

<ScoutLabWorkbench variant={data.variant} />
