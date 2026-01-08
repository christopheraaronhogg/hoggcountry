// ============================================
// TRAIL LEGS - Summit and Overlook Sprites
// ============================================
// Mountain peaks, overlooks, and summit areas

import { PixelSprite } from './types';
import { C } from './palette';

// Rocky summit outcrop (48x32)
const summitOutcrop: PixelSprite = {
  name: 'summitOutcrop',
  width: 48,
  height: 32,
  pixels: [
    // Sky area (transparent)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    // Rocky peaks
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,0,0,0,0,0,0,0,0,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,0,0,0,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0],
    // Summit platform
    [0,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0],
    // Ridge line
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0],
    // Sloping sides
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0],
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    [0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    // Lower rocky area with vegetation
    [0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.forestGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.forestGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.forestGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    // Treeline below summit
    [0,0,0,0,0,0,0,0,C.stone,C.stone,C.gray,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.gray,C.gray,C.forestGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Wooden observation deck/platform (32x20)
const observationDeck: PixelSprite = {
  name: 'observationDeck',
  width: 32,
  height: 20,
  pixels: [
    // Railing posts
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    // Top rail
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Vertical rails
    [0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0],
    [0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0,C.bark,0,0],
    // Bottom rail
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Deck planks
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan],
    // Support beams
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0],
    // Rock foundation
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray],
  ],
};

// Katahdin summit sign (24x28)
const katahdinSummit: PixelSprite = {
  name: 'katahdinSummit',
  width: 24,
  height: 28,
  pixels: [
    // Famous brown Katahdin sign
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0],
    // KATAHDIN text row
    [0,0,C.bark,C.tan,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // 5267 FT text row
    [0,0,C.bark,C.tan,C.tan,C.white,C.white,C.white,C.white,C.tan,C.white,C.white,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // BAXTER PEAK
    [0,0,C.bark,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // NORTHERN TERMINUS
    [0,0,C.bark,C.tan,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    // APPALACHIAN TRAIL
    [0,0,C.bark,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.tan,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.white,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0,0],
    [0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0],
    [0,0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,0,0,0],
    [0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0],
    // Post
    [0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0],
    // Rocky ground
    [C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.bark,C.bark,C.bark,C.bark,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone],
    [C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

// Fire tower (20x40)
const fireTower: PixelSprite = {
  name: 'fireTower',
  width: 20,
  height: 40,
  pixels: [
    // Cab roof
    [0,0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0,0],
    [0,0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0,0],
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    // Cab windows
    [0,0,0,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,0,0,0],
    [0,0,0,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,0,0,0],
    [0,0,0,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    // Cab floor / platform
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0],
    // Tower legs (diagonal bracing)
    [0,0,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,0,0],
    [0,0,0,C.bark,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0,0,0,0,C.bark,C.bark,0,0,0],
    [0,0,0,0,C.bark,C.bark,0,0,0,C.bark,C.bark,0,0,0,C.bark,C.bark,0,0,0,0],
    [0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0],
    [0,0,0,0,0,C.bark,0,0,0,C.bark,C.bark,0,0,0,C.bark,0,0,0,0,0],
    [0,0,0,0,C.bark,0,0,0,0,C.bark,C.bark,0,0,0,0,C.bark,0,0,0,0],
    [0,0,0,0,C.bark,C.bark,0,0,0,C.bark,C.bark,0,0,0,C.bark,C.bark,0,0,0,0],
    [0,0,0,C.bark,0,C.bark,0,0,0,C.bark,C.bark,0,0,0,C.bark,0,C.bark,0,0,0],
    [0,0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0,0,0],
    [0,0,0,C.bark,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,C.bark,0,0,0],
    [0,0,C.bark,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,C.bark,0,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,C.bark,C.bark,0,0],
    [0,C.bark,0,C.bark,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,C.bark,0,C.bark,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [0,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,0],
    [C.bark,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,C.bark],
    [C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark],
    [C.bark,0,C.bark,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,C.bark,0,C.bark],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.bark,0,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,C.bark],
    [C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,0,C.bark,C.bark],
    [C.bark,0,C.bark,0,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,0,C.bark,0,C.bark],
    [C.bark,0,0,C.bark,0,0,0,0,0,C.bark,C.bark,0,0,0,0,0,C.bark,0,0,C.bark],
    [C.bark,0,0,0,C.bark,0,0,0,0,C.bark,C.bark,0,0,0,0,C.bark,0,0,0,C.bark],
    [C.bark,0,0,0,0,C.bark,0,0,0,C.bark,C.bark,0,0,0,C.bark,0,0,0,0,C.bark],
    [C.bark,0,0,0,0,0,C.bark,0,0,C.bark,C.bark,0,0,C.bark,0,0,0,0,0,C.bark],
    // Ground level
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.bark,C.bark,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    [C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

export const SUMMIT_SPRITES = {
  summitOutcrop,
  observationDeck,
  katahdinSummit,
  fireTower,
};
