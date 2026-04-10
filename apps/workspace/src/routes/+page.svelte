<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { hasManual } from '$lib/manual-db';

  let status = 'Checking for your manual...';

  onMount(async () => {
    const exists = await hasManual();
    status = exists ? 'Opening Today...' : 'Opening setup...';
    await goto(exists ? '/today' : '/setup');
  });
</script>

<section class="panel">
  <p>{status}</p>
</section>

<style>
  .panel {
    display: grid;
    place-items: center;
    min-height: 50vh;
    padding: 2rem;
    border-radius: 22px;
    border: 1px solid rgba(48, 65, 54, 0.12);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }
</style>
