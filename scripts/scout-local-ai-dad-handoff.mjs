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
const targetBuild = `${iosBuild.marketingVersion} (${iosBuild.buildNumber})`;
const latestDadBuildProof = await findLatestDadBuildProof(
	resolveInputPath(cli.iosProofDir ?? DEFAULT_IOS_PROOF_DIR),
	targetBuild
);
const latestLocalTargetPrepProof = await findLatestLocalTargetPrepProof(
	resolveInputPath(cli.iosProofDir ?? DEFAULT_IOS_PROOF_DIR),
	targetBuild
);
const handoffInput = {
	status,
	iosBuild,
	releaseEvidence,
	latestIosProof,
	latestDadBuildProof,
	latestLocalTargetPrepProof,
	generatedAt: new Date().toISOString()
};
const handoff = cli.dadMessage
	? createDadMessageText(handoffInput)
	: createDadHandoffMarkdown(handoffInput);

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
	if (args.inboxDir) statusArgs.push('--inbox-dir', String(args.inboxDir));
	if (args.reviewsDir) statusArgs.push('--reviews-dir', String(args.reviewsDir));
	if (args.xcodeProject) statusArgs.push('--xcode-project', String(args.xcodeProject));
	if (args.releaseEvidence) statusArgs.push('--release-evidence', String(args.releaseEvidence));
	if (args.iosProofDir) statusArgs.push('--ios-proof-dir', String(args.iosProofDir));
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

async function findLatestDadBuildProof(path, targetBuild) {
	try {
		const proofs = [];
		const files = (await readdir(path))
			.filter((file) => /^ios-testflight-build-.*\.md$/u.test(file))
			.sort();
		for (const file of files) {
			const proofPath = resolve(path, file);
			const text = await readFile(proofPath, 'utf8');
			const gates = testFlightBuildGates(text);
			const targetBuildValue = cleanMarkdownValue(firstMarkdownValue(text, 'Target build'));
			if (!targetBuildValue) continue;
			proofs.push({
				path: relative(REPO_ROOT, proofPath),
				checkedAt: cleanMarkdownValue(firstMarkdownValue(text, 'Checked at')) ?? '<unknown>',
				targetBuild: targetBuildValue,
				processing: cleanMarkdownValue(firstMarkdownValue(text, 'Processing')) ?? '<unknown>',
				externalState: cleanMarkdownValue(firstMarkdownValue(text, 'External state')) ?? '<unknown>',
				publicLink: cleanMarkdownValue(firstMarkdownValue(text, 'Public link')) ?? '<unknown>',
				gates,
				checkedGateCount: gates.filter((gate) => gate.checked).length,
				totalGateCount: gates.length,
				targetReadyForDad: gates.some((gate) => gate.id === 'targetReadyForDad' && gate.checked)
			});
		}
		const sortedProofs = proofs.sort(compareDadBuildProofs);
		return sortedProofs.filter((proof) => proof.targetBuild === targetBuild).at(-1) ?? sortedProofs.at(-1) ?? null;
	} catch {
		return null;
	}
}

async function findLatestLocalTargetPrepProof(path, targetBuild) {
	try {
		const proofs = [];
		const files = (await readdir(path))
			.filter((file) => /^ios-testflight-build-.*-prep-.*\.md$/u.test(file))
			.sort();
		for (const file of files) {
			const proofPath = resolve(path, file);
			const text = await readFile(proofPath, 'utf8');
			const localTarget = cleanMarkdownValue(firstMarkdownValue(text, 'Local iOS target'));
			if (!localTarget) continue;
			proofs.push({
				path: relative(REPO_ROOT, proofPath),
				checkedAt: cleanMarkdownValue(firstMarkdownValue(text, 'Checked at')) ?? '<unknown>',
				localTarget,
				isTargetBuild: localTarget === targetBuild
			});
		}
		const sortedProofs = proofs.sort(compareLocalTargetPrepProofs);
		return sortedProofs.filter((proof) => proof.localTarget === targetBuild).at(-1) ?? sortedProofs.at(-1) ?? null;
	} catch {
		return null;
	}
}

function compareDadBuildProofs(a, b) {
	const timeA = Date.parse(a.checkedAt);
	const timeB = Date.parse(b.checkedAt);
	if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) return timeA - timeB;
	if (Number.isFinite(timeA) !== Number.isFinite(timeB)) return Number.isFinite(timeA) ? 1 : -1;
	return buildNumberFromLabel(a.targetBuild) - buildNumberFromLabel(b.targetBuild);
}

