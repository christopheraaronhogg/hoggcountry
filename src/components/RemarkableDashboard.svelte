<script lang="ts">
  import { onMount } from 'svelte';
  import { isEnabled } from '../lib/features';

  // State
  let mounted = $state(false);
  let proverb = $state({ ref: "3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." });
  let searchQuery = $state("");

  // Mission data
  const mission = {
    name: 'AT 2026 NOBO',
    distance: 2194,
    daysUntilStart: Math.ceil((new Date('2026-02-01') - new Date()) / (1000 * 60 * 60 * 24))
  };

  // Quick access cards - Filtered by features
  const quickAccess = [
    {
      id: 'guide',
      title: 'Field Guide',
      subtitle: '20 Chapters',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>`,
      href: '/guide',
      accent: 'alpine'
    },
    {
      id: 'gear-lab',
      title: 'Gear Lab',
      subtitle: 'AT Research',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>`,
      href: '/tools#gearlab',
      accent: 'terra'
    },
    {
      id: 'tools',
      title: 'Trail Tools',
      subtitle: '14 Instruments',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/></svg>`,
      href: '/tools',
      accent: 'marker'
    },
    {
      id: 'resilience',
      title: 'Resilience',
      subtitle: 'Mental Fortitude',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`,
      href: '/tools#resilience',
      accent: 'pine'
    }
  ];

  onMount(async () => {
    mounted = true;
    try {
      const response = await fetch('/proverbs.json');
      const data = await response.json();
      const keys = Object.keys(data);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      proverb = { ref: randomKey, text: data[randomKey] };
    } catch (e) {
      console.error("Failed to load proverbs", e);
    }
  });

  function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    if (searchQuery) {
      window.location.href = `/guide?q=${encodeURIComponent(searchQuery)}`;
    }
  }
</script>

