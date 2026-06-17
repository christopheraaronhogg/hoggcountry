#!/usr/bin/env node
// Capacitor install-readiness preflight for the Hogg Country mobile pilot.
//
// Catches the boring mistakes that block getting the app onto a real phone:
// wrong Node, no web build to sync, native platform not added, missing
// Xcode/CocoaPods. It also prints the field-pack endpoint the build will ship
// with, so whoever installs on Dad's phone can confirm where Scout pulls data.
//
// Usage:
//   node scripts/preflight.mjs                # informational doctor
//   node scripts/preflight.mjs --platform ios # hard-require iOS readiness
//
// Zero dependencies on purpose: it must run before `npm install` quirks bite.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(__dirname, '..');

const MIN_NODE_MAJOR = 20; // Capacitor 7 baseline.

const args = process.argv.slice(2);
const platformArg = readFlag(args, '--platform');
const requirePlatform = platformArg ? platformArg.toLowerCase() : null;

if (requirePlatform && requirePlatform !== 'ios' && requirePlatform !== 'android') {
	console.error(`Unknown --platform "${requirePlatform}". Use ios or android.`);
	process.exit(2);
}

let failures = 0;
let warnings = 0;

function ok(message) {
	console.log(`  ok   ${message}`);
}
function warn(message) {
	warnings += 1;
	console.log(`  warn ${message}`);
}
function fail(message) {
	failures += 1;
	console.log(`  FAIL ${message}`);
}

console.log(`Hogg Country mobile preflight${requirePlatform ? ` (target: ${requirePlatform})` : ''}`);
console.log('');

checkNode();
checkWebBuild();
const platforms = checkNativePlatforms();
if (requirePlatform === 'ios') checkIosToolchain();
if (requirePlatform === 'android') checkAndroidToolchain();
reportFieldPackEndpoint();

console.log('');
if (failures > 0) {
	console.log(`${failures} blocker(s), ${warnings} warning(s). Resolve the blockers before continuing.`);
	process.exit(1);
}
console.log(`Ready${warnings > 0 ? ` with ${warnings} warning(s)` : ''}. ${nextStepHint(platforms)}`);

function checkNode() {
	const major = Number(process.versions.node.split('.')[0]);
	if (Number.isFinite(major) && major >= MIN_NODE_MAJOR) {
		ok(`Node ${process.versions.node} (>= ${MIN_NODE_MAJOR})`);
	} else {
		fail(`Node ${process.versions.node} is below the Capacitor 7 minimum (>= ${MIN_NODE_MAJOR}). Upgrade Node.`);
	}
}

function checkWebBuild() {
	const webDir = readWebDir();
	const buildPath = join(mobileDir, webDir);
	const indexPath = join(buildPath, 'index.html');
	if (existsSync(indexPath)) {
		ok(`Web build present (${webDir}/index.html)`);
		return;
	}
	const message = `No web build at ${webDir}/. Run "npm run build" so Capacitor has assets to sync.`;
	// A missing build is fatal when you are about to open/run native (open
	// scripts don't build first); otherwise it's just a heads-up.
	if (requirePlatform) fail(message);
	else warn(message);
}

function checkNativePlatforms() {
	const ios = existsSync(join(mobileDir, 'ios'));
	const android = existsSync(join(mobileDir, 'android'));
	const present = [ios && 'ios', android && 'android'].filter(Boolean);

	if (present.length) {
		ok(`Native platform(s) added: ${present.join(', ')}`);
	} else {
		warn('No native platforms added yet. Run "npm run cap:add:ios" (or cap:add:android) once before installing on a phone.');
	}

	if (requirePlatform && !present.includes(requirePlatform)) {
		fail(`Native ${requirePlatform} project missing. Run "npm run cap:add:${requirePlatform}" first.`);
	}
	return present;
}

function checkIosToolchain() {
	if (process.platform !== 'darwin') {
		fail('iOS builds require macOS with Xcode.');
		return;
	}
	if (hasCommand('xcodebuild')) ok('Xcode command-line tools found (xcodebuild)');
	else fail('xcodebuild not found. Install Xcode, then run "xcode-select --install".');

	if (hasCommand('pod')) ok('CocoaPods found (pod)');
	else fail('CocoaPods not found. Install it: "sudo gem install cocoapods" (or "brew install cocoapods").');
}

