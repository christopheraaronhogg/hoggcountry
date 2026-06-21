export type ModelPolicy = 'gemma4-only';

/**
 * Resolve the Scout model policy.
 *
 * Fail CLOSED: every build resolves to `gemma4-only` so Scout answers only
 * through a real model provider, never through a canned/template response lane.
 */
export function resolveModelPolicy(envValue: string | undefined, isDev: boolean): ModelPolicy {
	void envValue;
	void isDev;
	return 'gemma4-only';
}
