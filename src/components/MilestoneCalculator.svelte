<script>
  import { onMount } from 'svelte';

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
    { miles: 1099, label: 'Halfway', note: 'The trail breaks even' },
    { miles: 1000, label: '1000 Miles', note: 'A thousand stories' },
    { miles: 2000, label: '2000 Miles', note: 'Almost home' },
  ];

  const TOTAL_MILES = 2198;

  // State
  let startDate = '2026-02-15';
  let pace = 15;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  // Helper to add days to a date
  function addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date;
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

  // Get season for a date
  function getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return { name: 'Spring', color: '#a6b589', icon: '🌸' };
    if (month >= 5 && month <= 7) return { name: 'Summer', color: '#d97706', icon: '☀️' };
    if (month >= 8 && month <= 10) return { name: 'Fall', color: '#c45d2c', icon: '🍂' };
    return { name: 'Winter', color: '#6b8cae', icon: '❄️' };
  }

  // Calculate section data
  $: calculatedSections = sections.map((section, i) => {
    const daysToStart = Math.ceil(section.startMile / pace);
    const daysToEnd = Math.ceil(section.endMile / pace);
    const arrivalDate = addDays(startDate, daysToStart);
    const completionDate = addDays(startDate, daysToEnd);
    const sectionMiles = section.endMile - section.startMile;
    const sectionDays = Math.ceil(sectionMiles / pace);
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
      sectionDays,
      season,
      progress,
    };
  });

  // Total days
  $: totalDays = Math.ceil(TOTAL_MILES / pace);
  $: summitDate = addDays(startDate, totalDays);

  // Calculate milestone dates
  $: calculatedMilestones = milestones.map(m => ({
    ...m,
    date: addDays(startDate, Math.ceil(m.miles / pace)),
    day: Math.ceil(m.miles / pace),
  }));

  // Generate shareable text
  function generateShareText() {
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
  }
</script>

