import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

process.env.SCOUT_WAITLIST_DATA_DIR = mkdtempSync(join(tmpdir(), 'scout-waitlist-'));

const { addWaitlistSignup, listWaitlistSignups, normalizeWaitlistEmail } = await import(
  '../apps/openclaw-web/src/lib/server/waitlist.ts'
);

test('normalizes and validates emails', () => {
  assert.equal(normalizeWaitlistEmail('  Hiker@Example.COM '), 'hiker@example.com');
  assert.equal(normalizeWaitlistEmail('not-an-email'), null);
  assert.equal(normalizeWaitlistEmail('a@b'), null);
  assert.equal(normalizeWaitlistEmail(42), null);
});

test('adds, dedupes, and lists signups', async () => {
  assert.equal(await addWaitlistSignup('hiker@example.com', 'homepage-hero'), 'added');
  assert.equal(await addWaitlistSignup('HIKER@example.com', 'footer'), 'already-listed');
  assert.equal(await addWaitlistSignup('second@example.com', ''), 'added');

  const signups = await listWaitlistSignups();
  assert.equal(signups.length, 2);
  assert.equal(signups[0].email, 'hiker@example.com');
  assert.equal(signups[0].source, 'homepage-hero');
  assert.equal(signups[1].source, 'site');
});

test('rejects invalid emails with a human message', async () => {
  await assert.rejects(() => addWaitlistSignup('nope', 'site'), /valid email/iu);
});
