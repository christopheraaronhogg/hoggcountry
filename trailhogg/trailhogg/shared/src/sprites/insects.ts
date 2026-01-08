// ============================================
// TRAIL LEGS - Insect & Amphibian Sprites
// ============================================
// Bugs, pests, and small creatures of the trail

import { PixelSprite, AnimatedSprite } from './types';
import { C } from './palette';

// ============================================
// MOSQUITO (trail pest!)
// ============================================

export const mosquito: PixelSprite = {
  name: 'mosquito',
  width: 8,
  height: 8,
  pixels: [
    [0,0,0,C.grayDark,C.grayDark,0,0,0],
    [0,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,0],
    [0,C.grayLight,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayLight,0],
    [C.grayLight,C.grayLight,0,C.grayMedium,C.grayMedium,0,C.grayLight,C.grayLight],
    [0,0,0,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,0],
    [0,C.grayDark,0,0,0,0,C.grayDark,0],
    [C.grayDark,0,0,0,0,0,0,C.grayDark],
  ],
};

// Animated mosquito flying
export const mosquitoFlying: AnimatedSprite = {
  name: 'mosquito_flying',
  width: 8,
  height: 8,
  frameRate: 12,
  loop: true,
  frames: [
    // Frame 1 - wings up
    [
      [0,0,0,C.grayDark,C.grayDark,0,0,0],
      [0,C.grayLight,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayLight,0],
      [C.grayLight,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,C.grayLight],
      [0,0,0,C.grayMedium,C.grayMedium,0,0,0],
      [0,0,0,C.grayMedium,C.grayMedium,0,0,0],
      [0,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,0],
      [0,C.grayDark,0,0,0,0,C.grayDark,0],
      [C.grayDark,0,0,0,0,0,0,C.grayDark],
    ],
    // Frame 2 - wings down
    [
      [0,0,0,C.grayDark,C.grayDark,0,0,0],
      [0,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,0],
      [0,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,0],
      [C.grayLight,C.grayLight,0,C.grayMedium,C.grayMedium,0,C.grayLight,C.grayLight],
      [0,0,0,C.grayMedium,C.grayMedium,0,0,0],
      [0,0,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,0,0],
      [0,C.grayDark,0,0,0,0,C.grayDark,0],
      [C.grayDark,0,0,0,0,0,0,C.grayDark],
    ],
  ],
};

// ============================================
// TICK (scary trail pest)
// ============================================

export const tick: PixelSprite = {
  name: 'tick',
  width: 6,
  height: 6,
  pixels: [
    [0,C.barkDark,0,0,C.barkDark,0],
    [C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark],
    [0,C.bark,C.danger,C.danger,C.bark,0],
    [0,C.bark,C.danger,C.danger,C.bark,0],
    [C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark],
    [0,C.barkDark,0,0,C.barkDark,0],
  ],
};

// ============================================
// BUTTERFLY
// ============================================

