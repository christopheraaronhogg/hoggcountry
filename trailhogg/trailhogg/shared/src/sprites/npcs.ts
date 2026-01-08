// ============================================
// TRAIL LEGS - NPC Character Sprites
// ============================================
// Other hikers, trail angels, ridgerunners, and trail personalities

import { PixelSprite, AnimatedSprite } from './types';
import { C } from './palette';

// ============================================
// OTHER THRU-HIKERS (Various Appearances)
// ============================================

// Male hiker with beard (classic thru-hiker look)
export const hikerBearded: PixelSprite = {
  name: 'hiker_bearded',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.nearBlack,C.skinTan,C.skinTan,C.skinTan,C.nearBlack,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,C.skinTan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.skinTan,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,C.skinTan,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.skinTan,0,0],
    [0,0,0,C.skinTan,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.skinTan,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0,0],
    [0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0],
    [0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0],
    [0,0,0,0,C.grayDark,C.grayDark,C.grayDark,0,0,C.grayDark,C.grayDark,C.grayDark,0,0,0,0],
    [0,0,0,0,C.grayDark,C.grayDark,C.grayDark,0,0,C.grayDark,C.grayDark,C.grayDark,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
  ],
};

// Female hiker with ponytail
export const hikerPonytail: PixelSprite = {
  name: 'hiker_ponytail',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.bark,C.bark,C.bark,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.bark,C.bark,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.bark,C.bark,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.skinLight,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,C.bark,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,C.bark,0,0],
    [0,0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0,0],
    [0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0],
    [0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0],
    [0,0,C.skinLight,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skinLight,0,0],
    [0,0,0,C.skinLight,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.skinLight,0,0,0],
    [0,0,0,0,C.info,C.info,C.info,C.info,C.info,C.info,C.info,C.info,0,0,0,0],
    [0,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
  ],
};

// Ultralight hiker (tiny pack, trail runners)
export const hikerUltralight: PixelSprite = {
  name: 'hiker_ultralight',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0],
    [0,0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0,0],
    [0,0,0,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0],
    [0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0],
    [0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0],
    [0,0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0,0],
    [0,0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0,0],
    [0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0],
    [0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0],
    [0,0,C.skinMedium,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.skinMedium,0,0],
    [0,0,0,C.skinMedium,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.skinMedium,0,0,0],
    [0,0,0,0,C.success,C.success,C.success,C.success,C.success,C.success,C.success,C.success,0,0,0,0],
    [0,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,0,0,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0,0],
    [0,0,0,0,C.info,C.info,C.info,0,0,C.info,C.info,C.info,0,0,0,0],
    [0,0,0,0,C.info,C.info,C.info,0,0,C.info,C.info,C.info,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
  ],
};

// ============================================
// TRAIL ANGEL
// ============================================

export const trailAngel: PixelSprite = {
  name: 'trail_angel',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.white,C.white,C.white,C.white,0,0,0,0,0,0],
    [0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,C.grayLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.grayLight,0,0,0],
    [0,0,0,C.grayLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.grayLight,0,0,0],
    [0,0,0,C.grayLight,C.skinLight,C.skinLight,C.skinLight,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.grayLight,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,C.skinLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skinLight,0,0],
    [0,0,0,C.skinLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skinLight,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,0,0,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,0,0,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
  ],
};

// ============================================
// RIDGERUNNER (ATC Official)
// ============================================

export const ridgerunner: PixelSprite = {
  name: 'ridgerunner',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,0],
    [0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0],
    [0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0],
    [0,0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0,0],
    [0,0,0,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0],
    [0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0],
    [0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0],
    [0,0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0,0],
    [0,0,0,0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0,0],
    [0,0,0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0],
    [0,0,0,0,C.forestDark,C.forestDark,C.warning,C.warning,C.warning,C.warning,C.forestDark,C.forestDark,0,0,0,0],
    [0,0,C.skinMedium,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.skinMedium,0,0],
    [0,0,0,C.skinMedium,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.skinMedium,0,0,0],
    [0,0,0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.skinMedium,C.skinMedium,C.skinMedium,0,0,C.skinMedium,C.skinMedium,C.skinMedium,0,0,0,0],
    [0,0,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,0,0],
    [0,0,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
  ],
};

// ============================================
// HOSTEL OWNER
// ============================================

export const hostelOwner: PixelSprite = {
  name: 'hostel_owner',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.grayLight,C.grayLight,C.grayLight,C.grayLight,0,0,0,0,0,0],
    [0,0,0,0,0,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,0,0,0,0,0],
    [0,0,0,0,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.skinLight,0,0,0],
    [0,0,0,C.grayLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.grayLight,0,0,0],
    [0,0,0,C.grayLight,C.skinLight,C.skinLight,C.skinLight,C.danger,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.grayLight,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,C.skinLight,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.skinLight,0,0],
    [0,0,0,C.skinLight,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.skinLight,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,0,0],
    [0,0,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,0,0,0,0],
    [0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0],
    [0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0],
  ],
};

// ============================================
// SECTION HIKER
// ============================================

export const sectionHiker: PixelSprite = {
  name: 'section_hiker',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.nearBlack,C.skinTan,C.skinTan,C.skinTan,C.nearBlack,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,0,0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0,0,0,0,0],
    [0,0,0,0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0,0,0,0],
    [0,0,0,0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0,0,0,0],
    [0,0,C.skinTan,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.skinTan,0,0],
    [0,0,0,C.skinTan,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.skinTan,0,0,0],
    [0,0,0,0,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,0,0,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,0,0,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
  ],
};

// ============================================
// DAY HIKER
// ============================================

export const dayHiker: PixelSprite = {
  name: 'day_hiker',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.skinLight,C.nearBlack,C.skinLight,C.skinLight,C.skinLight,0,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0],
    [0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,C.skinLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skinLight,0,0],
    [0,0,0,C.skinLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skinLight,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,C.skinLight,C.skinLight,C.skinLight,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,0,0,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,0,0,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
    [0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0],
  ],
};

// ============================================
// SHUTTLE DRIVER
// ============================================

export const shuttleDriver: PixelSprite = {
  name: 'shuttle_driver',
  width: 16,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,0,0],
    [0,0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.nearBlack,C.skinTan,C.skinTan,C.skinTan,C.nearBlack,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0],
    [0,0,C.skinTan,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.skinTan,0,0],
    [0,0,0,C.skinTan,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.skinTan,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0],
    [0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0,0],
    [0,0,0,0,C.skinTan,C.skinTan,C.skinTan,0,0,C.skinTan,C.skinTan,C.skinTan,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,C.nearBlack,C.nearBlack,C.nearBlack,0,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
    [0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0],
  ],
};

// Export all NPC sprites
export const NPC_SPRITES = {
  hikerBearded,
  hikerPonytail,
  hikerUltralight,
  trailAngel,
  ridgerunner,
  hostelOwner,
  sectionHiker,
  dayHiker,
  shuttleDriver,
};
