// ============================================
// TRAIL LEGS - Town & Resupply Building Sprites
// ============================================
// Buildings and structures found in trail towns

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// OUTFITTER / GEAR SHOP
// ============================================

export const outfitterShop: PixelSprite = {
  name: 'outfitter_shop',
  width: 32,
  height: 32,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0,0,0],
    [0,0,0,0,0,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0],
    [0,0,0,0,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,0,0,0,0,0],
    [0,0,0,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,0,0,0,0],
    [0,0,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,0,0,0],
    [0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// POST OFFICE (Mail drops!)
// ============================================

export const postOffice: PixelSprite = {
  name: 'post_office',
  width: 32,
  height: 28,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0,0,0],
    [0,0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.waterBlue,C.skyLight,C.skyLight,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.skyLight,C.skyLight,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.waterBlue,C.skyLight,C.skyLight,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.skyLight,C.skyLight,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// HOSTEL
// ============================================

export const hostel: PixelSprite = {
  name: 'hostel',
  width: 32,
  height: 32,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0],
    [0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0],
    [0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,0,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// GROCERY STORE
// ============================================

export const groceryStore: PixelSprite = {
  name: 'grocery_store',
  width: 32,
  height: 28,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0],
    [0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0],
    [0,0,0,0,C.success,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.success,0,0,0,0],
    [0,0,0,0,C.success,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.success,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.skyBlue,C.skyLight,C.danger,C.warning,C.success,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.danger,C.warning,C.success,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.skyBlue,C.skyLight,C.danger,C.warning,C.success,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.danger,C.warning,C.success,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// LAUNDROMAT
// ============================================

export const laundromat: PixelSprite = {
  name: 'laundromat',
  width: 28,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0],
    [0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// DINER / RESTAURANT
// ============================================

export const diner: PixelSprite = {
  name: 'diner',
  width: 32,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// SHUTTLE VAN
// ============================================

export const shuttleVan: PixelSprite = {
  name: 'shuttle_van',
  width: 32,
  height: 16,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0,0],
    [0,0,0,0,0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0,0,0],
    [0,0,0,0,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0,0],
    [0,0,0,C.white,C.white,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,0,0,0],
    [0,0,C.white,C.grayLight,C.white,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0],
    [0,0,C.white,C.grayLight,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0],
    [0,0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0],
    [0,0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0],
    [0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0],
    [0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0],
    [0,0,0,0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0,0,0,0],
    [0,0,0,0,C.grayDark,C.nearBlack,C.grayMedium,C.nearBlack,C.nearBlack,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0,C.grayDark,C.nearBlack,C.grayMedium,C.nearBlack,C.nearBlack,C.grayDark,0,0,0,0],
    [0,0,0,0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,0,0,0,0],
    [0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Export all town sprites
export const TOWN_SPRITES = {
  outfitterShop,
  postOffice,
  hostel,
  groceryStore,
  laundromat,
  diner,
  shuttleVan,
};
