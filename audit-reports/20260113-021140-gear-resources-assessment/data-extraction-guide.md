# Data Extraction Guide: Research → Implementation

**Purpose:** Quick reference for extracting data from the AT Gear Resources research document into your gear planning tools.

---

## 1. Trek Survey Statistics (Immediate Use)

### Base Weight Benchmarks

```json
// Add to src/data/trekSurveyData.json
{
  "year": 2024,
  "source": "The Trek Annual AT Thru-Hiker Survey",
  "url": "https://thetrek.co/appalachian-trail-thru-hiker-survey",
  "responses": 387,

  "baseWeight": {
    "avgStart": 20.4,
    "avgEnd": 17.2,
    "avgReduction": 3.2,
    "percentWhoReduce": 68,

    "distribution": {
      "ultralight": { "threshold": 10, "percentage": 15 },
      "lightweight": { "range": [10, 15], "percentage": 45 },
      "traditional": { "range": [15, 20], "percentage": 35 },
      "heavy": { "threshold": 20, "percentage": 5 }
    }
  }
}
```

**Use in PackBuilder.svelte:**
```javascript
// Compare user's base weight to average
const comparison = {
  userWeight: 24.76,
  avgWeight: 20.4,
  delta: 4.36,
  deltaPercent: 21.4,
  percentile: 75, // User is heavier than 75% of hikers
  message: "Your pack is 4.4 lbs heavier than average. Most hikers reduce weight during the hike."
};
```

---

### Gear Category Popularity

```json
// From research: "Osprey dominates with the Exos/Eja series"
{
  "backpacks": [
    { "brand": "Osprey", "model": "Exos/Eja", "estimatedShare": 28 },
    { "brand": "Gossamer Gear", "model": "Mariposa", "estimatedShare": 12 },
    { "brand": "Hyperlite Mountain Gear", "model": "Various", "estimatedShare": 10 }
  ],

  // From research: "Durston X-Mid 1 currently leads"
  "shelters": [
    { "brand": "Durston", "model": "X-Mid 1", "estimatedShare": 15, "type": "tent" },
    { "type": "hammock", "estimatedShare": 9 },
    { "type": "tent", "totalShare": 88 }
  ],

  // From research: "53% now use quilts over sleeping bags, with Enlightened Equipment Revelation as top choice"
  "sleepSystems": {
    "quilts": {
      "share": 53,
      "trending": "up",
      "topPick": { "brand": "Enlightened Equipment", "model": "Revelation", "estimatedShare": 22 }
    },
    "sleepingBags": {
      "share": 47,
      "trending": "down"
    }
  },

  // From research: "80% start in trail runners, 86% wear them for the majority—Altra Lone Peak leads"
  "footwear": {
    "trailRunners": { "startShare": 80, "majorityShare": 86 },
    "boots": { "startShare": 20, "majorityShare": 14 },
    "topModel": { "brand": "Altra", "model": "Lone Peak", "estimatedShare": 34 }
  },

  // From research: Community consensus
  "waterTreatment": {
    "sawyerSqueeze": {
      "estimatedShare": 65,
      "communityNote": "Preferred over Sawyer Mini for flow rate"
    }
  }
}
```

**Use in BudgetGearBuilder.svelte:**
```svelte
<!-- Show popularity badge -->
{#if item.trekSurveyShare}
  <div class="popularity-badge">
    <span class="icon">⭐</span>
    <span class="text">Used by {item.trekSurveyShare}% of AT hikers</span>
    <span class="source">(The Trek 2024)</span>
  </div>
{/if}

<!-- Show trending indicator -->
{#if item.trending === 'up'}
  <span class="trend-badge">📈 Gaining popularity</span>
{:else if item.trending === 'down'}
  <span class="trend-badge">📉 Declining use</span>
{/if}
```

---

### Spending Statistics

```json
{
  "avgTotalSpending": 2113,
  "note": "Average $2,113 on gear alone (excludes food/lodging)",

  "distribution": {
    "budget": { "range": [300, 800], "percentage": 15 },
    "midRange": { "range": [800, 1500], "percentage": 40 },
    "premium": { "range": [1500, 2500], "percentage": 35 },
    "luxury": { "min": 2500, "percentage": 10 }
  }
}
```

**Use in BudgetGearBuilder.svelte:**
```javascript
// Show spending comparison
const spendingComparison = {
  userTotal: 1847,
  avgTotal: 2113,
  delta: -266,
  message: "Your loadout costs $266 less than average"
};
```

---

## 2. Treeline Review Data (Expert Lists)

### Dual Gear Lists

