<script lang="ts">
  import { onMount } from 'svelte';
  import { hydrateManual } from '../../lib/field-manual';

  onMount(() => {
    hydrateManual().catch((error) => {
      console.warn('[FieldManual] Failed to hydrate cache', error);
    });
  });
</script>
