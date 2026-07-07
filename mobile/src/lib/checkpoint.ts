export interface CheckpointDoc {
	at: string;
	mile: number;
	dayNumber: number;
	status?: string;
}

export function checkpointDocId(atIso: string): string {
	return new Date(atIso).toISOString().slice(0, 10);
}

export function buildCheckpointDoc(input: {
	atIso: string;
	currentMile: number;
	dayNumber: number;
	status?: string;
}): CheckpointDoc {
	const doc: CheckpointDoc = {
		at: input.atIso,
		mile: Number.isFinite(input.currentMile) ? input.currentMile : 0,
		dayNumber: Number.isFinite(input.dayNumber) ? input.dayNumber : 1
	};

	if (input.status !== undefined) {
		doc.status = input.status;
	}

	return doc;
}
