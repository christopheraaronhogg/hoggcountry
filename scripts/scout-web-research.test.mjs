import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertPublicResearchUrl,
  extractDuckDuckGoResults,
  shouldPreloadWebResearchForPrompt
} from '../apps/openclaw-web/src/lib/server/scout-web-research.ts';

const fixture = `
  <html>
    <body>
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.weather.gov%2Fsafety%2Flightning">Lightning Safety</a>
      <a class="result__snippet">NOAA lightning safety guidance for outdoor decisions.</a>
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fgear">Gear Result</a>
      <div class="result__snippet">A general gear page.</div>
    </body>
  </html>
`;

test('extracts and domain-filters DuckDuckGo HTML results', () => {
  const results = extractDuckDuckGoResults(fixture, ['weather.gov'], 5);

  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Lightning Safety');
  assert.equal(results[0].url, 'https://www.weather.gov/safety/lightning');
  assert.equal(results[0].domain, 'weather.gov');
  assert.match(results[0].snippet, /NOAA lightning safety/u);
});

test('blocks local and private research URLs', () => {
  assert.throws(() => assertPublicResearchUrl('http://localhost:3000/admin'), /blocked/u);
  assert.throws(() => assertPublicResearchUrl('http://127.0.0.1:3000/admin'), /blocked/u);
  assert.throws(() => assertPublicResearchUrl('http://10.0.0.5/status'), /blocked/u);
  assert.throws(() => assertPublicResearchUrl('http://[::1]/admin'), /blocked/u);
  assert.throws(() => assertPublicResearchUrl('file:///etc/passwd'), /http\/https/u);
  assert.equal(assertPublicResearchUrl('https://appalachiantrail.org/trail-updates/').hostname, 'appalachiantrail.org');
  assert.equal(assertPublicResearchUrl('https://fdic.gov/').hostname, 'fdic.gov');
});

test('identifies DeepSeek preloaded web-research prompts without stealing weather and official-source questions', () => {
  assert.equal(shouldPreloadWebResearchForPrompt('look up hostel hours in Harpers Ferry'), true);
  assert.equal(shouldPreloadWebResearchForPrompt('search the web for current trail runner reviews'), true);
  assert.equal(shouldPreloadWebResearchForPrompt('what is the weather tomorrow?'), false);
  assert.equal(shouldPreloadWebResearchForPrompt('are there closures near Harpers Ferry?'), false);
  assert.equal(shouldPreloadWebResearchForPrompt('search the web for official closure sources near Harpers Ferry'), true);
});
