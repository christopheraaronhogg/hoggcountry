#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { promisify } from 'node:util';
import { parseCliArgs } from './lib/scout-local-ai-review.mjs';
import { scanScoutLocalAiAnswerQuality } from './scan-scout-local-ai-answer-quality.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const BUNDLE_ID = 'com.hoggcountry.trailassistant';
const WORKSPACE_PATH = resolve(REPO_ROOT, 'mobile/ios/App/App.xcworkspace');
const DERIVED_DATA_PATH = resolve(REPO_ROOT, '.scout-artifacts/ios-sim-gemma/DerivedData');
const APP_PATH = resolve(DERIVED_DATA_PATH, 'Build/Products/Debug-iphonesimulator/App.app');
const RESULT_KEY = 'hoggcountry:scout-gemma-sim-eval-result:v1';
const TRIGGER_KEY = 'hoggcountry:scout-gemma-sim-eval-probe:v1';
const DIAGNOSTIC_KEY = 'hoggcountry:scout-gemma-sim-eval-diagnostic:v1';
const CAP_RESULT_KEY = `CapacitorStorage.${RESULT_KEY}`;
const CAP_TRIGGER_KEY = `CapacitorStorage.${TRIGGER_KEY}`;
const CAP_DIAGNOSTIC_KEY = `CapacitorStorage.${DIAGNOSTIC_KEY}`;

const cli = parseCliArgs(process.argv.slice(2));
if (cli.help) {
	printUsage();
	process.exit(0);
}
const limit = normalizeLimit(cli.limit ?? cli.cases ?? (cli.full ? '100' : '3'));
const timeoutMs = positiveInt(cli.timeoutMs, timeoutForLimit(limit));
const pollMs = positiveInt(cli.pollMs, 5000);
const outputDir = resolveInputPath(cli.outputDir ?? '.scout-artifacts/scout-local-ai-runs');
const simulator = await selectSimulator(cli.simulator ?? process.env.SCOUT_IOS_SIMULATOR);

console.log(`Scout iOS Simulator Gemma eval`);
console.log(`- Simulator: ${simulator.name} (${simulator.udid})`);
console.log(`- Limit: ${limit ?? 'all'}`);
console.log(`- Timeout: ${timeoutMs}ms`);

await bootSimulator(simulator.udid);
if (!cli.skipSync && !cli.noSync) {
	await run('npm', ['--prefix', 'mobile', 'run', 'cap:sync:ios'], {
		env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
	});
}
if (!cli.skipBuild && !cli.noBuild) {
	await mkdir(DERIVED_DATA_PATH, { recursive: true });
	await run('xcodebuild', [
		...(cli.verbose ? [] : ['-quiet']),
		'-workspace',
		WORKSPACE_PATH,
		'-scheme',
		'App',
		'-configuration',
		'Debug',
		'-sdk',
		'iphonesimulator',
		'-destination',
		`id=${simulator.udid}`,
		'-derivedDataPath',
		DERIVED_DATA_PATH,
		'CODE_SIGNING_ALLOWED=NO',
		'build'
	]);
}
if (!existsSync(APP_PATH)) {
	throw new Error(`Built app not found at ${APP_PATH}. Run without --skip-build or check the Xcode build output.`);
}

await run('xcrun', ['simctl', 'install', simulator.udid, APP_PATH]);
if (!cli.preserveWebCache) await clearWebViewCache(simulator.udid);
await terminateApp(simulator.udid);
await writePreference(simulator.udid, CAP_RESULT_KEY, '__pending__');
await writePreference(simulator.udid, CAP_DIAGNOSTIC_KEY, '__pending__');
await writePreference(simulator.udid, CAP_TRIGGER_KEY, triggerForLimit(limit));
await flushPreferences(simulator.udid);
await run('xcrun', [
	'simctl',
	'launch',
	simulator.udid,
	BUNDLE_ID,
	'--scout-gemma-sim-probe',
	`--scout-gemma-sim-eval-limit=${triggerForLimit(limit)}`
]);

