/**
 * Trail Facts - TypeScript Interface to YAML Database
 *
 * This module provides type-safe access to trail-facts.yaml.
 * It is the programmatic interface for all AT data in the codebase.
 *
 * Usage:
 *   import { facts, getFact, formatFact } from '@/data/trailFacts';
 *
 *   // Direct access
 *   const miles = facts.trail.total_miles.value; // 2197.4
 *
 *   // Path-based access (for templates)
 *   const miles = getFact('trail.total_miles'); // 2197.4
 *
 *   // Formatted access
 *   const display = formatFact('trail.total_miles', 'commas'); // "2,197.4"
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';

// =============================================================================
// TYPES
// =============================================================================

export interface Citation {
  source: 'ATC' | 'AWOL' | 'NPS' | 'USFS' | 'ALDHA' | 'MEASURED';
  year: number;
  page?: number;
  url?: string;
  note?: string;
}

export interface FactValue<T = number | string> {
  value: T;
  display?: string;
  marketing?: string;
  unit?: string;
  approximate?: boolean;
  note?: string;
  citation: Citation;
}

export interface Landmark {
  name: string;
  mile: number;
  elevation: number;
  state: string;
  type: 'summit' | 'gap' | 'town' | 'landmark' | 'boundary';
  significance?: string;
  renamed?: string;
  note?: string;
  citation: Citation;
}

export interface Town {
  name: string;
  mile: number;
  state: string;
  distance_from_trail: number;
  services: {
    grocery: boolean;
    outfitter: boolean;
    hostel: boolean;
    post_office: boolean;
    laundry: boolean;
    restaurant: boolean;
  };
  note?: string;
  citation: Citation;
}

export interface State {
  id: string;
  name: string;
  entry_mile: number;
  exit_mile: number;
  miles: number;
  note?: string;
  citation: Citation;
}

export interface TrailFacts {
  _meta: {
    version: string;
    awol_edition: number;
    last_verified: string;
    next_audit: string;
    maintainer: string;
  };
  trail: {
    total_miles: FactValue<number>;
    approach_trail_miles: FactValue<number>;
    total_elevation_gain: FactValue<number>;
    state_count: FactValue<number>;
    shelter_count: FactValue<number>;
    completion_rate: FactValue<number>;
    average_completion_days: FactValue<number> & { range: string };
  };
  states: State[];
  landmarks: Record<string, Landmark>;
  towns: Record<string, Town>;
  extremes: {
    highest_point: Landmark;
    lowest_point: Landmark;
    longest_state: { name: string; miles: number; citation: Citation };
    shortest_state: { name: string; miles: number; citation: Citation };
    hardest_mile: { name: string; mile: number; state: string; citation: Citation };
  };
  hiker: Record<string, unknown>;
  amc_huts: Array<{ name: string; mile: number; elevation: number; note?: string; citation: Citation }>;
}

// =============================================================================
// LOAD YAML
// =============================================================================

let _facts: TrailFacts | null = null;

/**
 * Load and parse the trail facts YAML file
 */
export function loadFacts(): TrailFacts {
  if (_facts) return _facts;

  // Handle both ESM and CJS contexts
  let yamlPath: string;

  if (typeof __dirname !== 'undefined') {
    // CommonJS context
    yamlPath = path.join(__dirname, 'trail-facts.yaml');
  } else {
    // ESM context
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    yamlPath = path.join(__dirname, 'trail-facts.yaml');
  }

  const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
  _facts = yaml.load(yamlContent) as TrailFacts;

  return _facts;
}

/**
 * Get the loaded facts (or load them if not already loaded)
 */
export const facts = new Proxy({} as TrailFacts, {
  get(target, prop) {
    const loaded = loadFacts();
    return loaded[prop as keyof TrailFacts];
  }
});

// =============================================================================
// ACCESS HELPERS
// =============================================================================

