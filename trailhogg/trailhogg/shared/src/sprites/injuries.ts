// ============================================
// TRAIL LEGS - Injury & Ailment Sprites
// ============================================
// Health status indicators and injury visuals

import { PixelSprite, AnimatedSprite } from './types';
import { C } from './palette';

// ============================================
// BLISTER
// ============================================

export const blister: PixelSprite = {
  name: 'blister',
  width: 8,
  height: 8,
  pixels: [
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger,0],
    [C.danger,C.skinLight,C.white,C.white,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [C.danger,C.skinLight,C.white,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [0,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
  ],
};

// ============================================
// BANDAGE
// ============================================

export const bandage: PixelSprite = {
  name: 'bandage',
  width: 10,
  height: 6,
  pixels: [
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
    [C.dirtLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.dirtLight],
    [C.dirtLight,C.white,C.white,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.white,C.white,C.dirtLight],
    [C.dirtLight,C.white,C.white,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.white,C.white,C.dirtLight],
    [C.dirtLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.dirtLight],
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
  ],
};

// ============================================
// MOLESKIN
// ============================================

export const moleskin: PixelSprite = {
  name: 'moleskin',
  width: 8,
  height: 8,
  pixels: [
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
  ],
};

// ============================================
// ICE PACK
// ============================================

export const icePack: PixelSprite = {
  name: 'ice_pack',
  width: 10,
  height: 8,
  pixels: [
    [0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0],
    [C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.skyBlue,C.skyLight,C.skyBlue,C.skyLight,C.skyBlue,C.skyLight,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.skyBlue,C.skyLight,C.skyBlue,C.skyLight,C.skyBlue,C.skyLight,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info],
    [0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0],
  ],
};

// ============================================
// IBUPROFEN (Vitamin I!)
// ============================================

export const ibuprofen: PixelSprite = {
  name: 'ibuprofen',
  width: 8,
  height: 10,
  pixels: [
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.white,C.warning,C.warning,C.white,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
  ],
};

// ============================================
// PAIN INDICATOR (throbbing animation)
// ============================================

export const painIndicator: AnimatedSprite = {
  name: 'pain_indicator',
  width: 10,
  height: 10,
  frameRate: 4,
  loop: true,
  frames: [
    // Frame 1 - small
    [
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,C.danger,C.danger,0,0,0,0],
      [0,0,0,C.danger,C.danger,C.danger,C.danger,0,0,0],
      [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
      [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
      [0,0,0,C.danger,C.danger,C.danger,C.danger,0,0,0],
      [0,0,0,0,C.danger,C.danger,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2 - large
    [
      [0,0,0,C.danger,C.danger,C.danger,C.danger,0,0,0],
      [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
      [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
      [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
      [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
      [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
      [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
      [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
      [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
      [0,0,0,C.danger,C.danger,C.danger,C.danger,0,0,0],
    ],
  ],
};

// ============================================
// SUNBURN (red tint overlay)
// ============================================

export const sunburn: PixelSprite = {
  name: 'sunburn',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0],
  ],
};

// ============================================
// SWOLLEN FOOT
// ============================================

export const swollenFoot: PixelSprite = {
  name: 'swollen_foot',
  width: 10,
  height: 8,
  pixels: [
    [0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,0,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger,0],
    [0,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger],
    [0,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
  ],
};

// ============================================
// DEHYDRATION ICON
// ============================================

export const dehydrationIcon: PixelSprite = {
  name: 'dehydration_icon',
  width: 8,
  height: 10,
  pixels: [
    [0,0,0,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
    [0,0,0,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// HYPOTHERMIA INDICATOR
// ============================================

export const hypothermiaIcon: PixelSprite = {
  name: 'hypothermia_icon',
  width: 8,
  height: 10,
  pixels: [
    [0,0,0,C.skyBlue,C.skyBlue,0,0,0],
    [0,0,C.skyBlue,C.info,C.info,C.skyBlue,0,0],
    [0,C.skyBlue,C.info,C.info,C.info,C.info,C.skyBlue,0],
    [C.skyBlue,C.info,C.info,C.skyLight,C.skyLight,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.skyLight,C.skyLight,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [0,C.skyBlue,C.info,C.info,C.info,C.info,C.skyBlue,0],
    [0,0,C.skyBlue,C.info,C.info,C.skyBlue,0,0],
    [0,0,0,C.skyBlue,C.skyBlue,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// TIRED LEGS ICON
// ============================================

export const tiredLegsIcon: PixelSprite = {
  name: 'tired_legs_icon',
  width: 10,
  height: 12,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
};

// Export all injury sprites
export const INJURY_SPRITES = {
  blister,
  bandage,
  moleskin,
  icePack,
  ibuprofen,
  painIndicator,
  sunburn,
  swollenFoot,
  dehydrationIcon,
  hypothermiaIcon,
  tiredLegsIcon,
};
