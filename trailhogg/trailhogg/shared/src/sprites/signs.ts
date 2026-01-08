// ============================================
// TRAIL LEGS - Trail Signs and Markers
// ============================================
// Mile markers, direction signs, warnings, and information

import { PixelSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const B = C.bark;           // Wood brown
const b = C.barkDark;       // Wood dark
const W = C.white;          // White
const w = C.grayLight;      // Light gray
const K = C.nearBlack;      // Black (text)
const G = C.shirtGreen;     // Green
const g = C.shirtGreenShadow;
const R = C.danger;         // Red (warning)
const Y = C.warning;        // Yellow (caution)

// ============================================
// MILE MARKER POST - 12x28 pixels
// ============================================
const mileMarkerPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,B,B,B,B,B,B,_,_,_], // 0 - post top
  [_,_,B,B,W,W,W,W,B,B,_,_], // 1 - number plate
  [_,_,B,W,K,K,K,K,W,B,_,_], // 2 - numbers
  [_,_,B,W,K,W,W,K,W,B,_,_], // 3
  [_,_,B,W,K,W,W,K,W,B,_,_], // 4
  [_,_,B,W,K,W,W,K,W,B,_,_], // 5
  [_,_,B,W,K,K,K,K,W,B,_,_], // 6
  [_,_,B,B,W,W,W,W,B,B,_,_], // 7
  [_,_,_,B,B,B,B,B,B,_,_,_], // 8
  [_,_,_,_,B,B,B,B,_,_,_,_], // 9 - post
  [_,_,_,_,B,b,b,B,_,_,_,_], // 10
  [_,_,_,_,B,b,b,B,_,_,_,_], // 11
  [_,_,_,_,B,b,b,B,_,_,_,_], // 12
  [_,_,_,_,B,b,b,B,_,_,_,_], // 13
  [_,_,_,_,B,b,b,B,_,_,_,_], // 14
  [_,_,_,_,B,b,b,B,_,_,_,_], // 15
  [_,_,_,_,B,b,b,B,_,_,_,_], // 16
  [_,_,_,_,B,b,b,B,_,_,_,_], // 17
  [_,_,_,_,B,b,b,B,_,_,_,_], // 18
  [_,_,_,_,B,b,b,B,_,_,_,_], // 19
  [_,_,_,_,B,b,b,B,_,_,_,_], // 20
  [_,_,_,_,B,b,b,B,_,_,_,_], // 21
  [_,_,_,_,B,b,b,B,_,_,_,_], // 22
  [_,_,_,_,B,b,b,B,_,_,_,_], // 23
  [_,_,_,_,B,b,b,B,_,_,_,_], // 24
  [_,_,_,_,B,b,b,B,_,_,_,_], // 25
  [_,_,_,B,B,B,B,B,B,_,_,_], // 26 - base
  [_,_,_,B,B,B,B,B,B,_,_,_], // 27
];

export const MILE_MARKER: PixelSprite = {
  name: 'mile_marker',
  width: 12,
  height: 28,
  pixels: mileMarkerPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// DIRECTION SIGN - 32x24 pixels
// ============================================
const directionSignPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,B,B,B,B,B,B,B,B,B,B,b,b,b,b,b,B,B,B,B,B,B,B,B,B,B,B,_,_,_], // 1 - arrow sign
  [_,_,B,B,b,b,b,b,b,b,b,b,b,W,W,W,W,W,b,b,b,b,b,b,b,b,b,b,B,B,_,_], // 2
  [_,B,B,b,K,K,K,K,K,K,K,K,K,W,W,W,W,W,K,K,K,K,K,K,K,K,K,b,B,B,_,_], // 3 - text line 1
  [B,B,b,b,K,b,b,b,b,b,b,b,b,W,W,W,W,W,b,b,b,b,b,b,b,b,K,b,b,B,B,_], // 4
  [B,b,b,b,K,K,K,K,K,K,K,K,K,W,W,W,W,W,K,K,K,K,K,K,K,K,K,b,b,b,B,_], // 5 - text line 2
  [_,B,B,b,K,b,b,b,b,b,b,b,b,W,W,W,W,W,b,b,b,b,b,b,b,b,K,b,B,B,_,_], // 6
  [_,_,B,B,b,b,b,b,b,b,b,b,b,W,W,W,W,W,b,b,b,b,b,b,b,b,b,B,B,_,_,_], // 7
  [_,_,_,B,B,B,B,B,B,B,B,B,B,b,b,b,b,b,B,B,B,B,B,B,B,B,B,B,_,_,_,_], // 8
  [_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 10 - post
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 11
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 15
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 17
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 18
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 19
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_], // 22 - base
  [_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_], // 23
];

