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
    shipDate.setDate(shipDate.getDate() - 10); // Ship 10 days early
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

  // Filter drops by relevance
  let upcomingDrops = $derived(mailDrops.filter(d => d.mile > currentMile - 50));
  let passedDrops = $derived(mailDrops.filter(d => d.mile <= currentMile - 50));

  // Count stats
  let plannedCount = $derived(Object.values(plannedDrops).filter(d => d.planned).length);
  let shippedCount = $derived(Object.values(plannedDrops).filter(d => d.shipped).length);
  let receivedCount = $derived(Object.values(plannedDrops).filter(d => d.received).length);
</script>

<div class="maildrop-planner">
  <!-- Header -->
  <div class="planner-header">
    <div class="header-icon">📬</div>
    <div class="header-content">
      <h2 class="header-title">Mail Drop Planner</h2>
      <p class="header-subtitle">Schedule and track your resupply packages</p>
    </div>
    <div class="header-stats">
      <div class="mini-stat">
        <span class="mini-val">{plannedCount}</span>
        <span class="mini-label">Planned</span>
      </div>
      <div class="mini-stat">
        <span class="mini-val">{shippedCount}</span>
        <span class="mini-label">Shipped</span>
      </div>
      <div class="mini-stat">
        <span class="mini-val">{receivedCount}</span>
        <span class="mini-label">Received</span>
      </div>
    </div>
  </div>

  <!-- Name Input -->
  <div class="name-input-section">
    <label class="name-label">Your Name (for labels)</label>
    <input
      type="text"
      bind:value={hikerName}
      placeholder="Enter your full legal name"
      class="name-input"
    />
  </div>

  <!-- Section Tabs -->
  <div class="section-tabs">
    <button
      class="section-tab"
      class:active={activeSection === 'schedule'}
      onclick={() => activeSection = 'schedule'}
    >
      <span class="tab-icon">📅</span>
      <span class="tab-text">Schedule</span>
    </button>
    <button
      class="section-tab"
      class:active={activeSection === 'labels'}
      onclick={() => activeSection = 'labels'}
    >
      <span class="tab-icon">🏷️</span>
      <span class="tab-text">Labels</span>
    </button>
    <button
      class="section-tab"
      class:active={activeSection === 'rules'}
      onclick={() => activeSection = 'rules'}
    >
      <span class="tab-icon">📋</span>
      <span class="tab-text">Rules</span>
    </button>
  </div>

  <!-- Schedule Section -->
  {#if activeSection === 'schedule'}
    <div class="schedule-section">
      <div class="schedule-info">
        <span class="info-icon">💡</span>
        <span class="info-text">
          {#if trailContext?.mode === 'planning'}
            Dates based on {new Date(trailContext.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} start at {trailContext.pace} mi/day
          {:else}
            Dates based on your {trailContext?.actualPace || 15} mi/day pace from mile {currentMile}
          {/if}
        </span>
      </div>

      <div class="drops-list">
        {#each mailDrops as drop}
          {@const arrivalDate = getArrivalDate(drop.mile)}
          {@const shipDate = getShipDate(arrivalDate)}
          {@const isPassed = drop.mile < currentMile - 50}
          {@const isUpcoming = drop.mile >= currentMile - 50 && drop.mile < currentMile + 200}
          {@const status = plannedDrops[drop.id] || { planned: false, shipped: false, received: false }}

          <div
            class="drop-card"
            class:passed={isPassed}
            class:upcoming={isUpcoming}
            class:planned={status.planned}
            class:received={status.received}
          >
            <div class="drop-header">
              <div class="drop-location">
                <span class="drop-town">{drop.town}</span>
                <span class="drop-state">{drop.state}</span>
              </div>
              <div class="drop-mile">
                <span class="mile-num">{drop.mile}</span>
                <span class="mile-label">mi</span>
              </div>
            </div>

            <div class="drop-dates">
              <div class="date-item ship">
                <span class="date-label">Ship by</span>
                <span class="date-value">{formatDate(shipDate)}</span>
              </div>
              <div class="date-arrow">→</div>
              <div class="date-item arrive">
                <span class="date-label">Arrive</span>
                <span class="date-value">{formatDate(arrivalDate)}</span>
              </div>
            </div>

            <div class="drop-meta">
              <span class="hold-time" class:warning={drop.holdTime < 30}>
                {drop.holdTime} day hold
              </span>
              <span class="reliability reliability-{drop.reliability}">
                {drop.reliability}
              </span>
            </div>

            {#if drop.warning}
              <div class="drop-warning">
                <span class="warning-icon">⚠️</span>
                {drop.warning}
              </div>
            {/if}

            <div class="drop-notes">{drop.notes}</div>

            <div class="drop-actions">
              <button
                class="action-btn"
                class:active={status.planned}
                onclick={() => toggleDrop(drop.id, 'planned')}
              >
                {status.planned ? '✓ Planned' : 'Plan'}
              </button>
              <button
                class="action-btn"
                class:active={status.shipped}
                onclick={() => toggleDrop(drop.id, 'shipped')}
                disabled={!status.planned}
              >
                {status.shipped ? '✓ Shipped' : 'Ship'}
              </button>
              <button
                class="action-btn"
                class:active={status.received}
                onclick={() => toggleDrop(drop.id, 'received')}
                disabled={!status.shipped}
              >
                {status.received ? '✓ Received' : 'Receive'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Labels Section -->
  {#if activeSection === 'labels'}
    <div class="labels-section">
      {#if !hikerName.trim()}
        <div class="name-reminder">
          <span class="reminder-icon">👆</span>
          <span class="reminder-text">Enter your name above to generate labels</span>
        </div>
      {/if}

      <div class="label-format-box">
        <h4 class="format-title">Required Label Format</h4>
        <pre class="format-example">{hikerName.trim().toUpperCase() || 'YOUR NAME'}
GENERAL DELIVERY
CITY, STATE ZIP
PLEASE HOLD FOR AT HIKER
ETA: MM/DD/YYYY</pre>
        <div class="format-rules">
          <div class="rule">• Write on ALL SIX sides of box</div>
          <div class="rule">• Use permanent marker (Sharpie)</div>
          <div class="rule">• ETA is critical - always include it</div>
        </div>
      </div>

      <div class="labels-list">
        {#each mailDrops.filter(d => plannedDrops[d.id]?.planned) as drop}
          {@const arrivalDate = getArrivalDate(drop.mile)}
          <div class="label-card">
            <div class="label-header">
              <span class="label-town">{drop.town}, {drop.state}</span>
              <span class="label-mile">Mile {drop.mile}</span>
            </div>
            <pre class="label-text">{generateLabel(drop)}</pre>
            <button
              class="copy-btn"
              onclick={() => copyLabel(drop)}
            >
              {copiedId === drop.id ? '✓ Copied!' : 'Copy Label'}
            </button>
          </div>
        {:else}
          <div class="no-labels">
            <span class="no-icon">📭</span>
            <span class="no-text">No drops planned yet. Go to Schedule tab to plan your drops.</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Rules Section -->
  {#if activeSection === 'rules'}
    <div class="rules-section">
      <div class="rule-card">
        <h4 class="rule-title">
          <span class="rule-icon">⏰</span>
          Hold Times
        </h4>
        <div class="rule-content">
          <div class="rule-item">
            <span class="rule-key">Official USPS rule:</span>
            <span class="rule-val">Up to 30 days</span>
          </div>
          <div class="rule-item">
            <span class="rule-key">Large AT towns:</span>
            <span class="rule-val">Usually 30 days</span>
          </div>
          <div class="rule-item warning">
            <span class="rule-key">Small/rural offices:</span>
            <span class="rule-val">Often 7-14 days</span>
          </div>
        </div>
      </div>

      <div class="rule-card">
        <h4 class="rule-title">
          <span class="rule-icon">📦</span>
          Best Practices
        </h4>
        <div class="rule-content">
          <div class="rule-item highlight">
            <span class="rule-key">Ship packages:</span>
            <span class="rule-val">7-10 days before arrival</span>
          </div>
          <div class="rule-item warning">
            <span class="rule-key">Never ship earlier than:</span>
            <span class="rule-val">14 days</span>
          </div>
          <div class="rule-item">
            <span class="rule-key">Always include:</span>
            <span class="rule-val">Your ETA on the box</span>
          </div>
          <div class="rule-item">
            <span class="rule-key">If delayed:</span>
            <span class="rule-val">Call the post office</span>
          </div>
        </div>
      </div>

      <div class="rule-card">
        <h4 class="rule-title">
          <span class="rule-icon">✍️</span>
          Labeling Rules
        </h4>
        <div class="rule-content">
          <div class="rule-item">Write your name on <strong>all six sides</strong></div>
          <div class="rule-item">Use <strong>Sharpie</strong> (permanent marker)</div>
          <div class="rule-item"><strong>ETA matters</strong> - POs use it to prioritize</div>
          <div class="rule-item">Use your <strong>legal name</strong> (must match ID)</div>
        </div>
      </div>

      <div class="rule-card tip">
        <h4 class="rule-title">
          <span class="rule-icon">💡</span>
          Pro Tips
        </h4>
        <div class="rule-content">
          <div class="rule-item">• Priority Mail is trackable and includes insurance</div>
          <div class="rule-item">• Flat Rate boxes are often the best value</div>
          <div class="rule-item">• Some hostels accept packages (often with fee)</div>
          <div class="rule-item">• Shaw's in Monson offers 100-Mile Wilderness food drops</div>
          <div class="rule-item">• Consider shipping non-perishables only</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/12-usps-mail-drop-system" class="guide-link">
    <span class="guide-icon">📖</span>
    <span class="guide-text">Full Mail Drop System Guide</span>
    <span class="guide-arrow">→</span>
  </a>
</div>

<style>
  .maildrop-planner {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header */
  .planner-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, #5d4e37 0%, #3d3428 100%);
    border-radius: 16px;
    margin-bottom: 1rem;
    color: #fff;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .header-content {
    flex: 1;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .header-subtitle {
    font-size: 0.8rem;
    opacity: 0.7;
    margin: 0.25rem 0 0;
  }

  .header-stats {
    display: flex;
    gap: 1rem;
  }

  .mini-stat {
    text-align: center;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .mini-val {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
  }

  .mini-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  /* Name Input */
  .name-input-section {
    margin-bottom: 1rem;
  }

  .name-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .name-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid var(--border);
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .name-input:focus {
    outline: none;
    border-color: var(--alpine);
    box-shadow: 0 0 0 3px rgba(166, 181, 137, 0.2);
  }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: var(--bg);
    padding: 0.35rem;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .section-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .section-tab:hover {
    color: var(--pine);
    background: rgba(166, 181, 137, 0.1);
  }

  .section-tab.active {
    background: #fff;
    color: var(--pine);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .tab-icon {
    font-size: 1rem;
  }

  /* Schedule Section */
  .schedule-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .schedule-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border-radius: 10px;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .info-icon {
    flex-shrink: 0;
  }

  .drops-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .drop-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .drop-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .drop-card.passed {
    opacity: 0.5;
  }

  .drop-card.upcoming {
    border-color: var(--marker);
    box-shadow: 0 4px 16px rgba(240, 224, 0, 0.15);
  }

  .drop-card.planned {
    border-color: var(--alpine);
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.05) 0%, #fff 100%);
  }

  .drop-card.received {
    opacity: 0.6;
  }

  .drop-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .drop-location {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .drop-town {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
  }

  .drop-state {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .drop-mile {
    text-align: right;
  }

  .drop-mile .mile-num {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .drop-mile .mile-label {
    display: block;
    font-size: 0.6rem;
    text-transform: uppercase;
    color: var(--muted);
  }

  .drop-dates {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: var(--bg);
    border-radius: 10px;
  }

  .date-item {
    flex: 1;
    text-align: center;
  }

  .date-label {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .date-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .date-item.ship .date-value {
    color: var(--terra);
  }

  .date-item.arrive .date-value {
    color: var(--alpine);
  }

  .date-arrow {
    color: var(--muted);
    font-size: 1.25rem;
  }

  .drop-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .hold-time {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg);
    border-radius: 6px;
    color: var(--muted);
  }

  .hold-time.warning {
    background: rgba(200, 100, 50, 0.1);
    color: var(--terra);
  }

  .reliability {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }

  .reliability-excellent {
    background: rgba(166, 181, 137, 0.2);
    color: var(--pine);
  }

  .reliability-good {
    background: rgba(240, 224, 0, 0.2);
    color: #8b7500;
  }

  .drop-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(200, 100, 50, 0.1);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--terra);
    margin-bottom: 0.5rem;
  }

  .drop-notes {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .drop-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1;
    padding: 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover:not(:disabled) {
    background: #fff;
    border-color: var(--alpine);
    color: var(--pine);
  }

  .action-btn.active {
    background: var(--alpine);
    border-color: var(--alpine);
    color: #fff;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Labels Section */
  .labels-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .name-reminder {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(240, 224, 0, 0.15);
    border: 1px dashed var(--marker);
    border-radius: 10px;
    font-size: 0.9rem;
    color: #8b7500;
  }

  .label-format-box {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .format-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--ink);
    margin: 0 0 0.75rem;
  }

  .format-example {
    background: var(--bg);
    padding: 1rem;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    white-space: pre-wrap;
    margin: 0 0 0.75rem;
    color: var(--ink);
  }

  .format-rules {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .rule {
    margin-bottom: 0.25rem;
  }

  .labels-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .label-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
  }

  .label-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .label-town {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .label-mile {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .label-text {
    background: var(--bg);
    padding: 0.75rem;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    white-space: pre-wrap;
    margin: 0 0 0.75rem;
    color: var(--ink);
  }

  .copy-btn {
    width: 100%;
    padding: 0.6rem;
    background: var(--pine);
    border: none;
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-btn:hover {
    background: #3a4a35;
  }

  .no-labels {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    background: var(--bg);
    border-radius: 12px;
    text-align: center;
  }

  .no-icon {
    font-size: 2rem;
  }

  .no-text {
    font-size: 0.9rem;
    color: var(--muted);
  }

  /* Rules Section */
  .rules-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .rule-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .rule-card.tip {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.08) 0%, #fff 100%);
    border-color: var(--alpine);
  }

  .rule-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.75rem;
  }

  .rule-icon {
    font-size: 1.25rem;
  }

  .rule-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rule-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    padding: 0.5rem;
    background: var(--bg);
    border-radius: 6px;
  }

  .rule-item.highlight {
    background: rgba(166, 181, 137, 0.15);
  }

  .rule-item.warning {
    background: rgba(200, 100, 50, 0.1);
  }

  .rule-key {
    color: var(--muted);
  }

  .rule-val {
    font-weight: 600;
    color: var(--ink);
  }

  .rule-item.warning .rule-val {
    color: var(--terra);
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    margin-top: 1.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .guide-link:hover {
    background: #fff;
    border-color: var(--alpine);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .guide-icon {
    font-size: 1.25rem;
  }

  .guide-text {
    flex: 1;
    margin-left: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .guide-arrow {
    color: var(--alpine);
    font-size: 1.25rem;
    transition: transform 0.2s ease;
  }

  .guide-link:hover .guide-arrow {
    transform: translateX(4px);
  }

  /* Mobile */
  @media (max-width: 640px) {
    .planner-header {
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .header-icon {
      font-size: 2rem;
    }

    .header-stats {
      width: 100%;
      justify-content: space-around;
    }

    .section-tabs {
      gap: 0.25rem;
    }

    .section-tab {
      padding: 0.6rem 0.5rem;
      font-size: 0.75rem;
    }

    .tab-text {
      display: none;
    }

    .tab-icon {
      font-size: 1.25rem;
    }

    .drop-dates {
      flex-direction: column;
      gap: 0.5rem;
    }

    .date-arrow {
      transform: rotate(90deg);
    }

    .drop-actions {
      flex-direction: column;
    }
  }
</style>
