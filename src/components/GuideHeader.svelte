<script>
  import { onMount } from 'svelte';

  let visible = true;
  let lastScrollY = 0;
  let scrollThreshold = 100;

  onMount(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at top of page
      if (currentScrollY < scrollThreshold) {
        visible = true;
        lastScrollY = currentScrollY;
        return;
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY + 10) {
        // Scrolling down
        visible = false;
      } else if (currentScrollY < lastScrollY - 10) {
        // Scrolling up
        visible = true;
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<header class="guide-header" class:hidden={!visible}>
  <nav class="guide-nav">
    <a href="/" class="brand font-display">Hogg Country</a>
    <div class="nav-links">
      <a href="/" class="nav-link">Home</a>
      <a href="/guide" class="nav-link is-active">Field Guide</a>
      <a href="/tools" class="nav-link">Tools</a>
    </div>
  </nav>
</header>

<style>
  .guide-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1001;
    background: linear-gradient(to bottom,
      rgba(245, 242, 232, 0.98) 0%,
      rgba(245, 242, 232, 0.95) 100%
    );
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border, #e6e1d4);
    transform: translateY(0);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .guide-header.hidden {
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
  }

  .guide-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.65rem 1.25rem;
  }

  .brand {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .brand:hover {
    color: var(--ink, #2b2f26);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-link {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    text-decoration: none;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .nav-link:hover {
    color: var(--pine, #4d594a);
    background: rgba(77, 89, 74, 0.08);
  }

  .nav-link.is-active {
    color: var(--pine, #4d594a);
    font-weight: 600;
    background: rgba(166, 181, 137, 0.2);
  }

  /* Mobile adjustments */
  @media (max-width: 500px) {
    .guide-nav {
      padding: 0.5rem 1rem;
    }

    .brand {
      font-size: 1rem;
    }

    .nav-link {
      font-size: 0.8rem;
      padding: 0.3rem 0.5rem;
    }
  }

  /* Print: hide header */
  @media print {
    .guide-header {
      display: none !important;
    }
  }
</style>
