<script lang="ts">
  import { onMount } from 'svelte';
  import {
    calculateHikerStats,
    formatDate,
    formatDateLong,
    formatMoney,
    type HikerInputs,
    type CalculatedStats,
  } from '../lib/hikerStats';

  // ============================================================================
  // TYPES
  // ============================================================================

  interface Question {
    id: string;
    question: string;
    options: { value: string; label: string; description?: string }[];
  }

  interface ChapterRelevance {
    slug: string;
    title: string;
    baseRelevance: number;
    relevanceFactors: Record<string, number>;
  }

  interface HikerProfile {
    archetype: string;
    description: string;
    startTiming: string;
    concerns: string[];
    strengths: string[];
  }

  // ============================================================================
  // QUESTIONS (expanded for stats calculation)
  // ============================================================================

  const questions: Question[] = [
    {
      id: 'goal',
      question: "What's your primary goal for this hike?",
      options: [
        { value: 'finish', label: 'Complete the trail', description: 'Touch both termini, earn the title' },
        { value: 'experience', label: 'Savor the journey', description: 'Take zeros, explore side trails' },
        { value: 'fast', label: 'Go fast', description: 'Efficient miles, athletic challenge' },
        { value: 'section', label: 'Section hike', description: 'Just doing part of it this year' },
      ],
    },
    {
      id: 'experience',
      question: 'What backpacking experience do you have?',
      options: [
        { value: 'none', label: 'Never backpacked', description: 'Day hikes or car camping only' },
        { value: 'weekend', label: 'Weekend trips', description: 'A few overnights under my belt' },
        { value: 'multi', label: 'Multi-day trips', description: 'Week-long trips, maybe a section hike' },
        { value: 'thru', label: 'Long trail veteran', description: 'Completed a thru-hike before' },
      ],
    },
    {
      id: 'fitness',
      question: 'How would you describe your current fitness?',
      options: [
        { value: 'couch', label: 'Starting fresh', description: 'Mostly sedentary, building from zero' },
        { value: 'moderate', label: 'Moderately active', description: 'Regular walks, occasional hikes' },
        { value: 'active', label: 'Very active', description: 'Regular cardio, strong hiking base' },
        { value: 'athlete', label: 'Athlete', description: 'Train daily, competitive endurance' },
      ],
    },
    {
      id: 'start',
      question: 'When do you plan to start?',
      options: [
        { value: 'february', label: 'February', description: 'Cold start, beat the bubble' },
        { value: 'march', label: 'March', description: 'Peak bubble start window' },
        { value: 'april', label: 'April', description: 'Warmer start, thinner crowds' },
        { value: 'may', label: 'May', description: 'Late start, race the weather north' },
      ],
    },
    {
      id: 'pace',
      question: 'What daily mileage are you targeting?',
      options: [
        { value: '10', label: '8-12 miles/day', description: 'Relaxed pace, ~6 month finish' },
        { value: '14', label: '12-15 miles/day', description: 'Moderate pace, ~5 month finish' },
        { value: '18', label: '15-20 miles/day', description: 'Fast pace, ~4 month finish' },
        { value: '22', label: '20+ miles/day', description: 'Aggressive, sub-4 month finish' },
      ],
    },
    {
      id: 'zeros',
      question: 'How often do you plan to take zero days?',
      options: [
        { value: 'rarely', label: 'Rarely', description: '1-2 per month max' },
        { value: 'biweekly', label: 'Every 2 weeks', description: 'Scheduled recovery days' },
        { value: 'weekly', label: 'Weekly', description: 'One zero per week on average' },
        { value: 'frequently', label: 'Frequently', description: 'Multiple per week when needed' },
      ],
    },
    {
      id: 'budget',
      question: "What's your total budget?",
      options: [
        { value: '3000', label: '$2,000-3,500', description: 'Shoestring - stealth camp, cook everything' },
        { value: '5000', label: '$4,000-6,000', description: 'Moderate - occasional hostel, some meals out' },
        { value: '7500', label: '$6,000-9,000', description: 'Comfortable - motels, eat out regularly' },
        { value: '10000', label: '$10,000+', description: 'No constraints' },
      ],
    },
    {
      id: 'worry',
      question: 'What concerns you most?',
      options: [
        { value: 'weather', label: 'Weather & exposure', description: 'Storms, cold, above treeline' },
        { value: 'physical', label: 'Physical challenge', description: 'Injuries, fitness, terrain' },
        { value: 'logistics', label: 'Logistics', description: 'Resupply, navigation, planning' },
        { value: 'social', label: 'Social aspects', description: 'Being alone, or too many people' },
      ],
    },
  ];

  // ============================================================================
  // CHAPTER RELEVANCE MATRIX
  // ============================================================================

  const chapterMatrix: ChapterRelevance[] = [
    { slug: '00-introduction', title: 'Introduction', baseRelevance: 80, relevanceFactors: { experience_none: 20, experience_weekend: 10 } },
    { slug: '01-hiker-profile-and-experience', title: 'Hiker Profile & Experience', baseRelevance: 70, relevanceFactors: { experience_none: 30, experience_weekend: 20, goal_finish: 10 } },
    { slug: '02-trail-sections-and-milestones', title: 'Trail Sections & Milestones', baseRelevance: 85, relevanceFactors: { goal_experience: 15, goal_section: 10 } },
    { slug: '03-at-mountain-and-weather-reference', title: 'Mountain & Weather Reference', baseRelevance: 75, relevanceFactors: { worry_weather: 25, start_february: 15, goal_fast: 10 } },
    { slug: '04-permits-and-logistics', title: 'Permits & Logistics', baseRelevance: 90, relevanceFactors: { experience_none: 10 } },
    { slug: '05-financial-planning', title: 'Financial Planning', baseRelevance: 70, relevanceFactors: { budget_3000: 30, budget_5000: 20, budget_7500: 10 } },
    { slug: '06-gear-system', title: 'Gear System', baseRelevance: 85, relevanceFactors: { experience_none: 15, experience_weekend: 10 } },
    { slug: '07-clothing-system', title: 'Clothing System', baseRelevance: 80, relevanceFactors: { start_february: 15, worry_weather: 10 } },
    { slug: '08-shelter-vs-tent-decision-system', title: 'Shelter vs Tent Decision', baseRelevance: 65, relevanceFactors: { experience_none: 25, worry_social: 10 } },
    { slug: '09-water-treatment-system', title: 'Water Treatment', baseRelevance: 75, relevanceFactors: { experience_none: 20, experience_weekend: 10 } },
    { slug: '10-power-and-electronics', title: 'Power & Electronics', baseRelevance: 60, relevanceFactors: { goal_fast: 10 } },
    { slug: '11-medical-planning', title: 'Medical Planning', baseRelevance: 85, relevanceFactors: { worry_physical: 15, experience_none: 10 } },
    { slug: '12-weather-strategy', title: 'Weather Strategy', baseRelevance: 80, relevanceFactors: { worry_weather: 20, start_february: 15, experience_none: 10 } },
    { slug: '13-trail-resources-and-navigation', title: 'Trail Resources & Navigation', baseRelevance: 75, relevanceFactors: { worry_logistics: 20, experience_none: 15 } },
    { slug: '14-food-and-resupply', title: 'Food & Resupply', baseRelevance: 85, relevanceFactors: { goal_fast: 10, budget_3000: 10 } },
    { slug: '15-resupply-logistics', title: 'Resupply Logistics', baseRelevance: 80, relevanceFactors: { worry_logistics: 15, experience_none: 10 } },
    { slug: '16-town-strategy', title: 'Town Strategy', baseRelevance: 75, relevanceFactors: { budget_3000: 20, goal_experience: 15, goal_fast: -10 } },
    { slug: '17-daily-operations-and-trail-life', title: 'Daily Operations & Trail Life', baseRelevance: 70, relevanceFactors: { experience_none: 25, experience_weekend: 15 } },
    { slug: '18-safety-and-emergency-procedures', title: 'Safety & Emergency Procedures', baseRelevance: 95, relevanceFactors: { worry_weather: 5, worry_physical: 5 } },
    { slug: '19-content-creation', title: 'Content Creation', baseRelevance: 30, relevanceFactors: { goal_experience: 30, goal_section: 20 } },
  ];

  // ============================================================================
  // STATE
  // ============================================================================

  let currentStep = 0;
  let answers: Record<string, string> = {};
  let showResults = false;
  let profile: HikerProfile | null = null;
  let stats: CalculatedStats | null = null;
  let rankedChapters: { slug: string; title: string; score: number; tier: string }[] = [];

  // ============================================================================
  // PROFILE GENERATION
  // ============================================================================

  function generateProfile(answers: Record<string, string>): HikerProfile {
    const { goal, experience, budget, start, worry, fitness, pace } = answers;

    let archetype = 'The Prepared Hiker';
    let description = '';
    const concerns: string[] = [];
    const strengths: string[] = [];

    // Budget-based archetypes
    if (budget === '3000') {
      archetype = 'The Scrappy Thru-Hiker';
      description = "You're doing this lean and mean. Every dollar matters, but you've got grit.";
      concerns.push('Managing expenses in towns');
      strengths.push('Resourcefulness');
    } else if (budget === '10000') {
      archetype = 'The Well-Equipped Adventurer';
      description = "You can focus on the experience without worrying about costs.";
      strengths.push('Best gear available');
      strengths.push('Can afford rest days when needed');
    }

    // Experience-based modifications
    if (experience === 'none') {
      archetype = budget === '3000' ? 'The Bold Beginner' : 'The Eager Newcomer';
      description = "You're jumping in fresh. The learning curve is steep, but that's part of the adventure.";
      concerns.push('Building trail skills on the go');
      concerns.push('Gear shakedown will be critical');
    } else if (experience === 'thru') {
      archetype = 'The Veteran';
      description = "You've done this before. You know what works for you.";
      strengths.push('Trail-tested systems');
      strengths.push('Mental resilience');
    }

    // Goal-based modifications
    if (goal === 'fast') {
      archetype = experience === 'thru' ? 'The Speed Demon' : 'The Ambitious Miler';
      description = "You're here to move. Big miles, efficient camps, eyes on the prize.";
      strengths.push('Clear focus');
      concerns.push('Injury risk from pushing hard');
    } else if (goal === 'experience') {
      archetype = budget === '10000' ? 'The Zen Hiker' : 'The Wandering Soul';
      description = "It's not about the destination. Side trails, zero days, and stories matter most.";
      strengths.push('Will enjoy the journey');
      concerns.push('Might run long on timeline');
    }

    // Fitness modifications
    if (fitness === 'couch') {
      concerns.push('Building trail legs from scratch');
    } else if (fitness === 'athlete') {
      strengths.push('Physical foundation already built');
    }

    // Weather/start concerns
    if (worry === 'weather') {
      concerns.push('Above-treeline exposure');
    }
    if (start === 'february') {
      concerns.push('Early season cold in GA/NC');
    }

    const startTiming = start === 'february' ? 'February cold-start' :
                       start === 'march' ? 'March bubble start' :
                       start === 'april' ? 'April warm-start' : 'Late May start';

    return { archetype, description, startTiming, concerns, strengths };
  }

  // ============================================================================
  // STATS CALCULATION
  // ============================================================================

  function calculateStats(answers: Record<string, string>): CalculatedStats {
    const budgetMap: Record<string, 'shoestring' | 'moderate' | 'comfortable' | 'unlimited'> = {
      '3000': 'shoestring',
      '5000': 'moderate',
      '7500': 'comfortable',
      '10000': 'unlimited',
    };

    const inputs: HikerInputs = {
      startMonth: answers.start as any,
      startYear: 2026,
      dailyMiles: parseInt(answers.pace) || 14,
      zeroFrequency: answers.zeros as any,
      totalBudget: parseInt(answers.budget) || 5000,
      budgetStyle: budgetMap[answers.budget] || 'moderate',
      experienceLevel: answers.experience as any,
      fitnessLevel: answers.fitness as any,
    };

    return calculateHikerStats(inputs);
  }

  // ============================================================================
  // RELEVANCE CALCULATION
  // ============================================================================

  function calculateRelevance(answers: Record<string, string>): { slug: string; title: string; score: number; tier: string }[] {
    return chapterMatrix
      .map(chapter => {
        let score = chapter.baseRelevance;
        for (const [key, value] of Object.entries(answers)) {
          const factorKey = `${key}_${value}`;
          if (chapter.relevanceFactors[factorKey]) {
            score += chapter.relevanceFactors[factorKey];
          }
        }
        score = Math.max(0, Math.min(100, score));
        let tier = 'reference';
        if (score >= 90) tier = 'essential';
        else if (score >= 75) tier = 'important';
        else if (score >= 50) tier = 'helpful';
        return { slug: chapter.slug, title: chapter.title, score, tier };
      })
      .sort((a, b) => b.score - a.score);
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function selectAnswer(questionId: string, value: string) {
    answers[questionId] = value;
    if (currentStep < questions.length - 1) {
      currentStep++;
    } else {
      profile = generateProfile(answers);
      stats = calculateStats(answers);
      rankedChapters = calculateRelevance(answers);
      showResults = true;
    }
  }

  function goBack() {
    if (currentStep > 0) currentStep--;
  }

  function restart() {
    currentStep = 0;
    answers = {};
    showResults = false;
    profile = null;
    stats = null;
    rankedChapters = [];
  }
</script>

<div class="wizard-container">
  {#if !showResults}
    <!-- Question Phase -->
    <div class="question-phase">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {((currentStep + 1) / questions.length) * 100}%"></div>
      </div>
      <div class="progress-text">Question {currentStep + 1} of {questions.length}</div>

      <div class="question-card">
        <h2 class="question-text">{questions[currentStep].question}</h2>
        <div class="options-grid">
          {#each questions[currentStep].options as option}
            <button
              class="option-btn"
              class:selected={answers[questions[currentStep].id] === option.value}
              on:click={() => selectAnswer(questions[currentStep].id, option.value)}
            >
              <span class="option-label">{option.label}</span>
              {#if option.description}
                <span class="option-desc">{option.description}</span>
              {/if}
            </button>
          {/each}
        </div>
        {#if currentStep > 0}
          <button class="back-btn" on:click={goBack}>Back</button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Results Phase -->
    <div class="results-phase">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-badge">{profile?.archetype}</div>
        <p class="profile-desc">{profile?.description}</p>
        <div class="profile-meta">
          <span class="meta-item">Start: {profile?.startTiming}</span>
        </div>
      </div>

      <!-- Stats Infographic -->
      {#if stats}
        <div class="stats-grid">
          <!-- Timeline Card -->
          <div class="stat-card timeline-card">
            <h3 class="stat-title">Your Timeline</h3>
            <div class="big-stat">
              <span class="big-number">{stats.totalDays}</span>
              <span class="big-label">Total Days</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Hiking Days</span>
              <span class="stat-value">{stats.hikingDays}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Zero Days</span>
              <span class="stat-value">{stats.zeroDays}</span>
            </div>
            <div class="stat-row highlight">
              <span class="stat-label">Finish Date</span>
              <span class="stat-value">{formatDateLong(stats.expectedFinishDate)}</span>
            </div>
          </div>

          <!-- Pace Card -->
          <div class="stat-card pace-card">
            <h3 class="stat-title">Your Pace</h3>
            <div class="big-stat">
              <span class="big-number">{stats.avgDailyMiles}</span>
              <span class="big-label">Avg Miles/Day</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Week 1 (Ramp-up)</span>
              <span class="stat-value">{stats.firstWeekMiles} mi total</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Cruising Pace</span>
              <span class="stat-value">{stats.cruisingMiles} mi/day</span>
            </div>
          </div>

          <!-- Budget Card -->
          <div class="stat-card budget-card">
            <h3 class="stat-title">Your Budget</h3>
            <div class="big-stat">
              <span class="big-number">{formatMoney(parseInt(answers.budget))}</span>
              <span class="big-label">Total Budget</span>
            </div>
            <div class="budget-breakdown">
              <div class="budget-bar">
                <div class="budget-segment food" style="width: {(stats.foodBudget / parseInt(answers.budget)) * 100}%"></div>
                <div class="budget-segment town" style="width: {(stats.townBudget / parseInt(answers.budget)) * 100}%"></div>
                <div class="budget-segment gear" style="width: {(stats.gearReplacementBudget / parseInt(answers.budget)) * 100}%"></div>
                <div class="budget-segment buffer" style="width: {Math.max(0, stats.emergencyBuffer) / parseInt(answers.budget) * 100}%"></div>
              </div>
              <div class="budget-legend">
                <span><span class="dot food"></span> Food {formatMoney(stats.foodBudget)}</span>
                <span><span class="dot town"></span> Towns {formatMoney(stats.townBudget)}</span>
                <span><span class="dot gear"></span> Gear {formatMoney(stats.gearReplacementBudget)}</span>
                <span><span class="dot buffer"></span> Buffer {formatMoney(Math.max(0, stats.emergencyBuffer))}</span>
              </div>
            </div>
            <div class="stat-row">
              <span class="stat-label">Daily Budget</span>
              <span class="stat-value">{formatMoney(stats.dailyBudget)}/day</span>
            </div>
          </div>

          <!-- Resupply Card -->
          <div class="stat-card resupply-card">
            <h3 class="stat-title">Resupply Plan</h3>
            <div class="big-stat">
              <span class="big-number">{stats.resupplyStops}</span>
              <span class="big-label">Town Stops</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Days Between Resupply</span>
              <span class="stat-value">~{stats.avgDaysBetweenResupply} days</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Avg Food Carry</span>
              <span class="stat-value">{stats.avgFoodWeight} lbs</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Avg Town Cost</span>
              <span class="stat-value">{formatMoney(stats.avgTownCost)}</span>
            </div>
          </div>

          <!-- Milestones Card -->
          <div class="stat-card milestones-card full-width">
            <h3 class="stat-title">Key Milestones</h3>
            <div class="milestone-timeline">
              <div class="milestone">
                <span class="milestone-date">{formatDate(new Date(2026, ['february', 'march', 'april', 'may'].indexOf(answers.start), 15))}</span>
                <span class="milestone-marker start"></span>
                <span class="milestone-label">Springer</span>
              </div>
              <div class="milestone">
                <span class="milestone-date">{formatDate(stats.quarterMileDate)}</span>
                <span class="milestone-marker"></span>
                <span class="milestone-label">25% (mi 549)</span>
              </div>
              <div class="milestone">
                <span class="milestone-date">{formatDate(stats.halfwayDate)}</span>
                <span class="milestone-marker halfway"></span>
                <span class="milestone-label">Halfway</span>
              </div>
              <div class="milestone">
                <span class="milestone-date">{formatDate(stats.threeQuarterDate)}</span>
                <span class="milestone-marker"></span>
                <span class="milestone-label">75% (mi 1648)</span>
              </div>
              <div class="milestone">
                <span class="milestone-date">{formatDate(stats.katahdinDate)}</span>
                <span class="milestone-marker finish"></span>
                <span class="milestone-label">Katahdin!</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Warnings -->
        {#if stats.warnings.length > 0}
          <div class="warnings-box">
            <h4>Heads Up</h4>
            <ul>
              {#each stats.warnings as warning}
                <li>{warning}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Tips -->
        {#if stats.tips.length > 0}
          <div class="tips-box">
            <h4>Tips for Your Profile</h4>
            <ul>
              {#each stats.tips as tip}
                <li>{tip}</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}

      <!-- Reading Order -->
      <div class="reading-order">
        <h3>Your Personalized Reading Order</h3>
        <p class="reading-intro">Based on your profile, prioritize these chapters:</p>
        <div class="chapters-list">
          {#each rankedChapters.slice(0, 10) as chapter, i}
            <a href="/guide/{chapter.slug}/" class="chapter-item tier-{chapter.tier}">
              <span class="chapter-rank">{i + 1}</span>
              <span class="chapter-tier-dot tier-{chapter.tier}"></span>
              <span class="chapter-title">{chapter.title}</span>
              <span class="chapter-score">{chapter.score}%</span>
            </a>
          {/each}
        </div>
        <a href="/guide/" class="view-all-link">View all 20 chapters &rarr;</a>
      </div>

      <div class="results-actions">
        <button class="restart-btn" on:click={restart}>Start Over</button>
        <a href="/guide/" class="guide-btn">Read the Guide</a>
      </div>
    </div>
  {/if}
</div>

<style>
  .wizard-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  /* Progress Bar */
  .progress-bar {
    height: 6px;
    background: var(--color-surface-muted, #2a2a2a);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-evergreen, #4a7c59);
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    font-size: 0.85rem;
    color: var(--color-text-muted, #888);
    margin-bottom: 1.5rem;
  }

  /* Question Card */
  .question-card {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    padding: 2rem;
  }

  .question-text {
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 1.4rem;
    margin: 0 0 1.5rem;
    text-align: center;
  }

  .options-grid {
    display: grid;
    gap: 0.75rem;
  }

  .option-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 1rem 1.25rem;
    background: var(--color-surface-elevated, #252525);
    border: 2px solid var(--color-border, #333);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    color: inherit;
  }

  .option-btn:hover {
    border-color: var(--color-evergreen, #4a7c59);
    background: var(--color-surface-hover, #2a2a2a);
  }

  .option-btn.selected {
    border-color: var(--color-evergreen, #4a7c59);
    background: rgba(74, 124, 89, 0.15);
  }

  .option-label {
    font-weight: 600;
    font-size: 1.05rem;
  }

  .option-desc {
    font-size: 0.85rem;
    color: var(--color-text-muted, #888);
  }

  .back-btn {
    display: block;
    margin: 1.5rem auto 0;
    padding: 0.5rem 1.5rem;
    background: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-muted, #888);
    cursor: pointer;
  }

  /* Results Phase */
  .results-phase {
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Profile Card */
  .profile-card {
    background: linear-gradient(135deg, var(--color-evergreen, #4a7c59) 0%, #2d4a35 100%);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .profile-badge {
    display: inline-block;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.4rem 1.25rem;
    border-radius: 20px;
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .profile-desc {
    font-size: 1rem;
    opacity: 0.95;
    margin: 0 0 0.75rem;
  }

  .profile-meta {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 10px;
    padding: 1.25rem;
  }

  .stat-card.full-width {
    grid-column: span 2;
  }

  .stat-title {
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 0.95rem;
    margin: 0 0 1rem;
    color: var(--color-text-muted, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .big-stat {
    text-align: center;
    margin-bottom: 1rem;
  }

  .big-number {
    display: block;
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-evergreen, #4a7c59);
  }

  .big-label {
    font-size: 0.8rem;
    color: var(--color-text-muted, #888);
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--color-border, #333);
    font-size: 0.9rem;
  }

  .stat-row:last-child {
    border-bottom: none;
  }

  .stat-row.highlight {
    background: rgba(74, 124, 89, 0.1);
    margin: 0.5rem -0.5rem -0.5rem;
    padding: 0.5rem;
    border-radius: 0 0 6px 6px;
    border-bottom: none;
  }

  .stat-label {
    color: var(--color-text-muted, #aaa);
  }

  .stat-value {
    font-weight: 600;
  }

  /* Budget Breakdown */
  .budget-breakdown {
    margin-bottom: 1rem;
  }

  .budget-bar {
    display: flex;
    height: 20px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .budget-segment {
    transition: width 0.3s ease;
  }

  .budget-segment.food { background: #22c55e; }
  .budget-segment.town { background: #3b82f6; }
  .budget-segment.gear { background: #f59e0b; }
  .budget-segment.buffer { background: #6b7280; }

  .budget-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.75rem;
  }

  .budget-legend span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .dot.food { background: #22c55e; }
  .dot.town { background: #3b82f6; }
  .dot.gear { background: #f59e0b; }
  .dot.buffer { background: #6b7280; }

  /* Milestone Timeline */
  .milestone-timeline {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    padding: 0 0.5rem;
  }

  .milestone-timeline::before {
    content: '';
    position: absolute;
    top: 28px;
    left: 10%;
    right: 10%;
    height: 3px;
    background: var(--color-border, #333);
  }

  .milestone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    z-index: 1;
  }

  .milestone-date {
    font-size: 0.7rem;
    color: var(--color-text-muted, #888);
  }

  .milestone-marker {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-surface-muted, #333);
    border: 2px solid var(--color-border, #444);
  }

  .milestone-marker.start { background: var(--color-evergreen, #4a7c59); border-color: var(--color-evergreen); }
  .milestone-marker.halfway { background: #f59e0b; border-color: #f59e0b; }
  .milestone-marker.finish { background: #ef4444; border-color: #ef4444; }

  .milestone-label {
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Warnings & Tips */
  .warnings-box, .tips-box {
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .warnings-box {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .tips-box {
    background: rgba(74, 124, 89, 0.1);
    border: 1px solid rgba(74, 124, 89, 0.3);
  }

  .warnings-box h4, .tips-box h4 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
  }

  .warnings-box ul, .tips-box ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
  }

  .warnings-box li, .tips-box li {
    margin: 0.25rem 0;
  }

  /* Reading Order */
  .reading-order {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .reading-order h3 {
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
  }

  .reading-intro {
    color: var(--color-text-muted, #888);
    font-size: 0.85rem;
    margin: 0 0 1rem;
  }

  .chapters-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .chapter-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    background: var(--color-surface-elevated, #252525);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .chapter-item:hover {
    border-color: var(--color-evergreen, #4a7c59);
    transform: translateX(4px);
  }

  .chapter-rank {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-muted, #2a2a2a);
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .chapter-tier-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .chapter-tier-dot.tier-essential { background: #e74c3c; }
  .chapter-tier-dot.tier-important { background: #f39c12; }
  .chapter-tier-dot.tier-helpful { background: #f1c40f; }
  .chapter-tier-dot.tier-reference { background: #95a5a6; }

  .chapter-title {
    flex: 1;
    font-size: 0.9rem;
  }

  .chapter-score {
    font-size: 0.75rem;
    color: var(--color-text-muted, #888);
    font-family: monospace;
  }

  .chapter-item.tier-essential { border-left: 3px solid #e74c3c; }
  .chapter-item.tier-important { border-left: 3px solid #f39c12; }
  .chapter-item.tier-helpful { border-left: 3px solid #f1c40f; }

  .view-all-link {
    display: block;
    text-align: center;
    margin-top: 1rem;
    color: var(--color-evergreen, #4a7c59);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .view-all-link:hover {
    text-decoration: underline;
  }

  /* Actions */
  .results-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .restart-btn {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    color: var(--color-text-muted, #888);
    cursor: pointer;
  }

  .guide-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-evergreen, #4a7c59);
    border: none;
    border-radius: 6px;
    color: white;
    text-decoration: none;
    font-weight: 600;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .stat-card.full-width {
      grid-column: span 1;
    }

    .milestone-timeline {
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
    }

    .milestone-timeline::before {
      display: none;
    }

    .big-number {
      font-size: 2rem;
    }

    .chapter-score {
      display: none;
    }
  }
</style>
