<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // User inputs
  let startDate = $state(trailContext?.startDate || '2026-02-15');
  let currentFitness = $state('moderate'); // sedentary, light, moderate, active, athlete
  let hikingExperience = $state('some'); // none, some, experienced, expert
  let weeklyHours = $state(10); // available training hours per week

  // Sync with trail context
  $effect(() => {
    if (trailContext?.startDate) {
      startDate = trailContext.startDate;
    }
  });

  onMount(() => {
    mounted = true;
    // Load saved data
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

  // Save when changed
  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-training-planner', JSON.stringify({
        currentFitness,
        hikingExperience,
        weeklyHours
      }));
    }
  });

  // Calculate weeks until start
  let weeksUntilStart = $derived.by(() => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((start - now) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diff);
  });

  // Training phases
  const phases = [
    {
      id: 'base',
      name: 'Base Building',
      weeks: 8,
      focus: 'Aerobic foundation',
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

  // Current phase based on weeks until start
  let currentPhase = $derived.by(() => {
    if (weeksUntilStart > 22) return null; // Too far out
    if (weeksUntilStart > 14) return phases[0]; // Base
    if (weeksUntilStart > 6) return phases[1];  // Build
    if (weeksUntilStart > 2) return phases[2];  // Peak
    return phases[3]; // Taper
  });

  // Recommended weekly schedule based on available hours
  let weeklySchedule = $derived.by(() => {
    const schedule = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (weeklyHours >= 15) {
      // Full schedule
      schedule.push({ day: 'Monday', activity: 'Strength + Core', duration: '45 min' });
      schedule.push({ day: 'Tuesday', activity: 'Hike/Walk', duration: '1-2 hours' });
      schedule.push({ day: 'Wednesday', activity: 'Rest or Yoga', duration: '30 min' });
      schedule.push({ day: 'Thursday', activity: 'Stair climbing', duration: '30 min' });
      schedule.push({ day: 'Friday', activity: 'Light hike', duration: '1 hour' });
      schedule.push({ day: 'Saturday', activity: 'Long hike', duration: '4-6 hours' });
      schedule.push({ day: 'Sunday', activity: 'Recovery hike or rest', duration: '1-2 hours' });
    } else if (weeklyHours >= 10) {
      // Moderate schedule
      schedule.push({ day: 'Monday', activity: 'Core + Flexibility', duration: '30 min' });
      schedule.push({ day: 'Tuesday', activity: 'Hike/Walk', duration: '1 hour' });
      schedule.push({ day: 'Wednesday', activity: 'Rest', duration: '-' });
      schedule.push({ day: 'Thursday', activity: 'Stairs or hills', duration: '30 min' });
      schedule.push({ day: 'Friday', activity: 'Rest or light walk', duration: '30 min' });
      schedule.push({ day: 'Saturday', activity: 'Long hike', duration: '3-5 hours' });
      schedule.push({ day: 'Sunday', activity: 'Easy walk', duration: '1 hour' });
    } else {
      // Minimal schedule
      schedule.push({ day: 'Monday', activity: 'Walk', duration: '30 min' });
      schedule.push({ day: 'Tuesday', activity: 'Rest', duration: '-' });
      schedule.push({ day: 'Wednesday', activity: 'Stairs', duration: '20 min' });
      schedule.push({ day: 'Thursday', activity: 'Rest', duration: '-' });
      schedule.push({ day: 'Friday', activity: 'Walk', duration: '30 min' });
      schedule.push({ day: 'Saturday', activity: 'Hike', duration: '2-3 hours' });
      schedule.push({ day: 'Sunday', activity: 'Rest', duration: '-' });
    }

    return schedule;
  });

  // Fitness level adjustments
  const fitnessMultipliers = {
    sedentary: 1.5,   // Need more time
    light: 1.25,
    moderate: 1.0,
    active: 0.85,
    athlete: 0.7,
  };

  let readinessScore = $derived.by(() => {
    // Base score from fitness and experience
    let score = 50;

    // Fitness contribution
    if (currentFitness === 'active') score += 20;
    else if (currentFitness === 'athlete') score += 30;
    else if (currentFitness === 'moderate') score += 10;
    else if (currentFitness === 'light') score += 0;
    else score -= 10; // sedentary

    // Experience contribution
    if (hikingExperience === 'expert') score += 20;
    else if (hikingExperience === 'experienced') score += 15;
    else if (hikingExperience === 'some') score += 5;
    else score -= 5; // none

    // Time contribution (more time = better prepared)
    if (weeksUntilStart > 20) score += 15;
    else if (weeksUntilStart > 12) score += 10;
    else if (weeksUntilStart > 6) score += 5;
    else if (weeksUntilStart > 2) score += 0;
    else score -= 10; // very little time

    return Math.min(100, Math.max(0, score));
  });

  let readinessLevel = $derived.by(() => {
    if (readinessScore >= 80) return { label: 'Well Prepared', color: '#16a34a' };
    if (readinessScore >= 60) return { label: 'On Track', color: '#84cc16' };
    if (readinessScore >= 40) return { label: 'Needs Work', color: '#f59e0b' };
    if (readinessScore >= 20) return { label: 'Behind Schedule', color: '#f97316' };
    return { label: 'Significant Concern', color: '#dc2626' };
  });

  // Key benchmarks to hit before starting
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

  // Load benchmarks
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

  // Save benchmarks
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
</script>

<div class="training-planner" class:mounted>
  <!-- Header -->
  <header class="planner-header">
    <div class="header-icon">🏋️</div>
    <div class="header-content">
      <h2>Training Planner</h2>
      <p>Prepare your body for the trail</p>
    </div>
    <div class="countdown">
      <span class="cd-value">{weeksUntilStart}</span>
      <span class="cd-label">weeks to go</span>
    </div>
  </header>

  <!-- Profile Section -->
  <section class="profile-section">
    <h3>Your Profile</h3>
    <div class="profile-grid">
      <div class="profile-item">
        <label>Current Fitness Level</label>
        <select bind:value={currentFitness}>
          <option value="sedentary">Sedentary (desk job, little exercise)</option>
          <option value="light">Light Activity (walks, occasional exercise)</option>
          <option value="moderate">Moderate (3-4x/week exercise)</option>
          <option value="active">Active (daily exercise, some hiking)</option>
          <option value="athlete">Athlete (intense training, regular hiking)</option>
        </select>
      </div>

      <div class="profile-item">
        <label>Hiking Experience</label>
        <select bind:value={hikingExperience}>
          <option value="none">None (never hiked)</option>
          <option value="some">Some (day hikes, occasional overnights)</option>
          <option value="experienced">Experienced (multi-day trips)</option>
          <option value="expert">Expert (long-distance trails)</option>
        </select>
      </div>

      <div class="profile-item">
        <label>Weekly Training Hours Available</label>
        <div class="hours-input">
          <input type="range" min="5" max="20" bind:value={weeklyHours} />
          <span class="hours-value">{weeklyHours} hrs/week</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Readiness Score -->
  <section class="readiness-section">
    <div class="readiness-card">
      <div class="readiness-ring">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" class="ring-bg" />
          <circle cx="50" cy="50" r="45" class="ring-fill"
            style="stroke: {readinessLevel.color}; stroke-dasharray: {readinessScore * 2.83} 283" />
        </svg>
        <div class="readiness-score">
          <span class="score-value">{readinessScore}</span>
          <span class="score-label">Readiness</span>
        </div>
      </div>
      <div class="readiness-info">
        <span class="readiness-level" style="color: {readinessLevel.color}">{readinessLevel.label}</span>
        <p class="readiness-desc">
          {#if readinessScore >= 80}
            You're in great shape to start. Stay consistent and don't overtrain.
          {:else if readinessScore >= 60}
            Good progress! Focus on consistency and building volume.
          {:else if readinessScore >= 40}
            More training needed. Prioritize weekly long hikes.
          {:else}
            Significant preparation required. Start immediately with base training.
          {/if}
        </p>
      </div>
    </div>
  </section>

  <!-- Current Phase -->
  {#if currentPhase}
  <section class="phase-section">
    <h3>Current Training Phase</h3>
    <div class="phase-card" style="--phase-color: {currentPhase.id === 'base' ? '#3b82f6' : currentPhase.id === 'build' ? '#f59e0b' : currentPhase.id === 'peak' ? '#dc2626' : '#22c55e'}">
      <div class="phase-header">
        <span class="phase-name">{currentPhase.name}</span>
        <span class="phase-weeks">{currentPhase.weeks} weeks</span>
      </div>
      <div class="phase-focus">{currentPhase.focus}</div>
      <p class="phase-desc">{currentPhase.description}</p>

      <div class="activities-list">
        <h4>Key Activities</h4>
        {#each currentPhase.activities as activity}
          <div class="activity-item" class:high={activity.priority === 'high'}>
            <div class="activity-main">
              <span class="activity-name">{activity.name}</span>
              <span class="activity-freq">{activity.frequency}</span>
            </div>
            <span class="activity-duration">{activity.duration}</span>
          </div>
        {/each}
      </div>

      <div class="phase-tips">
        <h4>Tips</h4>
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
    <div class="too-far">
      <span class="too-far-icon">📅</span>
      <h3>Training starts when you're 22 weeks out</h3>
      <p>Your start date is more than 22 weeks away. Enjoy general fitness activities and start focused training closer to your departure.</p>
    </div>
  </section>
  {/if}

  <!-- Weekly Schedule -->
  <section class="schedule-section">
    <h3>Sample Weekly Schedule</h3>
    <div class="schedule-grid">
      {#each weeklySchedule as day}
        <div class="schedule-day" class:rest={day.activity === 'Rest'}>
          <span class="day-name">{day.day.slice(0, 3)}</span>
          <span class="day-activity">{day.activity}</span>
          <span class="day-duration">{day.duration}</span>
        </div>
      {/each}
    </div>
    <p class="schedule-note">Adjust based on your schedule. The key is consistency.</p>
  </section>

  <!-- Benchmarks -->
  <section class="benchmarks-section">
    <div class="benchmarks-header">
      <h3>Pre-Trail Benchmarks</h3>
      <div class="benchmark-progress">
        <span class="bp-value">{benchmarkProgress}%</span>
        <div class="bp-bar">
          <div class="bp-fill" style="width: {benchmarkProgress}%"></div>
        </div>
      </div>
    </div>

    <div class="benchmarks-list">
      {#each benchmarks as bm}
        <label class="benchmark-item" class:done={completedBenchmarks[bm.id]}>
          <input type="checkbox" checked={completedBenchmarks[bm.id]} onchange={() => toggleBenchmark(bm.id)} />
          <span class="bm-text">{bm.text}</span>
          <span class="bm-category">{bm.category}</span>
        </label>
      {/each}
    </div>
  </section>

  <!-- Training Timeline -->
  <section class="timeline-section">
    <h3>22-Week Training Timeline</h3>
    <div class="training-timeline">
      {#each phases as phase, i}
        <div class="tl-phase" class:active={currentPhase?.id === phase.id} style="flex: {phase.weeks}">
          <div class="tl-bar" style="background: {phase.id === 'base' ? '#3b82f6' : phase.id === 'build' ? '#f59e0b' : phase.id === 'peak' ? '#dc2626' : '#22c55e'}"></div>
          <span class="tl-name">{phase.name}</span>
          <span class="tl-weeks">{phase.weeks}w</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Key Resources -->
  <section class="resources-section">
    <h3>Training Resources</h3>
    <div class="resources-grid">
      <div class="resource-card">
        <span class="resource-icon">🦵</span>
        <h4>Leg Strength</h4>
        <p>Squats, lunges, step-ups, calf raises. 2-3 sets of 12-15 reps.</p>
      </div>
      <div class="resource-card">
        <span class="resource-icon">🏔️</span>
        <h4>Elevation Training</h4>
        <p>Stair machine, hill repeats, loaded stair climbing.</p>
      </div>
      <div class="resource-card">
        <span class="resource-icon">🎒</span>
        <h4>Load Training</h4>
        <p>Start at 15lb, add 2-3lb weekly until reaching 25-30lb.</p>
      </div>
      <div class="resource-card">
        <span class="resource-icon">🧘</span>
        <h4>Flexibility</h4>
        <p>Hip flexors, hamstrings, calves. 15 min daily stretching.</p>
      </div>
    </div>
  </section>
</div>

<style>
  .training-planner {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .training-planner.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .planner-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .header-content h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-content p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .countdown {
    margin-left: auto;
    text-align: center;
    background: rgba(255,255,255,0.2);
    padding: 0.5rem 1rem;
    border-radius: 12px;
  }

  .cd-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .cd-label {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  /* Profile Section */
  .profile-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .profile-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .profile-item label {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .profile-item select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.85rem;
    background: #fff;
    color: var(--ink);
  }

  .hours-input {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hours-input input {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: var(--border);
    border-radius: 4px;
  }

  .hours-input input::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--pine);
    cursor: pointer;
  }

  .hours-value {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
    white-space: nowrap;
  }

  /* Readiness Section */
  .readiness-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .readiness-card {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .readiness-ring {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .readiness-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: var(--border);
    stroke-width: 8;
  }

  .ring-fill {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }

  .readiness-score {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .score-value {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .score-label {
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
  }

  .readiness-info {
    flex: 1;
  }

  .readiness-level {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    display: block;
    margin-bottom: 0.5rem;
  }

  .readiness-desc {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink);
    line-height: 1.5;
  }

  /* Phase Section */
  .phase-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .phase-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .phase-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    border-left: 4px solid var(--phase-color);
  }

  .phase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .phase-name {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .phase-weeks {
    font-size: 0.8rem;
    color: var(--muted);
    background: var(--bg);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
  }

  .phase-focus {
    font-size: 0.85rem;
    color: var(--phase-color);
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .phase-desc {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .activities-list h4,
  .phase-tips h4 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: var(--bg);
    border-radius: 6px;
    margin-bottom: 0.35rem;
    font-size: 0.85rem;
  }

  .activity-item.high {
    background: rgba(34, 197, 94, 0.1);
    border-left: 3px solid #22c55e;
  }

  .activity-main {
    display: flex;
    flex-direction: column;
  }

  .activity-name {
    font-weight: 600;
    color: var(--ink);
  }

  .activity-freq {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .activity-duration {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  .phase-tips {
    margin-top: 1rem;
  }

  .phase-tips ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .phase-tips li {
    margin-bottom: 0.25rem;
  }

  .too-far {
    text-align: center;
    padding: 2rem;
    background: var(--bg);
    border-radius: 12px;
  }

  .too-far-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .too-far h3 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
  }

  .too-far p {
    margin: 0;
    color: var(--muted);
  }

  /* Schedule Section */
  .schedule-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .schedule-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .schedule-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }

  .schedule-day {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .schedule-day.rest {
    opacity: 0.5;
  }

  .day-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .day-activity {
    display: block;
    font-size: 0.7rem;
    color: var(--ink);
    font-weight: 600;
    margin-bottom: 0.15rem;
  }

  .day-duration {
    font-size: 0.6rem;
    color: var(--muted);
  }

  .schedule-note {
    margin: 0.75rem 0 0;
    font-size: 0.75rem;
    color: var(--muted);
    text-align: center;
  }

  /* Benchmarks */
  .benchmarks-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .benchmarks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .benchmarks-header h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .benchmark-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bp-value {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  .bp-bar {
    width: 80px;
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }

  .bp-fill {
    height: 100%;
    background: var(--pine);
    transition: width 0.3s ease;
  }

  .benchmarks-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .benchmark-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--bg);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .benchmark-item:hover {
    background: rgba(34, 197, 94, 0.05);
  }

  .benchmark-item.done {
    background: rgba(34, 197, 94, 0.1);
  }

  .benchmark-item input {
    width: 20px;
    height: 20px;
    accent-color: var(--pine);
  }

  .bm-text {
    flex: 1;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .benchmark-item.done .bm-text {
    text-decoration: line-through;
    color: var(--muted);
  }

  .bm-category {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
    background: var(--border);
    border-radius: 10px;
    color: var(--muted);
    text-transform: uppercase;
  }

  /* Timeline */
  .timeline-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .timeline-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .training-timeline {
    display: flex;
    gap: 4px;
    height: 60px;
  }

  .tl-phase {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .tl-phase.active {
    opacity: 1;
  }

  .tl-bar {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    margin-bottom: 0.35rem;
  }

  .tl-name {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--ink);
  }

  .tl-weeks {
    font-size: 0.55rem;
    color: var(--muted);
  }

  /* Resources */
  .resources-section {
    padding: 1.5rem;
    background: #f0fdf4;
  }

  .resources-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .resources-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .resource-card {
    text-align: center;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid #86efac;
  }

  .resource-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .resource-card h4 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .resource-card p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.4;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .profile-grid {
      grid-template-columns: 1fr;
    }

    .readiness-card {
      flex-direction: column;
      text-align: center;
    }

    .schedule-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .schedule-day:nth-child(n+4) {
      display: none;
    }

    .resources-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
