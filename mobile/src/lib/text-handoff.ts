import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export interface TextHandoffInput {
	title: string;
	text: string;
	url?: string;
}

export type TextHandoffOutcome =
	| 'share-handoff-complete'
	| 'copied'
	| 'cancelled-or-no-target'
	| 'unavailable';

export type TextCopyOutcome = Extract<TextHandoffOutcome, 'copied' | 'unavailable'>;

export interface TextHandoffAdapter {
	share?: (input: TextHandoffInput) => Promise<void>;
	copyText?: (text: string) => Promise<void>;
}

export interface TextHandoffAdapterDependencies {
	isNative: boolean;
	nativeShare?: {
		canShare: () => Promise<{ value: boolean }>;
		share: (input: TextHandoffInput) => Promise<unknown>;
	};
	nativeClipboard?: {
		write: (input: { string: string }) => Promise<void>;
	};
	webShare?: (input: TextHandoffInput) => Promise<void>;
	webCopyText?: (text: string) => Promise<void>;
}

/**
 * Detect an interrupted or unavailable share chooser without relying on
 * `instanceof DOMException`. Web APIs retain the standard name or legacy code;
 * Capacitor Share 7 reports native cancellation as `Error("Share canceled")`.
 */
export function isShareInterruptedError(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;

	try {
		const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
		const nativeCancel =
			typeof candidate.message === 'string' &&
			/^share cancel(?:l)?ed[.!]?$/iu.test(candidate.message.trim());
		return (
			candidate.name === 'AbortError' ||
			candidate.code === 20 ||
			candidate.code === 'ABORT_ERR' ||
			nativeCancel
		);
	} catch {
		return false;
	}
}

/** Build an adapter that prefers Capacitor plugins in installed apps. */
export function createTextHandoffAdapter(
	dependencies: TextHandoffAdapterDependencies
): TextHandoffAdapter {
	const adapter: TextHandoffAdapter = {};
	const nativeShare = dependencies.isNative ? dependencies.nativeShare : undefined;
	const nativeClipboard = dependencies.isNative ? dependencies.nativeClipboard : undefined;

	if (nativeShare) {
		adapter.share = async (input) => {
			const capability = await nativeShare.canShare();
			if (!capability.value) throw new Error('Native sharing is unavailable.');
			await nativeShare.share(input);
		};
	} else if (dependencies.webShare) {
		adapter.share = dependencies.webShare;
	}

	if (nativeClipboard) {
		adapter.copyText = async (text) => {
			try {
				await nativeClipboard.write({ string: text });
				return;
			} catch (error) {
				if (!dependencies.webCopyText) throw error;
			}

			await dependencies.webCopyText(text);
		};
	} else if (dependencies.webCopyText) {
		adapter.copyText = dependencies.webCopyText;
	}

	return adapter;
}

export function defaultTextHandoffAdapter(): TextHandoffAdapter {
	const webShare =
		typeof navigator !== 'undefined' && typeof navigator.share === 'function'
			? (input: TextHandoffInput) => navigator.share(input)
			: undefined;
	const webCopyText =
		typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'
			? (text: string) => navigator.clipboard.writeText(text)
			: undefined;

	return createTextHandoffAdapter({
		isNative: Capacitor.isNativePlatform(),
		nativeShare: Share,
		nativeClipboard: Clipboard,
		webShare,
		webCopyText
	});
}

function clipboardText(input: TextHandoffInput): string {
	return input.url ? `${input.text}\n\n${input.url}` : input.text;
}

/** Explicitly copy prepared text without first opening a chooser. */
export async function copyHandoffText(
	input: TextHandoffInput,
	adapter: TextHandoffAdapter = defaultTextHandoffAdapter()
): Promise<TextCopyOutcome> {
	if (!adapter.copyText) return 'unavailable';

	try {
		await adapter.copyText(clipboardText(input));
		return 'copied';
	} catch {
		return 'unavailable';
	}
}

/**
 * Hand text to a platform chooser, falling back to the clipboard only when
 * sharing fails for a non-abort reason. Outcomes describe only what Scout can
 * observe; returning from a chooser never proves that a message was delivered.
 */
export async function handoffText(
	input: TextHandoffInput,
	adapter: TextHandoffAdapter = defaultTextHandoffAdapter()
): Promise<TextHandoffOutcome> {
	if (adapter.share) {
		try {
			await adapter.share(input);
			return 'share-handoff-complete';
		} catch (error) {
			if (isShareInterruptedError(error)) return 'cancelled-or-no-target';
		}
	}

	return copyHandoffText(input, adapter);
}
