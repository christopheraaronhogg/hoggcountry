// ============================================
// TRAIL LEGS - UI Sprite Definitions
// ============================================
// Buttons, icons, bars, and interface elements

import { PixelSprite, ButtonSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const P = C.darkPanel;    // Panel background
const B = C.nearBlack;    // Border
const G = C.shirtGreen;   // Green accent
const g = C.shirtGreenShadow; // Green shadow
const W = C.white;        // White
const w = C.grayLight;    // Gray
const D = C.danger;       // Danger red
const O = C.warning;      // Warning orange
const S = C.success;      // Success green
const I = C.info;         // Info blue

/**
 * Action Button - Generic action button (56x56 for touch)
 */
const buttonNormalPixels: PixelGrid = [];
const buttonPressedPixels: PixelGrid = [];
const buttonDisabledPixels: PixelGrid = [];

// Generate 56x56 button
for (let y = 0; y < 56; y++) {
  const normalRow: number[] = [];
  const pressedRow: number[] = [];
  const disabledRow: number[] = [];

  for (let x = 0; x < 56; x++) {
    // Border (2px)
    if (x < 2 || x >= 54 || y < 2 || y >= 54) {
      normalRow.push(B);
      pressedRow.push(B);
      disabledRow.push(C.grayDark);
    }
    // Highlight edge (top/left inner)
    else if ((x === 2 || y === 2) && x < 54 && y < 54) {
      normalRow.push(G);
      pressedRow.push(g);
      disabledRow.push(C.grayMedium);
    }
    // Shadow edge (bottom/right inner)
    else if ((x === 53 || y === 53) && x > 2 && y > 2) {
      normalRow.push(g);
      pressedRow.push(G);
      disabledRow.push(C.grayDark);
    }
    // Fill
    else {
      normalRow.push(P);
      pressedRow.push(C.grayDark);
      disabledRow.push(P);
    }
  }

  buttonNormalPixels.push(normalRow);
  buttonPressedPixels.push(pressedRow);
  disabledRow.length > 0 && buttonDisabledPixels.push(disabledRow);
}

export const ACTION_BUTTON: ButtonSprite = {
  name: 'button_action',
  width: 56,
  height: 56,
  normal: buttonNormalPixels,
  pressed: buttonPressedPixels,
  disabled: buttonDisabledPixels,
};

/**
 * Small Button - 44x44 for compact UI
 */
const smallButtonNormal: PixelGrid = [];
const smallButtonPressed: PixelGrid = [];

for (let y = 0; y < 44; y++) {
  const normalRow: number[] = [];
  const pressedRow: number[] = [];

  for (let x = 0; x < 44; x++) {
    if (x < 2 || x >= 42 || y < 2 || y >= 42) {
      normalRow.push(B);
      pressedRow.push(B);
    } else if ((x === 2 || y === 2) && x < 42 && y < 42) {
      normalRow.push(G);
      pressedRow.push(g);
    } else if ((x === 41 || y === 41) && x > 2 && y > 2) {
      normalRow.push(g);
      pressedRow.push(G);
    } else {
      normalRow.push(P);
      pressedRow.push(C.grayDark);
    }
  }

  smallButtonNormal.push(normalRow);
  smallButtonPressed.push(pressedRow);
}

export const SMALL_BUTTON: ButtonSprite = {
  name: 'button_small',
  width: 44,
  height: 44,
  normal: smallButtonNormal,
  pressed: smallButtonPressed,
};

/**
 * Food Icon - Apple/snack
 * 16x16 pixels
 */
const foodIconPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,C.bark,C.bark,_,_,_,_,_,_,_], // 0 - stem
  [_,_,_,_,_,_,C.bark,C.barkDark,C.bark,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,D,D,D,D,D,D,_,_,_,_,_], // 2 - apple top
  [_,_,_,_,D,D,D,D,D,D,D,D,_,_,_,_], // 3
  [_,_,_,D,D,D,D,D,D,D,D,D,D,_,_,_], // 4
  [_,_,D,D,D,D,W,D,D,D,D,D,D,D,_,_], // 5 - highlight
  [_,_,D,D,D,D,D,D,D,D,D,D,D,D,_,_], // 6
  [_,D,D,D,D,D,D,D,D,D,D,D,D,D,D,_], // 7
  [_,D,D,D,D,D,D,D,D,D,D,D,D,D,D,_], // 8
  [_,D,D,D,D,D,D,D,D,D,D,D,D,D,D,_], // 9
  [_,D,D,D,D,D,D,D,D,D,D,D,D,D,D,_], // 10
  [_,_,D,D,D,D,D,D,D,D,D,D,D,D,_,_], // 11
  [_,_,D,D,D,D,D,D,D,D,D,D,D,D,_,_], // 12
  [_,_,_,D,D,D,D,D,D,D,D,D,D,_,_,_], // 13
  [_,_,_,_,D,D,D,D,D,D,D,D,_,_,_,_], // 14
  [_,_,_,_,_,D,D,D,D,D,D,_,_,_,_,_], // 15
];

