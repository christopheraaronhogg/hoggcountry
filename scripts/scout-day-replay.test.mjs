// Tests the pure day-replay logic powering the public AT map's "replay a day"
// mode: timezone day-bucketing, day options, and summarizeDay() math with the
// honest-data guarantees (sparse fixes, missing elevation, same-day bounds).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../apps/openclaw-web/src/lib/trail/day-replay.ts');
const {
  TRAIL_TIME_ZONE,
  dayKeyFor,
  relativeDayLabel,
  listTrackedDays,
  buildDayOptions,
  pointsForDay,
  summarizeDay,
  difficultyBandLabel
} = mod;

const TZ = TRAIL_TIME_ZONE;

function pt(observedAt, mile, lat = 35, lon = -83) {
  return { lat, lon, mile, observedAt };
}

test('trail timezone is Eastern', () => {
  assert.equal(TRAIL_TIME_ZONE, 'America/New_York');
});

test('dayKeyFor buckets UTC instants into Eastern calendar days', () => {
  // EST (UTC-5) in early March 2026 (DST starts Mar 8).
  assert.equal(dayKeyFor('2026-03-02T02:00:00Z', TZ), '2026-03-01'); // 21:00 prev day Eastern
  assert.equal(dayKeyFor('2026-03-02T06:00:00Z', TZ), '2026-03-02'); // 01:00 Eastern
  // EDT (UTC-4) after DST: 03:30Z → 23:30 prev day.
  assert.equal(dayKeyFor('2026-06-10T03:30:00Z', TZ), '2026-06-09');
  assert.equal(dayKeyFor(null, TZ), null);
  assert.equal(dayKeyFor('not-a-date', TZ), null);
});

test('relativeDayLabel: today/yesterday/N days ago/weekday', () => {
  assert.equal(relativeDayLabel('2026-04-14', '2026-04-14'), 'Today');
  assert.equal(relativeDayLabel('2026-04-13', '2026-04-14'), 'Yesterday');
  assert.equal(relativeDayLabel('2026-04-11', '2026-04-14'), '3 days ago');
  // 7+ days back falls through to a stable weekday+date label.
  assert.equal(relativeDayLabel('2026-04-06', '2026-04-14'), 'Mon, Apr 6');
});

test('listTrackedDays returns unique Eastern days newest-first', () => {
  const points = [
    pt('2026-04-10T14:00:00Z', 100),
    pt('2026-04-10T20:00:00Z', 112),
    pt('2026-04-12T13:00:00Z', 130),
    pt('2026-04-11T15:00:00Z', 120),
    pt(null, 999)
  ];
  assert.deepEqual(listTrackedDays(points, TZ), ['2026-04-12', '2026-04-11', '2026-04-10']);
});

test('buildDayOptions labels + counts relative to today, capped', () => {
  const points = [
    pt('2026-04-14T14:00:00Z', 100),
    pt('2026-04-14T18:00:00Z', 108),
    pt('2026-04-13T14:00:00Z', 90)
  ];
  const opts = buildDayOptions(points, '2026-04-14', TZ, 8);
  assert.deepEqual(
    opts.map((o) => [o.key, o.label, o.count]),
    [
      ['2026-04-14', 'Today', 2],
      ['2026-04-13', 'Yesterday', 1]
    ]
  );
  assert.equal(buildDayOptions(points, '2026-04-14', TZ, 1).length, 1);
});

test('pointsForDay filters to the Eastern day and sorts by time', () => {
  const points = [
    pt('2026-04-10T22:00:00Z', 112), // 18:00 Eastern
    pt('2026-04-11T01:00:00Z', 99), // 21:00 Apr 10 Eastern → same day
    pt('2026-04-10T14:00:00Z', 100), // 10:00 Eastern
    pt('2026-04-11T13:00:00Z', 130) // next Eastern day
  ];
  const day = pointsForDay(points, '2026-04-10', TZ);
  assert.deepEqual(day.map((p) => p.mile), [100, 112, 99]);
});

test('summarizeDay: full day — times, miles, modeled elevation, difficulty', () => {
  const points = [
    pt('2026-04-10T12:00:00Z', 100),
    pt('2026-04-10T15:00:00Z', 106),
    pt('2026-04-10T18:00:00Z', 110),
    pt('2026-04-10T21:00:00Z', 114),
    pt('2026-04-10T22:30:00Z', 118),
    pt('2026-04-10T23:30:00Z', 120),
    pt('2026-04-11T00:30:00Z', 122), // 20:30 Eastern, still Apr 10
    pt('2026-04-11T01:30:00Z', 124) // 21:30 Eastern, still Apr 10
  ];
  // Modeled elevation: climb 1000→3000 then drop to 2000 across the range.
  const elevation = [];
  for (let m = 95; m <= 130; m += 1) {
    let ft;
    if (m <= 110) ft = 1000 + (m - 95) * 100; // rising
    else ft = 1000 + 15 * 100 - (m - 110) * 50; // falling
    elevation.push({ mile: m, elevationFt: ft });
  }
  const difficulty = [
    { startMile: 90, endMile: 115, score: 4, label: 'cruise' },
    { startMile: 115, endMile: 140, score: 8, label: 'hard' }
  ];
  const s = summarizeDay(points, '2026-04-10', TZ, { elevation, difficulty });

  assert.equal(s.pointCount, 8);
  assert.equal(s.startTime, '2026-04-10T12:00:00Z');
  assert.equal(s.endTime, '2026-04-11T01:30:00Z');
  assert.equal(s.elapsedMinutes, 13 * 60 + 30); // 12:00 → 01:30 next day = 13.5h
  assert.equal(s.startMile, 100);
  assert.equal(s.endMile, 124);
  assert.equal(s.milesCovered, 24);
  assert.equal(s.elevationModeled, true);
  assert.ok(s.elevationGainFt > 0 && s.elevationLossFt > 0, 'has both gain and loss');
  assert.ok(s.highestFt >= s.lowestFt);
  assert.ok(s.difficultyScore > 4 && s.difficultyScore < 8, 'overlap-weighted between bands');
  assert.equal(s.confidence, 'good'); // 8 fixes
  // good day → no sparse/fair preamble, but elevation-modeled note is present.
  assert.ok(s.confidenceNote && s.confidenceNote.includes('modeled'));
});

