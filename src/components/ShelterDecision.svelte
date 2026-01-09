<script>
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';

  let { trailContext = {} } = $props();

  // Shelter triggers - any ONE means shelter
  let triggers = $state({
    windCold: false,
    freezingPrecip: false,
    badGround: false,
    wetCantDry: false,
    exhausted: false,
  });

  // Tent site scoring (0-2 each, total 10)
  let scores = $state({
    windProtection: 2,
    groundQuality: 2,
    moistureRisk: 2,
    setupControl: 2,
    overnightConfidence: 2,
  });

  // Quick decision prompts
  let quickChecks = $state({
    amIDry: true,
    windDecreasing: true,
    canPitchCleanly: true,
    warmAt3am: true,
  });

  let activeSection = $state('quick');

  let hasTrigger = $derived(Object.values(triggers).some(t => t));
  let totalScore = $derived(Object.values(scores).reduce((a, b) => a + b, 0));
  let quickCheckPasses = $derived(Object.values(quickChecks).every(c => c));

  let recommendation = $derived.by(() => {
    if (hasTrigger) {
      return {
        decision: 'shelter',
        reason: 'Shelter trigger activated',
        confidence: 'high',
        urgent: triggers.freezingPrecip || triggers.wetCantDry,
      };
    }

    if (totalScore >= 7) {
      return {
        decision: 'tent',
        reason: `Strong tent conditions (${totalScore}/10)`,
        confidence: 'high',
        urgent: false,
      };
    }

    if (totalScore >= 4) {
      return {
        decision: 'tent',
        reason: `Marginal conditions (${totalScore}/10) - only if weather stable`,
        confidence: 'medium',
        urgent: false,
      };
    }

    return {
      decision: 'shelter',
      reason: `Poor tent conditions (${totalScore}/10)`,
      confidence: 'high',
      urgent: false,
    };
  });

  const triggerInfo = {
    windCold: {
      name: 'Wind + Cold',
      desc: 'Temps below 25°F with wind 15+ mph sustained or 20+ gusts',
      icon: '🌬️',
      details: ['Exposed ridge or saddle', 'Feeling cold before stopping'],
    },
    freezingPrecip: {
      name: 'Freezing Precip',
      desc: 'Freezing rain or heavy wet snow',
      icon: '🧊',
      details: ['Automatic shelter night', 'No debate needed'],
      critical: true,
    },
    badGround: {
      name: 'Bad Ground',
      desc: 'Ground conditions you cannot mitigate',
      icon: '🪨',
      details: ['Solid ice', 'Snow too deep to anchor', 'No flat/drained sites'],
    },
    wetCantDry: {
      name: 'Wet & Can\'t Dry',
      desc: 'Wet and can\'t get dry before dark',
      icon: '💦',
      details: ['Damp clothing', 'Temps dropping', 'No sun left', 'Hands losing dexterity'],
      critical: true,
    },
    exhausted: {
      name: 'Exhaustion',
      desc: 'Mental or physical exhaustion',
      icon: '😵',
      details: ['Foggy thinking', 'Irritation during setup', 'Skipping food/water steps'],
    },
  };

  const scoreInfo = {
    windProtection: {
      name: 'Wind Protection',
      levels: ['Exposed, funneling', 'Partial protection', 'Fully protected'],
    },
    groundQuality: {
      name: 'Ground Quality',
      levels: ['Ice / unusable', 'Minor issues', 'Flat, drains well'],
    },
    moistureRisk: {
      name: 'Moisture Risk',
      levels: ['Freezing precip', 'Damp but ok', 'Dry & stable'],
    },
    setupControl: {
      name: 'Setup Control',
      levels: ['Hands failing', 'Minor fumbling', 'Calm & deliberate'],
    },
    overnightConfidence: {
      name: '3am Confidence',
      levels: ['Hoping it holds', 'Thin margin', 'Yes, confidently'],
      question: 'Will this work if conditions worsen at 3am?',
    },
  };

  const notTriggers = [
    'Cold but dry and calm',
    'Tired but functional',
    'Others staying there',
    'Want convenience',
  ];

  function resetAll() {
    triggers = { windCold: false, freezingPrecip: false, badGround: false, wetCantDry: false, exhausted: false };
    scores = { windProtection: 2, groundQuality: 2, moistureRisk: 2, setupControl: 2, overnightConfidence: 2 };
    quickChecks = { amIDry: true, windDecreasing: true, canPitchCleanly: true, warmAt3am: true };
  }
