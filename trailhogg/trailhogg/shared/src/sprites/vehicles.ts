// ============================================
// TRAIL LEGS - Vehicle Sprites
// ============================================
// Shuttles, cars, and transportation

import { PixelSprite } from './types';
import { C } from './palette';

// Shuttle van (32x16)
const shuttleVan: PixelSprite = {
  name: 'shuttleVan',
  width: 32,
  height: 16,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0,0],
    [0,0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0,0],
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,C.gray,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.gray,0,0,0],
    [0,0,C.gray,C.gray,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.gray,C.gray,0,0],
    [0,0,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,0,0],
    // Wheels
    [0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0],
    [0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0],
    [0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0],
    [0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

// Pickup truck (28x14)
const pickupTruck: PixelSprite = {
  name: 'pickupTruck',
  width: 28,
  height: 14,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.danger,C.danger,C.skyBlue,C.skyBlue,C.skyBlue,C.danger,C.danger,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.danger,C.danger,C.danger,C.skyBlue,C.skyBlue,C.skyBlue,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.danger,C.danger,0,0,0],
    [0,0,0,C.gray,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.bark,C.danger,C.danger,C.gray,0,0],
    [0,0,C.gray,C.gray,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.danger,C.danger,C.gray,C.gray,0],
    [0,0,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,0],
    // Wheels
    [0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0],
    [0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0],
    [0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0],
    [0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

// Sedan car for hitching (24x12)
const sedanCar: PixelSprite = {
  name: 'sedanCar',
  width: 24,
  height: 12,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0,0],
    [0,0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0,0],
    [0,0,0,0,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,0,0,0,0],
    [0,0,0,C.gray,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.gray,0,0,0],
    [0,0,C.gray,C.gray,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.gray,C.gray,0,0],
    [0,0,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,0,0],
    // Wheels
    [0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0],
    [0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0],
    [0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0],
    [C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray],
  ],
};

// Trail maintenance ATV (20x12)
const trailATV: PixelSprite = {
  name: 'trailATV',
  width: 20,
  height: 12,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.forestGreen,C.forestGreen,0,0,0,0,0,0],
    [0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0],
    [0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0],
    [0,0,0,C.charcoal,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.charcoal,0,0,0],
    [0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0],
    // Big wheels
    [0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0],
    [C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal],
    [C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.gray,C.gray,C.charcoal,C.charcoal],
    [0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0,0,0,0,0,0,0,0,0,0,C.charcoal,C.charcoal,C.charcoal,C.charcoal,0],
  ],
};

// Hitchhiking thumb (8x12)
const hitchThumb: PixelSprite = {
  name: 'hitchThumb',
  width: 8,
  height: 12,
  pixels: [
    [0,0,0,0,C.skin1,C.skin1,0,0],
    [0,0,0,C.skin1,C.skin1,C.skin1,C.skin1,0],
    [0,0,0,C.skin1,C.skin1,C.skin1,C.skin1,0],
    [0,0,C.skin1,C.skin1,C.skin1,C.skin1,0,0],
    [0,0,C.skin1,C.skin1,C.skin1,C.skin1,0,0],
    [0,C.skin1,C.skin1,C.skin1,C.skin1,0,0,0],
    [0,C.skin1,C.skin1,C.skin1,C.skin1,0,0,0],
    [C.skin1,C.skin1,C.skin1,C.skin1,0,0,0,0],
    [C.skin1,C.skin1,C.skin1,C.skin1,0,0,0,0],
    [C.skin1,C.skin1,C.skin1,0,0,0,0,0],
    [C.skin1,C.skin1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

export const VEHICLE_SPRITES = {
  shuttleVan,
  pickupTruck,
  sedanCar,
  trailATV,
  hitchThumb,
};
