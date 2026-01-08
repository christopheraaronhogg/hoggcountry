// ============================================
// TRAIL LEGS - Item/Gear Sprite Definitions
// ============================================
// Trekking poles, water bottles, food, first aid, and collectibles

import { PixelSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const K = C.nearBlack;      // Black
const G = C.grayMedium;     // Gray
const g = C.grayDark;       // Dark gray
const W = C.white;          // White
const w = C.grayLight;      // Light gray
const B = C.waterBlue;      // Blue
const b = C.waterDeep;      // Dark blue
const R = C.danger;         // Red
const O = C.warning;        // Orange
const Y = C.highlight;      // Yellow
const P = C.shirtGreen;     // Green
const p = C.shirtGreenShadow;
const T = C.skinTan;        // Tan
const Br = C.bark;          // Brown

// ============================================
// TREKKING POLE - 8x32 pixels
// ============================================
const trekkingPolePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7
  [_,_,_,K,K,_,_,_], // 0 - grip top
  [_,_,K,K,K,K,_,_], // 1
  [_,_,K,g,g,K,_,_], // 2
  [_,_,K,g,g,K,_,_], // 3 - grip
  [_,_,K,g,g,K,_,_], // 4
  [_,_,K,g,g,K,_,_], // 5
  [_,_,K,g,g,K,_,_], // 6
  [_,_,K,g,g,K,_,_], // 7
  [_,_,_,K,K,_,_,_], // 8 - strap
  [_,_,_,G,G,_,_,_], // 9 - shaft
  [_,_,_,G,G,_,_,_], // 10
  [_,_,_,G,G,_,_,_], // 11
  [_,_,_,G,G,_,_,_], // 12
  [_,_,_,G,G,_,_,_], // 13
  [_,_,_,G,G,_,_,_], // 14
  [_,_,_,G,G,_,_,_], // 15
  [_,_,_,G,G,_,_,_], // 16
  [_,_,_,G,G,_,_,_], // 17
  [_,_,_,G,G,_,_,_], // 18
  [_,_,_,G,G,_,_,_], // 19
  [_,_,_,G,G,_,_,_], // 20
  [_,_,_,G,G,_,_,_], // 21
  [_,_,_,G,G,_,_,_], // 22
  [_,_,_,G,G,_,_,_], // 23
  [_,_,_,G,G,_,_,_], // 24
  [_,_,_,G,G,_,_,_], // 25
  [_,_,_,K,K,_,_,_], // 26 - basket
  [_,_,K,K,K,K,_,_], // 27
  [_,_,_,K,K,_,_,_], // 28
  [_,_,_,G,G,_,_,_], // 29 - tip
  [_,_,_,g,g,_,_,_], // 30
  [_,_,_,_,g,_,_,_], // 31
];

export const TREKKING_POLE: PixelSprite = {
  name: 'trekking_pole',
  width: 8,
  height: 32,
  pixels: trekkingPolePixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// WATER BOTTLE - 8x16 pixels
// ============================================
const waterBottlePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7
  [_,_,_,G,G,_,_,_], // 0 - cap
  [_,_,G,G,G,G,_,_], // 1
  [_,_,_,B,B,_,_,_], // 2 - neck
  [_,_,B,B,B,B,_,_], // 3 - body
  [_,B,B,b,B,B,B,_], // 4
  [_,B,B,b,B,B,B,_], // 5
  [_,B,B,b,B,B,B,_], // 6
  [_,B,B,b,b,B,B,_], // 7
  [_,B,B,b,b,B,B,_], // 8
  [_,B,B,b,b,B,B,_], // 9
  [_,B,B,b,b,B,B,_], // 10
  [_,B,B,b,b,B,B,_], // 11
  [_,B,B,b,b,B,B,_], // 12
  [_,B,B,b,B,B,B,_], // 13
  [_,_,B,B,B,B,_,_], // 14 - bottom
  [_,_,_,B,B,_,_,_], // 15
];

export const WATER_BOTTLE: PixelSprite = {
  name: 'water_bottle',
  width: 8,
  height: 16,
  pixels: waterBottlePixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// SNACK BAR - 12x6 pixels
// ============================================
const snackBarPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,O,O,O,O,O,O,O,O,O,O,_], // 0
  [O,O,O,O,O,O,O,O,O,O,O,O], // 1
  [O,O,Br,Br,O,O,O,O,Br,Br,O,O], // 2 - chocolate chunks
  [O,O,O,O,O,Br,Br,O,O,O,O,O], // 3
  [O,O,O,O,O,O,O,O,O,O,O,O], // 4
  [_,O,O,O,O,O,O,O,O,O,O,_], // 5
];

