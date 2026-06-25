<script>
  import { slide } from 'svelte/transition';
  import gearData from '../data/gear.json';
  import gearRecommendations from '../data/gearRecommendations.json';
  import { resolve } from '../lib/route-paths';
  import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

  let { trailContext = {} } = $props();

  loadCharacter();

  let mounted = $state(false);
  let expandedCategory = $state(null);

  // Character-driven state
  let foodDays = $state(character.logistics.resupply.carryDays ?? 4);

  let waterLiters = $state(character.equipment.packPrefs.typicalWaterCarryLiters ?? 2);
  let foodWeightPerDay = $state(character.equipment.packPrefs.foodWeightPerDayLb ?? 1.75);

  // Pack inventory items (editable)
  let editableItems = $state([]);

  const categories = gearData.categories;
  const WATER_WEIGHT_PER_LITER = 2.2;
  const templateItems = gearData.items.filter(item => item.season !== 'summer');
  const templateLookup = new Map(templateItems.map(item => [item.id, item]));

  // Recommendations (optional)
  let showRecommendations = $state(!!character.equipment.recommendations.pack.enabled);
  let recBudget = $state(character.equipment.recommendations.pack.budget ?? 1500);
  let recMode = $state(character.equipment.recommendations.pack.mode ?? 'value'); // value | weight | durability
  let recSeason = $state(character.equipment.recommendations.pack.season ?? '3-season');
  let recShelterPref = $state(character.equipment.recommendations.pack.shelterPref ?? 'tent');

  const REC_TO_PACK_CAT = {
    backpack: 'pack',
    shelter: 'shelter',
    sleepBag: 'sleep',
    sleepPad: 'sleep',
    insulation: 'insulation',
    rainGear: 'insulation',
    footwear: 'worn',
    trekkingPoles: 'worn',
    socks: 'worn',
    kitchen: 'kitchen',
    water: 'water',
    electronics: 'electronics',
    safety: 'safety'
  };

  const ESSENTIAL_PACK_CATS = new Set(['pack', 'shelter', 'sleep', 'insulation', 'kitchen', 'water', 'electronics', 'safety']);

  function createItem({
    id,
    category,
    name = '',
    weight = '',
    cost = '',
    url = '',
    worn = false,
    tier = 3,
    templateName = '',
    templateWeight = ''
  }) {
    return {
      id,
      category,
      name,
      weight,
      cost,
      url,
      worn,
      tier,
      templateName,
      templateWeight
    };
  }

  function buildTemplateItems() {
    const itemsByCategory = new Map();
    templateItems.forEach((item, idx) => {
      if (!itemsByCategory.has(item.category)) itemsByCategory.set(item.category, []);
      itemsByCategory.get(item.category).push({ item, idx });
    });

    const orderedCategoryIds = Object.keys(categories);
    const flattened = [];

    for (const categoryId of orderedCategoryIds) {
      const list = itemsByCategory.get(categoryId) || [];
      list
        .slice()
        .sort((a, b) => {
          const tierA = a.item.tier ?? 3;
          const tierB = b.item.tier ?? 3;
          if (tierA !== tierB) return tierA - tierB;
          return a.idx - b.idx;
        })
        .slice(0, 3)
        .forEach(({ item }) => flattened.push(item));
    }

    return flattened.map(item =>
      createItem({
        id: item.id,
        category: item.category,
        worn: item.worn ?? false,
        tier: item.tier ?? 3,
        templateName: item.name,
        templateWeight: item.weight,
      })
    );
  }

  // --- Recommendation engine (adapted from prior Gear Builder) ---

  function getBudgetTier(budget) {
    if (budget < 800) return 'budget';
    if (budget < 1500) return 'mid';
    if (budget < 2500) return 'premium';
    return 'luxury';
  }

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

  function scoreItem(item, mode, targetTier) {
    const weights = {
      value: { value: 0.5, weight: 0.25, durability: 0.25 },
      weight: { value: 0.2, weight: 0.6, durability: 0.2 },
      durability: { value: 0.2, weight: 0.2, durability: 0.6 }
    }[mode] || { value: 0.5, weight: 0.25, durability: 0.25 };

    const avg = gearRecommendations.categories?.[item.category]?.avgWeight || 1;

    const baseScore = (
      (item.valueScore || 0) * weights.value +
      (11 - (item.weight || 0) / avg * 5) * weights.weight +
      (item.durabilityScore || 0) * weights.durability
    );

    const tiers = ['budget', 'mid', 'premium', 'luxury'];
    const itemTierIdx = tiers.indexOf(item.tier);
    const targetTierIdx = tiers.indexOf(targetTier);
    const tierDistance = Math.abs(itemTierIdx - targetTierIdx);
    const tierBonus = tierDistance === 0 ? 1.0 : tierDistance === 1 ? 0.85 : 0.6;

    const viabilityPenalty = item.thruHikeViable === false ? 0.3 : 1.0;

    return baseScore * tierBonus * viabilityPenalty;
  }

  function buildRecommendation(budget, mode, season, shelterPref) {
    const tier = getBudgetTier(budget);
    const items = gearRecommendations.items || [];
    const selected = [];

    Object.keys(CATEGORY_BUDGETS).forEach(category => {
      const categoryBudget = budget * CATEGORY_BUDGETS[category] * 1.3; // flexibility

      let candidates = items.filter(item => {
        if (item.category !== category) return false;
        if (item.price && item.price > categoryBudget) return false;

        // Season filter
        if (item.season && item.season !== 'both' && item.season !== season) return false;

        // Shelter type filter
        if (category === 'shelter' && item.shelterType && item.shelterType !== shelterPref) return false;

        return true;
      });

      candidates = candidates
        .map(item => ({ ...item, score: scoreItem(item, mode, tier) }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      if (candidates.length > 0) {
        selected.push(candidates[0]);
      } else {
        const fallback = items.filter(i => i.category === category).sort((a, b) => (a.price || 0) - (b.price || 0))[0];
        if (fallback) selected.push({ ...fallback, score: 0 });
      }
    });

    return selected;
  }

  let recommendedItems = $derived(buildRecommendation(recBudget, recMode, recSeason, recShelterPref));

  function safeExternalHref(value) {
    const href = String(value || '').trim();
    if (!href) return '';
    try {
      const url = new URL(href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function mappedPackCategory(recCategory) {
    return REC_TO_PACK_CAT[recCategory] || null;
  }

  let recommendedByPackCategory = $derived.by(() => {
    const out = {};
    for (const item of recommendedItems) {
      const catId = mappedPackCategory(item.category);
      if (!catId) continue;
      if (!out[catId]) out[catId] = [];
      out[catId].push(item);
    }
    return out;
  });

  function isCategoryFilled(catId) {
    return editableItems.some(i => (i.category === catId) && String(i.name || '').trim().length > 0);
  }

  function addRecItem(recItem) {
    const catId = mappedPackCategory(recItem.category);
    if (!catId) return;

    const id = `rec_${recItem.id || recItem.category}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    editableItems = [
      ...editableItems,
      createItem({
        id,
        category: catId,
        name: recItem.name || '',
        weight: Number.isFinite(recItem.weight) ? String(recItem.weight) : '',
        cost: Number.isFinite(recItem.price) ? String(recItem.price) : '',
        url: recItem.url || '',
        worn: catId === 'worn'
      })
    ];

    expandedCategory = catId;
  }

  function fillMissingEssentials() {
    const toAdd = [];

    for (const recItem of recommendedItems) {
      const catId = mappedPackCategory(recItem.category);
      if (!catId) continue;
      if (!ESSENTIAL_PACK_CATS.has(catId)) continue;
      if (isCategoryFilled(catId)) continue;

      toAdd.push(recItem);
    }

    if (toAdd.length === 0) return;

    // Add all selected recs
    for (const recItem of toAdd) addRecItem(recItem);
  }


  // Initialize editableItems from Character
  {
    const stored = (character.equipment.inventory.items || []);
    if (stored.length > 0) {
      editableItems = stored.map((it) => {
        const template = templateLookup.get(it.id);
        const weightRaw = (it.weightRaw ?? (typeof it.weightOz === 'number' ? String(it.weightOz) : ''));
        const costRaw = (it.costRaw ?? (typeof it.costUsd === 'number' ? String(it.costUsd) : ''));
        return createItem({
          id: it.id || `custom_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          category: it.category || template?.category || 'pack',
          name: it.name ?? '',
          weight: weightRaw ?? '',
          cost: costRaw ?? '',
          url: it.url ?? '',
          worn: it.worn ?? false,
          tier: it.tier ?? template?.tier ?? 3,
          templateName: it.templateName ?? template?.name ?? '',
          templateWeight: it.templateWeightRaw ?? template?.weight ?? '',
        });
      });
    } else {
      editableItems = buildTemplateItems();
    }
    mounted = true;
  }

  function asNumber(input, fallback = 0) {
    const n = Number(String(input ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : fallback;
  }

  // Persist to unified Character model
  $effect(() => {
    if (!mounted) return;

    updateCharacter({
      equipment: {
        inventory: {
          items: editableItems.map((item) => {
            const w = asNumber(item.weight, NaN);
            const c = asNumber(item.cost, NaN);
            return {
              id: String(item.id),
              category: String(item.category || 'pack'),
              name: String(item.name || ''),
              weightOz: Number.isFinite(w) ? w : undefined,
              weightRaw: typeof item.weight === 'string' ? item.weight : undefined,
              costUsd: Number.isFinite(c) ? c : undefined,
              costRaw: typeof item.cost === 'string' ? item.cost : undefined,
              url: item.url ? String(item.url) : undefined,
              worn: !!item.worn,
              tier: Number.isFinite(Number(item.tier)) ? Number(item.tier) : undefined,
              templateName: item.templateName ? String(item.templateName) : undefined,
              templateWeightRaw: item.templateWeight ? String(item.templateWeight) : undefined,
            };
          }),
        },
        packPrefs: {
          typicalWaterCarryLiters: waterLiters,
          foodWeightPerDayLb: foodWeightPerDay,
        },
        recommendations: {
          pack: {
            enabled: !!showRecommendations,
            budget: recBudget,
            mode: recMode,
            season: recSeason,
            shelterPref: recShelterPref,
          },
        },
      },
      logistics: {
        resupply: {
          carryDays: foodDays,
        },
      },
    });
  });

  function updateItem(id, key, value) {
    editableItems = editableItems.map(item =>
      item.id === id ? { ...item, [key]: value } : item
    );
  }

  function addItem(categoryId) {
    const id = `custom_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    editableItems = [...editableItems, createItem({ id, category: categoryId })];
    expandedCategory = categoryId;
  }

  function removeItem(id) {
    editableItems = editableItems.filter(item => item.id !== id);
  }

  function getItemWeight(item) {
    const weight = Number(item.weight);
    return Number.isFinite(weight) ? weight : 0;
  }

  let filledItemsCount = $derived(editableItems.length);
  let baseWeightOz = $derived(
    editableItems.filter(item => !item.worn).reduce((sum, item) => sum + getItemWeight(item), 0)
  );

  let baseWeightLbs = $derived(baseWeightOz / 16);
  let foodWeight = $derived(foodDays * foodWeightPerDay);
  let waterWeight = $derived(waterLiters * WATER_WEIGHT_PER_LITER);
  let totalPackWeight = $derived(baseWeightLbs + foodWeight + waterWeight);

  let baseWeightClass = $derived(
    baseWeightLbs < 10 ? { label: 'Ultralight', color: '#22c55e' }
    : baseWeightLbs < 15 ? { label: 'Lightweight', color: '#84cc16' }
    : baseWeightLbs < 20 ? { label: 'Traditional', color: '#eab308' }
    : { label: 'Heavy', color: '#ef4444' }
  );

  let totalWeightClass = $derived.by(() => {
    if (totalPackWeight <= 20) return { label: 'ULTRALIGHT', color: '#22c55e', icon: '🪶', desc: 'Exceptional. Your joints will thank you.' };
    if (totalPackWeight <= 28) return { label: 'LIGHT', color: '#84cc16', icon: '✓', desc: 'Great weight. Sustainable for big miles.' };
    if (totalPackWeight <= 35) return { label: 'MODERATE', color: '#eab308', icon: '⚖️', desc: 'Average pack. Watch knees on descents.' };
    if (totalPackWeight <= 42) return { label: 'HEAVY', color: '#f97316', icon: '⚠️', desc: 'Above average. Consider reducing.' };
    return { label: 'VERY HEAVY', color: '#ef4444', icon: '🚨', desc: 'Risk of injury over time.' };
  });

  let jointStress = $derived.by(() => {
    const overBase = Math.max(0, totalPackWeight - 20);
    const stressLevel = Math.min(100, (overBase / 30) * 100);
    return {
      level: stressLevel,
      risk: stressLevel > 70 ? 'high' : stressLevel > 40 ? 'moderate' : 'low',
    };
  });

  let weightPercents = $derived.by(() => {
    if (totalPackWeight <= 0) return { base: 0, food: 0, water: 0 };
    return {
      base: (baseWeightLbs / totalPackWeight) * 100,
      food: (foodWeight / totalPackWeight) * 100,
      water: (waterWeight / totalPackWeight) * 100,
    };
  });

  let categoryWeights = $derived(
    Object.entries(categories).map(([catId, catData]) => {
      const items = editableItems.filter(item => item.category === catId);
      const weight = items.filter(i => !i.worn).reduce((sum, i) => sum + getItemWeight(i), 0);
      return {
        id: catId,
        ...catData,
        weight,
        weightLbs: weight / 16,
        items,
        wornItems: items.filter(i => i.worn)
      };
    })
  );

  let maxCategoryWeight = $derived(Math.max(...categoryWeights.map(c => c.weight), 1));

  const big3Categories = ['shelter', 'sleep', 'pack'];
  let backpackOnlyWeightOz = $derived.by(() => {
    const explicitBackpack = editableItems.find(item => item.id === 'pack' && item.category === 'pack' && !item.worn);
    if (explicitBackpack) return getItemWeight(explicitBackpack);

    const packItems = editableItems.filter(item => item.category === 'pack' && !item.worn);
    if (packItems.length === 0) return 0;
    return Math.max(...packItems.map(getItemWeight));
  });

  let big3Weight = $derived.by(() => {
    const shelterWeight = categoryWeights.find(c => c.id === 'shelter')?.weight ?? 0;
    const sleepWeight = categoryWeights.find(c => c.id === 'sleep')?.weight ?? 0;
    return shelterWeight + sleepWeight + backpackOnlyWeightOz;
  });
  let big3WeightLbs = $derived(big3Weight / 16);
  let big3Breakdown = $derived.by(() =>
    big3Categories.map(catId => {
      if (catId === 'pack') {
        const packMeta = categories[catId];
        return {
          id: catId,
          name: packMeta?.name || catId,
          icon: packMeta?.icon || '?',
          weight: backpackOnlyWeightOz
        };
      }

      const cat = categoryWeights.find(c => c.id === catId);
      return cat || { id: catId, name: categories[catId]?.name || catId, weight: 0, icon: categories[catId]?.icon || '?' };
    })
  );
  let big3Percent = $derived(baseWeightOz > 0 ? (big3Weight / baseWeightOz) * 100 : 0);

  let weightTips = $derived.by(() => {
    const tips = [];
    const shelterCat = categoryWeights.find(c => c.id === 'shelter');
    const sleepCat = categoryWeights.find(c => c.id === 'sleep');
    if (shelterCat && shelterCat.weight > 48) tips.push({ icon: '🏕️', text: 'Shelter over 3 lbs—consider a tarp/hammock or DCF tent' });
    if (sleepCat && sleepCat.weight > 56) tips.push({ icon: '😴', text: 'Sleep system over 3.5 lbs—quilt + inflatable pad saves weight' });
    if (backpackOnlyWeightOz > 48) tips.push({ icon: '🎒', text: 'Pack over 3 lbs—frameless packs work under 15 lb base' });
    if (big3WeightLbs > 12) tips.push({ icon: '⚖️', text: 'Big 3 over 12 lbs—focus here for biggest savings' });
    if (baseWeightLbs < 10 && tips.length === 0) tips.push({ icon: '🏆', text: 'Ultralight achieved! Focus on durability now' });
    if (tips.length === 0 && baseWeightLbs < 15) tips.push({ icon: '✅', text: 'Solid lightweight setup—enjoy the miles!' });
    return tips;
  });

  function toggleCategory(catId) {
    expandedCategory = expandedCategory === catId ? null : catId;
  }

  function formatWeight(oz) {
    if (oz >= 16) return `${(oz / 16).toFixed(1)} lb`;
    return `${oz.toFixed(1)} oz`;
  }
</script>


<div class="pack-builder" class:mounted>
  <!-- Weight Hero -->
  <section class="weight-hero">
    <div class="weight-display">
      <div class="weight-ring" style="--ring-color: {totalWeightClass.color}">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" class="ring-bg"/>
          <circle cx="60" cy="60" r="52" class="ring-fill" style="stroke-dasharray: {Math.min(100, totalPackWeight / 50 * 100) * 3.267} 326.7"/>
        </svg>
        <div class="weight-center">
          <span class="weight-num">{totalPackWeight.toFixed(1)}</span>
          <span class="weight-unit">lbs</span>
        </div>
      </div>
      <div class="weight-meta">
        <div class="weight-class" style="background: {totalWeightClass.color}">
          <span class="class-icon">{totalWeightClass.icon}</span>
          <span class="class-label">{totalWeightClass.label}</span>
        </div>
        <p class="weight-desc">{totalWeightClass.desc}</p>
      </div>
    </div>

    <!-- Weight Bar -->
    <div class="weight-bar">
      <div class="bar-track">
        <div class="bar-seg base" style="width: {weightPercents.base}%"></div>
        <div class="bar-seg food" style="width: {weightPercents.food}%"></div>
        <div class="bar-seg water" style="width: {weightPercents.water}%"></div>
      </div>
      <div class="bar-legend">
        <span class="legend-item"><span class="dot base"></span>Base {baseWeightLbs.toFixed(1)} lb</span>
        <span class="legend-item"><span class="dot food"></span>Food {foodWeight.toFixed(1)} lb</span>
        <span class="legend-item"><span class="dot water"></span>Water {waterWeight.toFixed(1)} lb</span>
      </div>
    </div>

    <!-- Consumables Inline -->
    <div class="consumables-inline">
      <div class="consumable-mini">
        <span class="consumable-icon">🍽️</span>
        <div class="mini-stepper">
          <button onclick={() => foodDays = Math.max(0, foodDays - 1)}>−</button>
          <span class="mini-val">{foodDays}</span>
          <button onclick={() => foodDays = Math.min(10, foodDays + 1)}>+</button>
        </div>
        <span class="consumable-label">days food</span>
      </div>
      <div class="consumable-mini">
        <span class="consumable-icon">💧</span>
        <div class="mini-stepper">
          <button onclick={() => waterLiters = Math.max(0, waterLiters - 0.5)}>−</button>
          <span class="mini-val">{waterLiters}</span>
          <button onclick={() => waterLiters = Math.min(6, waterLiters + 0.5)}>+</button>
        </div>
        <span class="consumable-label">liters</span>
      </div>
    </div>
  </section>


    <section class="controls-section">
      <div class="controls-top">
      <div class="builder-intro">
        <h3>Your loadout</h3>
        <p>Start from scratch or use a starter template. Add your own items, cost, links, and weights.</p>
      </div>

      <div class="controls-actions">
        <button class="btn secondary" type="button" onclick={() => { editableItems = []; expandedCategory = null; }}>
          Start blank
        </button>
        <button class="btn secondary" type="button" onclick={() => { editableItems = buildTemplateItems(); expandedCategory = null; }}>
          Restore template
        </button>
        <button class="btn primary" type="button" onclick={() => showRecommendations = !showRecommendations}>
          {showRecommendations ? 'Hide' : 'Show'} recommendations
        </button>
      </div>

      <div class="base-pill" style="--pill-color: {baseWeightClass.color}">
        Base: {baseWeightLbs.toFixed(1)} lb ({baseWeightClass.label})
      </div>
      </div>

      {#if showRecommendations}
        <div class="recs" id="recommendations">
          <div class="recs-head">
            <div>
              <h4>Recommendations (optional)</h4>
              <p>Fill missing essentials automatically, or add individual items one-by-one.</p>
            </div>
            <button class="btn primary" type="button" onclick={fillMissingEssentials}>
              Fill missing essentials
            </button>
          </div>

          <div class="recs-controls">
            <label class="field">
              <span>Budget</span>
              <input type="number" min="0" step="50" value={recBudget} oninput={(e) => recBudget = Number(e.currentTarget.value)} />
            </label>
            <label class="field">
              <span>Mode</span>
              <select value={recMode} onchange={(e) => recMode = e.currentTarget.value}>
                <option value="value">Value</option>
                <option value="weight">Weight</option>
                <option value="durability">Durability</option>
              </select>
            </label>
            <label class="field">
              <span>Season</span>
              <select value={recSeason} onchange={(e) => recSeason = e.currentTarget.value}>
                <option value="3-season">3-season</option>
                <option value="winter">Winter</option>
              </select>
            </label>
            <label class="field">
              <span>Shelter</span>
              <select value={recShelterPref} onchange={(e) => recShelterPref = e.currentTarget.value}>
                <option value="tent">Tent</option>
                <option value="tarp">Tarp</option>
                <option value="hammock">Hammock</option>
              </select>
            </label>
          </div>

          <div class="recs-groups">
            {#each Object.entries(recommendedByPackCategory) as [packCatId, items] (packCatId)}
              {@const catMeta = categories?.[packCatId]}
              <div class="recs-group">
                <div class="recs-group-title">
                  <span class="recs-group-icon">{catMeta?.icon || '✨'}</span>
                  <span class="recs-group-name">{catMeta?.name || packCatId}</span>
                  {#if isCategoryFilled(packCatId)}
                    <span class="recs-group-tag">Already filled</span>
                  {/if}
                </div>

                <div class="recs-list">
                  {#each items as rec (rec.id || rec.name)}
                    {@const recHref = safeExternalHref(rec.url)}
                    <div class="rec-item">
                      <div class="rec-main">
                        <div class="rec-name">{rec.name}</div>
                        <div class="rec-meta">
                          {#if rec.weight}{rec.weight} oz{/if}
                          {#if rec.price} • ${rec.price}{/if}
                        </div>
                      </div>
                      <div class="rec-actions">
                        {#if recHref}
                          <a class="btn link" href={recHref} target="_blank" rel="noreferrer">Link</a>
                        {/if}
                        <button class="btn secondary" type="button" onclick={() => addRecItem(rec)}>
                          Add this item
                        </button>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>



    <!-- Big 3 Section -->
    <section class="big3-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        THE BIG 3
        <span class="big3-badge">{big3Percent.toFixed(0)}% of base</span>
      </h3>
      <div class="big3-grid">
        {#each big3Breakdown as cat (cat.id)}
          <div class="big3-card">
            <span class="big3-icon">{cat.icon}</span>
            <span class="big3-name">{cat.name}</span>
            <span class="big3-weight">{(cat.weight / 16).toFixed(1)} lb</span>
          </div>
        {/each}
        <div class="big3-card total">
          <span class="big3-icon">🎯</span>
          <span class="big3-name">Total</span>
          <span class="big3-weight">{big3WeightLbs.toFixed(1)} lb</span>
        </div>
      </div>

      {#if weightTips.length > 0}
        <div class="tips-grid">
          {#each weightTips as tip (tip.text)}
            <div class="tip-card">
              <span class="tip-icon">{tip.icon}</span>
              <span class="tip-text">{tip.text}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Category Breakdown -->
    <section class="categories-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        GEAR BREAKDOWN
      </h3>
      <div class="category-list">
        {#each categoryWeights as cat (cat.id)}
          <div class="category-card" class:expanded={expandedCategory === cat.id}>
            <button class="cat-header" onclick={() => toggleCategory(cat.id)}>
              <span class="cat-icon">{cat.icon}</span>
              <div class="cat-info">
                <div class="cat-top">
                  <span class="cat-name">{cat.name}</span>
                  <span class="cat-weight">{formatWeight(cat.weight)}</span>
                </div>
                <div class="cat-bar">
                  <div class="cat-fill" style="width: {(cat.weight / maxCategoryWeight) * 100}%; background: {cat.color}"></div>
                </div>
              </div>
              <span class="cat-chevron">▼</span>
            </button>
            {#if expandedCategory === cat.id}
              <div class="cat-items" transition:slide>
                {#each cat.items as item (item.id)}
                  {@const itemHref = safeExternalHref(item.url)}
                  <div class="gear-item">
                    <div class="item-main">
                      <div class="item-top">
                        <select
                          class="item-cat"
                          value={item.category}
                          onchange={(event) => {
                            const next = event.currentTarget.value;
                            updateItem(item.id, 'category', next);
                            expandedCategory = next;
                          }}
                          aria-label="Gear category"
                        >
                          {#each Object.entries(categories) as [cid, info] (cid)}
                            <option value={cid}>{info.icon} {info.name}</option>
                          {/each}
                        </select>

                        <input
                          class="item-input"
                          type="text"
                          placeholder={item.templateName || 'Add gear item'}
                          value={item.name}
                          oninput={(event) => updateItem(item.id, 'name', event.currentTarget.value)}
                        />
                      </div>

                      <div class="item-sub">
                        <div class="item-cost-wrap">
                          <span class="item-cost-dollar">$</span>
                          <input
                            class="item-cost-input"
                            type="number"
                            min="0"
                            step="0.01"
                            inputmode="decimal"
                            placeholder="0"
                            value={item.cost}
                            oninput={(event) => updateItem(item.id, 'cost', event.currentTarget.value)}
                            aria-label="Item cost"
                          />
                        </div>

                        <input
                          class="item-url-input"
                          type="url"
                          placeholder="Link (optional)"
                          value={item.url}
                          oninput={(event) => updateItem(item.id, 'url', event.currentTarget.value)}
                          aria-label="Item link"
                        />

                        {#if itemHref}
                          <a class="item-open" href={itemHref} target="_blank" rel="noreferrer">Open</a>
                        {/if}
                      </div>
                    </div>

                    <div class="item-meta">
                      <div class="item-weight-wrap">
                        <input
                          class="item-weight-input"
                          type="number"
                          min="0"
                          step="0.1"
                          inputmode="decimal"
                          placeholder={item.templateWeight ? item.templateWeight.toString() : '0'}
                          value={item.weight}
                          oninput={(event) => updateItem(item.id, 'weight', event.currentTarget.value)}
                        />
                        <span class="item-weight-unit">oz</span>
                      </div>
                      <button
                        type="button"
                        class="item-pill-btn worn"
                        class:isOn={item.worn}
                        title="Counts as worn weight (not in base weight)"
                        aria-label="Toggle worn weight"
                        aria-pressed={item.worn}
                        onclick={() => updateItem(item.id, 'worn', !item.worn)}
                      >
                        Worn
                      </button>
                      <button
                        type="button"
                        class="item-icon-btn remove"
                        aria-label="Remove item"
                        onclick={() => removeItem(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                {/each}
                {#if cat.items.length === 0}
                  <button class="item-add" onclick={() => addItem(cat.id)}>
                    + Add item
                  </button>
                {:else}
                  <button class="item-add" onclick={() => addItem(cat.id)}>
                    + Add another item
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

  <!-- Guide Links -->
  <div class="guide-links">

    <a href={resolve('/guide/06-gear-system')} class="guide-link chapter-link">
      <span class="link-icon">📚</span>
      <span class="link-text">Full Gear System Guide</span>
      <span class="link-arrow">→</span>
    </a>
    <a href={resolve('/guide#06-gear-system')} class="guide-link field-guide-link">
      <span class="link-icon">📖</span>
      <span class="link-text">Field Guide</span>
      <span class="link-arrow">→</span>
    </a>
  </div>
</div>

<style>
  .pack-builder {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pack-builder.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Weight Hero */
  .weight-hero {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .weight-display {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .weight-ring {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .weight-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: var(--border);
    stroke-width: 10;
  }

  .ring-fill {
    fill: none;
    stroke: var(--ring-color);
    stroke-width: 10;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }

  .weight-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .weight-num {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .weight-unit {
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
  }

  .weight-meta {
    flex: 1;
  }

  .weight-class {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    color: #fff;
  }

  .class-icon {
    font-size: 0.9rem;
  }

  .class-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .weight-desc {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }

  /* Weight Bar */
  .weight-bar {
    margin-top: 1rem;
  }

  .bar-track {
    display: flex;
    height: 20px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid var(--border);
  }

  .bar-seg {
    transition: width 0.4s ease;
  }

  .bar-seg.base { background: var(--pine); }
  .bar-seg.food { background: var(--terra); }
  .bar-seg.water { background: #3b82f6; }

  .bar-legend {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    margin-top: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot.base { background: var(--pine); }
  .dot.food { background: var(--terra); }
  .dot.water { background: #3b82f6; }

  /* Consumables Inline */
  .consumables-inline {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px dashed var(--border);
  }

  .consumable-mini {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .consumable-icon {
    font-size: 1rem;
  }

  .mini-stepper {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .mini-stepper button {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    font-size: 1rem;
    color: var(--pine);
    cursor: pointer;
    transition: all 0.15s;
  }

  .mini-stepper button:hover {
    background: var(--alpine);
    color: #fff;
  }

  .mini-val {
    min-width: 32px;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .consumable-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.25rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--pine);
    letter-spacing: 0.08em;
  }

  .header-bar {
    width: 4px;
    height: 16px;
    background: var(--marker);
    border-radius: 2px;
  }

  /* Controls Section */
  .controls-section {
    padding: 1.25rem 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .controls-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .builder-intro h3 {
    margin: 0 0 0.25rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--pine);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .builder-intro p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
  }


  .base-pill {
    padding: 0.4rem 0.75rem;
    background: color-mix(in srgb, var(--pill-color) 15%, white);
    border: 2px solid var(--pill-color);
    border-radius: 20px;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pill-color);
  }

  .controls-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .btn {
    height: 34px;
    padding: 0 0.75rem;
    border-radius: 10px;
    border: 2px solid var(--border);
    background: #fff;
    color: var(--ink);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.08s ease, background 0.12s ease, border-color 0.12s ease;
  }

  .btn:hover {
    background: color-mix(in srgb, var(--alpine) 6%, #fff);
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn.primary {
    border-color: color-mix(in srgb, var(--alpine) 65%, var(--border));
    background: linear-gradient(135deg, color-mix(in srgb, var(--alpine) 28%, #fff), #fff);
  }

  .btn.secondary {
    background: #fff;
  }

  a.btn.link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .recs {
    margin-top: 1rem;
    padding: 1rem;
    border: 2px solid var(--border);
    border-radius: 14px;
    background: #fff;
  }

  .recs-head {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .recs-head h4 {
    margin: 0;
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .recs-head p {
    margin: 0.25rem 0 0;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .recs-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .field input,
  .field select {
    height: 34px;
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 0 0.6rem;
    font-size: 0.85rem;
    color: var(--ink);
    background: #fff;
  }

  .recs-group {
    padding-top: 0.75rem;
    border-top: 1px dashed var(--border);
  }

  .recs-group:first-child {
    border-top: none;
    padding-top: 0;
  }

  .recs-group-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-weight: 800;
    color: var(--pine);
    margin-bottom: 0.5rem;
  }

  .recs-group-tag {
    margin-left: auto;
    font-size: 0.7rem;
    color: var(--muted);
    border: 1px solid var(--border);
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
  }

  .rec-item {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  }

  .rec-item:last-child {
    border-bottom: none;
  }

  .rec-name {
    font-weight: 800;
    color: var(--ink);
  }

  .rec-meta {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .rec-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  /* Big 3 Section */
  .big3-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .big3-badge {
    margin-left: auto;
    padding: 0.2rem 0.5rem;
    background: var(--alpine);
    color: #fff;
    border-radius: 4px;
    font-size: 0.65rem;
    letter-spacing: 0.03em;
  }

  .big3-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .big3-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem 0.5rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .big3-card.total {
    background: var(--pine);
    border-color: var(--pine);
  }

  .big3-card.total .big3-name,
  .big3-card.total .big3-weight {
    color: #fff;
  }

  .big3-icon {
    font-size: 1.35rem;
  }

  .big3-name {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .big3-weight {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pine);
  }

  .tips-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }

  .tip-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tip-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  /* Categories Section */
  .categories-section {
    padding: 1.5rem;
    background: var(--bg);
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .category-card.expanded {
    border-color: var(--alpine);
  }

  .cat-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .cat-icon {
    font-size: 1.25rem;
    width: 1.5rem;
    text-align: center;
  }

  .cat-info {
    flex: 1;
  }

  .cat-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .cat-name {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--pine);
  }

  .cat-bar {
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }

  .cat-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .cat-chevron {
    font-size: 0.6rem;
    color: var(--muted);
    transition: transform 0.2s;
  }

  .category-card.expanded .cat-chevron {
    transform: rotate(180deg);
    color: var(--pine);
  }

  .cat-items {
    padding: 0 1rem 0.75rem;
    border-top: 2px solid var(--border);
    background: var(--bg);
  }

  .gear-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    padding: 0.55rem 0.35rem;
    margin: 0 -0.35rem;
    border-bottom: 1px dashed var(--border);
    font-size: 0.8rem;
    border-radius: 10px;
    transition: background 0.15s ease;
  }

  .gear-item:hover {
    background: color-mix(in srgb, var(--alpine) 6%, transparent);
  }

  .gear-item:focus-within {
    background: color-mix(in srgb, var(--alpine) 10%, transparent);
  }

  .item-main {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .item-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .item-sub {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .item-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.45rem;
  }

  .item-cat,
  .item-input,
  .item-weight-input,
  .item-cost-input,
  .item-url-input {
    width: 100%;
    border: 2px solid var(--border);
    border-radius: 8px;
    background: #fff;
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
    color: var(--ink);
  }

  .item-input {
    flex: 1;
    min-width: 0;
  }

  .item-cat:focus,
  .item-input:focus,
  .item-weight-input:focus,
  .item-cost-input:focus,
  .item-url-input:focus {
    outline: none;
    border-color: var(--alpine);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--alpine) 25%, transparent);
  }

  .item-weight-input {
    max-width: 82px;
    text-align: right;
    padding-right: 2.1rem;
  }

  .item-weight-wrap {
    position: relative;
  }

  .item-weight-unit {
    position: absolute;
    right: 0.55rem;
    top: 50%;
    transform: translateY(-50%);
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--muted) 75%, transparent);
    pointer-events: none;
  }

  .item-weight-input::-webkit-outer-spin-button,
  .item-weight-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .item-weight-input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .item-input::placeholder,
  .item-weight-input::placeholder,
  .item-cost-input::placeholder,
  .item-url-input::placeholder {
    color: color-mix(in srgb, var(--muted) 70%, transparent);
  }

  .item-cat {
    flex: 0 0 auto;
    max-width: 150px;
    cursor: pointer;
  }

  .item-cost-wrap {
    position: relative;
    flex: 0 0 auto;
  }

  .item-cost-dollar {
    position: absolute;
    left: 0.55rem;
    top: 50%;
    transform: translateY(-50%);
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 800;
    color: color-mix(in srgb, var(--muted) 80%, transparent);
    pointer-events: none;
  }

  .item-cost-input {
    width: 92px;
    padding-left: 1.3rem;
    text-align: right;
  }

  .item-url-input {
    flex: 1;
    min-width: 0;
  }

  .item-open {
    flex: 0 0 auto;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--pine, #4a5a44);
    text-decoration: none;
    padding: 0.25rem 0.4rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 75%, transparent);
  }

  .item-open:hover {
    text-decoration: underline;
  }

  .item-pill-btn {
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.6rem;
    border: 2px solid var(--border);
    border-radius: 999px;
    background: #fff;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
  }

  .item-pill-btn:hover {
    border-color: var(--alpine);
    background: color-mix(in srgb, var(--alpine) 8%, #fff);
    color: var(--pine);
  }

  .item-pill-btn:focus {
    outline: none;
    border-color: var(--alpine);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--alpine) 25%, transparent);
  }

  .item-pill-btn.worn.isOn {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .item-icon-btn {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 2px solid var(--border);
    border-radius: 8px;
    background: #fff;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1;
    font-size: 0.95rem;
  }

  .item-icon-btn:hover {
    border-color: var(--alpine);
    background: color-mix(in srgb, var(--alpine) 8%, #fff);
    color: var(--pine);
  }

  .item-icon-btn:focus {
    outline: none;
    border-color: var(--alpine);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--alpine) 25%, transparent);
  }

  .item-icon-btn.remove {
    color: #b91c1c;
    opacity: 0;
    transform: scale(0.98);
    pointer-events: none;
  }

  .gear-item:hover .item-icon-btn.remove,
  .gear-item:focus-within .item-icon-btn.remove {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .item-icon-btn.remove:hover {
    border-color: #b91c1c;
    background: color-mix(in srgb, #b91c1c 8%, #fff);
    color: #7f1d1d;
  }

  .item-add {
    margin-top: 0.5rem;
    width: 100%;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    border: 2px dashed var(--border);
    background: transparent;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--pine);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .item-add:hover {
    border-color: var(--alpine);
    color: var(--alpine);
    background: color-mix(in srgb, var(--alpine) 8%, transparent);
  }

  .gear-item:last-child {
    border-bottom: none;
  }

  /* Guide Link */
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
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
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
    .weight-display {
      flex-direction: column;
      text-align: center;
    }

    .controls-section {
      flex-direction: column;
      align-items: stretch;
    }

    .big3-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
