#!/usr/bin/env node
// Submission proof ledger for Trail Assistant.
//
// This is not a replacement for App Store Connect, Play Console, or physical
// phone testing. It separates code/config evidence from the manual/account and
// device proof that must exist before we call a build submission-grade.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(__dirname, '..');
const repoRoot = resolve(mobileDir, '..');

const rawArgs = process.argv.slice(2);
const json = hasFlag(rawArgs, '--json');
const strict = hasFlag(rawArgs, '--strict');
const nextOnly = hasFlag(rawArgs, '--next');
const help = hasFlag(rawArgs, '--help') || hasFlag(rawArgs, '-h');
const evidenceArg = readFlag(rawArgs, '--evidence');

const validArgs = new Set(['--json', '--strict', '--next', '--help', '-h', '--evidence']);
const unknownArgs = unknownFlags(rawArgs, validArgs);
if (unknownArgs.length) {
	console.error(`Unknown option(s): ${unknownArgs.join(', ')}`);
	process.exit(2);
}
if (hasEvidenceFlag(rawArgs) && !evidenceArg) {
	console.error('--evidence requires a path.');
	process.exit(2);
}

if (help) {
	console.log(`Trail Assistant release proof

Usage:
  node scripts/release-proof.mjs          Print the current submission proof ledger
  node scripts/release-proof.mjs --next   Print only unresolved gates with evidence stubs
  node scripts/release-proof.mjs --json   Print machine-readable JSON
  node scripts/release-proof.mjs --strict Exit non-zero until every lane is proven
  node scripts/release-proof.mjs --evidence ../docs/launch/release-evidence.json

Statuses:
  pass    Code or repo evidence exists now
  warn    Evidence exists, but the release owner still needs to review it
  manual  Human/account/device evidence is required
  blocker Missing repo evidence blocks a submission attempt
`);
	process.exit(0);
}

const evidencePath = evidenceArg ? resolve(process.cwd(), evidenceArg) : join(repoRoot, 'docs', 'launch', 'release-evidence.json');
const evidence = loadEvidence(evidencePath);
const iosProject = read('mobile/ios/App/App.xcodeproj/project.pbxproj');
const iosInfo = read('mobile/ios/App/App/Info.plist');
const iosPrivacy = read('mobile/ios/App/App/PrivacyInfo.xcprivacy');
const androidGradle = read('mobile/android/app/build.gradle');
const androidManifest = read('mobile/android/app/src/main/AndroidManifest.xml');
const mobilePackage = read('mobile/package.json');
const rootPackage = read('package.json');
const privacyPolicy = read('docs/launch/privacy/privacy-policy.md');
const privacyAnswers = read('docs/launch/privacy/app-privacy-and-data-safety.md');
const reviewNotes = read('docs/launch/store-copy/review-notes.md');
const appleCopy = read('docs/launch/store-copy/apple-app-store.md');
const playCopy = read('docs/launch/store-copy/google-play.md');
const morningBrief = read('docs/launch/MORNING-BRIEF.md');

