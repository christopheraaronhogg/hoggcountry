# Hot Springs, NC - Town Map & Layout

## Overview

**Population:** 520
**Elevation:** 1,326 feet
**Hiker Traffic:** 2,000+ annually (peak March-May)
**Average Stay:** 2 days (zero day + resupply)

## The Appalachian Trail Path

The AT enters Hot Springs from **Deer Park Mountain** (south), runs down **Bridge Street** for about a mile, then climbs **Lover's Leap Mountain** (north). White blazes are literally embedded in the sidewalk concrete!

```
                    Lover's Leap Mtn (north exit)
                            ↑
                           /
                          /
    =================== Bridge Street ===================
   ↓                                                      ↑
Deer Park Mtn                                    French Broad River
(south entrance)
```

## Bridge Street Buildings (West to East)

### Current Status: 3 of 10 Built (30%)

| # | Address | Building | Services | Status |
|---|---------|----------|----------|--------|
| 1 | 20 Bridge St | **Tobacco Road Burley & Brew** | Coffee, WiFi | 🔨 TODO |
| 2 | 50 Bridge St | **Alpine Court Motel** ✅ | Lodging, Shower, WiFi | ✅ **BUILT** |
| 3 | 88 Bridge St | **Bluff Mountain Outfitters** ✅ | Gear, Resupply, Mail, WiFi | ✅ **BUILT** |
| 4 | 106 Bridge St | **Hot Springs Welcome Center** | Info, WiFi, Mail | 🔨 TODO |
| 5 | 158 Bridge St | **Vaste Riviere Provisions** | Resupply, Food | 🔨 TODO |
| 6 | — | **Smoky Mountain Diner** ✅ | Food, WiFi | ✅ **BUILT** |
| 7 | — | **Dollar General** | Resupply, Food, Medical | 🔨 TODO |
| 8 | — | **Spring Creek Tavern & Inn** | Food, Bar, Lodging | 🔨 TODO |
| 9 | 315 Bridge St | **Hot Springs Resort & Spa** | Hot Springs!, Lodging, Shower | 🔨 TODO |

## Side Streets

### Walnut Street (north of Bridge St)

| Address | Building | Services | Status |
|---------|----------|----------|--------|
| 26 Walnut St | **Elmer's Sunnybank Inn** | Lodging, Shower, Laundry, WiFi | 🔨 TODO |

## Building Details (Built)

### 1. Alpine Court Motel (50 Bridge St) ✅
**Position:** x: 500, y: 350
**Size:** 48×48px
**Description:** Budget motel with 4 rooms. Light blue facade with orange "ALPINE COURT" sign.
**Services:**
- 💤 Lodging ($)
- 🚿 Shower
- 📶 WiFi

**Interactions:**
- 4 room doors (enter for rest)
- Check-in 8am-10pm

**Hours:** 24/7 (Office: 8am-10pm)
**Price:** $ (budget friendly)

---

### 2. Bluff Mountain Outfitters (88 Bridge St) ✅
**Position:** x: 700, y: 350
**Size:** 48×48px
**Description:** THE hiker hub since 1997. Green awning, wood siding, large storefront. Founded by Daniel Gallagher and Wayne Crosby. Sees ~12 thru-hikers daily in spring.
**Services:**
- 🎒 Full Outfitter
- ⚙️ Gear
- 📦 Resupply
- 📬 Mail drops
- 📶 WiFi
- ℹ️ Trail info

**Interactions:**
- Front door (shop for gear)
- 2 display windows
- Counter for checkout
- Back shelving with gear

**Hours:** 9am-6pm (extended in season)
**Price:** $$ (fair pricing)

---

### 3. Smoky Mountain Diner ✅
**Position:** x: 1100, y: 350
**Size:** 48×48px
**Description:** Classic trail town diner. White walls with red trim, "DINER" neon sign, wraparound windows, checkered floor. Hiker favorite for big breakfasts.
**Services:**
- 🍳 Food (breakfast, lunch, dinner)
- 📶 WiFi

**Interactions:**
- Front door (enter to eat)
- Menu windows (left & right)
- Red vinyl booths
- Chrome counter
- Kitchen pass-through

