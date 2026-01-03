<script lang="ts">
  import { onMount } from 'svelte';

  // Intersection Observer for fade-in animations
  let sections: HTMLElement[] = [];

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  });
</script>

<div class="zen-page">
  <!-- Header -->
  <header class="zen-header">
    <div class="header-inner">
      <a href="/" class="logo">Hogg Country</a>
      <nav class="nav">
        <a href="/guide">Guide</a>
        <a href="/tools">Tools</a>
        <a href="/trips">Journey</a>
        <a href="/about">About</a>
      </nav>
    </div>
  </header>

  <!-- Hero -->
  <section class="zen-hero fade-section" bind:this={sections[0]}>
    <h1 class="hero-headline">One step at a time.</h1>
    <p class="hero-sub">
      2,194 miles. Georgia to Maine. February 2026.
    </p>
    <a href="/guide" class="cta">Begin the Journey</a>
  </section>

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Mission -->
  <section class="zen-mission fade-section" bind:this={sections[1]}>
    <p class="mission-text">
      In February 2026, I'll set out from Springer Mountain, Georgia
      with nothing but a pack on my back and a dream ahead.
      The Appalachian Trail stretches 2,194 miles north to Katahdin, Maine &mdash;
      six months of ridgelines, river crossings, and quiet mornings in the woods.
      This is Hogg Country, and every step is part of the story.
    </p>
  </section>

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Three Paths -->
  <section class="zen-paths fade-section" bind:this={sections[2]}>
    <h2 class="section-label">Choose Your Path</h2>
    <div class="paths-grid">
      <a href="/guide" class="path-card">
        <span class="path-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </span>
        <h3 class="path-title">Field Guide</h3>
        <p class="path-desc">20 chapters of trail wisdom</p>
      </a>

      <a href="/tools" class="path-card">
        <span class="path-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <h3 class="path-title">Trail Tools</h3>
        <p class="path-desc">12 interactive calculators</p>
      </a>

      <a href="/trips" class="path-card">
        <span class="path-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </span>
        <h3 class="path-title">Journey</h3>
        <p class="path-desc">Trip reports and videos</p>
      </a>
    </div>
  </section>

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Recent -->
  <section class="zen-recent fade-section" bind:this={sections[3]}>
    <h2 class="section-label">Latest from the Trail</h2>
    <a href="/guide/gear-philosophy" class="recent-card">
      <span class="recent-meta">Field Guide</span>
      <h3 class="recent-title">The Art of Gear Philosophy</h3>
      <p class="recent-excerpt">
        Every ounce tells a story. Learning to distinguish between
        what you need and what you want is the first step toward
        freedom on the trail.
      </p>
      <span class="recent-link">Read more</span>
    </a>
  </section>

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Quote -->
  <section class="zen-quote fade-section" bind:this={sections[4]}>
    <blockquote>
      <p>"The trail provides."</p>
      <cite>Ancient Hiker Wisdom</cite>
    </blockquote>
  </section>

  <!-- Footer -->
  <footer class="zen-footer fade-section" bind:this={sections[5]}>
    <p class="footer-text">
      Hogg Country &middot; Chris "Triple-O" Hogg &middot; AT NOBO 2026
    </p>
  </footer>
</div>

