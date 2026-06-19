export type ModelPolicy = 'gemma4-only' | 'offline-tools';

/**
 * Resolve the Scout model policy.
 *
 * Fail CLOSED: when the policy is unset, a production build defaults to
 * `gemma4-only` so Scout can never silently answer from the deterministic
 * offline template and present it as a real on-device-model reply. Only the dev
 * preview (`vite dev`, which has no native model) defaults to `offline-tools`
 * so the browser shell still runs. `.env.production` also sets `gemma4-only`
 * explicitly — this default is the backstop if that file is ever missing.
 */
export function resolveModelPolicy(envValue: string | undefined, isDev: boolean): ModelPolicy {
	if (envValue === 'gemma4-only' || envValue === 'offline-tools') return envValue;
	return isDev ? 'offline-tools' : 'gemma4-only';
}
