<script lang="ts">
  import type { LayoutData } from './$types';

  const { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();
</script>

<section class="card panel-copy" style="margin-bottom:1rem;">
  <div class="grid-two">
    <div>
      <p class="eyebrow">OpenClaw beta</p>
      <h1 style="margin:0;">{data.betaProfile?.trailName || data.betaProfile?.name}</h1>
      <p class="muted" style="margin-bottom:0;">Gated manual workspace. Dad’s guide is the example manual. Yours is what the app keeps tightening.</p>
    </div>

    <nav class="site-nav" aria-label="App">
      <a href="/app">Overview</a>
      <a href="/app/setup">Setup</a>
      <a href="/app/today">Today</a>
      <a href="/app/manual">Manual</a>
      <a href="/app/tools">Tools</a>
      <a href="/app/docs">Docs</a>
      <a href="/app/claw">Scout</a>
      <a href="/app/scout-lab">Scout Lab</a>
    </nav>
  </div>
</section>

{@render children()}
