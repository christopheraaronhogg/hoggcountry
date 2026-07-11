import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function source(relativePath: string): string {
	return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

test('portable handoff dependencies are registered in both native projects', () => {
	const packageJson = JSON.parse(source('../../package.json')) as {
		dependencies?: Record<string, string>;
	};
	assert.ok(packageJson.dependencies?.['@capacitor/share']);
	assert.ok(packageJson.dependencies?.['@capacitor/clipboard']);

	const androidSettings = source('../../android/capacitor.settings.gradle');
	const androidBuild = source('../../android/app/capacitor.build.gradle');
	assert.match(androidSettings, /include ':capacitor-share'/);
	assert.match(androidSettings, /include ':capacitor-clipboard'/);
	assert.match(androidBuild, /implementation project\(':capacitor-share'\)/);
	assert.match(androidBuild, /implementation project\(':capacitor-clipboard'\)/);

	const podfile = source('../../ios/App/Podfile');
	const podLock = source('../../ios/App/Podfile.lock');
	assert.match(podfile, /pod 'CapacitorShare'/);
	assert.match(podfile, /pod 'CapacitorClipboard'/);
	assert.match(podLock, /CapacitorShare \(/);
	assert.match(podLock, /CapacitorClipboard \(/);
});
