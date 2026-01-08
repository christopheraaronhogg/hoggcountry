// ============================================
// TRAIL LEGS - Game UI Element Sprites
// ============================================
// Dialog boxes, health bars, inventory slots, and game interface elements

import { PixelSprite } from './types';
import { C } from './palette';

const _ = C.transparent;

// Health bar frame (horizontal)
const healthBarFrame: PixelSprite = {
  name: 'health_bar_frame',
  width: 32,
  height: 8,
  pixels: [
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
  ],
};

// Health bar fill segment (green)
const healthBarFillGreen: PixelSprite = {
  name: 'health_bar_fill_green',
  width: 4,
  height: 4,
  pixels: [
    [C.success,C.success,C.success,C.success],
    [C.success,C.leafGreen,C.leafGreen,C.success],
    [C.success,C.leafGreen,C.leafGreen,C.success],
    [C.forestDark,C.forestDark,C.forestDark,C.forestDark],
  ],
};

// Health bar fill segment (yellow - warning)
const healthBarFillYellow: PixelSprite = {
  name: 'health_bar_fill_yellow',
  width: 4,
  height: 4,
  pixels: [
    [C.warning,C.warning,C.warning,C.warning],
    [C.warning,C.highlight,C.highlight,C.warning],
    [C.warning,C.highlight,C.highlight,C.warning],
    [C.barkDark,C.barkDark,C.barkDark,C.barkDark],
  ],
};

// Health bar fill segment (red - critical)
const healthBarFillRed: PixelSprite = {
  name: 'health_bar_fill_red',
  width: 4,
  height: 4,
  pixels: [
    [C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.warning,C.warning,C.danger],
    [C.danger,C.warning,C.warning,C.danger],
    [C.barkDark,C.barkDark,C.barkDark,C.barkDark],
  ],
};

// Inventory slot
const inventorySlot: PixelSprite = {
  name: 'inventory_slot',
  width: 20,
  height: 20,
  pixels: [
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.darkPanel,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
  ],
};

// Dialog box corner (top-left)
const dialogCornerTL: PixelSprite = {
  name: 'dialog_corner_tl',
  width: 8,
  height: 8,
  pixels: [
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight],
    [C.grayDark,C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white],
    [C.grayDark,C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white],
    [C.grayDark,C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white],
    [C.grayDark,C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white],
    [C.grayDark,C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.white],
  ],
};

// Dialog arrow (speech bubble pointer)
const dialogArrow: PixelSprite = {
  name: 'dialog_arrow',
  width: 8,
  height: 8,
  pixels: [
    [_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,C.white,C.white,C.white,C.white,_,_],
    [_,C.white,C.white,C.white,C.white,C.white,C.white,_],
    [C.grayLight,C.white,C.white,C.white,C.white,C.white,C.white,C.grayLight],
    [C.grayMedium,C.grayLight,C.white,C.white,C.white,C.white,C.grayLight,C.grayMedium],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
  ],
};

// Heart icon (lives/health)
const heartIcon: PixelSprite = {
  name: 'heart_icon',
  width: 10,
  height: 10,
  pixels: [
    [_,_,C.danger,C.danger,_,_,C.danger,C.danger,_,_],
    [_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.highlight,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_],
    [_,_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_,_],
    [_,_,_,C.danger,C.danger,C.danger,C.danger,_,_,_],
    [_,_,_,_,C.danger,C.danger,_,_,_,_],
  ],
};

// Empty heart (lost lives)
const heartEmpty: PixelSprite = {
  name: 'heart_empty',
  width: 10,
  height: 10,
  pixels: [
    [_,_,C.grayDark,C.grayDark,_,_,C.grayDark,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,_,_],
    [_,_,_,C.grayDark,C.grayMedium,C.grayMedium,C.grayDark,_,_,_],
    [_,_,_,_,C.grayDark,C.grayDark,_,_,_,_],
  ],
};

