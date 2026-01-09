<script>
  import { fade } from 'svelte/transition';

  let { trailContext = {} } = $props();

  // Original 14 trail sections
  const sections = [
    { name: 'Georgia', startMile: 0, endMile: 78.5, highlight: 'Sharp climbs, Blood Mountain', emoji: '🏔️' },
    { name: 'Southern NC', startMile: 78.5, endMile: 165.7, highlight: 'Long ridge walks', emoji: '🌲' },
    { name: 'Great Smokies', startMile: 165.7, endMile: 241, highlight: 'Clingmans Dome 6,643 ft', emoji: '⛰️' },
    { name: 'Northern NC/TN', startMile: 241, endMile: 386, highlight: 'Big balds, Damascus', emoji: '🌾' },
    { name: 'Southern Virginia', startMile: 386, endMile: 550, highlight: 'Grayson Highlands ponies', emoji: '🐴' },
    { name: 'Central Virginia', startMile: 550, endMile: 785, highlight: 'Longest state section', emoji: '🛤️' },
    { name: 'Shenandoah', startMile: 785, endMile: 863, highlight: 'Gentle grades, fast miles', emoji: '🦌' },
    { name: 'Northern Virginia', startMile: 863, endMile: 1025, highlight: 'The Roller Coaster', emoji: '🎢' },
    { name: 'Mid-Atlantic', startMile: 1025, endMile: 1290, highlight: 'Harpers Ferry, rocky PA', emoji: '🪨' },
    { name: 'NY-NJ Highlands', startMile: 1290, endMile: 1525, highlight: 'Quick states fall fast', emoji: '🗽' },
    { name: 'Southern New England', startMile: 1525, endMile: 1630, highlight: 'CT & MA rolling hills', emoji: '🍂' },
    { name: 'Vermont', startMile: 1630, endMile: 1791, highlight: 'Green Mountains, mud', emoji: '🌿' },
    { name: 'White Mountains', startMile: 1791, endMile: 1912, highlight: 'Hardest terrain on AT', emoji: '🏔️' },
    { name: 'Maine', startMile: 1912, endMile: 2198, highlight: 'Katahdin awaits!', emoji: '🎯' },
  ];

  // Key trail towns that appear as markers in the timeline
  const trailTowns = [
    { mile: 31, name: 'Neels Gap', highlight: 'First outfitter, first test', emoji: '🏪' },
    { mile: 166, name: 'Fontana Dam', highlight: 'Gateway to the Smokies', emoji: '🏗️' },
    { mile: 274, name: 'Hot Springs', highlight: 'First trail town, hot springs!', emoji: '♨️' },
    { mile: 386, name: 'Damascus', highlight: 'Trail Days, friendliest town', emoji: '🎉' },
    { mile: 702, name: 'Waynesboro', highlight: 'Gateway to Shenandoah', emoji: '🏘️' },
    { mile: 1025, name: 'Harpers Ferry', highlight: 'ATC HQ, psychological halfway', emoji: '🏛️' },
    { mile: 2090, name: 'Monson', highlight: 'Last stop before the wilderness', emoji: '🏕️' },
  ];

  // Numeric achievement milestones
  const milestones = [
    { miles: 100, label: 'First Century', note: 'Triple digits!' },
    { miles: 500, label: '500 Club', note: 'Quarter done' },
    { miles: 1000, label: '1000 Miles', note: 'A thousand stories' },
    { miles: 1099, label: 'Halfway', note: 'The trail breaks even' },
    { miles: 2000, label: '2000 Miles', note: 'Almost home' },
  ];

  const landmarks = [
    { mile: 0, name: 'Springer Mountain' },
    { mile: 31, name: 'Neels Gap' },
    { mile: 78.5, name: 'NC Border' },
    { mile: 110, name: 'Franklin' },
    { mile: 165.7, name: 'Fontana Dam' },
    { mile: 206, name: 'Newfound Gap' },
    { mile: 241, name: 'Davenport Gap' },
    { mile: 274, name: 'Hot Springs' },
    { mile: 386, name: 'Damascus' },
    { mile: 550, name: 'Pearisburg' },
    { mile: 702, name: 'Waynesboro' },
    { mile: 785, name: 'Shenandoah NP' },
    { mile: 1025, name: 'Harpers Ferry' },
    { mile: 1099, name: 'Halfway Point' },
    { mile: 1290, name: 'Delaware Water Gap' },
    { mile: 1400, name: 'Bear Mountain' },
    { mile: 1525, name: 'CT Border' },
    { mile: 1630, name: 'VT Border' },
    { mile: 1791, name: 'White Mountains' },
    { mile: 1912, name: 'Maine Border' },
    { mile: 2090, name: 'Monson' },
    { mile: 2198, name: 'Katahdin' },
  ];

  const TOTAL_MILES = 2198;

  let mode = $derived(trailContext.mode || 'planning');
  let startDate = $derived(trailContext.startDate || '2026-02-15');
  let pace = $derived(trailContext.pace || 15);
  let zeroDaysPerMonth = $derived(trailContext.zeroDaysPerMonth || 4);
  let currentMile = $derived(trailContext.currentMile || 0);
  let tripStartDate = $derived(trailContext.tripStartDate || '2026-02-15');
  let targetPace = $derived(trailContext.targetPace || 15);
  let daysOnTrail = $derived(trailContext.daysOnTrail || 0);
  let effectiveDate = $derived(trailContext.effectiveDate || startDate);

  let mounted = $state(false);

  $effect(() => {
    mounted = true;
  });

  function addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date;
  }

  function daysBetween(date1Str, date2Str) {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateShort(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getTodayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', color: '#22c55e', icon: '🌸' };
    if (month >= 5 && month <= 7) return { name: 'Summer', color: '#f59e0b', icon: '☀️' };
    if (month >= 8 && month <= 10) return { name: 'Fall', color: '#ea580c', icon: '🍂' };
    return { name: 'Winter', color: '#3b82f6', icon: '❄️' };
  }

  function getNearestLandmark(mile) {
    let closest = landmarks[0];
    let minDist = Math.abs(mile - landmarks[0].mile);
    for (const lm of landmarks) {
      const dist = Math.abs(mile - lm.mile);
      if (dist < minDist) {
        minDist = dist;
        closest = lm;
      }
    }
    return closest;
  }

  function getCurrentSection(mile) {
    for (const section of sections) {
      if (mile >= section.startMile && mile < section.endMile) return section;
    }
    return sections[sections.length - 1];
  }

  // Planning calculations
  let zeroDayRatio = $derived(zeroDaysPerMonth / 30);
  let hikingDaysOnly = $derived(Math.ceil(TOTAL_MILES / pace));
  let totalDays = $derived(Math.ceil(hikingDaysOnly / (1 - zeroDayRatio)));
  let totalZeroDays = $derived(totalDays - hikingDaysOnly);

  function getCalendarDayForMile(miles) {
    const hikingDay = Math.ceil(miles / pace);
    return Math.ceil(hikingDay / (1 - zeroDayRatio));
  }

  let calculatedSections = $derived(sections.map((section, i) => {
    const daysToStart = getCalendarDayForMile(section.startMile);
    const daysToEnd = getCalendarDayForMile(section.endMile);
    const arrivalDate = addDays(startDate, daysToStart);
    const completionDate = addDays(startDate, daysToEnd);
    const sectionMiles = section.endMile - section.startMile;
    const sectionCalendarDays = daysToEnd - daysToStart;
    const season = getSeason(arrivalDate);
    return {
      ...section,
      index: i + 1,
      daysToStart,
      daysToEnd,
      arrivalDate,
      completionDate,
      sectionMiles,
      sectionDays: sectionCalendarDays,
      season,
    };
  }));

  let summitDate = $derived(addDays(startDate, totalDays));

  let calculatedMilestones = $derived(milestones.map(m => ({
    ...m,
    date: addDays(startDate, getCalendarDayForMile(m.miles)),
    day: getCalendarDayForMile(m.miles),
  })));

  // Calculate trail town arrival dates
  let calculatedTrailTowns = $derived(trailTowns.map(town => {
    const day = getCalendarDayForMile(town.mile);
    const arrivalDate = addDays(startDate, day);
    const season = getSeason(arrivalDate);
    return {
      ...town,
      day,
      arrivalDate,
      season,
      isTown: true,
    };
  }));

  // Helper: get calendar days for a given number of miles using target pace + zero ratio
  function getCalendarDaysForMiles(miles) {
    const hikingDays = Math.ceil(miles / targetPace);
    return Math.ceil(hikingDays / (1 - zeroDaysPerMonth / 30));
  }

  // Merge sections and trail towns into unified timeline, sorted by mile
  // In trail mode, use TARGET pace to project future dates (not actual pace)
  let timelineItems = $derived(() => {
    function getProjectedDate(mile) {
      if (mode === 'trail') {
        if (mile <= currentMile) {
          // Past - already passed this point
          return null; // We'll show "Done" instead of a date
        } else {
          // Future - project from effectiveDate using TARGET pace
          // effectiveDate = today if start date passed, otherwise start date
          const milesAhead = mile - currentMile;
          const daysAhead = getCalendarDaysForMiles(milesAhead);
          return addDays(effectiveDate, daysAhead);
        }
      } else {
        return addDays(startDate, getCalendarDayForMile(mile));
      }
    }

    function getItemStatus(mile, endMile = null) {
      if (mode !== 'trail') return 'upcoming';
      if (endMile !== null) {
        // Section
        if (currentMile >= endMile) return 'completed';
        if (currentMile >= mile) return 'current';
        return 'upcoming';
      } else {
        // Town
        if (currentMile >= mile) return 'completed';
        return 'upcoming';
      }
    }

    const sectionItems = calculatedSections.map(s => {
      const status = getItemStatus(s.startMile, s.endMile);
      const arrivalDate = getProjectedDate(s.startMile);
      const day = mode === 'trail'
        ? (status === 'completed' ? null : getCalendarDaysForMiles(s.startMile - currentMile) + daysOnTrail)
        : s.daysToStart;
      return {
        ...s,
        mile: s.startMile,
        type: 'section',
        status,
        arrivalDate,
        daysToStart: day,
        season: arrivalDate ? getSeason(arrivalDate) : s.season,
      };
    });

    const townItems = calculatedTrailTowns.map(t => {
      const status = getItemStatus(t.mile);
      const arrivalDate = getProjectedDate(t.mile);
      const day = mode === 'trail'
        ? (status === 'completed' ? null : getCalendarDaysForMiles(t.mile - currentMile) + daysOnTrail)
        : t.day;
      return {
        ...t,
        type: 'town',
        status,
        arrivalDate,
        day,
        season: arrivalDate ? getSeason(arrivalDate) : t.season,
      };
    });

    return [...sectionItems, ...townItems].sort((a, b) => {
      const mileA = a.type === 'section' ? a.startMile : a.mile;
      const mileB = b.type === 'section' ? b.startMile : b.mile;
      return mileA - mileB;
    });
  });

  // Trail mode calculations
  let todayStr = $derived(getTodayStr());
  let milesRemaining = $derived(TOTAL_MILES - currentMile);
  let percentComplete = $derived((currentMile / TOTAL_MILES) * 100);
  // Summit projection: effectiveDate + (remaining miles at target pace with zeros)
  // effectiveDate = today if start date has passed, otherwise start date
  let daysRemaining = $derived(getCalendarDaysForMiles(milesRemaining));
  let projectedFinish = $derived(addDays(effectiveDate, daysRemaining));
  let currentSection = $derived(getCurrentSection(currentMile));
  let nearestLandmark = $derived(getNearestLandmark(currentMile));

  let copyNotification = $state('');

  function copyToClipboard() {
    let text;
    if (mode === 'planning') {
      text = `🥾 AT NOBO ${new Date(startDate).getFullYear()} Plan

📅 Start: ${formatDate(new Date(startDate))}
🏔️ Summit: ${formatDate(summitDate)}
📊 Pace: ${pace} mi/day
⏱️ Duration: ${totalDays} days (${hikingDaysOnly} hiking + ${totalZeroDays} zeros)

Section Timeline:
${calculatedSections.map(s => `• ${s.name} (Mi ${s.startMile.toFixed(0)}-${s.endMile.toFixed(0)}) - ${formatDateShort(s.arrivalDate)}`).join('\n')}

hoggcountry.com/tools`;
    } else {
      text = `🥾 AT Trail Update

📍 Mile ${currentMile.toFixed(0)} - near ${nearestLandmark.name}
✅ ${percentComplete.toFixed(1)}% complete
📊 ${milesRemaining.toFixed(0)} miles to go

🎯 Summit: ${formatDate(projectedFinish)}
   at ${targetPace} mi/day + ${zeroDaysPerMonth} zeros/mo

hoggcountry.com/tools`;
    }

    navigator.clipboard.writeText(text);
    copyNotification = 'Copied to clipboard!';
    setTimeout(() => copyNotification = '', 2000);
  }
</script>

<div class="milestone-calc" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        <path d="M12 8l3 4-3 4-3-4z" fill="currentColor"/>
      </svg>
    </div>
    <div class="header-content">
      <h2>JOURNEY NAVIGATOR</h2>
      <p>{mode === 'planning' ? 'Plan your path from Springer to Katahdin' : 'Track your progress on the AT'}</p>
    </div>
    <div class="header-badge">
      <span>{mode === 'planning' ? 'PLANNING' : 'ON TRAIL'}</span>
    </div>
  </header>

  {#if mode === 'planning'}
    <!-- PLANNING MODE -->

    <!-- Big Stats -->
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-label">HIKING DAYS</span>
          <div class="stat-value">{hikingDaysOnly}</div>
          <span class="stat-sub">days on trail</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">TOTAL DURATION</span>
          <div class="stat-value">{totalDays}</div>
          <span class="stat-sub">+{totalZeroDays} zero days</span>
        </div>
        <div class="stat-box summit">
          <span class="stat-label">SUMMIT DATE</span>
          <div class="stat-value summit-date">
            <span class="summit-icon">🏔️</span>
            {formatDate(summitDate)}
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section class="timeline-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        SECTION BREAKDOWN
      </h3>
      <div class="timeline">
        {#each timelineItems() as item, i}
          {#if item.type === 'section'}
            <!-- Section -->
            <div class="timeline-item" style="animation-delay: {i * 30}ms">
              <div class="item-date">
                <span class="date-main">{formatDateShort(item.arrivalDate)}</span>
                <span class="date-day">Day {item.daysToStart}</span>
              </div>
              <div class="item-marker">
                <div class="marker-line" class:first={i===0}></div>
                <div class="marker-dot" style="background: {item.season.color}">{item.index}</div>
                <div class="marker-line"></div>
              </div>
              <div class="item-content">
                <div class="section-card">
                  <div class="card-header">
                    <span class="card-emoji">{item.emoji}</span>
                    <span class="card-name">{item.name}</span>
                    <span class="card-mile-badge">Mile {item.startMile.toFixed(0)}</span>
                  </div>
                  <div class="card-details">
                    <span class="card-length">{item.sectionMiles.toFixed(0)} mi</span>
                    <span class="card-separator">•</span>
                    <span class="card-highlight">{item.highlight}</span>
                  </div>
                  <div class="card-footer">
                    <span class="card-end-mile">ends Mile {item.endMile.toFixed(0)}</span>
                    <span class="card-season" style="color: {item.season.color}">{item.season.icon} {item.season.name}</span>
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <!-- Trail Town -->
            <div class="timeline-item town" style="animation-delay: {i * 30}ms">
              <div class="item-date">
                <span class="date-main">{formatDateShort(item.arrivalDate)}</span>
                <span class="date-day">Day {item.day}</span>
              </div>
              <div class="item-marker">
                <div class="marker-line"></div>
                <div class="marker-dot town">{item.emoji}</div>
                <div class="marker-line"></div>
              </div>
              <div class="item-content">
                <div class="town-card">
                  <div class="town-header">
                    <span class="town-name">{item.name}</span>
                    <span class="town-mile">Mile {item.mile}</span>
                  </div>
                  <span class="town-highlight">{item.highlight}</span>
                </div>
              </div>
            </div>
          {/if}
        {/each}

        <!-- Summit -->
        <div class="timeline-item summit" style="animation-delay: {calculatedSections.length * 40}ms">
          <div class="item-date">
            <span class="date-main">{formatDateShort(summitDate)}</span>
            <span class="date-day">Day {totalDays}</span>
          </div>
          <div class="item-marker">
            <div class="marker-line top-only"></div>
            <div class="marker-dot summit">★</div>
          </div>
          <div class="item-content">
            <div class="summit-card">
              <div class="summit-header">
                <h4>KATAHDIN</h4>
                <span class="summit-mile">Mile 2,198</span>
              </div>
              <p>The Northern Terminus</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Milestones -->
    <section class="milestones-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        KEY MILESTONES
      </h3>
      <div class="milestones-grid">
        {#each calculatedMilestones as ms}
          <div class="milestone-card">
            <div class="ms-miles">{ms.miles}</div>
            <div class="ms-info">
              <span class="ms-label">{ms.label}</span>
              <span class="ms-date">{formatDateShort(ms.date)}</span>
            </div>
          </div>
        {/each}
      </div>
    </section>

  {:else}
    <!-- TRAIL MODE - Same timeline view with progress context -->

    <!-- Compact Progress Summary -->
    <section class="progress-summary">
      <div class="summary-stats">
        <div class="summary-stat main">
          <span class="ss-value">{currentMile.toFixed(0)}</span>
          <span class="ss-label">miles hiked</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value">{percentComplete.toFixed(0)}%</span>
          <span class="ss-label">complete</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value">{milesRemaining.toFixed(0)}</span>
          <span class="ss-label">miles to go</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value">{daysRemaining}</span>
          <span class="ss-label">days to go</span>
        </div>
      </div>
      <div class="summary-projection">
        <span class="proj-label">Summit:</span>
        <span class="proj-date">{formatDate(projectedFinish)}</span>
        <span class="proj-pace">at {targetPace} mi/day + {zeroDaysPerMonth} zeros/mo</span>
      </div>
    </section>

    <!-- Unified Timeline -->
    <section class="timeline-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        YOUR JOURNEY
      </h3>
      <div class="timeline">
        {#each timelineItems() as item, i}
          {#if item.type === 'section'}
            <!-- Section -->
            <div class="timeline-item {item.status}" style="animation-delay: {i * 30}ms">
              <div class="item-date">
                {#if item.status === 'completed'}
                  <span class="date-main completed">✓</span>
                  <span class="date-day">Done</span>
                {:else if item.status === 'current'}
                  <span class="date-main current">NOW</span>
                  <span class="date-day">Day {daysOnTrail}</span>
                {:else}
                  <span class="date-main">{formatDateShort(item.arrivalDate)}</span>
                  <span class="date-day">~Day {item.daysToStart}</span>
                {/if}
              </div>
              <div class="item-marker">
                <div class="marker-line" class:first={i===0}></div>
                <div class="marker-dot {item.status}" style="background: {item.status === 'completed' ? '#9ca3af' : item.status === 'current' ? '#22c55e' : item.season.color}">
                  {#if item.status === 'completed'}✓{:else}{item.index}{/if}
                </div>
                <div class="marker-line"></div>
              </div>
              <div class="item-content">
                <div class="section-card {item.status}">
                  <div class="card-header">
                    <span class="card-emoji">{item.emoji}</span>
                    <span class="card-name">{item.name}</span>
                    <span class="card-mile-badge">Mile {item.startMile.toFixed(0)}</span>
                  </div>
                  {#if item.status === 'current'}
                    <div class="card-details">
                      <span class="card-length">{item.sectionMiles.toFixed(0)} mi section</span>
                      <span class="card-separator">•</span>
                      <span class="card-highlight">ends Mile {item.endMile.toFixed(0)}</span>
                    </div>
                    <div class="current-progress-inline">
                      <div class="progress-track-inline">
                        <div class="progress-fill-inline" style="width: {((currentMile - item.startMile) / (item.endMile - item.startMile)) * 100}%"></div>
                      </div>
                      <span class="progress-label-inline">{(item.endMile - currentMile).toFixed(0)} mi to go</span>
                    </div>
                  {:else}
                    <div class="card-details">
                      <span class="card-length">{item.sectionMiles.toFixed(0)} mi</span>
                      <span class="card-separator">•</span>
                      <span class="card-highlight">{item.highlight}</span>
                    </div>
                    {#if item.status !== 'completed'}
                      <div class="card-footer">
                        <span class="card-end-mile">ends Mile {item.endMile.toFixed(0)}</span>
                        <span class="card-season" style="color: {item.season.color}">{item.season.icon} {item.season.name}</span>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <!-- Trail Town -->
            <div class="timeline-item town {item.status}" style="animation-delay: {i * 30}ms">
              <div class="item-date">
                {#if item.status === 'completed'}
                  <span class="date-main completed">✓</span>
                  <span class="date-day">Done</span>
                {:else}
                  <span class="date-main">{formatDateShort(item.arrivalDate)}</span>
                  <span class="date-day">~Day {item.day}</span>
                {/if}
              </div>
              <div class="item-marker">
                <div class="marker-line"></div>
                <div class="marker-dot town {item.status}">{item.emoji}</div>
                <div class="marker-line"></div>
              </div>
              <div class="item-content">
                <div class="town-card {item.status}">
                  <div class="town-header">
                    <span class="town-name">{item.name}</span>
                    <span class="town-mile">Mile {item.mile}</span>
                  </div>
                  <span class="town-highlight">{item.highlight}</span>
                </div>
              </div>
            </div>
          {/if}
        {/each}

        <!-- Summit -->
        <div class="timeline-item summit" style="animation-delay: {timelineItems().length * 30}ms">
          <div class="item-date">
            <span class="date-main">{formatDateShort(projectedFinish)}</span>
            <span class="date-day">~Day {daysOnTrail + daysRemaining}</span>
          </div>
          <div class="item-marker">
            <div class="marker-line top-only"></div>
            <div class="marker-dot summit">★</div>
          </div>
          <div class="item-content">
            <div class="summit-card">
              <div class="summit-header">
                <h4>KATAHDIN</h4>
                <span class="summit-mile">Mile 2,198</span>
              </div>
              <p>The Northern Terminus</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Milestones with progress -->
    <section class="milestones-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        KEY MILESTONES
      </h3>
      <div class="milestones-grid">
        {#each calculatedMilestones as ms}
          <div class="milestone-card" class:achieved={currentMile >= ms.miles}>
            <div class="ms-miles">{ms.miles}</div>
            <div class="ms-info">
              <span class="ms-label">{ms.label}</span>
              {#if currentMile >= ms.miles}
                <span class="ms-achieved">✓ Achieved</span>
              {:else}
                <span class="ms-date">{(ms.miles - currentMile).toFixed(0)} mi away</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Footer -->
  <footer class="calc-footer">
    <button class="share-btn" onclick={copyToClipboard}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      {mode === 'planning' ? 'Copy Plan' : 'Copy Update'}
    </button>
    {#if copyNotification}
      <span class="copy-toast" transition:fade={{ duration: 150 }}>{copyNotification}</span>
    {/if}
  </footer>

  <!-- Guide Link -->
  <a href="/guide/02-trail-sections-and-milestones" class="guide-link">
    <span>Read the Trail Section Guide</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </a>
</div>

<style>
  .milestone-calc {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .milestone-calc.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
    border-bottom: 2px solid #1e3a5f;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #bfdbfe;
  }

  .header-icon svg {
    width: 28px;
    height: 28px;
  }

  .header-content {
    flex: 1;
  }

  .header-content h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
  }

  .header-content p {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    color: #bfdbfe;
  }

  .header-badge {
    padding: 0.35rem 0.75rem;
    background: rgba(255,255,255,0.2);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 6px;
  }

  .header-badge span {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.1em;
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.25rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--pine);
    letter-spacing: 0.08em;
  }

  .header-bar {
    width: 4px;
    height: 16px;
    background: var(--marker);
    border-radius: 2px;
  }

  /* Stats Section */
  .stats-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat-box {
    text-align: center;
    padding: 1.25rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 12px;
  }

  .stat-box.summit {
    border-color: var(--marker);
    background: rgba(240, 224, 0, 0.08);
  }

  .stat-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-value.summit-date {
    font-size: 1.25rem;
    color: var(--terra);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .summit-icon {
    font-size: 1.5rem;
  }

  .stat-sub {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.35rem;
  }

  /* Timeline */
  .timeline-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .timeline {
    position: relative;
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 70px 40px 1fr;
    gap: 0;
    opacity: 0;
    transform: translateY(8px);
    animation: fadeIn 0.4s ease forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .item-date {
    text-align: right;
    padding-right: 0.5rem;
    padding-top: 0.5rem;
  }

  .date-main {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine);
  }

  .date-day {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .item-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .marker-line {
    width: 2px;
    flex: 1;
    background: var(--border);
  }

  .marker-line.first {
    background: transparent;
  }

  .marker-line.last,
  .marker-line.top-only {
    flex: 0;
    height: 12px;
  }

  .marker-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--alpine);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    z-index: 2;
    flex-shrink: 0;
  }

  .marker-dot.summit {
    background: var(--marker);
    color: var(--ink);
    font-size: 0.9rem;
  }

  .item-content {
    padding: 0.5rem 0 1.25rem 0.5rem;
  }

  .section-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .card-emoji {
    font-size: 1.1rem;
  }

  .card-name {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
  }

  .card-mile-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--alpine);
    background: rgba(30, 58, 95, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(30, 58, 95, 0.2);
  }

  .card-details {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    margin-bottom: 0.35rem;
  }

  .card-length {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  .card-separator {
    color: var(--muted);
  }

  .card-highlight {
    color: var(--muted);
    font-style: italic;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.7rem;
  }

  .card-end-mile {
    color: var(--muted);
    font-family: Oswald, sans-serif;
  }

  .card-season {
    font-weight: 600;
  }

  /* Trail Town Cards */
  .timeline-item.town {
    opacity: 0.95;
  }

  .marker-dot.town {
    background: #f59e0b !important;
    font-size: 0.8rem;
    width: 28px;
    height: 28px;
  }

  .marker-dot.town.completed {
    background: #9ca3af !important;
    opacity: 0.7;
  }

  .town-card {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04));
    border: 2px solid rgba(245, 158, 11, 0.4);
    border-radius: 10px;
    padding: 0.65rem 0.9rem;
  }

  .town-card.completed {
    background: var(--bg);
    border-color: var(--border);
    opacity: 0.6;
  }

  .town-card.completed .town-name,
  .town-card.completed .town-mile {
    color: var(--muted);
  }

  /* Section status styles */
  .timeline-item.completed {
    opacity: 0.6;
  }

  .section-card.completed {
    background: var(--bg);
    border-color: var(--border);
  }

  .section-card.completed .card-name,
  .section-card.completed .card-miles {
    color: var(--muted);
  }

  .section-card.current {
    border-color: #22c55e;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02));
  }

  .marker-dot.completed {
    background: #9ca3af !important;
    color: #fff;
  }

  .marker-dot.current {
    background: #22c55e !important;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  }

  .date-main.completed {
    color: #22c55e;
    font-size: 1rem;
  }

  .date-main.current {
    color: #22c55e;
    font-weight: 700;
  }

  /* Inline progress for current section */
  .current-progress-inline {
    margin-top: 0.5rem;
  }

  .progress-track-inline {
    height: 6px;
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill-inline {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #16a34a);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .progress-label-inline {
    display: block;
    text-align: right;
    font-size: 0.7rem;
    color: #22c55e;
    font-weight: 600;
    margin-top: 0.25rem;
  }

  /* Progress Summary (trail mode header) */
  .progress-summary {
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.02));
    border-bottom: 2px solid var(--border);
  }

  .summary-stats {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .summary-stat {
    text-align: center;
  }

  .summary-stat.main {
    flex: 1.5;
  }

  .ss-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .summary-stat.main .ss-value {
    font-size: 2rem;
    color: var(--pine);
  }

  .summary-stat.status .ss-value {
    color: var(--status-color);
  }

  .ss-label {
    display: block;
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-top: 0.15rem;
  }

  .summary-projection {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .summary-projection .proj-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .summary-projection .proj-date {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--pine);
  }

  .summary-projection .proj-pace {
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Achieved milestones */
  .milestone-card.achieved {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.02));
    border-color: #22c55e;
  }

  .milestone-card.achieved .ms-miles {
    color: #22c55e;
  }

  .ms-achieved {
    font-size: 0.7rem;
    color: #22c55e;
    font-weight: 600;
  }

  .town-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.2rem;
  }

  .town-name {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #b45309;
  }

  .town-mile {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: #d97706;
    background: rgba(245, 158, 11, 0.15);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .town-highlight {
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  .summit-card {
    background: linear-gradient(135deg, var(--pine), #1a2e1a);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .summit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .summit-card h4 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    letter-spacing: 0.1em;
  }

  .summit-mile {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--marker);
    background: rgba(0,0,0,0.2);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .summit-card p {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    opacity: 0.8;
  }

  /* Milestones */
  .milestones-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .milestones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .milestone-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.1), rgba(240, 224, 0, 0.02));
    border: 2px solid rgba(240, 224, 0, 0.4);
    border-radius: 10px;
  }

  .ms-miles {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--pine);
    min-width: 50px;
  }

  .ms-info {
    display: flex;
    flex-direction: column;
  }

  .ms-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ink);
  }

  .ms-date {
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Dashboard */
  .dashboard-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .dashboard-hero {
    display: flex;
    gap: 2rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .progress-ring-container {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .progress-ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: var(--border);
    stroke-width: 10;
  }

  .ring-fill {
    fill: none;
    stroke: url(#ringGrad);
    stroke-width: 10;
    stroke-linecap: round;
    transition: stroke-dasharray 0.6s ease;
  }

  .ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .ring-percent {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .ring-label {
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hero-stats {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
  }

  .hs-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .hs-label {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .hero-stat.status .hs-value {
    color: var(--status-color);
  }

  .pace-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .pace-card {
    text-align: center;
    padding: 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .pace-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .pace-unit {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-top: 0.25rem;
  }

  .pace-note {
    display: block;
    font-size: 0.7rem;
    color: var(--alpine);
    margin-top: 0.15rem;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .quick-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .qc-icon {
    font-size: 1.25rem;
  }

  .qc-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .qc-label {
    font-size: 0.65rem;
    color: var(--muted);
  }

  /* Current Section */
  .current-section {
    padding: 0 1.5rem 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .current-card {
    padding: 1.25rem;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.02));
    border: 2px solid #22c55e;
    border-radius: 12px;
  }

  .current-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .current-emoji {
    font-size: 1.75rem;
  }

  .current-info {
    display: flex;
    flex-direction: column;
  }

  .current-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .current-highlight {
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
  }

  .current-progress {
    margin-top: 0.5rem;
  }

  .progress-track {
    height: 10px;
    background: rgba(0,0,0,0.1);
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #16a34a);
    border-radius: 5px;
    transition: width 0.4s ease;
  }

  .progress-label {
    display: block;
    text-align: right;
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.5rem;
  }

  /* Next Milestone */
  .next-milestone {
    padding: 0 1.5rem 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .nm-card {
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.12), rgba(240, 224, 0, 0.02));
    border: 2px solid rgba(240, 224, 0, 0.5);
    border-radius: 10px;
  }

  .nm-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  .nm-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nm-info {
    display: flex;
    flex-direction: column;
  }

  .nm-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .nm-note {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .nm-distance {
    text-align: right;
  }

  .nm-miles {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .nm-unit {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Projections */
  .projections-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .proj-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .proj-card {
    padding: 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
  }

  .proj-card.current {
    border-color: var(--pine);
  }

  .proj-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  .proj-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  .proj-pace {
    font-size: 0.75rem;
    color: var(--pine);
    font-weight: 600;
  }

  .proj-date {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
  }

  .proj-days {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .proj-target-date {
    font-size: 0.75rem;
    color: var(--terra);
    font-weight: 600;
  }

  .proj-pace-needed {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .ppn-value {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--terra);
    line-height: 1;
  }

  .ppn-unit {
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Remaining Sections */
  .remaining-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .remaining-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rem-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
  }

  .rem-item.current {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.05);
  }

  .rem-emoji {
    font-size: 1.25rem;
  }

  .rem-info {
    flex: 1;
  }

  .rem-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .rem-name {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
  }

  .rem-badge {
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.1rem 0.35rem;
    background: #22c55e;
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rem-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Footer */
  .calc-footer {
    padding: 1.25rem 1.5rem;
    background: var(--bg);
    text-align: center;
    border-bottom: 2px solid var(--border);
    position: relative;
  }

  .share-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--pine);
    border: 2px solid var(--pine);
    border-radius: 8px;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .share-btn svg {
    width: 18px;
    height: 18px;
  }

  .share-btn:hover {
    background: var(--alpine);
    border-color: var(--alpine);
  }

  .copy-toast {
    display: inline-block;
    margin-left: 1rem;
    padding: 0.5rem 1rem;
    background: #22c55e;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 6px;
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--pine);
    color: #fff;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    transition: all 0.2s;
  }

  .guide-link:hover {
    background: var(--alpine);
  }

  .guide-link svg {
    width: 18px;
    height: 18px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .stat-box {
      padding: 1rem;
    }

    .stat-value {
      font-size: 2rem;
    }

    .timeline-item {
      grid-template-columns: 55px 32px 1fr;
    }

    .date-main {
      font-size: 0.7rem;
    }

    .marker-dot {
      width: 20px;
      height: 20px;
      font-size: 0.6rem;
    }

    .milestones-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-hero {
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero-stats {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }

    .hero-stat {
      text-align: center;
      min-width: 80px;
    }

    .pace-grid,
    .quick-grid {
      grid-template-columns: 1fr;
    }

    .proj-grid {
      grid-template-columns: 1fr;
    }

    .header-badge {
      display: none;
    }
  }
</style>
