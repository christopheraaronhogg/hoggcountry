<script lang="ts">
  import { onMount } from 'svelte';

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
  // QUESTIONS
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
      id: 'budget',
      question: 'What\'s your budget approach?',
      options: [
        { value: 'shoestring', label: 'Shoestring ($2-3k)', description: 'Every dollar counts' },
        { value: 'moderate', label: 'Moderate ($3-5k)', description: 'Reasonable but careful' },
        { value: 'comfortable', label: 'Comfortable ($5-8k)', description: 'Some luxuries okay' },
        { value: 'unlimited', label: 'Not worried', description: 'Money isn\'t the constraint' },
      ],
    },
    {
      id: 'start',
      question: 'When do you plan to start?',
      options: [
        { value: 'early', label: 'Early (Feb)', description: 'Cold start, beat the bubble' },
        { value: 'bubble', label: 'Bubble (March)', description: 'Most common start window' },
        { value: 'late', label: 'Late Spring (Apr-May)', description: 'Warmer start, thinner bubble' },
        { value: 'other', label: 'Other timing', description: 'Summer, SOBO, flip-flop' },
      ],
    },
    {
      id: 'gear',
      question: 'What\'s your gear philosophy?',
      options: [
        { value: 'ultralight', label: 'Ultralight', description: 'Sub-10lb base weight is the goal' },
        { value: 'light', label: 'Lightweight', description: '10-15lb base, practical minimalism' },
        { value: 'comfort', label: 'Comfort first', description: '15-20lb base, camp luxuries welcome' },
        { value: 'undecided', label: 'Still figuring it out', description: 'Help me decide' },
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
    {
      slug: '00-introduction',
      title: 'Introduction',
      baseRelevance: 80,
      relevanceFactors: { experience_none: 20, experience_weekend: 10 },
    },
    {
      slug: '01-hiker-profile-and-experience',
      title: 'Hiker Profile & Experience',
      baseRelevance: 70,
      relevanceFactors: { experience_none: 30, experience_weekend: 20, goal_finish: 10 },
    },
    {
      slug: '02-trail-sections-and-milestones',
      title: 'Trail Sections & Milestones',
      baseRelevance: 85,
      relevanceFactors: { goal_experience: 15, goal_section: 10 },
    },
    {
      slug: '03-at-mountain-and-weather-reference',
      title: 'Mountain & Weather Reference',
      baseRelevance: 75,
      relevanceFactors: { worry_weather: 25, start_early: 15, goal_fast: 10 },
    },
    {
      slug: '04-permits-and-logistics',
      title: 'Permits & Logistics',
      baseRelevance: 90,
      relevanceFactors: { experience_none: 10 },
    },
    {
      slug: '05-financial-planning',
      title: 'Financial Planning',
      baseRelevance: 70,
      relevanceFactors: { budget_shoestring: 30, budget_moderate: 20, budget_comfortable: 10 },
    },
    {
      slug: '06-gear-system',
      title: 'Gear System',
      baseRelevance: 85,
      relevanceFactors: { gear_ultralight: 15, gear_undecided: 15, experience_none: 10 },
    },
    {
      slug: '07-clothing-system',
      title: 'Clothing System',
      baseRelevance: 80,
      relevanceFactors: { start_early: 15, worry_weather: 10, gear_ultralight: 10 },
    },
    {
      slug: '08-shelter-vs-tent-decision-system',
      title: 'Shelter vs Tent Decision',
      baseRelevance: 65,
      relevanceFactors: { experience_none: 25, gear_undecided: 20, worry_social: 10 },
    },
    {
      slug: '09-water-treatment-system',
      title: 'Water Treatment',
      baseRelevance: 75,
      relevanceFactors: { experience_none: 20, experience_weekend: 10 },
    },
    {
      slug: '10-power-and-electronics',
      title: 'Power & Electronics',
      baseRelevance: 60,
      relevanceFactors: { gear_ultralight: 15, goal_fast: 10 },
    },
    {
      slug: '11-medical-planning',
      title: 'Medical Planning',
      baseRelevance: 85,
      relevanceFactors: { worry_physical: 15, experience_none: 10 },
    },
    {
      slug: '12-weather-strategy',
      title: 'Weather Strategy',
      baseRelevance: 80,
      relevanceFactors: { worry_weather: 20, start_early: 15, experience_none: 10 },
    },
    {
      slug: '13-trail-resources-and-navigation',
      title: 'Trail Resources & Navigation',
      baseRelevance: 75,
      relevanceFactors: { worry_logistics: 20, experience_none: 15 },
    },
    {
      slug: '14-food-and-resupply',
      title: 'Food & Resupply',
      baseRelevance: 85,
      relevanceFactors: { goal_fast: 10, budget_shoestring: 10 },
    },
    {
      slug: '15-resupply-logistics',
      title: 'Resupply Logistics',
      baseRelevance: 80,
      relevanceFactors: { worry_logistics: 15, experience_none: 10 },
    },
    {
      slug: '16-town-strategy',
      title: 'Town Strategy',
      baseRelevance: 75,
      relevanceFactors: { budget_shoestring: 20, goal_experience: 15, goal_fast: -10 },
    },
    {
      slug: '17-daily-operations-and-trail-life',
      title: 'Daily Operations & Trail Life',
      baseRelevance: 70,
      relevanceFactors: { experience_none: 25, experience_weekend: 15 },
    },
    {
      slug: '18-safety-and-emergency-procedures',
      title: 'Safety & Emergency Procedures',
      baseRelevance: 95,
      relevanceFactors: { worry_weather: 5, worry_physical: 5 },
    },
    {
      slug: '19-content-creation',
      title: 'Content Creation',
      baseRelevance: 30,
      relevanceFactors: { goal_experience: 30, goal_section: 20 },
    },
  ];

  // ============================================================================
  // HIKER ARCHETYPES
  // ============================================================================

  function generateProfile(answers: Record<string, string>): HikerProfile {
    const { goal, experience, budget, start, gear, worry } = answers;

    // Determine archetype
    let archetype = 'The Prepared Hiker';
    let description = '';
    const concerns: string[] = [];
    const strengths: string[] = [];

    // Budget-based archetypes
    if (budget === 'shoestring') {
      archetype = 'The Scrappy Thru-Hiker';
      description = "You're doing this lean and mean. Every dollar matters, but you've got grit.";
      concerns.push('Managing expenses in towns');
      strengths.push('Resourcefulness');
    } else if (budget === 'unlimited') {
      archetype = 'The Well-Equipped Adventurer';
      description = "You can focus on the experience without worrying about costs.";
      strengths.push('Best gear available');
      strengths.push('Can afford rest days when needed');
    }

    // Experience-based modifications
    if (experience === 'none') {
      archetype = experience === 'none' && budget === 'shoestring'
        ? 'The Bold Beginner'
        : 'The Eager Newcomer';
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
      archetype = budget === 'unlimited' ? 'The Zen Hiker' : 'The Wandering Soul';
      description = "It's not about the destination. Side trails, zero days, and stories matter most.";
      strengths.push('Will enjoy the journey');
      concerns.push('Might run long on timeline');
    }

    // Weather concerns
    if (worry === 'weather') {
      concerns.push('Above-treeline exposure');
      concerns.push('Cold weather preparedness');
    }
    if (worry === 'physical') {
      concerns.push('Injury prevention');
      concerns.push('Pacing and recovery');
    }

    // Start timing
    let startTiming = 'March bubble start';
    if (start === 'early') {
      startTiming = 'February cold-start';
      concerns.push('Early season weather in GA/NC');
    } else if (start === 'late') {
      startTiming = 'Late spring start';
      strengths.push('Warmer conditions early');
    }

    return { archetype, description, startTiming, concerns, strengths };
  }

  // ============================================================================
  // RELEVANCE CALCULATION
  // ============================================================================

  function calculateRelevance(answers: Record<string, string>): { slug: string; title: string; score: number; tier: string }[] {
    return chapterMatrix
      .map(chapter => {
        let score = chapter.baseRelevance;

        // Apply relevance factors based on answers
        for (const [key, value] of Object.entries(answers)) {
          const factorKey = `${key}_${value}`;
          if (chapter.relevanceFactors[factorKey]) {
            score += chapter.relevanceFactors[factorKey];
          }
        }

        // Clamp to 0-100
        score = Math.max(0, Math.min(100, score));

        // Assign tier
        let tier = 'reference';
        if (score >= 90) tier = 'essential';
        else if (score >= 75) tier = 'important';
        else if (score >= 50) tier = 'helpful';

        return { slug: chapter.slug, title: chapter.title, score, tier };
      })
      .sort((a, b) => b.score - a.score);
  }

  // ============================================================================
  // STATE
  // ============================================================================

  let currentStep = 0;
  let answers: Record<string, string> = {};
  let showResults = false;
  let profile: HikerProfile | null = null;
  let rankedChapters: { slug: string; title: string; score: number; tier: string }[] = [];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  function selectAnswer(questionId: string, value: string) {
    answers[questionId] = value;

    if (currentStep < questions.length - 1) {
      currentStep++;
    } else {
      // Generate results
      profile = generateProfile(answers);
      rankedChapters = calculateRelevance(answers);
      showResults = true;
    }
  }

  function goBack() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  function restart() {
    currentStep = 0;
    answers = {};
    showResults = false;
    profile = null;
    rankedChapters = [];
  }

  function getTierEmoji(tier: string): string {
    switch (tier) {
      case 'essential': return '🔴';
      case 'important': return '🟠';
      case 'helpful': return '🟡';
      default: return '⚪';
    }
  }

  function getTierLabel(tier: string): string {
    switch (tier) {
      case 'essential': return 'Must Read';
      case 'important': return 'High Priority';
      case 'helpful': return 'Recommended';
      default: return 'Reference';
    }
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
      <div class="profile-card">
        <div class="profile-badge">{profile?.archetype}</div>
        <p class="profile-desc">{profile?.description}</p>

        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">Start:</span>
            <span class="detail-value">{profile?.startTiming}</span>
          </div>

          {#if profile?.strengths.length}
            <div class="detail-section">
              <span class="detail-label">Your Strengths:</span>
              <ul class="detail-list positive">
                {#each profile.strengths as strength}
                  <li>{strength}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if profile?.concerns.length}
            <div class="detail-section">
              <span class="detail-label">Watch Out For:</span>
              <ul class="detail-list caution">
                {#each profile.concerns as concern}
                  <li>{concern}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>

      <div class="reading-order">
        <h3>Your Personalized Reading Order</h3>
        <p class="reading-intro">Based on your profile, here's how we recommend you approach the guide:</p>

        <div class="tier-legend">
          <span class="legend-item"><span class="legend-dot essential"></span> Must Read</span>
          <span class="legend-item"><span class="legend-dot important"></span> High Priority</span>
          <span class="legend-item"><span class="legend-dot helpful"></span> Recommended</span>
          <span class="legend-item"><span class="legend-dot reference"></span> Reference</span>
        </div>

        <div class="chapters-list">
          {#each rankedChapters as chapter, i}
            <a
              href="/guide/{chapter.slug}/"
              class="chapter-item tier-{chapter.tier}"
            >
              <span class="chapter-rank">{i + 1}</span>
              <span class="chapter-tier-dot tier-{chapter.tier}"></span>
              <span class="chapter-title">{chapter.title}</span>
              <span class="chapter-score">{chapter.score}%</span>
            </a>
          {/each}
        </div>
      </div>

      <div class="results-actions">
        <button class="restart-btn" on:click={restart}>Start Over</button>
        <a href="/guide/" class="guide-btn">View Full Guide</a>
      </div>
    </div>
  {/if}
</div>

<style>
  .wizard-container {
    max-width: 700px;
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
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
    text-align: center;
  }

  /* Options Grid */
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
    font-size: 1.1rem;
    color: var(--color-text, #fff);
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
    font-size: 0.9rem;
  }

  .back-btn:hover {
    border-color: var(--color-text-muted, #888);
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
    padding: 2rem;
    margin-bottom: 2rem;
    text-align: center;
  }

  .profile-badge {
    display: inline-block;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .profile-desc {
    font-size: 1.1rem;
    opacity: 0.95;
    margin-bottom: 1.5rem;
  }

  .profile-details {
    text-align: left;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .detail-section {
    margin-top: 1rem;
  }

  .detail-label {
    font-weight: 600;
    opacity: 0.9;
  }

  .detail-list {
    margin: 0.5rem 0 0 1.25rem;
    padding: 0;
  }

  .detail-list li {
    margin: 0.25rem 0;
    opacity: 0.9;
  }

  .detail-list.positive li::marker {
    content: '+ ';
  }

  .detail-list.caution li::marker {
    content: '! ';
  }

  /* Reading Order */
  .reading-order {
    background: var(--color-surface, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .reading-order h3 {
    font-family: var(--font-heading, 'Oswald', sans-serif);
    font-size: 1.3rem;
    margin: 0 0 0.5rem;
  }

  .reading-intro {
    color: var(--color-text-muted, #888);
    font-size: 0.9rem;
    margin: 0 0 1rem;
  }

  /* Tier Legend */
  .tier-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--color-surface-muted, #2a2a2a);
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .legend-dot.essential { background: #e74c3c; }
  .legend-dot.important { background: #f39c12; }
  .legend-dot.helpful { background: #f1c40f; }
  .legend-dot.reference { background: #95a5a6; }

  /* Chapters List */
  .chapters-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .chapter-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-surface-elevated, #252525);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    text-decoration: none;
    color: var(--color-text, #fff);
    transition: all 0.2s ease;
  }

  .chapter-item:hover {
    border-color: var(--color-evergreen, #4a7c59);
    transform: translateX(4px);
  }

  .chapter-rank {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-muted, #2a2a2a);
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .chapter-tier-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .chapter-tier-dot.tier-essential { background: #e74c3c; }
  .chapter-tier-dot.tier-important { background: #f39c12; }
  .chapter-tier-dot.tier-helpful { background: #f1c40f; }
  .chapter-tier-dot.tier-reference { background: #95a5a6; }

  .chapter-title {
    flex: 1;
    font-size: 0.95rem;
  }

  .chapter-score {
    font-size: 0.8rem;
    color: var(--color-text-muted, #888);
    font-family: monospace;
  }

  /* Tier styling for items */
  .chapter-item.tier-essential {
    border-left: 3px solid #e74c3c;
  }

  .chapter-item.tier-important {
    border-left: 3px solid #f39c12;
  }

  .chapter-item.tier-helpful {
    border-left: 3px solid #f1c40f;
  }

  /* Results Actions */
  .results-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .restart-btn {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    color: var(--color-text-muted, #888);
    cursor: pointer;
    font-size: 0.95rem;
  }

  .restart-btn:hover {
    border-color: var(--color-text-muted, #888);
  }

  .guide-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-evergreen, #4a7c59);
    border: none;
    border-radius: 6px;
    color: white;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 600;
    transition: background 0.2s ease;
  }

  .guide-btn:hover {
    background: #5a9469;
  }

  /* Mobile adjustments */
  @media (max-width: 600px) {
    .wizard-container {
      padding: 0.5rem;
    }

    .question-card {
      padding: 1.25rem;
    }

    .question-text {
      font-size: 1.25rem;
    }

    .tier-legend {
      justify-content: center;
    }

    .chapter-item {
      padding: 0.5rem 0.75rem;
    }

    .chapter-score {
      display: none;
    }
  }
</style>
