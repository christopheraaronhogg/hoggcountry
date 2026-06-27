#!/usr/bin/env node
import { createPrivateKey, createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com';

const DEFAULT_APP_ID = '6782505691';
const DEFAULT_DAD_GROUP_ID = 'fc963396-a087-44c6-b56b-29847da31cd4';
const DEFAULT_XCODE_PROJECT = 'mobile/ios/App/App.xcodeproj/project.pbxproj';
const DEFAULT_RELEASE_EVIDENCE = 'docs/launch/release-evidence.json';
const AVAILABLE_EXTERNAL_STATES = new Set(['IN_BETA_TESTING', 'BETA_APPROVED']);
const SUBMITTABLE_EXTERNAL_STATES = new Set(['READY_FOR_BETA_SUBMISSION']);
const REVIEW_PENDING_EXTERNAL_STATES = new Set(['READY_FOR_BETA_SUBMISSION', 'WAITING_FOR_BETA_REVIEW']);
const DEFAULT_REVIEW_POLL_ATTEMPTS = 12;
const DEFAULT_REVIEW_POLL_INTERVAL_MS = 15000;

const cli = parseCliArgs(process.argv.slice(2));
if (cli.help || cli.h) {
	console.log(`Refresh or attach Dad Pilot TestFlight build proof.

Default mode is read-only.

Usage:
  npm run refresh:testflight-dad-pilot
  npm run refresh:testflight-dad-pilot -- --build 11 --app-version 1.0
  npm run refresh:testflight-dad-pilot -- --attach --build 11 --app-version 1.0
  npm run refresh:testflight-dad-pilot -- --attach --submit-review --build 11 --app-version 1.0
  npm run refresh:testflight-dad-pilot -- --attach --remove-previous --update-release-evidence

Auth:
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_XXXX.p8
  --asc-key-id KEYID
  --asc-issuer-id ISSUER

Env alternatives:
  APP_STORE_CONNECT_API_KEY_PATH
  APP_STORE_CONNECT_API_KEY_ID
  APP_STORE_CONNECT_API_ISSUER_ID
`);
	process.exit(0);
}

const options = {
	appId: String(cli.appId ?? DEFAULT_APP_ID),
	groupId: String(cli.groupId ?? DEFAULT_DAD_GROUP_ID),
	xcodeProject: resolveInputPath(cli.xcodeProject ?? DEFAULT_XCODE_PROJECT),
	releaseEvidence: resolveInputPath(cli.releaseEvidence ?? DEFAULT_RELEASE_EVIDENCE),
	buildNumber: cli.build ? String(cli.build) : null,
	appVersion: cli.appVersion ? String(cli.appVersion) : null,
	attach: Boolean(cli.attach),
	submitReview: Boolean(cli.submitReview),
	waitReview: Boolean(cli.waitReview),
	reviewPollAttempts: parseInteger(cli.reviewPollAttempts ?? DEFAULT_REVIEW_POLL_ATTEMPTS, 'review-poll-attempts'),
	reviewPollIntervalMs: parseInteger(cli.reviewPollIntervalMs ?? DEFAULT_REVIEW_POLL_INTERVAL_MS, 'review-poll-interval-ms'),
	removePrevious: Boolean(cli.removePrevious),
	updateReleaseEvidence: Boolean(cli.updateReleaseEvidence),
	proofOut: cli.proofOut ? resolveInputPath(cli.proofOut) : null,
	fixture: cli.fixture ? resolveInputPath(cli.fixture) : null,
	json: Boolean(cli.json)
};

const xcodeTarget = await readXcodeTarget(options.xcodeProject);
options.buildNumber ??= xcodeTarget.buildNumber;
options.appVersion ??= xcodeTarget.appVersion;

const client = options.fixture ? fixtureClient(await readJson(options.fixture)) : appStoreConnectClient({
	keyPath: cli.ascKeyPath ?? process.env.APP_STORE_CONNECT_API_KEY_PATH,
	keyId: cli.ascKeyId ?? process.env.APP_STORE_CONNECT_API_KEY_ID,
	issuerId: cli.ascIssuerId ?? process.env.APP_STORE_CONNECT_API_ISSUER_ID
});

const summary = await refreshDadPilot(options, client);

if (options.proofOut) {
	await mkdir(dirname(options.proofOut), { recursive: true });
	await writeFile(options.proofOut, createProofMarkdown(summary), 'utf8');
	summary.proofPath = relative(REPO_ROOT, options.proofOut);
}

if (options.updateReleaseEvidence) {
	if (!summary.gates.targetReadyForDad) {
		throw new Error('Refusing to update release evidence: target build is not attached and externally available for Dad Pilot.');
	}
	const evidence = await readOptionalJson(options.releaseEvidence) ?? { schemaVersion: 1, items: {} };
	const updated = updateReleaseEvidence(evidence, summary);
	await writeFile(options.releaseEvidence, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
	summary.releaseEvidenceUpdated = relative(REPO_ROOT, options.releaseEvidence);
}

if (options.json) {
	console.log(JSON.stringify(summary, null, 2));
} else {
	console.log(createSummaryMarkdown(summary));
}

async function refreshDadPilot(input, client) {
	const checkedAt = new Date().toISOString();
	let buildResponse = await client.getBuild(input.appId, input.buildNumber);
	let groupResponse = await client.getGroup(input.groupId);
	let target = selectTargetBuild(buildResponse, input);
	let dadPilot = summarizeDadPilot(groupResponse, input.groupId);
	const actions = {
		attached: false,
		submittedBetaReview: false,
		reviewPolls: 0,
		removedBuildIds: []
	};
	const refresh = async () => {
		buildResponse = await client.getBuild(input.appId, input.buildNumber);
		groupResponse = await client.getGroup(input.groupId);
		target = selectTargetBuild(buildResponse, input);
		dadPilot = summarizeDadPilot(groupResponse, input.groupId);
		return { buildResponse, groupResponse, target, dadPilot };
	};

	if (input.attach && target?.id && !isAttachedToGroup(target, input.groupId)) {
		if (targetBuildCanBeAttached(target) || (input.submitReview && targetBuildCanBeSubmittedForReview(target))) {
			await client.attachBuild(input.groupId, target.id);
			actions.attached = true;
			await refresh();
		} else {
			throw new Error(`Refusing to attach build ${input.appVersion} (${input.buildNumber}): processing=${target.processingState ?? '<missing>'}, external=${target.externalState ?? '<missing>'}.`);
		}
	}

	if (input.submitReview && target?.id && targetBuildCanBeSubmittedForReview(target)) {
		await client.submitBetaReview(target.id);
		actions.submittedBetaReview = true;
		await pollReviewState(input, refresh, actions);
	} else if ((input.submitReview || input.waitReview) && target?.id && targetReviewMayStillSettle(target)) {
		await pollReviewState(input, refresh, actions);
	}

	if (input.removePrevious && target?.id && targetReadyForDad(target, input.groupId)) {
		for (const build of dadPilot.attachedBuilds) {
			if (build.id === target.id) continue;
			await client.removeBuild(input.groupId, build.id);
			actions.removedBuildIds.push(build.id);
		}
		if (actions.removedBuildIds.length) {
			groupResponse = await client.getGroup(input.groupId);
			dadPilot = summarizeDadPilot(groupResponse, input.groupId);
		}
	}

	const gates = {
		buildFound: Boolean(target),
		buildValid: target?.processingState === 'VALID',
		attachedToDadPilot: target ? isAttachedToGroup(target, input.groupId) || dadPilot.attachedBuilds.some((build) => build.id === target.id) : false,
		externallyAvailable: target ? AVAILABLE_EXTERNAL_STATES.has(String(target.externalState ?? '')) : false,
		targetReadyForDad: target ? targetReadyForDad(target, input.groupId, dadPilot) : false
	};

	return {
		schemaVersion: 1,
		checkedAt,
		appId: input.appId,
		dadGroupId: input.groupId,
		targetBuild: `${input.appVersion} (${input.buildNumber})`,
		target,
		dadPilot,
		gates,
		actions,
		publicLink: dadPilot.publicLink ?? null,
		releaseEvidencePath: relative(REPO_ROOT, input.releaseEvidence)
	};
}

function selectTargetBuild(response, input) {
	const included = response?.included ?? [];
	const candidates = response?.data ?? [];
	for (const build of candidates) {
		const buildInfo = summarizeBuild(build, included);
		if (buildInfo.buildNumber !== input.buildNumber) continue;
		if (input.appVersion && buildInfo.appVersion && buildInfo.appVersion !== input.appVersion) continue;
		return buildInfo;
	}
	return null;
}

function summarizeBuild(build, included) {
	const betaDetail = included.find((entry) => entry.type === 'buildBetaDetails' && entry.id === build.id);
	const preReleaseId = build.relationships?.preReleaseVersion?.data?.id;
	const preRelease = included.find((entry) => entry.type === 'preReleaseVersions' && (!preReleaseId || entry.id === preReleaseId));
	const reviewSubmission = included.find((entry) => entry.type === 'betaAppReviewSubmissions');
	const betaGroups = [
		...(build.relationships?.betaGroups?.data ?? []),
		...included.filter((entry) => entry.type === 'betaGroups').map((entry) => ({ type: 'betaGroups', id: entry.id }))
	];
	return {
		id: build.id,
		buildNumber: String(build.attributes?.version ?? ''),
		appVersion: preRelease?.attributes?.version ?? null,
		processingState: build.attributes?.processingState ?? null,
		uploadedDate: build.attributes?.uploadedDate ?? null,
		internalState: betaDetail?.attributes?.internalBuildState ?? null,
		externalState: betaDetail?.attributes?.externalBuildState ?? null,
		betaReviewState: reviewSubmission?.attributes?.betaReviewState ?? null,
		betaGroupIds: [...new Set(betaGroups.map((group) => group.id).filter(Boolean))]
	};
}

function summarizeDadPilot(response, groupId) {
	const group = response?.data?.id === groupId
		? response.data
		: response?.included?.find((entry) => entry.type === 'betaGroups' && entry.id === groupId);
	const included = response?.included ?? [];
	const attachedBuilds = [
		...(response?.data?.type === 'builds' ? response.data : []),
		...included.filter((entry) => entry.type === 'builds')
	].map((build) => ({
		id: build.id,
		buildNumber: String(build.attributes?.version ?? ''),
		processingState: build.attributes?.processingState ?? null,
		uploadedDate: build.attributes?.uploadedDate ?? null
	}));
	const testerIds = new Set([
		...(group?.relationships?.betaTesters?.data ?? []),
		...included.filter((entry) => entry.type === 'betaTesters').map((entry) => ({ id: entry.id }))
	].map((tester) => tester.id).filter(Boolean));
	return {
		id: groupId,
		name: group?.attributes?.name ?? '<unknown>',
		publicLinkEnabled: group?.attributes?.publicLinkEnabled ?? null,
		publicLinkLimit: group?.attributes?.publicLinkLimit ?? null,
		publicLink: group?.attributes?.publicLink ?? null,
		testerCount: testerIds.size,
		attachedBuilds: uniqueById(attachedBuilds)
	};
}

function targetBuildCanBeAttached(target) {
	return target.processingState === 'VALID' && AVAILABLE_EXTERNAL_STATES.has(String(target.externalState ?? ''));
}

function targetBuildCanBeSubmittedForReview(target) {
	return target.processingState === 'VALID' && SUBMITTABLE_EXTERNAL_STATES.has(String(target.externalState ?? ''));
}

function targetReviewMayStillSettle(target) {
	return target.processingState === 'VALID' && REVIEW_PENDING_EXTERNAL_STATES.has(String(target.externalState ?? ''));
}

function targetReadyForDad(target, groupId, dadPilot = null) {
	const attached = isAttachedToGroup(target, groupId) || Boolean(dadPilot?.attachedBuilds?.some((build) => build.id === target.id));
	return target.processingState === 'VALID' &&
		attached &&
		AVAILABLE_EXTERNAL_STATES.has(String(target.externalState ?? ''));
}

async function pollReviewState(input, refresh, actions) {
	const attempts = Math.max(1, input.reviewPollAttempts);
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		if (attempt > 0 && input.reviewPollIntervalMs > 0) {
			await sleep(input.reviewPollIntervalMs);
		}
		const state = await refresh();
		actions.reviewPolls += 1;
		if (!state.target) return state;
		if (targetReadyForDad(state.target, input.groupId, state.dadPilot)) return state;
		if (!targetReviewMayStillSettle(state.target)) return state;
	}
	return { target: null, dadPilot: null };
}

function isAttachedToGroup(target, groupId) {
	return (target?.betaGroupIds ?? []).includes(groupId);
}

function updateReleaseEvidence(evidence, summary) {
	const copy = structuredClone(evidence);
	copy.schemaVersion ??= 1;
	copy.items ??= {};
	const date = summary.checkedAt.slice(0, 10);
	const proofFile = summary.proofPath ? [summary.proofPath] : [];
	const commands = [
		`node scripts/refresh-testflight-dad-pilot.mjs --build ${summary.target?.buildNumber ?? '<build>'} --app-version ${summary.target?.appVersion ?? '<version>'} --attach --submit-review --remove-previous --update-release-evidence`,
		`GET https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${summary.appId}&filter[version]=${summary.target?.buildNumber ?? '<build>'}`,
		`GET https://api.appstoreconnect.apple.com/v1/betaGroups/${summary.dadGroupId}?include=builds,betaTesters`
	];
	copy.updatedAt = date;
	copy.items['apple-archive-upload'] = {
		...(copy.items['apple-archive-upload'] ?? {}),
		status: 'verified',
		verifiedAt: summary.checkedAt,
		verifiedBy: 'Codex via App Store Connect API',
		summary: `App Store Connect reports Hoggcountry iOS build ${summary.targetBuild} (${summary.target?.id}) is ${summary.target?.processingState}, external state ${summary.target?.externalState}, and attached to Dad Pilot.`,
		files: mergeUnique([...(copy.items['apple-archive-upload']?.files ?? []), ...proofFile]),
		commands: mergeUnique([...(copy.items['apple-archive-upload']?.commands ?? []), ...commands])
	};
	copy.items['dad-testflight-invite'] = {
		...(copy.items['dad-testflight-invite'] ?? {}),
		status: 'verified',
		verifiedAt: summary.checkedAt,
		verifiedBy: 'Codex via App Store Connect API',
		summary: `Dad Pilot is attached to Hoggcountry iOS build ${summary.targetBuild}, the public TestFlight link is enabled with limit ${summary.dadPilot.publicLinkLimit ?? '<unknown>'}, and App Store Connect reports external state ${summary.target?.externalState}.`,
		files: mergeUnique([...(copy.items['dad-testflight-invite']?.files ?? []), ...proofFile]),
		publicLink: summary.publicLink
	};
	return copy;
}

function createSummaryMarkdown(summary) {
	const lines = [
		`# Dad Pilot TestFlight target refresh`,
		'',
		`Checked at: ${summary.checkedAt}`,
		`Target build: \`${summary.targetBuild}\``,
		`Build id: \`${summary.target?.id ?? '<missing>'}\``,
		`Processing: \`${summary.target?.processingState ?? '<missing>'}\``,
		`External state: \`${summary.target?.externalState ?? '<missing>'}\``,
		`Dad Pilot: \`${summary.dadPilot.name}\` (${summary.dadGroupId})`,
		`Public link: ${summary.publicLink ?? '<missing>'}`,
		'',
		'## Gates',
		'',
		...Object.entries(summary.gates).map(([key, ok]) => `- ${ok ? '[x]' : '[ ]'} ${key}`),
		'',
		'## Actions',
		'',
		`- Attached target build this run: ${summary.actions.attached ? 'yes' : 'no'}`,
		`- Submitted target build for beta review this run: ${summary.actions.submittedBetaReview ? 'yes' : 'no'}`,
		`- Review refresh polls this run: ${summary.actions.reviewPolls}`,
		`- Removed previous build ids: ${summary.actions.removedBuildIds.join(', ') || 'none'}`,
		'',
		'## Boundary',
		'',
		'This refresh only covers App Store Connect / Dad Pilot build availability. It does not prove a real iPhone Eval Lab run, local model behavior, or 100/100 reviewed answers.'
	];
	return `${lines.join('\n')}\n`;
}

function createProofMarkdown(summary) {
	return createSummaryMarkdown(summary);
}

function appStoreConnectClient(auth) {
	const token = createAppStoreConnectJwt(auth);
	return {
		getBuild: (appId, buildNumber) => ascRequest(token, `/v1/builds?filter[app]=${encodeURIComponent(appId)}&filter[version]=${encodeURIComponent(buildNumber)}&include=buildBetaDetail,betaGroups,preReleaseVersion,betaAppReviewSubmission&limit=10`),
		getGroup: (groupId) => ascRequest(token, `/v1/betaGroups/${encodeURIComponent(groupId)}?include=builds,betaTesters&limit[builds]=50&limit[betaTesters]=50`),
		attachBuild: (groupId, buildId) => ascRequest(token, `/v1/betaGroups/${encodeURIComponent(groupId)}/relationships/builds`, {
			method: 'POST',
			body: { data: [{ type: 'builds', id: buildId }] }
		}),
		submitBetaReview: (buildId) => ascRequest(token, '/v1/betaAppReviewSubmissions', {
			method: 'POST',
			body: {
				data: {
					type: 'betaAppReviewSubmissions',
					relationships: {
						build: { data: { type: 'builds', id: buildId } }
					}
				}
			}
		}),
		removeBuild: (groupId, buildId) => ascRequest(token, `/v1/betaGroups/${encodeURIComponent(groupId)}/relationships/builds`, {
			method: 'DELETE',
			body: { data: [{ type: 'builds', id: buildId }] }
		})
	};
}

async function ascRequest(token, path, options = {}) {
	const response = await fetch(`${ASC_BASE_URL}${path}`, {
		method: options.method ?? 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: options.body ? JSON.stringify(options.body) : undefined
	});
	const text = await response.text();
	const body = text ? JSON.parse(text) : null;
	if (!response.ok) {
		throw new Error(`App Store Connect ${options.method ?? 'GET'} ${path} failed with ${response.status}: ${text}`);
	}
	return body ?? { data: null };
}

function fixtureClient(fixture) {
	return {
		getBuild: async () => fixture.buildQuery,
		getGroup: async () => fixture.group,
		attachBuild: async (_groupId, buildId) => {
			fixture.buildQuery.data[0].relationships ??= {};
			fixture.buildQuery.data[0].relationships.betaGroups = { data: [{ type: 'betaGroups', id: _groupId }] };
			fixture.group.included ??= [];
			if (!fixture.group.included.some((entry) => entry.type === 'builds' && entry.id === buildId)) {
				fixture.group.included.push(fixture.buildQuery.data[0]);
			}
			return { data: null };
		},
		submitBetaReview: async (buildId) => {
			const betaDetail = fixture.buildQuery.included.find((entry) => entry.type === 'buildBetaDetails' && entry.id === buildId);
			if (betaDetail) {
				betaDetail.attributes.internalBuildState = 'READY_FOR_BETA_TESTING';
				betaDetail.attributes.externalBuildState = 'IN_BETA_TESTING';
			}
			if (!fixture.buildQuery.included.some((entry) => entry.type === 'betaAppReviewSubmissions')) {
				fixture.buildQuery.included.push({
					type: 'betaAppReviewSubmissions',
					id: `review-${buildId}`,
					attributes: { betaReviewState: 'APPROVED' }
				});
			}
			return { data: { type: 'betaAppReviewSubmissions', id: `review-${buildId}` } };
		},
		removeBuild: async (_groupId, buildId) => {
			fixture.group.included = (fixture.group.included ?? []).filter((entry) => !(entry.type === 'builds' && entry.id === buildId));
			return { data: null };
		}
	};
}

function createAppStoreConnectJwt({ keyPath, keyId, issuerId }) {
	if (!keyPath || !keyId || !issuerId) {
		throw new Error('App Store Connect API auth requires --asc-key-path, --asc-key-id, and --asc-issuer-id or matching APP_STORE_CONNECT_API_* env vars.');
	}
	const privateKey = createPrivateKey(readFileSync(resolveInputPath(keyPath)));
	const header = base64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
	const payload = base64url(JSON.stringify({
		iss: issuerId,
		aud: 'appstoreconnect-v1',
		exp: Math.floor(Date.now() / 1000) + 20 * 60
	}));
	const signingInput = `${header}.${payload}`;
	const signature = createSign('sha256').update(signingInput).end().sign(privateKey);
	return `${signingInput}.${base64url(derToJose(signature))}`;
}

function derToJose(signature) {
	let offset = 0;
	if (signature[offset++] !== 0x30) throw new Error('Invalid ES256 signature.');
	const sequenceLength = signature[offset++];
	if (sequenceLength + 2 !== signature.length) throw new Error('Invalid ES256 signature length.');
	if (signature[offset++] !== 0x02) throw new Error('Invalid ES256 signature R marker.');
	const rLength = signature[offset++];
	const r = signature.subarray(offset, offset + rLength);
	offset += rLength;
	if (signature[offset++] !== 0x02) throw new Error('Invalid ES256 signature S marker.');
	const sLength = signature[offset++];
	const s = signature.subarray(offset, offset + sLength);
	return Buffer.concat([leftPadUnsigned(r, 32), leftPadUnsigned(s, 32)]);
}

function leftPadUnsigned(value, length) {
	let bytes = Buffer.from(value);
	while (bytes.length > length && bytes[0] === 0) bytes = bytes.subarray(1);
	if (bytes.length > length) throw new Error('Invalid ES256 signature integer length.');
	if (bytes.length === length) return bytes;
	return Buffer.concat([Buffer.alloc(length - bytes.length), bytes]);
}

async function readXcodeTarget(path) {
	const text = await readFile(path, 'utf8');
	return {
		appVersion: uniqueBuildSetting(text, 'MARKETING_VERSION') ?? '1.0',
		buildNumber: uniqueBuildSetting(text, 'CURRENT_PROJECT_VERSION') ?? ''
	};
}

function uniqueBuildSetting(text, name) {
	const matches = [...text.matchAll(new RegExp(`${name}\\s*=\\s*([^;]+);`, 'gu'))]
		.map((match) => match[1].trim())
		.filter(Boolean);
	const unique = [...new Set(matches)];
	if (unique.length === 1) return unique[0];
	if (unique.length > 1) return unique.at(-1);
	return null;
}

async function readJson(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function readOptionalJson(path) {
	try {
		return await readJson(path);
	} catch (error) {
		if (error?.code === 'ENOENT') return null;
		throw error;
	}
}

function mergeUnique(values) {
	return [...new Set(values.filter(Boolean))];
}

function uniqueById(items) {
	const byId = new Map();
	for (const item of items) if (item.id) byId.set(item.id, item);
	return [...byId.values()];
}

function parseCliArgs(argv) {
	const parsed = {};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg.startsWith('--')) continue;
		const rawName = arg.slice(2);
		const eq = rawName.indexOf('=');
		const name = camelCase(eq === -1 ? rawName : rawName.slice(0, eq));
		if (eq !== -1) {
			parsed[name] = rawName.slice(eq + 1);
		} else if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
			parsed[name] = argv[index + 1];
			index += 1;
		} else {
			parsed[name] = true;
		}
	}
	return parsed;
}

function parseInteger(value, label) {
	const parsed = Number.parseInt(String(value), 10);
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`--${label} must be a non-negative integer.`);
	}
	return parsed;
}

function camelCase(value) {
	return value.replace(/-([a-z])/gu, (_match, char) => char.toUpperCase());
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function base64url(value) {
	return Buffer.from(value).toString('base64url');
}

function sleep(ms) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
