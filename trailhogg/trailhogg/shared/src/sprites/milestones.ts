// ============================================
// TRAIL LEGS - Milestone & State Line Sprites
// ============================================
// State border crossings and notable trail markers

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// STATE LINE SIGN (Generic Template)
// ============================================

export const stateLineSign: PixelSprite = {
  name: 'state_line_sign',
  width: 24,
  height: 20,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,0],
    [0,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,0],
    [0,C.bark,C.white,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.bark,C.bark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.white,C.bark,0],
    [0,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,0],
    [0,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// KATAHDIN SUMMIT SIGN
// ============================================

export const katahdinSign: PixelSprite = {
  name: 'katahdin_sign',
  width: 20,
  height: 24,
  pixels: [
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,0],
    [0,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// SPRINGER MOUNTAIN PLAQUE
// ============================================

export const springerPlaque: PixelSprite = {
  name: 'springer_plaque',
  width: 16,
  height: 12,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// HALFWAY MARKER
// ============================================

export const halfwayMarker: PixelSprite = {
  name: 'halfway_marker',
  width: 16,
  height: 20,
  pixels: [
    [0,0,0,0,0,0,0,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
    [0,0,0,0,C.warning,C.warning,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.warning,C.warning,0,0,0],
    [0,0,C.warning,C.warning,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.warning,C.warning,0,0],
    [0,C.warning,C.warning,C.white,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.white,C.warning,C.warning,0],
    [0,C.warning,C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.warning,C.warning,0],
    [0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0,0,0,0,0,0],
  ],
};

// ============================================
// MILEAGE BOULDER
// ============================================

export const milageBoulder: PixelSprite = {
  name: 'mileage_boulder',
  width: 16,
  height: 12,
  pixels: [
    [0,0,0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,0,0],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.grayLight,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayMedium],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,0,0,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ============================================
// SURVEY MARKER
// ============================================

export const surveyMarker: PixelSprite = {
  name: 'survey_marker',
  width: 8,
  height: 6,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.grayMedium,0],
    [C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.grayMedium],
    [C.grayMedium,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.grayMedium],
    [0,C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.grayMedium,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
  ],
};

// ============================================
// SUMMIT REGISTER
// ============================================

export const summitRegister: PixelSprite = {
  name: 'summit_register',
  width: 12,
  height: 10,
  pixels: [
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.grayLight,C.grayMedium],
    [C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayMedium],
    [0,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,0],
    [0,0,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Export all milestone sprites
export const MILESTONE_SPRITES = {
  stateLineSign,
  katahdinSign,
  springerPlaque,
  halfwayMarker,
  milageBoulder,
  surveyMarker,
  summitRegister,
};
