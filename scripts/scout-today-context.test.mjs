import assert from 'node:assert/strict';
import test from 'node:test';

import {
  interpolateCoordinateForMile,
  nextWaypointAhead,
  summarizeTerrainAhead,
  zipDailyWeather
} from '../apps/openclaw-web/src/lib/server/today-context.ts';

test('zips Open-Meteo columnar daily arrays into weather days', () => {
  const days = zipDailyWeather({
    time: ['2026-06-11', '2026-06-12', '2026-06-13'],
    temperature_2m_max: [78.4, 71.2, 64.9],
    temperature_2m_min: [55.1, 50.8, 44.2],
    precipitation_probability_max: [20, 85, null],
    weather_code: [2, 95, 71],
    wind_speed_10m_max: [9.6, 18.2, 'bad']
  });

  assert.equal(days.length, 3);
  assert.deepEqual(days[0], {
    date: '2026-06-11',
    label: 'Partly cloudy',
    highF: 78.4,
    lowF: 55.1,
    precipChancePct: 20,
    windMaxMph: 9.6
  });
  assert.equal(days[1].label, 'Thunderstorm');
  assert.equal(days[1].precipChancePct, 85);
  assert.equal(days[2].label, 'Snow');
  assert.equal(days[2].precipChancePct, null);
  assert.equal(days[2].windMaxMph, null);
});

test('zipDailyWeather tolerates missing or malformed columns', () => {
  assert.deepEqual(zipDailyWeather(null), []);
  assert.deepEqual(zipDailyWeather('weather'), []);
  assert.deepEqual(zipDailyWeather([]), []);
  assert.deepEqual(zipDailyWeather({}), []);

  const days = zipDailyWeather({ time: ['2026-06-11', 42] });
  assert.equal(days.length, 1);
  assert.equal(days[0].date, '2026-06-11');
  assert.equal(days[0].highF, null);
  assert.equal(days[0].lowF, null);
  assert.equal(days[0].label, '—');
});

test('finds the next waypoint at or ahead of the mile with rounded distance', () => {
  const list = [
    { name: 'Springer Shelter', mile: 0.2, type: 'shelter' },
    { name: 'Broken Row', mile: null, type: 'shelter' },
    { name: 'Hawk Mountain Shelter', mile: 8.1, type: 'shelter' },
    { name: 'Gooch Mountain Shelter', mile: 15.7, type: 'shelter' }
  ];

  const next = nextWaypointAhead(list, 3.25);
  assert.deepEqual(next, { name: 'Hawk Mountain Shelter', mile: 8.1, milesAhead: 4.9, type: 'shelter' });

  const exact = nextWaypointAhead(list, 8.1);
  assert.equal(exact?.name, 'Hawk Mountain Shelter');
  assert.equal(exact?.milesAhead, 0);
});

test('returns null when no waypoint is ahead or input is unusable', () => {
  const list = [{ name: 'Behind Us', mile: 4, type: 'water' }];
  assert.equal(nextWaypointAhead(list, 10), null);
  assert.equal(nextWaypointAhead([], 10), null);
  assert.equal(nextWaypointAhead(list, Number.NaN), null);
});

test('finds the next waypoint in SOBO encounter order', () => {
  const list = [
    { name: 'North', mile: 102, type: 'water' },
    { name: 'Far south', mile: 95, type: 'water' },
    { name: 'Near south', mile: 98, type: 'water' }
  ];

  assert.deepEqual(nextWaypointAhead(list, 100, 'SOBO'), {
    name: 'Near south',
    mile: 98,
    milesAhead: 2,
    type: 'water'
  });
});

