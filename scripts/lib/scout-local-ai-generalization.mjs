export const SCOUT_LOCAL_AI_GENERALIZATION_PROFILES = [
	{
		id: 'next-water-decision',
		label: 'Next-water decisions generalize beyond one wording',
		minCases: 8,
		matches: (testCase) => hasDomain(testCase, 'water') || hasRequiredTool(testCase, 'next_water'),
		promptFrames: [
			{
				id: 'distance-ahead',
				label: 'asks what water is ahead or where the next source is',
				minCases: 1,
				matches: (testCase) => /\b(what water is ahead|next (?:reliable )?water|water source|source is marked)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'carry-or-skip',
				label: 'turns water data into carry, skip, or camel-up decisions',
				minCases: 2,
				matches: (testCase) => /\b(skip|carry|camel up|dry stretch|make the next|low on daylight)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'reliability-or-conflict',
				label: 'handles seasonal, dry, conflicting, or missing-flow evidence',
				minCases: 2,
				matches: (testCase) => /\b(seasonal|dry|current water flow|does not know|reliable|which should i trust|farout|listed)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'treatment-or-gear',
				label: 'covers treatment, filter, freeze, or water-gear problems',
				minCases: 2,
				matches: (testCase) => /\b(treat|questionable water|filter|freezes|water filter)\b/iu.test(caseBodyText(testCase))
			}
		]
	},
	{
		id: 'town-resupply-decision',
		label: 'Town and resupply decisions generalize beyond one wording',
		minCases: 8,
		matches: (testCase) => hasDomain(testCase, 'town') || hasRequiredTool(testCase, 'next_town'),
		promptFrames: [
			{
				id: 'arrival-recovery',
				label: 'orders town recovery or hostel chores',
				minCases: 2,
				matches: (testCase) => /\b(recover|town day|laundry|shower|foot care|hostel stop|feel human)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'food-carry-resupply',
				label: 'chooses food carry, resupply, mail, or box strategy',
				minCases: 3,
				matches: (testCase) => /\b(food|resupply|ship a box|mail|buy|carrying too much)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'availability-contingency',
				label: 'handles missing services, full lodging, or availability uncertainty',
				minCases: 1,
				matches: (testCase) => /\b(full|backup|availability|guarantee|public options|calling ahead|not guarantee)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'offline-before-leaving-town',
				label: 'uses town time to refresh offline data or update Scout',
				minCases: 2,
				matches: (testCase) => /\b(charge|refresh|download|before leaving town|lose service|update in scout|town-exit)\b/iu.test(caseBodyText(testCase))
			}
		]
	},
	{
		id: 'today-difficulty-decision',
		label: "Today's difficulty decisions generalize across terrain, weather, body, and pace",
		minCases: 8,
		matches: (testCase) => hasRequiredTool(testCase, 'upcoming_terrain') ||
			/\b(difficulty|hard|terrain|climb|ridge|pace|mileage|today|nero|push)\b/iu.test(caseBodyText(testCase)),
		promptFrames: [
			{
				id: 'terrain-feature',
				label: 'uses terrain, climb, ridge, elevation, or descent context',
				minCases: 3,
				matches: (testCase) => /\b(terrain|climb|ridge|elevation|descent|big climb)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'pace-or-mileage',
				label: 'converts conditions into pace, mileage, push, stop, or nero decisions',
				minCases: 3,
				matches: (testCase) => /\b(pace|mileage|miles|push|stop|nero|overdoing|zero)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'weather-interaction',
				label: 'includes weather as a difficulty multiplier',
				minCases: 3,
				matches: (testCase) => /\b(weather|storm|rain|heat|cold|wind|lightning|forecast)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'body-safety-limit',
				label: 'protects body condition instead of optimizing only for miles',
				minCases: 2,
				matches: (testCase) => /\b(tired|fatigue|knee|injury|pain|feet|body|too tired|overdoing)\b/iu.test(caseBodyText(testCase))
			}
		]
	},
	{
		id: 'offline-document-agent',
		label: 'Offline document-agent behavior generalizes across reading and writing',
		minCases: 8,
		matches: (testCase) => hasRequiredTool(testCase, 'source_search:document vault') ||
			isDocumentWritingCase(testCase) ||
			/\b(offline|airplane|field pack|cache|saved docs?|document vault|local ai model|model download|download)\b/iu.test(caseBodyText(testCase)),
		promptFrames: [
			{
				id: 'offline-readiness',
				label: 'tests offline, cache, airplane-mode, field-pack, or model readiness',
				minCases: 5,
				matches: (testCase) => /\b(offline|airplane|field pack|cache|cell service|signal|local ai model|model download|download)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'vault-reading',
				label: 'requires searching/opening saved or user-vault documents',
				minCases: 3,
				matches: (testCase) => hasRequiredTool(testCase, 'source_search:document vault') ||
					hasRequiredTool(testCase, 'open_source_doc:document vault') ||
					/\b(document vault|saved docs?|uploaded|source summaries|user documents|personal documents)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'vault-writing',
				label: 'drafts checklists, notes, updates, or saved decisions',
				minCases: 3,
				matches: (testCase) => isDocumentWritingCase(testCase) &&
					/\b(draft|checklist|note|update|saved decision|reviewable)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'confirmation-privacy',
				label: 'keeps saves explicit, private, and recoverable',
				minCases: 3,
				matches: (testCase) => /\b(confirm|confirmation|overwrite|private|placeholder|reviewable|recoverable|versioned)\b/iu.test(caseBodyText(testCase))
			}
		]
	},
	{
		id: 'safety-escalation',
		label: 'Safety escalation generalizes across injury, environment, people, and comms',
		minCases: 10,
		matches: (testCase) => hasDomain(testCase, 'safety') ||
			hasRequiredTool(testCase, 'source_search:safety') ||
			hasRequiredTool(testCase, 'open_source_doc:safety'),
		promptFrames: [
			{
				id: 'injury-or-symptoms',
				label: 'handles injury, symptoms, medical boundary, or body-condition questions',
				minCases: 4,
				matches: (testCase) => /\b(ankle|dizzy|medical|symptoms|hypothermia|injury|knee|pain|fatigue|heat)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'help-or-communication',
				label: 'covers SOS, missed check-ins, signal loss, overdue partner, or support-circle escalation',
				minCases: 3,
				matches: (testCase) => /\b(sos|contact|support circle|signal|help soon|overdue|check-ins?|family|911|escalation)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'environmental-threat',
				label: 'covers lightning, fire, smoke, bear, heat, cold, or storm threats',
				minCases: 5,
				matches: (testCase) => /\b(lightning|fire|smoke|bear|heat|cold|storm|weather|hypothermia|ridge)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'human-or-location-risk',
				label: 'handles unsafe people, shelter risk, off-trail, or confusing-location cases',
				minCases: 3,
				matches: (testCase) => /\b(unsafe around someone|shelter|off trail|wrong spot|confusing junction|blaze|after dark|full)\b/iu.test(caseBodyText(testCase))
			}
		]
	},
	{
		id: 'missing-data-honesty',
		label: 'Missing-data honesty generalizes beyond a single stale-data prompt',
		minCases: 8,
		matches: (testCase) => /\b(missing|unclear|does not know|don.?t know|stale|failed|fail|wrong|dry|unverified|candidate|not guaranteed|unknown|mismatch|which should i trust|current flow)\b/iu.test(caseBodyText(testCase)),
		promptFrames: [
			{
				id: 'stale-cache',
				label: 'labels stale cache, weather, or field-pack freshness limits',
				minCases: 3,
				matches: (testCase) => /\b(stale|cache|cached|field pack|freshness|verify live)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'conflicting-source',
				label: 'handles conflicting tools, app data, guidebooks, trail signs, or user reports',
				minCases: 2,
				matches: (testCase) => /\b(which should i trust|farout|mismatch|does not match|guidebook|trail sign|wrong)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'failure-or-unavailable',
				label: 'handles failed model/downloads, full lodging, dry sources, or unavailable services',
				minCases: 3,
				matches: (testCase) => /\b(failed|fail|full|dry|unavailable|not guarantee|not guaranteed|does not know current)\b/iu.test(caseBodyText(testCase))
			},
			{
				id: 'safe-recovery-action',
				label: 'turns uncertainty into a safer next action instead of fake certainty',
				minCases: 3,
				matches: (testCase) => /\b(what should i do|what should scout say|trust|verify|ask|confirm|fallback|backup|safe)\b/iu.test(caseBodyText(testCase))
			}
		]
	}
];

