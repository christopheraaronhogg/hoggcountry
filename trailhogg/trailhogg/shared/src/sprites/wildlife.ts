// ============================================
// TRAIL LEGS - Wildlife Sprite Definitions
// ============================================
// Bears, deer, birds, and other AT wildlife

import { PixelSprite, AnimatedSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const K = C.nearBlack;      // Black (bear)
const k = C.grayDark;       // Dark gray
const B = C.bark;           // Brown
const b = C.barkDark;       // Dark brown
const T = C.skinTan;        // Tan/beige
const t = C.skinShadow;     // Tan shadow
const W = C.white;          // White
const w = C.grayLight;      // Light gray
const G = C.forestGreen;    // Green (birds)
const O = C.warning;        // Orange (bird accents)
const R = C.danger;         // Red (cardinal)

// ============================================
// BLACK BEAR - 32x28 pixels
// ============================================
const bearPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,_,_,_,_,_,_], // 0 - ears
  [_,_,_,_,_,K,K,k,K,K,_,_,_,_,_,_,_,_,_,_,_,_,K,K,k,K,K,_,_,_,_,_], // 1
  [_,_,_,_,_,K,k,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,k,K,_,_,_,_,_], // 2 - head top
  [_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_], // 4
  [_,_,_,_,_,K,K,K,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,K,K,K,_,_,_,_,_], // 5 - eyes
  [_,_,_,_,_,K,K,K,K,K,K,K,K,B,B,B,B,B,B,K,K,K,K,K,K,K,K,_,_,_,_,_], // 6 - snout
  [_,_,_,_,_,K,K,K,K,K,K,K,B,B,k,k,k,k,B,B,K,K,K,K,K,K,K,_,_,_,_,_], // 7
  [_,_,_,_,_,_,K,K,K,K,K,K,K,B,B,B,B,B,B,K,K,K,K,K,K,K,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_], // 9
  [_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_], // 10 - body start
  [_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_], // 11
  [_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_], // 12
  [K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K], // 13
  [K,K,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,K,K], // 14
  [K,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,K], // 15
  [K,k,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,k,K], // 16
  [K,K,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,K,K], // 17
  [_,K,K,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,K,K,_], // 18
  [_,_,K,K,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,K,K,_,_], // 19
  [_,_,_,K,K,k,k,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,k,k,K,K,_,_,_], // 20
  [_,_,_,_,K,K,k,K,K,K,K,_,_,_,_,_,_,_,_,_,_,K,K,K,K,k,K,K,_,_,_,_], // 21 - legs
  [_,_,_,_,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,_,_,_,_], // 22
  [_,_,_,_,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,_,_,_,_], // 23
  [_,_,_,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,_,_,_], // 24
  [_,_,_,K,K,k,k,K,K,K,K,_,_,_,_,_,_,_,_,_,_,K,K,K,K,k,k,K,K,_,_,_], // 25
  [_,_,K,K,k,k,k,k,K,K,K,K,_,_,_,_,_,_,_,_,K,K,K,K,k,k,k,k,K,K,_,_], // 26 - paws
  [_,_,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,_,_], // 27
];

export const BEAR: PixelSprite = {
  name: 'bear',
  width: 32,
  height: 28,
  pixels: bearPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// WHITE-TAILED DEER - 32x32 pixels
// ============================================
const deerPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,_,_,_,_,_,_], // 0 - antlers
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,B,B,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,B,_,B,B,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,B,_,_,_,B,_,_,_,_], // 3
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,_,_,_,_,_,_,_,_,_], // 4
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,T,T,B,_,_,_,_,_,_,_,_], // 5 - ear
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,T,T,T,T,T,B,_,_,_,_,_,_,_], // 6
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,_,_,_,_,_,_,_], // 7 - head
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,k,T,T,T,T,T,T,_,_,_,_,_,_], // 8 - eye
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_,_,_], // 11 - snout
  [_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,k,k,T,T,T,T,T,_,_,_,_,_,_,_,_,_], // 12 - nose
  [_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_,_], // 14 - neck
  [_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_,_], // 15
  [_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_,_], // 16 - body
  [_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_,_], // 17
  [_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,_,_], // 18
  [_,_,_,_,_,T,T,T,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,T,T,T,_], // 19
  [_,_,_,_,_,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,_], // 20
  [_,_,_,_,_,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,W,W,W,W,t,t,T,T,_], // 21 - white tail
  [_,_,_,_,_,T,T,t,T,T,T,_,_,_,_,_,_,_,_,_,_,T,T,W,W,W,W,T,t,T,T,_], // 22 - legs
  [_,_,_,_,_,T,T,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,T,T,W,W,T,T,T,T,T,_], // 23
  [_,_,_,_,_,T,T,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,T,T,T,_], // 24
  [_,_,_,_,_,T,t,T,T,T,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,t,T,_,_], // 25
  [_,_,_,_,_,T,t,t,T,T,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,t,t,T,_,_], // 26
  [_,_,_,_,_,T,t,t,T,T,T,_,_,_,_,_,_,_,_,_,_,T,T,T,T,T,T,t,t,T,_,_], // 27
  [_,_,_,_,_,k,k,k,k,T,T,_,_,_,_,_,_,_,_,_,_,T,T,T,T,k,k,k,k,_,_,_], // 28 - hooves
  [_,_,_,_,_,k,k,k,k,k,_,_,_,_,_,_,_,_,_,_,_,_,k,k,k,k,k,k,k,_,_,_], // 29
  [_,_,_,_,_,_,k,k,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,k,k,_,_,_,_,_], // 30
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 31
];

