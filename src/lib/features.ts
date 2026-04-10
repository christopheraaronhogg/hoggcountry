/**
 * Feature flag map for Hogg Country v1.
 *
 * v1 ships three public surfaces (Today, Plan, Field Manual) plus a
 * dev-only /lab index. Everything else lives behind a flag so it can
 * be shelved without deletion. See PRODUCT_BRIEF.md for the rationale.
 *
 * Every flag carries a status and a one-line reason. The /lab page
 * reads this map directly to render the index of flagged-off work.
 *
 * Status vocabulary:
 *   live         - shipping in v1
 *   merged       - logic absorbed into a live surface; UI retired
 *   archived     - off; no current plan to return
 *   experimental - unfinished; may return when it supports a live surface
 *   deferred     - intentionally off for v1, on the post-v1 roadmap
 */

export type FlagStatus =
  | 'live'
  | 'merged'
  | 'archived'
  | 'experimental'
  | 'deferred';

export interface Flag {
  readonly enabled: boolean;
  readonly status: FlagStatus;
  readonly reason: string;
}

export const FEATURES = {
  // Public surfaces (v1 IA)
  SURFACE_TODAY: {
    enabled: false,
    status: 'experimental',
    reason: 'Flagship decision-support surface. Under construction; flip on when v1 is ready.',
  },
  SURFACE_PLAN: {
    enabled: false,
    status: 'experimental',
    reason: 'Journey / Town Stop / Transitions modes. Under construction.',
  },
  SURFACE_MANUAL: {
    enabled: true,
    status: 'live',
    reason: 'Field Manual is live at /guide. Search-first rebuild is pending.',
  },
  SURFACE_LAB: {
    enabled: true,
    status: 'live',
    reason: 'Dev-only index of flagged-off work. Not linked from public nav.',
  },

  // Field Manual capabilities
  FIELD_GUIDE_SEARCH: {
    enabled: true,
    status: 'live',
    reason: 'Trail-wisdom search over the master guide.',
  },
  SCRIPTURE_SEARCH: {
    enabled: true,
    status: 'experimental',
    reason: 'KJV as a second search corpus inside Field Manual. Trail tab default; Scripture one tap away. Curated topical index is the key work.',
  },

  // Front-door content (demoted in v1)
  YOUTUBE_RSS: {
    enabled: true,
    status: 'live',
    reason: "Dad's video dispatches stay public as a secondary surface alongside the guide.",
  },
  TRIP_REPORTS: {
    enabled: false,
    status: 'archived',
    reason: 'May return post-v1 as a secondary Journal surface.',
  },
  BLOG_POSTS: {
    enabled: false,
    status: 'archived',
    reason: 'May return post-v1 as a secondary Journal surface.',
  },

  // Legacy / experimental routes
  ROUTE_KJV_STANDALONE: {
    enabled: false,
    status: 'merged',
    reason: 'Scripture is now a first-class capability of Field Manual search. See SCRIPTURE_SEARCH.',
  },
  ROUTE_ASK: {
    enabled: false,
    status: 'archived',
    reason: 'Does not fit the judgment-layer thesis. Off in v1.',
  },
  ROUTE_CAT: {
    enabled: false,
    status: 'archived',
    reason: 'Sprite catalog for TrailHogg game. Not relevant to v1.',
  },
  ROUTE_COMPARE: {
    enabled: false,
    status: 'experimental',
    reason: 'Unfinished comparison surface. Off in v1.',
  },
  ROUTE_GENERATE: {
    enabled: false,
    status: 'experimental',
    reason: 'Unfinished generator surface. Off in v1.',
  },
  ROUTE_PROTOTYPES: {
    enabled: false,
    status: 'experimental',
    reason: 'Proto_* sandbox components. Off in v1.',
  },
  ROUTE_TRAILHOGG_GAME: {
    enabled: false,
    status: 'deferred',
    reason: 'Phaser AT simulation. Different audience, large maintenance surface. Excluded from the main build.',
  },
  ROUTE_MULTITOOL_DASHBOARD: {
    enabled: false,
    status: 'merged',
    reason: 'Logic folded into Plan (Journey / Town Stop / Transitions). UI retired.',
  },

  // Post-v1 roadmap
  GEAR_LAB: {
    enabled: false,
    status: 'deferred',
    reason: 'Gear longevity predictions + budget tiering. On the post-v1 roadmap.',
  },
  TRAIL_INSTRUMENTS: {
    enabled: false,
    status: 'merged',
    reason: 'Calculator suite absorbed into Plan surface modes.',
  },
  DAILY_WISDOM: {
    enabled: false,
    status: 'merged',
    reason: 'Wisdom surfaced via Field Manual scripture search and (optionally) Today during tough phases.',
  },
} as const satisfies Record<string, Flag>;

export type FeatureKey = keyof typeof FEATURES;

/** Is this feature currently enabled? */
export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key].enabled;
}

/** Full flag record including status and reason. */
export function getFlag(key: FeatureKey): Flag {
  return FEATURES[key];
}

/** All flags as [key, flag] tuples - used by /lab to render the index. */
export function allFlags(): ReadonlyArray<readonly [FeatureKey, Flag]> {
  return Object.entries(FEATURES) as Array<[FeatureKey, Flag]>;
}

/** All flags matching a given status. */
export function flagsByStatus(status: FlagStatus): ReadonlyArray<readonly [FeatureKey, Flag]> {
  return allFlags().filter(([, flag]) => flag.status === status);
}