<div class="cockpit" class:mounted>
  <!-- Ambient background -->
  <div class="ambient-glow"></div>

  <!-- Header -->
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <span class="logo-mark">HC</span>
        <span class="logo-text">HOGG COUNTRY</span>
      </div>
      <div class="countdown">
        <span class="countdown-value">{mission.daysUntilStart} DAYS TO TRAILHEAD</span>
      </div>
    </div>
  </header>

  <main class="main">
    <!-- HERO: The Daily Blaze -->
    <section class="daily-blaze">
      <div class="blaze-content">
        <div class="blaze-header">
          <span class="blaze-tag">DAILY BLAZE</span>
          <span class="blaze-ref">PROVERBS {proverb.ref}</span>
        </div>
        <p class="blaze-text">"{proverb.text}"</p>
        <div class="blaze-footer">
          <span class="blaze-mission">MENTAL FORTITUDE FOR THE AT</span>
        </div>
      </div>
    </section>

    <!-- KNOWLEDGE: Field Guide Deep Search -->
    <section class="deep-search">
      <form onsubmit={handleSearch} class="search-box">
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search the 4,800-line Field Guide (e.g., 'Damascus resupply', 'water filter')" 
          class="search-input"
        />
        <button type="submit" class="search-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </button>
      </form>
    </section>

    <!-- QUICK ACCESS: The Hiker's Toolkit -->
    <section class="instruments">
      <div class="section-header">
        <h2 class="section-title">THE HIKER'S COCKPIT</h2>
      </div>
      <div class="quick-grid">
        {#each quickAccess as card}
          <a href={card.href} class="quick-card accent-{card.accent}">
            <div class="quick-icon">{@html card.icon}</div>
            <div class="quick-content">
              <h3 class="quick-title">{card.title}</h3>
              <p class="quick-subtitle">{card.subtitle}</p>
            </div>
            <div class="quick-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- GEAR LAB: The Research Engine -->
    {#if isEnabled('GEAR_LAB')}
      <section class="gear-lab-preview">
        <div class="lab-card">
          <div class="lab-header">
            <h3 class="lab-title">AT GEAR RESEARCH</h3>
            <span class="lab-badge">2026 DATA</span>
          </div>
          <p class="lab-desc">Thru-hiking gear research for the Appalachian Trail across budget tiers. Compare price vs. weight across all systems.</p>
          <div class="lab-stats">
            <div class="lab-stat">
              <span class="stat-val">Budget</span>
              <span class="stat-label">Tiers</span>
            </div>
            <div class="lab-stat">
              <span class="stat-val">AT-Tested</span>
              <span class="stat-label">Recommendations</span>
            </div>
          </div>
          <a href="/tools#gearlab" class="lab-cta">Open Gear Lab</a>
        </div>
      </section>
    {/if}
  </main>

  <footer class="footer">
    <p>HOGG COUNTRY AT NOBO 2026 | BUILT FOR TRIPLE-O</p>
  </footer>
</div>

<style>
  .cockpit {
    --bg: #0a0c10;
    --card: #14171d;
    --accent: #a6b589;
    --terra: #d97706;
    --marker: #f0e000;
    --pine: #4d594a;
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    
    font-family: Oswald, system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding: 0;
    margin: 0;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .cockpit.mounted {
    opacity: 1;
  }

  .ambient-glow {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 50% 50%, rgba(166, 181, 137, 0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    position: relative;
    z-index: 1;
  }

  .header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(10, 12, 16, 0.8);
    backdrop-filter: blur(10px);
  }

  .header-inner {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-mark {
    color: var(--accent);
    font-weight: 900;
    font-size: 1.5rem;
    margin-right: 0.5rem;
  }

  .logo-text {
    letter-spacing: 0.1em;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .countdown-value {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--terra);
    letter-spacing: 0.05em;
  }

  /* DAILY BLAZE */
  .daily-blaze {
    background: linear-gradient(135deg, #1a1d24 0%, #14171d 100%);
    border: 1px solid rgba(166, 181, 137, 0.2);
    border-radius: 1rem;
    padding: 2.5rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
  }

  .daily-blaze::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--accent);
  }

  .blaze-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .blaze-tag {
    color: var(--accent);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.2em;
  }

  .blaze-ref {
    color: var(--text-muted);
    font-size: 0.75rem;
    font-style: italic;
  }

  .blaze-text {
    font-size: 1.5rem;
    font-weight: 500;
    line-height: 1.4;
    color: var(--text);
    margin: 0 0 1.5rem;
    font-family: Lato, system-ui, sans-serif;
  }

  .blaze-mission {
    font-size: 0.65rem;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* DEEP SEARCH */
  .deep-search {
    margin-bottom: 2rem;
  }

  .search-box {
    display: flex;
    background: var(--card);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 0.5rem;
    padding: 0.5rem;
    transition: border-color 0.3s ease;
  }

  .search-box:focus-within {
    border-color: var(--accent);
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text);
    padding: 0.75rem 1rem;
    font-family: Lato, sans-serif;
    font-size: 1rem;
    outline: none;
  }

  .search-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 0 1rem;
    cursor: pointer;
  }

  .search-btn svg {
    width: 20px;
    height: 20px;
  }

  /* QUICK GRID */
  .section-title {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .quick-card {
    display: flex;
    align-items: center;
    background: var(--card);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 0.75rem;
    padding: 1.25rem;
    text-decoration: none;
    transition: all 0.2s ease;
    gap: 1rem;
  }

  .quick-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
    background: #1c1f26;
  }

  .quick-icon {
    color: var(--accent);
    width: 24px;
    height: 24px;
  }

  .quick-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: var(--text);
  }

  .quick-subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
    font-family: Lato, sans-serif;
  }

  .quick-arrow {
    margin-left: auto;
    color: var(--text-muted);
    opacity: 0.3;
  }

  .quick-arrow svg {
    width: 16px;
    height: 16px;
  }

  /* GEAR LAB */
  .lab-card {
    background: linear-gradient(135deg, #14171d 0%, #0a0c10 100%);
    border: 1px solid rgba(217, 119, 6, 0.3);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 3rem;
  }

  .lab-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .lab-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--terra);
  }

  .lab-badge {
    background: var(--terra);
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .lab-desc {
    font-family: Lato, sans-serif;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .lab-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
  }

  .stat-val {
    display: block;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .lab-cta {
    display: inline-block;
    background: var(--terra);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
    transition: background 0.2s ease;
  }

  .lab-cta:hover {
    background: #b45309;
  }

  .footer {
    text-align: center;
    padding: 4rem 1rem;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    .quick-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
