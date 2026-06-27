import assert from 'node:assert/strict';
import test from 'node:test';

import {
	getCapacitorScoutInstallSource,
	isNativePlatform,
	setCapacitorScoutEvalKeepAwake
} from './capacitor-gemma-bridge.ts';

test('install-source helper reads native ScoutGemma diagnostics', async () => {
	const win = nativeWindow({
		getInstallSource: async () => ({
			type: 'testflight',
			platform: 'ios',
			detectedBy: 'ios-app-store-receipt',
			receiptPresent: true,
			receiptLastPathComponent: 'sandboxReceipt',
			debugBuild: false,
			buildConfiguration: 'release'
		})
	});

	assert.equal(isNativePlatform(win), true);
	assert.deepEqual(await getCapacitorScoutInstallSource(win), {
		type: 'testflight',
		platform: 'ios',
		detectedBy: 'ios-app-store-receipt',
		receiptPresent: true,
		receiptLastPathComponent: 'sandboxReceipt',
		installerPackage: null,
		debugBuild: false,
		buildConfiguration: 'release'
	});
});

test('install-source helper returns null outside native Capacitor', async () => {
	const win = {
		Capacitor: {
			isNativePlatform: () => false
		}
	} as unknown as Window;

	assert.equal(await getCapacitorScoutInstallSource(win), null);
});

test('eval keep-awake helper toggles native ScoutGemma idle protection', async () => {
	const calls: Array<{ active: boolean }> = [];
	const win = nativeWindow({
		setEvalKeepAwake: async (input: { active: boolean }) => {
			calls.push(input);
			return {
				active: input.active,
				supported: true,
				platform: 'ios'
			};
		}
	});

	assert.deepEqual(await setCapacitorScoutEvalKeepAwake(true, win), {
		active: true,
		supported: true,
		platform: 'ios'
	});
	assert.deepEqual(await setCapacitorScoutEvalKeepAwake(false, win), {
		active: false,
		supported: true,
		platform: 'ios'
	});
	assert.deepEqual(calls, [{ active: true }, { active: false }]);
});

test('eval keep-awake helper degrades outside native Capacitor or older plugins', async () => {
	const webWindow = {
		Capacitor: {
			isNativePlatform: () => false
		}
	} as unknown as Window;
	const oldNativeWindow = nativeWindow({});

	assert.equal(await setCapacitorScoutEvalKeepAwake(true, webWindow), null);
	assert.equal(await setCapacitorScoutEvalKeepAwake(true, oldNativeWindow), null);
});

test('install-source helper normalizes incomplete native payloads', async () => {
	const win = nativeWindow({
		getInstallSource: async () => ({
			type: '',
			platform: 'ios',
			receiptLastPathComponent: 42,
			installerPackage: 42
		})
	});

	assert.deepEqual(await getCapacitorScoutInstallSource(win), {
		type: 'unknown',
		platform: 'ios',
		receiptLastPathComponent: null,
		installerPackage: null
	});
});

function nativeWindow(plugin: Record<string, unknown>): Window {
	return {
		Capacitor: {
			isNativePlatform: () => true,
			Plugins: {
				ScoutGemma: plugin
			}
		}
	} as unknown as Window;
}
