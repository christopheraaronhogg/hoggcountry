export const SCOUT_LOCAL_AI_TASK_CLASS_AREAS = [
	{
		id: 'find-next-water',
		label: 'Find the next water',
		minCases: 8,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'water', 'next_water') ||
			/\bwater\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'find-next-town-resupply',
		label: 'Find the next town or resupply',
		minCases: 8,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'town', 'next_town') ||
			/\b(town|resupply|hostel|laundry|shower|charge|post office|food)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'explain-today-difficulty',
		label: "Explain today's difficulty",
		minCases: 8,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'terrain', 'upcoming_terrain') ||
			/\b(hard|difficulty|terrain|climb|descent|elevation|pace|miles today|today)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'weather-tomorrow-or-stale',
		label: 'Answer weather timing and stale forecast questions',
		minCases: 8,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'weather', 'weather_lookup') ||
			/\b(weather|forecast|tomorrow|storm|rain|cold|heat|ridge|stale)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'camp-or-push-decision',
		label: 'Choose camp, shelter, stop, or push decisions',
		minCases: 8,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'shelter', 'next_shelter') ||
			/\b(shelter|camp|tent|tonight|push|stop|where should i sleep|site)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'safety-escalation',
		label: 'Handle safety and escalation decisions',
		minCases: 10,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'safety', 'source_search:safety') ||
			hasRequiredTool(testCase, 'open_source_doc:safety') ||
			/\b(safety|unsafe|emergency|hypothermia|heat|injury|lightning|bear|lost|escalate|911)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'offline-cache-honesty',
		label: 'Answer honestly from offline or cached data',
		minCases: 8,
		matches: (testCase) => /\b(offline|airplane|download|cell service|signal|field pack|cache|cached|stale|local ai model|model download|share sheet|copy)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'source-backed-doc-answer',
		label: 'Search and open source documents before answering',
		minCases: 10,
		matches: (testCase) => hasRequiredTool(testCase, 'source_search') ||
			hasRequiredTool(testCase, 'open_source_doc') ||
			(testCase?.requiredTools ?? []).some((toolId) => toolId.startsWith('source_search') || toolId.startsWith('open_source_doc'))
	},
	{
		id: 'summarize-saved-user-docs',
		label: 'Summarize saved or uploaded user documents',
		minCases: 2,
		matches: (testCase) => hasRequiredTool(testCase, 'source_search:document vault') &&
			/\b(summarize|what did i save|saved|uploaded|notes?|source summaries|document vault|personal documents|user documents)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'draft-update-vault-doc',
		label: 'Draft or update user-owned vault documents',
		minCases: 2,
		matches: (testCase) => isDocumentWritingCase(testCase) &&
			/\b(draft|write|update|save|create|revise|checklist|note)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'compare-options',
		label: 'Compare options and explain tradeoffs',
		minCases: 6,
		matches: (testCase) => /\b(compare|choose|which|option|instead|versus|vs\.?|better|trust)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'missing-data-honesty',
		label: 'Say when data is missing, stale, or uncertain',
		minCases: 8,
		matches: (testCase) => /\b(missing|unclear|does not know|don.?t know|stale|failed|fail|wrong|dry|unverified|candidate|not guaranteed|unknown|mismatch|which should i trust)\b/iu.test(caseBodyText(testCase))
	}
];

export function summarizeScoutLocalAiTaskClassCoverage(suite) {
	const cases = Array.isArray(suite?.cases) ? suite.cases : [];
	const areas = SCOUT_LOCAL_AI_TASK_CLASS_AREAS.map((area) => {
		const matching = cases.filter((testCase) => area.matches(testCase));
		return {
			id: area.id,
			label: area.label,
			minCases: area.minCases,
			count: matching.length,
			ok: matching.length >= area.minCases,
			caseIds: matching.map((testCase) => testCase.id).filter(Boolean)
		};
	});
	const errors = areas
		.filter((area) => !area.ok)
		.map((area) => `${area.label} task-class coverage needs at least ${area.minCases} case(s), got ${area.count}.`);
	return {
		ok: errors.length === 0,
		areas,
		errors
	};
}

function hasDomainTagOrTool(testCase, domainOrTag, toolId) {
	return testCase?.domain === domainOrTag ||
		hasImprovementTag(testCase, domainOrTag) ||
		hasRequiredTool(testCase, toolId);
}

function hasImprovementTag(testCase, tag) {
	return (testCase?.improvementTags ?? []).includes(tag);
}

function hasRequiredTool(testCase, toolId) {
	return (testCase?.requiredTools ?? []).includes(toolId);
}

function isDocumentWritingCase(testCase) {
	return testCase?.documentTask === 'writing' || testCase?.documentTask === 'reading-writing';
}

function caseBodyText(testCase) {
	return [
		testCase?.phase,
		testCase?.domain,
		testCase?.documentTask,
		testCase?.prompt,
		...(testCase?.requiredTools ?? []),
		...(testCase?.expectedTraits ?? []),
		...(testCase?.safetyCaveats ?? []),
		...(testCase?.improvementTags ?? [])
	].join(' ').toLowerCase();
}
