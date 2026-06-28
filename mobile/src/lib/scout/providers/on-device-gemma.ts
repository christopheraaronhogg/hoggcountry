import type {
	ProviderCapabilities,
	ProviderRequest,
	ProviderResponse,
	ScoutProvider,
	ToolInvocationRecord,
	TokenSink
} from '../types.ts';

export type GemmaTier = 'fast' | 'balanced' | 'small';

export interface GemmaModelDescriptor {
	tier: GemmaTier;
	modelId: string;
	maxContextTokens: number;
}

export interface OnDeviceGemmaBridge {
	isAvailable(): Promise<boolean>;
	describeModel(): Promise<GemmaModelDescriptor | null>;
	/**
	 * Optional: eagerly initialize the native engine so the FIRST real chat turn
	 * doesn't pay (or risk) the heavy, sometimes-flaky lazy LiteRT init. Best-effort
	 * and safe to call repeatedly; resolves whether or not warm-up succeeded.
	 */
	warmUp?(): Promise<void>;
	generate(
		input: {
			prompt: string;
			systemContext: string;
			maxTokens: number;
		},
		onToken?: (chunk: string) => void
	): Promise<{ text: string; truncated: boolean }>;
}

export interface OnDeviceGemmaProviderOptions {
	bridge?: OnDeviceGemmaBridge;
	tier?: GemmaTier;
}

const TIER_TO_CHARS: Record<GemmaTier, number> = {
	fast: 24_000,
	balanced: 16_000,
	small: 8_000
};
const ON_DEVICE_MAX_TOKENS = 640;
const SYSTEM_CONTEXT_TRIM_MARKER =
	'\n\n[Middle context trimmed to fit the on-device model window. Use only retained tool findings and cite only supplied sources.]\n\n';
const TOWN_OFFLINE_READINESS_NOTE =
	'Before leaving service: charge the phone and battery bank, refresh the field pack, confirm your current mile, let cloud sync finish while you still have service, download or update the local AI model on Wi-Fi and power, save offline maps/docs, verify Bible text is available offline, refresh weather and closure checks, then turn on airplane mode, relaunch, and ask Scout a water question. Treat cached weather, closures, water, and services as stale until refreshed again; Scout does not replace inReach, PLB, 911, or the family emergency plan.';
const FROZEN_FILTER_NOTE =
	'Frozen-filter note: if a hollow-fiber water filter froze, treat it as possibly compromised. Use backup tablets or another treatment until you can replace or verify it, and prevent it by sleeping with the filter or keeping it warm overnight.';
const SLOW_FILTER_NOTE =
	'Water-filter troubleshooting note: backflush or clean the filter first if the model supports it, protect hollow-fiber filters from freezing, use backup tablets or another treatment if flow stays bad or the filter may be compromised, and use the next confirmed water source before deciding to push past water.';
const RAIN_PANTS_NOTE =
	'Rain-pants decision note: for a Georgia or March start, decide from the current forecast, wind, personal cold tolerance, and shakedown evidence; keep them until the rain system has been proven in comparable wet-cold conditions.';
const CAMP_SHOES_NOTE =
	'Camp-shoes decision note: weigh the 7 oz against foot recovery, shelter and camp comfort, stream crossings when appropriate, hygiene, and keeping dirty shoes out of sleep areas; test them through the first section and reassess at the first town.';
const FOOD_ON_MOVE_NOTE =
	'Food-packing note: before leaving camp, split out the next 3-4 hours of snacks and lunch into reachable pockets or the top/outside of the pack; keep cook/camp meals, extra days of food, and trash separate so hiking food stays accessible for steady energy and better decisions.';
const COLD_RAIN_CAMP_NOTE =
	'Cold-rain camping note: treat wet-cold exposure as hypothermia risk, protect the dry sleep layer and warm layer first, set up early in a legal protected spot, keep the filter warm, and stop or bail out if the sleep system or camp setup cannot stay dry.';
const HEAT_WATER_NOTE =
	'Heat-water safety note: if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms show up, stop hiking, get shade, cool down, sip treated water with electrolytes if available, and escalate through the emergency plan if symptoms do not improve.';
const RIDGE_WATER_NOTE =
	'Ridge-water decision note: camel up at the last confirmed source and carry extra over the ridge when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only carry the lighter plan when the next reliable water is confirmed and conditions are mild.';
const DRY_STRETCH_WATER_NOTE =
	'Dry-stretch water note: for a 10-mile dry stretch, start from roughly 0.5-1 liter per 3-5 miles, increase for heat, exposed climbing, slow pace, or personal thirst, top off at the last confirmed source, and carry enough to reach the next reliable source when the next source is seasonal or unverified.';
const QUESTIONABLE_WATER_LOW_DAYLIGHT_NOTE =
	'Questionable-water note: treatment is non-negotiable even when tired or low on daylight; filter or backflush if needed, use backup tablets or boil if the filter is slow or suspect, do not drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.';

export class OnDeviceGemmaProvider implements ScoutProvider {
	private bridge?: OnDeviceGemmaBridge;
	private cachedDescriptor: GemmaModelDescriptor | null = null;
	// Only a confirmed-true result is cached. A false/unknown result is left as
	// null so the next call re-probes the (cheap) native isAvailable(). This
	// ensures that after a model download completes and the native engine flips
	// to available the router picks on-device without requiring an app restart.
	private availability: true | null = null;

	capabilities: ProviderCapabilities;

	constructor(options: OnDeviceGemmaProviderOptions = {}) {
		this.bridge = options.bridge;
		const tier = options.tier ?? 'balanced';
		this.capabilities = {
			id: 'on-device-gemma',
			mode: 'on-device',
			requiresNetwork: false,
			supportsToolCalls: false,
			maxContextChars: TIER_TO_CHARS[tier]
		};
	}