export const DIRECTION_SIGN: PixelSprite = {
  name: 'direction_sign',
  width: 32,
  height: 24,
  pixels: directionSignPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// WARNING SIGN (bear/danger) - 16x20 pixels
// ============================================
const warningSignPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,Y,Y,_,_,_,_,_,_,_], // 0 - triangle top
  [_,_,_,_,_,_,Y,Y,Y,Y,_,_,_,_,_,_], // 1
  [_,_,_,_,_,Y,Y,K,K,Y,Y,_,_,_,_,_], // 2
  [_,_,_,_,Y,Y,K,K,K,K,Y,Y,_,_,_,_], // 3
  [_,_,_,Y,Y,K,K,K,K,K,K,Y,Y,_,_,_], // 4
  [_,_,Y,Y,K,K,K,K,K,K,K,K,Y,Y,_,_], // 5
  [_,Y,Y,K,K,K,Y,Y,Y,Y,K,K,K,Y,Y,_], // 6 - bear silhouette
  [Y,Y,K,K,K,Y,Y,Y,Y,Y,Y,K,K,K,Y,Y], // 7
  [Y,K,K,K,Y,Y,Y,K,K,Y,Y,Y,K,K,K,Y], // 8
  [Y,K,K,Y,Y,Y,K,K,K,K,Y,Y,Y,K,K,Y], // 9
  [Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y], // 10 - base
  [_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_], // 11 - post
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 15
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 17
  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_], // 18 - base
  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_], // 19
];

export const WARNING_SIGN: PixelSprite = {
  name: 'warning_sign',
  width: 16,
  height: 20,
  pixels: warningSignPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// TRAIL INFO KIOSK - 32x40 pixels
// ============================================
const trailKioskPixels: PixelGrid = [];
for (let y = 0; y < 40; y++) {
  const row: number[] = [];
  for (let x = 0; x < 32; x++) {
    // Roof
    if (y < 4) {
      if (x < 2 || x >= 30) {
        row.push(_);
      } else {
        row.push(y < 2 ? B : b);
      }
    }
    // Info board
    else if (y < 28) {
      if (x < 4 || x >= 28) {
        row.push(B);
      } else if (x === 4 || x === 27 || y === 4 || y === 27) {
        row.push(b);
      } else {
        // Content area
        if (y >= 8 && y < 24 && x >= 6 && x < 26) {
          row.push(W);
        } else {
          row.push(G);
        }
      }
    }
    // Posts
    else {
      if ((x >= 6 && x < 10) || (x >= 22 && x < 26)) {
        row.push(y === 28 || y === 39 ? B : b);
      } else {
        row.push(_);
      }
    }
  }
  trailKioskPixels.push(row);
}

export const TRAIL_KIOSK: PixelSprite = {
  name: 'trail_kiosk',
  width: 32,
  height: 40,
  pixels: trailKioskPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// AT DIAMOND MARKER - 12x12 pixels
// ============================================
const atDiamondPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,W,W,_,_,_,_,_], // 0
  [_,_,_,_,W,W,W,W,_,_,_,_], // 1
  [_,_,_,W,W,W,W,W,W,_,_,_], // 2
  [_,_,W,W,W,K,K,W,W,W,_,_], // 3 - AT letters
  [_,W,W,W,K,K,K,K,W,W,W,_], // 4
  [W,W,W,K,K,W,W,K,K,W,W,W], // 5
  [W,W,W,K,K,K,K,K,K,W,W,W], // 6
  [_,W,W,W,K,K,K,K,W,W,W,_], // 7
  [_,_,W,W,W,K,K,W,W,W,_,_], // 8
  [_,_,_,W,W,W,W,W,W,_,_,_], // 9
  [_,_,_,_,W,W,W,W,_,_,_,_], // 10
  [_,_,_,_,_,W,W,_,_,_,_,_], // 11
];

