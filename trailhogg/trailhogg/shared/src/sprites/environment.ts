// ============================================
// TRAIL LEGS - Environment Sprite Definitions
// ============================================
// Trees, trail, ground, and natural elements

import { PixelSprite, TileSprite, CompositeSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const D = C.forestDark;     // Dark green
const F = C.forestGreen;    // Forest green
const L = C.leafGreen;      // Leaf green
const l = C.leafLight;      // Light leaf
const B = C.bark;           // Bark
const b = C.barkDark;       // Dark bark
const T = C.trailDirt;      // Trail dirt
const t = C.dirtLight;      // Light dirt
const G = C.grayMedium;     // Gray (rocks)
const g = C.grayDark;       // Dark gray

/**
 * Tree Variation 1 - Classic pine shape
 * 32x48 pixels
 */
const tree1Pixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,_,_,_,_,L,L,F,L,L,F,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,_,_,_,_,_,L,L,F,F,L,L,F,F,L,L,_,_,_,_,_,_,_,_,_,_,_], // 4
  [_,_,_,_,_,_,_,_,_,_,L,L,F,F,D,F,F,D,F,F,L,L,_,_,_,_,_,_,_,_,_,_], // 5
  [_,_,_,_,_,_,_,_,_,L,L,F,F,D,D,F,F,D,D,F,F,L,L,_,_,_,_,_,_,_,_,_], // 6
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 7  - tier break
  [_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 8
  [_,_,_,_,_,_,_,_,_,_,L,L,L,F,L,L,L,L,F,L,L,L,_,_,_,_,_,_,_,_,_,_], // 9
  [_,_,_,_,_,_,_,_,_,L,L,F,F,F,L,L,L,L,F,F,F,L,L,_,_,_,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,_,L,L,F,F,D,F,F,L,L,F,F,D,F,F,L,L,_,_,_,_,_,_,_,_], // 11
  [_,_,_,_,_,_,_,L,L,F,F,D,D,D,F,F,F,F,D,D,D,F,F,L,L,_,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,L,L,F,F,D,D,D,D,F,F,F,F,D,D,D,D,F,F,L,L,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_], // 14 - tier break
  [_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_], // 15
  [_,_,_,_,_,_,_,_,_,L,L,L,F,F,L,L,L,L,F,F,L,L,L,_,_,_,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,_,_,L,L,F,F,F,F,L,L,L,L,F,F,F,F,L,L,_,_,_,_,_,_,_,_], // 17
  [_,_,_,_,_,_,_,L,L,F,F,D,F,F,F,L,L,F,F,F,D,F,F,L,L,_,_,_,_,_,_,_], // 18
  [_,_,_,_,_,_,L,L,F,F,D,D,D,F,F,F,F,F,F,D,D,D,F,F,L,L,_,_,_,_,_,_], // 19
  [_,_,_,_,_,L,L,F,F,D,D,D,D,D,F,F,F,F,D,D,D,D,D,F,F,L,L,_,_,_,_,_], // 20
  [_,_,_,_,L,L,F,F,D,D,D,D,D,D,F,F,F,F,D,D,D,D,D,D,F,F,L,L,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_,_], // 22 - tier break
  [_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_], // 23
  [_,_,_,_,_,_,_,_,L,L,L,F,F,F,L,L,L,L,F,F,F,L,L,L,_,_,_,_,_,_,_,_], // 24
  [_,_,_,_,_,_,_,L,L,F,F,F,D,F,F,L,L,F,F,D,F,F,F,L,L,_,_,_,_,_,_,_], // 25
  [_,_,_,_,_,_,L,L,F,F,D,D,D,D,F,F,F,F,D,D,D,D,F,F,L,L,_,_,_,_,_,_], // 26
  [_,_,_,_,_,L,L,F,F,D,D,D,D,D,D,F,F,D,D,D,D,D,D,F,F,L,L,_,_,_,_,_], // 27
  [_,_,_,_,L,L,F,F,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,F,F,L,L,_,_,_,_], // 28
  [_,_,_,L,L,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,L,L,_,_,_], // 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 30 - trunk
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 32
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 33
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 34
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 35
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 36
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 37
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 38
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 39
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 40
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 41
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 42
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 43
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 44
  [_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,b,b,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_], // 45 - roots
  [_,_,_,_,_,_,_,_,_,_,_,b,b,B,B,b,b,B,B,b,b,_,_,_,_,_,_,_,_,_,_,_], // 46
  [_,_,_,_,_,_,_,_,_,_,b,b,b,B,B,b,b,B,B,b,b,b,_,_,_,_,_,_,_,_,_,_], // 47
];

