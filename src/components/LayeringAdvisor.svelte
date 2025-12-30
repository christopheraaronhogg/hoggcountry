<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';

  let { trailContext = {} } = $props();

  // Layer definitions from the guide
  const layers = {
    base_top: { id: 'base_top', name: 'Base Top', desc: 'Smartwool merino long-sleeve', icon: '🧵', category: 'base', sacred: true },
    base_bottom: { id: 'base_bottom', name: 'Base Bottom', desc: 'Smartwool merino long johns', icon: '🧵', category: 'base', sacred: true },
    mid_top: { id: 'mid_top', name: 'Mid Layer Top', desc: 'Fleece / grid fleece', icon: '🧥', category: 'mid' },
    hiking_pants: { id: 'hiking_pants', name: 'Hiking Pants', desc: 'Breathable hiking pants', icon: '👖', category: 'mid' },
    hiking_shirt: { id: 'hiking_shirt', name: 'Hiking Shirt', desc: 'Lightweight hiking shirt', icon: '👕', category: 'active' },
    shell_top: { id: 'shell_top', name: 'Rain Jacket', desc: 'Waterproof shell', icon: '🧥', category: 'shell' },
    shell_bottom: { id: 'shell_bottom', name: 'Rain Pants', desc: 'Waterproof pants', icon: '👖', category: 'shell' },
    puffy: { id: 'puffy', name: 'Down Puffy', desc: 'Insulation layer', icon: '🧥', category: 'insulation', staticOnly: true },
    beanie: { id: 'beanie', name: 'Beanie', desc: 'Merino beanie', icon: '🧢', category: 'head' },
    buff: { id: 'buff', name: 'Neck Gaiter', desc: 'Thermal buff', icon: '🧣', category: 'head' },
    gloves: { id: 'gloves', name: 'Gloves', desc: 'Liner gloves', icon: '🧤', category: 'hands' },
    mitts: { id: 'mitts', name: 'Shell Mitts', desc: 'Waterproof over gloves', icon: '🧤', category: 'hands' },
  };

  // Condition inputs
  let temperature = $state(45);
  let activity = $state('moving'); // 'moving', 'stopped', 'sleeping'
  let precipitation = $state('none'); // 'none', 'light_rain', 'heavy_rain', 'snow'
  let wind = $state('none'); // 'none', 'light', 'moderate', 'strong'
  let wetClothes = $state(false);
  let showAdvanced = $state(false);

  // Quick scenarios
  const scenarios = [
    { name: 'Cold Morning Start', temp: 35, activity: 'moving', precip: 'none', wind: 'light', wet: false },
    { name: 'Hiking in Rain', temp: 50, activity: 'moving', precip: 'heavy_rain', wind: 'moderate', wet: true },
    { name: 'Arriving at Camp', temp: 40, activity: 'stopped', precip: 'none', wind: 'light', wet: true },
    { name: 'Sleep Setup', temp: 30, activity: 'sleeping', precip: 'none', wind: 'none', wet: false },
    { name: 'Emergency Stop', temp: 25, activity: 'stopped', precip: 'snow', wind: 'strong', wet: true },
    { name: 'Warm Day Hiking', temp: 55, activity: 'moving', precip: 'none', wind: 'none', wet: false },
  ];

  function applyScenario(s) {
    temperature = s.temp;
    activity = s.activity;
    precipitation = s.precip;
    wind = s.wind;
    wetClothes = s.wet;
  }

  // Danger detection
  let dangerLevel = $derived.by(() => {
    // Wet + Cold + Static is dangerous
    if (wetClothes && temperature < 40 && activity === 'stopped') return 'critical';
    if (wetClothes && temperature < 50 && activity === 'stopped') return 'warning';
    if (temperature < 25 && wind === 'strong') return 'warning';
    if (precipitation !== 'none' && temperature < 35) return 'warning';
    return 'safe';
  });

  let warnings = $derived.by(() => {
    const w = [];

    if (wetClothes && temperature < 40 && activity === 'stopped') {
      w.push({ level: 'critical', text: 'DANGER: Wet + Cold + Static. Change to dry layers immediately!' });
    }

    if (wetClothes && activity === 'sleeping') {
      w.push({ level: 'critical', text: 'Never sleep in wet clothes. Change to dry base layers!' });
    }

    if (activity === 'moving' && temperature > 35) {
      w.push({ level: 'info', text: 'Start slightly cold to prevent sweat buildup' });
    }

    if (wind === 'strong' && temperature < 35) {
      w.push({ level: 'warning', text: 'High wind chill risk. Shell layer critical.' });
    }

    if (precipitation !== 'none' && activity === 'moving') {
      w.push({ level: 'info', text: 'Vent early to prevent sweat under rain gear' });
    }

    if (activity === 'stopped' && temperature < 50) {
      w.push({ level: 'info', text: 'Puffy on immediately when you stop moving' });
    }

    return w;
  });

  // Layer recommendations based on conditions
  let recommendedLayers = $derived.by(() => {
    const rec = [];

    // SLEEPING - sacred dry layers
    if (activity === 'sleeping') {
      rec.push({ ...layers.base_top, status: 'required', note: 'Dry sleep layer - SACRED' });
      rec.push({ ...layers.base_bottom, status: 'required', note: 'Dry sleep layer - SACRED' });
      if (temperature < 40) {
        rec.push({ ...layers.puffy, status: 'required', note: 'Inside quilt if needed' });
      }
      if (temperature < 35) {
        rec.push({ ...layers.beanie, status: 'required', note: 'Significant heat loss prevention' });
        rec.push({ ...layers.buff, status: 'optional', note: 'Extra warmth if needed' });
      }
      return rec;
    }

    // STOPPED (Camp/Break)
    if (activity === 'stopped') {
      // Always puffy when stopped in cold
      if (temperature < 60) {
        rec.push({ ...layers.puffy, status: 'required', note: 'On immediately when you stop' });
      }

      if (wind !== 'none' || precipitation !== 'none') {
        rec.push({ ...layers.shell_top, status: 'required', note: 'Over puffy for wind/rain' });
      }

      if (temperature < 40) {
        rec.push({ ...layers.beanie, status: 'required', note: 'Critical heat retention' });
        rec.push({ ...layers.buff, status: 'required', note: 'Neck/face protection' });
        rec.push({ ...layers.gloves, status: 'required', note: 'Hand protection' });
      }

      if (precipitation !== 'none') {
        rec.push({ ...layers.shell_bottom, status: 'optional', note: 'If sitting/kneeling' });
      }

      return rec;
    }

    // MOVING
    // 45-60°F, Moving/Dry
    if (temperature >= 45 && temperature <= 60 && precipitation === 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Primary hiking layer' });
      if (wind !== 'none') {
        rec.push({ ...layers.hiking_pants, status: 'required', note: 'Wind protection' });
      }
    }

    // 35-45°F, Moving/Dry
    else if (temperature >= 35 && temperature < 45 && precipitation === 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Base hiking layer' });
      rec.push({ ...layers.mid_top, status: 'required', note: 'Active insulation' });
      rec.push({ ...layers.hiking_pants, status: 'required', note: 'Leg warmth' });
      if (wind !== 'none') {
        rec.push({ ...layers.buff, status: 'optional', note: 'Neck protection in wind' });
      }
    }

    // 25-35°F, Moving/Dry
    else if (temperature >= 25 && temperature < 35 && precipitation === 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Base' });
      rec.push({ ...layers.mid_top, status: 'required', note: 'Primary warmth' });
      rec.push({ ...layers.hiking_pants, status: 'required', note: 'Leg warmth' });
      rec.push({ ...layers.buff, status: 'required', note: 'Neck/face protection' });
      if (wind !== 'none') {
        rec.push({ ...layers.shell_top, status: 'required', note: 'Wind blocking' });
        rec.push({ ...layers.beanie, status: 'optional', note: 'If cold' });
      }
    }

    // Below 25°F or with precipitation
    else if (temperature < 25 || precipitation !== 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Base' });
      rec.push({ ...layers.mid_top, status: 'required', note: 'Primary warmth' });
      rec.push({ ...layers.shell_top, status: 'required', note: 'Wind/precipitation' });
      rec.push({ ...layers.hiking_pants, status: 'required', note: 'Leg warmth' });

      if (precipitation !== 'none') {
        rec.push({ ...layers.shell_bottom, status: 'required', note: 'Rain/snow protection' });
      }

      rec.push({ ...layers.buff, status: 'required', note: 'Critical' });
      rec.push({ ...layers.gloves, status: 'required', note: 'Hand warmth' });

      if (wind === 'strong' || temperature < 20) {
        rec.push({ ...layers.beanie, status: 'required', note: 'Major heat loss prevention' });
      }

      if (precipitation === 'heavy_rain' || precipitation === 'snow') {
        rec.push({ ...layers.mitts, status: 'optional', note: 'Over liners if needed' });
      }
    }

    // Warm conditions (60°F+)
    else if (temperature > 60) {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Light and breathable' });
      if (precipitation !== 'none') {
        rec.push({ ...layers.shell_top, status: 'required', note: 'Rain protection' });
      }
    }

    return rec;
  });

  // Tips based on conditions
  let tips = $derived.by(() => {
    const t = [];

    if (activity === 'moving') {
      t.push('Start slightly cold - you\'ll warm up');
      t.push('Adjust layers early, not late');
      if (precipitation !== 'none') {
        t.push('Vent armpits/chest every 30-60 min');
        t.push('Eat every 60-90 minutes for heat');
      }
    }

    if (activity === 'stopped') {
      t.push('Puffy goes on immediately - don\'t wait');
      t.push('Eat calories - calories are heat');
      if (wetClothes) {
        t.push('Change to dry layers ASAP');
      }
    }

    if (activity === 'sleeping') {
      t.push('Sleep layers are SACRED - never hike in them');
      t.push('Pack sleep clothes first in dry bag');
      if (temperature < 30) {
        t.push('Puffy can go inside quilt if needed');
      }
    }

    return t;
  });

  // Activity labels
  const activityLabels = {
    moving: 'Hiking',
    stopped: 'Stopped/Camp',
    sleeping: 'Sleep Setup'
  };

  const precipLabels = {
    none: 'Clear',
    light_rain: 'Light Rain',
    heavy_rain: 'Heavy Rain',
    snow: 'Snow/Sleet'
  };

  const windLabels = {
    none: 'Calm',
    light: 'Light',
    moderate: 'Moderate',
    strong: 'Strong'
  };

  // Temperature color
  function getTempColor(temp) {
    if (temp < 25) return 'var(--terra)';
    if (temp < 35) return '#e67e22';
    if (temp < 45) return 'var(--marker)';
    if (temp < 55) return 'var(--alpine)';
    return 'var(--pine)';
  }

  // Layer category colors
  const categoryColors = {
    base: '#8e7cc3',
    mid: '#6fa8dc',
    active: '#93c47d',
    shell: '#ffd966',
    insulation: '#e06666',
    head: '#76a5af',
    hands: '#b4a7d6',
  };
