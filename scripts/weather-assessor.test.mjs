import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateSunTimes,
  calculateWindChill,
  dayQualityColorFor,
  dayQualityFor,
  getTempColor,
  latitudeForMile,
  terrainMultiplierFor
} from '../src/lib/weather-assessor.js';

test('temperature colors preserve the WeatherAssessor severity thresholds', () => {
  assert.equal(getTempColor(10), '#ef4444');
  assert.equal(getTempColor(25), '#f97316');
  assert.equal(getTempColor(40), '#fbbf24');
  assert.equal(getTempColor(55), '#22c55e');
  assert.equal(getTempColor(56), '#059669');
});

test('wind chill uses the same stepped penalties as the component table', () => {
  assert.equal(calculateWindChill(30, 0), 0);
  assert.equal(calculateWindChill(30, 5), 26);
  assert.equal(calculateWindChill(30, 10), 22);
  assert.equal(calculateWindChill(30, 15), 18);
  assert.equal(calculateWindChill(30, 20), 12);
  assert.equal(calculateWindChill(30, 25), 5);
  assert.equal(calculateWindChill(30, 35), 5);
});

test('daylight latitude interpolates from Springer to Katahdin', () => {
  assert.equal(latitudeForMile(0), 34.6);
  assert.equal(Number(latitudeForMile(2198).toFixed(1)), 45.9);
});

test('sun-time estimate gives more daylight near summer than winter', () => {
  const latitude = latitudeForMile(500);
  const winter = calculateSunTimes('2026-02-15', latitude);
  const summer = calculateSunTimes('2026-06-15', latitude);

  assert.equal(typeof winter.sunrise, 'string');
  assert.equal(typeof winter.sunset, 'string');
  assert.ok(summer.daylightHours > winter.daylightHours);
});

test('day quality and terrain multipliers preserve trail planning buckets', () => {
  assert.equal(dayQualityFor(14), 'Long Day');
  assert.equal(dayQualityFor(12), 'Solid Day');
  assert.equal(dayQualityFor(10), 'Short Day');
  assert.equal(dayQualityFor(9.9), 'Winter Day');
  assert.equal(dayQualityColorFor(9.9), '#6b8cae');
  assert.equal(terrainMultiplierFor(1800), 0.6);
  assert.equal(terrainMultiplierFor(1700), 1);
});
