// ============================================
// TRAIL LEGS - Weather Sprite Definitions
// ============================================
// Rain, fog, and other atmospheric effects

import { PixelSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const R = C.skyLight;     // Rain (light blue)
const r = C.skyBlue;      // Rain shadow
const F = C.grayLight;    // Fog
const L = C.highlight;    // Lightning

/**
 * Rain Drop - Falling water particle
 * 2x8 pixels - elongated drop for motion effect
 */
const rainDropPixels: PixelGrid = [
  [R,_], // 0
  [R,R], // 1
  [R,R], // 2
  [R,R], // 3
  [R,R], // 4
  [r,R], // 5
  [r,r], // 6
  [_,r], // 7
];

export const RAIN_DROP: PixelSprite = {
  name: 'rain',
  width: 2,
  height: 8,
  pixels: rainDropPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Heavy Rain Drop - Larger, faster rain
 * 3x12 pixels
 */
const heavyRainPixels: PixelGrid = [
  [_,R,_], // 0
  [R,R,R], // 1
  [R,R,R], // 2
  [R,R,R], // 3
  [R,R,R], // 4
  [R,R,R], // 5
  [R,R,R], // 6
  [R,R,R], // 7
  [r,R,R], // 8
  [r,R,r], // 9
  [r,r,r], // 10
  [_,r,_], // 11
];

export const HEAVY_RAIN: PixelSprite = {
  name: 'rain_heavy',
  width: 3,
  height: 12,
  pixels: heavyRainPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Fog Cloud - Atmospheric fog effect
 * 32x16 pixels - soft cloud shape with transparency
 * Note: This uses partial transparency, represented by different gray values
 */
const fogCloudPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,F,F,F,F,F,F,F,F,F,F,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_,_,_,_], // 2
  [_,_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_,_], // 3
  [_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_], // 4
  [_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_], // 5
  [_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_], // 6
  [F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F], // 7
  [F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F], // 8
  [_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_], // 9
  [_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_], // 10
  [_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_], // 11
  [_,_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_,_], // 12
  [_,_,_,_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,_,_,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,_,_,_,_,F,F,F,F,F,F,F,F,F,F,_,_,_,_,_,_,_,_,_,_,_], // 15
];

export const FOG_CLOUD: PixelSprite = {
  name: 'fog',
  width: 32,
  height: 16,
  pixels: fogCloudPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Lightning Bolt - Storm effect
 * 16x32 pixels
 */
const lightningPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,_,L,L,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,L,L,L,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,L,L,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,L,L,L,_,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,L,L,_,_,_,_,_,_,_,_], // 4
  [_,_,_,_,_,L,L,L,_,_,_,_,_,_,_,_], // 5
  [_,_,_,_,_,L,L,_,_,_,_,_,_,_,_,_], // 6
  [_,_,_,_,L,L,L,_,_,_,_,_,_,_,_,_], // 7
  [_,_,_,_,L,L,_,_,_,_,_,_,_,_,_,_], // 8
  [_,_,_,L,L,L,L,L,L,L,L,L,_,_,_,_], // 9 - horizontal branch
  [_,_,_,L,L,L,L,L,L,L,L,L,L,_,_,_], // 10
  [_,_,_,_,_,_,_,_,L,L,L,_,_,_,_,_], // 11
  [_,_,_,_,_,_,_,L,L,L,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,_,L,L,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,L,L,L,_,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,L,L,_,_,_,_,_,_,_,_], // 15
  [_,_,_,_,_,L,L,L,_,_,_,_,_,_,_,_], // 16
  [_,_,_,_,_,L,L,_,_,_,_,_,_,_,_,_], // 17
  [_,_,_,_,L,L,L,_,_,_,_,_,_,_,_,_], // 18
  [_,_,_,_,L,L,_,_,_,_,_,_,_,_,_,_], // 19
  [_,_,_,L,L,L,_,_,_,_,_,_,_,_,_,_], // 20
  [_,_,_,L,L,_,_,_,_,_,_,_,_,_,_,_], // 21
  [_,_,L,L,L,_,_,_,_,_,_,_,_,_,_,_], // 22
  [_,_,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 23
  [_,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 24
  [_,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_], // 25
  [L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_], // 26
  [L,L,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 27
  [L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_], // 28
  [_,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 29
  [_,_,L,L,L,_,_,_,_,_,_,_,_,_,_,_], // 30
  [_,_,_,L,L,_,_,_,_,_,_,_,_,_,_,_], // 31
];

export const LIGHTNING: PixelSprite = {
  name: 'lightning',
  width: 16,
  height: 32,
  pixels: lightningPixels,
  originX: 0.5,
  originY: 0,
};

// Export all weather sprites
export const WEATHER_SPRITES = {
  rainDrop: RAIN_DROP,
  heavyRain: HEAVY_RAIN,
  fogCloud: FOG_CLOUD,
  lightning: LIGHTNING,
};
