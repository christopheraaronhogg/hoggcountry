// ============================================
// TRAIL LEGS - Historical Ruins Sprites
// ============================================
// Old homesteads, foundations, and historical remnants along the AT

import { PixelSprite } from './types';
import { C } from './palette';

const _ = C.transparent;

// Old stone chimney (common on AT)
const stoneChimney: PixelSprite = {
  name: 'stone_chimney',
  width: 12,
  height: 24,
  pixels: [
    [_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_],
    [_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_,_],
    [_,_,_,C.grayDark,C.grayMedium,C.nearBlack,C.nearBlack,C.grayMedium,C.grayDark,_,_,_],
    [_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_,_],
    [_,_,C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,_,_],
    [_,_,C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.trailDirt,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.trailDirt],
  ],
};

// Foundation remnants
const foundationRemnant: PixelSprite = {
  name: 'foundation_remnant',
  width: 32,
  height: 10,
  pixels: [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,C.grayDark,C.grayDark,C.grayDark,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.grayDark,C.grayDark,_,_,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_,_],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_,_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.trailDirt,C.trailDirt,C.grayDark,C.grayDark,C.grayDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.grayDark,C.grayDark,C.grayDark,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
  ],
};

// Stone well
const stoneWell: PixelSprite = {
  name: 'stone_well',
  width: 14,
  height: 12,
  pixels: [
    [_,_,_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,_,_,_,_,C.barkDark,C.bark,_,_,_],
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.waterDeep,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterDeep,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
    [_,_,_,C.trailDirt,C.trailDirt,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.trailDirt,C.trailDirt,_,_,_],
  ],
};

// Old stone wall remnant
const stoneWall: PixelSprite = {
  name: 'stone_wall',
  width: 24,
  height: 8,
  pixels: [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,C.grayDark,C.grayDark,_,_,_,_,_,_,_,_,_],
    [_,_,C.grayDark,C.grayDark,C.grayDark,_,_,_,C.grayDark,C.grayDark,C.grayDark,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,C.grayDark,C.grayDark,_,_],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.grayDark,C.grayDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.grayDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.grayDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.grayDark,C.trailDirt,C.trailDirt],
  ],
};

// Cemetery headstone
const headstone: PixelSprite = {
  name: 'headstone',
  width: 8,
  height: 10,
  pixels: [
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayLight,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.forestDark,C.forestGreen,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.forestGreen,C.forestDark],
  ],
};

// Old wooden fence (rotting)
const oldFence: PixelSprite = {
  name: 'old_fence',
  width: 20,
  height: 8,
  pixels: [
    [_,C.barkDark,_,_,_,_,_,C.barkDark,_,_,_,_,_,_,C.barkDark,_,_,_,_,_],
    [_,C.barkDark,_,_,_,_,_,C.barkDark,_,_,_,_,_,_,C.barkDark,_,_,_,_,_],
    [_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_,_,_],
    [_,C.bark,_,_,_,_,_,C.bark,_,_,_,_,_,_,C.bark,_,_,_,_,_],
    [_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.barkDark,C.barkDark,C.barkDark,_,_,_,C.bark,_,_,_,_,_],
    [_,C.bark,_,_,_,_,_,C.bark,_,_,_,_,_,_,C.barkDark,_,_,_,_,_],
    [_,C.barkDark,_,_,_,_,_,C.barkDark,_,_,_,_,_,_,_,_,_,_,_,_],
    [C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
  ],
};

// Iron furnace remnant (common in PA)
const ironFurnace: PixelSprite = {
  name: 'iron_furnace',
  width: 20,
  height: 20,
  pixels: [
    [_,_,_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_,_,_],
    [_,_,_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_,_],
    [_,_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_],
    [_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [_,_,_,_,C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark,_,_,_,_],
    [_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_],
    [_,_,_,_,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,_,_,_,_],
  ],
};

export const RUINS_SPRITES = {
  stoneChimney,
  foundationRemnant,
  stoneWell,
  stoneWall,
  headstone,
  oldFence,
  ironFurnace,
};
