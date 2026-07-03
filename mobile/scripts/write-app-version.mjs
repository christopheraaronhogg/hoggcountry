#!/usr/bin/env node
// Writes the tiny public manifest the native app and PWA use to compare the
// installed build against the latest deployed build.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(__dirname, '..');
const repoRoot = resolve(mobileDir, '..');
const iosProjectPath = join(mobileDir, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const outPath = join(mobileDir, 'static', 'app-version.json');
const testFlightUrl = process.env.PUBLIC_TESTFLIGHT_URL || 'https://testflight.apple.com/join/BagBCrzf';

const project = readFileSync(iosProjectPath, 'utf8');
const version = uniqueBuildSetting(project, 'MARKETING_VERSION') ?? '1.0';
const build = uniqueBuildSetting(project, 'CURRENT_PROJECT_VERSION') ?? '0';

const manifest = {
	name: 'Hogg Country',
	channel: 'testflight',
	version,
	build,
	label: formatVersionLabel(version, build),
	testFlightUrl
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Wrote ${relativeOut(outPath)} ${manifest.label}`);

function uniqueBuildSetting(text, key) {
	const matches = [...text.matchAll(new RegExp(`${key} = ([^;]+);`, 'gu'))].map((match) =>
		match[1]?.trim()
	);
	const unique = [...new Set(matches.filter(Boolean))];
	return unique.length === 1 ? unique[0] : null;
}

function formatVersionLabel(versionValue, buildValue) {
	return buildValue ? `${versionValue} (${buildValue})` : versionValue;
}

function relativeOut(path) {
	return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path;
}
