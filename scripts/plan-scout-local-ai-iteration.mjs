import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	improvementTaskProblems,
	ownerLayerProblems,
	parseCliArgs,
	VALID_FAILURE_CATEGORIES,
	VALID_OWNER_LAYERS as REVIEW_OWNER_LAYERS
} from './lib/scout-local-ai-review.mjs';
import {
	summarizeScoutLocalAiGeneralizationForCase
} from './lib/scout-local-ai-generalization.mjs';
import {
	scoutLocalAiSuiteIdentity
} from './lib/scout-local-ai-suite.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_OUTPUT_DIR = 'data/scout-local-ai/iterations';
const DEVICE_EVIDENCE_LANE = 'device-on-device-gemma';
const VALID_FAILURES = new Set(VALID_FAILURE_CATEGORIES);
const VALID_OWNER_LAYERS = new Set(REVIEW_OWNER_LAYERS);
const OWNER_GUIDANCE = {
	data: 'Improve local data tables, generated source docs, or offline field-pack slices; add source retrieval coverage for the affected cases.',
	'tool-routing': 'Fix Scout tool selection, source-skill routing, or required tool invocation evidence; add routing regression coverage before changing answer wording.',
	prompt: 'Adjust the Scout answer contract or synthesis prompt while preserving receipts, caveats, and source-grounded answers.',
	'safety-prompt': 'Tighten safety wording, required confirmations, refusal/escalation behavior, and safety regression coverage.',
	ui: 'Improve the Eval Lab, recovery state, export/review UX, or visible receipts so Dad can complete and understand the flow.',
	'local-model': 'Investigate local model runtime, context budget, bridge behavior, latency, or truncation before treating wording tweaks as a fix.'
};
const OWNER_FIX_TARGETS = {
	data: [
		target('Local reference data', ['data/at-open-reference/', 'apps/openclaw-web/src/lib/server/public-mobile-field-pack.ts'], 'Update generated reference packs, field-pack slices, or local data tables before prompt wording.')
	],
	'tool-routing': [
		target('Scout tool registry and runtime routing', ['mobile/src/lib/scout/built-in-tools.ts', 'mobile/src/lib/scout/tool-registry.ts', 'mobile/src/lib/scout/scout-runtime.ts'], 'Fix required tool selection, source-skill args, invocation records, and receipt/source evidence.')
	],
	prompt: [
		target('Scout synthesis contract', ['mobile/src/lib/scout/scout-runtime.ts', 'mobile/src/lib/scout/model-policy.ts'], 'Tighten answer instructions while preserving grounded receipts and safety caveats.')
	],
	'safety-prompt': [
		target('Safety response contract', ['mobile/src/lib/scout/scout-runtime.ts', 'packages/scout-skills/src/index.ts'], 'Push lower-risk choices, escalation language, and required confirmations into the safety lane.')
	],
	ui: [
		target('Eval Lab and recovery UI', ['mobile/src/lib/components/ScoutEvalLab.svelte', 'mobile/src/lib/scout/local-ai-eval.ts', 'mobile/src/lib/scout/local-ai-eval-proof.ts'], 'Improve visible preflight, resume/export recovery, and receipt clarity for Dad.')
	],
	'local-model': [
		target('On-device model bridge', ['mobile/src/lib/scout/providers/on-device-gemma.ts', 'mobile/src/lib/scout/capacitor-gemma-bridge.ts', 'mobile/src/lib/scout/model-router.ts'], 'Investigate bridge availability, context limits, provider errors, and truncation before changing answer text.')
	]
};
const TOOL_FIX_TARGETS = {
	bible_search: [
		target('KJV Bible search', ['mobile/src/lib/bible/', 'packages/corpus/src/kjv-pce.ts', 'scripts/kjv-pce.test.mjs'], 'Fix scripture lookup, exact KJV PCE wording, or citation behavior.')
	],
	current_mile: [
		target('Current mile context', ['mobile/src/lib/scout/hike-profile.ts', 'mobile/src/lib/scout/built-in-tools.ts', 'mobile/src/lib/trailState.svelte.ts'], 'Verify Dad profile/current-mile inputs reach Scout before synthesis.')
	],
	loadout_check: [
		target('Loadout tool', ['mobile/src/lib/scout/built-in-tools.ts', 'apps/openclaw-web/src/lib/loadout.ts', 'mobile/src/lib/scout/default-pack.ts'], 'Repair current pack/body notes retrieval and loadout caveats.')
	],
	next_shelter: [
		target('Shelter/camping tool data', ['mobile/src/lib/scout/built-in-tools.ts', 'data/at-open-reference/*/processed/waypoints/shelters.json', 'packages/scout-skills/src/index.ts'], 'Fix next shelter/camping candidate lookup and legal/current-status caveats.')
	],
	next_town: [
		target('Town/resupply tool data', ['mobile/src/lib/scout/built-in-tools.ts', 'data/at-open-reference/processed/towns_resupply/', 'packages/scout-skills/src/index.ts'], 'Fix town candidates, service uncertainty, and resupply source routing.')
	],
	next_water: [
		target('Water tool data', ['mobile/src/lib/scout/built-in-tools.ts', 'apps/openclaw-web/src/lib/server/generated/awol-water-reference.ts', 'data/at-open-reference/*/processed/water/'], 'Fix next-water lookup, current-flow caveats, and water source receipts.')
	],
	open_source_doc: [
		target('Source document open tool', ['mobile/src/lib/scout/offline-source-docs.ts', 'packages/scout-sources/src/index.ts', 'packages/scout-skills/src/index.ts'], 'Make source_search results open the right local document and preserve sourceDocumentIds.')
	],
	park_services: [
		target('Park services data', ['apps/openclaw-web/src/lib/server/scout-park-facilities.ts', 'scripts/scout-park-facilities.test.mjs'], 'Fix visitor center, campground, and developed-park service retrieval.')
	],
	source_search: [
		target('Source search tool', ['mobile/src/lib/scout/offline-source-docs.ts', 'packages/scout-sources/src/index.ts', 'packages/scout-skills/src/index.ts'], 'Repair source-skill search selection, query terms, citations, and receipt coverage.')
	],
	trail_conditions: [
		target('Trail conditions tool', ['apps/openclaw-web/src/lib/server/scout-trail-conditions.ts', 'data/at-open-reference/processed/live_alerts/', 'scripts/scout-trail-conditions.test.mjs'], 'Fix official/current trail condition retrieval and stale-data caveats.')
	],
	upcoming_terrain: [
		target('Terrain tool data', ['mobile/src/lib/scout/built-in-tools.ts', 'packages/trail-data/src/index.ts', 'data/at-open-reference/rag_docs/segment_guides/'], 'Fix elevation, exposure, segment guide, and difficulty context.')
	],
	weather_lookup: [
		target('Weather tool', ['apps/openclaw-web/src/lib/server/scout-official-sources.ts', 'scripts/weather-assessor.test.mjs', 'mobile/src/lib/scout/built-in-tools.ts'], 'Fix NWS/current weather lookup, stale forecast language, and weather receipts.')
	]
};
const SOURCE_SKILL_FIX_TARGETS = {
	loadout: [
		target('Loadout source skill', ['packages/scout-skills/src/index.ts', 'mobile/src/lib/scout/offline-source-docs.ts', 'apps/openclaw-web/src/lib/loadout.ts'], 'Improve pack/loadout docs, gear/body notes retrieval, and stale-loadout caveats.')
	],
	safety: [
		target('Safety source skill', ['packages/scout-skills/src/index.ts', 'mobile/src/lib/scout/offline-source-docs.ts', 'data/at-open-reference/rag_docs/state_guides/'], 'Improve safety docs, escalation rules, and conservative response constraints.')
	],
	shelter: [
		target('Shelter source skill', ['packages/scout-skills/src/index.ts', 'data/at-open-reference/*/processed/waypoints/shelters.json', 'data/at-open-reference/rag_docs/state_guides/'], 'Improve shelter/camping docs, legality caveats, and candidate-source receipts.')
	],
	terrain: [
		target('Terrain source skill', ['packages/scout-skills/src/index.ts', 'data/at-open-reference/rag_docs/segment_guides/', 'data/at-open-reference/rag_docs/segment_guides/elevation_5mi/'], 'Improve terrain segment docs, elevation guidance, and route-context retrieval.')
	],
	town: [
		target('Town source skill', ['packages/scout-skills/src/index.ts', 'data/at-open-reference/processed/towns_resupply/', 'data/at-open-reference/rag_docs/state_guides/'], 'Improve town/resupply docs, service uncertainty, and private-business review boundaries.')
	],
	'trail conditions': [
		target('Trail conditions source skill', ['packages/scout-skills/src/index.ts', 'data/at-open-reference/processed/live_alerts/', 'apps/openclaw-web/src/lib/server/scout-trail-conditions.ts'], 'Improve closure/alert/current-condition docs and official-source routing.')
	],
	water: [
		target('Water source skill', ['packages/scout-skills/src/index.ts', 'data/at-open-reference/rag_docs/source_notes/water_language.md', 'data/at-open-reference/*/rag_docs/policies/water.md'], 'Improve water discipline docs, reliability language, and source-backed water receipts.')
	],
	weather: [
		target('Weather source skill', ['packages/scout-skills/src/index.ts', 'data/at-open-reference/*/rag_docs/policies/weather_live_conditions.md', 'apps/openclaw-web/src/lib/server/scout-official-sources.ts'], 'Improve weather-risk docs, NWS/current-source routing, and stale forecast caveats.')
	]
};

