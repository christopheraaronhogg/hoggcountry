<script lang="ts">
  // Trail Hub - Magazine Editorial Homepage
  // A sophisticated, content-first design inspired by Outside Magazine and NYT Outdoors
  // The story of Jimmy "HoggCountry" Hogg's AT thru-hike, supported by his son Chris
</script>

<div class="trail-hub">
  <!-- ========================================== -->
  <!-- HEADER                                      -->
  <!-- ========================================== -->
  <header class="hub-header">
    <div class="header-inner">
      <a href="/" class="logo-link">
        <span class="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 22h20L12 2z"/>
            <path d="M12 8v6"/>
          </svg>
        </span>
        <span class="logo-text">HOGG COUNTRY</span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="/guide" class="nav-link">Field Guide</a>
        <a href="/tools" class="nav-link">Tools</a>
        <a href="/trips" class="nav-link">Trips</a>
        <a href="/videos" class="nav-link">Videos</a>
      </nav>
      <button class="mobile-menu-btn" aria-label="Open menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- ========================================== -->
  <!-- HERO: AT 2026 Mission                       -->
  <!-- ========================================== -->
  <section class="hero-section">
    <div class="hero-grid">
      <div class="hero-content">
        <div class="edition-badge">
          <span class="badge-year">2026</span>
          <span class="badge-divider"></span>
          <span class="badge-label">Appalachian Trail</span>
        </div>

        <h1 class="hero-headline">
          <span class="headline-pre">A Father's Journey.</span>
          <span class="headline-main">2,194 Miles.</span>
          <span class="headline-accent">Springer to Katahdin.</span>
        </h1>

        <p class="hero-subhead">
          Follow Jimmy "HoggCountry" Hogg's February 2026 NOBO thru-hike of the Appalachian Trail.
          840+ miles of completed thru-hikes. The 6th person in history to receive the Ozark Society's Sassafras Award.
          Now, at 62, he takes on the big one.
        </p>

        <div class="hero-stats">
          <div class="stat">
            <span class="stat-value">840+</span>
            <span class="stat-label">Miles Hiked</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">3</span>
            <span class="stat-label">Thru-Hikes</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">6th</span>
            <span class="stat-label">Sassafras Award</span>
          </div>
        </div>

        <div class="hero-actions">
          <a href="/guide" class="btn-primary">
            <span>Read the Field Guide</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href="/about" class="btn-secondary">Meet HoggCountry</a>
        </div>
      </div>

      <div class="hero-visual">
        <div class="feature-card">
          <div class="card-image">
            <div class="image-placeholder">
              <div class="topo-lines" aria-hidden="true">
                <svg viewBox="0 0 200 150" preserveAspectRatio="none">
                  <path d="M0 120 Q50 80 100 100 T200 90" fill="none" stroke="currentColor" stroke-width="1"/>
                  <path d="M0 100 Q60 60 120 80 T200 70" fill="none" stroke="currentColor" stroke-width="1"/>
                  <path d="M0 80 Q40 50 90 60 T200 50" fill="none" stroke="currentColor" stroke-width="1"/>
                  <path d="M0 60 Q50 30 100 40 T200 35" fill="none" stroke="currentColor" stroke-width="1"/>
                  <path d="M0 40 Q45 15 95 25 T200 20" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
              </div>
              <div class="summit-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L4 44h40L24 4z" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M24 14v12" stroke="currentColor" stroke-width="2"/>
                  <circle cx="24" cy="32" r="2" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <span class="card-label">NOBO 2026</span>
          </div>
          <div class="card-body">
            <span class="card-tag">The Journey Begins</span>
            <h3>Springer Mountain, Georgia</h3>
            <p class="card-date">February 2026</p>
          </div>
        </div>

        <div class="blaze-markers" aria-hidden="true">
          <span class="blaze"></span>
          <span class="blaze"></span>
          <span class="blaze"></span>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- FROM THE TRAIL: Latest Content              -->
  <!-- ========================================== -->
  <section class="trail-updates">
    <div class="section-container">
      <header class="section-header">
        <div class="header-content">
          <span class="section-label">From the Trail</span>
          <h2 class="section-title">Latest Updates</h2>
        </div>
        <a href="/trips" class="view-all-link">
          View All
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </header>

      <div class="updates-grid">
        <!-- Featured Video Card -->
        <article class="update-card featured">
          <a href="/videos" class="card-link">
            <div class="card-media">
              <div class="media-placeholder video">
                <svg viewBox="0 0 48 48" fill="currentColor">
                  <path d="M20 14v20l14-10-14-10z"/>
                </svg>
              </div>
              <span class="media-badge video">Video</span>
              <span class="media-duration">12:34</span>
            </div>
            <div class="card-content">
              <time class="card-date" datetime="2025-12-15">December 2025</time>
              <h3 class="card-title">Final Gear Shakedown: Jimmy's Sub-20 Pound Kit</h3>
              <p class="card-excerpt">After 840+ miles of training and three thru-hikes, here's the complete kit heading to Springer Mountain.</p>
              <span class="card-cta">Watch Now</span>
            </div>
          </a>
        </article>

        <!-- Trip Report Card -->
        <article class="update-card">
          <a href="/trips" class="card-link">
            <div class="card-media">
              <div class="media-placeholder trip">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 44l10-18 8 12 6-8 16 14"/>
                </svg>
              </div>
              <span class="media-badge trip">Trip Report</span>
            </div>
            <div class="card-content">
              <time class="card-date" datetime="2025-11-28">November 2025</time>
              <h3 class="card-title">Ozark Highland Trail: 50-Mile Winter Test</h3>
              <p class="card-excerpt">Cold-weather training on familiar terrain before the big send.</p>
              <span class="card-cta">Read Report</span>
            </div>
          </a>
        </article>

        <!-- Blog Post Card -->
        <article class="update-card">
          <a href="/blog" class="card-link">
            <div class="card-media">
              <div class="media-placeholder post">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="8" y="6" width="32" height="36" rx="2"/>
                  <line x1="14" y1="14" x2="34" y2="14"/>
                  <line x1="14" y1="22" x2="34" y2="22"/>
                  <line x1="14" y1="30" x2="26" y2="30"/>
                </svg>
              </div>
              <span class="media-badge post">Blog</span>
            </div>
            <div class="card-content">
              <time class="card-date" datetime="2025-11-10">November 2025</time>
              <h3 class="card-title">The Mental Game: 5 Months on Trail at 62</h3>
              <p class="card-excerpt">It's not just physical. Here's how Jimmy is training his mind for the long haul.</p>
              <span class="card-cta">Read Article</span>
            </div>
          </a>
        </article>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- TRAIL RESUME: Jimmy's Stats                 -->
  <!-- ========================================== -->
  <section class="credentials-section">
    <div class="credentials-bar">
      <div class="credential-item">
        <span class="cred-number">840+</span>
        <span class="cred-label">Miles Completed</span>
      </div>
      <div class="credential-divider"></div>
      <div class="credential-item">
        <span class="cred-number">3</span>
        <span class="cred-label">Thru-Hikes</span>
      </div>
      <div class="credential-divider"></div>
      <div class="credential-item featured">
        <span class="cred-number">6th</span>
        <span class="cred-label">Sassafras Award Recipient</span>
      </div>
      <div class="credential-divider"></div>
      <div class="credential-item">
        <span class="cred-number">49</span>
        <span class="cred-label">AT Miles Previewed</span>
      </div>
      <div class="credential-divider"></div>
      <div class="credential-item">
        <span class="cred-number">62</span>
        <span class="cred-label">Years Young</span>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- THE MISSION: AT 2026 Plan                   -->
  <!-- ========================================== -->
  <section class="mission-section">
    <div class="section-container">
      <header class="mission-header">
        <span class="section-label">The Mission</span>
        <h2 class="section-title">AT NOBO 2026</h2>
      </header>

      <div class="mission-grid">
        <div class="mission-card timeline">
          <h3>The Timeline</h3>
          <ul class="timeline-list">
            <li>
              <span class="timeline-date">February 2026</span>
              <span class="timeline-event">Springer Mountain Start</span>
            </li>
            <li>
              <span class="timeline-date">Early Phase</span>
              <span class="timeline-event">8-9 miles per day, building base</span>
            </li>
            <li>
              <span class="timeline-date">Summer</span>
              <span class="timeline-event">13-14 miles per day cruising speed</span>
            </li>
            <li>
              <span class="timeline-date">Sept 17-20</span>
              <span class="timeline-event">Katahdin Summit Target</span>
            </li>
          </ul>
        </div>

        <div class="mission-card strategy">
          <h3>The Strategy</h3>
          <p class="strategy-highlight">5-Day Rule</p>
          <p class="strategy-desc">
            Never more than 5 consecutive hiking days without a zero or nero day.
            This sustainable pace protects against injury and burnout over 5+ months on trail.
          </p>
          <div class="strategy-stats">
            <div class="strategy-stat">
              <span class="stat-num">2,194</span>
              <span class="stat-text">Total Miles</span>
            </div>
            <div class="strategy-stat">
              <span class="stat-num">14</span>
              <span class="stat-text">States</span>
            </div>
          </div>
        </div>

        <div class="mission-card story">
          <h3>A Father-Son Story</h3>
          <p class="story-text">
            This site was built by Chris Hogg as a gift for his dad Jimmy.
            A comprehensive 20-chapter field guide, 12 interactive planning tools,
            and a place to document every mile of the journey ahead.
          </p>
          <p class="story-signature">
            Built with love by Chris. Hiked with grit by Jimmy.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- FIELD GUIDE: 20 Chapter Guide               -->
  <!-- ========================================== -->
  <section class="field-guide-section">
    <div class="guide-inner">
      <div class="guide-content">
        <span class="guide-badge">20 Chapters</span>
        <h2 class="guide-title">The Complete AT Field Guide</h2>
        <p class="guide-description">
          Everything a thru-hiker needs to know, organized into 20 comprehensive chapters.
          From gear selection to resupply strategy, weather patterns to trail culture.
          Written by Chris and tested across Jimmy's 840+ miles of training.
        </p>

        <div class="guide-chapters">
          <div class="chapter-row">
            <span class="chapter-item">Getting Started</span>
            <span class="chapter-item">Trail Sections</span>
            <span class="chapter-item">Gear Systems</span>
            <span class="chapter-item">Footwear</span>
          </div>
          <div class="chapter-row">
            <span class="chapter-item">Shelter</span>
            <span class="chapter-item">Sleep Systems</span>
            <span class="chapter-item">Clothing</span>
            <span class="chapter-item">Food & Nutrition</span>
          </div>
          <div class="chapter-row">
            <span class="chapter-item">Water</span>
            <span class="chapter-item">Navigation</span>
            <span class="chapter-item">Weather</span>
            <span class="chapter-item">Resupply</span>
          </div>
        </div>

        <div class="guide-actions">
          <a href="/guide" class="guide-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
            Start Reading
          </a>
          <a href="/guide/quick-reference" class="guide-btn-secondary">5 Quick Reference Cards</a>
        </div>
      </div>

      <div class="guide-visual">
        <div class="guide-preview">
          <div class="preview-stack">
            <div class="preview-page page-3"></div>
            <div class="preview-page page-2"></div>
            <div class="preview-page page-1">
              <div class="page-content">
                <span class="page-chapter">Chapter 01</span>
                <span class="page-title">Getting Started</span>
                <div class="page-divider"></div>
                <span class="page-subtitle">Your AT Journey Begins Here</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- HIKER TOOLS: 12 Interactive Tools           -->
  <!-- ========================================== -->
  <section class="tools-section">
    <div class="section-container">
      <header class="tools-header">
        <div class="tools-header-content">
          <span class="tools-label">Interactive Planning</span>
          <h2 class="tools-title">Hiker Tools</h2>
          <p class="tools-subtitle">12 purpose-built calculators and planners to dial in every aspect of the thru-hike.</p>
        </div>
      </header>

      <div class="tools-grid">
        <a href="/tools#milestone" class="tool-card">
          <div class="tool-icon milestone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 00-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 00-8-8z"/>
            </svg>
          </div>
          <span class="tool-name">Milestone Calculator</span>
          <span class="tool-desc">Track daily progress</span>
        </a>

        <a href="/tools#resupply" class="tool-card">
          <div class="tool-icon resupply">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span class="tool-name">Resupply Planner</span>
          <span class="tool-desc">Plan town stops</span>
        </a>

        <a href="/tools#weather" class="tool-card">
          <div class="tool-icon weather">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </div>
          <span class="tool-name">Weather Assessor</span>
          <span class="tool-desc">Evaluate conditions</span>
        </a>

        <a href="/tools#budget" class="tool-card">
          <div class="tool-icon budget">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <span class="tool-name">Budget Calculator</span>
          <span class="tool-desc">Estimate total cost</span>
        </a>

        <a href="/tools#pack" class="tool-card">
          <div class="tool-icon pack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="18" rx="2"/>
              <path d="M8 2v4M16 2v4"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <span class="tool-name">Pack Builder</span>
          <span class="tool-desc">Optimize base weight</span>
        </a>

        <a href="/tools#food" class="tool-card">
          <div class="tool-icon food">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8h1a4 4 0 010 8h-1"/>
              <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <span class="tool-name">Food Calculator</span>
          <span class="tool-desc">Plan daily calories</span>
        </a>

        <a href="/tools#water" class="tool-card">
          <div class="tool-icon water">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
            </svg>
          </div>
          <span class="tool-name">Water Tracker</span>
          <span class="tool-desc">Source management</span>
        </a>

        <a href="/tools#layers" class="tool-card">
          <div class="tool-icon layers">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="tool-name">Layering Advisor</span>
          <span class="tool-desc">Dial in clothing</span>
        </a>

        <a href="/tools#shelter" class="tool-card">
          <div class="tool-icon shelter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 18l9-9 9 9"/>
              <path d="M5 21h14"/>
            </svg>
          </div>
          <span class="tool-name">Shelter Decider</span>
          <span class="tool-desc">Tent vs hammock</span>
        </a>

        <a href="/tools#power" class="tool-card">
          <div class="tool-icon power">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span class="tool-name">Power Manager</span>
          <span class="tool-desc">Electronics strategy</span>
        </a>

        <a href="/tools#maildrop" class="tool-card">
          <div class="tool-icon maildrop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
            </svg>
          </div>
          <span class="tool-name">Mail Drop Planner</span>
          <span class="tool-desc">Ship-ahead logistics</span>
        </a>

        <a href="/tools#training" class="tool-card">
          <div class="tool-icon training">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span class="tool-name">Training Planner</span>
          <span class="tool-desc">Build fitness</span>
        </a>
      </div>

      <div class="tools-footer">
        <a href="/tools" class="tools-cta">
          Open All Tools
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- FOOTER                                      -->
  <!-- ========================================== -->
  <footer class="hub-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 22h20L12 2z"/>
          </svg>
          HOGG COUNTRY
        </span>
        <p class="footer-tagline">See you on Katahdin, Dad.</p>
      </div>

      <nav class="footer-nav">
        <a href="/guide">Field Guide</a>
        <a href="/tools">Tools</a>
        <a href="/trips">Trips</a>
        <a href="/videos">Videos</a>
        <a href="/about">About</a>
      </nav>

      <div class="footer-blaze" aria-hidden="true">
        <span class="blaze-mark"></span>
      </div>
    </div>

    <div class="footer-bottom">
      <p class="copyright">Built by Chris for Jimmy. Hogg Country 2024-2026.</p>
    </div>
  </footer>