export const TREE_1: CompositeSprite = {
  name: 'tree_1',
  width: 32,
  height: 48,
  pixels: tree1Pixels,
  originX: 0.5,
  originY: 1.0,
  attachments: [
    { name: 'blaze', x: 14, y: 34 } // Where a blaze can be attached
  ]
};

/**
 * Tree Variation 2 - Broader deciduous style
 * 32x48 pixels
 */
const tree2Pixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,L,L,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,L,L,L,l,L,L,L,L,l,L,L,L,_,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,_,L,L,l,L,L,L,L,L,L,L,L,l,L,L,_,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,_,L,L,L,L,F,L,l,L,L,l,L,F,L,L,L,L,_,_,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,_,L,L,L,F,F,F,L,L,L,L,L,L,F,F,F,L,L,L,_,_,_,_,_,_,_], // 4
  [_,_,_,_,_,_,L,L,L,F,F,D,F,F,L,L,L,L,F,F,D,F,F,L,L,L,_,_,_,_,_,_], // 5
  [_,_,_,_,_,L,L,L,F,F,D,D,D,F,F,L,L,F,F,D,D,D,F,F,L,L,L,_,_,_,_,_], // 6
  [_,_,_,_,L,L,L,F,F,D,D,D,D,D,F,F,F,F,D,D,D,D,D,F,F,L,L,L,_,_,_,_], // 7
  [_,_,_,L,L,L,F,F,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,F,F,L,L,L,_,_,_], // 8
  [_,_,L,L,L,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,L,L,L,_,_], // 9
  [_,_,L,L,F,F,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,F,F,L,L,_,_], // 10
  [_,L,L,F,F,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,F,F,L,L,_], // 11
  [_,L,L,F,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,F,L,L,_], // 12
  [L,L,F,F,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,F,F,L,L], // 13
  [L,L,F,D,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,D,F,L,L], // 14
  [L,L,F,D,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,D,F,L,L], // 15
  [L,L,F,F,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,F,F,L,L], // 16
  [_,L,L,F,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,F,L,L,_], // 17
  [_,L,L,F,F,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,F,F,L,L,_], // 18
  [_,_,L,L,F,F,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,F,F,L,L,_,_], // 19
  [_,_,L,L,L,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,L,L,L,_,_], // 20
  [_,_,_,L,L,L,F,F,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,F,F,L,L,L,_,_,_], // 21
  [_,_,_,_,L,L,L,F,F,D,D,D,D,D,F,F,F,F,D,D,D,D,D,F,F,L,L,L,_,_,_,_], // 22
  [_,_,_,_,_,L,L,L,F,F,D,D,D,F,F,L,L,F,F,D,D,D,F,F,L,L,L,_,_,_,_,_], // 23
  [_,_,_,_,_,_,L,L,L,F,F,D,F,F,L,L,L,L,F,F,D,F,F,L,L,L,_,_,_,_,_,_], // 24
  [_,_,_,_,_,_,_,L,L,L,F,F,F,L,L,L,L,L,L,F,F,F,L,L,L,_,_,_,_,_,_,_], // 25
  [_,_,_,_,_,_,_,_,L,L,L,L,F,L,l,L,L,l,L,F,L,L,L,L,_,_,_,_,_,_,_,_], // 26
  [_,_,_,_,_,_,_,_,_,L,L,l,L,L,L,L,L,L,L,L,l,L,L,_,_,_,_,_,_,_,_,_], // 27
  [_,_,_,_,_,_,_,_,_,_,L,L,L,l,L,L,L,L,l,L,L,L,_,_,_,_,_,_,_,_,_,_], // 28
  [_,_,_,_,_,_,_,_,_,_,_,_,L,L,L,B,B,L,L,L,_,_,_,_,_,_,_,_,_,_,_,_], // 29
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 30 - trunk
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 31
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 32
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 33
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 34
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 35
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,b,b,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 36
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 37
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 38
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 39
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 40
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 41
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 42
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 43
  [_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,b,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_], // 44
  [_,_,_,_,_,_,_,_,_,_,_,_,b,B,B,b,b,B,B,b,_,_,_,_,_,_,_,_,_,_,_,_], // 45
  [_,_,_,_,_,_,_,_,_,_,_,b,b,B,B,b,b,B,B,b,b,_,_,_,_,_,_,_,_,_,_,_], // 46
  [_,_,_,_,_,_,_,_,_,_,b,b,b,B,B,b,b,B,B,b,b,b,_,_,_,_,_,_,_,_,_,_], // 47
];

export const TREE_2: CompositeSprite = {
  name: 'tree_2',
  width: 32,
  height: 48,
  pixels: tree2Pixels,
  originX: 0.5,
  originY: 1.0,
  attachments: [
    { name: 'blaze', x: 14, y: 36 }
  ]
};

