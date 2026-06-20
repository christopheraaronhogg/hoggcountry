<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Data &amp; Sources | Hogg Country</title>
  <meta name="description" content="How Hogg Country sources and labels Appalachian Trail planning data." />
</svelte:head>

<section class="legal-page">
  <article class="legal-card">
    <p class="eyebrow">Hogg Country</p>
    <h1>Data &amp; Sources</h1>
    <p class="updated">Last updated: June 19, 2026</p>

    <p>
      Hogg Country is built around source-backed Appalachian Trail planning. The app is useful in the field only if it
      is honest about where its data comes from, what is verified, and what still needs a current field check.
    </p>

    <h2>Trail Miles</h2>
    <p>
      Displayed Appalachian Trail miles come from Hogg Country's anchor-calibration pipeline. We maintain a small,
      citation-backed set of landmark mile anchors, calibrate those against trail geometry, and generate the mileposts
      used by the map, daily planning, and Scout lookups. Trail miles are not hand-entered into app screens.
    </p>

    <h2>Licensing Policy</h2>
    <p>
      We do not scrape FarOut or wholesale-copy guidebook waypoint tables. We may select and cite individual public
      facts, verify our own curated landmarks against official or reputable sources, and derive the rest of the trail
      mile frame from our own calibration work.
    </p>

    <h2>Candidate Field Data</h2>
    <p>
      Water, shelter, town, permit, shuttle, and closure details can change quickly. Scout labels candidate data and
      points you toward verification instead of pretending old data is current. Always confirm live conditions with
      current official, local, or on-trail sources before depending on them.
    </p>

    <h2>User Reports</h2>
    <p>
      Optional trail-condition reports can help other hikers by sharing a condition tag, note, optional trail name,
      approximate trail-mile, and timestamp. Raw GPS coordinates are not sent with those reports. See the
      <a href={resolve('/privacy')}>privacy policy</a> for the full data-handling summary.
    </p>

    <h2>Corrections</h2>
    <p>
      If something looks wrong, email <a href="mailto:chris.stitchscreen@gmail.com">chris.stitchscreen@gmail.com</a> with the
      route, mile, source you checked, and the correction you recommend.
    </p>
  </article>
</section>

<style>
  .legal-page {
    width: min(100%, 960px);
    margin: 0 auto;
    padding: clamp(2rem, 6vw, 4rem) 1.25rem 5rem;
  }

  .legal-card {
    max-width: 760px;
    color: var(--ink, #243426);
  }

  .eyebrow,
  .updated {
    color: var(--muted, #6a7469);
    margin: 0 0 0.75rem;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    color: var(--pine, #2e4334);
  }

  h2 {
    margin: 2rem 0 0.65rem;
    color: var(--pine, #2e4334);
    font-size: 1.15rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  p {
    margin: 0 0 1rem;
    color: var(--muted, #5f6a5f);
    line-height: 1.75;
  }

  a {
    color: var(--pine, #2e4334);
    font-weight: 700;
  }
</style>
