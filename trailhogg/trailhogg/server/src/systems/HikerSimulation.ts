import { HikerSchema, GameTimeSchema } from '../schema/GameState';

// ============================================
// TRAILHOGG - Hiker Simulation System
// Stub implementation - full system in Phase 1
// ============================================

const PACE_CONFIGS = {
  rest: { speedMultiplier: 0, calorieMultiplier: 0.3, fatigueMultiplier: -2 },
  slow: { speedMultiplier: 0.6, calorieMultiplier: 0.7, fatigueMultiplier: 0.5 },
  normal: { speedMultiplier: 1.0, calorieMultiplier: 1.0, fatigueMultiplier: 1.0 },
  fast: { speedMultiplier: 1.4, calorieMultiplier: 1.3, fatigueMultiplier: 1.5 },
  rush: { speedMultiplier: 1.8, calorieMultiplier: 1.6, fatigueMultiplier: 2.5 }
};

export class HikerSimulation {

  // Update hiker stats based on current activity
  static updateHiker(
    hiker: HikerSchema,
    _time: GameTimeSchema,
    weather: string,
    deltaMinutes: number
  ): void {
    const paceConfig = PACE_CONFIGS[hiker.pace as keyof typeof PACE_CONFIGS] || PACE_CONFIGS.normal;

    if (!hiker.isHiking) return;

    // Calculate calorie burn
    const baseCaloriesPerMinute = 5;
    const calorieBurn = baseCaloriesPerMinute * deltaMinutes * paceConfig.calorieMultiplier;
    hiker.calories = Math.max(0, hiker.calories - calorieBurn);

    // Water consumption
    const baseWaterPerMinute = 0.5;
    hiker.hydration = Math.max(0, hiker.hydration - (baseWaterPerMinute * deltaMinutes * paceConfig.speedMultiplier));

    // Energy/fatigue
    const fatigueChange = 0.1 * deltaMinutes * paceConfig.fatigueMultiplier;
    hiker.energy = Math.max(0, Math.min(100, hiker.energy - fatigueChange));

    // Update moodles based on values
    this.updateMoodles(hiker, weather);
  }

  // Calculate hiking distance for a time period
  static calculateDistance(hiker: HikerSchema, deltaMinutes: number): number {
    const paceConfig = PACE_CONFIGS[hiker.pace as keyof typeof PACE_CONFIGS] || PACE_CONFIGS.normal;
    const baseMilesPerHour = 2.0;

    // Fatigue penalty
    let fatigueMultiplier = 1.0;
    if (hiker.energy < 40) fatigueMultiplier = 0.8;
    if (hiker.energy < 20) fatigueMultiplier = 0.5;

    // Skill bonus
    const skillBonus = 1 + (hiker.skills.trailLegs / 200);

    const milesPerMinute = (baseMilesPerHour / 60) * paceConfig.speedMultiplier;
    return milesPerMinute * deltaMinutes * fatigueMultiplier * skillBonus;
  }

  // Update moodles based on stats
  private static updateMoodles(hiker: HikerSchema, weather: string): void {
    // Hunger
    if (hiker.calories < 500) hiker.moodles.hunger = 3;
    else if (hiker.calories < 1000) hiker.moodles.hunger = 2;
    else if (hiker.calories < 1500) hiker.moodles.hunger = 1;
    else hiker.moodles.hunger = 0;

    // Thirst
    if (hiker.hydration < 20) hiker.moodles.thirst = 3;
    else if (hiker.hydration < 40) hiker.moodles.thirst = 2;
    else if (hiker.hydration < 60) hiker.moodles.thirst = 1;
    else hiker.moodles.thirst = 0;

    // Fatigue
    if (hiker.energy < 20) hiker.moodles.fatigue = 3;
    else if (hiker.energy < 40) hiker.moodles.fatigue = 2;
    else if (hiker.energy < 60) hiker.moodles.fatigue = 1;
    else hiker.moodles.fatigue = 0;

    // Weather effects on wetness
    if (weather === 'rain_heavy' || weather === 'storm') {
      hiker.moodles.wetness = Math.min(3, hiker.moodles.wetness + 1);
    } else if (weather === 'rain_light') {
      hiker.moodles.wetness = Math.min(2, hiker.moodles.wetness + 1);
    } else if (weather === 'clear') {
      hiker.moodles.wetness = Math.max(0, hiker.moodles.wetness - 1);
    }
  }

  // Rest/sleep recovery
  static rest(hiker: HikerSchema, hours: number, quality: number = 1.0): void {
    const baseRecovery = 10 * hours * quality;
    hiker.energy = Math.min(100, hiker.energy + baseRecovery);

    // Skill improvement from rest
    if (hours >= 6) {
      hiker.skills.mentalFortitude = Math.min(100, hiker.skills.mentalFortitude + 0.1);
    }
  }

  // Eat food
  static eat(hiker: HikerSchema, calories: number): void {
    hiker.calories = Math.min(3000, hiker.calories + calories);
  }

  // Drink water
  static drink(hiker: HikerSchema, liters: number): void {
    if (hiker.inventory.water >= liters) {
      hiker.inventory.water -= liters;
      hiker.hydration = Math.min(100, hiker.hydration + (liters * 30));
    }
  }

  // Fill water
  static fillWater(hiker: HikerSchema, liters: number): void {
    hiker.inventory.water = Math.min(hiker.inventory.waterCapacity, hiker.inventory.water + liters);
  }

  // Improve skill through use
  static improveSkill(hiker: HikerSchema, skill: keyof InstanceType<typeof HikerSchema>['skills'], amount: number): void {
    const skills = hiker.skills as unknown as Record<string, number>;
    const currentValue = skills[skill as string] || 0;
    const improvementRate = 1 - (currentValue / 100);
    const actualImprovement = amount * improvementRate;
    skills[skill as string] = Math.min(100, currentValue + actualImprovement);
  }
}