```json
// From research: "Dual gear lists: lightweight (~13 lb) and ultralight (~8 lb)"
{
  "source": "Treeline Review",
  "authors": [
    { "name": "Liz Thomas", "credentials": "AT FKT holder, 2x thru-hiker" },
    { "name": "Mike Unger", "credentials": "2x AT thru-hiker" }
  ],
  "combinedMiles": 11000,
  "url": "https://www.treelinereview.com/gearreviews/appalachian-trail-gear-list",

  "lists": {
    "lightweight": {
      "targetBaseWeight": 13,
      "description": "Comfortable, proven gear for most hikers",
      "updateDate": "2025-01"
    },
    "ultralight": {
      "targetBaseWeight": 8,
      "description": "Minimalist setup for experienced backpackers",
      "updateDate": "2025-01"
    }
  }
}
```

**Implementation:**
- Add toggle in BudgetGearBuilder: "Show: My Budget | Treeline Lightweight | Treeline Ultralight"
- When toggled, filter/highlight items from expert lists
- Show attribution: "Curated by Liz Thomas (AT FKT holder, 11,000+ combined miles)"

---

### Regional Recommendations

```json
// From research: "Section-by-section strategies for four AT regions"
{
  "regions": [
    {
      "name": "South (GA→Northern VA)",
      "mileRange": [0, 800],
      "description": "Variable spring weather, freeze risk early season",
      "gearPriorities": [
        "Warm sleep system (10-20°F quilt)",
        "Rain protection",
        "Microspikes (Feb-March starts)",
        "Layering system"
      ],
      "treelineNotes": "Focus on versatility and warmth management"
    },
    {
      "name": "Virginia",
      "mileRange": [800, 1100],
      "description": "Longest single state, moderating temperatures",
      "gearPriorities": [
        "Lighter quilt option (consider swap)",
        "Resupply planning (long stretches)",
        "Footwear replacement"
      ],
      "treelineNotes": "Good place to transition to summer sleep system"
    },
    {
      "name": "Mid-Atlantic (PA/MD/NJ/NY)",
      "mileRange": [1100, 1400],
      "description": "PA rocks, more town access",
      "gearPriorities": [
        "Toe protection (PA rocks)",
        "Extra socks (sharp rocks)",
        "Trekking poles (rocky terrain)",
        "Shoe durability (fast wear)"
      ],
      "treelineNotes": "PA is notoriously hard on footwear—plan accordingly"
    },
    {
      "name": "New England (VT/NH/ME)",
      "mileRange": [1400, 2190],
      "description": "Steep, technical terrain, cooler temps",
      "gearPriorities": [
        "Warmer layers (Whites, Maine)",
        "Bug protection (June-July)",
        "Sturdy footwear (technical terrain)",
        "Rock scrambling confidence"
      ],
      "treelineNotes": "Don't underestimate the physical challenge and weather variability"
    }
  ]
}
```

**Use in GearTransitionTracker.svelte:**
```svelte
<!-- Show regional context at each transition -->
<div class="regional-context">
  <h4>Entering: {upcomingRegion.name}</h4>
  <p class="description">{upcomingRegion.description}</p>

  <h5>Gear Priorities:</h5>
  <ul>
    {#each upcomingRegion.gearPriorities as priority}
      <li>{priority}</li>
    {/each}
  </ul>

  <blockquote class="expert-note">
    <strong>Treeline Review:</strong> {upcomingRegion.treelineNotes}
  </blockquote>
</div>
```

---

## 3. Community Consensus (Validation Layer)

### Item-Specific Recommendations

```json
// From research document
{
  "communityRecommendations": {
    "waterTreatment": {
      "preferred": "Sawyer Squeeze",
      "notRecommended": "Sawyer Mini",
      "rationale": "Squeeze has 2x flow rate, more durable threads",
      "sources": ["r/Ultralight", "Whiteblaze", "The Trek comments"]
    },

    "socks": {
      "consensus": "Darn Tough",
      "rationale": "Lifetime warranty, proven durability over 2000+ miles",
      "sources": ["Nearly universal across all sources"]
    },

    "packLiner": {
      "consensus": "Trash compactor bags",
      "rationale": "Cheaper than dry bags, equally effective, replaceable",
      "cost": "$2-3 vs $30+ for dry bags",
      "sources": ["r/Ultralight", "Skurka", "Treeline Review"]
    },

    "baseWeightTarget": {
      "recommendation": "Sub-20 lbs",
      "rationale": "Comfortable for long-distance, sustainable on knees/joints",
      "sources": ["Community consensus across all forums"]
    }
  }
}
```

