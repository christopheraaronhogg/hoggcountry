import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_CONTEXT_PACK } from './default-pack.ts';
import { defaultToolRegistry, runToolsFor } from './tool-registry.ts';
import type { ContextPack, TrailConditionsContext, WaterReference } from './types.ts';

const FIXED_NOW = new Date('2026-06-20T12:00:00.000Z');

function packWithConditions(conditions: TrailConditionsContext | null): ContextPack {
	return { ...DEFAULT_CONTEXT_PACK, conditions };
}

function packWithWater(water: WaterReference[]): ContextPack {
	return {
		...DEFAULT_CONTEXT_PACK,
		hiker: { ...DEFAULT_CONTEXT_PACK.hiker, currentMile: 1530 },
		water
	};
}

function packWithTrailPlanningContext(): ContextPack {
	return {
		...DEFAULT_CONTEXT_PACK,
		hiker: { ...DEFAULT_CONTEXT_PACK.hiker, currentMile: 1530 },
		shelters: [
			{
				name: 'Riga Shelter',
				mile: 1534.4,
				capacity: 8,
				note: 'open-data mapped candidate; confirm current status and rules.'
			}
		],
		towns: [
			{
				name: 'Salisbury',
				mile: 1537.1,
				access: 'open-data road access candidate',
				servicesNote: 'Resupply, laundry, and lodging require same-day confirmation.'
			}
		],
		loadout: [
			{ name: 'Rain jacket', category: 'clothing', weightOz: 6, carried: true },
			{ name: 'First aid kit', category: 'safety', weightOz: 4, carried: true },
			{ name: 'Tent', category: 'shelter', weightOz: 20, carried: true }
		]
	};
}

test('defaultToolRegistry exposes the built-in Scout tool set', () => {
	const toolIds = defaultToolRegistry()
		.list()
		.map((tool) => tool.id)
		.sort();

	assert.deepEqual(toolIds, [
		'bible_search',
		'current_mile',
		'loadout_check',
		'next_shelter',
		'next_town',
		'next_water',
		'open_source_doc',
		'park_services',
		'source_search',
		'trail_conditions',
		'upcoming_terrain',
		'weather_lookup'
	]);
});

