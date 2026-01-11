/**
 * GlobalTime - UTC-based synchronized game time for P2P MMO
 *
 * No server needed! Everyone's computer has a clock.
 * All players see the same time, weather, and world state.
 *
 * Compression: 1 real minute = 10 game minutes
 * Full day cycle: 2.4 real hours (144 real minutes)
 *
 * Time is offset so that:
 * - Real midnight UTC = 6 AM game time (hikers wake up!)
 * - Peak playing hours (evening) = daytime hiking
 */

export interface GameTime {
  hour: number;         // 0-23
  minute: number;       // 0-59
  day: number;          // Days since epoch (for weather seeding)
  phase: 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening';
  isNight: boolean;
  isDawn: boolean;
  isDusk: boolean;
  sunPosition: number;  // 0-1 (0 = midnight, 0.5 = noon)
  season: 'spring' | 'summer' | 'fall' | 'winter';
  monthName: string;
}

// Time compression ratio: 1 real minute = 10 game minutes
const COMPRESSION_RATIO = 10;

// Offset so midnight UTC = 6 AM game time
const HOUR_OFFSET = 6;

// Milliseconds per game minute
const MS_PER_GAME_MINUTE = 60000 / COMPRESSION_RATIO; // 6000ms = 6 seconds

/**
 * Get the current synchronized game time
 * Everyone calling this at the same real moment gets the same result
 */
export function getGlobalTime(): GameTime {
  const now = Date.now();

  // Calculate total game minutes since Unix epoch
  const totalGameMinutes = Math.floor(now / MS_PER_GAME_MINUTE);

  // Minutes within the current game day (1440 minutes in a day)
  const dayMinutes = totalGameMinutes % 1440;

  // Apply hour offset
  const offsetMinutes = (dayMinutes + (HOUR_OFFSET * 60)) % 1440;

  const hour = Math.floor(offsetMinutes / 60);
  const minute = offsetMinutes % 60;

  // Game day (for weather seeding - changes every 2.4 real hours)
  const gameDay = Math.floor(totalGameMinutes / 1440);

  // Determine time phase
  const phase = getTimePhase(hour);

  // Sun position (0 = midnight, 0.5 = noon, 1 = midnight)
  const sunPosition = ((hour * 60 + minute) / 1440);

  // Real-world season (based on actual calendar for immersion)
  const realDate = new Date(now);
  const season = getRealSeason(realDate);
  const monthName = getTrailMonth(realDate);

  return {
    hour,
    minute,
    day: gameDay,
    phase,
    isNight: hour < 5 || hour >= 21,
    isDawn: hour >= 5 && hour < 7,
    isDusk: hour >= 19 && hour < 21,
    sunPosition,
    season,
    monthName
  };
}

/**
 * Get time phase for UI and gameplay
 */
function getTimePhase(hour: number): GameTime['phase'] {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 19) return 'dusk';
  if (hour >= 19 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get real-world season (AT thru-hike context)
 */
function getRealSeason(date: Date): GameTime['season'] {
  const month = date.getMonth(); // 0-11

  if (month >= 2 && month <= 4) return 'spring';   // Mar-May (bubble season!)
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'fall';    // Sep-Nov
  return 'winter';                                  // Dec-Feb
}

/**
 * Get trail-relevant month name
 */
function getTrailMonth(date: Date): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[date.getMonth()];
}

/**
 * Format time for display (12-hour format)
 */
export function formatGameTime(time: GameTime): string {
  const hour12 = time.hour % 12 || 12;
  const ampm = time.hour < 12 ? 'AM' : 'PM';
  const minuteStr = time.minute.toString().padStart(2, '0');
  return `${hour12}:${minuteStr} ${ampm}`;
}

/**
 * Format time for display (24-hour format)
 */
export function formatGameTime24(time: GameTime): string {
  const hourStr = time.hour.toString().padStart(2, '0');
  const minuteStr = time.minute.toString().padStart(2, '0');
  return `${hourStr}:${minuteStr}`;
}

/**
 * Get sky color based on time of day
 */
