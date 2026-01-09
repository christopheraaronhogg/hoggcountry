<script>
  import ProtoA from './prototypes/ProtoA_TrailHub.svelte';
  import ProtoB from './prototypes/ProtoB_Dashboard.svelte';
  import ProtoC from './prototypes/ProtoC_Trailhead.svelte';
  import ProtoD from './prototypes/ProtoD_Summit.svelte';
  import ProtoE from './prototypes/ProtoE_Zen.svelte';
  import ProtoF from './prototypes/ProtoF_Ranger.svelte';
  import ProtoG from './prototypes/ProtoG_Compass.svelte';

  let { videos = [] } = $props();
  let activePrototype = $state('A');

  const prototypes = [
    { id: 'A', name: 'Trail Hub', desc: 'Magazine editorial', color: '#4d594a' },
    { id: 'B', name: 'Dashboard', desc: 'Dark app interface', color: '#0f1114' },
    { id: 'C', name: 'Trailhead', desc: 'Warm personal journal', color: '#f5f2e8' },
    { id: 'D', name: 'Summit Vista', desc: 'Bold adventure brand', color: '#2b2f26' },
    { id: 'E', name: 'Trail Zen', desc: 'Minimalist & calm', color: '#faf9f6' },
    { id: 'F', name: 'Ranger Station', desc: 'Vintage national parks', color: '#f5f0e1' },
    { id: 'G', name: 'Compass', desc: 'Navigation wayfinding', color: '#f8f5eb' }
  ];
</script>

<div class="prototype-viewer">
  <!-- Sticky Switcher -->
  <nav class="switcher">
    <div class="switcher-inner">
      <span class="switcher-label">Pick a Design:</span>
      <div class="switcher-buttons">
        {#each prototypes as proto}
          <button
            class="switcher-btn"
            class:active={activePrototype === proto.id}
            onclick={() => activePrototype = proto.id}
            style="--accent: {proto.color}"
          >
            <span class="btn-letter">{proto.id}</span>
            <span class="btn-info">
              <span class="btn-name">{proto.name}</span>
              <span class="btn-desc">{proto.desc}</span>
            </span>
          </button>
        {/each}
      </div>
    </div>
  </nav>

  <!-- Prototype Content - All rendered, CSS hides inactive -->
  <div class="prototype-content">
    <div class="proto-wrapper" class:active={activePrototype === 'A'}><ProtoA /></div>
    <div class="proto-wrapper" class:active={activePrototype === 'B'}><ProtoB /></div>
    <div class="proto-wrapper" class:active={activePrototype === 'C'}><ProtoC /></div>
    <div class="proto-wrapper" class:active={activePrototype === 'D'}><ProtoD /></div>
    <div class="proto-wrapper" class:active={activePrototype === 'E'}><ProtoE /></div>
    <div class="proto-wrapper" class:active={activePrototype === 'F'}><ProtoF {videos} /></div>
    <div class="proto-wrapper" class:active={activePrototype === 'G'}><ProtoG /></div>
  </div>
</div>

<style>
  .prototype-viewer {
    min-height: 100vh;
  }

  .switcher {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: linear-gradient(to bottom, rgba(20, 20, 20, 0.98), rgba(20, 20, 20, 0.95));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .switcher-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .switcher-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #888;
    font-weight: 600;
    white-space: nowrap;
  }

  .switcher-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    flex: 1;
  }

  .switcher-btn {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.875rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .switcher-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .switcher-btn.active {
    background: rgba(240, 224, 0, 0.1);
    border-color: #f0e000;
    box-shadow: 0 0 20px rgba(240, 224, 0, 0.15);
  }

  .btn-letter {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    color: #fff;
    flex-shrink: 0;
  }

  .switcher-btn.active .btn-letter {
    background: #f0e000;
    color: #1a1a1a;
  }

  .btn-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .btn-name {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    color: #fff;
    line-height: 1.1;
  }

  .btn-desc {
    font-size: 0.65rem;
    color: #666;
    line-height: 1.2;
  }

  .switcher-btn.active .btn-desc {
    color: rgba(240, 224, 0, 0.7);
  }

  .prototype-content {
    padding-top: 70px;
  }

  .proto-wrapper {
    display: none;
  }

  .proto-wrapper.active {
    display: block;
  }

  /* Mobile adjustments */
  @media (max-width: 900px) {
    .switcher {
      padding: 0.625rem 0.75rem;
    }

    .switcher-inner {
      flex-direction: column;
      align-items: stretch;
    }

    .switcher-label {
      text-align: center;
    }

    .switcher-buttons {
      justify-content: center;
    }

    .btn-info {
      display: none;
    }

    .switcher-btn {
      padding: 0.5rem 0.75rem;
    }

    .btn-letter {
      width: 32px;
      height: 32px;
      font-size: 1rem;
    }

    .prototype-content {
      padding-top: 80px;
    }
  }

  @media (max-width: 500px) {
    .switcher-buttons {
      gap: 0.375rem;
    }

    .switcher-btn {
      padding: 0.4rem 0.6rem;
    }

    .btn-letter {
      width: 28px;
      height: 28px;
      font-size: 0.9rem;
    }
  }
</style>
