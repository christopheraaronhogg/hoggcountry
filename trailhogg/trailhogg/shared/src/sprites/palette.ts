// ============================================
// TRAIL LEGS - Color Palette
// ============================================
// A cohesive 32-color palette designed for the AT hiking experience
// Organized by category for easy reference

import { ColorPalette } from './types';

/**
 * Master palette for Trail Legs
 * Index 0 is always transparent
 *
 * Categories:
 * 0     : Transparent
 * 1-4   : Skin tones
 * 5-8   : Clothing (hiker)
 * 9-12  : Forest greens
 * 13-16 : Earth/browns (trail, trees)
 * 17-20 : Grays (rocks, blazes)
 * 21-24 : Blues (water, sky, rain)
 * 25-28 : UI accent colors
 * 29-31 : Special (highlights, shadows)
 */
export const TRAIL_LEGS_PALETTE: ColorPalette = {
  name: 'trail_legs',
  colors: [
    // 0: Transparent
    'transparent',

    // 1-4: Skin tones (light to dark)
    '#F5D6BA',  // 1: Light skin
    '#E5B896',  // 2: Medium skin
    '#C69C6D',  // 3: Tan skin
    '#8B6914',  // 4: Dark skin shadow

    // 5-8: Hiker clothing
    '#4A7D5A',  // 5: Trail green (shirt) - matches site accent
    '#3D6B4A',  // 6: Trail green shadow
    '#6B4423',  // 7: Hiking brown (pants)
    '#553518',  // 8: Hiking brown shadow

    // 9-12: Forest greens (foliage)
    '#2D5A27',  // 9: Dark forest green
    '#3E7A34',  // 10: Forest green
    '#5A9A4A',  // 11: Leaf green
    '#7DBF6A',  // 12: Light leaf green

    // 13-16: Earth tones (trail, tree trunks)
    '#3D2817',  // 13: Dark bark
    '#5C4033',  // 14: Bark brown
    '#8B7355',  // 15: Trail dirt
    '#A69076',  // 16: Light dirt/sand

    // 17-20: Grays (rocks, blazes)
    '#3A3A3A',  // 17: Dark gray
    '#5A5A5A',  // 18: Medium gray
    '#8A8A8A',  // 19: Light gray
    '#FFFFFF',  // 20: White (blazes)

    // 21-24: Blues (water, sky, weather)
    '#1A3A5C',  // 21: Deep water
    '#2E5A8C',  // 22: Water blue
    '#5A9AD4',  // 23: Sky blue
    '#87CEEB',  // 24: Light sky/rain

    // 25-28: UI accent colors
    '#C94C4C',  // 25: Danger red
    '#E8A54C',  // 26: Warning orange
    '#5CB85C',  // 27: Success green
    '#5BC0DE',  // 28: Info blue

    // 29-31: Special
    '#FFFEF0',  // 29: Warm highlight
    '#1A1A1A',  // 30: Near black
    '#2A2A2A',  // 31: Dark panel
  ],

  colorNames: {
    transparent: 0,

    // Skin
    skinLight: 1,
    skinMedium: 2,
    skinTan: 3,
    skinShadow: 4,

    // Clothing
    shirtGreen: 5,
    shirtGreenShadow: 6,
    pantsBrown: 7,
    pantsBrownShadow: 8,

    // Forest
    forestDark: 9,
    forestGreen: 10,
    leafGreen: 11,
    leafLight: 12,

    // Earth
    barkDark: 13,
    bark: 14,
    trailDirt: 15,
    dirtLight: 16,

    // Gray
    grayDark: 17,
    grayMedium: 18,
    grayLight: 19,
    white: 20,

    // Blues
    waterDeep: 21,
    waterBlue: 22,
    skyBlue: 23,
    skyLight: 24,

    // UI
    danger: 25,
    warning: 26,
    success: 27,
    info: 28,

    // Special
    highlight: 29,
    nearBlack: 30,
    darkPanel: 31,
  }
};

// Shorthand for common colors
export const C = TRAIL_LEGS_PALETTE.colorNames;

// Helper to get hex color from index
export function getColor(index: number): string {
  return TRAIL_LEGS_PALETTE.colors[index] || 'transparent';
}

// Helper to get index from name
export function getColorIndex(name: keyof typeof C): number {
  return C[name];
}
