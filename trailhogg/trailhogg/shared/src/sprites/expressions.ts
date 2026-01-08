// ============================================
// TRAIL LEGS - Expression/Emotion Sprites
// ============================================
// Facial expressions and mood indicators for hiker status

import { PixelSprite, AnimatedSprite } from './types';
import { C } from './palette';

// ============================================
// FACE EXPRESSIONS (for status display)
// ============================================

export const faceHappy: PixelSprite = {
  name: 'face_happy',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.danger,C.danger,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.danger,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.danger,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.danger,C.danger,C.danger,C.danger,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

export const faceTired: PixelSprite = {
  name: 'face_tired',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [C.dirtLight,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

export const faceExhausted: PixelSprite = {
  name: 'face_exhausted',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.danger,C.danger,C.danger,C.danger,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.danger,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.danger,C.skinMedium,C.skinMedium,C.dirtLight],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

export const faceHungry: PixelSprite = {
  name: 'face_hungry',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.danger,C.danger,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

export const faceDetermined: PixelSprite = {
  name: 'face_determined',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [C.dirtLight,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

export const faceWorried: PixelSprite = {
  name: 'face_worried',
  width: 12,
  height: 12,
  pixels: [
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,C.dirtLight,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.skinMedium,C.dirtLight,0],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.nearBlack,C.nearBlack,C.nearBlack,C.nearBlack,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight],
    [0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0],
    [0,0,C.dirtLight,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.skinMedium,C.dirtLight,0,0],
    [0,0,0,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,C.dirtLight,0,0,0],
  ],
};

// ============================================
// MOOD BUBBLES (thought bubbles for status)
// ============================================

export const thoughtBubble: PixelSprite = {
  name: 'thought_bubble',
  width: 16,
  height: 12,
  pixels: [
    [0,0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0,0],
    [0,0,0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0,0],
    [0,0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0],
    [0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0],
    [C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white],
    [C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white],
    [0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0],
    [0,0,C.white,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.grayLight,C.white,0,0],
    [0,0,0,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,C.white,0,0,0],
    [0,0,0,0,0,0,C.white,C.white,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,C.white,C.white,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,C.white,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const sleepZzz: AnimatedSprite = {
  name: 'sleep_zzz',
  width: 12,
  height: 10,
  frameRate: 2,
  loop: true,
  frames: [
    // Frame 1
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0],
      [0,0,0,0,0,0,0,0,C.skyBlue,0,0,0],
      [0,0,0,0,0,0,0,C.skyBlue,0,0,0,0],
      [0,0,0,0,C.info,C.info,C.info,C.skyBlue,C.skyBlue,C.skyBlue,0,0],
      [0,0,0,0,0,0,C.info,0,0,0,0,0],
      [0,0,C.waterBlue,C.waterBlue,0,C.info,0,0,0,0,0,0],
      [0,0,0,C.waterBlue,0,C.info,C.info,C.info,0,0,0,0],
      [0,C.waterBlue,0,0,0,0,0,0,0,0,0,0],
      [0,C.waterBlue,C.waterBlue,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2 - shifted up
    [
      [0,0,0,0,0,0,C.skyBlue,C.skyBlue,C.skyBlue,0,0,0],
      [0,0,0,0,0,0,0,0,C.skyBlue,0,0,0],
      [0,0,0,0,0,0,0,C.skyBlue,0,0,0,0],
      [0,0,0,0,C.info,C.info,C.info,C.skyBlue,C.skyBlue,C.skyBlue,0,0],
      [0,0,0,0,0,0,C.info,0,0,0,0,0],
      [0,0,C.waterBlue,C.waterBlue,0,C.info,0,0,0,0,0,0],
      [0,0,0,C.waterBlue,0,C.info,C.info,C.info,0,0,0,0],
      [0,C.waterBlue,0,0,0,0,0,0,0,0,0,0],
      [0,C.waterBlue,C.waterBlue,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  ],
};

// ============================================
// EMOTION ICONS (small indicators)
// ============================================

export const iconSweat: PixelSprite = {
  name: 'icon_sweat',
  width: 6,
  height: 8,
  pixels: [
    [0,0,C.skyBlue,C.skyBlue,0,0],
    [0,C.skyBlue,C.skyLight,C.skyBlue,C.skyBlue,0],
    [C.skyBlue,C.skyLight,C.skyLight,C.skyBlue,C.skyBlue,C.skyBlue],
    [C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue],
    [0,C.skyBlue,C.skyBlue,C.skyBlue,C.skyBlue,0],
    [0,0,C.skyBlue,C.skyBlue,0,0],
    [0,0,0,C.skyBlue,0,0],
    [0,0,0,0,0,0],
  ],
};

export const iconHeart: PixelSprite = {
  name: 'icon_heart',
  width: 8,
  height: 8,
  pixels: [
    [0,C.danger,C.danger,0,0,C.danger,C.danger,0],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,0,0,C.danger,C.danger,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

export const iconAnger: PixelSprite = {
  name: 'icon_anger',
  width: 8,
  height: 8,
  pixels: [
    [C.danger,C.danger,0,0,0,0,C.danger,C.danger],
    [C.danger,C.danger,C.danger,0,0,C.danger,C.danger,C.danger],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,0,C.danger,C.danger,C.danger,C.danger,0,0],
    [0,C.danger,C.danger,C.danger,C.danger,C.danger,C.danger,0],
    [C.danger,C.danger,C.danger,0,0,C.danger,C.danger,C.danger],
    [C.danger,C.danger,0,0,0,0,C.danger,C.danger],
  ],
};

export const iconQuestion: PixelSprite = {
  name: 'icon_question',
  width: 8,
  height: 10,
  pixels: [
    [0,0,C.warning,C.warning,C.warning,C.warning,0,0],
    [0,C.warning,C.warning,0,0,C.warning,C.warning,0],
    [C.warning,C.warning,0,0,0,0,C.warning,C.warning],
    [0,0,0,0,0,0,C.warning,C.warning],
    [0,0,0,0,0,C.warning,C.warning,0],
    [0,0,0,0,C.warning,C.warning,0,0],
    [0,0,0,C.warning,C.warning,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,C.warning,C.warning,0,0,0],
    [0,0,0,C.warning,C.warning,0,0,0],
  ],
};

export const iconExclaim: PixelSprite = {
  name: 'icon_exclaim',
  width: 4,
  height: 10,
  pixels: [
    [C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger],
    [C.danger,C.danger,C.danger,C.danger],
    [0,C.danger,C.danger,0],
    [0,C.danger,C.danger,0],
    [0,0,0,0],
    [0,C.danger,C.danger,0],
    [0,C.danger,C.danger,0],
  ],
};

// Export all expression sprites
export const EXPRESSION_SPRITES = {
  faceHappy,
  faceTired,
  faceExhausted,
  faceHungry,
  faceDetermined,
  faceWorried,
  thoughtBubble,
  sleepZzz,
  iconSweat,
  iconHeart,
  iconAnger,
  iconQuestion,
  iconExclaim,
};