export const ICON_FOOD: PixelSprite = {
  name: 'icon_food',
  width: 16,
  height: 16,
  pixels: foodIconPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Water Icon - Water droplet
 * 16x16 pixels
 */
const waterIconPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,I,I,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,I,I,I,I,_,_,_,_,_,_], // 1
  [_,_,_,_,_,I,I,I,I,I,I,_,_,_,_,_], // 2
  [_,_,_,_,I,I,I,I,I,I,I,I,_,_,_,_], // 3
  [_,_,_,I,I,I,I,I,I,I,I,I,I,_,_,_], // 4
  [_,_,I,I,I,I,I,I,I,I,I,I,I,I,_,_], // 5
  [_,_,I,I,I,W,I,I,I,I,I,I,I,I,_,_], // 6 - highlight
  [_,I,I,I,W,W,I,I,I,I,I,I,I,I,I,_], // 7
  [_,I,I,I,I,I,I,I,I,I,I,I,I,I,I,_], // 8
  [_,I,I,I,I,I,I,I,I,I,I,I,I,I,I,_], // 9
  [_,I,I,I,I,I,I,I,I,I,I,I,I,I,I,_], // 10
  [_,_,I,I,I,I,I,I,I,I,I,I,I,I,_,_], // 11
  [_,_,I,I,I,I,I,I,I,I,I,I,I,I,_,_], // 12
  [_,_,_,I,I,I,I,I,I,I,I,I,I,_,_,_], // 13
  [_,_,_,_,I,I,I,I,I,I,I,I,_,_,_,_], // 14
  [_,_,_,_,_,I,I,I,I,I,I,_,_,_,_,_], // 15
];

export const ICON_WATER: PixelSprite = {
  name: 'icon_water',
  width: 16,
  height: 16,
  pixels: waterIconPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Rest Icon - Moon/sleep
 * 16x16 pixels
 */
const restIconPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,_,O,O,O,O,_,_,_,_], // 0
  [_,_,_,_,_,_,O,O,O,O,O,O,O,_,_,_], // 1
  [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_], // 2
  [_,_,_,_,O,O,O,O,O,_,_,_,_,_,_,_], // 3
  [_,_,_,O,O,O,O,O,_,_,_,_,_,_,_,_], // 4
  [_,_,O,O,O,O,O,_,_,_,_,_,_,_,_,_], // 5
  [_,_,O,O,O,O,_,_,_,_,_,_,_,_,_,_], // 6
  [_,O,O,O,O,O,_,_,_,_,_,_,_,_,_,_], // 7
  [_,O,O,O,O,O,_,_,_,_,_,_,_,_,_,_], // 8
  [_,O,O,O,O,O,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,O,O,O,O,_,_,_,_,_,_,_,_,_,_], // 10
  [_,_,O,O,O,O,O,_,_,_,_,_,_,_,_,_], // 11
  [_,_,_,O,O,O,O,O,_,_,_,_,_,_,_,_], // 12
  [_,_,_,_,O,O,O,O,O,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,O,O,O,O,O,O,_,_,_,_,_], // 14
  [_,_,_,_,_,_,O,O,O,O,O,O,O,_,_,_], // 15
];

export const ICON_REST: PixelSprite = {
  name: 'icon_rest',
  width: 16,
  height: 16,
  pixels: restIconPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Pace Up Icon - Arrow up
 * 16x16 pixels
 */
const paceUpPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,G,G,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_], // 1
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 2
  [_,_,_,_,G,G,G,G,G,G,G,G,_,_,_,_], // 3
  [_,_,_,G,G,G,G,G,G,G,G,G,G,_,_,_], // 4
  [_,_,G,G,G,G,G,G,G,G,G,G,G,G,_,_], // 5
  [_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_], // 6
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 7
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 8
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 9
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 10
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 11
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 12
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 13
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 14
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 15
];

export const ICON_PACE_UP: PixelSprite = {
  name: 'icon_pace_up',
  width: 16,
  height: 16,
  pixels: paceUpPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Pace Down Icon - Arrow down
 * 16x16 pixels
 */
const paceDownPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 0
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 1
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 2
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 3
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 4
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 5
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 6
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 7
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 8
  [_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_], // 9
  [_,_,G,G,G,G,G,G,G,G,G,G,G,G,_,_], // 10
  [_,_,_,G,G,G,G,G,G,G,G,G,G,_,_,_], // 11
  [_,_,_,_,G,G,G,G,G,G,G,G,_,_,_,_], // 12
  [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_], // 13
  [_,_,_,_,_,_,G,G,G,G,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,G,G,_,_,_,_,_,_,_], // 15
];

export const ICON_PACE_DOWN: PixelSprite = {
  name: 'icon_pace_down',
  width: 16,
  height: 16,
  pixels: paceDownPixels,
  originX: 0.5,
  originY: 0.5,
};

/**
 * Status Bar Frame - 100x12 horizontal bar container
 */
const statusBarFramePixels: PixelGrid = [];
for (let y = 0; y < 12; y++) {
  const row: number[] = [];
  for (let x = 0; x < 100; x++) {
    // Border
    if (x === 0 || x === 99 || y === 0 || y === 11) {
      row.push(B);
    }
    // Inner
    else {
      row.push(P);
    }
  }
  statusBarFramePixels.push(row);
}

export const STATUS_BAR_FRAME: PixelSprite = {
  name: 'status_bar_frame',
  width: 100,
  height: 12,
  pixels: statusBarFramePixels,
  originX: 0,
  originY: 0,
};

/**
 * Menu Icon - Hamburger menu
 * 24x24 pixels
 */
const menuIconPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 3
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 4
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 5
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 6
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 7
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 10
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 11
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 12
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 15
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 16
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 17
  [_,_,_,_,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_], // 18
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 19
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 23
];

export const ICON_MENU: PixelSprite = {
  name: 'icon_menu',
  width: 24,
  height: 24,
  pixels: menuIconPixels,
  originX: 0.5,
  originY: 0.5,
};

// Export all UI sprites
export const UI_SPRITES = {
  buttons: {
    action: ACTION_BUTTON,
    small: SMALL_BUTTON,
  },
  icons: {
    food: ICON_FOOD,
    water: ICON_WATER,
    rest: ICON_REST,
    paceUp: ICON_PACE_UP,
    paceDown: ICON_PACE_DOWN,
    menu: ICON_MENU,
  },
  bars: {
    statusFrame: STATUS_BAR_FRAME,
  },
};