</script>

<div class="layering-advisor">
  <!-- Header -->
  <div class="advisor-header">
    <div class="header-content">
      <h2 class="tool-title">Layering Advisor</h2>
      <p class="tool-desc">What to wear based on conditions</p>
    </div>
    <div class="temp-display" style="background: {getTempColor(temperature)}">
      <span class="temp-val">{temperature}°F</span>
    </div>
  </div>

  <!-- Quick Scenarios -->
  <div class="quick-scenarios">
    <span class="qs-label">Quick:</span>
    <div class="qs-btns">
      {#each scenarios as s}
        <button class="qs-btn" onclick={() => applyScenario(s)}>
          {s.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- Condition Inputs -->
  <div class="condition-panel">
    <!-- Temperature Slider -->
    <div class="condition-row temp-row">
      <label class="cond-label">Temperature</label>
      <div class="temp-slider-wrap">
        <span class="temp-endpoint">0°</span>
        <input
          type="range"
          bind:value={temperature}
          min="0"
          max="80"
          step="5"
          class="temp-slider"
          style="--temp-pct: {(temperature / 80) * 100}%; --temp-color: {getTempColor(temperature)}"
        />
        <span class="temp-endpoint">80°</span>
      </div>
      <div class="temp-zones">
        <span class="tz cold">Cold</span>
        <span class="tz cool">Cool</span>
        <span class="tz mild">Mild</span>
        <span class="tz warm">Warm</span>
      </div>
    </div>

    <!-- Activity -->
    <div class="condition-row">
      <label class="cond-label">Activity</label>
      <div class="toggle-group">
        {#each ['moving', 'stopped', 'sleeping'] as act}
          <button
            class="toggle-btn"
            class:active={activity === act}
            onclick={() => activity = act}
          >
            {#if act === 'moving'}🥾{:else if act === 'stopped'}⛺{:else}😴{/if}
            {activityLabels[act]}
          </button>
        {/each}
      </div>
    </div>

    <!-- Precipitation -->
    <div class="condition-row">
      <label class="cond-label">Precipitation</label>
      <div class="toggle-group">
        {#each ['none', 'light_rain', 'heavy_rain', 'snow'] as p}
          <button
            class="toggle-btn small"
            class:active={precipitation === p}
            onclick={() => precipitation = p}
          >
            {#if p === 'none'}☀️{:else if p === 'light_rain'}🌧️{:else if p === 'heavy_rain'}⛈️{:else}❄️{/if}
            <span class="btn-text">{precipLabels[p]}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Wind -->
    <div class="condition-row">
      <label class="cond-label">Wind</label>
      <div class="toggle-group">
        {#each ['none', 'light', 'moderate', 'strong'] as w}
          <button
            class="toggle-btn small"
            class:active={wind === w}
            onclick={() => wind = w}
          >
            {#if w === 'none'}🍃{:else if w === 'light'}💨{:else if w === 'moderate'}🌬️{:else}🌪️{/if}
            <span class="btn-text">{windLabels[w]}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Wet Clothes Toggle -->
    <div class="condition-row wet-row">
      <label class="cond-label">Current State</label>
      <button
        class="wet-toggle"
        class:wet={wetClothes}
        onclick={() => wetClothes = !wetClothes}
      >
        <span class="wet-indicator"></span>
        <span class="wet-text">{wetClothes ? '💦 Clothes are WET' : '✓ Clothes are DRY'}</span>
      </button>
    </div>
  </div>

  <!-- Warnings -->
  {#if warnings.length > 0}
    <div class="warnings-panel" transition:slide>
      {#each warnings as w}
        <div class="warning-item {w.level}" transition:fade>
          <span class="warn-icon">
            {#if w.level === 'critical'}🚨{:else if w.level === 'warning'}⚠️{:else}💡{/if}
          </span>
          <span class="warn-text">{w.text}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Layer Recommendations -->
  <div class="layers-panel" class:danger={dangerLevel === 'critical'}>
    <div class="layers-header">
      <h3>Recommended Layers</h3>
      <span class="activity-badge">
        {#if activity === 'moving'}🥾 Hiking{:else if activity === 'stopped'}⛺ Stopped{:else}😴 Sleep{/if}
      </span>
    </div>

    {#if recommendedLayers.length === 0}
      <div class="no-layers">
        <p>Adjust conditions above to get recommendations</p>
      </div>
    {:else}
      <div class="layer-stack">
        {#each recommendedLayers as layer (layer.id)}
          <div
            class="layer-card {layer.status}"
            style="--cat-color: {categoryColors[layer.category]}"
            transition:slide
          >
            <div class="layer-icon">{layer.icon}</div>
            <div class="layer-info">
              <span class="layer-name">{layer.name}</span>
              <span class="layer-note">{layer.note}</span>
            </div>
            <div class="layer-status">
              {#if layer.status === 'required'}
                <span class="status-badge required">Required</span>
              {:else}
                <span class="status-badge optional">Optional</span>
              {/if}
            </div>
            {#if layer.sacred}
              <span class="sacred-badge" title="Sleep layer - never hike in this">🛡️</span>
            {/if}
            {#if layer.staticOnly}
              <span class="static-badge" title="Static use only - not for hiking">⚡</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Tips -->
  {#if tips.length > 0}
    <div class="tips-panel">
      <h4 class="tips-title">💡 Tips</h4>
      <ul class="tips-list">
        {#each tips as tip}
          <li>{tip}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Core Principles -->
  <div class="principles-card">
    <h4>Core Principles</h4>
    <div class="principles-grid">
      <div class="principle">
        <span class="p-icon">🌡️</span>
        <span class="p-text">Start cold, warm up moving</span>
      </div>
      <div class="principle">
        <span class="p-icon">💧</span>
        <span class="p-text">Prevent sweat at all costs</span>
      </div>
      <div class="principle">
        <span class="p-icon">🛡️</span>
        <span class="p-text">Sleep layers are SACRED</span>
      </div>
      <div class="principle">
        <span class="p-icon">🍔</span>
        <span class="p-text">Calories = Heat</span>
      </div>
      <div class="principle warning">
        <span class="p-icon">⚠️</span>
        <span class="p-text">Wet + Cold + Static = DANGER</span>
      </div>
      <div class="principle">
        <span class="p-icon">🧥</span>
        <span class="p-text">Puffy ON when you stop</span>
      </div>
    </div>
  </div>

  <!-- Guide Link -->
  <a href="/guide/04-clothing-system" class="guide-link">
    <span class="gl-icon">📖</span>
    <span class="gl-text">Read Full Chapter: Clothing System</span>
    <span class="gl-arrow">→</span>
  </a>
</div>

<style>
  .layering-advisor {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header */
  .advisor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: linear-gradient(135deg, var(--pine) 0%, #3a4538 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    color: #fff;
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

  .temp-display {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }

  .temp-val {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }

  /* Quick Scenarios */
  .quick-scenarios {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .qs-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    white-space: nowrap;
  }

  .qs-btns {
    display: flex;
    gap: 0.35rem;
  }

  .qs-btn {
    padding: 0.4rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 0.75rem;
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .qs-btn:hover {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.1);
  }

  /* Condition Panel */
  .condition-panel {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  .condition-row {
    margin-bottom: 1.25rem;
  }

  .condition-row:last-child {
    margin-bottom: 0;
  }

  .cond-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  /* Temperature Slider */
  .temp-slider-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .temp-endpoint {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    min-width: 28px;
  }

  .temp-slider {
    flex: 1;
    height: 12px;
    -webkit-appearance: none;
    background: linear-gradient(to right,
      var(--terra) 0%,
      #e67e22 25%,
      var(--marker) 40%,
      var(--alpine) 60%,
      var(--pine) 100%
    );
    border-radius: 6px;
    cursor: pointer;
  }

  .temp-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: #fff;
    border: 3px solid var(--temp-color, var(--alpine));
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .temp-zones {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
    padding: 0 28px;
  }

  .tz {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .tz.cold { color: var(--terra); }
  .tz.cool { color: var(--marker); }
  .tz.mild { color: var(--alpine); }
  .tz.warm { color: var(--pine); }

  /* Toggle Groups */
  .toggle-group {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toggle-btn.small {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .toggle-btn .btn-text {
    display: inline;
  }

  .toggle-btn:hover {
    border-color: var(--alpine);
  }

  .toggle-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  /* Wet Toggle */
  .wet-row {
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
  }

  .wet-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .wet-toggle.wet {
    background: rgba(201, 115, 58, 0.1);
    border-color: var(--terra);
  }

  .wet-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--alpine);
    transition: all 0.2s ease;
  }

  .wet-toggle.wet .wet-indicator {
    background: var(--terra);
  }

  .wet-text {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
  }

  /* Warnings */
  .warnings-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .warning-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
  }

  .warning-item.critical {
    background: rgba(201, 115, 58, 0.15);
    border: 1px solid var(--terra);
  }

  .warning-item.warning {
    background: rgba(240, 224, 0, 0.15);
    border: 1px solid rgba(240, 224, 0, 0.5);
  }

  .warning-item.info {
    background: rgba(166, 181, 137, 0.15);
    border: 1px solid rgba(166, 181, 137, 0.5);
  }

  .warn-icon {
    font-size: 1.25rem;
  }

  .warn-text {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--ink);
  }

  .warning-item.critical .warn-text {
    color: var(--terra);
    font-weight: 700;
  }

  /* Layers Panel */
  .layers-panel {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
  }

  .layers-panel.danger {
    border-color: var(--terra);
    box-shadow: 0 0 0 3px rgba(201, 115, 58, 0.2);
  }

  .layers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .layers-header h3 {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink);
  }

  .activity-badge {
    font-size: 0.8rem;
    padding: 0.3rem 0.75rem;
    background: var(--bg);
    border-radius: 20px;
    color: var(--pine);
    font-weight: 600;
  }

  .layer-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .layer-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border-radius: 10px;
    border-left: 4px solid var(--cat-color, var(--alpine));
    position: relative;
  }

  .layer-card.required {
    background: rgba(166, 181, 137, 0.1);
  }

  .layer-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
  }

  .layer-info {
    flex: 1;
    min-width: 0;
  }

  .layer-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
  }

  .layer-note {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .layer-status {
    flex-shrink: 0;
  }

  .status-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .status-badge.required {
    background: var(--pine);
    color: #fff;
  }

  .status-badge.optional {
    background: var(--bg);
    color: var(--muted);
    border: 1px solid var(--border);
  }

  .sacred-badge,
  .static-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 0.9rem;
    background: #fff;
    border-radius: 50%;
    padding: 2px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  /* Tips */
  .tips-panel {
    background: rgba(166, 181, 137, 0.1);
    border: 1px solid rgba(166, 181, 137, 0.3);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .tips-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--pine);
    text-transform: uppercase;
  }

  .tips-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .tips-list li {
    margin-bottom: 0.25rem;
  }

  /* Principles */
  .principles-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .principles-card h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .principles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .principle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .principle.warning {
    background: rgba(201, 115, 58, 0.1);
    border: 1px solid rgba(201, 115, 58, 0.3);
  }

  .p-icon {
    font-size: 1rem;
  }

  .p-text {
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
    .advisor-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .temp-display {
      margin: 0 auto;
    }

    .toggle-btn {
      flex: 1;
      justify-content: center;
      padding: 0.5rem;
    }

    .toggle-btn.small {
      flex: 0 0 calc(50% - 0.25rem);
    }

    .toggle-btn .btn-text {
      display: none;
    }

    .principles-grid {
      grid-template-columns: 1fr;
    }

    .quick-scenarios {
      flex-wrap: nowrap;
    }

    .qs-btns {
      flex-wrap: nowrap;
    }
  }
</style>
