import type { ModelRouter, RouterDecision, RouterDecisionInput, ScoutProvider } from './types.ts';

export interface DefaultModelRouterOptions {
	fallback: ScoutProvider;
	onDevice?: ScoutProvider;
	cloud?: ScoutProvider;
}

export class DefaultModelRouter implements ModelRouter {
	private readonly fallback: ScoutProvider;
	private readonly onDevice?: ScoutProvider;
	private readonly cloud?: ScoutProvider;

	constructor(options: DefaultModelRouterOptions) {
		this.fallback = options.fallback;
		this.onDevice = options.onDevice;
		this.cloud = options.cloud;
	}

	providers(): ScoutProvider[] {
		return [this.fallback, this.onDevice, this.cloud].filter(Boolean) as ScoutProvider[];
	}

	async pick(input: RouterDecisionInput): Promise<RouterDecision> {
		if (input.preferredMode === 'offline-local') {
			return { provider: this.fallback, reason: 'caller forced offline-local mode' };
		}

		if (input.preferredMode === 'cloud' && this.cloud && input.onlineStatus && input.allowCloud) {
			if (await safeAvailable(this.cloud)) {
				return { provider: this.cloud, reason: 'caller forced cloud mode' };
			}
		}

		if (input.preferredMode === 'on-device' && this.onDevice) {
			// Forced on-device (Gemma-only policy): ALWAYS route here, even when the
			// availability probe is currently false. If the engine genuinely can't
			// generate it throws OnDeviceModelUnavailableError, which the runtime
			// surfaces (rethrows) under preferredMode 'on-device'. The router must
			// NEVER fall through to the deterministic "offline" answer in this mode —
			// that masquerade (entered via router selection rather than a throw) is
			// exactly the "acted offline despite a working model" bug.
			return { provider: this.onDevice, reason: 'caller forced on-device mode' };
		}

		if (input.batterySaver) {
			return { provider: this.fallback, reason: 'battery saver — using deterministic fallback' };
		}

		if (input.onlineStatus && input.allowCloud && this.cloud && (await safeAvailable(this.cloud))) {
			return { provider: this.cloud, reason: 'online with cloud allowance' };
		}

		if (this.onDevice && (await safeAvailable(this.onDevice))) {
			return { provider: this.onDevice, reason: 'on-device model available' };
		}

		return { provider: this.fallback, reason: 'no model providers available — deterministic fallback' };
	}
}

async function safeAvailable(provider: ScoutProvider): Promise<boolean> {
	try {
		return await provider.available();
	} catch {
		return false;
	}
}
