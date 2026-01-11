/**
 * DeterministicWeather - Seeded weather system for P2P MMO
 *
 * No server needed! Everyone calculates the same weather.
 * Weather is determined by:
 * - Game day (from GlobalTime)
 * - Zone ID (from TrailData)
 * - Season (from real calendar)
 *
 * Same inputs = same weather for all players.
 */

import { getGlobalTime, type GameTime } from './GlobalTime';
import { getZoneById, type TerrainZone } from '../data/TrailData';

export type WeatherType =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'rain_light'
  | 'rain_heavy'
  | 'thunderstorm'
  | 'snow_light'
  | 'snow_heavy';

export interface Weather {
  type: WeatherType;
  temperature: number;      // Fahrenheit
  windSpeed: number;        // MPH
  humidity: number;         // 0-100
  visibility: number;       // 0-1 (1 = clear, 0 = zero visibility)
  precipitationChance: number; // 0-1

  // Gameplay effects
  hikingSpeedMod: number;   // Multiplier (1.0 = normal)
  energyDrainMod: number;   // Multiplier (1.0 = normal)
  moraleMod: number;        // Per-tick modifier

  // Display
  description: string;
  icon: string;
}

/**
 * Seeded random number generator (Mulberry32)
 * Same seed = same sequence of numbers
 */
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Simple string hash for seed generation
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get base temperature for zone and season
 */
function getBaseTemperature(zone: TerrainZone, season: GameTime['season']): number {
  // Base temps by elevation (higher = colder)
  const elevationFactor = (zone.avgElevation - 1000) / 100; // ~1°F per 100ft

  // Season base temps (for southern AT)
  const seasonBase: Record<string, number> = {
    spring: 55,
    summer: 75,
    fall: 50,
    winter: 35
  };

  // Zone-specific adjustments
  const zoneAdjust: Record<string, number> = {
    'whites': -15,           // White Mountains are cold!
    'smokies': -5,           // High elevation
    'me_mahoosuc': -10,      // Maine is cold
    'me_100mile': -8,
    'katahdin': -12,
    'roan_highlands': -5,
    'shenandoah': 5,         // Generally mild
    'va_central': 8,         // Low elevation Virginia
  };

  const base = seasonBase[season] || 55;
  const zoneAdj = zoneAdjust[zone.type] || 0;

  return base - elevationFactor + zoneAdj;
}

/**
 * Get weather probabilities based on zone and season
 */
function getWeatherProbabilities(zone: TerrainZone, season: GameTime['season']): Record<WeatherType, number> {
  // Base probabilities
  const base: Record<WeatherType, number> = {
    clear: 0.35,
    partly_cloudy: 0.25,
    cloudy: 0.15,
    fog: 0.05,
    rain_light: 0.10,
    rain_heavy: 0.05,
    thunderstorm: 0.03,
    snow_light: 0.01,
    snow_heavy: 0.01
  };

  // Seasonal adjustments
  if (season === 'summer') {
    base.thunderstorm = 0.08;
    base.rain_heavy = 0.08;
    base.snow_light = 0;
    base.snow_heavy = 0;
  } else if (season === 'winter') {
    base.snow_light = 0.15;
    base.snow_heavy = 0.08;
    base.thunderstorm = 0.01;
    base.clear = 0.25;
  } else if (season === 'spring') {
    base.rain_light = 0.15;
    base.fog = 0.08;
  }

  // Zone-specific adjustments
  if (zone.type === 'smokies') {
    base.fog = 0.15;        // Smokies are foggy!
    base.rain_light = 0.12;
  }
  if (zone.type === 'whites') {
    base.fog = 0.12;
    base.rain_heavy = 0.08;
    if (season !== 'summer') {
      base.snow_light = 0.10;
    }
  }
  if (zone.type === 'vt_green') {
    base.rain_light = 0.15; // Vermont mud season!
    base.fog = 0.10;
  }

  return base;
}

/**
 * Pick weather type based on probabilities and RNG
 */
