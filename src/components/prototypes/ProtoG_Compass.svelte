<script>
  // Hiker's Compass - Navigation/Wayfinding Homepage
  // A compass rose and map-inspired design for hoggcountry.com

  // Current trail status
  const trailStats = {
    totalMiles: 2194,
    startDate: 'February 2026',
    chapters: 20,
    tools: 12
  };

  // Key trail coordinates
  const coordinates = [
    { name: 'Springer Mountain', state: 'GA', lat: '34.6267', lon: '84.1938', mile: 0, type: 'start' },
    { name: 'Fontana Dam', state: 'NC', lat: '35.4449', lon: '83.8129', mile: 165.7, type: 'waypoint' },
    { name: 'Damascus', state: 'VA', lat: '36.6337', lon: '81.7837', mile: 469.1, type: 'waypoint' },
    { name: 'Harpers Ferry', state: 'WV', lat: '39.3251', lon: '77.7286', mile: 1025.4, type: 'midpoint' },
    { name: 'Delaware Water Gap', state: 'PA', lat: '40.9673', lon: '75.1261', mile: 1294.5, type: 'waypoint' },
    { name: 'Katahdin', state: 'ME', lat: '45.9044', lon: '68.9214', mile: 2194, type: 'end' }
  ];

  // Featured content for "You Are Here"
  const featuredContent = [
    { type: 'guide', title: 'Trail Sections & Terrain', desc: 'Chapter 3 of the Field Guide', link: '/guide/trail-sections' },
    { type: 'tool', title: 'Milestone Calculator', desc: 'Plan your daily mileage', link: '/tools#milestone' },
    { type: 'video', title: 'Gear Shakedown 2025', desc: 'Latest gear review', link: '/videos' }
  ];
</script>

