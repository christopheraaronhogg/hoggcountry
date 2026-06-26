export function scoutLocalAiSuiteHash(suite) {
	return `fnv1a32:${fnv1a32(stableJson(suite))}`;
}

export function scoutLocalAiSuiteIdentity(suite) {
	return {
		suiteVersion: String(suite?.version ?? ''),
		suiteHash: scoutLocalAiSuiteHash(suite)
	};
}

export function validateScoutLocalAiSuiteIdentity({ suite, run, review, errors }) {
	const expected = scoutLocalAiSuiteIdentity(suite);
	if (!String(suite?.version ?? '').trim()) {
		errors.push('suite.version is required for versioned eval proof.');
	}
	if (run) {
		if (run.suiteVersion !== expected.suiteVersion) {
			errors.push(`run.suiteVersion ${run.suiteVersion ?? '<missing>'} does not match ${expected.suiteVersion}.`);
		}
		if (run.suiteHash !== expected.suiteHash) {
			errors.push(`run.suiteHash ${run.suiteHash ?? '<missing>'} does not match ${expected.suiteHash}.`);
		}
	}
	if (review) {
		if (review.suiteVersion !== expected.suiteVersion) {
			errors.push(`review.suiteVersion ${review.suiteVersion ?? '<missing>'} does not match ${expected.suiteVersion}.`);
		}
		if (review.suiteHash !== expected.suiteHash) {
			errors.push(`review.suiteHash ${review.suiteHash ?? '<missing>'} does not match ${expected.suiteHash}.`);
		}
	}
	return expected;
}

function stableJson(value) {
	if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}

function fnv1a32(text) {
	let hash = 0x811c9dc5;
	for (let index = 0; index < text.length; index += 1) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}
