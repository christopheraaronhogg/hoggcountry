<script lang="ts">
  import PublicMap from '$components/PublicMap.svelte';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<section class="page-intro">
  <p class="eyebrow">Dad map</p>
  <h1>Track the current Garmin feed on a real map.</h1>
  <p class="lede">
    The production version is ready for live Garmin points. When no fresh point is available, the page falls back to
    a stable preview so the interface still works.
  </p>
</section>

<PublicMap featureCollection={data.track} title="Dad location" />