/**
 * Get a fact value by dot-notation path
 *
 * @example
 * getFact('trail.total_miles')           // returns the FactValue object
 * getFact('trail.total_miles.value')     // returns 2197.4
 * getFact('landmarks.blood_mountain')    // returns full landmark object
 * getFact('landmarks.blood_mountain.elevation') // returns 4458
 */
export function getFact(path: string): unknown {
  const loaded = loadFacts();
  const parts = path.split('.');

  let current: unknown = loaded;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  // If we got a FactValue object and user didn't specify .value, return the value
  if (current && typeof current === 'object' && 'value' in current && !path.endsWith('.value')) {
    // Only auto-extract .value if path doesn't go deeper
    const lastPart = parts[parts.length - 1];
    if (!['citation', 'display', 'marketing', 'unit', 'note', 'approximate'].includes(lastPart)) {
      return (current as FactValue).value;
    }
  }

  return current;
}

/**
 * Format a fact value with optional formatting
 *
 * @param path - Dot-notation path to the fact
 * @param format - Format to apply: 'raw' | 'commas' | 'round' | 'display' | 'marketing'
 *
 * @example
 * formatFact('trail.total_miles', 'raw')       // "2197.4"
 * formatFact('trail.total_miles', 'commas')    // "2,197.4"
 * formatFact('trail.total_miles', 'round')     // "2197"
 * formatFact('trail.total_miles', 'display')   // "2,197.4" (uses .display if available)
 * formatFact('trail.total_miles', 'marketing') // "2,190+" (uses .marketing if available)
 */
export function formatFact(path: string, format: 'raw' | 'commas' | 'round' | 'display' | 'marketing' = 'raw'): string {
  const loaded = loadFacts();
  const parts = path.split('.');

  let current: unknown = loaded;

  for (const part of parts) {
    if (current === null || current === undefined) return '';
    if (typeof current !== 'object') return String(current);
    current = (current as Record<string, unknown>)[part];
  }

  if (current === null || current === undefined) return '';

  // Handle FactValue objects
  if (typeof current === 'object' && 'value' in current) {
    const factValue = current as FactValue;

    switch (format) {
      case 'display':
        return factValue.display ?? formatNumber(factValue.value, 'commas');
      case 'marketing':
        return factValue.marketing ?? formatNumber(factValue.value, 'commas');
      case 'commas':
        return formatNumber(factValue.value, 'commas');
      case 'round':
        return formatNumber(factValue.value, 'round');
      case 'raw':
      default:
        return String(factValue.value);
    }
  }

  // Handle raw values
  if (typeof current === 'number') {
    const numFmt = format === 'raw' ? 'raw' : format === 'round' ? 'round' : 'commas';
    return formatNumber(current, numFmt);
  }

  return String(current);
}

function formatNumber(value: unknown, format: 'raw' | 'commas' | 'round'): string {
  if (typeof value !== 'number') return String(value);

  switch (format) {
    case 'commas':
      return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
    case 'round':
      return Math.round(value).toString();
    case 'raw':
    default:
      return value.toString();
  }
}

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/**
 * Find a landmark by name (fuzzy match)
 */
export function findLandmark(name: string): Landmark | undefined {
  const loaded = loadFacts();
  const lower = name.toLowerCase();

  for (const [, landmark] of Object.entries(loaded.landmarks)) {
    if (landmark.name.toLowerCase().includes(lower) || lower.includes(landmark.name.toLowerCase())) {
      return landmark;
    }
  }

  return undefined;
}

/**
 * Find a town by name (fuzzy match)
 */
export function findTown(name: string): Town | undefined {
  const loaded = loadFacts();
  const lower = name.toLowerCase();

  for (const [, town] of Object.entries(loaded.towns)) {
    if (town.name.toLowerCase().includes(lower) || lower.includes(town.name.toLowerCase())) {
      return town;
    }
  }

  return undefined;
}

/**
 * Get landmarks in a state
 */
