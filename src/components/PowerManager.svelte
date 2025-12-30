<script>
  /** @type {{ trailContext: any }} */
  let { trailContext } = $props();

  // Active section
  let activeSection = $state('budget');

  // Common trail devices with typical power consumption
  const defaultDevices = [
    { id: 'phone', name: 'Smartphone', icon: '📱', dailyDraw: 3500, capacity: 4500, priority: 1, essential: true, chargeFreq: 'nightly' },
    { id: 'garmin', name: 'Garmin inReach', icon: '📡', dailyDraw: 70, capacity: 350, priority: 2, essential: true, chargeFreq: '5-7 days' },
    { id: 'watch', name: 'Smartwatch', icon: '⌚', dailyDraw: 200, capacity: 400, priority: 3, essential: false, chargeFreq: '2 days' },
    { id: 'headlamp', name: 'Headlamp', icon: '🔦', dailyDraw: 100, capacity: 500, priority: 4, essential: false, chargeFreq: '4-5 days' },
    { id: 'camera', name: 'Camera/GoPro', icon: '📷', dailyDraw: 500, capacity: 1500, priority: 5, essential: false, chargeFreq: '2-3 days' },
    { id: 'earbuds', name: 'Earbuds', icon: '🎧', dailyDraw: 50, capacity: 250, priority: 6, essential: false, chargeFreq: '4-5 days' },
  ];

  // User's device setup (localStorage)
  let devices = $state([...defaultDevices.slice(0, 4)]); // Start with phone, garmin, watch, headlamp
  let powerBankCapacity = $state(20000); // mAh
  let powerBankCurrent = $state(100); // percentage

  // Device battery levels
  let deviceLevels = $state({
    phone: 85,
    garmin: 70,
    watch: 60,
    headlamp: 80,
    camera: 100,
    earbuds: 100
  });

  // Days since last town charge
  let daysSinceTown = $state(2);

  // Power save mode
  let powerSaveMode = $state(false);

  // Load from localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('powerManager');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.devices) devices = parsed.devices;
          if (parsed.powerBankCapacity) powerBankCapacity = parsed.powerBankCapacity;
          if (parsed.powerBankCurrent !== undefined) powerBankCurrent = parsed.powerBankCurrent;
          if (parsed.deviceLevels) deviceLevels = { ...deviceLevels, ...parsed.deviceLevels };
          if (parsed.daysSinceTown !== undefined) daysSinceTown = parsed.daysSinceTown;
          if (parsed.powerSaveMode !== undefined) powerSaveMode = parsed.powerSaveMode;
        } catch (e) {}
      }
    }
  });

  // Save to localStorage
  $effect(() => {
    if (typeof window !== 'undefined') {
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
    if (powerBankCurrent >= 70) return { level: 'good', color: 'var(--alpine)', label: 'Good' };
    if (powerBankCurrent >= 35) return { level: 'moderate', color: 'var(--marker)', label: 'Moderate' };
    return { level: 'low', color: 'var(--terra)', label: 'Low' };
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
</script>

<div class="power-manager">
  <!-- Header with Bank Status -->
  <div class="manager-header">
    <div class="bank-visual">
      <div class="bank-icon">
        <div class="battery-outline">
          <div
            class="battery-fill"
            style="width: {powerBankCurrent}%; background: {bankStatus.color}"
          ></div>
        </div>
        <div class="battery-cap"></div>
      </div>
      <div class="bank-info">
        <span class="bank-pct">{powerBankCurrent}%</span>
        <span class="bank-mah">{availablePower.toLocaleString()} mAh</span>
      </div>
    </div>
    <div class="bank-stats">
      <div class="stat-item">
        <span class="stat-value">{daysRemaining}</span>
        <span class="stat-label">Days Left</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{dailyDraw.toLocaleString()}</span>
        <span class="stat-label">mAh/day</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{daysSinceTown}</span>
        <span class="stat-label">Days Out</span>
      </div>
    </div>
  </div>

  <!-- Power Bank Slider -->
  <div class="bank-slider-section">
    <div class="slider-header">
      <span class="slider-label">Power Bank Level</span>
      <span class="slider-value">{powerBankCurrent}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      bind:value={powerBankCurrent}
      class="bank-slider"
      style="--fill-color: {bankStatus.color}"
    />
    <div class="slider-marks">
      <span>Empty</span>
      <span class="mark-warning">35%</span>
      <span>Full</span>
    </div>
  </div>

  <!-- Power Save Alert -->
  {#if shouldPowerSave && !powerSaveMode}
    <button class="power-save-alert" onclick={() => { powerSaveMode = true; activeSection = 'save'; }}>
      <span class="alert-icon">⚡</span>
      <span class="alert-text">Low power - Enable Power Save Mode</span>
      <span class="alert-arrow">→</span>
    </button>
  {/if}

  <!-- Section Tabs -->
  <div class="section-tabs">
    <button
      class="section-tab"
      class:active={activeSection === 'budget'}
      onclick={() => activeSection = 'budget'}
    >
      <span class="tab-icon">📊</span>
      <span class="tab-text">Budget</span>
    </button>
    <button
      class="section-tab"
      class:active={activeSection === 'devices'}
      onclick={() => activeSection = 'devices'}
    >
      <span class="tab-icon">📱</span>
      <span class="tab-text">Devices</span>
    </button>
    <button
      class="section-tab"
      class:active={activeSection === 'tonight'}
      onclick={() => activeSection = 'tonight'}
    >
      <span class="tab-icon">🌙</span>
      <span class="tab-text">Tonight</span>
    </button>
    <button
      class="section-tab"
      class:active={activeSection === 'save'}
      class:alert={shouldPowerSave}
      onclick={() => activeSection = 'save'}
    >
      <span class="tab-icon">⚡</span>
      <span class="tab-text">Save</span>
    </button>
  </div>

  <!-- Budget Section -->
  {#if activeSection === 'budget'}
    <div class="budget-section">
      <div class="budget-card">
        <h4 class="card-title">Power Budget Summary</h4>

        <div class="budget-row">
          <span class="budget-label">Bank Capacity</span>
          <div class="budget-input-wrap">
            <input
              type="number"
              bind:value={powerBankCapacity}
              min="5000"
              max="50000"
              step="1000"
              class="budget-input"
            />
            <span class="budget-unit">mAh</span>
          </div>
        </div>

        <div class="budget-row">
          <span class="budget-label">Daily Draw</span>
          <span class="budget-value">{dailyDraw.toLocaleString()} mAh</span>
        </div>

        <div class="budget-row highlight">
          <span class="budget-label">Normal Use</span>
          <span class="budget-value big">{daysRemaining} days</span>
        </div>

        <div class="budget-row save">
          <span class="budget-label">Power Save Mode</span>
          <span class="budget-value">{daysRemainingSave} days <small>(+{daysRemainingSave - daysRemaining})</small></span>
        </div>
      </div>

      <div class="device-breakdown">
        <h4 class="card-title">Daily Power by Device</h4>
        {#each devices as device}
          <div class="breakdown-item">
            <span class="breakdown-icon">{device.icon}</span>
            <span class="breakdown-name">{device.name}</span>
            <div class="breakdown-bar-wrap">
              <div
                class="breakdown-bar"
                style="width: {(device.dailyDraw / dailyDraw) * 100}%"
              ></div>
            </div>
            <span class="breakdown-value">{device.dailyDraw.toLocaleString()}</span>
          </div>
        {/each}
        <div class="breakdown-total">
          <span>Total Daily</span>
          <span>{dailyDraw.toLocaleString()} mAh</span>
        </div>
      </div>

      <div class="budget-tip">
        <span class="tip-icon">💡</span>
        <span class="tip-text">
          At your current draw, a full 20,000 mAh bank lasts ~{Math.floor(20000 / dailyDraw)} days.
          With power save mode, that extends to ~{Math.floor(20000 / dailyDrawSave)} days.
        </span>
      </div>
    </div>
  {/if}

  <!-- Devices Section -->
  {#if activeSection === 'devices'}
    <div class="devices-section">
      <p class="section-intro">Select the devices you carry and track their battery levels.</p>

      <div class="device-grid">
        {#each defaultDevices as device}
          <div
            class="device-card"
            class:selected={hasDevice(device.id)}
            class:essential={device.essential}
          >
            <button
              class="device-toggle"
              onclick={() => toggleDevice(device.id)}
            >
              <span class="device-icon">{device.icon}</span>
              <span class="device-name">{device.name}</span>
              {#if device.essential}
                <span class="essential-badge">Essential</span>
              {/if}
              <span class="toggle-check">{hasDevice(device.id) ? '✓' : '+'}</span>
            </button>

            {#if hasDevice(device.id)}
              <div class="device-level">
                <div class="level-header">
                  <span class="level-label">Battery</span>
                  <span class="level-value">{deviceLevels[device.id]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={deviceLevels[device.id]}
                  oninput={(e) => updateLevel(device.id, parseInt(e.target.value))}
                  class="level-slider"
                />
              </div>
              <div class="device-meta">
                <span class="meta-item">{device.dailyDraw} mAh/day</span>
                <span class="meta-item">Charge: {device.chargeFreq}</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Tonight Section -->
  {#if activeSection === 'tonight'}
    <div class="tonight-section">
      <div class="tonight-header">
        <h4 class="card-title">Tonight's Charging Plan</h4>
        <div class="days-input">
          <label>Day</label>
          <input
            type="number"
            bind:value={daysSinceTown}
            min="0"
            max="14"
            class="days-num"
          />
        </div>
      </div>

      <div class="priority-list">
        {#each chargingPriorities as device, i}
          <div
            class="priority-item"
            class:needs-charge={device.needsCharge}
            class:low={device.level < 30}
          >
            <span class="priority-rank">#{i + 1}</span>
            <span class="priority-icon">{device.icon}</span>
            <div class="priority-info">
              <span class="priority-name">{device.name}</span>
              <span class="priority-freq">{device.chargeFreq}</span>
            </div>
            <div class="priority-level">
              <div class="mini-battery">
                <div
                  class="mini-fill"
                  style="width: {device.level}%"
                  class:low={device.level < 30}
                  class:mid={device.level >= 30 && device.level < 60}
                ></div>
              </div>
              <span class="level-text">{device.level}%</span>
            </div>
            {#if device.needsCharge}
              <span class="charge-badge">Charge</span>
            {:else}
              <span class="skip-badge">Skip</span>
            {/if}
          </div>
        {/each}
      </div>

      <div class="charging-rules">
        <h5 class="rules-title">Charging Priority Rules</h5>
        <div class="rule-tier never">
          <span class="tier-label">NEVER SACRIFICE</span>
          <span class="tier-devices">Phone, Garmin inReach</span>
        </div>
        <div class="rule-tier limit">
          <span class="tier-label">LIMIT IF NECESSARY</span>
          <span class="tier-devices">Smartwatch, Headlamp</span>
        </div>
        <div class="rule-tier drop">
          <span class="tier-label">FIRST TO DROP</span>
          <span class="tier-devices">Camera, Earbuds, Extras</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Power Save Section -->
  {#if activeSection === 'save'}
    <div class="save-section">
      <div class="save-toggle-card" class:active={powerSaveMode}>
        <div class="save-toggle-info">
          <span class="save-icon">⚡</span>
          <div class="save-text">
            <span class="save-title">Power Save Mode</span>
            <span class="save-desc">
              {powerSaveMode ? 'Active - Extends battery +1 day' : 'Reduces power consumption ~30%'}
            </span>
          </div>
        </div>
        <button
          class="save-btn"
          class:on={powerSaveMode}
          onclick={() => powerSaveMode = !powerSaveMode}
        >
          {powerSaveMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div class="triggers-card">
        <h4 class="card-title">When to Activate</h4>
        <div class="triggers-list">
          {#each powerSaveTriggers as trigger}
            <div class="trigger-item" class:triggered={trigger.check()}>
              <span class="trigger-indicator">{trigger.check() ? '⚠️' : '○'}</span>
              <span class="trigger-label">{trigger.label}</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="actions-card">
        <h4 class="card-title">Power Save Actions</h4>
        {#each powerSaveActions as category}
          <div class="action-category">
            <h5 class="action-device">{category.device}</h5>
            <ul class="action-list">
              {#each category.actions as action}
                <li class="action-item">{action}</li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>

      <div class="save-result">
        <span class="result-label">Power Save Result:</span>
        <span class="result-value">+{daysRemainingSave - daysRemaining} extra day{daysRemainingSave - daysRemaining !== 1 ? 's' : ''}</span>
      </div>
    </div>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/13-power-and-electronics" class="guide-link">
    <span class="guide-icon">📖</span>
    <span class="guide-text">Full Power & Electronics Guide</span>
    <span class="guide-arrow">→</span>
  </a>
</div>

<style>
  .power-manager {
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header */
  .manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #2d3436 0%, #1a1d1e 100%);
    border-radius: 16px;
    margin-bottom: 1rem;
    color: #fff;
  }

  .bank-visual {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .bank-icon {
    display: flex;
    align-items: center;
  }

  .battery-outline {
    width: 60px;
    height: 28px;
    border: 3px solid rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    padding: 3px;
    position: relative;
  }

  .battery-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .battery-cap {
    width: 6px;
    height: 12px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 0 3px 3px 0;
    margin-left: 2px;
  }

  .bank-info {
    display: flex;
    flex-direction: column;
  }

  .bank-pct {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .bank-mah {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .bank-stats {
    display: flex;
    gap: 1.5rem;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.6;
  }

  /* Bank Slider */
  .bank-slider-section {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .slider-label {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .slider-value {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--ink);
  }

  .bank-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    background: var(--bg);
    border-radius: 4px;
    outline: none;
  }

  .bank-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--fill-color, var(--alpine));
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .slider-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 0.25rem;
    font-size: 0.65rem;
    color: var(--muted);
  }

  .mark-warning {
    color: var(--terra);
  }

  /* Power Save Alert */
  .power-save-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba(200, 100, 50, 0.15) 0%, rgba(200, 100, 50, 0.08) 100%);
    border: 1px solid var(--terra);
    border-radius: 10px;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .power-save-alert:hover {
    background: linear-gradient(135deg, rgba(200, 100, 50, 0.2) 0%, rgba(200, 100, 50, 0.12) 100%);
  }

  .alert-icon {
    font-size: 1.25rem;
  }

  .alert-text {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--terra);
    text-align: left;
  }

  .alert-arrow {
    color: var(--terra);
  }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: var(--bg);
    padding: 0.35rem;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .section-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .section-tab:hover {
    color: var(--pine);
    background: rgba(166, 181, 137, 0.1);
  }

  .section-tab.active {
    background: #fff;
    color: var(--pine);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .section-tab.alert {
    color: var(--terra);
  }

  .section-tab.alert.active {
    background: rgba(200, 100, 50, 0.1);
    color: var(--terra);
  }

  .tab-icon {
    font-size: 1rem;
  }

  /* Budget Section */
  .budget-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .budget-card, .device-breakdown {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .card-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 1rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .budget-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .budget-row.highlight {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.2) 0%, rgba(166, 181, 137, 0.1) 100%);
  }

  .budget-row.save {
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.15) 0%, rgba(240, 224, 0, 0.08) 100%);
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

  .budget-value small {
    font-size: 0.75rem;
    color: var(--alpine);
  }

  .budget-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .budget-input {
    width: 100px;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    text-align: right;
  }

  .budget-unit {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bg);
  }

  .breakdown-item:last-of-type {
    border-bottom: none;
  }

  .breakdown-icon {
    font-size: 1.25rem;
    width: 30px;
    text-align: center;
  }

  .breakdown-name {
    flex: 1;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .breakdown-bar-wrap {
    width: 80px;
    height: 8px;
    background: var(--bg);
    border-radius: 4px;
    overflow: hidden;
  }

  .breakdown-bar {
    height: 100%;
    background: var(--alpine);
    border-radius: 4px;
  }

  .breakdown-value {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--muted);
    width: 50px;
    text-align: right;
  }

  .breakdown-total {
    display: flex;
    justify-content: space-between;
    padding-top: 0.75rem;
    margin-top: 0.5rem;
    border-top: 2px solid var(--border);
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--ink);
  }

  .budget-tip {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--bg);
    border-radius: 10px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Devices Section */
  .devices-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-intro {
    font-size: 0.9rem;
    color: var(--muted);
    margin: 0;
  }

  .device-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .device-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .device-card.selected {
    border-color: var(--alpine);
  }

  .device-card.essential {
    border-color: var(--pine);
  }

  .device-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    position: relative;
  }

  .device-icon {
    font-size: 2rem;
  }

  .device-name {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
  }

  .essential-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.5rem;
    font-weight: 700;
    padding: 0.15rem 0.35rem;
    background: var(--pine);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .toggle-check {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--bg);
    font-size: 0.85rem;
    color: var(--muted);
  }

  .device-card.selected .toggle-check {
    background: var(--alpine);
    color: #fff;
  }

  .device-level {
    padding: 0 1rem;
  }

  .level-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .level-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: var(--muted);
  }

  .level-value {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .level-slider {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    background: var(--bg);
    border-radius: 3px;
  }

  .level-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--alpine);
    cursor: pointer;
  }

  .device-meta {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--bg);
    margin-top: 0.5rem;
  }

  .meta-item {
    font-size: 0.65rem;
    color: var(--muted);
  }

  /* Tonight Section */
  .tonight-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tonight-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .days-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .days-num {
    width: 50px;
    padding: 0.4rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    text-align: center;
    font-family: Oswald, sans-serif;
  }

  .priority-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .priority-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
  }

  .priority-item.needs-charge {
    border-color: var(--alpine);
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.08) 0%, #fff 100%);
  }

  .priority-item.low {
    border-color: var(--terra);
    background: linear-gradient(135deg, rgba(200, 100, 50, 0.08) 0%, #fff 100%);
  }

  .priority-rank {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--muted);
    width: 24px;
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

  .priority-level {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mini-battery {
    width: 30px;
    height: 12px;
    background: var(--bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .mini-fill {
    height: 100%;
    background: var(--alpine);
    transition: width 0.2s ease;
  }

  .mini-fill.low {
    background: var(--terra);
  }

  .mini-fill.mid {
    background: var(--marker);
  }

  .level-text {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    width: 35px;
  }

  .charge-badge, .skip-badge {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .charge-badge {
    background: var(--alpine);
    color: #fff;
  }

  .skip-badge {
    background: var(--bg);
    color: var(--muted);
  }

  .charging-rules {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
  }

  .rules-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .rule-tier {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
  }

  .rule-tier.never {
    background: rgba(200, 100, 50, 0.1);
  }

  .rule-tier.limit {
    background: rgba(240, 224, 0, 0.15);
  }

  .rule-tier.drop {
    background: var(--bg);
  }

  .tier-label {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .rule-tier.never .tier-label { color: var(--terra); }
  .rule-tier.limit .tier-label { color: #8b7500; }
  .rule-tier.drop .tier-label { color: var(--muted); }

  .tier-devices {
    color: var(--ink);
  }

  /* Power Save Section */
  .save-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .save-toggle-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    transition: all 0.2s ease;
  }

  .save-toggle-card.active {
    border-color: var(--marker);
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.1) 0%, #fff 100%);
  }

  .save-toggle-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .save-icon {
    font-size: 1.75rem;
  }

  .save-text {
    display: flex;
    flex-direction: column;
  }

  .save-title {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .save-desc {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .save-btn {
    padding: 0.5rem 1.25rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 20px;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn.on {
    background: var(--marker);
    border-color: var(--marker);
    color: var(--ink);
  }

  .triggers-card, .actions-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .triggers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .trigger-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--bg);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .trigger-item.triggered {
    background: rgba(200, 100, 50, 0.1);
    color: var(--terra);
  }

  .trigger-indicator {
    width: 20px;
    text-align: center;
  }

  .action-category {
    margin-bottom: 1rem;
  }

  .action-category:last-child {
    margin-bottom: 0;
  }

  .action-device {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }

  .action-list {
    margin: 0;
    padding-left: 1.25rem;
    list-style: disc;
  }

  .action-item {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.25rem;
  }

  .save-result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15) 0%, rgba(166, 181, 137, 0.08) 100%);
    border-radius: 10px;
  }

  .result-label {
    font-size: 0.9rem;
    color: var(--ink);
  }

  .result-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--pine);
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    margin-top: 1.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .guide-link:hover {
    background: #fff;
    border-color: var(--alpine);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .guide-icon {
    font-size: 1.25rem;
  }

  .guide-text {
    flex: 1;
    margin-left: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .guide-arrow {
    color: var(--alpine);
    font-size: 1.25rem;
    transition: transform 0.2s ease;
  }

  .guide-link:hover .guide-arrow {
    transform: translateX(4px);
  }

  /* Mobile */
  @media (max-width: 640px) {
    .manager-header {
      flex-direction: column;
      gap: 1rem;
    }

    .bank-stats {
      width: 100%;
      justify-content: space-around;
    }

    .section-tabs {
      gap: 0.25rem;
    }

    .section-tab {
      padding: 0.6rem 0.5rem;
      font-size: 0.75rem;
    }

    .tab-text {
      display: none;
    }

    .tab-icon {
      font-size: 1.25rem;
    }

    .device-grid {
      grid-template-columns: 1fr;
    }

    .priority-item {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .priority-level {
      order: 5;
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
