// ============================================
// TRAIL LEGS - Extended Structure Sprites
// ============================================
// Privies, fire rings, picnic tables, hostels, and more

import { PixelSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const B = C.bark;           // Wood brown
const b = C.barkDark;       // Wood dark
const G = C.grayMedium;     // Gray
const g = C.grayDark;       // Dark gray
const K = C.nearBlack;      // Black
const W = C.white;          // White
const O = C.warning;        // Orange (fire)
const R = C.danger;         // Red
const Y = C.highlight;      // Yellow (fire)
const T = C.trailDirt;      // Tan
const P = C.shirtGreen;     // Green (roof)
const p = C.shirtGreenShadow;

// ============================================
// PRIVY (Outhouse) - 32x48 pixels
// ============================================
const privyPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0 - roof peak
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,b,b,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,_,_,_,_,B,B,b,b,b,b,b,b,b,b,B,B,_,_,_,_,_,_,_,_,_,_], // 4
  [_,_,_,_,_,_,_,_,_,B,B,b,b,b,b,b,b,b,b,b,b,B,B,_,_,_,_,_,_,_,_,_], // 5
  [_,_,_,_,_,_,_,_,B,B,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_,_,_,_,_,_,_,_], // 6
  [_,_,_,_,_,_,_,B,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_,_,_,_,_,_,_], // 7
  [_,_,_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_,_,_,_], // 8 - roof edge
  [_,_,_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 10 - walls
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 11
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,B,B,b,B,B,B,_,_,_,_,_,_,_,_,B,B,B,b,B,B,_,_,_,_,_,_], // 14 - moon cutout
  [_,_,_,_,_,_,B,B,b,B,B,_,_,_,Y,Y,Y,_,_,_,_,B,B,b,B,B,_,_,_,_,_,_], // 15
  [_,_,_,_,_,_,B,B,b,B,B,_,_,Y,Y,Y,Y,Y,_,_,_,B,B,b,B,B,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,B,B,b,B,B,_,_,Y,Y,Y,Y,Y,_,_,_,B,B,b,B,B,_,_,_,_,_,_], // 17
  [_,_,_,_,_,_,B,B,b,B,B,_,_,_,Y,Y,Y,_,_,_,_,B,B,b,B,B,_,_,_,_,_,_], // 18
  [_,_,_,_,_,_,B,B,b,B,B,B,_,_,_,_,_,_,_,_,B,B,B,b,B,B,_,_,_,_,_,_], // 19
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 23
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 24 - door
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 25
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 26
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 27
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 28
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 29
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 30
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 31
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 32
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 33
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 34
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 35
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 36
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 37
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 38
  [_,_,_,_,_,_,B,B,b,B,B,b,b,b,b,b,b,b,b,b,b,B,B,b,B,B,_,_,_,_,_,_], // 39
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 40
  [_,_,_,_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,B,B,_,_,_,_,_,_], // 41
  [_,_,_,_,_,B,B,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,B,B,_,_,_,_,_], // 42 - base
  [_,_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_,_,_], // 43
  [_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_,_], // 44
  [_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_,_], // 45
  [_,_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_,_,_], // 46
  [_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_], // 47 - stilts
];

export const PRIVY: PixelSprite = {
  name: 'privy',
  width: 32,
  height: 48,
  pixels: privyPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// FIRE RING - 24x16 pixels
// ============================================
const fireRingPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,_,_,_,_,_,Y,Y,_,_,Y,_,_,_,_,_,_,_,_,_,_], // 0 - flames
  [_,_,_,_,_,_,_,_,Y,O,Y,_,Y,O,Y,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,Y,O,O,O,Y,O,O,O,Y,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,Y,O,O,R,O,O,O,R,O,O,Y,_,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,O,O,R,R,R,O,R,R,R,O,O,_,_,_,_,_,_,_], // 4
  [_,_,_,_,_,_,O,R,R,K,R,R,R,K,R,R,O,_,_,_,_,_,_,_], // 5
  [_,_,_,_,_,G,G,O,R,R,R,K,R,R,R,O,G,G,_,_,_,_,_,_], // 6 - fire ring stones
  [_,_,_,_,G,G,g,G,O,R,R,R,R,R,O,G,g,G,G,_,_,_,_,_], // 7
  [_,_,_,G,G,g,g,g,G,O,O,K,O,O,G,g,g,g,G,G,_,_,_,_], // 8
  [_,_,G,G,g,g,g,g,g,G,G,G,G,G,g,g,g,g,g,G,G,_,_,_], // 9
  [_,G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,_,_], // 10
  [G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,_], // 11
  [G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G], // 12
  [G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,_], // 13
  [_,G,G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,G,_,_], // 14
  [_,_,_,G,G,G,G,g,g,g,g,g,g,g,g,G,G,G,G,_,_,_,_,_], // 15
];