	/**
	 * Reset the positive-availability cache so the next available() call
	 * re-probes the native bridge. Call this after a model download completes
	 * or whenever the caller knows the model state has changed.
	 */
	invalidateAvailability(): void {
		this.availability = null;
	}

	/**
	 * Best-effort: ask the native bridge to initialize the engine ahead of the
	 * first chat turn. Never throws — warm-up failure just means the first turn
	 * pays the cost as before.
	 */
	async warmUp(): Promise<void> {
		try {
			await this.bridge?.warmUp?.();
		} catch {
			// Ignore — warming is an optimization, not a requirement.
		}
	}

	async available(): Promise<boolean> {
		if (!this.bridge) {
			// No bridge — never cache; a bridge could be wired later.
			return false;
		}
		// Return the cached positive result immediately.
		if (this.availability === true) return true;

		// Re-probe every time we don't have a confirmed positive.
		try {
			const result = await this.bridge.isAvailable();
			if (result) {
				this.availability = true;
			}
			// Do NOT cache false — leave availability null so next call re-probes.
			return result;
		} catch {
			// Transient error — do not cache; re-probe next time.
			return false;
		}
	}

	async describe(): Promise<GemmaModelDescriptor | null> {
		if (this.cachedDescriptor) return this.cachedDescriptor;
		if (!this.bridge) return null;
		try {
			this.cachedDescriptor = await this.bridge.describeModel();
		} catch {
			this.cachedDescriptor = null;
		}
		return this.cachedDescriptor;
	}

	async generate(request: ProviderRequest, onToken?: TokenSink): Promise<ProviderResponse> {
		const ready = await this.available();
		if (!ready || !this.bridge) {
			throw new OnDeviceModelUnavailableError(
				'OnDeviceGemmaProvider invoked but no native bridge is wired. Wire a LiteRT-LM adapter before asking Scout to answer.'
			);
		}

		const systemContext = fitSystemContext(renderSystemContext(request), this.capabilities.maxContextChars);
		const nativeInput = { prompt: request.prompt, systemContext, maxTokens: ON_DEVICE_MAX_TOKENS };
		let result: { text: string; truncated: boolean };
		try {
			result = await this.bridge.generate(nativeInput, onToken);
		} catch (error) {
			// The iOS LiteRT bridge can very occasionally return a null native
			// response during long non-streaming eval runs. Retry once only when no
			// token stream has been emitted to avoid duplicating user-visible text.
			if (!onToken && isTransientNativeGenerationError(error)) {
				await this.warmUp();
				result = await this.bridge.generate(nativeInput);
			} else {
				throw error;
			}
		}
		const answer = polishOnDeviceAnswer(result.text, request.prompt, request.toolInvocations);

		// A blank/whitespace generation is a failure, not an answer. Treat it as
		// unavailable so the user gets an honest retry rather than an empty bubble
		// dressed up with a confidence badge.
		if (!answer) {
			throw new OnDeviceModelUnavailableError('On-device model returned an empty response.');
		}

		return {
			answer,
			confidence: 'medium',
			mode: 'on-device',
			provider: 'on-device-gemma',
			additionalReceipts: [],
			additionalConfirmations: result.truncated
				? [
					{
						id: 'on-device-truncated',
						prompt: 'On-device context was truncated — verify the answer matches the cached trail pack.',
						reason: 'low-confidence'
					}
				]
				: [],
			contextUsed: ['on-device-gemma']
		};
	}
}

