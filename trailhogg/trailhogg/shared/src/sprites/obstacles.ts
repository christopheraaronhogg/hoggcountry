// ============================================
// TRAIL LEGS - Trail Obstacle Sprites
// ============================================
// Challenges and obstacles hikers encounter on the trail

import { PixelSprite, AnimatedSprite } from './types';
import { C } from './palette';

// ============================================
// BLOWDOWN (Fallen Tree)
// ============================================

export const blowdown: PixelSprite = {
  name: 'blowdown',
  width: 32,
  height: 12,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.leafGreen,C.leafGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.leafGreen,C.leafGreen,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.leafGreen,C.forestGreen,C.forestGreen,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.forestGreen,C.forestGreen,C.leafGreen,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [C.barkDark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// ROCK SCRAMBLE
// ============================================

export const rockScramble: PixelSprite = {
  name: 'rock_scramble',
  width: 24,
  height: 20,
  pixels: [
    [0,0,0,0,0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,0,0,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0,0],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0,0,0],
    [C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0,0,0],
    [C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,0,0,0,0],
    [C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0],
    [0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0],
    [0,0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0,0],
    [0,0,0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0,0,0],
    [0,0,0,0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// METAL LADDER (like on steep sections)
// ============================================

export const metalLadder: PixelSprite = {
  name: 'metal_ladder',
  width: 12,
  height: 24,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,0,0,0,0,C.grayMedium,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,0,0,0,0,C.grayLight,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayMedium,0,0,0,0,C.grayMedium,C.grayMedium,0,0],
    [0,0,C.grayDark,C.grayDark,0,0,0,0,C.grayDark,C.grayDark,0,0],
  ],
};

// ============================================
// ROPE SECTION
// ============================================

export const ropeSection: PixelSprite = {
  name: 'rope_section',
  width: 8,
  height: 24,
  pixels: [
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,0],
    [0,0,C.dirtLight,C.bark,C.bark,C.dirtLight,0,0],
  ],
};

// ============================================
// STEEP INCLINE MARKER
// ============================================

export const steepIncline: PixelSprite = {
  name: 'steep_incline',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,C.warning,C.warning,0,C.nearBlack,C.nearBlack,0,C.warning,C.warning,0,0,0,0],
    [0,0,0,C.warning,C.warning,0,0,C.nearBlack,C.nearBlack,0,0,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.warning,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.warning,C.warning,0,0],
    [0,C.warning,C.warning,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,C.warning,C.warning,0],
    [C.warning,C.warning,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,C.warning,C.warning],
    [C.warning,C.warning,0,0,0,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,0,0,0,C.warning,C.warning],
    [C.warning,C.warning,0,0,0,0,0,0,0,0,0,0,0,0,C.warning,C.warning],
    [C.warning,C.warning,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,C.warning,C.warning],
    [C.warning,C.warning,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// WASHOUT / EROSION
// ============================================

export const washout: PixelSprite = {
  name: 'washout',
  width: 20,
  height: 12,
  pixels: [
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,0,0,0,0,0,0,0,0,0,0,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,0,0,0,0,0,0,0,0,0,0,0,0,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.trailDirt,C.trailDirt,0,0,0,C.grayMedium,C.grayMedium,0,0,0,0,C.grayMedium,0,0,0,0,C.trailDirt,C.trailDirt,C.trailDirt],
    [C.dirtLight,C.trailDirt,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,C.trailDirt,C.dirtLight],
    [C.dirtLight,0,0,0,C.waterBlue,C.grayDark,C.grayMedium,0,C.waterBlue,C.waterBlue,C.waterBlue,C.grayDark,C.grayMedium,C.grayDark,C.waterBlue,0,0,0,0,C.dirtLight],
    [0,0,0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0,0,0,0],
    [0,0,C.waterBlue,C.waterBlue,C.waterDeep,C.waterBlue,C.waterBlue,C.waterDeep,C.waterBlue,C.waterBlue,C.waterDeep,C.waterBlue,C.waterBlue,C.waterDeep,C.waterBlue,C.waterBlue,C.waterBlue,0,0,0],
    [0,C.grayDark,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.grayDark,0,0,0],
    [C.grayDark,C.grayDark,C.grayDark,C.waterBlue,C.waterDeep,C.waterBlue,C.grayDark,C.waterBlue,C.waterDeep,C.waterBlue,C.grayDark,C.grayDark,C.waterBlue,C.waterDeep,C.waterBlue,C.grayDark,C.grayDark,C.grayDark,0,0],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0],
    [0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// OVERGROWN SECTION
// ============================================

export const overgrownTrail: PixelSprite = {
  name: 'overgrown_trail',
  width: 16,
  height: 12,
  pixels: [
    [0,C.leafGreen,0,0,C.forestGreen,0,C.leafGreen,0,0,C.leafGreen,0,C.forestGreen,0,0,C.leafGreen,0],
    [C.forestGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen],
    [C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen],
    [C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.forestGreen],
    [C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.leafGreen],
    [C.forestDark,C.forestGreen,C.forestDark,C.leafGreen,C.forestDark,C.forestGreen,C.leafGreen,C.forestDark,C.forestGreen,C.forestDark,C.leafGreen,C.forestDark,C.forestGreen,C.forestDark,C.leafGreen,C.forestDark],
    [C.trailDirt,C.forestDark,C.trailDirt,C.forestDark,C.trailDirt,C.forestDark,C.trailDirt,C.forestDark,C.trailDirt,C.forestDark,C.trailDirt,C.forestDark,C.trailDirt,C.forestDark,C.trailDirt,C.forestDark],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt],
    [C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark],
  ],
};

// ============================================
// FALLEN ROCKS / ROCKSLIDE
// ============================================

export const rockslide: PixelSprite = {
  name: 'rockslide',
  width: 20,
  height: 14,
  pixels: [
    [0,0,0,0,0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,0,0,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,0,0],
    [C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium],
    [C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium],
    [C.grayDark,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium],
    [C.nearBlack,C.grayDark,C.grayDark,C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack,C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack,C.grayDark],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// ICE PATCH (dangerous in spring)
// ============================================

export const icePatch: PixelSprite = {
  name: 'ice_patch',
  width: 16,
  height: 8,
  pixels: [
    [0,0,0,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,0,0,0],
    [0,C.skyLight,C.skyLight,C.white,C.white,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.white,C.white,C.skyLight,C.skyLight,0,0],
    [C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,0],
    [C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight],
    [C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.white,C.white,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight],
    [C.skyLight,C.white,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.white,C.skyLight,C.skyLight,C.white,C.skyLight,0],
    [0,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.white,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,0,0],
    [0,0,0,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,0,0,0,0],
  ],
};

// Export all obstacle sprites
export const OBSTACLE_SPRITES = {
  blowdown,
  rockScramble,
  metalLadder,
  ropeSection,
  steepIncline,
  washout,
  overgrownTrail,
  rockslide,
  icePatch,
};
