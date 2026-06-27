import { execFile } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const DEFAULT_XCODE_PROJECT = 'mobile/ios/App/App.xcodeproj/project.pbxproj';
const DEFAULT_RELEASE_EVIDENCE = 'docs/launch/release-evidence.json';
const DEFAULT_IOS_PROOF_DIR = 'docs/launch/proof';

const cli = parseCliArgs(process.argv.slice(2));
const status = await loadStatus(cli);
const iosBuild = await readIosBuildSettings(resolveInputPath(cli.xcodeProject ?? DEFAULT_XCODE_PROJECT));
const releaseEvidence = await readOptionalJson(resolveInputPath(cli.releaseEvidence ?? DEFAULT_RELEASE_EVIDENCE));
const latestIosProof = await findLatestIosTestFlightProof(resolveInputPath(cli.iosProofDir ?? DEFAULT_IOS_PROOF_DIR));
const handoff = createDadHandoffMarkdown({
	status,
	iosBuild,
	releaseEvidence,
	latestIosProof,
	generatedAt: new Date().toISOString()
});

if (cli.out) {
	const outPath = resolveInputPath(cli.out);
	await writeFile(outPath, handoff);
	console.log(`Scout local AI Dad handoff written: ${relative(REPO_ROOT, outPath)}`);
} else {
	console.log(handoff);
}

async function loadStatus(args) {
	const statusArgs = ['scripts/status-scout-local-ai.mjs', '--json'];
	if (args.suite) statusArgs.push('--suite', String(args.suite));
	if (args.mobileSuite) statusArgs.push('--mobile-suite', String(args.mobileSuite));
	if (args.runsDir) statusArgs.push('--runs-dir', String(args.runsDir));
	if (args.deviceRunsDir) statusArgs.push('--device-runs-dir', String(args.deviceRunsDir));
	if (args.reviewsDir) statusArgs.push('--reviews-dir', String(args.reviewsDir));
	if (args.xcodeProject) statusArgs.push('--xcode-project', String(args.xcodeProject));
	if (args.releaseEvidence) statusArgs.push('--release-evidence', String(args.releaseEvidence));
	const result = await execFileAsync(process.execPath, statusArgs, {
		cwd: REPO_ROOT,
		maxBuffer: 1024 * 1024 * 4
	});
	return JSON.parse(result.stdout);
}

async function readIosBuildSettings(path) {
	const text = await readFile(path, 'utf8');
	return {
		projectPath: relative(REPO_ROOT, path),
		marketingVersion: cleanBuildSetting(uniqueBuildSetting(text, 'MARKETING_VERSION')) ?? '<missing>',
		buildNumber: cleanBuildSetting(uniqueBuildSetting(text, 'CURRENT_PROJECT_VERSION')) ?? '<missing>',
		teamId: cleanBuildSetting(uniqueBuildSetting(text, 'DEVELOPMENT_TEAM')) ?? '<missing>',
		releaseProfile: cleanBuildSetting(uniqueBuildSetting(text, 'PROVISIONING_PROFILE_SPECIFIER')) ?? '<missing>'
	};
}

function uniqueBuildSetting(text, name) {
	const matches = [...text.matchAll(new RegExp(`${name}\\s*=\\s*([^;]+);`, 'gu'))]
		.map((match) => match[1].trim())
		.filter(Boolean);
	const unique = [...new Set(matches)];
	if (unique.length === 1) return unique[0];
	if (unique.length > 1) return unique.join(' / ');
	return null;
}

function cleanBuildSetting(value) {
	if (!value) return null;
	return value.replace(/^"|"$/gu, '');
}

async function readOptionalJson(path) {
	try {
		return JSON.parse(await readFile(path, 'utf8'));
	} catch {
		return null;
	}
}

async function findLatestIosTestFlightProof(path) {
	try {
		const files = (await readdir(path))
			.filter((file) => /^ios-testflight-attempt-.*\.md$/u.test(file))
			.sort();
		const file = files.at(-1);
		if (!file) return null;
		const proofPath = resolve(path, file);
		const text = await readFile(proofPath, 'utf8');
		return {
			path: relative(REPO_ROOT, proofPath),
			checkedAt: firstMarkdownValue(text, 'Checked at') ?? '<unknown>',
			status: firstMarkdownValue(text, 'Status') ?? '<unknown>',
			ascApiKeyProvided: firstMarkdownValue(text, 'App Store Connect API key provided') ?? '<unknown>'
		};
	} catch {
		return null;
	}
}

function firstMarkdownValue(text, label) {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
	const match = text.match(new RegExp(`^(?:-\\s*)?${escaped}:\\s*(.+)$`, 'imu'));
	return match?.[1]?.trim() ?? null;
}