export function getLandmarksByState(stateId: string): Landmark[] {
  const loaded = loadFacts();
  const upper = stateId.toUpperCase();

  return Object.values(loaded.landmarks).filter(l =>
    l.state.toUpperCase().includes(upper)
  );
}

/**
 * Get towns in a state
 */
export function getTownsByState(stateId: string): Town[] {
  const loaded = loadFacts();
  const upper = stateId.toUpperCase();

  return Object.values(loaded.towns).filter(t =>
    t.state.toUpperCase() === upper
  );
}

/**
 * Get the state for a given mile marker
 */
export function getStateAtMile(mile: number): State | undefined {
  const loaded = loadFacts();

  return loaded.states.find(s =>
    mile >= s.entry_mile && mile <= s.exit_mile
  );
}

// =============================================================================
// TEMPLATE PROCESSING
// =============================================================================

/**
 * Process template syntax in a string
 *
 * Supports:
 * - {{path.to.fact}}           → raw value
 * - {{path.to.fact|commas}}    → formatted with commas
 * - {{path.to.fact|round}}     → rounded
 * - {{path.to.fact|display}}   → uses .display if available
 * - {{path.to.fact|marketing}} → uses .marketing if available
 *
 * @example
 * processTemplate("The trail is {{trail.total_miles|commas}} miles long.")
 * // "The trail is 2,197.4 miles long."
 */
export function processTemplate(template: string): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    const [path, format] = expr.trim().split('|');
    return formatFact(path.trim(), (format?.trim() || 'raw') as 'raw' | 'commas' | 'round' | 'display' | 'marketing');
  });
}

/**
 * Generate a fact box markdown for a landmark
 */
export function generateFactBox(landmarkId: string): string {
  const loaded = loadFacts();
  const landmark = loaded.landmarks[landmarkId];

  if (!landmark) return `<!-- Landmark not found: ${landmarkId} -->`;

  const lines = [
    `> **${landmark.name}**`,
    `> Mile ${landmark.mile.toLocaleString('en-US', { maximumFractionDigits: 1 })} | Elevation ${landmark.elevation.toLocaleString('en-US')} ft | ${landmark.state}`,
  ];

  if (landmark.significance) {
    lines.push(`> *${landmark.significance}*`);
  }

  lines.push(`> <small>Source: ${landmark.citation.source} ${landmark.citation.year}</small>`);

  return lines.join('\n');
}

/**
 * Generate a markdown table for towns in a state
 */
export function generateTownTable(stateId: string): string {
  const towns = getTownsByState(stateId);

  if (towns.length === 0) return `<!-- No towns found for state: ${stateId} -->`;

  const headers = ['Town', 'Mile', 'Distance', 'Grocery', 'Outfitter', 'Hostel', 'PO', 'Notes'];
  const rows = towns.map(t => [
    t.name,
    t.mile.toString(),
    t.distance_from_trail === 0 ? 'On trail' : `${t.distance_from_trail} mi`,
    t.services.grocery ? '✓' : '',
    t.services.outfitter ? '✓' : '',
    t.services.hostel ? '✓' : '',
    t.services.post_office ? '✓' : '',
    t.note || ''
  ]);

  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(r => `| ${r.join(' | ')} |`).join('\n');

  return `${headerRow}\n${separatorRow}\n${dataRows}`;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate that a mile marker is within trail bounds
 */
export function isValidMile(mile: number): boolean {
  const loaded = loadFacts();
  return mile >= 0 && mile <= loaded.trail.total_miles.value;
}

/**
 * Get metadata about the facts database
 */
export function getMeta() {
  return loadFacts()._meta;
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

// Common values for quick access
export const TRAIL_TOTAL_MILES = 2197.4; // Cached for performance
export const APPROACH_TRAIL_MILES = 8.8;
export const STATE_COUNT = 14;
export const SHELTER_COUNT = 260;