</script>

<div class="shelter-decision">
  <!-- Hero Decision Header -->
  <header class="decision-hero" class:shelter={recommendation.decision === 'shelter'} class:urgent={recommendation.urgent}>
    <div class="hero-bg">
      <div class="bg-pattern"></div>
    </div>
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-icon">🛡️</span>
        <span class="badge-text">DECISION ENGINE</span>
      </div>
      <h2 class="hero-title">Shelter Decision</h2>

      <div class="decision-display">
        <div class="option tent" class:active={recommendation.decision === 'tent'}>
          <span class="option-icon">🏕️</span>
          <span class="option-label">TENT</span>
        </div>
        <div class="decision-indicator" class:shelter={recommendation.decision === 'shelter'}>
          <span class="indicator-arrow">{recommendation.decision === 'tent' ? '←' : '→'}</span>
        </div>
        <div class="option shelter" class:active={recommendation.decision === 'shelter'}>
          <span class="option-icon">🏠</span>
          <span class="option-label">SHELTER</span>
        </div>
      </div>

      <div class="decision-reason">
        <span class="reason-text">{recommendation.reason}</span>
        {#if recommendation.urgent}
          <span class="urgent-badge">⚠️ URGENT</span>
        {/if}
      </div>
    </div>
  </header>

  <!-- Navigation -->
  <nav class="decision-nav">
    <button class="nav-btn" class:active={activeSection === 'quick'} onclick={() => activeSection = 'quick'}>
      <span class="nav-icon">⚡</span>
      <span class="nav-label">Quick</span>
    </button>
    <button class="nav-btn" class:active={activeSection === 'protocol'} onclick={() => activeSection = 'protocol'}>
      <span class="nav-icon">📋</span>
      <span class="nav-label">Protocol</span>
    </button>
    <button class="nav-btn" class:active={activeSection === 'triggers'} class:warning={hasTrigger} onclick={() => activeSection = 'triggers'}>
      <span class="nav-icon">{hasTrigger ? '⚠️' : '🎯'}</span>
      <span class="nav-label">Triggers</span>
      {#if hasTrigger}<span class="nav-dot"></span>{/if}
    </button>
    <button class="nav-btn" class:active={activeSection === 'scoring'} onclick={() => activeSection = 'scoring'}>
      <span class="nav-icon">📊</span>
      <span class="nav-label">Score</span>
    </button>
  </nav>

  <!-- Triggers Section -->
  {#if activeSection === 'triggers'}
    <section class="content-section" transition:fade>
      <div class="section-header">
        <div class="header-info">
          <h3 class="section-title">Shelter Triggers</h3>
          <p class="section-hint">Any ONE of these = go to shelter</p>
        </div>
        <div class="trigger-counter" class:active={hasTrigger}>
          <span class="counter-num">{Object.values(triggers).filter(t => t).length}</span>
          <span class="counter-label">active</span>
        </div>
      </div>

      <div class="triggers-grid">
        {#each Object.entries(triggers) as [key, value]}
          {@const info = triggerInfo[key]}
          <button class="trigger-card" class:active={value} class:critical={info.critical && value} onclick={() => triggers[key] = !triggers[key]}>
            <div class="trigger-visual">
              <span class="trigger-icon">{info.icon}</span>
              <div class="trigger-check" class:checked={value}>
                {#if value}✓{/if}
              </div>
            </div>
            <div class="trigger-info">
              <span class="trigger-name">{info.name}</span>
              <span class="trigger-desc">{info.desc}</span>
            </div>
            {#if value}
              <ul class="trigger-details" transition:slide>
                {#each info.details as detail}
                  <li>{detail}</li>
                {/each}
              </ul>
            {/if}
          </button>
        {/each}
      </div>

      <div class="not-triggers-panel">
        <h4 class="panel-title">❌ NOT Shelter Triggers</h4>
        <div class="not-tags">
          {#each notTriggers as item}
            <span class="not-tag">{item}</span>
          {/each}
        </div>
        <p class="panel-note">Tent handles these fine.</p>
      </div>
    </section>
  {/if}

  <!-- Scoring Section -->
  {#if activeSection === 'scoring'}
    <section class="content-section" transition:fade>
      <div class="section-header">
        <div class="header-info">
          <h3 class="section-title">Tent Site Scoring</h3>
          <p class="section-hint">Score each category 0-2</p>
        </div>
        <div class="score-hero" class:good={totalScore >= 7} class:marginal={totalScore >= 4 && totalScore < 7} class:bad={totalScore < 4}>
          <span class="score-value">{totalScore}</span>
          <span class="score-max">/10</span>
        </div>
      </div>

      <div class="score-legend">
        <span class="legend-item good">7-10: Tent OK</span>
        <span class="legend-item marginal">4-6: Weather stable only</span>
        <span class="legend-item bad">0-3: Shelter</span>
      </div>

      <div class="scoring-list">
        {#each Object.entries(scores) as [key, value]}
          {@const info = scoreInfo[key]}
          <div class="score-row">
            <div class="row-header">
              <span class="row-name">{info.name}</span>
              <span class="row-value" class:bad={value === 0} class:marginal={value === 1} class:good={value === 2}>{value}</span>
            </div>
            {#if info.question}
              <p class="row-question">"{info.question}"</p>
            {/if}
            <div class="score-options">
              {#each [0, 1, 2] as level}
                <button
                  class="option-btn"
                  class:active={value === level}
                  class:bad={level === 0}
                  class:marginal={level === 1}
                  class:good={level === 2}
                  onclick={() => scores[key] = level}
                >
                  <span class="opt-num">{level}</span>
                  <span class="opt-text">{info.levels[level]}</span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="hope-banner">
        <span class="hope-icon">⚠️</span>
        <span class="hope-text">Hope is not a winter strategy.</span>
      </div>
    </section>
  {/if}

  <!-- Quick Check Section -->
  {#if activeSection === 'quick'}
    <section class="content-section" transition:fade>
      <div class="section-header">
        <div class="header-info">
          <h3 class="section-title">One-Minute Decision</h3>
          <p class="section-hint">Before committing to camp:</p>
        </div>
      </div>

      <div class="quick-grid">
        {#each [
          { key: 'amIDry', q: 'Am I dry right now?' },
          { key: 'windDecreasing', q: 'Is wind stable or decreasing?' },
          { key: 'canPitchCleanly', q: 'Can I pitch without rushing?' },
          { key: 'warmAt3am', q: 'Will this keep me warm at 3am?' }
        ] as item}
          <button class="quick-btn" class:yes={quickChecks[item.key]} onclick={() => quickChecks[item.key] = !quickChecks[item.key]}>
            <div class="quick-indicator" class:pass={quickChecks[item.key]}>
              {quickChecks[item.key] ? '✓' : '✗'}
            </div>
            <span class="quick-question">{item.q}</span>
          </button>
        {/each}
      </div>

      <div class="quick-verdict" class:pass={quickCheckPasses}>
        <span class="verdict-icon">{quickCheckPasses ? '✓' : '→'}</span>
        <span class="verdict-text">
          {#if quickCheckPasses}
            All checks pass — tent is acceptable
          {:else}
            If any answer feels shaky, shelter is the correct call
          {/if}
        </span>
      </div>
    </section>
  {/if}

  <!-- Protocol Section -->
  {#if activeSection === 'protocol'}
    <section class="content-section" transition:fade>
      <div class="section-header">
        <div class="header-info">
          <h3 class="section-title">Shelter Night Protocol</h3>
          <p class="section-hint">When you choose shelter, switch modes:</p>
        </div>
      </div>

      <div class="protocol-flow">
        <div class="protocol-step">
          <div class="step-marker">1</div>
          <div class="step-content">
            <h4 class="step-title">📍 Arrival</h4>
            <ul class="step-list">
              <li>Scan for mice</li>
              <li>Choose spot away from walls/corners</li>
              <li>Identify food hang or bear box</li>
            </ul>
          </div>
        </div>

        <div class="protocol-step critical">
          <div class="step-marker">2</div>
          <div class="step-content">
            <h4 class="step-title">🔒 Food Lockdown (FIRST)</h4>
            <ul class="step-list">
              <li>Food, trash, toothpaste, lip balm — all together</li>
              <li>Hang or box immediately</li>
              <li>Nothing scented touches floor</li>
              <li>Pack stays closed</li>
            </ul>
          </div>
        </div>

        <div class="protocol-step">
          <div class="step-marker">3</div>
          <div class="step-content">
            <h4 class="step-title">🎒 Gear Control</h4>
            <div class="gear-split">
              <div class="gear-keep">
                <span class="gear-label">✓ Keep with you:</span>
                <span>Headlamp, Phone, Filter, Bank, Water</span>
              </div>
              <div class="gear-secure">
                <span class="gear-label">✗ Never loose:</span>
                <span>Gloves, Socks, Pole handles</span>
              </div>
            </div>
          </div>
        </div>

        <div class="protocol-step">
          <div class="step-marker">4</div>
          <div class="step-content">
            <h4 class="step-title">🌙 Night Rules</h4>
            <ul class="step-list">
              <li>No food after final hang</li>
              <li>Ignore mice unless contacting gear</li>
              <li>Shoes upright, not flat</li>
            </ul>
          </div>
        </div>

        <div class="protocol-step">
          <div class="step-marker">5</div>
          <div class="step-content">
            <h4 class="step-title">☀️ Morning Exit</h4>
            <ol class="step-list numbered">
              <li>Pack sleep system first</li>
              <li>Pack all non-food gear</li>
              <li>Retrieve food last</li>
              <li>Eat outside if possible</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  {/if}

  <!-- Philosophy Card -->
  <div class="philosophy-panel">
    <h4 class="philosophy-title">Core Philosophy</h4>
    <div class="philosophy-items">
      <div class="phil-item">
        <span class="phil-icon">🏕️</span>
        <span class="phil-text">Tent is the default</span>
      </div>
      <div class="phil-item">
        <span class="phil-icon">🛡️</span>
        <span class="phil-text">Shelters are safety, not comfort</span>
      </div>
      <div class="phil-item">
        <span class="phil-icon">📊</span>
        <span class="phil-text">Use objective triggers, not mood</span>
      </div>
      <div class="phil-item warning">
        <span class="phil-icon">🐭</span>
        <span class="phil-text">Poor sleep + mice = accepted cost when risk is high</span>
      </div>
    </div>
  </div>

  <!-- Reset Button -->
  <button class="reset-btn" onclick={resetAll}>
    <span class="reset-icon">↺</span>
    <span class="reset-text">Reset All</span>
  </button>

  <!-- Guide Links -->
  <div class="guide-links">
    <a href="/guide/08-shelter-vs-tent-decision-system" class="guide-link chapter-link">
      <span class="link-icon">📚</span>
      <span class="link-text">Full Shelter vs. Tent Guide</span>
      <span class="link-arrow">→</span>
    </a>
    <a href="/guide#08-shelter-vs-tent-decision-system" class="guide-link field-guide-link">
      <span class="link-icon">📖</span>
      <span class="link-text">Field Guide</span>
      <span class="link-arrow">→</span>
    </a>
  </div>
</div>

<style>
  .shelter-decision {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Hero Decision Header */
  .decision-hero {
    position: relative;
    border-radius: 20px;
    padding: 2rem 1.5rem;
    margin-bottom: 1rem;
    overflow: hidden;
    background: linear-gradient(145deg, #2d5a3d 0%, #1a3a25 100%);
    color: #fff;
    transition: all 0.4s ease;
  }

  .decision-hero.shelter {
    background: linear-gradient(145deg, #8b4513 0%, #5d2f0d 100%);
  }

  .decision-hero.urgent {
    animation: urgentPulse 1.5s ease-in-out infinite;
  }

  @keyframes urgentPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    50% { box-shadow: 0 0 30px 8px rgba(239, 68, 68, 0.4); }
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    opacity: 0.1;
  }

  .bg-pattern {
    position: absolute;
    inset: -50%;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(255,255,255,0.1) 20px,
      rgba(255,255,255,0.1) 40px
    );
    animation: patternMove 20s linear infinite;
  }

  @keyframes patternMove {
    from { transform: translate(0, 0); }
    to { transform: translate(40px, 40px); }
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.15);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    margin-bottom: 0.75rem;
  }

  .badge-icon { font-size: 0.9rem; }

  .badge-text {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  .hero-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Decision Display */
  .decision-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  .option.active {
    opacity: 1;
    background: rgba(255,255,255,0.25);
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }

  .option-icon { font-size: 2rem; }

  .option-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .decision-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .indicator-arrow {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .decision-reason {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .reason-text {
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .urgent-badge {
    padding: 0.3rem 0.6rem;
    background: #ef4444;
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    animation: blink 0.5s ease-in-out infinite alternate;
  }

  @keyframes blink {
    from { opacity: 1; }
    to { opacity: 0.6; }
  }

  /* Navigation */
  .decision-nav {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
  }

  .nav-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.7rem 0.5rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-btn:hover {
    border-color: var(--alpine);
  }

  .nav-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .nav-btn.warning {
    border-color: #ef4444;
  }

  .nav-btn.warning.active {
    background: #ef4444;
    border-color: #ef4444;
  }

  .nav-icon { font-size: 1.15rem; }

  .nav-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
  }

  .nav-btn.active .nav-label { color: #fff; }

  .nav-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
  }

  /* Content Section */
  .content-section {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 18px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    gap: 1rem;
  }

  .section-title {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    text-transform: uppercase;
    color: var(--ink);
  }

  .section-hint {
    font-size: 0.85rem;
    color: var(--muted);
    margin: 0.25rem 0 0;
  }

  /* Trigger Counter */
  .trigger-counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border-radius: 10px;
    min-width: 50px;
  }

  .trigger-counter.active {
    background: rgba(239, 68, 68, 0.15);
    border: 2px solid #ef4444;
  }

  .counter-num {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--muted);
    line-height: 1;
  }

  .trigger-counter.active .counter-num { color: #ef4444; }

  .counter-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* Triggers Grid */
  .triggers-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .trigger-card {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .trigger-card:hover {
    border-color: var(--alpine);
  }

  .trigger-card.active {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
    border-color: #ef4444;
  }

  .trigger-card.critical {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
  }

  .trigger-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .trigger-icon {
    font-size: 2rem;
  }

  .trigger-check {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 6px;
    font-weight: bold;
    font-size: 0.9rem;
    color: #fff;
    transition: all 0.2s ease;
  }

  .trigger-check.checked {
    background: #ef4444;
    border-color: #ef4444;
  }

  .trigger-info {
    flex: 1;
    min-width: 150px;
  }

  .trigger-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .trigger-desc {
    display: block;
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.2rem;
  }

  .trigger-details {
    width: 100%;
    margin: 0.75rem 0 0;
    padding-left: 1rem;
    font-size: 0.85rem;
    color: #ef4444;
    list-style: disc;
  }

  .trigger-details li { margin-bottom: 0.2rem; }

  /* Not Triggers Panel */
  .not-triggers-panel {
    padding: 1rem 1.25rem;
    background: var(--bg);
    border-radius: 12px;
  }

  .panel-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    color: var(--muted);
  }

  .not-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .not-tag {
    padding: 0.4rem 0.8rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .panel-note {
    font-size: 0.85rem;
    color: var(--pine);
    font-weight: 600;
    margin: 0;
  }

  /* Scoring Section */
  .score-hero {
    display: flex;
    align-items: baseline;
    gap: 0.15rem;
    padding: 0.6rem 1rem;
    background: var(--bg);
    border-radius: 12px;
    border: 3px solid var(--alpine);
  }

  .score-hero.good { border-color: #22c55e; }
  .score-hero.marginal { border-color: #fbbf24; }
  .score-hero.bad { border-color: #ef4444; }

  .score-value {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: var(--ink);
  }

  .score-hero.good .score-value { color: #22c55e; }
  .score-hero.marginal .score-value { color: #b45309; }
  .score-hero.bad .score-value { color: #ef4444; }

  .score-max {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--muted);
  }

  .score-legend {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }

  .legend-item {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
  }

  .legend-item.good { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  .legend-item.marginal { background: rgba(251, 191, 36, 0.15); color: #b45309; }
  .legend-item.bad { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

  .scoring-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .score-row {
    padding: 1rem;
    background: var(--bg);
    border-radius: 12px;
  }

  .row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .row-name {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--ink);
  }

  .row-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .row-value.good { color: #22c55e; }
  .row-value.marginal { color: #fbbf24; }
  .row-value.bad { color: #ef4444; }

  .row-question {
    font-size: 0.8rem;
    font-style: italic;
    color: var(--muted);
    margin: 0 0 0.5rem;
  }

  .score-options {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .option-btn:hover { border-color: var(--alpine); }

  .option-btn.active.good { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
  .option-btn.active.marginal { background: rgba(251, 191, 36, 0.1); border-color: #fbbf24; }
  .option-btn.active.bad { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }

  .opt-num {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    min-width: 20px;
  }

  .option-btn.good .opt-num { color: #22c55e; }
  .option-btn.marginal .opt-num { color: #b45309; }
  .option-btn.bad .opt-num { color: #ef4444; }

  .opt-text {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .option-btn.active .opt-text { color: var(--ink); }

  .hope-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.25rem;
    padding: 0.85rem;
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
    border-radius: 10px;
  }

  .hope-icon { font-size: 1.25rem; }

  .hope-text {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #ef4444;
    text-transform: uppercase;
  }

  /* Quick Check Section */
  .quick-grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.25rem;
  }

  .quick-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(239, 68, 68, 0.08);
    border: 2px solid #ef4444;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .quick-btn.yes {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
  }

  .quick-indicator {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.15);
    border-radius: 50%;
    font-size: 1.25rem;
    font-weight: bold;
    color: #ef4444;
    transition: all 0.2s ease;
  }

  .quick-indicator.pass {
    background: rgba(34, 197, 94, 0.2);
    color: #16a34a;
  }

  .quick-question {
    font-size: 1rem;
    font-weight: 500;
    color: var(--ink);
  }

  .quick-verdict {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
    border-radius: 12px;
  }

  .quick-verdict.pass {
    background: rgba(34, 197, 94, 0.1);
    border-color: #22c55e;
  }

  .verdict-icon {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ef4444;
  }

  .quick-verdict.pass .verdict-icon { color: #16a34a; }

  .verdict-text {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  /* Protocol Flow */
  .protocol-flow {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .protocol-step {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg);
    border-radius: 12px;
    border-left: 4px solid var(--alpine);
  }

  .protocol-step.critical {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  .step-marker {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--alpine);
    color: #fff;
    border-radius: 50%;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .protocol-step.critical .step-marker { background: #ef4444; }

  .step-content { flex: 1; }

  .step-title {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
    color: var(--ink);
  }

  .step-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .step-list li { margin-bottom: 0.25rem; }

  .step-list.numbered { list-style-type: decimal; }

  .gear-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .gear-keep, .gear-secure {
    padding: 0.6rem;
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .gear-keep { background: rgba(34, 197, 94, 0.1); }
  .gear-secure { background: rgba(239, 68, 68, 0.1); }

  .gear-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .gear-keep .gear-label { color: #16a34a; }
  .gear-secure .gear-label { color: #ef4444; }

  /* Philosophy Panel */
  .philosophy-panel {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .philosophy-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    color: var(--ink);
  }

  .philosophy-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .phil-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .phil-item.warning {
    background: rgba(251, 191, 36, 0.1);
    grid-column: span 2;
  }

  .phil-icon { font-size: 1rem; }
  .phil-text { color: var(--ink); }

  /* Reset Button */
  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.85rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 1rem;
  }

  .reset-btn:hover {
    border-color: var(--alpine);
    background: #fff;
  }

  .reset-icon {
    font-size: 1.1rem;
    color: var(--muted);
  }

  .reset-text {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* Guide Links */
  .guide-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 200px;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .field-guide-link {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .link-icon { font-size: 1.25rem; }

  .link-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .link-arrow { transform: translateX(4px); }

  /* Responsive */
  @media (max-width: 640px) {
    .decision-display { flex-direction: row; gap: 0.5rem; }
    .option { padding: 0.5rem 0.75rem; }
    .option-icon { font-size: 1.5rem; }

    .nav-btn { padding: 0.6rem 0.4rem; }
    .nav-label { font-size: 0.6rem; }

    .philosophy-items { grid-template-columns: 1fr; }
    .phil-item.warning { grid-column: span 1; }

    .gear-split { grid-template-columns: 1fr; }

    .score-legend { flex-direction: column; align-items: center; }
  }
</style>
