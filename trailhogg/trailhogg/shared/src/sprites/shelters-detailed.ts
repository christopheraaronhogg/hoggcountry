// ============================================
// TRAIL LEGS - Detailed Shelter Sprites
// ============================================
// Large-scale AT shelter and lean-to structures

import { PixelSprite } from './types';
import { C } from './palette';

// Classic AT three-sided lean-to shelter (48x40)
const classicShelter: PixelSprite = {
  name: 'classicShelter',
  width: 48,
  height: 40,
  pixels: [
    // Roof peak
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.bark,C.bark,0,0,0,0,0],
    // Roof edge
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    // Wall section
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    // Sleeping platform
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    // Support posts and ground
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    // Ground level with stone foundation
    [C.stone,C.stone,C.stone,C.bark,C.bark,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.bark,C.bark,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    // Fire ring in front
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Newer enclosed shelter with privy (40x36)
const modernShelter: PixelSprite = {
  name: 'modernShelter',
  width: 40,
  height: 36,
  pixels: [
    // Metal roof
    [0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    // Wall with window
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // Door opening
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // Platform
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    // Foundation
    [C.stone,C.stone,C.bark,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.bark,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    // Ground
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Privy/outhouse (16x24)
const privy: PixelSprite = {
  name: 'privy',
  width: 16,
  height: 24,
  pixels: [
    // Roof
    [0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0],
    [0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0],
    [0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Walls
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Moon cutout
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Lower walls
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    // Door
    [0,C.bark,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.bark,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.bark,C.tan,C.tan,C.bark,0],
    // Base
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Bear box/food storage (20x16)
const bearBox: PixelSprite = {
  name: 'bearBox',
  width: 20,
  height: 16,
  pixels: [
    [0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.steelBlue,0],
    [0,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.steelBlue,0],
    [0,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.bark,C.bark,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.steelBlue,0],
    [0,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.bark,C.bark,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.steelBlue,0],
    [0,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.steelBlue,0],
    [0,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    // Legs
    [0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0],
    [0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0],
    [0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0],
    [0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0],
    // Ground
    [C.dirt,C.dirt,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Picnic table at shelter (24x12)
const picnicTable: PixelSprite = {
  name: 'picnicTable',
  width: 24,
  height: 12,
  pixels: [
    // Table top
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // Bench left + table leg + bench right
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.bark,C.tan,C.tan,C.tan,C.tan,C.bark,0,0,0,0,C.bark,0,0,C.bark,0,0,0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.bark],
    [C.bark,C.tan,C.tan,C.tan,C.tan,C.bark,0,0,0,0,C.bark,0,0,C.bark,0,0,0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.bark],
    // Bench legs + table legs
    [0,C.bark,0,0,C.bark,0,0,0,0,0,C.bark,0,0,C.bark,0,0,0,0,0,C.bark,0,0,C.bark,0],
    [0,C.bark,0,0,C.bark,0,0,0,0,0,C.bark,0,0,C.bark,0,0,0,0,0,C.bark,0,0,C.bark,0],
    [0,C.bark,0,0,C.bark,0,0,0,0,0,C.bark,0,0,C.bark,0,0,0,0,0,C.bark,0,0,C.bark,0],
    // Ground
    [C.dirt,C.stone,C.dirt,C.dirt,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.dirt,C.dirt,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.dirt,C.dirt,C.stone,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

export const SHELTER_DETAILED_SPRITES = {
  classicShelter,
  modernShelter,
  privy,
  bearBox,
  picnicTable,
};
