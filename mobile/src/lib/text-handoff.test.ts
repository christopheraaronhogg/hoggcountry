import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
	copyHandoffText,
	createTextHandoffAdapter,
	handoffText,
	isShareInterruptedError,
	type TextHandoffAdapter,
	type TextHandoffInput
} from './text-handoff.ts';

const input: TextHandoffInput = {
	title: 'Trail check-in',
	text: 'Sprout checking in.',
	url: 'https://hoggcountry.com/map'
};

function sourceFiles(directory: URL): URL[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
		if (entry.isDirectory()) return sourceFiles(url);
		return /\.(?:svelte|ts)$/u.test(entry.name) ? [url] : [];
	});
}

test('successful share reports only that the platform handoff returned', async () => {
	const calls: TextHandoffInput[] = [];
	const outcome = await handoffText(input, {
		share: async (payload) => {
			calls.push(payload);
		}
	});

	assert.equal(outcome, 'share-handoff-complete');
	assert.deepEqual(calls, [input]);
});

test('clipboard-only handoff copies the text and optional URL', async () => {
	const copied: string[] = [];
	const outcome = await handoffText(input, {
		copyText: async (text) => {
			copied.push(text);
		}
	});

	assert.equal(outcome, 'copied');
	assert.deepEqual(copied, ['Sprout checking in.\n\nhttps://hoggcountry.com/map']);
});

test('clipboard handoff does not add spacing when there is no URL', async () => {
	const copied: string[] = [];
	const outcome = await handoffText(
		{ title: input.title, text: input.text },
		{
			copyText: async (text) => {
				copied.push(text);
			}
		}
	);

	assert.equal(outcome, 'copied');
	assert.deepEqual(copied, ['Sprout checking in.']);
});

test('cross-realm-like AbortError reports cancel or no target without copying', async () => {
	let copyCalls = 0;
	const foreignAbort = Object.create(null) as { name: string };
	foreignAbort.name = 'AbortError';
	const adapter: TextHandoffAdapter = {
		share: async () => {
			throw foreignAbort;
		},
		copyText: async () => {
			copyCalls += 1;
		}
	};

	assert.equal(await handoffText(input, adapter), 'cancelled-or-no-target');
	assert.equal(copyCalls, 0);
});

test('Capacitor native cancellation never opens another chooser or copies', async () => {
	const calls: string[] = [];
	const adapter = createTextHandoffAdapter({
		isNative: true,
		nativeShare: {
			canShare: async () => ({ value: true }),
			share: async () => {
				calls.push('native-share');
				throw new Error('Share canceled');
			}
		},
		nativeClipboard: {
			write: async () => {
				calls.push('native-copy');
			}
		},
		webShare: async () => {
			calls.push('web-share');
		},
		webCopyText: async () => {
			calls.push('web-copy');
		}
	});

	assert.equal(await handoffText(input, adapter), 'cancelled-or-no-target');
	assert.deepEqual(calls, ['native-share']);
});

test('explicit copy skips the share capability', async () => {
	let shareCalls = 0;
	const copied: string[] = [];
	const outcome = await copyHandoffText(input, {
		share: async () => {
			shareCalls += 1;
		},
		copyText: async (text) => {
			copied.push(text);
		}
	});

	assert.equal(outcome, 'copied');
	assert.equal(shareCalls, 0);
	assert.deepEqual(copied, ['Sprout checking in.\n\nhttps://hoggcountry.com/map']);
});