export const SNACK_BAR: PixelSprite = {
  name: 'snack_bar',
  width: 12,
  height: 6,
  pixels: snackBarPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// FIRST AID KIT - 12x10 pixels
// ============================================
const firstAidPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,W,W,W,W,W,W,W,W,W,W,_], // 0
  [W,W,W,W,W,W,W,W,W,W,W,W], // 1
  [W,W,W,W,R,R,R,R,W,W,W,W], // 2 - red cross
  [W,W,W,W,R,R,R,R,W,W,W,W], // 3
  [W,W,R,R,R,R,R,R,R,R,W,W], // 4
  [W,W,R,R,R,R,R,R,R,R,W,W], // 5
  [W,W,W,W,R,R,R,R,W,W,W,W], // 6
  [W,W,W,W,R,R,R,R,W,W,W,W], // 7
  [W,W,W,W,W,W,W,W,W,W,W,W], // 8
  [_,W,W,W,W,W,W,W,W,W,W,_], // 9
];

export const FIRST_AID_KIT: PixelSprite = {
  name: 'first_aid_kit',
  width: 12,
  height: 10,
  pixels: firstAidPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// HEADLAMP - 10x8 pixels
// ============================================
const headlampPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9
  [_,_,_,K,K,K,K,_,_,_], // 0 - strap
  [_,_,K,K,K,K,K,K,_,_], // 1
  [_,K,K,K,K,K,K,K,K,_], // 2
  [_,K,K,Y,Y,Y,Y,K,K,_], // 3 - light
  [K,K,K,Y,W,W,Y,K,K,K], // 4
  [K,K,K,Y,Y,Y,Y,K,K,K], // 5
  [_,K,K,K,K,K,K,K,K,_], // 6
  [_,_,K,K,K,K,K,K,_,_], // 7
];

export const HEADLAMP: PixelSprite = {
  name: 'headlamp',
  width: 10,
  height: 8,
  pixels: headlampPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// MAP - 16x12 pixels (folded)
// ============================================
const mapPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_], // 0
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 1
  [T,T,P,P,T,T,P,P,P,T,T,P,P,T,T,T], // 2 - map markings
  [T,T,P,P,P,T,T,P,T,T,P,P,P,T,T,T], // 3
  [T,T,T,P,P,P,T,T,T,P,P,P,T,T,T,T], // 4
  [T,T,T,T,P,P,P,P,P,P,P,T,T,T,T,T], // 5
  [T,T,T,T,T,P,P,P,P,P,T,T,T,T,T,T], // 6
  [T,T,R,T,T,T,P,P,P,T,T,T,R,T,T,T], // 7 - markers
  [T,T,T,T,T,T,T,P,T,T,T,T,T,T,T,T], // 8
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 9
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 10
  [_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_], // 11
];

export const MAP: PixelSprite = {
  name: 'map',
  width: 16,
  height: 12,
  pixels: mapPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// COMPASS - 12x12 pixels
// ============================================
const compassPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,G,G,G,G,_,_,_,_], // 0
  [_,_,G,G,G,g,g,G,G,G,_,_], // 1
  [_,G,G,g,g,g,g,g,g,G,G,_], // 2
  [_,G,g,g,g,R,R,g,g,g,G,_], // 3 - north needle
  [G,G,g,g,R,R,R,R,g,g,G,G], // 4
  [G,g,g,g,R,g,g,W,g,g,g,G], // 5 - center
  [G,g,g,g,W,g,g,W,g,g,g,G], // 6
  [G,G,g,g,W,W,W,W,g,g,G,G], // 7 - south needle
  [_,G,g,g,g,W,W,g,g,g,G,_], // 8
  [_,G,G,g,g,g,g,g,g,G,G,_], // 9
  [_,_,G,G,G,g,g,G,G,G,_,_], // 10
  [_,_,_,_,G,G,G,G,_,_,_,_], // 11
];

export const COMPASS: PixelSprite = {
  name: 'compass',
  width: 12,
  height: 12,
  pixels: compassPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// TRAIL MAGIC (gift box) - 16x16 pixels
// ============================================
const trailMagicPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,Y,Y,_,_,_,_,_,_,_], // 0 - ribbon top
  [_,_,_,_,_,_,Y,Y,Y,Y,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,Y,Y,_,_,_,_,_,_,_], // 2
  [_,_,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,_,_], // 3 - ribbon horizontal
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 4 - box top
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 5
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 6
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 7
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 8
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 9
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 10
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 11
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 12
  [_,R,R,R,R,R,R,Y,Y,R,R,R,R,R,R,_], // 13
  [_,_,R,R,R,R,R,R,R,R,R,R,R,R,_,_], // 14 - box bottom
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 15
];