export const butterfly: AnimatedSprite = {
  name: 'butterfly',
  width: 12,
  height: 8,
  frameRate: 6,
  loop: true,
  frames: [
    // Frame 1 - wings up
    [
      [0,C.warning,C.warning,0,0,0,0,0,0,C.warning,C.warning,0],
      [C.warning,C.warning,C.warning,C.warning,0,0,0,0,C.warning,C.warning,C.warning,C.warning],
      [C.warning,C.warning,C.warning,C.warning,0,0,0,0,C.warning,C.warning,C.warning,C.warning],
      [0,C.warning,C.warning,C.warning,0,C.nearBlack,C.nearBlack,0,C.warning,C.warning,C.warning,0],
      [0,0,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0],
      [0,0,0,0,0,C.nearBlack,C.nearBlack,0,0,0,0,0],
      [0,0,0,0,0,C.nearBlack,C.nearBlack,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2 - wings mid
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,C.warning,C.warning,0,0,0,0,C.warning,C.warning,0,0],
      [0,C.warning,C.warning,C.warning,C.warning,0,0,C.warning,C.warning,C.warning,C.warning,0],
      [0,C.warning,C.warning,C.warning,0,C.nearBlack,C.nearBlack,0,C.warning,C.warning,C.warning,0],
      [0,0,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0],
      [0,0,0,0,0,C.nearBlack,C.nearBlack,0,0,0,0,0],
      [0,0,0,0,0,C.nearBlack,C.nearBlack,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 3 - wings down
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,C.warning,C.warning,0,C.nearBlack,C.nearBlack,0,C.warning,C.warning,0,0],
      [0,C.warning,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,C.warning,0],
      [C.warning,C.warning,C.warning,C.warning,0,C.nearBlack,C.nearBlack,0,C.warning,C.warning,C.warning,C.warning],
      [0,C.warning,C.warning,0,0,C.nearBlack,C.nearBlack,0,0,C.warning,C.warning,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  ],
};

// ============================================
// BEE
// ============================================

export const bee: PixelSprite = {
  name: 'bee',
  width: 8,
  height: 6,
  pixels: [
    [0,0,C.grayLight,C.grayLight,C.grayLight,C.grayLight,0,0],
    [0,C.grayLight,C.warning,C.nearBlack,C.warning,C.nearBlack,C.grayLight,0],
    [0,0,C.warning,C.nearBlack,C.warning,C.nearBlack,0,0],
    [0,0,C.warning,C.nearBlack,C.warning,C.nearBlack,0,0],
    [0,0,0,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// DRAGONFLY
// ============================================

export const dragonfly: PixelSprite = {
  name: 'dragonfly',
  width: 16,
  height: 6,
  pixels: [
    [0,0,0,0,C.skyLight,C.skyLight,C.skyLight,0,0,C.skyLight,C.skyLight,C.skyLight,0,0,0,0],
    [0,C.skyLight,C.skyLight,C.skyLight,C.skyLight,0,0,0,0,0,0,C.skyLight,C.skyLight,C.skyLight,C.skyLight,0],
    [C.skyLight,C.skyLight,0,0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0,0,C.skyLight,C.skyLight],
    [0,C.skyLight,C.skyLight,C.skyLight,C.info,C.nearBlack,C.nearBlack,C.info,C.info,C.info,C.info,C.info,C.skyLight,C.skyLight,C.skyLight,0],
    [0,0,0,0,C.skyLight,C.skyLight,C.skyLight,0,0,C.skyLight,C.skyLight,C.skyLight,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// ANT
// ============================================

export const ant: PixelSprite = {
  name: 'ant',
  width: 6,
  height: 4,
  pixels: [
    [0,C.nearBlack,0,0,C.nearBlack,0],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [0,C.grayDark,0,0,C.grayDark,0],
    [C.grayDark,0,0,0,0,C.grayDark],
  ],
};

// ============================================
// SPIDER
// ============================================

export const spider: PixelSprite = {
  name: 'spider',
  width: 8,
  height: 8,
  pixels: [
    [0,C.nearBlack,0,0,0,0,C.nearBlack,0],
    [0,0,C.nearBlack,0,0,C.nearBlack,0,0],
    [C.nearBlack,0,0,C.bark,C.bark,0,0,C.nearBlack],
    [0,C.nearBlack,C.bark,C.bark,C.bark,C.bark,C.nearBlack,0],
    [0,C.nearBlack,C.bark,C.bark,C.bark,C.bark,C.nearBlack,0],
    [C.nearBlack,0,0,C.bark,C.bark,0,0,C.nearBlack],
    [0,0,C.nearBlack,0,0,C.nearBlack,0,0],
    [0,C.nearBlack,0,0,0,0,C.nearBlack,0],
  ],
};

// ============================================
// CATERPILLAR
// ============================================

export const caterpillar: PixelSprite = {
  name: 'caterpillar',
  width: 12,
  height: 4,
  pixels: [
    [0,0,C.success,0,C.success,0,C.success,0,C.success,0,C.success,0],
    [0,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success],
    [C.nearBlack,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,0],
    [0,0,C.nearBlack,0,C.nearBlack,0,C.nearBlack,0,C.nearBlack,0,C.nearBlack,0],
  ],
};

// ============================================
// FROG
// ============================================

export const frog: PixelSprite = {
  name: 'frog',
  width: 12,
  height: 10,
  pixels: [
    [0,0,0,C.forestGreen,C.forestGreen,0,0,C.forestGreen,C.forestGreen,0,0,0],
    [0,0,C.forestGreen,C.white,C.nearBlack,C.forestGreen,C.forestGreen,C.white,C.nearBlack,C.forestGreen,0,0],
    [0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0],
    [0,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,0],
    [C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen],
    [C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen],
    [0,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,0],
    [0,0,C.forestGreen,C.forestGreen,0,0,0,0,C.forestGreen,C.forestGreen,0,0],
    [0,C.forestGreen,C.forestGreen,0,0,0,0,0,0,C.forestGreen,C.forestGreen,0],
    [C.forestGreen,C.forestGreen,0,0,0,0,0,0,0,0,C.forestGreen,C.forestGreen],
  ],
};

// Frog hopping animation
export const frogHop: AnimatedSprite = {
  name: 'frog_hop',
  width: 12,
  height: 12,
  frameRate: 8,
  loop: true,
  frames: [
    // Frame 1 - crouched
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,C.forestGreen,C.forestGreen,0,0,C.forestGreen,C.forestGreen,0,0,0],
      [0,0,C.forestGreen,C.white,C.nearBlack,C.forestGreen,C.forestGreen,C.white,C.nearBlack,C.forestGreen,0,0],
      [0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0],
      [0,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,0],
      [C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen],
      [C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen],
      [0,C.forestGreen,C.forestGreen,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,C.forestGreen,C.forestGreen,0],
      [C.forestGreen,C.forestGreen,0,C.forestGreen,C.forestGreen,0,0,C.forestGreen,C.forestGreen,0,C.forestGreen,C.forestGreen],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2 - jumping up
    [
      [0,0,0,C.forestGreen,C.forestGreen,0,0,C.forestGreen,C.forestGreen,0,0,0],
      [0,0,C.forestGreen,C.white,C.nearBlack,C.forestGreen,C.forestGreen,C.white,C.nearBlack,C.forestGreen,0,0],
      [0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0],
      [0,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,0],
      [C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen],
      [0,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,0],
      [0,0,C.forestGreen,C.forestGreen,0,0,0,0,C.forestGreen,C.forestGreen,0,0],
      [0,C.forestGreen,C.forestGreen,0,0,0,0,0,0,C.forestGreen,C.forestGreen,0],
      [C.forestGreen,C.forestGreen,0,0,0,0,0,0,0,0,C.forestGreen,C.forestGreen],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  ],
};

// ============================================
// SALAMANDER
// ============================================

export const salamander: PixelSprite = {
  name: 'salamander',
  width: 16,
  height: 6,
  pixels: [
    [0,0,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,0,0,0],
    [0,0,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0],
    [0,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0],
    [0,0,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [C.warning,C.warning,0,0,0,0,0,0,0,0,0,0,0,0,C.warning,C.warning],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// SNAIL
// ============================================

export const snail: PixelSprite = {
  name: 'snail',
  width: 10,
  height: 8,
  pixels: [
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,C.bark,0],
    [0,C.grayMedium,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0],
    [C.grayMedium,C.grayMedium,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// WORM
// ============================================

export const worm: PixelSprite = {
  name: 'worm',
  width: 12,
  height: 4,
  pixels: [
    [0,0,0,0,0,C.danger,C.danger,0,0,0,0,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0],
    [0,C.danger,C.danger,0,0,0,0,0,C.danger,C.danger,C.danger,0],
    [0,0,0,0,0,0,0,0,0,0,C.danger,C.danger],
  ],
};

// ============================================
// MOTH (at night near headlamp)
// ============================================

export const moth: AnimatedSprite = {
  name: 'moth',
  width: 8,
  height: 6,
  frameRate: 8,
  loop: true,
  frames: [
    // Wings up
    [
      [0,C.dirtLight,C.dirtLight,0,0,C.dirtLight,C.dirtLight,0],
      [C.dirtLight,C.trailDirt,C.dirtLight,0,0,C.dirtLight,C.trailDirt,C.dirtLight],
      [0,C.dirtLight,0,C.bark,C.bark,0,C.dirtLight,0],
      [0,0,0,C.bark,C.bark,0,0,0],
      [0,0,0,C.bark,C.bark,0,0,0],
      [0,0,0,0,0,0,0,0],
    ],
    // Wings down
    [
      [0,0,0,0,0,0,0,0],
      [0,0,0,C.bark,C.bark,0,0,0],
      [0,C.dirtLight,0,C.bark,C.bark,0,C.dirtLight,0],
      [C.dirtLight,C.trailDirt,C.dirtLight,C.bark,C.bark,C.dirtLight,C.trailDirt,C.dirtLight],
      [0,C.dirtLight,C.dirtLight,0,0,C.dirtLight,C.dirtLight,0],
      [0,0,0,0,0,0,0,0],
    ],
  ],
};

// ============================================
// CRICKET
// ============================================

export const cricket: PixelSprite = {
  name: 'cricket',
  width: 8,
  height: 6,
  pixels: [
    [0,0,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0],
    [C.nearBlack,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0],
    [0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.nearBlack],
    [0,C.nearBlack,0,C.nearBlack,0,0,C.nearBlack,0],
    [C.nearBlack,0,C.nearBlack,0,0,C.nearBlack,0,0],
  ],
};

// Export all insect sprites
export const INSECT_SPRITES = {
  mosquito,
  mosquitoFlying,
  tick,
  butterfly,
  bee,
  dragonfly,
  ant,
  spider,
  caterpillar,
  frog,
  frogHop,
  salamander,
  snail,
  worm,
  moth,
  cricket,
};