/**
 * Tree Variation 3 - Small/young tree
 * 24x32 pixels (smaller than others)
 */
const tree3Pixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,_,_,_,_,_,_,L,L,L,L,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,L,L,l,l,L,L,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,_,L,L,L,L,L,L,L,L,_,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,_,L,L,F,L,L,L,L,F,L,L,_,_,_,_,_,_,_], // 3
  [_,_,_,_,_,_,L,L,F,F,L,l,l,L,F,F,L,L,_,_,_,_,_,_], // 4
  [_,_,_,_,_,L,L,F,F,D,F,L,L,F,D,F,F,L,L,_,_,_,_,_], // 5
  [_,_,_,_,L,L,F,F,D,D,D,F,F,D,D,D,F,F,L,L,_,_,_,_], // 6
  [_,_,_,L,L,F,F,D,D,D,D,D,D,D,D,D,D,F,F,L,L,_,_,_], // 7
  [_,_,_,_,L,L,F,D,D,D,D,D,D,D,D,D,D,F,L,L,_,_,_,_], // 8
  [_,_,_,_,_,L,L,F,D,D,D,D,D,D,D,D,F,L,L,_,_,_,_,_], // 9
  [_,_,_,_,_,_,L,L,F,D,D,D,D,D,D,F,L,L,_,_,_,_,_,_], // 10
  [_,_,_,_,_,_,_,L,L,F,D,D,D,D,F,L,L,_,_,_,_,_,_,_], // 11
  [_,_,_,_,_,_,_,_,L,L,F,D,D,F,L,L,_,_,_,_,_,_,_,_], // 12
  [_,_,_,_,_,_,_,_,_,L,L,F,F,L,L,_,_,_,_,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,L,L,L,L,_,_,_,_,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,_,_,_,_,B,B,_,_,_,_,_,_,_,_,_,_,_], // 15
  [_,_,_,_,_,_,_,_,_,_,_,B,B,_,_,_,_,_,_,_,_,_,_,_], // 16
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 17
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 18
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 19
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 20
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 21
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 23
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 24
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 25
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 26
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 27
  [_,_,_,_,_,_,_,_,_,_,_,B,b,_,_,_,_,_,_,_,_,_,_,_], // 28
  [_,_,_,_,_,_,_,_,_,_,b,B,b,b,_,_,_,_,_,_,_,_,_,_], // 29
  [_,_,_,_,_,_,_,_,_,b,b,B,b,b,b,_,_,_,_,_,_,_,_,_], // 30
  [_,_,_,_,_,_,_,_,b,b,b,B,b,b,b,b,_,_,_,_,_,_,_,_], // 31
];

export const TREE_3: PixelSprite = {
  name: 'tree_3',
  width: 24,
  height: 32,
  pixels: tree3Pixels,
  originX: 0.5,
  originY: 1.0,
};

/**
 * Trail Tile - 32x32 tileable dirt path
 */
const trailPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 0
  [T,T,t,T,T,T,T,T,T,T,T,t,T,T,T,T,T,T,T,t,T,T,T,T,T,T,T,T,T,t,T,T], // 1
  [T,t,t,T,T,T,T,T,T,T,t,t,t,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,t,t,t,T], // 2
  [T,T,T,T,T,b,T,T,T,T,T,t,T,T,T,T,T,T,T,T,T,T,b,T,T,T,T,T,T,t,T,T], // 3
  [T,T,T,T,b,b,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,b,b,T,T,T,T,T,T,T,T,T], // 4
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 5
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 6
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 7
  [T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T], // 8
  [T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T], // 9
  [T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T], // 10
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,b,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 11
  [T,T,T,t,T,T,T,T,T,T,T,T,T,b,b,b,T,T,T,T,T,T,T,T,T,T,t,T,T,T,T,T], // 12
  [T,T,t,t,t,T,T,T,T,T,T,T,T,T,b,T,T,T,T,T,T,T,T,T,T,t,t,t,T,T,T,T], // 13
  [T,T,T,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,T,T,T,T,T], // 14
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 15
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 16
  [T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T], // 17
  [T,T,T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,T,T,T,T], // 18
  [T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T], // 19
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 20
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 21
  [T,T,b,T,T,T,T,T,T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,T,T,b,T,T,T,T,T], // 22
  [T,b,b,b,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,b,b,b,T,T,T,T], // 23
  [T,T,b,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,b,T,T,T,T,T], // 24
  [T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T], // 25
  [T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T], // 26
  [T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,T,T,T,T,T,T,t,t,t,t,T,T,T,T,T,T,T], // 27
  [T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,T,T,T,T,T,T,T,T], // 28
  [T,T,T,T,T,T,T,T,T,T,T,T,T,b,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,T,T], // 29
  [T,T,T,t,T,T,T,T,T,T,T,T,b,b,b,T,T,T,T,T,T,T,T,T,T,T,T,T,t,t,t,T], // 30
  [T,T,t,t,t,T,T,T,T,T,T,T,T,b,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,t,T,T], // 31
];