export function getSkyColor(time: GameTime): number {
  const { hour } = time;

  // Night (dark blue)
  if (hour < 5 || hour >= 21) return 0x0a1628;

  // Dawn (orange/pink gradient)
  if (hour >= 5 && hour < 7) {
    const t = (hour - 5 + time.minute / 60) / 2;
    return lerpColor(0x1a1a3a, 0xffaa66, t);
  }

  // Morning (light blue)
  if (hour >= 7 && hour < 10) return 0x87CEEB;

  // Midday (bright blue)
  if (hour >= 10 && hour < 14) return 0x5dadec;

  // Afternoon (warm blue)
  if (hour >= 14 && hour < 17) return 0x87CEEB;

  // Dusk (orange/purple)
  if (hour >= 17 && hour < 19) {
    const t = (hour - 17 + time.minute / 60) / 2;
    return lerpColor(0xffaa66, 0x553366, t);
  }

  // Evening (deep purple)
  if (hour >= 19 && hour < 21) {
    const t = (hour - 19 + time.minute / 60) / 2;
    return lerpColor(0x553366, 0x0a1628, t);
  }

  return 0x87CEEB;
}

/**
 * Get ambient light level (0-1) for gameplay
 */
export function getAmbientLight(time: GameTime): number {
  const { hour, minute } = time;
  const hourFloat = hour + minute / 60;

  // Full dark: 0-5, 21-24
  if (hourFloat < 5 || hourFloat >= 21) return 0.1;

  // Dawn ramp up: 5-7
  if (hourFloat >= 5 && hourFloat < 7) {
    return 0.1 + 0.9 * ((hourFloat - 5) / 2);
  }

  // Full day: 7-19
  if (hourFloat >= 7 && hourFloat < 19) return 1.0;

  // Dusk ramp down: 19-21
  if (hourFloat >= 19 && hourFloat < 21) {
    return 1.0 - 0.9 * ((hourFloat - 19) / 2);
  }

  return 1.0;
}

/**
 * Linear interpolation between two colors
 */
function lerpColor(color1: number, color2: number, t: number): number {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;

  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return (r << 16) | (g << 8) | b;
}

/**
 * Check if it's a good time to start hiking (for NPCs/tips)
 */
export function isGoodHikingTime(time: GameTime): boolean {
  return time.hour >= 6 && time.hour < 18;
}

/**
 * Get hiking tip based on time
 */
export function getTimeBasedTip(time: GameTime): string | null {
  if (time.hour >= 5 && time.hour < 6) {
    return "Dawn is breaking. Perfect time to start hiking!";
  }
  if (time.hour >= 11 && time.hour < 13) {
    return "Midday sun - stay hydrated!";
  }
  if (time.hour >= 17 && time.hour < 18) {
    return "Start looking for a campsite soon.";
  }
  if (time.hour >= 19 && time.hour < 20) {
    return "Getting dark - time to set up camp!";
  }
  if (time.isNight) {
    return "Night hiking requires a headlamp.";
  }
  return null;
}

/**
 * Singleton for easy access
 */
class GlobalTimeManager {
  private listeners: Set<(time: GameTime) => void> = new Set();
  private intervalId: number | null = null;
  private lastTime: GameTime | null = null;

  /**
   * Start broadcasting time updates (every game minute = 6 real seconds)
   */
  start() {
    if (this.intervalId) return;

    // Update every 6 seconds (1 game minute)
    this.intervalId = window.setInterval(() => {
      const time = getGlobalTime();

      // Only notify if minute changed
      if (!this.lastTime || time.minute !== this.lastTime.minute) {
        this.lastTime = time;
        this.listeners.forEach(cb => cb(time));
      }
    }, MS_PER_GAME_MINUTE);

    // Immediate first update
    this.lastTime = getGlobalTime();
    this.listeners.forEach(cb => cb(this.lastTime!));
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Subscribe to time updates
   */
  onTimeChange(callback: (time: GameTime) => void) {
    this.listeners.add(callback);
    // Immediately call with current time
    callback(getGlobalTime());
  }

  offTimeChange(callback: (time: GameTime) => void) {
    this.listeners.delete(callback);
  }

  /**
   * Get current time (doesn't need subscription)
   */
  now(): GameTime {
    return getGlobalTime();
  }
}

export const globalTime = new GlobalTimeManager();