const runJson = await waitForRun(simulator.udid, timeoutMs, pollMs);
assertExpectedCaseCount(runJson, limit);
await mkdir(outputDir, { recursive: true });
const outputPath = resolve(outputDir, `ios-sim-gemma-${runJson.runId}.json`);
const scanOutputPath = resolve(outputDir, `ios-sim-gemma-${runJson.runId}.scan.json`);
const answerQualityScan = scanScoutLocalAiAnswerQuality(runJson);
await writeFile(outputPath, `${JSON.stringify(runJson, null, 2)}\n`);
await writeFile(scanOutputPath, `${JSON.stringify(answerQualityScan, null, 2)}\n`);

console.log(`\nSaved simulator Gemma eval: ${relativePath(outputPath)}`);
console.log(`Saved answer-quality scan: ${relativePath(scanOutputPath)}`);
console.log(`- Run: ${runJson.runId}`);
console.log(`- Lane: ${runJson.evidenceLane}`);
console.log(`- Cases: ${runJson.caseCount}/${runJson.totalSuiteCases}`);
console.log(`- Required-tool complete: ${runJson.summary?.toolExpectationComplete ?? 'unknown'}/${runJson.caseCount}`);
console.log(`- Source-evidence complete: ${runJson.summary?.sourceEvidenceComplete ?? 'unknown'}/${runJson.caseCount}`);
console.log(`- Provider errors: ${providerErrorCount(runJson)}`);
console.log(`- Answer-quality flags: ${answerQualityScan.flaggedCount} flagged, ${answerQualityScan.errorCount} errors, ${answerQualityScan.warningCount} warnings`);
if (answerQualityScan.flagged.length) {
	console.log(`- Top answer-quality cases: ${formatTopAnswerQualityCases(answerQualityScan.flagged)}`);
}

if (!cli.noInspect) {
	await run('node', [
		resolve(REPO_ROOT, 'scripts/inspect-scout-local-ai-device-run.mjs'),
		'--run',
		outputPath
	]);
}
console.log(`Simulator diagnostic review packet: npm run intake:scout-local-ai-device-run -- --run ${relativePath(outputPath)} --allow-partial`);
console.log(`Answer-quality scan command: npm run scan:scout-local-ai-answers -- --run ${relativePath(outputPath)}`);
console.log('Boundary: simulator Gemma is the main local iteration lane; final Dad proof still requires TestFlight iPhone Run 100.');

function normalizeLimit(value) {
	const text = String(value ?? '').trim().toLowerCase();
	if (!text || text === 'all' || text === 'runall') return undefined;
	const runMatch = /^run(\d+)$/u.exec(text);
	const limitMatch = /^limit:(\d+)$/u.exec(text);
	const numericText = runMatch?.[1] ?? limitMatch?.[1] ?? text;
	const parsed = Number.parseInt(numericText, 10);
	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
		throw new Error(`--limit must be 1-100 or all, got ${value}`);
	}
	return parsed;
}

function triggerForLimit(value) {
	if (value === undefined) return 'all';
	return String(value);
}

function timeoutForLimit(value) {
	if (value === undefined || value >= 100) return 60 * 60 * 1000;
	if (value >= 25) return 25 * 60 * 1000;
	if (value >= 10) return 15 * 60 * 1000;
	return 5 * 60 * 1000;
}

