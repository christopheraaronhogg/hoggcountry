<svelte:head>
  <title>About | Hogg Country</title>
  <meta name="description" content="Jimmy Hogg — Triple O Crowner, Sassafras Award recipient, and 2026 AT NOBO thru-hiker." />
</svelte:head>

<section class="about-page">
  <div class="container">
    <header class="about-header">
      <div class="badge-row">
        <span class="badge">Triple O Crowner</span>
        <span class="badge accent">Sassafras Award</span>
      </div>
      <h1>Jimmy Hogg</h1>
      <p class="subtitle hand">Arkansas hiker. 2026 AT NOBO.</p>
    </header>

    <div class="about-content">
      <section>
        <h2>The Trail So Far</h2>
        <p>
          I'm an avid long-distance hiker from Arkansas with over 840 miles of thru-hiking experience across three major
          trail systems. In 2026, I'm taking on the Appalachian Trail from Springer Mountain, Georgia to Mount Katahdin,
          Maine.
        </p>
        <p>This site documents my journey: past adventures, current preparation, and the field guide built for the AT.</p>
      </section>

      <section>
        <h2>Hiking Resume</h2>
        <div class="hike-cards">
          <div class="hike-card"><span>Ouachita Trail</span><strong>~223 mi / ~45,000 ft</strong><small>Arkansas-Oklahoma</small></div>
          <div class="hike-card"><span>Ozark Highlands Trail</span><strong>~270 mi / ~35,000 ft</strong><small>Northern Arkansas</small></div>
          <div class="hike-card"><span>Ozark Trail</span><strong>~230 mi / ~40,000 ft</strong><small>Missouri</small></div>
        </div>
      </section>

      <section>
        <h2>Recognition</h2>
        <div class="award-card">
          <h3>Sassafras Award — Ozark Society</h3>
          <p>Awarded for completion of the Ouachita Trail, Ozark Highlands Trail, and Ozark Trail.</p>
          <p><em>6th person in history to receive this award.</em></p>
        </div>
      </section>

      <section>
        <h2>What's Next</h2>
        <p>
          February 2026: Springer Mountain. Follow along through the <a href="/">trail log</a>, explore the
          <a href="/guide">Field Guide</a>, or open <a href="/app">Scout</a>.
        </p>
      </section>
    </div>
  </div>
</section>

<style>
  .about-page {
    padding: 3rem 0 5rem;
  }

  .about-header {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
    text-align: center;
  }

  .badge-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--alpine);
    border-radius: 20px;
    background: rgba(166, 181, 137, 0.2);
    color: var(--pine);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .badge.accent {
    border-color: var(--marker);
    background: rgba(240, 224, 0, 0.2);
    color: #8a7800;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: clamp(2.5rem, 6vw, 3.5rem);
  }

  .subtitle,
  .about-content p,
  small {
    color: var(--muted);
  }

  .about-content {
    max-width: 700px;
    margin: 0 auto;
  }

  .about-content section {
    margin-bottom: 2.5rem;
  }

  .about-content h2 {
    color: var(--pine);
    font-size: 1.25rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .hike-cards {
    display: grid;
    gap: 1rem;
  }

  .hike-card,
  .award-card {
    display: grid;
    gap: 0.25rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.82);
  }
</style>
