// ============================================
// TRAIL LEGS - Trail Feature Sprite Definitions
// ============================================
// Bridges, steps, mud, stream crossings, and trail obstacles

import { PixelSprite, TileSprite, PixelGrid } from './types';
import { C } from './palette';

// Color shortcuts
const _ = 0;  // Transparent
const B = C.bark;           // Wood
const b = C.barkDark;       // Wood shadow
const G = C.grayMedium;     // Stone
const g = C.grayDark;       // Stone shadow
const W = C.waterBlue;      // Water
const w = C.waterDeep;      // Deep water
const S = C.skyLight;       // Water highlight
const M = C.pantsBrown;     // Mud
const m = C.pantsBrownShadow; // Mud dark
const T = C.trailDirt;      // Trail
const t = C.dirtLight;      // Light dirt

// ============================================
// WOODEN BRIDGE - 64x32 pixels
// ============================================
const bridgePixels: PixelGrid = [];
for (let y = 0; y < 32; y++) {
  const row: number[] = [];
  for (let x = 0; x < 64; x++) {
    // Railings (posts every 16 pixels)
    if (y < 8) {
      if ((x % 16 === 0 || x % 16 === 1) && x < 62) {
        row.push(y < 2 ? B : b);
      } else if (y === 0 && x > 1 && x < 62) {
        row.push(B); // Top rail
      } else {
        row.push(_);
      }
    }
    // Bridge deck
    else if (y >= 8 && y < 24) {
      if (x === 0 || x === 63) {
        row.push(b); // Edge shadow
      } else if ((y - 8) % 4 === 0) {
        row.push(B); // Plank lines
      } else if ((y - 8) % 4 === 1) {
        row.push(b);
      } else {
        row.push(B);
      }
    }
    // Support beams below
    else {
      if (x === 8 || x === 9 || x === 54 || x === 55) {
        row.push(b);
      } else if (x === 10 || x === 11 || x === 52 || x === 53) {
        row.push(B);
      } else {
        row.push(_);
      }
    }
  }
  bridgePixels.push(row);
}

export const BRIDGE: PixelSprite = {
  name: 'bridge',
  width: 64,
  height: 32,
  pixels: bridgePixels,
  originX: 0.5,
  originY: 0.75,
};

// ============================================
// STONE STEPS - 32x48 pixels
// ============================================
const stepsPixels: PixelGrid = [];
for (let y = 0; y < 48; y++) {
  const row: number[] = [];
  const step = Math.floor(y / 8);
  const stepY = y % 8;
  const indent = step * 3; // Steps get narrower going up

  for (let x = 0; x < 32; x++) {
    if (x < indent || x >= 32 - indent) {
      row.push(_);
    } else if (stepY === 0) {
      row.push(G); // Step top edge
    } else if (stepY === 1) {
      row.push(g); // Step front shadow
    } else if (stepY < 6) {
      // Step surface with some texture
      if ((x + y) % 7 === 0) {
        row.push(g);
      } else {
        row.push(G);
      }
    } else {
      row.push(g); // Step front face
    }
  }
  stepsPixels.push(row);
}

export const STONE_STEPS: PixelSprite = {
  name: 'stone_steps',
  width: 32,
  height: 48,
  pixels: stepsPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// MUD PUDDLE - 24x16 pixels
// ============================================
const mudPuddlePixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
  [_,_,_,_,_,_,_,_,M,M,M,M,M,M,M,M,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,M,M,M,m,M,M,M,M,m,M,M,M,_,_,_,_,_,_], // 1
  [_,_,_,_,M,M,M,m,m,m,M,M,M,M,m,m,m,M,M,M,_,_,_,_], // 2
  [_,_,_,M,M,m,m,m,m,m,M,M,M,M,m,m,m,m,m,M,M,_,_,_], // 3
  [_,_,M,M,m,m,m,m,m,m,m,M,M,m,m,m,m,m,m,m,M,M,_,_], // 4
  [_,M,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,M,_], // 5
  [_,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,_], // 6
  [M,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,M], // 7
  [M,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,M], // 8
  [M,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,M], // 9
  [_,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,_], // 10
  [_,M,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,M,_], // 11
  [_,_,M,M,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,m,M,M,_,_], // 12
  [_,_,_,M,M,m,m,m,m,m,m,M,M,m,m,m,m,m,m,M,M,_,_,_], // 13
  [_,_,_,_,M,M,M,m,m,m,M,M,M,M,m,m,m,M,M,M,_,_,_,_], // 14
  [_,_,_,_,_,_,M,M,M,M,M,M,M,M,M,M,M,M,_,_,_,_,_,_], // 15
];

