import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_CONTEXT_PACK } from './default-pack.ts';
import { defaultToolRegistry, runToolsFor } from './tool-registry.ts';

const FIXED_NOW = new Date('2026-06-20T12:00:00.000Z');

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
		'source_search',
		'upcoming_terrain',
		'weather_lookup'
	]);
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
