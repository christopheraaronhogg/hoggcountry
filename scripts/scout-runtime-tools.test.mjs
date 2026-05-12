import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCurrentDateAuthority, buildCurrentDatetimeDetails } from '../apps/openclaw-web/src/lib/server/scout-date-authority.ts';

test('current datetime authority uses the server clock for today and tomorrow', () => {
  const details = buildCurrentDatetimeDetails(new Date('2026-05-12T13:00:00.000Z'), 'America/New_York');

  assert.equal(details.fetchedAt, '2026-05-12T13:00:00.000Z');
  assert.equal(details.today.iso, '2026-05-12');
  assert.equal(details.today.weekday, 'Tuesday');
  assert.equal(details.tomorrow.iso, '2026-05-13');
  assert.equal(details.tomorrow.weekday, 'Wednesday');
});

test('date authority forbids stale workspace timestamps as current date source', () => {
  const authority = buildCurrentDateAuthority(new Date('2026-05-12T13:00:00.000Z'), 'America/New_York');

  assert.match(authority, /Today is Tuesday, 2026-05-12/u);
  assert.match(authority, /Tomorrow is Wednesday, 2026-05-13/u);
  assert.match(authority, /Never derive the current date from profile\.updatedAt/u);
  assert.doesNotMatch(authority, /April 23/u);
});
