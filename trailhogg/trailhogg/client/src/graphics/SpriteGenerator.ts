// ============================================
// TRAIL LEGS - Sprite Generator
// ============================================
// Converts pixel array definitions into Phaser textures at runtime
// This allows us to define pixel art as code and generate textures dynamically

import Phaser from 'phaser';
import {
  PixelSprite,
  AnimatedSprite,
  ButtonSprite,
  TileSprite,
  PixelGrid,
} from '@trail-legs/shared/sprites';
import { TRAIL_LEGS_PALETTE } from '@trail-legs/shared/sprites';

/**
 * Converts a hex color string to a number for Phaser
 * @param hex - Color string like '#4A7D5A' or 'transparent'
 * @returns Number like 0x4A7D5A, or -1 for transparent
 */
function hexToNumber(hex: string): number {
  if (hex === 'transparent' || hex === '') {
    return -1;
  }
  return parseInt(hex.replace('#', ''), 16);
}

/**
 * Gets the hex color number for a palette index
 * @param index - Palette color index (0 = transparent)
 * @returns Phaser-compatible color number, or -1 for transparent
 */
function getPaletteColor(index: number): number {
  if (index === 0) {
    return -1; // Transparent
  }
  const color = TRAIL_LEGS_PALETTE.colors[index];
  return hexToNumber(color);
}

/**
 * SpriteGenerator - Converts pixel array definitions to Phaser textures
 *
 * Usage:
 * ```ts
 * const generator = new SpriteGenerator(scene);
 * generator.generateSprite(HIKER_IDLE);
 * generator.generateAnimatedSprite(HIKER_WALK, 'hiker_walk');
 * ```
 */
export class SpriteGenerator {
  private scene: Phaser.Scene;
  private scale: number;

  /**
   * Create a new SpriteGenerator
   * @param scene - The Phaser scene to generate textures in
   * @param scale - Pixel scale factor (default 1, use 2+ for larger pixels)
   */
  constructor(scene: Phaser.Scene, scale: number = 1) {
    this.scene = scene;
    this.scale = scale;
  }

  /**
   * Generates a single texture from a PixelSprite definition
   * @param sprite - The sprite definition
   * @param textureKey - Optional override for texture key (defaults to sprite.name)
   */
  generateSprite(sprite: PixelSprite, textureKey?: string): void {
    const key = textureKey || sprite.name;
    const width = sprite.width * this.scale;
    const height = sprite.height * this.scale;

    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    this.drawPixels(graphics, sprite.pixels);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * Generates a spritesheet texture from an AnimatedSprite definition
   * Each frame is placed horizontally in the spritesheet
   * @param sprite - The animated sprite definition
   * @param textureKey - Optional override for texture key
   */
  generateAnimatedSprite(sprite: AnimatedSprite, textureKey?: string): void {
    const key = textureKey || sprite.name;
    const frameWidth = sprite.width * this.scale;
    const frameHeight = sprite.height * this.scale;
    const totalWidth = frameWidth * sprite.frames.length;

    // Create a temporary render texture to draw the spritesheet
    const renderTexture = this.scene.make.renderTexture({
      width: totalWidth,
      height: frameHeight,
    }, false);

    // Draw each frame side by side using graphics
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });

    for (let i = 0; i < sprite.frames.length; i++) {
      const offsetX = i * frameWidth;
      this.drawPixels(graphics, sprite.frames[i], offsetX);
    }

    // Draw graphics to render texture
    renderTexture.draw(graphics, 0, 0);
    graphics.destroy();

    // Save as a spritesheet with frame data
    renderTexture.saveTexture(key);
    renderTexture.destroy();

    // Add spritesheet frame data to the texture
    const texture = this.scene.textures.get(key);
    if (texture) {
      // Manually add frames to the texture
      for (let i = 0; i < sprite.frames.length; i++) {
        texture.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
      }
    }