export const FIRE_RING: PixelSprite = {
  name: 'fire_ring',
  width: 24,
  height: 16,
  pixels: fireRingPixels,
  originX: 0.5,
  originY: 0.75,
};

// ============================================
// PICNIC TABLE - 48x24 pixels
// ============================================
const picnicTablePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 2 - table top
  [_,_,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,_,_], // 3
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 4
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 5 - supports
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 6
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B], // 7 - bench
  [B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B], // 8
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 11
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 13
  [B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B], // 14 - bench
  [B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B], // 15
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,_,_,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,_,_,_,_,_,_,_], // 17
  [_,_,_,_,_,_,_,B,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,B,_,_,_,_,_,_], // 18 - legs
  [_,_,_,_,_,_,B,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,B,_,_,_,_,_], // 19
  [_,_,_,_,_,B,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,B,_,_,_,_], // 20
  [_,_,_,_,B,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,B,_,_,_], // 21
  [_,_,_,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,_,_], // 22
  [_,_,_,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,_,_], // 23
];

export const PICNIC_TABLE: PixelSprite = {
  name: 'picnic_table',
  width: 48,
  height: 24,
  pixels: picnicTablePixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// BEAR BOX (food storage) - 24x20 pixels
// ============================================
const bearBoxPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,_,_], // 0 - top
  [_,_,_,G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,_,_,_], // 1
  [_,_,G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,_,_], // 2
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 3
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 4
  [_,_,G,g,g,g,g,K,K,K,K,K,K,K,K,K,K,g,g,g,g,G,_,_], // 5 - latch
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 6
  [_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_], // 7 - lid line
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 8 - body
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 9
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 10
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 11
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 12
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 13
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 14
  [_,_,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,_,_], // 15
  [_,_,G,G,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,G,G,_,_], // 16
  [_,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,_], // 17 - base
  [_,_,G,G,G,_,_,_,_,_,_,_,_,_,_,_,_,_,_,G,G,G,_,_], // 18 - legs
  [_,_,G,G,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,G,G,_,_], // 19
];

export const BEAR_BOX: PixelSprite = {
  name: 'bear_box',
  width: 24,
  height: 20,
  pixels: bearBoxPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// TRAIL REGISTER (sign-in box) - 16x20 pixels
// ============================================
const trailRegisterPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_], // 0 - roof
  [_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_], // 1
  [_,_,_,_,B,B,b,b,b,b,B,B,_,_,_,_], // 2
  [_,_,_,B,B,b,b,b,b,b,b,B,B,_,_,_], // 3
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 4 - roof edge
  [_,_,B,B,b,b,b,b,b,b,b,b,B,B,_,_], // 5 - box
  [_,_,B,B,b,T,T,T,T,T,T,b,B,B,_,_], // 6 - paper
  [_,_,B,B,b,T,K,K,K,T,T,b,B,B,_,_], // 7 - writing
  [_,_,B,B,b,T,T,K,K,K,T,b,B,B,_,_], // 8
  [_,_,B,B,b,T,K,K,T,T,T,b,B,B,_,_], // 9
  [_,_,B,B,b,T,T,T,K,K,T,b,B,B,_,_], // 10
  [_,_,B,B,b,b,b,b,b,b,b,b,B,B,_,_], // 11
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 12
  [_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_], // 13 - post
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 15
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 17
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 18
  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_], // 19 - base
];

