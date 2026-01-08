// ============================================
// TRAIL LEGS - Bridge and Water Crossing Sprites
// ============================================
// Various trail bridges and water crossing structures

import { PixelSprite } from './types';
import { C } from './palette';

// Wooden footbridge (40x16)
const woodenFootbridge: PixelSprite = {
  name: 'woodenFootbridge',
  width: 40,
  height: 16,
  pixels: [
    // Railings
    [C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,C.bark],
    [C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,C.bark],
    // Top rail
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    // Vertical slats
    [C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,C.bark],
    [C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,0,C.bark,0,0,0,C.bark],
    // Bottom rail
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    // Deck planks
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    // Support beams underneath
    [0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0],
    // Water below
    [0,0,0,0,0,0,0,0,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,0,0,0,0,0,0],
    [0,0,0,0,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,0,0,0,0],
    [C.stone,C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone,C.stone],
  ],
};

// Suspension bridge (48x24)
const suspensionBridge: PixelSprite = {
  name: 'suspensionBridge',
  width: 48,
  height: 24,
  pixels: [
    // Tower tops
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    // Cables from towers
    [0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,C.gray,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.gray,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,C.gray,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.gray,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,C.gray,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.gray,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,C.gray,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.gray,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,C.gray,C.gray,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.gray,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    // Main cable swoop
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    // Vertical cables
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,C.gray,0,0,0,C.gray,0,0,0,0,0,0,0,C.gray,0,0,0,C.gray,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,C.gray,0,0,0,0,C.gray,0,0,0,0,0,0,0,C.gray,0,0,0,0,C.gray,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,C.gray,0,0,0,0,0,C.gray,0,0,0,0,0,0,0,C.gray,0,0,0,0,0,C.gray,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,0,0,0,0],
    // Deck
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    // Tower base into water
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    // Water
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.steelBlue,C.steelBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.steelBlue,C.steelBlue,C.stone,C.stone,C.stone,C.stone],
    // Bank
    [C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Log bridge (24x12)
const logBridge: PixelSprite = {
  name: 'logBridge',
  width: 24,
  height: 12,
  pixels: [
    // Logs
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    // Second log
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    // Water below
    [0,0,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,0,0],
    [0,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,0],
    [C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterDeep,C.stone],
    [C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone,C.stone],
  ],
};

// Stepping stones (32x10)
const steppingStones: PixelSprite = {
  name: 'steppingStones',
  width: 32,
  height: 10,
  pixels: [
    // Stones above water
    [0,0,0,0,C.stone,C.stone,0,0,0,0,C.stone,C.stone,C.stone,0,0,0,0,0,C.stone,C.stone,0,0,0,0,C.stone,C.stone,C.stone,0,0,0,0,0],
    [0,0,0,C.stone,C.gray,C.gray,C.stone,0,0,C.stone,C.gray,C.gray,C.gray,C.stone,0,0,0,C.stone,C.gray,C.gray,C.stone,0,0,C.stone,C.gray,C.gray,C.gray,C.stone,0,0,0,0],
    [0,0,0,C.stone,C.stone,C.stone,C.stone,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,C.stone,C.stone,C.stone,C.stone,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0],
    // Water line
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight],
    [C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep,C.waterLight,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    // Bottom
    [C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone],
    [C.dirt,C.stone,C.stone,C.stone,C.stone,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.stone,C.stone,C.stone,C.stone,C.dirt],
  ],
};

// Boardwalk over swamp (36x12)
const boardwalk: PixelSprite = {
  name: 'boardwalk',
  width: 36,
  height: 12,
  pixels: [
    // Boardwalk planks
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    // Support beams
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0],
    // Swamp water
    [C.darkGreen,C.darkGreen,C.darkGreen,C.bark,C.bark,C.darkGreen,C.darkGreen,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.bark,C.bark,C.darkGreen,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.darkGreen,C.bark,C.bark,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.bark,C.bark,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.waterDeep,C.darkGreen,C.darkGreen,C.bark,C.bark,C.darkGreen,C.waterDeep,C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.bark,C.bark,C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.waterDeep,C.darkGreen,C.bark,C.bark,C.darkGreen,C.darkGreen,C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.bark,C.bark,C.darkGreen,C.waterDeep,C.darkGreen],
    [C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.waterDeep,C.waterDeep,C.darkGreen,C.waterDeep,C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    // Swamp bottom
    [C.dirt,C.dirt,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

export const BRIDGE_SPRITES = {
  woodenFootbridge,
  suspensionBridge,
  logBridge,
  steppingStones,
  boardwalk,
};
