// ============================================
// TRAIL LEGS - Clothing & Wearable Gear Sprites
// ============================================
// Equipment worn by the hiker

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// HATS
// ============================================

export const sunHat: PixelSprite = {
  name: 'sun_hat',
  width: 14,
  height: 6,
  pixels: [
    [0,0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0,0],
    [0,0,C.dirtLight,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,C.dirtLight,0,0],
    [0,C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight,0],
    [C.dirtLight,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.dirtLight],
    [C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const baseballCap: PixelSprite = {
  name: 'baseball_cap',
  width: 12,
  height: 6,
  pixels: [
    [0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0],
    [0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0],
    [0,C.forestGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestGreen,0],
    [C.forestGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestGreen],
    [C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const beanie: PixelSprite = {
  name: 'beanie',
  width: 10,
  height: 6,
  pixels: [
    [0,0,0,0,C.warning,C.warning,0,0,0,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [0,C.danger,C.warning,C.danger,C.danger,C.danger,C.danger,C.warning,C.danger,0],
    [C.danger,C.danger,C.danger,C.warning,C.danger,C.danger,C.warning,C.danger,C.danger,C.danger],
    [C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark],
  ],
};

// ============================================
// RAIN GEAR
// ============================================

export const rainJacket: PixelSprite = {
  name: 'rain_jacket',
  width: 14,
  height: 12,
  pixels: [
    [0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.info,C.info,C.info,C.info,C.skyBlue,0,0,0,0],
    [0,0,0,C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue,0,0,0],
    [0,0,C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue,0,0],
    [0,C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue,0],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [0,C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue,0],
    [0,0,C.skyBlue,C.skyBlue,0,0,0,0,0,0,C.skyBlue,C.skyBlue,0,0],
    [0,0,C.skyBlue,C.skyBlue,0,0,0,0,0,0,C.skyBlue,C.skyBlue,0,0],
  ],
};

export const rainPants: PixelSprite = {
  name: 'rain_pants',
  width: 10,
  height: 10,
  pixels: [
    [0,C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue,0],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,0,0,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,0,0,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,0,0,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,0,0,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,0,0,C.info,C.info,C.info,C.skyBlue],
    [C.skyBlue,C.info,C.info,C.info,0,0,C.info,C.info,C.info,C.skyBlue],
    [0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0],
  ],
};

// ============================================
// INSULATING LAYERS
// ============================================

export const puffyJacket: PixelSprite = {
  name: 'puffy_jacket',
  width: 14,
  height: 12,
  pixels: [
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,0,0,0],
    [0,0,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,0,0],
    [0,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,0],
    [C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger],
    [C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger],
    [0,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,0],
    [0,0,C.danger,C.danger,0,0,0,0,0,0,C.danger,C.danger,0,0],
    [0,0,C.danger,C.danger,0,0,0,0,0,0,C.danger,C.danger,0,0],
  ],
};

export const fleece: PixelSprite = {
  name: 'fleece',
  width: 14,
  height: 10,
  pixels: [
    [0,0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0],
    [0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.nearBlack,C.nearBlack,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.nearBlack,C.nearBlack,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [0,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0,0,C.grayMedium,C.grayMedium,0],
    [0,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0,0,C.grayMedium,C.grayMedium,0],
  ],
};

// ============================================
// FOOTWEAR
// ============================================

export const trailRunners: PixelSprite = {
  name: 'trail_runners',
  width: 10,
  height: 6,
  pixels: [
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayMedium,C.info,C.info,C.info,C.info,C.grayMedium,0],
    [0,C.grayMedium,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.grayMedium],
    [C.grayMedium,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.grayMedium],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0],
  ],
};

export const hikingBoots: PixelSprite = {
  name: 'hiking_boots',
  width: 10,
  height: 8,
  pixels: [
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0],
  ],
};

export const campShoes: PixelSprite = {
  name: 'camp_shoes',
  width: 8,
  height: 4,
  pixels: [
    [0,0,C.info,C.info,C.info,C.info,0,0],
    [0,C.info,C.info,C.info,C.info,C.info,C.info,0],
    [C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
  ],
};

// ============================================
// GAITERS
// ============================================

export const gaiters: PixelSprite = {
  name: 'gaiters',
  width: 8,
  height: 8,
  pixels: [
    [0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0],
    [C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack],
    [C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack],
    [C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack],
    [C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack],
    [C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack],
    [C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack],
    [0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0],
  ],
};

// ============================================
// SUNGLASSES
// ============================================

export const sunglasses: PixelSprite = {
  name: 'sunglasses',
  width: 10,
  height: 4,
  pixels: [
    [C.nearBlack,C.nearBlack,C.nearBlack,0,C.nearBlack,C.nearBlack,0,C.nearBlack,C.nearBlack,C.nearBlack],
    [C.nearBlack,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,C.nearBlack],
    [C.nearBlack,C.grayDark,C.nearBlack,0,0,0,0,C.nearBlack,C.grayDark,C.nearBlack],
    [0,C.nearBlack,C.nearBlack,0,0,0,0,C.nearBlack,C.nearBlack,0],
  ],
};

// ============================================
// BUFF / NECK GAITER
// ============================================

export const buff: PixelSprite = {
  name: 'buff',
  width: 10,
  height: 6,
  pixels: [
    [0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0],
    [0,C.forestGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestGreen,0],
    [C.forestGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestGreen],
    [C.forestGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestGreen],
    [0,C.forestGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestGreen,0],
    [0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0],
  ],
};

// ============================================
// GLOVES
// ============================================

export const gloves: PixelSprite = {
  name: 'gloves',
  width: 8,
  height: 6,
  pixels: [
    [0,C.grayMedium,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,C.grayMedium,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium],
    [0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0],
    [0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0],
    [0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0],
  ],
};

// Export all clothing sprites
export const CLOTHING_SPRITES = {
  sunHat,
  baseballCap,
  beanie,
  rainJacket,
  rainPants,
  puffyJacket,
  fleece,
  trailRunners,
  hikingBoots,
  campShoes,
  gaiters,
  sunglasses,
  buff,
  gloves,
};
