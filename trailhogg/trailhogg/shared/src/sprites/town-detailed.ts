// ============================================
// TRAIL LEGS - Detailed Town Building Sprites
// ============================================
// Large-scale AT trail town buildings and structures

import { PixelSprite } from './types';
import { C } from './palette';

// Mountain Crossings style outfitter (48x40)
const outfitterLarge: PixelSprite = {
  name: 'outfitterLarge',
  width: 48,
  height: 40,
  pixels: [
    // Roof peak
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Sign
    [0,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,0],
    [0,C.bark,C.forestGreen,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.forestGreen,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.forestGreen,C.white,C.white,C.forestGreen,C.bark,0],
    [0,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,0],
    // Upper wall
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Windows row
    [0,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,0],
    // Lower wall
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Porch
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0],
    // Porch posts
    [0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    // Deck
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    // Steps
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    // Ground
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Trail town hostel (40x32)
const hostelLarge: PixelSprite = {
  name: 'hostelLarge',
  width: 40,
  height: 32,
  pixels: [
    // Roof
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0,0],
    [0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Sign area
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    // Wall with windows
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Door and more windows
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Base
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Foundation
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    // Ground with parking
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

// General store/gas station (36x28)
const generalStore: PixelSprite = {
  name: 'generalStore',
  width: 36,
  height: 28,
  pixels: [
    // Roof with awning
    [0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0],
    [0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Awning stripe
    [0,C.bark,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.bark,0],
    [0,C.bark,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.danger,C.bark,0],
    // Wall section
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    // Windows - large storefront style
    [0,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.bark,0],
    // Door section
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    [0,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,0],
    // Base
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Concrete sidewalk
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    // Gas pump area
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.danger,C.white,C.white,C.danger,C.gray,C.gray,C.gray,C.gray,C.danger,C.white,C.white,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.danger,C.white,C.white,C.danger,C.gray,C.gray,C.gray,C.gray,C.danger,C.white,C.white,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

// Post office (32x24)
const postOfficeLarge: PixelSprite = {
  name: 'postOfficeLarge',
  width: 32,
  height: 24,
  pixels: [
    // Roof with flag
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.danger,C.white,C.danger,C.danger,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.danger,C.danger,C.danger,C.danger,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    // Wall with "POST OFFICE" text simulation
    [C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.steelBlue,C.steelBlue,C.steelBlue,C.cloudWhite,C.steelBlue,C.steelBlue,C.steelBlue,C.cloudWhite,C.steelBlue,C.steelBlue,C.steelBlue,C.cloudWhite,C.steelBlue,C.steelBlue,C.steelBlue,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    // Windows
    [C.bark,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    // Door with mailbox
    [C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.steelBlue,C.steelBlue,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.steelBlue,C.steelBlue,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.steelBlue,C.steelBlue,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    [C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.cloudWhite,C.bark],
    // Base
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    // Sidewalk and steps
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

export const TOWN_DETAILED_SPRITES = {
  outfitterLarge,
  hostelLarge,
  generalStore,
  postOfficeLarge,
};
