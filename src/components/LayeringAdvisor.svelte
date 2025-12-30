<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

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
  let activity = $state('moving');
  let precipitation = $state('none');
  let wind = $state('none');
  let wetClothes = $state(false);

  // Quick scenarios
  const scenarios = [
    { name: 'Cold Start', temp: 35, activity: 'moving', precip: 'none', wind: 'light', wet: false, icon: '🌅' },
    { name: 'Rain Hike', temp: 50, activity: 'moving', precip: 'heavy_rain', wind: 'moderate', wet: true, icon: '🌧️' },
    { name: 'Camp Arrival', temp: 40, activity: 'stopped', precip: 'none', wind: 'light', wet: true, icon: '⛺' },
    { name: 'Sleep Setup', temp: 30, activity: 'sleeping', precip: 'none', wind: 'none', wet: false, icon: '😴' },
    { name: 'Emergency', temp: 25, activity: 'stopped', precip: 'snow', wind: 'strong', wet: true, icon: '🚨' },
    { name: 'Warm Day', temp: 55, activity: 'moving', precip: 'none', wind: 'none', wet: false, icon: '☀️' },
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

    if (activity === 'stopped') {
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
    if (temperature >= 45 && temperature <= 60 && precipitation === 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Primary hiking layer' });
      if (wind !== 'none') {
        rec.push({ ...layers.hiking_pants, status: 'required', note: 'Wind protection' });
      }
    } else if (temperature >= 35 && temperature < 45 && precipitation === 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Base hiking layer' });
      rec.push({ ...layers.mid_top, status: 'required', note: 'Active insulation' });
      rec.push({ ...layers.hiking_pants, status: 'required', note: 'Leg warmth' });
      if (wind !== 'none') {
        rec.push({ ...layers.buff, status: 'optional', note: 'Neck protection in wind' });
      }
    } else if (temperature >= 25 && temperature < 35 && precipitation === 'none') {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Base' });
      rec.push({ ...layers.mid_top, status: 'required', note: 'Primary warmth' });
      rec.push({ ...layers.hiking_pants, status: 'required', note: 'Leg warmth' });
      rec.push({ ...layers.buff, status: 'required', note: 'Neck/face protection' });
      if (wind !== 'none') {
        rec.push({ ...layers.shell_top, status: 'required', note: 'Wind blocking' });
        rec.push({ ...layers.beanie, status: 'optional', note: 'If cold' });
      }
    } else if (temperature < 25 || precipitation !== 'none') {
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
    } else if (temperature > 60) {
      rec.push({ ...layers.hiking_shirt, status: 'required', note: 'Light and breathable' });
      if (precipitation !== 'none') {
        rec.push({ ...layers.shell_top, status: 'required', note: 'Rain protection' });
      }
    }

    return rec;
  });

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

  const activityLabels = {
    moving: 'Hiking',
    stopped: 'Stopped',
    sleeping: 'Sleep'
  };

  const activityIcons = {
    moving: '🥾',
    stopped: '⛺',
    sleeping: '😴'
  };

  const precipLabels = {
    none: 'Clear',
    light_rain: 'Light',
    heavy_rain: 'Heavy',
    snow: 'Snow'
  };

  const windLabels = {
    none: 'Calm',
    light: 'Light',
    moderate: 'Mod',
    strong: 'Strong'
  };

  function getTempZone(temp) {
    if (temp < 25) return { zone: 'extreme', label: 'EXTREME', color: '#dc2626' };
    if (temp < 35) return { zone: 'cold', label: 'COLD', color: '#f97316' };
    if (temp < 45) return { zone: 'cool', label: 'COOL', color: '#eab308' };
    if (temp < 55) return { zone: 'mild', label: 'MILD', color: '#22c55e' };
    return { zone: 'warm', label: 'WARM', color: '#16a34a' };
  }

  let tempZone = $derived(getTempZone(temperature));

  const categoryColors = {
    base: { bg: '#f3e8ff', border: '#c084fc', label: 'Base' },
    mid: { bg: '#e0f2fe', border: '#38bdf8', label: 'Mid' },
    active: { bg: '#dcfce7', border: '#4ade80', label: 'Active' },
    shell: { bg: '#fef3c7', border: '#fbbf24', label: 'Shell' },
    insulation: { bg: '#fee2e2', border: '#f87171', label: 'Insulation' },
    head: { bg: '#f0f9ff', border: '#7dd3fc', label: 'Head' },
    hands: { bg: '#f5f3ff', border: '#a78bfa', label: 'Hands' },
  };
