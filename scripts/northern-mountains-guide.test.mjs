import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'apps/openclaw-web/src/lib/data/northern-mountains-guide.json');
const GENERATOR_PATH = path.join(ROOT, 'scripts/build-northern-mountains-guide.mjs');
const PDF_PATH = path.join(ROOT, 'apps/openclaw-web/static/guides/hogg-country-at-mountains-mile-1850-to-katahdin.pdf');

const guide = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

test('northern mountain guide covers the calibrated mile 1850 to Katahdin frame', () => {
  assert.equal(guide.guideStartMile, 1850);
  assert.equal(guide.terminusMile, 2197.4);
  assert.equal(guide.summary.distanceMiles, 347.4);
  assert.equal(guide.mountains.length, 51);
  assert.equal(guide.mountains[0].name, 'Mount Webster');
  assert.equal(guide.mountains.at(-1).name, 'Baxter Peak - Katahdin');
  assert.equal(guide.mountains.at(-1).summitMile, 2197.4);
});

test('mountains stay sorted and carry complete bounded terrain screens', () => {
  const ids = new Set();
  let previousMile = guide.guideStartMile;

  for (const mountain of guide.mountains) {
    assert.ok(mountain.summitMile >= previousMile, `${mountain.name} is out of order`);
    assert.ok(mountain.summitMile >= guide.guideStartMile);
    assert.ok(mountain.summitMile <= guide.terminusMile);
    assert.ok(mountain.climbStartMile <= mountain.summitMile);
    assert.ok(mountain.climbDistanceMiles >= 0.1);
    assert.ok(mountain.climbGainFt >= 0);
    assert.ok(mountain.maxGradePercent >= 0 && mountain.maxGradePercent <= 80);
    assert.ok(mountain.rockinessScore >= 0 && mountain.rockinessScore <= 10);
    assert.ok(mountain.difficultyScore >= 0 && mountain.difficultyScore <= 10);
    assert.ok(mountain.profile.length >= 2);
    assert.ok(mountain.source.url.startsWith('https://www.openstreetmap.org/node/'));
    assert.ok(!ids.has(mountain.id), `duplicate mountain id ${mountain.id}`);
    ids.add(mountain.id);
    previousMile = mountain.summitMile;
  }
});

test('curated peak source has no hand-entered trail miles', () => {
  const generator = fs.readFileSync(GENERATOR_PATH, 'utf8');
  const peaksBlock = generator.slice(generator.indexOf('const PEAKS = ['), generator.indexOf('function readJson'));
  assert.ok(peaksBlock.includes('osmId:'));
  assert.doesNotMatch(peaksBlock, /\bmile\s*:/u);
});

test('route and PDF share a committed generated artifact', () => {
  assert.ok(fs.statSync(PDF_PATH).size > 50_000);
  assert.equal(guide.summary.mountainCount, guide.mountains.length);
  assert.ok(guide.summary.gainFt > 50_000);
  assert.ok(guide.summary.lossFt > 50_000);
});