const evidenceGuidance = {
	'ios-development-team': {
		file: 'docs/launch/proof/ios-development-team-YYYY-MM-DD.md',
		summary: 'Xcode App target is signed with Chris-owned Apple Developer Team and a valid local signing identity.',
		proofTarget: 'After Apple Developer access is configured, record the selected team id, signing identity, provisioning profile, and Xcode build settings without committing secrets.',
		commands: [
			'security find-identity -v -p codesigning',
			'xcodebuild -workspace mobile/ios/App/App.xcworkspace -scheme App -showBuildSettings | rg -n "DEVELOPMENT_TEAM|CODE_SIGN_STYLE|PROVISIONING_PROFILE|PRODUCT_BUNDLE_IDENTIFIER"'
		]
	},
	'app-store-connect-record': {
		file: 'docs/launch/proof/app-store-connect-record-YYYY-MM-DD.md',
		summary: 'App Store Connect record exists with bundle id, metadata, screenshots, privacy answers, support URL, and review notes entered.',
		proofTarget: 'Capture the App Store Connect app id/status plus a field checklist for listing, screenshots, privacy, age rating, support URL, and review notes.',
		urls: ['https://appstoreconnect.apple.com/apps']
	},
	'apple-archive-upload': {
		file: 'docs/launch/proof/apple-archive-upload-YYYY-MM-DD.md',
		summary: 'Signed iOS archive was created and uploaded to App Store Connect/TestFlight for this repo SHA.',
		proofTarget: 'Record archive timestamp, bundle/version/build, upload result, and App Store Connect processing status.',
		commands: [
			'xcodebuild -workspace mobile/ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/App.xcarchive archive'
		]
	},
	'play-console-record': {
		file: 'docs/launch/proof/play-console-record-YYYY-MM-DD.md',
		summary: 'Play Console record exists with listing, screenshots, Data Safety, IARC rating, foreground-service declaration, and internal testing track.',
		proofTarget: 'Capture Play Console app id/status plus a field checklist for listing, Data Safety, IARC, foreground service, privacy URL, assets, and internal testing.',
		urls: ['https://play.google.com/console']
	},
	'ios-physical-scout-answer': {
		file: 'docs/launch/proof/ios-physical-scout-answer-YYYY-MM-DD.md',
		summary: 'Physical iPhone/TestFlight build downloaded the model and produced one real on-device Scout answer.',
		proofTarget: 'Capture device model/iOS version, install source, model status, prompt, answer, latency, and logs showing runtimeConfigured/downloadConfigured.',
		commands: ['xcrun devicectl list devices']
	},
	'android-physical-scout-answer': {
		file: 'docs/launch/proof/android-physical-scout-answer-YYYY-MM-DD.md',
		summary: 'Physical Android/internal-test build downloaded the model and produced one real on-device Scout answer.',
		proofTarget: 'Capture device model/Android version, install source, model status, prompt, answer, latency, and relevant logcat lines.',
		commands: ['adb devices -l', 'adb logcat -d | rg -i "Scout|model|Gemma|LiteRT"']
	},
	'physical-gps-permission': {
		file: 'docs/launch/proof/physical-gps-permission-YYYY-MM-DD.md',
		summary: 'Physical device GPS allowed, denied, and off-trail states were tested without fake fixes.',
		proofTarget: 'Record device, permission path, allowed/denied/off-trail UI states, and whether the trail mile updates only after a real fix.',
		commands: ['xcrun devicectl list devices', 'adb devices -l']
	},
	'offline-kill-relaunch': {
		file: 'docs/launch/proof/offline-kill-relaunch-YYYY-MM-DD.md',
		summary: 'Installed app survives airplane-mode kill/relaunch with Preferences-backed state and honest offline Scout status.',
		proofTarget: 'Record install source, airplane-mode state, kill/relaunch steps, persisted profile/loadout, Bible availability, Today/Map/Gear behavior, and Scout offline copy.',
		commands: ['xcrun devicectl list devices', 'adb devices -l']
	},
	'battery-thermal-latency': {
		file: 'docs/launch/proof/battery-thermal-latency-YYYY-MM-DD.md',
		summary: 'Physical model download/inference latency, battery, thermal, and low-signal behavior were tested.',
		proofTarget: 'Record device, battery before/after, thermal observations, network state, model download duration, answer latency, and failure copy.',
		commands: ['xcrun devicectl list devices', 'adb devices -l']
	},
	'accessibility-field-pass': {
		file: 'docs/launch/proof/accessibility-field-pass-YYYY-MM-DD.md',
		summary: 'VoiceOver/Dynamic Type/dark-mode/glare/cold-hands checks passed or produced tracked fixes.',
		proofTarget: 'Record device, text-size setting, VoiceOver pass/fail, dark-mode pass, high-contrast/glare notes, and tap-target/cold-hands observations.',
		commands: ['xcrun devicectl list devices', 'adb devices -l']
	}
};