function compareLocalTargetPrepProofs(a, b) {
	const timeA = Date.parse(a.checkedAt);
	const timeB = Date.parse(b.checkedAt);
	if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) return timeA - timeB;
	if (Number.isFinite(timeA) !== Number.isFinite(timeB)) return Number.isFinite(timeA) ? 1 : -1;
	return buildNumberFromLabel(a.localTarget) - buildNumberFromLabel(b.localTarget);
}

function buildNumberFromLabel(label) {
	const match = String(label ?? '').match(/\((\d+)\)$/u);
	return match ? Number(match[1]) : 0;
}

function testFlightBuildGates(text) {
	return [...text.matchAll(/^- \[(x| )\]\s+([A-Za-z0-9_-]+)\s*$/gmu)]
		.map((match) => ({
			id: match[2],
			checked: match[1] === 'x'
		}));
}

function firstMarkdownValue(text, label) {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
	const match = text.match(new RegExp(`^(?:-\\s*)?${escaped}:\\s*(.+)$`, 'imu'));
	return match?.[1]?.trim() ?? null;
}

function cleanMarkdownValue(value) {
	if (!value) return null;
	return value.trim().replace(/^`|`$/gu, '');
}

function createDadHandoffMarkdown({ status, iosBuild, releaseEvidence, latestIosProof, latestDadBuildProof, latestLocalTargetPrepProof, generatedAt }) {
	const dadTestFlightEvidence = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite');
	const publicLink = dadTestFlightEvidence?.publicLink ?? 'https://testflight.apple.com/join/BagBCrzf';
	const recordedDadBuild = extractRecordedDadBuild(releaseEvidence);
	const nextAction = status.nextAction?.text ?? 'Run npm run status:scout-local-ai and follow the next action.';
	const completedGates = status.gates.filter((gate) => gate.ok).length;
	const totalGates = status.gates.length;
	const suiteRequiredBuild = status.suite?.finalProof?.requiredApp ?? '<unknown>';
	const dadProofMatchesTarget = latestDadBuildProof?.targetBuild === targetBuild;
	const dadProofLabel = dadProofMatchesTarget ? 'Dad target-build proof' : 'Latest Dad Pilot proof';
	const dadGateLabel = dadProofMatchesTarget ? 'Dad target-build gates' : 'Latest Dad Pilot gates';
	const sourceBoundary = nativeSourceBoundary(status);
	const phoneBuildDecision = createPhoneBuildDecision({
		status,
		recordedDadBuild,
		targetBuild,
		suiteRequiredBuild
	});
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
		latestDadBuildProof
			? `- ${dadProofLabel}: \`${latestDadBuildProof.path}\` (${latestDadBuildProof.targetBuild}, ${latestDadBuildProof.externalState}, checked ${latestDadBuildProof.checkedAt}).`
			: '- Dad Pilot proof: none found.',
		latestDadBuildProof
			? `- ${dadGateLabel}: ${latestDadBuildProof.checkedGateCount}/${latestDadBuildProof.totalGateCount} checked; targetReadyForDad ${latestDadBuildProof.targetReadyForDad ? 'yes' : 'no'}.`
			: '- Dad Pilot gates: unknown.',
		latestLocalTargetPrepProof
			? `- Latest local target prep: \`${latestLocalTargetPrepProof.path}\` (${latestLocalTargetPrepProof.localTarget}, checked ${latestLocalTargetPrepProof.checkedAt}; not App Store Connect proof).`
			: '- Latest local target prep: none found.',
		`- Newer Xcode target pending App Store Connect: ${status.testflight?.targetBuildReadyForDad ? 'no' : 'yes'}.`,
		`- Current checkout SHA: \`${status.nativeSource?.currentRepoSha ?? '<unknown>'}\`.`,
		status.nativeSource?.latestNativeUploadProof
			? `- Latest native upload source: \`${status.nativeSource.latestNativeUploadProof.path}\` (repo SHA \`${status.nativeSource.latestNativeUploadSha ?? '<unknown>'}\`${status.nativeSource.latestNativeUploadProof.repoShaSource ? ` from \`${status.nativeSource.latestNativeUploadProof.repoShaSource}\`` : ''}).`
			: '- Latest native upload source: none found.',
		`- Current checkout newer than latest native upload: ${status.nativeSource?.sourceNewerThanLatestNativeUpload ? 'yes' : 'no'}.`,
		`- Current native app source newer than latest native upload: ${status.nativeSource?.nativeAppSourceNewerThanLatestNativeUpload ? 'yes' : 'no'}.`,
		`- Imported full device runs: ${status.runs?.currentFullDeviceRuns?.length ?? 0}.`,
		`- Imported partial device runs: ${status.runs?.currentPartialDeviceRuns?.length ?? 0}.`,
		`- Imported suite-compatible full device runs: ${status.testflight?.currentSuiteCompatibleDeviceRunCount ?? 0}.`,
		`- Imported suite-compatible partial device runs: ${status.testflight?.currentSuiteCompatiblePartialDeviceRunCount ?? 0}.`,
		`- Inbox candidate exports: ${status.inbox?.candidateCount ?? 0}.`,
		`- Inbox final-ready/partial/blocked: ${status.inbox?.readyForFinalIntakeCount ?? 0}/${status.inbox?.partialDiagnosticCount ?? 0}/${status.inbox?.blockedCandidateCount ?? 0}.`,
		status.inbox?.latestCandidate
			? `- Latest inbox export: \`${status.inbox.latestCandidate.path}\` (${status.inbox.latestCandidate.runId}, ${status.inbox.latestCandidate.caseCount} cases, ${status.inbox.latestCandidate.inspectionStatus ?? 'not inspected'}).`
			: `- Latest inbox export: none in \`${status.inbox?.path ?? 'data/scout-local-ai/inbox'}\`.`,
		...(status.inbox?.latestReadyCandidate && status.inbox.latestReadyCandidate.path !== status.inbox.latestCandidate?.path
			? [`- Latest final-ready inbox export: \`${status.inbox.latestReadyCandidate.path}\` (${status.inbox.latestReadyCandidate.runId}, ${status.inbox.latestReadyCandidate.caseCount} cases, ${status.inbox.latestReadyCandidate.inspectionStatus}).`]
			: []),
		`- Dad TestFlight link: ${publicLink}`,
		`- iOS Release signing: team \`${iosBuild.teamId}\`, profile \`${iosBuild.releaseProfile}\`.`,
		''
	];

	lines.push(
		'## Phone build path',
		'',
		`- Use now: ${phoneBuildDecision.useNow}.`,
		`- Latest-code target: ${phoneBuildDecision.latestTarget}.`,
		`- Latest-source proof: ${sourceBoundary}.`,
		`- Do not count as final proof until: ${phoneBuildDecision.finalProofBoundary}.`,
		''
	);

	if (!status.testflight?.targetBuildAvailableForDad) {
		lines.push(
			'> Important: the recorded Dad Pilot build is not ready for this suite. Do not treat the final Eval Lab run as valid until App Store Connect shows Dad Pilot on the target build, or a current full TestFlight/iPhone export proves the target build was installed.',
			''
		);
	} else if (!status.testflight?.targetBuildReadyForDad && status.testflight?.recordedDadPilotMeetsSuiteRequirement) {
		lines.push(
			'> Note: Dad can run the suite-compatible TestFlight build already in Dad Pilot, but the newer Xcode target still needs upload/attachment before it is the latest phone build.',
			''
		);
	} else if (!status.testflight?.targetBuildReadyForDad && (status.testflight?.currentSuiteCompatibleDeviceRunCount ?? 0) > 0) {
		lines.push(
			'> Note: an imported TestFlight/iPhone run proves a suite-compatible build was installed, but the newer Xcode target still needs App Store Connect upload/attachment before it is the latest Dad Pilot build.',
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
		status.nativeSource?.latestNativeUploadSha
			? `- Latest native upload repo SHA: \`${status.nativeSource.latestNativeUploadSha}\`${status.nativeSource.latestNativeUploadProof?.repoShaSource ? ` from \`${status.nativeSource.latestNativeUploadProof.repoShaSource}\`` : ''}.`
			: '- Latest native upload repo SHA: unknown.',
		`- Current source newer than latest native upload: ${status.nativeSource?.sourceNewerThanLatestNativeUpload ? 'yes' : 'no'}.`,
		`- Current native app source newer than latest native upload: ${status.nativeSource?.nativeAppSourceNewerThanLatestNativeUpload ? 'yes' : 'no'}.`,
		...(status.nativeSource?.nativeAppSourceNewerThanLatestNativeUpload
			? [status.testflight?.targetBuildReadyForDad
				? `- Latest-source upload note: bump the iOS build number above \`${iosBuild.buildNumber}\` before uploading this checkout; App Store Connect will not accept reusing build \`${iosBuild.buildNumber}\`.`
				: `- Latest-source upload note: upload target build \`${iosBuild.marketingVersion} (${iosBuild.buildNumber})\`; bump again only if App Store Connect already has build \`${iosBuild.buildNumber}\`.`]
			: []),
		latestIosProof
			? `- App Store Connect API key in latest proof: ${latestIosProof.ascApiKeyProvided}.`
			: '- App Store Connect API key in latest proof: unknown.',
		'- Future uploads require Chris/account-bound App Store Connect auth: `APP_STORE_CONNECT_API_KEY_PATH`, `APP_STORE_CONNECT_API_KEY_ID`, and `APP_STORE_CONNECT_API_ISSUER_ID`, or matching `--asc-*` flags.',
		'',
		'```sh',
		'npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \\',
		'  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \\',
		'  --asc-key-id T272T83N98 \\',
		'  --asc-issuer-id <issuer-id>',
		'```',
		'',
		'After upload/processing, refresh Dad Pilot proof from App Store Connect:',
		'',
		'```sh',
		`npm run refresh:testflight-dad-pilot -- --build ${iosBuild.buildNumber} --app-version ${iosBuild.marketingVersion}`,
		`npm run refresh:testflight-dad-pilot -- --build ${iosBuild.buildNumber} --app-version ${iosBuild.marketingVersion} --attach --submit-review --remove-previous --update-release-evidence`,
		'```',
		'',
		'## Phone run steps',
		'',
		`1. Confirm the phone build path above. For the next suite run, ${phoneBuildDecision.useNow}.`,
		'2. On the iPhone, open TestFlight and update Hoggcountry.',
		'3. Open Hoggcountry > Settings > Scout Eval Lab.',
		'4. Confirm the Eval Lab status says `TestFlight ready`.',
		'5. Run `Run 3` only as a smoke check if needed; use `Run 100` for real proof.',
		'6. When `Run 100` finishes, tap Share first and send the JSON export back. Use Copy only if Share fails.',
		'7. Keep the phone awake and plugged in during the run; if interrupted, reopen Settings and tap Resume.',
		'',
		'## Valid export checklist',
		'',
		'Before review starts, the shared JSON should satisfy all of these import-proof checks:',
		'',
		`- Suite fields: \`suiteId=${status.suite.suiteId}\`, \`suiteVersion=${status.suite.version}\`, \`suiteHash=${status.suite.hash}\`.`,
		`- Result count: \`${status.suite.caseCount}/100\` completed results from \`Run 100\`, not \`Run 3\` or an interrupted partial run.`,
		'- Evidence lane: `device-on-device-gemma` with `answerOrigin=device-on-device-gemma` answers.',
		`- Native context: TestFlight iPhone install, app build satisfying \`${suiteRequiredBuild}\`; current Dad Pilot proof records \`${recordedDadBuild}\`, while latest Xcode target is \`${targetBuild}\`.`,
		'- Import status: `ready-for-final-intake` from the inspector, then `prepared-for-final-review` from the prepare command.',
		'- Review triage: any provider error, missing required tool, or missing source evidence starts in the review-first queue before normal answer-quality ratings.',
		'',
		'If any checklist item fails, do not rate it as final Dad proof. Resume or rerun `Run 100`, then share a fresh JSON export.',
		'',
		'## Import and review',
		'',
		'Safe one-command path:',
		'',
		'```sh',
		'npm run prepare-review:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json',
		'```',
		'',
		'If the shared filename is hard to identify but it is in Downloads:',
		'',
		'```sh',
		'npm run prepare-review:scout-local-ai-device-run -- --run latest',
		'```',
		'',
		'If you save or drag the shared JSON into `data/scout-local-ai/inbox/`:',
		'',
		'```sh',
		'npm run prepare-review:scout-local-ai-device-run -- --run inbox',
		'```',
		'',
		'If Dad sends copied JSON text instead of a file:',
		'',
		'```sh',
		'npm run receive:scout-local-ai-device-run -- --clipboard',
		'pbpaste | npm run receive:scout-local-ai-device-run -- --stdin',
		'```',
		'',
		'Expanded manual path:',
		'',
		'```sh',
		'npm run inspect:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json',
		'npm run intake:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json',
		'npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md',
		'npm run apply-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json',
		'npm run finalize-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json',
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

