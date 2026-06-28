export const SCOUT_LOCAL_AI_OBJECTIVE_COVERAGE_AREAS = [
	{
		id: 'trail-prep',
		label: 'Trail prep and setup',
		minCases: 25,
		matches: (testCase) => testCase.phase === 'pre-trail'
	},
	{
		id: 'daily-hiking-decisions',
		label: 'Daily hiking decisions',
		minCases: 45,
		matches: (testCase) => testCase.phase === 'on-trail' && /\b(should i|what should i|how do i|where should|what if|decide|plan|push|stop|adjust|choose|today|tonight|current mile)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'water',
		label: 'Water decisions',
		minCases: 10,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'water', 'next_water')
	},
	{
		id: 'shelter',
		label: 'Shelter and camping decisions',
		minCases: 10,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'shelter', 'next_shelter')
	},
	{
		id: 'weather',
		label: 'Weather decisions',
		minCases: 10,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'weather', 'weather_lookup')
	},
	{
		id: 'resupply',
		label: 'Resupply, town, and recovery',
		minCases: 10,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'town', 'next_town') || /\b(resupply|food|mail|town|hostel|zero|nero|laundry|shower|charge|download)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'safety',
		label: 'Safety and escalation',
		minCases: 20,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'safety', 'source_search:safety') || hasRequiredTool(testCase, 'open_source_doc:safety')
	},
	{
		id: 'gear',
		label: 'Gear and loadout',
		minCases: 10,
		matches: (testCase) => hasDomainTagOrTool(testCase, 'gear', 'loadout_check') || hasImprovementTag(testCase, 'loadout') || /\b(pack|gear|clothes|battery|first-aid|camp shoes|filter)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'bible-spiritual-support',
		label: 'Bible and spiritual support',
		minCases: 5,
		matches: (testCase) => hasRequiredTool(testCase, 'bible_search') || /\b(bible|scripture|pray|john 3:16|salvation|what must i do to be saved)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'offline-local-ai-use',
		label: 'Offline, model, and stale-data use',
		minCases: 10,
		matches: (testCase) => /\b(offline|airplane|download|cell service|signal|field pack|cache|stale|screenshot|local ai model|model download|share sheet|copy)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'document-vault-user-docs',
		label: 'Document-vault and user-document grounding',
		minCases: 2,
		matches: (testCase) => hasRequiredTool(testCase, 'source_search:document vault') && hasRequiredTool(testCase, 'open_source_doc:document vault')
	},
	{
		id: 'document-writing-user-docs',
		label: 'Document drafting and user-owned document updates',
		minCases: 2,
		matches: (testCase) => hasRequiredTool(testCase, 'source_search:document vault') &&
			hasRequiredTool(testCase, 'open_source_doc:document vault') &&
			(hasImprovementTag(testCase, 'document-writing') || /\b(draft|write|update|save|create|revise)\b/iu.test(caseBodyText(testCase))) &&
			/\b(reviewable|confirmation|overwrite|document vault|user-owned|private values|open questions)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'domain-transfer-readiness',
		label: 'Reusable document-assistant transfer readiness',
		minCases: 2,
		matches: (testCase) => hasRequiredTool(testCase, 'source_search:document vault') &&
			/\b(document vault|saved docs?|uploaded notes?|source summaries|personal documents|user documents|privacy boundary|private numbers)\b/iu.test(caseBodyText(testCase))
	},
	{
		id: 'confusing-edge-cases',
		label: 'Confusing edge cases and recovery',
		minCases: 10,
		matches: (testCase) => /\b(what if|wrong|does not know|stale|failed|fail|full|dry|off trail|gps jumps|confusing|unclear|instead|last question|mismatch|which should i trust|model download failed|says the spring is dry)\b/iu.test(caseBodyText(testCase))
	}
];

export function summarizeScoutLocalAiSuiteCoverage(suite) {
	const cases = Array.isArray(suite?.cases) ? suite.cases : [];
	const areas = SCOUT_LOCAL_AI_OBJECTIVE_COVERAGE_AREAS.map((area) => {
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
		.map((area) => `${area.label} coverage needs at least ${area.minCases} case(s), got ${area.count}.`);
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

function caseBodyText(testCase) {
	return [
		testCase?.phase,
		testCase?.prompt,
		...(testCase?.requiredTools ?? []),
		...(testCase?.expectedTraits ?? []),
		...(testCase?.safetyCaveats ?? []),
		...(testCase?.improvementTags ?? [])
	].join(' ').toLowerCase();
}