const items = [
	check('code-build', 'mobile-check-script', 'pass', mobilePackage.includes('"check"'), {
		pass: 'mobile/package.json exposes npm run check.',
		fail: 'mobile/package.json is missing npm run check.'
	}),
	check('code-build', 'mobile-build-script', 'pass', mobilePackage.includes('"build"'), {
		pass: 'mobile/package.json exposes npm run build.',
		fail: 'mobile/package.json is missing npm run build.'
	}),
	check('code-build', 'mobile-preflight-script', 'pass', exists('mobile/scripts/preflight.mjs'), {
		pass: 'Capacitor preflight script exists.',
		fail: 'mobile/scripts/preflight.mjs is missing.'
	}),
	check('code-build', 'root-mobile-contract-tests', 'pass', rootPackage.includes('mobile-privacy-contract.test.mjs') && rootPackage.includes('mobile-trail-pulse-contract.test.mjs') && rootPackage.includes('mobile-release-proof-contract.test.mjs'), {
		pass: 'Root test suite includes mobile privacy, Trail Pulse, and release-proof contracts.',
		fail: 'Root test suite is missing mobile release/privacy contracts.'
	}),

	check('native-config', 'ios-project', 'pass', exists('mobile/ios/App/App.xcodeproj/project.pbxproj'), {
		pass: 'iOS Xcode project is committed.',
		fail: 'iOS Xcode project is missing.'
	}),
	check('native-config', 'ios-bundle-id', 'pass', iosProject.includes('PRODUCT_BUNDLE_IDENTIFIER = com.hoggcountry.trailassistant;'), {
		pass: 'iOS bundle id is com.hoggcountry.trailassistant.',
		fail: 'iOS bundle id is missing or drifted.'
	}),
	check('native-config', 'ios-version-build', 'pass', iosProject.includes('MARKETING_VERSION = 1.0;') && iosProject.includes('CURRENT_PROJECT_VERSION = 1;'), {
		pass: 'iOS marketing version/build are 1.0/1.',
		fail: 'iOS marketing version/build are not the expected 1.0/1.'
	}),
	check('native-config', 'ios-privacy-manifest-bundled', 'pass', iosPrivacy.includes('NSPrivacyCollectedDataTypeCoarseLocation') && iosProject.includes('PrivacyInfo.xcprivacy in Resources'), {
		pass: 'iOS privacy manifest exists and is in Copy Bundle Resources.',
		fail: 'iOS privacy manifest is missing or not bundled.'
	}),
	check('native-config', 'ios-location-copy', 'pass', iosInfo.includes('NSLocationWhenInUseUsageDescription') && iosInfo.includes('never tracked in the background'), {
		pass: 'iOS location usage copy is present and scoped to user action.',
		fail: 'iOS location usage copy is missing or too vague.'
	}),
	check('native-config', 'ios-shared-scheme', 'pass', exists('mobile/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme'), {
		pass: 'App scheme is shared for archive/build automation.',
		fail: 'Shared iOS App scheme is missing.'
	}),
	check('native-config', 'android-project', 'pass', exists('mobile/android/app/build.gradle') && exists('mobile/android/app/src/main/AndroidManifest.xml'), {
		pass: 'Android native project is committed.',
		fail: 'Android native project is missing.'
	}),
	check('native-config', 'android-identity-version', 'pass', androidGradle.includes('applicationId "com.hoggcountry.trailassistant"') && androidGradle.includes('versionCode 1') && androidGradle.includes('versionName "1.0.0"'), {
		pass: 'Android app id/version are com.hoggcountry.trailassistant / 1.0.0 (1).',
		fail: 'Android app id/version are missing or drifted.'
	}),
	check('native-config', 'android-model-download-service', 'pass', androidManifest.includes('ScoutModelDownloadService') && androidManifest.includes('foregroundServiceType="dataSync"'), {
		pass: 'Android model-download foreground service is declared.',
		fail: 'Android model-download service declaration is missing.'
	}),

	check('store-metadata', 'privacy-policy-effective-date', 'pass', /Effective date:\*\*\s+June 18, 2026/u.test(privacyPolicy), {
		pass: 'Privacy policy has a concrete effective date.',
		fail: 'Privacy policy effective date is missing or placeholder.'
	}),
	check('store-metadata', 'privacy-contact-and-deletion', 'manual', privacyPolicy.includes('chris.stitchscreen@gmail.com') && privacyAnswers.includes('deletion is an **email request**'), {
		pass: 'chris.stitchscreen@gmail.com is documented; verify the mailbox receives mail before submission.',
		fail: 'Privacy contact or deletion route is missing from launch docs.'
	}),
	check('store-metadata', 'privacy-and-support-routes', 'manual', exists('apps/openclaw-web/src/routes/privacy/+page.svelte') && exists('apps/openclaw-web/src/routes/support/+page.svelte'), {
		pass: 'Public privacy and support routes exist; verify them live after deploy.',
		fail: 'Public privacy/support routes are missing.'
	}),
	check('store-metadata', 'store-review-notes', 'pass', reviewNotes.includes('no account') && reviewNotes.includes('on-device'), {
		pass: 'Store review notes exist and call out no-account/on-device behavior.',
		fail: 'Store review notes are missing key reviewer context.'
	}),
	check('store-metadata', 'apple-listing-copy', 'pass', appleCopy.includes('Support URL') && appleCopy.includes('Privacy Policy URL'), {
		pass: 'Apple listing copy includes support/privacy URL fields.',
		fail: 'Apple listing copy is missing support/privacy URL guidance.'
	}),
	check('store-metadata', 'play-listing-copy', 'pass', playCopy.includes('Data Safety') && playCopy.includes('privacy policy'), {
		pass: 'Google Play listing copy includes Data Safety/privacy guidance.',
		fail: 'Google Play listing copy is missing Data Safety/privacy guidance.'
	}),
	check('store-metadata', 'ios-screenshots', 'pass', countFiles('docs/launch/screenshots/ios', '.png') >= 6, {
		pass: 'At least six iOS screenshots are present.',
		fail: 'iOS screenshots are missing.'
	}),
	check('store-metadata', 'play-assets', 'pass', countFiles('docs/launch/screenshots/play', '.png') >= 8 && exists('docs/launch/screenshots/play/feature-graphic-1024x500.png') && exists('docs/launch/screenshots/play/play-icon-512.png'), {
		pass: 'Play screenshots, feature graphic, and icon are present.',
		fail: 'Google Play screenshots/feature graphic/icon are incomplete.'
	}),

	check('manual-account', 'ios-development-team', 'manual', hasIosDevelopmentTeam(iosProject), {
		pass: 'DEVELOPMENT_TEAM is set in the iOS project; still verify the selected Apple team in Xcode.',
		fail: 'Set Chris-owned Apple Developer Team in Xcode before archive/upload.'
	}),
	item('manual-account', 'app-store-connect-record', 'manual', 'Create/verify the App Store Connect record, bundle id, category, age rating, screenshots, App Privacy answers, support URL, and review notes.'),
	item('manual-account', 'apple-archive-upload', 'manual', 'Archive and upload from Xcode after signing is set; capture the archive/upload result.'),
	check('manual-account', 'android-upload-keystore', 'manual', hasAndroidKeystoreEnv(), {
		pass: 'Android upload-key env vars are present in this shell; keep the secret outside git.',
		fail: 'Create the Play upload keystore and set HC_ANDROID_KEYSTORE_FILE, HC_ANDROID_KEYSTORE_PASSWORD, HC_ANDROID_KEY_ALIAS, and HC_ANDROID_KEY_PASSWORD.'
	}),
	item('manual-account', 'play-console-record', 'manual', 'Create/verify the Play Console app, Data Safety form, IARC rating, foreground-service declaration, screenshots, and internal testing track.'),

	item('device-smoke', 'ios-physical-scout-answer', 'manual', 'On a physical iPhone/TestFlight build, download the model and capture one real Scout answer before store copy claims live on-device AI.'),
	item('device-smoke', 'android-physical-scout-answer', 'manual', 'On a physical Android/internal-test build, download the model and capture one real Scout answer before public release.'),
	item('device-smoke', 'physical-gps-permission', 'manual', 'On physical hardware, smoke GPS allowed/denied/off-trail states and confirm the UI never fakes a fix.'),
	item('device-smoke', 'offline-kill-relaunch', 'manual', 'Install, enable airplane mode, kill/relaunch, and verify Preferences-backed state, offline Scout status, Bible, Today, Map, and Gear.'),
	item('device-smoke', 'battery-thermal-latency', 'manual', 'Run a real-phone pass for model download/inference latency, battery draw, thermal behavior, and low-signal failure states.'),
	item('device-smoke', 'accessibility-field-pass', 'manual', 'Run VoiceOver/Dynamic Type/dark-mode/glare/cold-hands checks before telling real hikers to rely on it.'),

	check('release-honesty', 'launch-brief-boundaries', 'pass', morningBrief.includes('Nothing submitted') && morningBrief.includes('iOS AI must be runtime-smoked on device'), {
		pass: 'Morning brief keeps account/device gaps separate from committed repo work.',
		fail: 'Morning brief no longer states the account/device boundaries clearly.'
	})
];

