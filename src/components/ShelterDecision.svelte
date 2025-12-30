<script>
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';

  let { trailContext = {} } = $props();

  // Shelter triggers - any ONE means shelter
  let triggers = $state({
    windCold: false,      // Wind + Cold combo
    freezingPrecip: false, // Freezing rain or heavy wet snow
    badGround: false,      // Ice, deep snow, no flat sites
    wetCantDry: false,     // Wet and can't dry before dark
    exhausted: false,      // Mental or physical exhaustion
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

  // Active section
  let activeSection = $state('triggers'); // 'triggers', 'scoring', 'quick', 'protocol'

  // Has any trigger been activated?
  let hasTrigger = $derived(Object.values(triggers).some(t => t));

  // Calculate total score
  let totalScore = $derived(Object.values(scores).reduce((a, b) => a + b, 0));

  // Quick check result
  let quickCheckPasses = $derived(Object.values(quickChecks).every(c => c));

  // Final recommendation
  let recommendation = $derived.by(() => {
    // Any trigger = automatic shelter
    if (hasTrigger) {
      return {
        decision: 'shelter',
        reason: 'Shelter trigger activated',
        confidence: 'high',
        urgent: triggers.freezingPrecip || triggers.wetCantDry,
      };
    }

    // Score-based decision
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

  // Trigger descriptions
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

  // Score descriptions
  const scoreInfo = {
    windProtection: {
      name: 'Wind Protection',
      levels: ['Exposed, funneling wind', 'Partial protection', 'Fully protected, calm'],
    },
    groundQuality: {
      name: 'Ground Quality',
      levels: ['Ice, pooled water, unusable', 'Minor slope or frozen top', 'Flat, drains well, stakes hold'],
    },
    moistureRisk: {
      name: 'Moisture Risk',
      levels: ['Freezing rain / heavy wet snow', 'Damp but manageable', 'Dry ground, stable weather'],
    },
    setupControl: {
      name: 'Setup Control',
      levels: ['Hands failing, rushing, irritation', 'Minor fumbling', 'Calm, deliberate setup'],
    },
    overnightConfidence: {
      name: 'Overnight Confidence',
      levels: ['No — hoping it holds', 'Maybe — thin margin', 'Yes — confidently'],
      question: 'Will this still work if conditions worsen at 3am?',
    },
  };

  // NOT triggers (for education)
  const notTriggers = [
    'It\'s cold but dry and calm',
    'You\'re tired but functional',
    'Others are staying there',
    'You want convenience',
  ];

  // Reset all
  function resetAll() {
    triggers = {
      windCold: false,
      freezingPrecip: false,
      badGround: false,
      wetCantDry: false,
      exhausted: false,
    };
    scores = {
      windProtection: 2,
      groundQuality: 2,
      moistureRisk: 2,
      setupControl: 2,
      overnightConfidence: 2,
    };
    quickChecks = {
      amIDry: true,
      windDecreasing: true,
      canPitchCleanly: true,
      warmAt3am: true,
    };
  }

  // Get score color
  function getScoreColor(total) {
    if (total >= 7) return 'var(--alpine)';
    if (total >= 4) return 'var(--marker)';
    return 'var(--terra)';
  }
</script>

<div class="shelter-decision">
  <!-- Header with Recommendation -->
  <div class="decision-header" class:shelter={recommendation.decision === 'shelter'} class:urgent={recommendation.urgent}>
    <div class="header-content">
      <h2 class="tool-title">Shelter Decision</h2>
      <p class="tool-desc">Tent vs. Shelter - make the right call</p>
    </div>
    <div class="recommendation-badge">
      <span class="rec-icon">
        {#if recommendation.decision === 'tent'}🏕️{:else}🏠{/if}
      </span>
      <span class="rec-text">{recommendation.decision === 'tent' ? 'TENT' : 'SHELTER'}</span>
    </div>
  </div>

  <!-- Decision Summary -->
  <div class="decision-summary" class:shelter={recommendation.decision === 'shelter'}>
    <div class="summary-main">
      <span class="summary-verdict">
        {#if recommendation.decision === 'tent'}
          ✓ Tent conditions are acceptable
        {:else}
          → Go to shelter tonight
        {/if}
      </span>
      <span class="summary-reason">{recommendation.reason}</span>
    </div>
    {#if recommendation.urgent}
      <div class="urgent-badge">⚠️ URGENT</div>
    {/if}
  </div>

  <!-- Section Tabs -->
  <div class="section-tabs">
    <button
      class="stab"
      class:active={activeSection === 'triggers'}
      class:warning={hasTrigger}
      onclick={() => activeSection = 'triggers'}
    >
      <span class="stab-icon">{hasTrigger ? '⚠️' : '🎯'}</span>
      <span class="stab-text">Triggers</span>
    </button>
    <button
      class="stab"
      class:active={activeSection === 'scoring'}
      onclick={() => activeSection = 'scoring'}
    >
      <span class="stab-icon">📊</span>
      <span class="stab-text">Site Score</span>
    </button>
    <button
      class="stab"
      class:active={activeSection === 'quick'}
      onclick={() => activeSection = 'quick'}
    >
      <span class="stab-icon">⚡</span>
      <span class="stab-text">Quick Check</span>
    </button>
    <button
      class="stab"
      class:active={activeSection === 'protocol'}
      onclick={() => activeSection = 'protocol'}
    >
      <span class="stab-icon">📋</span>
      <span class="stab-text">Protocol</span>
    </button>
  </div>

  <!-- Triggers Section -->
  {#if activeSection === 'triggers'}
    <div class="section triggers-section" transition:fade>
      <div class="section-header">
        <h3>Shelter Triggers</h3>
        <span class="section-hint">Any ONE of these = go to shelter</span>
      </div>

      <div class="triggers-list">
        {#each Object.entries(triggers) as [key, value]}
          {@const info = triggerInfo[key]}
          <button
            class="trigger-card"
            class:active={value}
            class:critical={info.critical && value}
            onclick={() => triggers[key] = !triggers[key]}
          >
            <div class="trigger-check">
              {#if value}
                <span class="check-on">✓</span>
              {:else}
                <span class="check-off"></span>
              {/if}
            </div>
            <div class="trigger-icon">{info.icon}</div>
            <div class="trigger-content">
              <span class="trigger-name">{info.name}</span>
              <span class="trigger-desc">{info.desc}</span>
              {#if value}
                <ul class="trigger-details" transition:slide>
                  {#each info.details as detail}
                    <li>{detail}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          </button>
        {/each}
      </div>

      <!-- NOT Triggers -->
      <div class="not-triggers">
        <h4>❌ These are NOT shelter triggers:</h4>
        <div class="not-list">
          {#each notTriggers as item}
            <span class="not-item">{item}</span>
          {/each}
        </div>
        <p class="not-note">Tent handles these conditions fine.</p>
      </div>
    </div>
  {/if}

  <!-- Scoring Section -->
  {#if activeSection === 'scoring'}
    <div class="section scoring-section" transition:fade>
      <div class="section-header">
        <h3>Tent Site Scoring</h3>
        <div class="score-display" style="--score-color: {getScoreColor(totalScore)}">
          <span class="score-val">{totalScore}</span>
          <span class="score-max">/10</span>
        </div>
      </div>

      <div class="score-interpretation">
        {#if totalScore >= 7}
          <span class="interp good">7-10: Tent is correct</span>
        {:else if totalScore >= 4}
          <span class="interp marginal">4-6: Tent only if weather stable</span>
        {:else}
          <span class="interp bad">0-3: Shelter is the smart move</span>
        {/if}
      </div>

      <div class="scoring-grid">
        {#each Object.entries(scores) as [key, value]}
          {@const info = scoreInfo[key]}
          <div class="score-card">
            <div class="score-header">
              <span class="score-name">{info.name}</span>
              <span class="score-value" style="--score-color: {getScoreColor(value * 5)}">{value}</span>
            </div>
            {#if info.question}
              <p class="score-question">"{info.question}"</p>
            {/if}
            <div class="score-buttons">
              {#each [0, 1, 2] as level}
                <button
                  class="score-btn"
                  class:active={value === level}
                  class:bad={level === 0}
                  class:ok={level === 1}
                  class:good={level === 2}
                  onclick={() => scores[key] = level}
                >
                  <span class="btn-num">{level}</span>
                  <span class="btn-desc">{info.levels[level]}</span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="hope-warning">
        <span class="hope-icon">⚠️</span>
        <span class="hope-text">Hope is not a winter strategy.</span>
      </div>
    </div>
  {/if}

  <!-- Quick Check Section -->
  {#if activeSection === 'quick'}
    <div class="section quick-section" transition:fade>
      <div class="section-header">
        <h3>One-Minute Decision</h3>
        <span class="section-hint">Before committing to camp, ask yourself:</span>
      </div>

      <div class="quick-checks">
        <button
          class="quick-card"
          class:yes={quickChecks.amIDry}
          onclick={() => quickChecks.amIDry = !quickChecks.amIDry}
        >
          <span class="qc-icon">{quickChecks.amIDry ? '✓' : '✗'}</span>
          <span class="qc-text">Am I dry right now?</span>
        </button>

        <button
          class="quick-card"
          class:yes={quickChecks.windDecreasing}
          onclick={() => quickChecks.windDecreasing = !quickChecks.windDecreasing}
        >
          <span class="qc-icon">{quickChecks.windDecreasing ? '✓' : '✗'}</span>
          <span class="qc-text">Is wind decreasing (or stable)?</span>
        </button>

        <button
          class="quick-card"
          class:yes={quickChecks.canPitchCleanly}
          onclick={() => quickChecks.canPitchCleanly = !quickChecks.canPitchCleanly}
        >
          <span class="qc-icon">{quickChecks.canPitchCleanly ? '✓' : '✗'}</span>
          <span class="qc-text">Can I pitch cleanly without rushing?</span>
        </button>

        <button
          class="quick-card"
          class:yes={quickChecks.warmAt3am}
          onclick={() => quickChecks.warmAt3am = !quickChecks.warmAt3am}
        >
          <span class="qc-icon">{quickChecks.warmAt3am ? '✓' : '✗'}</span>
          <span class="qc-text">Will this keep me warm at 3am?</span>
        </button>
      </div>

      <div class="quick-result" class:pass={quickCheckPasses}>
        {#if quickCheckPasses}
          <span class="qr-icon">✓</span>
          <span class="qr-text">All checks pass — tent is acceptable</span>
        {:else}
          <span class="qr-icon">→</span>
          <span class="qr-text">If any answer feels shaky, shelter is the correct call</span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Protocol Section -->
  {#if activeSection === 'protocol'}
    <div class="section protocol-section" transition:fade>
      <div class="section-header">
        <h3>Shelter Night Protocol</h3>
        <span class="section-hint">When you choose shelter, switch modes:</span>
      </div>

      <div class="protocol-steps">
        <!-- Arrival -->
        <div class="protocol-group">
          <h4 class="pg-title">📍 Arrival</h4>
          <ul class="pg-list">
            <li>Scan for mice</li>
            <li>Choose spot away from walls and corners</li>
            <li>Identify food hang or bear box immediately</li>
          </ul>
        </div>

        <!-- Food & Scent -->
        <div class="protocol-group critical">
          <h4 class="pg-title">🔒 Food & Scent Lockdown (FIRST ACTION)</h4>
          <ul class="pg-list">
            <li>Food, trash, toothpaste, lip balm, sanitizer, wrappers — all together</li>
            <li>Hang or box immediately</li>
            <li>Nothing scented touches the floor</li>
            <li>Pack stays closed</li>
          </ul>
        </div>

        <!-- Gear Control -->
        <div class="protocol-group">
          <h4 class="pg-title">🎒 Gear Control</h4>
          <div class="gear-columns">
            <div class="gear-col keep">
              <span class="col-title">✓ Keep with you:</span>
              <ul>
                <li>Headlamp</li>
                <li>Phone</li>
                <li>Filter (inside bag)</li>
                <li>Battery bank</li>
                <li>Water bottle</li>
              </ul>
            </div>
            <div class="gear-col avoid">
              <span class="col-title">✗ Never leave loose:</span>
              <ul>
                <li>Gloves</li>
                <li>Socks</li>
                <li>Trek pole handles</li>
                <li>Hip belt pockets</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Night Behavior -->
        <div class="protocol-group">
          <h4 class="pg-title">🌙 Night Behavior</h4>
          <ul class="pg-list">
            <li>No food after final hang</li>
            <li>No wrappers opened</li>
            <li>Ignore mice unless contacting gear</li>
            <li>Shoes upright, not flat</li>
          </ul>
        </div>

        <!-- Morning Exit -->
        <div class="protocol-group">
          <h4 class="pg-title">☀️ Morning Exit</h4>
          <ol class="pg-list numbered">
            <li>Pack sleep system</li>
            <li>Pack all non-food gear</li>
            <li>Retrieve food last</li>
            <li>Eat outside if possible</li>
            <li>Visual sweep for crumbs</li>
          </ol>
        </div>
      </div>
    </div>
  {/if}

  <!-- Core Philosophy -->
  <div class="philosophy-card">
    <h4>Core Philosophy</h4>
    <div class="philosophy-grid">
      <div class="phil-item">
        <span class="phil-icon">🏕️</span>
        <span class="phil-text">Tent is the default</span>
      </div>
      <div class="phil-item">
        <span class="phil-icon">🛡️</span>
        <span class="phil-text">Shelters are a safety tool, not comfort</span>
      </div>
      <div class="phil-item">
        <span class="phil-icon">📊</span>
        <span class="phil-text">Use objective triggers, not mood</span>
      </div>
      <div class="phil-item warning">
        <span class="phil-icon">🐭</span>
        <span class="phil-text">Poor sleep + mice are accepted costs when risk is high</span>
      </div>
    </div>
  </div>

  <!-- Reset Button -->
  <button class="reset-btn" onclick={resetAll}>
    Reset All
  </button>

  <!-- Guide Link -->
  <a href="/guide/05-shelter-vs-tent-decision-system" class="guide-link">
    <span class="gl-icon">📖</span>
    <span class="gl-text">Read Full Chapter: Shelter vs. Tent Decision</span>
    <span class="gl-arrow">→</span>
  </a>
</div>

<style>
  .shelter-decision {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header */
  .decision-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, var(--pine) 0%, #3a4538 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 0;
    color: #fff;
    transition: all 0.3s ease;
  }

  .decision-header.shelter {
    background: linear-gradient(135deg, var(--terra) 0%, #8a5030 100%);
  }

  .decision-header.urgent {
    animation: pulse 1s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from { box-shadow: 0 0 0 0 rgba(201, 115, 58, 0.4); }
    to { box-shadow: 0 0 20px 5px rgba(201, 115, 58, 0.6); }
  }

  .tool-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tool-desc {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }

  .recommendation-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
  }

  .rec-icon {
    font-size: 2rem;
  }

  .rec-text {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Decision Summary */
  .decision-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid rgba(166, 181, 137, 0.3);
    border-top: none;
    border-radius: 0 0 16px 16px;
    margin-bottom: 1rem;
  }

  .decision-summary.shelter {
    background: rgba(201, 115, 58, 0.15);
    border-color: rgba(201, 115, 58, 0.3);
  }

  .summary-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .summary-verdict {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .summary-reason {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .urgent-badge {
    padding: 0.4rem 0.75rem;
    background: var(--terra);
    color: #fff;
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    animation: blink 0.5s ease-in-out infinite alternate;
  }

  @keyframes blink {
    from { opacity: 1; }
    to { opacity: 0.7; }
  }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }

  .stab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.7rem 0.5rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
  }

  .stab:hover {
    border-color: var(--alpine);
    color: var(--pine);
  }

  .stab.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .stab.warning {
    border-color: var(--terra);
    color: var(--terra);
  }

  .stab.warning.active {
    background: var(--terra);
    color: #fff;
  }

  .stab-icon {
    font-size: 1rem;
  }

  /* Sections */
  .section {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .section-header h3 {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink);
  }

  .section-hint {
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Triggers */
  .triggers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .trigger-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
  }

  .trigger-card:hover {
    border-color: var(--alpine);
  }

  .trigger-card.active {
    background: rgba(201, 115, 58, 0.1);
    border-color: var(--terra);
  }

  .trigger-card.critical {
    background: rgba(201, 115, 58, 0.2);
    border-color: var(--terra);
    box-shadow: 0 0 0 2px rgba(201, 115, 58, 0.3);
  }

  .trigger-check {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--border);
    border-radius: 6px;
    background: #fff;
  }

  .trigger-card.active .trigger-check {
    background: var(--terra);
    border-color: var(--terra);
  }

  .check-on {
    color: #fff;
    font-weight: bold;
  }

  .trigger-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .trigger-content {
    flex: 1;
    min-width: 0;
  }

  .trigger-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .trigger-desc {
    display: block;
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }

  .trigger-details {
    margin: 0.5rem 0 0 0;
    padding-left: 1rem;
    font-size: 0.8rem;
    color: var(--terra);
  }

  .trigger-details li {
    margin-bottom: 0.15rem;
  }

  /* NOT Triggers */
  .not-triggers {
    padding: 1rem;
    background: var(--bg);
    border-radius: 10px;
  }

  .not-triggers h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--muted);
  }

  .not-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .not-item {
    padding: 0.35rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .not-note {
    font-size: 0.85rem;
    color: var(--alpine);
    font-weight: 600;
    margin: 0;
  }

  /* Scoring */
  .score-display {
    display: flex;
    align-items: baseline;
    gap: 0.1rem;
    padding: 0.5rem 1rem;
    background: var(--bg);
    border-radius: 8px;
    border: 2px solid var(--score-color, var(--alpine));
  }

  .score-val {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--score-color, var(--ink));
    line-height: 1;
  }

  .score-max {
    font-size: 1rem;
    color: var(--muted);
  }

  .score-interpretation {
    text-align: center;
    margin-bottom: 1rem;
  }

  .interp {
    display: inline-block;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .interp.good {
    background: rgba(166, 181, 137, 0.2);
    color: var(--pine);
  }

  .interp.marginal {
    background: rgba(240, 224, 0, 0.2);
    color: #9a8600;
  }

  .interp.bad {
    background: rgba(201, 115, 58, 0.2);
    color: var(--terra);
  }

  .scoring-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .score-card {
    padding: 1rem;
    background: var(--bg);
    border-radius: 10px;
  }

  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .score-name {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .score-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--score-color, var(--ink));
  }

  .score-question {
    font-size: 0.8rem;
    font-style: italic;
    color: var(--muted);
    margin: 0 0 0.5rem 0;
  }

  .score-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .score-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.85rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .score-btn:hover {
    border-color: var(--alpine);
  }

  .score-btn.active {
    border-width: 2px;
  }

  .score-btn.active.bad {
    background: rgba(201, 115, 58, 0.1);
    border-color: var(--terra);
  }

  .score-btn.active.ok {
    background: rgba(240, 224, 0, 0.1);
    border-color: var(--marker);
  }

  .score-btn.active.good {
    background: rgba(166, 181, 137, 0.15);
    border-color: var(--alpine);
  }

  .btn-num {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    min-width: 20px;
  }

  .score-btn.bad .btn-num { color: var(--terra); }
  .score-btn.ok .btn-num { color: var(--marker); }
  .score-btn.good .btn-num { color: var(--alpine); }

  .btn-desc {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .score-btn.active .btn-desc {
    color: var(--ink);
  }

  .hope-warning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(201, 115, 58, 0.1);
    border-radius: 8px;
  }

  .hope-icon {
    font-size: 1.25rem;
  }

  .hope-text {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--terra);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Quick Check */
  .quick-checks {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .quick-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(201, 115, 58, 0.1);
    border: 1px solid var(--terra);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
  }

  .quick-card.yes {
    background: rgba(166, 181, 137, 0.15);
    border-color: var(--alpine);
  }

  .qc-icon {
    font-size: 1.5rem;
    font-weight: bold;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(201, 115, 58, 0.2);
    color: var(--terra);
  }

  .quick-card.yes .qc-icon {
    background: rgba(166, 181, 137, 0.3);
    color: var(--pine);
  }

  .qc-text {
    font-size: 1rem;
    color: var(--ink);
    font-weight: 500;
  }

  .quick-result {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: rgba(201, 115, 58, 0.15);
    border: 2px solid var(--terra);
    border-radius: 10px;
  }

  .quick-result.pass {
    background: rgba(166, 181, 137, 0.15);
    border-color: var(--alpine);
  }

  .qr-icon {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .quick-result:not(.pass) .qr-icon {
    color: var(--terra);
  }

  .quick-result.pass .qr-icon {
    color: var(--pine);
  }

  .qr-text {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
  }

  /* Protocol */
  .protocol-steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .protocol-group {
    padding: 1rem;
    background: var(--bg);
    border-radius: 10px;
    border-left: 4px solid var(--alpine);
  }

  .protocol-group.critical {
    border-left-color: var(--terra);
    background: rgba(201, 115, 58, 0.05);
  }

  .pg-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--ink);
    text-transform: uppercase;
  }

  .pg-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .pg-list li {
    margin-bottom: 0.35rem;
  }

  .pg-list.numbered {
    list-style-type: decimal;
  }

  .gear-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .gear-col {
    padding: 0.75rem;
    border-radius: 8px;
  }

  .gear-col.keep {
    background: rgba(166, 181, 137, 0.1);
  }

  .gear-col.avoid {
    background: rgba(201, 115, 58, 0.1);
  }

  .col-title {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .gear-col.keep .col-title { color: var(--pine); }
  .gear-col.avoid .col-title { color: var(--terra); }

  .gear-col ul {
    margin: 0;
    padding-left: 1rem;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .gear-col li {
    margin-bottom: 0.2rem;
  }

  /* Philosophy */
  .philosophy-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .philosophy-card h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .philosophy-grid {
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
    background: rgba(240, 224, 0, 0.1);
  }

  .phil-icon {
    font-size: 1rem;
  }

  .phil-text {
    color: var(--ink);
  }

  /* Reset */
  .reset-btn {
    display: block;
    width: 100%;
    padding: 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    cursor: pointer;
    margin-bottom: 1rem;
    transition: all 0.15s ease;
  }

  .reset-btn:hover {
    border-color: var(--alpine);
    color: var(--ink);
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    color: var(--ink);
    transition: all 0.2s ease;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }

  .gl-icon {
    font-size: 1.25rem;
  }

  .gl-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .gl-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .gl-arrow {
    transform: translateX(4px);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .decision-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .section-tabs {
      flex-wrap: wrap;
    }

    .stab {
      flex: 0 0 calc(50% - 0.25rem);
    }

    .stab-text {
      font-size: 0.65rem;
    }

    .philosophy-grid {
      grid-template-columns: 1fr;
    }

    .gear-columns {
      grid-template-columns: 1fr;
    }

    .not-list {
      flex-direction: column;
    }

    .not-item {
      text-align: center;
    }
  }
</style>
