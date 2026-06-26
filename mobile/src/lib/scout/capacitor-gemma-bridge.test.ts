import assert from 'node:assert/strict';
import test from 'node:test';

import {
	getCapacitorScoutInstallSource,
	isNativePlatform
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