export const MUD_PUDDLE: PixelSprite = {
  name: 'mud_puddle',
  width: 24,
  height: 16,
  pixels: mudPuddlePixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// STREAM CROSSING - 48x24 pixels
// ============================================
const streamPixels: PixelGrid = [];
for (let y = 0; y < 24; y++) {
  const row: number[] = [];
  for (let x = 0; x < 48; x++) {
    // Banks on sides
    if (x < 6 || x >= 42) {
      if (y < 4 || y >= 20) {
        row.push(T); // Trail
      } else {
        row.push(M); // Bank
      }
    }
    // Stepping stones
    else if (y >= 8 && y < 16) {
      const stonePos = [10, 18, 26, 34];
      const isOnStone = stonePos.some(pos => x >= pos && x < pos + 6);
      if (isOnStone) {
        if (y === 8 || y === 15) {
          row.push(G);
        } else {
          row.push(g);
        }
      } else {
        // Water with flow pattern
        if ((x + y) % 5 === 0) {
          row.push(S);
        } else if ((x + y) % 3 === 0) {
          row.push(W);
        } else {
          row.push(w);
        }
      }
    }
    // Water
    else {
      if ((x + y) % 5 === 0) {
        row.push(S);
      } else if ((x + y) % 3 === 0) {
        row.push(W);
      } else {
        row.push(w);
      }
    }
  }
  streamPixels.push(row);
}

export const STREAM_CROSSING: PixelSprite = {
  name: 'stream_crossing',
  width: 48,
  height: 24,
  pixels: streamPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// FALLEN LOG (obstacle) - 40x16 pixels
// ============================================
const fallenLogPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,B,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,b,B,B,B,_,_,_,_], // 1
  [_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,b,b,B,B,_,_,_,_], // 2
  [_,_,_,B,B,b,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,b,b,b,b,B,B,_,_,_], // 3
  [_,_,B,B,b,b,b,B,B,b,B,B,b,B,B,b,B,B,b,B,B,b,B,B,b,B,B,b,B,b,b,b,b,b,b,b,B,_,_,_], // 4
  [_,B,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_,_], // 5
  [_,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,_,_], // 6
  [B,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_], // 7
  [B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,_], // 8
  [B,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_], // 9
  [_,B,B,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,b,B,B,_,_], // 10
  [_,_,B,B,b,b,b,B,B,b,B,B,b,B,B,b,B,B,b,B,B,b,B,B,b,B,B,b,B,b,b,b,b,b,b,B,B,_,_,_], // 11
  [_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,b,b,b,B,B,_,_,_,_], // 12
  [_,_,_,_,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,b,b,B,B,_,_,_,_,_], // 13
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,B,B,B,_,_,_,_,_,_], // 14
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], // 15
];

export const FALLEN_LOG: PixelSprite = {
  name: 'fallen_log',
  width: 40,
  height: 16,
  pixels: fallenLogPixels,
  originX: 0.5,
  originY: 0.8,
};

// ============================================
// BOULDER (large obstacle) - 32x24 pixels
// ============================================
const boulderPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,_,_,_,G,G,G,G,G,G,G,G,_,_,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,_,_,_,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_,_,_,_,_], // 1
  [_,_,_,_,_,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_,_,_], // 2
  [_,_,_,_,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,_,_,_,_], // 3
  [_,_,_,_,_,G,G,G,G,G,g,G,G,G,G,G,G,G,G,G,g,G,G,G,G,G,G,_,_,_,_,_], // 4
  [_,_,_,_,G,G,G,G,G,g,g,g,G,G,G,G,G,G,G,g,g,g,G,G,G,G,G,G,_,_,_,_], // 5
  [_,_,_,G,G,G,G,G,g,g,g,g,G,G,G,G,G,G,g,g,g,g,g,G,G,G,G,G,G,_,_,_], // 6
  [_,_,G,G,G,G,G,G,g,g,g,g,G,G,G,G,G,G,g,g,g,g,g,G,G,G,G,G,G,G,_,_], // 7
  [_,G,G,G,G,G,G,G,G,g,g,g,G,G,G,G,G,G,g,g,g,g,G,G,G,G,G,G,G,G,G,_], // 8
  [_,G,G,G,G,G,G,G,G,G,g,g,g,G,G,G,G,g,g,g,g,G,G,G,G,G,G,G,G,G,G,_], // 9
  [G,G,G,G,G,G,G,G,G,G,G,g,g,g,G,G,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G], // 10
  [G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G], // 11
  [G,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G,G], // 12
  [G,G,g,G,G,G,G,G,G,G,G,G,G,G,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,g,G,G], // 13
  [G,g,g,g,G,G,G,G,G,G,G,G,G,G,G,g,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,G], // 14
  [g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g], // 15
  [g,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,g], // 16
  [_,g,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,g,_], // 17
  [_,_,g,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,g,_,_], // 18
  [_,_,_,g,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,g,_,_,_], // 19
  [_,_,_,_,g,g,g,g,g,g,G,G,G,G,G,G,G,G,G,G,G,G,g,g,g,g,g,g,_,_,_,_], // 20
  [_,_,_,_,_,g,g,g,g,g,g,g,G,G,G,G,G,G,G,G,g,g,g,g,g,g,g,_,_,_,_,_], // 21
  [_,_,_,_,_,_,g,g,g,g,g,g,g,g,G,G,G,G,g,g,g,g,g,g,g,g,_,_,_,_,_,_], // 22
  [_,_,_,_,_,_,_,_,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,_,_,_,_,_,_,_,_], // 23
];

