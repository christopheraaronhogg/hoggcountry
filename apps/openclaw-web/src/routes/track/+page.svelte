<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  const latestSignal = $derived.by(() => {
    if (!data.latestFixAt) return 'Preview';
    const date = new Date(data.latestFixAt);
    if (Number.isNaN(date.getTime())) return 'Signal received';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  });
</script>

<svelte:head>
  <title>Live Tracking | Hogg Country</title>
  <meta name="description" content="Mission Control live GPS tracking for the Hogg Country Appalachian Trail thru-hike." />
</svelte:head>

<div class="mission-control-page">
  <div class="scanlines" aria-hidden="true"></div>

  <div class="mission-control">
    <header class="mc-header">
      <div class="mc-logo">
        <a href="/">&larr; HOGG COUNTRY</a>
        <span class="mc-title">Mission Control</span>
      </div>
      <div class="status-indicator">
        <div class="status-light" aria-hidden="true"></div>
        <span class="status-text">Signal Active</span>
      </div>
    </header>

    <div class="mc-grid">
      <section class="map-panel" aria-label="GPS tracking feed">
        <div class="panel-header">
          <span class="panel-title">GPS Tracking Feed</span>
          <span class="panel-status"><span class="blink" aria-hidden="true">●</span> LIVE</span>
        </div>

        <div class="map-container">
          <iframe src={data.liveTrackingUrl} title="Live GPS Tracking Map" loading="lazy"></iframe>
          <div class="map-overlay" aria-hidden="true">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
          </div>
        </div>
      </section>

      <aside class="telemetry-panel" aria-label="Trail telemetry">
        <div class="data-block">
          <div class="data-label">Days on Trail</div>
          <div class="data-value">{data.daysOnTrail > 0 ? data.daysOnTrail : '--'}</div>
          <div class="data-sub">Started: {data.startDateLabel}</div>
        </div>

        <div class="data-block">
          <div class="data-label">Last Signal</div>
          <div class="data-value compact">{latestSignal}</div>
          <div class="data-sub">{data.latestFixLabel}</div>
        </div>

        <div class="data-block">
          <div class="data-label">AT Location</div>
          <div class="data-value compact">
            {#if data.latestTrailLocation}
              {data.latestTrailLocation.label}
            {:else}
              --
            {/if}
          </div>
          <div class="data-sub">
            {#if data.latestTrailLocation}
              {data.latestTrailLocation.distanceToTrailMiles.toFixed(1)} mi from Garmin fix
            {:else}
              Awaiting snapped trail mile
            {/if}
          </div>
        </div>

        <div class="progress-block">
          <div class="progress-header">
            <span class="data-label">Trail Progress</span>
            <span class="data-value percent">{data.progressPercent}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style={`width: ${data.progressPercent}%`}></div>
          </div>
          <div class="progress-markers">
            <span>GA</span><span>NC</span><span>TN</span><span>VA</span><span>WV</span><span>MD</span><span>PA</span><span>NJ</span><span>NY</span><span>CT</span><span>MA</span><span>VT</span><span>NH</span><span>ME</span>
          </div>
        </div>

        <div class="waypoint-block">
          <div class="data-label waypoint-title">Key Waypoints</div>
          <div class="waypoint-item">
            <div class="waypoint-marker"></div>
            <span class="waypoint-name">Springer Mountain</span>
            <span class="waypoint-mile">mi 0.0</span>
          </div>
          <div class="waypoint-item">
            <div class="waypoint-marker current"></div>
            <span class="waypoint-name">Current Position</span>
            <span class="waypoint-mile">mi {data.currentMile ? data.currentMile.toFixed(1) : '--'}</span>
          </div>
          <div class="waypoint-item">
            <div class="waypoint-marker pending"></div>
            <span class="waypoint-name">Mt. Katahdin</span>
            <span class="waypoint-mile">mi {data.trailTotalMiles.toLocaleString()}</span>
          </div>
        </div>

        <div class="system-info">
          <div class="system-row">
            <span>TRACKING ID</span>
            <span class="system-value">{data.trackingId.toUpperCase()}</span>
          </div>
          <div class="system-row">
            <span>TOTAL DISTANCE</span>
            <span class="system-value">{data.trailTotalMiles.toLocaleString()} MI</span>
          </div>
          <div class="system-row">
            <span>SYSTEM STATUS</span>
            <span class="system-value">NOMINAL</span>
          </div>
        </div>
      </aside>
    </div>

    <footer class="mc-footer">
      <span>&copy; {new Date().getFullYear()} Hogg Country Mission Control</span>
      <span>
        Powered by <a href="https://www.garmin.com/en-US/p/765374" target="_blank" rel="noopener">Garmin InReach</a>
      </span>
    </footer>
  </div>
</div>

<style>
  .mission-control-page {
    margin: -1.5rem calc(50% - 50vw) -4rem;
    min-height: calc(100vh - 52px);
    background:
      radial-gradient(ellipse at 50% 0%, rgba(0, 255, 65, 0.03) 0%, transparent 60%),
      radial-gradient(ellipse at 0% 50%, rgba(0, 255, 65, 0.02) 0%, transparent 40%),
      radial-gradient(ellipse at 100% 50%, rgba(0, 255, 65, 0.02) 0%, transparent 40%),
      #0a0f0a;
    color: #c8d6c8;
    font-family: 'Courier New', Monaco, Consolas, monospace;
    position: relative;
    overflow: hidden;
  }

  .scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px);
    opacity: 0.3;
  }

  .mission-control {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
    position: relative;
    z-index: 2;
  }

  .mc-header,
  .map-panel,
  .data-block,
  .progress-block,
  .waypoint-block,
  .system-info,
  .mc-footer {
    border: 1px solid #1a2f1a;
    background: #0f1610;
    position: relative;
  }

  .mc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
  }

  .mc-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff41, transparent);
  }

  .mc-logo,
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mc-logo a,
  .mc-footer a {
    color: #00cc33;
    text-decoration: none;
  }

  .mc-logo a:hover,
  .mc-footer a:hover {
    color: #00ff41;
    text-decoration: underline;
  }

  .mc-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: #00ff41;
    text-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    text-transform: uppercase;
  }

  .status-light {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #00ff41;
    box-shadow: 0 0 10px #00ff41, 0 0 20px rgba(0, 255, 65, 0.3);
    animation: pulse 2s ease-in-out infinite;
  }

  .status-text,
  .panel-status {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #00ff41;
  }

  .mc-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 1rem;
  }

  .map-panel {
    padding: 1rem;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #1a2f1a;
  }

  .panel-title,
  .data-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #5a6b5a;
  }

  .map-container {
    aspect-ratio: 16 / 10;
    width: 100%;
    background: #000;
    border: 1px solid #1a2f1a;
    position: relative;
    overflow: hidden;
  }

  .map-container iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .map-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 1px solid rgba(0, 255, 65, 0.1);
    box-shadow: inset 0 0 60px rgba(0, 255, 65, 0.05);
  }

  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: #00ff41;
    border-style: solid;
    border-width: 0;
  }

  .corner.tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
  .corner.tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; }
  .corner.bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; }
  .corner.br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; }

  .telemetry-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .data-block,
  .progress-block,
  .waypoint-block,
  .system-info {
    padding: 1rem;
  }

  .data-block::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: rgba(0, 255, 65, 0.1);
  }

  .data-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #00ff41;
    text-shadow: 0 0 15px rgba(0, 255, 65, 0.3);
    line-height: 1.05;
  }

  .data-value.compact {
    font-size: 1.12rem;
  }

  .data-value.percent {
    font-size: 1rem;
  }

  .data-sub {
    font-size: 0.75rem;
    color: #5a6b5a;
    margin-top: 0.25rem;
    overflow-wrap: anywhere;
  }

  .progress-header,
  .system-row,
  .mc-footer {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }

  .progress-bar-container {
    height: 24px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid #1a2f1a;
    position: relative;
    overflow: hidden;
    margin-top: 0.75rem;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #00cc33, #00ff41);
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
    transition: width 0.5s ease;
    position: relative;
  }

  .progress-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background: #fff;
    box-shadow: 0 0 10px #fff;
    animation: progressPulse 1s ease-in-out infinite;
  }

  .progress-markers {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.65rem;
    color: #5a6b5a;
  }

  .waypoint-title {
    margin-bottom: 0.75rem;
  }

  .waypoint-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #1a2f1a;
  }

  .waypoint-item:last-child {
    border-bottom: none;
  }

  .waypoint-marker {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00ff41;
    box-shadow: 0 0 8px #00ff41;
    flex: 0 0 auto;
  }

  .waypoint-marker.pending {
    background: #5a6b5a;
    box-shadow: none;
  }

  .waypoint-marker.current {
    background: #ffcc00;
    box-shadow: 0 0 8px #ffcc00;
    animation: pulse 1s ease-in-out infinite;
  }

  .waypoint-name {
    flex: 1;
    font-size: 0.85rem;
  }

  .waypoint-mile,
  .system-info {
    font-size: 0.75rem;
    color: #5a6b5a;
  }

  .system-row {
    padding: 0.25rem 0;
    border-bottom: 1px dotted #1a2f1a;
  }

  .system-row:last-child {
    border-bottom: none;
  }

  .system-value {
    color: #00cc33;
    text-align: right;
  }

  .mc-footer {
    margin-top: 1rem;
    padding: 1rem;
    font-size: 0.75rem;
    color: #5a6b5a;
  }

  .blink {
    animation: blink 1s steps(1) infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  @keyframes progressPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 1024px) {
    .mc-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .mission-control-page {
      margin-inline: calc(50% - 50vw);
    }

    .mc-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .mc-logo {
      flex-direction: column;
    }

    .data-value {
      font-size: 1.5rem;
    }

    .map-container {
      aspect-ratio: 4 / 3;
    }

    .mc-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
