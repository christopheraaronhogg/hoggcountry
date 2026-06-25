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

test('runToolsFor routes keyword prompts to the matching built-in tools once', async () => {
	const records = await runToolsFor(
		'water water shelter and weather ahead',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.deepEqual(
		records.map((record) => record.toolId),
		['next_water', 'next_shelter', 'weather_lookup']
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

test('runToolsFor falls back to current mile plus source search for unmatched prompts', async () => {
	const records = await runToolsFor(
		'what should I keep in mind tonight?',
		DEFAULT_CONTEXT_PACK,
		defaultToolRegistry(),
		FIXED_NOW
	);

	assert.deepEqual(
		records.map((record) => record.toolId),
		['current_mile', 'source_search']
	);
});
