/**
 * Centralized AT trail constants
 * Single source of truth for trail facts used across the TrailHogg game
 *
 * Values sourced from AWOL's AT Guide (2025 edition) for consistency
 * with the main hoggcountry.com site
 */

// ============================================================================
// TRAIL TOTALS
// ============================================================================

/** Total AT distance in miles (AWOL 2025) */
export const TRAIL_TOTAL_MILES = 2197.4;

/** Total number of states the AT passes through */
export const TRAIL_TOTAL_STATES = 14;

// ============================================================================
// KEY LANDMARKS
// ============================================================================

/** Southern terminus */
export const SPRINGER_MOUNTAIN = {
  name: 'Springer Mountain',
  mile: 0,
  elevation: 3782,
  state: 'GA',
} as const;

/** Northern terminus */
export const KATAHDIN = {
  name: 'Mt. Katahdin (Baxter Peak)',
  mile: TRAIL_TOTAL_MILES,
  elevation: 5269,
  state: 'ME',
} as const;

/** Highest point on the AT */
export const KUWOHI = {
  name: 'Kuwohi (Clingmans Dome)',
  mile: 209,
  elevation: 6643,
  state: 'TN',
} as const;

/** Lowest point on the AT */
export const BEAR_MOUNTAIN_BRIDGE = {
  name: 'Bear Mountain Bridge',
  mile: 1408,
  elevation: 124,
  state: 'NY',
} as const;

// ============================================================================
// STATE BOUNDARIES (NOBO miles)
// ============================================================================

export const STATE_BOUNDARIES = {
  GA_NC: 78.5,
  NC_TN_SMOKIES: 165.7,  // Entering Smokies
  SMOKIES_END: 241,      // Exiting Smokies
  TN_VA: 471.0,          // Damascus
  VA_WV: 1008.5,
  WV_MD: 1024.4,         // Harpers Ferry
  MD_PA: 1067.3,
  PA_NJ: 1295.5,
  NJ_NY: 1368.5,         // Delaware Water Gap
  NY_CT: 1445.5,
  CT_MA: 1508.5,
  MA_VT: 1591.6,
  VT_NH: 1746.2,
  NH_ME: 1904.8,
} as const;
