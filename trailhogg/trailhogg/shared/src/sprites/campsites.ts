// ============================================
// TRAIL LEGS - Campsite Layout Sprites
// ============================================
// Larger campsite areas with multiple elements

import { PixelSprite } from './types';
import { C } from './palette';

// Established tent campsite (40x28)
const tentCampsite: PixelSprite = {
  name: 'tentCampsite',
  width: 40,
  height: 28,
  pixels: [
    // Forest backdrop
    [C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen],
    [C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen],
    // Clearing with tent platform and tent
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Tent floor
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Ground area
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Fire ring area
    [C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.charcoal,C.charcoal,C.danger,C.yellow,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.danger,C.yellow,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen],
    // Sitting logs
    [C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // More forest
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
  ],
};

// Hammock site between trees (32x20)
const hammockSite: PixelSprite = {
  name: 'hammockSite',
  width: 32,
  height: 20,
  pixels: [
    // Tree canopy
    [C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen],
    // Tree trunks with hammock straps
    [C.darkGreen,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.darkGreen],
    [0,C.bark,C.bark,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,0,0,C.bark,C.bark,0],
    // Hammock
    [0,C.bark,C.bark,0,0,0,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,C.bark,C.bark,0],
    // Below hammock
    [0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    // Ground
    [C.dirt,C.bark,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.bark,C.bark,C.dirt],
    [C.dirt,C.bark,C.bark,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.bark,C.bark,C.dirt],
    [C.dirt,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    // Backpack on ground
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
  ],
};

// Stealth campsite (minimal, hidden) (28x20)
const stealthCamp: PixelSprite = {
  name: 'stealthCamp',
  width: 28,
  height: 20,
  pixels: [
    // Dense forest
    [C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen],
    [C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen],
    // Small clearing with bivy
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Small bivy/tarp
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Ground pad visible
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // More forest
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
  ],
};

export const CAMPSITE_SPRITES = {
  tentCampsite,
  hammockSite,
  stealthCamp,
};