export const DEER: PixelSprite = {
  name: 'deer',
  width: 32,
  height: 32,
  pixels: deerPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// CHIPMUNK - 16x12 pixels (small critter)
// ============================================
const chipmunkPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
  [_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B], // 0 - tail up
  [_,_,_,_,_,_,_,_,_,_,B,B,B,b,B,_], // 1
  [_,_,_,B,B,B,_,_,_,B,B,b,B,_,_,_], // 2 - ears and body
  [_,_,B,B,T,B,B,B,B,B,B,B,_,_,_,_], // 3
  [_,B,B,k,T,T,B,T,B,T,B,_,_,_,_,_], // 4 - eye and stripes
  [_,B,T,T,T,T,T,B,T,B,T,_,_,_,_,_], // 5
  [B,B,T,T,T,T,T,T,B,T,B,_,_,_,_,_], // 6 - body
  [B,T,T,T,T,T,T,T,T,B,T,B,_,_,_,_], // 7
  [_,B,T,T,T,T,T,T,T,T,B,_,_,_,_,_], // 8
  [_,_,B,T,T,_,_,T,T,B,_,_,_,_,_,_], // 9 - legs
  [_,_,B,B,_,_,_,_,B,B,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 11
];

export const CHIPMUNK: PixelSprite = {
  name: 'chipmunk',
  width: 16,
  height: 12,
  pixels: chipmunkPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// CARDINAL - 12x12 pixels (red bird)
// ============================================
const cardinalPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,R,R,_,_,_,_,_,_], // 0 - crest
  [_,_,_,R,R,R,R,_,_,_,_,_], // 1
  [_,_,R,R,R,R,R,R,_,_,_,_], // 2
  [_,_,R,K,R,R,R,R,_,_,_,_], // 3 - eye
  [_,R,R,R,R,O,O,R,R,_,_,_], // 4 - beak
  [_,R,R,R,R,O,R,R,R,R,_,_], // 5
  [R,R,R,R,R,R,R,R,R,R,R,_], // 6 - body
  [R,R,R,R,R,R,R,R,R,R,R,R], // 7
  [_,R,R,R,R,R,R,R,R,R,R,_], // 8
  [_,_,R,R,R,R,R,R,R,R,_,_], // 9 - tail
  [_,_,_,k,_,_,_,_,R,R,R,_], // 10 - legs and tail
  [_,_,_,k,_,_,_,_,_,R,R,_], // 11
];

export const CARDINAL: PixelSprite = {
  name: 'cardinal',
  width: 12,
  height: 12,
  pixels: cardinalPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// BLUE JAY - 14x12 pixels
// ============================================
const J = C.skyBlue;   // Blue
const j = C.waterBlue; // Darker blue

const blueJayPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,J,J,J,_,_,_,_,_,_,_], // 0 - crest
  [_,_,_,J,J,j,J,J,_,_,_,_,_,_], // 1
  [_,_,J,J,J,J,J,J,J,_,_,_,_,_], // 2
  [_,_,J,K,J,J,J,J,J,_,_,_,_,_], // 3 - eye
  [_,J,J,J,J,K,K,J,J,J,_,_,_,_], // 4 - beak
  [_,J,J,J,J,K,J,J,J,J,J,_,_,_], // 5
  [J,J,J,J,J,J,J,J,J,J,J,J,_,_], // 6 - body
  [J,j,W,W,J,J,J,J,J,J,J,J,J,_], // 7 - white wing bar
  [_,J,J,W,W,J,J,J,J,J,J,J,J,J], // 8
  [_,_,J,J,J,J,J,J,J,J,J,J,_,_], // 9 - tail
  [_,_,_,k,_,_,_,_,J,j,J,J,_,_], // 10 - legs and tail
  [_,_,_,k,_,_,_,_,_,J,j,J,_,_], // 11
];

