// ============================================
// TRAIL LEGS - Lighting Effect Sprites
// ============================================
// Night sky, campfire glow, headlamp, stars, moon phases, etc.

import { PixelSprite } from './types';
import { C } from './palette';

const _ = C.transparent;

// Full moon
const moonFull: PixelSprite = {
  name: 'moon_full',
  width: 16,
  height: 16,
  pixels: [
    [_,_,_,_,_,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,_,_,_,_,_],
    [_,_,_,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayLight,_,_,_],
    [_,_,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,_,_],
    [_,C.grayLight,C.white,C.white,C.white,C.grayLight,C.white,C.white,C.white,C.white,C.grayLight,C.white,C.white,C.white,C.grayLight,_],
    [_,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,_],
    [C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.grayLight],
    [C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.grayLight],
    [C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight],
    [C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.white,C.white,C.grayLight],
    [C.grayLight,C.white,C.white,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayLight,C.white,C.white,C.grayLight],
    [C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight],
    [_,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,_],
    [_,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.grayLight,_],
    [_,_,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,_,_],
    [_,_,_,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight,C.grayLight,_,_,_],
    [_,_,_,_,_,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,_,_,_,_,_],
  ],
};

// Crescent moon
const moonCrescent: PixelSprite = {
  name: 'moon_crescent',
  width: 12,
  height: 12,
  pixels: [
    [_,_,_,_,_,C.grayLight,C.grayLight,C.grayLight,_,_,_,_],
    [_,_,_,C.grayLight,C.grayLight,C.white,C.white,C.white,C.grayLight,_,_,_],
    [_,_,C.grayLight,C.white,C.white,C.white,C.white,_,_,_,_,_],
    [_,C.grayLight,C.white,C.white,C.white,C.white,_,_,_,_,_,_],
    [_,C.grayLight,C.white,C.white,C.white,_,_,_,_,_,_,_],
    [C.grayLight,C.white,C.white,C.white,C.white,_,_,_,_,_,_,_],
    [C.grayLight,C.white,C.white,C.white,C.white,_,_,_,_,_,_,_],
    [_,C.grayLight,C.white,C.white,C.white,_,_,_,_,_,_,_],
    [_,C.grayLight,C.white,C.white,C.white,C.white,_,_,_,_,_,_],
    [_,_,C.grayLight,C.white,C.white,C.white,C.white,_,_,_,_,_],
    [_,_,_,C.grayLight,C.grayLight,C.white,C.white,C.white,C.grayLight,_,_,_],
    [_,_,_,_,_,C.grayLight,C.grayLight,C.grayLight,_,_,_,_],
  ],
};

// Star cluster
const starCluster: PixelSprite = {
  name: 'star_cluster',
  width: 16,
  height: 16,
  pixels: [
    [_,_,_,C.white,_,_,_,_,_,_,_,_,_,_,C.white,_],
    [_,_,_,_,_,_,_,_,C.grayLight,_,_,_,_,_,_,_],
    [_,_,_,_,_,C.white,_,_,_,_,_,_,C.grayLight,_,_,_],
    [_,C.grayLight,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.white,_,_,C.white,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.grayLight],
    [_,_,C.white,_,_,_,_,_,_,_,_,_,_,C.white,_,_],
    [_,_,_,_,_,_,_,_,_,C.grayLight,_,_,_,_,_,_],
    [_,_,_,_,C.grayLight,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.white,_,_,_,_,C.white,_,_,_,_],
    [C.white,_,_,_,_,_,_,_,_,_,_,_,_,_,C.grayLight,_],
    [_,_,_,_,_,_,_,_,C.white,_,_,_,_,_,_,_],
    [_,_,_,C.grayLight,_,_,_,_,_,_,_,_,_,_,_,C.white],
    [_,_,_,_,_,_,C.grayLight,_,_,_,C.grayLight,_,_,_,_,_],
    [_,C.white,_,_,_,_,_,_,_,_,_,_,_,C.white,_,_],
    [_,_,_,_,_,C.white,_,_,_,C.white,_,_,_,_,_,_],
  ],
};

// Campfire glow (overlay effect)
const campfireGlow: PixelSprite = {
  name: 'campfire_glow',
  width: 24,
  height: 24,
  pixels: [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_],
    [_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_],
    [_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_],
    [_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_],
    [_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ],
};

