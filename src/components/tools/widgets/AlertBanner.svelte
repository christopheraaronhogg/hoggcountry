<script lang="ts">
  import type { Alert } from '../../../lib/trailRecommendations';

  interface Props {
    alert: Alert;
  }

  let { alert }: Props = $props();

  // Map alert types to colors
  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    'state-line': {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.4)',
      text: '#16a34a',
    },
    'bear': {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.4)',
      text: '#d97706',
    },
    'terrain': {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.4)',
      text: '#2563eb',
    },
    'milestone': {
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.4)',
      text: '#9333ea',
    },
  };

  const colors = $derived(typeColors[alert.type] || typeColors['terrain']);
</script>

<div
  class="alert-banner"
  style="--bg: {colors.bg}; --border: {colors.border}; --accent: {colors.text};"
  role="alert"
>
  <span class="alert-icon">{alert.icon}</span>
  <div class="alert-content">
    <span class="alert-title">{alert.title}</span>
    {#if alert.distance}
      <span class="alert-distance">{alert.distance} mi</span>
    {/if}
  </div>
  <p class="alert-message">{alert.message}</p>
</div>

<style>
  .alert-banner {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    gap: 0.25rem 0.75rem;
    padding: 0.875rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .alert-banner:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .alert-icon {
    grid-row: span 2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .alert-content {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .alert-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--accent);
  }

  .alert-distance {
    font-size: 0.75rem;
    color: var(--muted, #888);
    background: rgba(0, 0, 0, 0.05);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .alert-message {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text, #555);
    line-height: 1.4;
  }

  /* State line celebration animation */
  .alert-banner:has(.alert-title:first-child) {
    animation: none;
  }

  @keyframes celebrate {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
</style>
