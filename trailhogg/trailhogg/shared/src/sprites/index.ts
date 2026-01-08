// ============================================
// TRAIL LEGS - Sprite System Index
// ============================================
// Exports all sprite definitions for use by the client

// Types
export * from './types';

// Palette
export * from './palette';

// Core sprite collections
export { HIKER_SPRITES, HIKER_WALK, HIKER_IDLE } from './hiker';
export { ENVIRONMENT_SPRITES, TREE_1, TREE_2, TREE_3, TRAIL_TILE, GROUND_TILE, ROCK_1 } from './environment';
export { BLAZE_SPRITES, BLAZE_SINGLE_WHITE, BLAZE_DOUBLE_WHITE, BLAZE_DOUBLE_LEFT, BLAZE_DOUBLE_RIGHT, BLAZE_BLUE, CAIRN } from './blazes';
export { STRUCTURE_SPRITES, SHELTER, WATER_SOURCE, TENT } from './structures';
export { WEATHER_SPRITES, RAIN_DROP, HEAVY_RAIN, FOG_CLOUD, LIGHTNING } from './weather';
export { UI_SPRITES, ACTION_BUTTON, SMALL_BUTTON, ICON_FOOD, ICON_WATER, ICON_REST, ICON_PACE_UP, ICON_PACE_DOWN, ICON_MENU, STATUS_BAR_FRAME } from './ui';

// Extended sprite collections
export { WILDLIFE_SPRITES } from './wildlife';
export { TRAIL_FEATURE_SPRITES } from './trail-features';
export { EXTENDED_STRUCTURE_SPRITES } from './structures-extended';
export { ITEM_SPRITES } from './items';
export { SIGN_SPRITES } from './signs';
export { TERRAIN_SPRITES } from './terrain';
export { PLANT_SPRITES } from './plants';
export { WATER_SPRITES } from './water-features';
export { CAMP_GEAR_SPRITES } from './camp-gear';
export { UI_SPRITES as UI_ICON_SPRITES } from './ui-icons';
export { WEATHER_EXTENDED_SPRITES } from './weather-extended';
export { BACKGROUND_SPRITES } from './backgrounds';

// Character and NPC sprites
export { NPC_SPRITES } from './npcs';
export { EXPRESSION_SPRITES } from './expressions';

// Location sprites
export { TOWN_SPRITES } from './town';
export { MILESTONE_SPRITES } from './milestones';

// Creature sprites
export { INSECT_SPRITES } from './insects';

// Trail element sprites
export { OBSTACLE_SPRITES } from './obstacles';
export { TRAIL_MAGIC_SPRITES } from './trail-magic';

// Equipment and items
export { CLOTHING_SPRITES } from './clothing';
export { FOOD_SPRITES } from './food';
export { INJURY_SPRITES } from './injuries';

// Collectibles
export { BADGE_SPRITES } from './badges';

// Large-scale structures
export { SHELTER_DETAILED_SPRITES } from './shelters-detailed';
export { TOWN_DETAILED_SPRITES } from './town-detailed';
export { SUMMIT_SPRITES } from './summits';
export { BRIDGE_SPRITES } from './bridges';
export { TRAILHEAD_SPRITES } from './trailheads';
export { CAMPSITE_SPRITES } from './campsites';

// Vehicles and transportation
export { VEHICLE_SPRITES } from './vehicles';

// Famous landmarks
export { LANDMARK_SPRITES } from './landmarks';

// AMC Huts (White Mountains)
export { AMC_HUT_SPRITES } from './amc-huts';

// Lighting and night effects
export { LIGHTING_SPRITES } from './lighting';

// Town resupply
export { RESUPPLY_SPRITES } from './resupply';

// Trail maintenance
export { TRAIL_TOOL_SPRITES } from './trail-tools';

// Scenic vistas
export { VISTA_SPRITES } from './vistas';

// Historical ruins
export { RUINS_SPRITES } from './ruins';

// Celebrations and finish
export { CELEBRATION_SPRITES } from './celebrations';

// Game UI elements
export { UI_GAME_SPRITES } from './ui-game';

