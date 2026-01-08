// ============================================
// TRAIL LEGS - Hot Springs, NC Buildings
// ============================================
// Real buildings from Hot Springs, NC - the famous trail town
// where the AT runs right down Bridge Street
//
// LAYERED BUILDING SYSTEM (Project Zomboid style):
// Each building has multiple layers for proper rendering:
//   - base: Floor tiles (always visible)
//   - wallSouth: Front wall (always visible - camera facing north)
//   - wallEast: Right wall (always visible - camera facing west)
//   - wallNorth: Back wall (hideable when viewing from south)
//   - wallWest: Left wall (hideable when viewing from west)
//   - interior: Furniture and interior details
//   - roof: Roof tiles (hideable when viewing interior)
//
// Building dimensions: 48x48px for medium buildings

import { PixelSprite } from './types';
import { C } from './palette';

// ============================================
// BLUFF MOUNTAIN OUTFITTERS
// ============================================
// 88 Bridge Street - THE hiker hub since 1997
// Wooden building with green awning, hiking gear shop

/**
 * Bluff Mountain Outfitters - Base/Floor Layer
 * Wood plank floor inside the shop
 */
export const bluffMountainBase: PixelSprite = {
  name: 'bluff_mountain_outfitters_base',
  width: 48,
  height: 48,
  pixels: [
    // Row 1-8: Exterior ground (transparent for now, can add sidewalk later)
    ...Array(8).fill(Array(48).fill(0)),

    // Row 9-48: Interior wood floor
    ...Array(40).fill([
      0,0,0,0,0,0,0,0, // Left exterior
      C.bark,C.bark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark, // Wood floor planks
      C.bark,C.bark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark,
      C.bark,C.bark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark,
      C.bark,C.bark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark,
      C.bark,C.bark,C.barkDark,C.bark,C.bark,C.barkDark,C.bark,C.bark,
      0,0,0,0,0,0,0,0, // Right exterior
    ]),
  ],
};

/**
 * Bluff Mountain Outfitters - South Wall (Front)
 * Always visible - has door and storefront windows
 */
export const bluffMountainWallSouth: PixelSprite = {
  name: 'bluff_mountain_outfitters_wall_south',
  width: 48,
  height: 48,
  pixels: [
    // Row 1-7: Green awning
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.forestDark,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.shirtGreen,C.forestDark,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.forestDark,C.shirtGreen,C.shirtGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.shirtGreen,C.shirtGreen,C.forestDark,0,0,0,0,0,0],
    [0,0,0,0,0,C.forestDark,C.shirtGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.shirtGreen,C.forestDark,0,0,0,0,0],
    [0,0,0,0,C.forestDark,C.shirtGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.shirtGreen,C.forestDark,0,0,0,0],
    [0,0,0,C.forestDark,C.shirtGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.shirtGreen,C.forestDark,0,0],
    [0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark],

    // Row 9-12: Sign area "OUTFITTER"
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.forestDark,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.forestDark,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],

    // Row 13-16: Wood siding above windows
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],

    // Row 17-28: Large storefront windows (left and right)
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.dirtLight,C.barkDark,0],

    // Row 29-32: Wood siding between windows and door
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],

    // Row 33-48: Front door (center)
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyBlue,C.skyBlue,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.skyBlue,C.skyBlue,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.bark,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.pantsBrown,C.bark,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.barkDark,0],
    [0,0,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,0],
  ],
};

/**
 * Bluff Mountain Outfitters - Interior Layer
 * Shelves, counter, gear displays (visible when walls removed)
 */
export const bluffMountainInterior: PixelSprite = {
  name: 'bluff_mountain_outfitters_interior',
  width: 48,
  height: 48,
  pixels: [
    // First 8 rows: exterior (transparent)
    ...Array(8).fill(Array(48).fill(0)),

    // Row 9-20: Back wall with shelves
    ...Array(12).fill([
      0,0,0,0,0,0,0,0, // Left exterior
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark, // Back shelving
      C.barkDark,C.barkDark,C.shirtGreen,C.danger,C.shirtGreen,C.barkDark,C.barkDark,C.bark, // Gear on shelves
      C.bark,C.barkDark,C.skyBlue,C.warning,C.skyBlue,C.barkDark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.barkDark,C.barkDark,C.pantsBrown,C.shirtGreen,C.pantsBrown,C.barkDark,C.barkDark,C.bark,
      0,0,0,0,0,0,0,0, // Right exterior
    ]),

    // Row 21-35: Front counter area
    ...Array(6).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
    ]),

    // Counter
    ...Array(9).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark, // Counter
      C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
    ]),

    // Row 36-48: Floor space (transparent - floor shows through)
    ...Array(13).fill(Array(48).fill(0)),
  ],
};

