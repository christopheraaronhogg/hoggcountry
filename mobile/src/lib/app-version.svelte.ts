import { formatVersionLabel, needsAppUpdate } from './app-version-utils';

export { compareBuilds, formatVersionLabel, needsAppUpdate } from './app-version-utils';

export type AppVersionManifest = {
	name?: string;
	channel?: string;
	version?: string;
	build?: string;
	label?: string;
	gitSha?: string;
	gitShortSha?: string;
	sourceDate?: string | null;
	testFlightUrl?: string;
};

type NativeAppInfo = {
	version?: string;
	build?: string;
	id?: string;
	name?: string;
};

const LOCAL_MANIFEST_URL = '/app-version.json';
const DEFAULT_LATEST_MANIFEST_URL = 'https://app.hoggcountry.com/app-version.json';
const DEFAULT_TESTFLIGHT_URL = 'https://testflight.apple.com/join/BagBCrzf';

class AppVersionStatus {
	installed = $state<AppVersionManifest | null>(null);
	nativeInfo = $state<NativeAppInfo | null>(null);
	latest = $state<AppVersionManifest | null>(null);
	loading = $state(false);
	lastCheckedAt = $state<string | null>(null);
	error = $state<string | null>(null);
	#initPromise: Promise<void> | null = null;

	get installedVersion(): string | null {
		return this.nativeInfo?.version ?? this.installed?.version ?? null;
	}

	get installedBuild(): string | null {
		return this.nativeInfo?.build ?? this.installed?.build ?? null;
	}

	get installedLabel(): string {
		return formatVersionLabel(this.installedVersion, this.installedBuild);
	}

	get latestLabel(): string {
		return formatVersionLabel(this.latest?.version ?? null, this.latest?.build ?? null);
	}

	get latestBuild(): string | null {
		return this.latest?.build ?? null;
	}

	get updateAvailable(): boolean {
		return needsAppUpdate(this.installedBuild, this.latestBuild);
	}

	get statusLabel(): string {
		if (this.updateAvailable) return 'Update available';
		if (this.latest) return 'Current';
		if (this.error) return 'Could not check';
		return 'Checking';
	}

	get statusTone(): 'ok' | 'warn' | 'muted' {
		if (this.updateAvailable) return 'warn';
		if (this.latest) return 'ok';
		return 'muted';
	}

	get testFlightUrl(): string {
		return this.latest?.testFlightUrl ?? this.installed?.testFlightUrl ?? DEFAULT_TESTFLIGHT_URL;
	}

	get latestManifestUrl(): string {
		return (
			(import.meta.env?.PUBLIC_MOBILE_RELEASE_MANIFEST_URL as string | undefined)?.trim() ||
			DEFAULT_LATEST_MANIFEST_URL
		);
	}

	init(): Promise<void> {
		if (!this.#initPromise) {
			this.#initPromise = this.#load();
		}
		return this.#initPromise;
	}

	async refreshLatest(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			this.latest = await fetchManifest(this.latestManifestUrl);
			this.lastCheckedAt = new Date().toISOString();
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.loading = false;
		}
	}

	async #load(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const [installed, nativeInfo] = await Promise.all([
				fetchManifest(LOCAL_MANIFEST_URL).catch(() => null),
				loadNativeInfo()
			]);
			this.installed = installed;
			this.nativeInfo = nativeInfo;
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.loading = false;
		}
		await this.refreshLatest();
	}
}

export const appVersion = new AppVersionStatus();

async function fetchManifest(url: string): Promise<AppVersionManifest> {
	const response = await fetch(withCacheBust(url), {
		cache: 'no-store',
		headers: { Accept: 'application/json' }
	});
	if (!response.ok) throw new Error(`Version check failed with HTTP ${response.status}.`);
	return (await response.json()) as AppVersionManifest;
}

async function loadNativeInfo(): Promise<NativeAppInfo | null> {
	try {
		const [{ Capacitor }, { App }] = await Promise.all([
			import('@capacitor/core'),
			import('@capacitor/app')
		]);
		if (!Capacitor.isNativePlatform()) return null;
		return await App.getInfo();
	} catch {
		return null;
	}
}

function withCacheBust(url: string): string {
	const parsed = new URL(url, typeof location === 'undefined' ? 'https://app.hoggcountry.com' : location.href);
	parsed.searchParams.set('vcheck', Date.now().toString(36));
	return parsed.toString();
}
