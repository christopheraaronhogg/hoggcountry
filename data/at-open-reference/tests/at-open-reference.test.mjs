import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAtOpenReferencePack } from '../scripts/validate-at-open-reference.mjs';

test('Scout AT Open Reference Pack source and safety gates pass', () => {
  const result = validateAtOpenReferencePack();
  assert.deepEqual(result.failures, []);
  assert.equal(result.ok, true);
  assert.ok(result.sources >= 10, 'expected a meaningful initial source manifest');
});
