// ============================================
// TRAIL LEGS - Celebration Sprites
// ============================================
// Finish line celebrations, confetti, and achievement markers

import { PixelSprite } from './types';
import { C } from './palette';

const _ = C.transparent;

// Katahdin summit sign
const katahdinSign: PixelSprite = {
  name: 'katahdin_sign',
  width: 24,
  height: 20,
  pixels: [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.barkDark,C.barkDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium],
  ],
};

// Confetti particles (celebration)
const confetti: PixelSprite = {
  name: 'confetti',
  width: 16,
  height: 16,
  pixels: [
    [_,_,C.danger,_,_,_,_,C.warning,_,_,_,_,C.success,_,_,_],
    [_,_,_,_,C.info,_,_,_,_,_,C.danger,_,_,_,_,C.warning],
    [C.warning,_,_,_,_,_,C.success,_,_,_,_,_,_,C.info,_,_],
    [_,_,_,C.danger,_,_,_,_,_,C.warning,_,_,_,_,_,_],
    [_,C.success,_,_,_,_,_,C.info,_,_,_,_,C.danger,_,_,C.success],
    [_,_,_,_,C.warning,_,_,_,_,_,C.success,_,_,_,_,_],
    [C.info,_,_,_,_,_,C.danger,_,_,_,_,_,_,C.warning,_,_],
    [_,_,C.success,_,_,_,_,_,C.warning,_,_,_,_,_,C.info,_],
    [_,_,_,_,_,C.info,_,_,_,_,C.danger,_,_,_,_,_],
    [C.warning,_,_,_,_,_,_,C.success,_,_,_,_,C.info,_,_,C.danger],
    [_,_,_,C.danger,_,_,_,_,_,_,C.warning,_,_,_,_,_],
    [_,C.info,_,_,_,C.warning,_,_,_,_,_,_,_,C.success,_,_],
    [_,_,_,_,_,_,_,C.danger,_,_,_,C.info,_,_,_,C.warning],
    [C.success,_,_,_,C.info,_,_,_,_,C.success,_,_,_,_,_,_],
    [_,_,C.warning,_,_,_,_,_,_,_,_,C.danger,_,_,C.info,_],
    [_,_,_,_,_,C.success,_,C.warning,_,_,_,_,_,_,_,C.success],
  ],
};

// Trophy (for achievements)
const trophy: PixelSprite = {
  name: 'trophy',
  width: 12,
  height: 16,
  pixels: [
    [_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_],
    [C.warning,C.warning,C.warning,C.highlight,C.highlight,C.warning,C.warning,C.highlight,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.highlight,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_],
    [_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_,_],
    [_,_,_,_,_,C.warning,C.warning,_,_,_,_,_],
    [_,_,_,_,_,C.warning,C.warning,_,_,_,_,_],
    [_,_,_,_,C.barkDark,C.warning,C.warning,C.barkDark,_,_,_,_],
    [_,_,_,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.barkDark,_,_,_],
    [_,_,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,_,_],
  ],
};

// Champagne bottle (celebration)
const champagne: PixelSprite = {
  name: 'champagne',
  width: 8,
  height: 16,
  pixels: [
    [_,_,_,C.warning,C.warning,_,_,_],
    [_,_,_,C.warning,C.warning,_,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_],
    [_,_,C.forestDark,C.forestDark,C.forestDark,C.forestDark,_,_],
    [_,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.leafGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.leafGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,C.forestDark,C.forestGreen,C.leafGreen,C.forestGreen,C.forestGreen,C.forestDark,_],
    [_,_,C.forestDark,C.forestDark,C.forestDark,C.forestDark,_,_],
    [_,_,_,C.forestDark,C.forestDark,_,_,_],
  ],
};