<div class="milestone-calc">
  <!-- Header -->
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">AT 2026 NOBO</span>
      <h2 class="header-title">Trail Milestone Calculator</h2>
      <p class="header-sub">Plan your journey from Springer to Katahdin</p>
    </div>
  </div>

  <!-- Input Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">📅</span>
        <span class="label-text">Start Date</span>
      </label>
      <input
        type="date"
        bind:value={startDate}
        class="date-input"
      />
    </div>

    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">🥾</span>
        <span class="label-text">Daily Pace</span>
      </label>
      <div class="pace-control">
        <input
          type="range"
          min="10"
          max="25"
          bind:value={pace}
          class="pace-slider"
        />
        <span class="pace-value">{pace} mi/day</span>
      </div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="summary-bar">
    <div class="stat">
      <span class="stat-value">{TOTAL_MILES.toLocaleString()}</span>
      <span class="stat-label">miles</span>
    </div>
    <div class="stat">
      <span class="stat-value">{totalDays}</span>
      <span class="stat-label">days</span>
    </div>
    <div class="stat summit">
      <span class="stat-label">Summit</span>
      <span class="stat-value date">{formatDate(summitDate)}</span>
    </div>
  </div>

  <!-- Full Trail Progress Bar -->
  <div class="trail-progress">
    <div class="progress-track">
      {#each calculatedSections as section, i}
        <div
          class="progress-section"
          style="
            left: {(section.startMile / TOTAL_MILES) * 100}%;
            width: {(section.sectionMiles / TOTAL_MILES) * 100}%;
            background: {section.season.color};
          "
          title="{section.name}: {section.sectionMiles.toFixed(0)} mi"
        ></div>
      {/each}
      {#each calculatedMilestones as milestone}
        <div
          class="milestone-marker"
          style="left: {(milestone.miles / TOTAL_MILES) * 100}%"
          title="{milestone.label}: Mile {milestone.miles}"
        >
          <span class="marker-pip"></span>
        </div>
      {/each}
    </div>
    <div class="progress-endpoints">
      <span class="endpoint start">
        <span class="endpoint-icon">🏕️</span>
        <span>Springer</span>
      </span>
      <span class="endpoint end">
        <span>Katahdin</span>
        <span class="endpoint-icon">🏔️</span>
      </span>
    </div>
  </div>

  <!-- Milestones Grid -->
  <div class="milestones-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Key Milestones</span>
    </h3>
    <div class="milestones-grid">
      {#each calculatedMilestones as milestone}
        <div class="milestone-card">
          <div class="milestone-miles">{milestone.miles.toLocaleString()}</div>
          <div class="milestone-label">{milestone.label}</div>
          <div class="milestone-date">Day {milestone.day} • {formatDateShort(milestone.date)}</div>
          <div class="milestone-note">{milestone.note}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Sections Timeline -->
  <div class="sections-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>14 Sections to Victory</span>
    </h3>

    <div class="sections-timeline">
      {#each calculatedSections as section, i}
        <div
          class="section-card"
          class:mounted
          style="animation-delay: {i * 50}ms"
        >
          <div class="card-progress" style="background: {section.season.color}">
            <span class="progress-num">{section.index}</span>
          </div>

          <div class="card-content">
            <div class="card-header">
              <h4 class="card-name">{section.emoji} {section.name}</h4>
              <span class="card-season" style="background: {section.season.color}20; color: {section.season.color}">
                {section.season.icon} {section.season.name}
              </span>
            </div>

            <p class="card-highlight">{section.highlight}</p>

            <div class="card-stats">
              <div class="card-stat">
                <span class="stat-num">{section.sectionMiles.toFixed(0)}</span>
                <span class="stat-unit">miles</span>
              </div>
              <div class="card-stat">
                <span class="stat-num">{section.sectionDays}</span>
                <span class="stat-unit">days</span>
              </div>
              <div class="card-stat date">
                <span class="stat-num">{formatDateShort(section.arrivalDate)}</span>
                <span class="stat-unit">arrival</span>
              </div>
            </div>

            <div class="card-footer">
              <span class="miles-badge">Mile {section.startMile.toFixed(0)} → {section.endMile.toFixed(0)}</span>
              <span class="day-badge">Day {section.daysToStart} → {section.daysToEnd}</span>
            </div>
          </div>

          <!-- Connecting line to next -->
          {#if i < calculatedSections.length - 1}
            <div class="card-connector">
              <span class="connector-blaze"></span>
              <span class="connector-blaze"></span>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Final Summit Card -->
      <div class="summit-card" class:mounted>
        <div class="summit-icon">🏔️</div>
        <h4 class="summit-title">KATAHDIN</h4>
        <p class="summit-subtitle">The Greatest Mountain</p>
        <div class="summit-date">{formatDate(summitDate)}</div>
        <div class="summit-day">Day {totalDays}</div>
        <p class="summit-quote hand">"You did it."</p>
      </div>
    </div>
  </div>

  <!-- Share Button -->
  <div class="share-section">
    <button class="share-btn" on:click={generateShareText}>
      <span class="share-icon">📋</span>
      <span>Copy My Plan</span>
    </button>
  </div>
</div>

<style>
  .milestone-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  /* Header */
  .calc-header {
    position: relative;
    padding: 2.5rem 2rem 2rem;
    background: linear-gradient(135deg, var(--pine, #4d594a) 0%, #3a4238 100%);
    color: #fff;
    overflow: hidden;
  }

  .header-topo {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px),
      repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px);
  }

  .header-content {
    position: relative;
  }

  .header-badge {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    padding: 0.25rem 0.6rem;
    border-radius: 3px;
    margin-bottom: 0.75rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    letter-spacing: -0.01em;
  }

  .header-sub {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }

  /* Controls */
  .controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .controls {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1.25rem 1rem;
    }
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label-icon {
    font-size: 1rem;
  }

  .date-input {
    padding: 0.75rem 1rem;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    background: #fff;
    color: var(--ink, #2b2f26);
    transition: border-color 0.15s ease;
  }

  .date-input:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
  }

  .pace-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .pace-slider {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--pine, #4d594a));
    border-radius: 4px;
    cursor: pointer;
  }

  .pace-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .pace-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.1);
  }
  .pace-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .pace-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    min-width: 5rem;
    text-align: right;
  }

  /* Summary Bar */
  .summary-bar {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 1.25rem 2rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .summary-bar {
      gap: 1rem;
      padding: 1rem;
    }
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    line-height: 1;
  }

  .stat-value.date {
    font-size: 1.1rem;
    color: var(--terra, #d97706);
  }

  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted, #5c665a);
  }

  .stat.summit {
    padding-left: 2rem;
    border-left: 2px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .stat.summit {
      padding-left: 1rem;
    }

    .stat-value {
      font-size: 1.4rem;
    }
  }

  /* Trail Progress */
  .trail-progress {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .trail-progress {
      padding: 1.25rem 1rem;
    }
  }

  .progress-track {
    position: relative;
    height: 12px;
    background: var(--stone, #d4d0c4);
    border-radius: 6px;
    overflow: visible;
  }

  .progress-section {
    position: absolute;
    top: 0;
    height: 100%;
    transition: opacity 0.2s ease;
  }

  .progress-section:first-child {
    border-radius: 6px 0 0 6px;
  }

  .progress-section:last-child {
    border-radius: 0 6px 6px 0;
  }

  .milestone-marker {
    position: absolute;
    top: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .marker-pip {
    display: block;
    width: 8px;
    height: 16px;
    background: var(--marker, #f0e000);
    border: 2px solid var(--ink, #2b2f26);
    border-radius: 2px;
    transform: translateY(-50%);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .progress-endpoints {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .endpoint {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .endpoint-icon {
    font-size: 1rem;
  }

  /* Milestones Section */
  .milestones-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .milestones-section {
      padding: 1.25rem 1rem;
    }
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
    margin: 0 0 1.25rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  .milestones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .milestone-card {
    text-align: center;
    padding: 1rem 0.75rem;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.1), rgba(240, 224, 0, 0.02));
    border: 1px solid rgba(240, 224, 0, 0.3);
    border-radius: 10px;
  }

  .milestone-miles {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink, #2b2f26);
    line-height: 1;
  }

  .milestone-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin-top: 0.25rem;
  }

  .milestone-date {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    margin-top: 0.35rem;
  }

  .milestone-note {
    font-family: Caveat, cursive;
    font-size: 0.9rem;
    color: var(--terra, #d97706);
    margin-top: 0.25rem;
  }

  /* Sections Timeline */
  .sections-section {
    padding: 1.5rem 2rem 2rem;
  }

  @media (max-width: 600px) {
    .sections-section {
      padding: 1.25rem 1rem 1.5rem;
    }
  }

  .sections-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .section-card {
    display: flex;
    gap: 1rem;
    position: relative;
    opacity: 0;
    transform: translateX(-10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .section-card.mounted {
    opacity: 1;
    transform: translateX(0);
  }

  .card-progress {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .card-content {
    flex: 1;
    padding: 0.75rem 1rem 1rem;
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    margin-bottom: 0.5rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .card-name {
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
    margin: 0;
  }

  .card-season {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    white-space: nowrap;
  }

  .card-highlight {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    margin: 0 0 0.75rem;
    font-style: italic;
  }

  .card-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .card-stat {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .card-stat .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  .card-stat .stat-unit {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
  }

  .card-stat.date .stat-num {
    color: var(--terra, #d97706);
  }

  .card-footer {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .miles-badge, .day-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: rgba(77, 89, 74, 0.1);
    color: var(--pine, #4d594a);
    font-family: Oswald, sans-serif;
    letter-spacing: 0.02em;
  }

  .card-connector {
    position: absolute;
    left: 20px;
    top: 40px;
    bottom: -8px;
    width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-top: 8px;
  }

  .connector-blaze {
    width: 6px;
    height: 10px;
    background: var(--marker, #f0e000);
    border-radius: 1px;
    opacity: 0.6;
  }

  /* Summit Card */
  .summit-card {
    text-align: center;
    padding: 2rem 1.5rem;
    margin-top: 1rem;
    background: linear-gradient(135deg, var(--pine, #4d594a), #3a4238);
    border-radius: 16px;
    color: #fff;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
    transition-delay: 0.7s;
  }

  .summit-card.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .summit-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .summit-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin: 0;
  }

  .summit-subtitle {
    font-size: 0.85rem;
    opacity: 0.8;
    margin: 0.25rem 0 1rem;
  }

  .summit-date {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--marker, #f0e000);
  }

  .summit-day {
    font-size: 0.85rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }

  .summit-quote {
    font-family: Caveat, cursive;
    font-size: 1.5rem;
    margin: 1rem 0 0;
    opacity: 0.9;
  }

  /* Share Section */
  .share-section {
    padding: 1.5rem 2rem 2rem;
    display: flex;
    justify-content: center;
  }

  .share-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .share-btn:hover {
    background: var(--ink, #2b2f26);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .share-icon {
    font-size: 1.1rem;
  }

  .hand {
    font-family: Caveat, cursive;
  }
</style>