function nativeSourceBoundary(status) {
	const nativeSource = status.nativeSource;
	if (nativeSource?.latestNativeUploadHasCurrentSource) {
		return 'latest native upload contains the current checkout';
	}
	if (nativeSource?.nativeAppSourceNewerThanLatestNativeUpload) {
		if (!status.testflight?.targetBuildReadyForDad) {
			return 'current native app source is newer than the latest native upload; upload and refresh the local target build before counting latest-source phone proof';
		}
		return 'current checkout is newer than the latest native upload; Dad can still run a suite-compatible build now, but latest-source phone proof needs a fresh bumped-build upload and Dad Pilot refresh';
	}
	if (nativeSource?.sourceNewerThanLatestNativeUpload) {
		return 'repo changed after the latest native upload, but no native app source changes are detected; latest phone build still appears to contain the current app bundle source';
	}
	if (nativeSource?.sourceDiffersFromLatestNativeUpload) {
		return 'current checkout differs from the latest native upload; treat latest-source phone proof as unverified until the next upload/refresh';
	}
	return 'latest native upload source is unknown';
}

function createDadMessageText({ status, releaseEvidence }) {
	const dadTestFlightEvidence = releaseEvidenceItem(releaseEvidence, 'dad-testflight-invite');
	const publicLink = dadTestFlightEvidence?.publicLink ?? status.testflight?.publicLink ?? 'https://testflight.apple.com/join/BagBCrzf';
	const recordedDadBuild = extractRecordedDadBuild(releaseEvidence);
	const suiteRequiredBuild = status.suite?.finalProof?.requiredApp ?? '<unknown>';
	const buildLabel = status.testflight?.targetBuildReadyForDad
		? status.testflight.targetBuild
		: status.testflight?.recordedDadPilotMeetsSuiteRequirement
			? recordedDadBuild
			: status.testflight?.targetBuild ?? recordedDadBuild;
	const readyLine = status.testflight?.targetBuildReadyForDad
		? `Hoggcountry TestFlight build ${buildLabel} is ready for the local AI test.`
		: status.testflight?.recordedDadPilotMeetsSuiteRequirement
			? `Hoggcountry TestFlight build ${buildLabel} can run this suite now; Chris may still refresh you to the latest build later.`
			: `Hold off on the final Run 100 until Chris says TestFlight has a build matching ${suiteRequiredBuild}.`;
	const lines = [
		'Dad, can you help me run the Hoggcountry local AI test?',
		'',
		readyLine,
		`TestFlight link: ${publicLink}`,
		'',
		'1. Open TestFlight and update Hoggcountry. If it only says Open, that is fine.',
		'2. Open Hoggcountry > Settings > Scout Eval Lab.',
		'3. Make sure the status says TestFlight ready.',
		'4. Keep the phone plugged in and awake, then tap Run 100.',
		'5. Run 3 is only a quick smoke check; Run 100 is the real proof.',
		'6. When it finishes, tap Share and send the JSON to Chris. No need to understand the JSON.',
		'7. If it gets interrupted, reopen Hoggcountry > Settings > Scout Eval Lab and tap Resume, then Share when it finishes.',
		'',
		'Thank you. This is the big local AI test.'
	];
	return `${lines.join('\n')}\n`;
}

