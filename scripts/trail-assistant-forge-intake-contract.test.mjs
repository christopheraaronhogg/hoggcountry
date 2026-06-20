import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const intakePages = [
	'apps/openclaw-web/src/routes/trail-assistant/+page.svelte',
	'src/pages/trail-assistant.astro'
];

const retiredNetlifyPatterns = [
	/data-netlify/u,
	/netlify-honeypot/u,
	/submitToNetlify/u,
	/formDataToUrlEncoded/u,
	/Netlify fallback/u,
	/Request queued via fallback/u
];

test('Trail Assistant intake pages submit through the Forge API, not Netlify forms', () => {
	for (const path of intakePages) {
		const source = read(path);

		assert.match(
			source,
			/\/trail-assistant\/intake/u,
			`${path} should keep the Forge API intake endpoint wired`
		);

		for (const pattern of retiredNetlifyPatterns) {
			assert.doesNotMatch(source, pattern, `${path} still contains retired Netlify intake fallback`);
		}
	}
});