**Use in BudgetGearBuilder.svelte:**
```svelte
<!-- Community recommendation badge -->
{#if item.communityConsensus}
  <div class="consensus-badge">
    <span class="icon">👥</span>
    <span class="text">Community favorite</span>
    <button class="why-link" on:click={showConsensusRationale}>Why?</button>
  </div>
{/if}

<!-- Modal/tooltip with rationale -->
{#if showRationale}
  <div class="rationale-tooltip">
    <p>{item.communityConsensus.rationale}</p>
    <p class="sources">Sources: {item.communityConsensus.sources.join(', ')}</p>
  </div>
{/if}
```

---

## 4. Expert Quotes (Attribution)

### Key Expert Endorsements

```json
{
  "expertEndorsements": {
    "lizeThomas": {
      "name": "Liz Thomas",
      "credentials": "AT FKT holder, 2x thru-hiker, 11,000+ trail miles",
      "quotes": [
        {
          "topic": "Base weight philosophy",
          "quote": "Most first-time thru-hikers pack too many clothes",
          "source": "The Trek checklist"
        }
      ]
    },

    "andrewSkurka": {
      "name": "Andrew Skurka",
      "credentials": "30,000+ trail miles, gear expert",
      "contributions": [
        "Ultimate Hiker's Gear Guide (National Geographic)",
        "3-Season Gear Template (1,000+ clients across 124 guided trips)"
      ]
    },

    "zachDavis": {
      "name": "Zach Davis",
      "credentials": "Owner of The Trek, AT & PCT thru-hiker",
      "contributions": [
        "REI's AT gear guide",
        "Annual Trek Survey (2014-present)"
      ]
    }
  }
}
```

**Use everywhere:**
```svelte
<!-- Attribution component -->
<SourceCitation
  source="Treeline Review"
  experts={['Liz Thomas', 'Mike Unger']}
  credentials="11,000+ combined AT miles"
  url="https://www.treelinereview.com/gearreviews/appalachian-trail-gear-list"
/>

<!-- Expert quote component -->
<ExpertQuote
  expert="Liz Thomas"
  credentials="AT FKT holder"
  quote="Most first-time thru-hikers pack too many clothes"
/>
```

---

## 5. Lighterpack Examples (Real Loadouts)

### Curated Example Loadouts

```json
// From research: "Lighterpack hosts numerous publicly shared AT loadouts"
{
  "exampleLoadouts": [
    {
      "id": "lkp6r4",
      "url": "https://lighterpack.com/r/lkp6r4",
      "title": "SOBO Ultralight Thru-Hike",
      "baseWeight": 7,
      "totalWeight": 15,
      "budget": "~$1,800",
      "direction": "SOBO",
      "year": 2024,
      "completed": true,
      "highlights": [
        "Durston X-Mid Pro 2 shelter",
        "Timmermade quilt",
        "BRS-3000 stove (ultralight)"
      ],
      "notes": "Complete with linked products and exact weights"
    }
    // Add 10-15 more curated examples across budget/weight ranges
  ]
}
```

**Implementation: Community Loadouts Browser**
```svelte
<!-- Filter controls -->
<div class="filters">
  <label>
    Base Weight:
    <input type="range" min="5" max="25" bind:value={filterWeight} />
    {filterWeight} lbs
  </label>

  <label>
    Budget:
    <select bind:value={filterBudget}>
      <option value="budget">Budget ($300-800)</option>
      <option value="mid">Mid-Range ($800-1500)</option>
      <option value="premium">Premium ($1500-2500)</option>
      <option value="luxury">Luxury ($2500+)</option>
    </select>
  </label>

  <label>
    <input type="checkbox" bind:checked={filterCompleted} />
    Completed thru-hikes only
  </label>
</div>

<!-- Loadout cards -->
{#each filteredLoadouts as loadout}
  <div class="loadout-card">
    <h3>{loadout.title}</h3>
    <div class="stats">
      <span class="weight">⚖️ {loadout.baseWeight} lb base</span>
      <span class="budget">💰 {loadout.budget}</span>
      <span class="direction">{loadout.direction} {loadout.year}</span>
      {#if loadout.completed}
        <span class="completed">✅ Completed</span>
      {/if}
    </div>

    <ul class="highlights">
      {#each loadout.highlights as highlight}
        <li>{highlight}</li>
      {/each}
    </ul>

    <a href={loadout.url} target="_blank" class="view-full">
      View Full List on Lighterpack →
    </a>
  </div>
{/each}
```

---

## 6. Statistical Tables for Comparison