function positiveInt(value, fallback) {
	if (value === undefined || value === null || value === true) return fallback;
	const parsed = Number.parseInt(String(value), 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function selectSimulator(selector) {
	const { stdout } = await execFileAsync('xcrun', ['simctl', 'list', 'devices', 'available', '--json']);
	const parsed = JSON.parse(stdout);
	const devices = Object.values(parsed.devices ?? {})
		.flat()
		.filter((device) => device?.isAvailable && /iphone/iu.test(device.name));
	if (!devices.length) {
		throw new Error('No available iPhone simulators found.');
	}
	if (selector) {
		const wanted = String(selector).toLowerCase();
		const matched = devices.find(
			(device) => device.udid.toLowerCase() === wanted || device.name.toLowerCase() === wanted || device.name.toLowerCase().includes(wanted)
		);
		if (!matched) throw new Error(`No available iPhone simulator matched "${selector}".`);
		return matched;
	}
	return devices.find((device) => device.name === 'iPhone 16e')
		?? devices.find((device) => device.state === 'Booted')
		?? devices[0];
}

async function bootSimulator(udid) {
	try {
		await execFileAsync('xcrun', ['simctl', 'boot', udid]);
	} catch (error) {
		if (!String(error.stderr ?? error.message).includes('Unable to boot device in current state: Booted')) {
			throw error;
		}
	}
	await run('xcrun', ['simctl', 'bootstatus', udid, '-b']);
}

async function clearWebViewCache(udid) {
	const dataDir = (await execFileAsync('xcrun', ['simctl', 'get_app_container', udid, BUNDLE_ID, 'data'])).stdout.trim();
	await Promise.all([
		rm(resolve(dataDir, 'Library/Caches'), { recursive: true, force: true }),
		rm(resolve(dataDir, 'Library/WebKit'), { recursive: true, force: true })
	]);
}

function providerErrorCount(runJson) {
	return (runJson.results ?? []).filter((result) => Boolean(result?.error)).length;
}

function formatTopAnswerQualityCases(flagged) {
	return flagged.slice(0, 8)
		.map((item) => {
			const checks = (item.checks ?? []).map((check) => check.id).join(',') || 'unknown';
			return `${item.caseId}:${checks}`;
		})
		.join('; ');
}

function assertExpectedCaseCount(runJson, value) {
	const expected = value ?? 100;
	if (runJson.caseCount === expected) return;
	throw new Error(
		`Simulator eval returned ${runJson.caseCount} case(s), but ${expected} were requested. ` +
		`Refusing to save misleading evidence. Run id: ${runJson.runId ?? '<missing>'}.`
	);
}

async function writePreference(udid, key, value) {
	const plistPath = await appPreferencesPlistPath(udid);
	await mkdir(dirname(plistPath), { recursive: true });
	const preferences = await readPreferencesPlist(plistPath);
	preferences[key] = value;
	const tempPath = resolve(DERIVED_DATA_PATH, `preferences-${process.pid}-${Date.now()}.json`);
	await mkdir(dirname(tempPath), { recursive: true });
	await writeFile(tempPath, `${JSON.stringify(preferences)}\n`);
	try {
		await execFileAsync('plutil', ['-convert', 'binary1', '-o', plistPath, tempPath], {
			maxBuffer: 256 * 1024 * 1024
		});
	} finally {
		await rm(tempPath, { force: true });
	}
}

async function flushPreferences(udid) {
	try {
		await execFileAsync('xcrun', ['simctl', 'spawn', udid, 'killall', 'cfprefsd']);
	} catch {
		// cfprefsd is restarted by the simulator as needed.
	}
}

async function terminateApp(udid) {
	try {
		await execFileAsync('xcrun', ['simctl', 'terminate', udid, BUNDLE_ID]);
	} catch {
		// The app may not be running yet.
	}
}

async function waitForRun(udid, timeout, interval) {
	const started = Date.now();
	let lastStatusAt = 0;
	let lastDiagnostic = '';
	while (Date.now() - started < timeout) {
		const result = await readResultPreference(udid);
		if (result) {
			if (result.ok === false) {
				throw new Error(`Simulator eval failed inside the app: ${result.error ?? 'unknown error'}`);
			}
			if (typeof result.runId === 'string' && Array.isArray(result.results)) return result;
		}
		if (Date.now() - lastStatusAt > 30000) {
			console.log(`- Waiting for simulator eval result (${Math.round((Date.now() - started) / 1000)}s elapsed)...`);
			const diagnostic = await readDiagnosticPreference(udid);
			if (diagnostic) {
				const summary = summarizeDiagnostic(diagnostic);
				if (summary && summary !== lastDiagnostic) {
					console.log(`- App diagnostic: ${summary}`);
					lastDiagnostic = summary;
				}
			}
			lastStatusAt = Date.now();
		}
		await sleep(interval);
	}
	const diagnostic = await readDiagnosticPreference(udid);
	const diagnosticSummary = summarizeDiagnostic(diagnostic);
	throw new Error(
		`Timed out after ${timeout}ms waiting for simulator eval result.` +
		(diagnosticSummary ? ` Last app diagnostic: ${diagnosticSummary}` : ' No app diagnostic was written.')
	);
}

async function readResultPreference(udid) {
	return readJsonPreference(udid, CAP_RESULT_KEY);
}

async function readDiagnosticPreference(udid) {
	return readJsonPreference(udid, CAP_DIAGNOSTIC_KEY);
}

async function readJsonPreference(udid, key) {
	try {
		const raw = await readPreference(udid, key);
		if (typeof raw !== 'string' || !raw.trim()) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

async function readPreference(udid, key) {
	const plistPath = await appPreferencesPlistPath(udid);
	const preferences = await readPreferencesPlist(plistPath);
	const value = preferences[key];
	return typeof value === 'string' ? value : '';
}

async function appPreferencesPlistPath(udid) {
	const dataDir = (await execFileAsync(
		'xcrun',
		['simctl', 'get_app_container', udid, BUNDLE_ID, 'data'],
		{ maxBuffer: 1024 * 1024 }
	)).stdout.trim();
	return resolve(dataDir, 'Library/Preferences', `${BUNDLE_ID}.plist`);
}

async function readPreferencesPlist(plistPath) {
	if (!existsSync(plistPath)) return {};
	const raw = (await execFileAsync(
		'plutil',
		['-convert', 'json', '-o', '-', plistPath],
		{ maxBuffer: 256 * 1024 * 1024 }
	)).stdout.trim();
	if (!raw) return {};
	return JSON.parse(raw);
}

function summarizeDiagnostic(diagnostic) {
	if (!diagnostic || typeof diagnostic !== 'object') return '';
	return JSON.stringify({
		phase: diagnostic.phase,
		native: diagnostic.native,
		triggerValue: diagnostic.triggerValue ?? null,
		parsedLimit: diagnostic.parsedLimit ?? null,
		href: diagnostic.href ?? null
	});
}

async function run(command, args, options = {}) {
	console.log(`$ ${[command, ...args].join(' ')}`);
	await new Promise((resolvePromise, reject) => {
		const child = spawn(command, args, {
			cwd: REPO_ROOT,
			stdio: 'inherit',
			env: options.env ?? process.env
		});
		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (code === 0) {
				resolvePromise();
				return;
			}
			reject(new Error(`${command} exited with ${code ?? signal}`));
		});
	});
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function relativePath(path) {
	return path.startsWith(REPO_ROOT) ? path.slice(REPO_ROOT.length + 1) : path;
}

function sleep(ms) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function printUsage() {
	console.log(`Usage: npm run eval:scout-local-ai:ios-sim-gemma -- [options]

Runs Scout's local-AI eval inside the real iOS Simulator app with the native Gemma bridge.

Options:
  --limit <1-100|all>       Number of canonical cases to run. Default: 3.
  --full                    Shortcut for --limit 100.
  --simulator <name|udid>   iPhone simulator to use. Default: iPhone 16e, then any booted iPhone.
  --timeout-ms <ms>         Override eval wait timeout.
  --poll-ms <ms>            Override result polling interval. Default: 5000.
  --output-dir <path>       Output directory. Default: .scout-artifacts/scout-local-ai-runs.
  --skip-sync               Skip npm --prefix mobile run cap:sync:ios.
  --skip-build              Skip xcodebuild and use the existing derived-data app.
  --no-inspect              Do not run the read-only device-run inspector.
  --preserve-web-cache      Do not clear WebView cache/service-worker data before launch.

The runner saves both the raw simulator export and a sibling .scan.json
answer-quality scan. The scan is a triage aid only; human 1-5 review and final
TestFlight/iPhone proof remain separate.
`);
}
