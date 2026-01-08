// ============================================
// TRAIL LEGS - Famous AT Landmark Sprites
// ============================================
// Iconic spots along the Appalachian Trail

import { PixelSprite } from './types';
import { C } from './palette';

// McAfee Knob overlook (48x32)
const mcafeeKnob: PixelSprite = {
  name: 'mcafeeKnob',
  width: 48,
  height: 32,
  pixels: [
    // Sky
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    // Distant mountains
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    // Valley
    [C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    // More forest below view
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.steelBlue,C.skyBlue,C.skyBlue],
    // The famous rock outcrop
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.steelBlue],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.forestGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    // The jutting rock ledge
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen],
    // The famous overhang
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    // Rock face below
    [C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    [0,0,0,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,0,0,0],
    [0,0,0,0,0,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// Dragon's Tooth rock spire (24x36)
const dragonsTooth: PixelSprite = {
  name: 'dragonsTooth',
  width: 24,
  height: 36,
  pixels: [
    // Sharp peak
    [0,0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0],
    [0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0],
    [0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0],
    [0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0],
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,0],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [0,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,0],
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    // Base widening
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,0],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    // Forest base
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.darkGreen,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.forestGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
  ],
};

// Springer Mountain plaque (20x16)
const springerPlaque: PixelSprite = {
  name: 'springerPlaque',
  width: 20,
  height: 16,
  pixels: [
    // Bronze plaque on rock
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0],
    [0,0,C.rust,C.rust,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.rust,C.rust,0,0],
    [0,0,C.rust,C.tan,C.tan,C.bark,C.bark,C.tan,C.bark,C.bark,C.bark,C.tan,C.bark,C.bark,C.bark,C.tan,C.tan,C.rust,0,0],
    [0,0,C.rust,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.rust,0,0],
    [0,0,C.rust,C.tan,C.tan,C.bark,C.bark,C.bark,C.bark,C.tan,C.bark,C.tan,C.bark,C.bark,C.tan,C.tan,C.tan,C.rust,0,0],
    [0,0,C.rust,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.rust,0,0],
    [0,0,C.rust,C.rust,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.tan,C.rust,C.rust,0,0],
    [0,0,0,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,C.rust,0,0,0],
    // Rock base
    [0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0],
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.dirt,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.dirt],
    [C.dirt,C.dirt,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.dirt,C.dirt],
  ],
};

// Clingmans Dome tower (20x32)
const clingmansDome: PixelSprite = {
  name: 'clingmansDome',
  width: 20,
  height: 32,
  pixels: [
    // Observation deck spiral
    [0,0,0,0,0,0,0,0,0,C.stone,C.stone,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0,0],
    [0,0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0,0],
    [0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0,0],
    [0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0],
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    // Ramp spiraling up
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,0],
    [C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    // Center tower
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone],
    [0,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,0],
    [0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0],
    [0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.gray,C.stone,C.stone,0,0],
    [0,0,0,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.gray,C.stone,C.stone,0,0,0],
    [0,0,0,0,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,C.stone,C.stone,C.gray,C.gray,C.stone,C.stone,0,0,0,0],
    [0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0],
    // Support structure
    [0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0,0],
    // Base merging with ground
    [0,0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0,0],
    [0,0,0,0,0,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,0,0,0,0,0],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.darkGreen,C.darkGreen,C.forestGreen,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.stone,C.forestGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
  ],
};

// Max Patch bald (32x20)
const maxPatch: PixelSprite = {
  name: 'maxPatch',
  width: 32,
  height: 20,
  pixels: [
    // Rolling grassy bald
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    // Distant mountains
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.steelBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    // Grassy bald top
    [C.skyBlue,C.skyBlue,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.forestGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.skyBlue],
    [C.forestGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.lightGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    // Transition to tree line
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen,C.forestGreen,C.darkGreen,C.forestGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen,C.darkGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
    [C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen,C.forestGreen],
  ],
};

export const LANDMARK_SPRITES = {
  mcafeeKnob,
  dragonsTooth,
  springerPlaque,
  clingmansDome,
  maxPatch,
};