// Headlamp beam (cone of light)
const headlampBeam: PixelSprite = {
  name: 'headlamp_beam',
  width: 20,
  height: 16,
  pixels: [
    [_,_,_,_,C.highlight,C.highlight,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,C.highlight,C.highlight,C.highlight,C.highlight,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,C.highlight,C.highlight,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_,_,_,_,_,_],
    [_,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_,_,_,_,_],
    [C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_,_,_,_],
    [C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_,_,_],
    [C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_,_],
    [C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_,_],
    [C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_,_],
    [_,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_,_],
    [_,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_,_],
    [_,_,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_,_],
    [_,_,_,C.highlight,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,_],
    [_,_,_,_,_,C.highlight,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight],
    [_,_,_,_,_,_,_,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight,C.highlight],
  ],
};

// Night overlay tint (dark blue overlay)
const nightOverlay: PixelSprite = {
  name: 'night_overlay',
  width: 16,
  height: 16,
  pixels: [
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
    [C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep],
  ],
};

// Sunrise/sunset glow
const sunsetGlow: PixelSprite = {
  name: 'sunset_glow',
  width: 32,
  height: 12,
  pixels: [
    [_,_,_,_,_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,C.warning,_,_,_,_,_,_],
    [_,_,_,_,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.white,C.white,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,_,_,_,_,_],
    [_,_,C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning,_,_],
    [C.warning,C.warning,C.warning,C.danger,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.danger,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.warning,C.warning,C.warning],
    [C.warning,C.danger,C.danger,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.danger,C.danger,C.warning,C.warning],
    [C.warning,C.danger,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.danger,C.warning,C.warning],
    [C.warning,C.warning,C.danger,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.danger,C.warning,C.warning,_],
    [_,C.warning,C.warning,C.danger,C.danger,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.danger,C.danger,C.warning,C.warning,_,_],
    [_,_,C.warning,C.warning,C.danger,C.danger,C.highlight,C.highlight,C.highlight,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.highlight,C.highlight,C.highlight,C.danger,C.danger,C.warning,C.warning,_,_,_],
  ],
};

// Firefly
const firefly: PixelSprite = {
  name: 'firefly',
  width: 4,
  height: 4,
  pixels: [
    [_,C.highlight,C.highlight,_],
    [C.highlight,C.warning,C.warning,C.highlight],
    [C.highlight,C.warning,C.warning,C.highlight],
    [_,C.highlight,C.highlight,_],
  ],
};

// Lantern
const lantern: PixelSprite = {
  name: 'lantern',
  width: 8,
  height: 12,
  pixels: [
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.warning,C.highlight,C.highlight,C.warning,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.warning,C.highlight,C.highlight,C.warning,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.warning,C.highlight,C.highlight,C.warning,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_],
    [_,_,_,C.grayDark,C.grayDark,_,_,_],
    [_,_,_,C.grayDark,C.grayDark,_,_,_],
  ],
};

// Milky way streak
const milkyWay: PixelSprite = {
  name: 'milky_way',
  width: 32,
  height: 8,
  pixels: [
    [_,_,C.grayLight,_,_,_,C.white,_,_,_,_,C.grayLight,_,_,_,C.white,_,_,C.grayLight,_,_,_,_,C.white,_,_,_,C.grayLight,_,_,_,_],
    [_,C.grayLight,C.grayLight,C.white,_,C.grayLight,C.grayLight,C.grayLight,_,_,C.white,C.grayLight,C.grayLight,_,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,_,_,C.grayLight,C.grayLight,C.white,_,C.grayLight,C.grayLight,C.grayLight,_,_,_,C.white],
    [C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight],
    [C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight],
    [C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight],
    [C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.white,C.grayLight,C.grayLight,C.grayLight,C.white,C.grayLight],
    [_,C.grayLight,C.grayLight,C.grayLight,_,C.grayLight,C.grayLight,C.white,_,C.grayLight,C.grayLight,C.white,C.grayLight,_,C.white,C.grayLight,C.grayLight,_,C.grayLight,C.white,C.grayLight,_,C.white,C.grayLight,C.grayLight,_,C.grayLight,C.grayLight,C.white,_,C.grayLight,C.grayLight],
    [_,_,C.white,_,_,_,C.grayLight,_,_,_,C.white,_,_,_,_,C.grayLight,_,_,_,C.grayLight,_,_,_,C.grayLight,_,_,_,C.white,_,_,_,C.grayLight],
  ],
};

export const LIGHTING_SPRITES = {
  moonFull,
  moonCrescent,
  starCluster,
  campfireGlow,
  headlampBeam,
  nightOverlay,
  sunsetGlow,
  firefly,
  lantern,
  milkyWay,
};