<style>
  /* Base Reset & Page Container */
  .zen-page {
    --zen-bg: #f5f2e8;
    --zen-fg: #4a4a4a;
    --zen-muted: #7a7a72;
    --zen-pine: #5c665a;
    --zen-terra: #d97706;
    --zen-border: #e0ddd4;
    --zen-card: #ffffff;

    min-height: 100vh;
    background: var(--zen-bg);
    color: var(--zen-fg);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  /* Fade Animation */
  .fade-section {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }

  .fade-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .zen-header {
    padding: 2rem 1.5rem;
    text-align: center;
  }

  .header-inner {
    max-width: 600px;
    margin: 0 auto;
  }

  .logo {
    font-family: 'Oswald', sans-serif;
    font-weight: 300;
    font-size: 1.25rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--zen-pine);
    text-decoration: none;
    display: block;
    margin-bottom: 1rem;
  }

  .nav {
    display: flex;
    justify-content: center;
    gap: 2rem;
  }

  .nav a {
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--zen-muted);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .nav a:hover {
    color: var(--zen-pine);
  }

  /* Hero */
  .zen-hero {
    padding: 6rem 1.5rem 5rem;
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
  }

  .hero-headline {
    font-family: 'Oswald', sans-serif;
    font-weight: 300;
    font-size: clamp(2.5rem, 6vw, 4rem);
    letter-spacing: 0.02em;
    color: var(--zen-pine);
    margin: 0 0 1.5rem;
    line-height: 1.1;
  }

  .hero-sub {
    font-size: 1.1rem;
    font-weight: 300;
    color: var(--zen-muted);
    letter-spacing: 0.03em;
    margin: 0 0 2.5rem;
  }

  .cta {
    display: inline-block;
    padding: 0.875rem 2rem;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #fff;
    background: var(--zen-terra);
    border-radius: 2px;
    text-decoration: none;
    transition: background 0.3s ease, transform 0.2s ease;
  }

  .cta:hover {
    background: #c06a05;
    transform: translateY(-1px);
  }

  /* Divider */
  .divider {
    width: 40px;
    height: 1px;
    background: var(--zen-border);
    margin: 0 auto;
  }

  /* Mission */
  .zen-mission {
    padding: 5rem 1.5rem;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }

  .mission-text {
    font-size: 1.125rem;
    font-weight: 300;
    line-height: 1.9;
    color: var(--zen-fg);
    margin: 0;
    letter-spacing: 0.01em;
  }

  /* Three Paths */
  .zen-paths {
    padding: 5rem 1.5rem;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }

  .section-label {
    font-family: 'Oswald', sans-serif;
    font-weight: 300;
    font-size: 0.8rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--zen-muted);
    margin: 0 0 3rem;
  }

  .paths-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  @media (max-width: 640px) {
    .paths-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      max-width: 280px;
      margin: 0 auto;
    }
  }

  .path-card {
    padding: 2rem 1.5rem;
    background: var(--zen-card);
    border: 1px solid var(--zen-border);
    border-radius: 4px;
    text-decoration: none;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .path-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }

  .path-icon {
    display: block;
    width: 32px;
    height: 32px;
    margin: 0 auto 1.25rem;
    color: var(--zen-pine);
  }

  .path-icon svg {
    width: 100%;
    height: 100%;
  }

  .path-title {
    font-family: 'Oswald', sans-serif;
    font-weight: 400;
    font-size: 1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--zen-pine);
    margin: 0 0 0.5rem;
  }

  .path-desc {
    font-size: 0.875rem;
    color: var(--zen-muted);
    margin: 0;
    font-weight: 300;
  }

  /* Recent */
  .zen-recent {
    padding: 5rem 1.5rem;
    max-width: 550px;
    margin: 0 auto;
    text-align: center;
  }

  .recent-card {
    display: block;
    padding: 2.5rem 2rem;
    background: var(--zen-card);
    border: 1px solid var(--zen-border);
    border-radius: 4px;
    text-decoration: none;
    text-align: left;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .recent-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
  }

  .recent-meta {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--zen-terra);
    margin-bottom: 0.75rem;
  }

  .recent-title {
    font-family: 'Oswald', sans-serif;
    font-weight: 400;
    font-size: 1.25rem;
    letter-spacing: 0.02em;
    color: var(--zen-pine);
    margin: 0 0 1rem;
    line-height: 1.3;
  }

  .recent-excerpt {
    font-size: 0.95rem;
    font-weight: 300;
    line-height: 1.8;
    color: var(--zen-fg);
    margin: 0 0 1.25rem;
  }

  .recent-link {
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--zen-terra);
  }

  /* Quote */
  .zen-quote {
    padding: 6rem 1.5rem;
    text-align: center;
    max-width: 500px;
    margin: 0 auto;
  }

  .zen-quote blockquote {
    margin: 0;
  }

  .zen-quote p {
    font-family: 'Oswald', sans-serif;
    font-weight: 300;
    font-size: clamp(1.5rem, 4vw, 2rem);
    letter-spacing: 0.02em;
    color: var(--zen-pine);
    margin: 0 0 1rem;
    font-style: italic;
  }

  .zen-quote cite {
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--zen-muted);
    font-style: normal;
  }

  /* Footer */
  .zen-footer {
    padding: 4rem 1.5rem 3rem;
    text-align: center;
  }

  .footer-text {
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--zen-muted);
    margin: 0;
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .zen-header {
      padding: 1.5rem 1rem;
    }

    .nav {
      gap: 1.25rem;
    }

    .nav a {
      font-size: 0.75rem;
    }

    .zen-hero {
      padding: 4rem 1rem 3.5rem;
    }

    .zen-mission,
    .zen-paths,
    .zen-recent,
    .zen-quote {
      padding: 3.5rem 1rem;
    }

    .recent-card {
      padding: 2rem 1.5rem;
    }
  }
</style>
