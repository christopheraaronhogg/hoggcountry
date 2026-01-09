<script>
  // Svelte 5 component - Trailhead Welcome
  // A warm, personal journal homepage for hoggcountry.com
</script>

<div class="trailhead">
  <!-- Paper texture overlay -->
  <div class="paper-texture"></div>

  <!-- ========== HEADER ========== -->
  <header class="th-header">
    <div class="th-header-inner">
      <a href="/" class="th-logo">
        <span class="logo-blaze"></span>
        <span class="logo-text">Hogg Country</span>
      </a>
      <nav class="th-nav">
        <a href="/guide">Field Guide</a>
        <a href="/tools">Tools</a>
        <a href="/trips">Trips</a>
        <a href="/videos">Videos</a>
      </nav>
    </div>
  </header>

  <!-- ========== HERO: Welcome to the Trailhead ========== -->
  <section class="th-hero">
    <div class="hero-content">
      <div class="hero-text">
        <span class="hero-marker">
          <span class="blaze-icon"></span>
          February 2026
        </span>
        <h1 class="hero-title">Welcome to<br/>the Trailhead</h1>
        <p class="hero-intro">
          This is Hogg Country - a digital trail register built by a son for his dad.
          After 840+ miles of thru-hikes and earning the rare Sassafras Award, my father
          Jimmy is taking on his biggest challenge yet: 2,194 miles on the Appalachian Trail,
          from Georgia to Maine.
        </p>
        <p class="hero-tagline hand">A dream years in the making.</p>
      </div>

      <!-- Hiker Card -->
      <div class="hiker-card">
        <div class="card-pin"></div>
        <div class="card-inner">
          <div class="card-photo">
            <div class="photo-placeholder">
              <span class="photo-icon">🥾</span>
            </div>
          </div>
          <div class="card-details">
            <span class="card-label">Trail Name</span>
            <h3 class="trail-name hand">"Triple-O"</h3>
            <div class="card-meta">
              <span>Jimmy Hogg</span>
              <span class="meta-dot"></span>
              <span>Arkansas</span>
            </div>
            <div class="card-credentials">
              <span class="credential">840+ Trail Miles</span>
              <span class="credential">Sassafras Award (6th Ever)</span>
            </div>
            <div class="card-credentials">
              <span class="credential">Triple O Crowner</span>
              <span class="credential">49 AT Miles</span>
            </div>
            <div class="card-credentials">
              <span class="credential">Pikes Peak Summit</span>
              <span class="credential">NOBO Ready: 9/10</span>
            </div>
          </div>
        </div>
        <div class="card-route">
          <span class="route-start">
            <span class="route-icon">▲</span>
            Springer Mtn, GA
          </span>
          <span class="route-arrow">→</span>
          <span class="route-end">
            <span class="route-icon">▲</span>
            Katahdin, ME
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== QUOTE SECTION ========== -->
  <section class="th-quote">
    <div class="quote-card">
      <div class="quote-tape quote-tape-left"></div>
      <div class="quote-tape quote-tape-right"></div>
      <blockquote>
        <p class="quote-text hand">
          "I built this guide for my dad - 20 chapters, 12 interactive tools, everything
          I could find about long-distance hiking. He's been preparing for this dream for years.
          Now it's time. I'll be following along from home, and I wanted him to have the
          best resource I could create."
        </p>
        <cite class="quote-cite">
          <span class="cite-dash">-</span>
          <span class="cite-name">Chris Hogg</span>
          <span class="cite-who hand">proud son & trail nerd</span>
        </cite>
      </blockquote>
    </div>
  </section>

  <!-- ========== CONTENT CARDS: Pinboard ========== -->
  <section class="th-pinboard">
    <h2 class="pinboard-title">What You'll Find Here</h2>

    <div class="pinboard-grid">
      <!-- Field Guide Card -->
      <article class="pin-card card-guide">
        <div class="card-pin pin-red"></div>
        <div class="card-tape tape-corner"></div>
        <div class="card-icon-wrap">
          <span class="card-icon">📖</span>
        </div>
        <h3 class="card-title">The Field Guide</h3>
        <p class="card-desc">
          20 chapters covering everything from gear selection and resupply strategy to
          weather systems and trail culture. Built from hundreds of hours of research
          and real trail experience.
        </p>
        <div class="card-stats">
          <span class="stat">20 Chapters</span>
          <span class="stat-dot"></span>
          <span class="stat">5 Quick Cards</span>
        </div>
        <a href="/guide" class="card-link">Start Reading →</a>
      </article>

      <!-- Trail Tools Card -->
      <article class="pin-card card-tools">
        <div class="card-pin pin-yellow"></div>
        <div class="card-icon-wrap">
          <span class="card-icon">🧮</span>
        </div>
        <h3 class="card-title">Trail Tools</h3>
        <p class="card-desc">
          Interactive calculators and planners to help you prepare: milestone tracking,
          resupply planning, budget calculator, gear lists, weather assessment, and more.
        </p>
        <div class="card-stats">
          <span class="stat">12 Tools</span>
          <span class="stat-dot"></span>
          <span class="stat">All Interactive</span>
        </div>
        <a href="/tools" class="card-link">Explore Tools →</a>
      </article>

      <!-- The Journey Card -->
      <article class="pin-card card-journey">
        <div class="card-pin pin-green"></div>
        <div class="card-tape tape-top"></div>
        <div class="card-icon-wrap">
          <span class="card-icon">🗺️</span>
        </div>
        <h3 class="card-title">The Journey</h3>
        <p class="card-desc">
          Trip reports from Arkansas trails, training hikes, gear shakedowns, and
          video content. Once the thru-hike begins, this becomes the trail journal.
        </p>
        <div class="card-stats">
          <span class="stat">Trips</span>
          <span class="stat-dot"></span>
          <span class="stat">Videos</span>
          <span class="stat-dot"></span>
          <span class="stat">Stories</span>
        </div>
        <a href="/trips" class="card-link">View Timeline →</a>
      </article>
    </div>
  </section>

  <!-- ========== STATS BAR ========== -->
  <section class="th-stats">
    <div class="stats-inner">
      <div class="stat-item">
        <span class="stat-number">840+</span>
        <span class="stat-label">Miles Hiked</span>
        <span class="stat-sub hand">Jimmy's experience</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">2,194</span>
        <span class="stat-label">Miles Ahead</span>
        <span class="stat-sub hand">Georgia → Maine</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">20</span>
        <span class="stat-label">Guide Chapters</span>
        <span class="stat-sub hand">Chris built for Dad</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-number">12</span>
        <span class="stat-label">Trail Tools</span>
        <span class="stat-sub hand">all interactive</span>
      </div>
    </div>
  </section>

  <!-- ========== SIGN-OFF ========== -->
  <section class="th-signoff">
    <div class="signoff-content">
      <div class="signoff-blaze">
        <div class="blaze-rect"></div>
      </div>
      <h2 class="signoff-title hand">See you on Katahdin, Dad</h2>
      <p class="signoff-text">
        Whether you're planning your own thru-hike, curious about long-distance hiking,
        or just here to follow along with Jimmy's journey - welcome to the trailhead.
        The white blazes start at Springer Mountain in February 2026.
      </p>
      <div class="signoff-cta">
        <a href="/guide" class="cta-primary">Read the Field Guide</a>
        <a href="/guide/chapter-1" class="cta-secondary">Chapter 1: The Dream →</a>
      </div>
      <p class="signoff-signature hand">
        With love and trail magic,<br/>
        <span class="signature-name">Chris</span>
      </p>
    </div>
  </section>

  <!-- ========== FOOTER ========== -->
  <footer class="th-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo hand">Hogg Country</span>
        <span class="footer-tagline">A Trailhead Logbook</span>
      </div>
      <nav class="footer-nav">
        <a href="/guide">Field Guide</a>
        <a href="/tools">Tools</a>
        <a href="/trips">Trips</a>
        <a href="/videos">Videos</a>
        <a href="/about">About</a>
      </nav>
      <div class="footer-meta">
        <p class="footer-copy">&copy; 2024-2026 Chris Hogg. Built for Dad in Arkansas.</p>
        <p class="footer-trail hand">Follow the white blazes.</p>
      </div>
    </div>
  </footer>