test('summarizes gain, loss, max grade, and difficulty over the lookahead window', () => {
  const terrain = {
    segments: [
      { startMile: 99, endMile: 100, gainFt: 900, lossFt: 50, maxGradePercent: 30 },
      { startMile: 100, endMile: 101, gainFt: 400, lossFt: 120, maxGradePercent: 12 },
      { startMile: 101, endMile: 102, gainFt: 210, lossFt: 340, maxGradePercent: 22.46 },
      { startMile: 130, endMile: 131, gainFt: 999, lossFt: 999, maxGradePercent: 99 }
    ],
    difficulty: [
      { startMile: 90, endMile: 100, score: 4.1, label: 'cruise' },
      { startMile: 100, endMile: 110, score: 7.4, label: 'hard_screening' }
    ]
  };

  const summary = summarizeTerrainAhead(terrain, 100.5, 15);
  // Edge segments are prorated: [100,101] is half inside the window from 100.5,
  // so it contributes half its gain/loss (200/60) plus all of [101,102].
  assert.deepEqual(summary, {
    lookaheadMiles: 15,
    gainFt: 410,
    lossFt: 400,
    maxGradePercent: 22.5,
    difficultyScore: 7.4,
    difficultyLabel: 'hard screening'
  });
});

test('prorates a segment that only partially overlaps the window end', () => {
  const terrain = {
    segments: [{ startMile: 10, endMile: 20, gainFt: 1000, lossFt: 500, maxGradePercent: 9 }],
    difficulty: []
  };

  // Window [12, 17] covers half of the 10-mile segment.
  const summary = summarizeTerrainAhead(terrain, 12, 5);
  assert.equal(summary?.gainFt, 500);
  assert.equal(summary?.lossFt, 250);
});

test('SOBO terrain uses the lower-mile window and reverses authored gain and loss', () => {
  const terrain = {
    segments: [
      { startMile: 95, endMile: 100, gainFt: 100, lossFt: 400, maxGradePercent: 15 },
      { startMile: 100, endMile: 105, gainFt: 900, lossFt: 50, maxGradePercent: 25 }
    ],
    difficulty: [{ startMile: 90, endMile: 110, score: 8.2, label: 'hard_screening' }]
  };

  assert.deepEqual(summarizeTerrainAhead(terrain, 100, 5, 'SOBO'), {
    lookaheadMiles: 5,
    gainFt: 400,
    lossFt: 100,
    maxGradePercent: 15,
    difficultyScore: null,
    difficultyLabel: null
  });
});

test('terrain summary keeps difficulty when no segments overlap, and nulls out cleanly', () => {
  const terrain = {
    segments: [{ startMile: 0, endMile: 1, gainFt: 100, lossFt: 100, maxGradePercent: 5 }],
    difficulty: [{ startMile: 500, endMile: 510, score: 5.5, label: 'steady' }]
  };

  const summary = summarizeTerrainAhead(terrain, 505, 15);
  assert.equal(summary?.gainFt, null);
  assert.equal(summary?.lossFt, null);
  assert.equal(summary?.maxGradePercent, null);
  assert.equal(summary?.difficultyScore, 5.5);
  assert.equal(summary?.difficultyLabel, 'steady');

  assert.equal(summarizeTerrainAhead({ segments: [], difficulty: [] }, 100, 15), null);
  assert.equal(summarizeTerrainAhead(terrain, Number.NaN, 15), null);
  assert.equal(summarizeTerrainAhead(terrain, 100, 0), null);
});

test('interpolates coordinates between bracketing mileposts', () => {
  const milepoints = [
    { mile: 0, lat: 34.6, lon: -84.2 },
    { mile: 2, lat: 34.8, lon: -84 }
  ];

  const middle = interpolateCoordinateForMile(milepoints, 1);
  assert.ok(middle);
  assert.ok(Math.abs(middle.lat - 34.7) < 1e-9);
  assert.ok(Math.abs(middle.lon - -84.1) < 1e-9);

  const exact = interpolateCoordinateForMile(milepoints, 2);
  assert.deepEqual(exact, { lat: 34.8, lon: -84 });

  assert.equal(interpolateCoordinateForMile([], 1), null);
  assert.equal(interpolateCoordinateForMile(milepoints, Number.NaN), null);
});
