<script>
  import { onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';

  // State
  let mounted = $state(false);
  let currentTime = $state(new Date());
  let activeFilter = $state('all');

  // Hiker profile - Jimmy "Triple-O" Hogg
  const hiker = {
    name: 'Jimmy Hogg',
    trailName: 'Triple-O',
    completedMiles: 840,
    atMilesHiked: 49,
    sassafrasAwardHolder: true,
    highPoint: 'Pikes Peak (14,115 ft)',
    trails: [
      { name: 'Ouachita Trail', miles: 223 },
      { name: 'Ozark Highlands Trail', miles: 270 },
      { name: 'Ozark Trail', miles: 230 }
    ],
    readinessScore: 9
  };

  // Mission data
  const mission = {
    name: 'AT 2026 NOBO',
    distance: 2194,
    startDate: 'Feb 2026',
    expectedFinish: 'Sep 17-20, 2026',
    chapters: 20,
    tools: 12,
    currentMile: 0,
    daysUntilStart: Math.ceil((new Date('2026-02-01') - new Date()) / (1000 * 60 * 60 * 24))
  };

  // Quick access cards
  const quickAccess = [
    {
      id: 'guide',
      title: 'Field Guide',
      subtitle: '20 Chapters',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>`,
      href: '/guide',
      accent: 'alpine',
      stats: 'Complete AT knowledge base'
    },
    {
      id: 'tools',
      title: 'Trail Tools',
      subtitle: '12 Tools',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg>`,
      href: '/tools',
      accent: 'terra',
      stats: 'Plan, track, optimize'
    },
    {
      id: 'videos',
      title: 'Videos',
      subtitle: 'YouTube',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"/></svg>`,
      href: '/videos',
      accent: 'marker',
      stats: 'Gear reviews & vlogs'
    },
    {
      id: 'trips',
      title: 'Trip Reports',
      subtitle: 'Adventures',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>`,
      href: '/trips',
      accent: 'pine',
      stats: 'Past expeditions'
    }
  ];

  // Tools strip data
  const tools = [
    { name: 'Layers', icon: '🧥', href: '/tools#layers' },
    { name: 'Shelter', icon: '🏠', href: '/tools#shelter' },
    { name: 'Weather', icon: '🌤️', href: '/tools#weather' },
    { name: 'Milestones', icon: '📍', href: '/tools#milestone' },
    { name: 'Pack', icon: '🎒', href: '/tools#pack' },
    { name: 'Resupply', icon: '🍽️', href: '/tools#resupply' },
    { name: 'Water', icon: '💧', href: '/tools#water' },
    { name: 'Budget', icon: '💰', href: '/tools#budget' },
    { name: 'Mail Drops', icon: '📬', href: '/tools#mail' },
    { name: 'Power', icon: '🔋', href: '/tools#power' },
    { name: 'Food Calc', icon: '🥜', href: '/tools#food' },
    { name: 'Gear Swap', icon: '🔄', href: '/tools#geartrans' }
  ];

  // Activity feed
  const activities = [
    {
      type: 'guide',
      title: 'Field Guide Complete',
      desc: '20 chapters of trail-tested knowledge ready for Triple-O',
      time: 'Just now',
      icon: '📖'
    },
    {
      type: 'tools',
      title: '12 Trail Tools Launched',
      desc: 'Layering, shelter decisions, milestone planning & more',
      time: '1 day ago',
      icon: '🛠️'
    },
    {
      type: 'video',
      title: 'New Video Posted',
      desc: 'Winter gear shakedown complete',
      time: '3 days ago',
      icon: '🎬'
    },
    {
      type: 'milestone',
      title: 'Countdown Active',
      desc: `${mission.daysUntilStart} days until Springer Mountain`,
      time: 'Ongoing',
      icon: '⏱️'
    }
  ];

  // Navigation items
  const navItems = [
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>`, href: '/guide', label: 'Guide' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg>`, href: '/tools', label: 'Tools' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"/></svg>`, href: '/videos', label: 'Videos' },
    { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>`, href: '/trips', label: 'Trips' }
  ];

  onMount(() => {
    mounted = true;
    // Update time every minute
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000);
    return () => clearInterval(interval);
  });

  // Format countdown
  function formatCountdown(days) {
    if (days <= 0) return 'On Trail';
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (months > 0) {
      return `${months}mo ${remainingDays}d`;
    }
    return `${days}d`;
  }
</script>

<div class="dashboard" class:mounted>
  <!-- Ambient glow effects -->
  <div class="ambient-glow glow-1"></div>
  <div class="ambient-glow glow-2"></div>

  <!-- Header -->
  <header class="header">
    <div class="header-inner">
      <a href="/" class="logo">
        <span class="logo-mark">HC</span>
      </a>

      <nav class="nav">
        {#each navItems as item}
          <a href={item.href} class="nav-item" title={item.label}>
            {@html item.icon}
          </a>
        {/each}
      </nav>

      <div class="header-right">
        <span class="live-badge">
          <span class="live-dot"></span>
          <span class="live-text">{formatCountdown(mission.daysUntilStart)}</span>
        </span>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main">
    <!-- Hiker Profile Card -->
    <section class="hiker-card">
      <div class="hiker-header">
        <div class="hiker-identity">
          <span class="hiker-trail-name">{hiker.trailName}</span>
          <h2 class="hiker-name">{hiker.name}</h2>
        </div>
        <div class="hiker-badge sassafras">
          <span class="badge-icon">🏆</span>
          <span class="badge-text">Sassafras Award #6</span>
        </div>
      </div>

      <div class="credentials-grid">
        <div class="credential">
          <span class="credential-value">{hiker.completedMiles}+</span>
          <span class="credential-label">THRU-HIKE MILES</span>
        </div>
        <div class="credential">
          <span class="credential-value">3</span>
          <span class="credential-label">COMPLETED TRAILS</span>
        </div>
        <div class="credential">
          <span class="credential-value">{hiker.atMilesHiked}</span>
          <span class="credential-label">AT MILES HIKED</span>
        </div>
        <div class="credential">
          <span class="credential-value">{hiker.readinessScore}/10</span>
          <span class="credential-label">NOBO READINESS</span>
        </div>
      </div>

      <div class="trails-completed">
        <span class="trails-label">Completed Thru-Hikes:</span>
        <div class="trail-tags">
          {#each hiker.trails as trail}
            <span class="trail-tag">{trail.name} ({trail.miles} mi)</span>
          {/each}
        </div>
      </div>

      <div class="highpoint">
        <span class="highpoint-icon">🏔️</span>
        <span class="highpoint-text">High point: {hiker.highPoint}</span>
      </div>
    </section>

    <!-- Mission Card -->
    <section class="mission-card">
      <div class="mission-header">
        <div class="mission-badge">
          <span class="badge-icon">🥾</span>
          <span class="badge-text">THRU-HIKE 2026</span>
        </div>
        <div class="mission-status">
          <span class="status-dot"></span>
          <span class="status-text">PREPARING</span>
        </div>
      </div>

      <h1 class="mission-title">Appalachian Trail NOBO</h1>
      <p class="mission-subtitle">Springer Mountain, GA to Katahdin, ME</p>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat">
          <span class="stat-value">{mission.distance.toLocaleString()}</span>
          <span class="stat-label">MILES</span>
        </div>
        <div class="stat">
          <span class="stat-value">{mission.startDate}</span>
          <span class="stat-label">START</span>
        </div>
        <div class="stat">
          <span class="stat-value">{mission.chapters}</span>
          <span class="stat-label">CHAPTERS</span>
        </div>
        <div class="stat">
          <span class="stat-value">{mission.tools}</span>
          <span class="stat-label">TOOLS</span>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Mission Progress</span>
          <span class="progress-pct">0%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: 0%"></div>
          <div class="progress-marker" style="left: 0%">
            <span class="marker-dot"></span>
          </div>
        </div>
        <div class="progress-endpoints">
          <span>Springer Mtn</span>
          <span>Katahdin</span>
        </div>
      </div>

      <!-- Countdown -->
      <div class="countdown">
        <div class="countdown-value">{mission.daysUntilStart}</div>
        <div class="countdown-label">days until trailhead</div>
        <div class="countdown-finish">Expected finish: {mission.expectedFinish}</div>
      </div>
    </section>

    <!-- Story Context -->
    <section class="story-card">
      <div class="story-icon">❤️</div>
      <p class="story-text">
        This site was built by <strong>Chris Hogg</strong> as a gift for his dad
        <strong>Jimmy "Triple-O" Hogg</strong> — a comprehensive field guide and toolkit
        for his 2026 AT thru-hike. Everything here is designed to help Triple-O succeed
        on his biggest adventure yet.
      </p>
    </section>

    <!-- Quick Access Grid -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Quick Access</h2>
        <span class="section-subtitle">Everything Triple-O needs</span>
      </div>

      <div class="quick-grid">
        {#each quickAccess as card, i}
          <a
            href={card.href}
            class="quick-card accent-{card.accent}"
            style="--delay: {i * 0.05}s"
          >
            <div class="quick-icon">
              {@html card.icon}
            </div>
            <div class="quick-content">
              <h3 class="quick-title">{card.title}</h3>
              <span class="quick-subtitle">{card.subtitle}</span>
            </div>
            <span class="quick-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </span>
            <div class="quick-glow"></div>
          </a>
        {/each}
      </div>
    </section>

    <!-- Tools Strip -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Trail Tools</h2>
        <a href="/tools" class="section-link">View All</a>
      </div>

      <div class="tools-strip">
        <div class="tools-scroll">
          {#each tools as tool}
            <a href={tool.href} class="tool-chip">
              <span class="tool-icon">{tool.icon}</span>
              <span class="tool-name">{tool.name}</span>
            </a>
          {/each}
        </div>
        <div class="scroll-fade scroll-fade-left"></div>
        <div class="scroll-fade scroll-fade-right"></div>
      </div>
    </section>

    <!-- Activity Feed -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Recent Activity</h2>
        <div class="filter-pills">
          <button
            class="filter-pill"
            class:active={activeFilter === 'all'}
            onclick={() => activeFilter = 'all'}
          >All</button>
          <button
            class="filter-pill"
            class:active={activeFilter === 'guide'}
            onclick={() => activeFilter = 'guide'}
          >Guide</button>
          <button
            class="filter-pill"
            class:active={activeFilter === 'tools'}
            onclick={() => activeFilter = 'tools'}
          >Tools</button>
        </div>
      </div>

      <div class="activity-feed">
        {#each activities.filter(a => activeFilter === 'all' || a.type === activeFilter) as activity, i}
          <div class="activity-item" style="--delay: {i * 0.05}s">
            <div class="activity-icon">{activity.icon}</div>
            <div class="activity-content">
              <h4 class="activity-title">{activity.title}</h4>
              <p class="activity-desc">{activity.desc}</p>
            </div>
            <span class="activity-time">{activity.time}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Feature Highlights -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Featured</h2>
      </div>

      <div class="feature-grid">
        <a href="/guide" class="feature-card feature-guide">
          <div class="feature-bg"></div>
          <div class="feature-content">
            <span class="feature-badge">Complete</span>
            <h3 class="feature-title">AT Field Guide</h3>
            <p class="feature-desc">20 chapters covering everything from gear to resupply strategy, water sources to shelter logistics — built for Triple-O's NOBO journey.</p>
            <span class="feature-cta">
              Read the Guide
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </span>
          </div>
        </a>

        <a href="/tools" class="feature-card feature-tools">
          <div class="feature-bg"></div>
          <div class="feature-content">
            <span class="feature-badge">Interactive</span>
            <h3 class="feature-title">Trail Tools Suite</h3>
            <p class="feature-desc">12 purpose-built tools: layering advisor, milestone planner, budget tracker, and more — designed for real trail decisions.</p>
            <span class="feature-cta">
              Launch Tools
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </span>
          </div>
        </a>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-logo">HC</span>
        <span class="footer-tagline">Hogg Country</span>
      </div>
      <div class="footer-links">
        <a href="/guide">Field Guide</a>
        <a href="/tools">Tools</a>
        <a href="/videos">Videos</a>
        <a href="/videos">Trips</a>
      </div>
      <div class="footer-meta">
        <p>AT NOBO 2026 | Triple-O | Built with love by Chris</p>
      </div>
    </div>
  </footer>
</div>

<style>
  /* ========== DESIGN TOKENS ========== */
  .dashboard {
    --bg: #0f1114;
    --bg-card: #1a1d21;
    --bg-elevated: #22262b;
    --border: #2a2d32;
    --border-subtle: #1f2227;

    --text: #e8e6e1;
    --text-muted: #8b9099;
    --text-dim: #5c6370;

    --alpine: #a6b589;
    --alpine-glow: rgba(166, 181, 137, 0.15);
    --terra: #d97706;
    --terra-glow: rgba(217, 119, 6, 0.15);
    --marker: #f0e000;
    --marker-glow: rgba(240, 224, 0, 0.12);
    --pine: #4d594a;
    --gold: #fbbf24;
    --gold-glow: rgba(251, 191, 36, 0.15);

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;

    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Ambient glows */
  .ambient-glow {
    position: fixed;
    pointer-events: none;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0;
    transition: opacity 1s ease;
  }

  .dashboard.mounted .ambient-glow {
    opacity: 1;
  }

  .glow-1 {
    top: -200px;
    right: -100px;
    width: 600px;
    height: 600px;
    background: var(--alpine-glow);
  }

  .glow-2 {
    bottom: 100px;
    left: -200px;
    width: 500px;
    height: 500px;
    background: var(--terra-glow);
  }

  /* ========== HEADER ========== */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(15, 17, 20, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.875rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .logo {
    text-decoration: none;
  }

  .logo-mark {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--alpine);
    letter-spacing: -0.02em;
    text-shadow: 0 0 20px var(--alpine-glow);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    transition: all 0.2s ease;
  }

  .nav-item:hover {
    background: var(--bg-elevated);
    color: var(--text);
  }

  .nav-item :global(svg) {
    width: 20px;
    height: 20px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--alpine);
  }

  .live-dot {
    width: 6px;
    height: 6px;
    background: var(--alpine);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* ========== MAIN ========== */
  .main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }

  /* ========== HIKER CARD ========== */
  .hiker-card {
    position: relative;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(26, 29, 33, 0.9) 100%);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: var(--radius-xl);
    padding: 1.75rem;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }

  .hiker-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--gold), var(--terra), var(--alpine));
  }

  .hiker-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .hiker-identity {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hiker-trail-name {
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .hiker-name {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
    line-height: 1.1;
  }

  .hiker-badge.sassafras {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.875rem;
    background: var(--gold-glow);
    border: 1px solid rgba(251, 191, 36, 0.4);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--gold);
  }

  .credentials-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .credential {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .credential-value {
    display: block;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.1;
  }

  .credential-label {
    display: block;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin-top: 0.2rem;
  }

  .trails-completed {
    margin-bottom: 1rem;
  }

  .trails-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .trail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .trail-tag {
    padding: 0.35rem 0.7rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--text-muted);
  }

  .highpoint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.875rem;
    background: rgba(166, 181, 137, 0.1);
    border: 1px solid rgba(166, 181, 137, 0.2);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: var(--alpine);
  }

  .highpoint-icon {
    font-size: 1rem;
  }

  .highpoint-text {
    font-weight: 500;
  }

  /* ========== MISSION CARD ========== */
  .mission-card {
    position: relative;
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(26, 29, 33, 0.8) 100%);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }

  .mission-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--alpine), var(--terra), var(--marker));
  }

  .mission-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .mission-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.875rem;
    background: var(--alpine-glow);
    border: 1px solid rgba(166, 181, 137, 0.3);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--alpine);
  }

  .mission-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--terra);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    background: var(--terra);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .mission-title {
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    line-height: 1.1;
    margin: 0 0 0.35rem;
    color: var(--text);
  }

  .mission-subtitle {
    font-size: 0.95rem;
    color: var(--text-muted);
    margin: 0 0 1.75rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat {
    text-align: center;
    padding: 1rem 0.5rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .stat-value {
    display: block;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.1;
  }

  .stat-label {
    display: block;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-top: 0.25rem;
  }

  .progress-section {
    margin-bottom: 1.5rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .progress-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .progress-pct {
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--alpine);
  }

  .progress-track {
    position: relative;
    height: 8px;
    background: var(--bg-elevated);
    border-radius: 999px;
    overflow: visible;
  }

  .progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--terra));
    border-radius: 999px;
    transition: width 0.5s ease;
  }

  .progress-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  .marker-dot {
    display: block;
    width: 16px;
    height: 16px;
    background: var(--terra);
    border: 3px solid var(--bg-card);
    border-radius: 50%;
    box-shadow: 0 0 12px var(--terra-glow);
  }

  .progress-endpoints {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.65rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .countdown {
    text-align: center;
    padding: 1.25rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .countdown-value {
    font-family: Oswald, Impact, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--marker);
    line-height: 1;
    text-shadow: 0 0 30px var(--marker-glow);
  }

  .countdown-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 0.25rem;
  }

  .countdown-finish {
    font-size: 0.7rem;
    color: var(--text-dim);
    margin-top: 0.5rem;
  }

  /* ========== STORY CARD ========== */
  .story-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(26, 29, 33, 0.6) 100%);
    border: 1px solid rgba(217, 119, 6, 0.2);
    border-radius: var(--radius-lg);
    margin-bottom: 2.5rem;
  }

  .story-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .story-text {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0;
  }

  .story-text strong {
    color: var(--text);
    font-weight: 600;
  }

  /* ========== SECTIONS ========== */
  .section {
    margin-bottom: 2.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .section-title {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-subtitle {
    font-size: 0.8rem;
    color: var(--text-dim);
  }

  .section-link {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--alpine);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .section-link:hover {
    color: var(--text);
  }

  /* ========== QUICK ACCESS GRID ========== */
  .quick-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .quick-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    text-decoration: none;
    transition: all 0.25s ease;
    overflow: hidden;
  }

  .quick-card:hover {
    transform: translateY(-2px);
    border-color: var(--border);
  }

  .quick-card.accent-alpine:hover {
    border-color: var(--alpine);
    box-shadow: 0 8px 32px var(--alpine-glow);
  }

  .quick-card.accent-terra:hover {
    border-color: var(--terra);
    box-shadow: 0 8px 32px var(--terra-glow);
  }

  .quick-card.accent-marker:hover {
    border-color: var(--marker);
    box-shadow: 0 8px 32px var(--marker-glow);
  }

  .quick-card.accent-pine:hover {
    border-color: var(--pine);
    box-shadow: 0 8px 32px rgba(77, 89, 74, 0.2);
  }

  .quick-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .quick-card.accent-alpine .quick-glow {
    background: radial-gradient(circle at center, var(--alpine-glow), transparent 50%);
  }

  .quick-card.accent-terra .quick-glow {
    background: radial-gradient(circle at center, var(--terra-glow), transparent 50%);
  }

  .quick-card.accent-marker .quick-glow {
    background: radial-gradient(circle at center, var(--marker-glow), transparent 50%);
  }

  .quick-card.accent-pine .quick-glow {
    background: radial-gradient(circle at center, rgba(77, 89, 74, 0.15), transparent 50%);
  }

  .quick-card:hover .quick-glow {
    opacity: 1;
  }

  .quick-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .quick-icon :global(svg) {
    width: 22px;
    height: 22px;
  }

  .quick-card.accent-alpine:hover .quick-icon {
    background: var(--alpine-glow);
    color: var(--alpine);
  }

  .quick-card.accent-terra:hover .quick-icon {
    background: var(--terra-glow);
    color: var(--terra);
  }

  .quick-card.accent-marker:hover .quick-icon {
    background: var(--marker-glow);
    color: var(--marker);
  }

  .quick-card.accent-pine:hover .quick-icon {
    background: rgba(77, 89, 74, 0.2);
    color: var(--alpine);
  }

  .quick-content {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  .quick-title {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.15rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .quick-subtitle {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .quick-arrow {
    width: 24px;
    height: 24px;
    color: var(--text-dim);
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.2s ease;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .quick-arrow :global(svg) {
    width: 100%;
    height: 100%;
  }

  .quick-card:hover .quick-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  /* ========== TOOLS STRIP ========== */
  .tools-strip {
    position: relative;
  }

  .tools-scroll {
    display: flex;
    gap: 0.625rem;
    overflow-x: auto;
    padding: 0.5rem 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tools-scroll::-webkit-scrollbar {
    display: none;
  }

  .tool-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 999px;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .tool-chip:hover {
    background: var(--bg-elevated);
    border-color: var(--alpine);
    transform: translateY(-2px);
  }

  .tool-icon {
    font-size: 1rem;
  }

  .tool-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text);
  }

  .scroll-fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 40px;
    pointer-events: none;
  }

  .scroll-fade-left {
    left: 0;
    background: linear-gradient(90deg, var(--bg), transparent);
  }

  .scroll-fade-right {
    right: 0;
    background: linear-gradient(-90deg, var(--bg), transparent);
  }

  /* ========== FILTER PILLS ========== */
  .filter-pills {
    display: flex;
    gap: 0.375rem;
  }

  .filter-pill {
    padding: 0.35rem 0.75rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-pill:hover {
    border-color: var(--text-dim);
    color: var(--text);
  }

  .filter-pill.active {
    background: var(--alpine);
    border-color: var(--alpine);
    color: var(--bg);
  }

  /* ========== ACTIVITY FEED ========== */
  .activity-feed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
  }

  .activity-item:hover {
    border-color: var(--border);
    background: var(--bg-elevated);
  }

  .activity-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-elevated);
    border-radius: var(--radius-sm);
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .activity-content {
    flex: 1;
    min-width: 0;
  }

  .activity-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.2rem;
  }

  .activity-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }

  .activity-time {
    font-size: 0.7rem;
    color: var(--text-dim);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ========== FEATURE GRID ========== */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .feature-card {
    position: relative;
    padding: 1.75rem;
    border-radius: var(--radius-lg);
    text-decoration: none;
    overflow: hidden;
    transition: all 0.3s ease;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .feature-card:hover {
    transform: translateY(-4px);
  }

  .feature-guide {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15) 0%, rgba(77, 89, 74, 0.2) 100%);
    border: 1px solid rgba(166, 181, 137, 0.3);
  }

  .feature-guide:hover {
    border-color: var(--alpine);
    box-shadow: 0 16px 48px var(--alpine-glow);
  }

  .feature-tools {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%);
    border: 1px solid rgba(217, 119, 6, 0.3);
  }

  .feature-tools:hover {
    border-color: var(--terra);
    box-shadow: 0 16px 48px var(--terra-glow);
  }

  .feature-bg {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 30 Q25 10 50 30 T100 30' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q25 50 50 70 T100 70' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3C/svg%3E");
    background-size: 80px 80px;
  }

  .feature-content {
    position: relative;
    z-index: 1;
  }

  .feature-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text);
    margin-bottom: 0.75rem;
  }

  .feature-title {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.5rem;
  }

  .feature-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  .feature-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    transition: gap 0.2s ease;
  }

  .feature-cta :global(svg) {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .feature-card:hover .feature-cta :global(svg) {
    transform: translateX(4px);
  }

  /* ========== FOOTER ========== */
  .footer {
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-card);
  }

  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .footer-logo {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--alpine);
  }

  .footer-tagline {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .footer-links {
    display: flex;
    gap: 1.5rem;
  }

  .footer-links a {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .footer-links a:hover {
    color: var(--text);
  }

  .footer-meta {
    font-size: 0.75rem;
    color: var(--text-dim);
  }

  .footer-meta p {
    margin: 0;
  }

  /* ========== RESPONSIVE ========== */
  @media (max-width: 768px) {
    .main {
      padding: 1.5rem 1rem 3rem;
    }

    .credentials-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .quick-grid {
      grid-template-columns: 1fr;
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }

    .feature-card {
      min-height: 160px;
    }

    .nav-item {
      width: 36px;
      height: 36px;
    }

    .nav-item :global(svg) {
      width: 18px;
      height: 18px;
    }

    .footer-inner {
      flex-direction: column;
      text-align: center;
    }

    .footer-links {
      justify-content: center;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-pills {
      width: 100%;
      justify-content: flex-start;
    }

    .activity-item {
      padding: 0.875rem 1rem;
    }

    .activity-time {
      position: absolute;
      top: 0.875rem;
      right: 1rem;
    }

    .activity-item {
      position: relative;
    }

    .hiker-header {
      flex-direction: column;
    }

    .hiker-badge.sassafras {
      align-self: flex-start;
    }

    .story-card {
      flex-direction: column;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .header-inner {
      padding: 0.75rem 1rem;
    }

    .hiker-card {
      padding: 1.25rem;
    }

    .hiker-name {
      font-size: 1.5rem;
    }

    .mission-card {
      padding: 1.5rem;
    }

    .mission-title {
      font-size: 1.5rem;
    }

    .stat-value {
      font-size: 1.25rem;
    }

    .credential-value {
      font-size: 1.15rem;
    }

    .countdown-value {
      font-size: 2.5rem;
    }

    .quick-card {
      padding: 1rem;
    }

    .quick-icon {
      width: 40px;
      height: 40px;
    }

    .quick-icon :global(svg) {
      width: 20px;
      height: 20px;
    }

    .live-badge {
      padding: 0.35rem 0.6rem;
    }

    .live-text {
      font-size: 0.7rem;
    }

    .trail-tags {
      flex-direction: column;
    }
  }

  /* ========== MOUNT ANIMATION ========== */
  .dashboard {
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .dashboard.mounted {
    opacity: 1;
  }

  .hiker-card,
  .mission-card,
  .story-card,
  .quick-card,
  .activity-item,
  .feature-card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    transition-delay: var(--delay, 0s);
  }

  .dashboard.mounted .hiker-card,
  .dashboard.mounted .mission-card,
  .dashboard.mounted .story-card,
  .dashboard.mounted .quick-card,
  .dashboard.mounted .activity-item,
  .dashboard.mounted .feature-card {
    opacity: 1;
    transform: translateY(0);
  }

  .dashboard.mounted .hiker-card {
    transition-delay: 0.05s;
  }

  .dashboard.mounted .mission-card {
    transition-delay: 0.1s;
  }

  .dashboard.mounted .story-card {
    transition-delay: 0.15s;
  }

  .dashboard.mounted .quick-card:nth-child(1) { transition-delay: 0.2s; }
  .dashboard.mounted .quick-card:nth-child(2) { transition-delay: 0.25s; }
  .dashboard.mounted .quick-card:nth-child(3) { transition-delay: 0.3s; }
  .dashboard.mounted .quick-card:nth-child(4) { transition-delay: 0.35s; }

  .dashboard.mounted .activity-item:nth-child(1) { transition-delay: 0.4s; }
  .dashboard.mounted .activity-item:nth-child(2) { transition-delay: 0.45s; }
  .dashboard.mounted .activity-item:nth-child(3) { transition-delay: 0.5s; }
  .dashboard.mounted .activity-item:nth-child(4) { transition-delay: 0.55s; }

  .dashboard.mounted .feature-card:nth-child(1) { transition-delay: 0.6s; }
  .dashboard.mounted .feature-card:nth-child(2) { transition-delay: 0.65s; }
</style>
