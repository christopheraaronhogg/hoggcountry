<script>
  import { onMount } from 'svelte';

  /** @type {{ trailContext: any }} */
  let { trailContext } = $props();

  // Active section
  let activeSection = $state('budget');
  let mounted = $state(false);

  // Common trail devices with typical power consumption
  const defaultDevices = [
    { id: 'phone', name: 'Smartphone', icon: '📱', dailyDraw: 3500, capacity: 4500, priority: 1, essential: true, chargeFreq: 'nightly' },
    { id: 'garmin', name: 'Garmin inReach', icon: '📡', dailyDraw: 70, capacity: 350, priority: 2, essential: true, chargeFreq: '5-7 days' },
    { id: 'watch', name: 'Smartwatch', icon: '⌚', dailyDraw: 200, capacity: 400, priority: 3, essential: false, chargeFreq: '2 days' },
    { id: 'headlamp', name: 'Headlamp', icon: '🔦', dailyDraw: 100, capacity: 500, priority: 4, essential: false, chargeFreq: '4-5 days' },
    { id: 'camera', name: 'Camera/GoPro', icon: '📷', dailyDraw: 500, capacity: 1500, priority: 5, essential: false, chargeFreq: '2-3 days' },
    { id: 'earbuds', name: 'Earbuds', icon: '🎧', dailyDraw: 50, capacity: 250, priority: 6, essential: false, chargeFreq: '4-5 days' },
  ];

  // Default device levels
  const defaultDeviceLevels = {
    phone: 85,
    garmin: 70,
    watch: 60,
    headlamp: 80,
    camera: 100,
    earbuds: 100
  };

  // User's device setup (localStorage)
  let devices = $state([...defaultDevices.slice(0, 4)]); // Start with phone, garmin, watch, headlamp
  let powerBankCapacity = $state(30000); // mAh (Anker Nano 20K + Nitecore 10K)
  let powerBankCurrent = $state(100); // percentage

  // Device battery levels
  let deviceLevels = $state({ ...defaultDeviceLevels });

  // Days since last town charge
  let daysSinceTown = $state(2);

  // Power save mode
  let powerSaveMode = $state(false);

  // Reset to defaults function
  function resetToDefaults() {
    devices = [...defaultDevices.slice(0, 4)];
    powerBankCapacity = 30000;
    powerBankCurrent = 100;
    deviceLevels = { ...defaultDeviceLevels };
    daysSinceTown = 2;
    powerSaveMode = false;
    localStorage.removeItem('powerManager');
  }

  // Load from localStorage on mount (runs once, before save effect)
  onMount(() => {
    try {
      const saved = localStorage.getItem('powerManager');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate devices array
        if (Array.isArray(parsed.devices) && parsed.devices.length > 0 && parsed.devices.every(d => d && d.id && typeof d.dailyDraw === 'number')) {
          devices = parsed.devices;
        }
        if (typeof parsed.powerBankCapacity === 'number' && parsed.powerBankCapacity > 0) {
          powerBankCapacity = parsed.powerBankCapacity;
        }
        if (typeof parsed.powerBankCurrent === 'number' && parsed.powerBankCurrent >= 0 && parsed.powerBankCurrent <= 100) {
          powerBankCurrent = parsed.powerBankCurrent;
        }
        if (parsed.deviceLevels && typeof parsed.deviceLevels === 'object') {
          deviceLevels = { ...defaultDeviceLevels, ...parsed.deviceLevels };
        }
        if (typeof parsed.daysSinceTown === 'number') {
          daysSinceTown = parsed.daysSinceTown;
        }
        if (typeof parsed.powerSaveMode === 'boolean') {
          powerSaveMode = parsed.powerSaveMode;
        }
      }
    } catch (e) {
      // If localStorage is corrupted, reset to defaults
      console.warn('PowerManager: Corrupted localStorage, resetting to defaults');
      resetToDefaults();
    }
    mounted = true;
  });

  // Save to localStorage (only after mounted to prevent overwriting on init)
  $effect(() => {
    if (mounted) {
      localStorage.setItem('powerManager', JSON.stringify({
        devices,
        powerBankCapacity,
        powerBankCurrent,
        deviceLevels,
        daysSinceTown,
        powerSaveMode
      }));
    }
  });

  // Calculate daily power draw (mAh)
  let dailyDraw = $derived(devices.reduce((sum, d) => sum + d.dailyDraw, 0));

  // Calculate daily draw with power save mode (30% reduction)
  let dailyDrawSave = $derived(Math.round(dailyDraw * 0.7));

  // Available power in bank
  let availablePower = $derived(Math.round(powerBankCapacity * (powerBankCurrent / 100)));

  // Days of power remaining
  let daysRemaining = $derived(Math.floor(availablePower / dailyDraw));
  let daysRemainingSave = $derived(Math.floor(availablePower / dailyDrawSave));

  // Power bank status
  let bankStatus = $derived.by(() => {
    if (powerBankCurrent >= 70) return { level: 'good', color: '#4ade80', label: 'Good' };
    if (powerBankCurrent >= 35) return { level: 'moderate', color: '#fbbf24', label: 'Moderate' };
    return { level: 'low', color: '#ef4444', label: 'Critical' };
  });

  // Should trigger power save mode?
  let shouldPowerSave = $derived(powerBankCurrent < 35 || daysRemaining < 2);

  // Get device by id
  function getDevice(id) {
    return defaultDevices.find(d => d.id === id);
  }

  // Toggle device in setup
  function toggleDevice(deviceId) {
    const existing = devices.find(d => d.id === deviceId);
    if (existing) {
      devices = devices.filter(d => d.id !== deviceId);
    } else {
      const device = getDevice(deviceId);
      if (device) {
        devices = [...devices, device];
      }
    }
  }

  // Check if device is in setup
  function hasDevice(deviceId) {
    return devices.some(d => d.id === deviceId);
  }

  // Update device battery level
  function updateLevel(deviceId, level) {
    deviceLevels[deviceId] = Math.max(0, Math.min(100, level));
    deviceLevels = { ...deviceLevels };
  }

  // Get tonight's charging priorities
  let chargingPriorities = $derived.by(() => {
    return devices
      .filter(d => hasDevice(d.id))
      .map(d => ({
        ...d,
        level: deviceLevels[d.id] || 100,
        needsCharge: d.chargeFreq === 'nightly' || deviceLevels[d.id] < 40
      }))
      .sort((a, b) => {
        // Sort by: needs charge first, then by priority
        if (a.needsCharge && !b.needsCharge) return -1;
        if (!a.needsCharge && b.needsCharge) return 1;
        return a.priority - b.priority;
      });
  });

  // Power save triggers
  const powerSaveTriggers = [
    { id: 'bank', label: 'Battery bank below 35%', check: () => powerBankCurrent < 35 },
    { id: 'days', label: 'Less than 2 days to town', check: () => daysRemaining < 2 },
    { id: 'weather', label: 'Extended cold/rain expected', check: () => false },
    { id: 'service', label: 'No cell service 24+ hours', check: () => false }
  ];

  // Power save actions
  const powerSaveActions = [
    { device: 'Phone', actions: ['Low Power Mode ON', 'Brightness <40%', 'Delay uploads', 'Close background apps'] },
    { device: 'Smartwatch', actions: ['Disable activity tracking', 'Reduce notifications', 'Theater mode'] },
    { device: 'Garmin', actions: ['Tracking interval → 30 min', 'Disable weather updates'] },
    { device: 'Camera', actions: ['No video unless exceptional', 'Reduce photo frequency'] }
  ];

  // Animated segments for power gauge
  let gaugeSegments = $derived.by(() => {
    const segments = [];
    const total = 20;
    const filled = Math.round((powerBankCurrent / 100) * total);
    for (let i = 0; i < total; i++) {
      segments.push({
        filled: i < filled,
        critical: i < 7 && filled <= 7,
        warning: i >= 7 && i < 14 && filled <= 14 && filled > 7
      });
    }
    return segments;
  });
