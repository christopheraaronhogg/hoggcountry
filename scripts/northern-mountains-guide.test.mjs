import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_DATA_PATH = path.join(ROOT, 'apps/openclaw-web/src/lib/data/northern-mountains-guide.json');
const DATA_PATH = path.join(ROOT, 'apps/openclaw-web/src/lib/data/northern-mountains-guide-b.json');
const GENERATOR_PATH = path.join(ROOT, 'scripts/build-northern-mountains-guide.mjs');
const ROUTE_PATH = path.join(ROOT, 'apps/openclaw-web/src/routes/mountains-ahead/+page.svelte');
const REDIRECT_PATH = path.join(ROOT, 'apps/openclaw-web/src/routes/mountains-ahead-b/+page.server.ts');
const PDF_PATH = path.join(ROOT, 'apps/openclaw-web/static/guides/hogg-country-at-mountains-mile-1850-to-katahdin.pdf');
const LEGACY_PDF_PATH = path.join(ROOT, 'apps/openclaw-web/static/guides/hogg-country-at-mountains-mile-1850-to-katahdin-version-b.pdf');

const baseline = JSON.parse(fs.readFileSync(BASE_DATA_PATH, 'utf8'));
const guide = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

test('northern mountain guide covers the calibrated mile 1850 to Katahdin frame', () => {
  assert.equal(guide.guideStartMile, 1850);
  assert.equal(guide.terminusMile, 2197.9);
  assert.equal(guide.summary.distanceMiles, 347.9);
  assert.equal(guide.mountains.length, 51);
  assert.equal(guide.mountains[0].name, 'Mount Webster');
  assert.equal(guide.mountains.at(-1).name, 'Baxter Peak - Katahdin');
  assert.equal(guide.mountains.at(-1).summitMile, 2197.9);
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
  const route = fs.readFileSync(ROUTE_PATH, 'utf8');
  const redirectRoute = fs.readFileSync(REDIRECT_PATH, 'utf8');

  assert.ok(fs.statSync(PDF_PATH).size > 50_000);
  assert.equal(guide.summary.mountainCount, guide.mountains.length);
  assert.ok(guide.summary.gainFt > 50_000);
  assert.ok(guide.summary.lossFt > 50_000);
  assert.match(route, /hogg-country-at-mountains-mile-1850-to-katahdin\.pdf/u);
  assert.doesNotMatch(route, /Version B|candidate|noindex/iu);
  assert.match(redirectRoute, /redirect\(308, `\/mountains-ahead\$\{url\.search\}`\)/u);
});

test('canonical guide gives every mountain a bounded post-summit descent screen', () => {
  assert.equal(guide.version, 'up-down');
  assert.equal(guide.title, 'Mountains Ahead');
  assert.equal(guide.mountains.length, baseline.mountains.length);
  assert.equal(guide.summary.mountainCount, guide.mountains.length);
  assert.equal(guide.mountains.at(-1).name, 'Baxter Peak - Katahdin');

  for (const mountain of guide.mountains) {
    assert.ok(mountain.descentEndMile >= mountain.summitMile);
    assert.ok(mountain.descentEndMile <= guide.terminusMile);
    assert.ok(mountain.descentDistanceMiles >= 0 && mountain.descentDistanceMiles <= 8.1);
    assert.ok(mountain.descentLossFt >= 0);
    assert.ok(mountain.averageLossFtPerMile >= 0);
    assert.ok(mountain.maxDescentGradePercent >= 0 && mountain.maxDescentGradePercent <= 80);
    assert.ok(mountain.descentRockinessScore >= 0 && mountain.descentRockinessScore <= 10);
    assert.ok(mountain.kneeLoadScore >= 0 && mountain.kneeLoadScore <= 10);
    assert.ok(mountain.terrainDemandScore >= mountain.upDifficultyScore);
    assert.ok(mountain.terrainDemandScore >= mountain.kneeLoadScore);
    assert.ok(mountain.terrainDemandScore <= 10);
  }

  assert.match(guide.mountains.at(-1).terminusDescentNote, /dataset end|dataset ends|official AT/iu);
});

test('canonical guide surfaces a meaningful downhill watchlist and preserves the candidate PDF alias', () => {
  assert.ok(guide.summary.highestKneeLoad.length >= 6);
  assert.ok(guide.summary.highestKneeLoad[0].kneeLoadScore >= 8.5);
  assert.ok(guide.summary.highestKneeLoad[0].descentLossFt > 1_000);
  assert.ok(fs.statSync(LEGACY_PDF_PATH).size > 50_000);
  assert.ok(fs.readFileSync(PDF_PATH).equals(fs.readFileSync(LEGACY_PDF_PATH)));
});