<div class="compass-home">
  <!-- Parchment/map texture overlay -->
  <div class="map-texture"></div>
  <div class="contour-overlay"></div>

  <!-- ===== HEADER ===== -->
  <header class="compass-header">
    <div class="header-inner">
      <a href="/" class="brand">
        <div class="compass-logo">
          <svg viewBox="0 0 40 40" class="logo-svg">
            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2 2"/>
            <path d="M20 4 L20 8 M20 32 L20 36 M4 20 L8 20 M32 20 L36 20" stroke="currentColor" stroke-width="1.5"/>
            <polygon points="20,6 17,20 20,24 23,20" fill="var(--terra)"/>
            <polygon points="20,34 17,20 20,16 23,20" fill="var(--pine)"/>
          </svg>
        </div>
        <span class="brand-name">HOGG COUNTRY</span>
      </a>

      <nav class="coord-nav">
        <a href="/guide" class="nav-coord">
          <span class="coord-dir">N</span>
          <span class="coord-label">Guide</span>
        </a>
        <a href="/tools" class="nav-coord">
          <span class="coord-dir">E</span>
          <span class="coord-label">Tools</span>
        </a>
        <a href="/trips" class="nav-coord">
          <span class="coord-dir">S</span>
          <span class="coord-label">Trips</span>
        </a>
        <a href="/videos" class="nav-coord">
          <span class="coord-dir">W</span>
          <span class="coord-label">Videos</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- ===== HERO: Compass Rose ===== -->
  <section class="hero-compass">
    <div class="hero-inner">
      <div class="compass-rose-container">
        <!-- Large decorative compass rose -->
        <div class="compass-rose">
          <!-- Outer ring with degree marks -->
          <div class="compass-ring outer-ring">
            <span class="degree" style="--angle: 0deg">0</span>
            <span class="degree" style="--angle: 90deg">90</span>
            <span class="degree" style="--angle: 180deg">180</span>
            <span class="degree" style="--angle: 270deg">270</span>
          </div>

          <!-- Cardinal directions -->
          <div class="cardinal north">
            <span class="cardinal-letter">N</span>
            <a href="/guide" class="cardinal-link">Field Guide</a>
          </div>
          <div class="cardinal east">
            <span class="cardinal-letter">E</span>
            <a href="/tools" class="cardinal-link">Trail Tools</a>
          </div>
          <div class="cardinal south">
            <span class="cardinal-letter">S</span>
            <a href="/trips" class="cardinal-link">Trip Reports</a>
          </div>
          <div class="cardinal west">
            <span class="cardinal-letter">W</span>
            <a href="/videos" class="cardinal-link">Videos</a>
          </div>

          <!-- Inner compass needle -->
          <div class="compass-needle">
            <div class="needle north-needle"></div>
            <div class="needle south-needle"></div>
            <div class="needle-center"></div>
          </div>

          <!-- Center content -->
          <div class="compass-center">
            <span class="center-coord">35.7796 N</span>
            <span class="center-coord">84.1938 W</span>
          </div>
        </div>
      </div>

      <div class="hero-content">
        <p class="hero-eyebrow">AT NOBO 2026</p>
        <h1 class="hero-headline">Find Your<br/>True North</h1>
        <p class="hero-sub">
          2,194 miles from Georgia to Maine. 20 chapters of trail wisdom.
          12 interactive tools. Everything you need to navigate the Appalachian Trail.
        </p>
        <div class="hero-coords">
          <span class="coord-badge">
            <span class="coord-icon">START</span>
            <span class="coord-value">Springer Mtn, GA</span>
          </span>
          <span class="coord-arrow">→</span>
          <span class="coord-badge">
            <span class="coord-icon">FINISH</span>
            <span class="coord-value">Mt. Katahdin, ME</span>
          </span>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== THE JOURNEY: Progress Arc ===== -->
  <section class="journey-section">
    <div class="section-inner">
      <div class="section-header">
        <span class="section-coord">SEC. 01</span>
        <h2>The Journey Ahead</h2>
        <p class="section-desc">2,194 miles through 14 states, from Springer Mountain to Katahdin</p>
      </div>

      <div class="journey-arc">
        <svg viewBox="0 0 800 200" class="arc-svg" preserveAspectRatio="xMidYMid meet">
          <!-- Trail path arc -->
          <defs>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="var(--alpine)"/>
              <stop offset="50%" stop-color="var(--pine)"/>
              <stop offset="100%" stop-color="var(--terra)"/>
            </linearGradient>
          </defs>

          <!-- Background path -->
          <path d="M 50 150 Q 400 20 750 150" fill="none" stroke="var(--border)" stroke-width="4" stroke-linecap="round"/>

          <!-- Active path (will show progress) -->
          <path d="M 50 150 Q 400 20 750 150" fill="none" stroke="url(#trailGradient)" stroke-width="4" stroke-linecap="round" stroke-dasharray="1200" stroke-dashoffset="1200" class="trail-path"/>

          <!-- Mile markers -->
          <g class="mile-markers">
            <!-- Springer -->
            <circle cx="50" cy="150" r="8" fill="var(--alpine)"/>
            <text x="50" y="175" class="marker-text start">GA</text>
            <text x="50" y="190" class="marker-mile">Mi 0</text>

            <!-- NC/TN border area -->
            <circle cx="175" cy="85" r="5" fill="var(--pine)"/>
            <text x="175" y="70" class="marker-text">NC</text>

            <!-- VA -->
            <circle cx="320" cy="45" r="5" fill="var(--pine)"/>
            <text x="320" y="30" class="marker-text">VA</text>

            <!-- Harpers Ferry (midpoint) -->
            <circle cx="450" cy="40" r="8" fill="var(--terra)"/>
            <text x="450" y="25" class="marker-text mid">WV</text>
            <text x="450" y="10" class="marker-mile">Halfway</text>

            <!-- PA/NJ -->
            <circle cx="560" cy="55" r="5" fill="var(--pine)"/>
            <text x="560" y="40" class="marker-text">PA</text>

            <!-- New England -->
            <circle cx="670" cy="95" r="5" fill="var(--pine)"/>
            <text x="670" y="80" class="marker-text">NE</text>

            <!-- Katahdin -->
            <circle cx="750" cy="150" r="8" fill="var(--terra)"/>
            <text x="750" y="175" class="marker-text end">ME</text>
            <text x="750" y="190" class="marker-mile">Mi 2194</text>
          </g>
        </svg>

        <div class="journey-stats">
          <div class="journey-stat">
            <span class="stat-value">{trailStats.totalMiles.toLocaleString()}</span>
            <span class="stat-label">Trail Miles</span>
          </div>
          <div class="journey-stat">
            <span class="stat-value">14</span>
            <span class="stat-label">States</span>
          </div>
          <div class="journey-stat">
            <span class="stat-value">464K</span>
            <span class="stat-label">Elev. Gain (ft)</span>
          </div>
          <div class="journey-stat">
            <span class="stat-value">5-7</span>
            <span class="stat-label">Months</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== FOUR DIRECTIONS: Compass Navigation ===== -->
  <section class="directions-section">
    <div class="section-inner">
      <div class="section-header centered">
        <span class="section-coord">SEC. 02</span>
        <h2>Navigate Your Path</h2>
        <p class="section-desc">Four directions to explore. One destination: the summit.</p>
      </div>

      <div class="directions-grid">
        <!-- NORTH: Field Guide -->
        <a href="/guide" class="direction-card north-card">
          <div class="dir-compass">
            <span class="dir-letter">N</span>
            <div class="dir-needle north"></div>
          </div>
          <div class="dir-content">
            <span class="dir-label">North</span>
            <h3>The Field Guide</h3>
            <p>20 chapters of comprehensive thru-hike knowledge. Gear, nutrition, weather, resupply, and everything in between.</p>
            <span class="dir-stat">20 chapters</span>
          </div>
          <div class="dir-arrow">→</div>
        </a>

        <!-- EAST: Tools -->
        <a href="/tools" class="direction-card east-card">
          <div class="dir-compass">
            <span class="dir-letter">E</span>
            <div class="dir-needle east"></div>
          </div>
          <div class="dir-content">
            <span class="dir-label">East</span>
            <h3>Trail Tools</h3>
            <p>Interactive calculators and planners. Milestones, resupply, weather assessment, budget tracking, and more.</p>
            <span class="dir-stat">12 tools</span>
          </div>
          <div class="dir-arrow">→</div>
        </a>

        <!-- SOUTH: Trips -->
        <a href="/trips" class="direction-card south-card">
          <div class="dir-compass">
            <span class="dir-letter">S</span>
            <div class="dir-needle south"></div>
          </div>
          <div class="dir-content">
            <span class="dir-label">South</span>
            <h3>Trip Reports</h3>
            <p>Training hikes and adventures. Building endurance and testing gear on trails across Arkansas and beyond.</p>
            <span class="dir-stat">Trip logs</span>
          </div>
          <div class="dir-arrow">→</div>
        </a>

        <!-- WEST: Videos -->
        <a href="/videos" class="direction-card west-card">
          <div class="dir-compass">
            <span class="dir-letter">W</span>
            <div class="dir-needle west"></div>
          </div>
          <div class="dir-content">
            <span class="dir-label">West</span>
            <h3>Video Journal</h3>
            <p>Gear reviews, trail updates, and the journey to Springer. Subscribe for the full AT experience.</p>
            <span class="dir-stat">YouTube</span>
          </div>
          <div class="dir-arrow">→</div>
        </a>
      </div>
    </div>
  </section>

  <!-- ===== COORDINATES: Key Trail Points ===== -->
  <section class="coordinates-section">
    <div class="section-inner">
      <div class="section-header">
        <span class="section-coord">SEC. 03</span>
        <h2>Trail Coordinates</h2>
        <p class="section-desc">Key waypoints from Georgia to Maine</p>
      </div>

      <div class="coordinates-grid">
        {#each coordinates as coord, i}
          <div class="coord-card" class:start={coord.type === 'start'} class:end={coord.type === 'end'} class:midpoint={coord.type === 'midpoint'}>
            <div class="coord-marker">
              {#if coord.type === 'start'}
                <svg viewBox="0 0 24 24" class="marker-icon"><circle cx="12" cy="12" r="8" fill="var(--alpine)"/><circle cx="12" cy="12" r="4" fill="white"/></svg>
              {:else if coord.type === 'end'}
                <svg viewBox="0 0 24 24" class="marker-icon"><polygon points="12,2 22,22 12,17 2,22" fill="var(--terra)"/></svg>
              {:else if coord.type === 'midpoint'}
                <svg viewBox="0 0 24 24" class="marker-icon"><rect x="4" y="4" width="16" height="16" rx="2" fill="var(--terra)"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">1/2</text></svg>
              {:else}
                <svg viewBox="0 0 24 24" class="marker-icon"><circle cx="12" cy="12" r="6" fill="var(--pine)"/></svg>
              {/if}
            </div>
            <div class="coord-info">
              <span class="coord-name">{coord.name}</span>
              <span class="coord-state">{coord.state}</span>
            </div>
            <div class="coord-data">
              <span class="coord-latlon">{coord.lat}N, {coord.lon}W</span>
              <span class="coord-mile">Mile {coord.mile}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ===== YOU ARE HERE: Featured Content ===== -->
  <section class="current-section">
    <div class="section-inner">
      <div class="section-header centered">
        <div class="you-are-here-badge">
          <span class="yah-dot"></span>
          <span class="yah-text">YOU ARE HERE</span>
        </div>
        <h2>Current Position</h2>
        <p class="section-desc">Start your exploration with these featured resources</p>
      </div>

      <div class="featured-grid">
        {#each featuredContent as item}
          <a href={item.link} class="featured-card" data-type={item.type}>
            <div class="featured-pin">
              <div class="pin-head"></div>
              <div class="pin-point"></div>
            </div>
            <div class="featured-content">
              <span class="featured-type">{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
            <span class="featured-explore">Explore →</span>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- ===== HIKER INFO ===== -->
  <section class="hiker-section">
    <div class="section-inner">
      <div class="hiker-card">
        <div class="hiker-compass">
          <div class="mini-compass">
            <div class="mini-needle"></div>
          </div>
        </div>
        <div class="hiker-info">
          <span class="hiker-label">The Navigator</span>
          <span class="hiker-name">Chris "Triple-O" Hogg</span>
          <span class="hiker-titles">Triple O Crowner | Sassafras Award | AT NOBO 2026</span>
        </div>
        <div class="hiker-mission">
          <span class="mission-date">February 2026</span>
          <span class="mission-route">Springer → Katahdin</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ===== FOOTER ===== -->
  <footer class="compass-footer">
    <div class="footer-inner">
      <div class="footer-compass">
        <svg viewBox="0 0 60 60" class="footer-compass-svg">
          <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" stroke-width="1"/>
          <path d="M30 5 L30 10 M30 50 L30 55 M5 30 L10 30 M50 30 L55 30" stroke="currentColor" stroke-width="1"/>
          <polygon points="30,10 27,30 30,35 33,30" fill="var(--alpine)"/>
          <polygon points="30,50 27,30 30,25 33,30" fill="var(--pine)"/>
        </svg>
      </div>
      <div class="footer-content">
        <p class="footer-tagline">The trail awaits.</p>
        <p class="footer-coords">35.7796 N, 84.1938 W → 45.9044 N, 68.9214 W</p>
      </div>
      <div class="footer-brand">
        <span class="brand-text">HOGG COUNTRY</span>
        <span class="brand-year">2026</span>
      </div>
    </div>
  </footer>
</div>

<style>
  /* ===== Design Tokens ===== */
  .compass-home {
    --bg: #f5f2e8;
    --fg: #333333;
    --pine: #4d594a;
    --alpine: #a6b589;
    --terra: #d97706;
    --parchment: #faf8f0;
    --border: #e6e1d4;
    --ink: #1f2937;
    --muted: #5c665a;

    min-height: 100vh;
    background: var(--bg);
    color: var(--fg);
    font-family: system-ui, -apple-system, sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* ===== Map Textures ===== */
  .map-texture {
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    z-index: 0;
  }

  .contour-overlay {
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 Q50 20 100 40 T200 40' fill='none' stroke='%234d594a' stroke-width='0.5' opacity='0.06'/%3E%3Cpath d='M0 80 Q60 50 120 80 T200 80' fill='none' stroke='%234d594a' stroke-width='0.5' opacity='0.06'/%3E%3Cpath d='M0 120 Q40 100 80 120 T200 120' fill='none' stroke='%234d594a' stroke-width='0.5' opacity='0.06'/%3E%3Cpath d='M0 160 Q70 130 140 160 T200 160' fill='none' stroke='%234d594a' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  /* ===== HEADER ===== */
  .compass-header {
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

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
  }

  .compass-logo {
    width: 40px;
    height: 40px;
    color: var(--pine);
  }

  .logo-svg {
    width: 100%;
    height: 100%;
  }

  .brand-name {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--ink);
  }

  .coord-nav {
    display: flex;
    gap: 0.25rem;
  }

  .nav-coord {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.875rem;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .nav-coord:hover {
    background: rgba(77, 89, 74, 0.08);
  }

  .coord-dir {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--terra);
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(217, 119, 6, 0.1);
    border-radius: 3px;
  }

  .coord-label {
    font-size: 0.85rem;
    color: var(--pine);
    font-weight: 500;
  }

  /* ===== HERO: Compass Rose ===== */
  .hero-compass {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem 5rem;
    overflow: hidden;
  }

  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }

  .compass-rose-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .compass-rose {
    position: relative;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: var(--parchment);
    border: 3px solid var(--pine);
    box-shadow:
      0 0 0 8px var(--bg),
      0 0 0 10px var(--border),
      0 20px 60px rgba(0, 0, 0, 0.1),
      inset 0 0 60px rgba(77, 89, 74, 0.05);
  }

  .compass-ring {
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 50%;
  }

  .degree {
    position: absolute;
    font-family: 'Courier New', monospace;
    font-size: 0.6rem;
    color: var(--muted);
    transform-origin: center;
  }

  .degree[style*="0deg"] { top: 12px; left: 50%; transform: translateX(-50%); }
  .degree[style*="90deg"] { right: 12px; top: 50%; transform: translateY(-50%); }
  .degree[style*="180deg"] { bottom: 12px; left: 50%; transform: translateX(-50%); }
  .degree[style*="270deg"] { left: 12px; top: 50%; transform: translateY(-50%); }

  .cardinal {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .cardinal.north { top: 25px; left: 50%; transform: translateX(-50%); }
  .cardinal.east { right: 20px; top: 50%; transform: translateY(-50%); flex-direction: row; }
  .cardinal.south { bottom: 25px; left: 50%; transform: translateX(-50%); flex-direction: column-reverse; }
  .cardinal.west { left: 20px; top: 50%; transform: translateY(-50%); flex-direction: row-reverse; }

  .cardinal-letter {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine);
  }

  .cardinal-link {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
    white-space: nowrap;
  }

  .cardinal-link:hover {
    color: var(--terra);
  }

  .compass-needle {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .needle {
    position: absolute;
    width: 12px;
  }

  .north-needle {
    height: 70px;
    top: 60px;
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    background: var(--terra);
  }

  .south-needle {
    height: 70px;
    bottom: 60px;
    clip-path: polygon(0% 0%, 50% 100%, 100% 0%);
    background: var(--pine);
  }

  .needle-center {
    position: absolute;
    width: 20px;
    height: 20px;
    background: var(--ink);
    border-radius: 50%;
    border: 3px solid var(--parchment);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .compass-center {
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .center-coord {
    font-family: 'Courier New', monospace;
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  .hero-content {
    max-width: 520px;
  }

  .hero-eyebrow {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    color: var(--terra);
    margin: 0 0 1rem;
    text-transform: uppercase;
  }

  .hero-headline {
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(3rem, 6vw, 4.5rem);
    font-weight: 700;
    line-height: 1;
    color: var(--ink);
    margin: 0 0 1.5rem;
    letter-spacing: -0.02em;
  }

  .hero-sub {
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--muted);
    margin: 0 0 2rem;
  }

  .hero-coords {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .coord-badge {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 1rem;
    background: var(--parchment);
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  .coord-icon {
    font-family: 'Courier New', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: var(--terra);
    margin-bottom: 0.25rem;
  }

  .coord-value {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    color: var(--pine);
    font-weight: 600;
  }

  .coord-arrow {
    font-size: 1.25rem;
    color: var(--border);
  }

  /* ===== JOURNEY SECTION ===== */
  .journey-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
    background: linear-gradient(180deg, transparent, rgba(166, 181, 137, 0.05));
  }

  .section-inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  .section-header {
    margin-bottom: 2.5rem;
  }

  .section-header.centered {
    text-align: center;
  }

  .section-coord {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: var(--terra);
    display: block;
    margin-bottom: 0.5rem;
  }

  .section-header h2 {
    font-family: Oswald, Impact, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.5rem;
  }

  .section-desc {
    font-size: 1rem;
    color: var(--muted);
    margin: 0;
  }

  .journey-arc {
    background: var(--parchment);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  }

  .arc-svg {
    width: 100%;
    height: auto;
    max-height: 200px;
  }

  .marker-text {
    font-family: Oswald, sans-serif;
    font-size: 12px;
    fill: var(--pine);
    text-anchor: middle;
    font-weight: 600;
  }

  .marker-text.start, .marker-text.end { fill: var(--terra); font-size: 14px; }
  .marker-text.mid { fill: var(--terra); }

  .marker-mile {
    font-family: 'Courier New', monospace;
    font-size: 9px;
    fill: var(--muted);
    text-anchor: middle;
  }

  .trail-path {
    animation: drawPath 3s ease-out forwards;
    animation-delay: 0.5s;
  }

  @keyframes drawPath {
    to {
      stroke-dashoffset: 0;
    }
  }

  .journey-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px dashed var(--border);
  }

  .journey-stat {
    text-align: center;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--pine);
    display: block;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ===== DIRECTIONS SECTION ===== */
  .directions-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
  }

  .directions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .direction-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1.25rem;
    align-items: center;
    padding: 1.75rem;
    background: var(--parchment);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  .direction-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .north-card::before { background: var(--alpine); }
  .east-card::before { background: var(--terra); }
  .south-card::before { background: var(--pine); }
  .west-card::before { background: #c2410c; }

  .direction-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
    border-color: var(--pine);
  }

  .direction-card:hover::before {
    opacity: 1;
  }

  .dir-compass {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .dir-letter {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--pine);
  }

  .dir-needle {
    position: absolute;
    width: 6px;
    height: 16px;
    background: var(--terra);
    border-radius: 3px;
  }

  .dir-needle.north { top: 4px; }
  .dir-needle.east { right: 4px; width: 16px; height: 6px; }
  .dir-needle.south { bottom: 4px; }
  .dir-needle.west { left: 4px; width: 16px; height: 6px; }

  .dir-content {
    min-width: 0;
  }

  .dir-label {
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--terra);
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.25rem;
  }

  .dir-content h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.5rem;
  }

  .dir-content p {
    font-size: 0.875rem;
    color: var(--muted);
    line-height: 1.5;
    margin: 0 0 0.75rem;
  }

  .dir-stat {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: var(--pine);
    background: rgba(77, 89, 74, 0.08);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
  }

  .dir-arrow {
    font-size: 1.5rem;
    color: var(--border);
    transition: all 0.25s ease;
  }

  .direction-card:hover .dir-arrow {
    color: var(--terra);
    transform: translateX(4px);
  }

  /* ===== COORDINATES SECTION ===== */
  .coordinates-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
    background: var(--pine);
  }

  .coordinates-section .section-coord,
  .coordinates-section .section-header h2,
  .coordinates-section .section-desc {
    color: white;
  }

  .coordinates-section .section-coord {
    color: var(--alpine);
  }

  .coordinates-section .section-desc {
    opacity: 0.7;
  }

  .coordinates-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .coord-card {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .coord-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .coord-card.start, .coord-card.end {
    background: rgba(217, 119, 6, 0.15);
    border-color: rgba(217, 119, 6, 0.3);
  }

  .coord-card.midpoint {
    background: rgba(166, 181, 137, 0.15);
    border-color: rgba(166, 181, 137, 0.3);
  }

  .coord-marker {
    width: 32px;
    height: 32px;
  }

  .marker-icon {
    width: 100%;
    height: 100%;
  }

  .coord-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .coord-name {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .coord-state {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .coord-data {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .coord-latlon {
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.02em;
  }

  .coord-mile {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: var(--alpine);
    font-weight: 600;
  }

  /* ===== CURRENT POSITION SECTION ===== */
  .current-section {
    position: relative;
    z-index: 1;
    padding: 4rem 1.5rem;
  }

  .you-are-here-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--terra);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    margin-bottom: 1rem;
  }

  .yah-dot {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
  }

  .yah-text {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
  }

  .featured-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .featured-card {
    position: relative;
    padding: 2rem 1.5rem 1.5rem;
    background: var(--parchment);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.25s ease;
  }

  .featured-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }

  .featured-pin {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pin-head {
    width: 20px;
    height: 20px;
    background: var(--terra);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(217, 119, 6, 0.4);
  }

  .pin-point {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 10px solid var(--terra);
    margin-top: -2px;
  }

  .featured-content {
    text-align: center;
    margin-bottom: 1rem;
  }

  .featured-type {
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--terra);
    display: block;
    margin-bottom: 0.5rem;
  }

  .featured-content h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.5rem;
  }

  .featured-content p {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0;
    line-height: 1.4;
  }

  .featured-explore {
    display: block;
    text-align: center;
    font-size: 0.8rem;
    color: var(--pine);
    font-weight: 600;
    transition: color 0.2s;
  }

  .featured-card:hover .featured-explore {
    color: var(--terra);
  }

  /* ===== HIKER SECTION ===== */
  .hiker-section {
    position: relative;
    z-index: 1;
    padding: 3rem 1.5rem;
  }

  .hiker-card {
    max-width: 700px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1.5rem;
    align-items: center;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, var(--pine), #3d4a3a);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(77, 89, 74, 0.3);
  }

  .hiker-compass {
    width: 60px;
    height: 60px;
  }

  .mini-compass {
    width: 100%;
    height: 100%;
    background: var(--parchment);
    border-radius: 50%;
    border: 2px solid var(--alpine);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mini-needle {
    width: 8px;
    height: 30px;
    position: relative;
  }

  .mini-needle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: var(--terra);
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }

  .mini-needle::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: var(--pine);
    clip-path: polygon(0% 0%, 50% 100%, 100% 0%);
  }

  .hiker-info {
    display: flex;
    flex-direction: column;
  }

  .hiker-label {
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--alpine);
    text-transform: uppercase;
  }

  .hiker-name {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0.25rem 0;
  }

  .hiker-titles {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .hiker-mission {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .mission-date {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--alpine);
  }

  .mission-route {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.05em;
  }

  /* ===== FOOTER ===== */
  .compass-footer {
    position: relative;
    z-index: 1;
    padding: 3rem 1.5rem;
    background: var(--ink);
    color: white;
  }

  .footer-inner {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .footer-compass {
    width: 60px;
    height: 60px;
    color: var(--alpine);
  }

  .footer-compass-svg {
    width: 100%;
    height: 100%;
  }

  .footer-content {
    text-align: center;
  }

  .footer-tagline {
    font-family: Caveat, cursive;
    font-size: 1.75rem;
    color: var(--alpine);
    margin: 0 0 0.5rem;
  }

  .footer-coords {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.05em;
    margin: 0;
  }

  .footer-brand {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
    justify-content: center;
  }

  .brand-text {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.5);
  }

  .brand-year {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: var(--terra);
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    .hero-inner {
      grid-template-columns: 1fr;
      gap: 3rem;
      text-align: center;
    }

    .compass-rose-container {
      order: -1;
    }

    .compass-rose {
      width: 260px;
      height: 260px;
    }

    .hero-content {
      max-width: 100%;
    }

    .hero-coords {
      justify-content: center;
    }

    .directions-grid {
      grid-template-columns: 1fr;
    }

    .coordinates-grid {
      grid-template-columns: 1fr;
    }

    .featured-grid {
      grid-template-columns: 1fr;
      max-width: 400px;
      margin: 0 auto;
    }

    .journey-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .hiker-card {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 1rem;
    }

    .hiker-compass {
      margin: 0 auto;
    }

    .hiker-mission {
      align-items: center;
      text-align: center;
    }
  }

  @media (max-width: 600px) {
    .coord-nav {
      display: none;
    }

    .compass-rose {
      width: 220px;
      height: 220px;
    }

    .north-needle, .south-needle {
      height: 50px;
    }

    .cardinal-letter {
      font-size: 1.25rem;
    }

    .cardinal-link {
      font-size: 0.55rem;
    }

    .hero-compass {
      padding: 2rem 1rem 3rem;
    }

    .hero-headline {
      font-size: 2.5rem;
    }

    .journey-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .stat-value {
      font-size: 1.5rem;
    }

    .direction-card {
      grid-template-columns: auto 1fr;
      gap: 1rem;
    }

    .dir-arrow {
      display: none;
    }

    .coord-card {
      grid-template-columns: auto 1fr;
    }

    .coord-data {
      display: none;
    }
  }
</style>
