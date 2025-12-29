<script lang="ts">
  let { images = [] }: { images: { src: string; alt?: string }[] } = $props();
  let lightboxIndex: number | null = $state(null);

  function open(i: number) { lightboxIndex = i; }
  function close() { lightboxIndex = null; }
  function next() { if (lightboxIndex !== null) lightboxIndex = (lightboxIndex + 1) % images.length; }
  function prev() { if (lightboxIndex !== null) lightboxIndex = (lightboxIndex - 1 + images.length) % images.length; }
</script>

<div class="grid">
  {#each images as img, i}
    <button class="thumb" onclick={() => open(i)}>
      <img loading="lazy" src={img.src} alt={img.alt || ''} />
    </button>
  {/each}
</div>

{#if lightboxIndex !== null}
  <div class="overlay" role="dialog" aria-modal="true" onclick={(e) => e.target === e.currentTarget && close()}>
    <button class="close" onclick={close} aria-label="Close">×</button>
    <button class="nav left" onclick={prev} aria-label="Previous">‹</button>
    <img class="large" src={images[lightboxIndex].src} alt={images[lightboxIndex].alt || ''} />
    <button class="nav right" onclick={next} aria-label="Next">›</button>
  </div>
{/if}

<style>
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: .75rem; }
  .thumb { border:0; padding:0; background:transparent; cursor:pointer; }
  .thumb img { width:100%; height:140px; object-fit:cover; border-radius:10px; }
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,.9); display:grid; place-items:center; z-index:50; }
  .large { max-width: 92vw; max-height: 88vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
  .close { position:absolute; top:1rem; right:1rem; font-size:2rem; background:transparent; color:white; border:0; cursor:pointer; }
  .nav { position:absolute; top:50%; transform:translateY(-50%); background:transparent; border:0; color:white; font-size:3rem; padding:.5rem 1rem; cursor:pointer; }
  .nav.left { left:1rem; }
  .nav.right { right:1rem; }
</style>
