<script lang="ts">
  import { trailContext, updateContext, TRAIL_TOTAL_MILES } from '../../stores/trailContext.svelte';

  const maxMile = Math.round(TRAIL_TOTAL_MILES);

  let dragging = $state(false);
  let value = $state(trailContext.currentMile);

  // Keep slider value synced to store unless actively dragging
  $effect(() => {
    if (!dragging) value = trailContext.currentMile;
  });

  const percent = $derived(Math.max(0, Math.min(100, (trailContext.currentMile / maxMile) * 100)));

  function clampMile(next: number): number {
    if (!Number.isFinite(next)) return trailContext.currentMile;
    return Math.max(0, Math.min(maxMile, Math.round(next)));
  }

  function setMile(next: number, persist: boolean) {
    const mile = clampMile(next);
    value = mile;
    updateContext({ currentMile: mile }, persist ? undefined : { persist: false });
  }

  function onInput(e: Event) {
    dragging = true;
    const next = Number((e.currentTarget as HTMLInputElement).value);
    setMile(next, false);
  }

  function onChange(e: Event) {
    const next = Number((e.currentTarget as HTMLInputElement).value);
    dragging = false;
    setMile(next, true);
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    setMile(value, true);
  }
</script>

<div class="scrubber" aria-label="Trail progress scrubber">
  <div class="track" aria-hidden="true">
    <div class="fill" style="width: {percent}%"></div>
    <div class="thumb" style="left: {percent}%"></div>
  </div>

  <input
    class="range"
    type="range"
    min="0"
    max={maxMile}
    step="1"
    bind:value
    oninput={onInput}
    onchange={onChange}
    onpointerup={onPointerUp}
    aria-label="Drag to set your mile marker"
  />
</div>

<style>
  .scrubber {
    width: 100%;
    position: relative;
    height: 18px;
    display: grid;
    align-items: center;
  }

  .track {
    position: relative;
    width: 100%;
    height: 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 999px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine, #7b9e6b), var(--marker, #f0e000));
    border-radius: 999px;
    transition: width 0.12s ease;
  }

  .thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(240, 224, 0, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
    transition: left 0.12s ease;
    pointer-events: none;
  }

  .range {
    position: absolute;
    inset: -10px 0 -10px 0;
    width: 100%;
    opacity: 0;
    cursor: grab;
    -webkit-tap-highlight-color: transparent;
  }

  .range:active {
    cursor: grabbing;
  }

  .scrubber:focus-within {
    outline: 3px solid rgba(240, 224, 0, 0.7);
    outline-offset: 4px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    .scrubber {
      height: 20px;
    }
    .thumb {
      width: 20px;
      height: 20px;
    }
  }
</style>