/**
 * Bluff Mountain Outfitters - Roof Layer
 * Pitched green roof (hideable)
 */
export const bluffMountainRoof: PixelSprite = {
  name: 'bluff_mountain_outfitters_roof',
  width: 48,
  height: 48,
  pixels: [
    // Rows 1-8: Above awning (transparent)
    ...Array(8).fill(Array(48).fill(0)),

    // Row 9-12: Roof peak
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestDark,C.forestDark,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],

    // Row 13-20: Sloped roof sides
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,0,0,0,0,0],

    // Row 21-48: Rest of building covered by roof
    ...Array(28).fill([
      0,0,0,0,0,0,0,C.forestDark,C.forestGreen,C.leafGreen,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafLight,C.leafGreen,C.forestGreen,C.forestDark,0,0,0,0,0,0,0,
    ]),
  ],
};

// ============================================
// SMOKY MOUNTAIN DINER
// ============================================
// Classic trail town diner - hiker favorite for big breakfasts
// White building with red trim, neon sign

/**
 * Smoky Mountain Diner - Base/Floor Layer
 * Checkered diner floor
 */
export const smokyMountainDinerBase: PixelSprite = {
  name: 'smoky_mountain_diner_base',
  width: 48,
  height: 48,
  pixels: [
    // Row 1-8: Exterior (transparent)
    ...Array(8).fill(Array(48).fill(0)),

    // Row 9-48: Checkered floor pattern (classic diner)
    ...Array(40).fill(null).map((_, rowIndex) => {
      const row = [];
      for (let col = 0; col < 48; col++) {
        if (col < 8 || col >= 40) {
          row.push(0); // Exterior
        } else {
          // Checkerboard: alternating white and light gray
          const isEvenRow = rowIndex % 4 < 2;
          const isEvenCol = ((col - 8) % 4) < 2;
          const isWhite = isEvenRow === isEvenCol;
          row.push(isWhite ? C.white : C.grayLight);
        }
      }
      return row;
    }),
  ],
};

/**
 * Smoky Mountain Diner - South Wall (Front)
 * Large windows, front door, classic diner look
 */
export const smokyMountainDinerWallSouth: PixelSprite = {
  name: 'smoky_mountain_diner_wall_south',
  width: 48,
  height: 48,
  pixels: [
    // Row 1-6: Red trim at top
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0],
    [0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0],
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],

    // Row 7-8: Transition from red to white
    [0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0],
    [0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0],

    // Row 9-12: "DINER" sign
    [0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0],
    [0,0,C.danger,C.white,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.white,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.white,C.danger,C.danger,0,0],
    [0,0,C.danger,C.white,C.danger,C.dirtLight,C.danger,C.white,C.danger,C.dirtLight,C.white,C.danger,C.danger,C.danger,C.white,C.dirtLight,C.danger,C.dirtLight,C.dirtLight,C.white,C.danger,C.dirtLight,C.dirtLight,C.white,C.danger,C.dirtLight,C.dirtLight,C.dirtLight,C.danger,C.dirtLight,C.white,C.danger,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.danger,C.dirtLight,C.dirtLight,C.dirtLight,C.danger,C.danger,C.white,C.white,C.danger,C.danger,0,0],
    [0,0,C.danger,C.white,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.white,C.danger,C.white,C.danger,C.white,C.white,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.white,C.danger,C.danger,0,0],

    // Row 13: White wall continues
    [0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0],

    // Row 14-16: Top of windows
    [0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0],
    [0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0],
    [0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0],

    // Row 17-28: Large wraparound windows
    ...Array(12).fill([
      0,0,C.danger,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.danger,C.danger,0,0
    ]),

    // Row 29: Bottom of windows
    [0,0,C.danger,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.danger,C.danger,0,0],

    // Row 30-32: Wall between windows and door
    ...Array(3).fill([
      0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0
    ]),

    // Row 33-47: Front door (center) with glass
    ...Array(15).fill([
      0,0,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.danger,C.danger,0,0
    ]),

    // Row 48: Bottom trim
    [0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0],
  ],
};