function createPhoneBuildDecision({ status, recordedDadBuild, targetBuild, suiteRequiredBuild }) {
	if (status.testflight?.targetBuildReadyForDad) {
		return {
			useNow: `install/update the latest Dad Pilot TestFlight target \`${targetBuild}\``,
			latestTarget: `\`${targetBuild}\` is recorded in Dad Pilot and meets \`${suiteRequiredBuild}\``,
			finalProofBoundary: 'Run 100 is imported from a TestFlight/iPhone export, reviewed 100/100 at 5/5, and strict/stability proof passes'
		};
	}
	if (status.testflight?.recordedDadPilotMeetsSuiteRequirement) {
		return {
			useNow: `Dad can run the suite on the currently approved Dad Pilot build \`${recordedDadBuild}\`; do not wait for target \`${targetBuild}\` unless latest-code proof is required`,
			latestTarget: `\`${targetBuild}\` is the Xcode target/local candidate, but it still needs App Store Connect upload/refresh proof before it is the latest Dad Pilot build`,
			finalProofBoundary: `the exported run shows TestFlight/iPhone context and app build satisfying \`${suiteRequiredBuild}\`; build \`${targetBuild}\` only counts as latest-code proof after Dad Pilot refresh shows targetReadyForDad`
		};
	}
	return {
		useNow: `wait for App Store Connect to show a Dad Pilot build satisfying \`${suiteRequiredBuild}\` before asking Dad for Run 100`,
		latestTarget: `\`${targetBuild}\` is the Xcode target/local candidate, but Dad Pilot evidence currently records \`${recordedDadBuild}\``,
		finalProofBoundary: `Dad Pilot/TestFlight proof and the exported run both show app build satisfying \`${suiteRequiredBuild}\``
	};
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
