import { GameTimeSchema } from '../schema/GameState';

// ============================================
// TRAILHOGG - Weather System
// Stub implementation - full system in Phase 1
// ============================================

export type WeatherType = 'clear' | 'cloudy' | 'rain_light' | 'rain_heavy' | 'fog' | 'storm';

interface WeatherTransition {
  to: WeatherType;
  probability: number;
}

// Weather state machine
const WEATHER_TRANSITIONS: Record<WeatherType, WeatherTransition[]> = {
  clear: [
    { to: 'clear', probability: 0.7 },
    { to: 'cloudy', probability: 0.25 },
    { to: 'fog', probability: 0.05 }
  ],
  cloudy: [
    { to: 'cloudy', probability: 0.5 },
    { to: 'clear', probability: 0.2 },
    { to: 'rain_light', probability: 0.25 },
    { to: 'fog', probability: 0.05 }
  ],
  rain_light: [
    { to: 'rain_light', probability: 0.5 },
    { to: 'cloudy', probability: 0.25 },
    { to: 'rain_heavy', probability: 0.2 },
    { to: 'clear', probability: 0.05 }
  ],
  rain_heavy: [
    { to: 'rain_heavy', probability: 0.4 },
    { to: 'rain_light', probability: 0.3 },
    { to: 'storm', probability: 0.2 },
    { to: 'cloudy', probability: 0.1 }
  ],
  fog: [
    { to: 'fog', probability: 0.6 },
    { to: 'cloudy', probability: 0.25 },
    { to: 'clear', probability: 0.1 },
    { to: 'rain_light', probability: 0.05 }
  ],
  storm: [
    { to: 'storm', probability: 0.3 },
    { to: 'rain_heavy', probability: 0.5 },
    { to: 'rain_light', probability: 0.15 },
    { to: 'cloudy', probability: 0.05 }
  ]
};

// Base temperatures by hour (March/April in Georgia mountains)
const BASE_TEMPS: Record<number, number> = {
  0: 40, 1: 38, 2: 37, 3: 36, 4: 35, 5: 36,
  6: 40, 7: 45, 8: 50, 9: 54, 10: 58, 11: 62,
  12: 65, 13: 67, 14: 68, 15: 67, 16: 65, 17: 62,
  18: 58, 19: 54, 20: 50, 21: 47, 22: 44, 23: 42
};

// Temperature modifiers by weather
const WEATHER_TEMP_MODIFIERS: Record<WeatherType, number> = {
  clear: 5,
  cloudy: 0,
  rain_light: -5,
  rain_heavy: -10,
  fog: -3,
  storm: -8
};

export class WeatherSystem {

  // Check for weather transition
  static maybeChangeWeather(currentWeather: string): string {
    const weather = currentWeather as WeatherType;
    const transitionChance = 0.1;

    if (Math.random() < transitionChance) {
      return this.getNextWeather(weather);
    }

    return currentWeather;
  }

  // Get next weather state using transition probabilities
  private static getNextWeather(current: WeatherType): WeatherType {
    const transitions = WEATHER_TRANSITIONS[current] || WEATHER_TRANSITIONS.clear;
    const roll = Math.random();

    let cumulative = 0;
    for (const transition of transitions) {
      cumulative += transition.probability;
      if (roll < cumulative) {
        return transition.to;
      }
    }

    return current;
  }

  // Calculate current temperature
  static calculateTemperature(
    time: GameTimeSchema,
    weather: string,
    elevation: number = 3500
  ): number {
    const baseTemp = BASE_TEMPS[time.hour] || 55;
    const weatherMod = WEATHER_TEMP_MODIFIERS[weather as WeatherType] || 0;

    // Elevation adjustment (colder at higher elevations, -3.5F per 1000ft above 3000ft)
    const elevationAboveBase = Math.max(0, elevation - 3000);
    const elevationMod = (elevationAboveBase / 1000) * -3.5;

    // Random variation
    const randomVariation = (Math.random() - 0.5) * 6;

    return Math.round(baseTemp + weatherMod + elevationMod + randomVariation);
  }

  // Get weather description for UI
  static getWeatherDescription(weather: string, temperature: number): string {
    const descriptions: Record<string, string> = {
      clear: 'Clear skies',
      cloudy: 'Cloudy',
      rain_light: 'Light rain',
      rain_heavy: 'Heavy rain',
      fog: 'Dense fog',
      storm: 'Thunderstorm'
    };

    return `${descriptions[weather] || 'Unknown'}, ${temperature}°F`;
  }

  // Check if weather is dangerous
  static isDangerous(weather: string, temperature: number): boolean {
    if (weather === 'storm') return true;
    if (temperature < 35 && weather === 'rain_heavy') return true;
    return false;
  }

  // Get hiking difficulty modifier from weather
  static getHikingModifier(weather: string): number {
    const modifiers: Record<string, number> = {
      clear: 1.0,
      cloudy: 1.0,
      rain_light: 0.9,
      rain_heavy: 0.7,
      fog: 0.8,
      storm: 0.5
    };

    return modifiers[weather] || 1.0;
  }

  // Morning fog chance (common in GA mountains)
  static shouldHaveMorningFog(time: GameTimeSchema): boolean {
    if (time.hour >= 5 && time.hour < 9) {
      return Math.random() < 0.3;
    }
    return false;
  }
}