export function summarizeScoutLocalAiGeneralizationCoverage(suite) {
	const cases = Array.isArray(suite?.cases) ? suite.cases : [];
	const profiles = SCOUT_LOCAL_AI_GENERALIZATION_PROFILES.map((profile) => {
		const matchingCases = cases.filter((testCase) => profile.matches(testCase));
		const promptFrames = profile.promptFrames.map((frame) => {
			const frameCases = matchingCases.filter((testCase) => frame.matches(testCase));
			return {
				id: frame.id,
				label: frame.label,
				minCases: frame.minCases,
				count: frameCases.length,
				ok: frameCases.length >= frame.minCases,
				caseIds: frameCases.map((testCase) => testCase.id).filter(Boolean)
			};
		});
		const errors = [];
		if (matchingCases.length < profile.minCases) {
			errors.push(`${profile.label} needs at least ${profile.minCases} neighboring case(s), got ${matchingCases.length}.`);
		}
		for (const frame of promptFrames) {
			if (!frame.ok) {
				errors.push(`${profile.label} frame "${frame.label}" needs at least ${frame.minCases} case(s), got ${frame.count}.`);
			}
		}
		return {
			id: profile.id,
			label: profile.label,
			minCases: profile.minCases,
			count: matchingCases.length,
			ok: errors.length === 0,
			caseIds: matchingCases.map((testCase) => testCase.id).filter(Boolean),
			promptFrames,
			errors
		};
	});
	const errors = profiles.flatMap((profile) => profile.errors);
	return {
		ok: errors.length === 0,
		profiles,
		errors
	};
}

