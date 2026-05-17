<script lang="ts">
  interface Props {
    id: string;
    alt: string;
    class?: string;
    loading?: 'lazy' | 'eager';
    provided?: string;
    portrait?: boolean;
  }

  const { id, alt, class: className = '', loading = 'lazy', provided = '', portrait = false } = $props<Props>();

  const landscapeVariants = ['maxresdefault', 'sddefault', 'mqdefault', 'hqdefault', 'default'] as const;
  const portraitVariants = ['oardefault', 'oar2', 'oar3', ...landscapeVariants] as const;
  const sources = $derived.by(() => {
    const variants = portrait ? portraitVariants : landscapeVariants;
    const generated = id ? variants.map((variant) => `https://i.ytimg.com/vi/${id}/${variant}.jpg`) : [];
    return [...new Set([...generated, provided].filter(Boolean))];
  });
  let activeIndex = $state(0);
  const src = $derived(sources[activeIndex] ?? provided);

  function useFallback() {
    if (activeIndex < sources.length - 1) activeIndex += 1;
  }
</script>

{#if src}
  <img class={className} {src} {alt} {loading} decoding="async" onerror={useFallback} />
{/if}
