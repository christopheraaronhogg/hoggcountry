// Thin client for the Laravel /api/v1 backend (the existing Sanctum + sync API).
// Responses use a { data, error, meta } envelope; this unwraps `data` or throws
// the `error` (with HTTP status) so callers can branch on a stable code.

const RAW_BASE =
	// `?.` so the module also imports cleanly outside Vite (e.g. node:test), where
	// import.meta.env is undefined; in the app Vite injects PUBLIC_API_BASE.
	(import.meta.env?.PUBLIC_API_BASE as string | undefined) ?? 'https://hoggcountry.com/api/v1';
const API_BASE = RAW_BASE.replace(/\/$/, '');

export interface ApiError {
	code: string;
	message: string;
	details?: unknown;
	status: number;
}

export async function apiRequest<T>(
	path: string,
	opts: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${API_BASE}${path}`, {
			method: opts.method ?? 'GET',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {})
			},
			body: opts.body != null ? JSON.stringify(opts.body) : undefined
		});
	} catch {
		// Network down — surface a status-less error so callers fall back to local.
		throw { code: 'offline', message: 'No connection', status: 0 } satisfies ApiError;
	}

	type Envelope = { data?: unknown; error?: { code: string; message: string; details?: unknown } | null };
	let json: Envelope | null = null;
	try {
		json = (await res.json()) as Envelope;
	} catch {
		/* non-JSON response */
	}

	if (!res.ok || json?.error) {
		const err = json?.error ?? { code: 'http_error', message: `HTTP ${res.status}` };
		throw { code: err.code, message: err.message, details: err.details, status: res.status } satisfies ApiError;
	}
	return json?.data as T;
}
