<script>
  import { slide } from 'svelte/transition';
  import gearData from '../data/gearRecommendations.json';
  import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

  let { trailContext = {} } = $props();

  loadCharacter();

  // Core state (Character-driven)
  let mounted = $state(false);
  const _legacyBudget = character.equipment.recommendations.gearBudget.budget; // backward-compat for early v1
  let budget = $state(character.equipment.recommendations.gearBudget.totalBudget ?? _legacyBudget ?? 1500);
  let mode = $state(character.equipment.recommendations.gearBudget.mode ?? 'value'); // 'value' | 'weight' | 'durability'
  let season = $state(character.equipment.recommendations.gearBudget.season ?? '3-season');
  let shelterPref = $state(character.equipment.recommendations.gearBudget.shelterPref ?? 'tent');

  // UI state
  let expandedCategory = $state(null);
  let showMethodology = $state(false);
  let activeTab = $state('loadout');
  let selectingCategory = $state(null); // Category being browsed for alternatives

  // User overrides - manually selected items by category
  let userOverrides = $state(character.equipment.slots.overridesByCategory || {});

  mounted = true;

  // Lock body scroll when modal is open
  $effect(() => {
    if (selectingCategory) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  });

  // Persist to unified Character model
  $effect(() => {
    if (!mounted) return;

    updateCharacter({
      equipment: {
        recommendations: {
          gearBudget: { totalBudget: budget, mode, season, shelterPref },
        },
        slots: {
          overridesByCategory: userOverrides,
        },
      },
    });
  });

  // Get budget tier
  function getBudgetTier(budget) {
    if (budget < 800) return 'budget';
    if (budget < 1500) return 'mid';
    if (budget < 2500) return 'premium';
    return 'luxury';
  }

  // Category budget allocation (13 categories = 100%)
  const CATEGORY_BUDGETS = {
    backpack: 0.14,
    shelter: 0.20,
    sleepBag: 0.15,
    sleepPad: 0.06,
    insulation: 0.07,
    rainGear: 0.05,
    footwear: 0.08,
    kitchen: 0.06,
    water: 0.04,
    electronics: 0.06,
    safety: 0.03,
    trekkingPoles: 0.04,
    socks: 0.02
  };

  // Score item based on mode
  function scoreItem(item, mode, targetTier) {
    const weights = {
      value: { value: 0.5, weight: 0.25, durability: 0.25 },
      weight: { value: 0.2, weight: 0.6, durability: 0.2 },
      durability: { value: 0.2, weight: 0.2, durability: 0.6 }
    }[mode];

    const baseScore = (
      item.valueScore * weights.value +
      (11 - item.weight / gearData.categories[item.category]?.avgWeight * 5) * weights.weight +
      item.durabilityScore * weights.durability
    );

    // Tier affinity bonus
    const tiers = ['budget', 'mid', 'premium', 'luxury'];
    const itemTierIdx = tiers.indexOf(item.tier);
    const targetTierIdx = tiers.indexOf(targetTier);
    const tierDistance = Math.abs(itemTierIdx - targetTierIdx);
    const tierBonus = tierDistance === 0 ? 1.0 : tierDistance === 1 ? 0.85 : 0.6;

    // Thru-hike viability penalty - items marked as not viable get heavily penalized
    const viabilityPenalty = item.thruHikeViable === false ? 0.3 : 1.0;

    return baseScore * tierBonus * viabilityPenalty;
  }

  // Get all items for a category (for browsing alternatives)
  function getCategoryItems(category) {
    return gearData.items
      .filter(item => item.category === category)
      .sort((a, b) => a.price - b.price);
  }

  // Select an item manually (override recommendation)
  function selectItem(category, itemId) {
    userOverrides = { ...userOverrides, [category]: itemId };
    selectingCategory = null;
  }

  // Clear manual override for category
  function clearOverride(category) {
    const newOverrides = { ...userOverrides };
    delete newOverrides[category];
    userOverrides = newOverrides;
  }

  // Get retailer from URL for buy buttons
  function getRetailer(url) {
    if (!url) return { name: 'View Product', icon: '🔗' };
    if (url.includes('amazon.com')) return { name: 'Amazon', icon: '📦' };
    if (url.includes('walmart.com')) return { name: 'Walmart', icon: '🏪' };
    if (url.includes('rei.com')) return { name: 'REI', icon: '⛰️' };
    if (url.includes('backcountry.com')) return { name: 'Backcountry', icon: '🏔️' };
    if (url.includes('zpacks.com')) return { name: 'Zpacks', icon: '🎒' };
    if (url.includes('gossamergear.com')) return { name: 'Gossamer', icon: '🪶' };
    if (url.includes('hyperlitemountaingear.com')) return { name: 'HMG', icon: '💎' };
    if (url.includes('enlightenedequipment.com')) return { name: 'EE', icon: '🛏️' };
    if (url.includes('katabaticgear.com')) return { name: 'Katabatic', icon: '🌙' };
    if (url.includes('hammockgear.com')) return { name: 'HG', icon: '🌲' };
    if (url.includes('ugqoutdoor.com')) return { name: 'UGQ', icon: '🏕️' };
    if (url.includes('durstongear.com')) return { name: 'Durston', icon: '⛺' };
    if (url.includes('osprey.com')) return { name: 'Osprey', icon: '🦅' };
    if (url.includes('bigagnes.com')) return { name: 'Big Agnes', icon: '🏔️' };
    if (url.includes('granitegear.com')) return { name: 'Granite Gear', icon: '🪨' };
    if (url.includes('thermarest.com')) return { name: 'Therm-a-Rest', icon: '🔥' };
    if (url.includes('nemoequipment.com')) return { name: 'Nemo', icon: '🐟' };
    if (url.includes('kelty.com')) return { name: 'Kelty', icon: '🏕️' };
    if (url.includes('patagonia.com')) return { name: 'Patagonia', icon: '🧥' };
    if (url.includes('arcteryx.com')) return { name: "Arc'teryx", icon: '🏔️' };
    if (url.includes('montbell.')) return { name: 'Montbell', icon: '🗾' };
    if (url.includes('outdoorresearch.com')) return { name: 'OR', icon: '🔬' };
    if (url.includes('mountainhardwear.com')) return { name: 'MHW', icon: '⛰️' };
    if (url.includes('westernmountaineering.com')) return { name: 'WM', icon: '🏔️' };
    if (url.includes('decathlon.com')) return { name: 'Decathlon', icon: '🏃' };
    if (url.includes('altrarunning.com')) return { name: 'Altra', icon: '👟' };
    if (url.includes('brooksrunning.com')) return { name: 'Brooks', icon: '🏃' };
    if (url.includes('hoka.com')) return { name: 'HOKA', icon: '👟' };
    if (url.includes('sawyer.com')) return { name: 'Sawyer', icon: '💧' };
    if (url.includes('katadyn.com')) return { name: 'Katadyn', icon: '💧' };
    if (url.includes('msrgear.com')) return { name: 'MSR', icon: '⛺' };
    if (url.includes('sotooutdoors.com')) return { name: 'Soto', icon: '🔥' };
    if (url.includes('nitecorestore.com')) return { name: 'Nitecore', icon: '🔦' };
    if (url.includes('petzl.com')) return { name: 'Petzl', icon: '🔦' };
    if (url.includes('anker.com')) return { name: 'Anker', icon: '🔋' };
    if (url.includes('froggtoggs.com')) return { name: 'Frogg Toggs', icon: '🐸' };
    if (url.includes('ula-equipment.com')) return { name: 'ULA', icon: '🎒' };
    if (url.includes('cumulus.equipment')) return { name: 'Cumulus', icon: '☁️' };
    if (url.includes('klymit.com')) return { name: 'Klymit', icon: '🛏️' };
    if (url.includes('toaksoutdoor.com')) return { name: 'TOAKS', icon: '🍳' };
    if (url.includes('adventuremedicalkits.com')) return { name: 'AMK', icon: '🩹' };
    if (url.includes('thetentlab.com')) return { name: 'TentLab', icon: '🏕️' };
    if (url.includes('surviveoutdoorslonger.com')) return { name: 'SOL', icon: '🆘' };
    if (url.includes('aquamira.com')) return { name: 'Aquamira', icon: '💧' };
    return { name: 'Buy Direct', icon: '🛒' };
  }

  // Build recommendation
  function buildRecommendation(budget, mode, season, shelterPref) {
    const tier = getBudgetTier(budget);
    const items = gearData.items;
    const selected = [];

    // For each category, find best item within budget allocation
    Object.keys(CATEGORY_BUDGETS).forEach(category => {
      // Check if user has manually selected an item for this category
      if (userOverrides[category]) {
        const overrideItem = items.find(i => i.id === userOverrides[category]);
        if (overrideItem) {
          selected.push({ ...overrideItem, isOverride: true });
          return;
        }
      }

      const categoryBudget = budget * CATEGORY_BUDGETS[category] * 1.3; // 30% flexibility

      // Filter candidates
      let candidates = items.filter(item => {
        if (item.category !== category) return false;
        if (item.price > categoryBudget) return false;

        // Season filter
        if (item.season && item.season !== 'both' && item.season !== season) return false;

        // Shelter type filter
        if (category === 'shelter' && item.shelterType && item.shelterType !== shelterPref) return false;

        return true;
      });

      // Score and sort
      candidates = candidates.map(item => ({
        ...item,
        score: scoreItem(item, mode, tier)
      })).sort((a, b) => b.score - a.score);

      // Select best, or best available if none in budget
      if (candidates.length > 0) {
        selected.push(candidates[0]);
      } else {
        // Fall back to cheapest in category
        const fallback = items
          .filter(i => i.category === category)
          .sort((a, b) => a.price - b.price)[0];
        if (fallback) selected.push({ ...fallback, score: 0 });
      }
    });

    return selected;
  }

  // Derived values
  let budgetTier = $derived(getBudgetTier(budget));
  let recommendation = $derived(buildRecommendation(budget, mode, season, shelterPref));
  let totalCost = $derived(recommendation.reduce((sum, item) => sum + item.price, 0));
  let totalWeightOz = $derived(recommendation.reduce((sum, item) => sum + item.weight, 0));
  let totalWeightLbs = $derived(totalWeightOz / 16);
  let remainingBudget = $derived(budget - totalCost);
  let budgetUsedPercent = $derived(Math.min(100, (totalCost / budget) * 100));

  let weightClass = $derived.by(() => {
    if (totalWeightLbs < 10) return { label: 'Ultralight', color: '#22c55e', icon: '🪶', desc: 'Sub-10lb base weight. Elite level.' };
    if (totalWeightLbs < 15) return { label: 'Lightweight', color: '#84cc16', icon: '✓', desc: 'Great weight. Sustainable miles.' };
    if (totalWeightLbs < 20) return { label: 'Traditional', color: '#eab308', icon: '⚖️', desc: 'Average pack weight.' };
    return { label: 'Heavy', color: '#ef4444', icon: '⚠️', desc: 'Consider lighter options.' };
  });

  // Group items by category for display
  let itemsByCategory = $derived(
    recommendation.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {})
  );

  // Format price
  function formatPrice(price) {
    return '$' + price.toLocaleString();
  }

  // Format weight
  function formatWeight(oz) {
    if (oz < 16) return oz.toFixed(1) + ' oz';
    return (oz / 16).toFixed(1) + ' lbs';
  }

  // Toggle category expansion
  function toggleCategory(category) {
    expandedCategory = expandedCategory === category ? null : category;
  }

  // Mode labels
  const MODE_LABELS = {
    value: { label: 'Best Value', icon: '💰', desc: 'Maximize quality per dollar' },
    weight: { label: 'Lightest', icon: '🪶', desc: 'Minimize pack weight' },
    durability: { label: 'Most Durable', icon: '🛡️', desc: 'Built to last' }
  };

  // Tier info
  let tierInfo = $derived(gearData.tiers[budgetTier]);

  // Alternatives for currently selecting category
  let categoryAlternatives = $derived.by(() => {
    if (!selectingCategory) return [];
    return getCategoryItems(selectingCategory);
  });

  // Count user overrides
  let overrideCount = $derived(Object.keys(userOverrides).length);