function checkAndroidToolchain() {
	const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || defaultAndroidSdkPath();
	if (sdk && existsSync(sdk)) ok(`Android SDK found (${sdk})`);
	else warn('ANDROID_HOME/ANDROID_SDK_ROOT not set. Install Android Studio and set it before building APKs.');

	if (hasCommand('java')) ok('Java runtime found');
	else if (existsSync(defaultAndroidStudioJbr())) ok(`Android Studio Java runtime found (${defaultAndroidStudioJbr()})`);
	else warn('java not found on PATH. Android Studio ships a JDK; building from CLI needs one too.');
}

function reportFieldPackEndpoint() {
	const url = resolveFieldPackUrl();
	console.log('');
	console.log(`  Field-pack endpoint this build will use: ${url.value}`);
	console.log(`    source: ${url.source}`);
	if (/on-forge\.com/.test(url.value)) {
		warn('Field-pack endpoint points at the Forge validation host (on-forge.com), not production hoggcountry.com. Set VITE_SCOUT_FIELD_PACK_URL in .env if Dad should hit production.');
	}
}

// --- helpers ---------------------------------------------------------------

function readFlag(argv, name) {
	const eq = argv.find((a) => a.startsWith(`${name}=`));
	if (eq) return eq.slice(name.length + 1);
	const idx = argv.indexOf(name);
	if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
	return null;
}

function readWebDir() {
	const configPath = join(mobileDir, 'capacitor.config.ts');
	if (existsSync(configPath)) {
		const match = readFileSync(configPath, 'utf8').match(/webDir:\s*['"]([^'"]+)['"]/);
		if (match) return match[1];
	}
	return 'build';
}

function hasCommand(cmd) {
	const probe = spawnSync(process.platform === 'win32' ? 'where' : 'command', process.platform === 'win32' ? [cmd] : ['-v', cmd], {
		stdio: 'ignore',
		shell: process.platform !== 'win32'
	});
	return probe.status === 0;
}

function defaultAndroidSdkPath() {
	return join(process.env.HOME || '', 'Library', 'Android', 'sdk');
}

function defaultAndroidStudioJbr() {
	return '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
}

function resolveFieldPackUrl() {
	if (process.env.VITE_SCOUT_FIELD_PACK_URL) {
		return { value: process.env.VITE_SCOUT_FIELD_PACK_URL, source: 'process env VITE_SCOUT_FIELD_PACK_URL' };
	}
	for (const file of ['.env.local', '.env']) {
		const fromFile = readEnvValue(join(mobileDir, file), 'VITE_SCOUT_FIELD_PACK_URL');
		if (fromFile) return { value: fromFile, source: `${file}` };
	}
	return { value: readBakedDefaultUrl(), source: 'baked default in trailState.svelte.ts (no .env override)' };
}

// Read the fallback endpoint straight from the runtime source so this script
// can never drift from what the app actually ships with.
function readBakedDefaultUrl() {
	const source = join(mobileDir, 'src', 'lib', 'trailState.svelte.ts');
	if (existsSync(source)) {
		const match = readFileSync(source, 'utf8').match(/VITE_SCOUT_FIELD_PACK_URL[\s\S]*?\?\?\s*['"]([^'"]+)['"]/);
		if (match) return match[1];
	}
	return '(could not read default from trailState.svelte.ts)';
}

function readEnvValue(path, key) {
	if (!existsSync(path)) return null;
	for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		if (trimmed.slice(0, eq).trim() !== key) continue;
		return trimmed
			.slice(eq + 1)
			.trim()
			.replace(/^['"]|['"]$/g, '');
	}
	return null;
}

function nextStepHint(platforms) {
	if (requirePlatform) return `Opening the ${requirePlatform} project next.`;
	if (!platforms.length) return 'Next: npm run cap:add:ios (or cap:add:android).';
	return `Next: npm run cap:sync, then npm run cap:open:${platforms[0]}.`;
}