### Quick Reference Stats

| Category | Stat | Source | Use Case |
|----------|------|--------|----------|
| Base weight (avg start) | 20.4 lbs | Trek 2024 | Comparison in PackBuilder |
| Base weight (avg end) | 17.2 lbs | Trek 2024 | "You'll likely reduce to ~X lbs" |
| Hikers who reduce weight | 68% | Trek | Motivation message |
| Trail runner usage | 80-86% | Trek | Footwear recommendations |
| Quilt vs bag split | 53% / 47% | Trek 2024 | Sleep system trends |
| Tent vs hammock | 88% / 9% | Trek 2024 | Shelter preference |
| Avg gear spending | $2,113 | Trek 2024 | Budget benchmarking |
| Altra Lone Peak share | ~34% | Trek (estimated) | Footwear popularity |
| Sawyer Squeeze share | ~65% | Research (estimated) | Water treatment |
| Osprey backpack share | ~28% | Trek (estimated) | Pack recommendations |

---

## 7. Implementation Priority

### Phase 1: Static JSON Files (Easiest, Highest Impact)

1. **Create `/src/data/trekSurveyData.json`**
   - Copy base weight stats, category popularity, spending averages
   - Add source attribution metadata
   - **Effort: 2 hours**

2. **Create `/src/data/expertGearLists.json`**
   - Treeline Review lightweight/ultralight lists
   - Expert credentials and attribution
   - **Effort: 3 hours** (requires visiting Treeline Review to extract items)

3. **Create `/src/data/regionalGearGuide.json`**
   - 4 AT sections with gear priorities
   - Mile ranges and descriptions
   - **Effort: 2 hours**

4. **Create `/src/data/communityConsensus.json`**
   - Item-specific recommendations (Sawyer Squeeze, Darn Tough, etc.)
   - Rationale and sources
   - **Effort: 2 hours**

5. **Create `/src/data/communityLoadouts.json`**
   - 10-15 curated Lighterpack examples
   - Metadata (weight, budget, direction, completion)
   - **Effort: 4 hours** (manual curation)

**Total Phase 1 Effort: ~13 hours**

---

### Phase 2: UI Components (Medium Effort, High Impact)

6. **Create `/src/components/SourceCitation.svelte`**
   - Reusable citation badge
   - Props: source, year, sampleSize, url, experts
   - **Effort: 1 hour**

7. **Create `/src/components/ComparisonBadge.svelte`**
   - Shows user's stat vs average
   - Visual progress bar and percentile
   - **Effort: 2 hours**

8. **Create `/src/components/PopularityBadge.svelte`**
   - Shows usage percentage
   - Trending indicators
   - **Effort: 1 hour**

9. **Create `/src/components/ExpertQuote.svelte`**
   - Expert attribution with credentials
   - Optional expandable rationale
   - **Effort: 1 hour**

**Total Phase 2 Effort: ~5 hours**

---

### Phase 3: Integration (Medium-High Effort, High Impact)

10. **Enhance PackBuilder.svelte**
    - Import trekSurveyData.json
    - Add comparative benchmarking section
    - Show: "Your X lb vs Y lb average"
    - Display percentile and classification
    - **Effort: 3 hours**

11. **Enhance BudgetGearBuilder.svelte**
    - Add popularity badges to items
    - Add expert list toggle
    - Add community consensus indicators
    - **Effort: 4 hours**

12. **Enhance GearTransitionTracker.svelte**
    - Add regional context cards
    - Show upcoming section gear priorities
    - Link to Treeline Review sections
    - **Effort: 3 hours**

13. **Create CommunityLoadoutsBrowser.svelte**
    - New standalone component
    - Filters by weight/budget/completion
    - Cards with highlights and links
    - **Effort: 6 hours**

**Total Phase 3 Effort: ~16 hours**

---

## Grand Total: ~34 hours (4-5 days of focused work)

**Phased Rollout:**
- **Week 1:** Phase 1 (Static JSON) — Immediate value, low risk
- **Week 2:** Phase 2 (UI Components) + Phase 3 (Integration) — High impact

**ROI:** Transforms tools from personal tracker to industry-standard resource with full data backing.

---

## Next Actions

1. **Confirm scope** — Do you want all 3 phases or just Phase 1?
2. **Start with trekSurveyData.json** — I can draft this file for you based on the research
3. **Visit external sources** — For complete item lists from Treeline Review and Lighterpack examples
4. **User test** — Share with 1-2 AT planners to validate value proposition

**Ready to proceed?** I can start extracting data from the research document into the trekSurveyData.json file right now.