const cli = parseCliArgs(process.argv.slice(2));
const backlogPaths = await resolveBacklogPaths(cli);
const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const suite = await readOptionalJson(suitePath);
const outputDir = resolveInputPath(cli.outputDir ?? DEFAULT_OUTPUT_DIR);
const planId = safeFileName(String(cli.planId ?? `scout-local-ai-iteration-${compactTimestamp(new Date())}`));
const allowUnrated = Boolean(cli.allowUnrated);
const allowNonDevice = Boolean(cli.allowNonDevice);
const neighborCaseLimit = parsePositiveInteger(cli.neighborCaseLimit ?? cli.neighborLimit, 6);

if (!backlogPaths.length) {
	throw new Error([
		'Usage: npm run plan:scout-local-ai-iteration -- --backlog data/scout-local-ai/backlog/<run-id>.backlog.json',
		'Optional: --backlogs a.json,b.json --backlog-dir data/scout-local-ai/backlog --output-dir data/scout-local-ai/iterations --plan-id pass-1',
		'Use --allow-unrated only for a partial status plan, not a fix iteration.',
		'Use --allow-non-device only for routing/local-lab experiments outside final Dad proof.'
	].join('\n'));
}

const loaded = [];
const errors = [];
for (const path of backlogPaths) {
	const backlog = JSON.parse(await readFile(path, 'utf8'));
	validateBacklog(backlog, path, { allowNonDevice, allowUnrated, errors });
	loaded.push({ path, backlog });
}