export const BLUE_JAY: PixelSprite = {
  name: 'blue_jay',
  width: 14,
  height: 12,
  pixels: blueJayPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// WILD TURKEY - 24x24 pixels
// ============================================
const turkeyPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,_,_,_,_,_,_,_], // 1 - wattle
  [_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,_,J,J,J,J,_,_,_,_,_,_,_,_], // 3 - head (blue)
  [_,_,_,_,_,_,_,_,_,_,_,J,J,k,J,J,J,_,_,_,_,_,_,_], // 4 - eye
  [_,_,_,_,_,_,_,_,_,_,_,J,J,J,J,J,J,_,_,_,_,_,_,_], // 5
  [_,_,_,_,_,_,_,_,_,_,B,B,J,J,J,J,_,_,_,_,_,_,_,_], // 6 - beak
  [_,_,_,_,_,_,_,_,_,B,B,B,B,B,B,_,_,_,_,_,_,_,_,_], // 7 - neck
  [_,_,_,_,_,_,_,_,B,B,B,B,B,B,B,B,_,_,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_,_,_,_,_], // 9 - body start
  [_,_,_,_,_,_,B,B,B,b,B,B,B,B,b,B,B,B,_,_,_,_,_,_], // 10
  [_,_,_,_,_,B,B,B,b,b,B,B,B,B,b,b,B,B,B,_,_,_,_,_], // 11
  [_,_,_,_,B,B,B,b,b,b,B,B,B,B,b,b,b,B,B,B,_,_,_,_], // 12
  [_,_,_,B,B,B,b,b,b,b,B,B,B,B,b,b,b,b,B,B,B,_,_,_], // 13
  [_,_,B,B,B,b,b,b,b,b,B,B,B,B,b,b,b,b,b,B,B,B,_,_], // 14 - tail fan
  [_,B,B,B,b,b,b,b,b,b,B,B,B,B,b,b,b,b,b,b,B,B,B,_], // 15
  [B,B,B,b,b,b,b,b,b,b,B,B,B,B,b,b,b,b,b,b,b,B,B,B], // 16
  [B,B,b,b,b,b,b,b,b,b,B,B,B,B,b,b,b,b,b,b,b,b,B,B], // 17
  [_,B,B,b,b,b,b,b,b,B,B,B,B,B,B,b,b,b,b,b,b,B,B,_], // 18
  [_,_,B,B,B,b,b,b,B,B,_,_,_,_,B,B,b,b,b,B,B,B,_,_], // 19 - legs
  [_,_,_,B,B,B,B,B,B,_,_,_,_,_,_,B,B,B,B,B,B,_,_,_], // 20
  [_,_,_,_,O,O,O,O,_,_,_,_,_,_,_,_,O,O,O,O,_,_,_,_], // 21 - feet
  [_,_,_,O,O,_,O,O,O,_,_,_,_,_,_,O,O,O,_,O,O,_,_,_], // 22
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 23
];

export const TURKEY: PixelSprite = {
  name: 'turkey',
  width: 24,
  height: 24,
  pixels: turkeyPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// SNAKE - 24x8 pixels (timber rattlesnake)
// ============================================
const snakePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,T,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,T,b,T,T,T,T,_,_,_], // 1
  [_,_,T,T,T,T,_,_,_,_,_,T,T,T,b,T,T,b,T,t,T,T,_,_], // 2
  [_,T,T,b,T,T,T,_,_,T,T,T,b,T,T,t,T,T,t,T,_,T,T,_], // 3
  [T,T,k,k,b,T,T,T,T,T,b,T,T,t,T,T,T,T,T,_,_,_,T,T], // 4 - head with eyes
  [_,T,T,T,T,T,T,_,_,T,T,T,T,T,T,t,T,T,T,T,_,T,T,_], // 5
  [_,_,_,_,T,T,_,_,_,_,_,T,T,T,t,T,T,t,T,T,T,T,_,_], // 6
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,T,T,t,T,_,_,_,_,_,_], // 7 - rattle
];