export const BOULDER: PixelSprite = {
  name: 'boulder',
  width: 32,
  height: 24,
  pixels: boulderPixels,
  originX: 0.5,
  originY: 1.0,
};

// ============================================
// ROOT SYSTEM (trip hazard) - 32x8 pixels
// ============================================
const rootsPixels: PixelGrid = [
  //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
  [_,_,_,_,_,_,_,_,_,b,b,_,_,_,_,_,_,_,_,_,b,b,_,_,_,_,_,_,_,_,_,_], // 0
  [_,_,_,_,b,b,b,_,b,B,B,b,_,_,_,_,_,_,_,b,B,B,b,_,b,b,b,_,_,_,_,_], // 1
  [_,_,_,b,B,B,B,b,B,B,B,B,b,b,_,_,_,_,b,B,B,B,B,b,B,B,B,b,_,_,_,_], // 2
  [_,_,b,B,B,b,B,B,B,B,B,B,B,B,b,b,b,b,B,B,B,B,B,B,B,b,B,B,b,_,_,_], // 3
  [_,b,B,B,b,b,b,B,B,b,b,B,B,B,B,B,B,B,B,B,B,b,b,B,B,b,b,B,B,b,_,_], // 4
  [b,B,B,b,_,_,b,B,b,_,_,b,B,B,B,b,b,B,B,B,b,_,_,b,B,b,_,_,b,B,B,b], // 5
  [B,B,b,_,_,_,_,b,_,_,_,_,b,B,b,_,_,b,B,b,_,_,_,_,b,_,_,_,_,b,B,B], // 6
  [b,b,_,_,_,_,_,_,_,_,_,_,_,b,_,_,_,_,b,_,_,_,_,_,_,_,_,_,_,_,b,b], // 7
];

export const ROOTS: PixelSprite = {
  name: 'roots',
  width: 32,
  height: 8,
  pixels: rootsPixels,
  originX: 0.5,
  originY: 0.5,
};

// ============================================
// ROCKY TERRAIN TILE - 32x32 pixels
// ============================================
const rockyTerrainPixels: PixelGrid = [];
for (let y = 0; y < 32; y++) {
  const row: number[] = [];
  for (let x = 0; x < 32; x++) {
    // Create rocky texture pattern
    const noise = ((x * 7 + y * 13) % 11);
    if (noise < 3) {
      row.push(g);
    } else if (noise < 6) {
      row.push(G);
    } else if (noise < 8) {
      row.push(T);
    } else {
      row.push(t);
    }
  }
  rockyTerrainPixels.push(row);
}

export const ROCKY_TERRAIN: TileSprite = {
  name: 'rocky_terrain',
  width: 32,
  height: 32,
  pixels: rockyTerrainPixels,
  seamless: true,
  originX: 0,
  originY: 0,
};

// ============================================
// MUD TERRAIN TILE - 32x32 pixels
// ============================================
const mudTerrainPixels: PixelGrid = [];
for (let y = 0; y < 32; y++) {
  const row: number[] = [];
  for (let x = 0; x < 32; x++) {
    const noise = ((x * 5 + y * 11) % 9);
    if (noise < 4) {
      row.push(m);
    } else if (noise < 7) {
      row.push(M);
    } else {
      row.push(T);
    }
  }
  mudTerrainPixels.push(row);
}

export const MUD_TERRAIN: TileSprite = {
  name: 'mud_terrain',
  width: 32,
  height: 32,
  pixels: mudTerrainPixels,
  seamless: true,
  originX: 0,
  originY: 0,
};

// Export all trail feature sprites
export const TRAIL_FEATURE_SPRITES = {
  bridge: BRIDGE,
  stoneSteps: STONE_STEPS,
  mudPuddle: MUD_PUDDLE,
  streamCrossing: STREAM_CROSSING,
  fallenLog: FALLEN_LOG,
  boulder: BOULDER,
  roots: ROOTS,
  rockyTerrain: ROCKY_TERRAIN,
  mudTerrain: MUD_TERRAIN,
};