</script>

<div class="power-manager">
  <!-- Industrial Header with Power Gauge -->
  <header class="power-header">
    <div class="header-top">
      <div class="header-badge">
        <span class="badge-icon">⚡</span>
        <span class="badge-text">POWER STATION</span>
      </div>
      <div class="header-status" class:critical={bankStatus.level === 'low'} class:warning={bankStatus.level === 'moderate'}>
        <span class="status-dot"></span>
        <span class="status-text">{bankStatus.label}</span>
      </div>
    </div>

    <!-- Main Power Display -->
    <div class="power-display">
      <div class="gauge-section">
        <div class="gauge-ring">
          <svg viewBox="0 0 100 100" class="gauge-svg">
            <circle cx="50" cy="50" r="42" class="gauge-track" />
            <circle
              cx="50"
              cy="50"
              r="42"
              class="gauge-fill"
              style="stroke-dashoffset: {264 - (powerBankCurrent / 100) * 264}; stroke: {bankStatus.color}"
            />
          </svg>
          <div class="gauge-center">
            <span class="gauge-value">{powerBankCurrent}</span>
            <span class="gauge-unit">%</span>
          </div>
        </div>
        <div class="gauge-label">BANK CHARGE</div>
      </div>

      <div class="stats-panel">
        <div class="stat-block">
          <div class="stat-number">{availablePower.toLocaleString()}</div>
          <div class="stat-unit">mAh</div>
          <div class="stat-desc">Available</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-block highlight">
          <div class="stat-number">{daysRemaining}</div>
          <div class="stat-unit">days</div>
          <div class="stat-desc">Remaining</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-block">
          <div class="stat-number">{dailyDraw.toLocaleString()}</div>
          <div class="stat-unit">mAh/day</div>
          <div class="stat-desc">Draw Rate</div>
        </div>
      </div>
    </div>

    <!-- LED Segment Display -->
    <div class="segment-display">
      {#each gaugeSegments as seg, i}
        <div
          class="segment"
          class:filled={seg.filled}
          class:critical={seg.critical}
          class:warning={seg.warning}
          style="animation-delay: {i * 20}ms"
        ></div>
      {/each}
    </div>
  </header>

  <!-- Power Bank Slider Control -->
  <div class="slider-control">
    <div class="slider-header">
      <span class="slider-label">Adjust Power Level</span>
      <span class="slider-value">{powerBankCurrent}%</span>
    </div>
    <div class="slider-track-wrap">
      <input
        type="range"
        min="0"
        max="100"
        bind:value={powerBankCurrent}
        class="power-slider"
      />
      <div class="slider-fill" style="width: {powerBankCurrent}%; background: {bankStatus.color}"></div>
      <div class="slider-markers">
        <span class="marker critical">35%</span>
        <span class="marker warning">70%</span>
      </div>
    </div>
  </div>

  <!-- Power Save Alert -->
  {#if shouldPowerSave && !powerSaveMode}
    <button class="alert-banner" onclick={() => { powerSaveMode = true; activeSection = 'save'; }}>
      <div class="alert-pulse"></div>
      <span class="alert-icon">⚠️</span>
      <span class="alert-content">
        <span class="alert-title">LOW POWER WARNING</span>
        <span class="alert-desc">Enable Power Save Mode to extend battery life</span>
      </span>
      <span class="alert-action">ACTIVATE →</span>
    </button>
  {/if}

  <!-- Section Navigation -->
  <nav class="section-nav">
    <button
      class="nav-btn"
      class:active={activeSection === 'budget'}
      onclick={() => activeSection = 'budget'}
    >
      <span class="nav-icon">📊</span>
      <span class="nav-label">Budget</span>
    </button>
    <button
      class="nav-btn"
      class:active={activeSection === 'devices'}
      onclick={() => activeSection = 'devices'}
    >
      <span class="nav-icon">📱</span>
      <span class="nav-label">Devices</span>
    </button>
    <button
      class="nav-btn"
      class:active={activeSection === 'tonight'}
      onclick={() => activeSection = 'tonight'}
    >
      <span class="nav-icon">🌙</span>
      <span class="nav-label">Tonight</span>
    </button>
    <button
      class="nav-btn"
      class:active={activeSection === 'save'}
      class:alert={shouldPowerSave}
      onclick={() => activeSection = 'save'}
    >
      <span class="nav-icon">⚡</span>
      <span class="nav-label">Save</span>
      {#if shouldPowerSave}
        <span class="nav-alert-dot"></span>
      {/if}
    </button>
  </nav>

  <!-- Budget Section -->
  {#if activeSection === 'budget'}
    <section class="content-section">
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Power Budget</h3>
          <span class="panel-badge">Summary</span>
        </div>

        <div class="budget-grid">
          <div class="budget-item">
            <span class="budget-label">Bank Capacity</span>
            <div class="budget-input-group">
              <input
                type="number"
                bind:value={powerBankCapacity}
                min="5000"
                max="50000"
                step="1000"
                class="budget-input"
              />
              <span class="budget-suffix">mAh</span>
            </div>
          </div>

          <div class="budget-item">
            <span class="budget-label">Daily Draw</span>
            <span class="budget-value">{dailyDraw.toLocaleString()} mAh</span>
          </div>

          <div class="budget-item highlight">
            <span class="budget-label">Normal Use</span>
            <span class="budget-value big">{daysRemaining} days</span>
          </div>

          <div class="budget-item save-mode">
            <span class="budget-label">With Power Save</span>
            <span class="budget-value">{daysRemainingSave} days <small class="bonus">+{daysRemainingSave - daysRemaining}</small></span>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Power Breakdown</h3>
          <span class="panel-badge">By Device</span>
        </div>

        <div class="breakdown-list">
          {#each devices as device}
            <div class="breakdown-row">
              <span class="breakdown-icon">{device.icon}</span>
              <span class="breakdown-name">{device.name}</span>
              <div class="breakdown-bar">
                <div
                  class="breakdown-fill"
                  style="width: {(device.dailyDraw / dailyDraw) * 100}%"
                ></div>
              </div>
              <span class="breakdown-value">{device.dailyDraw}</span>
            </div>
          {/each}
        </div>

        <div class="breakdown-footer">
          <span class="footer-label">Total Daily Draw</span>
          <span class="footer-value">{dailyDraw.toLocaleString()} mAh</span>
        </div>
      </div>

      <div class="info-card">
        <span class="info-icon">💡</span>
        <p class="info-text">
          At your current draw, a full {powerBankCapacity.toLocaleString()} mAh bank lasts ~{Math.floor(powerBankCapacity / dailyDraw)} days.
          With power save mode, that extends to ~{Math.floor(powerBankCapacity / dailyDrawSave)} days.
        </p>
      </div>
    </section>
  {/if}

  <!-- Devices Section -->
  {#if activeSection === 'devices'}
    <section class="content-section">
      <p class="section-intro">Select your devices and track their battery levels</p>

      <div class="device-grid">
        {#each defaultDevices as device}
          <div
            class="device-card"
            class:active={hasDevice(device.id)}
            class:essential={device.essential}
          >
            <button class="device-toggle" onclick={() => toggleDevice(device.id)}>
              <div class="device-header">
                <span class="device-icon">{device.icon}</span>
                {#if device.essential}
                  <span class="essential-tag">ESSENTIAL</span>
                {/if}
              </div>
              <span class="device-name">{device.name}</span>
              <div class="device-check" class:checked={hasDevice(device.id)}>
                {hasDevice(device.id) ? '✓' : '+'}
              </div>
            </button>

            {#if hasDevice(device.id)}
              <div class="device-controls">
                <div class="level-display">
                  <span class="level-label">Battery</span>
                  <span class="level-percent">{deviceLevels[device.id]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={deviceLevels[device.id]}
                  oninput={(e) => updateLevel(device.id, parseInt(e.target.value))}
                  class="device-slider"
                />
                <div class="device-stats">
                  <span>{device.dailyDraw} mAh/day</span>
                  <span>Charge: {device.chargeFreq}</span>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Tonight Section -->
  {#if activeSection === 'tonight'}
    <section class="content-section">
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Tonight's Charging Plan</h3>
          <div class="day-counter">
            <label class="day-label">Day</label>
            <input
              type="number"
              bind:value={daysSinceTown}
              min="0"
              max="14"
              class="day-input"
            />
          </div>
        </div>

        <div class="priority-queue">
          {#each chargingPriorities as device, i}
            <div
              class="priority-card"
              class:needs-charge={device.needsCharge}
              class:critical={device.level < 30}
            >
              <div class="priority-rank">#{i + 1}</div>
              <span class="priority-icon">{device.icon}</span>
              <div class="priority-info">
                <span class="priority-name">{device.name}</span>
                <span class="priority-freq">{device.chargeFreq}</span>
              </div>
              <div class="priority-battery">
                <div class="battery-visual">
                  <div
                    class="battery-level"
                    class:low={device.level < 30}
                    class:mid={device.level >= 30 && device.level < 60}
                    style="width: {device.level}%"
                  ></div>
                </div>
                <span class="battery-pct">{device.level}%</span>
              </div>
              <div class="priority-action">
                {#if device.needsCharge}
                  <span class="action-tag charge">CHARGE</span>
                {:else}
                  <span class="action-tag skip">SKIP</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="rules-panel">
        <h4 class="rules-title">Charging Priority Rules</h4>
        <div class="rule-row critical">
          <span class="rule-badge">NEVER SACRIFICE</span>
          <span class="rule-devices">Phone, Garmin inReach</span>
        </div>
        <div class="rule-row warning">
          <span class="rule-badge">LIMIT IF NEEDED</span>
          <span class="rule-devices">Smartwatch, Headlamp</span>
        </div>
        <div class="rule-row optional">
          <span class="rule-badge">FIRST TO DROP</span>
          <span class="rule-devices">Camera, Earbuds, Extras</span>
        </div>
      </div>
    </section>
  {/if}

  <!-- Power Save Section -->
  {#if activeSection === 'save'}
    <section class="content-section">
      <div class="save-master-toggle" class:active={powerSaveMode}>
        <div class="toggle-info">
          <span class="toggle-icon">⚡</span>
          <div class="toggle-text">
            <span class="toggle-title">Power Save Mode</span>
            <span class="toggle-desc">
              {powerSaveMode ? 'Active — extends battery +' + (daysRemainingSave - daysRemaining) + ' day' : 'Reduces power consumption ~30%'}
            </span>
          </div>
        </div>
        <button
          class="toggle-switch"
          class:on={powerSaveMode}
          onclick={() => powerSaveMode = !powerSaveMode}
        >
          <span class="switch-track"></span>
          <span class="switch-thumb"></span>
          <span class="switch-label">{powerSaveMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Activation Triggers</h3>
        </div>
        <div class="triggers-grid">
          {#each powerSaveTriggers as trigger}
            <div class="trigger-card" class:triggered={trigger.check()}>
              <span class="trigger-indicator">{trigger.check() ? '⚠️' : '○'}</span>
              <span class="trigger-text">{trigger.label}</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Power Save Actions</h3>
        </div>
        <div class="actions-grid">
          {#each powerSaveActions as category}
            <div class="action-group">
              <h5 class="action-title">{category.device}</h5>
              <ul class="action-list">
                {#each category.actions as action}
                  <li class="action-item">{action}</li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>

      <div class="result-display">
        <span class="result-label">Power Save Bonus:</span>
        <span class="result-value">+{daysRemainingSave - daysRemaining} extra day{daysRemainingSave - daysRemaining !== 1 ? 's' : ''}</span>
      </div>
    </section>
  {/if}

  <!-- Footer with Guide Links and Reset -->
  <div class="footer-row">
    <div class="guide-links">
      <a href="/guide/10-power-and-electronics" class="guide-link chapter-link">
        <span class="link-icon">📚</span>
        <span class="link-text">Full Power Guide</span>
        <span class="link-arrow">→</span>
      </a>
      <a href="/guide#10-power-and-electronics" class="guide-link field-guide-link">
        <span class="link-icon">📖</span>
        <span class="link-text">Field Guide</span>
        <span class="link-arrow">→</span>
      </a>
    </div>
    <button class="reset-btn" onclick={() => { if (confirm('Reset all power settings to defaults?')) resetToDefaults(); }}>
      Reset
    </button>
  </div>
</div>

<style>
  .power-manager {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 100%;
  }

  /* Industrial Header */
  .power-header {
    background: linear-gradient(145deg, #1a1f2e 0%, #0d1117 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border: 2px solid #2d3748;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .header-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.08);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .badge-icon {
    font-size: 1rem;
  }

  .badge-text {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.8);
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.7rem;
    border-radius: 12px;
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .header-status.warning {
    background: rgba(251, 191, 36, 0.15);
    border-color: rgba(251, 191, 36, 0.3);
  }

  .header-status.critical {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s ease-in-out infinite;
  }

  .header-status.warning .status-dot { background: #fbbf24; }
  .header-status.critical .status-dot { background: #ef4444; animation: pulse 0.8s ease-in-out infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4ade80;
  }

  .header-status.warning .status-text { color: #fbbf24; }
  .header-status.critical .status-text { color: #ef4444; }

  /* Power Display */
  .power-display {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 1.25rem;
  }

  .gauge-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .gauge-ring {
    position: relative;
    width: 110px;
    height: 110px;
  }

  .gauge-svg {
    transform: rotate(-90deg);
  }

  .gauge-track {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 8;
  }

  .gauge-fill {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 264;
    transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
  }

  .gauge-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .gauge-value {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .gauge-unit {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .gauge-label {
    margin-top: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .stats-panel {
    flex: 1;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .stat-block {
    text-align: center;
  }

  .stat-number {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .stat-block.highlight .stat-number {
    font-size: 2rem;
    color: #4ade80;
  }

  .stat-unit {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }

  .stat-desc {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
  }

  /* LED Segment Display */
  .segment-display {
    display: flex;
    gap: 3px;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .segment {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    transition: all 0.2s ease;
  }

  .segment.filled {
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.5);
  }

  .segment.warning {
    background: #fbbf24;
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
  }

  .segment.critical {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
    animation: blink 0.8s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Slider Control */
  .slider-control {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .slider-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .slider-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .slider-track-wrap {
    position: relative;
    padding-bottom: 1.5rem;
  }

  .power-slider {
    width: 100%;
    height: 10px;
    -webkit-appearance: none;
    background: var(--bg);
    border-radius: 5px;
    position: relative;
    z-index: 2;
  }

  .power-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--pine);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .slider-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 10px;
    border-radius: 5px;
    pointer-events: none;
    z-index: 1;
    transition: width 0.1s ease, background 0.2s ease;
  }

  .slider-markers {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
  }

  .marker {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--muted);
  }

  .marker.critical {
    position: absolute;
    left: 35%;
    transform: translateX(-50%);
    color: #ef4444;
  }

  .marker.warning {
    position: absolute;
    left: 70%;
    transform: translateX(-50%);
    color: #fbbf24;
  }

  /* Alert Banner */
  .alert-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%);
    border: 2px solid #ef4444;
    border-radius: 14px;
    margin-bottom: 1rem;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .alert-banner:hover {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.1) 100%);
    transform: translateY(-1px);
  }

  .alert-pulse {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #ef4444;
    animation: alertPulse 1.5s ease-in-out infinite;
  }

  @keyframes alertPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .alert-icon {
    font-size: 1.5rem;
  }

  .alert-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .alert-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #ef4444;
    letter-spacing: 0.05em;
  }

  .alert-desc {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .alert-action {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: #ef4444;
    white-space: nowrap;
  }

  /* Section Navigation */
  .section-nav {
    display: flex;
    gap: 0.5rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 0.4rem;
    margin-bottom: 1.5rem;
  }

  .nav-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.6);
  }

  .nav-btn.active {
    background: #fff;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }

  .nav-btn.alert .nav-icon {
    animation: pulse 1s ease-in-out infinite;
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  .nav-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
  }

  .nav-btn.active .nav-label {
    color: var(--pine);
  }

  .nav-alert-dot {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    animation: pulse 1s ease-in-out infinite;
  }

  /* Content Sections */
  .content-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-intro {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0 0 0.5rem;
  }

  /* Panel Cards */
  .panel {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.08) 0%, transparent 100%);
    border-bottom: 1px solid var(--border);
  }

  .panel-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .panel-badge {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    background: var(--alpine);
    color: #fff;
    border-radius: 10px;
    letter-spacing: 0.05em;
  }

  /* Budget Grid */
  .budget-grid {
    display: grid;
    gap: 0.75rem;
    padding: 1.25rem;
  }

  .budget-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 1rem;
    background: var(--bg);
    border-radius: 10px;
  }

  .budget-item.highlight {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.2) 0%, rgba(166, 181, 137, 0.1) 100%);
    border: 1px solid var(--alpine);
  }

  .budget-item.save-mode {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%);
  }

  .budget-label {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .budget-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .budget-value.big {
    font-size: 1.25rem;
    color: var(--pine);
  }

  .bonus {
    font-size: 0.75rem;
    color: var(--alpine);
    margin-left: 0.25rem;
  }

  .budget-input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .budget-input {
    width: 90px;
    padding: 0.5rem 0.6rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    text-align: right;
    background: #fff;
  }

  .budget-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .budget-suffix {
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Breakdown List */
  .breakdown-list {
    padding: 1rem 1.25rem;
  }

  .breakdown-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--bg);
  }

  .breakdown-row:last-child {
    border-bottom: none;
  }

  .breakdown-icon {
    font-size: 1.25rem;
    width: 32px;
    text-align: center;
  }

  .breakdown-name {
    flex: 1;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .breakdown-bar {
    width: 80px;
    height: 8px;
    background: var(--bg);
    border-radius: 4px;
    overflow: hidden;
  }

  .breakdown-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .breakdown-value {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--muted);
    width: 50px;
    text-align: right;
  }

  .breakdown-footer {
    display: flex;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: var(--bg);
    border-top: 2px solid var(--border);
  }

  .footer-label {
    font-size: 0.85rem;
    color: var(--ink);
    font-weight: 500;
  }

  .footer-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--pine);
  }

  /* Info Card */
  .info-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.1) 0%, rgba(166, 181, 137, 0.05) 100%);
    border: 1px solid var(--alpine);
    border-radius: 12px;
  }

  .info-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .info-text {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
    margin: 0;
  }

  /* Device Grid */
  .device-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .device-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .device-card.active {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(166, 181, 137, 0.15);
  }

  .device-card.essential.active {
    border-color: var(--pine);
  }

  .device-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 1.25rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .device-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .device-icon {
    font-size: 2rem;
  }

  .essential-tag {
    font-size: 0.5rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    background: var(--pine);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .device-name {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }

  .device-check {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border-radius: 50%;
    font-size: 0.9rem;
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .device-check.checked {
    background: var(--alpine);
    color: #fff;
  }

  .device-controls {
    padding: 0 1rem 1rem;
  }

  .level-display {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .level-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--muted);
  }

  .level-percent {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .device-slider {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    background: var(--bg);
    border-radius: 3px;
    margin-bottom: 0.5rem;
  }

  .device-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--alpine);
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .device-stats {
    display: flex;
    justify-content: space-between;
    padding: 0.6rem;
    background: var(--bg);
    border-radius: 8px;
    font-size: 0.65rem;
    color: var(--muted);
  }

  /* Priority Queue */
  .priority-queue {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
  }

  .priority-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .priority-card.needs-charge {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.1) 0%, #fff 100%);
    border-color: var(--alpine);
  }

  .priority-card.critical {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, #fff 100%);
    border-color: #ef4444;
  }

  .priority-rank {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--muted);
    width: 28px;
  }

  .priority-icon {
    font-size: 1.25rem;
  }

  .priority-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .priority-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
  }

  .priority-freq {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .priority-battery {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .battery-visual {
    width: 36px;
    height: 14px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 4px;
    padding: 2px;
    position: relative;
  }

  .battery-visual::after {
    content: '';
    position: absolute;
    right: -5px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 8px;
    background: var(--border);
    border-radius: 0 2px 2px 0;
  }

  .battery-level {
    height: 100%;
    background: var(--alpine);
    border-radius: 2px;
    transition: width 0.2s ease;
  }

  .battery-level.low { background: #ef4444; }
  .battery-level.mid { background: #fbbf24; }

  .battery-pct {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    width: 35px;
  }

  .priority-action {
    margin-left: auto;
  }

  .action-tag {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    letter-spacing: 0.05em;
  }

  .action-tag.charge {
    background: var(--alpine);
    color: #fff;
  }

  .action-tag.skip {
    background: var(--bg);
    color: var(--muted);
    border: 1px solid var(--border);
  }

  /* Rules Panel */
  .rules-panel {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .rules-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 1rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .rule-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .rule-row.critical {
    background: rgba(239, 68, 68, 0.1);
  }

  .rule-row.warning {
    background: rgba(251, 191, 36, 0.1);
  }

  .rule-row.optional {
    background: var(--bg);
  }

  .rule-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .rule-row.critical .rule-badge { color: #ef4444; }
  .rule-row.warning .rule-badge { color: #b45309; }
  .rule-row.optional .rule-badge { color: var(--muted); }

  .rule-devices {
    font-size: 0.8rem;
    color: var(--ink);
  }

  /* Day Counter */
  .day-counter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .day-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .day-input {
    width: 50px;
    padding: 0.4rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .day-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  /* Power Save Master Toggle */
  .save-master-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    transition: all 0.2s ease;
  }

  .save-master-toggle.active {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, #fff 100%);
    border-color: #fbbf24;
  }

  .toggle-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toggle-icon {
    font-size: 2rem;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
  }

  .toggle-title {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .toggle-desc {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .toggle-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-switch.on {
    background: #fbbf24;
    border-color: #fbbf24;
  }

  .switch-track {
    width: 36px;
    height: 20px;
    background: var(--border);
    border-radius: 10px;
    position: relative;
    transition: background 0.2s ease;
  }

  .toggle-switch.on .switch-track {
    background: rgba(255, 255, 255, 0.4);
  }

  .switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.on .switch-thumb {
    transform: translateX(16px);
  }

  .switch-label {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
    min-width: 28px;
  }

  .toggle-switch.on .switch-label {
    color: var(--ink);
  }

  /* Triggers Grid */
  .triggers-grid {
    display: grid;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
  }

  .trigger-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .trigger-card.triggered {
    background: rgba(239, 68, 68, 0.1);
  }

  .trigger-indicator {
    font-size: 1rem;
    width: 24px;
    text-align: center;
    color: var(--muted);
  }

  .trigger-card.triggered .trigger-indicator {
    animation: pulse 1s ease-in-out infinite;
  }

  .trigger-text {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .trigger-card.triggered .trigger-text {
    color: #ef4444;
    font-weight: 500;
  }

  /* Actions Grid */
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem 1.25rem;
  }

  .action-group {
    padding: 0.75rem;
    background: var(--bg);
    border-radius: 10px;
  }

  .action-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .action-list {
    margin: 0;
    padding-left: 1rem;
    list-style: disc;
  }

  .action-item {
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 0.2rem;
    line-height: 1.4;
  }

  /* Result Display */
  .result-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.08) 100%);
    border: 2px solid #4ade80;
    border-radius: 14px;
  }

  .result-label {
    font-size: 0.9rem;
    color: var(--ink);
    font-weight: 500;
  }

  .result-value {
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #16a34a;
  }

  /* Footer Row */
  .footer-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  /* Guide Links */
  .guide-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    flex: 1;
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
    min-width: 140px;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .field-guide-link {
    flex: 0 0 auto;
    min-width: 120px;
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

  .reset-btn {
    padding: 1rem 1.25rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 14px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reset-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .power-display {
      flex-direction: column;
      gap: 1.25rem;
    }

    .stats-panel {
      width: 100%;
    }

    .nav-label {
      display: none;
    }

    .nav-icon {
      font-size: 1.35rem;
    }

    .device-grid {
      grid-template-columns: 1fr;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }

    .priority-card {
      flex-wrap: wrap;
    }

    .priority-battery {
      order: 5;
      width: 100%;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
  }
</style>