export function polishOnDeviceAnswer(text: string, prompt: string, toolInvocations: ToolInvocationRecord[] = []): string {
	let answer = text.replace(/\r\n/g, '\n').trim();
	if (!answer) return '';

	answer = answer.replace(/\bif you (?:do not|don't) hear from you\b/giu, 'if they do not hear from you');
	answer = answer.replace(
		/\bshould escalate beyond what you can handle\b/giu,
		'should trigger the escalation plan'
	);
	answer = stripInternalToolReferences(answer);
	answer = normalizeSpelledDecimalDistances(answer);
	answer = removeTrailingProvenanceParagraphs(answer);
	answer = removeRepeatedSentences(answer);

	const lowerPrompt = prompt.toLowerCase();
	if (!isBiblePrompt(lowerPrompt)) {
		answer = removeUnaskedBibleDrift(answer);
	}
	if (!isFearComfortPrompt(lowerPrompt)) {
		answer = removeUnaskedFearComfortDrift(answer);
	}
	if (isInjuryPrompt(lowerPrompt)) {
		answer = removeInjuryPrepDrift(answer);
	}
	if (isFamilyCheckinPrompt(lowerPrompt) && !mentionsNormalGapsAndLiveLocation(answer)) {
		answer = appendSentence(
			answer,
			'Normal gaps can happen from dead zones, battery conservation, rain, or town chaos; live location may be delayed or unavailable, so do not treat it as guaranteed.'
		);
	}
	if (isOfflineSetupPrompt(lowerPrompt) && !mentionsOfflineBible(answer)) {
		answer = appendSentence(answer, 'Also verify Bible text is available offline.');
	}
	if (isPersonalDocumentPrompt(lowerPrompt) && !mentionsPrivateDocumentBoundary(answer)) {
		answer = appendSentence(
			answer,
			'Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; keep those saved separately offline.'
		);
	}
	if (isWeatherSensitivePrompt(lowerPrompt)) {
		const weatherSummary = weatherLookupSummary(toolInvocations);
		if (weatherSummary && !mentionsWeatherLookupSummary(answer, weatherSummary)) {
			answer = appendSentence(answer, `Weather note: ${weatherSummary}`);
		}
	}
	if (isFrozenFilterPrompt(lowerPrompt) && !mentionsFrozenFilterSafety(answer)) {
		answer = appendSentence(answer, FROZEN_FILTER_NOTE);
	}
	if (isSlowFilterPrompt(lowerPrompt) && !mentionsSlowFilterTroubleshooting(answer)) {
		answer = appendSentence(answer, SLOW_FILTER_NOTE);
	}
	if (isHeatWaterPrompt(lowerPrompt) && !mentionsHeatWaterSafety(answer)) {
		answer = appendSentence(answer, HEAT_WATER_NOTE);
	}
	if (isRidgeWaterDecisionPrompt(lowerPrompt) && !mentionsRidgeWaterDecision(answer)) {
		answer = appendSentence(answer, RIDGE_WATER_NOTE);
	}
	if (isDryStretchWaterPrompt(lowerPrompt) && !mentionsDryStretchWaterCarry(answer)) {
		answer = appendSentence(answer, DRY_STRETCH_WATER_NOTE);
	}
	if (isQuestionableWaterLowDaylightPrompt(lowerPrompt) && !mentionsQuestionableWaterLowDaylight(answer)) {
		answer = appendSentence(answer, QUESTIONABLE_WATER_LOW_DAYLIGHT_NOTE);
	}
	if (isRainPantsPrompt(lowerPrompt) && !mentionsRainPantsDecision(answer)) {
		answer = appendSentence(answer, RAIN_PANTS_NOTE);
	}
	if (isCampShoesPrompt(lowerPrompt) && !mentionsCampShoesDecision(answer)) {
		answer = appendSentence(answer, CAMP_SHOES_NOTE);
	}
	if (isFoodOnMovePrompt(lowerPrompt) && !mentionsFoodOnMoveDecision(answer)) {
		answer = appendSentence(answer, FOOD_ON_MOVE_NOTE);
	}
	if (isColdRainCampPrompt(lowerPrompt) && !mentionsColdRainCampSafety(answer)) {
		answer = appendSentence(answer, COLD_RAIN_CAMP_NOTE);
	}
	if (isBadWeatherNeroPrompt(lowerPrompt) && !mentionsBadWeatherNeroDecision(answer)) {
		answer = appendSentence(
			answer,
			'Nero note: choose a short day, town stop, or early stop when the forecast, footing, exposure, daylight, or body condition makes pushing the full plan less safe.'
		);
	}
	if (isBudgetPrompt(lowerPrompt) && !mentionsBudgetCategories(answer)) {
		answer = appendSentence(
			answer,
			'Budget note: separate daily burn from town spikes like hostels, shuttles, laundry, and meals; include gear replacement and an emergency cushion, and keep it flexible around actual pace and services rather than treating it as a guarantee.'
		);
	}
	if (isTownOfflineReadinessPrompt(lowerPrompt) && !mentionsTownOfflineReadiness(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) ? TOWN_OFFLINE_READINESS_NOTE : appendSentence(answer, TOWN_OFFLINE_READINESS_NOTE);
	}

	return trimToCompleteSentence(answer);
}

function fitSystemContext(systemContext: string, maxChars: number): string {
	if (systemContext.length <= maxChars) return systemContext;
	const available = Math.max(0, maxChars - SYSTEM_CONTEXT_TRIM_MARKER.length);
	const headChars = Math.floor(available * 0.6);
	const tailChars = available - headChars;
	return `${systemContext.slice(0, headChars).trimEnd()}${SYSTEM_CONTEXT_TRIM_MARKER}${systemContext.slice(-tailChars).trimStart()}`;
}

function removeTrailingProvenanceParagraphs(answer: string): string {
	const paragraphs = answer.split(/\n{2,}/u);
	while (
		paragraphs.length > 1 &&
		/^This (?:guidance|approach|answer|advice) (?:comes from|is based on|is what)\b.*\b(?:guidance|finding|discipline|source_search|open_source_doc|tool)\b.*\.?$/iu.test(
			paragraphs[paragraphs.length - 1].trim()
		)
	) {
		paragraphs.pop();
	}
	return paragraphs.join('\n\n').trim();
}

function removeInjuryPrepDrift(answer: string): string {
	return answer
		.split(/\n{2,}/u)
		.filter((paragraph) => !/^A shakedown hike should prove\b/iu.test(paragraph.trim()))
		.join('\n\n')
		.trim();
}

function removeUnaskedBibleDrift(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsBibleDrift(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
}

function removeUnaskedFearComfortDrift(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsFearComfortDrift(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
}

function stripInternalToolReferences(answer: string): string {
	return answer.replace(
		/\s*\[(?:source_search|open_source_doc|next_water|next_shelter|next_town|current_mile|weather_lookup|upcoming_terrain|loadout_check|trail_conditions|park_services|bible_search)\]/giu,
		''
	);
}

function normalizeSpelledDecimalDistances(answer: string): string {
	const tenths: Record<string, string> = {
		one: '1',
		two: '2',
		three: '3',
		four: '4',
		five: '5',
		six: '6',
		seven: '7',
		eight: '8',
		nine: '9'
	};
	return answer.replace(/\b(?:about\s+)?a mile and (one|two|three|four|five|six|seven|eight|nine)\b/giu, (match, word: string) => {
		const prefix = match.toLowerCase().startsWith('about ') ? 'about ' : '';
		return `${prefix}1.${tenths[word.toLowerCase()] ?? word} miles`;
	});
}

function removeRepeatedSentences(answer: string): string {
	const seen = new Set<string>();
	return answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph);
			return sentences
				.map((sentence) => sentence.trim())
				.filter((sentence) => {
					const key = canonicalSentenceForDedupe(sentence);
					if (!key) return true;
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				})
				.join(' ');
		})
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.join('\n\n')
		.trim();
}

function splitSentences(paragraph: string): string[] {
	const sentences: string[] = [];
	let start = 0;
	for (let index = 0; index < paragraph.length; index += 1) {
		const char = paragraph[index];
		if (char !== '.' && char !== '!' && char !== '?') continue;
		if (isDigit(paragraph[index - 1]) && isDigit(paragraph[index + 1])) continue;
		let end = index + 1;
		while (end < paragraph.length && /["')\]]/u.test(paragraph[end])) end += 1;
		if (end < paragraph.length && !/\s/u.test(paragraph[end])) continue;
		const sentence = paragraph.slice(start, end).trim();
		if (sentence) sentences.push(sentence);
		start = end;
	}
	const tail = paragraph.slice(start).trim();
	if (tail) sentences.push(tail);
	return sentences.length ? sentences : [paragraph];
}

function isDigit(char: string | undefined): boolean {
	return typeof char === 'string' && /[0-9]/u.test(char);
}

function canonicalSentenceForDedupe(sentence: string): string {
	return sentence
		.toLowerCase()
		.replace(/^for practical next steps,\s*/u, '')
		.replace(/^first,\s*/u, '')
		.replace(/^you need to\s*/u, '')
		.replace(/[^a-z0-9\s]/gu, ' ')
		.replace(/\s+/gu, ' ')
		.trim();
}

function appendSentence(answer: string, sentence: string): string {
	return `${answer.trim()}\n\n${sentence}`;
}

function trimToCompleteSentence(answer: string): string {
	const trimmed = answer.trim();
	if (!trimmed || /[.!?)]$/u.test(trimmed)) return trimmed;
	const lastSentenceEnd = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
	return lastSentenceEnd > 0 ? trimmed.slice(0, lastSentenceEnd + 1).trim() : trimmed;
}

function isOfflineSetupPrompt(prompt: string): boolean {
	return /offline setup|offline downloads|going offline|phone settings|day-one readiness|day one readiness/u.test(prompt);
}

function isPersonalDocumentPrompt(prompt: string): boolean {
	return /documents|personal documents|information should i keep saved offline|insurance|emergency contacts|permits|reservations/u.test(prompt);
}

function isFamilyCheckinPrompt(prompt: string): boolean {
	return /check-ins|check ins|check-in|family|miss one|missed check-in|miss a check-in/u.test(prompt);
}

function isInjuryPrompt(prompt: string): boolean {
	return /injury|hurt|pain|knee|ankle|rolled|symptoms|medical|sick/u.test(prompt);
}

function isZeroNeroPrompt(prompt: string): boolean {
	return /\b(?:zero|nero)\b|town[-\s]?rest|rest day/u.test(prompt);
}

function isBiblePrompt(prompt: string): boolean {
	return /\b(?:bible|scripture|verse|pray|prayer|psalm|proverb|john|romans|jesus|christ|lord|god|faith|spiritual|fear while|scared and alone)\b/u.test(prompt);
}

function isFearComfortPrompt(prompt: string): boolean {
	return /\b(?:scared|afraid|alone|anxious|anxiety|panic|fear|fearful|comfort|nighttime support|night support)\b/u.test(prompt);
}

function isBudgetPrompt(prompt: string): boolean {
	return /\b(?:budget|overplanning|over-plan|money|cost|spend|spending)\b/u.test(prompt);
}

function isTownOfflineReadinessPrompt(prompt: string): boolean {
	const townOrService = /\b(?:town|service|cell signal|wi-?fi|before leaving|lose service|no signal)\b/u.test(prompt);
	const readinessAction = /\b(?:charge|refresh|download|update|field pack|local ai|model|cloud sync|battery bank)\b/u.test(prompt);
	return townOrService && readinessAction;
}

function isWeatherSensitivePrompt(prompt: string): boolean {
	return /\b(?:weather|rains?|rainy|raining|storms?|thunderstorms?|thunder|lightning|winds?|cold|heat|hot|hypothermia|freez\w*|ridge|dry stretch|bad weather|zeros?|neros?|stop hiking)\b/u.test(prompt);
}

function isBadWeatherNeroPrompt(prompt: string): boolean {
	return /\b(?:zero|nero)\b/u.test(prompt) &&
		/\b(?:weather|rains?|rainy|raining|storms?|thunderstorms?|thunder|lightning|winds?|cold|heat|hot|hypothermia|freez\w*|bad weather)\b/u.test(prompt);
}

function isFrozenFilterPrompt(prompt: string): boolean {
	return /\b(?:filter|water filter|hollow[-\s]?fiber|sawyer|katadyn|befree)\b/u.test(prompt) &&
		/\b(?:freez\w*|frozen|froze)\b/u.test(prompt);
}

function isSlowFilterPrompt(prompt: string): boolean {
	return /\b(?:filter|water filter|hollow[-\s]?fiber|sawyer|katadyn|befree)\b/u.test(prompt) &&
		/\b(?:slow|slowing|clog|clogged|clogging|backflush|backflushing|flow rate|barely flowing|not flowing|clean|cleaning)\b/u.test(prompt) &&
		!/\b(?:freez\w*|frozen|froze)\b/u.test(prompt);
}

function isHeatWaterPrompt(prompt: string): boolean {
	return /\b(?:heat|hot|heat wave|humid|dehydrat\w*|heat illness)\b/u.test(prompt) &&
		/\b(?:water|hydrate|hydration|drink|shade|harder|dizzy|confusion|cramps|heat illness)\b/u.test(prompt);
}

function isRidgeWaterDecisionPrompt(prompt: string): boolean {
	return /\b(?:camel up|carry extra water|water over the ridge|before a ridge|over the ridge|dry ridge|long dry stretch)\b/u.test(prompt);
}

function isDryStretchWaterPrompt(prompt: string): boolean {
	return /\b(?:dry stretch|dry miles?|water carry|carry water|how much water|10 mile|ten mile)\b/u.test(prompt) &&
		/\b(?:water|hydrate|hydration|liter|liters|litre|litres|carry)\b/u.test(prompt);
}

function isQuestionableWaterLowDaylightPrompt(prompt: string): boolean {
	return /\b(?:questionable water|treat questionable|treat water|water treatment|untreated water)\b/u.test(prompt) &&
		/\b(?:tired|fatigue|low on daylight|low daylight|dark|after dark|dusk|night|late)\b/u.test(prompt);
}

function isRainPantsPrompt(prompt: string): boolean {
	return /\b(?:rain pants|rain gear|rain system)\b/u.test(prompt) &&
		/\b(?:need|carry|leave|home|drop|cut|mail|send|ditch|keep)\b/u.test(prompt);
}

function isCampShoesPrompt(prompt: string): boolean {
	return /\b(?:camp shoes?|sandals?|z-trail|z trail)\b/u.test(prompt);
}

function isFoodOnMovePrompt(prompt: string): boolean {
	return /\b(?:food|snacks?|lunch|eat|eating|ration)\b/u.test(prompt) &&
		/\b(?:pack|packing|packed|accessible|hiking|while hiking|on the move|at camp|camp)\b/u.test(prompt);
}

function isColdRainCampPrompt(prompt: string): boolean {
	return /\b(?:cold rain|wet cold|wet-cold|cold.*rain|rain.*cold)\b/u.test(prompt) &&
		/\b(?:camp|camping|sleep|tonight|shelter|setup|set up)\b/u.test(prompt);
}

function weatherLookupSummary(toolInvocations: ToolInvocationRecord[]): string | null {
	const summary = toolInvocations.find((tool) => tool.toolId === 'weather_lookup')?.summary?.trim();
	return summary || null;
}

function mentionsOfflineBible(answer: string): boolean {
	return /bible[^.?!\n]*(?:offline|available|download)|(?:offline|available|download)[^.?!\n]*bible/iu.test(answer);
}

function mentionsPrivateDocumentBoundary(answer: string): boolean {
	return /(?:do not|don't) paste private|private (?:id|insurance|medical|payment|reservation).*scout chat/iu.test(answer);
}

function mentionsNormalGapsAndLiveLocation(answer: string): boolean {
	return /(?:normal gap|dead zone|battery conservation|town chaos|rain)/iu.test(answer) && /live location/iu.test(answer);
}

function mentionsWeatherLookupSummary(answer: string, summary: string): boolean {
	const lowerAnswer = answer.toLowerCase();
	const lowerSummary = summary.toLowerCase();
	const numberMatches = lowerSummary.match(/\b\d+\s*(?:f|mph)\b/giu) ?? [];
	const matchedNumbers = numberMatches.filter((value) => lowerAnswer.includes(value.toLowerCase())).length;
	if (matchedNumbers >= Math.min(2, numberMatches.length)) return true;
	if (numberMatches.length) return false;
	if (/\b(?:partly cloudy|cloudy|showers?|rain|storms?|thunderstorms?|snow|wind|hot|cold|high|low)\b/iu.test(lowerSummary)) {
		return /\b(?:partly cloudy|cloudy|showers?|rain|storms?|thunderstorms?|snow|wind\s+\d|high\s+\d|low\s+\d|hot|cold)\b/iu.test(lowerAnswer);
	}
	return /refresh|verify|current forecast|cached weather/iu.test(lowerAnswer);
}

function mentionsBudgetCategories(answer: string): boolean {
	return /daily burn/iu.test(answer) &&
		/town spikes?/iu.test(answer) &&
		/(hostel|shuttle|laundry|meal)/iu.test(answer) &&
		/gear replacement/iu.test(answer) &&
		/emergency cushion/iu.test(answer);
}

function isVagueSourceOnlyAnswer(answer: string): boolean {
	return /^(?:this|that) (?:covers|summarizes|is based on)\b.*\b(?:guidance|steps|readiness|safety)\b\.?$/iu.test(answer.trim());
}

function mentionsTownOfflineReadiness(answer: string): boolean {
	return /phone/iu.test(answer) &&
		/(?:battery bank|battery|power|charge)/iu.test(answer) &&
		/field[-\s]?pack/iu.test(answer) &&
		/(?:current mile|mile)/iu.test(answer) &&
		/(?:local ai|model|gemma)/iu.test(answer) &&
		/(?:offline maps?|offline docs?|offline references?|maps\/docs|maps or docs)/iu.test(answer) &&
		/bible/iu.test(answer) &&
		/weather/iu.test(answer) &&
		/closure/iu.test(answer) &&
		/(?:cloud sync|sync finish|finish.*sync|backup)/iu.test(answer) &&
		/(?:stale|not current|until refreshed|refresh again|remains current indefinitely)/iu.test(answer);
}

function mentionsFrozenFilterSafety(answer: string): boolean {
	const mentionsCompromised = /\b(?:compromis\w*|not definitely safe|may not be safe|could be unsafe|replace|retire)\b/iu.test(answer);
	const mentionsBackupTreatment = /\b(?:backup (?:water )?(?:tablet|tablets|treatment)|water tablets|chemical treatment|chlorine dioxide|aquamira|boil)\b/iu.test(answer);
	const mentionsWarmStorage = /\b(?:sleep(?:ing)? with (?:it|the filter)|filter[^.?!\n]*(?:sleeping bag|keep warm|inside your bag|warm overnight)|keep[^.?!\n]*filter[^.?!\n]*warm)\b/iu.test(answer);
	return mentionsCompromised && mentionsBackupTreatment && mentionsWarmStorage;
}

function mentionsSlowFilterTroubleshooting(answer: string): boolean {
	const mentionsCleaning = /\b(?:backflush|backflushing|flush|clean|cleaning|rinse|shake out|debris|clog)\b/iu.test(answer);
	const mentionsFreezeProtection = /\b(?:freez\w*|frozen|froze|keep warm|sleep(?:ing)? with (?:it|the filter)|hollow[-\s]?fiber)\b/iu.test(answer);
	const mentionsBackupTreatment = /\b(?:backup (?:water )?(?:tablet|tablets|treatment)|water tablets|chemical treatment|chlorine dioxide|aquamira|boil)\b/iu.test(answer);
	const mentionsNextWaterDecision = /\b(?:next (?:confirmed |loaded |reliable )?water|push past water|carry more water|verified (?:water|stop)|confirm(?:ed)? (?:flow|source))\b/iu.test(answer);
	return mentionsCleaning && mentionsFreezeProtection && mentionsBackupTreatment && mentionsNextWaterDecision;
}

function mentionsHeatWaterSafety(answer: string): boolean {
	const mentionsStopCool = /\b(?:stop hiking|stop and cool|cool down|get shade|find shade|shade)\b/iu.test(answer);
	const mentionsSymptoms = /\b(?:dizz\w*|confus\w*|headache|nausea|cramps?|chills?|stopped sweating|worsening symptoms|heat illness)\b/iu.test(answer);
	const mentionsEscalation = /\b(?:emergency plan|911|inreach|plb|medical help)\b/iu.test(answer);
	return mentionsStopCool && mentionsSymptoms && mentionsEscalation;
}

function mentionsRidgeWaterDecision(answer: string): boolean {
	const mentionsCamelUp = /\b(?:camel up|top off|drink at the source|last confirmed source)\b/iu.test(answer);
	const mentionsCarryExtra = /\b(?:carry extra|more water|safer carry|heavier carry)\b/iu.test(answer);
	const mentionsUncertaintyOrRidge = /\b(?:ridge|seasonal|unverified|unknown|confirmed|reliable|exposed|hot|dry stretch)\b/iu.test(answer);
	return mentionsCamelUp && mentionsCarryExtra && mentionsUncertaintyOrRidge;
}

function mentionsDryStretchWaterCarry(answer: string): boolean {
	const mentionsRange = /\b(?:0\.5|half|1)\s*(?:-|to|and)?\s*(?:1)?\s*(?:l|liter|liters|litre|litres)\b/iu.test(answer) ||
		/\b(?:3-5|3 to 5|three to five)\s*miles?\b/iu.test(answer);
	const mentionsTopOff = /\b(?:top off|camel up|last confirmed source|confirmed source)\b/iu.test(answer);
	const mentionsAdjustment = /\b(?:heat|hot|exposed|climb|slow pace|pace|personal thirst|thirst)\b/iu.test(answer);
	const mentionsReliableTarget = /\b(?:next reliable|reliable source|seasonal|unverified|verified source)\b/iu.test(answer);
	return mentionsRange && mentionsTopOff && mentionsAdjustment && mentionsReliableTarget;
}

function mentionsQuestionableWaterLowDaylight(answer: string): boolean {
	const mentionsTreatmentRequired = /\b(?:treatment is non-negotiable|treat(?:ment)? (?:all|any|the) questionable|do not drink untreated|don't drink untreated|never drink untreated)\b/iu.test(answer);
	const mentionsMethod = /\b(?:filter|backflush|backup tablets?|water tablets?|chemical treatment|chlorine dioxide|aquamira|boil)\b/iu.test(answer);
	const mentionsDarkStop = /\b(?:safe legal stop|stop before dark|before dark|low daylight|dark|headlamp|do not push into darkness|don't push into darkness)\b/iu.test(answer);
	return mentionsTreatmentRequired && mentionsMethod && mentionsDarkStop;
}

function mentionsRainPantsDecision(answer: string): boolean {
	return /(?:personal cold tolerance|how fast you chill|your cold tolerance|if you run cold)/iu.test(answer) &&
		/(?:shakedown|proven|test(?:ed|ing)? the rain system)/iu.test(answer) &&
		/(?:forecast|wind|cold rain|wet-cold|wet cold)/iu.test(answer);
}

function mentionsCampShoesDecision(answer: string): boolean {
	return /foot recovery/iu.test(answer) &&
		/(?:shelter|camp comfort|around camp|camp chores)/iu.test(answer) &&
		/stream crossing/iu.test(answer) &&
		/(?:first section|first town|reassess)/iu.test(answer);
}

function mentionsFoodOnMoveDecision(answer: string): boolean {
	const mentionsAccessible = /\b(?:hip belt|shoulder pouch|top pocket|outside mesh|reachable|accessible|without unpacking|easy to reach)\b/iu.test(answer);
	const mentionsDayRation = /\b(?:day food|daily ration|today'?s (?:snacks|food|lunch)|next 3-4 hours|before leaving camp)\b/iu.test(answer);
	const mentionsSeparatedMeals = /\b(?:cook|camp meals?|extra days?|trash|separate|not get buried|keep .* separate)\b/iu.test(answer);
	const mentionsSteadyEnergy = /\b(?:steady energy|under-eat|bonk|foggy|warmth|mileage|water|shelter decisions?)\b/iu.test(answer);
	return mentionsAccessible && mentionsDayRation && mentionsSeparatedMeals && mentionsSteadyEnergy;
}

function mentionsColdRainCampSafety(answer: string): boolean {
	const mentionsHypothermia = /\bhypothermia\b/iu.test(answer);
	const mentionsDrySleep = /\b(?:dry sleep|sleep (?:system|layers?)|dry layer|warm layer|insulation|quilt|sleeping bag)\b/iu.test(answer);
	const mentionsStopBail = /\b(?:bail|bailout|stop|do not push|get to shelter|protected spot|legal protected)\b/iu.test(answer);
	return mentionsHypothermia && mentionsDrySleep && mentionsStopBail;
}

function containsBibleDrift(paragraph: string): boolean {
	return /\b(?:bible|scripture|verse|verses|psalms?|isaiah|john|romans|proverbs?|timothy|lord|god|christ|jesus)\b/iu.test(paragraph) ||
		/[“"]?[A-Z][^.!?]{10,}\b(?:I am with you|do not fear|trust in the lord|righteous right hand)\b/iu.test(paragraph);
}

function containsFearComfortDrift(paragraph: string): boolean {
	return /\b(?:scared|afraid|alone|anxious|anxiety|panic|comfort verses?)\b/iu.test(paragraph);
}

function mentionsBadWeatherNeroDecision(answer: string): boolean {
	return /\b(?:nero|short day|town stop|early stop|stop early)\b/iu.test(answer);
}

export class OnDeviceModelUnavailableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'OnDeviceModelUnavailableError';
	}
}

function isTransientNativeGenerationError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return /(?:native sendmessage returned null|invalid response from native layer)/iu.test(message);
}

export function renderSystemContext(request: ProviderRequest): string {
	const { pack, toolInvocations } = request;
	const toolLines = toolInvocations.map((tool) => `- [${tool.toolId}] ${compactToolSummaryForContext(tool.toolId, tool.summary)}`);
	const conversationLines = (request.conversationHistory ?? []).map((message) => {
		const speaker = message.role === 'user' ? 'Hiker' : 'Scout';
		const timestamp = message.timestamp ? ` (${message.timestamp})` : '';
		return `${speaker}${timestamp}: ${message.content}`;
	});
	return [
		`You are Scout, an Appalachian Trail field companion for thru-hikers.`,
		`Voice: calm, capable, plain-spoken, and human. Sound like a thoughtful trail partner, not a chatbot, cowboy, coach, marketer, or emergency dispatcher.`,
		`Address the hiker directly as "you" or "your." Do not refer to Dad in third person as "your dad" or "the hiker" in the final answer.`,
		`Do not use "howdy", "partner", "well now", fake dialect, hype, or repeated self-introductions. Do not echo the hiker's question unless you need to clarify it.`,
		`Answer the hiker's immediate question first. Keep most replies short: 2-5 tight paragraphs or a few short lines. If the hiker sounds uncertain, steady them and give the next practical decision.`,
		`End every answer with a complete sentence. Do not end with an unfinished offer, and do not add "I can look..." follow-up offers inside the answer. Use the loaded context to answer the current prompt.`,
		`Use plain text only. Do not use Markdown headings, bold markers, tables, or long bullet lists; this chat renders plain text.`,
		`Do not expose internal tool names or labels such as "source skill", "source_search", "open_source_doc", or "tool invocation" in the answer. Use the information naturally.`,
		`Be honest about uncertainty. Use "candidate", "verify", or "I don't know" when the pack cannot prove something. Never turn candidate water, shelters, towns, or weather into guarantees.`,
		`For water questions, use the next_water tool finding as the answer's spine. Lead with the nearest actionable water option or next reliable source from the tool finding. If no reliable water is loaded, say that after the source hierarchy; do not start with a generic refusal.`,
		`For heat-wave water questions, tell the hiker to stop, find shade, cool down, sip treated water with electrolytes if available, and escalate if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms appear.`,
		`For camel-up or ridge-water questions, give a clear decision: camel up at the last confirmed source and carry extra when the next water is seasonal, unverified, exposed, hot, or after a hard climb; only use the lighter carry when the next reliable water is confirmed and conditions are mild.`,
		`For dry-stretch water-carry questions, give a practical conservative range: roughly 0.5-1 liter per 3-5 miles as a starting point, more for heat, exposure, climbing, slow pace, or personal thirst. Tell the hiker to top off at the last confirmed source and carry enough to reach the next reliable source when the next source is seasonal or unverified.`,
		`For questionable-water, tired, or low-daylight treatment questions, keep the answer focused on water safety unless heat symptoms are explicit. Say treatment is non-negotiable, use filter/backflush or backup tablets/boil, do not drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.`,
		`For frozen or failing water-filter questions, say a hollow-fiber filter may be compromised if it froze, use backup treatment or replace it if unsure, backflush or clean a slow filter when the model supports it, and prevent the next freeze by sleeping with the filter or keeping it warm overnight. Use next-water context before telling the hiker to push past water.`,
		`When tool findings are labeled as guidance, treat them as topic-specific documents Scout intentionally read for this answer. Use them to shape caveats and next-step advice.`,
		`When preparation or training questions have pretrip, terrain, loadout, safety, or offline setup findings, give a concrete short plan. For "what should I focus on first" prompts, include an immediate first-week checklist, not only general training advice. Include shakedown hikes, foot care/blister practice, conservative early mileage, gear/loadout checks, water treatment habits, and an offline app/model rehearsal when those appear in the findings.`,
		`For offline setup, offline downloads, phone settings, or day-one readiness questions, distinguish phone/app readiness from personal safety readiness. Always include the exact check "verify Bible text is available offline." Also mention field-pack refresh, current mile, local AI model, offline maps/docs, battery, airplane-mode rehearsal, and that Scout does not replace inReach, PLB, 911, or the family emergency plan. For personal documents, include this safety boundary in plain words: do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat.`,
		`Do not include Bible verses, scripture, prayer, or spiritual encouragement unless the hiker explicitly asks for Bible, scripture, prayer, faith, fear comfort, or spiritual support. Safety, weather, town, water, gear, and navigation answers must stay focused on the field decision first.`,
		`For Bible or scripture questions, quote only verses returned by bible_search and keep the reference with each quote. For fear, scared, alone, or nighttime comfort prompts, use direct comfort verses when present, such as Psalms 56:3, Isaiah 41:10, 2 Timothy 1:7, Psalms 23:4, Psalms 4:8, or John 14:27. Do not use disturbing, violent, judgment, or famine passages as comfort unless the hiker explicitly asked about that passage. If the hiker sounds scared or alone, pair scripture with immediate safety steps: check weather and hazards, get warm and dry, eat or drink if needed, make a one-hour plan, and escalate through the emergency plan if there is real danger, injury, exposure, or repeated panic.`,
		`For shakedown questions, name what the shakedown must prove: sleep system, rain system, cooking/food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow. Turn failures into specific gear or app fixes. Always say that one shakedown does not prove every condition is covered.`,
		`For first-week mileage questions, use body condition, daylight, elevation, weather, pack weight, water spacing, foot/knee condition, and legal shelter/campsite/town spacing. Start low, protect feet and knees, and avoid fixed mileage promises.`,
		`For heavy-rain start questions, include conservative mileage, dry sleep layers, footing caution on slick roots/rocks/descents, current forecast verification, and a bailout or stop plan for lightning, hypothermia risk, flooding, or worsening conditions.`,
		`For rain-pants or rain-gear cut/drop questions, visibly weigh cold rain, wind, personal cold tolerance, cached/current forecast uncertainty, and shakedown evidence before making a keep/drop call. For Georgia or March starts, default conservative until the hiker proves the rain system in comparable wet-cold conditions.`,
		`For camp-shoes questions, balance foot recovery, shelter/camp comfort, stream crossings, hygiene, and weight. Do not frame recovery comfort as laziness. Suggest testing the shoes and reassessing after the first section or first town, not deciding from ounces alone.`,
		`For food-packing or eating-while-hiking questions, tell the hiker to split out today's snacks and lunch before leaving camp, keep them reachable without unpacking, keep cook/camp meals and extra days of food separate, and connect accessible food to steady energy, warmth, and better water/shelter/mileage decisions. Do not give medical nutrition advice.`,
		`For cold-rain camping questions, explicitly name hypothermia risk, protect the dry sleep layer and warm layer first, set up early in a legal protected spot, keep the filter warm, verify the current forecast, and stop or bail out if the sleep system or camp setup cannot stay dry.`,
		`For family check-in questions, set cadence, content, normal gap expectations, escalation window, emergency contacts, itinerary sharing, and the live-location caveat. Use phrasing like "if they do not hear from you" or "if you miss a check-in"; never write "if you don't hear from you." Repeated missed check-ins, bad weather, health concerns, or itinerary mismatch should escalate beyond Scout.`,
		`For trail budget questions, separate daily burn from town spikes, hostels/shuttles/laundry/meals, gear replacement, and emergency cushion. Keep advice flexible around actual pace and services, and do not provide financial guarantees.`,
		`For zero, nero, or town-rest questions, visibly weigh body condition or injury, cached/current weather, town chores, budget, and the next section. Frame rest as an investment, not failure. If weather was fetched, include the weather summary or verification caveat in the decision.`,
		`For town questions about charging, refreshing, downloading, updating Scout, or leaving service, give a concrete pre-departure checklist: charge phone and battery bank, refresh field pack/current mile, finish cloud sync while online, update the local AI model on Wi-Fi and power, save offline maps/docs, verify Bible text is available offline, refresh weather and closure checks, then airplane-mode test with a water question. Say cached weather, closures, water, and services can go stale.`,
		`For resupply or mail-drop questions, avoid firm mail-ahead advice until the missing inputs are named: diet restrictions, expected pace, next town timing, store/post-office hours, hostel or shuttle access, and whether the item is hard to find locally. Give the default rule after that: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops. Never say hard-to-find items are better bought in town unless a current town source proves availability.`,
		`For first-aid kit or blister questions, keep the kit compact and personal. Include prevention tape, blister treatment, wound basics, normal personal meds, and a warning to stop or get medical help for spreading redness, drainage, fever, worsening pain, swelling, or changed gait. Do not diagnose.`,
		`For injury or pain questions, do not tell the hiker to train through pain. Keep the answer focused on the injury decision, not a general prep checklist. Lead with pain-free load reduction, low-impact conditioning, strength/mobility work, and clinician/physical-therapist guidance when pain persists, worsens, swells, or changes gait. Recommend low first-week mileage and stopping while normal recovery is still possible. Do not offer terrain lookups or custom workouts at the end.`,
		`Use the strongest 2-4 tool findings visibly in the answer. Convert source-skill discipline into specific actions; do not answer with generic outdoor advice when Scout supplied concrete findings.`,
		conversationLines.length
			? `Recent conversation before the current prompt:\n${conversationLines.join('\n')}\nUse this for follow-ups like "last question", "that", "the message before", or "what did I just ask". The current user prompt is not part of this history.`
			: '',
		`Hiker mile: ${pack.hiker.currentMile.toFixed(1)} of ${pack.frame.totalMiles.toFixed(1)} (${pack.hiker.direction}).`,
		`Day ${pack.hiker.dayNumber}. Target miles today: ${pack.hiker.targetMilesToday ?? 'unset'}.`,
		toolLines.length ? `Trail tool findings:\n${toolLines.join('\n')}` : '',
		`Cite sources from these findings. Do not invent landmarks. If a fact is volatile, ask the hiker to confirm it.`
	]
		.filter(Boolean)
		.join('\n\n');
}

function compactToolSummaryForContext(toolId: string, summary: string): string {
	const normalized = summary.replace(/\s+/gu, ' ').trim();
	const maxChars = toolId === 'source_search' ? 850 : toolId === 'open_source_doc' ? 700 : 650;
	if (normalized.length <= maxChars) return normalized;
	return `${normalized.slice(0, maxChars - 1).trimEnd()}...`;
}
