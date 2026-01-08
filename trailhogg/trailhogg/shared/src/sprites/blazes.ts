// ============================================
// TRAIL LEGS - Blaze Sprite Definitions
// ============================================
// Trail markers that guide hikers on the AT

import { PixelSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const W = C.white;        // White
const w = C.grayLight;    // Light gray (shadow/depth)
const B = C.waterBlue;    // Blue (side trail)
const b = C.waterDeep;    // Deep blue (shadow)
const G = C.grayMedium;   // Gray (rocks)
const g = C.grayDark;     // Dark gray

/**
 * Single White Blaze - Standard AT trail marker
 * 8x16 pixels - Vertical rectangle painted on tree
 */
const singleWhitePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7
  [_,_,W,W,W,W,_,_], // 0
  [_,W,W,W,W,W,W,_], // 1
  [_,W,W,W,W,W,W,_], // 2
  [_,W,W,w,w,W,W,_], // 3
  [_,W,W,w,w,W,W,_], // 4
  [_,W,W,W,W,W,W,_], // 5
  [_,W,W,W,W,W,W,_], // 6
  [_,W,W,w,w,W,W,_], // 7
  [_,W,W,w,w,W,W,_], // 8
  [_,W,W,W,W,W,W,_], // 9
  [_,W,W,W,W,W,W,_], // 10
  [_,W,W,w,w,W,W,_], // 11
  [_,W,W,w,w,W,W,_], // 12
  [_,W,W,W,W,W,W,_], // 13
  [_,W,W,W,W,W,W,_], // 14
  [_,_,W,W,W,W,_,_], // 15
];

export const BLAZE_SINGLE_WHITE: PixelSprite = {
  name: 'blaze_single',
  width: 8,
  height: 16,
  pixels: singleWhitePixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Double White Blaze - Indicates a turn or junction
 * 8x24 pixels - Two stacked blazes with gap
 * Top blaze offset indicates direction (centered = straight, left = turn left)
 */
const doubleWhitePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7
  [_,_,W,W,W,W,_,_], // 0  - top blaze
  [_,W,W,W,W,W,W,_], // 1
  [_,W,W,W,W,W,W,_], // 2
  [_,W,W,w,w,W,W,_], // 3
  [_,W,W,w,w,W,W,_], // 4
  [_,W,W,W,W,W,W,_], // 5
  [_,W,W,W,W,W,W,_], // 6
  [_,_,W,W,W,W,_,_], // 7
  [_,_,_,_,_,_,_,_], // 8  - gap
  [_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_], // 11
  [_,_,W,W,W,W,_,_], // 12 - bottom blaze
  [_,W,W,W,W,W,W,_], // 13
  [_,W,W,W,W,W,W,_], // 14
  [_,W,W,w,w,W,W,_], // 15
  [_,W,W,w,w,W,W,_], // 16
  [_,W,W,W,W,W,W,_], // 17
  [_,W,W,W,W,W,W,_], // 18
  [_,_,W,W,W,W,_,_], // 19
  [_,_,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,_,_], // 23
];

export const BLAZE_DOUBLE_WHITE: PixelSprite = {
  name: 'blaze_double',
  width: 8,
  height: 24,
  pixels: doubleWhitePixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Double White Blaze (Turn Left) - Top blaze offset left
 * 12x24 pixels
 */
const doubleWhiteLeftPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,W,W,W,W,_,_,_,_,_,_], // 0  - top blaze (offset left)
  [_,W,W,W,W,W,W,_,_,_,_,_], // 1
  [_,W,W,W,W,W,W,_,_,_,_,_], // 2
  [_,W,W,w,w,W,W,_,_,_,_,_], // 3
  [_,W,W,w,w,W,W,_,_,_,_,_], // 4
  [_,W,W,W,W,W,W,_,_,_,_,_], // 5
  [_,W,W,W,W,W,W,_,_,_,_,_], // 6
  [_,_,W,W,W,W,_,_,_,_,_,_], // 7
  [_,_,_,_,_,_,_,_,_,_,_,_], // 8  - gap
  [_,_,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,_,_,_,_], // 11
  [_,_,_,_,W,W,W,W,_,_,_,_], // 12 - bottom blaze (centered)
  [_,_,_,W,W,W,W,W,W,_,_,_], // 13
  [_,_,_,W,W,W,W,W,W,_,_,_], // 14
  [_,_,_,W,W,w,w,W,W,_,_,_], // 15
  [_,_,_,W,W,w,w,W,W,_,_,_], // 16
  [_,_,_,W,W,W,W,W,W,_,_,_], // 17
  [_,_,_,W,W,W,W,W,W,_,_,_], // 18
  [_,_,_,_,W,W,W,W,_,_,_,_], // 19
  [_,_,_,_,_,_,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,_,_,_,_,_,_], // 23
];

