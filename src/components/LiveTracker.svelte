<script>
  // Trail Journal Live Entry - A living, breathing journal entry that updates in real-time
  // Like a page that's still being written

  // Current status - can be updated manually or fetched
  let { status = "Somewhere on the Appalachian Trail...", lastUpdated = new Date().toISOString() } = $props();

  // Format the timestamp
  function formatTime(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
</script>

<div class="live-tracker">
  <!-- Journal page header with torn edge effect -->
  <div class="journal-header">
    <div class="live-badge">
      <span class="live-dot"></span>
      <span class="live-text">LIVE</span>
    </div>
    <span class="journal-date hand">{formatTime(lastUpdated)}</span>
  </div>

  <!-- Main journal content -->
  <div class="journal-body">
    <h3 class="journal-title">Currently on Trail</h3>

    <p class="journal-note hand">
      {status}
    </p>

    <!-- Embedded map preview -->
    <div class="map-preview">
      <iframe
        src="https://share.garmin.com/theman1"
        title="Live trail location"
        loading="lazy"
      ></iframe>
      <div class="map-overlay">
        <a
          href="https://share.garmin.com/theman1"
          target="_blank"
          rel="noopener noreferrer"
          class="map-link"
        >
          <span>View Full Map</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Footer with Garmin branding -->
    <div class="journal-footer">
      <span class="tracking-via">Tracking via Garmin inReach</span>
    </div>
  </div>

  <!-- Decorative corner tape -->
  <div class="tape tape-tl"></div>
  <div class="tape tape-tr"></div>
</div>

<style>
  .live-tracker {
    position: relative;
    background: #fffef9;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 4px;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.06),
      0 8px 24px rgba(0,0,0,0.04),
      inset 0 1px 0 rgba(255,255,255,0.8);
    overflow: hidden;
    max-width: 400px;
    margin: 1.5rem auto;

    /* Subtle paper texture */
    background-image:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 28px,
        rgba(77, 89, 74, 0.03) 28px,
        rgba(77, 89, 74, 0.03) 29px
      );
  }

  /* Decorative tape corners */
  .tape {
    position: absolute;
    width: 60px;
    height: 24px;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.7), rgba(240, 224, 0, 0.5));
    z-index: 2;
  }

  .tape-tl {
    top: -4px;
    left: -12px;
    transform: rotate(-45deg);
  }

  .tape-tr {
    top: -4px;
    right: -12px;
    transform: rotate(45deg);
  }

  .journal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px dashed var(--border, #e6e1d4);
    background: rgba(166, 181, 137, 0.08);
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.6rem;
    background: #dc2626;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #fff;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.85);
    }
  }

  .live-text {
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.08em;
  }

  .journal-date {
    font-size: 0.95rem;
    color: var(--muted, #5c665a);
  }

  .journal-body {
    padding: 1rem 1.25rem 1rem;
  }

  .journal-title {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin: 0 0 0.5rem;
    letter-spacing: 0.02em;
  }

  .journal-note {
    font-size: 1.15rem;
    color: var(--fg, #333);
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  .map-preview {
    position: relative;
    aspect-ratio: 16 / 10;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border, #e6e1d4);
    background: #e8e4da;
  }

  .map-preview iframe {
    width: 100%;
    height: 100%;
    border: none;
    pointer-events: none;
  }

  .map-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 0.5rem;
    background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%);
  }

  .map-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    background: rgba(255,255,255,0.95);
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-decoration: none;
    transition: all 0.15s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .map-link:hover {
    background: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .map-link svg {
    width: 14px;
    height: 14px;
  }

  .journal-footer {
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px dotted var(--border, #e6e1d4);
    text-align: center;
  }

  .tracking-via {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* Handwritten font class */
  .hand {
    font-family: Caveat, "Comic Sans MS", cursive;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .live-dot {
      animation: none;
    }
  }
</style>
