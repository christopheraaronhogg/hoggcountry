// ============================================
// TRAIL LEGS - Shared Types & Constants
// ============================================

export const GAME_TICK_MS = 100;
export const MINUTES_PER_TICK = 1;
export const FEET_PER_MILE = 5280;

export enum GamePhase {
  MORNING = 'morning',
  HIKING = 'hiking',
  EVENING = 'evening',
  NIGHT = 'night',
  TOWN = 'town'
}

export enum Weather {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN_LIGHT = 'rain_light',
  RAIN_HEAVY = 'rain_heavy',
  FOG = 'fog',
  STORM = 'storm'
}

export enum TerrainType {
  SMOOTH = 'smooth',
  ROCKY = 'rocky',
  ROOTY = 'rooty',
  BOGGY = 'boggy',
  STEEP_UP = 'steep_up',
  STEEP_DOWN = 'steep_down'
}

export enum BlazeType {
  SINGLE_WHITE = 'single_white',
  DOUBLE_WHITE = 'double_white',
  DOUBLE_WHITE_LEFT = 'double_white_left',
  DOUBLE_WHITE_RIGHT = 'double_white_right',
  BLUE = 'blue',
  CAIRN = 'cairn'
}

export enum LostState {
  ON_TRAIL = 'on_trail',
  MILDLY_LOST = 'mildly_lost',
  MODERATELY_LOST = 'moderately_lost',
  SEVERELY_LOST = 'severely_lost'
}

export enum HikerPace {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast',
  RUSH = 'rush'
}

export enum MoodleLevel {
  NONE = 0,
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
  CRITICAL = 4
}

export enum CharacterBuild {
  WEEKEND_WARRIOR = 'weekend_warrior',
  SCOUT_LEADER = 'scout_leader',
  ULTRA_RUNNER = 'ultra_runner',
  GEAR_HEAD = 'gear_head',
  BROKE_COLLEGE_KID = 'broke_college_kid',
  RETIREE = 'retiree'
}

export enum GearCategory {
  SHELTER = 'shelter',
  SLEEP = 'sleep',
  COOK = 'cook',
  WATER = 'water',
  CLOTHING = 'clothing',
  NAVIGATION = 'navigation',
  FIRST_AID = 'first_aid',
  MISC = 'misc'
}

export interface Skills {
  trailLegs: number;
  navigation: number;
  foraging: number;
  campCraft: number;
  gearMaintenance: number;
  firstAid: number;
  trailCooking: number;
  weatherReading: number;
  social: number;
  mentalFortitude: number;
}

export interface Moodles {
  hunger: MoodleLevel;
  thirst: MoodleLevel;
  fatigue: MoodleLevel;
  pain: MoodleLevel;
  cold: MoodleLevel;
  heat: MoodleLevel;
  wetness: MoodleLevel;
  morale: number;
  loneliness: MoodleLevel;
  anxiety: MoodleLevel;
  homesickness: MoodleLevel;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
}

export interface WaterSource {
  id: string;
  name: string;
  mile: number;
  reliable: boolean;
  flowRate: number;
  distanceFromTrail: number;
}

export interface Shelter {
  id: string;
  name: string;
  mile: number;
  elevation: number;
  capacity: number;
  hasPrivy: boolean;
  hasBearBox: boolean;
  hasTentSites: boolean;
  waterSourceId?: string;
  description: string;
}

export interface Town {
  id: string;
  name: string;
  mile: number;
  distanceFromTrail: number;
  hasGrocery: boolean;
  hasOutfitter: boolean;
  hasPostOffice: boolean;
  hasLodging: boolean;
  hasRestaurant: boolean;
  priceLevel: number;
  description: string;
}

export interface Blaze {
  id: string;
  mile: number;
  type: BlazeType;
  sideOfTrail: 'left' | 'right' | 'both';
}

export interface TrailSegment {
  id: string;
  startMile: number;
  endMile: number;
  name: string;
  terrain: TerrainType;
  elevationGain: number;
  elevationLoss: number;
  difficulty: number;
  blazeFrequency: number;
}

