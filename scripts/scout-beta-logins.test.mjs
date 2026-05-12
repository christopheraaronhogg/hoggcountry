import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveScoutQuickLogin } from '../apps/openclaw-web/src/lib/server/scout-beta-logins.ts';

test('resolves Chris trail beta login', () => {
  assert.deepEqual(resolveScoutQuickLogin('chris', '0721'), {
    name: 'Chris',
    email: 'chris@hoggcountry.local',
    trailName: 'Chris'
  });
});

test('resolves Dad trail beta login', () => {
  assert.deepEqual(resolveScoutQuickLogin('dad', '0721'), {
    name: 'Dad',
    email: 'dad@hoggcountry.local',
    trailName: 'Dad'
  });
});

test('rejects wrong trail beta password', () => {
  assert.equal(resolveScoutQuickLogin('chris', 'bad'), null);
});