// Medal (achievement reward)
const medal: PixelSprite = {
  name: 'medal',
  width: 10,
  height: 14,
  pixels: [
    [_,_,_,_,C.danger,C.danger,_,_,_,_],
    [_,_,_,C.danger,C.danger,C.danger,C.danger,_,_,_],
    [_,_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_,_],
    [_,C.danger,C.danger,_,_,_,_,C.danger,C.danger,_],
    [_,_,C.danger,_,_,_,_,C.danger,_,_],
    [_,_,_,C.danger,_,_,C.danger,_,_,_],
    [_,_,_,_,C.warning,C.warning,_,_,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,C.warning,C.warning,C.highlight,C.highlight,C.warning,C.warning,_,_],
    [_,C.warning,C.warning,C.highlight,C.highlight,C.highlight,C.highlight,C.warning,C.warning,_],
    [_,C.warning,C.warning,C.highlight,C.warning,C.warning,C.highlight,C.warning,C.warning,_],
    [_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_],
  ],
};

// Fireworks burst
const fireworks: PixelSprite = {
  name: 'fireworks',
  width: 16,
  height: 16,
  pixels: [
    [_,_,_,_,_,_,_,C.warning,C.warning,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.danger,C.warning,C.warning,C.danger,_,_,_,_,_,_],
    [_,_,_,_,_,C.danger,_,C.highlight,C.highlight,_,C.danger,_,_,_,_,_],
    [_,_,_,_,C.danger,_,_,C.highlight,C.highlight,_,_,C.danger,_,_,_,_],
    [_,_,_,C.danger,_,_,C.warning,C.highlight,C.highlight,C.warning,_,_,C.danger,_,_,_],
    [_,_,C.danger,_,_,C.warning,C.warning,C.highlight,C.highlight,C.warning,C.warning,_,_,C.danger,_,_],
    [_,C.danger,_,_,C.warning,C.warning,C.highlight,C.highlight,C.highlight,C.highlight,C.warning,C.warning,_,_,C.danger,_],
    [C.danger,C.warning,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.white,C.white,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.warning,C.danger],
    [C.danger,C.warning,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.white,C.white,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.warning,C.danger],
    [_,C.danger,_,_,C.warning,C.warning,C.highlight,C.highlight,C.highlight,C.highlight,C.warning,C.warning,_,_,C.danger,_],
    [_,_,C.danger,_,_,C.warning,C.warning,C.highlight,C.highlight,C.warning,C.warning,_,_,C.danger,_,_],
    [_,_,_,C.danger,_,_,C.warning,C.highlight,C.highlight,C.warning,_,_,C.danger,_,_,_],
    [_,_,_,_,C.danger,_,_,C.highlight,C.highlight,_,_,C.danger,_,_,_,_],
    [_,_,_,_,_,C.danger,_,C.highlight,C.highlight,_,C.danger,_,_,_,_,_],
    [_,_,_,_,_,_,C.danger,C.warning,C.warning,C.danger,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.warning,C.warning,_,_,_,_,_,_,_],
  ],
};

// Finish banner
const finishBanner: PixelSprite = {
  name: 'finish_banner',
  width: 32,
  height: 10,
  pixels: [
    [C.bark,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.bark],
    [C.bark,_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_,C.bark],
    [C.bark,C.danger,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.danger,C.bark],
    [C.bark,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.bark],
    [C.bark,C.danger,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.danger,C.bark],
    [C.bark,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.bark],
    [C.bark,C.danger,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.white,C.white,C.danger,C.danger,C.bark],
    [C.bark,_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_,C.bark],
    [C.bark,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.bark],
    [C.barkDark,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.barkDark],
  ],
};

// 2189 mile marker (AT completion distance)
const mileMarker2189: PixelSprite = {
  name: 'mile_marker_2189',
  width: 14,
  height: 18,
  pixels: [
    [_,_,_,_,_,C.bark,C.bark,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.white,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.white,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_],
    [_,_,_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_,_,_],
    [_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_],
    [_,_,_,_,_,C.barkDark,C.barkDark,C.barkDark,C.barkDark,_,_,_,_,_],
  ],
};

export const CELEBRATION_SPRITES = {
  katahdinSign,
  confetti,
  trophy,
  champagne,
  medal,
  fireworks,
  finishBanner,
  mileMarker2189,
};
