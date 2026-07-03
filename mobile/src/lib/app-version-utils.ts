export function formatVersionLabel(version: string | null | undefined, build: string | null | undefined): string {
	const safeVersion = version?.trim() || 'Unknown';
	const safeBuild = build?.trim();
	return safeBuild ? `${safeVersion} (${safeBuild})` : safeVersion;
}

export function needsAppUpdate(installedBuild: string | null | undefined, latestBuild: string | null | undefined): boolean {
	if (!installedBuild?.trim() || !latestBuild?.trim()) return false;
	return compareBuilds(latestBuild, installedBuild) > 0;
}

export function compareBuilds(a: string | null | undefined, b: string | null | undefined): number {
	const left = numericBuild(a);
	const right = numericBuild(b);
	if (left !== null && right !== null) return left - right;
	return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true });
}

function numericBuild(value: string | null | undefined): number | null {
	const trimmed = value?.trim();
	if (!trimmed || !/^\d+$/u.test(trimmed)) return null;
	return Number.parseInt(trimmed, 10);
}
