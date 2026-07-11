#!/usr/bin/env node
// Writes the tiny public manifest the native app and PWA use to compare the
// installed build against the latest deployed build.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
const source = sourceBuildIdentity();

const manifest = {
	name: 'Hogg Country',
	channel: 'testflight',
	version,
	build,
	label: formatVersionLabel(version, build),
	gitSha: source.gitSha,
	gitShortSha: source.gitSha?.slice(0, 8) ?? null,
	sourceBuild: source.sourceBuild,
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

function sourceBuildIdentity() {
	const gitSha = git(['rev-parse', 'HEAD']) || null;
	const trackedDiff = git([
		'diff',
		'--binary',
		'HEAD',
		'--',
		'mobile',
		'packages/trail-data'
	]);
	const untracked = git([
		'ls-files',
		'--others',
		'--exclude-standard',
		'--',
		'mobile',
		'packages/trail-data'
	])
		.split('\n')
		.map((value) => value.trim())
		.filter(Boolean)
		.sort();
	const hash = createHash('sha256');
	hash.update(trackedDiff);
	for (const relativePath of untracked) {
		const absolutePath = join(repoRoot, relativePath);
		if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) continue;
		hash.update(`\n${relativePath}\n`);
		hash.update(readFileSync(absolutePath));
	}
	const dirty = trackedDiff.length > 0 || untracked.length > 0;
	const base = gitSha ?? 'no-git-sha';
	return {
		gitSha,
		sourceBuild: dirty ? `${base}-dirty-${hash.digest('hex').slice(0, 12)}` : base
	};
}

function git(args) {
	try {
		return execFileSync('git', args, {
			cwd: repoRoot,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();
	} catch {
		return '';
	}
}
