/**
 * Trail Context Store - Svelte 5 Reactive State
 *
 * Central source of truth for user's trail position and settings.
 * Persists to localStorage and provides computed/derived values.
 *
 * Usage:
 *   import { trailContext, updateContext, loadContext } from '@/stores/trailContext.svelte';
 *
 *   // In component onMount:
 *   loadContext();
 *
 *   // Read values:
 *   const mile = trailContext.currentMile;
 *   const finish = trailContext.projectedFinish;
 *
 *   // Update values:
 *   updateContext({ currentMile: 500 });
 */

// Trail landmarks for mile context (used across multiple tools)
export const landmarks = [
  { mile: 0, name: 'Springer Mountain' },
  { mile: 31, name: 'Neels Gap' },
  { mile: 78, name: 'NC Border' },
  { mile: 110, name: 'Franklin' },
  { mile: 166, name: 'Fontana Dam' },
  { mile: 206, name: 'Newfound Gap' },
  { mile: 274, name: 'Hot Springs' },
  { mile: 386, name: 'Damascus' },
  { mile: 550, name: 'Pearisburg' },
  { mile: 702, name: 'Waynesboro' },
  { mile: 1025, name: 'Harpers Ferry' },
  { mile: 1099, name: 'Halfway Point' },
  { mile: 1290, name: 'Delaware Water Gap' },
  { mile: 1525, name: 'CT Border' },
  { mile: 1630, name: 'VT Border' },
  { mile: 1791, name: 'White Mountains' },
  { mile: 1912, name: 'Maine Border' },
  { mile: 2090, name: 'Monson' },
  { mile: 2198, name: 'Katahdin' },
];

// Total trail miles (canonical value)
export const TRAIL_TOTAL_MILES = 2197.4;

// LocalStorage key (preserved for backward compatibility)
const STORAGE_KEY = 'trailContext';

// ========== HELPER FUNCTIONS ==========

function isPastDate(dateStr: string): boolean {
  return new Date(dateStr) <= new Date();
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function addDaysToDate(dateStr: string, days: number): Date {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date;
}

function getNearestLandmark(mile: number): { mile: number; name: string } {
  let closest = landmarks[0];
  let minDist = Math.abs(mile - landmarks[0].mile);
  for (const lm of landmarks) {
    const dist = Math.abs(mile - lm.mile);
    if (dist < minDist) {
      minDist = dist;
      closest = lm;
    }
  }
  return closest;
}

function getCalendarDaysForMiles(miles: number, targetPace: number, zeroDaysPerMonth: number): number {
  const hikingDays = Math.ceil(miles / targetPace);
  return Math.ceil(hikingDays / (1 - zeroDaysPerMonth / 30));
}

// ========== STATE ==========

// Core state values (persisted to localStorage)
let _currentMile = $state(0);
let _startDate = $state('2026-03-01');
let _targetPace = $state(15);
let _zeroDaysPerMonth = $state(4);
let _contextExpanded = $state(true);
let _mounted = $state(false);

// ========== DERIVED VALUES ==========

// Mode detection
const _isOnTrail = $derived(_currentMile > 0 || isPastDate(_startDate));
const _mode = $derived(_isOnTrail ? 'trail' : 'planning');

// Progress and position
const _nearestLandmark = $derived(getNearestLandmark(_currentMile));
const _percentComplete = $derived(Number(((_currentMile / TRAIL_TOTAL_MILES) * 100).toFixed(1)));
const _milesRemaining = $derived(Math.round(TRAIL_TOTAL_MILES - _currentMile));

// Time calculations
const _daysOnTrail = $derived(_isOnTrail ? Math.max(1, daysBetween(_startDate, getTodayStr())) : 0);
const _actualPace = $derived(_isOnTrail && _daysOnTrail > 0 ? Number((_currentMile / _daysOnTrail).toFixed(1)) : _targetPace);

// Planning calculations
const _hikingDaysPlanned = $derived(Math.ceil(TRAIL_TOTAL_MILES / _targetPace));
const _totalDaysPlanned = $derived(Math.ceil(_hikingDaysPlanned / (1 - _zeroDaysPerMonth / 30)));

// Effective date for projections
const _effectiveDate = $derived(isPastDate(_startDate) ? getTodayStr() : _startDate);

// Days to finish
const _daysToFinish = $derived(
  _isOnTrail
    ? getCalendarDaysForMiles(_milesRemaining, _targetPace, _zeroDaysPerMonth)
    : _totalDaysPlanned
);

// Projected finish date
const _projectedFinish = $derived(addDaysToDate(_effectiveDate, _daysToFinish));

// ========== EXPORTED CONTEXT OBJECT ==========

/**
 * Reactive trail context object.
 * All properties are reactive and will trigger updates when accessed in Svelte components.
 */
export const trailContext = {
  // Core inputs (mutable via updateContext)
  get currentMile() { return _currentMile; },
  get startDate() { return _startDate; },
  get targetPace() { return _targetPace; },
  get zeroDaysPerMonth() { return _zeroDaysPerMonth; },
  get contextExpanded() { return _contextExpanded; },

  // Mode
  get mode() { return _mode; },
  get isOnTrail() { return _isOnTrail; },

  // Position & Progress
  get nearestLandmark() { return _nearestLandmark; },
  get percentComplete() { return _percentComplete; },
  get milesRemaining() { return _milesRemaining; },

  // Time
  get daysOnTrail() { return _daysOnTrail; },
  get actualPace() { return _actualPace; },
  get effectiveDate() { return _effectiveDate; },
  get projectedFinish() { return _projectedFinish; },

  // Planning
  get hikingDaysPlanned() { return _hikingDaysPlanned; },
  get totalDaysPlanned() { return _totalDaysPlanned; },
  get daysToFinish() { return _daysToFinish; },

  // Legacy aliases (for backward compatibility with existing tools)
  get pace() { return _targetPace; },
  get tripStartDate() { return _startDate; },

  // Internal state
  get mounted() { return _mounted; },
};

// ========== CONTEXT MANAGEMENT FUNCTIONS ==========

/**
 * Load context from localStorage.
 * Call this in onMount() of components that use the context.
 */
export function loadContext(): void {
  if (typeof window === 'undefined') return;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const ctx = JSON.parse(saved);
      _currentMile = ctx.currentMile ?? 0;
      _startDate = ctx.startDate || ctx.tripStartDate || _startDate;
      _targetPace = ctx.targetPace || ctx.pace || _targetPace;
      _zeroDaysPerMonth = ctx.zeroDaysPerMonth ?? 4;
      _contextExpanded = ctx.contextExpanded ?? true;
    } catch (e) {
      console.warn('Failed to parse trailContext from localStorage:', e);
    }
  }

  _mounted = true;
}