</div>

<style>
  /* ============================================ */
  /* BASE & RESET                                  */
  /* ============================================ */
  .trail-hub {
    --pine: #4d594a;
    --alpine: #a6b589;
    --terra: #d97706;
    --marker: #f0e000;
    --bg: #f5f2e8;
    --ink: #2b2f26;
    --muted: #5c665a;
    --stone: #cccccc;
    --card: #ffffff;
    --border: #e6e1d4;

    min-height: 100vh;
    background: transparent;
    color: var(--ink);
    font-family: system-ui, -apple-system, sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* ============================================ */
  /* HEADER                                        */
  /* ============================================ */
  .hub-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(245, 242, 232, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.875rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-link {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    text-decoration: none;
    transition: opacity 0.2s ease;
  }

  .logo-link:hover {
    opacity: 0.8;
  }

  .logo-mark {
    width: 28px;
    height: 28px;
    color: var(--pine);
  }

  .logo-mark svg {
    width: 100%;
    height: 100%;
  }

  .logo-text {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.12em;
    color: var(--ink);
  }

  .main-nav {
    display: flex;
    gap: 2.5rem;
  }

  .nav-link {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--muted);
    text-decoration: none;
    padding: 0.375rem 0;
    position: relative;
    transition: color 0.2s ease;
  }

  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--terra);
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }

  .nav-link:hover {
    color: var(--ink);
  }

  .nav-link:hover::after {
    transform: scaleX(1);
  }

  .mobile-menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    padding: 8px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    color: var(--pine);
    transition: all 0.2s ease;
  }

  .mobile-menu-btn:hover {
    background: var(--card);
  }

  .mobile-menu-btn svg {
    width: 100%;
    height: 100%;
  }

  /* ============================================ */
  /* HERO SECTION                                  */
  /* ============================================ */
  .hero-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem 5rem;
  }

  .hero-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 4rem;
    align-items: center;
  }

  .edition-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .badge-year {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--card);
    background: var(--terra);
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
  }

  .badge-divider {
    width: 24px;
    height: 2px;
    background: var(--stone);
  }

  .badge-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .hero-headline {
    margin: 0 0 1.5rem;
    line-height: 1;
  }

  .headline-pre {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: clamp(1.125rem, 2vw, 1.375rem);
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .headline-main {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: clamp(3rem, 6vw, 4.5rem);
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin-bottom: 0.25rem;
  }

  .headline-accent {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--pine);
    font-style: italic;
  }

  .hero-subhead {
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--muted);
    max-width: 520px;
    margin: 0 0 2rem;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 1.75rem;
    margin-bottom: 2.5rem;
    padding: 1.25rem 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .stat-divider {
    width: 1px;
    height: 36px;
    background: var(--border);
  }

  .hero-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.9375rem 1.5rem;
    background: var(--pine);
    color: var(--card);
    font-family: Oswald, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    background: var(--ink);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(43, 47, 38, 0.2);
  }

  .btn-primary svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }

  .btn-primary:hover svg {
    transform: translateX(3px);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    padding: 0.9375rem 1.5rem;
    background: transparent;
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
    border: 2px solid var(--pine);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: var(--pine);
    color: var(--card);
  }

  /* Hero Visual */
  .hero-visual {
    position: relative;
  }

  .feature-card {
    background: var(--card);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(43, 47, 38, 0.12);
    transform: rotate(2deg);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
  }

  .feature-card:hover {
    transform: rotate(0deg) translateY(-8px);
    box-shadow: 0 24px 64px rgba(43, 47, 38, 0.18);
  }

  .card-image {
    position: relative;
    height: 220px;
    background: linear-gradient(145deg, var(--pine), var(--ink));
    overflow: hidden;
  }

  .image-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .topo-lines {
    position: absolute;
    inset: 0;
    color: rgba(166, 181, 137, 0.3);
  }

  .topo-lines svg {
    width: 100%;
    height: 100%;
  }

  .summit-icon {
    width: 64px;
    height: 64px;
    color: rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 1;
  }

  .summit-icon svg {
    width: 100%;
    height: 100%;
  }

  .card-label {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--terra);
    color: var(--card);
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.12em;
  }

  .card-body {
    padding: 1.5rem;
  }

  .card-tag {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--alpine);
    display: block;
    margin-bottom: 0.5rem;
  }

  .card-body h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.375rem;
  }

  .card-date {
    font-size: 0.875rem;
    color: var(--muted);
  }

  .blaze-markers {
    position: absolute;
    top: 50%;
    right: -3rem;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .blaze {
    width: 14px;
    height: 24px;
    background: var(--marker);
    border-radius: 3px;
    opacity: 0.9;
    box-shadow: 0 2px 8px rgba(240, 224, 0, 0.3);
  }

  .blaze:nth-child(1) {
    transform: rotate(-4deg);
  }

  .blaze:nth-child(2) {
    transform: rotate(2deg);
    opacity: 0.7;
  }

  .blaze:nth-child(3) {
    transform: rotate(-1deg);
    opacity: 0.5;
  }

  /* ============================================ */
  /* CREDENTIALS BAR                               */
  /* ============================================ */
  .credentials-section {
    position: relative;
    z-index: 1;
    padding: 2.5rem 1.5rem;
    background: var(--pine);
  }

  .credentials-bar {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .credential-item {
    text-align: center;
    padding: 0 1rem;
  }

  .credential-item.featured .cred-number {
    color: var(--marker);
  }

  .cred-number {
    font-family: Oswald, sans-serif;
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 700;
    color: var(--card);
    display: block;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .cred-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .credential-divider {
    width: 1px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    .credentials-bar {
      gap: 1.5rem;
    }

    .credential-divider {
      display: none;
    }

    .credential-item {
      flex: 1 1 calc(33% - 1rem);
      min-width: 100px;
    }
  }

  @media (max-width: 480px) {
    .credential-item {
      flex: 1 1 calc(50% - 1rem);
    }
  }

  /* ============================================ */
  /* FROM THE TRAIL SECTION                        */
  /* ============================================ */
  .trail-updates {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
    background: linear-gradient(180deg, transparent 0%, rgba(166, 181, 137, 0.06) 100%);
  }

  .section-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 2px solid var(--ink);
  }

  .section-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--terra);
    display: block;
    margin-bottom: 0.5rem;
  }

  .section-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .view-all-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--terra);
    text-decoration: none;
    transition: gap 0.2s ease;
  }

  .view-all-link:hover {
    gap: 0.75rem;
  }

  .view-all-link svg {
    width: 16px;
    height: 16px;
  }

  .updates-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5rem;
  }

  .update-card {
    background: var(--card);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(43, 47, 38, 0.06);
    transition: all 0.25s ease;
  }

  .update-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(43, 47, 38, 0.12);
  }

  .card-link {
    text-decoration: none;
    display: block;
  }

  .card-media {
    position: relative;
    height: 160px;
  }

  .media-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .media-placeholder.video {
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    color: rgba(255, 255, 255, 0.9);
  }

  .media-placeholder.video svg {
    width: 48px;
    height: 48px;
    opacity: 0.9;
  }

  .media-placeholder.trip {
    background: linear-gradient(135deg, var(--pine) 0%, var(--ink) 100%);
    color: rgba(166, 181, 137, 0.7);
  }

  .media-placeholder.trip svg {
    width: 56px;
    height: 56px;
  }

  .media-placeholder.post {
    background: linear-gradient(135deg, var(--alpine) 0%, var(--pine) 100%);
    color: rgba(255, 255, 255, 0.7);
  }

  .media-placeholder.post svg {
    width: 48px;
    height: 48px;
  }

  .media-badge {
    position: absolute;
    top: 0.875rem;
    left: 0.875rem;
    padding: 0.3125rem 0.625rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .media-badge.video {
    background: rgba(255, 255, 255, 0.95);
    color: #b91c1c;
  }

  .media-badge.trip {
    background: rgba(255, 255, 255, 0.95);
    color: var(--pine);
  }

  .media-badge.post {
    background: rgba(255, 255, 255, 0.95);
    color: var(--pine);
  }

  .media-duration {
    position: absolute;
    bottom: 0.875rem;
    right: 0.875rem;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .card-content {
    padding: 1.25rem;
  }

  .card-content .card-date {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    display: block;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-family: Oswald, sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.5rem;
    line-height: 1.3;
  }

  .card-excerpt {
    font-size: 0.875rem;
    color: var(--muted);
    line-height: 1.55;
    margin: 0 0 1rem;
  }

  .card-cta {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--terra);
    transition: color 0.2s ease;
  }

  .update-card:hover .card-cta {
    color: var(--pine);
  }

  /* ============================================ */
  /* MISSION SECTION                               */
  /* ============================================ */
  .mission-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
  }

  .mission-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .mission-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .mission-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
  }

  .mission-card h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 1.25rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .timeline-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .timeline-list li {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
  }

  .timeline-list li:last-child {
    border-bottom: none;
  }

  .timeline-date {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--terra);
    margin-bottom: 0.25rem;
  }

  .timeline-event {
    font-size: 0.9375rem;
    color: var(--ink);
  }

  .strategy-highlight {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--pine);
    margin: 0 0 0.75rem;
  }

  .strategy-desc {
    font-size: 0.9375rem;
    color: var(--muted);
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .strategy-stats {
    display: flex;
    gap: 2rem;
  }

  .strategy-stat {
    display: flex;
    flex-direction: column;
  }

  .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-text {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .story-text {
    font-size: 0.9375rem;
    color: var(--muted);
    line-height: 1.7;
    margin: 0 0 1.5rem;
  }

  .story-signature {
    font-family: Caveat, cursive;
    font-size: 1.375rem;
    color: var(--pine);
    margin: 0;
    font-style: italic;
  }

  /* ============================================ */
  /* FIELD GUIDE SECTION                           */
  /* ============================================ */
  .field-guide-section {
    position: relative;
    z-index: 1;
    background: var(--ink);
    padding: 5rem 1.5rem;
  }

  .field-guide-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23a6b589' stroke-width='0.5' opacity='0.08'%3E%3Cpath d='M0 50 Q100 30 200 50 T400 45'/%3E%3Cpath d='M0 100 Q80 70 180 90 T400 95'/%3E%3Cpath d='M0 150 Q120 120 220 140 T400 145'/%3E%3Cpath d='M0 200 Q90 170 190 190 T400 195'/%3E%3Cpath d='M0 250 Q110 220 210 240 T400 245'/%3E%3Cpath d='M0 300 Q70 270 170 290 T400 295'/%3E%3Cpath d='M0 350 Q130 320 230 340 T400 345'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 400px 400px;
    opacity: 1;
    pointer-events: none;
  }

  .guide-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 4rem;
    align-items: center;
    position: relative;
  }

  .guide-badge {
    display: inline-block;
    background: rgba(166, 181, 137, 0.2);
    color: var(--alpine);
    padding: 0.4375rem 1rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 1.25rem;
  }

  .guide-title {
    font-family: Oswald, sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    color: var(--card);
    margin: 0 0 1.25rem;
    line-height: 1.1;
  }

  .guide-description {
    font-size: 1.0625rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 2rem;
  }

  .guide-chapters {
    margin-bottom: 2.5rem;
  }

  .chapter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    margin-bottom: 0.625rem;
  }

  .chapter-item {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.5);
    padding: 0.375rem 0.875rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    transition: all 0.2s ease;
  }

  .chapter-item:hover {
    color: var(--alpine);
    border-color: var(--alpine);
  }

  .guide-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .guide-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 1rem 1.75rem;
    background: var(--alpine);
    color: var(--ink);
    font-family: Oswald, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .guide-btn-primary:hover {
    background: var(--card);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .guide-btn-primary svg {
    width: 18px;
    height: 18px;
  }

  .guide-btn-secondary {
    display: inline-flex;
    align-items: center;
    padding: 1rem 1.75rem;
    background: transparent;
    color: var(--card);
    font-family: Oswald, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .guide-btn-secondary:hover {
    border-color: var(--card);
    background: rgba(255, 255, 255, 0.1);
  }

  /* Guide Visual */
  .guide-visual {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-left: 40px; /* Space for left-offset stacked pages */
  }

  .guide-preview {
    perspective: 1000px;
  }

  .preview-stack {
    position: relative;
    width: 280px;
    height: 360px;
    transform-style: preserve-3d;
  }

  .preview-page {
    position: absolute;
    width: 100%;
    height: 100%;
    background: var(--card);
    border-radius: 4px 12px 12px 4px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transition: transform 0.4s ease;
  }

  .preview-page.page-3 {
    transform: translateX(-20px) translateY(20px) rotateY(-8deg);
    background: #e8e5dc;
  }

  .preview-page.page-2 {
    transform: translateX(-10px) translateY(10px) rotateY(-4deg);
    background: #f0ede4;
  }

  .preview-page.page-1 {
    transform: rotateY(0deg);
    background: var(--card);
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 6px solid var(--pine);
  }

  .preview-stack:hover .preview-page.page-3 {
    transform: translateX(-30px) translateY(30px) rotateY(-12deg);
  }

  .preview-stack:hover .preview-page.page-2 {
    transform: translateX(-15px) translateY(15px) rotateY(-6deg);
  }

  .preview-stack:hover .preview-page.page-1 {
    transform: rotateY(5deg);
  }

  .page-content {
    text-align: center;
    padding: 2rem;
  }

  .page-chapter {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--terra);
    display: block;
    margin-bottom: 0.75rem;
  }

  .page-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    display: block;
    margin-bottom: 1rem;
  }

  .page-divider {
    width: 48px;
    height: 3px;
    background: var(--alpine);
    margin: 0 auto 1rem;
    border-radius: 2px;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--muted);
    font-style: italic;
  }

  /* ============================================ */
  /* TOOLS SECTION                                 */
  /* ============================================ */
  .tools-section {
    position: relative;
    z-index: 1;
    padding: 5rem 1.5rem;
  }

  .tools-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .tools-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--terra);
    display: block;
    margin-bottom: 0.75rem;
  }

  .tools-title {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .tools-subtitle {
    font-size: 1.0625rem;
    color: var(--muted);
    margin: 0;
    max-width: 500px;
    margin-inline: auto;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  .tool-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem 1rem;
    text-align: center;
    text-decoration: none;
    transition: all 0.25s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .tool-card:hover {
    transform: translateY(-4px);
    border-color: var(--alpine);
    box-shadow: 0 8px 24px rgba(77, 89, 74, 0.1);
  }

  .tool-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    transition: transform 0.2s ease;
  }

  .tool-card:hover .tool-icon {
    transform: scale(1.1);
  }

  .tool-icon svg {
    width: 24px;
    height: 24px;
  }

  .tool-icon.milestone {
    background: rgba(217, 119, 6, 0.12);
    color: var(--terra);
  }

  .tool-icon.resupply {
    background: rgba(166, 181, 137, 0.2);
    color: var(--pine);
  }

  .tool-icon.weather {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
  }

  .tool-icon.budget {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
  }

  .tool-icon.pack {
    background: rgba(77, 89, 74, 0.15);
    color: var(--pine);
  }

  .tool-icon.food {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
  }

  .tool-icon.water {
    background: rgba(6, 182, 212, 0.12);
    color: #06b6d4;
  }

  .tool-icon.layers {
    background: rgba(139, 92, 246, 0.12);
    color: #8b5cf6;
  }

  .tool-icon.shelter {
    background: rgba(217, 119, 6, 0.12);
    color: var(--terra);
  }

  .tool-icon.power {
    background: rgba(240, 224, 0, 0.2);
    color: #ca8a04;
  }

  .tool-icon.maildrop {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .tool-icon.training {
    background: rgba(166, 181, 137, 0.2);
    color: var(--alpine);
  }

  .tool-name {
    font-family: Oswald, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink);
    display: block;
  }

  .tool-desc {
    font-size: 0.75rem;
    color: var(--muted);
    display: block;
  }

  .tools-footer {
    text-align: center;
  }

  .tools-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 1rem 2rem;
    background: var(--pine);
    color: var(--card);
    font-family: Oswald, sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .tools-cta:hover {
    background: var(--ink);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(43, 47, 38, 0.2);
  }

  .tools-cta svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
  }

  .tools-cta:hover svg {
    transform: translateX(3px);
  }

  /* ============================================ */
  /* FOOTER                                        */
  /* ============================================ */
  .hub-footer {
    position: relative;
    z-index: 1;
    background: var(--pine);
    padding-top: 4rem;
  }

  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 2rem;
  }

  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-logo {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 0.9375rem;
    letter-spacing: 0.12em;
    color: var(--card);
  }

  .footer-logo svg {
    width: 20px;
    height: 20px;
  }

  .footer-tagline {
    font-family: Caveat, cursive;
    font-size: 1.375rem;
    color: var(--alpine);
    margin: 0;
  }

  .footer-nav {
    display: flex;
    gap: 2rem;
    justify-content: center;
  }

  .footer-nav a {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .footer-nav a:hover {
    color: var(--card);
  }

  .footer-blaze {
    display: flex;
    justify-content: flex-end;
  }

  .blaze-mark {
    width: 16px;
    height: 28px;
    background: var(--marker);
    border-radius: 3px;
    transform: rotate(-3deg);
    box-shadow: 0 2px 8px rgba(240, 224, 0, 0.3);
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.25rem 1.5rem;
    text-align: center;
  }

  .copyright {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  /* ============================================ */
  /* RESPONSIVE                                    */
  /* ============================================ */
  @media (max-width: 1024px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    .hero-visual {
      order: -1;
      max-width: 400px;
      margin: 0 auto;
    }

    .blaze-markers {
      display: none;
    }

    .credentials-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .credential-card.featured {
      grid-column: span 3;
    }

    .mission-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .guide-inner {
      grid-template-columns: 1fr;
      gap: 3rem;
      text-align: center;
    }

    .guide-chapters {
      justify-content: center;
    }

    .chapter-row {
      justify-content: center;
    }

    .guide-actions {
      justify-content: center;
    }

    .guide-visual {
      order: -1;
    }

    .tools-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .footer-inner {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 1.5rem;
    }

    .footer-brand {
      align-items: center;
    }

    .footer-blaze {
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    .main-nav {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
    }

    .hero-section {
      padding: 3rem 1rem 4rem;
    }

    .hero-stats {
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .stat-divider {
      display: none;
    }

    .hero-actions {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }

    .credentials-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .credential-card.featured {
      grid-column: span 2;
    }

    .updates-grid {
      grid-template-columns: 1fr;
    }

    .tools-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .field-guide-section {
      padding: 4rem 1rem;
    }

    .preview-stack {
      width: 220px;
      height: 280px;
    }

    .guide-visual {
      padding-left: 30px;
    }

    .footer-nav {
      flex-wrap: wrap;
      gap: 1rem;
    }
  }

  @media (max-width: 480px) {
    .logo-text {
      font-size: 0.875rem;
    }

    .edition-badge {
      flex-wrap: wrap;
    }

    .badge-divider {
      display: none;
    }

    .headline-main {
      font-size: 2.5rem;
    }

    .credentials-grid {
      grid-template-columns: 1fr;
    }

    .credential-card.featured {
      grid-column: span 1;
    }

    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .tool-card {
      padding: 1.25rem 0.75rem;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .guide-description {
      font-size: 1rem;
    }

    .strategy-stats {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
