<script lang="ts">
  import ScoutConsole from '../claw/+page.svelte';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<ScoutConsole {data} />
