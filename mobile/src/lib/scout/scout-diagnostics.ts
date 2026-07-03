import { API_BASE } from '../cloud/api.ts';
import type { ScoutDiagnosticEvent, ScoutDiagnosticSeverity } from './types.ts';

const INSTALL_ID_KEY = 'hc.scoutDiagnostics.installId';
const QUEUE_KEY = 'hc.scoutDiagnostics.queue.v1';
const MAX_QUEUE_EVENTS = 50;
const MAX_CONTEXT_DEPTH = 4;
const MAX_CONTEXT_ITEMS = 40;
const MAX_CONTEXT_STRING = 500;

type DiagnosticPayload = {
	event_id: string;
	install_id: string;
	session_id: string;
	category: string;
	name: string;
	severity: ScoutDiagnosticSeverity;
	occurred_at: string;
	app_version?: string | null;
	app_build?: string | null;
	build_sha?: string | null;
	platform?: string | null;
	native?: boolean | null;
	user_agent?: string | null;
	context: Record<string, unknown>;
};

type RuntimeMetadata = Pick<
	DiagnosticPayload,
	'app_version' | 'app_build' | 'build_sha' | 'platform' | 'native' | 'user_agent'
>;

const PRIVATE_CONTEXT_KEYS = new Set([
	'answer',
	'authorization',
	'content',
	'conversationhistory',
	'coords',
	'email',
	'lat',
	'latitude',
	'location',
	'lon',
	'longitude',
	'message',
	'password',
	'phone',
	'position',
	'prompt',
	'secret',
	'token',
	'trailname'
]);

const sessionId = makeId('sess');
let metadataPromise: Promise<RuntimeMetadata> | null = null;
let flushing = false;
let memoryQueue: DiagnosticPayload[] = [];

export function recordScoutDiagnostic(event: ScoutDiagnosticEvent): void;
export function recordScoutDiagnostic(
	name: string,
	context?: Record<string, unknown>,
	severity?: ScoutDiagnosticSeverity
): void;
export function recordScoutDiagnostic(
	eventOrName: ScoutDiagnosticEvent | string,
	context: Record<string, unknown> = {},
	severity: ScoutDiagnosticSeverity = 'info'
): void {
	if (!canRecord()) return;

	const event =
		typeof eventOrName === 'string'
			? { name: eventOrName, context, severity }
			: eventOrName;

	void buildPayload(event)
		.then((payload) => enqueueAndFlush(payload))
		.catch(() => {
			// Diagnostics must never affect Scout.
		});
}

export function describeDiagnosticError(error: unknown): Record<string, unknown> {
	if (error instanceof Error) {
		return {
			error_name: error.name,
			error_summary: limitString(error.message, 240)
		};
	}

	return {
		error_name: typeof error,
		error_summary: limitString(String(error), 240)
	};
}

export function sanitizeDiagnosticContext(value: unknown): Record<string, unknown> {
	const sanitized = sanitizeValue(value, 0);
	return isRecord(sanitized) ? sanitized : {};
}

async function buildPayload(event: ScoutDiagnosticEvent): Promise<DiagnosticPayload> {
	const metadata = await runtimeMetadata();
	return {
		event_id: makeId('evt'),
		install_id: installId(),
		session_id: sessionId,
		category: 'scout',
		name: safeEventPart(event.name, 'event'),
		severity: event.severity,
		occurred_at: new Date().toISOString(),
		...metadata,
		context: sanitizeDiagnosticContext({
			...event.context,
			online: typeof navigator !== 'undefined' ? navigator.onLine : null,
			visibility: typeof document !== 'undefined' ? document.visibilityState : null,
			url_path: typeof location !== 'undefined' ? location.pathname : null
		})
	};
}

async function enqueueAndFlush(payload: DiagnosticPayload): Promise<void> {
	const queue = readQueue();
	queue.push(payload);
	writeQueue(queue.slice(-MAX_QUEUE_EVENTS));
	await flushQueue();
}

export async function flushScoutDiagnostics(): Promise<void> {
	if (!canRecord()) return;
	await flushQueue();
}

async function flushQueue(): Promise<void> {
	if (flushing) return;
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

	flushing = true;
	try {
		const queue = readQueue();
		const remaining: DiagnosticPayload[] = [];
		for (const event of queue) {
			try {
				const response = await fetch(`${API_BASE}/mobile/diagnostics`, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(event),
					keepalive: true
				});
				if (!response.ok) {
					remaining.push(event);
				}
			} catch {
				remaining.push(event);
			}

			if (remaining.length > 0) {
				const tail = queue.slice(queue.indexOf(event) + 1);
				writeQueue([...remaining, ...tail].slice(-MAX_QUEUE_EVENTS));
				return;
			}
		}
		writeQueue([]);
	} finally {
		flushing = false;
	}
}

