// ============================================
// TRAIL LEGS - Resupply Sprites
// ============================================
// Mail drops, bounce boxes, town resupply, and supply caches

import { PixelSprite } from './types';
import { C } from './palette';

const _ = C.transparent;

// Priority mail box (USPS style)
const mailBox: PixelSprite = {
  name: 'mail_box',
  width: 12,
  height: 16,
  pixels: [
    [_,_,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,_,_],
    [_,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,_],
    [C.waterBlue,C.waterBlue,C.waterBlue,C.waterDeep,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterDeep,C.waterBlue,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterDeep,C.white,C.white,C.white,C.white,C.white,C.white,C.waterDeep,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterDeep,C.white,C.danger,C.danger,C.danger,C.danger,C.white,C.waterDeep,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterDeep,C.white,C.danger,C.white,C.white,C.danger,C.white,C.waterDeep,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterDeep,C.white,C.danger,C.danger,C.danger,C.danger,C.white,C.waterDeep,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterDeep,C.white,C.white,C.white,C.white,C.white,C.white,C.waterDeep,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.waterBlue,C.waterBlue],
    [C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue],
    [_,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,_],
    [_,_,_,_,_,C.grayDark,C.grayDark,_,_,_,_,_],
    [_,_,_,_,_,C.grayDark,C.grayDark,_,_,_,_,_],
    [_,_,_,_,_,C.grayDark,C.grayDark,_,_,_,_,_],
    [_,_,_,_,_,C.grayDark,C.grayDark,_,_,_,_,_],
    [_,_,_,_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_,_,_,_],
  ],
};

// Bounce box (cardboard package)
const bounceBox: PixelSprite = {
  name: 'bounce_box',
  width: 16,
  height: 12,
  pixels: [
    [_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_],
    [_,C.bark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.bark,_],
    [C.bark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.trailDirt,C.trailDirt,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.barkDark,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.trailDirt,C.trailDirt,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.bark],
    [C.bark,C.bark,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.bark,C.bark],
    [_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_],
    [_,_,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,_,_],
  ],
};

// Grocery bag
const groceryBag: PixelSprite = {
  name: 'grocery_bag',
  width: 12,
  height: 14,
  pixels: [
    [_,_,_,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,_,_,_],
    [_,_,C.trailDirt,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.trailDirt,_,_],
    [_,C.trailDirt,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.trailDirt,_],
    [_,C.trailDirt,C.dirtLight,C.forestGreen,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.danger,C.dirtLight,C.trailDirt,_],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.forestGreen,C.forestGreen,C.dirtLight,C.dirtLight,C.danger,C.danger,C.dirtLight,C.dirtLight,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.leafGreen,C.forestGreen,C.dirtLight,C.dirtLight,C.danger,C.warning,C.dirtLight,C.dirtLight,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.warning,C.warning,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.warning,C.warning,C.dirtLight,C.dirtLight,C.bark,C.bark,C.dirtLight,C.dirtLight,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.trailDirt],
    [C.trailDirt,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.trailDirt],
    [_,C.trailDirt,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.trailDirt,_],
    [_,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,C.trailDirt,_],
    [_,_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_,_],
  ],
};

// Gas station fuel pump (for town resupply)
const fuelPump: PixelSprite = {
  name: 'fuel_pump',
  width: 10,
  height: 16,
  pixels: [
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.nearBlack,C.success,C.success,C.success,C.success,C.nearBlack,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.nearBlack,C.success,C.success,C.success,C.success,C.nearBlack,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.danger,C.white,C.white,C.white,C.white,C.danger,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayDark],
    [C.grayDark,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayDark],
    [C.grayDark,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
  ],
};

// Hiker box (free gear box at hostels)
const hikerBox: PixelSprite = {
  name: 'hiker_box',
  width: 16,
  height: 12,
  pixels: [
    [_,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,_],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.shirtGreen,C.shirtGreen,C.barkDark,C.warning,C.barkDark,C.skyBlue,C.skyBlue,C.barkDark,C.danger,C.barkDark,C.trailDirt,C.trailDirt,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.shirtGreen,C.shirtGreen,C.barkDark,C.warning,C.warning,C.skyBlue,C.skyBlue,C.barkDark,C.danger,C.danger,C.trailDirt,C.trailDirt,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.grayMedium,C.grayMedium,C.barkDark,C.white,C.white,C.barkDark,C.forestGreen,C.forestGreen,C.barkDark,C.bark,C.bark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.grayMedium,C.grayMedium,C.barkDark,C.white,C.white,C.barkDark,C.forestGreen,C.leafGreen,C.barkDark,C.bark,C.bark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.bark],
    [C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark,C.bark],
    [C.barkDark,C.bark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.bark,C.barkDark],
    [_,C.barkDark,C.bark,C.white,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.white,C.bark,C.barkDark,_],
    [_,_,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,C.barkDark,_,_],
  ],
};