export const AT_DIAMOND: PixelSprite = {
  name: 'at_diamond',
  width: 12,
  height: 12,
  pixels: atDiamondPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// SHELTER SIGN - 20x12 pixels
// ============================================
const shelterSignPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_,_], // 0
  [_,_,B,B,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_,_], // 1
  [_,B,B,b,b,W,W,W,W,W,W,W,W,W,W,b,b,B,B,_], // 2 - shelter icon
  [B,B,b,b,W,W,W,W,b,b,b,b,W,W,W,W,b,b,B,B], // 3
  [B,b,b,W,W,W,b,b,b,b,b,b,b,b,W,W,W,b,b,B], // 4
  [B,b,W,W,b,b,b,b,b,b,b,b,b,b,b,b,W,W,b,B], // 5
  [B,b,W,b,b,b,b,K,K,K,K,K,K,b,b,b,b,W,b,B], // 6 - distance
  [B,b,W,b,b,b,b,K,b,b,K,b,K,b,b,b,b,W,b,B], // 7
  [B,b,W,W,b,b,b,b,b,b,b,b,b,b,b,b,W,W,b,B], // 8
  [B,B,b,W,W,W,b,b,b,b,b,b,b,b,W,W,W,b,B,B], // 9
  [_,B,B,b,b,W,W,W,W,W,W,W,W,W,W,b,b,B,B,_], // 10
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 11
];

export const SHELTER_SIGN: PixelSprite = {
  name: 'shelter_sign',
  width: 20,
  height: 12,
  pixels: shelterSignPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// WATER SIGN - 16x12 pixels
// ============================================
const waterSignPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 0
  [_,B,B,b,b,b,b,b,b,b,b,b,b,B,B,_], // 1
  [B,B,b,b,b,b,b,C.waterBlue,C.waterBlue,b,b,b,b,b,B,B], // 2
  [B,b,b,b,b,b,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,b,b,b,b,b,B], // 3 - water drop
  [B,b,b,b,b,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,b,b,b,b,B], // 4
  [B,b,b,b,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,b,b,b,B], // 5
  [B,b,b,b,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,b,b,b,B], // 6
  [B,b,b,b,b,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,b,b,b,b,B], // 7
  [B,b,b,b,b,b,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,b,b,b,b,b,B], // 8
  [B,B,b,b,b,b,b,C.waterBlue,C.waterBlue,b,b,b,b,b,B,B], // 9
  [_,B,B,b,b,b,b,b,b,b,b,b,b,B,B,_], // 10
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 11
];

export const WATER_SIGN: PixelSprite = {
  name: 'water_sign',
  width: 16,
  height: 12,
  pixels: waterSignPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// VIEWPOINT SIGN - 16x16 pixels
// ============================================
const viewpointSignPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_], // 0
  [_,B,B,b,b,b,b,b,b,b,b,b,b,B,B,_], // 1
  [B,B,b,b,G,G,G,G,G,G,G,G,b,b,B,B], // 2 - mountain
  [B,b,b,G,G,G,G,G,G,G,G,G,G,b,b,B], // 3
  [B,b,G,G,G,G,G,w,G,G,G,G,G,G,b,B], // 4 - peak
  [B,b,G,G,G,G,w,w,w,G,G,G,G,G,b,B], // 5
  [B,b,G,G,G,w,w,w,w,w,G,G,G,G,b,B], // 6
  [B,b,G,G,w,w,w,w,w,w,w,G,G,G,b,B], // 7
  [B,b,G,w,w,w,w,w,w,w,w,w,G,G,b,B], // 8
  [B,b,w,w,w,w,w,w,w,w,w,w,w,G,b,B], // 9
  [B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B], // 10
  [B,B,b,b,b,b,b,b,b,b,b,b,b,b,B,B], // 11
  [_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,_], // 12
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 13 - post
  [_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_], // 14
  [_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_], // 15
];

export const VIEWPOINT_SIGN: PixelSprite = {
  name: 'viewpoint_sign',
  width: 16,
  height: 16,
  pixels: viewpointSignPixels,
  originX: 0.5,
  originY: 1.0,
};

// Export all sign sprites
export const SIGN_SPRITES = {
  mileMarker: MILE_MARKER,
  directionSign: DIRECTION_SIGN,
  warningSign: WARNING_SIGN,
  trailKiosk: TRAIL_KIOSK,
  atDiamond: AT_DIAMOND,
  shelterSign: SHELTER_SIGN,
  waterSign: WATER_SIGN,
  viewpointSign: VIEWPOINT_SIGN,
};
