import type { ModelRouter, RouterDecision, RouterDecisionInput, ScoutProvider } from './types.ts';

export interface DefaultModelRouterOptions {
	onDevice?: ScoutProvider;
	cloud?: ScoutProvider;
}

export class NoScoutModelAvailableError extends Error {
	constructor(message = 'No Scout model provider is available.') {
		super(message);
		this.name = 'NoScoutModelAvailableError';
	}
}

export class DefaultModelRouter implements ModelRouter {
	private readonly onDevice?: ScoutProvider;
	private readonly cloud?: ScoutProvider;

	constructor(options: DefaultModelRouterOptions = {}) {
		this.onDevice = options.onDevice;
		this.cloud = options.cloud;
	}

	providers(): ScoutProvider[] {
		return [this.onDevice, this.cloud].filter(Boolean) as ScoutProvider[];
	}

	async pick(input: RouterDecisionInput): Promise<RouterDecision> {
		if (input.preferredMode === 'offline-local') {
			throw new NoScoutModelAvailableError('Legacy offline-local answers are disabled.');
		}

		if (input.preferredMode === 'cloud' && this.cloud && input.onlineStatus && input.allowCloud) {
			if (await safeAvailable(this.cloud)) {
				return { provider: this.cloud, reason: 'caller forced cloud mode' };
			}
		}

		if (input.preferredMode === 'on-device' && this.onDevice) {
			return { provider: this.onDevice, reason: 'caller forced on-device mode' };
		}

		if (input.onlineStatus && input.allowCloud && this.cloud && (await safeAvailable(this.cloud))) {
			return { provider: this.cloud, reason: 'online with cloud allowance' };
		}

		if (this.onDevice && (await safeAvailable(this.onDevice))) {
			return { provider: this.onDevice, reason: 'on-device model available' };
		}

		throw new NoScoutModelAvailableError();
	}
}

async function safeAvailable(provider: ScoutProvider): Promise<boolean> {
	try {
		return await provider.available();
	} catch {
		return false;
	}
}