</script>

<div class="layering-advisor" class:mounted class:danger={dangerLevel === 'critical'}>
  <!-- Header -->
  <header class="layer-header">
    <div class="header-pattern"></div>
    <div class="header-content">
      <div class="header-text">
        <div class="title-row">
          <svg class="title-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
          </svg>
          <h2>Layering Advisor</h2>
        </div>
        <p>What to wear for trail conditions</p>
      </div>
      <div class="temp-orb" style="--zone-color: {tempZone.color}">
        <div class="orb-glow"></div>
        <span class="orb-temp">{temperature}°</span>
        <span class="orb-zone">{tempZone.label}</span>
      </div>
    </div>
  </header>

  <!-- Quick Scenarios -->
  <div class="scenarios-bar">
    {#each scenarios as s}
      <button class="scenario-chip" onclick={() => applyScenario(s)}>
        <span class="chip-icon">{s.icon}</span>
        <span class="chip-text">{s.name}</span>
      </button>
    {/each}
  </div>

  <!-- Danger Banner -->
  {#if dangerLevel === 'critical'}
    <div class="danger-banner">
      <div class="danger-pulse"></div>
      <svg class="danger-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1,21h22L12,2 1,21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
      <div class="danger-text">
        <strong>HYPOTHERMIA RISK</strong>
        <span>Wet + Cold + Static = Danger</span>
      </div>
    </div>
  {/if}

  <!-- Condition Panel -->
  <div class="condition-panel">
    <!-- Temperature -->
    <div class="cond-section">
      <label class="cond-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15,13V5c0-1.66-1.34-3-3-3S9,3.34,9,5v8c-1.21,0.91-2,2.37-2,4c0,2.76,2.24,5,5,5s5-2.24,5-5 C17,15.37,16.21,13.91,15,13z"/>
        </svg>
        Temperature
      </label>
      <div class="temp-control">
        <div class="temp-track">
          <div class="track-fill" style="width: {(temperature / 80) * 100}%; background: {tempZone.color}"></div>
          <input type="range" bind:value={temperature} min="0" max="80" step="5" class="temp-range" />
        </div>
        <div class="temp-readout" style="color: {tempZone.color}">{temperature}°F</div>
      </div>
      <div class="temp-scale">
        <span style="color: #dc2626">0°</span>
        <span style="color: #f97316">25°</span>
        <span style="color: #eab308">40°</span>
        <span style="color: #22c55e">55°</span>
        <span style="color: #16a34a">80°</span>
      </div>
    </div>

    <!-- Activity -->
    <div class="cond-section">
      <label class="cond-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5,5.5c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM9.8,8.9L7,23h2.1l1.8,-8 2.1,2v6h2v-7.5l-2.1,-2 0.6,-3c1.3,1.5 3.3,2.5 5.5,2.5v-2c-1.9,0 -3.5,-1 -4.3,-2.4l-1,-1.6c-0.4,-0.6 -1,-1 -1.7,-1 -0.3,0 -0.5,0.1 -0.8,0.1L6,7.5V12h2V9.3L9.8,8.9z"/>
        </svg>
        Activity
      </label>
      <div class="activity-btns">
        {#each ['moving', 'stopped', 'sleeping'] as act}
          <button class="act-btn" class:active={activity === act} onclick={() => activity = act}>
            <span class="act-icon">{activityIcons[act]}</span>
            <span class="act-text">{activityLabels[act]}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Weather Row -->
    <div class="weather-row">
      <div class="weather-col">
        <label class="cond-label mini">Precipitation</label>
        <div class="weather-btns">
          {#each ['none', 'light_rain', 'heavy_rain', 'snow'] as p}
            <button class="wx-btn" class:active={precipitation === p} onclick={() => precipitation = p}>
              {#if p === 'none'}☀️{:else if p === 'light_rain'}🌧️{:else if p === 'heavy_rain'}⛈️{:else}❄️{/if}
            </button>
          {/each}
        </div>
      </div>
      <div class="weather-col">
        <label class="cond-label mini">Wind</label>
        <div class="weather-btns">
          {#each ['none', 'light', 'moderate', 'strong'] as w}
            <button class="wx-btn" class:active={wind === w} onclick={() => wind = w}>
              {#if w === 'none'}🍃{:else if w === 'light'}💨{:else if w === 'moderate'}🌬️{:else}🌪️{/if}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Wet Toggle -->
    <div class="wet-section">
      <button class="wet-btn" class:wet={wetClothes} onclick={() => wetClothes = !wetClothes}>
        <span class="wet-dot"></span>
        <span class="wet-label">{wetClothes ? 'Clothes are WET' : 'Clothes are DRY'}</span>
        <svg class="wet-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          {#if wetClothes}
            <path d="M12,2c-5.33,4.55,-8,8.48,-8,11.8c0,4.98,3.8,8.2,8,8.2s8,-3.22,8,-8.2C20,10.48,17.33,6.55,12,2z"/>
          {:else}
            <path d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41z"/>
          {/if}
        </svg>
      </button>
    </div>
  </div>

  <!-- Warnings -->
  {#if warnings.length > 0}
    <div class="warnings-list">
      {#each warnings as w}
        <div class="warn-card {w.level}">
          <span class="warn-badge">{w.level === 'critical' ? '🚨' : w.level === 'warning' ? '⚠️' : '💡'}</span>
          <span class="warn-msg">{w.text}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Layer Recommendations -->
  <section class="layers-section">
    <div class="section-head">
      <div class="head-left">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <h3>Recommended Layers</h3>
      </div>
      <span class="mode-tag">
        {activityIcons[activity]} {activityLabels[activity]}
      </span>
    </div>

    {#if recommendedLayers.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 15h8M9 9h.01M15 9h.01"/>
        </svg>
        <p>Adjust conditions to get recommendations</p>
      </div>
    {:else}
      <div class="layer-stack">
        {#each recommendedLayers as layer, i (layer.id)}
          {@const cat = categoryColors[layer.category]}
          <div class="layer-item" style="--cat-bg: {cat.bg}; --cat-border: {cat.border}; --delay: {i * 50}ms">
            <div class="layer-marker">
              <span class="marker-num">{i + 1}</span>
            </div>
            <div class="layer-icon-box">
              <span>{layer.icon}</span>
            </div>
            <div class="layer-content">
              <div class="layer-top">
                <span class="layer-name">{layer.name}</span>
                <span class="layer-cat">{cat.label}</span>
              </div>
              <span class="layer-note">{layer.note}</span>
            </div>
            <div class="layer-badge {layer.status}">
              {layer.status === 'required' ? 'REQ' : 'OPT'}
            </div>
            {#if layer.sacred}
              <span class="sacred-tag" title="Sacred sleep layer">🛡️</span>
            {/if}
            {#if layer.staticOnly}
              <span class="static-tag" title="Static use only">⚡</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Tips -->
  {#if tips.length > 0}
    <div class="tips-panel">
      <div class="tips-head">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9,21c0,0.55 0.45,1 1,1h4c0.55,0 1,-0.45 1,-1v-1H9V21zM12,2C8.14,2 5,5.14 5,9c0,2.38 1.19,4.47 3,5.74V17c0,0.55 0.45,1 1,1h6c0.55,0 1,-0.45 1,-1v-2.26c1.81,-1.27 3,-3.36 3,-5.74C19,5.14 15.86,2 12,2z"/>
        </svg>
        <span>Tips</span>
      </div>
      <ul class="tips-list">
        {#each tips as tip}
          <li>{tip}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Core Principles -->
  <div class="principles-grid">
    <div class="principle-card">
      <span class="pr-icon">🌡️</span>
      <span class="pr-text">Start cold, warm up moving</span>
    </div>
    <div class="principle-card">
      <span class="pr-icon">💧</span>
      <span class="pr-text">Prevent sweat at all costs</span>
    </div>
    <div class="principle-card sacred">
      <span class="pr-icon">🛡️</span>
      <span class="pr-text">Sleep layers are SACRED</span>
    </div>
    <div class="principle-card">
      <span class="pr-icon">🍔</span>
      <span class="pr-text">Calories = Heat</span>
    </div>
    <div class="principle-card danger">
      <span class="pr-icon">⚠️</span>
      <span class="pr-text">Wet + Cold + Static = DANGER</span>
    </div>
    <div class="principle-card">
      <span class="pr-icon">🧥</span>
      <span class="pr-text">Puffy ON when you stop</span>
    </div>
  </div>

  <!-- Guide Link -->
  <a href="/guide/04-clothing-system" class="guide-link">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    Clothing System Guide
  </a>
</div>

<style>
  .layering-advisor {
    background: var(--bg, #faf9f6);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .layering-advisor.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .layering-advisor.danger {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
  }

  /* Header */
  .layer-header {
    position: relative;
    background: linear-gradient(135deg, #4a5d23 0%, #3a4a1c 50%, #2d3a15 100%);
    padding: 1.5rem;
    overflow: hidden;
  }

  .header-pattern {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(255,255,255,0.03) 20px,
      rgba(255,255,255,0.03) 40px
    );
  }

  .header-content {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .title-icon {
    color: rgba(255,255,255,0.8);
  }

  .header-text h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-text p {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
  }

  .temp-orb {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.3);
    border: 3px solid var(--zone-color);
    border-radius: 50%;
    transition: border-color 0.3s;
  }

  .orb-glow {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: var(--zone-color);
    opacity: 0.2;
    filter: blur(8px);
  }

  .orb-temp {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    position: relative;
  }

  .orb-zone {
    font-size: 0.55rem;
    font-weight: 700;
    color: var(--zone-color);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    position: relative;
  }

  /* Scenarios */
  .scenarios-bar {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
    overflow-x: auto;
  }

  .scenario-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 0.75rem;
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .scenario-chip:hover {
    background: #fff;
    border-color: var(--alpine);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .chip-icon {
    font-size: 0.9rem;
  }

  .chip-text {
    font-weight: 500;
  }

  /* Danger Banner */
  .danger-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(90deg, #dc2626, #b91c1c);
    color: #fff;
    position: relative;
    overflow: hidden;
  }

  .danger-pulse {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: dangerPulse 2s ease-in-out infinite;
  }

  @keyframes dangerPulse {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }

  .danger-icon {
    position: relative;
    animation: shake 0.5s ease-in-out infinite;
  }

  @keyframes shake {
    0%, 100% { transform: rotate(0); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }

  .danger-text {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .danger-text strong {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .danger-text span {
    font-size: 0.8rem;
    opacity: 0.9;
  }

  /* Condition Panel */
  .condition-panel {
    padding: 1.25rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .cond-section {
    margin-bottom: 1.25rem;
  }

  .cond-section:last-child {
    margin-bottom: 0;
  }

  .cond-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .cond-label.mini {
    font-size: 0.65rem;
    margin-bottom: 0.35rem;
  }

  .cond-label svg {
    opacity: 0.6;
  }

  /* Temperature Control */
  .temp-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .temp-track {
    flex: 1;
    position: relative;
    height: 12px;
    background: linear-gradient(to right, #dc2626, #f97316, #eab308, #22c55e, #16a34a);
    border-radius: 6px;
    overflow: hidden;
  }

  .track-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: transparent;
    pointer-events: none;
  }

  .temp-range {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    margin: 0;
  }

  .temp-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: #fff;
    border: 3px solid var(--pine);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .temp-readout {
    min-width: 60px;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    text-align: right;
    transition: color 0.3s;
  }

  .temp-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
    font-size: 0.6rem;
    font-weight: 600;
  }

  /* Activity Buttons */
  .activity-btns {
    display: flex;
    gap: 0.5rem;
  }

  .act-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .act-btn:hover {
    border-color: var(--alpine);
  }

  .act-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .act-icon {
    font-size: 1.5rem;
  }

  .act-text {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  /* Weather Row */
  .weather-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .weather-col {
    flex: 1;
  }

  .weather-btns {
    display: flex;
    gap: 0.35rem;
  }

  .wx-btn {
    flex: 1;
    padding: 0.5rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .wx-btn:hover {
    border-color: var(--alpine);
    transform: scale(1.05);
  }

  .wx-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  /* Wet Section */
  .wet-section {
    border-top: 2px solid var(--border);
    padding-top: 1rem;
  }

  .wet-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: #dcfce7;
    border: 2px solid #86efac;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .wet-btn.wet {
    background: #fee2e2;
    border-color: #f87171;
  }

  .wet-dot {
    width: 16px;
    height: 16px;
    background: #22c55e;
    border-radius: 50%;
    transition: background 0.2s;
  }

  .wet-btn.wet .wet-dot {
    background: #ef4444;
    animation: wetPulse 1s infinite;
  }

  @keyframes wetPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }

  .wet-label {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: left;
    color: #166534;
  }

  .wet-btn.wet .wet-label {
    color: #991b1b;
  }

  .wet-icon {
    color: #166534;
  }

  .wet-btn.wet .wet-icon {
    color: #991b1b;
  }

  /* Warnings */
  .warnings-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 1.25rem 1.25rem;
  }

  .warn-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .warn-card.critical {
    background: #fee2e2;
    border: 2px solid #f87171;
  }

  .warn-card.warning {
    background: #fef3c7;
    border: 2px solid #fbbf24;
  }

  .warn-card.info {
    background: #dcfce7;
    border: 2px solid #86efac;
  }

  .warn-badge {
    font-size: 1.25rem;
  }

  .warn-msg {
    flex: 1;
    font-weight: 500;
    color: var(--ink);
  }

  .warn-card.critical .warn-msg {
    color: #991b1b;
    font-weight: 700;
  }

  /* Layers Section */
  .layers-section {
    padding: 1.25rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--pine);
  }

  .head-left h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .mode-tag {
    padding: 0.35rem 0.75rem;
    background: var(--bg);
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine);
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--muted);
  }

  .empty-state svg {
    opacity: 0.3;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9rem;
  }

  .layer-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--cat-bg);
    border: 2px solid var(--cat-border);
    border-radius: 12px;
    position: relative;
    animation: slideIn 0.3s ease forwards;
    animation-delay: var(--delay);
    opacity: 0;
    transform: translateX(-10px);
  }

  @keyframes slideIn {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .layer-marker {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--cat-border);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .marker-num {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
  }

  .layer-icon-box {
    font-size: 1.5rem;
    width: 36px;
    text-align: center;
  }

  .layer-content {
    flex: 1;
    min-width: 0;
  }

  .layer-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }

  .layer-name {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
  }

  .layer-cat {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    background: var(--cat-border);
    color: #fff;
    border-radius: 4px;
  }

  .layer-note {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .layer-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .layer-badge.required {
    background: var(--pine);
    color: #fff;
  }

  .layer-badge.optional {
    background: var(--bg);
    color: var(--muted);
    border: 1px solid var(--border);
  }

  .sacred-tag, .static-tag {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 0.8rem;
    background: #fff;
    border-radius: 50%;
    padding: 2px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }

  /* Tips */
  .tips-panel {
    margin: 0 1.25rem 1.25rem;
    padding: 1rem;
    background: #f0fdf4;
    border: 2px solid #86efac;
    border-radius: 12px;
  }

  .tips-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: #166534;
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

  /* Principles Grid */
  .principles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    padding: 0 1.25rem 1.25rem;
  }

  .principle-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    font-size: 0.8rem;
  }

  .principle-card.sacred {
    background: #f3e8ff;
    border-color: #c084fc;
  }

  .principle-card.danger {
    background: #fee2e2;
    border-color: #f87171;
  }

  .pr-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .pr-text {
    color: var(--ink);
    font-weight: 500;
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--pine);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    transition: background 0.2s;
  }

  .guide-link:hover {
    background: var(--alpine);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .layer-header {
      padding: 1.25rem;
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .title-row {
      justify-content: center;
    }

    .scenarios-bar {
      padding: 0.5rem;
    }

    .scenario-chip {
      padding: 0.35rem 0.5rem;
      font-size: 0.7rem;
    }

    .chip-text {
      display: none;
    }

    .activity-btns {
      gap: 0.35rem;
    }

    .act-btn {
      padding: 0.6rem 0.5rem;
    }

    .act-text {
      font-size: 0.65rem;
    }

    .weather-row {
      flex-direction: column;
      gap: 0.75rem;
    }

    .layer-item {
      flex-wrap: wrap;
    }

    .layer-content {
      flex: 1 1 60%;
    }

    .principles-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
