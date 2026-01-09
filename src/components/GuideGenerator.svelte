<script>
  /** @type {{ }} */
  let { } = $props();

  // Current step (0-indexed)
  let currentStep = $state(0);
  let showOutput = $state(false);
  let copied = $state(false);

  // Form data with defaults
  let formData = $state({
    // Step 1: The Basics
    name: '',
    trailName: '',
    startMonth: 'march',
    startYear: '2026',
    direction: 'nobo',
    targetMonths: '5-6',

    // Step 2: Experience
    firstThruHike: true,
    previousTrails: [],
    atExperience: 'none',
    highElevation: false,

    // Step 3: Physical
    ageRange: '30-40',
    fitnessLevel: 'moderate',
    injuries: '',
    kneeAnkle: false,

    // Step 4: Gear
    baseWeight: '20-25',
    packBrand: '',
    tentType: 'tent',
    sleepTemp: '20',
    shelterPreference: 'mix',

    // Step 5: Budget & Style
    totalBudget: '5000-7000',
    townStyle: 'mix',
    zeroFrequency: 'weekly',
    dailyMiles: '12-15',

    // Step 6: Content & Goals
    contentCreation: 'none',
    concerns: [],
    personalGoals: '',
  });

  const steps = [
    { id: 'basics', title: 'The Basics', icon: '🏔️', subtitle: 'Your journey starts here' },
    { id: 'experience', title: 'Experience', icon: '🥾', subtitle: 'What you bring to the trail' },
    { id: 'physical', title: 'Physical Profile', icon: '💪', subtitle: 'Know your body' },
    { id: 'gear', title: 'Gear Setup', icon: '🎒', subtitle: 'Your mobile home' },
    { id: 'budget', title: 'Budget & Style', icon: '💰', subtitle: 'How you hike' },
    { id: 'goals', title: 'Goals & Concerns', icon: '🎯', subtitle: 'Your why' },
  ];

  const months = [
    { value: 'january', label: 'January' },
    { value: 'february', label: 'February' },
    { value: 'march', label: 'March' },
    { value: 'april', label: 'April' },
    { value: 'may', label: 'May' },
    { value: 'june', label: 'June' },
  ];

  const directions = [
    { value: 'nobo', label: 'NOBO', desc: 'Georgia → Maine (Most Common)' },
    { value: 'sobo', label: 'SOBO', desc: 'Maine → Georgia' },
    { value: 'flip', label: 'Flip-Flop', desc: 'Start mid-trail, finish both ends' },
  ];

  const previousTrailOptions = [
    'Ouachita Trail',
    'Ozark Highlands Trail',
    'Pacific Crest Trail',
    'Continental Divide Trail',
    'Long Trail',
    'Colorado Trail',
    'John Muir Trail',
    'Other 100+ mile trail',
  ];

  const concernOptions = [
    { value: 'weather', label: 'Severe Weather', icon: '⛈️' },
    { value: 'injury', label: 'Injury/Health', icon: '🩹' },
    { value: 'bears', label: 'Wildlife/Bears', icon: '🐻' },
    { value: 'loneliness', label: 'Loneliness', icon: '😔' },
    { value: 'money', label: 'Running Out of Money', icon: '💸' },
    { value: 'gear', label: 'Gear Failures', icon: '🔧' },
    { value: 'navigation', label: 'Getting Lost', icon: '🧭' },
    { value: 'quitting', label: 'Wanting to Quit', icon: '🚪' },
    { value: 'fitness', label: 'Physical Fitness', icon: '🏃' },
    { value: 'time', label: 'Running Out of Time', icon: '⏰' },
  ];

  // Load from localStorage on mount
  $effect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guideGenerator');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          formData = { ...formData, ...parsed.formData };
          currentStep = parsed.currentStep || 0;
        } catch (e) {}
      }
    }
  });

  // Save to localStorage on changes
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guideGenerator', JSON.stringify({
        formData,
        currentStep,
      }));
    }
  });

  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    } else {
      showOutput = true;
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  function goToStep(index) {
    if (index <= currentStep) {
      currentStep = index;
    }
  }

  function startOver() {
    formData = {
      name: '',
      trailName: '',
      startMonth: 'march',
      startYear: '2026',
      direction: 'nobo',
      targetMonths: '5-6',
      firstThruHike: true,
      previousTrails: [],
      atExperience: 'none',
      highElevation: false,
      ageRange: '30-40',
      fitnessLevel: 'moderate',
      injuries: '',
      kneeAnkle: false,
      baseWeight: '20-25',
      packBrand: '',
      tentType: 'tent',
      sleepTemp: '20',
      shelterPreference: 'mix',
      totalBudget: '5000-7000',
      townStyle: 'mix',
      zeroFrequency: 'weekly',
      dailyMiles: '12-15',
      contentCreation: 'none',
      concerns: [],
      personalGoals: '',
    };
    currentStep = 0;
    showOutput = false;
    copied = false;
    localStorage.removeItem('guideGenerator');
  }

  function toggleConcern(value) {
    if (formData.concerns.includes(value)) {
      formData.concerns = formData.concerns.filter(c => c !== value);
    } else if (formData.concerns.length < 3) {
      formData.concerns = [...formData.concerns, value];
    }
  }

  function togglePreviousTrail(trail) {
    if (formData.previousTrails.includes(trail)) {
      formData.previousTrails = formData.previousTrails.filter(t => t !== trail);
    } else {
      formData.previousTrails = [...formData.previousTrails, trail];
    }
  }

  // Generate the prompt
  let generatedPrompt = $derived(() => {
    const d = formData;
    const directionFull = d.direction === 'nobo' ? 'Northbound (Georgia to Maine)' :
                          d.direction === 'sobo' ? 'Southbound (Maine to Georgia)' :
                          'Flip-Flop';

    const concernLabels = d.concerns.map(c =>
      concernOptions.find(opt => opt.value === c)?.label || c
    ).join(', ');

    const previousTrailsText = d.previousTrails.length > 0
      ? d.previousTrails.join(', ')
      : 'None';

    return `You are an expert Appalachian Trail thru-hiking guide creator. Create a comprehensive, personalized thru-hiking guide for the hiker profile below. Be specific, practical, and encouraging.

═══════════════════════════════════════════════════════════════
                    HIKER PROFILE
═══════════════════════════════════════════════════════════════

NAME: ${d.name || '[Not provided]'}${d.trailName ? ` (Trail Name: "${d.trailName}")` : ''}

TIMING & DIRECTION:
• Start: ${d.startMonth.charAt(0).toUpperCase() + d.startMonth.slice(1)} ${d.startYear}
• Direction: ${directionFull}
• Target Duration: ${d.targetMonths} months

EXPERIENCE LEVEL:
• First Thru-Hike: ${d.firstThruHike ? 'Yes' : 'No'}
• Previous Long Trails: ${previousTrailsText}
• Prior AT Experience: ${d.atExperience === 'none' ? 'None' : d.atExperience === 'sections' ? 'Some section hikes' : 'Significant experience'}
• High Elevation Experience: ${d.highElevation ? 'Yes (14ers or similar)' : 'Limited'}

PHYSICAL PROFILE:
• Age Range: ${d.ageRange}
• Fitness Level: ${d.fitnessLevel.charAt(0).toUpperCase() + d.fitnessLevel.slice(1)}
• Known Injuries/Limitations: ${d.injuries || 'None noted'}
• Knee/Ankle Concerns: ${d.kneeAnkle ? 'Yes - needs attention' : 'No'}

GEAR SETUP:
• Target Base Weight: ${d.baseWeight} lbs
• Pack: ${d.packBrand || 'Not specified'}
• Shelter Type: ${d.tentType === 'tent' ? 'Tent' : d.tentType === 'hammock' ? 'Hammock' : 'Tarp/Bivy'}
• Sleep System Rating: ${d.sleepTemp}°F
• Shelter vs Tent Preference: ${d.shelterPreference === 'tent' ? 'Prefer tent camping' : d.shelterPreference === 'shelter' ? 'Prefer AT shelters' : 'Mix of both'}

BUDGET & HIKING STYLE:
• Total Budget: $${d.totalBudget}
• Town Style: ${d.townStyle === 'budget' ? 'Budget-conscious (stealth camping, cheap resupply)' : d.townStyle === 'comfort' ? 'Comfort-focused (hostels, restaurants)' : 'Balanced mix'}
• Zero Days: ${d.zeroFrequency === 'rarely' ? 'Rarely (every 10-14 days)' : d.zeroFrequency === 'weekly' ? 'Weekly' : 'Frequently (every 4-5 days)'}
• Target Daily Miles: ${d.dailyMiles} miles

CONTENT CREATION:
• Plans: ${d.contentCreation === 'none' ? 'No content creation' : d.contentCreation === 'photos' ? 'Photos/social media' : d.contentCreation === 'video' ? 'Video/YouTube' : 'Blog/writing'}

TOP CONCERNS:
${concernLabels || 'None specified'}

PERSONAL GOALS:
${d.personalGoals || 'Complete the trail and have a transformative experience.'}

═══════════════════════════════════════════════════════════════
                    GUIDE REQUIREMENTS
═══════════════════════════════════════════════════════════════

Create a personalized guide with these sections:

1. **HIKER READINESS ASSESSMENT**
   - Evaluate their experience and fitness for their chosen start date
   - Identify strengths and areas needing preparation
   - Specific training recommendations for their timeline

2. **GEAR SYSTEM RECOMMENDATIONS**
   - Optimize for their base weight target and start season
   - Address their shelter preference with specific product suggestions
   - Sleep system appropriateness for their start month
   - Any gear concerns based on their physical profile

3. **CLOTHING SYSTEM**
   - Layering strategy for their start month and direction
   - Specific recommendations based on their timeline (what weather they'll encounter)

4. **RESUPPLY STRATEGY**
   - Town stop frequency matching their daily miles and zero schedule
   - Budget-appropriate resupply recommendations
   - Mail drop strategy (if beneficial for their style)

5. **PACE & MILEAGE PLAN**
   - Realistic daily mile expectations by section
   - Zero day schedule optimization
   - Key milestones and timeline for their target finish

6. **BUDGET BREAKDOWN**
   - Realistic cost estimate for their style
   - Money-saving tips specific to their town preferences
   - Emergency fund recommendations

7. **ADDRESSING YOUR CONCERNS**
   - Specific advice for each of their top concerns
   - Practical mitigation strategies
   - Mental preparation tips

8. **CRITICAL DATES & DEADLINES**
   - Permit requirements for their direction
   - Seasonal considerations (Smokies, Whites, Baxter)
   - Weather windows to be aware of

9. **FIRST WEEK DETAILED PLAN**
   - Day-by-day breakdown of their first 7 days
   - Realistic expectations for the adjustment period
   - Specific campsite/shelter recommendations

10. **PERSONALIZED TIPS**
    - Based on their specific profile, what unique advice applies
    - Common mistakes hikers with their profile make
    - What will likely be their biggest challenges and joys

═══════════════════════════════════════════════════════════════

Write in a supportive, experienced mentor tone. Be specific with numbers, dates, and product names where helpful. Acknowledge their concerns genuinely and provide practical solutions. The guide should feel personalized, not generic.

Format with clear headers, bullet points, and tables where appropriate. Aim for a comprehensive guide they can reference throughout their planning and hike.`;
  });

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = generatedPrompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  let progress = $derived(((currentStep + 1) / steps.length) * 100);
</script>

<div class="generator">
  <!-- Header -->
  <header class="gen-header">
    <div class="header-icon">📋</div>
    <div class="header-text">
      <h2 class="header-title">Personal Guide Generator</h2>
      <p class="header-subtitle">Answer a few questions, get a custom AT guide prompt for any AI</p>
    </div>
  </header>

  {#if !showOutput}
    <!-- Progress Trail -->
    <div class="progress-trail">
      <div class="trail-line">
        <div class="trail-fill" style="width: {progress}%"></div>
      </div>
      <div class="trail-blazes">
        {#each steps as step, i}
          <button
            class="blaze"
            class:completed={i < currentStep}
            class:active={i === currentStep}
            class:future={i > currentStep}
            onclick={() => goToStep(i)}
            disabled={i > currentStep}
            title={step.title}
          >
            <span class="blaze-icon">{i < currentStep ? '✓' : step.icon}</span>
            <span class="blaze-label">{step.title}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Step Content -->
    <div class="step-container">
      <div class="step-header">
        <span class="step-number">Step {currentStep + 1} of {steps.length}</span>
        <h3 class="step-title">{steps[currentStep].icon} {steps[currentStep].title}</h3>
        <p class="step-subtitle">{steps[currentStep].subtitle}</p>
      </div>

      <div class="step-content">
        <!-- Step 1: The Basics -->
        {#if currentStep === 0}
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input
              type="text"
              class="form-input"
              bind:value={formData.name}
              placeholder="What should we call you?"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Trail Name <span class="optional">(optional)</span></label>
            <input
              type="text"
              class="form-input"
              bind:value={formData.trailName}
              placeholder="Got one picked out?"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Month</label>
              <select class="form-select" bind:value={formData.startMonth}>
                {#each months as month}
                  <option value={month.value}>{month.label}</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Year</label>
              <select class="form-select" bind:value={formData.startYear}>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Direction</label>
            <div class="option-cards">
              {#each directions as dir}
                <button
                  class="option-card"
                  class:selected={formData.direction === dir.value}
                  onclick={() => formData.direction = dir.value}
                >
                  <span class="option-title">{dir.label}</span>
                  <span class="option-desc">{dir.desc}</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Target Duration</label>
            <select class="form-select" bind:value={formData.targetMonths}>
              <option value="4-5">4-5 months (Fast pace)</option>
              <option value="5-6">5-6 months (Average pace)</option>
              <option value="6-7">6-7 months (Relaxed pace)</option>
              <option value="7+">7+ months (Very relaxed)</option>
            </select>
          </div>

        <!-- Step 2: Experience -->
        {:else if currentStep === 1}
          <div class="form-group">
            <label class="form-label">Is this your first thru-hike?</label>
            <div class="toggle-row">
              <button
                class="toggle-btn"
                class:active={formData.firstThruHike}
                onclick={() => formData.firstThruHike = true}
              >Yes, first time!</button>
              <button
                class="toggle-btn"
                class:active={!formData.firstThruHike}
                onclick={() => formData.firstThruHike = false}
              >No, done one before</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Previous Long Trails <span class="optional">(select all that apply)</span></label>
            <div class="checkbox-grid">
              {#each previousTrailOptions as trail}
                <button
                  class="checkbox-btn"
                  class:checked={formData.previousTrails.includes(trail)}
                  onclick={() => togglePreviousTrail(trail)}
                >
                  <span class="check-icon">{formData.previousTrails.includes(trail) ? '✓' : ''}</span>
                  <span>{trail}</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Prior AT Experience</label>
            <select class="form-select" bind:value={formData.atExperience}>
              <option value="none">None - This will be my first AT miles</option>
              <option value="sections">Some section hikes (under 100 miles total)</option>
              <option value="significant">Significant (100+ miles on the AT)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">High Elevation Experience (14ers, etc.)?</label>
            <div class="toggle-row">
              <button
                class="toggle-btn"
                class:active={formData.highElevation}
                onclick={() => formData.highElevation = true}
              >Yes</button>
              <button
                class="toggle-btn"
                class:active={!formData.highElevation}
                onclick={() => formData.highElevation = false}
              >No / Limited</button>
            </div>
          </div>

        <!-- Step 3: Physical Profile -->
        {:else if currentStep === 2}
          <div class="form-group">
            <label class="form-label">Age Range</label>
            <select class="form-select" bind:value={formData.ageRange}>
              <option value="under-25">Under 25</option>
              <option value="25-35">25-35</option>
              <option value="35-45">35-45</option>
              <option value="45-55">45-55</option>
              <option value="55-65">55-65</option>
              <option value="65+">65+</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Current Fitness Level</label>
            <div class="option-cards vertical">
              <button
                class="option-card"
                class:selected={formData.fitnessLevel === 'beginner'}
                onclick={() => formData.fitnessLevel = 'beginner'}
              >
                <span class="option-title">Beginner</span>
                <span class="option-desc">Just starting to exercise regularly</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.fitnessLevel === 'moderate'}
                onclick={() => formData.fitnessLevel = 'moderate'}
              >
                <span class="option-title">Moderate</span>
                <span class="option-desc">Regular exercise, some hiking experience</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.fitnessLevel === 'athletic'}
                onclick={() => formData.fitnessLevel = 'athletic'}
              >
                <span class="option-title">Athletic</span>
                <span class="option-desc">Very active, experienced hiker</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Any injuries or physical limitations?</label>
            <textarea
              class="form-textarea"
              bind:value={formData.injuries}
              placeholder="E.g., old knee surgery, back issues, asthma..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Knee or Ankle Concerns?</label>
            <div class="toggle-row">
              <button
                class="toggle-btn"
                class:active={formData.kneeAnkle}
                onclick={() => formData.kneeAnkle = true}
              >Yes - Need to be careful</button>
              <button
                class="toggle-btn"
                class:active={!formData.kneeAnkle}
                onclick={() => formData.kneeAnkle = false}
              >No concerns</button>
            </div>
          </div>

        <!-- Step 4: Gear Setup -->
        {:else if currentStep === 3}
          <div class="form-group">
            <label class="form-label">Target Base Weight</label>
            <select class="form-select" bind:value={formData.baseWeight}>
              <option value="under-15">Under 15 lbs (Ultralight)</option>
              <option value="15-20">15-20 lbs (Lightweight)</option>
              <option value="20-25">20-25 lbs (Traditional)</option>
              <option value="25-30">25-30 lbs (Comfortable)</option>
              <option value="30+">30+ lbs (Heavy)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Pack Brand/Model <span class="optional">(optional)</span></label>
            <input
              type="text"
              class="form-input"
              bind:value={formData.packBrand}
              placeholder="E.g., Osprey Atmos 65, ULA Circuit..."
            />
          </div>

          <div class="form-group">
            <label class="form-label">Shelter Type</label>
            <div class="option-cards">
              <button
                class="option-card"
                class:selected={formData.tentType === 'tent'}
                onclick={() => formData.tentType = 'tent'}
              >
                <span class="option-title">⛺ Tent</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.tentType === 'hammock'}
                onclick={() => formData.tentType = 'hammock'}
              >
                <span class="option-title">🪢 Hammock</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.tentType === 'tarp'}
                onclick={() => formData.tentType = 'tarp'}
              >
                <span class="option-title">🏕️ Tarp/Bivy</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Sleep System Temp Rating</label>
            <select class="form-select" bind:value={formData.sleepTemp}>
              <option value="0">0°F or below (Winter-rated)</option>
              <option value="10">10°F</option>
              <option value="20">20°F (Most common for spring starts)</option>
              <option value="30">30°F</option>
              <option value="40">40°F (Summer only)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Shelter Preference on Trail</label>
            <div class="option-cards vertical">
              <button
                class="option-card"
                class:selected={formData.shelterPreference === 'tent'}
                onclick={() => formData.shelterPreference = 'tent'}
              >
                <span class="option-title">Prefer My Tent</span>
                <span class="option-desc">Privacy, flexibility, avoid crowds</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.shelterPreference === 'shelter'}
                onclick={() => formData.shelterPreference = 'shelter'}
              >
                <span class="option-title">Prefer AT Shelters</span>
                <span class="option-desc">Social, less setup, protect from weather</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.shelterPreference === 'mix'}
                onclick={() => formData.shelterPreference = 'mix'}
              >
                <span class="option-title">Mix of Both</span>
                <span class="option-desc">Flexible based on conditions</span>
              </button>
            </div>
          </div>

        <!-- Step 5: Budget & Style -->
        {:else if currentStep === 4}
          <div class="form-group">
            <label class="form-label">Total Budget (gear + trail)</label>
            <select class="form-select" bind:value={formData.totalBudget}>
              <option value="3000-5000">$3,000 - $5,000 (Shoestring)</option>
              <option value="5000-7000">$5,000 - $7,000 (Typical)</option>
              <option value="7000-10000">$7,000 - $10,000 (Comfortable)</option>
              <option value="10000+">$10,000+ (No worries)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Town Style</label>
            <div class="option-cards vertical">
              <button
                class="option-card"
                class:selected={formData.townStyle === 'budget'}
                onclick={() => formData.townStyle = 'budget'}
              >
                <span class="option-title">Budget-Conscious</span>
                <span class="option-desc">Stealth camp near towns, grocery resupply, minimal spending</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.townStyle === 'mix'}
                onclick={() => formData.townStyle = 'mix'}
              >
                <span class="option-title">Balanced</span>
                <span class="option-desc">Hostels sometimes, occasional restaurant meals</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.townStyle === 'comfort'}
                onclick={() => formData.townStyle = 'comfort'}
              >
                <span class="option-title">Comfort-Focused</span>
                <span class="option-desc">Hotels, restaurants, laundry services, trail magic</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Zero Day Frequency</label>
            <select class="form-select" bind:value={formData.zeroFrequency}>
              <option value="rarely">Rarely (Every 10-14 days)</option>
              <option value="weekly">Weekly (Every 5-7 days)</option>
              <option value="often">Often (Every 4-5 days)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Target Daily Miles</label>
            <select class="form-select" bind:value={formData.dailyMiles}>
              <option value="8-12">8-12 miles (Relaxed)</option>
              <option value="12-15">12-15 miles (Average)</option>
              <option value="15-20">15-20 miles (Aggressive)</option>
              <option value="20+">20+ miles (Very fast)</option>
            </select>
          </div>

        <!-- Step 6: Goals & Concerns -->
        {:else if currentStep === 5}
          <div class="form-group">
            <label class="form-label">Content Creation Plans</label>
            <div class="option-cards">
              <button
                class="option-card"
                class:selected={formData.contentCreation === 'none'}
                onclick={() => formData.contentCreation = 'none'}
              >
                <span class="option-title">📵 None</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.contentCreation === 'photos'}
                onclick={() => formData.contentCreation = 'photos'}
              >
                <span class="option-title">📸 Photos</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.contentCreation === 'video'}
                onclick={() => formData.contentCreation = 'video'}
              >
                <span class="option-title">🎬 Video</span>
              </button>
              <button
                class="option-card"
                class:selected={formData.contentCreation === 'blog'}
                onclick={() => formData.contentCreation = 'blog'}
              >
                <span class="option-title">✍️ Blog</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Top 3 Concerns <span class="count">({formData.concerns.length}/3)</span></label>
            <div class="concern-grid">
              {#each concernOptions as concern}
                <button
                  class="concern-btn"
                  class:selected={formData.concerns.includes(concern.value)}
                  onclick={() => toggleConcern(concern.value)}
                  disabled={formData.concerns.length >= 3 && !formData.concerns.includes(concern.value)}
                >
                  <span class="concern-icon">{concern.icon}</span>
                  <span class="concern-label">{concern.label}</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Personal Goals <span class="optional">(What do you want from this hike?)</span></label>
            <textarea
              class="form-textarea"
              bind:value={formData.personalGoals}
              placeholder="E.g., Challenge myself, disconnect from work, meet new people, personal growth, prove I can do hard things..."
              rows="4"
            ></textarea>
          </div>
        {/if}
      </div>

      <!-- Navigation -->
      <div class="step-nav">
        {#if currentStep > 0}
          <button class="nav-btn prev" onclick={prevStep}>
            ← Back
          </button>
        {:else}
          <div></div>
        {/if}

        <button class="nav-btn next" onclick={nextStep}>
          {currentStep === steps.length - 1 ? 'Generate Guide Prompt →' : 'Continue →'}
        </button>
      </div>
    </div>

  {:else}
    <!-- Output Section -->
    <div class="output-section">
      <div class="output-header">
        <div class="output-icon">✨</div>
        <h3 class="output-title">Your Custom Guide Prompt</h3>
        <p class="output-desc">Copy this prompt and paste it into ChatGPT, Claude, or any AI assistant to generate your personalized AT thru-hiking guide.</p>
      </div>

      <div class="prompt-container">
        <pre class="prompt-text">{generatedPrompt}</pre>
      </div>

      <div class="output-actions">
        <button class="copy-btn" class:copied onclick={copyPrompt}>
          {#if copied}
            <span class="copy-icon">✓</span>
            <span>Copied!</span>
          {:else}
            <span class="copy-icon">📋</span>
            <span>Copy to Clipboard</span>
          {/if}
        </button>

        <button class="start-over-btn" onclick={startOver}>
          ↺ Start Over
        </button>
      </div>

      <div class="tips-card">
        <h4 class="tips-title">💡 Tips for Best Results</h4>
        <ul class="tips-list">
          <li>Use <strong>Claude</strong> or <strong>ChatGPT-4</strong> for most detailed responses</li>
          <li>Ask follow-up questions to dive deeper on specific sections</li>
          <li>Request updates as your plans change</li>
          <li>Compare advice with official ATC resources and recent hiker reports</li>
        </ul>
      </div>

      <button class="edit-btn" onclick={() => showOutput = false}>
        ← Edit Your Answers
      </button>
    </div>
  {/if}
</div>

<style>
  .generator {
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,242,232,0.95));
    border: 2px solid var(--pine, #4d594a);
    border-radius: 16px;
    overflow: hidden;
    box-shadow:
      0 4px 20px rgba(0,0,0,0.1),
      inset 0 1px 0 rgba(255,255,255,0.5);
  }

  /* Header */
  .gen-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, var(--pine, #4d594a), #3a4438);
    color: #fff;
  }

  .header-icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.02em;
  }

  .header-subtitle {
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
    opacity: 0.85;
  }

  /* Progress Trail */
  .progress-trail {
    padding: 1.5rem;
    background: rgba(166, 181, 137, 0.1);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .trail-line {
    height: 6px;
    background: var(--stone, #ccc);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .trail-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine, #a6b589), var(--pine, #4d594a));
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .trail-blazes {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .blaze {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .blaze:disabled {
    cursor: default;
  }

  .blaze-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--stone, #ccc);
    border: 2px solid var(--stone, #ccc);
    border-radius: 50%;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .blaze.completed .blaze-icon {
    background: var(--alpine, #a6b589);
    border-color: var(--pine, #4d594a);
    color: var(--pine, #4d594a);
  }

  .blaze.active .blaze-icon {
    background: var(--marker, #f0e000);
    border-color: var(--pine, #4d594a);
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .blaze.future .blaze-icon {
    opacity: 0.5;
  }

  .blaze-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted, #5c665a);
    text-align: center;
    line-height: 1.2;
  }

  .blaze.active .blaze-label {
    color: var(--pine, #4d594a);
  }

  @media (max-width: 600px) {
    .blaze-label {
      display: none;
    }
    .blaze-icon {
      width: 32px;
      height: 32px;
      font-size: 0.9rem;
    }
  }

  /* Step Container */
  .step-container {
    padding: 1.5rem;
  }

  .step-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed var(--border, #e6e1d4);
  }

  .step-number {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--terra, #d97706);
  }

  .step-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink, #1f2937);
    margin: 0.5rem 0 0.25rem;
  }

  .step-subtitle {
    font-family: Caveat, cursive;
    font-size: 1.1rem;
    color: var(--muted, #5c665a);
    margin: 0;
  }

  /* Form Elements */
  .step-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .form-label .optional {
    font-family: Lato, sans-serif;
    font-weight: 400;
    font-size: 0.75rem;
    text-transform: none;
    letter-spacing: normal;
    color: var(--muted, #5c665a);
  }

  .form-label .count {
    font-family: Lato, sans-serif;
    font-weight: 400;
    font-size: 0.8rem;
    text-transform: none;
    letter-spacing: normal;
    color: var(--terra, #d97706);
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-family: inherit;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
    box-shadow: 0 0 0 3px rgba(166, 181, 137, 0.2);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  /* Option Cards */
  .option-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .option-cards.vertical {
    grid-template-columns: 1fr;
  }

  .option-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.875rem 1rem;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .option-card:hover {
    border-color: var(--alpine, #a6b589);
    transform: translateY(-1px);
  }

  .option-card.selected {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15), rgba(166, 181, 137, 0.05));
    border-color: var(--pine, #4d594a);
    box-shadow: 0 2px 8px rgba(77, 89, 74, 0.15);
  }

  .option-title {
    font-weight: 700;
    color: var(--ink, #1f2937);
    font-size: 0.95rem;
  }

  .option-desc {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    line-height: 1.3;
  }

  /* Toggle Buttons */
  .toggle-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .toggle-btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    border-color: var(--alpine, #a6b589);
  }

  .toggle-btn.active {
    background: var(--pine, #4d594a);
    border-color: var(--pine, #4d594a);
    color: #fff;
  }

  /* Checkbox Grid */
  .checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.5rem;
  }

  .checkbox-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    text-align: left;
    transition: all 0.15s ease;
  }

  .checkbox-btn:hover {
    border-color: var(--alpine, #a6b589);
  }

  .checkbox-btn.checked {
    background: rgba(166, 181, 137, 0.15);
    border-color: var(--pine, #4d594a);
  }

  .check-icon {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border, #e6e1d4);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    flex-shrink: 0;
  }

  .checkbox-btn.checked .check-icon {
    background: var(--alpine, #a6b589);
  }

  /* Concern Grid */
  .concern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.6rem;
  }

  .concern-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.75rem 0.5rem;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .concern-btn:hover:not(:disabled) {
    border-color: var(--alpine, #a6b589);
    transform: translateY(-2px);
  }

  .concern-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .concern-btn.selected {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(217, 119, 6, 0.05));
    border-color: var(--terra, #d97706);
    box-shadow: 0 2px 8px rgba(217, 119, 6, 0.15);
  }

  .concern-icon {
    font-size: 1.5rem;
  }

  .concern-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
    color: var(--ink, #1f2937);
    line-height: 1.2;
  }

  /* Navigation */
  .step-nav {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #e6e1d4);
  }

  .nav-btn {
    padding: 0.875rem 1.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-btn.prev {
    background: transparent;
    border: 2px solid var(--border, #e6e1d4);
    color: var(--muted, #5c665a);
  }

  .nav-btn.prev:hover {
    border-color: var(--pine, #4d594a);
    color: var(--pine, #4d594a);
  }

  .nav-btn.next {
    background: linear-gradient(135deg, var(--pine, #4d594a), #3a4438);
    border: 2px solid var(--pine, #4d594a);
    color: #fff;
    flex: 1;
    max-width: 280px;
  }

  .nav-btn.next:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(77, 89, 74, 0.3);
  }

  /* Output Section */
  .output-section {
    padding: 1.5rem;
  }

  .output-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .output-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .output-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    margin: 0;
  }

  .output-desc {
    font-size: 0.95rem;
    color: var(--muted, #5c665a);
    margin: 0.5rem 0 0;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .prompt-container {
    background: #1e1e1e;
    border: 2px solid var(--pine, #4d594a);
    border-radius: 12px;
    padding: 1.25rem;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
  }

  .prompt-text {
    font-family: 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    color: #e0e0e0;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }

  .output-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, var(--pine, #4d594a), #3a4438);
    border: 2px solid var(--pine, #4d594a);
    border-radius: 10px;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(77, 89, 74, 0.3);
  }

  .copy-btn.copied {
    background: linear-gradient(135deg, var(--alpine, #a6b589), #8fa574);
    border-color: var(--alpine, #a6b589);
  }

  .copy-icon {
    font-size: 1.2rem;
  }

  .start-over-btn {
    padding: 1rem 1.5rem;
    background: transparent;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 10px;
    color: var(--muted, #5c665a);
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .start-over-btn:hover {
    border-color: var(--terra, #d97706);
    color: var(--terra, #d97706);
  }

  .tips-card {
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.1), rgba(240, 224, 0, 0.05));
    border: 2px solid var(--marker, #f0e000);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .tips-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink, #1f2937);
    margin: 0 0 0.75rem;
  }

  .tips-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.9rem;
    color: var(--fg, #333);
    line-height: 1.6;
  }

  .tips-list li {
    margin-bottom: 0.35rem;
  }

  .edit-btn {
    display: block;
    width: 100%;
    padding: 0.875rem;
    background: transparent;
    border: 1px dashed var(--border, #e6e1d4);
    border-radius: 8px;
    color: var(--muted, #5c665a);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn:hover {
    border-color: var(--pine, #4d594a);
    color: var(--pine, #4d594a);
  }

  /* Mobile Optimizations */
  @media (max-width: 600px) {
    .gen-header {
      padding: 1.25rem;
    }

    .header-title {
      font-size: 1.25rem;
    }

    .progress-trail {
      padding: 1rem;
    }

    .step-container {
      padding: 1.25rem;
    }

    .step-title {
      font-size: 1.3rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .toggle-row {
      grid-template-columns: 1fr;
    }

    .checkbox-grid {
      grid-template-columns: 1fr;
    }

    .concern-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .output-actions {
      flex-direction: column;
    }

    .copy-btn,
    .start-over-btn {
      width: 100%;
      justify-content: center;
    }

    .prompt-container {
      max-height: 300px;
    }

    .prompt-text {
      font-size: 0.7rem;
    }
  }
</style>
