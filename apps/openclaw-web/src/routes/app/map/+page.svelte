<section class="simple-page map-page" aria-label="Scout map">
  <header class="page-hero">
    <p class="eyebrow">Map</p>
    <h1>Trail context, not another dashboard.</h1>
    <p>Use this page for the current corridor, planned stops, water checks, and bailout options. The polished map pass is next; this route now exists in the simplified app structure.</p>
  </header>

  <article class="map-shell card">
    <div class="map-canvas" aria-label="Prototype trail map">
      <div class="map-line" aria-hidden="true"></div>
      <span class="map-point point-a"><strong>Now</strong></span>
      <span class="map-point point-b"><strong>Water</strong></span>
      <span class="map-point point-c"><strong>Camp</strong></span>
      <span class="map-point point-d"><strong>Town</strong></span>
    </div>
    <div class="map-copy">
      <h2>Map page foundation</h2>
      <p>Next iteration should connect this to live trail geometry, current mile, planned day targets, water/source receipts, and family-safe location sharing.</p>
      <a class="btn btn-secondary" href="/at-map">Open public AT map</a>
    </div>
  </article>
</section>

<style>
  .simple-page {
    display: grid;
    gap: 1rem;
    max-width: 980px;
    margin: 0 auto;
  }

  .page-hero {
    display: grid;
    gap: 0.4rem;
  }

  .page-hero h1 {
    max-width: 12ch;
    margin: 0;
    font-size: clamp(2.3rem, 7vw, 4.7rem);
    line-height: 0.96;
  }

  .page-hero p:not(.eyebrow) {
    max-width: 58ch;
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
  }

  .map-shell {
    display: grid;
    gap: 1rem;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255, 253, 248, 0.72), rgba(245, 242, 232, 0.95)),
      url('/default-background.svg') center / cover no-repeat;
  }

  .map-canvas {
    position: relative;
    min-height: min(62vh, 520px);
    overflow: hidden;
    border-bottom: 1px solid rgba(77, 89, 74, 0.12);
    background:
      radial-gradient(circle at 22% 30%, rgba(166, 181, 137, 0.46), transparent 16rem),
      radial-gradient(circle at 72% 58%, rgba(217, 119, 6, 0.14), transparent 13rem),
      rgba(237, 243, 229, 0.46);
  }

  .map-line {
    position: absolute;
    inset: 15% 16%;
    border-left: 6px solid rgba(77, 89, 74, 0.7);
    border-bottom: 6px solid rgba(77, 89, 74, 0.7);
    border-radius: 0 0 0 60%;
    transform: rotate(-18deg);
  }

  .map-point {
    position: absolute;
    display: grid;
    place-items: center;
    min-width: 4.5rem;
    min-height: 2.55rem;
    border: 3px solid #fffdf8;
    border-radius: 999px;
    background: var(--pine);
    color: white;
    box-shadow: 0 12px 24px rgba(31, 41, 55, 0.16);
  }

  .map-point strong {
    font-size: 0.86rem;
  }

  .point-a { left: 16%; top: 19%; }
  .point-b { left: 40%; top: 35%; background: #4e6a83; }
  .point-c { right: 22%; bottom: 34%; background: #342316; }
  .point-d { right: 12%; bottom: 16%; background: var(--terra); }

  .map-copy {
    display: grid;
    gap: 0.65rem;
    padding: 1.1rem;
  }

  .map-copy h2,
  .map-copy p {
    margin: 0;
  }

  .map-copy p {
    color: var(--muted);
    line-height: 1.5;
  }

  .map-copy .btn {
    justify-self: start;
  }

  @media (max-width: 760px) {
    .simple-page {
      gap: 0.75rem;
      padding-bottom: calc(6.8rem + env(safe-area-inset-bottom));
    }

    .page-hero h1 {
      max-width: 13ch;
      font-size: clamp(2rem, 10vw, 3rem);
    }

    .page-hero p:not(.eyebrow) {
      display: none;
    }

    .map-shell {
      gap: 0;
    }

    .map-canvas {
      min-height: 42vh;
    }

    .map-copy {
      gap: 0.42rem;
      padding: 0.85rem;
    }

    .map-copy p {
      display: none;
    }
  }

  @media (min-width: 820px) {
    .map-shell {
      grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
    }

    .map-canvas {
      border-right: 1px solid rgba(77, 89, 74, 0.12);
      border-bottom: 0;
    }

    .map-copy {
      align-content: center;
      padding: 1.4rem;
    }
  }
</style>
