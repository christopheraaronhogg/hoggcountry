import assert from 'node:assert/strict';
import test from 'node:test';

import { betaCookieDeleteOptions, betaCookieOptions } from '../apps/openclaw-web/src/lib/server/beta-cookie.ts';

test('beta cookie is secure over HTTPS', () => {
  const options = betaCookieOptions(new URL('https://hoggcountry.on-forge.com/signup'));

  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
});

test('beta cookie remains usable over local HTTP', () => {
  const options = betaCookieOptions(new URL('http://127.0.0.1:5173/signup'));

  assert.equal(options.secure, false);
});

test('beta cookie delete options match transport security', () => {
  assert.equal(betaCookieDeleteOptions(new URL('https://hoggcountry.on-forge.com/app/logout')).secure, true);
  assert.equal(betaCookieDeleteOptions(new URL('http://127.0.0.1:5173/app/logout')).secure, false);
});
