<script>
  // Accept global trail context from parent
  let { trailContext = {} } = $props();

  // Trail sections data
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

  // Milestones to celebrate
  const milestones = [
    { miles: 100, label: 'First Century', note: 'Triple digits!' },
    { miles: 500, label: '500 Club', note: 'Quarter done' },
    { miles: 1000, label: '1000 Miles', note: 'A thousand stories' },
    { miles: 1099, label: 'Halfway', note: 'The trail breaks even' },
    { miles: 2000, label: '2000 Miles', note: 'Almost home' },
  ];

  // Trail towns for mile marker context
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

  // Extract values from global trail context (with defaults for SSR)
  let mode = $derived(trailContext.mode || 'planning');
  let startDate = $derived(trailContext.startDate || '2026-02-15');
  let pace = $derived(trailContext.pace || 15);
  let zeroDaysPerMonth = $derived(trailContext.zeroDaysPerMonth || 4);
  let currentMile = $derived(trailContext.currentMile || 500);
  let tripStartDate = $derived(trailContext.tripStartDate || '2026-02-15');
  let targetPace = $derived(trailContext.targetPace || 15);
  let zeroDaysTaken = $derived(trailContext.zeroDaysTaken || 5);

  let mounted = $state(false);

  $effect(() => {
    mounted = true;
  });

  // Helper to add days to a date
  function addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date;
  }

  // Days between two dates
  function daysBetween(date1Str, date2Str) {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    const diff = d2 - d1;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Format date nicely
  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Format date short
  function formatDateShort(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // Get today as YYYY-MM-DD
  function getTodayStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  // Get season for a date
  function getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', color: '#a6b589', icon: '🌸' };
    if (month >= 5 && month <= 7) return { name: 'Summer', color: '#d97706', icon: '☀️' };
    if (month >= 8 && month <= 10) return { name: 'Fall', color: '#c45d2c', icon: '🍂' };
    return { name: 'Winter', color: '#6b8cae', icon: '❄️' };
  }

  // Get nearest landmark for a mile
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

  // Get current section for a mile
  function getCurrentSection(mile) {
    for (const section of sections) {
      if (mile >= section.startMile && mile < section.endMile) {
        return section;
      }
    }
    return sections[sections.length - 1]; // Maine if past all
  }

  // ========== PLANNING MODE CALCULATIONS ==========
  // Convert zero days per month to zero days per hiking day ratio
  // Assuming ~30 days/month and ~25 hiking days/month at average pace
  let zeroDayRatio = $derived(zeroDaysPerMonth / 30); // Fraction of days that are zeros

  // Calculate total calendar days including zeros
  // hikingDays = TOTAL_MILES / pace
  // calendarDays = hikingDays / (1 - zeroDayRatio)
  let hikingDaysOnly = $derived(Math.ceil(TOTAL_MILES / pace));
  let totalDays = $derived(Math.ceil(hikingDaysOnly / (1 - zeroDayRatio)));
  let totalZeroDays = $derived(totalDays - hikingDaysOnly);

  // Helper to get calendar day for a given mile marker (accounting for zeros spread throughout)
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
    const sectionHikingDays = Math.ceil(sectionMiles / pace);
    const sectionCalendarDays = daysToEnd - daysToStart;
    const season = getSeason(arrivalDate);
    const progress = (section.endMile / TOTAL_MILES) * 100;

    return {
      ...section,
      index: i + 1,
      daysToStart,
      daysToEnd,
      arrivalDate,
      completionDate,
      sectionMiles,
      sectionDays: sectionCalendarDays,
      sectionHikingDays,
      season,
      progress,
    };
  }));

  let summitDate = $derived(addDays(startDate, totalDays));

  let calculatedMilestones = $derived(milestones.map(m => ({
    ...m,
    date: addDays(startDate, getCalendarDayForMile(m.miles)),
    day: getCalendarDayForMile(m.miles),
  })));

  // ========== TRAIL MODE CALCULATIONS ==========
  let todayStr = $derived(getTodayStr());
  let daysOnTrail = $derived(Math.max(1, daysBetween(tripStartDate, todayStr)));
  let hikingDaysActual = $derived(Math.max(1, daysOnTrail - zeroDaysTaken));

  // Two pace metrics: overall (calendar) and hiking-only
  let actualPaceOverall = $derived(currentMile / daysOnTrail); // Calendar pace (lower)
  let actualPaceHiking = $derived(currentMile / hikingDaysActual); // Hiking day pace (true pace)
  let actualPace = $derived(actualPaceOverall); // For display compatibility

  let milesRemaining = $derived(TOTAL_MILES - currentMile);
  let percentComplete = $derived((currentMile / TOTAL_MILES) * 100);

  // Zero day frequency so far
  let zeroDayFrequency = $derived(daysOnTrail > 0 ? (zeroDaysTaken / daysOnTrail) * 30 : 0); // zeros per 30 days

  // Projected finish at current pace (assuming same zero day pattern continues)
  let hikingDaysRemaining = $derived(actualPaceHiking > 0 ? Math.ceil(milesRemaining / actualPaceHiking) : 999);
  let projectedZeroDaysRemaining = $derived(Math.round(hikingDaysRemaining * (zeroDaysTaken / hikingDaysActual)));
  let daysRemaining = $derived(hikingDaysRemaining + projectedZeroDaysRemaining);
  let projectedFinish = $derived(addDays(todayStr, daysRemaining));

  // Original plan finish (using same zero day assumption from planning)
  let originalHikingDays = $derived(Math.ceil(TOTAL_MILES / targetPace));
  let originalTotalDays = $derived(Math.ceil(originalHikingDays * 1.15)); // Assume ~4 zeros/month
  let originalFinish = $derived(addDays(tripStartDate, originalTotalDays));
  let originalDayForCurrentMile = $derived(Math.ceil(Math.ceil(currentMile / targetPace) * 1.15));

  // Ahead or behind
  let daysAheadBehind = $derived(originalDayForCurrentMile - daysOnTrail);
  let statusLabel = $derived(daysAheadBehind > 0
    ? `${daysAheadBehind} day${daysAheadBehind !== 1 ? 's' : ''} ahead`
    : daysAheadBehind < 0
      ? `${Math.abs(daysAheadBehind)} day${Math.abs(daysAheadBehind) !== 1 ? 's' : ''} behind`
      : 'Right on schedule');
  let statusColor = $derived(daysAheadBehind > 0 ? 'var(--alpine)' : daysAheadBehind < 0 ? 'var(--terra)' : 'var(--pine)');

  // Pace needed to hit original target date
  let daysUntilTarget = $derived(daysBetween(todayStr, originalFinish.toISOString().split('T')[0]));
  let paceToHitTarget = $derived(daysUntilTarget > 0 ? (milesRemaining / daysUntilTarget).toFixed(1) : '—');

  // Current section and next milestone
  let currentSection = $derived(getCurrentSection(currentMile));
  let milesToSectionEnd = $derived(currentSection.endMile - currentMile);
  let nearestLandmark = $derived(getNearestLandmark(currentMile));

  // Next upcoming milestone
  let nextMilestone = $derived(milestones.find(m => m.miles > currentMile) || null);
  let milesToNextMilestone = $derived(nextMilestone ? nextMilestone.miles - currentMile : 0);

  // Remaining sections (including current, partially)
  let remainingSections = $derived(sections.filter(s => s.endMile > currentMile).map((section, i) => {
    const effectiveStart = Math.max(section.startMile, currentMile);
    const milesInSection = section.endMile - effectiveStart;
    const daysToComplete = Math.ceil(milesInSection / actualPace);
    const arrivalDate = i === 0 ? new Date() : addDays(todayStr, Math.ceil((section.startMile - currentMile) / actualPace));
    const season = getSeason(arrivalDate);

    return {
      ...section,
      milesRemaining: milesInSection,
      daysToComplete,
      arrivalDate,
      season,
      isCurrent: currentMile >= section.startMile && currentMile < section.endMile,
    };
  }));

  // Generate shareable text (works for both modes)
  function generateShareText() {
    if (mode === 'planning') {
      const start = new Date(startDate);
      const text = `🥾 My AT NOBO 2026 Plan

📅 Start: ${formatDate(start)} at Springer Mountain
🎯 Summit: ${formatDate(summitDate)} at Katahdin
📊 Pace: ${pace} miles/day
⏱️ Duration: ${totalDays} days

Key Milestones:
${calculatedMilestones.map(m => `• ${m.label}: Day ${m.day} (${formatDateShort(m.date)})`).join('\n')}

Generated at hoggcountry.com/tools`;

      if (navigator.share) {
        navigator.share({ title: 'My AT Thru-Hike Plan', text });
      } else {
        navigator.clipboard.writeText(text);
        alert('Plan copied to clipboard!');
      }
    } else {
      const text = `🥾 AT NOBO Trail Update - Day ${daysOnTrail}

📍 Mile ${currentMile.toFixed(0)} near ${nearestLandmark.name}
📊 Pace: ${actualPace.toFixed(1)} mi/day
✅ ${percentComplete.toFixed(1)}% complete
${daysAheadBehind >= 0 ? '🟢' : '🟠'} ${statusLabel}

📈 ${milesRemaining.toFixed(0)} miles to Katahdin
🎯 Projected summit: ${formatDate(projectedFinish)}

Generated at hoggcountry.com/tools`;

      if (navigator.share) {
        navigator.share({ title: 'AT Trail Update', text });
      } else {
        navigator.clipboard.writeText(text);
        alert('Update copied to clipboard!');
      }
    }
  }
