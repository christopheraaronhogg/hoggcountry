<script lang="ts">
  import AtWeather from '../../../../../src/components/AtWeather.svelte';
</script>

<svelte:head>
  <title>AT Weather · Mile by mile | Hogg Country</title>
  <meta
    name="description"
    content="Drag any mile of the Appalachian Trail to see the model forecast — Open-Meteo data anchored to the calibrated 2,197.9-mile AT frame. Verify field conditions before you commit."
  />
</svelte:head>

<section class="at-weather-page">
  <header class="page-header">
    <p class="kicker">Trail Weather · Mile by mile</p>
    <h1>Forecast anywhere on the A.T.</h1>
    <p class="lede">
      Drag the marker to any mile from Springer to Katahdin and Scout pulls a model forecast for that exact
      point on the trail — current conditions, the next 24 hours, the next seven days. Hand-anchored to the
      same calibrated 2,197.9-mile AT frame we use everywhere else.
    </p>
    <ul class="badges" aria-label="What you're looking at">
      <li class="badge"><span class="badge-dot dot-pine" aria-hidden="true"></span>Open-Meteo model</li>
      <li class="badge"><span class="badge-dot dot-alpine" aria-hidden="true"></span>OSM relation 156553</li>
      <li class="badge badge-warn"><span class="badge-dot dot-terra" aria-hidden="true"></span>Verify field conditions</li>
    </ul>
  </header>

  <AtWeather />

  <footer class="sources">
    <p>
      <strong>Why these numbers:</strong> the forecast is from the
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> global model at the
      coordinates we resolve from your selected mile. Trail geometry is the public
      <a href="https://www.openstreetmap.org/relation/156553" target="_blank" rel="noreferrer">OpenStreetMap AT relation 156553</a>,
      anchored to AWOL 2026 mileposts. Model temperatures don't know the ridgeline above the gauge — treat the
      number as a planning aid, not ground truth.
    </p>
  </footer>
</section>

<style>
  .at-weather-page {
    display: grid;
    gap: 1.4rem;
    padding: 0.25rem 0 1.5rem;
  }

  .page-header {
    display: grid;
    gap: 0.55rem;
  }

  .kicker {
    margin: 0;
    color: var(--terra, #d97706);
    font-family: Oswald, sans-serif;
    font-size: 0.74rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .page-header h1 {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.02;
    color: var(--ink, #1f2937);
  }

  .lede {
    margin: 0;
    max-width: 64ch;
    color: var(--muted, #4a5448);
    line-height: 1.65;
    font-size: 1.02rem;
  }

  .badges {
    list-style: none;
    margin: 0.35rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.45rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.32rem 0.7rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.22);
    background: rgba(255, 255, 255, 0.75);
    color: var(--pine, #4d594a);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .badge-warn {
    color: #8a4b06;
    border-color: rgba(217, 119, 6, 0.32);
    background: rgba(217, 119, 6, 0.08);
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    display: inline-block;
  }

  .dot-pine { background: var(--pine, #4d594a); }
  .dot-alpine { background: var(--alpine, #a6b589); }
  .dot-terra { background: var(--terra, #d97706); }

  .sources {
    border: 1px solid rgba(77, 89, 74, 0.16);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.55);
    padding: 0.9rem 1.05rem;
  }

  .sources p {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--muted, #4a5448);
  }

  .sources strong {
    color: var(--pine, #4d594a);
    font-family: Oswald, sans-serif;
    letter-spacing: 0.03em;
    font-weight: 800;
  }

  .sources a {
    color: var(--terra, #d97706);
    text-decoration: underline;
    text-underline-offset: 0.16rem;
  }

  @media (max-width: 600px) {
    .lede {
      font-size: 0.98rem;
    }
  }
</style>