// All sprites in one object for easy iteration
import { HIKER_SPRITES } from './hiker';
import { ENVIRONMENT_SPRITES } from './environment';
import { BLAZE_SPRITES } from './blazes';
import { STRUCTURE_SPRITES } from './structures';
import { WEATHER_SPRITES } from './weather';
import { UI_SPRITES } from './ui';
import { WILDLIFE_SPRITES } from './wildlife';
import { TRAIL_FEATURE_SPRITES } from './trail-features';
import { EXTENDED_STRUCTURE_SPRITES } from './structures-extended';
import { ITEM_SPRITES } from './items';
import { SIGN_SPRITES } from './signs';
import { TERRAIN_SPRITES } from './terrain';
import { PLANT_SPRITES } from './plants';
import { WATER_SPRITES } from './water-features';
import { CAMP_GEAR_SPRITES } from './camp-gear';
import { UI_SPRITES as UI_ICON_SPRITES } from './ui-icons';
import { WEATHER_EXTENDED_SPRITES } from './weather-extended';
import { BACKGROUND_SPRITES } from './backgrounds';
import { NPC_SPRITES } from './npcs';
import { EXPRESSION_SPRITES } from './expressions';
import { TOWN_SPRITES } from './town';
import { MILESTONE_SPRITES } from './milestones';
import { INSECT_SPRITES } from './insects';
import { OBSTACLE_SPRITES } from './obstacles';
import { TRAIL_MAGIC_SPRITES } from './trail-magic';
import { CLOTHING_SPRITES } from './clothing';
import { FOOD_SPRITES } from './food';
import { INJURY_SPRITES } from './injuries';
import { BADGE_SPRITES } from './badges';
import { SHELTER_DETAILED_SPRITES } from './shelters-detailed';
import { TOWN_DETAILED_SPRITES } from './town-detailed';
import { SUMMIT_SPRITES } from './summits';
import { BRIDGE_SPRITES } from './bridges';
import { TRAILHEAD_SPRITES } from './trailheads';
import { CAMPSITE_SPRITES } from './campsites';
import { VEHICLE_SPRITES } from './vehicles';
import { LANDMARK_SPRITES } from './landmarks';
import { AMC_HUT_SPRITES } from './amc-huts';
import { LIGHTING_SPRITES } from './lighting';
import { RESUPPLY_SPRITES } from './resupply';
import { TRAIL_TOOL_SPRITES } from './trail-tools';
import { VISTA_SPRITES } from './vistas';
import { RUINS_SPRITES } from './ruins';
import { CELEBRATION_SPRITES } from './celebrations';
import { UI_GAME_SPRITES } from './ui-game';

export const ALL_SPRITES = {
  // Core
  hiker: HIKER_SPRITES,
  environment: ENVIRONMENT_SPRITES,
  blazes: BLAZE_SPRITES,
  structures: STRUCTURE_SPRITES,
  weather: WEATHER_SPRITES,
  ui: UI_SPRITES,

  // Extended
  wildlife: WILDLIFE_SPRITES,
  trailFeatures: TRAIL_FEATURE_SPRITES,
  extendedStructures: EXTENDED_STRUCTURE_SPRITES,
  items: ITEM_SPRITES,
  signs: SIGN_SPRITES,
  terrain: TERRAIN_SPRITES,
  plants: PLANT_SPRITES,
  water: WATER_SPRITES,
  campGear: CAMP_GEAR_SPRITES,
  uiIcons: UI_ICON_SPRITES,
  weatherExtended: WEATHER_EXTENDED_SPRITES,
  backgrounds: BACKGROUND_SPRITES,

  // Characters & NPCs
  npcs: NPC_SPRITES,
  expressions: EXPRESSION_SPRITES,

  // Locations
  town: TOWN_SPRITES,
  milestones: MILESTONE_SPRITES,

  // Creatures
  insects: INSECT_SPRITES,

  // Trail Elements
  obstacles: OBSTACLE_SPRITES,
  trailMagic: TRAIL_MAGIC_SPRITES,

  // Equipment & Items
  clothing: CLOTHING_SPRITES,
  food: FOOD_SPRITES,
  injuries: INJURY_SPRITES,

  // Collectibles
  badges: BADGE_SPRITES,

  // Large-scale structures
  shelterDetailed: SHELTER_DETAILED_SPRITES,
  townDetailed: TOWN_DETAILED_SPRITES,
  summits: SUMMIT_SPRITES,
  bridges: BRIDGE_SPRITES,
  trailheads: TRAILHEAD_SPRITES,
  campsites: CAMPSITE_SPRITES,

  // Transportation
  vehicles: VEHICLE_SPRITES,

  // Famous landmarks
  landmarks: LANDMARK_SPRITES,

  // AMC Huts
  amcHuts: AMC_HUT_SPRITES,

  // Lighting effects
  lighting: LIGHTING_SPRITES,

  // Town resupply
  resupply: RESUPPLY_SPRITES,

  // Trail tools
  trailTools: TRAIL_TOOL_SPRITES,

  // Scenic vistas
  vistas: VISTA_SPRITES,

  // Historical ruins
  ruins: RUINS_SPRITES,

  // Celebrations
  celebrations: CELEBRATION_SPRITES,

  // Game UI
  uiGame: UI_GAME_SPRITES,
};