if (errors.length) {
	console.error('Scout local AI iteration plan failed validation:');
	for (const error of errors.slice(0, 80)) console.error(`- ${error}`);
	if (errors.length > 80) console.error(`- ... ${errors.length - 80} more errors`);
	process.exit(1);
}

const plan = createIterationPlan({ planId, loaded, suite, suitePath, neighborCaseLimit });
await mkdir(outputDir, { recursive: true });
const jsonPath = resolve(outputDir, `${planId}.iteration.json`);
const markdownPath = resolve(outputDir, `${planId}.iteration.md`);
await writeFile(jsonPath, `${JSON.stringify(plan, null, 2)}\n`);
await writeFile(markdownPath, createIterationPlanMarkdown(plan));

console.log('Scout local AI iteration plan written.');
console.log(`Plan: ${relative(REPO_ROOT, jsonPath)}`);
console.log(`Markdown: ${relative(REPO_ROOT, markdownPath)}`);
console.log(`Backlogs: ${plan.summary.backlogCount}`);
console.log(`Below-5 tasks: ${plan.summary.itemCount}`);
console.log(`Regression cases: ${plan.regressionCaseIds.length}`);
console.log(`Rerun: ${plan.rerunCommand}`);

async function resolveBacklogPaths(args) {
	const paths = [];
	const direct = args.backlogs ?? args.backlog;
	if (direct) {
		for (const value of String(direct).split(',')) {
			const trimmed = value.trim();
			if (trimmed) paths.push(resolveInputPath(trimmed));
		}
	}
	if (args.backlogDir) {
		const dir = resolveInputPath(args.backlogDir);
		for (const file of await readdir(dir)) {
			if (file.endsWith('.backlog.json')) paths.push(resolve(dir, file));
		}
	}
	return [...new Set(paths)].sort((left, right) => left.localeCompare(right));
}

