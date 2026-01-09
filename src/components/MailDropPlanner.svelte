<script>
  /** @type {{ trailContext: any }} */
  let { trailContext } = $props();

  // Active section
  let activeSection = $state('overview');

  // Hiker info
  let hikerName = $state('');

  // Support person info
  let supportName = $state('');
  let supportPhone = $state('');
  let returnAddress = $state('');

  // Current trail position (from context or manual)
  let currentMile = $derived(trailContext?.currentMile || 0);

  // Recommended mail drop locations with trigger miles
  const mailDrops = [
    {
      id: 'hotsprings',
      town: 'Hot Springs',
      state: 'NC',
      zip: '28743',
      mile: 274,
      triggerMile: 150, // When to notify support
      holdTime: 30,
      poAddress: '170 Bridge St, Hot Springs, NC 28743',
      poHours: 'M-F 8:30-12, 12:30-4; Sat 9-11',
      poPhone: '(828) 622-3242',
      notes: 'Excellent hiker-friendly PO. Town has good resupply.'
    },
    {
      id: 'damascus',
      town: 'Damascus',
      state: 'VA',
      zip: '24236',
      mile: 469,
      triggerMile: 350,
      holdTime: 30,
      poAddress: '206 W Laurel Ave, Damascus, VA 24236',
      poHours: 'M-F 8-12, 1-4; Sat 9-11',
      poPhone: '(276) 475-3411',
      notes: 'Trail Days in May. Very hiker-friendly town.'
    },
    {
      id: 'daleville',
      town: 'Daleville',
      state: 'VA',
      zip: '24083',
      mile: 728,
      triggerMile: 600,
      holdTime: 30,
      poAddress: '138 Roanoke Rd, Daleville, VA 24083',
      poHours: 'M-F 8:30-12, 1-4:30; Sat 9-11',
      poPhone: '(540) 992-4422',
      notes: 'Easy trail access. Kroger nearby.'
    },
    {
      id: 'harpersferry',
      town: 'Harpers Ferry',
      state: 'WV',
      zip: '25425',
      mile: 1025,
      triggerMile: 900,
      holdTime: 30,
      poAddress: '1000 Washington St, Harpers Ferry, WV 25425',
      poHours: 'M-F 8-4; Sat 9-12',
      poPhone: '(304) 535-2479',
      notes: 'Psychological halfway! ATC HQ here.'
    },
    {
      id: 'duncannon',
      town: 'Duncannon',
      state: 'PA',
      zip: '17020',
      mile: 1145,
      triggerMile: 1020,
      holdTime: 30,
      poAddress: '2 N High St, Duncannon, PA 17020',
      poHours: 'M-F 8-12, 1-4:30; Sat 8-11',
      poPhone: '(717) 834-3332',
      notes: 'Doyle Hotel is legendary.'
    },
    {
      id: 'hanover',
      town: 'Hanover',
      state: 'NH',
      zip: '03755',
      mile: 1747,
      triggerMile: 1620,
      holdTime: 30,
      poAddress: '52 S Main St, Hanover, NH 03755',
      poHours: 'M-F 8:30-5; Sat 8:30-12',
      poPhone: '(603) 643-4544',
      notes: 'Last major resupply before the Whites.'
    },
    {
      id: 'monson',
      town: 'Monson',
      state: 'ME',
      zip: '04464',
      mile: 2077,
      triggerMile: 1950,
      holdTime: 14,
      poAddress: '5 Greenville Rd, Monson, ME 04464',
      poHours: 'M-F 7:30-11:30, 12:30-4; Sat 8-11',
      poPhone: '(207) 997-3975',
      notes: 'Gateway to 100-Mile Wilderness. SHORTER HOLD TIME!',
      warning: true
    }
  ];

  // User's planned drops with contents
  let plannedDrops = $state({});

  // Load from localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mailDropPlannerV2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          plannedDrops = parsed.drops || {};
          hikerName = parsed.hikerName || '';
          supportName = parsed.supportName || '';
          supportPhone = parsed.supportPhone || '';
          returnAddress = parsed.returnAddress || '';
        } catch (e) {}
      }
    }
  });

  // Save to localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mailDropPlannerV2', JSON.stringify({
        drops: plannedDrops,
        hikerName,
        supportName,
        supportPhone,
        returnAddress
      }));
    }
  });

  // Get or create drop data
  function getDropData(dropId) {
    return plannedDrops[dropId] || {
      enabled: false,
      contents: '',
      packed: false,
      notified: false,
      shipped: false,
      trackingNumber: '',
      received: false
    };
  }

  // Update a drop field
  function updateDrop(dropId, field, value) {
    const current = getDropData(dropId);
    plannedDrops = {
      ...plannedDrops,
      [dropId]: { ...current, [field]: value }
    };
  }

  // Toggle a boolean field
  function toggleDrop(dropId, field) {
    const current = getDropData(dropId);
    plannedDrops = {
      ...plannedDrops,
      [dropId]: { ...current, [field]: !current[field] }
    };
  }

  // Get status for a drop based on current mile
  function getDropStatus(drop) {
    const data = getDropData(drop.id);
    if (!data.enabled) return 'disabled';
    if (data.received) return 'received';
    if (data.shipped) return 'shipped';
    if (currentMile >= drop.triggerMile && !data.notified) return 'notify-now';
    if (data.notified) return 'notified';
    if (data.packed) return 'packed';
    return 'planning';
  }

  // Generate notification message for support person
  function generateNotifyMessage(drop) {
    const name = hikerName.trim() || '[HIKER NAME]';
    const ret = returnAddress.trim() || '[YOUR ADDRESS]';
    return `📦 MAIL DROP REQUEST

Hi${supportName ? ' ' + supportName : ''}! Please ship my ${drop.town} box.

SHIP TO:
${name.toUpperCase()}
GENERAL DELIVERY
${drop.town.toUpperCase()}, ${drop.state} ${drop.zip}
PLEASE HOLD FOR AT HIKER

RETURN ADDRESS:
${ret}

📍 PO Info:
${drop.poAddress}
${drop.poHours}
📞 ${drop.poPhone}

⏱️ Hold time: ${drop.holdTime} days
📬 Use Priority Mail (2-3 days)

Thanks! 🥾`;
  }

  // Copy message to clipboard
  let copiedId = $state(null);
  async function copyMessage(drop) {
    const msg = generateNotifyMessage(drop);
    try {
      await navigator.clipboard.writeText(msg);
      copiedId = drop.id;
      setTimeout(() => copiedId = null, 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }

  // Open USPS tracking
  function openTracking(trackingNumber) {
    if (trackingNumber) {
      window.open(`https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`, '_blank');
    }
  }

  // Stats
  let enabledCount = $derived(Object.values(plannedDrops).filter(d => d.enabled).length);
  let packedCount = $derived(Object.values(plannedDrops).filter(d => d.enabled && d.packed).length);
  let shippedCount = $derived(Object.values(plannedDrops).filter(d => d.shipped).length);
  let receivedCount = $derived(Object.values(plannedDrops).filter(d => d.received).length);

  // Get next action needed
  let nextAction = $derived(() => {
    for (const drop of mailDrops) {
      const status = getDropStatus(drop);
      if (status === 'notify-now') {
        return { type: 'notify', drop };
      }
    }
    for (const drop of mailDrops) {
      const data = getDropData(drop.id);
      if (data.enabled && !data.packed) {
        return { type: 'pack', drop };
      }
    }
    return null;
  });
</script>

<div class="mail-planner">
  <!-- Header -->
  <header class="planner-header">
    <div class="header-icon">📦</div>
    <div class="header-content">
      <h2 class="header-title">Mail Drop Planner</h2>
      <p class="header-sub">Ship-ahead resupply system</p>
    </div>
    <div class="header-stats">
      <div class="stat" class:active={packedCount > 0}>
        <span class="stat-num">{packedCount}/{enabledCount}</span>
        <span class="stat-label">Packed</span>
      </div>
      <div class="stat shipped" class:active={shippedCount > 0}>
        <span class="stat-num">{shippedCount}</span>
        <span class="stat-label">Shipped</span>
      </div>
      <div class="stat received" class:active={receivedCount > 0}>
        <span class="stat-num">{receivedCount}</span>
        <span class="stat-label">Received</span>
      </div>
    </div>
  </header>

  <!-- Alert Banner if action needed -->
  {#if nextAction()}
    {@const action = nextAction()}
    <div class="action-banner" class:urgent={action.type === 'notify'}>
      {#if action.type === 'notify'}
        <span class="banner-icon">🚨</span>
        <span class="banner-text">
          <strong>Time to notify support!</strong> You're approaching {action.drop.town}
        </span>
        <button class="banner-btn" onclick={() => { activeSection = 'drops'; }}>
          Send Now →
        </button>
      {:else}
        <span class="banner-icon">📋</span>
        <span class="banner-text">
          Next: Pack your <strong>{action.drop.town}</strong> box
        </span>
      {/if}
    </div>
  {/if}

  <!-- Navigation -->
  <nav class="nav-tabs">
    <button class="nav-tab" class:active={activeSection === 'overview'} onclick={() => activeSection = 'overview'}>
      <span class="tab-icon">📋</span>
      <span class="tab-text">Overview</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'setup'} onclick={() => activeSection = 'setup'}>
      <span class="tab-icon">⚙️</span>
      <span class="tab-text">Setup</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'drops'} onclick={() => activeSection = 'drops'}>
      <span class="tab-icon">📦</span>
      <span class="tab-text">Drops</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'howto'} onclick={() => activeSection = 'howto'}>
      <span class="tab-icon">❓</span>
      <span class="tab-text">How It Works</span>
    </button>
  </nav>

  <!-- OVERVIEW SECTION -->
  {#if activeSection === 'overview'}
    <div class="overview-section">
      <div class="overview-intro">
        <h3 class="intro-title">Your Mail Drop System</h3>
        <p class="intro-text">
          Pre-pack boxes at home. When you reach each trigger point on trail, text your support person to ship.
          No guessing dates—ship on demand.
        </p>
      </div>

      <!-- Current Position -->
      {#if trailContext?.mode === 'trail'}
        <div class="position-card">
          <div class="position-label">Current Position</div>
          <div class="position-mile">Mile {currentMile}</div>
        </div>
      {/if}

      <!-- Timeline View -->
      <div class="timeline-overview">
        {#each mailDrops as drop}
          {@const data = getDropData(drop.id)}
          {@const status = getDropStatus(drop)}
          <div class="timeline-item status-{status}" class:enabled={data.enabled}>
            <div class="timeline-marker">
              {#if status === 'received'}✓
              {:else if status === 'shipped'}📬
              {:else if status === 'notify-now'}🔔
              {:else if data.enabled}○
              {:else}–{/if}
            </div>
            <div class="timeline-info">
              <div class="timeline-town">{drop.town}, {drop.state}</div>
              <div class="timeline-meta">
                <span class="meta-mile">Mile {drop.mile}</span>
                {#if data.enabled}
                  <span class="meta-trigger">Trigger: {drop.triggerMile}</span>
                {/if}
              </div>
            </div>
            <div class="timeline-status">
              {#if status === 'received'}
                <span class="status-badge received">Received</span>
              {:else if status === 'shipped'}
                <span class="status-badge shipped">In Transit</span>
              {:else if status === 'notify-now'}
                <span class="status-badge urgent">NOTIFY NOW</span>
              {:else if status === 'notified'}
                <span class="status-badge notified">Notified</span>
              {:else if status === 'packed'}
                <span class="status-badge packed">Packed</span>
              {:else if !data.enabled}
                <span class="status-badge disabled">Not using</span>
              {:else}
                <span class="status-badge planning">Planning</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- SETUP SECTION -->
  {#if activeSection === 'setup'}
    <div class="setup-section">
      <div class="setup-card">
        <h3 class="card-title">
          <span class="card-icon">👤</span>
          Hiker Info
        </h3>
        <div class="field-group">
          <label class="field-label">Your Legal Name (for pickup ID)</label>
          <input type="text" class="field-input" bind:value={hikerName} placeholder="As shown on your ID" />
        </div>
      </div>

      <div class="setup-card">
        <h3 class="card-title">
          <span class="card-icon">🏠</span>
          Support Person
        </h3>
        <p class="card-desc">Who will ship your boxes from home?</p>
        <div class="field-group">
          <label class="field-label">Name</label>
          <input type="text" class="field-input" bind:value={supportName} placeholder="Mom, spouse, friend..." />
        </div>
        <div class="field-group">
          <label class="field-label">Phone</label>
          <input type="tel" class="field-input" bind:value={supportPhone} placeholder="For the copy/paste message" />
        </div>
      </div>

      <div class="setup-card">
        <h3 class="card-title">
          <span class="card-icon">📮</span>
          Return Address
        </h3>
        <p class="card-desc">Required on all packages</p>
        <div class="field-group">
          <textarea class="field-textarea" bind:value={returnAddress} rows="3" placeholder="Your home address&#10;City, State ZIP"></textarea>
        </div>
      </div>

      {#if !hikerName || !returnAddress}
        <div class="setup-warning">
          <span class="warn-icon">⚠️</span>
          <span class="warn-text">Complete setup to generate shipping labels</span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- DROPS SECTION -->
  {#if activeSection === 'drops'}
    <div class="drops-section">
      {#each mailDrops as drop}
        {@const data = getDropData(drop.id)}
        {@const status = getDropStatus(drop)}

        <div class="drop-card status-{status}">
          <!-- Header Row -->
          <div class="drop-header">
            <label class="enable-toggle">
              <input type="checkbox" checked={data.enabled} onchange={() => toggleDrop(drop.id, 'enabled')} />
              <span class="toggle-slider"></span>
            </label>
            <div class="drop-location">
              <h4 class="drop-town">{drop.town}</h4>
              <span class="drop-state">{drop.state}</span>
            </div>
            <div class="drop-miles">
              <div class="mile-badge">
                <span class="mile-num">{drop.mile}</span>
                <span class="mile-label">mi</span>
              </div>
            </div>
          </div>

          {#if data.enabled}
            <!-- Trigger Info -->
            <div class="trigger-row">
              <span class="trigger-icon">🔔</span>
              <span class="trigger-text">
                Notify support at <strong>mile {drop.triggerMile}</strong>
                {#if currentMile > 0}
                  ({drop.triggerMile - currentMile > 0 ? `${drop.triggerMile - currentMile} mi away` : 'NOW!'})
                {/if}
              </span>
            </div>

            <!-- Contents -->
            <div class="contents-section">
              <label class="contents-label">Box Contents:</label>
              <textarea
                class="contents-input"
                placeholder="Food, gear, meds..."
                value={data.contents || ''}
                oninput={(e) => updateDrop(drop.id, 'contents', e.target.value)}
                rows="2"
              ></textarea>
            </div>

            <!-- Status Checkboxes -->
            <div class="status-row">
              <label class="status-check" class:checked={data.packed}>
                <input type="checkbox" checked={data.packed} onchange={() => toggleDrop(drop.id, 'packed')} />
                <span class="check-icon">{data.packed ? '✓' : '○'}</span>
                <span class="check-label">Packed</span>
              </label>
              <label class="status-check" class:checked={data.notified}>
                <input type="checkbox" checked={data.notified} onchange={() => toggleDrop(drop.id, 'notified')} />
                <span class="check-icon">{data.notified ? '✓' : '○'}</span>
                <span class="check-label">Notified</span>
              </label>
              <label class="status-check shipped" class:checked={data.shipped}>
                <input type="checkbox" checked={data.shipped} onchange={() => toggleDrop(drop.id, 'shipped')} />
                <span class="check-icon">{data.shipped ? '✓' : '○'}</span>
                <span class="check-label">Shipped</span>
              </label>
              <label class="status-check received" class:checked={data.received}>
                <input type="checkbox" checked={data.received} onchange={() => toggleDrop(drop.id, 'received')} />
                <span class="check-icon">{data.received ? '✓' : '○'}</span>
                <span class="check-label">Got it</span>
              </label>
            </div>

            <!-- Tracking Number -->
            {#if data.shipped && !data.received}
              <div class="tracking-row">
                <input
                  type="text"
                  class="tracking-input"
                  placeholder="USPS Tracking #"
                  value={data.trackingNumber || ''}
                  oninput={(e) => updateDrop(drop.id, 'trackingNumber', e.target.value)}
                />
                {#if data.trackingNumber}
                  <button class="tracking-btn" onclick={() => openTracking(data.trackingNumber)}>
                    Track →
                  </button>
                {/if}
              </div>
            {/if}

            <!-- Notify Button (prominent when triggered) -->
            {#if status === 'notify-now' || (data.packed && !data.notified)}
              <button
                class="notify-btn"
                class:urgent={status === 'notify-now'}
                onclick={() => copyMessage(drop)}
              >
                {#if copiedId === drop.id}
                  ✓ Copied to clipboard!
                {:else}
                  📱 Copy Message for {supportName || 'Support'}
                {/if}
              </button>
            {/if}

            <!-- PO Info (collapsible) -->
            <details class="po-details">
              <summary class="po-summary">📍 Post Office Info</summary>
              <div class="po-info">
                <div class="po-line"><strong>Address:</strong> {drop.poAddress}</div>
                <div class="po-line"><strong>Hours:</strong> {drop.poHours}</div>
                <div class="po-line">
                  <strong>Phone:</strong>
                  <a href="tel:{drop.poPhone.replace(/\D/g, '')}" class="po-phone">{drop.poPhone}</a>
                </div>
                <div class="po-line"><strong>Hold Time:</strong> {drop.holdTime} days {drop.warning ? '⚠️' : ''}</div>
              </div>
            </details>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- HOW IT WORKS SECTION -->
  {#if activeSection === 'howto'}
    <div class="howto-section">
      <div class="howto-card highlight">
        <h3 class="howto-title">🎯 The Problem with Traditional Mail Drops</h3>
        <p>Calculating arrival dates months ahead doesn't work. Your pace changes, zeros happen, weather delays you. Packages arrive too early and get returned, or too late and you've moved on.</p>
      </div>

      <div class="howto-card">
        <h3 class="howto-title">✅ The Solution: Trigger-Based Shipping</h3>
        <ol class="howto-steps">
          <li>
            <strong>Before your hike:</strong> Pack all your mail drop boxes at home. Label them clearly (HOT SPRINGS, DAMASCUS, etc.). Store them ready-to-ship.
          </li>
          <li>
            <strong>On trail:</strong> When you reach a trigger point (about 100-150 miles before the PO), text your support person.
          </li>
          <li>
            <strong>Support ships:</strong> They grab the labeled box, use the address from your message, and ship Priority Mail (2-3 day delivery).
          </li>
          <li>
            <strong>You arrive:</strong> Package is waiting. No guesswork, no returned packages.
          </li>
        </ol>
      </div>

      <div class="howto-card">
        <h3 class="howto-title">📦 What to Put in Each Box</h3>
        <ul class="howto-list">
          <li><strong>Food:</strong> Favorite snacks, bars, freeze-dried meals</li>
          <li><strong>Toiletries:</strong> Sunscreen refill, chapstick, foot powder</li>
          <li><strong>Meds:</strong> Prescription refills, vitamins, ibuprofen</li>
          <li><strong>Gear:</strong> Fresh socks, batteries, headlamp bulb</li>
          <li><strong>Morale:</strong> Letters, photos, small treats</li>
        </ul>
      </div>

      <div class="howto-card">
        <h3 class="howto-title">📬 Shipping Tips</h3>
        <ul class="howto-list">
          <li>Use <strong>USPS Priority Mail</strong> - trackable, 2-3 days, includes insurance</li>
          <li>Write your name on <strong>ALL SIX SIDES</strong> of the box</li>
          <li>Always include <strong>"PLEASE HOLD FOR AT HIKER"</strong></li>
          <li>Flat Rate boxes are often the best value</li>
          <li>If delayed, <strong>call the PO</strong> - they'll usually extend hold time</li>
        </ul>
      </div>
    </div>
  {/if}

  <!-- Guide Link -->
  <a href="/guide#15-resupply-logistics" class="guide-link">
    📖 Full Resupply Guide →
  </a>
</div>

<style>
  .mail-planner {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* ========== HEADER ========== */
  .planner-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, #5d4e37 0%, #3d3428 100%);
    border-radius: 14px;
    color: #fff;
    margin-bottom: 1rem;
  }

  .header-icon {
    font-size: 2rem;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
  }

  .header-content { flex: 1; }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .header-sub {
    font-size: 0.8rem;
    opacity: 0.7;
    margin: 0.2rem 0 0;
  }

  .header-stats {
    display: flex;
    gap: 0.5rem;
  }

  .stat {
    text-align: center;
    padding: 0.4rem 0.6rem;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    min-width: 48px;
  }

  .stat.active { background: rgba(255,255,255,0.15); }
  .stat.shipped.active { background: rgba(201,164,92,0.3); }
  .stat.received.active { background: rgba(120,180,120,0.3); }

  .stat-num {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
  }

  /* ========== ACTION BANNER ========== */
  .action-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, rgba(166,181,137,0.15) 0%, rgba(166,181,137,0.08) 100%);
    border: 2px solid var(--alpine);
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .action-banner.urgent {
    background: linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.08) 100%);
    border-color: var(--terra);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  .banner-icon { font-size: 1.25rem; }

  .banner-text {
    flex: 1;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .banner-btn {
    padding: 0.5rem 1rem;
    background: var(--pine);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .banner-btn:hover { background: #3a4538; }

  /* ========== NAV TABS ========== */
  .nav-tabs {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 1.25rem;
  }

  .nav-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.75rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-tab:hover { color: var(--pine); background: rgba(77,89,74,0.06); }
  .nav-tab.active { background: var(--pine); color: #fff; }

  .tab-icon { font-size: 1rem; }

  @media (max-width: 480px) {
    .tab-text { display: none; }
    .tab-icon { font-size: 1.25rem; }
  }

  /* ========== OVERVIEW SECTION ========== */
  .overview-intro {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .intro-title {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.5rem;
  }

  .intro-text {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.5;
    margin: 0;
  }

  .position-card {
    text-align: center;
    padding: 1rem;
    background: linear-gradient(135deg, var(--pine) 0%, #3a4538 100%);
    border-radius: 12px;
    color: #fff;
    margin-bottom: 1.25rem;
  }

  .position-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  .position-mile {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
  }

  /* Timeline Overview */
  .timeline-overview {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timeline-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .timeline-item:not(.enabled) { opacity: 0.5; }
  .timeline-item.status-notify-now { border-color: var(--terra); background: rgba(217,119,6,0.05); }
  .timeline-item.status-shipped { border-color: #c9a45c; }
  .timeline-item.status-received { border-color: #78b478; background: rgba(120,180,120,0.05); }

  .timeline-marker {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--muted);
  }

  .timeline-item.status-received .timeline-marker { background: #78b478; color: #fff; border-color: #78b478; }
  .timeline-item.status-shipped .timeline-marker { background: #c9a45c; color: #fff; border-color: #c9a45c; }
  .timeline-item.status-notify-now .timeline-marker { background: var(--terra); color: #fff; border-color: var(--terra); }

  .timeline-info { flex: 1; }

  .timeline-town {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--ink);
  }

  .timeline-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .status-badge.disabled { background: #eee; color: #999; }
  .status-badge.planning { background: rgba(77,89,74,0.1); color: var(--pine); }
  .status-badge.packed { background: rgba(166,181,137,0.2); color: #3a5a3a; }
  .status-badge.notified { background: rgba(240,224,0,0.2); color: #7a6a00; }
  .status-badge.urgent { background: var(--terra); color: #fff; animation: pulse 1s ease-in-out infinite; }
  .status-badge.shipped { background: rgba(201,164,92,0.25); color: #7a6030; }
  .status-badge.received { background: rgba(120,180,120,0.25); color: #2a5a2a; }

  /* ========== SETUP SECTION ========== */
  .setup-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .setup-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.75rem;
  }

  .card-icon { font-size: 1.1rem; }

  .card-desc {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0 0 1rem;
  }

  .field-group { margin-bottom: 0.875rem; }
  .field-group:last-child { margin-bottom: 0; }

  .field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--pine);
    margin-bottom: 0.4rem;
  }

  .field-input, .field-textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    font-size: 1rem;
    color: var(--ink);
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .field-input:focus, .field-textarea:focus {
    outline: none;
    border-color: var(--pine);
  }

  .field-textarea { resize: vertical; font-family: inherit; }

  .setup-warning {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.875rem 1rem;
    background: rgba(217,119,6,0.1);
    border: 2px dashed rgba(217,119,6,0.3);
    border-radius: 10px;
    font-size: 0.85rem;
    color: var(--terra);
  }

  /* ========== DROPS SECTION ========== */
  .drops-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .drop-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1rem;
    transition: all 0.2s;
  }

  .drop-card.status-notify-now { border-color: var(--terra); box-shadow: 0 4px 20px rgba(217,119,6,0.15); }
  .drop-card.status-shipped { border-color: #c9a45c; }
  .drop-card.status-received { border-color: #78b478; opacity: 0.7; }

  .drop-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Toggle Switch */
  .enable-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    cursor: pointer;
  }

  .enable-toggle input { display: none; }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background: #ccc;
    border-radius: 24px;
    transition: 0.3s;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    left: 3px;
    top: 3px;
    background: #fff;
    border-radius: 50%;
    transition: 0.3s;
  }

  .enable-toggle input:checked + .toggle-slider { background: var(--pine); }
  .enable-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

  .drop-location { flex: 1; }

  .drop-town {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
    display: inline;
  }

  .drop-state {
    font-size: 0.8rem;
    color: var(--muted);
    margin-left: 0.35rem;
  }

  .mile-badge {
    text-align: center;
    padding: 0.35rem 0.6rem;
    background: var(--pine);
    border-radius: 8px;
  }

  .mile-num {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .mile-label {
    font-size: 0.55rem;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
  }

  .trigger-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.6rem 0.875rem;
    background: rgba(240,224,0,0.1);
    border-radius: 8px;
    font-size: 0.8rem;
    color: #7a6a00;
  }

  .contents-section { margin-top: 0.875rem; }

  .contents-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .contents-input {
    width: 100%;
    padding: 0.6rem 0.875rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.85rem;
    resize: vertical;
    font-family: inherit;
    box-sizing: border-box;
  }

  .status-row {
    display: flex;
    gap: 0.35rem;
    margin-top: 0.875rem;
  }

  .status-check {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.6rem 0.4rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .status-check input { display: none; }

  .status-check:hover { border-color: var(--alpine); }

  .status-check.checked { background: var(--alpine); color: #fff; border-color: var(--alpine); }
  .status-check.shipped.checked { background: #c9a45c; border-color: #c9a45c; }
  .status-check.received.checked { background: #78b478; border-color: #78b478; }

  .check-icon { font-size: 0.9rem; }
  .check-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }

  .tracking-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .tracking-input {
    flex: 1;
    padding: 0.6rem 0.875rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.85rem;
    font-family: monospace;
  }

  .tracking-btn {
    padding: 0.6rem 1rem;
    background: var(--pine);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .notify-btn {
    width: 100%;
    margin-top: 0.875rem;
    padding: 0.875rem;
    background: var(--alpine);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .notify-btn.urgent {
    background: var(--terra);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .notify-btn:hover { transform: translateY(-1px); }

  .po-details {
    margin-top: 0.875rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .po-summary {
    padding: 0.6rem 0.875rem;
    background: var(--bg);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
  }

  .po-info {
    padding: 0.875rem;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .po-line { margin-bottom: 0.35rem; }
  .po-line:last-child { margin-bottom: 0; }

  .po-phone {
    color: var(--pine);
    text-decoration: none;
  }

  /* ========== HOW IT WORKS ========== */
  .howto-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .howto-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .howto-card.highlight {
    border-color: var(--terra);
    background: rgba(217,119,6,0.03);
  }

  .howto-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 0.75rem;
  }

  .howto-card p {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.6;
    margin: 0;
  }

  .howto-steps {
    margin: 0;
    padding: 0 0 0 1.25rem;
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.7;
  }

  .howto-steps li { margin-bottom: 0.75rem; }
  .howto-steps li:last-child { margin-bottom: 0; }
  .howto-steps strong { color: var(--ink); }

  .howto-list {
    margin: 0;
    padding: 0 0 0 1.25rem;
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.6;
  }

  .howto-list li { margin-bottom: 0.35rem; }
  .howto-list strong { color: var(--ink); }

  /* ========== GUIDE LINK ========== */
  .guide-link {
    display: block;
    margin-top: 1.5rem;
    padding: 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    text-align: center;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
    transition: all 0.2s;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    transform: translateY(-2px);
  }
</style>
