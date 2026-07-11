# Direction-aware trail context

## Problem

The app stores a hiker's direction, but most "ahead" calculations still assume
NOBO means increasing trail miles. A SOBO hiker can therefore receive water,
shelters, terrain, progress, and Scout answers from behind them. The public
field-pack endpoint compounds the problem by constructing the wrong slice
before the phone sees it.

Canonical trail miles must remain the official NOBO coordinate. Reversing the
underlying data would break saved hikes, public links, and Dad's existing data.

## Decision

Add one tiny, dependency-free direction contract to `@hoggcountry/trail-data`
and consume it from both the field-pack server and mobile app:

- `directedMileDelta(from, target, direction)` is positive ahead and negative
  behind.
- `trailAhead(items, from, direction, maxMiles)` filters and sorts in encounter
  order without mutating the source list.
- `trailProgress(current, total, direction)` returns direction-aware completed
  miles, remaining miles, and percent.
- `directedTrailWindow(current, span, total, direction)` returns both travel
  endpoints and normalized physical bounds.

The helper requires an explicit `NOBO` or `SOBO`; there is no silent default.
"Here" is included within a 0.01-mile tolerance, while invalid mile values and
invalid spans are excluded.

## Terrain semantics

Elevation assets remain stored south-to-north. A SOBO elevation window is
selected by normalized physical bounds and then reversed into travel order, so
existing climb calculations naturally become direction-correct.

Server terrain rows are authored in NOBO orientation. For SOBO packs:

- swap gain and loss;
- reverse steep-section encounter order;
- swap `climb` and `descent` labels and negate signed vertical change;
- leave physical source-coverage ranges normalized low-to-high;
- omit cached direction-sensitive difficulty scores until a SOBO score is
  computed rather than presenting a NOBO score as fact.

## Migration order

1. Add red pure tests for both directions, edge cases, elevation order, Scout
   tools, terrain summaries, and the public field pack.
2. Move mobile safety surfaces to the shared contract first. A stale wrong-side
   cached pack will then produce an honest empty state instead of a false claim.
3. Make server slicing and terrain construction direction-aware.
4. Migrate Today, Safety, Account, map progress/labels, and Scout tools.
5. Run the mobile suite/check/build, server tests/build, and native Android
   packaging checks. Keep Dad's NOBO pack as an explicit regression fixture.

## Non-goals

- Rewriting the canonical mile frame.
- Adding a second route model.
- Guessing a direction when profile and pack disagree.
- Treating UI source-pattern tests as proof of directional behavior.

## Release safety

The client-side wrong-side filter is safe to ship before the server change.
After a direction change, a cached pack whose `hiker.direction` does not match
the active profile must be treated as stale and refreshed. This prevents Scout
from silently reasoning from the opposite direction while preserving offline
truthfulness.