function validateBacklog(backlog, path, options) {
	const label = relative(REPO_ROOT, path);
	if (backlog.schemaVersion !== 1) options.errors.push(`${label}: schemaVersion must be 1.`);
	if (!backlog.runId) options.errors.push(`${label}: runId is required.`);
	if (!Array.isArray(backlog.items)) options.errors.push(`${label}: items must be an array.`);
	if (!options.allowNonDevice && backlog.evidenceLane !== DEVICE_EVIDENCE_LANE) {
		options.errors.push(
			`${label}: evidenceLane must be ${DEVICE_EVIDENCE_LANE} for a fix iteration plan; got ${backlog.evidenceLane ?? '<missing>'}. Use --allow-non-device only for routing/local-lab experiments outside final Dad proof.`
		);
	}
	if (!options.allowUnrated && (backlog.summary?.unrated ?? 0) > 0) {
		options.errors.push(`${label}: iteration planning requires a completed review; ${backlog.summary.unrated} cases are unrated.`);
	}
	if (!options.allowUnrated && (backlog.unratedItems?.length ?? 0) > 0) {
		options.errors.push(`${label}: contains unratedItems; finish ratings before planning a fix iteration.`);
	}
	if (!Array.isArray(backlog.items)) return;

	const seen = new Set();
	for (const item of backlog.items) {
		const itemLabel = `${label}:${item.caseId ?? '<missing-case>'}`;
		if (!item.caseId) options.errors.push(`${itemLabel}: caseId is required.`);
		if (seen.has(item.caseId)) options.errors.push(`${itemLabel}: duplicate case in backlog.`);
		seen.add(item.caseId);
		if (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 4) {
			options.errors.push(`${itemLabel}: rating must be an integer 1-4 for iteration work.`);
		}
		if (!VALID_OWNER_LAYERS.has(item.ownerLayer)) {
			options.errors.push(`${itemLabel}: ownerLayer must be one of ${[...VALID_OWNER_LAYERS].join(', ')}.`);
		}
		if (!Array.isArray(item.failureCategories) || !item.failureCategories.length) {
			options.errors.push(`${itemLabel}: failureCategories are required.`);
		} else {
			for (const category of item.failureCategories) {
				if (!VALID_FAILURES.has(category)) options.errors.push(`${itemLabel}: unknown failure category "${category}".`);
			}
			for (const problem of ownerLayerProblems(item.failureCategories, item.ownerLayer)) {
				options.errors.push(`${itemLabel}: ${problem}`);
			}
		}
		if (!String(item.improvementTask ?? '').trim()) {
			options.errors.push(`${itemLabel}: improvementTask is required.`);
		} else {
			for (const problem of improvementTaskProblems(item.improvementTask)) {
				options.errors.push(`${itemLabel}: ${problem}`);
			}
		}
	}
}

