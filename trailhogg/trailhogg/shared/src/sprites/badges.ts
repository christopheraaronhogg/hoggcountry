// ============================================
// TRAIL LEGS - Achievement Badge Sprites
// ============================================
// Milestone badges and achievement icons

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// STATE CROSSING BADGES
// ============================================

export const badgeGeorgia: PixelSprite = {
  name: 'badge_georgia',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0,0],
    [0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0],
    [0,C.warning,C.danger,C.danger,C.danger,C.white,C.white,C.danger,C.danger,C.white,C.white,C.danger,C.danger,C.danger,C.warning,0],
    [C.warning,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.warning],
    [0,C.warning,C.danger,C.danger,C.danger,C.white,C.white,C.danger,C.danger,C.white,C.white,C.danger,C.danger,C.danger,C.warning,0],
    [0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0],
    [0,0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0,0],
    [0,0,0,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const badgeMaine: PixelSprite = {
  name: 'badge_maine',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0],
    [0,0,0,C.forestGreen,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,C.forestGreen,0,0,0],
    [0,0,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,0,0],
    [0,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,0],
    [0,C.forestGreen,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestGreen,0],
    [C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.white,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.white,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestGreen],
    [C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.white,C.forestDark,C.forestDark,C.white,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestGreen],
    [C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.white,C.white,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestGreen],
    [C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestGreen],
    [C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.forestGreen],
    [0,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,0],
    [0,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,0],
    [0,0,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,0,0],
    [0,0,0,C.forestGreen,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,C.forestGreen,0,0,0],
    [0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// MILESTONE BADGES
// ============================================

export const badge100Miles: PixelSprite = {
  name: 'badge_100_miles',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,0,0],
    [0,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,0],
    [0,C.warning,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.grayDark,C.grayDark,C.warning,0],
    [C.warning,C.grayDark,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.grayDark,C.grayDark,C.grayDark,C.warning],
    [C.warning,C.grayDark,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.grayDark,C.grayDark,C.grayDark,C.warning],
    [C.warning,C.grayDark,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.grayDark,C.grayDark,C.grayDark,C.warning],
    [C.warning,C.grayDark,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.grayDark,C.grayDark,C.grayDark,C.warning],
    [C.warning,C.grayDark,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning],
    [0,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,0],
    [0,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,0],
    [0,0,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,0,0],
    [0,0,0,C.warning,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const badge500Miles: PixelSprite = {
  name: 'badge_500_miles',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0,0],
    [0,0,0,C.info,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,C.info,0,0,0],
    [0,0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0,0],
    [0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0],
    [0,C.info,C.waterBlue,C.waterBlue,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.waterBlue,C.waterBlue,C.info,0],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.grayDark,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0],
    [0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0],
    [0,0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0,0],
    [0,0,0,C.info,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,C.info,0,0,0],
    [0,0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const badge1000Miles: PixelSprite = {
  name: 'badge_1000_miles',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0,0],
    [0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0],
    [0,C.warning,C.danger,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.danger,C.warning,0],
    [C.warning,C.danger,C.danger,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.danger,C.warning],
    [C.warning,C.danger,C.danger,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.danger,C.danger,C.warning],
    [0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0],
    [0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0],
    [0,0,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,0,0],
    [0,0,0,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// ACHIEVEMENT BADGES
// ============================================

export const badgeFirstShelter: PixelSprite = {
  name: 'badge_first_shelter',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0,0],
    [0,0,0,C.success,C.success,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.success,C.success,0,0,0],
    [0,0,C.success,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.success,0,0],
    [0,C.success,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.bark,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.success,0],
    [0,C.success,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.bark,C.bark,C.bark,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.success,0],
    [C.success,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.bark,C.bark,C.bark,C.bark,C.bark,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.success],
    [C.success,C.leafGreen,C.leafGreen,C.leafGreen,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.success],
    [C.success,C.leafGreen,C.leafGreen,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.leafGreen,C.leafGreen,C.leafGreen,C.success],
    [C.success,C.leafGreen,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.leafGreen,C.leafGreen,C.success],
    [C.success,C.leafGreen,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.leafGreen,C.leafGreen,C.success],
    [0,C.success,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.leafGreen,C.success,0],
    [0,C.success,C.bark,C.barkDark,C.barkDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.barkDark,C.barkDark,C.barkDark,C.bark,C.leafGreen,C.success,0],
    [0,0,C.success,C.bark,C.barkDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.barkDark,C.barkDark,C.bark,C.leafGreen,C.success,0,0],
    [0,0,0,C.success,C.success,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.success,C.success,0,0,0],
    [0,0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const badgeSummitClub: PixelSprite = {
  name: 'badge_summit_club',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0,0],
    [0,0,0,C.skyBlue,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,0,0,0],
    [0,0,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,0,0],
    [0,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.grayMedium,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,0],
    [0,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.grayMedium,C.grayLight,C.grayMedium,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,0],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.skyLight,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.skyLight,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.skyLight,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.skyLight,C.skyLight,C.skyBlue],
    [C.skyBlue,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.skyLight,C.skyBlue],
    [0,C.skyBlue,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.skyLight,C.skyBlue,0],
    [0,C.skyBlue,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.skyBlue,0],
    [0,0,C.skyBlue,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.skyBlue,0,0],
    [0,0,0,C.skyBlue,C.skyBlue,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.skyBlue,C.skyBlue,0,0,0],
    [0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const badge2189: PixelSprite = {
  name: 'badge_2189',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,0,0],
    [0,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,0],
    [0,C.warning,C.success,C.success,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.white,C.white,C.success,C.success,C.warning,0],
    [C.warning,C.success,C.success,C.success,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.white,C.white,C.grayDark,C.white,C.success,C.success,C.warning],
    [C.warning,C.success,C.success,C.success,C.grayDark,C.grayDark,C.white,C.grayDark,C.white,C.grayDark,C.grayDark,C.grayDark,C.white,C.success,C.success,C.warning],
    [C.warning,C.success,C.success,C.success,C.white,C.white,C.white,C.grayDark,C.white,C.grayDark,C.white,C.white,C.white,C.success,C.success,C.warning],
    [C.warning,C.success,C.success,C.success,C.grayDark,C.grayDark,C.white,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.white,C.success,C.success,C.warning],
    [C.warning,C.success,C.success,C.success,C.white,C.white,C.grayDark,C.white,C.white,C.grayDark,C.grayDark,C.grayDark,C.white,C.success,C.success,C.warning],
    [0,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,0],
    [0,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,0],
    [0,0,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,0,0],
    [0,0,0,C.warning,C.warning,C.success,C.success,C.success,C.success,C.success,C.success,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// SPECIAL BADGES
// ============================================

export const badgeRainHiker: PixelSprite = {
  name: 'badge_rain_hiker',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0,0],
    [0,0,0,C.info,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,C.info,0,0,0],
    [0,0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.grayLight,C.grayLight,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0,0],
    [0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0],
    [0,C.info,C.waterBlue,C.waterBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.waterBlue,C.waterBlue,C.info,0],
    [C.info,C.waterBlue,C.waterBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.info],
    [C.info,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.info],
    [0,C.info,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.info,0],
    [0,C.info,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0],
    [0,0,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,0,0],
    [0,0,0,C.info,C.info,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.info,C.info,0,0,0],
    [0,0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const badgeNightOwl: PixelSprite = {
  name: 'badge_night_owl',
  width: 16,
  height: 16,
  pixels: [
    [0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0],
    [0,0,0,C.grayDark,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,C.grayDark,0,0,0],
    [0,0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0,0],
    [0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0],
    [0,C.grayDark,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.grayDark,0],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.bark,C.bark,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0],
    [0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.nearBlack,C.nearBlack,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0],
    [0,0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0,0],
    [0,0,0,C.grayDark,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,C.grayDark,0,0,0],
    [0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Export all badge sprites
export const BADGE_SPRITES = {
  badgeGeorgia,
  badgeMaine,
  badge100Miles,
  badge500Miles,
  badge1000Miles,
  badgeFirstShelter,
  badgeSummitClub,
  badge2189,
  badgeRainHiker,
  badgeNightOwl,
};
