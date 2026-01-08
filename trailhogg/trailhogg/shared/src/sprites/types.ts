// ============================================
// TRAIL LEGS - Pixel Art Sprite System Types
// ============================================

/**
 * A single frame of pixel art, defined as a 2D array of palette indices.
 * 0 = transparent, 1+ = palette color indices
 */
export type PixelGrid = number[][];

/**
 * A static sprite (single frame)
 */
export interface PixelSprite {
  name: string;
  width: number;
  height: number;
  pixels: PixelGrid;
  /** Origin point for positioning (0-1 range, default 0.5, 0.5) */
  originX?: number;
  originY?: number;
}

/**
 * An animated sprite with multiple frames
 */
export interface AnimatedSprite {
  name: string;
  width: number;
  height: number;
  frames: PixelGrid[];
  frameRate: number;
  /** Whether the animation loops */
  loop?: boolean;
  originX?: number;
  originY?: number;
}

/**
 * A complete sprite sheet definition containing multiple sprites/animations
 */
export interface SpriteSheet {
  name: string;
  palette: string[];
  sprites: Record<string, PixelSprite>;
  animations: Record<string, AnimatedSprite>;
}

/**
 * A tileable sprite with seamless edges
 */
export interface TileSprite extends PixelSprite {
  seamless: true;
}

/**
 * UI element sprite with states
 */
export interface ButtonSprite {
  name: string;
  width: number;
  height: number;
  normal: PixelGrid;
  pressed: PixelGrid;
  disabled?: PixelGrid;
}

/**
 * A sprite with attachment points for other sprites
 */
export interface CompositeSprite extends PixelSprite {
  attachments: {
    name: string;
    x: number;
    y: number;
  }[];
}

/**
 * Color palette with named colors for easy reference
 */
export interface ColorPalette {
  name: string;
  colors: string[];
  colorNames: Record<string, number>;
}

/**
 * Complete sprite asset definition for the game
 */
export interface SpriteAssets {
  palette: ColorPalette;
  hiker: {
    walkFrames: AnimatedSprite;
    idleFrames: AnimatedSprite;
    tiredWalkFrames?: AnimatedSprite;
  };
  environment: {
    trees: PixelSprite[];
    trail: TileSprite;
    ground: TileSprite;
    rocks: PixelSprite[];
  };
  blazes: {
    singleWhite: PixelSprite;
    doubleWhite: PixelSprite;
    blue: PixelSprite;
    cairn: PixelSprite;
  };
  structures: {
    shelter: PixelSprite;
    waterSource: PixelSprite;
    tent: PixelSprite;
  };
  weather: {
    rainDrop: PixelSprite;
    fogCloud: PixelSprite;
    lightning: PixelSprite;
  };
  ui: {
    buttons: Record<string, ButtonSprite>;
    icons: Record<string, PixelSprite>;
    bars: Record<string, PixelSprite>;
  };
}

// Utility type for creating sprites with proper typing
export type SpriteDefinition = PixelSprite | AnimatedSprite | TileSprite | ButtonSprite;