function createIterationPlan({ planId, loaded, suite, suitePath, neighborCaseLimit }) {
	const generatedAt = new Date().toISOString();
	const items = loaded.flatMap(({ path, backlog }) => backlog.items.map((item) => ({
		...item,
		sourceBacklog: relative(REPO_ROOT, path),
		runId: backlog.runId
	})));
	const sortedItems = [...items].sort(compareItems).map((item) => ({
		...item,
		generalizationRegression: createGeneralizationRegressionForItem(item, suite, neighborCaseLimit)
	}));
	const exactRegressionCaseIds = [...new Set(sortedItems.map((item) => item.caseId))];
	const neighborRegressionCaseIds = [...new Set(
		sortedItems
			.flatMap((item) => item.generalizationRegression.neighborCaseIds)
			.filter((caseId) => !exactRegressionCaseIds.includes(caseId))
	)];
	const regressionCaseIds = [...new Set([...exactRegressionCaseIds, ...neighborRegressionCaseIds])];
	const suiteIdentity = suite ? scoutLocalAiSuiteIdentity(suite) : null;
	const workstreams = [...groupBy(sortedItems, (item) => item.ownerLayer).entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([ownerLayer, ownerItems]) => createWorkstream(ownerLayer, ownerItems));

	return {
		schemaVersion: 1,
		planId,
		generatedAt,
		sourceBacklogs: loaded.map(({ path, backlog }) => ({
			path: relative(REPO_ROOT, path),
			runId: backlog.runId,
			suiteId: backlog.suiteId,
			suiteVersion: backlog.suiteVersion,
			suiteHash: backlog.suiteHash,
			evidenceLane: backlog.evidenceLane,
			generatedAt: backlog.generatedAt,
			rated: backlog.summary?.rated ?? 0,
			total: backlog.summary?.total ?? 0,
			belowFive: backlog.summary?.belowFive ?? backlog.items.length,
			unrated: backlog.summary?.unrated ?? 0
		})),
		summary: {
			backlogCount: loaded.length,
			itemCount: sortedItems.length,
			exactRegressionCaseCount: exactRegressionCaseIds.length,
			neighborRegressionCaseCount: neighborRegressionCaseIds.length,
			regressionCaseCount: regressionCaseIds.length,
			byOwnerLayer: Object.fromEntries(countBy(sortedItems, (item) => item.ownerLayer)),
			byFailureCategory: Object.fromEntries(countBy(sortedItems.flatMap((item) => item.failureCategories), (item) => item)),
			byDomain: Object.fromEntries(countBy(sortedItems, (item) => item.domain)),
			bySourceEvidenceGap: Object.fromEntries(countBy(sortedItems.flatMap(sourceEvidenceGapExpectations), (item) => item)),
			byEvidenceLane: Object.fromEntries(countBy(loaded.map(({ backlog }) => backlog.evidenceLane ?? 'unknown'), (item) => item))
		},
		exactRegressionCaseIds,
		neighborRegressionCaseIds,
		regressionCaseIds,
		rerunCommand: createRerunCommand(regressionCaseIds),
		fullSuiteCommand: 'npm run eval:scout-local-ai',
		reviewCommand: 'npm run review:scout-local-ai -- --run data/scout-local-ai/runs/<rerun-id>.json --review data/scout-local-ai/reviews/<rerun-id>.review.json',
		guardrails: [
			'Do not close this iteration by changing expected wording only.',
			'Fix the responsible layer named by ownerLayer: data, tool-routing, prompt, safety-prompt, ui, or local-model.',
			'Rerun the exact failed cases plus their neighboring prompt-frame cases so the fix proves the broader task behavior.',
			'Re-run the listed regression cases, then re-run the full 100-case suite before final device proof.',
			'Keep device/TestFlight proof separate from scaffold, browser, and cloud proof.'
		],
		generalizationRegression: {
			suitePath: suitePath ? relative(REPO_ROOT, suitePath) : null,
			suiteVersion: suite?.version ?? null,
			suiteHash: suiteIdentity?.suiteHash ?? null,
			neighborCaseLimit,
			enabled: Boolean(suite),
			warnings: createGeneralizationRegressionWarnings({ loaded, suite, suiteIdentity, suitePath }),
			items: sortedItems.map((item) => ({
				caseId: item.caseId,
				neighborCaseIds: item.generalizationRegression.neighborCaseIds,
				allNeighborCaseIds: item.generalizationRegression.allNeighborCaseIds,
				profiles: item.generalizationRegression.profiles
			}))
		},
		workstreams
	};
}