const summary = summarize(items);
const report = {
	title: 'Trail Assistant release proof',
	generatedAt: new Date().toISOString(),
	readyForSubmission: summary.blocker === 0 && summary.manual === 0 && summary.warn === 0,
	evidence: {
		path: relativePath(evidence.path),
		loaded: evidence.loaded,
		warnings: evidence.warnings
	},
	summary,
	items,
	nextActions: unresolvedActions(items)
};

if (json) {
	console.log(JSON.stringify(report, null, 2));
} else if (nextOnly) {
	printNextActions(report);
} else {
	printReport(report);
}

if (strict && !report.readyForSubmission) {
	process.exit(1);
}

function item(lane, id, status, detail) {
	const override = evidenceOverride(id);
	if ((status === 'manual' || status === 'blocker') && override) {
		return { lane, id, status: override.status, detail: override.detail };
	}
	return { lane, id, status, detail };
}

function check(lane, id, statusWhenTrue, condition, messages) {
	if (condition) {
		return item(lane, id, statusWhenTrue, messages.pass);
	}
	return item(lane, id, 'blocker', messages.fail);
}

function summarize(proofItems) {
	const counts = { pass: 0, warn: 0, manual: 0, blocker: 0 };
	for (const proof of proofItems) {
		counts[proof.status] += 1;
	}
	return counts;
}