async function runtimeMetadata(): Promise<RuntimeMetadata> {
	if (!metadataPromise) {
		metadataPromise = loadRuntimeMetadata();
	}
	return metadataPromise;
}

async function loadRuntimeMetadata(): Promise<RuntimeMetadata> {
	const meta: RuntimeMetadata = {
		app_version: (import.meta.env?.PUBLIC_APP_VERSION as string | undefined) ?? null,
		app_build: (import.meta.env?.PUBLIC_APP_BUILD as string | undefined) ?? null,
		build_sha: (import.meta.env?.PUBLIC_BUILD_SHA as string | undefined) ?? null,
		platform: 'web',
		native: false,
		user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
	};

	try {
		const [{ Capacitor }, { App }] = await Promise.all([
			import('@capacitor/core'),
			import('@capacitor/app')
		]);
		meta.platform = Capacitor.getPlatform();
		meta.native = Capacitor.isNativePlatform();
		if (meta.native) {
			const appInfo = await App.getInfo();
			meta.app_version = appInfo.version;
			meta.app_build = appInfo.build;
		}
	} catch {
		// PWA/node paths may not have Capacitor metadata. The basic browser fields
		// above are still enough to correlate the event.
	}

	return meta;
}

function canRecord(): boolean {
	return typeof window !== 'undefined' && typeof fetch !== 'undefined';
}

function installId(): string {
	const storage = safeStorage();
	const existing = storage?.getItem(INSTALL_ID_KEY);
	if (existing) return existing;

	const next = makeId('install');
	try {
		storage?.setItem(INSTALL_ID_KEY, next);
	} catch {
		// Memory-only is still useful for this session.
	}
	return next;
}

function readQueue(): DiagnosticPayload[] {
	const storage = safeStorage();
	if (!storage) return memoryQueue;
	try {
		const parsed = JSON.parse(storage.getItem(QUEUE_KEY) ?? '[]') as unknown;
		return Array.isArray(parsed) ? (parsed as DiagnosticPayload[]) : [];
	} catch {
		return [];
	}
}

function writeQueue(queue: DiagnosticPayload[]): void {
	const storage = safeStorage();
	if (!storage) {
		memoryQueue = queue;
		return;
	}
	try {
		storage.setItem(QUEUE_KEY, JSON.stringify(queue));
	} catch {
		memoryQueue = queue;
	}
}

function safeStorage(): Storage | null {
	try {
		return typeof localStorage !== 'undefined' ? localStorage : null;
	} catch {
		return null;
	}
}

function sanitizeValue(value: unknown, depth: number): unknown {
	if (depth >= MAX_CONTEXT_DEPTH) return '[truncated]';

	if (Array.isArray(value)) {
		return value.slice(0, MAX_CONTEXT_ITEMS).map((item) => sanitizeValue(item, depth + 1));
	}

	if (isRecord(value)) {
		const entries = Object.entries(value).slice(0, MAX_CONTEXT_ITEMS);
		const output: Record<string, unknown> = {};
		for (const [key, item] of entries) {
			const safeKey = safeContextKey(key);
			output[safeKey] = isPrivateContextKey(safeKey)
				? '[redacted]'
				: sanitizeValue(item, depth + 1);
		}
		if (Object.keys(value).length > MAX_CONTEXT_ITEMS) {
			output._truncated_items = true;
		}
		return output;
	}

	if (typeof value === 'string') return limitString(value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''), MAX_CONTEXT_STRING);
	if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
	if (typeof value === 'bigint') return Number(value);
	if (value === undefined) return null;
	return limitString(String(value), MAX_CONTEXT_STRING);
}

function isPrivateContextKey(key: string): boolean {
	return PRIVATE_CONTEXT_KEYS.has(key.replace(/[-_.]/g, '').toLowerCase());
}

function safeContextKey(key: string): string {
	return limitString(key.replace(/[^A-Za-z0-9_.:-]/g, '_'), 80);
}

function safeEventPart(value: string, fallback: string): string {
	const safe = value.trim().replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 80);
	return safe || fallback;
}

function limitString(value: string, max: number): string {
	return value.length > max ? value.slice(0, max) : value;
}

function makeId(prefix: string): string {
	const uuid =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
	return `${prefix}_${uuid}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