export interface GearItem {
  id: string;
  name: string;
  weight: number;
  condition: number;
  category: GearCategory;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  weight: number;
  servings: number;
}

export const DEFAULT_SKILLS: Skills = {
  trailLegs: 10, navigation: 15, foraging: 5, campCraft: 10,
  gearMaintenance: 10, firstAid: 10, trailCooking: 10,
  weatherReading: 10, social: 20, mentalFortitude: 20
};

export const DEFAULT_MOODLES: Moodles = {
  hunger: MoodleLevel.NONE, thirst: MoodleLevel.NONE,
  fatigue: MoodleLevel.NONE, pain: MoodleLevel.NONE,
  cold: MoodleLevel.NONE, heat: MoodleLevel.NONE,
  wetness: MoodleLevel.NONE, morale: 50,
  loneliness: MoodleLevel.NONE, anxiety: MoodleLevel.NONE,
  homesickness: MoodleLevel.NONE
};

export interface BuildModifiers {
  name: string;
  description: string;
  skillModifiers: Partial<Skills>;
  startingMoney: number;
  startingGearQuality: number;
}

export const BUILD_DATA: Record<CharacterBuild, BuildModifiers> = {
  [CharacterBuild.WEEKEND_WARRIOR]: {
    name: 'Weekend Warrior',
    description: 'Decent fitness and budget, but lacks trail experience.',
    skillModifiers: { trailLegs: 25, navigation: 10, campCraft: 15 },
    startingMoney: 800, startingGearQuality: 60
  },
  [CharacterBuild.SCOUT_LEADER]: {
    name: 'Scout Leader',
    description: 'Strong outdoor skills, modest fitness.',
    skillModifiers: { campCraft: 35, firstAid: 30, navigation: 25, trailLegs: 15 },
    startingMoney: 500, startingGearQuality: 50
  },
  [CharacterBuild.ULTRA_RUNNER]: {
    name: 'Ultra Runner',
    description: 'Incredible fitness, but tends to push too hard.',
    skillModifiers: { trailLegs: 50, mentalFortitude: 30 },
    startingMoney: 600, startingGearQuality: 55
  },
  [CharacterBuild.GEAR_HEAD]: {
    name: 'Gear Head',
    description: 'Top-notch equipment, needs to build fitness.',
    skillModifiers: { gearMaintenance: 40, trailLegs: 5 },
    startingMoney: 400, startingGearQuality: 90
  },
  [CharacterBuild.BROKE_COLLEGE_KID]: {
    name: 'Broke College Kid',
    description: 'High motivation, learns fast, but strapped for cash.',
    skillModifiers: { mentalFortitude: 25, social: 30 },
    startingMoney: 200, startingGearQuality: 30
  },
  [CharacterBuild.RETIREE]: {
    name: 'Retiree',
    description: 'Unlimited time, wise pacing, slower recovery.',
    skillModifiers: { mentalFortitude: 40, weatherReading: 25, trailLegs: 15 },
    startingMoney: 1200, startingGearQuality: 70
  }
};

export const PACE_SPEEDS: Record<HikerPace, number> = {
  [HikerPace.SLOW]: 1.5, [HikerPace.NORMAL]: 2.0,
  [HikerPace.FAST]: 2.5, [HikerPace.RUSH]: 3.0
};

export const PACE_FATIGUE: Record<HikerPace, number> = {
  [HikerPace.SLOW]: 0.5, [HikerPace.NORMAL]: 1.0,
  [HikerPace.FAST]: 1.8, [HikerPace.RUSH]: 3.0
};

export const PACE_BLAZE_MISS: Record<HikerPace, number> = {
  [HikerPace.SLOW]: 0.5, [HikerPace.NORMAL]: 1.0,
  [HikerPace.FAST]: 1.5, [HikerPace.RUSH]: 2.5
};

export function formatMile(mile: number): string {
  return mile.toFixed(1);
}

export function formatTime(time: GameTime): string {
  const hour12 = time.hour % 12 || 12;
  const ampm = time.hour < 12 ? 'AM' : 'PM';
  return `${hour12}:${time.minute.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDayTime(time: GameTime): string {
  return `Day ${time.day}, ${formatTime(time)}`;
}
