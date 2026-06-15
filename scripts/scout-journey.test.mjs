// Tests the pure buildJourney() timeline assembler: state status by mile,
// mile-based landmark/milestone/dispatch placement, progress math, preview.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../apps/openclaw-web/src/lib/server/journey.ts');
const { buildJourney } = mod;

const STATES = [
  { id: 'GA', name: 'Georgia', entry_mile: 0, exit_mile: 78.3, miles: 78.3 },
  { id: 'NC', name: 'North Carolina', entry_mile: 78.3, exit_mile: 239.4, miles: 161.1 },
  { id: 'ME', name: 'Maine', entry_mile: 1915.7, exit_mile: 2197.4, miles: 281.7 }
];
const LANDMARKS = [
  { name: 'Springer Mountain', mile: 0, state: 'GA', type: 'summit', significance: 'Southern terminus', elevation: 3782 },
  { name: 'Neels Gap', mile: 31.3, state: 'GA', type: 'landmark' },
  { name: 'Max Patch', mile: 255.2, state: 'NC', type: 'summit' }, // mile lands in NC range here
  { name: 'Katahdin', mile: 2197.4, state: 'ME', type: 'summit', significance: 'Northern terminus' }
];
const MILESTONES = [
  { mile: 100, name: 'First Century', emoji: '💯' },
  { mile: 2197.4, name: 'Summit!', emoji: '🎊' }
];
const DISPATCHES = [
  { id: 'a', title: 'Cold start', body: 'Frosty', publishedAt: '2026-03-02', trailMile: 12 },
  { id: 'b', title: 'No mile', body: 'x', publishedAt: '2026-03-03', trailMile: null }
];

function base(overrides = {}) {
  return buildJourney({
    currentMile: 120,
    totalMiles: 2197.4,
    states: STATES,
    landmarks: LANDMARKS,
    milestones: MILESTONES,
    dispatches: DISPATCHES,
    startDateISO: '2026-03-01',
    nowMs: Date.parse('2026-03-11T12:00:00Z'),
    latestFixLabel: 'AT mile 120.0',
    latestFixAt: '2026-03-11T00:00:00Z',
    isPreview: false,
    ...overrides
  });
}

test('summary math: percent, remaining, pace, days', () => {
  const j = base();
  assert.equal(j.summary.currentMile, 120);
  assert.equal(j.summary.percentComplete, 5.5); // 120/2197.4
  assert.equal(j.summary.milesRemaining, 2077.4);
  assert.equal(j.summary.daysOnTrail, 11); // Mar 1..Mar 11 inclusive
  assert.equal(j.summary.paceMilesPerDay, 10.9); // 120/11
  assert.equal(j.summary.currentStateName, 'North Carolina');
});

test('state status by current mile', () => {
  const j = base();
  const byId = Object.fromEntries(j.states.map((s) => [s.id, s]));
  assert.equal(byId.GA.status, 'done'); // current 120 >= GA exit 78.3
  assert.equal(byId.NC.status, 'current'); // 78.3 <= 120 < 239.4
  assert.equal(byId.ME.status, 'upcoming');
  assert.ok(byId.NC.percentThrough > 0 && byId.NC.percentThrough < 100);
  assert.equal(byId.GA.percentThrough, null);
});

test('landmarks placed by mile and reached-flagged', () => {
  const j = base();
  const ga = j.states.find((s) => s.id === 'GA');
  const nc = j.states.find((s) => s.id === 'NC');
  assert.deepEqual(ga.landmarks.map((l) => l.name), ['Springer Mountain', 'Neels Gap']);
  assert.ok(ga.landmarks.every((l) => l.reached)); // both <= 120
  // Max Patch at 255.2 lands in NC's range (78.3-239.4)? No — 255.2 > 239.4, so it falls to the next state by mile.
  const maxPatch = [...ga.landmarks, ...nc.landmarks].find((l) => l.name === 'Max Patch');
  assert.equal(maxPatch, undefined); // 255.2 is beyond NC exit, assigned to a later state (ME in this sparse fixture)
  const me = j.states.find((s) => s.id === 'ME');
  assert.ok(me.landmarks.some((l) => l.name === 'Max Patch'));
});

test('milestones reached-flagged by mile', () => {
  const j = base();
  const nc = j.states.find((s) => s.id === 'NC');
  const century = nc.milestones.find((m) => m.mile === 100); // mile 100 is in NC (78.3-239.4)
  assert.ok(century && century.reached); // 100 <= 120
  const me = j.states.find((s) => s.id === 'ME');
  const summit = me.milestones.find((m) => m.mile === 2197.4);
  assert.ok(summit && !summit.reached);
});

test('dispatches placed by trailMile; null-mile dropped', () => {
  const j = base();
  const ga = j.states.find((s) => s.id === 'GA');
  assert.deepEqual(ga.dispatches.map((d) => d.id), ['a']); // mile 12 in GA; 'b' has null mile
});

test('preview hides current state and zeroes position', () => {
  const j = base({ currentMile: 0, isPreview: true, latestFixLabel: null });
  assert.equal(j.summary.isPreview, true);
  assert.equal(j.summary.currentStateName, null);
  assert.equal(j.summary.percentComplete, 0);
  assert.equal(j.states.find((s) => s.id === 'GA').status, 'current'); // mile 0 is in GA
});

test('pre-start date yields zero days and null pace', () => {
  const j = base({ nowMs: Date.parse('2026-02-01T00:00:00Z') });
  assert.equal(j.summary.daysOnTrail, 0);
  assert.equal(j.summary.paceMilesPerDay, null);
});
