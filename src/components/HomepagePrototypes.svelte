<script>
  let activePrototype = $state('A');

  const prototypes = [
    { id: 'A', name: 'Trail Hub', desc: 'Magazine editorial' },
    { id: 'B', name: 'Adventure Dashboard', desc: 'App-like interface' },
    { id: 'C', name: 'Trailhead Welcome', desc: 'Warm & personal' }
  ];
</script>

<div class="prototype-viewer">
  <!-- Prototype Switcher -->
  <nav class="switcher">
    <div class="switcher-inner">
      <span class="switcher-label">Compare Designs:</span>
      {#each prototypes as proto}
        <button
          class="switcher-btn"
          class:active={activePrototype === proto.id}
          onclick={() => activePrototype = proto.id}
        >
          <span class="btn-letter">{proto.id}</span>
          <span class="btn-name">{proto.name}</span>
          <span class="btn-desc">{proto.desc}</span>
        </button>
      {/each}
    </div>
  </nav>

  <!-- ============================================ -->
  <!-- PROTOTYPE A: Trail Hub - Editorial Magazine -->
  <!-- ============================================ -->
  {#if activePrototype === 'A'}
    <div class="proto-a">
      <!-- Topographic overlay -->
      <div class="topo-overlay"></div>

      <!-- Header -->
      <header class="a-header">
        <div class="a-header-inner">
          <a href="/" class="a-logo">
            <span class="logo-icon">▲</span>
            <span class="logo-text">HOGG COUNTRY</span>
          </a>
          <nav class="a-nav">
            <a href="/guide" class="nav-item">Field Guide</a>
            <a href="/tools" class="nav-item">Tools</a>
            <a href="/trips" class="nav-item">Trips</a>
            <a href="/videos" class="nav-item">Videos</a>
          </nav>
        </div>
      </header>

      <!-- Hero - Featured Content -->
      <section class="a-hero">
        <div class="a-hero-grid">
          <div class="a-hero-main">
            <span class="a-issue">Issue 01 — AT 2026</span>
            <h1 class="a-headline">The Complete<br/>Appalachian Trail<br/><span class="accent">Field Guide</span></h1>
            <p class="a-subhead">2,190 miles of trail-tested knowledge. 19 chapters. Built for THEMAN's February NOBO start.</p>
            <div class="a-hero-actions">
              <a href="/guide" class="a-btn primary">Read the Guide</a>
              <a href="/tools" class="a-btn secondary">Explore Tools</a>
            </div>
          </div>
          <div class="a-hero-visual">
            <div class="a-hero-card">
              <div class="card-badge">FEATURED</div>
              <div class="card-image">
                <div class="card-placeholder">
                  <span>🏔️</span>
                  <span class="card-miles">2,190 mi</span>
                </div>
              </div>
              <div class="card-content">
                <span class="card-tag">Field Guide</span>
                <h3>Springer to Katahdin</h3>
                <p>Everything you need for a successful thru-hike</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <section class="a-content">
        <div class="a-section-header">
          <h2>Latest from the Trail</h2>
          <a href="/trips" class="see-all">View All →</a>
        </div>

        <div class="a-grid">
          <article class="a-card large">
            <div class="a-card-image">
              <div class="placeholder-img gradient-1">
                <span>🎥</span>
              </div>
              <span class="a-card-type">VIDEO</span>
            </div>
            <div class="a-card-body">
              <time>Dec 2024</time>
              <h3>Gear Shakedown: What's in My Pack</h3>
              <p>Final gear decisions before the February start</p>
            </div>
          </article>

          <article class="a-card">
            <div class="a-card-image">
              <div class="placeholder-img gradient-2">
                <span>🥾</span>
              </div>
              <span class="a-card-type">TRIP</span>
            </div>
            <div class="a-card-body">
              <time>Nov 2024</time>
              <h3>Pike's Peak Training</h3>
              <p>High altitude prep in Colorado</p>
            </div>
          </article>

          <article class="a-card">
            <div class="a-card-image">
              <div class="placeholder-img gradient-3">
                <span>📝</span>
              </div>
              <span class="a-card-type">POST</span>
            </div>
            <div class="a-card-body">
              <time>Oct 2024</time>
              <h3>Training Philosophy</h3>
              <p>Building endurance for the long haul</p>
            </div>
          </article>
        </div>
      </section>

      <!-- Tools Section -->
      <section class="a-tools">
        <div class="a-tools-inner">
          <div class="a-tools-header">
            <span class="tools-badge">12 INTERACTIVE TOOLS</span>
            <h2>Plan Your Adventure</h2>
            <p>Calculate resupply, plan milestones, assess weather, and more</p>
          </div>
          <div class="a-tools-grid">
            <a href="/tools#milestone" class="a-tool">
              <span class="tool-icon">📍</span>
              <span class="tool-name">Milestones</span>
            </a>
            <a href="/tools#resupply" class="a-tool">
              <span class="tool-icon">🎒</span>
              <span class="tool-name">Resupply</span>
            </a>
            <a href="/tools#weather" class="a-tool">
              <span class="tool-icon">🌦️</span>
              <span class="tool-name">Weather</span>
            </a>
            <a href="/tools#budget" class="a-tool">
              <span class="tool-icon">💰</span>
              <span class="tool-name">Budget</span>
            </a>
            <a href="/tools#layers" class="a-tool">
              <span class="tool-icon">🧥</span>
              <span class="tool-name">Layering</span>
            </a>
            <a href="/tools" class="a-tool more">
              <span class="tool-icon">+7</span>
              <span class="tool-name">More</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="a-footer">
        <div class="a-footer-inner">
          <div class="footer-brand">
            <span class="logo-icon">▲</span>
            <span>HOGG COUNTRY</span>
          </div>
          <p class="footer-tagline">See you on Katahdin.</p>
        </div>
      </footer>
    </div>
  {/if}

  <!-- ============================================ -->
  <!-- PROTOTYPE B: Adventure Dashboard - App-like -->
  <!-- ============================================ -->
  {#if activePrototype === 'B'}
    <div class="proto-b">
      <!-- Header -->
      <header class="b-header">
        <div class="b-header-inner">
          <div class="b-logo">
            <div class="logo-mark">HC</div>
            <div class="logo-info">
              <span class="logo-name">Hogg Country</span>
              <span class="logo-sub">Trail Command Center</span>
            </div>
          </div>
          <nav class="b-nav">
            <a href="/guide" class="b-nav-item">
              <span class="nav-icon">📖</span>
              <span>Guide</span>
            </a>
            <a href="/tools" class="b-nav-item">
              <span class="nav-icon">🛠️</span>
              <span>Tools</span>
            </a>
            <a href="/trips" class="b-nav-item">
              <span class="nav-icon">🥾</span>
              <span>Trips</span>
            </a>
          </nav>
        </div>
      </header>

      <!-- Main Dashboard -->
      <main class="b-main">
        <!-- Mission Card -->
        <section class="b-mission">
          <div class="mission-glow"></div>
          <div class="mission-content">
            <div class="mission-badge">
              <span class="badge-dot"></span>
              <span>ACTIVE MISSION</span>
            </div>
            <h1>AT 2026 NOBO</h1>
            <div class="mission-details">
              <div class="detail">
                <span class="detail-value">2,190</span>
                <span class="detail-label">Miles</span>
              </div>
              <div class="detail-divider"></div>
              <div class="detail">
                <span class="detail-value">Feb</span>
                <span class="detail-label">Start</span>
              </div>
              <div class="detail-divider"></div>
              <div class="detail">
                <span class="detail-value">19</span>
                <span class="detail-label">Chapters</span>
              </div>
            </div>
            <div class="mission-progress">
              <div class="progress-label">
                <span>Pre-Trail Preparation</span>
                <span>85%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 85%"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions Grid -->
        <section class="b-quick-grid">
          <a href="/guide" class="b-quick-card guide">
            <div class="quick-icon">📖</div>
            <div class="quick-content">
              <h3>Field Guide</h3>
              <p>19 chapters of trail knowledge</p>
            </div>
            <div class="quick-arrow">→</div>
          </a>

          <a href="/tools" class="b-quick-card tools">
            <div class="quick-icon">🧰</div>
            <div class="quick-content">
              <h3>Trail Tools</h3>
              <p>12 interactive planners</p>
            </div>
            <div class="quick-arrow">→</div>
          </a>

          <a href="/videos" class="b-quick-card videos">
            <div class="quick-icon">🎬</div>
            <div class="quick-content">
              <h3>Videos</h3>
              <p>Latest from YouTube</p>
            </div>
            <div class="quick-arrow">→</div>
          </a>

          <a href="/trips" class="b-quick-card trips">
            <div class="quick-icon">🗺️</div>
            <div class="quick-content">
              <h3>Trip Reports</h3>
              <p>Training adventures</p>
            </div>
            <div class="quick-arrow">→</div>
          </a>
        </section>

        <!-- Tools Strip -->
        <section class="b-tools-strip">
          <div class="strip-header">
            <h2>Quick Tools</h2>
            <a href="/tools" class="strip-link">All Tools →</a>
          </div>
          <div class="tools-scroll">
            <button class="b-tool-chip">
              <span>📍</span> Milestones
            </button>
            <button class="b-tool-chip">
              <span>🎒</span> Resupply
            </button>
            <button class="b-tool-chip">
              <span>🌡️</span> Weather
            </button>
            <button class="b-tool-chip">
              <span>💧</span> Water
            </button>
            <button class="b-tool-chip">
              <span>⚡</span> Power
            </button>
            <button class="b-tool-chip">
              <span>🏠</span> Shelter
            </button>
            <button class="b-tool-chip">
              <span>🧥</span> Layers
            </button>
            <button class="b-tool-chip">
              <span>💰</span> Budget
            </button>
          </div>
        </section>

        <!-- Activity Feed -->
        <section class="b-feed">
          <h2>Recent Activity</h2>
          <div class="feed-list">
            <div class="feed-item">
              <div class="feed-icon video">🎥</div>
              <div class="feed-content">
                <span class="feed-title">New Video Published</span>
                <span class="feed-desc">Gear Shakedown 2024</span>
              </div>
              <span class="feed-time">2d ago</span>
            </div>
            <div class="feed-item">
              <div class="feed-icon guide">📖</div>
              <div class="feed-content">
                <span class="feed-title">Guide Updated</span>
                <span class="feed-desc">Trail Sections reorganized</span>
              </div>
              <span class="feed-time">1w ago</span>
            </div>
            <div class="feed-item">
              <div class="feed-icon trip">🥾</div>
              <div class="feed-content">
                <span class="feed-title">Trip Report Added</span>
                <span class="feed-desc">Pike's Peak Training</span>
              </div>
              <span class="feed-time">2w ago</span>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="b-footer">
        <span class="footer-text">HOGG COUNTRY — Trail Command Center</span>
      </footer>
    </div>
  {/if}

  <!-- ============================================ -->
  <!-- PROTOTYPE C: Trailhead Welcome - Personal -->
  <!-- ============================================ -->
  {#if activePrototype === 'C'}
    <div class="proto-c">
      <!-- Paper texture overlay -->
      <div class="paper-texture"></div>

      <!-- Header -->
      <header class="c-header">
        <div class="c-header-inner">
          <a href="/" class="c-logo">
            <span class="logo-script">Hogg Country</span>
          </a>
          <nav class="c-nav">
            <a href="/guide">Guide</a>
            <a href="/tools">Tools</a>
            <a href="/trips">Trips</a>
            <a href="/about">About</a>
          </nav>
        </div>
      </header>

      <!-- Hero - Personal Welcome -->
      <section class="c-hero">
        <div class="c-hero-content">
          <div class="hero-stamp">EST. 2024</div>
          <h1 class="c-headline">
            <span class="line-1">Welcome to</span>
            <span class="line-2">the Trailhead</span>
          </h1>
          <p class="c-intro">
            A father's journey from Georgia to Maine. 2,190 miles. One step at a time.
          </p>
          <div class="c-hiker-card">
            <div class="hiker-photo">
              <span class="photo-placeholder">👨</span>
            </div>
            <div class="hiker-info">
              <span class="hiker-label">Trail Name</span>
              <span class="hiker-name">THEMAN</span>
              <span class="hiker-mission">AT NOBO • Feb 2026</span>
            </div>
          </div>
        </div>
        <div class="c-hero-deco">
          <div class="blaze blaze-1"></div>
          <div class="blaze blaze-2"></div>
          <div class="blaze blaze-3"></div>
        </div>
      </section>

      <!-- Story Section -->
      <section class="c-story">
        <div class="story-inner">
          <blockquote class="c-quote">
            "This guide started as a gift for my dad — comprehensive trail knowledge for his AT thru-hike. Now it's here for every hiker dreaming of Katahdin."
          </blockquote>
          <cite class="c-cite">— Chris, the son behind the scenes</cite>
        </div>
      </section>

      <!-- Main Content Cards -->
      <section class="c-content">
        <div class="c-cards">
          <!-- Guide Card -->
          <a href="/guide" class="c-card guide-card">
            <div class="card-pin"></div>
            <div class="card-inner">
              <span class="card-icon">📖</span>
              <h3>The Field Guide</h3>
              <p>19 chapters of hard-won trail wisdom. Gear, weather, resupply, and everything in between.</p>
              <span class="card-cta">Start Reading →</span>
            </div>
            <div class="card-tape"></div>
          </a>

          <!-- Tools Card -->
          <a href="/tools" class="c-card tools-card">
            <div class="card-pin"></div>
            <div class="card-inner">
              <span class="card-icon">🧰</span>
              <h3>Trail Tools</h3>
              <p>Interactive calculators for milestones, resupply, weather decisions, and more.</p>
              <span class="card-cta">Explore Tools →</span>
            </div>
            <div class="card-tape tape-alt"></div>
          </a>

          <!-- Journey Card -->
          <a href="/trips" class="c-card journey-card">
            <div class="card-pin"></div>
            <div class="card-inner">
              <span class="card-icon">🥾</span>
              <h3>The Journey</h3>
              <p>Training hikes, trip reports, and videos documenting the path to Springer.</p>
              <span class="card-cta">Follow Along →</span>
            </div>
            <div class="card-tape"></div>
          </a>
        </div>
      </section>

      <!-- Trail Stats -->
      <section class="c-stats">
        <div class="stats-inner">
          <div class="stat-item">
            <span class="stat-num">2,190</span>
            <span class="stat-label">Miles to Hike</span>
          </div>
          <div class="stat-divider">•</div>
          <div class="stat-item">
            <span class="stat-num">19</span>
            <span class="stat-label">Guide Chapters</span>
          </div>
          <div class="stat-divider">•</div>
          <div class="stat-item">
            <span class="stat-num">12</span>
            <span class="stat-label">Trail Tools</span>
          </div>
        </div>
      </section>

      <!-- Sign-off -->
      <section class="c-signoff">
        <div class="signoff-content">
          <p class="signoff-text">See you on Katahdin, Dad.</p>
          <div class="signoff-blaze"></div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="c-footer">
        <p>Made with love for the trail ahead.</p>
        <p class="footer-sub">Hogg Country © 2024</p>
      </footer>
    </div>
  {/if}
</div>

<style>
  /* ===== Switcher ===== */
  .prototype-viewer {
    min-height: 100vh;
  }

  .switcher {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
    padding: 0.75rem 1rem;
  }

  .switcher-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .switcher-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    font-weight: 600;
  }

  .switcher-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #444;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .switcher-btn:hover {
    border-color: #666;
    background: #222;
  }

  .switcher-btn.active {
    border-color: #f0e000;
    background: rgba(240, 224, 0, 0.1);
  }

  .btn-letter {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #333;
    border-radius: 4px;
    font-weight: 700;
    font-size: 0.8rem;
    color: #fff;
  }

  .switcher-btn.active .btn-letter {
    background: #f0e000;
    color: #1a1a1a;
  }

  .btn-name {
    font-weight: 600;
    color: #fff;
    font-size: 0.9rem;
  }

  .btn-desc {
    color: #666;
    font-size: 0.75rem;
  }

  @media (max-width: 700px) {
    .btn-desc {
      display: none;
    }
  }

  /* ===================================== */
  /* PROTOTYPE A: Trail Hub - Editorial    */
  /* ===================================== */
  .proto-a {
    padding-top: 70px;
    background: #f5f2e8;
    min-height: 100vh;
    position: relative;
  }

  .topo-overlay {
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20 Q 40 10, 60 20 T 100 20' fill='none' stroke='%23a6b58920' stroke-width='1'/%3E%3Cpath d='M0 40 Q 30 30, 50 40 T 100 40' fill='none' stroke='%23a6b58915' stroke-width='1'/%3E%3Cpath d='M10 60 Q 40 50, 70 60 T 100 60' fill='none' stroke='%23a6b58920' stroke-width='1'/%3E%3Cpath d='M0 80 Q 20 70, 40 80 T 100 80' fill='none' stroke='%23a6b58915' stroke-width='1'/%3E%3C/svg%3E");
    opacity: 0.5;
    pointer-events: none;
    z-index: 0;
  }

  .a-header {
    position: relative;
    z-index: 10;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(77, 89, 74, 0.1);
  }

  .a-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .a-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .logo-icon {
    font-size: 1.25rem;
    color: #4d594a;
  }

  .logo-text {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #2b2f26;
  }

  .a-nav {
    display: flex;
    gap: 2rem;
  }

  .nav-item {
    font-size: 0.85rem;
    color: #4d594a;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .nav-item:hover {
    color: #d97706;
  }

  .a-hero {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
  }

  .a-hero-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }

  .a-issue {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #d97706;
    display: block;
    margin-bottom: 1rem;
  }

  .a-headline {
    font-family: Oswald, sans-serif;
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 700;
    line-height: 1.05;
    color: #2b2f26;
    margin: 0 0 1.5rem;
  }

  .a-headline .accent {
    color: #4d594a;
    font-style: italic;
  }

  .a-subhead {
    font-size: 1.1rem;
    color: #666;
    line-height: 1.6;
    margin: 0 0 2rem;
    max-width: 480px;
  }

  .a-hero-actions {
    display: flex;
    gap: 1rem;
  }

  .a-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.875rem 1.75rem;
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    transition: all 0.2s;
  }

  .a-btn.primary {
    background: #4d594a;
    color: #fff;
  }

  .a-btn.primary:hover {
    background: #2b2f26;
  }

  .a-btn.secondary {
    background: transparent;
    color: #4d594a;
    border: 2px solid #4d594a;
  }

  .a-btn.secondary:hover {
    background: #4d594a;
    color: #fff;
  }

  .a-hero-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    transform: rotate(2deg);
    transition: transform 0.3s ease;
  }

  .a-hero-card:hover {
    transform: rotate(0deg) scale(1.02);
  }

  .card-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: #d97706;
    color: #fff;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    z-index: 1;
  }

  .card-image {
    position: relative;
    height: 200px;
    background: linear-gradient(135deg, #4d594a, #2b2f26);
  }

  .card-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #fff;
  }

  .card-placeholder span:first-child {
    font-size: 3rem;
  }

  .card-miles {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .card-content {
    padding: 1.5rem;
  }

  .card-tag {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #a6b589;
  }

  .card-content h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    color: #2b2f26;
    margin: 0.5rem 0;
  }

  .card-content p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }

  .a-content {
    position: relative;
    z-index: 1;
    padding: 3rem 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .a-section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2rem;
    border-bottom: 2px solid #2b2f26;
    padding-bottom: 0.75rem;
  }

  .a-section-header h2 {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2b2f26;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .see-all {
    font-size: 0.85rem;
    color: #d97706;
    text-decoration: none;
    font-weight: 500;
  }

  .a-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5rem;
  }

  .a-card {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.2s;
  }

  .a-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .a-card.large {
    grid-column: span 1;
  }

  .a-card-image {
    position: relative;
    height: 140px;
  }

  .placeholder-img {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
  }

  .gradient-1 { background: linear-gradient(135deg, #d97706, #92400e); }
  .gradient-2 { background: linear-gradient(135deg, #4d594a, #2b2f26); }
  .gradient-3 { background: linear-gradient(135deg, #a6b589, #4d594a); }

  .a-card-type {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .a-card-body {
    padding: 1.25rem;
  }

  .a-card-body time {
    font-size: 0.7rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .a-card-body h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    color: #2b2f26;
    margin: 0.5rem 0;
    line-height: 1.3;
  }

  .a-card-body p {
    font-size: 0.85rem;
    color: #666;
    margin: 0;
    line-height: 1.4;
  }

  .a-tools {
    position: relative;
    z-index: 1;
    background: #2b2f26;
    padding: 4rem 1.5rem;
    margin-top: 3rem;
  }

  .a-tools-inner {
    max-width: 1000px;
    margin: 0 auto;
    text-align: center;
  }

  .tools-badge {
    display: inline-block;
    background: rgba(166, 181, 137, 0.2);
    color: #a6b589;
    padding: 0.35rem 1rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    margin-bottom: 1rem;
  }

  .a-tools-header h2 {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    color: #fff;
    margin: 0 0 0.5rem;
  }

  .a-tools-header p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 1rem;
    margin: 0 0 2.5rem;
  }

  .a-tools-grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .a-tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.2s;
    min-width: 100px;
  }

  .a-tool:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #a6b589;
    transform: translateY(-2px);
  }

  .tool-icon {
    font-size: 1.75rem;
  }

  .tool-name {
    font-size: 0.8rem;
    color: #fff;
    font-weight: 500;
  }

  .a-tool.more {
    background: rgba(217, 119, 6, 0.2);
    border-color: rgba(217, 119, 6, 0.3);
  }

  .a-tool.more .tool-icon {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    color: #d97706;
  }

  .a-footer {
    position: relative;
    z-index: 1;
    padding: 3rem 1.5rem;
    text-align: center;
    border-top: 1px solid rgba(77, 89, 74, 0.1);
  }

  .a-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #4d594a;
    margin-bottom: 0.5rem;
  }

  .footer-tagline {
    font-family: Caveat, cursive;
    font-size: 1.25rem;
    color: #a6b589;
    margin: 0;
  }

  /* ===================================== */
  /* PROTOTYPE B: Adventure Dashboard      */
  /* ===================================== */
  .proto-b {
    padding-top: 70px;
    background: #0f1114;
    min-height: 100vh;
    color: #fff;
  }

  .b-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #222;
  }

  .b-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .b-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-mark {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #a6b589, #4d594a);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .logo-info {
    display: flex;
    flex-direction: column;
  }

  .logo-name {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .logo-sub {
    font-size: 0.65rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .b-nav {
    display: flex;
    gap: 0.5rem;
  }

  .b-nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #1a1d21;
    border-radius: 8px;
    text-decoration: none;
    color: #999;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .b-nav-item:hover {
    background: #222;
    color: #fff;
  }

  .nav-icon {
    font-size: 1rem;
  }

  .b-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: grid;
    gap: 1.5rem;
  }

  .b-mission {
    position: relative;
    background: linear-gradient(135deg, #1a1d21, #0f1114);
    border: 1px solid #2a2d32;
    border-radius: 16px;
    padding: 2rem;
    overflow: hidden;
  }

  .mission-glow {
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(166, 181, 137, 0.15), transparent 70%);
    pointer-events: none;
  }

  .mission-content {
    position: relative;
    z-index: 1;
  }

  .mission-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid rgba(166, 181, 137, 0.3);
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #a6b589;
    margin-bottom: 1rem;
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    background: #a6b589;
    border-radius: 50%;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .b-mission h1 {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
    letter-spacing: 0.05em;
  }

  .mission-details {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .detail {
    display: flex;
    flex-direction: column;
  }

  .detail-value {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
  }

  .detail-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .detail-divider {
    width: 1px;
    height: 40px;
    background: #333;
  }

  .mission-progress {
    max-width: 400px;
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #999;
    margin-bottom: 0.5rem;
  }

  .progress-bar {
    height: 8px;
    background: #222;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4d594a, #a6b589);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .b-quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .b-quick-card {
    background: #1a1d21;
    border: 1px solid #2a2d32;
    border-radius: 12px;
    padding: 1.5rem;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .b-quick-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .b-quick-card:hover {
    border-color: #444;
    transform: translateY(-2px);
  }

  .b-quick-card:hover::before {
    opacity: 1;
  }

  .b-quick-card.guide::before { background: #a6b589; }
  .b-quick-card.tools::before { background: #d97706; }
  .b-quick-card.videos::before { background: #ef4444; }
  .b-quick-card.trips::before { background: #3b82f6; }

  .quick-icon {
    font-size: 2rem;
  }

  .quick-content h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    color: #fff;
    margin: 0;
  }

  .quick-content p {
    font-size: 0.8rem;
    color: #666;
    margin: 0.25rem 0 0;
  }

  .quick-arrow {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    font-size: 1.25rem;
    color: #444;
    transition: all 0.2s;
  }

  .b-quick-card:hover .quick-arrow {
    color: #fff;
    transform: translateX(4px);
  }

  .b-tools-strip {
    background: #1a1d21;
    border: 1px solid #2a2d32;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .strip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .strip-header h2 {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .strip-link {
    font-size: 0.8rem;
    color: #a6b589;
    text-decoration: none;
  }

  .tools-scroll {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .b-tool-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: #0f1114;
    border: 1px solid #333;
    border-radius: 20px;
    color: #999;
    font-size: 0.8rem;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
  }

  .b-tool-chip:hover {
    border-color: #a6b589;
    color: #fff;
    background: rgba(166, 181, 137, 0.1);
  }

  .b-feed {
    background: #1a1d21;
    border: 1px solid #2a2d32;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .b-feed h2 {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 1rem;
  }

  .feed-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .feed-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: #0f1114;
    border-radius: 8px;
  }

  .feed-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 1rem;
  }

  .feed-icon.video { background: rgba(239, 68, 68, 0.15); }
  .feed-icon.guide { background: rgba(166, 181, 137, 0.15); }
  .feed-icon.trip { background: rgba(59, 130, 246, 0.15); }

  .feed-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .feed-title {
    font-size: 0.85rem;
    color: #fff;
  }

  .feed-desc {
    font-size: 0.75rem;
    color: #666;
  }

  .feed-time {
    font-size: 0.7rem;
    color: #444;
  }

  .b-footer {
    text-align: center;
    padding: 2rem;
    border-top: 1px solid #222;
    margin-top: 2rem;
  }

  .footer-text {
    font-size: 0.75rem;
    color: #444;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* ===================================== */
  /* PROTOTYPE C: Trailhead Welcome        */
  /* ===================================== */
  .proto-c {
    padding-top: 70px;
    background: #f5f2e8;
    min-height: 100vh;
    position: relative;
  }

  .paper-texture {
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
    z-index: 0;
  }

  .c-header {
    position: relative;
    z-index: 10;
    padding: 1.5rem 2rem;
  }

  .c-header-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .c-logo {
    text-decoration: none;
  }

  .logo-script {
    font-family: Caveat, cursive;
    font-size: 1.75rem;
    color: #4d594a;
  }

  .c-nav {
    display: flex;
    gap: 2rem;
  }

  .c-nav a {
    font-size: 0.9rem;
    color: #666;
    text-decoration: none;
    transition: color 0.2s;
  }

  .c-nav a:hover {
    color: #4d594a;
  }

  .c-hero {
    position: relative;
    z-index: 1;
    padding: 4rem 2rem 5rem;
    text-align: center;
  }

  .c-hero-content {
    max-width: 600px;
    margin: 0 auto;
  }

  .hero-stamp {
    display: inline-block;
    border: 2px solid #d97706;
    color: #d97706;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    margin-bottom: 2rem;
    transform: rotate(-3deg);
  }

  .c-headline {
    font-family: Oswald, sans-serif;
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 700;
    line-height: 1.1;
    color: #2b2f26;
    margin: 0 0 1.5rem;
  }

  .c-headline .line-1 {
    display: block;
    font-size: 0.5em;
    color: #666;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .c-headline .line-2 {
    display: block;
  }

  .c-intro {
    font-size: 1.15rem;
    color: #666;
    line-height: 1.7;
    margin: 0 0 2.5rem;
  }

  .c-hiker-card {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    background: #fff;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 2px solid #e8e5dc;
  }

  .hiker-photo {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #a6b589, #4d594a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
  }

  .hiker-info {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .hiker-label {
    font-size: 0.65rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .hiker-name {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2b2f26;
    letter-spacing: 0.05em;
  }

  .hiker-mission {
    font-size: 0.8rem;
    color: #a6b589;
    font-weight: 500;
  }

  .c-hero-deco {
    position: absolute;
    top: 50%;
    right: 5%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .blaze {
    width: 16px;
    height: 28px;
    background: #f0e000;
    border-radius: 3px;
    opacity: 0.8;
  }

  .blaze-1 { transform: rotate(-5deg); }
  .blaze-2 { transform: rotate(3deg); opacity: 0.6; }
  .blaze-3 { transform: rotate(-2deg); opacity: 0.4; }

  .c-story {
    position: relative;
    z-index: 1;
    padding: 3rem 2rem;
    background: linear-gradient(180deg, transparent, rgba(166, 181, 137, 0.08));
  }

  .story-inner {
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
  }

  .c-quote {
    font-family: Caveat, cursive;
    font-size: 1.5rem;
    color: #4d594a;
    line-height: 1.5;
    margin: 0 0 1rem;
    font-style: normal;
  }

  .c-cite {
    font-size: 0.85rem;
    color: #999;
    font-style: normal;
  }

  .c-content {
    position: relative;
    z-index: 1;
    padding: 3rem 2rem 4rem;
  }

  .c-cards {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .c-card {
    position: relative;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    text-decoration: none;
    transition: all 0.3s;
    transform: rotate(-1deg);
  }

  .c-card:nth-child(2) {
    transform: rotate(1deg);
  }

  .c-card:nth-child(3) {
    transform: rotate(-0.5deg);
  }

  .c-card:hover {
    transform: rotate(0deg) translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }

  .card-pin {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    background: #d97706;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 2;
  }

  .card-tape {
    position: absolute;
    top: -12px;
    right: 20px;
    width: 60px;
    height: 24px;
    background: rgba(240, 224, 0, 0.6);
    transform: rotate(15deg);
  }

  .card-tape.tape-alt {
    right: auto;
    left: 20px;
    transform: rotate(-10deg);
  }

  .card-inner {
    padding: 2.5rem 1.5rem 2rem;
    text-align: center;
  }

  .card-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 1rem;
  }

  .card-inner h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    color: #2b2f26;
    margin: 0 0 0.75rem;
  }

  .card-inner p {
    font-size: 0.9rem;
    color: #666;
    line-height: 1.5;
    margin: 0 0 1.25rem;
  }

  .card-cta {
    font-size: 0.85rem;
    color: #4d594a;
    font-weight: 600;
  }

  .c-card:hover .card-cta {
    color: #d97706;
  }

  .c-stats {
    position: relative;
    z-index: 1;
    padding: 2rem;
    border-top: 1px dashed #d4d0c4;
    border-bottom: 1px dashed #d4d0c4;
  }

  .stats-inner {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat-item {
    text-align: center;
  }

  .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: #4d594a;
    display: block;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .stat-divider {
    color: #d4d0c4;
    font-size: 1.5rem;
  }

  .c-signoff {
    position: relative;
    z-index: 1;
    padding: 4rem 2rem;
    text-align: center;
  }

  .signoff-content {
    max-width: 400px;
    margin: 0 auto;
  }

  .signoff-text {
    font-family: Caveat, cursive;
    font-size: 2rem;
    color: #4d594a;
    margin: 0 0 1.5rem;
  }

  .signoff-blaze {
    width: 20px;
    height: 36px;
    background: #f0e000;
    border-radius: 4px;
    margin: 0 auto;
    transform: rotate(-5deg);
  }

  .c-footer {
    position: relative;
    z-index: 1;
    padding: 2rem;
    text-align: center;
    background: #2b2f26;
    color: #a6b589;
  }

  .c-footer p {
    margin: 0;
    font-size: 0.9rem;
  }

  .footer-sub {
    font-size: 0.75rem !important;
    color: #666 !important;
    margin-top: 0.5rem !important;
  }

  /* ===== Responsive ===== */
  @media (max-width: 900px) {
    .a-hero-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .a-hero-card {
      max-width: 400px;
      margin: 0 auto;
    }

    .a-grid {
      grid-template-columns: 1fr;
    }

    .a-card.large {
      grid-column: span 1;
    }

    .b-quick-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .c-cards {
      grid-template-columns: 1fr;
      max-width: 400px;
    }

    .c-card {
      transform: none !important;
    }

    .c-hero-deco {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .a-nav {
      display: none;
    }

    .a-hero {
      padding: 2rem 1rem;
    }

    .a-hero-actions {
      flex-direction: column;
    }

    .b-nav {
      display: none;
    }

    .b-quick-grid {
      grid-template-columns: 1fr;
    }

    .mission-details {
      gap: 1rem;
    }

    .detail-value {
      font-size: 1.5rem;
    }

    .c-nav {
      display: none;
    }

    .stats-inner {
      gap: 1rem;
    }

    .stat-divider {
      display: none;
    }
  }
</style>
