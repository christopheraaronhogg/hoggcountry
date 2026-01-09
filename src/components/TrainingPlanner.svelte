<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // User inputs
  let startDate = $state(trailContext?.startDate || '2026-02-15');
  let currentFitness = $state('moderate');
  let hikingExperience = $state('some');
  let weeklyHours = $state(10);

  // Sync with trail context
  $effect(() => {
    if (trailContext?.startDate) {
      startDate = trailContext.startDate;
    }
  });

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem('at-training-planner');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        currentFitness = data.currentFitness || currentFitness;
        hikingExperience = data.hikingExperience || hikingExperience;
        weeklyHours = data.weeklyHours || weeklyHours;
      } catch (e) {}
    }
  });

  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-training-planner', JSON.stringify({
        currentFitness,
        hikingExperience,
        weeklyHours
      }));
    }
  });

  let weeksUntilStart = $derived.by(() => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((start - now) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diff);
  });

  const phases = [
    {
      id: 'base',
      name: 'Base Building',
      weeks: 8,
      focus: 'Aerobic foundation',
      color: '#3b82f6',
      description: 'Build cardiovascular endurance and basic leg strength',
      activities: [
        { name: 'Walking/Hiking', duration: '3-5 hours', frequency: '3-4x/week', priority: 'high' },
        { name: 'Stair climbing', duration: '20-30 min', frequency: '2x/week', priority: 'medium' },
        { name: 'Core exercises', duration: '15-20 min', frequency: '3x/week', priority: 'medium' },
      ],
      tips: [
        'Start slow - increase weekly mileage by no more than 10%',
        'Walk on varied terrain when possible',
        'Practice good posture and footwork',
      ],
    },
    {
      id: 'build',
      name: 'Build Phase',
      weeks: 8,
      focus: 'Strength & endurance',
      color: '#f59e0b',
      description: 'Increase load, duration, and intensity',
      activities: [
        { name: 'Loaded hiking', duration: '4-6 hours', frequency: '2-3x/week', priority: 'high' },
        { name: 'Back-to-back days', duration: 'Full day', frequency: '1x/month', priority: 'high' },
        { name: 'Strength training', duration: '30-45 min', frequency: '2x/week', priority: 'medium' },
        { name: 'Flexibility work', duration: '15 min', frequency: 'Daily', priority: 'low' },
      ],
      tips: [
        'Add weight to your pack gradually (start 15lb, build to 25lb)',
        'Include elevation gain - find stairs or hills',
        'Practice hiking in your actual trail shoes',
      ],
    },
    {
      id: 'peak',
      name: 'Peak Training',
      weeks: 4,
      focus: 'Trail simulation',
      color: '#dc2626',
      description: 'Maximum volume and intensity before taper',
      activities: [
        { name: 'Long hikes (15-20mi)', duration: '8+ hours', frequency: '1-2x/week', priority: 'high' },
        { name: 'Multi-day trips', duration: '2-3 days', frequency: '1-2x/month', priority: 'high' },
        { name: 'Back-to-back 10+ mi days', duration: '2 days', frequency: '2x this phase', priority: 'high' },
      ],
      tips: [
        'Test ALL your gear on these trips',
        'Practice your food and water systems',
        'Simulate early starts (5-6am)',
      ],
    },
    {
      id: 'taper',
      name: 'Taper',
      weeks: 2,
      focus: 'Recovery & prep',
      color: '#22c55e',
      description: 'Reduce volume, maintain intensity, rest up',
      activities: [
        { name: 'Light hiking', duration: '2-3 hours', frequency: '2-3x/week', priority: 'medium' },
        { name: 'Stretching', duration: '20 min', frequency: 'Daily', priority: 'high' },
        { name: 'Gear organization', duration: 'As needed', frequency: 'Daily', priority: 'high' },
      ],
      tips: [
        'Reduce mileage by 50% from peak',
        'Sleep 8+ hours nightly',
        'Stay active but don\'t fatigue yourself',
        'Finalize all logistics',
      ],
    },
  ];

  let currentPhase = $derived.by(() => {
    if (weeksUntilStart > 22) return null;
    if (weeksUntilStart > 14) return phases[0];
    if (weeksUntilStart > 6) return phases[1];
    if (weeksUntilStart > 2) return phases[2];
    return phases[3];
  });

  let weeklySchedule = $derived.by(() => {
    const schedule = [];
    if (weeklyHours >= 15) {
      schedule.push({ day: 'Mon', activity: 'Strength + Core', duration: '45m', type: 'strength' });
      schedule.push({ day: 'Tue', activity: 'Hike/Walk', duration: '1-2h', type: 'cardio' });
      schedule.push({ day: 'Wed', activity: 'Rest or Yoga', duration: '30m', type: 'rest' });
      schedule.push({ day: 'Thu', activity: 'Stair climbing', duration: '30m', type: 'cardio' });
      schedule.push({ day: 'Fri', activity: 'Light hike', duration: '1h', type: 'cardio' });
      schedule.push({ day: 'Sat', activity: 'Long hike', duration: '4-6h', type: 'long' });
      schedule.push({ day: 'Sun', activity: 'Recovery', duration: '1-2h', type: 'rest' });
    } else if (weeklyHours >= 10) {
      schedule.push({ day: 'Mon', activity: 'Core + Flex', duration: '30m', type: 'strength' });
      schedule.push({ day: 'Tue', activity: 'Hike/Walk', duration: '1h', type: 'cardio' });
      schedule.push({ day: 'Wed', activity: 'Rest', duration: '-', type: 'rest' });
      schedule.push({ day: 'Thu', activity: 'Stairs/Hills', duration: '30m', type: 'cardio' });
      schedule.push({ day: 'Fri', activity: 'Light walk', duration: '30m', type: 'cardio' });
      schedule.push({ day: 'Sat', activity: 'Long hike', duration: '3-5h', type: 'long' });
      schedule.push({ day: 'Sun', activity: 'Easy walk', duration: '1h', type: 'rest' });
    } else {
      schedule.push({ day: 'Mon', activity: 'Walk', duration: '30m', type: 'cardio' });
      schedule.push({ day: 'Tue', activity: 'Rest', duration: '-', type: 'rest' });
      schedule.push({ day: 'Wed', activity: 'Stairs', duration: '20m', type: 'cardio' });
      schedule.push({ day: 'Thu', activity: 'Rest', duration: '-', type: 'rest' });
      schedule.push({ day: 'Fri', activity: 'Walk', duration: '30m', type: 'cardio' });
      schedule.push({ day: 'Sat', activity: 'Hike', duration: '2-3h', type: 'long' });
      schedule.push({ day: 'Sun', activity: 'Rest', duration: '-', type: 'rest' });
    }
    return schedule;
  });

  let readinessScore = $derived.by(() => {
    let score = 50;
    if (currentFitness === 'active') score += 20;
    else if (currentFitness === 'athlete') score += 30;
    else if (currentFitness === 'moderate') score += 10;
    else if (currentFitness === 'light') score += 0;
    else score -= 10;

    if (hikingExperience === 'expert') score += 20;
    else if (hikingExperience === 'experienced') score += 15;
    else if (hikingExperience === 'some') score += 5;
    else score -= 5;

    if (weeksUntilStart > 20) score += 15;
    else if (weeksUntilStart > 12) score += 10;
    else if (weeksUntilStart > 6) score += 5;
    else if (weeksUntilStart > 2) score += 0;
    else score -= 10;

    return Math.min(100, Math.max(0, score));
  });

  let readinessLevel = $derived.by(() => {
    if (readinessScore >= 80) return { label: 'Well Prepared', color: '#16a34a', bg: '#dcfce7' };
    if (readinessScore >= 60) return { label: 'On Track', color: '#65a30d', bg: '#ecfccb' };
    if (readinessScore >= 40) return { label: 'Needs Work', color: '#d97706', bg: '#fef3c7' };
    if (readinessScore >= 20) return { label: 'Behind Schedule', color: '#ea580c', bg: '#ffedd5' };
    return { label: 'Significant Concern', color: '#dc2626', bg: '#fef2f2' };
  });

  const benchmarks = [
    { id: 'b1', text: 'Complete a 15+ mile day with full pack', category: 'endurance' },
    { id: 'b2', text: 'Hike back-to-back 10+ mile days', category: 'endurance' },
    { id: 'b3', text: 'Complete an overnight trip with all your gear', category: 'gear' },
    { id: 'b4', text: 'Break in your trail shoes (50+ miles)', category: 'gear' },
    { id: 'b5', text: 'Test your rain gear in actual rain', category: 'gear' },
    { id: 'b6', text: 'Successfully set up shelter in under 5 min', category: 'skills' },
    { id: 'b7', text: 'Filter/treat water from a natural source', category: 'skills' },
    { id: 'b8', text: 'Navigate 5+ miles using only map/compass', category: 'skills' },
  ];

  let completedBenchmarks = $state({});

  $effect(() => {
    if (mounted) {
      const saved = localStorage.getItem('at-training-benchmarks');
      if (saved) {
        try {
          completedBenchmarks = JSON.parse(saved);
        } catch (e) {}
      }
    }
  });

  $effect(() => {
    if (mounted && Object.keys(completedBenchmarks).length > 0) {
      localStorage.setItem('at-training-benchmarks', JSON.stringify(completedBenchmarks));
    }
  });

  function toggleBenchmark(id) {
    completedBenchmarks = {
      ...completedBenchmarks,
      [id]: !completedBenchmarks[id]
    };
  }

  let benchmarkProgress = $derived(
    Math.round((Object.values(completedBenchmarks).filter(Boolean).length / benchmarks.length) * 100)
  );

  // SVG arc helpers
  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  }

  let gaugeAngle = $derived(-135 + (readinessScore / 100) * 270);