test('runToolsFor routes visitor-center/campground prompts to park_services', async () => {
	const records = await runToolsFor(
		'is there a visitor center or ranger station in this national park?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'park_services'));
});

test('runToolsFor routes closure/detour prompts to trail_conditions', async () => {
	const records = await runToolsFor(
		'is the trail closed or is there a detour ahead?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'trail_conditions'));
});

test('runToolsFor routes bear near camp prompts to conditions and safety guidance', async () => {
	const records = await runToolsFor(
		'How do I handle a bear near camp without making things worse?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'trail_conditions'));
	assert.ok(records.some((record) => record.toolId === 'next_shelter'));
	assert.ok(records.some((record) => record.toolId === 'source_search' && record.args.sourceSkill === 'safety'));
});

test('runToolsFor routes keyword prompts to matching built-in tools and source skills', async () => {
	const records = await runToolsFor(
		'water water shelter and weather ahead',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	const toolIds = records.map((record) => record.toolId);
	assert.equal(toolIds.filter((id) => id === 'next_water').length, 1);
	assert.equal(toolIds.filter((id) => id === 'next_shelter').length, 1);
	assert.equal(toolIds.filter((id) => id === 'weather_lookup').length, 1);
	assert.equal(toolIds.filter((id) => id === 'source_search').length, 3);
	assert.equal(toolIds.filter((id) => id === 'open_source_doc').length, 3);
	assert.ok(records.some((record) => record.summary.startsWith('Water guidance:')));
	assert.ok(records.some((record) => record.summary.startsWith('Shelter guidance:')));
	assert.ok(records.some((record) => record.summary.startsWith('Weather guidance:')));
	assert.ok(records.some((record) => record.summary.startsWith('Water guidance opened')));
	assert.ok(records.some((record) => record.summary.startsWith('Shelter guidance opened')));
	assert.ok(records.some((record) => record.summary.startsWith('Weather guidance opened')));
});

test('runToolsFor reads the water source skill beside next_water', async () => {
	const records = await runToolsFor(
		'what is my next reliable water source?',
		packWithWater([
			{
				name: 'Unnamed mapped stream',
				mile: 1531.9,
				reliability: 'thin',
				note: 'Mapped water candidate; confirm current flow.'
			}
		]),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const toolIds = records.map((record) => record.toolId);
	assert.deepEqual(toolIds.slice(0, 3), ['next_water', 'source_search', 'open_source_doc']);

	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'water'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Water guidance:/);
	assert.match(sourceSkill.summary, /Confirm mapped water before committing/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:pack-water-on-ridges'));
	assert.ok(sourceSkill.receipts.some((receipt) => receipt.id === 'field-guide:pack-water-on-ridges'));

	const openedSource = records.find(
		(record) => record.toolId === 'open_source_doc' && record.args.documentId === 'field-guide:pack-water-on-ridges'
	);
	assert.ok(openedSource);
	assert.match(openedSource.summary, /^Water guidance opened Confirm mapped water before committing:/);
	assert.match(openedSource.summary, /Mapped water candidates are planning prompts, not promises/);
	assert.ok(openedSource.receipts.some((receipt) => receipt.id === 'field-guide:pack-water-on-ridges'));
});

test('runToolsFor reads shelter source skill beside next_shelter', async () => {
	const records = await runToolsFor(
		'where should I sleep tonight, shelter or tent site?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const toolIds = records.map((record) => record.toolId);
	assert.ok(toolIds.includes('next_shelter'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'shelter'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Shelter guidance:/);
	assert.match(sourceSkill.summary, /Shelter and camping entries need rule checks/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:shelter-camping-discipline'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:shelter-camping-discipline' &&
				/Shelter guidance opened Shelter and camping entries need rule checks/.test(record.summary)
		)
	);
});

test('runToolsFor reads town source skill beside next_town', async () => {
	const records = await runToolsFor(
		'what is the next town for resupply and laundry?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const toolIds = records.map((record) => record.toolId);
	assert.ok(toolIds.includes('next_town'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'town'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Town guidance:/);
	assert.match(sourceSkill.summary, /Town stops are recovery first/);
	assert.match(sourceSkill.summary, /Zero and nero decisions should weigh body condition or injury, cached\/current weather, chores, budget, and the next section/);
	assert.match(sourceSkill.summary, /Default resupply rule: buy common food in town/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:town-stop-readiness'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:town-stop-readiness' &&
				/Town guidance opened Town stops are recovery first/.test(record.summary)
		)
	);
});

test('runToolsFor reads loadout source skill beside pack contents', async () => {
	const records = await runToolsFor(
		'what is in my pack contents, especially rain gear and first aid?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const toolIds = records.map((record) => record.toolId);
	assert.ok(toolIds.includes('loadout_check'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'loadout'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Loadout guidance:/);
	assert.match(sourceSkill.summary, /Read the pack contents before gear advice/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:loadout-contents-discipline'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:loadout-contents-discipline' &&
				/Loadout guidance opened Read the pack contents before gear advice/.test(record.summary)
		)
	);
});

test('runToolsFor opens food-on-the-move loadout discipline for hiking food prompts', async () => {
	const records = await runToolsFor(
		'How do I pack food so it is easy to eat while hiking and not just at camp?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'loadout_check'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'loadout'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /Food on the move keeps decisions steady/);
	assert.match(sourceSkill.summary, /split the day food before leaving camp/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:food-on-the-move-discipline'));
});

test('runToolsFor opens shakedown loadout discipline for shakedown prompts', async () => {
	const records = await runToolsFor(
		'What should my shakedown hike prove before I leave?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'loadout_check'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'loadout'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /sleep system, rain system, cooking and food rhythm/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:loadout-contents-discipline'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:loadout-contents-discipline' &&
				/shakedown hike should prove the sleep system/.test(record.summary)
		)
	);
});

test('runToolsFor reads safety source skill for bailout and injury prompts', async () => {
	const records = await runToolsFor(
		'is this a safe bailout if my knee hurts?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'safety'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Safety guidance:/);
	assert.match(sourceSkill.summary, /Safety decisions prefer current checks/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:safety-risk-discipline'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:safety-risk-discipline' &&
				/Safety guidance opened Safety decisions prefer current checks/.test(record.summary)
		)
	);
});

test('runToolsFor reads safety source skill for first-aid blister prompts', async () => {
	const records = await runToolsFor(
		'What should be in my first-aid kit for blisters and normal trail problems?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'loadout_check'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'safety'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Safety guidance:/);
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.sourceSkill === 'safety' &&
				record.toolId === 'open_source_doc'
		)
	);
});

test('runToolsFor does not route training prompts to rain/weather', async () => {
	const records = await runToolsFor(
		'How should I train with a bad knee before the first week of the AT?',
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'source_search' && record.args.sourceSkill === 'safety'));
	assert.ok(!records.some((record) => record.toolId === 'weather_lookup'));
	assert.ok(!records.some((record) => record.toolId === 'source_search' && record.args.sourceSkill === 'weather'));
});

test('runToolsFor routes thunderstorm prompts to weather lookup and weather source skill', async () => {
	const records = await runToolsFor(
		"Thunderstorms are possible this afternoon. What should I do with today's hike?",
		packWithTrailPlanningContext(),
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.ok(records.some((record) => record.toolId === 'weather_lookup'));
	assert.ok(records.some((record) => record.toolId === 'upcoming_terrain'));
	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'weather'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Weather guidance:/);
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.sourceSkill === 'weather' &&
				record.toolId === 'open_source_doc'
		)
	);
});

test('runToolsFor opens offline document safety discipline for day-one document prompts', async () => {
	const records = await runToolsFor(
		'What documents and information should I keep saved offline before day one?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'safety'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Safety guidance:/);
	assert.match(sourceSkill.summary, /Offline personal documents stay separate from Scout chat/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:offline-personal-documents'));
	assert.ok(
		records.some(
				(record) =>
					record.toolId === 'open_source_doc' &&
					record.args.documentId === 'field-guide:offline-personal-documents' &&
				/save ID, insurance, emergency contacts/i.test(record.summary)
		)
	);
});

test('runToolsFor opens family check-in safety discipline for missed-contact prompts', async () => {
	const records = await runToolsFor(
		'What should I tell family about check-ins and what they should do if I miss one?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'safety'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Safety guidance:/);
	assert.match(sourceSkill.summary, /Family check-ins need cadence and escalation rules/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:family-checkin-discipline'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:family-checkin-discipline' &&
				/Do not promise live location is always available/.test(record.summary)
		)
	);
});

test('runToolsFor reads pretrip source skill for Springer preparation prompts', async () => {
	const records = await runToolsFor(
		'I have 8 weeks before Springer. What should I focus on first for trail prep?',
		{
			...DEFAULT_CONTEXT_PACK,
			guideExcerpts: [
				...DEFAULT_CONTEXT_PACK.guideExcerpts,
				{
					id: 'eval-pretrip-discipline',
					title: 'Pretrip and first-week discipline',
					body: 'Pretrail answers should turn preparation into a short first-week plan. Include loaded shakedown walks, foot care and blister practice, gear/loadout checks, water treatment habits, conservative early mileage, field pack refresh, local AI model download, offline maps/docs, airplane-mode rehearsal, and a separate emergency communication plan.',
					tags: ['pretrip', 'prep', 'shakedown', 'foot-care', 'offline', 'local-ai', 'field-pack'],
					citation: 'Dad Local AI eval source skill: pretrip'
				}
			]
		},
		defaultToolRegistry(),
		FIXED_NOW
	);

	const sourceSkill = records.find(
		(record) => record.toolId === 'source_search' && record.args.sourceSkill === 'pretrip'
	);
	assert.ok(sourceSkill);
	assert.match(sourceSkill.summary, /^Pretrip guidance:/);
	assert.match(sourceSkill.summary, /loaded shakedown walks/);
	assert.ok(sourceSkill.sourceDocumentIds?.includes('field-guide:eval-pretrip-discipline'));
	assert.ok(
		records.some(
			(record) =>
				record.toolId === 'open_source_doc' &&
				record.args.documentId === 'field-guide:eval-pretrip-discipline' &&
				/Pretrip guidance opened Pretrip and first-week discipline/.test(record.summary)
		)
	);
});

test('next_water answers plain water prompts with nearest water plus better-known follow-up', async () => {
	const records = await runToolsFor(
		'where is the next water?',
		packWithWater([
			{
				name: 'Unnamed mapped stream',
				mile: 1531.9,
				reliability: 'thin',
				note: 'Mapped water candidate; confirm current flow.'
			},
			{
				name: 'Riga Shelter',
				mile: 1534.4,
				reliability: 'seasonal',
				note: 'AWOL-listed spring; confirm current flow.'
			}
		]),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const water = records.find((record) => record.toolId === 'next_water');
	assert.ok(water);
	assert.match(water.summary, /Next loaded water: Unnamed mapped stream at mile 1531\.9 \(1\.9 mi ahead, thin\)/);
	assert.match(water.summary, /Next better-known source after that: Riga Shelter at mile 1534\.4 \(4\.4 mi ahead, seasonal\)/);
});

test('next_water reliable prompts show seasonal source and closer mapped candidate when no reliable source is loaded', async () => {
	const records = await runToolsFor(
		'what is my next reliable water source?',
		packWithWater([
			{
				name: 'Unnamed mapped stream',
				mile: 1531.9,
				reliability: 'thin',
				note: 'Mapped water candidate; confirm current flow.'
			},
			{
				name: 'Riga Shelter',
				mile: 1534.4,
				reliability: 'seasonal',
				note: 'AWOL-listed spring; confirm current flow.'
			}
		]),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const water = records.find((record) => record.toolId === 'next_water');
	assert.ok(water);
	assert.equal(water.args.reliabilityPreference, 'reliable');
	assert.match(water.summary, /^Best loaded water source:/);
	assert.match(water.summary, /No reliable water source is loaded ahead/);
	assert.match(water.summary, /Best loaded water source: Riga Shelter at mile 1534\.4 \(4\.4 mi ahead, seasonal\)/);
	assert.match(water.summary, /Closer mapped candidate before that: Unnamed mapped stream at mile 1531\.9 \(1\.9 mi ahead, thin\)/);
});

test('next_water reliable prompts preserve the next reliable source and mention closer candidates', async () => {
	const records = await runToolsFor(
		'where is confirmed water I can count on?',
		packWithWater([
			{ name: 'Unnamed mapped stream', mile: 1531.9, reliability: 'thin' },
			{ name: 'Bull Spring', mile: 1538.2, reliability: 'reliable' }
		]),
		defaultToolRegistry(),
		FIXED_NOW
	);

	const water = records.find((record) => record.toolId === 'next_water');
	assert.ok(water);
	assert.match(water.summary, /Next reliable water loaded: Bull Spring at mile 1538\.2 \(8\.2 mi ahead, reliable\)/);
	assert.match(water.summary, /Closer unconfirmed water before that: Unnamed mapped stream at mile 1531\.9 \(1\.9 mi ahead, thin\)/);
});

test('trail_conditions surfaces active closures with a high-severity safety flag', async () => {
	const tool = defaultToolRegistry().get('trail_conditions');
	assert.ok(tool);
	const conditions: TrailConditionsContext = {
		fetchedAt: '2026-06-20T11:00:00.000Z',
		note: '1 active official trail condition for TN from NPS.',
		items: [
			{
				source: 'nps',
				sourceLabel: 'Great Smoky Mountains NP',
				category: 'closure',
				title: 'Newfound Gap Road closed by rockslide',
				summary: 'US-441 through the park is closed; no vehicle access.',
				url: 'https://www.nps.gov/grsm/closure',
				area: 'Great Smoky Mountains NP',
				severity: 'high',
				publishedAt: '2026-06-19T00:00:00.000Z'
			}
		]
	};
	const record = await tool.run({}, { pack: packWithConditions(conditions), now: FIXED_NOW });
	assert.match(record.summary, /CLOSURE/);
	assert.ok(record.receipts.some((receipt) => receipt.id === 'official:trail-conditions'));
	assert.ok(record.safetyFlags?.some((flag) => flag.id === 'trail-closure-active'));
});

test('trail_conditions returns the honest "none active" note without inventing safety', async () => {
	const tool = defaultToolRegistry().get('trail_conditions');
	assert.ok(tool);
	const conditions: TrailConditionsContext = {
		fetchedAt: '2026-06-20T11:00:00.000Z',
		note: 'No active official closures were found near this mile at pack time; closures change fast, so still verify.',
		items: []
	};
	const record = await tool.run({}, { pack: packWithConditions(conditions), now: FIXED_NOW });
	assert.match(record.summary, /No active official closures/);
	assert.ok((record.confirmations ?? []).length > 0);
});

test('runToolsFor recognizes salvation phrasing as scripture search', async () => {
	const records = await runToolsFor(
		'what must I do to be saved?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.equal(records[0]?.toolId, 'bible_search');
});

test('runToolsFor reads current-mile profile guidance for own-mile setup prompts', async () => {
	const records = await runToolsFor(
		"How do I make Scout follow my own trail mile instead of someone else's?",
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.deepEqual(
		records.map((record) => record.toolId),
		['current_mile', 'source_search']
	);
	const sourceSearch = records.find((record) => record.toolId === 'source_search');
	assert.ok(sourceSearch);
	assert.match(sourceSearch.summary, /Current mile and profile discipline/);
	assert.ok(sourceSearch.sourceDocumentIds?.includes('field-guide:current-mile-profile-discipline'));
});

test('runToolsFor falls back to current mile plus source search for unmatched prompts', async () => {
	const records = await runToolsFor(
		'tell me something useful about trail mindset',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.deepEqual(
		records.map((record) => record.toolId),
		['current_mile', 'source_search']
	);
});