**Hours:** 6am-8pm (6 days/week)
**Price:** $$ (generous portions)

## Priority Buildings to Add

Based on gameplay mechanics, these are the most important to build next:

### High Priority
1. **Dollar General** - Critical for resupply mechanic
2. **Elmer's Sunnybank Inn** - Famous hostel, lodging mechanic
3. **Hot Springs Welcome Center** - Tutorial/info hub

### Medium Priority
4. **Hot Springs Resort & Spa** - Unique hot springs mechanic (relaxation/healing)
5. **Spring Creek Tavern** - Social hub, food & bar

### Low Priority
6. **Tobacco Road** - Coffee/WiFi (nice to have)
7. **Vaste Riviere** - Additional resupply (overlaps with Dollar General)

## Service Coverage

### Current (3 buildings built):
- ✅ Lodging: 1 building (Alpine Court)
- ✅ Food: 1 building (Smoky Diner)
- ✅ Gear/Outfitter: 1 building (Bluff Mountain)
- ⚠️ Resupply: 1 building (Bluff Mountain - limited)
- ✅ WiFi: 3 buildings
- ⚠️ Showers: 1 building (Alpine Court)
- ❌ Laundry: 0 buildings
- ❌ Hot Springs: 0 buildings

### When Complete (10 buildings):
- ✅ Lodging: 4 buildings (Alpine, Sunnybank, Tavern, Resort)
- ✅ Food: 4 buildings (Diner, Tavern, Vaste Riviere)
- ✅ Resupply: 3 buildings (Dollar General, Bluff Mountain, Vaste Riviere)
- ✅ Showers: 3 buildings (Alpine, Sunnybank, Resort)
- ✅ Laundry: 2 buildings (Sunnybank, Resort)
- ✅ Hot Springs: 1 building (Resort - unique!)

## Map Coordinates

The town spans a 2000×800px map:

- **Bridge Street runs:** x: 300 → 1500, y: 400 (horizontal)
- **Trail enters south:** x: 50, y: 700
- **Trail exits north:** x: 1950, y: 150
- **French Broad River:** x: 1000, y: 600 (south of Bridge St)
- **Walnut Street (hostel):** y: 200 (north of Bridge St)

### Building Spacing
Buildings are spaced approximately 100-200px apart along Bridge Street to allow for:
- Sidewalks with embedded AT blazes
- Street crossings
- Visual breathing room
- Future additions (parking, benches, etc.)

## Landmarks

1. **AT Blazes** (embedded in sidewalk at x: 400, 800, 1200)
2. **French Broad River** (x: 1000, y: 600)
3. **Spring Creek** (x: 1300, y: 500)
4. **Deer Park Mountain** (x: 50, y: 750) - south entrance
5. **Lover's Leap Mountain** (x: 1950, y: 100) - north exit

## Usage

```typescript
import {
  HOT_SPRINGS_LAYOUT,
  getTownStats,
  getBuildingsByService,
  getBuiltBuildings,
} from './sprites/hot-springs-town-layout';

// Get town stats
const stats = getTownStats();
console.log(`${stats.built}/${stats.total} buildings complete (${stats.percentComplete}%)`);

// Find all lodging options
const lodging = getBuildingsByService('lodging');

// Get only built buildings
const ready = getBuiltBuildings();

// Access the full layout
const trail = HOT_SPRINGS_LAYOUT.trail;
const buildings = HOT_SPRINGS_LAYOUT.mainStreet.buildings;
```

## Next Steps

1. **Build Priority Buildings:**
   - Dollar General (resupply)
   - Sunnybank Inn (lodging/laundry)
   - Welcome Center (info/tutorial)

2. **Add Rendering:**
   - Render buildings on map at their x,y positions
   - Draw AT path through town
   - Add interactive hotspots at interaction points

3. **Implement Mechanics:**
   - Building entry system
   - Service interactions (buy gear, eat food, rest)
   - Resupply shopping
   - Hot springs healing mechanic

4. **Polish:**
   - Add street details
   - Add river graphics
   - Add sidewalk with embedded blazes
   - Add NPCs (townspeople, other hikers)
