import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageSource = readFileSync(
  new URL('../apps/openclaw-web/src/routes/app/claw/+page.svelte', import.meta.url),
  'utf8'
);

test('Scout mobile resume recovery keeps active Scout turns recoverable', () => {
  assert.match(pageSource, /ACTIVE_REPLY_TURN_STORAGE_KEY = 'hoggcountry\.scout\.activeReplyTurn'/u);
  assert.match(pageSource, /rememberActiveReplyTurn\(turnId\);/u);
  assert.match(pageSource, /forgetStoredActiveReplyTurn\(turnId\);/u);
  assert.match(pageSource, /fetchScoutReplyTurnSnapshot\(turnId: string\)/u);
  assert.match(pageSource, /\/app-api\/scout\/reply\/turn\?turnId=/u);
});

test('Scout mobile resume recovery listens for browser resume and reconnect signals', () => {
  assert.match(pageSource, /window\.addEventListener\('pageshow', handlePageShow\)/u);
  assert.match(pageSource, /window\.addEventListener\('focus', handleFocus\)/u);
  assert.match(pageSource, /document\.addEventListener\('visibilitychange', handleVisibilityChange\)/u);
  assert.match(pageSource, /window\.addEventListener\('online', handleReconnect\)/u);
  assert.match(pageSource, /triggerScoutResumeRecovery\('reconnect', true\)/u);
  assert.match(pageSource, /await loadState\(\{ quiet: true \}\)/u);
});
