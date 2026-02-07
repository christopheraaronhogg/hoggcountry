<script lang="ts">
  import AtMap from '../AtMap.svelte';

  interface Props {
    onClose?: () => void;
  }

  let { onClose = () => {} }: Props = $props();
</script>

<div class="map-overlay" role="dialog" aria-modal="true" aria-label="Trail map">
  <div class="map-head">
    <div class="title-wrap">
      <p class="kicker">Live Overlay</p>
      <h2>Trail Map</h2>
    </div>
    <button class="close" type="button" onclick={onClose} aria-label="Close map">Close</button>
  </div>

  <div class="map-body">
    <AtMap />
  </div>
</div>

<style>
  .map-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--layer-map, 70);
    background: rgba(245, 242, 232, 0.94);
    display: grid;
    grid-template-rows: auto 1fr;
    animation: mapOverlayIn 200ms ease-out;
  }

  .map-head {
    position: relative;
    z-index: 4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;
    padding: max(0.7rem, env(safe-area-inset-top)) 0.85rem 0.5rem;
    background: linear-gradient(180deg, rgba(245, 242, 232, 0.98), rgba(245, 242, 232, 0.75));
    border-bottom: 1px solid rgba(77, 89, 74, 0.2);
    backdrop-filter: blur(8px);
  }

  .kicker {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.67rem;
    color: rgba(31, 41, 55, 0.72);
    font-family: Oswald, sans-serif;
  }

  .title-wrap h2 {
    margin: 0.05rem 0 0;
    font-size: 1.02rem;
    color: var(--ink, #1f2937);
  }

  .close {
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.26);
    padding: 0.43rem 0.8rem;
    font-size: 0.82rem;
    background: rgba(255, 255, 255, 0.92);
    color: #1f2937;
    font-weight: 700;
    cursor: pointer;
  }

  .map-body {
    min-height: 0;
    overflow: hidden;
  }

  .map-body :global(.mapShell) {
    height: calc(100dvh - 64px);
    border-radius: 0;
  }

  @keyframes mapOverlayIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .map-overlay {
      animation: none;
    }
  }
</style>
