/**
 * Hiker Statistics Calculator
 *
 * Takes quiz/form inputs and calculates real trail statistics
 * using data from trail-facts.yaml
 */

// AT total miles (AWOL 2024 mileage)
// Note: Can't import from trailFacts.ts here because it uses Node.js modules
const TRAIL_TOTAL_MILES = 2197.4;

// ============================================================================
// TYPES
// ============================================================================

export interface HikerInputs {
  // Timing
  startMonth: 'february' | 'march' | 'april' | 'may';
  startYear: number;

  // Pace
  dailyMiles: number;        // Target miles per day (8-20)
  zeroFrequency: 'rarely' | 'biweekly' | 'weekly' | 'frequently';

  // Budget
  totalBudget: number;       // Total $ for trip
  budgetStyle: 'shoestring' | 'moderate' | 'comfortable' | 'unlimited';

  // Experience (affects pace ramp-up)
  experienceLevel: 'none' | 'weekend' | 'multi' | 'thru';

  // Physical
  fitnessLevel: 'couch' | 'moderate' | 'active' | 'athlete';
}

export interface CalculatedStats {
  // Time
  totalDays: number;
  hikingDays: number;
  zeroDays: number;
  neroCount: number;         // Half-days (< 10 miles)
  expectedFinishDate: Date;
  finishMonth: string;

  // Distance
  totalMiles: number;
  avgDailyMiles: number;
  firstWeekMiles: number;    // Ramp-up period
  cruisingMiles: number;     // After legs are built

  // Budget
  dailyBudget: number;
  foodBudget: number;
  townBudget: number;
  gearReplacementBudget: number;
  emergencyBuffer: number;
  townStopsCount: number;
  avgTownCost: number;

  // Resupply
  resupplyStops: number;
  avgDaysBetweenResupply: number;
  maxCarryDays: number;

  // Milestones
  quarterMileDate: Date;
  halfwayDate: Date;
  threeQuarterDate: Date;
  katahdinDate: Date;

  // State breakdown
  stateStats: StateStats[];

  // Warnings/Notes
  warnings: string[];
  tips: string[];
}