test('native adapter prefers Capacitor share and clipboard plugins', async () => {
	const calls: string[] = [];
	const adapter = createTextHandoffAdapter({
		isNative: true,
		nativeShare: {
			canShare: async () => {
				calls.push('native-can-share');
				return { value: true };
			},
			share: async () => {
				calls.push('native-share');
			}
		},
		nativeClipboard: {
			write: async ({ string }) => {
				calls.push(`native-copy:${string}`);
			}
		},
		webShare: async () => {
			calls.push('web-share');
		},
		webCopyText: async () => {
			calls.push('web-copy');
		}
	});

	assert.equal(await handoffText(input, adapter), 'share-handoff-complete');
	assert.equal(await copyHandoffText(input, adapter), 'copied');
	assert.deepEqual(calls, [
		'native-can-share',
		'native-share',
		'native-copy:Sprout checking in.\n\nhttps://hoggcountry.com/map'
	]);
});

test('native adapter uses clipboard fallback after native sharing is unavailable', async () => {
	const calls: string[] = [];
	const adapter = createTextHandoffAdapter({
		isNative: true,
		nativeShare: {
			canShare: async () => ({ value: false }),
			share: async () => {
				calls.push('unexpected-native-share');
			}
		},
		nativeClipboard: {
			write: async () => {
				throw new Error('Native clipboard unavailable');
			}
		},
		webShare: async () => {
			calls.push('web-share');
		},
		webCopyText: async () => {
			calls.push('web-copy');
		}
	});

	assert.equal(await handoffText(input, adapter), 'copied');
	assert.equal(await copyHandoffText(input, adapter), 'copied');
	assert.deepEqual(calls, ['web-copy', 'web-copy']);
});

test('web adapter ignores native plugins when Capacitor is not native', async () => {
	const calls: string[] = [];
	const adapter = createTextHandoffAdapter({
		isNative: false,
		nativeShare: {
			canShare: async () => {
				calls.push('native-can-share');
				return { value: true };
			},
			share: async () => {
				calls.push('native-share');
			}
		},
		nativeClipboard: {
			write: async () => {
				calls.push('native-copy');
			}
		},
		webShare: async () => {
			calls.push('web-share');
		},
		webCopyText: async () => {
			calls.push('web-copy');
		}
	});

	assert.equal(await handoffText(input, adapter), 'share-handoff-complete');
	assert.equal(await copyHandoffText(input, adapter), 'copied');
	assert.deepEqual(calls, ['web-share', 'web-copy']);
});

test('legacy cross-realm abort code is recognized structurally', () => {
	assert.equal(isShareInterruptedError({ code: 20 }), true);
	assert.equal(isShareInterruptedError({ code: 'ABORT_ERR' }), true);
	assert.equal(isShareInterruptedError({ name: 'AbortError' }), true);
	assert.equal(isShareInterruptedError(new Error('Share canceled')), true);
	assert.equal(isShareInterruptedError(new Error('Share cancelled.')), true);
	assert.equal(isShareInterruptedError(new Error('AbortError')), false);
	assert.equal(isShareInterruptedError(null), false);
});

test('non-abort share failure falls back to the clipboard', async () => {
	const copied: string[] = [];
	const outcome = await handoffText(input, {
		share: async () => {
			throw new Error('Native share bridge unavailable');
		},
		copyText: async (text) => {
			copied.push(text);
		}
	});

	assert.equal(outcome, 'copied');
	assert.deepEqual(copied, ['Sprout checking in.\n\nhttps://hoggcountry.com/map']);
});

test('missing or failed handoff capabilities report unavailable', async () => {
	assert.equal(await handoffText(input, {}), 'unavailable');
	assert.equal(
		await handoffText(input, {
			copyText: async () => {
				throw new Error('Clipboard denied');
			}
		}),
		'unavailable'
	);
	assert.equal(
		await handoffText(input, {
			share: async () => {
				throw new Error('Share unavailable');
			}
		}),
		'unavailable'
	);
});

test('mobile source has no body-bearing SMS URL handoffs', () => {
	const offenders = sourceFiles(new URL('../', import.meta.url))
		.filter((url) => /sms:[^\n]*?(?:\?|&)body=/iu.test(readFileSync(url, 'utf8')))
		.map((url) => url.pathname);

	assert.deepEqual(offenders, []);
});
