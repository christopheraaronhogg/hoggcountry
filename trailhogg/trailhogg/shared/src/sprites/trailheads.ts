// ============================================
// TRAIL LEGS - Trailhead and Parking Sprites
// ============================================
// Trailhead parking areas and entrance structures

import { PixelSprite } from './types';
import { C } from './palette';

// Trailhead parking lot (48x28)
const trailheadParking: PixelSprite = {
  name: 'trailheadParking',
  width: 48,
  height: 28,
  pixels: [
    // Forest backdrop
    [C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen],
    [C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen],
    // Tree trunks
    [C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen,C.darkGreen,C.bark,C.darkGreen],
    // Grass buffer
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Info kiosk
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,C.tan,C.white,C.white,C.white,C.white,C.white,C.white,C.tan,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.bark,C.bark,0,0,0,0,0,0,C.bark,C.bark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Grass before parking
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Parking curb
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    // Parking lot
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    // Parking lines
    [C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    // Parked cars
    [C.gray,C.gray,C.gray,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.gray,C.gray,C.danger,C.danger,C.skyBlue,C.skyBlue,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.forestGreen,C.skyBlue,C.skyBlue,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.gray,C.gray,C.gray,C.gray,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    // More parking
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.white,C.white,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
    // Bottom curb
    [C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone],
    // Road
    [C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal],
    [C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.yellow,C.yellow,C.yellow,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.yellow,C.yellow,C.yellow,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal],
    [C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal],
  ],
};

// Trail register box (16x20)
const trailRegister: PixelSprite = {
  name: 'trailRegister',
  width: 16,
  height: 20,
  pixels: [
    // Roof
    [0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0],
    [0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Box body
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.white,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.white,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,0],
    [0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Post
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.bark,C.bark,C.bark,C.bark,0,0,0,0,0,0],
    // Ground
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Wooden gate entrance (32x20)
const trailGate: PixelSprite = {
  name: 'trailGate',
  width: 32,
  height: 20,
  pixels: [
    // Posts and crossbeam
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,0],
    // Sign area
    [0,0,C.bark,C.bark,0,0,0,0,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,C.tan,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.tan,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,C.tan,C.forestGreen,C.white,C.white,C.forestGreen,C.white,C.forestGreen,C.white,C.white,C.forestGreen,C.white,C.white,C.white,C.white,C.forestGreen,C.tan,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,C.tan,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.tan,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,0,0,0,0,0,C.bark,C.bark,0],
    // Posts continue
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    [0,0,C.bark,C.bark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.bark,C.bark,0],
    // Ground with path
    [C.dirt,C.stone,C.bark,C.bark,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.bark,C.bark,C.stone,C.dirt],
    [C.dirt,C.dirt,C.stone,C.stone,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.stone,C.stone,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

// Portable toilet (12x20)
const portaPotty: PixelSprite = {
  name: 'portaPotty',
  width: 12,
  height: 20,
  pixels: [
    // Roof
    [0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    // Body
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    // Vent
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.gray,C.gray,C.gray,C.gray,C.steelBlue,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    // Door
    [0,C.steelBlue,C.steelBlue,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.steelBlue,C.steelBlue,0],
    // Base
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    [0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0],
    // Ground
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
    [C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt,C.dirt],
  ],
};

export const TRAILHEAD_SPRITES = {
  trailheadParking,
  trailRegister,
  trailGate,
  portaPotty,
};