function createWorkstream(ownerLayer, items) {
	const sorted = [...items].sort(compareItems);
	const exactCaseIds = [...new Set(sorted.map((item) => item.caseId))];
	const neighborCaseIds = [...new Set(
		sorted
			.flatMap((item) => item.generalizationRegression.neighborCaseIds)
			.filter((caseId) => !exactCaseIds.includes(caseId))
	)];
	return {
		ownerLayer,
		itemCount: sorted.length,
		recommendedFixScope: OWNER_GUIDANCE[ownerLayer],
		fixTargets: createFixTargets(ownerLayer, sorted),
		exactRegressionCaseIds: exactCaseIds,
		neighborRegressionCaseIds: neighborCaseIds,
		regressionCaseIds: [...new Set([...exactCaseIds, ...neighborCaseIds])],
		failureCategories: [...new Set(sorted.flatMap((item) => item.failureCategories))].sort(),
		missingTools: [...new Set(sorted.flatMap((item) => item.missingTools ?? []))].sort(),
		sourceEvidenceGaps: [...new Set(sorted.flatMap(sourceEvidenceGapExpectations))].sort(),
		requiredTools: [...new Set(sorted.flatMap((item) => item.requiredTools ?? []))].sort(),
		items: sorted.map((item) => ({
			runId: item.runId,
			caseId: item.caseId,
			domain: item.domain,
			phase: item.phase,
			rating: item.rating,
			failureCategories: item.failureCategories,
			improvementTask: item.improvementTask,
			notes: item.notes,
			missingTools: item.missingTools ?? [],
			sourceEvidenceGaps: item.sourceEvidenceGaps ?? [],
			requiredTools: item.requiredTools ?? [],
			prompt: item.prompt,
			expectedTraits: item.expectedTraits ?? [],
			safetyCaveats: item.safetyCaveats ?? [],
			answerPreview: item.answerPreview,
			generalizationRegression: item.generalizationRegression,
			sourceBacklog: item.sourceBacklog
		}))
	};
}