function printReport(proof) {
	console.log(proof.title);
	console.log(`Generated: ${proof.generatedAt}`);
	console.log(`Evidence: ${proof.evidence.loaded ? proof.evidence.path : `${proof.evidence.path} (not found)`}`);
	for (const warning of proof.evidence.warnings) {
		console.log(`Evidence warning: ${warning}`);
	}
	console.log('');
	if (proof.readyForSubmission) {
		console.log('Status: READY FOR SUBMISSION PROOF PACKAGE');
	} else {
		console.log('Status: NOT READY for store submission');
		console.log('Reason: manual/device/account evidence remains outside the green build/test lane.');
	}
	console.log(`Summary: ${proof.summary.pass} pass, ${proof.summary.warn} warn, ${proof.summary.manual} manual, ${proof.summary.blocker} blocker`);
	console.log('');

	for (const lane of unique(proof.items.map((proofItem) => proofItem.lane))) {
		console.log(`${lane}:`);
		for (const proofItem of proof.items.filter((candidate) => candidate.lane === lane)) {
			console.log(`  ${proofItem.status.padEnd(7)} ${proofItem.id} - ${proofItem.detail}`);
		}
		console.log('');
	}

	if (!proof.readyForSubmission) {
		console.log('Next: resolve every manual/blocker item, rerun this command, then rerun with --strict before archive/upload.');
	}
}

