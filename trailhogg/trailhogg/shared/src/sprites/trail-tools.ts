// ============================================
// TRAIL LEGS - Trail Maintenance Equipment Sprites
// ============================================
// Tools used by trail maintainers, ridgerunners, and work crews

import { PixelSprite } from './types';
import { C } from './palette';

const _ = C.transparent;

// Pulaski (combination axe and hoe)
const pulaski: PixelSprite = {
  name: 'pulaski',
  width: 8,
  height: 20,
  pixels: [
    [_,_,_,_,_,C.grayDark,C.grayDark,_],
    [_,_,_,_,C.grayDark,C.grayMedium,C.grayDark,_],
    [_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayMedium,C.bark,C.bark,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.bark,C.bark,C.grayDark,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.bark,C.bark,_,_,_],
    [_,_,_,C.barkDark,C.barkDark,_,_,_],
    [_,_,_,C.barkDark,C.barkDark,_,_,_],
  ],
};

// McLeod (trail rake)
const mcleod: PixelSprite = {
  name: 'mcleod',
  width: 12,
  height: 18,
  pixels: [
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,_,C.grayMedium,_,C.grayMedium,_,C.grayMedium,_,C.grayMedium,_,C.grayDark],
    [_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.bark,C.bark,_,_,_,_,_],
    [_,_,_,_,_,C.barkDark,C.barkDark,_,_,_,_,_],
    [_,_,_,_,_,C.barkDark,C.barkDark,_,_,_,_,_],
  ],
};

// Crosscut saw
const crosscutSaw: PixelSprite = {
  name: 'crosscut_saw',
  width: 24,
  height: 6,
  pixels: [
    [C.bark,C.bark,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,C.bark,C.bark],
    [C.barkDark,C.bark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.bark,C.barkDark],
    [_,C.bark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.bark,_],
    [_,_,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,C.grayMedium,C.grayLight,_,_],
    [_,_,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,C.grayDark,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ],
};

// Rock bar (pry bar for moving rocks)
const rockBar: PixelSprite = {
  name: 'rock_bar',
  width: 4,
  height: 20,
  pixels: [
    [_,C.grayDark,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [_,C.grayDark,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayDark,_],
  ],
};

// Wheelbarrow
const wheelbarrow: PixelSprite = {
  name: 'wheelbarrow',
  width: 20,
  height: 12,
  pixels: [
    [_,_,_,_,_,_,_,_,C.bark,C.bark,C.bark,C.bark,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,C.bark,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,C.bark,_,_,_,_,_,_],
    [_,_,_,_,_,C.grayDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.grayDark,_,_,_,_,_],
    [_,_,_,_,C.grayDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.grayDark,_,_,_,_],
    [_,_,_,C.grayDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.grayDark,_,_,_],
    [_,_,C.grayDark,C.forestGreen,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.grayDark,_,_],
    [_,C.grayDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.grayDark,_],
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [_,_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_,_,_,_,C.bark],
    [_,_,_,C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_,_,C.bark,_],
    [_,_,_,C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_,C.bark,_,_],
    [_,_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_,C.bark,_,_,_],
  ],
};

// Chainsaw
const chainsaw: PixelSprite = {
  name: 'chainsaw',
  width: 18,
  height: 10,
  pixels: [
    [_,_,_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,_,_,_,_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.grayDark,C.grayDark,_],
    [_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.warning,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.warning,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayMedium,C.grayDark,C.grayDark,_,_,_,_,_,_,_,C.grayDark,_,_],
    [_,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,C.grayDark,C.grayDark,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ],
};

// Paint can (for trail blazes)
const paintCan: PixelSprite = {
  name: 'paint_can',
  width: 8,
  height: 10,
  pixels: [
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.white,C.white,C.white,C.white,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.white,C.white,C.white,C.white,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.white,C.white,C.white,C.white,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.white,C.white,C.white,C.white,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.white,C.white,C.white,C.white,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.white,C.white,C.white,C.white,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_],
  ],
};

// Loppers (for brush cutting)
const loppers: PixelSprite = {
  name: 'loppers',
  width: 6,
  height: 18,
  pixels: [
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,_,_,C.grayMedium,C.grayDark],
    [_,C.grayDark,_,_,C.grayDark,_],
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.danger,C.danger,_,_],
    [_,_,C.barkDark,C.barkDark,_,_],
    [_,_,C.barkDark,C.barkDark,_,_],
  ],
};

// Trail sign being installed
const signInstall: PixelSprite = {
  name: 'sign_install',
  width: 16,
  height: 16,
  pixels: [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.white,C.white,C.white,C.white,C.white,C.white,C.barkDark,C.bark,_,_,_],
    [_,_,_,C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark,_,_,_],
    [_,_,_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_,_,_],
    [_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,C.bark,C.bark,_,_,C.grayDark,C.grayMedium,C.grayDark,_,_],
    [_,_,_,_,_,_,_,C.bark,C.bark,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,_,_,_,_,_,C.bark,C.bark,_,_,C.grayDark,C.grayMedium,C.grayDark,_,_],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.barkDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
    [C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt],
  ],
};

// Hard hat
const hardHat: PixelSprite = {
  name: 'hard_hat',
  width: 10,
  height: 6,
  pixels: [
    [_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_,_],
    [_,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,_],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning],
    [_,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,_],
  ],
};

export const TRAIL_TOOL_SPRITES = {
  pulaski,
  mcleod,
  crosscutSaw,
  rockBar,
  wheelbarrow,
  chainsaw,
  paintCan,
  loppers,
  signInstall,
  hardHat,
};