function createIterationPlanMarkdown(plan) {
	const lines = [
		`# Scout local AI iteration plan: ${plan.planId}`,
		'',
		`Generated at: ${plan.generatedAt}`,
		'',
		'## Source backlogs',
		''
	];
	for (const backlog of plan.sourceBacklogs) {
		lines.push(
			`- \`${backlog.path}\`: ${backlog.belowFive} below 5, ${backlog.unrated} unrated, lane \`${backlog.evidenceLane}\``
		);
	}
	lines.push(
		'',
		'## Summary',
		'',
		`- Below-5 tasks: ${plan.summary.itemCount}`,
		`- Exact failed cases: ${plan.summary.exactRegressionCaseCount}`,
		`- Neighbor regression cases: ${plan.summary.neighborRegressionCaseCount}`,
		`- Regression cases: ${plan.summary.regressionCaseCount}`,
		`- Backlogs: ${plan.summary.backlogCount}`,
		'',
		'Owner layers:',
		''
	);
	for (const [owner, count] of Object.entries(plan.summary.byOwnerLayer)) lines.push(`- ${owner}: ${count}`);
	lines.push('', 'Failure categories:', '');
	for (const [category, count] of Object.entries(plan.summary.byFailureCategory)) lines.push(`- ${category}: ${count}`);
	if (Object.keys(plan.summary.bySourceEvidenceGap).length) {
		lines.push('', 'Source evidence gaps:', '');
		for (const [expectation, count] of Object.entries(plan.summary.bySourceEvidenceGap)) lines.push(`- ${expectation}: ${count}`);
	}
	if (plan.generalizationRegression.warnings.length) {
		lines.push('', 'Generalization warnings:', '');
		for (const warning of plan.generalizationRegression.warnings) lines.push(`- ${warning}`);
	}
	lines.push(
		'',
		'## Regression commands',
		'',
		'```sh',
		plan.rerunCommand,
		plan.fullSuiteCommand,
		'```',
		'',
		'## Guardrails',
		''
	);
	for (const guardrail of plan.guardrails) lines.push(`- ${guardrail}`);
	lines.push('', '## Workstreams', '');
	if (!plan.workstreams.length) {
		lines.push('No below-5 tasks remain in these backlogs. Move to strict device proof only after the full run is rated 5/5.', '');
		return `${lines.join('\n')}\n`;
	}

	for (const workstream of plan.workstreams) {
		lines.push(
			`### ${workstream.ownerLayer}`,
			'',
			workstream.recommendedFixScope,
			'',
			`- Items: ${workstream.itemCount}`,
			`- Exact failed cases: ${workstream.exactRegressionCaseIds.join(', ')}`,
			`- Neighbor regression cases: ${workstream.neighborRegressionCaseIds.join(', ') || 'none'}`,
			`- Regression cases: ${workstream.regressionCaseIds.join(', ')}`,
			`- Missing tools: ${workstream.missingTools.join(', ') || 'none'}`,
			`- Source evidence gaps: ${workstream.sourceEvidenceGaps.join(', ') || 'none'}`,
			'',
			'Likely fix targets:',
			...formatFixTargets(workstream.fixTargets),
			'',
			'Items:',
			''
		);
		for (const item of workstream.items) {
			lines.push(
				`#### ${item.caseId} - ${item.domain} - ${item.rating}/5`,
				'',
				`- Failure categories: ${item.failureCategories.join(', ')}`,
				`- Source backlog: \`${item.sourceBacklog}\``,
				`- Required tools: ${item.requiredTools.join(', ') || 'none'}`,
				`- Missing tools: ${item.missingTools.join(', ') || 'none'}`,
				`- Source evidence gaps: ${sourceEvidenceGapExpectations(item).join(', ') || 'none'}`,
				`- Neighbor regression cases: ${item.generalizationRegression.neighborCaseIds.join(', ') || 'none'}`,
				'',
				'Improvement task:',
				'',
				quoteBlock(item.improvementTask),
				'',
				'Prompt:',
				'',
				quoteBlock(item.prompt),
				''
			);
		}
	}

	return `${lines.join('\n')}\n`;
}

function createGeneralizationRegressionForItem(item, suite, neighborCaseLimit) {
	if (!suite) {
		return {
			caseId: item.caseId,
			found: false,
			neighborLimit: neighborCaseLimit,
			neighborCaseIds: [],
			allNeighborCaseIds: [],
			profiles: []
		};
	}
	return summarizeScoutLocalAiGeneralizationForCase(suite, item.caseId, {
		neighborLimit: neighborCaseLimit
	});
}

function createGeneralizationRegressionWarnings({ loaded, suite, suiteIdentity, suitePath }) {
	const warnings = [];
	if (!suite) {
		warnings.push(`Canonical suite was not loaded from ${relative(REPO_ROOT, suitePath)}; iteration plan includes exact failed cases only.`);
		return warnings;
	}
	const sourceSuiteHashes = new Set((loaded ?? []).map(({ backlog }) => backlog.suiteHash).filter(Boolean));
	if (suiteIdentity?.suiteHash && sourceSuiteHashes.size && !sourceSuiteHashes.has(suiteIdentity.suiteHash)) {
		warnings.push(`Canonical suite hash ${suiteIdentity.suiteHash} does not match source backlog hash(es): ${[...sourceSuiteHashes].join(', ')}.`);
	}
	return warnings;
}