test('summarizeDay: single sparse fix — honest, no fabricated elevation', () => {
  const points = [pt('2026-04-10T15:00:00Z', 100)];
  const elevation = [
    { mile: 99, elevationFt: 1000 },
    { mile: 101, elevationFt: 2000 }
  ];
  const s = summarizeDay(points, '2026-04-10', TZ, { elevation });
  assert.equal(s.pointCount, 1);
  assert.equal(s.startMile, 100);
  assert.equal(s.endMile, 100);
  assert.equal(s.milesCovered, 0);
  assert.equal(s.elapsedMinutes, null); // no span from one fix
  // Zero-length mile range → no in-range pair → elevation stays null, not invented.
  assert.equal(s.elevationModeled, false);
  assert.equal(s.elevationGainFt, null);
  assert.equal(s.highestFt, null);
  assert.equal(s.confidence, 'sparse');
  assert.ok(s.confidenceNote.includes('Only 1 fix'));
});

test('summarizeDay: single fix difficulty comes from the covering segment (zero-length range)', () => {
  const points = [pt('2026-04-10T15:00:00Z', 100)];
  const difficulty = [
    { startMile: 90, endMile: 110, score: 7.4, label: 'hard' },
    { startMile: 110, endMile: 130, score: 3, label: 'cruise' }
  ];
  const covered = summarizeDay(points, '2026-04-10', TZ, { difficulty });
  assert.equal(covered.milesCovered, 0); // single fix → zero-length range
  assert.equal(covered.difficultyScore, 7.4); // from the segment spanning mile 100
  assert.equal(covered.difficultyLabel, 'hard');

  // A fix outside every difficulty segment → no fabricated difficulty.
  const uncovered = summarizeDay([pt('2026-04-10T15:00:00Z', 200)], '2026-04-10', TZ, { difficulty });
  assert.equal(uncovered.difficultyScore, null);
  assert.equal(uncovered.difficultyLabel, null);
});

test('summarizeDay: missing elevation input → elevation fields null + honest note', () => {
  const points = [
    pt('2026-04-10T12:00:00Z', 100),
    pt('2026-04-10T18:00:00Z', 112),
    pt('2026-04-10T22:00:00Z', 120),
    pt('2026-04-10T23:00:00Z', 124)
  ];
  const s = summarizeDay(points, '2026-04-10', TZ, { elevation: [] });
  assert.equal(s.milesCovered, 24);
  assert.equal(s.elevationModeled, false);
  assert.equal(s.elevationGainFt, null);
  assert.equal(s.elevationLossFt, null);
  assert.equal(s.confidence, 'fair'); // 4 fixes
  assert.ok(s.confidenceNote.includes('No modeled elevation'));
});

test('summarizeDay: empty day → none confidence, all nulls', () => {
  const s = summarizeDay([pt('2026-04-11T12:00:00Z', 100)], '2026-04-10', TZ);
  assert.equal(s.pointCount, 0);
  assert.equal(s.confidence, 'none');
  assert.equal(s.milesCovered, null);
  assert.equal(s.elevationGainFt, null);
  assert.ok(s.confidenceNote.includes('No Garmin fixes'));
});

test('summarizeDay: fixes without calibrated miles → distance unknown, honest note', () => {
  const points = [pt('2026-04-10T12:00:00Z', null), pt('2026-04-10T18:00:00Z', null)];
  const s = summarizeDay(points, '2026-04-10', TZ, { elevation: [{ mile: 1, elevationFt: 5 }] });
  assert.equal(s.startMile, null);
  assert.equal(s.endMile, null);
  assert.equal(s.milesCovered, null);
  assert.equal(s.elevationModeled, false);
  assert.ok(s.confidenceNote.includes('No calibrated mile'));
  assert.ok(s.confidenceNote.includes('distance is unknown'));
  // With no mileage at all, the note must NOT claim mileage is "approximate".
  assert.ok(!s.confidenceNote.includes('approximate'), 'no contradictory approximate-mileage claim');
  assert.ok(s.confidenceNote.includes('Only 2 fixes'));
});

test('difficultyBandLabel bands', () => {
  assert.equal(difficultyBandLabel(3), 'cruise');
  assert.equal(difficultyBandLabel(6), 'steady');
  assert.equal(difficultyBandLabel(7.5), 'hard');
  assert.equal(difficultyBandLabel(9), 'severe');
});