export const SNAKE: PixelSprite = {
  name: 'snake',
  width: 24,
  height: 8,
  pixels: snakePixels,
  originX: 0.1,
  originY: 0.5,
};

// ============================================
// BUTTERFLY - 12x10 pixels (animated)
// ============================================
const butterflyFrame1: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,K,K,_,_,_,_,_], // 0 - antennae
  [_,O,O,_,_,K,K,_,_,O,O,_], // 1
  [O,O,O,O,_,K,K,_,O,O,O,O], // 2 - wings open
  [O,K,O,O,O,K,K,O,O,O,K,O], // 3
  [O,O,O,O,O,K,K,O,O,O,O,O], // 4
  [O,O,O,O,O,K,K,O,O,O,O,O], // 5
  [_,O,O,O,O,K,K,O,O,O,O,_], // 6
  [_,_,O,O,O,K,K,O,O,O,_,_], // 7
  [_,_,_,O,O,_,_,O,O,_,_,_], // 8
  [_,_,_,_,O,_,_,O,_,_,_,_], // 9
];

const butterflyFrame2: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,K,K,_,_,_,_,_], // 0
  [_,_,_,_,_,K,K,_,_,_,_,_], // 1
  [_,_,_,O,O,K,K,O,O,_,_,_], // 2 - wings mid
  [_,_,O,K,O,K,K,O,K,O,_,_], // 3
  [_,_,O,O,O,K,K,O,O,O,_,_], // 4
  [_,_,O,O,O,K,K,O,O,O,_,_], // 5
  [_,_,_,O,O,K,K,O,O,_,_,_], // 6
  [_,_,_,_,O,K,K,O,_,_,_,_], // 7
  [_,_,_,_,_,_,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,_,_,_,_,_], // 9
];

const butterflyFrame3: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,K,K,_,_,_,_,_], // 0
  [_,_,_,_,_,K,K,_,_,_,_,_], // 1
  [_,_,_,_,_,K,K,_,_,_,_,_], // 2 - wings closed
  [_,_,_,_,O,K,K,O,_,_,_,_], // 3
  [_,_,_,_,O,K,K,O,_,_,_,_], // 4
  [_,_,_,_,O,K,K,O,_,_,_,_], // 5
  [_,_,_,_,O,K,K,O,_,_,_,_], // 6
  [_,_,_,_,_,K,K,_,_,_,_,_], // 7
  [_,_,_,_,_,_,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,_,_,_,_,_], // 9
];

export const BUTTERFLY: AnimatedSprite = {
  name: 'butterfly',
  width: 12,
  height: 10,
  frames: [butterflyFrame1, butterflyFrame2, butterflyFrame3, butterflyFrame2],
  frameRate: 8,
  loop: true,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// FIREFLY - 6x6 pixels (animated glow)
// ============================================
const Y = C.warning;  // Yellow glow
const y = C.highlight; // Bright glow

const fireflyFrame1: PixelGrid = [
  [_,_,_,_,_,_],
  [_,_,K,K,_,_],
  [_,K,K,K,K,_],
  [_,K,K,Y,K,_],
  [_,_,K,K,_,_],
  [_,_,_,_,_,_],
];

const fireflyFrame2: PixelGrid = [
  [_,_,_,_,_,_],
  [_,_,K,K,_,_],
  [_,K,K,K,K,_],
  [_,K,Y,Y,K,_],
  [_,_,Y,K,_,_],
  [_,_,_,_,_,_],
];

const fireflyFrame3: PixelGrid = [
  [_,_,_,y,_,_],
  [_,_,K,Y,_,_],
  [_,K,K,Y,K,_],
  [_,K,Y,Y,Y,_],
  [_,_,Y,Y,_,_],
  [_,_,_,y,_,_],
];

export const FIREFLY: AnimatedSprite = {
  name: 'firefly',
  width: 6,
  height: 6,
  frames: [fireflyFrame1, fireflyFrame2, fireflyFrame3, fireflyFrame2],
  frameRate: 4,
  loop: true,
  originX: 0.5,
  originY: 0.5,
};

// Export all wildlife sprites
export const WILDLIFE_SPRITES = {
  bear: BEAR,
  deer: DEER,
  chipmunk: CHIPMUNK,
  cardinal: CARDINAL,
  blueJay: BLUE_JAY,
  turkey: TURKEY,
  snake: SNAKE,
  butterfly: BUTTERFLY,
  firefly: FIREFLY,
};