// ATM machine
const atm: PixelSprite = {
  name: 'atm',
  width: 12,
  height: 16,
  pixels: [
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [C.grayDark,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.grayDark],
    [C.grayDark,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.grayDark],
    [C.grayDark,C.waterBlue,C.waterDeep,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.waterDeep,C.waterBlue,C.grayDark],
    [C.grayDark,C.waterBlue,C.waterDeep,C.skyLight,C.success,C.success,C.success,C.success,C.skyLight,C.waterDeep,C.waterBlue,C.grayDark],
    [C.grayDark,C.waterBlue,C.waterDeep,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.skyLight,C.waterDeep,C.waterBlue,C.grayDark],
    [C.grayDark,C.waterBlue,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterDeep,C.waterBlue,C.grayDark],
    [C.grayDark,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.waterBlue,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayMedium,C.grayLight,C.grayLight,C.grayLight,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
  ],
};

// Vending machine (snacks/drinks)
const vendingMachine: PixelSprite = {
  name: 'vending_machine',
  width: 14,
  height: 20,
  pixels: [
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [C.grayDark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.skyBlue,C.skyBlue,C.nearBlack,C.warning,C.warning,C.nearBlack,C.forestGreen,C.forestGreen,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.skyBlue,C.skyBlue,C.nearBlack,C.warning,C.warning,C.nearBlack,C.forestGreen,C.forestGreen,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.danger,C.danger,C.nearBlack,C.skyBlue,C.skyBlue,C.nearBlack,C.warning,C.warning,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.danger,C.danger,C.nearBlack,C.skyBlue,C.skyBlue,C.nearBlack,C.warning,C.warning,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.forestGreen,C.forestGreen,C.nearBlack,C.danger,C.danger,C.nearBlack,C.skyBlue,C.skyBlue,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.forestGreen,C.forestGreen,C.nearBlack,C.danger,C.danger,C.nearBlack,C.skyBlue,C.skyBlue,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.grayMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.grayMedium,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.grayMedium,C.danger,C.grayDark],
    [C.grayDark,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.grayDark],
    [C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark],
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [_,_,C.grayDark,C.grayDark,_,_,_,_,_,_,_,_,C.grayDark,_],
  ],
};

// Laundromat machine
const washer: PixelSprite = {
  name: 'washer',
  width: 12,
  height: 14,
  pixels: [
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
    [C.grayDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.grayMedium,C.grayMedium,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.grayLight,C.white,C.white,C.white,C.white,C.grayMedium,C.grayMedium,C.white,C.grayDark],
    [C.grayDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayDark],
    [C.grayDark,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.skyBlue,C.skyLight,C.skyBlue,C.skyBlue,C.skyLight,C.skyBlue,C.grayLight,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.skyBlue,C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,C.grayLight,C.white,C.grayDark],
    [C.grayDark,C.white,C.grayLight,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.grayLight,C.white,C.grayDark],
    [C.grayDark,C.white,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,C.white,C.grayDark],
    [C.grayDark,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.grayDark],
    [_,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,C.grayDark,_],
  ],
};

// Cache container (trail cache)
const trailCache: PixelSprite = {
  name: 'trail_cache',
  width: 10,
  height: 8,
  pixels: [
    [_,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,_],
    [C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark],
    [C.forestDark,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,C.forestDark],
    [C.forestDark,C.forestGreen,C.forestDark,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestDark,C.forestGreen,C.forestDark],
    [C.forestDark,C.forestGreen,C.forestDark,C.leafGreen,C.leafGreen,C.leafGreen,C.leafGreen,C.forestDark,C.forestGreen,C.forestDark],
    [C.forestDark,C.forestGreen,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestGreen,C.forestDark],
    [C.forestDark,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestDark],
    [_,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,C.forestDark,_],
  ],
};

export const RESUPPLY_SPRITES = {
  mailBox,
  bounceBox,
  groceryBag,
  fuelPump,
  hikerBox,
  atm,
  vendingMachine,
  washer,
  trailCache,
};
