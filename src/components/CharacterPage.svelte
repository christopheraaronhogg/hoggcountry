<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { loadCharacter, character, type CharacterV1, type CharacterEquipmentItem } from '../stores/character.svelte';
  import { loadContext, trailContext } from '../stores/trailContext.svelte';
  import { getLevelInfo, getDailyMissions, getPerkStatuses, purchasePerk, claimDailyMission, type DailyMissionStatus, type PerkStatus } from '../lib/progression';
  import { computeWarmthStats } from '../lib/warmth';

  // --- Logic & Data ---

  loadCharacter();

  let mounted = $state(false);
  let activeTab = $state<'character' | 'skills' | 'goals'>('character');

  // Loaders
  onMount(() => {
    loadCharacter();
    loadContext();
    mounted = true;
  });

  // Derived: Character Identity
  function canonicalName() {
    const a = (character.core.displayName || '').trim();
    const b = (character.core.nickname || '').trim();
    return a || b || 'Unnamed Hiker';
  }

  // Derived: Progression / Level
  function prog() {
    return (character.data as any).progression || { xp: 0, marks: 0 };
  }
  
  let levelInfo = $derived.by(() => getLevelInfo(prog()?.xp || 0));
  let marks = $derived.by(() => Number(prog()?.marks) || 0);

  // Derived: Attributes (Hiking Stats)
  let stats = $derived.by(() => {
    const fitnessMap: Record<string, number> = { 'sedentary': 5, 'moderate': 10, 'athletic': 15, 'elite': 20 };
    const expMap: Record<string, number> = { 'none': 5, 'some': 10, 'thru-hiker': 15, 'triple-crowner': 20 };
    
    // Conditioning = Fitness + miles
    const baseCond = fitnessMap[character.training.currentFitness] || 10;
    const mileCond = Math.floor(character.trail.currentMile / 50);
    
    // Trail Sense = Experience + marks earned
    const baseSense = expMap[character.training.hikingExperience] || 10;
    
    // Momentum = Inverse of zero days
    const baseMom = Math.max(0, 20 - character.trail.zeroDaysPerMonth);

    // Warmth = Warmth Rating
    const warmth = computeWarmthStats();

    return {
      conditioning: baseCond + mileCond,
      trailSense: baseSense + Math.floor(marks / 10),
      pace: character.trail.targetPace,
      momentum: baseMom,
      warmthIndex: warmth.warmthIndex,
      dryTime: (warmth.minutesStorm35F / 60).toFixed(1)
    };
  });

  // Derived: Inventory Slots
  function findItem(keywords: string[], category?: string): CharacterEquipmentItem | null {
    const inv = character.equipment.inventory.items || [];
    
    // 1. Try to find worn item in category
    if (category) {
        const wornCat = inv.find(i => i.worn && i.category === category);
        if (wornCat) return wornCat;
    }

    // 2. Try to find any worn item matching keywords
    const wornKey = inv.find(i => i.worn && keywords.some(k => (i.name + ' ' + i.category).toLowerCase().includes(k)));
    if (wornKey) return wornKey;

    // 3. Fallback: First item in category
    if (category) {
        const firstCat = inv.find(i => i.category === category);
        if (firstCat) return firstCat;
    }
    
    // 4. Fallback: First item matching keywords
    return inv.find(i => keywords.some(k => (i.name + ' ' + i.category).toLowerCase().includes(k))) || null;
  }

  let slots = $derived.by(() => {
    return {
      head: findItem(['hat', 'cap', 'beanie', 'balaclava']),
      neck: findItem(['buff', 'scarf', 'neck']),
      shelter: findItem(['tent', 'hammock', 'tarp', 'bivy'], 'shelter'), // Replaces Shoulders
      pack: findItem(['pack', 'backpack', 'rucksack'], 'pack'), // Back
      insulation: findItem(['puffy', 'jacket', 'fleece', 'down', 'synthetic'], 'clothing'), // Chest
      baseLayer: findItem(['shirt', 'base', 'tee', 'top'], 'clothing'), // Shirt
      rainGear: findItem(['rain', 'poncho', 'shell', 'frog toggs'], 'clothing'), // Tabard
      tech: findItem(['watch', 'garmin', 'apple', 'gps'], 'electronics'), // Wrist
      hands: findItem(['glove', 'mitt'], 'clothing'),
      sleepSystem: findItem(['bag', 'quilt', 'sleeping'], 'sleep'), // Replaces Waist
      legs: findItem(['pant', 'legging', 'short', 'trousers', 'skirt'], 'clothing'),
      feet: findItem(['shoe', 'boot', 'runner', 'alatra', 'hoka'], 'clothing'),
      socks: findItem(['sock', 'darn tough', 'injinji']), // Finger 1
      gaiters: findItem(['gaiter', 'dirty girl']), // Finger 2
      navigation: findItem(['compass', 'map', 'guide', 'awol', 'farout']), // Trinket 1
      illumination: findItem(['headlamp', 'torch', 'light', 'nu25']), // Trinket 2
      trekkingPoles: findItem(['pole', 'stick', 'staff']), // Main Hand
      hydration: findItem(['water', 'bottle', 'bladder', 'smartwater', 'sawyer'], 'water'), // Off Hand
      safety: findItem(['first aid', 'med', 'bear', 'knife', 'trowel'], 'first-aid') // Ranged
    };
  });

  // Derived: Base Stats
  let baseWeight = $derived.by(() => {
    const inv = character.equipment.inventory.items || [];
    const oz = inv.filter(i => !i.worn).reduce((s, i) => s + (Number(i.weightOz) || 0), 0);
    return (oz / 16).toFixed(1);
  });

  // --- Goals Logic ---
  let today = new Date().toISOString().slice(0, 10);
  let missions = $derived.by(() => getDailyMissions(today));
  
  function claim(m: DailyMissionStatus) {
    const res = claimDailyMission(today, m.id);
    if (res.ok) {
        loadCharacter();
    }
  }

  // --- Skills Logic ---
  let perks = $derived.by(() => getPerkStatuses());
  function unlock(p: PerkStatus) {
    purchasePerk(p.id);
    loadCharacter();
  }

  function handleImgError(e: Event) {
    (e.currentTarget as HTMLElement).style.display = 'none';
  }
