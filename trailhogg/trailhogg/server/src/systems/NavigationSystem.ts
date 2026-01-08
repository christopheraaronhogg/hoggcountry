import { HikerSchema, GameTimeSchema } from '../schema/GameState';

// ============================================
// TRAILHOGG - Navigation System
// Stub implementation - full system in Phase 1
// ============================================

export type LostState = 'on_trail' | 'mildly_lost' | 'moderately_lost' | 'severely_lost';
export type BlazeType = 'single' | 'double' | 'double_right' | 'double_left' | 'blue' | 'cairn';

export class NavigationSystem {

  // Check if hiker can see a blaze at current position
  static checkBlazeVisibility(
    hiker: HikerSchema,
    time: GameTimeSchema,
    weather: string
  ): { visible: boolean; type?: BlazeType } {
    // Base visibility chance
    let visibility = 0.8;

    // Time of day affects visibility
    const hour = time.hour;
    if (hour < 6 || hour > 20) visibility *= 0.3; // Night
    else if (hour < 7 || hour > 19) visibility *= 0.6; // Dawn/dusk

    // Weather effects
    if (weather === 'fog') visibility *= 0.4;
    if (weather === 'rain_heavy' || weather === 'storm') visibility *= 0.6;
    if (weather === 'rain_light') visibility *= 0.8;

    // Fatigue reduces attention
    if (hiker.energy < 40) visibility *= 0.8;
    if (hiker.energy < 20) visibility *= 0.6;

    // Pace affects visibility - faster pace means easier to miss
    if (hiker.pace === 'fast') visibility *= 0.8;
    if (hiker.pace === 'rush') visibility *= 0.6;
    if (hiker.pace === 'slow') visibility *= 1.2;

    // Navigation skill helps
    const skillBonus = hiker.skills.navigation / 200;
    visibility = Math.min(1.0, visibility * (1 + skillBonus));

    const visible = Math.random() < visibility;
    return { visible, type: visible ? 'single' : undefined };
  }

  // Process lost state changes based on distance since last blaze
  static processLostState(
    hiker: HikerSchema,
    blazeVisible: boolean,
    distanceSinceLastBlaze: number
  ): LostState {
    if (blazeVisible) {
      return 'on_trail';
    }

    const currentState = hiker.lostState as LostState;

    if (currentState === 'on_trail' && distanceSinceLastBlaze > 0.3) {
      return 'mildly_lost';
    }
    if (currentState === 'mildly_lost' && distanceSinceLastBlaze > 0.5) {
      return 'moderately_lost';
    }
    if (currentState === 'moderately_lost' && distanceSinceLastBlaze > 1.0) {
      return 'severely_lost';
    }

    return currentState;
  }

  // Handle searching for the trail
  static searchForTrail(hiker: HikerSchema): { found: boolean; message: string } {
    let searchChance = 0.3;

    // Navigation skill helps
    searchChance += hiker.skills.navigation / 100 * 0.4;

    // Lost state affects difficulty
    const lostState = hiker.lostState as LostState;
    if (lostState === 'moderately_lost') searchChance *= 0.7;
    if (lostState === 'severely_lost') searchChance *= 0.4;

    // Fatigue makes it harder
    if (hiker.energy < 40) searchChance *= 0.8;
    if (hiker.energy < 20) searchChance *= 0.6;

    const found = Math.random() < searchChance;

    // Improve navigation skill
    hiker.skills.navigation = Math.min(100, hiker.skills.navigation + 0.5);

    // Searching costs energy
    hiker.energy = Math.max(0, hiker.energy - 5);

    if (found) {
      hiker.lostState = 'on_trail';
      return { found: true, message: 'Found a white blaze! Back on trail.' };
    }

    return { found: false, message: 'Still searching for the trail...' };
  }

  // Handle backtracking
  static backtrack(hiker: HikerSchema): { success: boolean; message: string } {
    let success = Math.random() < 0.6;
    success = success || Math.random() < (hiker.skills.navigation / 100 * 0.3);

    // Backtrack costs energy and distance
    hiker.energy = Math.max(0, hiker.energy - 10);
    hiker.mile = Math.max(0, hiker.mile - 0.1);
    hiker.totalMilesHiked += 0.1;

    if (success) {
      const lostState = hiker.lostState as LostState;
      if (lostState === 'severely_lost') {
        hiker.lostState = 'moderately_lost';
        return { success: true, message: 'Making progress... still somewhat lost.' };
      }
      if (lostState === 'moderately_lost') {
        hiker.lostState = 'mildly_lost';
        return { success: true, message: 'Getting closer to the trail.' };
      }
      if (lostState === 'mildly_lost') {
        hiker.lostState = 'on_trail';
        return { success: true, message: 'Found the trail!' };
      }
    }

    return { success: false, message: 'Backtracking...' };
  }

  // Update anxiety based on lost state
  static updateAnxiety(hiker: HikerSchema): void {
    const lostState = hiker.lostState as LostState;

    if (lostState === 'on_trail') {
      hiker.moodles.anxiety = Math.max(0, hiker.moodles.anxiety - 1);
    } else if (lostState === 'mildly_lost') {
      hiker.moodles.anxiety = Math.min(1, hiker.moodles.anxiety);
    } else if (lostState === 'moderately_lost') {
      hiker.moodles.anxiety = Math.min(2, Math.max(hiker.moodles.anxiety, 1));
    } else if (lostState === 'severely_lost') {
      hiker.moodles.anxiety = Math.min(3, Math.max(hiker.moodles.anxiety, 2));
    }

    // Mental fortitude helps resist anxiety
    const fortitudeBonus = hiker.skills.mentalFortitude / 100;
    if (Math.random() < fortitudeBonus) {
      hiker.moodles.anxiety = Math.max(0, hiker.moodles.anxiety - 1);
    }
  }
}
