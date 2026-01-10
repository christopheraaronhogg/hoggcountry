<script>
  // Live Tracking Button - Persistent floating button to track dad's AT hike
  // Toggle `enabled` to show/hide when tracking is active

  let {
    enabled = false,  // Set to true when dad starts hiking
    label = "Track Live",
    url = "https://share.garmin.com/theman1"
  } = $props();

  let isHovered = $state(false);
</script>

{#if enabled}
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    class="tracking-button"
    class:hovered={isHovered}
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
    aria-label="Track live location on Garmin MapShare"
  >
    <span class="pulse-ring"></span>
    <span class="button-content">
      <span class="live-dot"></span>
      <span class="button-text">{label}</span>
      <svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </span>
  </a>
{/if}

<style>
  .tracking-button {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 1000;

    display: flex;
    align-items: center;
    gap: 0.5rem;

    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #4d594a 0%, #3a443a 100%);
    border: 2px solid #5d6b5a;
    border-radius: 50px;

    color: #f5f2e8;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-decoration: none;
    text-transform: uppercase;

    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    transition: all 0.2s ease;
    cursor: pointer;
  }

  .tracking-button:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.3),
      0 4px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    border-color: #a6b589;
    background: linear-gradient(135deg, #5d6b5a 0%, #4d594a 100%);
  }

  .tracking-button:active {
    transform: translateY(0);
  }

  .button-content {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    position: relative;
    z-index: 2;
  }

  .live-dot {
    width: 10px;
    height: 10px;
    background: #dc2626;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.6);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(0.9);
    }
  }

  .pulse-ring {
    position: absolute;
    top: 50%;
    left: 1.25rem;
    width: 10px;
    height: 10px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid #dc2626;
    animation: pulse-ring 2s ease-out infinite;
    opacity: 0;
  }

  @keyframes pulse-ring {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.5);
      opacity: 0;
    }
  }

  .button-text {
    white-space: nowrap;
  }

  .external-icon {
    width: 14px;
    height: 14px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .tracking-button:hover .external-icon {
    opacity: 1;
  }

  /* Mobile: smaller and repositioned */
  @media (max-width: 640px) {
    .tracking-button {
      bottom: 1rem;
      right: 1rem;
      padding: 0.6rem 1rem;
      font-size: 0.8rem;
    }

    .live-dot {
      width: 8px;
      height: 8px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .live-dot,
    .pulse-ring {
      animation: none;
    }

    .pulse-ring {
      display: none;
    }
  }
</style>