</script>

<div class="training-planner" class:mounted>
  <!-- Header -->
  <header class="planner-header">
    <div class="header-left">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      </div>
      <div class="header-text">
        <h2>TRAIL ATHLETE</h2>
        <p>Physical Preparation Program</p>
      </div>
    </div>
    <div class="countdown-badge">
      <span class="cd-number">{weeksUntilStart}</span>
      <span class="cd-text">WEEKS</span>
    </div>
  </header>

  <!-- Readiness Gauge -->
  <section class="readiness-section">
    <div class="gauge-container">
      <svg viewBox="0 0 200 130" class="readiness-gauge">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#dc2626"/>
            <stop offset="50%" style="stop-color:#f59e0b"/>
            <stop offset="100%" style="stop-color:#22c55e"/>
          </linearGradient>
        </defs>
        <!-- Background arc -->
        <path
          d={describeArc(100, 100, 70, -135, 135)}
          fill="none"
          stroke="var(--border)"
          stroke-width="14"
          stroke-linecap="round"
        />
        <!-- Progress arc -->
        <path
          d={describeArc(100, 100, 70, -135, gaugeAngle)}
          fill="none"
          stroke="url(#gaugeGrad)"
          stroke-width="14"
          stroke-linecap="round"
          class="gauge-fill"
        />
        <!-- Tick marks -->
        {#each [0, 25, 50, 75, 100] as tick}
          {@const tickAngle = -135 + (tick / 100) * 270}
          {@const innerPos = polarToCartesian(100, 100, 58, tickAngle)}
          {@const outerPos = polarToCartesian(100, 100, 54, tickAngle)}
          <line x1={innerPos.x} y1={innerPos.y} x2={outerPos.x} y2={outerPos.y} stroke="var(--muted)" stroke-width="2"/>
        {/each}
      </svg>
      <div class="gauge-center">
        <span class="gauge-score">{readinessScore}</span>
        <span class="gauge-label">READINESS</span>
      </div>
    </div>
    <div class="readiness-status" style="background: {readinessLevel.bg}; border-color: {readinessLevel.color}">
      <span class="status-label" style="color: {readinessLevel.color}">{readinessLevel.label}</span>
      <p class="status-desc">
        {#if readinessScore >= 80}
          You're in great shape. Stay consistent and don't overtrain.
        {:else if readinessScore >= 60}
          Good progress! Focus on consistency and building volume.
        {:else if readinessScore >= 40}
          More training needed. Prioritize weekly long hikes.
        {:else}
          Significant preparation required. Start immediately.
        {/if}
      </p>
    </div>
  </section>

  <!-- Profile Inputs -->
  <section class="profile-section">
    <h3 class="section-label">YOUR PROFILE</h3>
    <div class="profile-grid">
      <div class="profile-field">
        <label>Fitness Level</label>
        <select bind:value={currentFitness}>
          <option value="sedentary">Sedentary</option>
          <option value="light">Light Activity</option>
          <option value="moderate">Moderate (3-4x/week)</option>
          <option value="active">Active (daily exercise)</option>
          <option value="athlete">Athlete</option>
        </select>
      </div>
      <div class="profile-field">
        <label>Hiking Experience</label>
        <select bind:value={hikingExperience}>
          <option value="none">None</option>
          <option value="some">Some (day hikes)</option>
          <option value="experienced">Experienced (multi-day)</option>
          <option value="expert">Expert (long-distance)</option>
        </select>
      </div>
      <div class="profile-field hours-field">
        <label>Weekly Training Hours</label>
        <div class="hours-control">
          <input type="range" min="5" max="20" bind:value={weeklyHours} />
          <span class="hours-badge">{weeklyHours}h</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Current Phase -->
  {#if currentPhase}
  <section class="phase-section">
    <h3 class="section-label">CURRENT PHASE</h3>
    <div class="phase-card" style="--phase-color: {currentPhase.color}">
      <div class="phase-header">
        <div class="phase-title">
          <span class="phase-name">{currentPhase.name}</span>
          <span class="phase-focus">{currentPhase.focus}</span>
        </div>
        <div class="phase-weeks-badge">{currentPhase.weeks}W</div>
      </div>
      <p class="phase-desc">{currentPhase.description}</p>

      <div class="activities-block">
        <h4>KEY ACTIVITIES</h4>
        {#each currentPhase.activities as activity}
          <div class="activity-row" class:priority={activity.priority === 'high'}>
            <div class="activity-info">
              <span class="activity-name">{activity.name}</span>
              <span class="activity-freq">{activity.frequency}</span>
            </div>
            <span class="activity-time">{activity.duration}</span>
          </div>
        {/each}
      </div>

      <div class="tips-block">
        <h4>TIPS</h4>
        <ul>
          {#each currentPhase.tips as tip}
            <li>{tip}</li>
          {/each}
        </ul>
      </div>
    </div>
  </section>
  {:else}
  <section class="phase-section">
    <div class="phase-placeholder">
      <div class="placeholder-icon">📅</div>
      <h3>Training begins at 22 weeks out</h3>
      <p>Your start date is more than 22 weeks away. Enjoy general fitness and start focused training closer to departure.</p>
    </div>
  </section>
  {/if}

  <!-- Weekly Schedule -->
  <section class="schedule-section">
    <h3 class="section-label">WEEKLY SCHEDULE</h3>
    <div class="schedule-row">
      {#each weeklySchedule as day}
        <div class="day-card" class:rest={day.type === 'rest'} class:long={day.type === 'long'}>
          <span class="day-name">{day.day}</span>
          <span class="day-activity">{day.activity}</span>
          <span class="day-duration">{day.duration}</span>
        </div>
      {/each}
    </div>
    <p class="schedule-note">Adjust based on your schedule. Consistency is key.</p>
  </section>

  <!-- Benchmarks -->
  <section class="benchmarks-section">
    <div class="benchmarks-header">
      <h3 class="section-label">PRE-TRAIL BENCHMARKS</h3>
      <div class="benchmark-meter">
        <div class="meter-bar">
          <div class="meter-fill" style="width: {benchmarkProgress}%"></div>
        </div>
        <span class="meter-value">{benchmarkProgress}%</span>
      </div>
    </div>
    <div class="benchmarks-grid">
      {#each benchmarks as bm}
        <button
          class="benchmark-item"
          class:done={completedBenchmarks[bm.id]}
          onclick={() => toggleBenchmark(bm.id)}
        >
          <div class="bm-check">
            {#if completedBenchmarks[bm.id]}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            {/if}
          </div>
          <span class="bm-text">{bm.text}</span>
          <span class="bm-tag">{bm.category}</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- Training Timeline -->
  <section class="timeline-section">
    <h3 class="section-label">22-WEEK PROGRAM</h3>
    <div class="phase-timeline">
      {#each phases as phase}
        <div class="timeline-phase" class:active={currentPhase?.id === phase.id} style="flex: {phase.weeks}">
          <div class="phase-bar" style="background: {phase.color}"></div>
          <div class="phase-info">
            <span class="phase-label">{phase.name}</span>
            <span class="phase-duration">{phase.weeks} weeks</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Resources -->
  <section class="resources-section">
    <h3 class="section-label">TRAINING FOCUS AREAS</h3>
    <div class="resources-grid">
      <div class="resource-card">
        <div class="resource-icon">🦵</div>
        <h4>Leg Strength</h4>
        <p>Squats, lunges, step-ups, calf raises. 2-3 sets of 12-15 reps.</p>
      </div>
      <div class="resource-card">
        <div class="resource-icon">🏔️</div>
        <h4>Elevation</h4>
        <p>Stair machine, hill repeats, loaded stair climbing.</p>
      </div>
      <div class="resource-card">
        <div class="resource-icon">🎒</div>
        <h4>Load Training</h4>
        <p>Start 15lb, add 2-3lb weekly to 25-30lb.</p>
      </div>
      <div class="resource-card">
        <div class="resource-icon">🧘</div>
        <h4>Flexibility</h4>
        <p>Hip flexors, hamstrings, calves. 15 min daily.</p>
      </div>
    </div>
  </section>

  <!-- Guide Link -->
  <a href="/guide/01-hiker-profile-and-experience" class="guide-link">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    <span>Read Physical Preparation Guide</span>
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </a>
</div>

<style>
  .training-planner {
    background: var(--bg, #f8f5f0);
    border: 2px solid var(--border, #d4c5b0);
    border-radius: 12px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .training-planner.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .planner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
    border-bottom: 2px solid #047857;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    width: 44px;
    height: 44px;
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.25);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .header-icon svg {
    width: 24px;
    height: 24px;
  }

  .header-text h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.08em;
  }

  .header-text p {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .countdown-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255,255,255,0.2);
    border: 2px solid rgba(255,255,255,0.3);
    padding: 0.5rem 1rem;
    border-radius: 10px;
  }

  .cd-number {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .cd-text {
    font-size: 0.6rem;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.1em;
  }

  /* Readiness Section */
  .readiness-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .gauge-container {
    position: relative;
    width: 180px;
    height: 120px;
    flex-shrink: 0;
  }

  .readiness-gauge {
    width: 100%;
    height: 100%;
  }

  .gauge-fill {
    transition: all 0.6s ease-out;
  }

  .gauge-center {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .gauge-score {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .gauge-label {
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  .readiness-status {
    flex: 1;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    border: 2px solid;
  }

  .status-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }

  .status-desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--ink);
    line-height: 1.5;
  }

  /* Profile Section */
  .profile-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .section-label {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  .profile-field label {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .profile-field select {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.8rem;
    background: #fff;
    color: var(--ink);
    cursor: pointer;
  }

  .profile-field select:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .hours-control {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .hours-control input[type="range"] {
    flex: 1;
    height: 28px;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    position: relative;
  }

  .hours-control input[type="range"]::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 8px;
    background: var(--border);
    border-radius: 4px;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 1;
  }

  .hours-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #059669;
    border: 3px solid #047857;
    cursor: grab;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
  }

  .hours-control input[type="range"]::-webkit-slider-thumb:active {
    cursor: grabbing;
  }

  .hours-control input[type="range"]::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #059669;
    border: 3px solid #047857;
    cursor: grab;
    position: relative;
    z-index: 2;
  }

  .hours-badge {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #059669;
    background: rgba(5, 150, 105, 0.1);
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    border: 2px solid rgba(5, 150, 105, 0.3);
  }

  /* Phase Section */
  .phase-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .phase-card {
    background: #fff;
    border: 2px solid var(--border);
    border-left: 4px solid var(--phase-color);
    border-radius: 10px;
    padding: 1.25rem;
  }

  .phase-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .phase-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .phase-focus {
    display: block;
    font-size: 0.8rem;
    color: var(--phase-color);
    font-weight: 600;
  }

  .phase-weeks-badge {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--phase-color);
    background: rgba(0,0,0,0.05);
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    border: 2px solid var(--border);
  }

  .phase-desc {
    margin: 0 0 1rem;
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .activities-block h4,
  .tips-block h4 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  .activity-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: var(--bg);
    border-radius: 6px;
    margin-bottom: 0.35rem;
    border: 1px solid var(--border);
  }

  .activity-row.priority {
    background: rgba(5, 150, 105, 0.08);
    border-color: rgba(5, 150, 105, 0.3);
    border-left: 3px solid #059669;
  }

  .activity-info {
    display: flex;
    flex-direction: column;
  }

  .activity-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .activity-freq {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .activity-time {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #059669;
  }

  .tips-block {
    margin-top: 1rem;
  }

  .tips-block ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tips-block li {
    margin-bottom: 0.25rem;
  }

  .phase-placeholder {
    text-align: center;
    padding: 2rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .placeholder-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .phase-placeholder h3 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
  }

  .phase-placeholder p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }

  /* Schedule Section */
  .schedule-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .schedule-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }

  .day-card {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .day-card.rest {
    background: var(--bg);
    opacity: 0.6;
  }

  .day-card.long {
    background: rgba(5, 150, 105, 0.08);
    border-color: rgba(5, 150, 105, 0.3);
  }

  .day-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .day-activity {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0.2rem;
    line-height: 1.3;
  }

  .day-duration {
    font-size: 0.6rem;
    color: var(--muted);
  }

  .schedule-note {
    margin: 0.75rem 0 0;
    font-size: 0.7rem;
    color: var(--muted);
    text-align: center;
  }

  /* Benchmarks */
  .benchmarks-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .benchmarks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .benchmark-meter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .meter-bar {
    width: 100px;
    height: 8px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
  }

  .meter-fill {
    height: 100%;
    background: linear-gradient(90deg, #059669, #22c55e);
    transition: width 0.4s ease;
  }

  .meter-value {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #059669;
  }

  .benchmarks-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .benchmark-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .benchmark-item:hover {
    border-color: var(--alpine);
  }

  .benchmark-item.done {
    background: rgba(5, 150, 105, 0.05);
    border-color: rgba(5, 150, 105, 0.3);
  }

  .bm-check {
    width: 22px;
    height: 22px;
    border: 2px solid var(--border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #fff;
    transition: all 0.2s ease;
  }

  .benchmark-item.done .bm-check {
    background: #059669;
    border-color: #059669;
    color: #fff;
  }

  .bm-check svg {
    width: 14px;
    height: 14px;
  }

  .bm-text {
    flex: 1;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .benchmark-item.done .bm-text {
    text-decoration: line-through;
    color: var(--muted);
  }

  .bm-tag {
    font-size: 0.6rem;
    padding: 0.2rem 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Timeline */
  .timeline-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .phase-timeline {
    display: flex;
    gap: 4px;
  }

  .timeline-phase {
    display: flex;
    flex-direction: column;
    opacity: 0.4;
    transition: opacity 0.2s;
  }

  .timeline-phase.active {
    opacity: 1;
  }

  .phase-bar {
    height: 10px;
    border-radius: 5px;
    margin-bottom: 0.5rem;
  }

  .phase-info {
    text-align: center;
  }

  .phase-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--ink);
  }

  .phase-duration {
    font-size: 0.55rem;
    color: var(--muted);
  }

  /* Resources */
  .resources-section {
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border-bottom: 2px solid var(--border);
  }

  .resources-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .resource-card {
    text-align: center;
    padding: 1rem 0.75rem;
    background: #fff;
    border: 2px solid rgba(5, 150, 105, 0.2);
    border-radius: 10px;
  }

  .resource-icon {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .resource-card h4 {
    margin: 0 0 0.35rem;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .resource-card p {
    margin: 0;
    font-size: 0.7rem;
    color: var(--muted);
    line-height: 1.4;
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: var(--pine, #3d5a46);
    color: #fff;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    transition: background 0.2s ease;
  }

  .guide-link:hover {
    background: var(--alpine, #2d4a36);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .readiness-section {
      flex-direction: column;
    }

    .profile-grid {
      grid-template-columns: 1fr;
    }

    .schedule-row {
      grid-template-columns: repeat(4, 1fr);
    }

    .day-card:nth-child(n+5) {
      display: none;
    }

    .resources-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .header-left {
      gap: 0.75rem;
    }

    .header-icon {
      width: 38px;
      height: 38px;
    }

    .header-text h2 {
      font-size: 1.2rem;
    }

    .schedule-row {
      grid-template-columns: repeat(3, 1fr);
    }

    .day-card:nth-child(n+4) {
      display: none;
    }
  }
</style>
