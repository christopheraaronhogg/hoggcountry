<script lang="ts">
  import { trailContext } from '../../stores/trailContext.svelte';

  interface Props {
    onEditClick?: () => void;
  }

  let { onEditClick }: Props = $props();

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
</script>

<div class="context-banner">
  <a href="/tools/" class="back-link">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
    Dashboard
  </a>

  <div class="context-info">
    <span class="mile">Mile {trailContext.currentMile}</span>
    <span class="divider">•</span>
    <span class="landmark">{trailContext.nearestLandmark.name}</span>
    <span class="divider">•</span>
    <span class="date">{formatDate(new Date(trailContext.effectiveDate))}</span>
  </div>

  <button class="edit-btn" onclick={onEditClick} aria-label="Edit trail settings">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  </button>
</div>

<style>
  .context-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #3d4a38 0%, #2c362a 100%);
    border-radius: 10px;
    margin-bottom: 1.5rem;
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    transition: color 0.2s ease;
  }

  .back-link:hover {
    color: #fff;
  }

  .context-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .mile {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }

  .divider {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.75rem;
  }

  .landmark,
  .date {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .context-banner {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .context-info {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .edit-btn {
      margin-left: auto;
    }
  }
</style>
