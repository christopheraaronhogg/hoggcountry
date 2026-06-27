type WakeLockRequestType = 'screen';

type WakeLockSentinelLike = {
	release(): Promise<void>;
	addEventListener?: (type: 'release', listener: () => void) => void;
	removeEventListener?: (type: 'release', listener: () => void) => void;
};

type WakeLockNavigatorLike = {
	wakeLock?: {
		request(type: WakeLockRequestType): Promise<WakeLockSentinelLike>;
	};
};

type NativeKeepAwakeLike = {
	setActive(active: boolean): Promise<boolean>;
};

type VisibilityDocumentLike = {
	visibilityState?: DocumentVisibilityState;
	addEventListener?: (type: 'visibilitychange', listener: () => void) => void;
	removeEventListener?: (type: 'visibilitychange', listener: () => void) => void;
};

export type ScoutEvalWakeLockController = {
	request(): Promise<boolean>;
	release(): Promise<void>;
	dispose(): void;
	hasLock(): boolean;
};

export function createScoutEvalWakeLock(input: {
	navigator?: WakeLockNavigatorLike;
	document?: VisibilityDocumentLike;
	nativeKeepAwake?: NativeKeepAwakeLike;
	onError?: (error: unknown) => void;
} = {}): ScoutEvalWakeLockController {
	const nav =
		input.navigator ?? (typeof navigator !== 'undefined' ? navigator as WakeLockNavigatorLike : undefined);
	const doc =
		input.document ?? (typeof document !== 'undefined' ? document as VisibilityDocumentLike : undefined);
	const nativeKeepAwake = input.nativeKeepAwake;
	const onError = input.onError;
	let sentinel: WakeLockSentinelLike | null = null;
	let nativeActive = false;
	let requested = false;
	let disposed = false;
	let listening = false;

	const handleSentinelRelease = () => {
		sentinel?.removeEventListener?.('release', handleSentinelRelease);
		sentinel = null;
		if (requested && !disposed && doc?.visibilityState === 'visible') {
			void acquire();
		}
	};

	const handleVisibilityChange = () => {
		if (doc?.visibilityState === 'visible' && requested && !sentinel) {
			void acquire();
		}
	};

	function addVisibilityListener() {
		if (listening || !doc?.addEventListener) return;
		doc.addEventListener('visibilitychange', handleVisibilityChange);
		listening = true;
	}

	function removeVisibilityListener() {
		if (!listening || !doc?.removeEventListener) return;
		doc.removeEventListener('visibilitychange', handleVisibilityChange);
		listening = false;
	}

	async function acquireNative(): Promise<boolean> {
		if (disposed || !requested || nativeActive || !nativeKeepAwake) return false;
		try {
			nativeActive = await nativeKeepAwake.setActive(true);
			return nativeActive;
		} catch (error) {
			onError?.(error);
			return false;
		}
	}

	async function releaseNative() {
		if (!nativeActive || !nativeKeepAwake) return;
		nativeActive = false;
		await nativeKeepAwake.setActive(false).catch((error) => onError?.(error));
	}

	async function acquire(): Promise<boolean> {
		if (disposed || !requested || sentinel || !nav?.wakeLock) return false;
		if (doc?.visibilityState === 'hidden') return false;
		try {
			const next = await nav.wakeLock.request('screen');
			if (disposed || !requested) {
				await next.release().catch((error) => onError?.(error));
				return false;
			}
			sentinel = next;
			sentinel.addEventListener?.('release', handleSentinelRelease);
			return true;
		} catch (error) {
			onError?.(error);
			return false;
		}
	}

	return {
		async request() {
			if (disposed) return false;
			requested = true;
			addVisibilityListener();
			const [nativeAcquired, webAcquired] = await Promise.all([acquireNative(), acquire()]);
			return nativeAcquired || webAcquired || nativeActive || Boolean(sentinel);
		},
		async release() {
			requested = false;
			removeVisibilityListener();
			const current = sentinel;
			sentinel = null;
			current?.removeEventListener?.('release', handleSentinelRelease);
			await Promise.all([
				current?.release().catch((error) => onError?.(error)),
				releaseNative()
			]);
		},
		dispose() {
			disposed = true;
			void this.release();
		},
		hasLock() {
			return Boolean(sentinel) || nativeActive;
		}
	};
}
