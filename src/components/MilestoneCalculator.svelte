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
  <header class="calc-header">
    <div class="header-inner">
      <span class="header-badge">AT 2026 NOBO</span>
      <h2 class="header-title">Milestone Planner</h2>
      <p class="header-sub">Map your journey from Springer to Katahdin</p>
    </div>
  </header>

  <!-- Controls -->
  <div class="controls-section">
    <div class="controls-grid">
      <div class="control-group">
        <label class="control-label">Start Date</label>
        <input
          type="date"
          bind:value={startDate}
          class="date-input"
        />
      </div>

      <div class="control-group">
        <div class="pace-header">
          <label class="control-label">Avg Pace</label>
          <span class="pace-val">{pace} <small>mi/day</small></span>
        </div>
        <div class="slider-container">
          <input
            type="range"
            min="8"
            max="25"
            step="0.5"
            bind:value={pace}
            class="pace-slider"
          />
          <div class="slider-track-bg"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Big Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-label">Total Duration</span>
      <div class="stat-main">
        <span class="stat-num">{totalDays}</span>
        <span class="stat-unit">days</span>
      </div>
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

  <!-- Action -->
  <div class="action-footer">
    <button class="share-btn" on:click={generateShareText}>
      Copy Plan to Clipboard
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
    border: 1px solid var(--stone);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    color: var(--ink);
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
    position: absolute;
    z-index: 2;
    height: 24px;
    opacity: 0;
    cursor: pointer;
    margin: 0;
  }

  .slider-track-bg {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 3px;
  }

  /* Slider thumb hack for cross-browser consistency without appearance: none on input directly */
  .pace-slider {
    opacity: 1;
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

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
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

  .stat-unit {
    font-size: 1rem;
    color: var(--muted);
  }

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

  .timeline-list {
    position: relative;
  }

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
    background: var(--stone);
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
  .milestones-container {
    padding: 2rem;
  }

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

  .ms-content {
    display: flex;
    flex-direction: column;
  }

  .ms-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ink);
  }

  .ms-date {
    font-size: 0.75rem;
    color: var(--muted);
  }

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
    .calc-header { padding: 1.5rem; }
    .controls-section { padding: 1.5rem; }
    .controls-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    .timeline-container { padding: 1.5rem 1rem; }
    .timeline-row { grid-template-columns: 60px 30px 1fr; }
    .time-date { font-size: 0.75rem; }
    .card-meta { flex-direction: column; gap: 0.25rem; }
  }
</style>