export const TRAIL_TILE: TileSprite = {
  name: 'trail',
  width: 32,
  height: 32,
  pixels: trailPixels,
  seamless: true,
  originX: 0,
  originY: 0,
};

/**
 * Ground/Forest Floor Tile - 32x32 tileable
 */
const groundPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [D,D,D,D,F,F,D,D,D,D,D,D,F,F,D,D,D,D,D,D,F,F,D,D,D,D,D,D,F,F,D,D], // 0
  [D,D,D,F,F,F,F,D,D,D,D,F,F,F,F,D,D,D,D,F,F,F,F,D,D,D,D,F,F,F,F,D], // 1
  [D,D,D,D,F,F,D,D,D,D,D,D,F,F,D,D,D,D,D,D,F,F,D,D,D,D,D,D,F,F,D,D], // 2
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 3
  [D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D], // 4
  [D,D,D,D,D,D,D,D,L,L,L,L,D,D,D,D,D,D,D,D,D,D,D,L,L,L,L,D,D,D,D,D], // 5
  [D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D], // 6
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 7
  [D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D], // 8
  [D,F,F,F,F,D,D,D,D,D,D,F,F,F,F,D,D,F,F,F,F,D,D,D,D,D,D,F,F,F,F,D], // 9
  [D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D], // 10
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 11
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 12
  [D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D], // 13
  [D,D,D,D,D,L,L,L,L,D,D,D,D,D,D,D,D,D,D,L,L,L,L,D,D,D,D,D,D,D,D,D], // 14
  [D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D], // 15
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 16
  [D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D], // 17
  [D,D,D,D,D,D,D,F,F,F,F,D,D,D,D,D,D,D,D,D,D,F,F,F,F,D,D,D,D,D,D,D], // 18
  [D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D,D,D,D,D,F,F,D,D,D,D,D,D,D,D], // 19
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 20
  [D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D], // 21
  [D,D,D,D,D,D,D,D,D,D,D,L,L,L,L,D,D,D,D,D,D,D,D,D,D,L,L,L,L,D,D,D], // 22
  [D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,D,D,D,D,D,D,L,L,D,D,D,D], // 23
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 24
  [D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D], // 25
  [D,F,F,F,F,D,D,D,D,D,D,F,F,F,F,D,D,F,F,F,F,D,D,D,D,D,D,F,F,F,F,D], // 26
  [D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D,D,D,F,F,D,D,D,D,D,D,D,D,F,F,D,D], // 27
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 28
  [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D], // 29
  [D,D,D,D,L,L,D,D,D,D,D,D,D,D,L,L,D,D,D,D,D,D,L,L,D,D,D,D,D,D,L,L], // 30
  [D,D,D,L,L,L,L,D,D,D,D,D,D,L,L,L,L,D,D,D,D,L,L,L,L,D,D,D,D,L,L,L], // 31
];

export const GROUND_TILE: TileSprite = {
  name: 'ground',
  width: 32,
  height: 32,
  pixels: groundPixels,
  seamless: true,
  originX: 0,
  originY: 0,
};

/**
 * Rock sprites - decorative elements
 */
const rock1Pixels: PixelGrid = [
  [_,_,_,_,G,G,G,_,_,_,_,_],
  [_,_,_,G,G,g,G,G,_,_,_,_],
  [_,_,G,G,g,g,g,G,G,_,_,_],
  [_,G,G,g,g,g,g,g,G,G,_,_],
  [G,G,g,g,g,g,g,g,g,G,G,_],
  [G,g,g,g,g,g,g,g,g,g,G,_],
  [G,G,g,g,g,g,g,g,g,G,G,_],
  [_,G,G,g,g,g,g,g,G,G,_,_],
];

export const ROCK_1: PixelSprite = {
  name: 'rock_1',
  width: 12,
  height: 8,
  pixels: rock1Pixels,
  originX: 0.5,
  originY: 1.0,
};

// Export all environment sprites
export const ENVIRONMENT_SPRITES = {
  trees: [TREE_1, TREE_2, TREE_3],
  trail: TRAIL_TILE,
  ground: GROUND_TILE,
  rocks: [ROCK_1],
};