function pickWeatherType(probs: Record<WeatherType, number>, rng: () => number): WeatherType {
  const roll = rng();
  let cumulative = 0;

  for (const [type, prob] of Object.entries(probs)) {
    cumulative += prob;
    if (roll < cumulative) {
      return type as WeatherType;
    }
  }

  return 'clear'; // Fallback
}

/**
 * Get weather for a specific zone at current global time
 * Everyone calling this with same zone gets same result!
 */
export function getWeatherForZone(zoneId: string): Weather {
  const time = getGlobalTime();
  const zone = getZoneById(zoneId);

  if (!zone) {
    return getDefaultWeather();
  }

  // Create deterministic seed from day + zone
  const seed = hashCode(`${time.day}-${zoneId}-weather`);
  const rng = seededRandom(seed);

  // Get probabilities for this zone/season
  const probs = getWeatherProbabilities(zone, time.season);

  // Pick weather type
  const type = pickWeatherType(probs, rng);

  // Calculate temperature
  const baseTemp = getBaseTemperature(zone, time.season);

  // Time of day affects temp
  let tempMod = 0;
  if (time.isNight) tempMod = -10;
  else if (time.isDawn) tempMod = -5;
  else if (time.phase === 'midday') tempMod = 10;
  else if (time.isDusk) tempMod = 0;

  // Weather affects temp
  const weatherTempMod: Record<WeatherType, number> = {
    clear: 5,
    partly_cloudy: 0,
    cloudy: -5,
    fog: -3,
    rain_light: -8,
    rain_heavy: -12,
    thunderstorm: -15,
    snow_light: -20,
    snow_heavy: -25
  };

  // Random variation (±5°F)
  const tempVariation = (rng() - 0.5) * 10;

  const temperature = Math.round(baseTemp + tempMod + weatherTempMod[type] + tempVariation);

  // Wind speed (higher at elevation, varies by weather)
  const baseWind = zone.avgElevation > 4000 ? 15 : 8;
  const weatherWindMod: Record<WeatherType, number> = {
    clear: 0,
    partly_cloudy: 3,
    cloudy: 5,
    fog: -3,
    rain_light: 8,
    rain_heavy: 15,
    thunderstorm: 25,
    snow_light: 10,
    snow_heavy: 20
  };
  const windSpeed = Math.max(0, baseWind + weatherWindMod[type] + (rng() * 10));

  // Humidity
  const humidityBase: Record<WeatherType, number> = {
    clear: 40,
    partly_cloudy: 50,
    cloudy: 65,
    fog: 95,
    rain_light: 85,
    rain_heavy: 95,
    thunderstorm: 90,
    snow_light: 70,
    snow_heavy: 75
  };
  const humidity = Math.min(100, humidityBase[type] + (rng() * 15));

  // Visibility
  const visibilityBase: Record<WeatherType, number> = {
    clear: 1.0,
    partly_cloudy: 0.95,
    cloudy: 0.85,
    fog: 0.2,
    rain_light: 0.7,
    rain_heavy: 0.4,
    thunderstorm: 0.3,
    snow_light: 0.5,
    snow_heavy: 0.25
  };
  const visibility = visibilityBase[type];

  // Gameplay modifiers
  const hikingSpeedMod: Record<WeatherType, number> = {
    clear: 1.0,
    partly_cloudy: 1.0,
    cloudy: 1.0,
    fog: 0.85,
    rain_light: 0.9,
    rain_heavy: 0.7,
    thunderstorm: 0.5,
    snow_light: 0.75,
    snow_heavy: 0.5
  };

  const energyDrainMod: Record<WeatherType, number> = {
    clear: 1.0,
    partly_cloudy: 1.0,
    cloudy: 1.0,
    fog: 1.1,
    rain_light: 1.2,
    rain_heavy: 1.5,
    thunderstorm: 1.8,
    snow_light: 1.4,
    snow_heavy: 1.8
  };

  const moraleMod: Record<WeatherType, number> = {
    clear: 0.05,
    partly_cloudy: 0.02,
    cloudy: 0,
    fog: -0.02,
    rain_light: -0.05,
    rain_heavy: -0.1,
    thunderstorm: -0.15,
    snow_light: -0.05,
    snow_heavy: -0.12
  };

  // Descriptions
  const descriptions: Record<WeatherType, string> = {
    clear: 'Clear skies',
    partly_cloudy: 'Partly cloudy',
    cloudy: 'Overcast',
    fog: 'Foggy',
    rain_light: 'Light rain',
    rain_heavy: 'Heavy rain',
    thunderstorm: 'Thunderstorm',
    snow_light: 'Light snow',
    snow_heavy: 'Heavy snow'
  };

  const icons: Record<WeatherType, string> = {
    clear: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    fog: '🌫️',
    rain_light: '🌧️',
    rain_heavy: '🌧️',
    thunderstorm: '⛈️',
    snow_light: '🌨️',
    snow_heavy: '❄️'
  };

  return {
    type,
    temperature,
    windSpeed: Math.round(windSpeed),
    humidity: Math.round(humidity),
    visibility,
    precipitationChance: type.includes('rain') || type.includes('snow') ? 1 : 0,
    hikingSpeedMod: hikingSpeedMod[type],
    energyDrainMod: energyDrainMod[type],
    moraleMod: moraleMod[type],
    description: descriptions[type],
    icon: icons[type]
  };
}

