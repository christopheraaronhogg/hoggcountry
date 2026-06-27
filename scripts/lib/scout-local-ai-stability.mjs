export function scoutLocalAiStabilityRunFingerprint(run) {
	return stableJson({
		generatedAt: run.generatedAt ?? null,
		evidenceLane: run.evidenceLane ?? null,
		suiteId: run.suiteId ?? null,
		suiteVersion: run.suiteVersion ?? null,
		suiteHash: run.suiteHash ?? null,
		runContext: {
			surface: run.runContext?.surface ?? null,
			scoutLane: run.runContext?.scoutLane ?? null,
			modelId: run.runContext?.modelId ?? null,
			runtimeConfigured: run.runContext?.runtimeConfigured ?? null,
			native: {
				platform: run.runContext?.native?.platform ?? null,
				isNativePlatform: run.runContext?.native?.isNativePlatform ?? null
			},
			app: {
				id: run.runContext?.app?.id ?? null,
				version: run.runContext?.app?.version ?? null,
				build: run.runContext?.app?.build ?? null
			},
			installSource: {
				type: run.runContext?.installSource?.type ?? null,
				debugBuild: run.runContext?.installSource?.debugBuild ?? null,
				buildConfiguration: run.runContext?.installSource?.buildConfiguration ?? null
			}
		},
		caseCount: run.caseCount ?? null,
		totalSuiteCases: run.totalSuiteCases ?? null,
		firstResultGeneratedAt: run.results?.[0]?.generatedAt ?? null,
		lastResultGeneratedAt: run.results?.at?.(-1)?.generatedAt ?? run.results?.[run.results.length - 1]?.generatedAt ?? null
	});
}

function stableJson(value) {
	if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}