</div>

<style>
  /* ============================================
     DESIGN TOKENS & BASE STYLES
     ============================================ */
  .trailhead {
    --pine: #4d594a;
    --alpine: #a6b589;
    --terra: #d97706;
    --marker: #f0e000;
    --bg: #f5f2e8;
    --bg-dark: #ebe7db;
    --ink: #2b2f26;
    --muted: #5c665a;
    --card: #fffef9;
    --border: #e6e1d4;
    --shadow: rgba(0,0,0,0.08);

    position: relative;
    min-height: 100vh;
    background: transparent;
    color: var(--ink);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* Paper texture overlay */
  .paper-texture {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.03;
    z-index: 1;
  }

  /* Handwritten font class */
  .hand {
    font-family: 'Caveat', cursive;
  }

  /* ============================================
     HEADER
     ============================================ */
  .th-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(245, 242, 232, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .th-header-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .th-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--pine);
  }

  .logo-blaze {
    width: 8px;
    height: 20px;
    background: var(--marker);
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  .logo-text {
    font-family: 'Caveat', cursive;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--pine);
  }

  .th-nav {
    display: flex;
    gap: 0.25rem;
  }

  .th-nav a {
    padding: 0.5rem 0.75rem;
    color: var(--pine);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 6px;
    transition: background 0.15s ease;
  }

  .th-nav a:hover {
    background: rgba(77, 89, 74, 0.08);
  }

  /* ============================================
     HERO SECTION
     ============================================ */
  .th-hero {
    position: relative;
    z-index: 2;
    padding: 3rem 1.5rem 4rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .hero-content {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 3rem;
    align-items: start;
  }

  .hero-marker {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 0.85rem;
    color: var(--muted);
    margin-bottom: 1rem;
  }

  .blaze-icon {
    display: inline-block;
    width: 6px;
    height: 14px;
    background: var(--marker);
    border-radius: 1px;
  }

  .hero-title {
    font-family: 'Oswald', sans-serif;
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink);
    margin: 0 0 1.25rem;
    letter-spacing: -0.01em;
  }

  .hero-intro {
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--muted);
    max-width: 520px;
    margin: 0 0 1rem;
  }

  .hero-tagline {
    font-size: 1.5rem;
    color: var(--terra);
    margin: 0;
  }

  /* Hiker Card */
  .hiker-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow:
      0 4px 20px rgba(0,0,0,0.06),
      0 1px 3px rgba(0,0,0,0.04);
    transform: rotate(1.5deg);
  }

  .card-pin {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background: radial-gradient(circle at 30% 30%, #ff6b6b, #c0392b);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .card-pin::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    background: rgba(255,255,255,0.4);
    border-radius: 50%;
  }

  .card-inner {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .card-photo {
    flex-shrink: 0;
  }

  .photo-placeholder {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, var(--alpine), var(--pine));
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-size: 2rem;
    box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1);
  }

  .card-details {
    flex: 1;
    min-width: 0;
  }

  .card-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
  }

  .trail-name {
    font-size: 1.75rem;
    color: var(--pine);
    margin: 0.1rem 0 0.5rem;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .meta-dot {
    width: 3px;
    height: 3px;
    background: var(--muted);
    border-radius: 50%;
  }

  .card-credentials {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }

  .credential {
    padding: 0.2rem 0.5rem;
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid rgba(166, 181, 137, 0.3);
    border-radius: 4px;
    font-size: 0.7rem;
    color: var(--pine);
    font-weight: 500;
  }

  .card-route {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--border);
    font-size: 0.8rem;
    color: var(--muted);
  }

  .route-icon {
    color: var(--alpine);
    font-size: 0.7rem;
  }

  .route-arrow {
    color: var(--terra);
  }

  /* ============================================
     QUOTE SECTION
     ============================================ */
  .th-quote {
    position: relative;
    z-index: 2;
    padding: 2rem 1.5rem 3rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .quote-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2.5rem 2rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    transform: rotate(-0.5deg);
  }

  .quote-tape {
    position: absolute;
    width: 60px;
    height: 24px;
    background: rgba(240, 224, 0, 0.6);
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  .quote-tape-left {
    top: -8px;
    left: 24px;
    transform: rotate(-12deg);
  }

  .quote-tape-right {
    top: -8px;
    right: 24px;
    transform: rotate(8deg);
  }

  blockquote {
    margin: 0;
  }

  .quote-text {
    font-size: 1.5rem;
    line-height: 1.5;
    color: var(--ink);
    margin: 0 0 1.25rem;
    text-align: center;
  }

  .quote-cite {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    font-style: normal;
  }

  .cite-dash {
    color: var(--terra);
    font-size: 1.5rem;
  }

  .cite-name {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .cite-who {
    font-size: 1.25rem;
    color: var(--pine);
  }

  /* ============================================
     PINBOARD / CONTENT CARDS
     ============================================ */
  .th-pinboard {
    position: relative;
    z-index: 2;
    padding: 2rem 1.5rem 3rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .pinboard-title {
    font-family: 'Oswald', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--pine);
    text-align: center;
    margin: 0 0 2rem;
  }

  .pinboard-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .pin-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 2rem 1.5rem 1.5rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .pin-card:hover {
    transform: translateY(-4px) rotate(0deg) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  }

  .card-guide {
    transform: rotate(-1deg);
  }

  .card-tools {
    transform: rotate(0.5deg);
  }

  .card-journey {
    transform: rotate(1deg);
  }

  .card-pin {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.25);
  }

  .card-pin::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 4px;
    height: 4px;
    background: rgba(255,255,255,0.5);
    border-radius: 50%;
  }

  .pin-red {
    background: radial-gradient(circle at 30% 30%, #ff6b6b, #c0392b);
  }

  .pin-yellow {
    background: radial-gradient(circle at 30% 30%, #ffeaa7, #f39c12);
  }

  .pin-green {
    background: radial-gradient(circle at 30% 30%, #a6b589, #4d594a);
  }

  .card-tape {
    position: absolute;
    background: rgba(240, 224, 0, 0.5);
    border-radius: 2px;
  }

  .tape-corner {
    top: 8px;
    right: -8px;
    width: 40px;
    height: 18px;
    transform: rotate(45deg);
  }

  .tape-top {
    top: -6px;
    left: 30%;
    width: 50px;
    height: 16px;
    transform: rotate(-3deg);
  }

  .card-icon-wrap {
    text-align: center;
    margin-bottom: 1rem;
  }

  .card-icon {
    font-size: 2.5rem;
  }

  .card-title {
    font-family: 'Oswald', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    text-align: center;
    margin: 0 0 0.75rem;
  }

  .card-desc {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--muted);
    text-align: center;
    margin: 0 0 1rem;
  }

  .card-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--pine);
    margin-bottom: 1rem;
  }

  .stat-dot {
    width: 3px;
    height: 3px;
    background: var(--alpine);
    border-radius: 50%;
  }

  .card-link {
    display: block;
    text-align: center;
    padding: 0.6rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--pine);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .card-link:hover {
    background: var(--card);
    border-color: var(--alpine);
  }

  /* ============================================
     STATS BAR
     ============================================ */
  .th-stats {
    position: relative;
    z-index: 2;
    padding: 2.5rem 1.5rem;
    background: linear-gradient(135deg, var(--pine) 0%, #3d4a3a 100%);
  }

  .stats-inner {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-number {
    display: block;
    font-family: 'Oswald', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--marker);
    line-height: 1;
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.9);
    margin-top: 0.25rem;
  }

  .stat-sub {
    display: block;
    font-size: 1rem;
    color: rgba(255,255,255,0.6);
    margin-top: 0.15rem;
  }

  .stat-divider {
    width: 1px;
    height: 60px;
    background: rgba(255,255,255,0.2);
  }

  /* ============================================
     SIGN-OFF SECTION
     ============================================ */
  .th-signoff {
    position: relative;
    z-index: 2;
    padding: 4rem 1.5rem;
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
  }

  .signoff-blaze {
    margin-bottom: 1.5rem;
  }

  .blaze-rect {
    display: inline-block;
    width: 24px;
    height: 80px;
    background: var(--marker);
    border-radius: 4px;
    box-shadow:
      0 4px 12px rgba(240, 224, 0, 0.3),
      inset 0 -4px 8px rgba(0,0,0,0.1);
  }

  .signoff-title {
    font-size: 2.5rem;
    color: var(--pine);
    margin: 0 0 1rem;
  }

  .signoff-text {
    font-size: 1.05rem;
    line-height: 1.7;
    color: var(--muted);
    max-width: 550px;
    margin: 0 auto 2rem;
  }

  .signoff-cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2.5rem;
  }

  .cta-primary {
    display: inline-flex;
    align-items: center;
    padding: 0.85rem 2rem;
    background: var(--marker);
    border: 2px solid #e0d400;
    border-radius: 8px;
    color: var(--ink);
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(240, 224, 0, 0.4);
  }

  .cta-secondary {
    color: var(--pine);
    text-decoration: none;
    font-size: 0.95rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.15rem;
    transition: border-color 0.15s ease;
  }

  .cta-secondary:hover {
    border-color: var(--pine);
  }

  .signoff-signature {
    font-size: 1.35rem;
    color: var(--muted);
    margin: 0;
    line-height: 1.4;
  }

  .signature-name {
    display: block;
    font-size: 1.75rem;
    color: var(--pine);
    margin-top: 0.25rem;
  }

  /* ============================================
     FOOTER
     ============================================ */
  .th-footer {
    position: relative;
    z-index: 2;
    background: var(--bg-dark);
    border-top: 1px solid var(--border);
    padding: 2.5rem 1.5rem;
  }

  .footer-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .footer-brand {
    text-align: center;
  }

  .footer-logo {
    font-size: 1.75rem;
    color: var(--pine);
  }

  .footer-tagline {
    display: block;
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }

  .footer-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem 1.5rem;
  }

  .footer-nav a {
    color: var(--pine);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.15s ease;
  }

  .footer-nav a:hover {
    color: var(--terra);
  }

  .footer-meta {
    text-align: center;
  }

  .footer-copy {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0 0 0.25rem;
  }

  .footer-trail {
    font-size: 1rem;
    color: var(--alpine);
    margin: 0;
  }

  /* ============================================
     RESPONSIVE STYLES
     ============================================ */
  @media (max-width: 900px) {
    .hero-content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .hiker-card {
      max-width: 360px;
      margin: 0 auto;
    }

    .pinboard-grid {
      grid-template-columns: 1fr;
      max-width: 400px;
      margin: 0 auto;
    }

    .pin-card {
      transform: none !important;
    }

    .stats-inner {
      flex-direction: column;
      gap: 1.5rem;
    }

    .stat-divider {
      width: 60px;
      height: 1px;
    }

    .stat-number {
      font-size: 2.5rem;
    }
  }

  @media (max-width: 600px) {
    .th-header-inner {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
    }

    .th-nav {
      width: 100%;
      justify-content: center;
    }

    .th-nav a {
      padding: 0.4rem 0.5rem;
      font-size: 0.85rem;
    }

    .th-hero {
      padding: 2rem 1rem 3rem;
    }

    .hero-title {
      font-size: 2rem;
    }

    .hero-intro {
      font-size: 1rem;
    }

    .hero-tagline {
      font-size: 1.25rem;
    }

    .hiker-card {
      padding: 1.25rem;
    }

    .card-inner {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .card-meta {
      justify-content: center;
    }

    .card-credentials {
      justify-content: center;
    }

    .th-quote {
      padding: 1.5rem 1rem 2rem;
    }

    .quote-card {
      padding: 2rem 1.25rem;
    }

    .quote-text {
      font-size: 1.25rem;
    }

    .quote-tape {
      width: 40px;
      height: 18px;
    }

    .th-pinboard {
      padding: 1.5rem 1rem 2rem;
    }

    .pin-card {
      padding: 1.5rem 1.25rem 1.25rem;
    }

    .th-stats {
      padding: 2rem 1rem;
    }

    .th-signoff {
      padding: 3rem 1rem;
    }

    .signoff-title {
      font-size: 2rem;
    }

    .signoff-text {
      font-size: 0.95rem;
    }

    .cta-primary {
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
    }
  }

  /* ============================================
     SUBTLE ANIMATIONS
     ============================================ */
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .blaze-rect {
    animation: float 4s ease-in-out infinite;
  }
</style>
