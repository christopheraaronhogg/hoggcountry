<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { addChecklistTool, deleteTool, getProfile, getTools } from '$lib/manual-db';
  import type { WorkspaceTool } from '@hoggcountry/manual-core';

  let tools = $state<WorkspaceTool[]>([]);
  let title = $state('');
  let summary = $state('');
  let instructions = $state('');
  let itemsText = $state('');
  let saving = $state(false);
  let error = $state('');

  async function refresh() {
    const profile = await getProfile();
    if (!profile) {
      await goto('/app/setup');
      return;
    }

    tools = await getTools();
  }

  async function handleCreate() {
    if (!title.trim() || !itemsText.trim()) return;

    saving = true;
    error = '';

    try {
      tools = await addChecklistTool({
        title,
        summary,
        instructions: instructions || 'Run this the same way every time so the trail does not have to renegotiate it.',
        itemsText
      });
      title = '';
      summary = '';
      instructions = '';
      itemsText = '';
    } catch (caught) {
      console.error(caught);
      error = 'Could not create that tool.';
    } finally {
      saving = false;
    }
  }

  async function handleDelete(toolId: string) {
    tools = await deleteTool(toolId);
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load the tool locker.';
    });
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Tools</p>
    <h1>Turn repeated trail decisions into reusable checklists.</h1>
    <p class="lede">
      This is the first safe tool builder. Keep the logic in a bounded checklist artifact instead of burying it in chat,
      memory, or another long note.
    </p>
  </div>
</section>

<section class="card panel-copy" style="margin-top:1rem; display:grid; gap:1rem;">
  <div class="page-intro">
    <p class="eyebrow">Create tool</p>
    <h2>Build one checklist you expect to reuse on trail.</h2>
  </div>

  <label>
    <span class="eyebrow">Title</span>
    <input bind:value={title} placeholder="Example: Rain camp reset" />
  </label>

  <label>
    <span class="eyebrow">Summary</span>
    <textarea bind:value={summary} rows="2" placeholder="What problem does this tool solve?"></textarea>
  </label>

  <label>
    <span class="eyebrow">Instructions</span>
    <textarea bind:value={instructions} rows="2" placeholder="How should this checklist be used?"></textarea>
  </label>

  <label>
    <span class="eyebrow">Checklist items</span>
    <textarea
      bind:value={itemsText}
      rows="6"
      placeholder="One step per line&#10;Pitch shelter before unpacking insulation&#10;Stash wet gear away from sleep clothes&#10;Eat before hands go cold"
    ></textarea>
  </label>

  {#if error}
    <p style="margin:0; color:#8a2f2f; font-weight:700;">{error}</p>
  {/if}

  <div class="subtle-actions">
    <button class="btn btn-secondary" type="button" disabled={saving} onclick={handleCreate}>
      {saving ? 'Saving tool...' : 'Create checklist'}
    </button>
  </div>
</section>

<section class="stack" style="margin-top:1rem;">
  {#if tools.length === 0}
    <article class="card empty-state">
      <h2>No tools yet.</h2>
      <p class="muted">Create the first one from a routine you are tired of rethinking.</p>
    </article>
  {:else}
    {#each tools as tool}
      <article class="card panel-copy" id={tool.id}>
        <div class="grid-two" style="align-items:start;">
          <div>
            <p class="eyebrow">{tool.author === 'user' ? 'Your checklist' : 'Starter checklist'}</p>
            <h2>{tool.title}</h2>
            <p class="muted">{tool.summary}</p>
            <p class="meta-line">{tool.instructions}</p>
          </div>
          <div class="subtle-actions" style="justify-content:flex-end;">
            <button class="btn" type="button" onclick={() => handleDelete(tool.id)}>Delete</button>
          </div>
        </div>

        <ol class="list-clean" style="margin-top:1rem;">
          {#each tool.items as item}
            <li>
              <strong>{item.label}</strong>
              {#if item.detail}
                <div class="muted">{item.detail}</div>
              {/if}
            </li>
          {/each}
        </ol>
      </article>
    {/each}
  {/if}
</section>
