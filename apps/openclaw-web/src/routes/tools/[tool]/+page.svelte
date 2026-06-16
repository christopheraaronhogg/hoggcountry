<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  import ToolPage from '../../../../../../src/components/tools/ToolPage.svelte';

  const { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>{data.toolName} | Hogg Country</title>
  <meta name="description" content={data.toolDescription} />
</svelte:head>

<div class="tool-container">
  {#if data.known}
    <ToolPage
      toolId={data.toolId}
      toolName={data.toolName}
      toolIcon={data.toolIcon}
      toolDescription={data.toolDescription}
      toolIntent={data.toolIntent}
      toolGroup={data.toolGroup}
      relatedTools={data.relatedTools}
    />
  {:else}
    <article class="unknown-tool">
      <p class="eyebrow">Trail Tools</p>
      <h1>Tool not found</h1>
      <p>That trail tool is not available in the Scout web app yet.</p>
      <a href={resolve('/tools')} class="btn">Back to tools</a>
    </article>
  {/if}
</div>

<style>
  .tool-container {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: 0.5rem 0 4rem;
  }

  .unknown-tool {
    border: 1px solid rgba(61, 74, 58, 0.14);
    background: rgba(255, 255, 255, 0.82);
    border-radius: 14px;
    padding: clamp(1rem, 4vw, 2rem);
    box-shadow: 0 18px 46px rgba(45, 54, 42, 0.08);
  }

  .unknown-tool h1 {
    margin: 0.2rem 0 0.45rem;
    color: var(--pine, #3d4a38);
    font-family: Anton, sans-serif;
    font-size: clamp(2rem, 8vw, 4rem);
    font-weight: 400;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .unknown-tool p {
    margin: 0 0 1rem;
    color: var(--muted, #6b7280);
  }

  .eyebrow {
    margin: 0;
    color: rgba(61, 74, 56, 0.72);
    font-family: Oswald, sans-serif;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    min-height: 2.5rem;
    padding: 0 0.9rem;
    border-radius: 999px;
    background: var(--pine, #3d4a38);
    color: #fffaf0;
    font-family: Oswald, sans-serif;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
  }
</style>