export const TRAIL_MAGIC: PixelSprite = {
  name: 'trail_magic',
  width: 16,
  height: 16,
  pixels: trailMagicPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// SLEEPING BAG - 24x12 pixels (rolled)
// ============================================
const sleepingBagPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_], // 0
  [_,_,_,P,P,p,P,P,P,P,P,P,P,P,P,P,P,P,p,P,P,_,_,_], // 1
  [_,_,P,P,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,P,P,_,_], // 2
  [_,P,P,p,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,p,P,P,_], // 3
  [P,P,p,p,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,p,p,P,P], // 4
  [P,P,p,p,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,p,p,P,P], // 5
  [P,P,p,p,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,p,p,P,P], // 6
  [P,P,p,p,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,p,p,P,P], // 7
  [_,P,P,p,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,p,P,P,_], // 8
  [_,_,P,P,p,p,P,P,P,P,P,P,P,P,P,P,P,P,p,p,P,P,_,_], // 9
  [_,_,_,P,P,p,P,P,P,P,P,P,P,P,P,P,P,P,p,P,P,_,_,_], // 10
  [_,_,_,_,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,_,_,_,_], // 11
];

export const SLEEPING_BAG: PixelSprite = {
  name: 'sleeping_bag',
  width: 24,
  height: 12,
  pixels: sleepingBagPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// CAMP STOVE - 12x10 pixels
// ============================================
const campStovePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,O,Y,Y,O,_,_,_,_], // 0 - flame
  [_,_,_,O,O,Y,Y,O,O,_,_,_], // 1
  [_,_,G,G,G,G,G,G,G,G,_,_], // 2 - burner
  [_,G,G,g,G,G,G,G,g,G,G,_], // 3
  [_,G,g,g,g,g,g,g,g,g,G,_], // 4
  [_,G,G,G,G,G,G,G,G,G,G,_], // 5
  [_,_,G,g,G,G,G,G,g,G,_,_], // 6 - body
  [_,_,G,g,g,G,G,g,g,G,_,_], // 7
  [_,_,G,G,G,G,G,G,G,G,_,_], // 8
  [_,_,_,G,G,G,G,G,G,_,_,_], // 9 - base
];

export const CAMP_STOVE: PixelSprite = {
  name: 'camp_stove',
  width: 12,
  height: 10,
  pixels: campStovePixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// HIKING BOOTS - 16x12 pixels
// ============================================
const hikingBootsPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,Br,Br,Br,_,_,_,_,Br,Br,Br,_,_,_], // 0 - boot tops
  [_,_,Br,Br,Br,Br,Br,_,_,Br,Br,Br,Br,Br,_,_], // 1
  [_,Br,Br,Br,Br,Br,Br,_,Br,Br,Br,Br,Br,Br,_,_], // 2
  [Br,Br,K,K,K,Br,Br,_,Br,Br,K,K,K,Br,Br,_], // 3 - laces
  [Br,Br,K,K,K,Br,Br,_,Br,Br,K,K,K,Br,Br,_], // 4
  [Br,Br,K,K,K,Br,Br,_,Br,Br,K,K,K,Br,Br,_], // 5
  [Br,Br,Br,Br,Br,Br,Br,_,Br,Br,Br,Br,Br,Br,Br,_], // 6
  [Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br], // 7 - toe box
  [Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br,Br], // 8
  [_,g,g,g,g,g,g,g,g,g,g,g,g,g,g,_], // 9 - sole
  [g,g,K,g,K,g,K,g,g,K,g,K,g,K,g,g], // 10 - tread
  [_,g,g,g,g,g,g,g,g,g,g,g,g,g,g,_], // 11
];

export const HIKING_BOOTS: PixelSprite = {
  name: 'hiking_boots',
  width: 16,
  height: 12,
  pixels: hikingBootsPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// RAIN JACKET - 16x18 pixels (folded)
// ============================================
const rainJacketPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_], // 0
  [_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_], // 1
  [_,_,B,B,b,B,B,B,B,B,B,b,B,B,_,_], // 2
  [_,B,B,b,b,B,B,B,B,B,B,b,b,B,B,_], // 3
  [_,B,B,b,b,B,B,B,B,B,B,b,b,B,B,_], // 4
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 5
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 6
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 7
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 8
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 9
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 10
  [B,B,b,b,b,B,B,B,B,B,B,b,b,b,B,B], // 11
  [_,B,B,b,b,B,B,B,B,B,B,b,b,B,B,_], // 12
  [_,B,B,b,b,B,B,B,B,B,B,b,b,B,B,_], // 13
  [_,_,B,B,b,B,B,B,B,B,B,b,B,B,_,_], // 14
  [_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_], // 15
  [_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_], // 16
  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_], // 17
];

export const RAIN_JACKET: PixelSprite = {
  name: 'rain_jacket',
  width: 16,
  height: 18,
  pixels: rainJacketPixels,
  originX: 0.5,
  originY: 0.5,
};

// Export all item sprites
export const ITEM_SPRITES = {
  trekkingPole: TREKKING_POLE,
  waterBottle: WATER_BOTTLE,
  snackBar: SNACK_BAR,
  firstAidKit: FIRST_AID_KIT,
  headlamp: HEADLAMP,
  map: MAP,
  compass: COMPASS,
  trailMagic: TRAIL_MAGIC,
  sleepingBag: SLEEPING_BAG,
  campStove: CAMP_STOVE,
  hikingBoots: HIKING_BOOTS,
  rainJacket: RAIN_JACKET,
};
