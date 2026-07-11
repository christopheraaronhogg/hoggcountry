const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function timestampMs(iso: string | null | undefined): number | null {
	if (!iso) return null;
	const value = Date.parse(iso);
	return Number.isFinite(value) ? value : null;
}

export function formatAge(
	iso: string | null | undefined,
	nowMs: number,
	missingLabel = 'Unknown'
): string {
	const value = timestampMs(iso);
	if (value === null) return missingLabel;

	const elapsed = Math.max(0, nowMs - value);
	if (elapsed < MINUTE_MS) return 'just now';
	if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
	if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
	return `${Math.floor(elapsed / DAY_MS)}d ago`;
}

export function formatTimeUntil(iso: string | null | undefined, nowMs: number): string {
	const value = timestampMs(iso);
	if (value === null) return 'time unknown';

	const remaining = value - nowMs;
	if (remaining <= 0) return 'overdue';
	if (remaining < MINUTE_MS) return 'due now';

	const totalMinutes = Math.floor(remaining / MINUTE_MS);
	if (totalMinutes < 60) return `in ${totalMinutes}m`;

	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return minutes ? `in ${hours}h ${minutes}m` : `in ${hours}h`;
}

export function millisecondsUntilNextMinute(nowMs: number): number {
	const elapsedInMinute = ((nowMs % MINUTE_MS) + MINUTE_MS) % MINUTE_MS;
	return elapsedInMinute === 0 ? MINUTE_MS : MINUTE_MS - elapsedInMinute;
}
