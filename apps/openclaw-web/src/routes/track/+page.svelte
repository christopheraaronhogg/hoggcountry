<script lang="ts">
  import { onMount } from 'svelte';
  import { LIVE_TRACKING_URL } from '../../../../../src/lib/config';

  onMount(() => {
    window.location.replace(LIVE_TRACKING_URL);
  });
</script>

<svelte:head>
  <title>Opening Garmin MapShare | Hogg Country</title>
  <meta name="description" content="Track the Hogg Country Appalachian Trail hike on Garmin MapShare." />
  <meta http-equiv="refresh" content={`0; url=${LIVE_TRACKING_URL}`} />
</svelte:head>

<section class="garmin-handoff" aria-labelledby="garmin-handoff-title">
  <div class="handoff-panel">
    <p class="eyebrow">Track Me</p>
    <h1 id="garmin-handoff-title">Opening Garmin MapShare</h1>
    <p>For daily progress, the Garmin map has the cleanest current track and satellite updates.</p>
    <a class="garmin-link" href={LIVE_TRACKING_URL} rel="noopener noreferrer">Open Garmin MapShare</a>
  </div>
</section>

<style>
  .garmin-handoff {
    min-height: calc(100vh - 52px);
    display: grid;
    place-items: center;
    padding: 2rem 1rem;
    background:
      linear-gradient(180deg, rgba(245, 242, 232, 0.96), rgba(232, 220, 197, 0.9)),
      #f5f2e8;
    color: #27332b;
  }

  .handoff-panel {
    width: min(100%, 34rem);
    border: 1px solid rgba(77, 89, 74, 0.22);
    border-radius: 8px;
    background: #fffdf8;
    padding: clamp(1.25rem, 4vw, 2rem);
    box-shadow: 0 16px 36px rgba(31, 41, 55, 0.09);
    text-align: left;
  }

  .eyebrow {
    margin: 0 0 0.45rem;
    color: #66735e;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-family: Oswald, system-ui, sans-serif;
    font-size: clamp(1.85rem, 8vw, 3.4rem);
    line-height: 0.95;
    text-transform: uppercase;
  }

  p {
    margin: 1rem 0 0;
    max-width: 28rem;
    color: #4d594a;
    line-height: 1.5;
  }

  .garmin-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    margin-top: 1.25rem;
    padding: 0.72rem 1rem;
    border-radius: 8px;
    background: #27332b;
    color: #fffdf8;
    font-weight: 800;
    text-decoration: none;
  }

  .garmin-link:focus-visible {
    outline: 3px solid #d97706;
    outline-offset: 3px;
  }
</style>
