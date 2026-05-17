<script lang="ts">
  import type { PageData } from './$types';
  import ToolPage from '../../../../../../src/components/tools/ToolPage.svelte';

  const { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>{data.toolName} | Hogg Country</title>
  <meta name="description" content={`${data.toolName} from the Hogg Country Appalachian Trail planning toolkit.`} />
</svelte:head>

<div class="tool-container">
  {#if data.known}
    <ToolPage toolId={data.toolId} toolName={data.toolName} />
  {:else}
    <article class="card unknown-tool">
      <h1>Tool not found</h1>
      <p>That trail tool is not available in the SvelteKit app yet.</p>
      <a href="/tools" class="btn btn-primary">Back to tools</a>
    </article>
  {/if}
</div>

<style>
  .tool-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 0 4rem;
  }

  .unknown-tool {
    padding: 1.2rem;
  }
</style>
