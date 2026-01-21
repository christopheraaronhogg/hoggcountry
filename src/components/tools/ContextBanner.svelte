<script lang="ts">
  import ContextEditor from './ContextEditor.svelte';
  import { trailContext } from '../../stores/trailContext.svelte';

  let editorOpen = $state(false);
  let { title } = $props<{ title: string }>();
</script>

<div class="banner card">
  <div class="left">
    <a class="back" href="/tools/">← Tools</a>
    <div class="titles">
      <h1 class="font-display">{title}</h1>
      <div class="sub">
        Mile {trailContext.currentMile} • {trailContext.nearestLandmark.name} • {trailContext.effectiveDate}
      </div>
    </div>
  </div>

  <div class="right">
    <button class="btn btn-primary" type="button" onclick={() => (editorOpen = true)}>Edit settings</button>
  </div>
</div>

<ContextEditor bind:open={editorOpen} />

<style>
  .banner {
    padding: 0.9rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
  }

  .back {
    text-decoration: none;
    color: var(--pine);
    font-weight: 700;
    white-space: nowrap;
  }

  .back:hover {
    text-decoration: underline;
  }

  .titles {
    min-width: 0;
  }

  h1 {
    margin: 0;
    font-size: 1.6rem;
    line-height: 1.1;
  }

  .sub {
    color: var(--muted);
    font-size: 0.9rem;
    margin-top: 0.15rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 560px) {
    .banner {
      align-items: start;
      flex-direction: column;
    }
    .right {
      width: 100%;
    }
    .right :global(.btn) {
      width: 100%;
      justify-content: center;
    }
    .sub {
      white-space: normal;
    }
  }
</style>