/**
 * Smoky Mountain Diner - Interior Layer
 * Booths, counter, kitchen pass-through
 */
export const smokyMountainDinerInterior: PixelSprite = {
  name: 'smoky_mountain_diner_interior',
  width: 48,
  height: 48,
  pixels: [
    // Row 1-8: Exterior (transparent)
    ...Array(8).fill(Array(48).fill(0)),

    // Row 9-20: Back wall with kitchen window
    ...Array(12).fill([
      0,0,0,0,0,0,0,0,
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight, // Wall
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark, // Kitchen pass-through window
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,
      0,0,0,0,0,0,0,0,
    ]),

    // Row 21-32: Dining area with booths (red seats)
    ...Array(12).fill([
      0,0,0,0,0,0,0,0,
      C.danger,C.danger,C.danger,C.bark,0,0,0,0, // Left booth
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      0,0,0,0,C.bark,C.danger,C.danger,C.danger, // Right booth
      0,0,0,0,0,0,0,0,
    ]),

    // Row 33-40: Counter area (chrome/metal)
    ...Array(8).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight, // Counter
      C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
    ]),

    // Row 41-48: Floor space (transparent)
    ...Array(8).fill(Array(48).fill(0)),
  ],
};

/**
 * Smoky Mountain Diner - Roof Layer
 * Flat commercial roof with red trim
 */
export const smokyMountainDinerRoof: PixelSprite = {
  name: 'smoky_mountain_diner_roof',
  width: 48,
  height: 48,
  pixels: [
    // Row 1-8: Above building (transparent)
    ...Array(8).fill(Array(48).fill(0)),

    // Row 9-48: Flat roof (grayMedium) covering entire building
    ...Array(40).fill([
      0,0,0,0,0,0,C.danger,C.danger,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.danger,C.danger,0,0,0,0,0,0
    ]),
  ],
};

// ============================================
// ALPINE COURT MOTEL
// ============================================
// 50 Bridge Street - Budget hiker motel
// Simple single-story motel with parking

/**
 * Alpine Court Motel - Base/Floor Layer
 */