// Coin (for currency)
const coin: PixelSprite = {
  name: 'coin',
  width: 10,
  height: 10,
  pixels: [
    [_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_],
    [_,_,C.warning,C.warning,C.highlight,C.highlight,C.warning,C.warning,_,_],
    [_,C.warning,C.warning,C.highlight,C.warning,C.warning,C.highlight,C.warning,C.warning,_],
    [C.warning,C.warning,C.highlight,C.warning,C.warning,C.warning,C.warning,C.highlight,C.warning,C.warning],
    [C.warning,C.highlight,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.highlight,C.warning],
    [C.warning,C.highlight,C.warning,C.warning,C.warning,C.warning,C.warning,C.warning,C.highlight,C.warning],
    [C.warning,C.warning,C.highlight,C.warning,C.warning,C.warning,C.warning,C.highlight,C.warning,C.warning],
    [_,C.warning,C.warning,C.highlight,C.warning,C.warning,C.highlight,C.warning,C.warning,_],
    [_,_,C.warning,C.warning,C.highlight,C.highlight,C.warning,C.warning,_,_],
    [_,_,_,C.warning,C.warning,C.warning,C.warning,_,_,_],
  ],
};

// Arrow up
const arrowUp: PixelSprite = {
  name: 'arrow_up',
  width: 8,
  height: 8,
  pixels: [
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,C.white,C.white,C.white,C.white,_,_],
    [_,C.white,C.white,C.white,C.white,C.white,C.white,_],
    [C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white],
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
  ],
};

// Arrow down
const arrowDown: PixelSprite = {
  name: 'arrow_down',
  width: 8,
  height: 8,
  pixels: [
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
    [_,_,_,C.white,C.white,_,_,_],
    [C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white],
    [_,C.white,C.white,C.white,C.white,C.white,C.white,_],
    [_,_,C.white,C.white,C.white,C.white,_,_],
    [_,_,_,C.white,C.white,_,_,_],
  ],
};

// Checkmark (completed)
const checkmark: PixelSprite = {
  name: 'checkmark',
  width: 10,
  height: 10,
  pixels: [
    [_,_,_,_,_,_,_,_,C.success,C.success],
    [_,_,_,_,_,_,_,C.success,C.success,_],
    [_,_,_,_,_,_,C.success,C.success,_,_],
    [_,_,_,_,_,C.success,C.success,_,_,_],
    [_,_,_,_,C.success,C.success,_,_,_,_],
    [C.success,_,_,C.success,C.success,_,_,_,_,_],
    [C.success,C.success,C.success,C.success,_,_,_,_,_,_],
    [_,C.success,C.success,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_],
  ],
};

// X mark (failed/closed)
const xMark: PixelSprite = {
  name: 'x_mark',
  width: 10,
  height: 10,
  pixels: [
    [C.danger,C.danger,_,_,_,_,_,_,C.danger,C.danger],
    [C.danger,C.danger,C.danger,_,_,_,_,C.danger,C.danger,C.danger],
    [_,C.danger,C.danger,C.danger,_,_,C.danger,C.danger,C.danger,_],
    [_,_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_,_],
    [_,_,_,C.danger,C.danger,C.danger,C.danger,_,_,_],
    [_,_,_,C.danger,C.danger,C.danger,C.danger,_,_,_],
    [_,_,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,_,_],
    [_,C.danger,C.danger,C.danger,_,_,C.danger,C.danger,C.danger,_],
    [C.danger,C.danger,C.danger,_,_,_,_,C.danger,C.danger,C.danger],
    [C.danger,C.danger,_,_,_,_,_,_,C.danger,C.danger],
  ],
};

// Compass icon
const compassIcon: PixelSprite = {
  name: 'compass_icon',
  width: 12,
  height: 12,
  pixels: [
    [_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_],
    [_,_,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,_,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.danger,C.danger,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.danger,C.danger,C.grayLight,C.grayLight,C.grayMedium,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.danger,C.danger,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayDark,C.grayDark,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayDark,C.grayDark,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [_,C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.white,C.white,C.grayLight,C.grayLight,C.grayMedium,C.grayDark,_],
    [_,C.grayDark,C.grayMedium,C.grayMedium,C.grayLight,C.white,C.white,C.grayLight,C.grayMedium,C.grayMedium,C.grayDark,_],
    [_,_,C.grayDark,C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark,C.grayDark,_,_],
    [_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_],
  ],
};

export const UI_GAME_SPRITES = {
  healthBarFrame,
  healthBarFillGreen,
  healthBarFillYellow,
  healthBarFillRed,
  inventorySlot,
  dialogCornerTL,
  dialogArrow,
  heartIcon,
  heartEmpty,
  coin,
  arrowUp,
  arrowDown,
  checkmark,
  xMark,
  compassIcon,
};
