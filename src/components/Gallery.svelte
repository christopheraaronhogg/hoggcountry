<script lang="ts">
  import { onMount } from 'svelte';

  let { images = [] }: { images: { src: string; alt?: string }[] } = $props();
  let lightboxIndex: number | null = $state(null);
  let lastFocusedElement: HTMLElement | null = null;
  let overlayRef: HTMLDivElement | null = null;
  let closeButtonRef: HTMLButtonElement | null = null;

  function open(i: number) {
    lastFocusedElement = document.activeElement as HTMLElement;
    lightboxIndex = i;
    // Focus close button after render
    requestAnimationFrame(() => {
      closeButtonRef?.focus();
    });
  }

  function close() {
    lightboxIndex = null;
    // Return focus to triggering element
    lastFocusedElement?.focus();
  }

  function next() { if (lightboxIndex !== null) lightboxIndex = (lightboxIndex + 1) % images.length; }
  function prev() { if (lightboxIndex !== null) lightboxIndex = (lightboxIndex - 1 + images.length) % images.length; }

  function handleKeydown(e: KeyboardEvent) {
    if (lightboxIndex === null) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        next();
        break;
      case 'Tab':
        // Focus trap - keep focus within lightbox
        const focusables = overlayRef?.querySelectorAll<HTMLElement>('button');
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        break;
    }
  }
</script>

<div class="grid">
  {#each images as img, i}
    <button class="thumb" onclick={() => open(i)}>
      <img loading="lazy" src={img.src} alt={img.alt || ''} />
    </button>
  {/each}
</div>

{#if lightboxIndex !== null}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Image {lightboxIndex + 1} of {images.length}: {images[lightboxIndex].alt || 'Gallery image'}"
    bind:this={overlayRef}
    onclick={(e) => e.target === e.currentTarget && close()}
    onkeydown={handleKeydown}
  >
    <button class="close" bind:this={closeButtonRef} onclick={close} aria-label="Close lightbox">×</button>
    <button class="nav left" onclick={prev} aria-label="Previous image">‹</button>
    <img class="large" src={images[lightboxIndex].src} alt={images[lightboxIndex].alt || 'Gallery image'} />
    <button class="nav right" onclick={next} aria-label="Next image">›</button>
    <div class="lightbox-counter" aria-hidden="true">{lightboxIndex + 1} / {images.length}</div>
  </div>
{/if}

<style>
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: .75rem; }
  .thumb { border:0; padding:0; background:transparent; cursor:pointer; border-radius:10px; }
  .thumb:focus-visible { outline: 3px solid var(--alpine, #a6b589); outline-offset: 2px; }
  .thumb img { width:100%; height:140px; object-fit:cover; border-radius:10px; }
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,.9); display:grid; place-items:center; z-index:50; }
  .large { max-width: 92vw; max-height: 88vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
  .close { position:absolute; top:1rem; right:1rem; font-size:2rem; background:transparent; color:white; border:0; cursor:pointer; min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center; border-radius:8px; }
  .close:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .close:hover { background:rgba(255,255,255,.1); }
  .nav { position:absolute; top:50%; transform:translateY(-50%); background:transparent; border:0; color:white; font-size:3rem; padding:.5rem 1rem; cursor:pointer; min-width:48px; min-height:48px; display:flex; align-items:center; justify-content:center; border-radius:8px; }
  .nav:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  .nav:hover { background:rgba(255,255,255,.1); }
  .nav.left { left:1rem; }
  .nav.right { right:1rem; }
  .lightbox-counter { position:absolute; bottom:1.5rem; left:50%; transform:translateX(-50%); color:rgba(255,255,255,.7); font-size:0.875rem; font-family:Oswald, sans-serif; letter-spacing:0.05em; }
</style>