export interface StateStats {
  state: string;
  miles: number;
  days: number;
  entryDate: Date;
  exitDate: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATE_MILES: { state: string; start: number; end: number }[] = [
  { state: 'GA', start: 0, end: 78.5 },
  { state: 'NC/TN', start: 78.5, end: 469 },
  { state: 'VA', start: 469, end: 1008 },
  { state: 'WV', start: 1008, end: 1025 },
  { state: 'MD', start: 1025, end: 1072 },
  { state: 'PA', start: 1072, end: 1298 },
  { state: 'NJ', start: 1298, end: 1368 },
  { state: 'NY', start: 1368, end: 1462 },
  { state: 'CT', start: 1462, end: 1518 },
  { state: 'MA', start: 1518, end: 1600 },
  { state: 'VT', start: 1600, end: 1754 },
  { state: 'NH', start: 1754, end: 1912 },
  { state: 'ME', start: 1912, end: TRAIL_TOTAL_MILES },
];

const ZERO_FREQUENCY_MAP = {
  rarely: { zerosPerMonth: 1, nerosPerMonth: 2 },
  biweekly: { zerosPerMonth: 2, nerosPerMonth: 3 },
  weekly: { zerosPerMonth: 4, nerosPerMonth: 4 },
  frequently: { zerosPerMonth: 6, nerosPerMonth: 5 },
};

const BUDGET_STYLE_COSTS = {
  shoestring: { townStop: 45, foodPerDay: 10, gearBuffer: 200 },
  moderate: { townStop: 85, foodPerDay: 14, gearBuffer: 400 },
  comfortable: { townStop: 140, foodPerDay: 18, gearBuffer: 600 },
  unlimited: { townStop: 200, foodPerDay: 22, gearBuffer: 1000 },
};

const START_DATES: Record<string, number> = {
  february: 15,
  march: 1,
  april: 1,
  may: 1,
};

// Pace adjustments based on experience
const PACE_MULTIPLIERS = {
  none: { week1: 0.6, week2: 0.75, week3: 0.85, cruising: 0.95 },
  weekend: { week1: 0.7, week2: 0.8, week3: 0.9, cruising: 1.0 },
  multi: { week1: 0.8, week2: 0.9, week3: 0.95, cruising: 1.0 },
  thru: { week1: 0.85, week2: 0.95, week3: 1.0, cruising: 1.05 },
};

// Fitness affects sustainable pace
const FITNESS_PACE_BONUS = {
  couch: -2,
  moderate: 0,
  active: 1,
  athlete: 2,
};

// ============================================================================
// CALCULATOR
// ============================================================================

export function calculateHikerStats(inputs: HikerInputs): CalculatedStats {
  const warnings: string[] = [];
  const tips: string[] = [];

  // Calculate effective daily pace
  const basePace = inputs.dailyMiles + FITNESS_PACE_BONUS[inputs.fitnessLevel];
  const paceMultiplier = PACE_MULTIPLIERS[inputs.experienceLevel];

  // Week-by-week pace during ramp-up
  const week1Pace = basePace * paceMultiplier.week1;
  const week2Pace = basePace * paceMultiplier.week2;
  const week3Pace = basePace * paceMultiplier.week3;
  const cruisingPace = basePace * paceMultiplier.cruising;

  // Miles in first 3 weeks (ramp-up)
  const rampUpMiles = (week1Pace * 7) + (week2Pace * 7) + (week3Pace * 7);
  const remainingMiles = TRAIL_TOTAL_MILES - rampUpMiles;

  // Zero/nero frequency
  const zeroFreq = ZERO_FREQUENCY_MAP[inputs.zeroFrequency];

  // Calculate hiking days at cruising pace
  const cruisingDays = Math.ceil(remainingMiles / cruisingPace);
  const totalHikingDays = 21 + cruisingDays; // 3 weeks ramp + cruising

  // Calculate zeros and neros
  const totalMonths = totalHikingDays / 30;
  const zeroDays = Math.round(zeroFreq.zerosPerMonth * totalMonths);
  const neroCount = Math.round(zeroFreq.nerosPerMonth * totalMonths);

  // Total days
  const totalDays = totalHikingDays + zeroDays;

  // Start and finish dates
  const startDate = new Date(inputs.startYear, getMonthIndex(inputs.startMonth), START_DATES[inputs.startMonth]);
  const finishDate = new Date(startDate);
  finishDate.setDate(finishDate.getDate() + totalDays);

  // Milestone dates
  const quarterDate = addDaysForMiles(startDate, TRAIL_TOTAL_MILES * 0.25, cruisingPace, zeroDays, totalDays);
  const halfwayDate = addDaysForMiles(startDate, TRAIL_TOTAL_MILES * 0.5, cruisingPace, zeroDays, totalDays);
  const threeQuarterDate = addDaysForMiles(startDate, TRAIL_TOTAL_MILES * 0.75, cruisingPace, zeroDays, totalDays);

  // Budget breakdown
  const budgetCosts = BUDGET_STYLE_COSTS[inputs.budgetStyle];
  const resupplyStops = Math.ceil(TRAIL_TOTAL_MILES / (cruisingPace * 4)); // ~4 days between resupply
  const townBudget = resupplyStops * budgetCosts.townStop;
  const foodBudget = totalDays * budgetCosts.foodPerDay;
  const gearBudget = budgetCosts.gearBuffer;
  const totalNeeded = townBudget + foodBudget + gearBudget;
  const emergencyBuffer = inputs.totalBudget - totalNeeded;

  // State breakdown
  const stateStats = calculateStateStats(startDate, cruisingPace, zeroDays, totalDays);

  // Generate warnings
  if (emergencyBuffer < 300) {
    warnings.push('Budget is tight. Build in a $500 emergency buffer if possible.');
  }
  if (inputs.experienceLevel === 'none' && inputs.dailyMiles > 15) {
    warnings.push('15+ miles/day is ambitious for first-time thru-hikers. Consider 12-14 to start.');
  }
  if (inputs.startMonth === 'february' && inputs.experienceLevel === 'none') {
    warnings.push('February start with no backpacking experience is challenging. Cold weather gear is critical.');
  }
  if (finishDate.getMonth() >= 9) { // October+
    warnings.push('Late finish date. Baxter State Park may close trails due to weather. Build buffer days.');
  }

  // Generate tips
  if (inputs.budgetStyle === 'shoestring') {
    tips.push('Stealth camp when possible, use hiker boxes, and cook your own meals.');
  }
  if (inputs.zeroFrequency === 'rarely') {
    tips.push('Low zero days works, but listen to your body. One injury can end your hike.');
  }
  if (inputs.experienceLevel === 'none') {
    tips.push('Your first 2 weeks will be a gear shakedown. Mail home what you don\'t need from Neels Gap.');
  }

  return {
    totalDays,
    hikingDays: totalHikingDays,
    zeroDays,
    neroCount,
    expectedFinishDate: finishDate,
    finishMonth: finishDate.toLocaleDateString('en-US', { month: 'long' }),

    totalMiles: TRAIL_TOTAL_MILES,
    avgDailyMiles: Math.round((TRAIL_TOTAL_MILES / totalHikingDays) * 10) / 10,
    firstWeekMiles: Math.round(week1Pace * 7),
    cruisingMiles: Math.round(cruisingPace),

    dailyBudget: Math.round(inputs.totalBudget / totalDays),
    foodBudget: Math.round(foodBudget),
    townBudget: Math.round(townBudget),
    gearReplacementBudget: gearBudget,
    emergencyBuffer: Math.round(emergencyBuffer),
    townStopsCount: resupplyStops,
    avgTownCost: budgetCosts.townStop,

    resupplyStops,
    avgDaysBetweenResupply: 4,
    maxCarryDays: 6,

    quarterMileDate: quarterDate,
    halfwayDate: halfwayDate,
    threeQuarterDate: threeQuarterDate,
    katahdinDate: finishDate,

    stateStats,
    warnings,
    tips,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getMonthIndex(month: string): number {
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  return months.indexOf(month.toLowerCase());
}

function addDaysForMiles(startDate: Date, targetMiles: number, pace: number, zeros: number, totalDays: number): Date {
  const hikingDaysNeeded = Math.ceil(targetMiles / pace);
  const proportionalZeros = Math.round((hikingDaysNeeded / (totalDays - zeros)) * zeros);
  const daysNeeded = hikingDaysNeeded + proportionalZeros;

  const result = new Date(startDate);
  result.setDate(result.getDate() + daysNeeded);
  return result;
}

function calculateStateStats(startDate: Date, pace: number, zeros: number, totalDays: number): StateStats[] {
  const stats: StateStats[] = [];
  let currentDate = new Date(startDate);

  for (const state of STATE_MILES) {
    const miles = state.end - state.start;
    const hikingDays = Math.ceil(miles / pace);
    const proportionalZeros = Math.round((hikingDays / (totalDays - zeros)) * zeros / STATE_MILES.length);
    const days = hikingDays + proportionalZeros;

    const entryDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + days);
    const exitDate = new Date(currentDate);

    stats.push({
      state: state.state,
      miles: Math.round(miles),
      days,
      entryDate,
      exitDate,
    });
  }

  return stats;
}

// ============================================================================
// FORMATTED OUTPUT HELPERS
// ============================================================================

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
