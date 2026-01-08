// ============================================
// TRAIL LEGS - Trail Magic Sprites
// ============================================
// Trail angel goodies and surprise trail magic

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// COOLER (Full of cold drinks!)
// ============================================

export const cooler: PixelSprite = {
  name: 'cooler',
  width: 16,
  height: 12,
  pixels: [
    [0,0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0,0],
    [0,C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info,0],
    [C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.info],
    [C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// SODA CAN
// ============================================

export const sodaCan: PixelSprite = {
  name: 'soda_can',
  width: 6,
  height: 10,
  pixels: [
    [0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.white,C.white,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [0,C.danger,C.danger,C.danger,C.danger,0],
  ],
};

// ============================================
// FRUIT (Banana, Apple, Orange)
// ============================================

export const banana: PixelSprite = {
  name: 'banana',
  width: 10,
  height: 6,
  pixels: [
    [0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,0,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0],
    [C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,C.bark,0,0,0,0,0,0,0,0],
  ],
};

export const apple: PixelSprite = {
  name: 'apple',
  width: 8,
  height: 10,
  pixels: [
    [0,0,0,C.forestDark,C.forestDark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

export const orange: PixelSprite = {
  name: 'orange',
  width: 8,
  height: 8,
  pixels: [
    [0,0,0,C.forestDark,C.forestDark,0,0,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
  ],
};

// ============================================
// LAWN CHAIR
// ============================================

export const lawnChair: PixelSprite = {
  name: 'lawn_chair',
  width: 14,
  height: 14,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0,0,0,0],
    [0,0,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0,0,0,0],
    [0,0,C.grayMedium,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,0,0],
    [0,0,C.grayMedium,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,0,0],
    [0,0,C.grayMedium,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,0,0],
    [0,0,C.grayMedium,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,0,0],
    [0,0,C.grayMedium,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.grayMedium,0],
    [0,0,C.grayMedium,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.grayMedium,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [0,0,0,C.grayMedium,0,0,0,0,0,0,0,0,C.grayMedium,0],
    [0,0,0,C.grayMedium,0,0,0,0,0,0,0,0,C.grayMedium,0],
    [0,0,0,C.grayMedium,0,0,0,0,0,0,0,0,C.grayMedium,0],
    [0,0,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,C.grayDark,C.grayDark],
    [0,0,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,C.grayDark,C.grayDark],
  ],
};

// ============================================
// SNACK TABLE
// ============================================

export const snackTable: PixelSprite = {
  name: 'snack_table',
  width: 20,
  height: 14,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0],
    [0,C.bark,C.dirtLight,C.danger,C.danger,C.dirtLight,C.warning,C.warning,C.dirtLight,C.success,C.dirtLight,C.danger,C.dirtLight,C.info,C.info,C.dirtLight,C.warning,C.dirtLight,C.bark,0],
    [0,C.bark,C.dirtLight,C.danger,C.danger,C.dirtLight,C.warning,C.warning,C.dirtLight,C.success,C.dirtLight,C.danger,C.dirtLight,C.info,C.info,C.dirtLight,C.warning,C.dirtLight,C.bark,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,0],
    [0,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,0],
  ],
};

// ============================================
// HIKER BOX
// ============================================

export const hikerBox: PixelSprite = {
  name: 'hiker_box',
  width: 14,
  height: 12,
  pixels: [
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark],
    [C.bark,C.dirtLight,C.danger,C.warning,C.dirtLight,C.success,C.info,C.dirtLight,C.danger,C.dirtLight,C.warning,C.success,C.dirtLight,C.bark],
    [C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// PIZZA BOX
// ============================================

export const pizzaBox: PixelSprite = {
  name: 'pizza_box',
  width: 14,
  height: 8,
  pixels: [
    [C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.danger,C.danger,C.trailDirt,C.danger,C.danger,C.trailDirt,C.danger,C.danger,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.danger,C.danger,C.trailDirt,C.danger,C.danger,C.trailDirt,C.danger,C.danger,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// WATER JUG
// ============================================

export const waterJug: PixelSprite = {
  name: 'water_jug',
  width: 10,
  height: 14,
  pixels: [
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,0,0,0],
    [0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0],
    [0,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,0],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [0,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,0],
    [0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// TRAIL MAGIC SIGN
// ============================================

export const trailMagicSign: PixelSprite = {
  name: 'trail_magic_sign',
  width: 16,
  height: 14,
  pixels: [
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.bark,C.bark,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.warning],
    [C.warning,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.warning],
    [C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.warning],
    [0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.bark,C.bark,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0],
  ],
};

// Export all trail magic sprites
export const TRAIL_MAGIC_SPRITES = {
  cooler,
  sodaCan,
  banana,
  apple,
  orange,
  lawnChair,
  snackTable,
  hikerBox,
  pizzaBox,
  waterJug,
  trailMagicSign,
};