function printNextActions(proof) {
	console.log('Trail Assistant remaining release proof');
	console.log(`Generated: ${proof.generatedAt}`);
	console.log(`Evidence: ${proof.evidence.loaded ? proof.evidence.path : `${proof.evidence.path} (not found)`}`);
	console.log(`Summary: ${proof.summary.pass} pass, ${proof.summary.warn} warn, ${proof.summary.manual} manual, ${proof.summary.blocker} blocker`);
	console.log('');

	if (proof.nextActions.length === 0) {
		console.log('No unresolved release-proof gates remain. Run npm run release:proof -- --strict before archive/upload.');
		return;
	}

	for (const action of proof.nextActions) {
		console.log(`${action.status.padEnd(7)} ${action.id} (${action.lane})`);
		console.log(`  Need: ${action.detail}`);
		if (action.proofTarget) console.log(`  Proof target: ${action.proofTarget}`);
		if (action.commands.length) {
			console.log('  Suggested proof commands:');
			for (const command of action.commands) console.log(`    - ${command}`);
		}
		if (action.urls.length) {
			console.log('  Account URLs:');
			for (const url of action.urls) console.log(`    - ${url}`);
		}
		console.log('  Evidence JSON stub:');
		console.log(indent(JSON.stringify({ [action.id]: action.evidenceStub }, null, 2), 4));
		console.log('');
	}
}

function unresolvedActions(proofItems) {
	return proofItems
		.filter((proofItem) => proofItem.status === 'manual' || proofItem.status === 'blocker' || proofItem.status === 'warn')
		.map((proofItem) => {
			const guidance = evidenceGuidance[proofItem.id] || {};
			return {
				lane: proofItem.lane,
				id: proofItem.id,
				status: proofItem.status,
				detail: proofItem.detail,
				proofTarget: guidance.proofTarget || 'Capture a dated proof artifact under docs/launch/proof/ and reference it in docs/launch/release-evidence.json.',
				commands: guidance.commands || [],
				urls: guidance.urls || [],
				evidenceStub: evidenceStubFor(proofItem, guidance)
			};
		});
}

function evidenceStubFor(proofItem, guidance) {
	return {
		status: 'verified',
		verifiedAt: '<UTC timestamp from date -u +%Y-%m-%dT%H:%M:%SZ>',
		verifiedBy: 'Chris Hogg',
		summary: guidance.summary || proofItem.detail,
		files: [guidance.file || `docs/launch/proof/${proofItem.id}-YYYY-MM-DD.md`],
		...(guidance.urls && guidance.urls.length ? { urls: guidance.urls } : {}),
		...(guidance.commands && guidance.commands.length ? { commands: guidance.commands } : {})
	};
}

function indent(text, spaces) {
	const prefix = ' '.repeat(spaces);
	return text
		.split('\n')
		.map((line) => `${prefix}${line}`)
		.join('\n');
}

function exists(path) {
	return existsSync(join(repoRoot, path));
}

function read(path) {
	const absolute = join(repoRoot, path);
	return existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
}

function countFiles(path, suffix) {
	const absolute = join(repoRoot, path);
	if (!existsSync(absolute)) return 0;
	return readdirSync(absolute).filter((entry) => {
		const entryPath = join(absolute, entry);
		return statSync(entryPath).isFile() && entry.endsWith(suffix);
	}).length;
}

function hasIosDevelopmentTeam(project) {
	const teams = [...project.matchAll(/DEVELOPMENT_TEAM = ([^;]+);/gu)].map((match) => match[1].trim());
	return teams.some((team) => team && team !== '""');
}