function createDadHandoffMarkdown({ status, iosBuild, releaseEvidence, latestIosProof, generatedAt }) {
	const dadTestFlightEvidence = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite');
	const publicLink = dadTestFlightEvidence?.publicLink ?? 'https://testflight.apple.com/join/BagBCrzf';
	const recordedDadBuild = extractRecordedDadBuild(releaseEvidence);
	const nextAction = status.nextAction?.text ?? 'Run npm run status:scout-local-ai and follow the next action.';
	const completedGates = status.gates.filter((gate) => gate.ok).length;
	const totalGates = status.gates.length;
	const targetBuild = `${iosBuild.marketingVersion} (${iosBuild.buildNumber})`;
	const suiteRequiredBuild = status.suite?.finalProof?.requiredApp ?? '<unknown>';
	const lines = [
		'# Dad Scout local AI Eval Lab handoff',
		'',
		`Generated at: ${generatedAt}`,
		'',
		'## Current truth',
		'',
		`- Eval suite: \`${status.suite.suiteId}\` version \`${status.suite.version}\`, ${status.suite.caseCount} cases, hash \`${status.suite.hash}\`.`,
		`- Mobile suite copy matches canonical: ${status.suite.mobileCopyMatches ? 'yes' : 'no'}.`,
		`- Eval gates complete: ${completedGates}/${totalGates}.`,
		`- Suite final-proof app requirement: \`${suiteRequiredBuild}\`.`,
		`- Target iOS build for Dad Eval Lab: \`${targetBuild}\`.`,
		`- Target build meets suite requirement: ${status.testflight?.targetBuildMeetsSuiteRequirement ? 'yes' : 'no'}.`,
		`- Recorded Dad Pilot build: \`${recordedDadBuild}\`.`,
		`- Recorded Dad Pilot build meets suite requirement: ${status.testflight?.recordedDadPilotMeetsSuiteRequirement ? 'yes' : 'no'}.`,
		`- Dad TestFlight link: ${publicLink}`,
		`- iOS Release signing: team \`${iosBuild.teamId}\`, profile \`${iosBuild.releaseProfile}\`.`,
		''
	];

	if (!status.testflight?.targetBuildAvailableForDad) {
		lines.push(
			'> Important: the recorded Dad Pilot build is not ready for this suite. Do not treat the final Eval Lab run as valid until App Store Connect shows Dad Pilot on the target build, or a current full TestFlight/iPhone export proves the target build was installed.',
			''
		);
	}

	lines.push(
		'## Gate checklist',
		''
	);
	for (const gate of status.gates) {
		lines.push(`- ${gate.ok ? '[x]' : '[ ]'} ${gate.label}: ${gate.evidence}`);
	}

	lines.push(
		'',
		'## Upload readiness',
		'',
		`- Xcode Release target: \`${targetBuild}\` from \`${iosBuild.projectPath}\`.`,
		`- Signing team/profile: \`${iosBuild.teamId}\` / \`${iosBuild.releaseProfile}\`.`,
		latestIosProof
			? `- Latest native upload proof: \`${latestIosProof.path}\` (${latestIosProof.status}, checked ${latestIosProof.checkedAt}).`
			: '- Latest native upload proof: none found.',
		latestIosProof
			? `- App Store Connect API key in latest proof: ${latestIosProof.ascApiKeyProvided}.`
			: '- App Store Connect API key in latest proof: unknown.',
		'- Upload still requires Chris/account-bound App Store Connect auth: `APP_STORE_CONNECT_API_KEY_PATH`, `APP_STORE_CONNECT_API_KEY_ID`, and `APP_STORE_CONNECT_API_ISSUER_ID`, or matching `--asc-*` flags.',
		'',
		'```sh',
		'npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \\',
		'  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \\',
		'  --asc-key-id T272T83N98 \\',
		'  --asc-issuer-id <issuer-id>',
		'```',
		'',
		'## Phone run steps',
		'',
		'1. Confirm App Store Connect has the target build attached to Dad Pilot and available through the TestFlight link.',
		'2. On the iPhone, open TestFlight and update Hoggcountry.',
		'3. Open Hoggcountry > Settings > Scout Eval Lab.',
		'4. Confirm the Eval Lab status says `TestFlight ready`.',
		'5. Run `Run 3` only as a smoke check if needed; use `Run 100` for real proof.',
		'6. When `Run 100` finishes, tap Share first and send the JSON export back. Use Copy only if Share fails.',
		'7. Keep the phone awake and plugged in during the run; if interrupted, reopen Settings and tap Resume.',
		'',
		'## Import and review',
		'',
		'```sh',
		'npm run intake:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json',
		'npm run apply-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json',
		'npm run review:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json',
		'npm run plan:scout-local-ai-iteration -- --backlog data/scout-local-ai/backlog/<run-id>.backlog.json',
		'```',
		'',
		'## Final proof commands',
		'',
		'```sh',
		'npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json',
		'npm run verify:scout-local-ai-stability-proof -- --pairs data/scout-local-ai/device-runs/<run-a>.json:data/scout-local-ai/reviews/<run-a>.review.json,data/scout-local-ai/device-runs/<run-b>.json:data/scout-local-ai/reviews/<run-b>.review.json',
		'```',
		'',
		'## Next action',
		'',
		nextAction,
		'',
		'## Boundary',
		'',
		'This handoff does not prove Dad readiness by itself. Final readiness still requires a full current-suite TestFlight/iPhone `device-on-device-gemma` export, human review with all 100 answers rated 5/5, strict device proof, and repeated stability proof.'
	);

	return `${lines.join('\n')}\n`;
}

function extractRecordedDadBuild(releaseEvidence) {
	const summary = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite')?.summary ?? '';
	const match = String(summary).match(/build\s+(\d+(?:\.\d+)*)\s+\((\d+)\)/iu);
	if (match) return `${match[1]} (${match[2]})`;
	return '<unknown>';
}

function releaseEvidenceItem(releaseEvidence, key) {
	return releaseEvidence?.items?.[key] ??
		releaseEvidence?.evidence?.[key] ??
		releaseEvidence?.gates?.[key] ??
		releaseEvidence?.[key] ??
		null;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