/**
 * Save context to localStorage.
 * Called automatically by updateContext().
 */
export function saveContext(): void {
  if (typeof window === 'undefined' || !_mounted) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentMile: _currentMile,
    startDate: _startDate,
    targetPace: _targetPace,
    zeroDaysPerMonth: _zeroDaysPerMonth,
    contextExpanded: _contextExpanded,
  }));
}

/**
 * Update context values and persist to localStorage.
 *
 * @example
 * updateContext({ currentMile: 500 });
 * updateContext({ targetPace: 18, zeroDaysPerMonth: 3 });
 */
export function updateContext(updates: {
  currentMile?: number;
  startDate?: string;
  targetPace?: number;
  zeroDaysPerMonth?: number;
  contextExpanded?: boolean;
}, options?: { persist?: boolean }): void {
  if (updates.currentMile !== undefined) _currentMile = updates.currentMile;
  if (updates.startDate !== undefined) _startDate = updates.startDate;
  if (updates.targetPace !== undefined) _targetPace = updates.targetPace;
  if (updates.zeroDaysPerMonth !== undefined) _zeroDaysPerMonth = updates.zeroDaysPerMonth;
  if (updates.contextExpanded !== undefined) _contextExpanded = updates.contextExpanded;

  if (options?.persist === false) return;
  saveContext();
}

/**
 * Reset context to defaults (used for testing or user reset).
 */
export function resetContext(): void {
  _currentMile = 0;
  _startDate = '2026-03-01';
  _targetPace = 15;
  _zeroDaysPerMonth = 4;
  _contextExpanded = true;
  saveContext();
}

/**
 * Build a plain object snapshot of the context.
 * Useful for passing to child components as props.
 */
export function getContextSnapshot(): {
  mode: 'planning' | 'trail';
  isOnTrail: boolean;
  currentMile: number;
  startDate: string;
  targetPace: number;
  zeroDaysPerMonth: number;
  effectiveDate: string;
  daysOnTrail: number;
  actualPace: number;
  percentComplete: number;
  nearestLandmark: { mile: number; name: string };
  projectedFinish: Date;
  hikingDaysPlanned: number;
  totalDaysPlanned: number;
  milesRemaining: number;
  daysToFinish: number;
  pace: number;
  tripStartDate: string;
} {
  return {
    mode: _mode,
    isOnTrail: _isOnTrail,
    currentMile: _currentMile,
    startDate: _startDate,
    targetPace: _targetPace,
    zeroDaysPerMonth: _zeroDaysPerMonth,
    effectiveDate: _effectiveDate,
    daysOnTrail: _daysOnTrail,
    actualPace: _actualPace,
    percentComplete: _percentComplete,
    nearestLandmark: _nearestLandmark,
    projectedFinish: _projectedFinish,
    hikingDaysPlanned: _hikingDaysPlanned,
    totalDaysPlanned: _totalDaysPlanned,
    milesRemaining: _milesRemaining,
    daysToFinish: _daysToFinish,
    // Legacy aliases
    pace: _targetPace,
    tripStartDate: _startDate,
  };
}