</script>

<div class="gear-builder">
  <!-- Items count strip -->
  <header class="builder-header">
    <div class="header-stat">
      <span class="stat-value">{recommendation.length}</span>
      <span class="stat-label">items</span>
    </div>
  </header>

  <!-- Beta Disclaimer -->
  <div class="beta-banner">
    <span class="beta-icon">🚧</span>
    <div class="beta-content">
      <strong>Work in Progress</strong>
      <p>We're actively verifying product links and prices. Some links may be outdated. Always confirm pricing before purchase.</p>
    </div>
  </div>

  <!-- Budget Input -->
  <section class="input-section">
    <div class="budget-control">
      <div class="budget-header">
        <label class="section-label" for="budget-gear-total-budget">Total Budget</label>
        <span class="budget-display">{formatPrice(budget)}</span>
      </div>
      <input
        id="budget-gear-total-budget"
        type="range"
        min="300"
        max="5000"
        step="50"
        bind:value={budget}
        class="budget-slider"
      />
      <div class="budget-ticks">
        <span>$300</span>
        <span>$1,000</span>
        <span>$2,000</span>
        <span>$3,500</span>
        <span>$5,000</span>
      </div>
      <div class="tier-badge" style="--tier-color: {budgetTier === 'luxury' ? '#8b5cf6' : budgetTier === 'premium' ? '#22c55e' : budgetTier === 'mid' ? '#3b82f6' : '#f59e0b'}">
        {tierInfo?.label || 'Budget'} Tier: {tierInfo?.range || '$300-800'}
      </div>
    </div>

    <!-- Mode Selector -->
    <div class="mode-control">
      <div class="section-label">Optimization Mode</div>
      <div class="mode-buttons">
        {#each Object.entries(MODE_LABELS) as [key, info]}
          <button
            class="mode-btn"
            class:active={mode === key}
            onclick={() => mode = key}
          >
            <span class="mode-icon">{info.icon}</span>
            <span class="mode-label">{info.label}</span>
          </button>
        {/each}
      </div>
      <p class="mode-desc">{MODE_LABELS[mode].desc}</p>
    </div>

    <!-- Options Row -->
    <div class="options-row">
      <div class="option">
        <label for="budget-gear-season">Season</label>
        <select id="budget-gear-season" bind:value={season}>
          <option value="3-season">3-Season</option>
          <option value="4-season">4-Season</option>
          <option value="both">Year-Round</option>
        </select>
      </div>
      <div class="option">
        <label for="budget-gear-shelter">Shelter Type</label>
        <select id="budget-gear-shelter" bind:value={shelterPref}>
          <option value="tent">Tent</option>
          <option value="tarp">Tarp</option>
          <option value="hammock">Hammock</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Results Hero -->
  <section class="results-hero">
    <div class="hero-ring">
      <svg viewBox="0 0 100 100" class="ring-svg">
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="var(--border)"
          stroke-width="8"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="var(--alpine)"
          stroke-width="8"
          stroke-dasharray="{budgetUsedPercent * 2.83} 283"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
          class="ring-progress"
        />
      </svg>
      <div class="ring-content">
        <span class="ring-value">{formatPrice(totalCost)}</span>
        <span class="ring-label">of {formatPrice(budget)}</span>
      </div>
    </div>

    <div class="hero-stats">
      <div class="hero-stat">
        <span class="stat-icon" style="color: {weightClass.color}">{weightClass.icon}</span>
        <div class="stat-info">
          <span class="stat-value">{totalWeightLbs.toFixed(1)} lbs</span>
          <span class="stat-label">Base Weight</span>
        </div>
      </div>
      <div class="hero-stat">
        <span class="stat-icon" style="color: {remainingBudget >= 0 ? '#22c55e' : '#ef4444'}">
          {remainingBudget >= 0 ? '✓' : '⚠️'}
        </span>
        <div class="stat-info">
          <span class="stat-value">{formatPrice(Math.abs(remainingBudget))}</span>
          <span class="stat-label">{remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}</span>
        </div>
      </div>
    </div>

    <div class="weight-class-badge" style="background: {weightClass.color}20; border-color: {weightClass.color}">
      <span style="color: {weightClass.color}">{weightClass.label}</span>
      <span class="weight-desc">{weightClass.desc}</span>
    </div>
  </section>

  <!-- Category Cards -->
  <section class="categories-section">
    <h3 class="section-header">
      <span class="header-bar"></span>
      <span>Recommended Loadout</span>
    </h3>

    {#each Object.entries(gearData.categories) as [catId, catInfo]}
      {@const items = itemsByCategory[catId] || []}
      {@const item = items[0]}
      {@const retailer = item ? getRetailer(item.link) : null}
      {@const isOverride = item?.isOverride}
      {#if item}
        <div class="category-card" class:expanded={expandedCategory === catId} class:override={isOverride}>
          <button class="card-header" onclick={() => toggleCategory(catId)}>
            <div class="card-icon">{catInfo.icon}</div>
            <div class="card-main">
              <span class="card-category">
                {catInfo.name}
                {#if isOverride}
                  <span class="override-badge">Custom</span>
                {/if}
              </span>
              <span class="card-item">{item.brand} {item.name}</span>
            </div>
            <div class="card-stats">
              <span class="card-price">{formatPrice(item.price)}</span>
              <span class="card-weight">{formatWeight(item.weight)}</span>
            </div>
            <span class="card-expand">{expandedCategory === catId ? '−' : '+'}</span>
          </button>

          {#if expandedCategory === catId}
            <div class="card-details" transition:slide={{ duration: 200 }}>
              {#if item.thruHikeViable === false}
                <div class="viability-warning">
                  <span class="warning-icon">⚠️</span>
                  <span>Not recommended for full thru-hikes. See alternatives.</span>
                </div>
              {/if}
              <p class="item-why">{item.why}</p>

              <div class="item-scores">
                <div class="score-bar">
                  <span class="score-label">Value</span>
                  <div class="score-track">
                    <div class="score-fill" style="width: {item.valueScore * 10}%"></div>
                  </div>
                  <span class="score-value">{item.valueScore}/10</span>
                </div>
                <div class="score-bar">
                  <span class="score-label">Weight</span>
                  <div class="score-track">
                    <div class="score-fill" style="width: {item.weightScore * 10}%"></div>
                  </div>
                  <span class="score-value">{item.weightScore}/10</span>
                </div>
                <div class="score-bar">
                  <span class="score-label">Durability</span>
                  <div class="score-track">
                    <div class="score-fill" style="width: {item.durabilityScore * 10}%"></div>
                  </div>
                  <span class="score-value">{item.durabilityScore}/10</span>
                </div>
              </div>

              <div class="pros-cons">
                <div class="pros">
                  <span class="list-label">Pros</span>
                  <ul>
                    {#each item.pros as pro}
                      <li>✓ {pro}</li>
                    {/each}
                  </ul>
                </div>
                <div class="cons">
                  <span class="list-label">Cons</span>
                  <ul>
                    {#each item.cons as con}
                      <li>✗ {con}</li>
                    {/each}
                  </ul>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="card-actions">
                {#if item.link}
                  <a href={item.link} target="_blank" rel="noopener noreferrer" class="buy-button">
                    <span class="buy-icon">{retailer.icon}</span>
                    <span>Buy at {retailer.name}</span>
                    <span class="buy-arrow">→</span>
                  </a>
                {/if}
                <button class="change-button" onclick={() => selectingCategory = catId}>
                  <span>🔄</span>
                  <span>Change Item</span>
                </button>
                {#if isOverride}
                  <button class="reset-button" onclick={() => clearOverride(catId)}>
                    <span>↩️</span>
                    <span>Reset to Recommended</span>
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </section>

  <!-- Totals Summary -->
  <section class="totals-section">
    <div class="totals-row">
      <span class="totals-label">Total Gear Cost</span>
      <span class="totals-value">{formatPrice(totalCost)}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Base Weight (Gear Only)</span>
      <span class="totals-value">{totalWeightLbs.toFixed(1)} lbs ({totalWeightOz.toFixed(0)} oz)</span>
    </div>
    <div class="totals-row highlight">
      <span class="totals-label">Budget Remaining</span>
      <span class="totals-value" style="color: {remainingBudget >= 0 ? '#22c55e' : '#ef4444'}">
        {remainingBudget >= 0 ? '+' : ''}{formatPrice(remainingBudget)}
      </span>
    </div>
  </section>

  <!-- Methodology Disclosure -->
  <section class="methodology-section">
    <button class="methodology-toggle" onclick={() => showMethodology = !showMethodology}>
      <span>📊 How Recommendations Work</span>
      <span class="toggle-icon">{showMethodology ? '−' : '+'}</span>
    </button>

    {#if showMethodology}
      <div class="methodology-content" transition:slide={{ duration: 200 }}>
        <h4>Scoring Methodology</h4>
        <p>Each item is scored based on three factors:</p>
        <ul>
          <li><strong>Value Score:</strong> Price-to-performance ratio. How much quality you get per dollar.</li>
          <li><strong>Weight Score:</strong> Inverse of weight relative to category average. Lighter = higher score.</li>
          <li><strong>Durability Score:</strong> Expected lifespan and build quality based on materials and user reports.</li>
        </ul>

        <h4>Mode Weighting</h4>
        <ul>
          <li><strong>Best Value:</strong> 50% value, 25% weight, 25% durability</li>
          <li><strong>Lightest:</strong> 20% value, 60% weight, 20% durability</li>
          <li><strong>Most Durable:</strong> 20% value, 20% weight, 60% durability</li>
        </ul>

        <h4>Budget Tier Affinity</h4>
        <p>Items matching your budget tier get priority. This prevents recommending luxury gear when you have a budget build, and vice versa.</p>

        <p class="methodology-disclaimer">
          <strong>Disclaimer:</strong> Prices verified as of {gearData.meta.lastUpdated}. Actual prices may vary. Always verify current pricing before purchase.
        </p>
      </div>
    {/if}
  </section>

  <!-- Guide Links -->
  <div class="guide-links">
    <a href="/guide/06-gear-system" class="guide-link">
      <span>📚</span>
      <span>Full Gear Guide</span>
    </a>
    <a href="/guide" class="guide-link">
      <span>📖</span>
      <span>Field Guide</span>
    </a>
  </div>

  <!-- Item Selection Modal -->
  {#if selectingCategory}
    {@const catInfo = gearData.categories[selectingCategory]}
    <div class="modal-layer">
      <button class="modal-backdrop" type="button" onclick={() => selectingCategory = null} aria-label="Close gear item chooser"></button>
      <div class="modal-content" role="dialog" aria-modal="true" aria-label={`Choose ${catInfo.name}`} tabindex="-1">
        <header class="modal-header">
          <div class="modal-title">
            <span class="modal-icon">{catInfo.icon}</span>
            <div>
              <h3>Choose {catInfo.name}</h3>
              <p>Select from {categoryAlternatives.length} options</p>
            </div>
          </div>
          <button class="modal-close" onclick={() => selectingCategory = null}>✕</button>
        </header>

        <div class="modal-items">
          {#each categoryAlternatives as alt}
            {@const altRetailer = getRetailer(alt.link)}
            {@const isSelected = userOverrides[selectingCategory] === alt.id}
            {@const isRecommended = recommendation.find(r => r.category === selectingCategory && !r.isOverride)?.id === alt.id}
            <div
              class="alt-item"
              class:selected={isSelected}
              class:recommended={isRecommended && !isSelected}
            >
              <button class="alt-main" type="button" onclick={() => selectItem(selectingCategory, alt.id)}>
                <div class="alt-header">
                  <span class="alt-brand">{alt.brand}</span>
                  <span class="alt-name">{alt.name}</span>
                  {#if isRecommended}
                    <span class="rec-badge">Recommended</span>
                  {/if}
                </div>
                <div class="alt-stats">
                  <span class="alt-price">{formatPrice(alt.price)}</span>
                  <span class="alt-weight">{formatWeight(alt.weight)}</span>
                  <span class="alt-tier tier-{alt.tier}">{alt.tier}</span>
                </div>
                <p class="alt-why">{alt.why}</p>
                <div class="alt-scores">
                  <span title="Value Score">💰 {alt.valueScore}</span>
                  <span title="Weight Score">⚖️ {alt.weightScore}</span>
                  <span title="Durability Score">🛡️ {alt.durabilityScore}</span>
                </div>
              </button>
              {#if alt.link}
                <a href={alt.link} target="_blank" rel="noopener noreferrer" class="alt-buy" onclick={(e) => e.stopPropagation()}>
                  <span>{altRetailer.icon}</span>
                  <span>{altRetailer.name}</span>
                </a>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .gear-builder {
    font-family: inherit;
  }

  /* Header */
  .builder-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0.85rem 1.25rem;
    background: linear-gradient(135deg, #4a5568, #2d3748);
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  .header-stat {
    text-align: center;
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
  }

  .header-stat .stat-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }

  .header-stat .stat-label {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Beta Banner */
  .beta-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 1px solid #f59e0b;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .beta-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .beta-content {
    flex: 1;
  }

  .beta-content strong {
    display: block;
    font-size: 0.85rem;
    color: #92400e;
    margin-bottom: 0.2rem;
  }

  .beta-content p {
    margin: 0;
    font-size: 0.8rem;
    color: #a16207;
    line-height: 1.4;
  }

  /* Input Section */
  .input-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .section-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .budget-control {
    margin-bottom: 1.5rem;
  }

  .budget-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .budget-display {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .budget-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: var(--border);
    appearance: none;
    cursor: pointer;
    margin: 0.75rem 0 0.5rem;
  }

  .budget-slider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--pine);
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    cursor: pointer;
  }

  .budget-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .tier-badge {
    display: inline-block;
    margin-top: 0.75rem;
    padding: 0.35rem 0.75rem;
    background: color-mix(in srgb, var(--tier-color) 15%, transparent);
    border: 1px solid var(--tier-color);
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--tier-color);
  }

  /* Mode Control */
  .mode-control {
    margin-bottom: 1.25rem;
  }

  .mode-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:hover {
    border-color: var(--alpine);
  }

  .mode-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .mode-icon {
    font-size: 1.25rem;
  }

  .mode-label {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .mode-desc {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
    font-style: italic;
  }

  /* Options Row */
  .options-row {
    display: flex;
    gap: 1rem;
  }

  .option {
    flex: 1;
  }

  .option label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .option select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  /* Results Hero */
  .results-hero {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .hero-ring {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .ring-svg {
    width: 100%;
    height: 100%;
  }

  .ring-progress {
    transition: stroke-dasharray 0.5s ease;
  }

  .ring-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .ring-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .ring-label {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .hero-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .hero-stat {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-info .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .stat-info .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .weight-class-badge {
    flex: 1;
    min-width: 200px;
    padding: 0.75rem 1rem;
    border: 2px solid;
    border-radius: 10px;
    text-align: center;
  }

  .weight-class-badge span:first-child {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
  }

  .weight-desc {
    display: block;
    font-size: 0.75rem;
    color: var(--muted) !important;
    margin-top: 0.15rem;
  }

  /* Categories Section */
  .categories-section {
    margin-bottom: 1.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin: 0 0 1rem;
  }

  .header-bar {
    width: 24px;
    height: 3px;
    background: var(--alpine);
    border-radius: 2px;
  }

  /* Category Card */
  .category-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 0.75rem;
    overflow: hidden;
    transition: border-color 0.15s ease;
  }

  .category-card:hover {
    border-color: var(--alpine);
  }

  .category-card.expanded {
    border-color: var(--pine);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.875rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .card-icon {
    font-size: 1.25rem;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border-radius: 8px;
  }

  .card-main {
    flex: 1;
    min-width: 0;
  }

  .card-category {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }

  .card-item {
    display: block;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-stats {
    text-align: right;
    flex-shrink: 0;
  }

  .card-price {
    display: block;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  .card-weight {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .card-expand {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border-radius: 6px;
    font-weight: 700;
    color: var(--muted);
  }

  /* Card Details */
  .card-details {
    padding: 0 1rem 1rem;
    border-top: 1px solid var(--border);
    margin-top: 0;
  }

  .viability-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.75rem 0;
    padding: 0.6rem 0.75rem;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #92400e;
  }

  .warning-icon {
    font-size: 1.1rem;
  }

  .item-why {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(166, 181, 137, 0.1);
    border-left: 3px solid var(--alpine);
    border-radius: 0 6px 6px 0;
    font-size: 0.9rem;
    color: var(--pine);
    font-style: italic;
  }

  .item-scores {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .score-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .score-label {
    width: 70px;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .score-track {
    flex: 1;
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    background: var(--alpine);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .score-value {
    width: 35px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pine);
    text-align: right;
  }

  .pros-cons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .pros, .cons {
    flex: 1;
  }

  .list-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .pros-cons ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pros-cons li {
    font-size: 0.8rem;
    margin: 0.25rem 0;
    color: var(--fg);
  }

  .pros li {
    color: #16a34a;
  }

  .cons li {
    color: #dc2626;
  }

  /* Override badge */
  .override-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.15rem 0.4rem;
    background: #8b5cf6;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .category-card.override {
    border-color: #8b5cf6;
    border-width: 2px;
  }

  /* Card Actions */
  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .buy-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff;
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.15s ease;
    box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);
  }

  .buy-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(22, 163, 74, 0.4);
  }

  .buy-icon {
    font-size: 1.1rem;
  }

  .buy-arrow {
    margin-left: 0.25rem;
    transition: transform 0.15s ease;
  }

  .buy-button:hover .buy-arrow {
    transform: translateX(3px);
  }

  .change-button, .reset-button {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--pine);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .change-button:hover {
    background: var(--alpine);
    color: #fff;
    border-color: var(--alpine);
  }

  .reset-button {
    color: #8b5cf6;
    border-color: #8b5cf640;
  }

  .reset-button:hover {
    background: #8b5cf6;
    color: #fff;
    border-color: #8b5cf6;
  }

  /* Totals Section */
  .totals-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px dashed var(--border);
  }

  .totals-row:last-child {
    border-bottom: none;
  }

  .totals-row.highlight {
    padding-top: 0.75rem;
    margin-top: 0.25rem;
    border-top: 2px solid var(--border);
    border-bottom: none;
  }

  .totals-label {
    color: var(--muted);
    font-size: 0.9rem;
  }

  .totals-value {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--ink);
  }

  /* Methodology Section */
  .methodology-section {
    margin-bottom: 1.5rem;
  }

  .methodology-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.875rem 1rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--pine);
  }

  .toggle-icon {
    font-size: 1.25rem;
    color: var(--muted);
  }

  .methodology-content {
    padding: 1rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 10px 10px;
    margin-top: -10px;
    padding-top: 1.5rem;
  }

  .methodology-content h4 {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: var(--pine);
    margin: 1rem 0 0.5rem;
  }

  .methodology-content h4:first-child {
    margin-top: 0;
  }

  .methodology-content p {
    font-size: 0.85rem;
    color: var(--fg);
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  .methodology-content ul {
    margin: 0.5rem 0;
    padding-left: 1.25rem;
  }

  .methodology-content li {
    font-size: 0.85rem;
    margin: 0.35rem 0;
    line-height: 1.5;
  }

  .methodology-disclaimer {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(234, 179, 8, 0.1);
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Guide Links */
  .guide-links {
    display: flex;
    gap: 0.75rem;
  }

  .guide-link {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-decoration: none;
    color: var(--pine);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.15s ease;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    transform: translateY(-1px);
  }

  /* Mobile */
  @media (max-width: 600px) {
    .results-hero {
      flex-direction: column;
      align-items: stretch;
    }

    .hero-ring {
      margin: 0 auto;
    }

    .hero-stats {
      flex-direction: row;
      justify-content: space-around;
    }

    .weight-class-badge {
      min-width: auto;
    }

    .pros-cons {
      flex-direction: column;
      gap: 0.75rem;
    }

    .mode-buttons {
      flex-wrap: wrap;
    }

    .mode-btn {
      min-width: calc(50% - 0.25rem);
    }
  }

  /* Modal Styles */
  .modal-layer {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 1000;
    animation: fadeIn 0.15s ease;
    overflow: hidden;
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0;
    background: rgba(0, 0, 0, 0.7);
    cursor: pointer;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    position: relative;
    z-index: 1;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: calc(100vh - 2rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(135deg, var(--pine) 0%, #3d5a3d 100%);
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #fff;
  }

  .modal-icon {
    font-size: 1.75rem;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-title h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .modal-title p {
    margin: 0.1rem 0 0;
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 8px;
    font-size: 1.25rem;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .modal-items {
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .alt-item {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.15s ease;
  }

  .alt-item:hover {
    border-color: var(--alpine);
  }

  .alt-item.selected {
    border-color: var(--pine);
    background: rgba(77, 107, 83, 0.1);
  }

  .alt-item.recommended {
    border-color: #22c55e;
  }

  .alt-main {
    width: 100%;
    border: 0;
    padding: 0.875rem 1rem;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-align: left;
  }

  .alt-header {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem;
    margin-bottom: 0.35rem;
  }

  .alt-brand {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .alt-name {
    font-weight: 700;
    color: var(--ink);
  }

  .rec-badge {
    margin-left: auto;
    padding: 0.15rem 0.4rem;
    background: #22c55e;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .alt-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .alt-price {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pine);
  }

  .alt-weight {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .alt-tier {
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .alt-tier.tier-budget {
    background: #f59e0b20;
    color: #b45309;
  }

  .alt-tier.tier-mid {
    background: #3b82f620;
    color: #1d4ed8;
  }

  .alt-tier.tier-premium {
    background: #22c55e20;
    color: #15803d;
  }

  .alt-tier.tier-luxury {
    background: #8b5cf620;
    color: #6d28d9;
  }

  .alt-why {
    margin: 0;
    font-size: 0.8rem;
    color: var(--fg);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .alt-scores {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .alt-buy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: #fff;
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 600;
    transition: background 0.15s ease;
  }

  .alt-buy:hover {
    background: linear-gradient(135deg, #15803d, #166534);
  }

  @media (max-width: 600px) {
    .modal-content {
      max-height: calc(100dvh - 1rem);
      border-radius: 12px 12px 0 0;
      position: relative;
      bottom: auto;
      left: auto;
      right: auto;
      max-width: 100%;
      margin-bottom: 0;
    }

    .modal-layer {
      align-items: flex-end;
      padding: 0;
      padding-top: 1rem;
    }

    .modal-header {
      padding: 0.875rem 1rem;
    }

    .modal-icon {
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
    }

    .modal-title h3 {
      font-size: 1rem;
    }

    .modal-title p {
      font-size: 0.75rem;
    }

    .modal-close {
      width: 32px;
      height: 32px;
      font-size: 1.1rem;
    }

    .modal-items {
      padding: 0.75rem;
      gap: 0.5rem;
    }

    .alt-item {
      border-width: 1.5px;
    }

    .alt-main {
      padding: 0.75rem;
    }

    .alt-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      margin-bottom: 0.5rem;
    }

    .alt-brand {
      font-size: 0.7rem;
    }

    .alt-name {
      font-size: 0.9rem;
    }

    .rec-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      margin-left: 0;
    }

    .alt-stats {
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    .alt-price {
      font-size: 1rem;
    }

    .alt-weight {
      font-size: 0.8rem;
    }

    .alt-tier {
      margin-left: auto;
    }

    .alt-why {
      font-size: 0.75rem;
      -webkit-line-clamp: 3;
    }

    .alt-scores {
      gap: 0.5rem;
      font-size: 0.7rem;
    }

    .alt-buy {
      padding: 0.5rem 0.875rem;
      font-size: 0.75rem;
    }

    .card-actions {
      flex-direction: column;
    }

    .buy-button, .change-button, .reset-button {
      justify-content: center;
    }
  }

  /* Extra small screens (< 400px) */
  @media (max-width: 400px) {
    .modal-header {
      padding: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .modal-title {
      flex: 1;
      min-width: calc(100% - 40px);
      gap: 0.5rem;
    }

    .modal-icon {
      width: 36px;
      height: 36px;
      font-size: 1.25rem;
    }

    .modal-title h3 {
      font-size: 0.95rem;
    }

    .modal-close {
      width: 28px;
      height: 28px;
      font-size: 1rem;
    }

    .modal-items {
      padding: 0.5rem;
    }

    .alt-main {
      padding: 0.625rem;
    }

    .alt-stats {
      gap: 0.4rem;
    }

    .alt-price {
      font-size: 0.95rem;
    }
  }
</style>
