import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_CONTEXT_PACK } from './default-pack.ts';
import { defaultToolRegistry, runToolsFor } from './tool-registry.ts';
import type { ContextPack, TrailConditionsContext } from './types.ts';

const FIXED_NOW = new Date('2026-06-20T12:00:00.000Z');

function packWithConditions(conditions: TrailConditionsContext | null): ContextPack {
	return { ...DEFAULT_CONTEXT_PACK, conditions };
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