</script>

<div class="milestone-calc">
  <!-- Header -->
  <header class="calc-header">
    <div class="header-inner">
      <span class="header-badge">AT 2026 NOBO</span>
      <h2 class="header-title">Milestone Planner</h2>
      <p class="header-sub">
        {mode === 'planning' ? 'Plan your journey from Springer to Katahdin' : 'Track your progress on the trail'}
      </p>
    </div>
  </header>

  {#if mode === 'planning'}
    <!-- ========== PLANNING MODE ========== -->
    <!-- Big Stats -->
    <div class="stats-grid-3">
      <div class="stat-card">
        <span class="stat-label">Hiking Days</span>
        <div class="stat-main">
          <span class="stat-num">{hikingDaysOnly}</span>
          <span class="stat-unit">days</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Duration</span>
        <div class="stat-main">
          <span class="stat-num">{totalDays}</span>
          <span class="stat-unit">days</span>
        </div>
        <span class="stat-sub">(+{totalZeroDays} zeros)</span>
      </div>
      <div class="stat-card highlight">
        <span class="stat-label">Summit Date</span>
        <div class="stat-main">
          <span class="stat-icon">🏔️</span>
          <span class="stat-text">{formatDate(summitDate)}</span>
        </div>
      </div>
    </div>

    <!-- Timeline Visual -->
    <div class="timeline-container">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Section Breakdown</span>
      </h3>

      <div class="timeline-list">
        {#each calculatedSections as section, i}
          <div class="timeline-row" class:mounted style="animation-delay: {i * 30}ms">
            <div class="time-col">
              <span class="time-date">{formatDateShort(section.arrivalDate)}</span>
              <span class="time-day">Day {section.daysToStart}</span>
            </div>

            <div class="marker-col">
              <div class="marker-line" class:first={i===0} class:last={i===calculatedSections.length-1}></div>
              <div class="marker-dot" style="background: {section.season.color}">
                {#if i === 0}S{:else}{section.index}{/if}
              </div>
            </div>

            <div class="content-col">
              <div class="section-card">
                <div class="card-head">
                  <span class="card-icon">{section.emoji}</span>
                  <span class="card-name">{section.name}</span>
                  <span class="card-miles">{section.sectionMiles.toFixed(0)} mi</span>
                </div>
                <div class="card-meta">
                  <span class="meta-tag">{section.highlight}</span>
                  <span class="meta-season" style="color: {section.season.color}">
                    {section.season.icon} {section.season.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/each}

        <!-- Summit Row -->
        <div class="timeline-row summit" class:mounted style="animation-delay: {calculatedSections.length * 30}ms">
          <div class="time-col">
            <span class="time-date">{formatDateShort(summitDate)}</span>
            <span class="time-day">Day {totalDays}</span>
          </div>
          <div class="marker-col">
            <div class="marker-line top"></div>
            <div class="marker-dot summit">★</div>
          </div>
          <div class="content-col">
            <div class="summit-card">
              <div class="summit-content">
                <h4>Katahdin</h4>
                <p>The Northern Terminus</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Milestones Grid -->
    <div class="milestones-container">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Key Milestones</span>
      </h3>
      <div class="milestones-grid">
        {#each calculatedMilestones as milestone}
          <div class="milestone-box">
            <div class="ms-miles">{milestone.miles}</div>
            <div class="ms-content">
              <span class="ms-label">{milestone.label}</span>
              <span class="ms-date">{formatDateShort(milestone.date)}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

  {:else}
    <!-- ========== TRAIL MODE ========== -->
    <!-- Status Dashboard -->
    <div class="trail-dashboard">
      <div class="status-hero">
        <div class="hero-progress">
          <svg viewBox="0 0 120 120" class="progress-ring">
            <circle cx="60" cy="60" r="52" class="ring-bg" />
            <circle
              cx="60" cy="60" r="52"
              class="ring-fill"
              style="stroke-dasharray: {326.7 * (percentComplete / 100)} 326.7"
            />
          </svg>
          <div class="hero-center">
            <span class="hero-pct">{percentComplete.toFixed(0)}%</span>
            <span class="hero-label">complete</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hs-val">{daysOnTrail}</span>
            <span class="hs-label">Days on trail</span>
          </div>
          <div class="hero-stat">
            <span class="hs-val">{hikingDaysActual}</span>
            <span class="hs-label">Hiking days</span>
          </div>
          <div class="hero-stat status-indicator" style="--status-color: {statusColor}">
            <span class="hs-val">{daysAheadBehind >= 0 ? '+' : ''}{daysAheadBehind}</span>
            <span class="hs-label">{statusLabel}</span>
          </div>
        </div>
      </div>

      <!-- Pace Breakdown -->
      <div class="pace-breakdown">
        <div class="pb-item">
          <div class="pb-val">{actualPaceHiking.toFixed(1)}</div>
          <div class="pb-label">mi/hiking day</div>
          <div class="pb-sub">Your true pace</div>
        </div>
        <div class="pb-divider"></div>
        <div class="pb-item">
          <div class="pb-val">{actualPaceOverall.toFixed(1)}</div>
          <div class="pb-label">mi/calendar day</div>
          <div class="pb-sub">Includes {zeroDaysTaken} zero{zeroDaysTaken !== 1 ? 's' : ''}</div>
        </div>
        <div class="pb-divider"></div>
        <div class="pb-item">
          <div class="pb-val">{zeroDayFrequency.toFixed(1)}</div>
          <div class="pb-label">zeros/month</div>
          <div class="pb-sub">{zeroDayFrequency <= 4 ? 'Efficient' : zeroDayFrequency <= 6 ? 'Normal' : 'Relaxed'}</div>
        </div>
      </div>

      <!-- Quick Stats Row -->
      <div class="quick-stats">
        <div class="qs-card">
          <span class="qs-icon">📍</span>
          <div class="qs-content">
            <span class="qs-val">{currentMile.toFixed(0)}</span>
            <span class="qs-label">Miles hiked</span>
          </div>
        </div>
        <div class="qs-card">
          <span class="qs-icon">🎯</span>
          <div class="qs-content">
            <span class="qs-val">{milesRemaining.toFixed(0)}</span>
            <span class="qs-label">Miles to go</span>
          </div>
        </div>
        <div class="qs-card">
          <span class="qs-icon">📅</span>
          <div class="qs-content">
            <span class="qs-val">{daysRemaining}</span>
            <span class="qs-label">Days remaining</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Position Card -->
    <div class="current-section-card">
      <div class="csc-header">
        <span class="csc-icon">{currentSection.emoji}</span>
        <div class="csc-title">
          <span class="csc-name">{currentSection.name}</span>
          <span class="csc-sub">{currentSection.highlight}</span>
        </div>
      </div>
      <div class="csc-progress">
        <div class="csc-bar">
          <div
            class="csc-fill"
            style="width: {((currentMile - currentSection.startMile) / (currentSection.endMile - currentSection.startMile)) * 100}%"
          ></div>
        </div>
        <div class="csc-miles">
          <span>{milesToSectionEnd.toFixed(0)} mi to {sections[sections.indexOf(currentSection) + 1]?.name || 'finish'}</span>
        </div>
      </div>
    </div>

    <!-- Next Milestone -->
    {#if nextMilestone}
      <div class="next-milestone-card">
        <div class="nmc-label">Next Milestone</div>
        <div class="nmc-content">
          <div class="nmc-info">
            <span class="nmc-name">{nextMilestone.label}</span>
            <span class="nmc-note">{nextMilestone.note}</span>
          </div>
          <div class="nmc-distance">
            <span class="nmc-miles">{milesToNextMilestone.toFixed(0)}</span>
            <span class="nmc-unit">mi away</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Projected Finish -->
    <div class="projection-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Projections</span>
      </h3>

      <div class="projection-cards">
        <div class="proj-card current">
          <div class="proj-header">
            <span class="proj-label">At Current Pace</span>
            <span class="proj-pace">{actualPace.toFixed(1)} mi/day</span>
          </div>
          <div class="proj-date">{formatDate(projectedFinish)}</div>
          <div class="proj-days">{daysRemaining} days remaining</div>
        </div>

        <div class="proj-card target">
          <div class="proj-header">
            <span class="proj-label">To Hit Original Target</span>
            <span class="proj-date-sm">{formatDateShort(originalFinish)}</span>
          </div>
          <div class="proj-pace-needed">
            <span class="ppn-val">{paceToHitTarget}</span>
            <span class="ppn-unit">mi/day needed</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Remaining Sections -->
    <div class="remaining-sections">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Sections Ahead</span>
      </h3>

      <div class="remaining-list">
        {#each remainingSections as section, i}
          <div class="rem-row" class:current={section.isCurrent}>
            <div class="rem-marker">
              <span class="rem-emoji">{section.emoji}</span>
            </div>
            <div class="rem-content">
              <div class="rem-head">
                <span class="rem-name">{section.name}</span>
                {#if section.isCurrent}
                  <span class="rem-badge">You are here</span>
                {/if}
              </div>
              <div class="rem-meta">
                <span class="rem-miles">{section.milesRemaining.toFixed(0)} mi</span>
                <span class="rem-days">~{section.daysToComplete} days</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Action Footer -->
  <div class="action-footer">
    <button class="share-btn" onclick={generateShareText}>
      {mode === 'planning' ? 'Copy Plan to Clipboard' : 'Share Trail Update'}
    </button>
  </div>
</div>

<style>
  .milestone-calc {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
    overflow: hidden;
  }

  /* Header */
  .calc-header {
    padding: 2rem 2rem 1.5rem;
    background: linear-gradient(to bottom, #fdfcf9, #f5f2e8);
    border-bottom: 1px solid var(--border);
  }

  .header-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--terra);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 0.5rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    margin: 0;
    color: var(--ink);
    line-height: 1.1;
  }

  .header-sub {
    margin: 0.5rem 0 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  /* Mode Toggle */
  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }

  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: Oswald, sans-serif;
  }

  .mode-btn:hover:not(.active) {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.05);
  }

  .mode-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .mode-icon {
    font-size: 1.1rem;
  }

  .mode-label {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Controls */
  .controls-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .control-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .date-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--stone, #ccc);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    color: var(--ink);
    box-sizing: border-box;
  }

  .pace-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .pace-val {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pine);
  }

  .pace-val small { font-size: 0.8rem; font-weight: 400; color: var(--muted); }

  .slider-container {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .pace-slider {
    width: 100%;
    height: 24px;
    cursor: pointer;
    margin: 0;
    -webkit-appearance: none;
    background: transparent;
  }

  .pace-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
  }

  .pace-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--marker);
    margin-top: -9px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  .pace-slider::-moz-range-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
    border: none;
  }

  .pace-slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--marker);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  /* Zero Days Row */
  .zero-days-row {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px dashed var(--border);
  }

  .zero-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .zero-val {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--terra);
  }

  .zero-val small { font-size: 0.8rem; font-weight: 400; color: var(--muted); }

  .zero-slider-wrap {
    position: relative;
  }

  .zero-slider {
    width: 100%;
    height: 24px;
    cursor: pointer;
    margin: 0;
    -webkit-appearance: none;
    background: transparent;
  }

  .zero-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--terra));
    border-radius: 3px;
  }

  .zero-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--terra);
    margin-top: -9px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  .zero-slider::-moz-range-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--terra));
    border-radius: 3px;
    border: none;
  }

  .zero-slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--terra);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  .zero-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .zero-context {
    color: var(--alpine);
    font-weight: 600;
  }

  .zero-tip {
    margin: 0.75rem 0 0;
    padding: 0.75rem;
    background: rgba(196, 93, 44, 0.08);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .zero-tip strong {
    color: var(--terra);
  }

  .zero-input {
    width: 60px;
    padding: 0.75rem;
    border: 1px solid var(--stone, #ccc);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    text-align: center;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--border);
  }

  .stats-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-bottom: 1px solid var(--border);
  }

  .stat-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid var(--border);
  }

  .stat-card:last-child { border-right: none; }
  .stat-card.highlight { background: #fdfdfc; }

  .stat-sub {
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .stat-main {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-unit { font-size: 1rem; color: var(--muted); }
  .stat-text {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--terra);
  }
  .stat-icon { font-size: 1.5rem; }

  /* Timeline */
  .timeline-container {
    padding: 2rem;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--pine, #4d594a);
    margin: 0 0 1.5rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  .timeline-list { position: relative; }

  .timeline-row {
    display: grid;
    grid-template-columns: 80px 40px 1fr;
    margin-bottom: 0;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.4s ease;
  }

  .timeline-row.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .time-col {
    text-align: right;
    padding-top: 0.5rem;
    padding-right: 0.5rem;
  }

  .time-date {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--pine);
  }

  .time-day {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .marker-col {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .marker-line {
    width: 2px;
    background: var(--stone, #ccc);
    flex: 1;
    opacity: 0.3;
  }

  .marker-line.first { margin-top: 1rem; flex: 1; }
  .marker-line.last { margin-bottom: auto; height: 1rem; flex: 0; }
  .marker-line.top { height: 1rem; flex: 0; }

  .marker-dot {
    position: absolute;
    top: 1rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--alpine);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .marker-dot.summit {
    background: var(--marker);
    color: var(--ink);
    font-size: 1rem;
  }

  .content-col {
    padding-bottom: 1.5rem;
    padding-left: 0.5rem;
  }

  .section-card {
    background: #fff;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.05);
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .card-icon { font-size: 1.2rem; }

  .card-name {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--ink);
    flex: 1;
  }

  .card-miles {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    background: #f5f5f5;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  .card-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }

  .meta-tag { color: var(--muted); font-style: italic; }
  .meta-season { font-weight: 600; }

  .summit-card {
    background: linear-gradient(135deg, var(--pine), #2c362a);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .summit-content h4 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.05em;
  }

  .summit-content p {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.8;
  }

  /* Milestones */
  .milestones-container { padding: 2rem; }

  .milestones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .milestone-box {
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.1), rgba(240, 224, 0, 0.02));
    border: 1px solid rgba(240, 224, 0, 0.4);
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
  }

  .ms-miles {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--pine);
    margin-bottom: 0.25rem;
  }

  .ms-content { display: flex; flex-direction: column; }
  .ms-label { font-size: 0.8rem; font-weight: 600; color: var(--ink); }
  .ms-date { font-size: 0.75rem; color: var(--muted); }

  /* ========== TRAIL MODE STYLES ========== */
  .trail-controls {
    padding: 1.5rem 2rem 2rem;
  }

  .position-input {
    margin-bottom: 1.5rem;
  }

  .mile-display {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .mile-num {
    font-family: Oswald, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .mile-landmark {
    font-size: 1rem;
    color: var(--muted);
    font-style: italic;
  }

  .mile-slider-wrap {
    position: relative;
    height: 32px;
    background: var(--bg);
    border-radius: 8px;
    overflow: hidden;
  }

  .mile-slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    z-index: 2;
  }

  .mile-slider::-webkit-slider-runnable-track {
    height: 100%;
    background: transparent;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 28px;
    width: 12px;
    border-radius: 4px;
    background: var(--pine);
    margin-top: 2px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
  }

  .mile-slider::-moz-range-track {
    height: 100%;
    background: transparent;
    border: none;
  }

  .mile-slider::-moz-range-thumb {
    height: 24px;
    width: 10px;
    border-radius: 4px;
    background: var(--pine);
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
  }

  .mile-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    pointer-events: none;
    z-index: 1;
  }

  .mile-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.5rem;
  }

  .trail-config {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .mini-pace {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pace-input {
    width: 80px;
    padding: 0.75rem;
    border: 1px solid var(--stone, #ccc);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    text-align: center;
  }

  .mini-pace span {
    color: var(--muted);
    font-size: 0.9rem;
  }

  /* Trail Dashboard */
  .trail-dashboard {
    padding: 2rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .status-hero {
    display: flex;
    gap: 2rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .hero-progress {
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
    stroke: #e0ddd4;
    stroke-width: 8;
  }

  .ring-fill {
    fill: none;
    stroke: var(--pine);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }

  .hero-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .hero-pct {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .hero-label {
    font-size: 0.7rem;
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

  .hs-val {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.1;
  }

  .hs-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .status-indicator .hs-val {
    color: var(--status-color);
  }

  /* Pace Breakdown */
  .pace-breakdown {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: #fff;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.05);
  }

  .pb-item {
    text-align: center;
    flex: 1;
  }

  .pb-val {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .pb-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  .pb-sub {
    font-size: 0.7rem;
    color: var(--alpine);
    margin-top: 0.15rem;
  }

  .pb-divider {
    width: 1px;
    height: 40px;
    background: var(--border);
    margin: 0 0.5rem;
  }

  .quick-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .qs-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .qs-icon { font-size: 1.25rem; }

  .qs-content {
    display: flex;
    flex-direction: column;
  }

  .qs-val {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.1;
  }

  .qs-label {
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Current Section Card */
  .current-section-card {
    margin: 0 2rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15), rgba(166, 181, 137, 0.05));
    border: 1px solid var(--alpine);
    border-radius: 12px;
  }

  .csc-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .csc-icon { font-size: 1.75rem; }

  .csc-title {
    display: flex;
    flex-direction: column;
  }

  .csc-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .csc-sub {
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
  }

  .csc-progress { margin-top: 0.5rem; }

  .csc-bar {
    height: 8px;
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .csc-fill {
    height: 100%;
    background: var(--pine);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .csc-miles {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Next Milestone Card */
  .next-milestone-card {
    margin: 1.5rem 2rem 0;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.15), rgba(240, 224, 0, 0.05));
    border: 1px solid rgba(240, 224, 0, 0.5);
    border-radius: 10px;
  }

  .nmc-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .nmc-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nmc-info {
    display: flex;
    flex-direction: column;
  }

  .nmc-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .nmc-note {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .nmc-distance {
    text-align: right;
  }

  .nmc-miles {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .nmc-unit {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Projections */
  .projection-section {
    padding: 2rem;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }

  .projection-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .proj-card {
    padding: 1.25rem;
    background: #fff;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .proj-card.current {
    border-color: var(--pine);
    border-width: 2px;
  }

  .proj-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  .proj-label {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }

  .proj-pace {
    font-size: 0.8rem;
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
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .proj-date-sm {
    font-size: 0.8rem;
    color: var(--terra);
    font-weight: 600;
  }

  .proj-pace-needed {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .ppn-val {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--terra);
    line-height: 1;
  }

  .ppn-unit {
    font-size: 0.85rem;
    color: var(--muted);
  }

  /* Remaining Sections */
  .remaining-sections {
    padding: 2rem;
    border-top: 1px solid var(--border);
  }

  .remaining-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rem-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .rem-row.current {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.1), rgba(166, 181, 137, 0.02));
    border-color: var(--alpine);
  }

  .rem-marker {
    flex-shrink: 0;
  }

  .rem-emoji { font-size: 1.25rem; }

  .rem-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .rem-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .rem-name {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
  }

  .rem-badge {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    background: var(--alpine);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .rem-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .rem-miles { font-weight: 600; }

  /* Footer */
  .action-footer {
    padding: 1.5rem;
    background: #fafaf9;
    border-top: 1px solid var(--border);
    text-align: center;
  }

  .share-btn {
    background: var(--pine);
    color: #fff;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .share-btn:hover {
    background: var(--ink);
    transform: translateY(-2px);
  }

  @media (max-width: 600px) {
    .milestone-calc {
      overflow-x: hidden;
      border-radius: 12px;
    }
    .calc-header { padding: 1.5rem; }
    .header-title { font-size: 1.5rem; }
    .controls-section { padding: 1.5rem; }
    .controls-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    .stats-grid-3 { grid-template-columns: 1fr; }
    .stat-card { border-right: none; border-bottom: 1px solid var(--border); }
    .stat-card:last-child { border-bottom: none; }
    .stat-num { font-size: 2rem; }
    .stat-text { font-size: 1.1rem; }
    .timeline-container { padding: 1.5rem 0.75rem; }
    .timeline-row { grid-template-columns: 55px 28px 1fr; }
    .time-col { padding-right: 0.25rem; }
    .time-date { font-size: 0.7rem; }
    .time-day { font-size: 0.65rem; }
    .marker-dot { width: 20px; height: 20px; font-size: 0.6rem; }
    .content-col { padding-left: 0.35rem; padding-bottom: 1rem; }
    .section-card { padding: 0.6rem 0.75rem; }
    .card-head { flex-wrap: wrap; gap: 0.35rem; }
    .card-name { font-size: 0.85rem; }
    .card-miles { font-size: 0.7rem; padding: 0.1rem 0.3rem; }
    .card-meta { flex-direction: column; gap: 0.25rem; font-size: 0.7rem; }
    .summit-card { padding: 0.75rem 1rem; }
    .summit-content h4 { font-size: 1rem; }
    .milestones-container { padding: 1.5rem 1rem; }
    .milestones-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .milestone-box { padding: 0.75rem; }
    .ms-miles { font-size: 1rem; }
    .ms-label { font-size: 0.7rem; }
    .ms-date { font-size: 0.65rem; }
    .status-hero { flex-direction: column; gap: 1.5rem; }
    .hero-progress { width: 100px; height: 100px; }
    .hero-pct { font-size: 1.5rem; }
    .hero-stats { flex-direction: row; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .hero-stat { flex: 0 0 auto; min-width: 70px; text-align: center; }
    .hs-val { font-size: 1.25rem; }
    .hs-label { font-size: 0.65rem; }
    .trail-dashboard { padding: 1.5rem 1rem; }
    .pace-breakdown { flex-direction: column; gap: 0.75rem; padding: 1rem; }
    .pb-val { font-size: 1.25rem; }
    .pb-label { font-size: 0.6rem; }
    .pb-divider { width: 100%; height: 1px; margin: 0; }
    .quick-stats { grid-template-columns: 1fr; gap: 0.75rem; }
    .qs-card { padding: 0.75rem; }
    .qs-val { font-size: 1.1rem; }
    .trail-config { grid-template-columns: 1fr; }
    .projection-section { padding: 1.5rem 1rem; }
    .projection-cards { grid-template-columns: 1fr; gap: 0.75rem; }
    .proj-card { padding: 1rem; }
    .proj-date { font-size: 1.1rem; }
    .ppn-val { font-size: 1.5rem; }
    .current-section-card { margin: 0 1rem; padding: 1rem; }
    .csc-icon { font-size: 1.5rem; }
    .csc-name { font-size: 1rem; }
    .next-milestone-card { margin: 1rem; padding: 0.75rem 1rem; }
    .nmc-miles { font-size: 1.5rem; }
    .remaining-sections { padding: 1.5rem 1rem; }
    .rem-row { padding: 0.6rem 0.75rem; gap: 0.75rem; }
    .rem-name { font-size: 0.85rem; }
    .rem-meta { flex-direction: column; gap: 0.15rem; align-items: flex-end; font-size: 0.7rem; }
    .action-footer { padding: 1rem; }
    .share-btn { padding: 0.6rem 1.25rem; font-size: 0.9rem; }
  }

  @media (max-width: 380px) {
    .timeline-row { grid-template-columns: 48px 24px 1fr; }
    .time-date { font-size: 0.6rem; }
    .marker-dot { width: 18px; height: 18px; font-size: 0.55rem; }
    .milestones-grid { grid-template-columns: 1fr; }
  }
</style>