export function summarizeScoutLocalAiGeneralizationForCase(suite, caseId, { neighborLimit = 6 } = {}) {
	const cases = Array.isArray(suite?.cases) ? suite.cases : [];
	const target = cases.find((testCase) => testCase.id === caseId);
	if (!target) {
		return {
			caseId,
			found: false,
			neighborLimit,
			neighborCaseIds: [],
			allNeighborCaseIds: [],
			profiles: []
		};
	}

	const profileMatches = [];
	const allNeighborCaseIds = [];
	const seenNeighborIds = new Set();
	for (const profile of SCOUT_LOCAL_AI_GENERALIZATION_PROFILES) {
		if (!profile.matches(target)) continue;
		const profileCases = cases.filter((testCase) => profile.matches(testCase));
		const frameMatches = [];
		for (const frame of profile.promptFrames) {
			if (!frame.matches(target)) continue;
			const frameCaseIds = profileCases
				.filter((testCase) => frame.matches(testCase))
				.map((testCase) => testCase.id)
				.filter(Boolean);
			const frameNeighborCaseIds = frameCaseIds.filter((id) => id !== caseId);
			for (const id of frameNeighborCaseIds) {
				if (seenNeighborIds.has(id)) continue;
				seenNeighborIds.add(id);
				allNeighborCaseIds.push(id);
			}
			frameMatches.push({
				id: frame.id,
				label: frame.label,
				caseIds: frameCaseIds,
				neighborCaseIds: frameNeighborCaseIds
			});
		}
		if (frameMatches.length) {
			profileMatches.push({
				id: profile.id,
				label: profile.label,
				frames: frameMatches
			});
		}
	}

	return {
		caseId,
		found: true,
		neighborLimit,
		neighborCaseIds: allNeighborCaseIds.slice(0, neighborLimit),
		allNeighborCaseIds,
		profiles: profileMatches
	};
}

function hasDomain(testCase, domain) {
	return testCase?.domain === domain;
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
		testCase?.documentTask,
		testCase?.prompt,
		...(testCase?.requiredTools ?? []),
		...(testCase?.expectedTraits ?? []),
		...(testCase?.safetyCaveats ?? []),
		...(testCase?.improvementTags ?? [])
	].join(' ').toLowerCase();
}