/**
 * Default weather when zone not found
 */
function getDefaultWeather(): Weather {
  return {
    type: 'clear',
    temperature: 65,
    windSpeed: 5,
    humidity: 50,
    visibility: 1.0,
    precipitationChance: 0,
    hikingSpeedMod: 1.0,
    energyDrainMod: 1.0,
    moraleMod: 0,
    description: 'Clear skies',
    icon: '☀️'
  };
}

/**
 * Format weather for display
 */
export function formatWeather(weather: Weather): string {
  return `${weather.icon} ${weather.description}, ${weather.temperature}°F`;
}

/**
 * Get weather alert if conditions are dangerous
 */
export function getWeatherAlert(weather: Weather): string | null {
  if (weather.type === 'thunderstorm') {
    return '⚠️ THUNDERSTORM WARNING: Seek shelter immediately! Avoid exposed ridges.';
  }
  if (weather.type === 'snow_heavy') {
    return '⚠️ HEAVY SNOW: Dangerous conditions. Consider waiting it out.';
  }
  if (weather.temperature < 32) {
    return `🥶 FREEZING: ${weather.temperature}°F - Risk of hypothermia. Stay dry!`;
  }
  if (weather.temperature > 90) {
    return `🥵 HEAT ALERT: ${weather.temperature}°F - Stay hydrated, take breaks in shade.`;
  }
  if (weather.visibility < 0.3) {
    return '👁️ LOW VISIBILITY: Easy to lose the trail. Watch for blazes carefully.';
  }
  return null;
}

/**
 * Check if weather will change soon (for forecasting)
 * Returns weather for next "period" (4 game hours)
 */
export function getForecast(zoneId: string): Weather {
  const time = getGlobalTime();

  // Create seed for 4 hours from now
  const futureMinutes = time.hour * 60 + time.minute + 240; // 4 hours ahead
  const futureDay = time.day + Math.floor(futureMinutes / 1440);

  const seed = hashCode(`${futureDay}-${zoneId}-weather`);
  const rng = seededRandom(seed);

  const zone = getZoneById(zoneId);
  if (!zone) return getDefaultWeather();

  const probs = getWeatherProbabilities(zone, time.season);
  const type = pickWeatherType(probs, rng);

  // Simplified forecast
  const descriptions: Record<WeatherType, string> = {
    clear: 'Clear',
    partly_cloudy: 'Partly cloudy',
    cloudy: 'Cloudy',
    fog: 'Foggy',
    rain_light: 'Light rain',
    rain_heavy: 'Heavy rain',
    thunderstorm: 'Storms',
    snow_light: 'Light snow',
    snow_heavy: 'Heavy snow'
  };

  return {
    ...getDefaultWeather(),
    type,
    description: descriptions[type]
  };
}
