// ============================================
// TRAIL LEGS - Asset Generator
// ============================================
// Generates all game sprites from the shared sprite definitions
// Call this once in BootScene to create all textures

import Phaser from 'phaser';
import { SpriteGenerator } from './SpriteGenerator';

// Import all sprite definitions
import {
  // Hiker
  HIKER_WALK,
  HIKER_IDLE,
  // Environment
  TREE_1,
  TREE_2,
  TREE_3,
  TRAIL_TILE,
  GROUND_TILE,
  ROCK_1,
  // Blazes
  BLAZE_SINGLE_WHITE,
  BLAZE_DOUBLE_WHITE,
  BLAZE_DOUBLE_LEFT,
  BLAZE_DOUBLE_RIGHT,
  BLAZE_BLUE,
  CAIRN,
  // Structures
  SHELTER,
  WATER_SOURCE,
  TENT,
  // Weather
  RAIN_DROP,
  HEAVY_RAIN,
  FOG_CLOUD,
  LIGHTNING,
  // UI
  ACTION_BUTTON,
  SMALL_BUTTON,
  ICON_FOOD,
  ICON_WATER,
  ICON_REST,
  ICON_PACE_UP,
  ICON_PACE_DOWN,
  ICON_MENU,
  STATUS_BAR_FRAME,
  // Extended collections
  WILDLIFE_SPRITES,
  TRAIL_FEATURE_SPRITES,
  EXTENDED_STRUCTURE_SPRITES,
  ITEM_SPRITES,
  SIGN_SPRITES,
  TERRAIN_SPRITES,
  PLANT_SPRITES,
  WATER_SPRITES,
  CAMP_GEAR_SPRITES,
  WEATHER_EXTENDED_SPRITES,
  BACKGROUND_SPRITES,
} from '@trailhogg/shared/sprites';

// Import UI icons separately due to naming collision
import { UI_SPRITES as UI_ICON_SPRITES } from '@trailhogg/shared/sprites/ui-icons';

/**
 * Generates all game assets from sprite definitions
 * Call this in BootScene.preload() after any file loading
 *
 * @param scene - The Phaser scene to generate textures in
 * @param scale - Pixel scale factor (default 2 for crisp retro look)
 */
