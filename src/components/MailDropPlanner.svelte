<script>
  /** @type {{ trailContext: any }} */
  let { trailContext } = $props();

  // Active section
  let activeSection = $state('schedule');

  // User's name for labels
  let hikerName = $state('');

  // Recommended mail drop locations
  const mailDrops = [
    {
      id: 'hotsprings',
      town: 'Hot Springs',
      state: 'NC',
      zip: '28743',
      mile: 274,
      holdTime: 30,
      reliability: 'excellent',
      notes: 'One of the most reliable mail drops on the AT. Hiker-friendly post office.',
      poAddress: '170 Bridge St, Hot Springs, NC 28743',
      poHours: 'M-F 8:30-12:00, 12:30-4:00; Sat 9:00-11:00'
    },
    {
      id: 'damascus',
      town: 'Damascus',
      state: 'VA',
      zip: '24236',
      mile: 469,
      holdTime: 30,
      reliability: 'excellent',
      notes: 'AT hub town. Very hiker-friendly, generous hold times. Trail Days in May.',
      poAddress: '206 W Laurel Ave, Damascus, VA 24236',
      poHours: 'M-F 8:00-12:00, 1:00-4:00; Sat 9:00-11:00'
    },
    {
      id: 'daleville',
      town: 'Daleville',
      state: 'VA',
      zip: '24083',
      mile: 728,
      holdTime: 30,
      reliability: 'good',
      notes: 'Easy access from trail. Grocery and restaurants nearby.',
      poAddress: '138 Roanoke Rd, Daleville, VA 24083',
      poHours: 'M-F 8:30-12:00, 1:00-4:30; Sat 9:00-11:00'
    },
    {
      id: 'harpersferry',
      town: 'Harpers Ferry',
      state: 'WV',
      zip: '25425',
      mile: 1025,
      holdTime: 30,
      reliability: 'excellent',
      notes: 'Psychological halfway point. ATC headquarters. Very reliable.',
      poAddress: '1000 Washington St, Harpers Ferry, WV 25425',
      poHours: 'M-F 8:00-4:00; Sat 9:00-12:00'
    },
    {
      id: 'duncannon',
      town: 'Duncannon',
      state: 'PA',
      zip: '17020',
      mile: 1145,
      holdTime: 30,
      reliability: 'good',
      notes: 'Excellent PO + hostel logistics. Doyle Hotel nearby.',
      poAddress: '2 N High St, Duncannon, PA 17020',
      poHours: 'M-F 8:00-12:00, 1:00-4:30; Sat 8:00-11:00'
    },
    {
      id: 'hanover',
      town: 'Hanover',
      state: 'NH',
      zip: '03755',
      mile: 1747,
      holdTime: 30,
      reliability: 'excellent',
      notes: 'Key resupply before the Whites. Dartmouth College town.',
      poAddress: '52 S Main St, Hanover, NH 03755',
      poHours: 'M-F 8:30-5:00; Sat 8:30-12:00'
    },
    {
      id: 'monson',
      town: 'Monson',
      state: 'ME',
      zip: '04464',
      mile: 2077,
      holdTime: 14,
      reliability: 'good',
      notes: 'Gateway to 100-Mile Wilderness. Hold time often 14 days max. Shaw\'s offers food drop services.',
      poAddress: '5 Greenville Rd, Monson, ME 04464',
      poHours: 'M-F 7:30-11:30, 12:30-4:00; Sat 8:00-11:00',
      warning: 'Shorter hold time - plan carefully!'
    }
  ];

  // User's planned mail drops (localStorage)
  let plannedDrops = $state({});

  // Load from localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      const savedDrops = localStorage.getItem('mailDropPlanner');
      if (savedDrops) {
        try {
          const parsed = JSON.parse(savedDrops);
          plannedDrops = parsed.drops || {};
          hikerName = parsed.hikerName || '';
        } catch (e) {}
      }
    }
  });

  // Save to localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mailDropPlanner', JSON.stringify({
        drops: plannedDrops,
        hikerName
      }));
    }
  });

  // Calculate arrival date for a mile marker
  function getArrivalDate(mile) {
    if (trailContext?.mode === 'planning') {
      const startDate = new Date(trailContext.startDate);
      const pace = trailContext.pace || 15;
      const daysToMile = Math.floor(mile / pace);
      const arrivalDate = new Date(startDate);
      arrivalDate.setDate(arrivalDate.getDate() + daysToMile);
      return arrivalDate;
    } else {
      const currentMile = trailContext?.currentMile || 0;
      const pace = trailContext?.actualPace || 15;
      const milesRemaining = Math.max(0, mile - currentMile);
      const daysUntil = Math.ceil(milesRemaining / pace);
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + daysUntil);
      return arrivalDate;
    }
  }

  // Calculate recommended ship date (7-10 days before arrival)
  function getShipDate(arrivalDate) {
    const shipDate = new Date(arrivalDate);
    shipDate.setDate(shipDate.getDate() - 10);
    return shipDate;
  }

  // Format date for display
  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  // Format date for label (MM/DD/YYYY)
  function formatLabelDate(date) {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }

  // Toggle drop planning status
  function toggleDrop(dropId, field) {
    if (!plannedDrops[dropId]) {
      plannedDrops[dropId] = { planned: false, shipped: false, received: false };
    }
    plannedDrops[dropId][field] = !plannedDrops[dropId][field];
    plannedDrops = { ...plannedDrops };
  }

  // Generate label text
  function generateLabel(drop) {
    const arrivalDate = getArrivalDate(drop.mile);
    const name = hikerName.trim() || 'YOUR NAME';
    return `${name.toUpperCase()}
GENERAL DELIVERY
${drop.town.toUpperCase()}, ${drop.state} ${drop.zip}
PLEASE HOLD FOR AT HIKER
ETA: ${formatLabelDate(arrivalDate)}`;
  }

  // Copy label to clipboard
  async function copyLabel(drop) {
    const label = generateLabel(drop);
    try {
      await navigator.clipboard.writeText(label);
      copiedId = drop.id;
      setTimeout(() => copiedId = null, 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }

  let copiedId = $state(null);

  // Get current mile from context
  let currentMile = $derived(trailContext?.currentMile || 0);

  // Count stats
  let plannedCount = $derived(Object.values(plannedDrops).filter(d => d.planned).length);
  let shippedCount = $derived(Object.values(plannedDrops).filter(d => d.shipped).length);
  let receivedCount = $derived(Object.values(plannedDrops).filter(d => d.received).length);

  // Get status for a drop
  function getDropStatus(drop) {
    const status = plannedDrops[drop.id] || { planned: false, shipped: false, received: false };
    if (status.received) return 'received';
    if (status.shipped) return 'shipped';
    if (status.planned) return 'planned';
    if (drop.mile < currentMile - 50) return 'passed';
    if (drop.mile >= currentMile - 50 && drop.mile < currentMile + 200) return 'upcoming';
    return 'future';
  }
</script>

<div class="maildrop-planner">
  <!-- Header with postal aesthetic -->
  <header class="postal-header">
    <div class="postal-stamp">
      <span class="stamp-icon">📬</span>
    </div>
    <div class="header-content">
      <h2 class="header-title">Mail Drop Planner</h2>
      <p class="header-tagline">USPS General Delivery Tracking</p>
    </div>
    <div class="tracking-stats">
      <div class="stat-badge" class:active={plannedCount > 0}>
        <span class="stat-num">{plannedCount}</span>
        <span class="stat-label">Planned</span>
      </div>
      <div class="stat-badge shipped" class:active={shippedCount > 0}>
        <span class="stat-num">{shippedCount}</span>
        <span class="stat-label">In Transit</span>
      </div>
      <div class="stat-badge received" class:active={receivedCount > 0}>
        <span class="stat-num">{receivedCount}</span>
        <span class="stat-label">Received</span>
      </div>
    </div>
  </header>

  <!-- Hiker Name Input -->
  <div class="name-field">
    <label class="field-label">
      <span class="label-icon">👤</span>
      Your Legal Name (required for pickup)
    </label>
    <input
      type="text"
      bind:value={hikerName}
      placeholder="Enter your full legal name as shown on ID"
      class="name-input"
    />
  </div>

  <!-- Navigation Tabs -->
  <nav class="section-nav">
    <button
      class="nav-btn"
      class:active={activeSection === 'schedule'}
      onclick={() => activeSection = 'schedule'}
    >
      <span class="nav-icon">📦</span>
      <span class="nav-text">Schedule</span>
    </button>
    <button
      class="nav-btn"
      class:active={activeSection === 'labels'}
      onclick={() => activeSection = 'labels'}
    >
      <span class="nav-icon">🏷️</span>
      <span class="nav-text">Labels</span>
    </button>
    <button
      class="nav-btn"
      class:active={activeSection === 'rules'}
      onclick={() => activeSection = 'rules'}
    >
      <span class="nav-icon">📋</span>
      <span class="nav-text">Rules</span>
    </button>
  </nav>

  <!-- Schedule Section -->
  {#if activeSection === 'schedule'}
    <div class="schedule-panel">
      <div class="pace-banner">
        <span class="pace-icon">🚶</span>
        <span class="pace-text">
          {#if trailContext?.mode === 'planning'}
            Dates based on <strong>{new Date(trailContext.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> start at <strong>{trailContext.pace} mi/day</strong>
          {:else}
            Dates based on <strong>{trailContext?.actualPace || 15} mi/day</strong> pace from mile <strong>{currentMile}</strong>
          {/if}
        </span>
      </div>

      <div class="drops-grid">
        {#each mailDrops as drop}
          {@const arrivalDate = getArrivalDate(drop.mile)}
          {@const shipDate = getShipDate(arrivalDate)}
          {@const status = plannedDrops[drop.id] || { planned: false, shipped: false, received: false }}
          {@const dropStatus = getDropStatus(drop)}

          <article class="package-card status-{dropStatus}">
            <!-- Status Ribbon -->
            {#if dropStatus === 'received'}
              <div class="status-ribbon received">Received</div>
            {:else if dropStatus === 'shipped'}
              <div class="status-ribbon shipped">In Transit</div>
            {:else if dropStatus === 'upcoming'}
              <div class="status-ribbon upcoming">Coming Up</div>
            {/if}

            <div class="card-body">
              <!-- Location Header -->
              <div class="location-row">
                <div class="location-info">
                  <h3 class="town-name">{drop.town}</h3>
                  <span class="state-badge">{drop.state}</span>
                </div>
                <div class="mile-marker">
                  <span class="mile-value">{drop.mile}</span>
                  <span class="mile-unit">mi</span>
                </div>
              </div>

              <!-- Date Timeline -->
              <div class="date-timeline">
                <div class="timeline-point ship">
                  <div class="point-marker"></div>
                  <div class="point-info">
                    <span class="point-label">Ship By</span>
                    <span class="point-date">{formatDate(shipDate)}</span>
                  </div>
                </div>
                <div class="timeline-track"></div>
                <div class="timeline-point arrive">
                  <div class="point-marker"></div>
                  <div class="point-info">
                    <span class="point-label">Arrive</span>
                    <span class="point-date">{formatDate(arrivalDate)}</span>
                  </div>
                </div>
              </div>

              <!-- Meta Tags -->
              <div class="meta-tags">
                <span class="tag hold-tag" class:warning={drop.holdTime < 30}>
                  <span class="tag-icon">⏱️</span>
                  {drop.holdTime} day hold
                </span>
                <span class="tag reliability-tag {drop.reliability}">
                  {#if drop.reliability === 'excellent'}★★★{:else}★★☆{/if}
                  {drop.reliability}
                </span>
              </div>

              <!-- Warning -->
              {#if drop.warning}
                <div class="warning-banner">
                  <span class="warn-icon">⚠️</span>
                  <span class="warn-text">{drop.warning}</span>
                </div>
              {/if}

              <!-- Notes -->
              <p class="drop-notes">{drop.notes}</p>

              <!-- Action Buttons -->
              <div class="action-row">
                <button
                  class="track-btn plan"
                  class:checked={status.planned}
                  onclick={() => toggleDrop(drop.id, 'planned')}
                >
                  <span class="btn-check">{status.planned ? '✓' : '○'}</span>
                  <span class="btn-label">Plan</span>
                </button>
                <button
                  class="track-btn ship"
                  class:checked={status.shipped}
                  onclick={() => toggleDrop(drop.id, 'shipped')}
                  disabled={!status.planned}
                >
                  <span class="btn-check">{status.shipped ? '✓' : '○'}</span>
                  <span class="btn-label">Ship</span>
                </button>
                <button
                  class="track-btn receive"
                  class:checked={status.received}
                  onclick={() => toggleDrop(drop.id, 'received')}
                  disabled={!status.shipped}
                >
                  <span class="btn-check">{status.received ? '✓' : '○'}</span>
                  <span class="btn-label">Receive</span>
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Labels Section -->
  {#if activeSection === 'labels'}
    <div class="labels-panel">
      {#if !hikerName.trim()}
        <div class="name-alert">
          <span class="alert-icon">☝️</span>
          <span class="alert-text">Enter your name above to generate shipping labels</span>
        </div>
      {/if}

      <div class="format-card">
        <div class="format-header">
          <span class="format-icon">📋</span>
          <h4 class="format-title">Required Label Format</h4>
        </div>
        <div class="format-preview">
          <pre class="label-preview">{hikerName.trim().toUpperCase() || 'YOUR NAME'}
GENERAL DELIVERY
CITY, STATE ZIP
PLEASE HOLD FOR AT HIKER
ETA: MM/DD/YYYY</pre>
        </div>
        <div class="format-rules">
          <div class="format-rule">
            <span class="rule-bullet">●</span>
            Write on <strong>ALL SIX sides</strong> of box
          </div>
          <div class="format-rule">
            <span class="rule-bullet">●</span>
            Use <strong>permanent marker</strong> (Sharpie)
          </div>
          <div class="format-rule">
            <span class="rule-bullet">●</span>
            <strong>ETA is critical</strong> - always include it
          </div>
        </div>
      </div>

      <div class="labels-list">
        {#each mailDrops.filter(d => plannedDrops[d.id]?.planned) as drop}
          {@const arrivalDate = getArrivalDate(drop.mile)}
          <div class="label-card">
            <div class="label-header">
              <div class="label-location">
                <span class="label-town">{drop.town}, {drop.state}</span>
                <span class="label-mile">Mile {drop.mile}</span>
              </div>
              <div class="label-eta">ETA {formatDate(arrivalDate)}</div>
            </div>
            <pre class="label-content">{generateLabel(drop)}</pre>
            <button
              class="copy-button"
              class:copied={copiedId === drop.id}
              onclick={() => copyLabel(drop)}
            >
              {#if copiedId === drop.id}
                <span class="copy-icon">✓</span> Copied!
              {:else}
                <span class="copy-icon">📋</span> Copy to Clipboard
              {/if}
            </button>
          </div>
        {:else}
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p class="empty-text">No drops planned yet</p>
            <p class="empty-hint">Go to Schedule tab to plan your mail drops</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Rules Section -->
  {#if activeSection === 'rules'}
    <div class="rules-panel">
      <div class="rule-block">
        <div class="rule-header">
          <span class="rule-icon">⏰</span>
          <h4 class="rule-name">Hold Times</h4>
        </div>
        <div class="rule-grid">
          <div class="rule-row">
            <span class="rule-key">Official USPS rule</span>
            <span class="rule-value">Up to 30 days</span>
          </div>
          <div class="rule-row">
            <span class="rule-key">Large AT towns</span>
            <span class="rule-value">Usually 30 days</span>
          </div>
          <div class="rule-row warning">
            <span class="rule-key">Small/rural offices</span>
            <span class="rule-value warn">Often 7-14 days</span>
          </div>
        </div>
      </div>

      <div class="rule-block highlight">
        <div class="rule-header">
          <span class="rule-icon">📦</span>
          <h4 class="rule-name">Shipping Timeline</h4>
        </div>
        <div class="rule-grid">
          <div class="rule-row success">
            <span class="rule-key">Ship packages</span>
            <span class="rule-value good">7-10 days before arrival</span>
          </div>
          <div class="rule-row warning">
            <span class="rule-key">Never ship earlier than</span>
            <span class="rule-value warn">14 days before</span>
          </div>
          <div class="rule-row">
            <span class="rule-key">Always include</span>
            <span class="rule-value">Your ETA on the box</span>
          </div>
          <div class="rule-row">
            <span class="rule-key">If delayed</span>
            <span class="rule-value">Call the post office</span>
          </div>
        </div>
      </div>

      <div class="rule-block">
        <div class="rule-header">
          <span class="rule-icon">✍️</span>
          <h4 class="rule-name">Labeling Requirements</h4>
        </div>
        <ul class="rule-list">
          <li>Write your name on <strong>all six sides</strong></li>
          <li>Use <strong>Sharpie</strong> (permanent marker)</li>
          <li><strong>ETA matters</strong> - POs use it to prioritize</li>
          <li>Use your <strong>legal name</strong> (must match ID)</li>
        </ul>
      </div>

      <div class="rule-block tip">
        <div class="rule-header">
          <span class="rule-icon">💡</span>
          <h4 class="rule-name">Pro Tips</h4>
        </div>
        <ul class="rule-list">
          <li>Priority Mail is trackable and includes insurance</li>
          <li>Flat Rate boxes are often the best value</li>
          <li>Some hostels accept packages (often with fee)</li>
          <li>Shaw's in Monson offers 100-Mile Wilderness food drops</li>
          <li>Consider shipping non-perishables only</li>
        </ul>
      </div>
    </div>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/12-usps-mail-drop-system" class="guide-link">
    <span class="gl-icon">📖</span>
    <span class="gl-text">Full Mail Drop System Guide</span>
    <span class="gl-arrow">→</span>
  </a>
</div>

<style>
  .maildrop-planner {
    font-family: Lato, system-ui, -apple-system, sans-serif;
  }

  /* ========== POSTAL HEADER ========== */
  .postal-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(145deg, #5d4e37 0%, #3d3428 50%, #2a231a 100%);
    border-radius: 16px;
    margin-bottom: 1.25rem;
    color: #fff;
    box-shadow:
      0 8px 24px rgba(61, 52, 40, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .postal-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 5L35 15H25L30 5z' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  .postal-stamp {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #c9a45c 0%, #a07c3a 100%);
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-size: 1.75rem;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: rotate(-3deg);
    flex-shrink: 0;
  }

  .header-content {
    flex: 1;
    min-width: 0;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .header-tagline {
    font-size: 0.75rem;
    margin: 0.25rem 0 0;
    opacity: 0.7;
    letter-spacing: 0.02em;
  }

  .tracking-stats {
    display: flex;
    gap: 0.5rem;
  }

  .stat-badge {
    text-align: center;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    min-width: 54px;
    transition: all 0.2s ease;
  }

  .stat-badge.active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .stat-badge.shipped.active {
    background: rgba(230, 190, 80, 0.25);
    border-color: rgba(230, 190, 80, 0.4);
  }

  .stat-badge.received.active {
    background: rgba(120, 180, 120, 0.25);
    border-color: rgba(120, 180, 120, 0.4);
  }

  .stat-num {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    display: block;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.7;
    margin-top: 0.2rem;
  }

  /* ========== NAME FIELD ========== */
  .name-field {
    margin-bottom: 1.25rem;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine);
    margin-bottom: 0.5rem;
  }

  .label-icon {
    font-size: 0.9rem;
  }

  .name-input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 500;
    color: var(--ink);
    transition: all 0.2s ease;
    box-sizing: border-box;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .name-input::placeholder {
    color: var(--muted);
    font-weight: 400;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--pine);
    box-shadow: 0 0 0 4px rgba(77, 89, 74, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  /* ========== NAVIGATION ========== */
  .section-nav {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 1.5rem;
    padding: 0.35rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .nav-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    color: var(--pine);
    background: rgba(77, 89, 74, 0.08);
  }

  .nav-btn.active {
    background: var(--pine);
    color: #fff;
    box-shadow: 0 4px 12px rgba(77, 89, 74, 0.3);
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  /* ========== SCHEDULE PANEL ========== */
  .schedule-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .pace-banner {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, rgba(77, 89, 74, 0.08) 0%, rgba(166, 181, 137, 0.08) 100%);
    border: 1px solid rgba(77, 89, 74, 0.15);
    border-radius: 12px;
    font-size: 0.85rem;
    color: var(--pine);
  }

  .pace-icon {
    font-size: 1.1rem;
  }

  .pace-text strong {
    color: var(--ink);
  }

  .drops-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ========== PACKAGE CARD ========== */
  .package-card {
    position: relative;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transition: all 0.25s ease;
  }

  .package-card:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .package-card.status-passed {
    border-color: #d0ccc4;
    background: #faf9f7;
  }

  .package-card.status-passed .card-body {
    opacity: 0.65;
  }

  .package-card.status-upcoming {
    border-color: var(--marker);
    box-shadow: 0 4px 20px rgba(240, 224, 0, 0.2);
  }

  .package-card.status-planned {
    border-color: var(--alpine);
    background: linear-gradient(145deg, rgba(166, 181, 137, 0.06) 0%, #fff 100%);
  }

  .package-card.status-shipped {
    border-color: #c9a45c;
    background: linear-gradient(145deg, rgba(201, 164, 92, 0.08) 0%, #fff 100%);
  }

  .package-card.status-received {
    border-color: #78b478;
    background: linear-gradient(145deg, rgba(120, 180, 120, 0.06) 0%, #fff 100%);
  }

  /* Status Ribbon */
  .status-ribbon {
    position: absolute;
    top: 12px;
    right: -32px;
    padding: 0.25rem 2.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transform: rotate(45deg);
    z-index: 2;
  }

  .status-ribbon.upcoming {
    background: var(--marker);
    color: var(--ink);
  }

  .status-ribbon.shipped {
    background: linear-gradient(90deg, #c9a45c, #dbb86a);
    color: #3d3428;
  }

  .status-ribbon.received {
    background: linear-gradient(90deg, #78b478, #8cc98c);
    color: #2a4a2a;
  }

  .card-body {
    padding: 1.25rem;
  }

  /* Location Row */
  .location-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .location-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .town-name {
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
    line-height: 1;
  }

  .state-badge {
    padding: 0.2rem 0.5rem;
    background: var(--pine);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }

  .mile-marker {
    text-align: right;
    padding: 0.4rem 0.75rem;
    background: linear-gradient(135deg, var(--pine) 0%, #3a4538 100%);
    border-radius: 10px;
  }

  .mile-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .mile-unit {
    font-size: 0.6rem;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.05em;
  }

  /* Date Timeline */
  .date-timeline {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f8f6f2 0%, #f5f2e8 100%);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    margin-bottom: 0.875rem;
  }

  .timeline-point {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .timeline-point.arrive {
    flex-direction: row-reverse;
    text-align: right;
  }

  .point-marker {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 3px solid;
    flex-shrink: 0;
  }

  .timeline-point.ship .point-marker {
    border-color: var(--terra);
    background: rgba(217, 119, 6, 0.2);
  }

  .timeline-point.arrive .point-marker {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.2);
  }

  .point-label {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  .point-date {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .timeline-point.ship .point-date {
    color: var(--terra);
  }

  .timeline-point.arrive .point-date {
    color: var(--pine);
  }

  .timeline-track {
    flex: 0 0 auto;
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, var(--terra), var(--alpine));
    border-radius: 2px;
    position: relative;
  }

  .timeline-track::after {
    content: '→';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Meta Tags */
  .meta-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.65rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tag-icon {
    font-size: 0.85rem;
  }

  .hold-tag {
    background: rgba(77, 89, 74, 0.1);
    color: var(--pine);
  }

  .hold-tag.warning {
    background: rgba(217, 119, 6, 0.12);
    color: var(--terra);
  }

  .reliability-tag {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.7rem;
  }

  .reliability-tag.excellent {
    background: rgba(166, 181, 137, 0.2);
    color: #3a5a3a;
  }

  .reliability-tag.good {
    background: rgba(201, 164, 92, 0.2);
    color: #7a6030;
  }

  /* Warning Banner */
  .warning-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.875rem;
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%);
    border: 1px solid rgba(217, 119, 6, 0.25);
    border-radius: 10px;
    margin-bottom: 0.75rem;
  }

  .warn-icon {
    font-size: 1rem;
  }

  .warn-text {
    font-size: 0.8rem;
    color: var(--terra);
    font-weight: 500;
  }

  /* Drop Notes */
  .drop-notes {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
    margin: 0 0 1rem;
  }

  /* Action Row */
  .action-row {
    display: flex;
    gap: 0.5rem;
  }

  .track-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.75rem 0.5rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .track-btn:hover:not(:disabled) {
    border-color: var(--alpine);
    color: var(--pine);
    background: rgba(166, 181, 137, 0.08);
  }

  .track-btn.checked {
    color: #fff;
    border-color: transparent;
  }

  .track-btn.plan.checked {
    background: linear-gradient(135deg, var(--alpine) 0%, #8fa87a 100%);
  }

  .track-btn.ship.checked {
    background: linear-gradient(135deg, #c9a45c 0%, #b8934d 100%);
  }

  .track-btn.receive.checked {
    background: linear-gradient(135deg, #78b478 0%, #68a468 100%);
  }

  .track-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-check {
    font-size: 0.9rem;
  }

  /* ========== LABELS PANEL ========== */
  .labels-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .name-alert {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.15) 0%, rgba(240, 224, 0, 0.08) 100%);
    border: 2px dashed rgba(200, 180, 0, 0.4);
    border-radius: 12px;
    font-size: 0.9rem;
    color: #7a6a00;
    font-weight: 500;
  }

  .format-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .format-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .format-icon {
    font-size: 1.25rem;
  }

  .format-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink);
    margin: 0;
  }

  .format-preview {
    margin-bottom: 1rem;
  }

  .label-preview {
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #f8f6f2 0%, #f0ede5 100%);
    border: 2px solid #e0dcd2;
    border-radius: 10px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.6;
    color: var(--ink);
    white-space: pre-wrap;
    margin: 0;
  }

  .format-rules {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .format-rule {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .rule-bullet {
    color: var(--alpine);
    font-size: 0.6rem;
  }

  .labels-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .label-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .label-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.875rem;
  }

  .label-town {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .label-mile {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }

  .label-eta {
    padding: 0.3rem 0.6rem;
    background: var(--alpine);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .label-content {
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, #f8f6f2 0%, #f0ede5 100%);
    border: 1px solid #e0dcd2;
    border-radius: 8px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.5;
    color: var(--ink);
    white-space: pre-wrap;
    margin: 0 0 0.875rem;
  }

  .copy-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem;
    background: linear-gradient(135deg, var(--pine) 0%, #3a4538 100%);
    border: none;
    border-radius: 10px;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(77, 89, 74, 0.25);
  }

  .copy-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(77, 89, 74, 0.35);
  }

  .copy-button.copied {
    background: linear-gradient(135deg, #78b478 0%, #68a468 100%);
    box-shadow: 0 4px 12px rgba(120, 180, 120, 0.3);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1.5rem;
    background: linear-gradient(135deg, #f8f6f2 0%, #f5f2e8 100%);
    border: 2px dashed var(--border);
    border-radius: 16px;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }

  .empty-text {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.25rem;
  }

  .empty-hint {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0;
  }

  /* ========== RULES PANEL ========== */
  .rules-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .rule-block {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .rule-block.highlight {
    border-color: var(--alpine);
    background: linear-gradient(145deg, rgba(166, 181, 137, 0.06) 0%, #fff 100%);
  }

  .rule-block.tip {
    border-color: var(--marker);
    background: linear-gradient(145deg, rgba(240, 224, 0, 0.06) 0%, #fff 100%);
  }

  .rule-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.875rem;
  }

  .rule-icon {
    font-size: 1.25rem;
  }

  .rule-name {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink);
    margin: 0;
  }

  .rule-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rule-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.875rem;
    background: linear-gradient(135deg, #f8f6f2 0%, #f5f2e8 100%);
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .rule-row.success {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15) 0%, rgba(166, 181, 137, 0.08) 100%);
  }

  .rule-row.warning {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%);
  }

  .rule-key {
    color: var(--muted);
  }

  .rule-value {
    font-weight: 700;
    color: var(--ink);
  }

  .rule-value.good {
    color: var(--pine);
  }

  .rule-value.warn {
    color: var(--terra);
  }

  .rule-list {
    margin: 0;
    padding: 0 0 0 1.25rem;
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.7;
  }

  .rule-list li {
    margin-bottom: 0.35rem;
  }

  .rule-list strong {
    color: var(--ink);
  }

  /* ========== GUIDE LINK ========== */
  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    margin-top: 1.5rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.25s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .gl-icon {
    font-size: 1.35rem;
  }

  .gl-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .gl-arrow {
    font-size: 1.35rem;
    color: var(--alpine);
    transition: transform 0.25s ease;
  }

  .guide-link:hover .gl-arrow {
    transform: translateX(4px);
  }

  /* ========== MOBILE ========== */
  @media (max-width: 640px) {
    .postal-header {
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.25rem;
    }

    .postal-stamp {
      width: 48px;
      height: 48px;
      font-size: 1.5rem;
    }

    .header-title {
      font-size: 1.15rem;
    }

    .tracking-stats {
      width: 100%;
      justify-content: space-around;
    }

    .stat-badge {
      min-width: 0;
      flex: 1;
    }

    .nav-btn {
      padding: 0.75rem 0.5rem;
    }

    .nav-text {
      display: none;
    }

    .nav-icon {
      font-size: 1.35rem;
    }

    .location-row {
      flex-direction: column;
      gap: 0.75rem;
    }

    .mile-marker {
      align-self: flex-start;
    }

    .date-timeline {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.875rem;
    }

    .timeline-point,
    .timeline-point.arrive {
      flex-direction: row;
      text-align: left;
      width: 100%;
    }

    .timeline-track {
      width: 3px;
      height: 20px;
      background: linear-gradient(180deg, var(--terra), var(--alpine));
    }

    .timeline-track::after {
      content: '↓';
    }

    .action-row {
      flex-direction: column;
    }

    .track-btn {
      padding: 0.875rem;
    }
  }
</style>
