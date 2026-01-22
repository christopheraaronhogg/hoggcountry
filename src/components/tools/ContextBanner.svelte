<script lang="ts">
  import { trailContext } from '../../stores/trailContext.svelte';
  import QuickMileControl from './QuickMileControl.svelte';

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
    <div class="mile-inline">
      <span class="mile-label">Mile</span>
      <QuickMileControl compact={true} showTotal={false} showGps={false} />
    </div>
    <span class="divider">•</span>
    <span class="landmark">{trailContext.nearestLandmark.name}</span>
    <span class="divider">•</span>
    <span class="date">{formatDate(new Date(trailContext.effectiveDate))}</span>
  </div>

  <button class="edit-btn" onclick={onEditClick} aria-label="Open settings (pace, date, zeros)">
    Settings
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

  .mile-inline {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .mile-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    text-transform: uppercase;
    letter-spacing: 0.03em;
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
    height: 32px;
    padding: 0 0.65rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-size: 0.75rem;
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
