export function summarizeRunSourceEvidence(results) {
	const missingSourceEvidenceCounts = {};
	let sourceEvidenceComplete = 0;

	for (const result of results ?? []) {
		const missing = sourceEvidenceProblems(
			result.case?.requiredTools ?? result.toolExpectations?.required ?? [],
			result.toolInvocations ?? []
		);
		if (!missing.length) sourceEvidenceComplete += 1;
		for (const problem of missing) {
			missingSourceEvidenceCounts[problem.expectation] = (missingSourceEvidenceCounts[problem.expectation] ?? 0) + 1;
		}
	}

	return {
		sourceEvidenceComplete,
		missingSourceEvidenceCases: Math.max(0, (results?.length ?? 0) - sourceEvidenceComplete),
		missingSourceEvidenceCounts
	};
}

export function sourceEvidenceProblems(requiredTools, invocations) {
	const problems = [];
	for (const expectation of requiredTools ?? []) {
		const [, sourceSkill] = String(expectation).split(':');
		if (!sourceSkill) continue;
		const matching = (invocations ?? []).find((record) => matchesToolExpectation(expectation, record));
		if (!matching) continue;
		if (!hasSourceEvidence(matching)) {
			problems.push({
				expectation,
				message: `source-backed required tool ${expectation} must record at least one receipt or sourceDocumentId for final proof.`
			});
		}
	}
	return problems;
}

export function matchesToolExpectation(expectation, record) {
	const [toolId, sourceSkill] = String(expectation).split(':');
	if (record?.toolId !== toolId) return false;
	if (!sourceSkill) return true;
	return String(record.args?.sourceSkill ?? '').toLowerCase() === sourceSkill.toLowerCase();
}

function hasSourceEvidence(record) {
	return (
		(Array.isArray(record?.receipts) && record.receipts.some(hasReceiptIdentity)) ||
		(Array.isArray(record?.sourceDocumentIds) && record.sourceDocumentIds.some((id) => String(id ?? '').trim()))
	);
}

function hasReceiptIdentity(receipt) {
	return Boolean(String(receipt?.id ?? receipt?.citation ?? receipt?.title ?? '').trim());
}
