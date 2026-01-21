<script>
  import { RESUPPLY_STOPS } from '../data/resupplyStops';

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
  let pace = $derived(trailContext?.targetPace || trailContext?.pace || 15);

  // Global defaults
  let triggerLeadMiles = $state(125); // ship ~125 miles before pickup
  let defaultHoldTimeDays = $state(30);

  /**
   * @typedef {'post-office' | 'hostel'} MailLocationKind
   * @typedef {{
   *   id: string;
   *   kind: MailLocationKind;
   *   town: string;
   *   state?: string;
   *   mile: number;
   *   recommended?: boolean;
   *   holdTime?: number;
   *   zip?: string;
   *   address?: string;
   *   hours?: string;
   *   phone?: string;
   *   notes?: string;
   *   warning?: boolean;
   *   estimatedHostelNight?: number;
   * }} MailLocation
   */

  function slugify(input) {
    return String(input || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function toNumber(input, fallback = 0) {
    const n = typeof input === 'number' ? input : Number(String(input || '').trim());
    return Number.isFinite(n) ? n : fallback;
  }

  function formatMoney(n) {
    const v = toNumber(n, NaN);
    if (!Number.isFinite(v)) return '—';
    return `$${v.toFixed(0)}`;
  }

  function getUspsFinderUrl(town, state) {
    const q = [town, state].filter(Boolean).join(', ');
    return `https://tools.usps.com/locations/home.htm?location=${encodeURIComponent(q)}`;
  }

  function getStopCostHints(town) {
    const hit = RESUPPLY_STOPS.find(s => s.name.toLowerCase() === String(town).toLowerCase());
    const hostel = hit?.costs?.hostel;
    return {
      estimatedHostelNight: typeof hostel === 'number' ? hostel : undefined,
    };
  }

  // Manual overrides for the most-used General Delivery POs (kept tight + verified)
  const RECOMMENDED_PO_OVERRIDES = [
    {
      key: 'hot-springs-nc',
      zip: '28743',
      holdTime: 30,
      address: '170 Bridge St, Hot Springs, NC 28743',
      hours: 'M-F 8:30-12, 12:30-4; Sat 9-11',
      phone: '(828) 622-3242',
      notes: 'Excellent hiker-friendly PO. Town has good resupply.',
    },
    {
      key: 'damascus-va',
      zip: '24236',
      holdTime: 30,
      address: '206 W Laurel Ave, Damascus, VA 24236',
      hours: 'M-F 8-12, 1-4; Sat 9-11',
      phone: '(276) 475-3411',
      notes: 'Trail Days in May. Very hiker-friendly town.',
    },
    {
      key: 'daleville-va',
      zip: '24083',
      holdTime: 30,
      address: '138 Roanoke Rd, Daleville, VA 24083',
      hours: 'M-F 8:30-12, 1-4:30; Sat 9-11',
      phone: '(540) 992-4422',
      notes: 'Easy trail access. Kroger nearby.',
    },
    {
      key: 'harpers-ferry-wv',
      zip: '25425',
      holdTime: 30,
      address: '1000 Washington St, Harpers Ferry, WV 25425',
      hours: 'M-F 8-4; Sat 9-12',
      phone: '(304) 535-2479',
      notes: 'Psychological halfway! ATC HQ here.',
    },
    {
      key: 'duncannon-pa',
      zip: '17020',
      holdTime: 30,
      address: '2 N High St, Duncannon, PA 17020',
      hours: 'M-F 8-12, 1-4:30; Sat 8-11',
      phone: '(717) 834-3332',
      notes: 'Doyle Hotel is legendary.',
    },
    {
      key: 'hanover-nh',
      zip: '03755',
      holdTime: 30,
      address: '52 S Main St, Hanover, NH 03755',
      hours: 'M-F 8:30-5; Sat 8:30-12',
      phone: '(603) 643-4544',
      notes: 'Last major resupply before the Whites.',
    },
    {
      key: 'monson-me',
      zip: '04464',
      holdTime: 14,
      address: '5 Greenville Rd, Monson, ME 04464',
      hours: 'M-F 7:30-11:30, 12:30-4; Sat 8-11',
      phone: '(207) 997-3975',
      notes: 'Gateway to 100-Mile Wilderness. SHORTER HOLD TIME!',
      warning: true,
    },
  ];

  function applyRecommendedOverrides(location) {
    if (location.kind !== 'post-office') return location;
    const key = slugify(`${location.town}-${location.state || ''}`);
    const ov = RECOMMENDED_PO_OVERRIDES.find(o => o.key === key);
    if (!ov) return location;
    return {
      ...location,
      recommended: true,
      zip: ov.zip,
      holdTime: ov.holdTime,
      address: ov.address,
      hours: ov.hours,
      phone: ov.phone,
      notes: ov.notes,
      warning: ov.warning,
    };
  }

  function buildFallbackDirectoryFromStops() {
    /** @type {MailLocation[]} */
    const out = [];
    for (const stop of RESUPPLY_STOPS) {
      const base = {
        town: stop.name,
        state: stop.state,
        mile: stop.mile,
      };

      if (stop.mailDrop) {
        out.push(applyRecommendedOverrides({
          id: `${slugify(`${stop.name}-${stop.state || ''}`)}-po`,
          kind: 'post-office',
          ...base,
          holdTime: stop.name === 'Monson' ? 14 : undefined,
          notes: stop.name === 'Monson' ? 'Often shorter hold times. Call ahead.' : undefined,
          warning: stop.name === 'Monson',
        }));
      }

      if (typeof stop.costs?.hostel === 'number') {
        const hints = getStopCostHints(stop.name);
        out.push({
          id: `${slugify(`${stop.name}-${stop.state || ''}`)}-hostel`,
          kind: 'hostel',
          ...base,
          notes: 'Call ahead to confirm package hold policies and any fees.',
          estimatedHostelNight: hints.estimatedHostelNight,
        });
      }
    }
    return out.sort((a, b) => a.mile - b.mile);
  }

  function parseGuideDirectory(text) {
    // Best-effort extraction from MASTER_NOBO_FIELD_GUIDE.md (served as /guide-context.txt).
    // Extracts entries like: **Hot Springs, NC (Mile ~274)**
    const lines = String(text || '').split(/\r?\n/);

    const stateNameToAbbr = {
      GEORGIA: 'GA',
      'NORTH CAROLINA': 'NC',
      TENNESSEE: 'TN',
      VIRGINIA: 'VA',
      'WEST VIRGINIA': 'WV',
      MARYLAND: 'MD',
      PENNSYLVANIA: 'PA',
      'NEW JERSEY': 'NJ',
      NEW_YORK: 'NY',
      'NEW YORK': 'NY',
      CONNECTICUT: 'CT',
      MASSACHUSETTS: 'MA',
      VERMONT: 'VT',
      'NEW HAMPSHIRE': 'NH',
      MAINE: 'ME',
    };

    function sectionToStateAbbr(sectionTitle) {
      const raw = String(sectionTitle || '').toUpperCase();
      const primary = raw.split('/')[0]?.trim();
      return stateNameToAbbr[primary] || null;
    }

    /** @type {MailLocation[]} */
    const out = [];
    let fallbackState = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track coarse state section for entries missing ", XX"
      const sectionMatch = line.match(/^###\s+([A-Z][A-Z\s/]+?)\s*(?:\(|$)/);
      if (sectionMatch) {
        fallbackState = sectionToStateAbbr(sectionMatch[1]);
        continue;
      }

      const headingMatch = line.match(/^\*\*(.+?)\s*\(Mile\s*~?\s*([0-9]{1,4}(?:\.[0-9]+)?)/i);
      if (!headingMatch) continue;

      const rawTitle = headingMatch[1].trim();
      const mile = toNumber(headingMatch[2], NaN);
      if (!Number.isFinite(mile)) continue;

      const lookahead = lines.slice(i, i + 14).join(' ');
      const hasPO = lookahead.includes('✉️') || /post office/i.test(lookahead);
      const hasHostel = lookahead.includes('🏨') || /hostel/i.test(lookahead);

      if (!hasPO && !hasHostel) continue;

      let town = rawTitle;
      let state = fallbackState || undefined;
      const m2 = rawTitle.match(/^(.*?),\s*([A-Z]{2})$/);
      if (m2) {
        town = m2[1].trim();
        state = m2[2];
      }

      const hints = getStopCostHints(town);

      if (hasPO) {
        out.push(applyRecommendedOverrides({
          id: `${slugify(`${town}-${state || ''}`)}-po`,
          kind: 'post-office',
          town,
          state: state || undefined,
          mile,
          holdTime: town === 'Monson' ? 14 : undefined,
          notes: town === 'Monson' ? 'Often shorter hold times. Call ahead.' : undefined,
          warning: town === 'Monson',
        }));
      }

      if (hasHostel) {
        out.push({
          id: `${slugify(`${town}-${state || ''}`)}-hostel`,
          kind: 'hostel',
          town,
          state: state || undefined,
          mile,
          notes: 'Call ahead to confirm package hold policies and any fees.',
          estimatedHostelNight: hints.estimatedHostelNight,
        });
      }
    }

    // Deduplicate by id (prefer entries with more detail)
    /** @type {Map<string, MailLocation>} */
    const byId = new Map();
    for (const item of out) {
      const prev = byId.get(item.id);
      if (!prev) {
        byId.set(item.id, item);
        continue;
      }
      const prevScore =
        (prev.zip ? 1 : 0) + (prev.address ? 1 : 0) + (prev.hours ? 1 : 0) + (prev.phone ? 1 : 0);
      const nextScore =
        (item.zip ? 1 : 0) + (item.address ? 1 : 0) + (item.hours ? 1 : 0) + (item.phone ? 1 : 0);
      byId.set(item.id, nextScore >= prevScore ? item : prev);
    }

    return Array.from(byId.values()).sort((a, b) => a.mile - b.mile);
  }

  function mergeDirectories(primary, secondary) {
    /** @type {Map<string, MailLocation>} */
    const byId = new Map();
    const all = [...primary, ...secondary];

    function score(item) {
      return (
        (item.recommended ? 2 : 0) +
        (item.zip ? 1 : 0) +
        (item.address ? 1 : 0) +
        (item.hours ? 1 : 0) +
        (item.phone ? 1 : 0)
      );
    }

    for (const item of all) {
      const prev = byId.get(item.id);
      if (!prev) {
        byId.set(item.id, item);
        continue;
      }
      byId.set(item.id, score(item) >= score(prev) ? item : prev);
    }

    return Array.from(byId.values()).sort((a, b) => a.mile - b.mile);
  }

  let directoryLoaded = $state(false);
  let directoryError = $state('');
  /** @type {MailLocation[]} */
  let mailDrops = $state(buildFallbackDirectoryFromStops());

  $effect(() => {
    if (typeof window === 'undefined') return;
    if (directoryLoaded) return;
    directoryLoaded = true;

    (async () => {
      try {
        const res = await fetch('/guide-context.txt', { cache: 'force-cache' });
        if (!res.ok) return;
        const txt = await res.text();
        const parsed = parseGuideDirectory(txt);
        if (parsed.length) mailDrops = mergeDirectories(buildFallbackDirectoryFromStops(), parsed);
      } catch (e) {
        directoryError = 'Could not load the directory. Using fallback list.';
      }
    })();
  });

  // User's planned drops with contents
  let plannedDrops = $state({});

  // Load from localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mailDropPlannerV3');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          plannedDrops = parsed.drops || {};
          hikerName = parsed.hikerName || '';
          supportName = parsed.supportName || '';
          supportPhone = parsed.supportPhone || '';
          returnAddress = parsed.returnAddress || '';
          triggerLeadMiles = parsed.triggerLeadMiles ?? triggerLeadMiles;
          defaultHoldTimeDays = parsed.defaultHoldTimeDays ?? defaultHoldTimeDays;
        } catch (e) {}
      }
    }
  });

  // Save to localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mailDropPlannerV3', JSON.stringify({
        drops: plannedDrops,
        hikerName,
        supportName,
        supportPhone,
        returnAddress,
        triggerLeadMiles,
        defaultHoldTimeDays,
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
      received: false,
      shippingCost: '',
      pickupFee: '',
      holdTimeOverride: '',
      leadMilesOverride: '',
      addressOverride: '',
      zipOverride: '',
      hoursOverride: '',
      phoneOverride: '',
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

  function getTriggerMile(drop) {
    const data = getDropData(drop.id);
    const override = toNumber(data.leadMilesOverride, NaN);
    const lead = Number.isFinite(override) && override > 0 ? override : triggerLeadMiles;
    return Math.max(0, Math.round(drop.mile - lead));
  }

  function getHoldTimeDays(drop) {
    const data = getDropData(drop.id);
    const override = toNumber(data.holdTimeOverride, NaN);
    if (Number.isFinite(override) && override > 0) return override;
    return toNumber(drop.holdTime, defaultHoldTimeDays);
  }

  function getAddressLine(drop) {
    const data = getDropData(drop.id);
    return (data.addressOverride || drop.address || '').trim();
  }

  function getZip(drop) {
    const data = getDropData(drop.id);
    return (data.zipOverride || drop.zip || '').trim();
  }

  function getHours(drop) {
    const data = getDropData(drop.id);
    return (data.hoursOverride || drop.hours || '').trim();
  }

  function getPhone(drop) {
    const data = getDropData(drop.id);
    return (data.phoneOverride || drop.phone || '').trim();
  }

  // Get status for a drop based on current mile
  function getDropStatus(drop) {
    const data = getDropData(drop.id);
    if (!data.enabled) return 'disabled';
    if (data.received) return 'received';
    if (data.shipped) return 'shipped';
    if (currentMile >= getTriggerMile(drop) && !data.notified) return 'notify-now';
    if (data.notified) return 'notified';
    if (data.packed) return 'packed';
    return 'planning';
  }

  function estimateEtaDate(drop) {
    if (!currentMile || currentMile <= 0) return null;
    const milesToGo = Math.max(0, drop.mile - currentMile);
    const days = pace > 0 ? Math.ceil(milesToGo / pace) : null;
    if (!days || !Number.isFinite(days)) return null;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatEta(d) {
    if (!d) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // Generate notification message for support person
  function generateNotifyMessage(drop) {
    const name = hikerName.trim() || '[HIKER NAME]';
    const ret = returnAddress.trim() || '[YOUR ADDRESS]';
    const state = drop.state || '[STATE]';
    const zip = getZip(drop) || '[ZIP]';
    const eta = formatEta(estimateEtaDate(drop)) || 'MM/DD/YYYY';
    const hold = getHoldTimeDays(drop);
    const phone = getPhone(drop);
    const hours = getHours(drop);
    const address = getAddressLine(drop);
    const uspsHelp = drop.kind === 'post-office'
      ? `USPS locator: ${getUspsFinderUrl(drop.town, drop.state)}`
      : '';

    let shipToBlock = '';

    if (drop.kind === 'post-office') {
      shipToBlock = `${name.toUpperCase()}
GENERAL DELIVERY
${drop.town.toUpperCase()}, ${state} ${zip}
PLEASE HOLD FOR AT HIKER
ETA: ${eta}`;
    } else {
      shipToBlock = `${name.toUpperCase()}
C/O [HOSTEL / BUSINESS NAME]
${address || '[STREET ADDRESS]'}
${drop.town.toUpperCase()}, ${state} ${zip}
HOLD FOR AT HIKER - PACKAGE
ETA: ${eta}`;
    }

    return `📦 MAIL DROP REQUEST

Hi${supportName ? ' ' + supportName : ''}! Please ship my ${drop.town} box.

SHIP TO:
${shipToBlock}

RETURN ADDRESS:
${ret}

📍 Pickup Info:
${address ? address : drop.kind === 'post-office' ? 'Use General Delivery (confirm exact PO + ZIP).' : 'Confirm exact pickup location + address.'}
${hours ? `Hours: ${hours}` : ''}
${phone ? `Phone: ${phone}` : ''}
${uspsHelp ? uspsHelp : ''}

⏱️ Hold time: ${hold} days
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

  let estimatedTotalCost = $derived(() => {
    let total = 0;
    for (const drop of mailDrops) {
      const data = getDropData(drop.id);
      if (!data.enabled) continue;
      total += toNumber(data.shippingCost, 0);
      total += toNumber(data.pickupFee, 0);
    }
    return total;
  });

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

  // Directory browsing
  let showDirectory = $state(false);
  let search = $state('');
  let filterPO = $state(true);
  let filterHostel = $state(true);

  let visibleDrops = $derived(() => {
    const q = search.trim().toLowerCase();
    const filtered = mailDrops.filter(d => {
      if (!filterPO && d.kind === 'post-office') return false;
      if (!filterHostel && d.kind === 'hostel') return false;
      if (!showDirectory && !getDropData(d.id).enabled) return false;
      if (!q) return true;
      const hay = `${d.town} ${d.state || ''} ${d.kind}`.toLowerCase();
      return hay.includes(q) || String(d.mile).includes(q);
    });
    return filtered.sort((a, b) => a.mile - b.mile);
  });

  let plannedList = $derived(() =>
    mailDrops
      .filter(d => getDropData(d.id).enabled)
      .sort((a, b) => a.mile - b.mile)
  );

  let timelineDrops = $derived(() => {
    if (plannedList.length) return plannedList;
    return mailDrops.filter(d => d.recommended).sort((a, b) => a.mile - b.mile);
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
        {#each timelineDrops as drop}
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
              <div class="timeline-town">
                {drop.town}{drop.state ? `, ${drop.state}` : ''} {drop.kind === 'post-office' ? '✉️' : '🏨'}
              </div>
              <div class="timeline-meta">
                <span class="meta-mile">Mile {drop.mile}</span>
                {#if data.enabled}
                  <span class="meta-trigger">Trigger: {getTriggerMile(drop)}</span>
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

      <div class="setup-card">
        <h3 class="card-title">
          <span class="card-icon">🎛️</span>
          Defaults
        </h3>
        <p class="card-desc">These apply to all locations unless you override them per drop.</p>
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Ship lead (miles)</label>
            <input type="number" class="field-input" bind:value={triggerLeadMiles} min="25" max="250" />
          </div>
          <div class="field-group">
            <label class="field-label">Default hold time (days)</label>
            <input type="number" class="field-input" bind:value={defaultHoldTimeDays} min="7" max="60" />
          </div>
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
      <div class="drops-controls">
        <div class="controls-left">
          <button class="dir-btn" onclick={() => showDirectory = !showDirectory}>
            {showDirectory ? '✓ My Plan' : 'Browse Directory'}
          </button>
          <input
            type="search"
            class="dir-search"
            bind:value={search}
            placeholder="Search town, mile, PO/hostel…"
          />
        </div>
        <div class="controls-right">
          <label class="filter-pill">
            <input type="checkbox" bind:checked={filterPO} />
            <span>Post Offices</span>
          </label>
          <label class="filter-pill">
            <input type="checkbox" bind:checked={filterHostel} />
            <span>Hostels</span>
          </label>
          <div class="cost-pill" title="Sum of shipping + pickup fees you entered">
            Est. Total: {formatMoney(estimatedTotalCost)}
          </div>
        </div>
      </div>

      {#if directoryError}
        <div class="setup-warning">
          <span class="warn-icon">⚠️</span>
          <span class="warn-text">{directoryError}</span>
        </div>
      {/if}

      {#if showDirectory}
        <div class="dir-hint">
          Toggle any location to add it to your plan. For Post Offices, confirm ZIP + hours before shipping.
        </div>
      {/if}

      {#if !showDirectory && !plannedList.length}
        <div class="dir-empty">
          <strong>No drops selected yet.</strong> Click <em>Browse Directory</em> and toggle the ones you want.
        </div>
      {/if}

      {#each visibleDrops as drop}
        {@const data = getDropData(drop.id)}
        {@const status = getDropStatus(drop)}
        {@const triggerMile = getTriggerMile(drop)}

        <div class="drop-card status-{status}">
          <!-- Header Row -->
          <div class="drop-header">
            <label class="enable-toggle">
              <input type="checkbox" checked={data.enabled} onchange={() => toggleDrop(drop.id, 'enabled')} />
              <span class="toggle-slider"></span>
            </label>
            <div class="drop-location">
              <h4 class="drop-town">{drop.town}</h4>
              <span class="drop-state">{drop.state || ''}</span>
              <span class="drop-kind">{drop.kind === 'post-office' ? 'Post Office' : 'Hostel'}</span>
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
                Notify support at <strong>mile {triggerMile}</strong>
                {#if currentMile > 0}
                  ({triggerMile - currentMile > 0 ? `${triggerMile - currentMile} mi away` : 'NOW!'})
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

            <!-- Costs -->
            <div class="costs-row">
              <div class="cost-field">
                <label class="cost-label">Shipping ($)</label>
                <input
                  type="number"
                  class="cost-input"
                  placeholder="0"
                  value={data.shippingCost || ''}
                  oninput={(e) => updateDrop(drop.id, 'shippingCost', e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
              <div class="cost-field">
                <label class="cost-label">Pickup fee ($)</label>
                <input
                  type="number"
                  class="cost-input"
                  placeholder="0"
                  value={data.pickupFee || ''}
                  oninput={(e) => updateDrop(drop.id, 'pickupFee', e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
              <div class="cost-total">
                Total: {formatMoney(toNumber(data.shippingCost, 0) + toNumber(data.pickupFee, 0))}
                {#if drop.kind === 'hostel' && drop.estimatedHostelNight}
                  <span class="cost-hint">Est hostel/night: {formatMoney(drop.estimatedHostelNight)}</span>
                {/if}
              </div>
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

            <!-- Pickup Info + Overrides (collapsible) -->
	            <details class="po-details">
	              <summary class="po-summary">
	                📍 {drop.kind === 'post-office' ? 'Post Office' : 'Hostel / Business'} info + overrides
	              </summary>
	              <div class="po-info">
	                {#if drop.kind === 'post-office'}
	                  <div class="po-line">
	                    <strong>USPS Locator:</strong>
	                    <a class="po-link" href={getUspsFinderUrl(drop.town, drop.state)} target="_blank" rel="noreferrer">
	                      Find the correct Post Office / ZIP →
                    </a>
	                  </div>
	                {/if}
	
	                <div class="po-line"><strong>Address:</strong> {getAddressLine(drop) || '—'}</div>
	                <div class="po-line"><strong>Hours:</strong> {getHours(drop) || '—'}</div>
	                <div class="po-line">
	                  <strong>Phone:</strong>
	                  {#if getPhone(drop)}
	                    {@const phone = getPhone(drop)}
	                    <a href="tel:{phone.replace(/\D/g, '')}" class="po-phone">{phone}</a>
	                  {:else}
	                    —
	                  {/if}
	                </div>
	                <div class="po-line"><strong>Hold Time:</strong> {getHoldTimeDays(drop)} days {drop.warning ? '⚠️' : ''}</div>

                <div class="override-grid">
                  <div class="override-field">
                    <label class="override-label">Lead miles override</label>
                    <input
                      type="number"
                      class="override-input"
                      placeholder={String(triggerLeadMiles)}
                      value={data.leadMilesOverride || ''}
                      oninput={(e) => updateDrop(drop.id, 'leadMilesOverride', e.target.value)}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div class="override-field">
                    <label class="override-label">Hold time override (days)</label>
                    <input
                      type="number"
                      class="override-input"
                      placeholder={String(getHoldTimeDays(drop))}
                      value={data.holdTimeOverride || ''}
                      oninput={(e) => updateDrop(drop.id, 'holdTimeOverride', e.target.value)}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div class="override-field">
                    <label class="override-label">ZIP (for General Delivery)</label>
                    <input
                      type="text"
                      class="override-input"
                      placeholder={drop.zip || ''}
                      value={data.zipOverride || ''}
                      oninput={(e) => updateDrop(drop.id, 'zipOverride', e.target.value)}
                    />
                  </div>
                  <div class="override-field">
                    <label class="override-label">Address</label>
                    <input
                      type="text"
                      class="override-input"
                      placeholder={drop.address || ''}
                      value={data.addressOverride || ''}
                      oninput={(e) => updateDrop(drop.id, 'addressOverride', e.target.value)}
                    />
                  </div>
                  <div class="override-field">
                    <label class="override-label">Hours</label>
                    <input
                      type="text"
                      class="override-input"
                      placeholder={drop.hours || ''}
                      value={data.hoursOverride || ''}
                      oninput={(e) => updateDrop(drop.id, 'hoursOverride', e.target.value)}
                    />
                  </div>
                  <div class="override-field">
                    <label class="override-label">Phone</label>
                    <input
                      type="text"
                      class="override-input"
                      placeholder={drop.phone || ''}
                      value={data.phoneOverride || ''}
                      oninput={(e) => updateDrop(drop.id, 'phoneOverride', e.target.value)}
                    />
                  </div>
                </div>
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

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 520px) {
    .field-row { grid-template-columns: 1fr; }
  }

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

  .drops-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
  }

  .controls-left {
    display: flex;
    flex: 1;
    min-width: 240px;
    gap: 0.5rem;
    align-items: center;
  }

  .controls-right {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
  }

  .dir-btn {
    padding: 0.55rem 0.85rem;
    background: var(--pine);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .dir-btn:hover { background: #3a4538; }

  .dir-search {
    flex: 1;
    min-width: 160px;
    padding: 0.55rem 0.85rem;
    border: 2px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
    font-size: 0.9rem;
  }

  .filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.65rem;
    border: 2px solid var(--border);
    border-radius: 999px;
    background: var(--bg);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--muted);
    cursor: pointer;
    user-select: none;
  }

  .filter-pill input { accent-color: var(--pine); }

  .cost-pill {
    padding: 0.45rem 0.65rem;
    border: 2px solid rgba(77,89,74,0.25);
    border-radius: 999px;
    background: rgba(77,89,74,0.06);
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--pine);
    white-space: nowrap;
  }

  .dir-hint,
  .dir-empty {
    padding: 0.875rem 1rem;
    background: rgba(77,89,74,0.06);
    border: 2px dashed rgba(77,89,74,0.25);
    border-radius: 14px;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .dir-empty strong { color: var(--ink); }

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

  .drop-kind {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: rgba(77,89,74,0.08);
    color: var(--pine);
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
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

  .costs-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1.2fr;
    gap: 0.65rem;
    margin-top: 0.875rem;
    padding: 0.75rem;
    background: rgba(77,89,74,0.04);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  @media (max-width: 620px) {
    .costs-row { grid-template-columns: 1fr 1fr; }
    .cost-total { grid-column: 1 / -1; }
  }

  .cost-field { display: flex; flex-direction: column; gap: 0.25rem; }

  .cost-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .cost-input {
    padding: 0.6rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .cost-total {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-weight: 800;
    color: var(--ink);
    font-size: 0.95rem;
  }

  .cost-hint {
    margin-top: 0.25rem;
    font-weight: 700;
    color: var(--muted);
    font-size: 0.75rem;
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

  .po-link {
    color: var(--pine);
    text-decoration: none;
    font-weight: 700;
  }

  .override-grid {
    margin-top: 0.75rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }

  @media (max-width: 520px) {
    .override-grid { grid-template-columns: 1fr; }
  }

  .override-field { display: flex; flex-direction: column; gap: 0.3rem; }

  .override-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .override-input {
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    font-size: 0.85rem;
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
