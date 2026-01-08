// ============================================
// TRAIL LEGS - Food Item Sprites
// ============================================
// Detailed trail food and town resupply items

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// TRAIL FOOD
// ============================================

export const proteinBar: PixelSprite = {
  name: 'protein_bar',
  width: 12,
  height: 6,
  pixels: [
    [C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark],
    [C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark],
    [C.barkDark,C.bark,C.warning,C.warning,C.bark,C.bark,C.bark,C.warning,C.warning,C.bark,C.bark,C.barkDark],
    [C.barkDark,C.bark,C.warning,C.warning,C.bark,C.bark,C.bark,C.warning,C.warning,C.bark,C.bark,C.barkDark],
    [C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark],
    [C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark],
  ],
};

export const trailMix: PixelSprite = {
  name: 'trail_mix',
  width: 10,
  height: 12,
  pixels: [
    [0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0],
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
    [C.dirtLight,C.trailDirt,C.barkDark,C.warning,C.trailDirt,C.danger,C.trailDirt,C.barkDark,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.danger,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.warning,C.trailDirt,C.danger,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.warning,C.trailDirt,C.danger,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.barkDark,C.trailDirt,C.danger,C.trailDirt,C.barkDark,C.trailDirt,C.warning,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.warning,C.trailDirt,C.trailDirt,C.danger,C.trailDirt,C.barkDark,C.dirtLight],
    [C.dirtLight,C.danger,C.barkDark,C.trailDirt,C.trailDirt,C.warning,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.danger,C.warning,C.dirtLight],
    [0,C.dirtLight,C.warning,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.dirtLight,0],
    [0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
};

export const peanutButter: PixelSprite = {
  name: 'peanut_butter',
  width: 10,
  height: 12,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0],
    [0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0],
    [C.waterBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.waterBlue],
    [C.waterBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.waterBlue],
    [C.waterBlue,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.waterBlue],
    [C.waterBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.waterBlue],
    [C.waterBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.waterBlue],
    [C.waterBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.waterBlue],
    [C.waterBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.waterBlue],
    [0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
};

export const tortilla: PixelSprite = {
  name: 'tortilla',
  width: 12,
  height: 8,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,0,0],
    [0,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.dirtLight,0],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,C.trailDirt,C.dirtLight],
    [0,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,0],
    [0,0,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

export const ramen: PixelSprite = {
  name: 'ramen',
  width: 10,
  height: 8,
  pixels: [
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.warning],
    [C.warning,C.dirtLight,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.dirtLight,C.warning],
    [C.warning,C.dirtLight,C.warning,C.danger,C.danger,C.danger,C.danger,C.warning,C.dirtLight,C.warning],
    [C.warning,C.dirtLight,C.warning,C.danger,C.danger,C.danger,C.danger,C.warning,C.dirtLight,C.warning],
    [C.warning,C.dirtLight,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.dirtLight,C.warning],
    [C.warning,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
  ],
};

export const oatmealPacket: PixelSprite = {
  name: 'oatmeal_packet',
  width: 10,
  height: 8,
  pixels: [
    [C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.danger,C.danger,C.trailDirt,C.trailDirt,C.success,C.success,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight],
  ],
};

export const tunaPack: PixelSprite = {
  name: 'tuna_pack',
  width: 12,
  height: 8,
  pixels: [
    [0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0],
    [C.waterBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.waterBlue],
    [C.waterBlue,C.skyBlue,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.skyBlue,C.waterBlue],
    [C.waterBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.waterBlue],
    [C.waterBlue,C.skyBlue,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.skyBlue,C.waterBlue],
    [C.waterBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.waterBlue],
    [C.waterBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.waterBlue],
    [0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0],
  ],
};

// ============================================
// TOWN FOOD
// ============================================

export const burger: PixelSprite = {
  name: 'burger',
  width: 12,
  height: 10,
  pixels: [
    [0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0],
    [0,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,0],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen,C.success,C.leafGreen],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [0,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,0],
    [0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0],
  ],
};

export const pizza: PixelSprite = {
  name: 'pizza',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,0,0,0,C.warning,C.warning,0,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.danger,C.warning,C.warning,C.warning,0,0],
    [0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.warning,C.warning,0],
    [0,0,C.warning,C.warning,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.warning,C.warning,C.warning,C.warning],
    [0,C.warning,C.warning,C.warning,C.warning,C.danger,C.warning,C.warning,C.warning,C.danger,C.warning,C.warning],
    [0,C.warning,C.warning,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.warning,C.warning],
    [C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const iceCream: PixelSprite = {
  name: 'ice_cream',
  width: 8,
  height: 12,
  pixels: [
    [0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0],
    [0,C.dirtLight,C.white,C.white,C.white,C.white,C.dirtLight,0],
    [C.dirtLight,C.white,C.white,C.white,C.white,C.white,C.white,C.dirtLight],
    [C.dirtLight,C.white,C.white,C.white,C.white,C.white,C.white,C.dirtLight],
    [C.dirtLight,C.white,C.white,C.white,C.white,C.white,C.white,C.dirtLight],
    [0,C.dirtLight,C.white,C.white,C.white,C.white,C.dirtLight,0],
    [0,0,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,0,0],
    [0,0,0,C.trailDirt,C.trailDirt,0,0,0],
    [0,0,0,C.trailDirt,C.trailDirt,0,0,0],
    [0,0,0,C.trailDirt,C.trailDirt,0,0,0],
    [0,0,0,C.trailDirt,C.trailDirt,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

export const coffee: PixelSprite = {
  name: 'coffee',
  width: 8,
  height: 10,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,C.white,C.bark,C.bark,C.bark,C.bark,C.white,0],
    [0,C.white,C.bark,C.bark,C.bark,C.bark,C.white,C.white],
    [0,C.white,C.bark,C.bark,C.bark,C.bark,C.white,C.white],
    [0,C.white,C.bark,C.bark,C.bark,C.bark,C.white,C.white],
    [0,C.white,C.bark,C.bark,C.bark,C.bark,C.white,C.white],
    [0,C.white,C.bark,C.bark,C.bark,C.bark,C.white,C.white],
    [0,C.white,C.white,C.white,C.white,C.white,C.white,0],
    [0,0,C.white,C.white,C.white,C.white,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

export const hotDog: PixelSprite = {
  name: 'hot_dog',
  width: 14,
  height: 6,
  pixels: [
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.danger,C.danger,C.warning,C.danger,C.warning,C.danger,C.warning,C.danger,C.danger,C.danger,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.danger,C.danger,C.danger,C.warning,C.danger,C.warning,C.danger,C.warning,C.danger,C.danger,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.trailDirt,C.trailDirt,C.dirtLight],
    [0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0],
  ],
};

// ============================================
// DRINKS
// ============================================

export const waterBottle: PixelSprite = {
  name: 'water_bottle',
  width: 6,
  height: 12,
  pixels: [
    [0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,0],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [0,0,0,0,0,0],
  ],
};

export const energyDrink: PixelSprite = {
  name: 'energy_drink',
  width: 6,
  height: 12,
  pixels: [
    [0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [C.nearBlack,C.success,C.success,C.success,C.success,C.nearBlack],
    [C.nearBlack,C.success,C.success,C.success,C.success,C.nearBlack],
    [C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack],
    [0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0],
    [0,0,0,0,0,0],
  ],
};

// Export all food sprites
export const FOOD_SPRITES = {
  proteinBar,
  trailMix,
  peanutButter,
  tortilla,
  ramen,
  oatmealPacket,
  tunaPack,
  burger,
  pizza,
  iceCream,
  coffee,
  hotDog,
  waterBottle,
  energyDrink,
};