export const alpineCourtBase: PixelSprite = {
  name: 'alpine_court_motel_base',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

/**
 * Alpine Court Motel - South Wall (Front)
 * Simple motel facade with room doors
 */
export const alpineCourtWallSouth: PixelSprite = {
  name: 'alpine_court_motel_wall_south',
  width: 48,
  height: 48,
  pixels: [
    // Top section
    ...Array(8).fill(Array(48).fill(0)),

    // Sign area - "ALPINE COURT"
    [0,0,0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.warning,C.nearBlack,C.white,C.white,C.white,C.nearBlack,C.white,C.nearBlack,C.white,C.white,C.white,C.nearBlack,C.white,C.white,C.white,C.nearBlack,C.white,C.nearBlack,C.white,C.nearBlack,C.nearBlack,C.white,C.nearBlack,C.white,C.white,C.white,C.nearBlack,C.white,C.white,C.nearBlack,C.white,C.white,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.nearBlack,C.white,C.dirtLight,C.dirtLight,C.white,C.nearBlack,C.white,C.nearBlack,C.white,C.dirtLight,C.white,C.nearBlack,C.white,C.dirtLight,C.dirtLight,C.nearBlack,C.white,C.nearBlack,C.dirtLight,C.white,C.dirtLight,C.white,C.nearBlack,C.white,C.dirtLight,C.dirtLight,C.nearBlack,C.white,C.dirtLight,C.nearBlack,C.white,C.dirtLight,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],

    // Main wall - light blue motel color
    ...Array(4).fill([
      0,0,C.warning,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.warning,C.warning,0,0,0,0,0
    ]),

    // Windows for rooms
    ...Array(10).fill([
      0,0,C.warning,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.warning,C.warning,0,0,0,0,0
    ]),

    // Bottom wall section
    ...Array(4).fill([
      0,0,C.warning,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.warning,C.warning,0,0,0,0,0
    ]),

    // Doors
    ...Array(12).fill([
      0,0,C.warning,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.pantsBrown,C.pantsBrown,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.warning,C.warning,0,0,0,0,0
    ]),

    // Bottom trim
    [0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
  ],
};

/**
 * Alpine Court Motel - Interior Layer
 * Simple motel rooms with beds
 */
export const alpineCourtInterior: PixelSprite = {
  name: 'alpine_court_motel_interior',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(20).fill(Array(48).fill(0)), // Upper area

    // Beds in rooms (simple rectangles)
    ...Array(20).fill([
      0,0,0,0,0,0,0,0,
      C.danger,C.danger,C.danger,0,0,0,0,0, // Room 1 bed
      0,0,0,0,C.danger,C.danger,C.danger,0, // Room 2 bed
      0,0,0,0,0,0,0,0,
      0,C.danger,C.danger,C.danger,0,0,0,0, // Room 3 bed
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

/**
 * Alpine Court Motel - Roof Layer
 * Simple flat motel roof
 */
export const alpineCourtRoof: PixelSprite = {
  name: 'alpine_court_motel_roof',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,0,0,0,C.warning,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,C.warning,0,0,0,0,0,0
    ]),
  ],
};

// ============================================
// DOLLAR GENERAL
// ============================================
// Key resupply point - grocery, first aid, household items

export const dollarGeneralBase: PixelSprite = {
  name: 'dollar_general_base',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,0,0,0,0,0,
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,
      C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

export const dollarGeneralWallSouth: PixelSprite = {
  name: 'dollar_general_wall_south',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Yellow Dollar General sign
    [0,0,0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],

    // White walls with large windows
    ...Array(4).fill([
      0,0,C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0
    ]),

    // Large storefront windows
    ...Array(14).fill([
      0,0,C.warning,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0
    ]),

    // Bottom wall
    ...Array(4).fill([
      0,0,C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0
    ]),

    // Doors
    ...Array(12).fill([
      0,0,C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0
    ]),

    [0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0],
  ],
};

export const dollarGeneralInterior: PixelSprite = {
  name: 'dollar_general_interior',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Shelving aisles
    ...Array(30).fill([
      0,0,0,0,0,0,0,0,
      C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0, // Aisle 1
      C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0, // Aisle 2
      C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0, // Aisle 3
      C.grayMedium,C.grayMedium,C.grayMedium,0,0,0,0,0, // Aisle 4
      0,0,0,0,0,0,0,0,
    ]),

    // Checkout counter (bottom)
    ...Array(10).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark, // Counter
      C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

export const dollarGeneralRoof: PixelSprite = {
  name: 'dollar_general_roof',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,0,0,0,C.warning,C.warning,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.warning,C.warning,0,0,0,0,0,0
    ]),
  ],
};

// ============================================
// ELMER'S SUNNYBANK INN
// ============================================
// Famous hiker hostel - 26 Walnut St

export const sunnybankBase: PixelSprite = {
  name: 'sunnybank_inn_base',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

export const sunnybankWallSouth: PixelSprite = {
  name: 'sunnybank_inn_wall_south',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Sign "SUNNYBANK INN"
    [0,0,0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.warning,C.white,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.white,C.white,C.forestDark,C.white,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.white,C.forestDark,C.forestDark,C.forestDark,C.white,C.white,C.forestDark,C.white,C.white,C.forestDark,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.warning,C.white,C.forestDark,C.dirtLight,C.dirtLight,C.dirtLight,C.white,C.forestDark,C.dirtLight,C.forestDark,C.white,C.forestDark,C.white,C.white,C.forestDark,C.white,C.forestDark,C.white,C.forestDark,C.dirtLight,C.forestDark,C.white,C.forestDark,C.dirtLight,C.dirtLight,C.white,C.white,C.forestDark,C.white,C.white,C.forestDark,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0,0],
    [0,0,0,0,C.warning,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.warning,C.warning,0,0,0,0,0,0],

    // Yellow house walls
    ...Array(6).fill([
      0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0
    ]),

    // Windows
    ...Array(10).fill([
      0,0,0,C.warning,C.warning,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.warning,C.warning,C.warning,C.warning,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.warning,C.warning,C.warning,C.warning,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0
    ]),

    // Bottom wall with porch
    ...Array(6).fill([
      0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0
    ]),

    // Front door
    ...Array(10).fill([
      0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0
    ]),

    [0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0],
  ],
};