export function generateGameAssets(scene: Phaser.Scene, scale: number = 2): void {
  const generator = new SpriteGenerator(scene, scale);

  // =========================================
  // HIKER SPRITES
  // =========================================

  // Walking animation (4 frames)
  generator.generateAnimatedSprite(HIKER_WALK, 'hiker_walk');

  // Idle animation (2 frames, breathing)
  generator.generateAnimatedSprite(HIKER_IDLE, 'hiker_idle');

  // Also create individual frame textures for flexibility
  generator.generateSpriteFromPixels(
    HIKER_IDLE.frames[0],
    HIKER_IDLE.width,
    HIKER_IDLE.height,
    'hiker'
  );

  // =========================================
  // ENVIRONMENT SPRITES
  // =========================================

  // Trees
  generator.generateSprite(TREE_1, 'tree_1');
  generator.generateSprite(TREE_2, 'tree_2');
  generator.generateSprite(TREE_3, 'tree_3');

  // Keep 'tree' as alias for tree_1 (backwards compatibility)
  generator.generateSprite(TREE_1, 'tree');

  // Ground tiles
  generator.generateTileSprite(TRAIL_TILE, 'trail');
  generator.generateTileSprite(GROUND_TILE, 'ground');

  // Decorations
  generator.generateSprite(ROCK_1, 'rock');

  // =========================================
  // BLAZE SPRITES
  // =========================================

  generator.generateSprite(BLAZE_SINGLE_WHITE, 'blaze_single');
  generator.generateSprite(BLAZE_DOUBLE_WHITE, 'blaze_double');
  generator.generateSprite(BLAZE_DOUBLE_LEFT, 'blaze_double_left');
  generator.generateSprite(BLAZE_DOUBLE_RIGHT, 'blaze_double_right');
  generator.generateSprite(BLAZE_BLUE, 'blaze_blue');
  generator.generateSprite(CAIRN, 'cairn');

  // =========================================
  // STRUCTURE SPRITES
  // =========================================

  generator.generateSprite(SHELTER, 'shelter');
  generator.generateSprite(WATER_SOURCE, 'water');
  generator.generateSprite(TENT, 'tent');

  // =========================================
  // WEATHER SPRITES
  // =========================================

  generator.generateSprite(RAIN_DROP, 'rain');
  generator.generateSprite(HEAVY_RAIN, 'rain_heavy');
  generator.generateSprite(FOG_CLOUD, 'fog');
  generator.generateSprite(LIGHTNING, 'lightning');

  // =========================================
  // UI SPRITES
  // =========================================

  // Buttons (generates _normal, _pressed, _disabled variants)
  generator.generateButtonSprite(ACTION_BUTTON, 'btn_action');
  generator.generateButtonSprite(SMALL_BUTTON, 'btn_small');

  // Icons
  generator.generateSprite(ICON_FOOD, 'icon_food');
  generator.generateSprite(ICON_WATER, 'icon_water');
  generator.generateSprite(ICON_REST, 'icon_rest');
  generator.generateSprite(ICON_PACE_UP, 'icon_pace_up');
  generator.generateSprite(ICON_PACE_DOWN, 'icon_pace_down');
  generator.generateSprite(ICON_MENU, 'icon_menu');

  // Status bars
  generator.generateSprite(STATUS_BAR_FRAME, 'status_bar_frame');

  // =========================================
  // WILDLIFE SPRITES
  // =========================================

  generator.generateSprite(WILDLIFE_SPRITES.bear, 'bear');
  generator.generateSprite(WILDLIFE_SPRITES.deer, 'deer');
  generator.generateSprite(WILDLIFE_SPRITES.chipmunk, 'chipmunk');
  generator.generateSprite(WILDLIFE_SPRITES.cardinal, 'cardinal');
  generator.generateSprite(WILDLIFE_SPRITES.blueJay, 'blue_jay');
  generator.generateSprite(WILDLIFE_SPRITES.turkey, 'turkey');
  generator.generateSprite(WILDLIFE_SPRITES.snake, 'snake');
  generator.generateAnimatedSprite(WILDLIFE_SPRITES.butterfly, 'butterfly');
  generator.generateAnimatedSprite(WILDLIFE_SPRITES.firefly, 'firefly');

  // =========================================
  // TRAIL FEATURE SPRITES
  // =========================================

  generator.generateSprite(TRAIL_FEATURE_SPRITES.bridge, 'bridge');
  generator.generateSprite(TRAIL_FEATURE_SPRITES.stoneSteps, 'stone_steps');
  generator.generateSprite(TRAIL_FEATURE_SPRITES.mudPuddle, 'mud_puddle');
  generator.generateSprite(TRAIL_FEATURE_SPRITES.streamCrossing, 'stream_crossing');
  generator.generateSprite(TRAIL_FEATURE_SPRITES.fallenLog, 'fallen_log');
  generator.generateSprite(TRAIL_FEATURE_SPRITES.boulder, 'boulder');
  generator.generateSprite(TRAIL_FEATURE_SPRITES.roots, 'roots');
  generator.generateTileSprite(TRAIL_FEATURE_SPRITES.rockyTerrain, 'rocky_terrain');
  generator.generateTileSprite(TRAIL_FEATURE_SPRITES.mudTerrain, 'mud_terrain');

  // =========================================
  // EXTENDED STRUCTURE SPRITES
  // =========================================

  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.privy, 'privy');
  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.fireRing, 'fire_ring');
  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.picnicTable, 'picnic_table');
  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.bearBox, 'bear_box');
  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.trailRegister, 'trail_register');
  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.hostel, 'hostel');
  generator.generateSprite(EXTENDED_STRUCTURE_SPRITES.hammock, 'hammock');

  // =========================================
  // ITEM SPRITES
  // =========================================

  generator.generateSprite(ITEM_SPRITES.trekkingPole, 'trekking_pole');
  generator.generateSprite(ITEM_SPRITES.waterBottle, 'water_bottle');
  generator.generateSprite(ITEM_SPRITES.snackBar, 'snack_bar');
  generator.generateSprite(ITEM_SPRITES.firstAidKit, 'first_aid_kit');
  generator.generateSprite(ITEM_SPRITES.headlamp, 'headlamp');
  generator.generateSprite(ITEM_SPRITES.map, 'map');
  generator.generateSprite(ITEM_SPRITES.compass, 'compass');
  generator.generateSprite(ITEM_SPRITES.trailMagic, 'trail_magic');
  generator.generateSprite(ITEM_SPRITES.sleepingBag, 'sleeping_bag');
  generator.generateSprite(ITEM_SPRITES.campStove, 'camp_stove_item');
  generator.generateSprite(ITEM_SPRITES.hikingBoots, 'hiking_boots');
  generator.generateSprite(ITEM_SPRITES.rainJacket, 'rain_jacket');

  // =========================================
  // SIGN SPRITES
  // =========================================

  generator.generateSprite(SIGN_SPRITES.mileMarker, 'mile_marker');
  generator.generateSprite(SIGN_SPRITES.directionSign, 'direction_sign');
  generator.generateSprite(SIGN_SPRITES.warningSign, 'warning_sign');
  generator.generateSprite(SIGN_SPRITES.trailKiosk, 'trail_kiosk');
  generator.generateSprite(SIGN_SPRITES.atDiamond, 'at_diamond');
  generator.generateSprite(SIGN_SPRITES.shelterSign, 'shelter_sign');
  generator.generateSprite(SIGN_SPRITES.waterSign, 'water_sign');
  generator.generateSprite(SIGN_SPRITES.viewpointSign, 'viewpoint_sign');

  // =========================================
  // TERRAIN SPRITES
  // =========================================

  generator.generateTileSprite(TERRAIN_SPRITES.GRASS_LUSH, 'grass_lush');
  generator.generateTileSprite(TERRAIN_SPRITES.GRASS_DRY, 'grass_dry');
  generator.generateTileSprite(TERRAIN_SPRITES.DIRT_PACKED, 'dirt_packed');
  generator.generateTileSprite(TERRAIN_SPRITES.DIRT_LOOSE, 'dirt_loose');
  generator.generateTileSprite(TERRAIN_SPRITES.ROCKY_GROUND, 'rocky_ground');
  generator.generateTileSprite(TERRAIN_SPRITES.SLATE, 'slate');
  generator.generateTileSprite(TERRAIN_SPRITES.GRAVEL, 'gravel');
  generator.generateTileSprite(TERRAIN_SPRITES.BARE_ROCK, 'bare_rock');
  generator.generateTileSprite(TERRAIN_SPRITES.FOREST_FLOOR, 'forest_floor');
  generator.generateTileSprite(TERRAIN_SPRITES.PINE_NEEDLE_FLOOR, 'pine_needle_floor');
  generator.generateSprite(TERRAIN_SPRITES.GRASS_DIRT_EDGE_LEFT, 'grass_dirt_edge_left');

  // =========================================
  // PLANT SPRITES
  // =========================================

  generator.generateSprite(PLANT_SPRITES.MOUNTAIN_LAUREL, 'mountain_laurel');
  generator.generateSprite(PLANT_SPRITES.TRILLIUM, 'trillium');
  generator.generateSprite(PLANT_SPRITES.RHODODENDRON, 'rhododendron');
  generator.generateSprite(PLANT_SPRITES.BLUEBELLS, 'bluebells');
  generator.generateSprite(PLANT_SPRITES.BLACK_EYED_SUSAN, 'black_eyed_susan');
  generator.generateSprite(PLANT_SPRITES.DANDELION, 'dandelion');
  generator.generateSprite(PLANT_SPRITES.DANDELION_PUFF, 'dandelion_puff');
  generator.generateSprite(PLANT_SPRITES.FERN, 'fern');
  generator.generateSprite(PLANT_SPRITES.FIDDLEHEAD, 'fiddlehead');
  generator.generateSprite(PLANT_SPRITES.MOSS, 'moss');
  generator.generateSprite(PLANT_SPRITES.LICHEN, 'lichen');
  generator.generateSprite(PLANT_SPRITES.BLUEBERRY_BUSH, 'blueberry_bush');
  generator.generateSprite(PLANT_SPRITES.SMALL_BUSH, 'small_bush');
  generator.generateSprite(PLANT_SPRITES.TALL_GRASS, 'tall_grass');
  generator.generateAnimatedSprite(PLANT_SPRITES.TALL_GRASS_SWAY, 'tall_grass_sway');

  // =========================================
  // WATER FEATURE SPRITES
  // =========================================

  generator.generateTileSprite(WATER_SPRITES.STREAM_TILE, 'stream_tile');
  generator.generateTileSprite(WATER_SPRITES.DEEP_WATER, 'deep_water');
  generator.generateSprite(WATER_SPRITES.STREAM_BANK_LEFT, 'stream_bank_left');
  generator.generateSprite(WATER_SPRITES.STREAM_BANK_RIGHT, 'stream_bank_right');
  generator.generateSprite(WATER_SPRITES.SMALL_WATERFALL, 'small_waterfall');
  generator.generateSprite(WATER_SPRITES.SMALL_POND, 'small_pond');
  generator.generateAnimatedSprite(WATER_SPRITES.WATER_RIPPLE, 'water_ripple');
  generator.generateAnimatedSprite(WATER_SPRITES.WATER_SPLASH, 'water_splash');
  generator.generateAnimatedSprite(WATER_SPRITES.SPRING_BUBBLES, 'spring_bubbles');

  // =========================================
  // CAMP GEAR SPRITES
  // =========================================

  generator.generateSprite(CAMP_GEAR_SPRITES.BACKPACK, 'backpack');
  generator.generateSprite(CAMP_GEAR_SPRITES.DAYPACK, 'daypack');
  generator.generateSprite(CAMP_GEAR_SPRITES.SLEEPING_BAG_ROLLED, 'sleeping_bag_rolled');
  generator.generateSprite(CAMP_GEAR_SPRITES.SLEEPING_PAD, 'sleeping_pad');
  generator.generateSprite(CAMP_GEAR_SPRITES.TARP, 'tarp');
  generator.generateSprite(CAMP_GEAR_SPRITES.CAMP_STOVE, 'camp_stove');
  generator.generateSprite(CAMP_GEAR_SPRITES.COOKING_POT, 'cooking_pot');
  generator.generateSprite(CAMP_GEAR_SPRITES.MUG, 'mug');
  generator.generateSprite(CAMP_GEAR_SPRITES.SPORK, 'spork');
  generator.generateSprite(CAMP_GEAR_SPRITES.HEADLAMP_OFF, 'headlamp_off');
  generator.generateSprite(CAMP_GEAR_SPRITES.HEADLAMP_ON, 'headlamp_on');
  generator.generateAnimatedSprite(CAMP_GEAR_SPRITES.CAMPFIRE, 'campfire');
  generator.generateSprite(CAMP_GEAR_SPRITES.BEAR_CANISTER, 'bear_canister');
  generator.generateSprite(CAMP_GEAR_SPRITES.HIKING_POLES, 'hiking_poles');
  generator.generateSprite(CAMP_GEAR_SPRITES.WATER_FILTER, 'water_filter');

  // =========================================
  // UI ICON SPRITES
  // =========================================

  generator.generateSprite(UI_ICON_SPRITES.HEART_FULL, 'heart_full');
  generator.generateSprite(UI_ICON_SPRITES.HEART_EMPTY, 'heart_empty');
  generator.generateSprite(UI_ICON_SPRITES.ENERGY_BOLT, 'energy_bolt');
  generator.generateSprite(UI_ICON_SPRITES.MORALE_HIGH, 'morale_high');
  generator.generateSprite(UI_ICON_SPRITES.MORALE_LOW, 'morale_low');
  generator.generateSprite(UI_ICON_SPRITES.WATER_DROP, 'water_drop');
  generator.generateSprite(UI_ICON_SPRITES.FOOD_ICON, 'food_icon');
  generator.generateSprite(UI_ICON_SPRITES.MAP_PIN, 'map_pin');
  generator.generateSprite(UI_ICON_SPRITES.MAP_SHELTER, 'map_shelter');
  generator.generateSprite(UI_ICON_SPRITES.MAP_WATER, 'map_water');
  generator.generateSprite(UI_ICON_SPRITES.MAP_TOWN, 'map_town');
  generator.generateSprite(UI_ICON_SPRITES.MAP_SUMMIT, 'map_summit');
  generator.generateSprite(UI_ICON_SPRITES.ARROW_UP, 'arrow_up');
  generator.generateSprite(UI_ICON_SPRITES.ARROW_DOWN, 'arrow_down');
  generator.generateSprite(UI_ICON_SPRITES.ARROW_LEFT, 'arrow_left');
  generator.generateSprite(UI_ICON_SPRITES.ARROW_RIGHT, 'arrow_right');
  generator.generateButtonSprite(UI_ICON_SPRITES.BUTTON_PLAY, 'btn_play');
  generator.generateButtonSprite(UI_ICON_SPRITES.BUTTON_PAUSE, 'btn_pause');
  generator.generateAnimatedSprite(UI_ICON_SPRITES.LOADING_SPINNER, 'loading_spinner');

  // =========================================
  // EXTENDED WEATHER SPRITES
  // =========================================

  generator.generateSprite(WEATHER_EXTENDED_SPRITES.RAIN_DROP_HEAVY, 'rain_drop_heavy');
  generator.generateAnimatedSprite(WEATHER_EXTENDED_SPRITES.RAIN_SPLASH, 'rain_splash');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.SNOWFLAKE, 'snowflake');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.SNOW_PARTICLE, 'snow_particle');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.SNOW_GROUND, 'snow_ground');
  generator.generateAnimatedSprite(WEATHER_EXTENDED_SPRITES.FALLING_SNOW, 'falling_snow');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.FOG_CLOUD_LARGE, 'fog_cloud_large');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.FOG_WISP, 'fog_wisp');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.WIND_GUST, 'wind_gust');
  generator.generateAnimatedSprite(WEATHER_EXTENDED_SPRITES.WIND_LEAF, 'wind_leaf');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.SUN, 'sun');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.SUN_RAY, 'sun_ray');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.MOON, 'moon');
  generator.generateSprite(WEATHER_EXTENDED_SPRITES.STAR, 'star');
  generator.generateAnimatedSprite(WEATHER_EXTENDED_SPRITES.STAR_TWINKLE, 'star_twinkle');

  // =========================================
  // BACKGROUND SPRITES
  // =========================================

  generator.generateTileSprite(BACKGROUND_SPRITES.SKY_DAY, 'sky_day');
  generator.generateTileSprite(BACKGROUND_SPRITES.SKY_SUNSET, 'sky_sunset');
  generator.generateTileSprite(BACKGROUND_SPRITES.SKY_NIGHT, 'sky_night');
  generator.generateSprite(BACKGROUND_SPRITES.MOUNTAIN_FAR, 'mountain_far');
  generator.generateSprite(BACKGROUND_SPRITES.MOUNTAIN_MID, 'mountain_mid');
  generator.generateSprite(BACKGROUND_SPRITES.HILLS_NEAR, 'hills_near');
  generator.generateSprite(BACKGROUND_SPRITES.TREELINE_FAR, 'treeline_far');
  generator.generateSprite(BACKGROUND_SPRITES.TREELINE_NEAR, 'treeline_near');
  generator.generateSprite(BACKGROUND_SPRITES.CLOUD, 'cloud');
  generator.generateSprite(BACKGROUND_SPRITES.CLOUD_WISPY, 'cloud_wispy');

  // =========================================
  // PHASER ANIMATIONS
  // =========================================

  // Create the hiker animations if not already created by generateAnimatedSprite
  createHikerAnimations(scene);
}

/**
 * Creates Phaser animations for the hiker character
 * The spritesheet textures are already created by generateAnimatedSprite
 */
function createHikerAnimations(scene: Phaser.Scene): void {
  // Animations are created in generateAnimatedSprite, but we can add
  // additional animation configurations here if needed

  // Create directional walk animations (we'll flip the sprite for left/right)
  // These reference the same spritesheet but with different configs
  if (!scene.anims.exists('hiker_walk_right')) {
    scene.anims.create({
      key: 'hiker_walk_right',
      frames: scene.anims.generateFrameNumbers('hiker_walk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  if (!scene.anims.exists('hiker_walk_left')) {
    scene.anims.create({
      key: 'hiker_walk_left',
      frames: scene.anims.generateFrameNumbers('hiker_walk', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

export default generateGameAssets;