function hasAndroidKeystoreEnv() {
	return ['HC_ANDROID_KEYSTORE_FILE', 'HC_ANDROID_KEYSTORE_PASSWORD', 'HC_ANDROID_KEY_ALIAS', 'HC_ANDROID_KEY_PASSWORD'].every((key) => Boolean(process.env[key]));
}

function unique(values) {
	return [...new Set(values)];
}

function hasFlag(argv, name) {
	return argv.includes(name);
}

function hasEvidenceFlag(argv) {
	return argv.includes('--evidence') || argv.some((arg) => arg.startsWith('--evidence='));
}

function readFlag(argv, name) {
	const eq = argv.find((arg) => arg.startsWith(`${name}=`));
	if (eq) return eq.slice(name.length + 1);
	const index = argv.indexOf(name);
	if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith('--')) return argv[index + 1];
	return null;
}

function unknownFlags(argv, validNames) {
	const unknown = [];
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg.startsWith('--') && arg !== '-h') {
			unknown.push(arg);
			continue;
		}
		const name = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
		if (!validNames.has(name)) {
			unknown.push(arg);
			continue;
		}
		if (name === '--evidence' && !arg.includes('=')) {
			index += 1;
		}
	}
	return unknown;
}

function loadEvidence(path) {
	if (!existsSync(path)) {
		return { path, loaded: false, items: {}, warnings: [] };
	}
	try {
		const parsed = JSON.parse(readFileSync(path, 'utf8'));
		const items = parsed && typeof parsed === 'object' && parsed.items && typeof parsed.items === 'object' ? parsed.items : {};
		const warnings = [];
		if (!parsed || typeof parsed !== 'object') warnings.push('evidence file is not a JSON object');
		if (!parsed.schemaVersion) warnings.push('schemaVersion is missing');
		if (!parsed.items || typeof parsed.items !== 'object') warnings.push('items object is missing');
		return { path, loaded: true, items, warnings };
	} catch (error) {
		return { path, loaded: true, items: {}, warnings: [`could not parse evidence JSON: ${error.message}`] };
	}
}

function evidenceOverride(id) {
	const record = evidence.items[id];
	if (!record) return null;
	if (record.status === 'pending') return null;
	if (record.status === 'blocked') {
		return { status: 'blocker', detail: record.summary || `Evidence ledger marks ${id} blocked.` };
	}
	if (record.status !== 'verified') {
		return { status: 'blocker', detail: `Evidence ledger item ${id} has unsupported status "${record.status}". Use pending, verified, or blocked.` };
	}

	const problems = [];
	if (!record.verifiedAt) problems.push('verifiedAt is missing');
	if (!record.verifiedBy) problems.push('verifiedBy is missing');
	const references = [
		...(Array.isArray(record.files) ? record.files : []),
		...(Array.isArray(record.urls) ? record.urls : []),
		...(Array.isArray(record.commands) ? record.commands : [])
	];
	if (references.length === 0) problems.push('at least one file, URL, or command reference is required');

	const missingFiles = (Array.isArray(record.files) ? record.files : []).filter((file) => !existsEvidenceFile(file));
	for (const file of missingFiles) problems.push(`referenced file not found: ${file}`);

	if (problems.length) {
		return { status: 'blocker', detail: `Evidence ledger item ${id} is invalid: ${problems.join('; ')}.` };
	}

	const summary = record.summary || 'manual proof recorded';
	return { status: 'pass', detail: `Evidence verified ${record.verifiedAt} by ${record.verifiedBy}: ${summary}` };
}

function existsEvidenceFile(file) {
	const absolute = isAbsolute(file) ? file : join(repoRoot, file);
	return existsSync(absolute);
}

function relativePath(path) {
	const repoRelative = relative(repoRoot, path);
	return repoRelative.startsWith('..') ? path : repoRelative;
}
