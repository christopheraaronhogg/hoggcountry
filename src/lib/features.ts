/**
 * FEATURE FLAGS
 * Use these to toggle repository functionality.
 * Turning off a feature hides it from the main UI but keeps the data indexed.
 */

export const FEATURES = {
  // SOCIAL & LOGBOOK (The "Off" Flags)
  YOUTUBE_RSS: false,       // Hide YouTube video feeds
  TRIP_REPORTS: false,      // Hide the legacy trip timeline
  BLOG_POSTS: false,        // Hide the blog section
  
  // REMARKABLE ENGINE (The "On" Flags)
  DAILY_WISDOM: true,       // Enable the Proverbs/KJV Resilience Engine
  GEAR_LAB: true,           // Enable the Interactive Gear Research tool
  FIELD_GUIDE_SEARCH: true, // Enable the deep-search Field Guide
  TRAIL_INSTRUMENTS: true,  // Enable the calculator suite
};

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}