function createRerunCommand(caseIds) {
	if (!caseIds.length) return 'npm run eval:scout-local-ai';
	return `npm run eval:scout-local-ai -- --id ${caseIds.join(',')}`;
}

function createFixTargets(ownerLayer, items) {
	const candidates = [];
	for (const item of OWNER_FIX_TARGETS[ownerLayer] ?? []) candidates.push(item);
	for (const expectation of uniqueExpectations(items)) {
		const parsed = parseToolExpectation(expectation);
		for (const item of TOOL_FIX_TARGETS[parsed.toolId] ?? []) candidates.push(item);
		if (parsed.sourceSkill) {
			for (const item of SOURCE_SKILL_FIX_TARGETS[parsed.sourceSkill] ?? []) candidates.push(item);
		}
	}
	return uniqueTargets(candidates);
}

function uniqueExpectations(items) {
	const values = [];
	for (const item of items) {
		values.push(...(item.requiredTools ?? []));
		values.push(...(item.missingTools ?? []));
		values.push(...sourceEvidenceGapExpectations(item));
	}
	return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))].sort();
}

function parseToolExpectation(expectation) {
	const [toolId, ...rest] = String(expectation).split(':');
	return {
		toolId,
		sourceSkill: rest.join(':').trim().toLowerCase()
	};
}

function uniqueTargets(targets) {
	const seen = new Set();
	const unique = [];
	for (const item of targets) {
		const key = `${item.label}\n${item.paths.join('\n')}`;
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(item);
	}
	return unique.sort((left, right) => left.label.localeCompare(right.label));
}

function formatFixTargets(targets) {
	if (!targets?.length) return ['- none inferred; inspect the prompt, answer, and recorded tool evidence manually.'];
	return targets.map((item) => `- ${item.label}: ${item.paths.map((path) => `\`${path}\``).join(', ')} - ${item.notes}`);
}

function compareItems(left, right) {
	const ratingDelta = left.rating - right.rating;
	if (ratingDelta) return ratingDelta;
	const safetyDelta = Number(right.failureCategories?.includes('unsafe-wording')) - Number(left.failureCategories?.includes('unsafe-wording'));
	if (safetyDelta) return safetyDelta;
	const missingDelta = (right.missingTools?.length ?? 0) - (left.missingTools?.length ?? 0);
	if (missingDelta) return missingDelta;
	return String(left.caseId).localeCompare(String(right.caseId));
}

function countBy(items, keyFor) {
	const counts = new Map();
	for (const item of items) {
		const key = keyFor(item);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts.entries()].sort(([left], [right]) => String(left).localeCompare(String(right)));
}

function sourceEvidenceGapExpectations(item) {
	return (item.sourceEvidenceGaps ?? [])
		.map((gap) => String(gap?.expectation ?? '').trim())
		.filter(Boolean);
}

function target(label, paths, notes) {
	return { label, paths, notes };
}

function groupBy(items, keyFor) {
	const groups = new Map();
	for (const item of items) {
		const key = keyFor(item);
		const group = groups.get(key) ?? [];
		group.push(item);
		groups.set(key, group);
	}
	return groups;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

async function readOptionalJson(path) {
	try {
		return JSON.parse(await readFile(path, 'utf8'));
	} catch {
		return null;
	}
}

function parsePositiveInteger(value, fallback) {
	if (value === undefined || value === null || value === '') return fallback;
	const number = Number(value);
	if (!Number.isInteger(number) || number < 0) {
		throw new Error(`Expected a non-negative integer, got ${value}.`);
	}
	return number;
}

function compactTimestamp(date) {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/u, 'Z');
}

function safeFileName(value) {
	return basename(String(value).replace(/[^A-Za-z0-9._-]/g, '-'));
}

function quoteBlock(value) {
	return String(value ?? '')
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}