export const sunnybankInterior: PixelSprite = {
  name: 'sunnybank_inn_interior',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Bunk beds
    ...Array(40).fill([
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,0,C.bark,C.bark,C.bark,0, // Bunk 1 & 2
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,0,C.bark,C.bark,C.bark,0, // Bunk 3 & 4
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

export const sunnybankRoof: PixelSprite = {
  name: 'sunnybank_inn_roof',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Pitched roof
    ...Array(10).fill([
      0,0,0,0,0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0,0
    ]),

    ...Array(30).fill([
      0,0,0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0,0,0,0,0,0
    ]),
  ],
};

// ============================================
// HOT SPRINGS WELCOME CENTER
// ============================================
// 106 Bridge St - Info center

export const welcomeCenterBase: PixelSprite = {
  name: 'welcome_center_base',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

export const welcomeCenterWallSouth: PixelSprite = {
  name: 'welcome_center_wall_south',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Sign "WELCOME CENTER"
    [0,0,0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0,0],
    [0,0,0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0,0],
    [0,0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0,0],

    // White building
    ...Array(8).fill([
      0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0
    ]),

    // Large info windows
    ...Array(12).fill([
      0,0,0,C.forestGreen,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0
    ]),

    // Bottom wall
    ...Array(4).fill([
      0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0
    ]),

    // Door
    ...Array(12).fill([
      0,0,0,C.forestGreen,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.forestGreen,C.forestGreen,0,0,0,0,0
    ]),

    [0,0,0,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,0,0,0,0,0],
  ],
};

export const welcomeCenterInterior: PixelSprite = {
  name: 'welcome_center_interior',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),

    // Info desk and display racks
    ...Array(20).fill([
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark, // Back wall displays
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      0,0,0,0,0,0,0,0,
    ]),

    // Front desk
    ...Array(20).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark, // Desk
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,
    ]),
  ],
};

export const welcomeCenterRoof: PixelSprite = {
  name: 'welcome_center_roof',
  width: 48,
  height: 48,
  pixels: [
    ...Array(8).fill(Array(48).fill(0)),
    ...Array(40).fill([
      0,0,0,C.forestGreen,C.forestGreen,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.forestGreen,C.forestGreen,0,0,0,0,0
    ]),
  ],
};

// ============================================
// HOT SPRINGS RESORT & SPA
// ============================================
// 315 Bridge Street - Famous natural hot mineral springs
// Larger building (64x64px) with hot springs pools, lodging, camping

/**
 * Hot Springs Resort & Spa - Base/Floor Layer
 * Stone tile floor with hot springs pool area
 */
export const hotSpringsResortBase: PixelSprite = {
  name: 'hot_springs_resort_base',
  width: 64,
  height: 64,
  pixels: [
    // Row 1-8: Exterior ground
    ...Array(8).fill(Array(64).fill(0)),

    // Row 9-48: Main floor area (stone tile)
    ...Array(40).fill([
      0,0,0,0,0,0,0,0, // Left exterior
      C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium, // Stone tiles
      C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,
      C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,
      C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,
      C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,
      C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,
      0,0,0,0,0,0,0,0, // Right exterior
    ]),
  ],
};

/**
 * Hot Springs Resort & Spa - South Wall (Front)
 * Rustic lodge with "HOT SPRINGS" sign and large windows
 */
export const hotSpringsResortWallSouth: PixelSprite = {
  name: 'hot_springs_resort_wall_south',
  width: 64,
  height: 64,
  pixels: [
    // Row 1-2: Sky/roof overhang
    ...Array(2).fill(Array(64).fill(0)),

    // Row 3-6: Large "HOT SPRINGS" sign (orange/warning color)
    [0,0,0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.warning,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.nearBlack,C.nearBlack,C.warning,C.warning,C.warning,C.warning,C.nearBlack,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,0,0,0,0,0,0,0,0],

    // Row 7-8: Top trim
    ...Array(2).fill([
      0,0,0,0,0,0,C.forestGreen,C.forestGreen,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.forestGreen,C.forestGreen,0,0,0,0,0,0
    ]),

    // Row 9-20: Upper wall with windows
    ...Array(12).fill([
      0,0,0,0,0,0,C.forestGreen,C.forestGreen,
      C.bark,C.bark,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.bark,C.bark,
      C.forestGreen,C.forestGreen,0,0,0,0,0,0
    ]),

    // Row 21-35: Middle wall section
    ...Array(15).fill([
      0,0,0,0,0,0,C.forestGreen,C.forestGreen,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.forestGreen,C.forestGreen,0,0,0,0,0,0
    ]),

    // Row 36-47: Lower wall with entrance door
    ...Array(4).fill([
      0,0,0,0,0,0,C.forestGreen,C.forestGreen,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.forestGreen,C.forestGreen,0,0,0,0,0,0
    ]),
    ...Array(8).fill([
      0,0,0,0,0,0,C.forestGreen,C.forestGreen,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,
      C.forestGreen,C.forestGreen,0,0,0,0,0,0
    ]),

    // Row 48-56: Bottom base
    ...Array(9).fill([
      0,0,0,0,0,0,C.forestGreen,C.forestGreen,
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,
      C.forestGreen,C.forestGreen,0,0,0,0,0,0
    ]),

    // Row 57-64: Ground
    ...Array(8).fill(Array(64).fill(0)),
  ],
};