</script>

<div class="wow-sheet" class:mounted>
  <!-- Main Character Frame -->
  <div class="frame">
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="portrait-frame">
        <div class="portrait-bg"></div>
        <div class="level-badge">{levelInfo.level}</div>
      </div>
      <div class="info-block">
        <h1 class="char-name">{canonicalName()}</h1>
        <div class="char-class">Level {levelInfo.level} {character.core.nickname ? `"${character.core.nickname}"` : ''} Hiker</div>
      </div>
    </header>

    <!-- Content Area -->
    <div class="content-area">
      
      <!-- Left Column: Attributes -->
      <div class="col-left">
        <div class="panel attributes">
          <h3 class="panel-header">Vital Stats</h3>
          <div class="attr-row"><span class="attr-label">Conditioning</span> <span class="attr-val">{stats.conditioning}</span></div>
          <div class="attr-row"><span class="attr-label">Trail Sense</span> <span class="attr-val">{stats.trailSense}</span></div>
          <div class="attr-row"><span class="attr-label">Pace</span> <span class="attr-val">{stats.pace} mpd</span></div>
          <div class="attr-row"><span class="attr-label">Momentum</span> <span class="attr-val">{stats.momentum}</span></div>
          <div class="attr-row"><span class="attr-label">Warmth</span> <span class="attr-val">{stats.warmthIndex}</span></div>
        </div>

        <div class="panel resistance">
          <h3 class="panel-header">Comfort Ratings</h3>
           <div class="attr-row"><span class="attr-label">Warmth Score</span> <span class="attr-val">{stats.warmthIndex}</span></div>
           <div class="attr-row"><span class="attr-label">Dry Time</span> <span class="attr-val">{stats.dryTime}h</span></div>
        </div>
      </div>

      <!-- Center Column: Character Model & Slots -->
      <div class="col-center">
        <div class="model-silhouette">
            <svg viewBox="0 0 100 200" fill="currentColor" opacity="0.1">
                <path d="M50 0 C40 0 32 8 32 18 C32 28 40 36 50 36 C60 36 68 28 68 18 C68 8 60 0 50 0 Z M50 40 C30 40 15 50 15 80 L20 150 L40 190 L60 190 L80 150 L85 80 C85 50 70 40 50 40 Z" />
            </svg>
        </div>

        <!-- Left Slots -->
        <div class="gear-column left">
          <div class="slot" title="Headwear">
            {#if slots.head}<img src={slots.head.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.head}<span class="empty-slot">Head</span>{/if}
          </div>
          <div class="slot" title="Neck / Buff">
            {#if slots.neck}<img src={slots.neck.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.neck}<span class="empty-slot">Neck</span>{/if}
          </div>
          <div class="slot" title="Shelter">
             {#if slots.shelter}<img src={slots.shelter.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
             <div class="slot-border"></div>
             {#if !slots.shelter}<span class="empty-slot">Shelter</span>{/if}
          </div>
          <div class="slot" title="Pack">
            {#if slots.pack}<img src={slots.pack.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.pack}<span class="empty-slot">Pack</span>{/if}
          </div>
          <div class="slot" title="Insulation">
            {#if slots.insulation}<img src={slots.insulation.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.insulation}<span class="empty-slot">Warmth</span>{/if}
          </div>
          <div class="slot" title="Base Layer">
             {#if slots.baseLayer}<img src={slots.baseLayer.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
             <div class="slot-border"></div>
             {#if !slots.baseLayer}<span class="empty-slot">Base</span>{/if}
          </div>
           <div class="slot" title="Rain Gear">
             {#if slots.rainGear}<img src={slots.rainGear.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
             <div class="slot-border"></div>
             {#if !slots.rainGear}<span class="empty-slot">Rain</span>{/if}
          </div>
          <div class="slot" title="Tech / Watch">
            {#if slots.tech}<img src={slots.tech.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.tech}<span class="empty-slot">Tech</span>{/if}
          </div>
        </div>

        <!-- Right Slots -->
        <div class="gear-column right">
          <div class="slot" title="Hands">
            {#if slots.hands}<img src={slots.hands.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.hands}<span class="empty-slot">Hands</span>{/if}
          </div>
          <div class="slot" title="Sleep System">
            {#if slots.sleepSystem}<img src={slots.sleepSystem.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.sleepSystem}<span class="empty-slot">Sleep</span>{/if}
          </div>
          <div class="slot" title="Legwear">
            {#if slots.legs}<img src={slots.legs.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.legs}<span class="empty-slot">Legs</span>{/if}
          </div>
          <div class="slot" title="Footwear">
            {#if slots.feet}<img src={slots.feet.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
            {#if !slots.feet}<span class="empty-slot">Feet</span>{/if}
          </div>
          <div class="slot" title="Socks">
            {#if slots.socks}<img src={slots.socks.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
             {#if !slots.socks}<span class="empty-slot">Socks</span>{/if}
          </div>
          <div class="slot" title="Gaiters">
            {#if slots.gaiters}<img src={slots.gaiters.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
             {#if !slots.gaiters}<span class="empty-slot">Gaiters</span>{/if}
          </div>
          <div class="slot" title="Navigation">
             {#if slots.navigation}<img src={slots.navigation.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
             {#if !slots.navigation}<span class="empty-slot">Nav</span>{/if}
          </div>
          <div class="slot" title="Illumination">
            {#if slots.illumination}<img src={slots.illumination.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
            <div class="slot-border"></div>
             {#if !slots.illumination}<span class="empty-slot">Light</span>{/if}
          </div>
        </div>

        <!-- Bottom Weapon Slots -->
        <div class="gear-row-bottom">
            <div class="slot weapon" title="Trekking Poles">
                {#if slots.trekkingPoles}<img src={slots.trekkingPoles.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
                <div class="slot-border"></div>
                 {#if !slots.trekkingPoles}<span class="empty-slot">Poles</span>{/if}
            </div>
             <div class="slot weapon" title="Hydration">
                 {#if slots.hydration}<img src={slots.hydration.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
                <div class="slot-border"></div>
                 {#if !slots.hydration}<span class="empty-slot">Water</span>{/if}
            </div>
             <div class="slot weapon" title="First Aid / Safety">
                 {#if slots.safety}<img src={slots.safety.url || ''} alt="" class="item-icon" onerror={handleImgError}/>{/if}
                <div class="slot-border"></div>
                 {#if !slots.safety}<span class="empty-slot">Safety</span>{/if}
            </div>
        </div>
      </div>

      <!-- Right Column: Stats -->
      <div class="col-right">
         <div class="panel stats">
            <h3 class="panel-header">Base Stats</h3>
             <div class="attr-row"><span class="attr-label">Base Weight</span> <span class="attr-val gold">{baseWeight} lb</span></div>
             <div class="attr-row"><span class="attr-label">Mileage</span> <span class="attr-val gold">{character.trail.currentMile.toFixed(1)}</span></div>
             <div class="attr-row"><span class="attr-label">Marks</span> <span class="attr-val gold">{marks}</span></div>
         </div>
      </div>
    </div>
    
    <!-- XP Bar -->
    <div class="xp-container">
        <div class="xp-bar" style="width: {levelInfo.pctToNext}%"></div>
        <div class="xp-text">{levelInfo.xpIntoLevel} / {levelInfo.xpToNext} XP</div>
        <div class="xp-ticks">
            {#each {length: 19} as _, i}
                <div class="tick"></div>
            {/each}
        </div>
    </div>
  </div>

  <!-- Bottom Tabs -->
  <div class="bottom-tabs">
      <button class="tab-btn" class:active={activeTab === 'character'} onclick={() => activeTab = 'character'}>Hiker Profile</button>
      <button class="tab-btn" class:active={activeTab === 'goals'} onclick={() => activeTab = 'goals'}>Daily Goals</button>
      <button class="tab-btn" class:active={activeTab === 'skills'} onclick={() => activeTab = 'skills'}>Skills & Perks</button>
  </div>
  
  <!-- Tab Content Overlays -->
  {#if activeTab === 'goals'}
    <div class="overlay-panel" transition:fade={{duration: 150}}>
        <h2 class="h2-wow">Daily Goals</h2>
        <div class="quest-list">
             {#each missions as m}
                <div class="quest-item" class:completed={m.done}>
                    <div class="quest-header">
                        <span class="quest-title">{m.title}</span>
                        <span class="quest-reward">{m.rewardXp} XP</span>
                    </div>
                    <div class="quest-desc">{m.description}</div>
                    <div class="quest-progress">
                        <div class="quest-bar-bg"><div class="quest-bar-fill" style="width: {(m.progress/m.target)*100}%"></div></div>
                        <div class="quest-status">
                            {m.progress} / {m.target}
                            {#if m.done && !m.claimed}
                                <button class="claim-btn" onclick={() => claim(m)}>Claim Reward</button>
                            {/if}
                            {#if m.claimed}
                                <span class="claimed-txt">Completed</span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        <button class="close-btn" onclick={() => activeTab = 'character'}>Close</button>
    </div>
  {/if}

   {#if activeTab === 'skills'}
    <div class="overlay-panel" transition:fade={{duration: 150}}>
        <h2 class="h2-wow">Skills & Perks</h2>
        <div class="perk-grid">
             {#each perks as p}
                <div class="perk-card" class:unlocked={p.unlocked}>
                    <div class="perk-icon"></div>
                    <div class="perk-info">
                        <div class="perk-name">{p.name}</div>
                        <div class="perk-desc">{p.description}</div>
                        <div class="perk-cost">Cost: {p.costMarks} Marks</div>
                         {#if !p.unlocked}
                            <button class="claim-btn" disabled={!p.canAfford} onclick={() => unlock(p)}>Learn</button>
                         {:else}
                            <span class="learned-txt">Learned</span>
                         {/if}
                    </div>
                </div>
            {/each}
        </div>
        <button class="close-btn" onclick={() => activeTab = 'character'}>Close</button>
    </div>
  {/if}

</div>

<style>
  /* WoW Style Tokens */
  .wow-sheet {
    --bg-dark: #0a0a0a;
    --bg-panel: #e3d5b4; /* Parchmentish */
    --border-gold: #c69b6d;
    --border-silver: #4a4a4a;
    --text-dark: #2a221b;
    --text-gold: #ffd100;
    --slot-bg: #1a1a1a;
    
    font-family: 'Oswald', sans-serif;
    color: var(--text-dark);
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    padding-bottom: 3rem;
  }
  
  .frame {
    background-color: var(--bg-dark);
    border: 2px solid var(--border-gold);
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
    padding: 10px;
    position: relative;
  }

  /* Top Bar */
  .top-bar {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-gold);
  }

  .portrait-frame {
    width: 64px;
    height: 64px;
    background: #222;
    border: 2px solid var(--border-gold);
    position: relative;
    border-radius: 4px;
  }
  
  .level-badge {
    position: absolute;
    bottom: -8px;
    right: -8px;
    background: var(--border-gold);
    color: #000;
    font-weight: bold;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid #fff;
    font-size: 0.8rem;
  }

  .info-block {
    flex: 1;
  }

  .char-name {
    margin: 0;
    color: var(--text-gold);
    font-size: 1.5rem;
    letter-spacing: 0.05em;
    text-shadow: 1px 1px 2px black;
  }

  .char-class {
    color: #888;
    font-size: 0.9rem;
  }

  /* Content Area (3 Cols) */
  .content-area {
    display: grid;
    grid-template-columns: 200px 1fr 200px;
    gap: 10px;
    background: url('/default-background.svg'); /* Placeholder texture */
    background-size: cover;
    min-height: 500px;
  }

  @media (max-width: 768px) {
    .content-area {
        grid-template-columns: 1fr;
    }
    .col-left, .col-right {
        display: none; /* Hide stats on mobile for now to fit slots */
    }
  }

  /* Panels */
  .panel {
    background: rgba(0,0,0,0.6);
    border: 1px solid var(--border-gold);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .panel-header {
    color: var(--text-gold);
    font-size: 0.9rem;
    text-transform: uppercase;
    margin: 0 0 0.5rem 0;
    border-bottom: 1px solid #444;
    padding-bottom: 2px;
  }

  .attr-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #ccc;
    margin-bottom: 4px;
  }
  
  .attr-val {
    color: #fff;
    font-weight: bold;
  }
  
  .attr-val.gold {
    color: var(--text-gold);
  }

  /* Center (Slots) */
  .col-center {
    position: relative;
    display: flex;
    justify-content: space-between; /* Slots push to edges */
    padding: 20px 0;
  }
  
  .model-silhouette {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 0;
    color: rgba(255,255,255,0.05);
  }
  
  .gear-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1;
  }

  .gear-row-bottom {
      position: absolute;
      bottom: 10px;
      left: 0; 
      right: 0;
      display: flex;
      justify-content: center;
      gap: 20px;
      z-index: 1;
  }

  .slot {
    width: 48px;
    height: 48px;
    background-color: var(--slot-bg);
    border: 1px solid #444;
    border-radius: 4px;
    position: relative;
    box-shadow: inset 0 0 10px #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .slot.weapon {
      width: 52px;
      height: 52px;
  }

  .slot-border {
    position: absolute;
    inset: -1px;
    border: 1px solid #666;
    border-radius: 4px;
    pointer-events: none;
  }

  .empty-slot {
    font-size: 0.6rem;
    color: #444;
    text-transform: uppercase;
    text-align: center;
    pointer-events: none;
  }

  .item-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 3px;
  }

  /* XP Bar */
  .xp-container {
    height: 18px;
    background: #111;
    border: 1px solid #444;
    border-radius: 9px;
    margin-top: 10px;
    position: relative;
    overflow: hidden;
  }

  .xp-bar {
    height: 100%;
    background: purple; /* Default wow xp color */
    background: linear-gradient(to bottom, #a335ee, #7c12c9);
    transition: width 0.3s;
  }
  
  .xp-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.7rem;
      text-shadow: 1px 1px 1px #000;
      z-index: 2;
  }
  
  .xp-ticks {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: space-evenly;
  }
  
  .tick {
      width: 1px;
      height: 100%;
      background: rgba(0,0,0,0.5);
  }

  /* Tabs */
  .bottom-tabs {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
  }
  
  .tab-btn {
      background: #333;
      border: 1px solid #555;
      color: #aaa;
      padding: 8px 16px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      border-radius: 4px;
  }
  
  .tab-btn.active {
      background: var(--bg-panel);
      color: var(--text-dark);
      border-color: var(--border-gold);
      font-weight: bold;
  }

  /* Overlays */
  .overlay-panel {
      position: absolute;
      inset: 0;
      background: url('/default-background.svg');
      background-size: cover;
      background-color: var(--bg-panel); /* Fallback */
      z-index: 10;
      padding: 20px;
      border: 2px solid var(--border-gold);
      display: flex;
      flex-direction: column;
      color: var(--text-dark);
  }

  .h2-wow {
      text-align: center;
      font-size: 1.5rem;
      color: #4a2e15;
      border-bottom: 2px solid #4a2e15;
      margin-bottom: 20px;
  }
  
  .close-btn {
      margin-top: auto;
      align-self: center;
      padding: 10px 30px;
      background: #8b0000;
      color: #fff;
      border: 1px solid #555;
      cursor: pointer;
  }
  
  .quest-item {
      background: rgba(255,255,255,0.4);
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #aaa;
  }
  
  .quest-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
  }
  
  .claim-btn {
      background: gold;
      border: 1px solid orange;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 2px 6px;
  }
</style>