    // Create the animation config in Phaser
    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({
        key: key,
        frames: sprite.frames.map((_, i) => ({ key, frame: i })),
        frameRate: sprite.frameRate,
        repeat: sprite.loop !== false ? -1 : 0,
      });
    }
  }

  /**
   * Generates textures for a button sprite (normal, pressed, disabled states)
   * @param sprite - The button sprite definition
   * @param baseKey - Base key for textures (will append _normal, _pressed, _disabled)
   */
  generateButtonSprite(sprite: ButtonSprite, baseKey?: string): void {
    const key = baseKey || sprite.name;

    // Generate normal state
    this.generateSpriteFromPixels(
      sprite.normal,
      sprite.width,
      sprite.height,
      `${key}_normal`
    );

    // Generate pressed state
    this.generateSpriteFromPixels(
      sprite.pressed,
      sprite.width,
      sprite.height,
      `${key}_pressed`
    );

    // Generate disabled state if exists
    if (sprite.disabled) {
      this.generateSpriteFromPixels(
        sprite.disabled,
        sprite.width,
        sprite.height,
        `${key}_disabled`
      );
    }
  }

  /**
   * Generates a tileable texture from a TileSprite definition
   * @param sprite - The tile sprite definition
   * @param textureKey - Optional override for texture key
   */
  generateTileSprite(sprite: TileSprite, textureKey?: string): void {
    const key = textureKey || sprite.name;
    this.generateSpriteFromPixels(sprite.pixels, sprite.width, sprite.height, key);
  }

  /**
   * Helper to generate a texture from raw pixel data
   * @param pixels - 2D array of palette indices
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param key - Texture key
   */
  generateSpriteFromPixels(
    pixels: PixelGrid,
    width: number,
    height: number,
    key: string
  ): void {
    const scaledWidth = width * this.scale;
    const scaledHeight = height * this.scale;

    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    this.drawPixels(graphics, pixels);
    graphics.generateTexture(key, scaledWidth, scaledHeight);
    graphics.destroy();
  }

  /**
   * Internal helper to draw pixels onto a graphics object
   * @param graphics - Phaser graphics object
   * @param pixels - 2D array of palette indices
   * @param offsetX - X offset for drawing (used in spritesheets)
   * @param offsetY - Y offset for drawing
   */
  private drawPixels(
    graphics: Phaser.GameObjects.Graphics,
    pixels: PixelGrid,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    for (let y = 0; y < pixels.length; y++) {
      const row = pixels[y];
      for (let x = 0; x < row.length; x++) {
        const colorIndex = row[x];
        const color = getPaletteColor(colorIndex);

        // Skip transparent pixels
        if (color === -1) {
          continue;
        }

        graphics.fillStyle(color, 1);
        graphics.fillRect(
          offsetX + x * this.scale,
          offsetY + y * this.scale,
          this.scale,
          this.scale
        );
      }
    }
  }

  /**
   * Generates all sprites from a sprite collection object
   * @param collection - Object containing multiple sprite definitions
   */
  generateCollection(collection: Record<string, PixelSprite | AnimatedSprite | ButtonSprite | TileSprite>): void {
    for (const [name, sprite] of Object.entries(collection)) {
      if ('frames' in sprite) {
        // AnimatedSprite
        this.generateAnimatedSprite(sprite as AnimatedSprite);
      } else if ('normal' in sprite && 'pressed' in sprite) {
        // ButtonSprite
        this.generateButtonSprite(sprite as ButtonSprite);
      } else if ('seamless' in sprite) {
        // TileSprite
        this.generateTileSprite(sprite as TileSprite);
      } else {
        // Regular PixelSprite
        this.generateSprite(sprite as PixelSprite);
      }
    }
  }
}

/**
 * Convenience function to generate all game sprites
 * Call this in BootScene.preload() or create()
 * @param scene - The Phaser scene
 * @param scale - Pixel scale factor
 */
export function generateAllSprites(scene: Phaser.Scene, scale: number = 1): void {
  const generator = new SpriteGenerator(scene, scale);

  // Import all sprite collections
  // These will be imported and passed to the generator
  // This function serves as a convenience wrapper
}

export default SpriteGenerator;