/**
 * Hot Springs Resort & Spa - Interior Layer
 * Hot springs pools, changing benches, relaxation area
 */
export const hotSpringsResortInterior: PixelSprite = {
  name: 'hot_springs_resort_interior',
  width: 64,
  height: 64,
  pixels: [
    // Row 1-8: Exterior
    ...Array(8).fill(Array(64).fill(0)),

    // Row 9-18: Upper area with benches
    ...Array(10).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,
      C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,0,0,0,0,0,0, // Left bench
      0,0,0,0,0,0,0,0,0,0,0,0,
      C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,0,0,0,0, // Right bench
      0,0,0,0,0,0,0,0
    ]),

    // Row 19-35: Hot springs pool area (steamy blue water)
    ...Array(17).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,
      C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue, // Pool 1
      C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue,C.waterBlue,C.skyBlue, // Pool 2
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0
    ]),

    // Row 36-48: Lower changing area with benches
    ...Array(13).fill([
      0,0,0,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0,0,0,0,
      C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,0,0,0,0,0,0, // Bench
      0,0,0,0,0,0,0,0,0,0,0,0,
      C.bark,C.barkDark,C.bark,C.barkDark,C.bark,C.barkDark,0,0,0,0, // Bench
      0,0,0,0,0,0,0,0
    ]),

    // Row 49-64: Exterior
    ...Array(16).fill(Array(64).fill(0)),
  ],
};

/**
 * Hot Springs Resort & Spa - Roof Layer
 * Green pitched roof
 */
export const hotSpringsResortRoof: PixelSprite = {
  name: 'hot_springs_resort_roof',
  width: 64,
  height: 64,
  pixels: [
    // Row 1-8: Above roof
    ...Array(8).fill(Array(64).fill(0)),

    // Row 9-56: Green roof covering the building
    ...Array(48).fill([
      0,0,0,0,C.forestGreen,C.forestGreen,C.leafGreen,C.leafGreen,
      C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,
      C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,
      C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,
      C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,
      C.leafGreen,C.leafGreen,C.forestGreen,C.forestGreen,0,0,0,0
    ]),

    // Row 57-64: Below roof
    ...Array(8).fill(Array(64).fill(0)),
  ],
};

// ============================================
// SPRITE COLLECTION
// ============================================

export const HOT_SPRINGS_BUILDING_SPRITES = {
  // Bluff Mountain Outfitters (layered)
  bluffMountainBase,
  bluffMountainWallSouth,
  bluffMountainInterior,
  bluffMountainRoof,

  // Smoky Mountain Diner (layered)
  smokyMountainDinerBase,
  smokyMountainDinerWallSouth,
  smokyMountainDinerInterior,
  smokyMountainDinerRoof,

  // Alpine Court Motel (layered)
  alpineCourtBase,
  alpineCourtWallSouth,
  alpineCourtInterior,
  alpineCourtRoof,

  // Dollar General (layered)
  dollarGeneralBase,
  dollarGeneralWallSouth,
  dollarGeneralInterior,
  dollarGeneralRoof,

  // Elmer's Sunnybank Inn (layered)
  sunnybankBase,
  sunnybankWallSouth,
  sunnybankInterior,
  sunnybankRoof,

  // Hot Springs Welcome Center (layered)
  welcomeCenterBase,
  welcomeCenterWallSouth,
  welcomeCenterInterior,
  welcomeCenterRoof,

  // Hot Springs Resort & Spa (layered)
  hotSpringsResortBase,
  hotSpringsResortWallSouth,
  hotSpringsResortInterior,
  hotSpringsResortRoof,
};
