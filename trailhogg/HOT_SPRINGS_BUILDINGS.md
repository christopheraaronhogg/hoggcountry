# Hot Springs, NC - Layered Building System

## Overview

We've built an authentic recreation of **Hot Springs, North Carolina** - the only town in NC where the Appalachian Trail runs right down the main street (Bridge Street). This is designed as the first town for your demo week gameplay.

## Why Hot Springs?

- **Perfect for demo**: Single main street, ~10 key buildings
- **Iconic trail town**: 2,000+ thru-hikers pass through annually
- **Authentic**: All buildings are real places with actual addresses
- **Compact**: Ideal for a one-week gameplay segment

## Buildings Completed (3/10)

### 1. Bluff Mountain Outfitters (88 Bridge St)
**The hiker hub since 1997**
- Green awning and pitched roof
- Wood siding walls
- Large storefront windows
- Interior: back shelving with gear, front counter
- Real history: Founded by Daniel Gallagher & Wayne Crosby

### 2. Smoky Mountain Diner
**Classic trail town diner**
- White walls with red trim
- "DINER" neon sign in red letters
- Large wraparound windows
- Checkered floor (white/gray)
- Interior: red vinyl booths, chrome counter, kitchen pass-through
- Known for: Big breakfasts, hiker-sized portions

### 3. Alpine Court Motel (50 Bridge St)
**Budget hiker lodging**
- Light blue motel facade
- Orange "ALPINE COURT" sign
- 4 motel room doors
- Windows for each room
- Interior: simple beds in rooms
- Gray flat roof

## Layered Sprite System

Inspired by **Project Zomboid** and **The Sims**, each building has multiple layers for proper 3D rendering:

### Layer Structure

```
Building Layers (bottom to top):
├── base: Floor tiles (always visible)
├── wallSouth: Front wall (always visible - camera facing north)
├── wallEast: Right wall (always visible - camera facing west) [TODO]
├── wallNorth: Back wall (hideable when viewing from south) [TODO]
├── wallWest: Left wall (hideable when viewing from west) [TODO]
├── interior: Furniture, counters, fixtures (visible when walls removed)
└── roof: Roof tiles (hideable when viewing interior)
```

### Current Implementation Status

**Completed:**
- ✅ Base layer (floor)
- ✅ South wall (front facade)
- ✅ Interior layer
- ✅ Roof layer

**TODO:**
- ⬜ East/West/North walls (for full 3D rotation)
- ⬜ Wall visibility system (hide based on camera angle)
- ⬜ Building placement system
- ⬜ Collision detection
- ⬜ Door interaction

## Technical Specs

- **Size**: 48x48px per building
- **Palette**: Trail Legs 32-color palette
- **Format**: TypeScript pixel arrays
- **Location**: `trailhogg/shared/src/sprites/hot-springs-buildings.ts`
- **Exported**: Added to main sprite index for catalog viewing

### Example Layer

```typescript
export const bluffMountainBase: PixelSprite = {
  name: 'bluff_mountain_outfitters_base',
  width: 48,
  height: 48,
  pixels: [
    // 2D array of color palette indices
    // 0 = transparent
    // 1-31 = palette colors (C.bark, C.white, etc.)
  ],
};
```

## Remaining Hot Springs Buildings

**Priority for demo week:**

1. **Dollar General** - Grocery/supplies (key resupply point)
2. **Elmer's Sunnybank Inn** (26 Walnut St) - Famous hostel
3. **Hot Springs Welcome Center** (106 Bridge St) - Info/resources
4. **Hot Springs Resort & Spa** (315 Bridge St) - Hot springs, camping

**Secondary:**

5. Tobacco Road Burley & Brew (20 Bridge St) - Coffee shop
6. Vaste Riviere Provisions (158 Bridge St) - Supplies
7. Spring Creek Tavern & Inn - Bar/restaurant
8. Big Pillow Brewing - Brewery/taqueria
9. Hillbilly Market - Grocery/deli
10. Laughing Heart Hostel (289 NW Hwy 25/70) - Another hostel

## Viewing the Sprites

1. Build the site: `npm run build`
2. Start preview: `npm run preview`
3. Navigate to `/cat` (Sprite Catalog page)
4. Search for "hot springs" or filter by category "Hot Springs Buildings"

You'll see all layers for each building rendered at various scales.

## Next Steps

### Phase 1: Complete Building Set (5-7 more buildings)
- Add Dollar General (critical for resupply mechanic)
- Add Sunnybank Inn (critical for lodging mechanic)
- Add Welcome Center (tutorial/info hub)
- Add Hot Springs Resort (unique hot springs mechanic)

### Phase 2: Town Layout System
Create `hot-springs-town-data.ts`:
```typescript
export const HOT_SPRINGS_LAYOUT = {
  name: 'Hot Springs, NC',
  bridgeStreet: {
    buildings: [
      {
        name: 'Bluff Mountain Outfitters',
        address: '88 Bridge St',
        x: 100,
        y: 200,
        sprites: {
          base: 'bluffMountainBase',
          walls: ['bluffMountainWallSouth'],
          interior: 'bluffMountainInterior',
          roof: 'bluffMountainRoof',
        },
        type: 'outfitter',
        services: ['gear', 'fuel', 'maps', 'resupply'],
      },
      // ... more buildings
    ],
  },
};
```

### Phase 3: Game Integration
- Add to Trail Legs game scene
- Implement building interaction system
- Add hiker services (resupply, rest, etc.)
- Create town navigation

### Phase 4: Polish
- Add building shadows
- Add signage details
- Add parking lots
- Add street details (AT blazes embedded in sidewalk!)
- Add French Broad River background

## Design Notes

**Color Palette Usage:**
- `C.bark` / `C.barkDark` - Wood siding, floors, furniture
- `C.white` - White walls, trim, signs
- `C.danger` (red) - Red trim, signs, booth seats
- `C.warning` (orange) - Orange trim, signs
- `C.skyBlue` / `C.skyLight` - Windows (glass), motel paint
- `C.forestGreen` / `C.leafGreen` - Awnings, roofs
- `C.grayDark` / `C.grayMedium` - Roofs, pavement, counters

**Authenticity:**
All buildings are based on real Hot Springs, NC businesses with actual addresses and appearances researched from:
- Hot Springs Tourism website
- AT hiker resources
- Historical AT archives
- Google Maps / Street View
- Trail journals

## File Structure

```
trailhogg/trailhogg/shared/src/sprites/
├── hot-springs-buildings.ts   (387 lines, 3 buildings × 4 layers)
├── index.ts                    (exports HOT_SPRINGS_BUILDING_SPRITES)
└── palette.ts                  (32-color Trail Legs palette)
```

## Catalog URL

Once deployed: `https://hoggcountry.com/cat`
Search: "hot springs" or "bluff mountain" or "smoky mountain"

---

**Status**: ✅ 3 buildings complete, system working, sprites rendering in catalog
**Next**: Add Dollar General + Sunnybank Inn (critical mechanics)
**Goal**: 5-7 buildings for playable demo week