export const TRAIL_REGISTER: PixelSprite = {
  name: 'trail_register',
  width: 16,
  height: 20,
  pixels: trailRegisterPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// HOSTEL - 64x56 pixels (larger building)
// ============================================
const hostelPixels: PixelGrid = [];
for (let y = 0; y < 56; y++) {
  const row: number[] = [];
  for (let x = 0; x < 64; x++) {
    // Roof
    if (y < 16) {
      const roofCenter = 32;
      const roofWidth = 16 + y * 2;
      if (x >= roofCenter - roofWidth / 2 && x < roofCenter + roofWidth / 2) {
        if (y === 0 || x === roofCenter - Math.floor(roofWidth / 2) || x === roofCenter + Math.floor(roofWidth / 2) - 1) {
          row.push(P);
        } else {
          row.push(p);
        }
      } else {
        row.push(_);
      }
    }
    // Walls
    else if (y < 52) {
      if (x < 8 || x >= 56) {
        row.push(_);
      } else if (x === 8 || x === 55) {
        row.push(B);
      } else if (x === 9 || x === 54) {
        row.push(b);
      }
      // Door
      else if (y >= 32 && x >= 28 && x < 36) {
        if (y === 32 || x === 28 || x === 35) {
          row.push(b);
        } else {
          row.push(B);
        }
      }
      // Windows
      else if (y >= 20 && y < 28) {
        if ((x >= 14 && x < 22) || (x >= 42 && x < 50)) {
          if (y === 20 || y === 27 || x === 14 || x === 21 || x === 42 || x === 49) {
            row.push(b);
          } else {
            row.push(C.skyLight);
          }
        } else {
          row.push(T);
        }
      }
      // Wall fill
      else {
        row.push(T);
      }
    }
    // Foundation
    else {
      if (x < 6 || x >= 58) {
        row.push(_);
      } else {
        row.push(G);
      }
    }
  }
  hostelPixels.push(row);
}

export const HOSTEL: PixelSprite = {
  name: 'hostel',
  width: 64,
  height: 56,
  pixels: hostelPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// HAMMOCK - 32x16 pixels
// ============================================
const hammockPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B], // 0 - tree anchors
  [_,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,_], // 1
  [_,_,B,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,B,_,_], // 2 - rope
  [_,_,_,B,b,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,b,B,_,_,_], // 3
  [_,_,_,_,B,B,b,b,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,b,b,B,B,_,_,_,_], // 4
  [_,_,_,_,_,_,B,B,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,P,B,B,_,_,_,_,_,_], // 5 - hammock
  [_,_,_,_,_,_,_,P,P,p,P,P,P,P,P,P,P,P,P,P,P,P,p,P,P,_,_,_,_,_,_,_], // 6
  [_,_,_,_,_,_,_,_,P,P,p,p,P,P,P,P,P,P,P,P,p,p,P,P,_,_,_,_,_,_,_,_], // 7
  [_,_,_,_,_,_,_,_,_,P,P,p,p,p,P,P,P,P,p,p,p,P,P,_,_,_,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,_,_,_,P,P,p,p,p,p,p,p,p,p,P,P,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,_,_,_,P,P,p,p,p,p,p,p,P,P,_,_,_,_,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,_,_,_,_,P,P,p,p,p,p,P,P,_,_,_,_,_,_,_,_,_,_,_,_], // 11
  [_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,p,p,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,P,P,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 15
];

export const HAMMOCK: PixelSprite = {
  name: 'hammock',
  width: 32,
  height: 16,
  pixels: hammockPixels,
  originX: 0.5,
  originY: 0.5,
};

// Export all extended structure sprites
export const EXTENDED_STRUCTURE_SPRITES = {
  privy: PRIVY,
  fireRing: FIRE_RING,
  picnicTable: PICNIC_TABLE,
  bearBox: BEAR_BOX,
  trailRegister: TRAIL_REGISTER,
  hostel: HOSTEL,
  hammock: HAMMOCK,
};
