import { apiRequest } from '../cloud/api.ts';
import type { CloudScoutBridge } from './providers/cloud-scout.ts';

// Cloud Scout bridge for the PWA (app.hoggcountry.com). On iOS, Scout answers
// on-device via Gemma; in a browser there is no native engine, so prompts go to
// the Laravel /api/v1/scout/ask endpoint (server-side OpenAI). That endpoint is
// auth:sanctum gated, so this lane only works when signed in to an invited
// account (Dad) — the bearer token doubles as the "only allow Dad" gate.

export interface CloudScoutBridgeOptions {
	/** Returns the current Sanctum token, or null when signed out. */
	getToken: () => string | null;
	/** Online probe; defaults to navigator.onLine. */
	isOnline?: () => boolean;
}

interface CloudAskResponse {
	answer: string;
	confidence: 'high' | 'medium' | 'low' | 'draft';
	contextUsed: string[];
}

export function createCloudScoutBridge(options: CloudScoutBridgeOptions): CloudScoutBridge {
	const isOnline = options.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine));

	return {
		async isReachable(): Promise<boolean> {
			// Cheap, synchronous gate — no network round-trip on every availability
			// probe. The lane is "reachable" only when signed in and online; an
			// actual failure surfaces honestly from ask().
			return Boolean(options.getToken()) && isOnline();
		},

		async ask({ prompt, payload }): Promise<CloudAskResponse> {
			const token = options.getToken();
			if (!token) {
				throw new Error('Cloud Scout requires sign-in.');
			}

			const data = await apiRequest<CloudAskResponse>('/scout/ask', {
				method: 'POST',
				token,
				body: { prompt, payload }
			});

			return {
				answer: data.answer,
				confidence: data.confidence ?? 'medium',
				contextUsed: data.contextUsed ?? []
			};
		}
	};
}