export const BLAZE_DOUBLE_LEFT: PixelSprite = {
  name: 'blaze_double_left',
  width: 12,
  height: 24,
  pixels: doubleWhiteLeftPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Double White Blaze (Turn Right) - Top blaze offset right
 * 12x24 pixels
 */
const doubleWhiteRightPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,W,W,W,W,_,_], // 0  - top blaze (offset right)
  [_,_,_,_,_,W,W,W,W,W,W,_], // 1
  [_,_,_,_,_,W,W,W,W,W,W,_], // 2
  [_,_,_,_,_,W,W,w,w,W,W,_], // 3
  [_,_,_,_,_,W,W,w,w,W,W,_], // 4
  [_,_,_,_,_,W,W,W,W,W,W,_], // 5
  [_,_,_,_,_,W,W,W,W,W,W,_], // 6
  [_,_,_,_,_,_,W,W,W,W,_,_], // 7
  [_,_,_,_,_,_,_,_,_,_,_,_], // 8  - gap
  [_,_,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,_,_,_,_], // 11
  [_,_,_,_,W,W,W,W,_,_,_,_], // 12 - bottom blaze (centered)
  [_,_,_,W,W,W,W,W,W,_,_,_], // 13
  [_,_,_,W,W,W,W,W,W,_,_,_], // 14
  [_,_,_,W,W,w,w,W,W,_,_,_], // 15
  [_,_,_,W,W,w,w,W,W,_,_,_], // 16
  [_,_,_,W,W,W,W,W,W,_,_,_], // 17
  [_,_,_,W,W,W,W,W,W,_,_,_], // 18
  [_,_,_,_,W,W,W,W,_,_,_,_], // 19
  [_,_,_,_,_,_,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,_,_,_,_,_,_], // 23
];

export const BLAZE_DOUBLE_RIGHT: PixelSprite = {
  name: 'blaze_double_right',
  width: 12,
  height: 24,
  pixels: doubleWhiteRightPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Blue Blaze - Side trail to water, shelter, or viewpoint
 * 8x16 pixels
 */
const blueBlazePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7
  [_,_,B,B,B,B,_,_], // 0
  [_,B,B,B,B,B,B,_], // 1
  [_,B,B,B,B,B,B,_], // 2
  [_,B,B,b,b,B,B,_], // 3
  [_,B,B,b,b,B,B,_], // 4
  [_,B,B,B,B,B,B,_], // 5
  [_,B,B,B,B,B,B,_], // 6
  [_,B,B,b,b,B,B,_], // 7
  [_,B,B,b,b,B,B,_], // 8
  [_,B,B,B,B,B,B,_], // 9
  [_,B,B,B,B,B,B,_], // 10
  [_,B,B,b,b,B,B,_], // 11
  [_,B,B,b,b,B,B,_], // 12
  [_,B,B,B,B,B,B,_], // 13
  [_,B,B,B,B,B,B,_], // 14
  [_,_,B,B,B,B,_,_], // 15
];

export const BLAZE_BLUE: PixelSprite = {
  name: 'blaze_blue',
  width: 8,
  height: 16,
  pixels: blueBlazePixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Cairn - Rock pile used as trail marker above treeline
 * 16x16 pixels
 */
const cairnPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_], // 0
  [_,_,_,_,_,G,G,g,g,G,G,_,_,_,_,_], // 1
  [_,_,_,_,_,G,g,g,g,g,G,_,_,_,_,_], // 2
  [_,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_], // 3
  [_,_,_,_,G,G,G,G,G,G,G,G,_,_,_,_], // 4
  [_,_,_,G,G,g,G,G,G,G,g,G,G,_,_,_], // 5
  [_,_,_,G,g,g,g,G,G,g,g,g,G,_,_,_], // 6
  [_,_,_,G,g,g,g,g,g,g,g,g,G,_,_,_], // 7
  [_,_,_,_,G,G,G,G,G,G,G,G,_,_,_,_], // 8
  [_,_,G,G,G,G,G,G,G,G,G,G,G,G,_,_], // 9
  [_,G,G,g,G,G,G,G,G,G,G,G,g,G,G,_], // 10
  [_,G,g,g,g,G,G,G,G,G,G,g,g,g,G,_], // 11
  [G,G,g,g,g,g,G,G,G,G,g,g,g,g,G,G], // 12
  [G,g,g,g,g,g,g,G,G,g,g,g,g,g,g,G], // 13
  [G,G,g,g,g,g,g,g,g,g,g,g,g,g,G,G], // 14
  [_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_], // 15
];

export const CAIRN: PixelSprite = {
  name: 'cairn',
  width: 16,
  height: 16,
  pixels: cairnPixels,
  originX: 0.5,
  originY: 1.0,
};

// Export all blaze sprites
export const BLAZE_SPRITES = {
  singleWhite: BLAZE_SINGLE_WHITE,
  doubleWhite: BLAZE_DOUBLE_WHITE,
  doubleWhiteLeft: BLAZE_DOUBLE_LEFT,
  doubleWhiteRight: BLAZE_DOUBLE_RIGHT,
  blue: BLAZE_BLUE,
  cairn: CAIRN,
};
