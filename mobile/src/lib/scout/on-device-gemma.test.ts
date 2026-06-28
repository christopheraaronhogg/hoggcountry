import test from 'node:test';
import assert from 'node:assert/strict';
import {
	OnDeviceGemmaProvider,
	polishOnDeviceAnswer,
	renderSystemContext,
	type OnDeviceGemmaBridge
} from './providers/on-device-gemma.ts';
import { cloneDefaultContextPack } from './default-pack.ts';

function bridge(state: { available: boolean }): OnDeviceGemmaBridge {
	return {
		isAvailable: async () => state.available,
		describeModel: async () => null,
		generate: async () => ({ text: 'ok', truncated: false })
	};
}

// Regression guard for the feature-breaking bug: available() used to memoize the
// first (false) probe forever, so after a model download completed the router
// NEVER picked on-device until an app restart. It must re-probe while false and
// only cache a confirmed-true result.
test('available() re-probes after a false result (does NOT cache false)', async () => {
	const state = { available: false };
	const provider = new OnDeviceGemmaProvider({ bridge: bridge(state) });

	assert.equal(await provider.available(), false, 'model not ready yet');

	state.available = true; // model finished downloading + verified
	assert.equal(await provider.available(), true, 'must re-probe and see the model become available');
});

test('available() caches a confirmed-true result', async () => {
	const state = { available: true };
	const provider = new OnDeviceGemmaProvider({ bridge: bridge(state) });

	assert.equal(await provider.available(), true);
	state.available = false; // even if the bridge flips, the positive is cached
	assert.equal(await provider.available(), true);
});

test('invalidateAvailability() forces a re-probe', async () => {
	const state = { available: true };
	const provider = new OnDeviceGemmaProvider({ bridge: bridge(state) });

	assert.equal(await provider.available(), true);
	state.available = false;
	provider.invalidateAvailability();
	assert.equal(await provider.available(), false, 'after invalidate it re-probes and sees unavailable');
});

test('no bridge → never available, never throws', async () => {
	const provider = new OnDeviceGemmaProvider({});
	assert.equal(await provider.available(), false);
});

test('a throwing bridge does not cache and does not crash', async () => {
	let throwIt = true;
	const provider = new OnDeviceGemmaProvider({
		bridge: {
			isAvailable: async () => {
				if (throwIt) throw new Error('transient');
				return true;
			},
			describeModel: async () => null,
			generate: async () => ({ text: '', truncated: false })
		}
	});
	assert.equal(await provider.available(), false, 'transient error → false, not cached');
	throwIt = false;
	assert.equal(await provider.available(), true, 're-probes after a transient failure');
});

test('generate retries a transient non-streaming native null response once', async () => {
	let attempts = 0;
	let warmed = 0;
	const provider = new OnDeviceGemmaProvider({
		bridge: {
			isAvailable: async () => true,
			describeModel: async () => null,
			warmUp: async () => {
				warmed += 1;
			},
			generate: async () => {
				attempts += 1;
				if (attempts === 1) {
					throw new Error('On-device Gemma generation failed: Invalid response from native layer: Native sendMessage returned null.');
				}
				return { text: 'Use the cached trail pack and answer plainly.', truncated: false };
			}
		}
	});

	const response = await provider.generate({
		prompt: 'What water is ahead?',
		pack: cloneDefaultContextPack(),
		toolInvocations: [],
		now: new Date('2026-06-20T12:00:00Z')
	});

	assert.equal(attempts, 2);
	assert.equal(warmed, 1);
	assert.equal(response.answer, 'Use the cached trail pack and answer plainly.');
});

test('generate does not retry a transient native null after streaming begins', async () => {
	let attempts = 0;
	const provider = new OnDeviceGemmaProvider({
		bridge: {
			isAvailable: async () => true,
			describeModel: async () => null,
			generate: async (_input, onToken) => {
				attempts += 1;
				onToken?.('partial');
				throw new Error('Invalid response from native layer: Native sendMessage returned null.');
			}
		}
	});

	await assert.rejects(
		() =>
			provider.generate(
				{
					prompt: 'What water is ahead?',
					pack: cloneDefaultContextPack(),
					toolInvocations: [],
					now: new Date('2026-06-20T12:00:00Z')
				},
				() => {}
			),
		/Native sendMessage returned null/
	);
	assert.equal(attempts, 1);
});

test('generate compacts oversized tool context before calling native Gemma', async () => {
	let seenContext = '';
	const provider = new OnDeviceGemmaProvider({
		bridge: {
			isAvailable: async () => true,
			describeModel: async () => null,
			generate: async (input) => {
				seenContext = input.systemContext;
				return { text: 'Carry extra water over the ridge.', truncated: false };
			}
		},
		tier: 'balanced'
	});

	await provider.generate({
		prompt: 'Should I camel up here or carry extra water over the ridge?',
		pack: cloneDefaultContextPack(),
		toolInvocations: [
			{
				toolId: 'source_search',
				args: {},
				summary: `Water guidance: ${'confirm current flow before committing '.repeat(900)}`,
				confidence: 'medium',
				receipts: []
			},
			{
				toolId: 'open_source_doc',
				args: {},
				summary: `Opened water document: ${'top off before dry ridge '.repeat(900)}`,
				confidence: 'medium',
				receipts: []
			}
		],
		now: new Date('2026-06-20T12:00:00Z')
	});

	assert.ok(seenContext.length <= 16_000);
	assert.match(seenContext, /Water guidance:/);
	assert.match(seenContext, /Opened water document:/);
});

test('system context keeps Scout plain-spoken and avoids markdown/corny voice', () => {
	const pack = cloneDefaultContextPack();
	pack.hiker.currentMile = 0;
	pack.hiker.dayNumber = 1;

	const systemContext = renderSystemContext({
		prompt: 'Man I dunno how hard is today gonna be?',
		pack,
		toolInvocations: [
			{
				toolId: 'trail-distance',
				args: {},
				summary: 'Next 10 miles include candidate water and Hawk Mountain Shelter.',
				confidence: 'medium',
				receipts: []
			}
		],
		now: new Date('2026-06-20T12:00:00Z')
	});

	assert.match(systemContext, /plain-spoken/);
	assert.match(systemContext, /Do not use "howdy", "partner", "well now"/);
	assert.match(systemContext, /Answer the hiker's immediate question first/);
	assert.match(systemContext, /Use plain text only/);
	assert.match(systemContext, /Do not use Markdown headings, bold markers, tables, or long bullet lists/);
	assert.match(systemContext, /Never turn candidate water, shelters, towns, or weather into guarantees/);
	assert.match(systemContext, /For water questions, use the next_water tool finding as the answer's spine/);
	assert.match(systemContext, /visually confirm current flow/);
	assert.match(systemContext, /filter or treat collected water/);
	assert.match(systemContext, /For "skip this spring and make the next reliable water" questions/);
	assert.match(systemContext, /current treated water carry, heat, exposure, climbing or effort, pace, daylight, and risk tolerance/);
	assert.match(systemContext, /Do not guarantee the seasonal source is flowing/);
	assert.match(systemContext, /For current water-report conflicts/);
	assert.match(systemContext, /trust the current observed or recent dry report for flow/);
	assert.match(systemContext, /Scout's cached pack as planning context, not proof of current flow/);
	assert.match(systemContext, /For heat-wave water questions/);
	assert.match(systemContext, /move hard miles into the cooler part of the day/);
	assert.match(systemContext, /dizziness, confusion, headache, nausea, cramps, chills, stopped sweating/);
	assert.match(systemContext, /For active heat illness or dizziness in heat/);
	assert.match(systemContext, /confusion, fainting, stopped sweating/);
	assert.match(systemContext, /For camel-up or ridge-water questions/);
	assert.match(systemContext, /camel up at the last confirmed source and carry extra/);
	assert.match(systemContext, /name both and make the carry decision/);
	assert.match(systemContext, /For dry-stretch water-carry questions/);
	assert.match(systemContext, /0\.5-1 liter per 3-5 miles/);
	assert.match(systemContext, /For questionable-water, tired, or low-daylight treatment questions/);
	assert.match(systemContext, /do not drink untreated questionable water/);
	assert.match(systemContext, /For frozen or failing water-filter questions/);
	assert.match(systemContext, /hollow-fiber filter may be compromised/);
	assert.match(systemContext, /For shelter and camping decisions/);
	assert.match(systemContext, /daylight, water, current shelter status\/crowding/);
	assert.match(systemContext, /For full-shelter, stealth-camping, storm-campsite/);
	assert.match(systemContext, /For bear-activity shelter questions/);
	assert.match(systemContext, /proper food storage and odor control/);
	assert.match(systemContext, /For bear-near-camp questions/);
	assert.match(systemContext, /do not invent species- or park-specific rules/);
	assert.match(systemContext, /For unsafe-person shelter or campsite questions/);
	assert.match(systemContext, /do not suggest confrontation/);
	assert.match(systemContext, /For closure or detour routing questions/);
	assert.match(systemContext, /advisory context rather than turn-by-turn detour routing/);
	assert.match(systemContext, /For smoke or fire near trail questions/);
	assert.match(systemContext, /never invent a safe route through the hazard/);
	assert.match(systemContext, /For severe fatigue or "too tired to keep going" prompts/);
	assert.match(systemContext, /stop hiking, sit in a safe spot, eat, drink treated water or electrolytes/);
	assert.match(systemContext, /use loaded water, shelter, town, or bailout context/);
	assert.match(systemContext, /For prayer plus safe-plan prompts/);
	assert.match(systemContext, /do not refuse to pray/);
	assert.match(systemContext, /Prayer alone is not a request for Bible quotes/);
	assert.match(systemContext, /prayer is support, not a substitute/);
	assert.match(systemContext, /For after-dark shelter arrivals/);
	assert.match(systemContext, /do not tell the hiker to choose a backup before dark/);
	assert.match(systemContext, /roughly 200 feet from water and trail/);
	assert.match(systemContext, /For rain-pants or rain-gear cut\/drop questions/);
	assert.match(systemContext, /For camp-shoes questions/);
	assert.match(systemContext, /When tool findings are labeled as guidance/);
	assert.match(systemContext, /For dry-clothes priority questions/);
	assert.match(systemContext, /For battery-bank planning questions/);
	assert.match(systemContext, /For mail-home gear questions/);
	assert.match(systemContext, /When preparation or training questions have pretrip/);
	assert.match(systemContext, /include an immediate first-week checklist/);
	assert.match(systemContext, /For first-run or newly installed app onboarding questions/);
	assert.match(systemContext, /set the hiker profile\/current mile/);
	assert.match(systemContext, /Do not call Scout ready for offline trail use until/);
	assert.match(systemContext, /For airplane-mode, no-cell, or "what works offline" Scout questions/);
	assert.match(systemContext, /cached field pack, on-device local AI model/);
	assert.match(systemContext, /fresh weather, official closures\/fire alerts/);
	assert.match(systemContext, /live\/tramily location/);
	assert.match(systemContext, /For "test airplane mode" or offline rehearsal questions/);
	assert.match(systemContext, /ask a water, weather, or offline Scout question/);
	assert.match(systemContext, /go back online and refresh before relying on weather, closures, water reports, town services, or safety-critical facts/);
	assert.match(systemContext, /For "what should I screenshot before day one"/);
	assert.match(systemContext, /next resupply or town\/bailout plan/);
	assert.match(systemContext, /do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat/);
	assert.match(systemContext, /For model-downloading, model status, stuck download, failed download/);
	assert.match(systemContext, /not ready for offline Scout yet/);
	assert.match(systemContext, /check Scout model status\/progress until it says ready/);
	assert.match(systemContext, /For stale field-pack, field-pack status/);
	assert.match(systemContext, /cached Scout trail data on the phone, not the physical backpack or loadout/);
	assert.match(systemContext, /check pack age\/status, current mile or downloaded region/);
	assert.match(systemContext, /For sign-in, login, account, cloud sync, backup, restore/);
	assert.match(systemContext, /accounts are invite-only/);
	assert.match(systemContext, /offline use does not require a live login/);
	assert.match(systemContext, /For own-mile, manual-mile, wrong-mile, profile, GPS correction/);
	assert.match(systemContext, /Settings > Edit hike details/);
	assert.match(systemContext, /refresh the field pack when online, and re-ask Scout for water, shelter, town, terrain, and bailout/);
	assert.match(systemContext, /a wrong mile shifts water, shelter, town, terrain, and bailout answers/);
	assert.match(systemContext, /not to make water, shelter, town, or safety decisions from a wrong mile/);
	assert.match(systemContext, /For guidebook, trail-sign, Scout, GPS, or map mile-mismatch questions/);
	assert.match(systemContext, /Scout uses a calibrated AT mile frame/);
	assert.match(systemContext, /guidebook editions, reroutes or relocations/);
	assert.match(systemContext, /do not let Scout mileage override posted signs, closures, or current official safety guidance/);
	assert.match(systemContext, /For "where am I relative to the next road crossing or town" questions/);
	assert.match(systemContext, /start from the current_mile finding and the next_town road\/town access finding/);
	assert.match(systemContext, /do not assume services at a crossing unless loaded current service data proves them/);
	assert.match(systemContext, /End every answer with a complete sentence/);
	assert.match(systemContext, /verify Bible text is available offline/);
	assert.match(systemContext, /Do not include Bible verses, scripture, prayer, or spiritual encouragement unless the hiker explicitly asks/);
	assert.match(systemContext, /For Bible or scripture questions/);
	assert.match(systemContext, /Psalms 56:3, Isaiah 41:10, 2 Timothy 1:7/);
	assert.match(systemContext, /Do not use disturbing, violent, judgment, or famine passages as comfort/);
	assert.match(systemContext, /make a one-hour plan/);
	assert.match(systemContext, /use loaded shelter context as a candidate rather than a guarantee/);
	assert.match(systemContext, /do not spiritualize away real danger or symptoms/);
	assert.match(systemContext, /never write "if you don't hear from you\."/);
	assert.match(systemContext, /For zero, nero, or town-rest questions/);
	assert.match(systemContext, /cached\/current weather, town chores, budget, and the next section/);
	assert.match(systemContext, /For hostel-full or lodging-full town questions/);
	assert.match(systemContext, /same-day bed space, shuttle\/pickup/);
	assert.match(systemContext, /Do not invent availability or unsafe\/illegal sleeping spots/);
	assert.match(systemContext, /For resupply or mail-drop questions/);
	assert.match(systemContext, /diet restrictions, expected pace, next town timing/);
	assert.match(systemContext, /For first-aid kit or blister questions/);
	assert.match(systemContext, /spreading redness, drainage, fever, worsening pain/);
	assert.match(systemContext, /do not tell the hiker to train through pain/);
	assert.match(systemContext, /pain persists, worsens, swells, or changes gait/);
	assert.match(systemContext, /Do not offer terrain lookups or custom workouts at the end/);
	assert.match(systemContext, /Use the strongest 2-4 tool findings visibly/);
});

test('polishOnDeviceAnswer fixes known local-model grammar and safety omissions', () => {
	assert.equal(
		polishOnDeviceAnswer(
			"Tell family what to do if you don't hear from you after that time.\n\nThis guidance comes from the safety guidance regarding family check-in and missed-contact discipline.",
			'What should I tell family about check-ins and what they should do if I miss one?'
		),
		'Tell family what to do if they do not hear from you after that time.\n\nNormal gaps can happen from dead zones, battery conservation, rain, or town chaos; live location may be delayed or unavailable, so do not treat it as guaranteed.'
	);

	assert.equal(
		polishOnDeviceAnswer('Save ID and insurance where you can access them offline.', 'What documents and information should I keep saved offline before day one?'),
		'Save ID and insurance where you can access them offline.\n\nDo not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; keep those saved separately offline.'
	);

	assert.equal(
		polishOnDeviceAnswer('Download maps and refresh the field pack.', 'What phone settings and offline downloads should I set before going offline?'),
		'Download maps and refresh the field pack.\n\nAlso verify Bible text is available offline.\n\nEmergency boundary: Scout and the phone do not replace inReach, PLB, 911, or the family emergency plan.'
	);

	const firstRunAnswer = polishOnDeviceAnswer(
		'First, you need to get your phone and battery bank charged. Then, refresh your field pack and confirm your current mile. Next, download the local AI model on Wi-Fi and power. Make sure you download offline maps and any other necessary documents.\n\nThis will get Scout set up to help you with navigation, planning, and other trail-related questions.',
		'I just installed the app. What do I do first so Scout is useful on trail?'
	);
	assert.match(firstRunAnswer, /First-run Scout setup/);
	assert.match(firstRunAnswer, /hiker profile and current mile/);
	assert.match(firstRunAnswer, /confirm the pack age\/status looks current/);
	assert.match(firstRunAnswer, /download or update the local AI model on Wi-Fi and power/);
	assert.match(firstRunAnswer, /save offline maps\/docs/);
	assert.match(firstRunAnswer, /let cloud sync finish if signed in/);
	assert.match(firstRunAnswer, /turn on airplane mode, relaunch, and ask Scout a water or nearby-trail question/);
	assert.match(firstRunAnswer, /Do not rely on Scout offline until the field-pack refresh, model download, and airplane-mode test succeed/);
	assert.doesNotMatch(firstRunAnswer, /Bible/);

	const nearCompleteFirstRunAnswer = polishOnDeviceAnswer(
		"First, set up your profile and current mile. Then, refresh your field pack and check the pack's age and status. Next, download or update the local AI model on Wi-Fi and power. Save your offline maps and documents, and let the cloud sync finish if you are signed in. After that, turn on airplane mode, relaunch the app, and ask Scout a question about water or the trail.",
		'I just installed the app. What do I do first so Scout is useful on trail?'
	);
	assert.doesNotMatch(nearCompleteFirstRunAnswer, /First-run Scout setup/);
	assert.match(
		nearCompleteFirstRunAnswer,
		/Do not rely on Scout offline until the field-pack refresh, model download, and airplane-mode test succeed/
	);
	assert.doesNotMatch(nearCompleteFirstRunAnswer, /Bible/);

	const airplaneModeAnswer = polishOnDeviceAnswer(
		'You can use Scout with no cell service if you are in airplane mode, but you need to make sure you have done your offline setup. Scout does not replace your inReach, PLB, 911, or your family emergency plan.',
		'Can I use Scout with no cell service if I am in airplane mode?'
	);
	assert.match(airplaneModeAnswer, /Airplane-mode boundary/);
	assert.match(airplaneModeAnswer, /cached field pack/);
	assert.match(airplaneModeAnswer, /on-device local AI model/);
	assert.match(airplaneModeAnswer, /saved offline maps\/docs/);
	assert.match(airplaneModeAnswer, /Bible text if it was packaged or downloaded/);
	assert.match(airplaneModeAnswer, /fresh weather, official closures or fire alerts/);
	assert.match(airplaneModeAnswer, /cloud sync\/backup, messages, or live\/tramily location/);
	assert.match(airplaneModeAnswer, /Treat cached weather, closures, water, and services as stale/);

	const modelDownloadingAnswer = polishOnDeviceAnswer(
		"It means the system is still getting the necessary information to run the local AI model effectively. It's working to get the right knowledge base loaded for you.\n\nYou should keep your phone charged and connected to Wi-Fi if possible to let it finish downloading. If it's been a while, you can try restarting the process.",
		'What does it mean if Scout says the model is still downloading?'
	);
	assert.doesNotMatch(modelDownloadingAnswer, /knowledge base/);
	assert.match(modelDownloadingAnswer, /on-device local AI model is still downloading and verifying/);
	assert.match(modelDownloadingAnswer, /not ready for offline Scout yet/);
	assert.match(modelDownloadingAnswer, /Wi-Fi and power/);
	assert.match(modelDownloadingAnswer, /check Scout model status or progress until it says ready/);
	assert.match(modelDownloadingAnswer, /retry, cancel, or restart/);
	assert.match(modelDownloadingAnswer, /Do not trust offline\/local AI until the model reports ready/);
	assert.match(modelDownloadingAnswer, /airplane-mode Scout question succeeds/);

	const staleFieldPackAnswer = polishOnDeviceAnswer(
		"You can check your pack for signs of staleness by looking at the condition of your gear and your own physical state. A stale pack often shows up as gear that is damaged, worn out, or not functioning as expected.\n\nYou should check your sleep system, rain gear, water filter, first aid kit, and battery bank. If any of these items are showing signs of wear, damage, or poor performance, that's a sign to re-evaluate them.",
		'How do I know if my field pack is stale before I trust Scout?'
	);
	assert.doesNotMatch(staleFieldPackAnswer, /sleep system|rain gear|physical state/);
	assert.match(staleFieldPackAnswer, /Scout's field pack is the cached trail data on the phone, not the physical backpack/);
	assert.match(staleFieldPackAnswer, /check the pack age\/status, current mile or downloaded region, and source timestamps/);
	assert.match(staleFieldPackAnswer, /wrong mile\/region/);
	assert.match(staleFieldPackAnswer, /weather, closures, water, or services changed/);
	assert.match(staleFieldPackAnswer, /Refresh on Wi-Fi or in town before water, weather, closure, bailout, or town-service decisions/);
	assert.match(staleFieldPackAnswer, /caution signals, not current proof/);

	const signInAnswer = polishOnDeviceAnswer(
		'You can sign in before the trail if you need to access specific offline maps or documents, but you should also make sure your phone and battery are ready for offline use. The findings state that signing in helps recover data and sync changes between devices.',
		'Should I sign in before the trail, or can I wait?'
	);
	assert.doesNotMatch(signInAnswer, /findings state/);
	assert.match(signInAnswer, /accounts are invite-only/);
	assert.match(signInAnswer, /sign in before the trail on Wi-Fi/);
	assert.match(signInAnswer, /backup, restore, and cloud sync/);
	assert.match(signInAnswer, /recover data if the phone is replaced/);
	assert.match(signInAnswer, /Offline Scout\/local AI is separate/);
	assert.match(signInAnswer, /downloaded field pack, on-device model, and saved maps\/docs/);
	assert.match(signInAnswer, /without a live login/);
	assert.match(signInAnswer, /not an emergency safety system/);

	const ownMileAnswer = polishOnDeviceAnswer(
		'You tell Scout your current mile is 0.0 of 2197.4. I will use that as the starting point for our planning.\n\nTo make Scout follow your own trail mile, you just need to tell me where you are. When you ask a question, state your current mile marker clearly. That way, I can base my advice on your actual progress on the trail.',
		"How do I make Scout follow my own trail mile instead of someone else's?"
	);
	assert.match(ownMileAnswer, /Own-mile setup/);
	assert.match(ownMileAnswer, /Settings > Edit hike details/);
	assert.match(ownMileAnswer, /check Today and Scout both show the new mile/);
	assert.match(ownMileAnswer, /A wrong mile shifts water, shelter, town, terrain, and bailout answers/);
	assert.match(ownMileAnswer, /trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap/);
	assert.doesNotMatch(ownMileAnswer, /Bible/);

	const nearCompleteOwnMileAnswer = polishOnDeviceAnswer(
		'To make Scout follow your trail mile, use the hike setup sheet, choose Start my hike, and enter your current AT mile. Later, use Settings > Edit hike details or a confirmed mile update, and then check Today and Scout show the new mile. Refresh your field pack when you are online and ask Scout questions after changing your mile.',
		"How do I make Scout follow my own trail mile instead of someone else's?"
	);
	assert.doesNotMatch(nearCompleteOwnMileAnswer, /Own-mile setup/);
	assert.match(
		nearCompleteOwnMileAnswer,
		/A wrong mile shifts water, shelter, town, terrain, and bailout answers/
	);
	assert.match(
		nearCompleteOwnMileAnswer,
		/trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap/
	);

	const wrongMileAnswer = polishOnDeviceAnswer(
		"If you enter the wrong trail mile, stop immediately and check your map or GPS. Safety guidance states that safety decisions prefer current checks and safer stops when online.",
		'What if I enter the wrong trail mile by mistake?'
	);
	assert.doesNotMatch(wrongMileAnswer, /Safety guidance states/);
	assert.match(wrongMileAnswer, /Wrong-mile recovery/);
	assert.match(wrongMileAnswer, /Current AT mile/);
	assert.match(wrongMileAnswer, /Settings > Edit hike details/);
	assert.match(wrongMileAnswer, /manual mile update/);
	assert.match(wrongMileAnswer, /trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap/);
	assert.match(wrongMileAnswer, /refresh the field pack when online/);
	assert.match(wrongMileAnswer, /re-ask Scout for water, shelter, town, terrain, and bailout/);
	assert.match(wrongMileAnswer, /A wrong mile shifts water, shelter, town, terrain, and bailout answers/);
	assert.match(wrongMileAnswer, /do not make water, shelter, town, or safety decisions from a wrong mile/);

	const airplaneModeRehearsalAnswer = polishOnDeviceAnswer(
		'First, charge your phone and battery bank. Then, refresh your field pack and current mile. Next, finish cloud sync while online. After that, update the local AI model on Wi-Fi and power. Then, save offline maps and documents. You should also test airplane mode with a water question.',
		'How do I test airplane mode before leaving town?'
	);
	assert.match(airplaneModeRehearsalAnswer, /Airplane-mode rehearsal/);
	assert.match(airplaneModeRehearsalAnswer, /turn on airplane mode or disable network/);
	assert.match(airplaneModeRehearsalAnswer, /fully relaunch Scout/);
	assert.match(airplaneModeRehearsalAnswer, /ask a water, weather, or offline Scout question/);
	assert.match(airplaneModeRehearsalAnswer, /cached field pack\/local model\/saved docs/);
	assert.match(airplaneModeRehearsalAnswer, /not that live data is current/);
	assert.match(airplaneModeRehearsalAnswer, /Go back online and refresh before relying on weather, closures, water reports, town services, or other safety-critical facts/);

	const screenshotPrepAnswer = polishOnDeviceAnswer(
		'You should take a screenshot of your current location, your itinerary, and any critical contact information. This is a basic safety measure for when technology fails.\n\nVerify that your phone is charged and that you have downloaded any necessary offline maps or documents before you leave service.\n\nMake sure you have saved your itinerary and emergency contacts somewhere you can access them offline, as Scout advises keeping personal documents separate from the trail data.',
		'What should I screenshot before day one in case the app or signal acts up?'
	);
	assert.match(screenshotPrepAnswer, /Before day one, screenshot or save offline/);
	assert.match(screenshotPrepAnswer, /itinerary and check-in plan/);
	assert.match(screenshotPrepAnswer, /emergency contacts/);
	assert.match(screenshotPrepAnswer, /next resupply or town\/bailout plan/);
	assert.match(screenshotPrepAnswer, /offline map download\/status/);
	assert.match(screenshotPrepAnswer, /Scout field-pack\/local-model status/);
	assert.match(screenshotPrepAnswer, /key permits or reservations/);
	assert.match(screenshotPrepAnswer, /Keep copies outside Scout too/);
	assert.match(screenshotPrepAnswer, /Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat/);

	assert.equal(
		polishOnDeviceAnswer(
			'Buy common food in town. Mail special items to verified stops and confirm store hours.',
			'What should I mail ahead versus buy in town for resupply?'
		),
		'Before making a firm mail-versus-town call, confirm diet restrictions, expected pace, next town timing, store and post-office hours, hostel or shuttle access, and whether the item is hard to find locally. Default rule: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops.\n\nBuy common food in town. Mail special items to verified stops and confirm store hours.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'This covers the offline readiness steps mentioned in the safety guidance.',
			'What should I charge, refresh, and download in town before I lose service again?'
		),
		'Before leaving service: charge the phone and battery bank, refresh the field pack, confirm your current mile, let cloud sync finish while you still have service, download or update the local AI model on Wi-Fi and power, save offline maps/docs, verify Bible text is available offline, refresh weather and closure checks, then turn on airplane mode, relaunch, and ask Scout a water question. Treat cached weather, closures, water, and services as stale until refreshed again; Scout does not replace inReach, PLB, 911, or the family emergency plan.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Your shakedown hike should prove the sleep system, rain system, cooking and food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow.',
			'What should my shakedown hike prove before I leave?'
		),
		'Your shakedown hike should prove the sleep system, rain system, cooking and food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow.\n\nShakedown caveat: one shakedown does not prove every condition is covered. Treat failures as specific gear, app, food, water, foot-care, sleep, rain, battery, or pack-fit fixes before Springer.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Use the cached trail line and external offline maps if they are available. Do not rely on missing basemap tiles for complex navigation.',
			'How do I use the map when there is no basemap or cell signal?'
		),
		'Use the cached trail line and external offline maps if they are available. Do not rely on missing basemap tiles for complex navigation.'
	);

	const guidebookMileMismatchAnswer = polishOnDeviceAnswer(
		"Your mile doesn't match because the trail you are on might have a different numbering system than the guidebook you are using, or the guidebook might be referencing a different section or route.\n\nThe guidance says mileage decisions start with body condition, daylight, elevation, water spacing, weather, pack weight, foot or knee condition, and the next legal shelter, campsite, or town stop.",
		'Why does my mile not match the guidebook or trail sign?',
		[
			{
				toolId: 'current_mile',
				args: {},
				summary: 'Currently at mile 87.8 of 2197.4 (4.0% complete, 2109.6 mi remaining).',
				confidence: 'high',
				receipts: []
			}
		]
	);
	assert.match(guidebookMileMismatchAnswer, /Scout's loaded position is currently at mile 87\.8/);
	assert.match(guidebookMileMismatchAnswer, /Your mile can differ because Scout's trail miles/);
	assert.match(guidebookMileMismatchAnswer, /calibrated AT mile frame/);
	assert.match(guidebookMileMismatchAnswer, /guidebook editions, reroutes or relocations/);
	assert.match(guidebookMileMismatchAnswer, /manual Current AT mile entry/);
	assert.match(guidebookMileMismatchAnswer, /Ask which guidebook, sign, edition, or source you are comparing/);
	assert.match(guidebookMileMismatchAnswer, /Do not let Scout mileage override posted signs, closures, or current official guidance/);
	assert.doesNotMatch(guidebookMileMismatchAnswer, /Mileage decisions start with body condition/i);

	const roadTownNavigationAnswer = polishOnDeviceAnswer(
		'You are about 4.8 miles from the Pilot Gap Road at mile 49.5, which is a road crossing with an emergency exit candidate. The next reliable water source is a seasonal seep ahead at mile 46.5, followed by a reliable creek crossing at mile 50.9. You are also near the Ridge Shelter at mile 48.1 and the Pine Gap Campsite at mile 53.6.',
		'Where am I relative to the next road crossing or town?',
		[
			{
				toolId: 'current_mile',
				args: {},
				summary: 'Currently at mile 44.7 of 2197.4 (2.0% complete, 2152.7 mi remaining).',
				confidence: 'high',
				receipts: []
			},
			{
				toolId: 'next_town',
				args: { fromMile: 44.7 },
				summary: 'Pilot Gap Road at mile 49.5 (4.8 mi ahead via road crossing; emergency exit candidate, confirm shuttle or pickup). No guaranteed services at the crossing.',
				confidence: 'medium',
				receipts: []
			}
		]
	);
	assert.doesNotMatch(roadTownNavigationAnswer, /reliable water source is a seasonal seep/i);
	assert.match(roadTownNavigationAnswer, /closest loaded water candidate is a seasonal seep/);
	assert.match(roadTownNavigationAnswer, /Currently at mile 44\.7/);
	assert.match(roadTownNavigationAnswer, /next loaded road\/town access is Pilot Gap Road at mile 49\.5/);
	assert.match(roadTownNavigationAnswer, /confirm shuttle or pickup/i);
	assert.match(roadTownNavigationAnswer, /do not assume services at a road crossing/i);

	assert.equal(
		polishOnDeviceAnswer('Protect your knee. I can look up terrain, but I can', 'How should I train with a bad knee before the first week of the AT?'),
		'First: do not train through worsening pain. Back off or stop if pain worsens, swelling appears, or your gait changes; use pain-free load reduction, low-impact conditioning, and clinician or physical-therapist guidance before building mileage.\n\nProtect your knee.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Protect your knee.\n\nA shakedown hike should prove your sleep system, rain system, and offline app flow.\n\nThis approach is what the terrain guidance suggests for the first trail week.',
			'How should I train with a bad knee before the first week of the AT?'
		),
		'First: do not train through worsening pain. Back off or stop if pain worsens, swelling appears, or your gait changes; use pain-free load reduction, low-impact conditioning, and clinician or physical-therapist guidance before building mileage.\n\nProtect your knee.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'For practical next steps, first, check the weather and any immediate hazards around you. If you are cold or wet, get warm and dry immediately. Eat or drink if you have food or water available. Make a one-hour plan for what you need to do next, focusing on immediate safety. If you feel you are in immediate danger, use your emergency plan.\n\nYou need to check the weather and any immediate hazards around you. If you are cold or wet, get warm and dry immediately. Eat or drink if you have food or water available. Make a one-hour plan for what you need to do next, focusing on immediate safety. If you feel you are in immediate danger, use your emergency plan.',
			'I am scared and alone tonight. Give me scripture and practical next steps.'
		),
		'For practical next steps, first, check the weather and any immediate hazards around you. If you are cold or wet, get warm and dry immediately. Eat or drink if you have food or water available. Make a one-hour plan for what you need to do next, focusing on immediate safety. If you feel you are in immediate danger, use your emergency plan.\n\nNight support note: take the loaded KJV scripture as comfort, then make the next hour concrete. Check immediate hazards, weather, and alerts if possible; get warm and dry, eat or drink if needed, use your headlamp, and choose the nearest safe legal sleep option or known public/help option. Do not let comfort verses override danger; use 911, inReach/PLB, ranger/authorities, or the emergency plan for real danger, injury, exposure, or repeated panic.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'It sounds like you are feeling really scared and alone right now. Remember what you said: "What time I am afraid, I will trust in thee" (Psalms 56:3). You are not alone in this moment, and there are people who care.\n\nFor right now, your first step is to focus on immediate safety. Check the weather and any local alerts for any immediate danger like severe weather or hazards. If you are feeling overwhelmed, take a moment to breathe. If you are in immediate danger, use your emergency plan right away.\n\nIf you are feeling scared or alone, remember that you have resources. You can call for help or reach out to someone you trust. If you are feeling scared, scared, or alone, remember that you are supported. You can find comfort in the verses that remind you that you are not facing this alone.',
			'I am scared and alone tonight. Give me scripture and practical next steps.',
			[
				{
					toolId: 'next_shelter',
					args: { fromMile: 71.9 },
					summary: 'Near Ridge Shelter at mile 75.3 (3.4 mi ahead). Open-data candidate; verify current status, water, and crowding.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'It sounds like you are feeling really scared and alone right now. Remember the loaded verse: "What time I am afraid, I will trust in thee" (Psalms 56:3). You are not alone in this moment, and there are people who care.\n\nFor right now, your first step is to focus on immediate safety. Check the weather and any local alerts for any immediate danger like severe weather or hazards. If you are feeling overwhelmed, take a moment to breathe. If you are in immediate danger, use your emergency plan right away.\n\nIf you are feeling scared or alone, remember that you have resources. You can call for help or reach out to someone you trust. If you are feeling scared or alone, remember that you are supported. You can find comfort in the verses that remind you that you are not facing this alone.\n\nNight support note: take the loaded KJV scripture as comfort, then make the next hour concrete. Check immediate hazards, weather, and alerts if possible; get warm and dry, eat or drink if needed, use your headlamp, and choose the nearest safe legal sleep option or known public/help option. Do not let comfort verses override danger; use 911, inReach/PLB, ranger/authorities, or the emergency plan for real danger, injury, exposure, or repeated panic. Loaded shelter context: Near Ridge Shelter at mile 75.3 (3.4 mi ahead). Open-data candidate; verify current status, water, and crowding. Treat that as a candidate, not a guarantee; verify status, water, and crowding when possible, and do not add risky night miles if it is not the safer legal option.'
	);

	assert.equal(
		polishOnDeviceAnswer('The next water is at mile 138.3. The reliable creek is at mile 142.7.', 'Should I camel up?'),
		'The next water is at mile 138.3. The reliable creek is at mile 142.7.\n\nRidge-water decision note: camel up at the last confirmed source and carry extra over the ridge when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only carry the lighter plan when the next reliable water is confirmed and conditions are mild.'
	);

	const skipSeasonalWaterAnswer = polishOnDeviceAnswer(
		"You can't skip the next reliable water source. The next reliable water is a creek crossing at mile 49.3, which is 6.2 miles ahead. You should plan to reach that source.\n\nThe seasonal seep ahead at mile 44.9 is unconfirmed and seasonal, so it is not a reliable source to rely on. You should plan to carry enough water to make it to the creek crossing.\n\nYou should plan to carry water based on the dry-stretch guidance: roughly 0.5 to 1 liter per 3 to 5 miles as a starting point, increasing that amount for heat, exposure, climbing, slow pace, or personal thirst. Top off your water at the last confirmed source before you reach the creek crossing.",
		'Can I skip this next spring and make the next reliable water source?',
		[
			{
				toolId: 'next_water',
				args: { fromMile: 43.1 },
				summary: 'Next reliable water loaded: Reliable creek crossing at mile 49.3 (6.2 mi ahead, reliable). Treat/filter before drinking. Closer unconfirmed water before that: Seasonal seep ahead at mile 44.9 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
				confidence: 'medium',
				receipts: []
			}
		]
	);
	assert.doesNotMatch(skipSeasonalWaterAnswer, /You can't skip the next reliable water source/);
	assert.match(skipSeasonalWaterAnswer, /Do not count the seasonal spring as reliable/);
	assert.match(skipSeasonalWaterAnswer, /current treated carry/);
	assert.match(skipSeasonalWaterAnswer, /heat, exposure, climbing, slow pace, daylight, and your risk tolerance/);
	assert.match(skipSeasonalWaterAnswer, /visually confirm it is flowing/);
	assert.match(skipSeasonalWaterAnswer, /filter or treat at the spring/);
	assert.match(skipSeasonalWaterAnswer, /do not assume seasonal water is flowing/);

	const directSkipSeasonalWaterAnswer = polishOnDeviceAnswer(
		'You can skip the seasonal seep at mile 44.9 and make the reliable creek crossing at mile 49.3 your next water source. The creek crossing is the next reliable water, which is what you should plan for.',
		'Can I skip this next spring and make the next reliable water source?'
	);
	assert.doesNotMatch(directSkipSeasonalWaterAnswer, /You can skip the seasonal seep/);
	assert.match(directSkipSeasonalWaterAnswer, /Use the reliable creek crossing at mile 49\.3 as the planning target/);
	assert.match(directSkipSeasonalWaterAnswer, /skip the seasonal seep at mile 44\.9 only if your current treated carry and conditions give you enough margin/);

	const waterReportConflictAnswer = polishOnDeviceAnswer(
		'You should trust what is in your pack, especially when it comes to water. The next reliable water source is a creek crossing at mile 108.8, which is about six and a half miles ahead. There is also a seasonal seep ahead at mile 104.4, but that is unconfirmed.\n\nSince the spring is dry, you should plan to carry water conservatively for the next stretch. You should focus on ensuring your water filter and backup tablets are ready for the creek crossing at mile 108.8.',
		'FarOut says the spring is dry but my Scout pack has it listed. Which should I trust?',
		[
			{
				toolId: 'next_water',
				args: { fromMile: 102.6 },
				summary: 'Next reliable water loaded: Reliable creek crossing at mile 108.8 (6.2 mi ahead, reliable). Treat/filter before drinking. Closer unconfirmed water before that: Seasonal seep ahead at mile 104.4 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
				confidence: 'medium',
				receipts: []
			}
		]
	);
	assert.doesNotMatch(waterReportConflictAnswer, /trust what is in your pack/i);
	assert.match(waterReportConflictAnswer, /Trust the current dry report for flow/);
	assert.match(waterReportConflictAnswer, /use Scout's cached pack only as planning context/);
	assert.match(waterReportConflictAnswer, /treat the listed spring or seep as dry/);
	assert.match(waterReportConflictAnswer, /visually confirm flowing water/);
	assert.match(waterReportConflictAnswer, /next reliable or verified water/);
	assert.match(waterReportConflictAnswer, /filter or treat anything you collect/);

	assert.equal(
		polishOnDeviceAnswer(
			'I would top off here and keep the carry conservative until water is confirmed.',
			'Should I camel up here or carry extra water over the ridge?',
			[
				{
					toolId: 'next_water',
					args: { fromMile: 137.2 },
					summary: 'Next loaded water: Seasonal seep ahead at mile 138.3 (1.1 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
					confidence: 'medium',
					receipts: []
				},
				{
					toolId: 'upcoming_terrain',
					args: { fromMile: 137.2 },
					summary: 'Upcoming terrain: exposed ridge climb, then Reliable creek crossing (mi 142.7) after the descent.',
					confidence: 'medium',
					receipts: []
				},
				{
					toolId: 'weather_lookup',
					args: { fromMile: 137.2 },
					summary: 'Cached weather near mile 137.2: hot and humid (high 88F / low 69F). Heat makes dry climbs riskier.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'I would top off here and keep the carry conservative until water is confirmed.\n\nWeather note: Cached weather near mile 137.2: hot and humid (high 88F / low 69F). Heat makes dry climbs riskier.\n\nRidge-water decision note: camel up at the last confirmed source and carry extra over the ridge when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only carry the lighter plan when the next reliable water is confirmed and conditions are mild.\n\nRidge-water context: next water is Next loaded water: Seasonal seep ahead at mile 138.3 (1.1 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow; the next reliable loaded option is Reliable creek crossing (mi 142.7); weather context is Cached weather near mile 137.2: hot and humid (high 88F / low 69F). Heat makes dry climbs riskier. Decision: camel up at the last confirmed source and carry extra until reliable water is confirmed.\n\nWater verification note: Next loaded water: Seasonal seep ahead at mile 138.3 (1.1 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow. Visually confirm flow before relying on it, filter or treat any water you collect, and carry enough to reach a verified source if it is dry.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Stop at Ridge Shelter [source_search]. Verify water and crowding [next_shelter].',
			'Where should I sleep tonight?'
		),
		'Stop at Ridge Shelter. Verify water and crowding.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'The nearest loaded water is about a mile and eight ahead of you.',
			'What water is ahead from my current mile?'
		),
		'The nearest loaded water is about 1.8 miles ahead of you.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'The next loaded water is a seasonal seep ahead at mile 33.5, about 1.8 miles away. Since it is seasonal and unverified, carry extra.',
			'What water is ahead from my current mile?',
			[
				{
					toolId: 'next_water',
					args: { fromMile: 31.7 },
					summary: 'Next loaded water: Seasonal seep ahead at mile 33.5 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'The next loaded water is a seasonal seep ahead at mile 33.5, about 1.8 miles away. Since it is seasonal and unverified, carry extra.\n\nWater verification note: Next loaded water: Seasonal seep ahead at mile 33.5 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow. Visually confirm flow before relying on it, filter or treat any water you collect, and carry enough to reach a verified source if it is dry.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Weigh body condition, weather, chores, budget, and the next section. Rest is an investment, not failure.',
			'Should I take a zero or nero in this town?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 101.1 },
					summary: 'Cached weather near mile 101.1: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'Weigh body condition, weather, chores, budget, and the next section. Rest is an investment, not failure.\n\nWeather note: Cached weather near mile 101.1: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.'
	);

	const hostelFullAnswer = polishOnDeviceAnswer(
		'If the hostel is full when you reach the town, weigh your body condition and injury against the current weather and next trail section. Rest is an investment, not failure.\n\nLook at options available at the town, like the visitor center or developed campground, to see if there is any legal overnight option. If those are full, consider a short day or an early legal stop based on the current forecast and your fatigue level.',
		'What if the hostel is full when I reach town?',
		[
			{
				toolId: 'next_town',
				args: { fromMile: 287.5 },
				summary: 'Pilot Gap Road at mile 292.3 (4.8 mi ahead via road crossing; emergency exit candidate, confirm shuttle or pickup). No guaranteed services at the crossing.',
				confidence: 'medium',
				receipts: []
			},
			{
				toolId: 'park_services',
				args: { park: 'Appalachian Trail' },
				summary: 'NPS facilities for Appalachian National Scenic Trail (info/permits/resupply + legal overnight options, NOT thru-hiker shelters - confirm hours & reservations): Visitor center - Eval Visitor Contact Station (Appalachian Trail): Information, current conditions, and permit/ranger questions; verify hours before relying on it. Campground - Eval Developed Campground (Appalachian Trail): Legal developed camping example for backup planning; reservations and seasonal status must be confirmed.',
				confidence: 'medium',
				receipts: []
			}
		]
	);
	assert.match(hostelFullAnswer, /One more boundary/);
	assert.match(hostelFullAnswer, /Call or message ahead/);
	assert.match(hostelFullAnswer, /same-day bed space/);
	assert.match(hostelFullAnswer, /shuttle or pickup/);
	assert.match(hostelFullAnswer, /visitor-center hours/);
	assert.match(hostelFullAnswer, /campground reservations or seasonal status/);
	assert.match(hostelFullAnswer, /Do not invent availability or sleep in unsafe or illegal spots/);
	assert.match(hostelFullAnswer, /Pilot Gap Road at mile 292\.3/);
	assert.match(hostelFullAnswer, /no guaranteed services at the crossing/);
	assert.match(hostelFullAnswer, /visitor-center candidate/);
	assert.doesNotMatch(hostelFullAnswer, /Loaded context/);
	assert.doesNotMatch(hostelFullAnswer, /https:\/\//);

	assert.equal(
		polishOnDeviceAnswer(
			'Keep mileage conservative and protect your dry sleep layers. Verify the current forecast before exposed terrain, especially if thunderstorms are possible.',
			'What is a safe plan if I start the AT in heavy rain?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 0 },
					summary: 'Cached weather near mile 0.0: showers and possible thunderstorms (high 67F / low 51F, wind 22 mph). Lightning and wet-cold exposure are possible; verify live before exposed terrain.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'Keep mileage conservative and protect your dry sleep layers. Verify the current forecast before exposed terrain, especially if thunderstorms are possible.\n\nWeather note: Cached weather near mile 0.0: showers and possible thunderstorms (high 67F / low 51F, wind 22 mph). Lightning and wet-cold exposure are possible; verify live before exposed terrain.\n\nHeavy-rain start note: keep mileage conservative, protect dry sleep layers, watch footing on slick roots, rocks, bog boards, and descents, verify the current forecast, and stop or bail out for lightning, hypothermia risk, flooding, or worsening conditions.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Plan conservative mileage and verify current weather before moving into exposed terrain.',
			"Thunderstorms are possible this afternoon. What should I do with today's hike?"
		),
		'Plan conservative mileage and verify current weather before moving into exposed terrain.\n\nThunderstorm hike note: check live forecast or radar if available, avoid exposed ridges and high points during the storm window, shorten or shift mileage earlier, and stop or bail out if lightning, flooding, wet-cold exposure, or worsening weather appears.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Keep your warm layer and sleep system dry and verify the forecast before committing to a stop.',
			'How should I adjust for 35 degrees and wind on a ridge?'
		),
		'Keep your warm layer and sleep system dry and verify the forecast before committing to a stop.\n\nCold-wind ridge note: cap target miles, eat more often, drink steadily, protect hands, head, and feet, keep insulation and sleep layers dry, and treat wet wind on exposed ridges as hypothermia risk.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Cap your target miles and eat more often. Keep insulation and sleep layers dry, protect your hands, head, and feet, and treat wet wind as hypothermia risk.',
			'How should I adjust for 35 degrees and wind on a ridge?'
		),
		'Cap your target miles and eat more often. Keep insulation and sleep layers dry, protect your hands, head, and feet, and treat wet wind as hypothermia risk.\n\nCold-wind ridge note: cap target miles, eat more often, drink steadily, protect hands, head, and feet, keep insulation and sleep layers dry, and treat wet wind on exposed ridges as hypothermia risk.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Hydrate and take shade breaks today.',
			'It is going to be hot today. How should the plan change?'
		),
		'Hydrate and take shade breaks today.\n\nHot-day plan note: move harder miles into the cooler part of the day, carry more water when the next source is uncertain, schedule shade breaks, eat salty food or use electrolytes if available, and stop to cool down for dizziness, confusion, headache, nausea, cramps, stopped sweating, or worsening symptoms.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If your water filter freezes, use your backup water tablets and confirm the next water source before relying on it.',
			'What if my water filter freezes overnight?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 304.9 },
					summary: 'Cached weather near mile 304.9: cold wind and wet exposure (high 42F / low 28F, wind 22 mph). Wet wind can turn fatigue into hypothermia risk.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'If your water filter freezes, use your backup water tablets and confirm the next water source before relying on it.\n\nWeather note: Cached weather near mile 304.9: cold wind and wet exposure (high 42F / low 28F, wind 22 mph). Wet wind can turn fatigue into hypothermia risk.\n\nFrozen-filter note: if a hollow-fiber water filter froze, treat it as possibly compromised. Use backup tablets or another treatment until you can replace or verify it, and prevent it by sleeping with the filter or keeping it warm overnight.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Backflush the filter if you can, then use backup tablets if the flow stays bad. Confirm the next water source before relying on it.',
			'My water filter is slowing way down on trail. What should I do?',
			[
				{
					toolId: 'next_water',
					args: { fromMile: 52.4 },
					summary: 'Next loaded water: Seasonal seep ahead at mile 54.2 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'Backflush the filter if you can, then use backup tablets if the flow stays bad. Confirm the next water source before relying on it.\n\nWater-filter troubleshooting note: backflush or clean the filter first if the model supports it, protect hollow-fiber filters from freezing, use backup tablets or another treatment if flow stays bad or the filter may be compromised, and use the next confirmed water source before deciding to push past water.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Heat makes water decisions harder. Carry more water if the next source is not confirmed and look for shade when you can.',
			'How do I decide water in a heat wave when everything feels harder?'
		),
		'Heat makes water decisions harder. Carry more water if the next source is not confirmed and look for shade when you can.\n\nHeat-water safety note: do not keep hiking through dizziness. Stop, get shade, cool down, and sip treated water with electrolytes if safe. Seek urgent help or use the emergency plan for confusion, fainting, stopped sweating, or symptoms that worsen or do not improve.\n\nHeat-water planning note: move harder miles into the cooler part of the day, schedule shade breaks, eat salty food or use electrolytes if available, and carry conservatively to verified water when the next source is seasonal, unverified, exposed, or after a hard climb.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Stop hiking right now. Find some shade and cool down. Sip on any treated water you have, and if you feel dizzy, confused, have a headache, nausea, cramps, chills, stopped sweating, or worsening symptoms, you need to escalate your situation.\n\nThe weather is hot, and you are showing signs of heat illness. You need to stop moving and focus on cooling down immediately.\n\nYou should stop hiking and find shade to cool down.',
			'I am dizzy and it is hot. What should I do?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 93.9 },
					summary: 'Cached weather near mile 93.9: hot, humid afternoon (high 88F / low 51F, wind 9 mph). Heat illness risk increases if water or shade is limited.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'Stop hiking right now. Find some shade and cool down. Sip on any treated water you have, and if you feel dizzy, confused, have a headache, nausea, cramps, chills, stopped sweating, or worsening symptoms, you need to escalate your situation.\n\nThe weather is hot, and you are showing signs of heat illness. You need to stop moving and focus on cooling down immediately.\n\nYou should stop hiking and find shade to cool down.\n\nWeather note: Cached weather near mile 93.9: hot, humid afternoon (high 88F / low 51F, wind 9 mph). Heat illness risk increases if water or shade is limited.\n\nHeat-water safety note: do not keep hiking through dizziness. Stop, get shade, cool down, and sip treated water with electrolytes if safe. Seek urgent help or use the emergency plan for confusion, fainting, stopped sweating, or symptoms that worsen or do not improve.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Stop hiking right now. Find some shade immediately and cool down. Sip water with electrolytes if you have them. If you feel dizzy, confused, or have any of the other symptoms you mentioned, you need to stop and assess the situation.\n\nIf your symptoms worsen or you feel like you are in danger, you need to use your emergency plan or call for help. Do not keep hiking through these symptoms.\n\nI recommend you stop, find shade, and focus on cooling down and hydrating safely.',
			'I am dizzy and it is hot. What should I do?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 93.9 },
					summary: 'Cached weather near mile 93.9: hot, humid afternoon (high 88F / low 51F, wind 9 mph). Heat illness risk increases if water or shade is limited.',
					confidence: 'medium',
					receipts: []
				},
				{
					toolId: 'next_water',
					args: {},
					summary: 'Next loaded water: Seasonal seep ahead at mile 95.7 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
					confidence: 'low',
					receipts: []
				}
			]
		),
		'Stop hiking right now. Find some shade immediately and cool down. Sip water with electrolytes if you have them. If you feel dizzy, confused, or have any of the other symptoms you mentioned, you need to stop and assess the situation.\n\nIf your symptoms worsen or you feel like you are in danger, you need to use your emergency plan or call for help. Do not keep hiking through these symptoms.\n\nI recommend you stop, find shade, and focus on cooling down and hydrating safely.\n\nWeather note: Cached weather near mile 93.9: hot, humid afternoon (high 88F / low 51F, wind 9 mph). Heat illness risk increases if water or shade is limited.\n\nHeat-water safety note: do not keep hiking through dizziness. Stop, get shade, cool down, and sip treated water with electrolytes if safe. Seek urgent help or use the emergency plan for confusion, fainting, stopped sweating, or symptoms that worsen or do not improve.\n\nWater verification note: Next loaded water: Seasonal seep ahead at mile 95.7 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow. Visually confirm flow before relying on it, filter or treat any water you collect, and carry enough to reach a verified source if it is dry.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Check the current flow before deciding whether to carry extra water over the ridge.',
			'Should I camel up here or carry extra water over the ridge?'
		),
		'Check the current flow before deciding whether to carry extra water over the ridge.\n\nRidge-water decision note: camel up at the last confirmed source and carry extra over the ridge when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only carry the lighter plan when the next reliable water is confirmed and conditions are mild.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Scout cannot verify current flow from the cache. The seasonal seep may be dry, so be conservative.',
			'If Scout does not know current water flow, how should I decide whether to rely on the next source?',
			[
				{
					toolId: 'next_water',
					args: { fromMile: 227.9 },
					summary: 'Next loaded water: Seasonal seep ahead at mile 230.1 (2.2 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'Scout cannot verify current flow from the cache. The seasonal seep may be dry, so be conservative.\n\nUnknown-flow note: cached water context is Next loaded water: Seasonal seep ahead at mile 230.1 (2.2 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow. This does not prove current flow. Verify flow at the source or with a current report, filter or treat any water you collect, and choose a safer carry or stop as if the source may be dry until confirmed.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Carry enough water for the distance plus a buffer, and verify the seasonal seep before relying on it.',
			'How much water should I carry for a 10 mile dry stretch today?'
		),
		'Carry enough water for the distance plus a buffer, and verify the seasonal seep before relying on it.\n\nDry-stretch water note: for a 10-mile dry stretch, start from roughly 0.5-1 liter per 3-5 miles, increase for heat, exposed climbing, slow pace, or personal thirst, top off at the last confirmed source, and carry enough to reach the next reliable source when the next source is seasonal or unverified.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If you are tired and low on daylight, slow down and think through the water choice.',
			'How do I treat questionable water if I am tired and low on daylight?'
		),
		'If you are tired and low on daylight, slow down and think through the water choice.\n\nQuestionable-water note: treatment is non-negotiable even when tired or low on daylight; filter or backflush if needed, use backup tablets or boil if the filter is slow or suspect, do not drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If you are tired and low on daylight, treatment is non-negotiable. Filter or backflush if needed, use backup tablets or boil, do not drink untreated questionable water, and choose a safe legal stop before dark.\n\nThis advice comes from the safety guidance found in the open_source_doc.',
			'How do I treat questionable water if I am tired and low on daylight?'
		),
		'If you are tired and low on daylight, treatment is non-negotiable. Filter or backflush if needed, use backup tablets or boil, do not drink untreated questionable water, and choose a safe legal stop before dark.'
	);

	const severeFatigueAnswer = polishOnDeviceAnswer(
		'You need to slow down and focus on your immediate safety. The safety guidance suggests that for severe fatigue, you should choose a lower-risk stop. You should stop hiking, find shade, and cool down. Sip treated water with electrolytes if you have them, and watch for any signs of heat illness like dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms.\n\nThe trail tool findings indicate that you are near a potential water source at mile 191.1, which is seasonal and open-reference, so you should consider that as a potential stop if you need to rest. You are also near a Ridge Shelter at mile 192.7, which is an open-data candidate, so you should check its current status, water, and crowding before deciding on a sleep plan.\n\nIf you are feeling too tired to think clearly, the best immediate action is to stop, sit down, and focus on your body. Take a few minutes to breathe and assess your physical state before making any major decisions about where to go next.',
		'I feel too tired to keep going. Help me think clearly.',
		[
			{
				toolId: 'next_water',
				args: { fromMile: 189.3 },
				summary: 'Next loaded water: Seasonal seep ahead at mile 191.1 (1.8 mi ahead, seasonal). Seasonal open-reference candidate; confirm current flow.',
				confidence: 'medium',
				receipts: []
			},
			{
				toolId: 'next_shelter',
				args: { fromMile: 189.3 },
				summary: 'Near Ridge Shelter at mile 192.7 (3.4 mi ahead). Open-data candidate; verify current status, water, and crowding.',
				confidence: 'medium',
				receipts: []
			}
		]
	);
	assert.doesNotMatch(severeFatigueAnswer, /\bheat illness\b|find shade|cool down|nausea|cramps|stopped sweating/);
	assert.match(severeFatigueAnswer, /Severe-fatigue note: stop hiking now and sit in a safe spot/);
	assert.match(severeFatigueAnswer, /Eat a snack, drink treated water or electrolytes, adjust layers/);
	assert.match(severeFatigueAnswer, /check daylight, weather, body symptoms/);
	assert.match(severeFatigueAnswer, /water: Next loaded water: Seasonal seep ahead at mile 191\.1/);
	assert.match(severeFatigueAnswer, /shelter: Near Ridge Shelter at mile 192\.7/);
	assert.match(severeFatigueAnswer, /inability to make decisions/);

	const prayerSafePlanAnswer = polishOnDeviceAnswer(
		"I can help you make a safe plan. I can't pray, but I can help you think through the next steps.\n\nThe nearest option is Ridge Shelter ahead. Check weather, shelter status, and water before committing. If you are in danger, use your emergency plan.\n\nThe King James Bible offers verses like Esther 4:8 — \"Also he gave him the copy of the writing of the decree that was given at Shushan to destroy them...\" and Psalms 38:22 — \"Make haste to help me, O Lord my salvation.\"",
		'Can you pray with me but also help me make a safe plan?',
		[
			{
				toolId: 'next_shelter',
				args: { fromMile: 246.8 },
				summary: 'Near Ridge Shelter at mile 250.2 (3.4 mi ahead). Open-data candidate; verify current status, water, and crowding.',
				confidence: 'medium',
				receipts: []
			}
		]
	);
	assert.doesNotMatch(prayerSafePlanAnswer, /\b(?:can't|cannot) pray\b/i);
	assert.doesNotMatch(prayerSafePlanAnswer, /Esther 4:8|destroy them|The King James Bible offers/i);
	assert.match(prayerSafePlanAnswer, /Yes\. Here is a short prayer you can pray: Lord, steady me, give me wisdom, and help me choose the safe next step\. Amen\./);
	assert.match(prayerSafePlanAnswer, /Prayer and safety note: make the plan practical/);
	assert.match(prayerSafePlanAnswer, /Lord, steady me, give me wisdom, and help me choose the safe next step/);
	assert.match(prayerSafePlanAnswer, /Ridge Shelter at mile 250\.2/);
	assert.match(prayerSafePlanAnswer, /verify current status, water, and crowding/);
	assert.match(prayerSafePlanAnswer, /Prayer is support, not a substitute for help/);
	assert.match(prayerSafePlanAnswer, /911, inReach\/PLB, rangers\/authorities, or the emergency plan/);

	assert.equal(
		polishOnDeviceAnswer(
			'You should aim for the nearest shelter and verify water and crowding before committing.',
			'Where should I sleep tonight if I am tired early?'
		),
		'You should aim for the nearest shelter and verify water and crowding before committing.\n\nShelter-decision note: when fatigue drives the sleep choice, choose the safer legal stop and check daylight, water, current shelter status or crowding, local rules, and a backup option before committing.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If the shelter is full, look for another legal campsite or town stop.',
			'What if the shelter is full when I arrive?'
		),
		'If the shelter is full, look for another legal campsite or town stop.\n\nFull-shelter note: if the shelter is full, stay courteous, use legal established overflow tenting only if allowed, choose a backup before dark, and avoid unsafe or illegal camping.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If you are exhausted, check the current rules for that area before deciding on camping.',
			'Can I stealth camp here if I am exhausted?'
		),
		'If you are exhausted, check the current rules for that area before deciding on camping.\n\nStealth-camping note: do not stealth camp in regulated or prohibited areas. Check land-manager rules first; if exhausted, choose a safer legal shelter, campsite, town stop, or established legal site and stop earlier.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Prioritize safety over reaching a specific spot and verify the live weather.',
			'How do I choose a campsite in a storm tonight?'
		),
		'Prioritize safety over reaching a specific spot and verify the live weather.\n\nStorm-campsite note: set up early in a legal protected spot, avoid exposed ridges, dead trees or widow makers, drainages, and flood-prone ground, keep dry sleep layers protected, and stop or bail out if lightning, flooding, hypothermia risk, or worsening conditions appear.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Look for established campsites and verify local rules before setting up.',
			'How do I avoid camping too close to water or damaging the place?'
		),
		'Look for established campsites and verify local rules before setting up.\n\nLow-impact campsite note: use established or durable surfaces, stay roughly 200 feet from water and trail when local rules allow, keep hygiene water and toothpaste away from camp and water, and follow posted land-manager rules over general advice.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Confirm the current local guidance on bear activity before committing to an overnight plan. If you cannot verify the live risk, choose a lower-mileage or safer-stop option.',
			'What if there are bear activity reports near the shelter?'
		),
		'Confirm the current local guidance on bear activity before committing to an overnight plan. If you cannot verify the live risk, choose a lower-mileage or safer-stop option.\n\nBear-activity shelter note: verify current local guidance, alerts, closures, and required food storage before committing. Use proper food storage and odor control such as a bear box, cable, canister, or approved hang as local rules require, keep food and scented items away from sleep, and choose an alternate legal stop if the report cannot be cleared.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Check current alerts and any required food storage protocols. If you cannot confirm the current situation, choose the safer legal stop. Remember to use proper food storage and keep all scented items away from your sleeping area.',
			'What if there are bear activity reports near the shelter?'
		),
		'Check current alerts and any required food storage protocols. If you cannot confirm the current situation, choose the safer legal stop. Remember to use proper food storage and keep all scented items away from your sleeping area.\n\nBear-activity shelter note: verify current local guidance, alerts, closures, and required food storage before committing. Use proper food storage and odor control such as a bear box, cable, canister, or approved hang as local rules require, keep food and scented items away from sleep, and choose an alternate legal stop if the report cannot be cleared.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If you find a bear near camp, the first thing is to stop and stay calm. Do not run. Make yourself look big by talking loudly and waving your arms. If the bear approaches, back away slowly while keeping your eyes on it. If the bear is curious, you can try to talk to it calmly. If the bear is aggressive, stand your ground and make yourself look as large as possible.\n\nIf you have food, keep it stored properly, away from your tent, and use bear canisters or hanging systems if available. If you are in an area where bears are known to be active, be extra vigilant about food storage and making noise while hiking.\n\nIf you are in a situation where you feel threatened, you can consider using bear spray as a deterrent if you are trained and comfortable doing so. Always prioritize your safety and follow the guidance of local safety protocols.',
			'How do I handle a bear near camp without making things worse?',
			[
				{
					toolId: 'trail_conditions',
					args: {},
					summary: 'Active trail conditions: Eval bear activity caution. Bear activity reports are volatile; confirm current local guidance and use proper food storage.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'If you find a bear near camp, the first thing is to stop and stay calm. Do not run.\n\nIf you have food, keep it stored properly, away from your tent, and use bear canisters or hanging systems if available. If you are in an area where bears are known to be active, be extra vigilant about food storage and making noise while hiking.\n\nAlways prioritize your safety and follow the guidance of local safety protocols.\n\nBear-near-camp note: stay calm, create distance, do not run, and give the bear an exit. Secure food, trash, and scented items away from sleep; do not approach, feed, corner, or try to retrieve food from the bear. Verify current local bear guidance, alerts, and food-storage rules when available, and avoid species- or park-specific rules unless they are loaded. Use emergency communication or local authorities/rangers if there is immediate danger. Loaded alert context: Active trail conditions: Eval bear activity caution. Bear activity reports are volatile; confirm current local guidance and use proper food storage.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If you feel unsafe at a shelter, your first step is to prioritize your safety. You should immediately speak to the shelter staff or manager about how you are feeling. If you feel the situation is escalating or you are in immediate danger, you need to follow the emergency plan you have in place.\n\nIf you are in a situation where you feel threatened, you should try to de-escalate the situation by remaining calm and clear about your concerns. If you feel you cannot resolve the issue with the staff, you need to look for a safe, legal option to move to a different location.\n\nIf you are in immediate danger, you should use your emergency communication device to contact help or follow the established emergency protocol. You should not feel obligated to stay in a situation that makes you feel unsafe.',
			'I feel unsafe around someone at a shelter. What should I do?',
			[
				{
					toolId: 'next_town',
					args: {},
					summary: 'Pilot Gap Road at mile 124.2 (4.8 mi ahead via road crossing; emergency exit candidate, confirm shuttle or pickup). No guaranteed services at the crossing.',
					confidence: 'medium',
					receipts: []
				},
				{
					toolId: 'next_shelter',
					args: {},
					summary: 'Near Ridge Shelter at mile 122.8 (3.4 mi ahead). Open-data candidate; verify current status, water, and crowding.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'If you feel unsafe at a shelter, your first step is to prioritize your safety. If you feel the situation is escalating or you are in immediate danger, you need to follow the emergency plan you have in place.\n\nIf you are in immediate danger, you should use your emergency communication device to contact help or follow the established emergency protocol. You should not feel obligated to stay in a situation that makes you feel unsafe.\n\nUnsafe-person shelter note: trust the concern and do not confront, negotiate, or stay to be polite. Create distance, move toward a safer public or known place when you can do so safely, contact a trusted person, hostel or shuttle, ridgerunner, land manager, or authorities, and use emergency communication immediately if there is danger. Loaded exit context: Pilot Gap Road at mile 124.2 (4.8 mi ahead via road crossing; emergency exit candidate, confirm shuttle or pickup). No guaranteed services at the crossing.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Check your foot and knee condition first and adjust your pace.',
			'Should I stop before a big climb or after it?'
		),
		'Check your foot and knee condition first and adjust your pace.\n\nClimb-stop note: stop before the climb if daylight, legs, water, weather, or legal camp options are weak; climb only when you have enough daylight, water, energy, and a known legal stop after it.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If you arrive late, prioritize safety and choose a backup before dark.',
			'What if I am arriving at the shelter after dark?'
		),
		'If you arrive late, prioritize safety and keep a fallback if the shelter is full.\n\nAfter-dark shelter note: slow down, use the headlamp, avoid risky night navigation when tired, take the nearest safe legal option rather than adding extra night miles, and keep a fallback plan in case the shelter is full.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Check the current status of the shelter for water and crowding before committing.',
			'How do I plan around a shelter with no reliable water?'
		),
		'Check the current status of the shelter for water and crowding before committing.\n\nWaterless-shelter note: do not assume shelter water is flowing; top off before the shelter, carry enough to the next verified source, or stop where both legal sleep and water are workable.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'You should keep the rain pants because cached weather shows showers and wind. Verify the current forecast before leaving.',
			'Do I need rain pants in Georgia in March, or can I leave them home?'
		),
		'You should keep the rain pants because cached weather shows showers and wind. Verify the current forecast before leaving.\n\nRain-pants decision note: for a Georgia or March start, decide from the current forecast, wind, personal cold tolerance, and shakedown evidence; keep them until the rain system has been proven in comparable wet-cold conditions.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Camp shoes can help your feet recover and make camp more comfortable. Reassess the weight later.',
			'Should I carry camp shoes, or is that dead weight?'
		),
		'Camp shoes can help your feet recover and make camp more comfortable. Reassess the weight later.\n\nCamp-shoes decision note: weigh the 7 oz against foot recovery, shelter and camp comfort, stream crossings when appropriate, hygiene, and keeping dirty shoes out of sleep areas; test them through the first section and reassess at the first town.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Keep easy snacks in your pack so you can eat while hiking and save bigger meals for camp.',
			'How do I pack food so it is easy to eat while hiking and not just at camp?'
		),
		'Keep easy snacks in your pack so you can eat while hiking and save bigger meals for camp.\n\nFood-packing note: before leaving camp, split out the next 3-4 hours of snacks and lunch into reachable pockets or the top/outside of the pack; keep cook/camp meals, extra days of food, and trash separate so hiking food stays accessible for steady energy and better decisions.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'The rain jacket and dry sleep base layer should stay dry because they protect you from wet weather.',
			'What clothes should stay dry at all costs in my pack?'
		),
		'The rain jacket and dry sleep base layer should stay dry because they protect you from wet weather.\n\nDry-clothes priority note: keep the sleep base layer, socks, insulation or warm layer, quilt or bag, and critical electronics protected in a pack liner or dry bag. Wet-cold mistakes can become hypothermia risk, so keep the sleep, warmth, and electronics core dry while rain gear stays accessible.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Use enough battery for navigation, photos, and family check-ins, then compare that to the capacity on your bank.',
			'How much battery bank do I need for Scout, maps, photos, and family check-ins?'
		),
		'Use enough battery for navigation, photos, and family check-ins, then compare that to the capacity on your bank.\n\nNormal gaps can happen from dead zones, battery conservation, rain, or town chaos; live location may be delayed or unavailable, so do not treat it as guaranteed.\n\nBattery-bank planning note: size the bank from phone model, days between town charging, navigation, photos, family check-ins, local AI/model use, and cold or rain margin. Before trail, run an airplane-mode rehearsal with Scout, maps, photos, and check-ins to measure actual drain instead of guessing.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Include blister prevention tape, blister treatments, wound care supplies, personal medications, and pain relief.',
			'What should be in my first-aid kit for blisters and normal trail problems?'
		),
		'Include blister prevention tape, blister treatments, wound care supplies, personal medications, and pain relief.\n\nFirst-aid kit note: keep it compact and personal: prevention tape, blister treatment, wound basics, and normal personal meds. Do not diagnose; stop or get medical help for spreading redness, drainage, fever, worsening pain, swelling, or changed gait.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Protect your sleep system and set up early if the weather is ugly. Verify the current forecast before committing.',
			'How should I pack for cold rain tonight if I am camping?'
		),
		'Protect your sleep system and set up early if the weather is ugly. Verify the current forecast before committing.\n\nCold-rain camping note: treat wet-cold exposure as hypothermia risk, protect the dry sleep layer and warm layer first, set up early in a legal protected spot, keep the filter warm, and stop or bail out if the sleep system or camp setup cannot stay dry.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Cold rain brings wet-cold exposure. Protect the dry sleep layer and warm layer first, set up early in a legal protected spot, and stop or bail out if the sleep system cannot stay dry.',
			'How should I pack for cold rain tonight if I am camping?'
		),
		'Cold rain brings wet-cold exposure. Protect the dry sleep layer and warm layer first, set up early in a legal protected spot, and stop or bail out if the sleep system cannot stay dry.\n\nCold-rain camping note: treat wet-cold exposure as hypothermia risk, protect the dry sleep layer and warm layer first, set up early in a legal protected spot, keep the filter warm, and stop or bail out if the sleep system or camp setup cannot stay dry.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Keep mileage conservative and protect your dry sleep layers. Verify the current forecast before exposed terrain and be careful on slick roots and rocks. Stop or bail out if lightning, flooding, wet-cold exposure, or worsening weather appears.',
			'What is a safe plan if I start the AT in heavy rain?'
		),
		'Keep mileage conservative and protect your dry sleep layers. Verify the current forecast before exposed terrain and be careful on slick roots and rocks. Stop or bail out if lightning, flooding, wet-cold exposure, or worsening weather appears.\n\nHeavy-rain start note: keep mileage conservative, protect dry sleep layers, watch footing on slick roots, rocks, bog boards, and descents, verify the current forecast, and stop or bail out for lightning, hypothermia risk, flooding, or worsening conditions.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'When the weather is bad, stop and reassess. If you are feeling scared, use the comfort verses. Psalms 56:3 says, "I trust in the Lord." Check the current forecast and choose a safer stop. If you are feeling scared or alone, make a one-hour plan.',
			'When should I nero instead of pushing through a bad weather day?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 468.4 },
					summary: 'Cached weather near mile 468.4: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'When the weather is bad, stop and reassess. Check the current forecast and choose a safer stop.\n\nWeather note: Cached weather near mile 468.4: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.\n\nNero weather note: choose a short day, town stop, or early legal stop when storm severity, temperature, footing, exposure, daylight, body condition, or town access makes the full plan less safe. Rest is a safety and recovery decision, not failure.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Watch for shivering, confusion, slurred speech, poor coordination, and loss of consciousness. If you experience dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms, escalate.',
			'How do I watch for hypothermia in wet weather?'
		),
		'Watch for shivering, confusion, slurred speech, poor coordination, and loss of consciousness.\n\nWet-weather hypothermia note: watch for shivering, clumsiness, confusion, apathy, slurred speech, and poor coordination. Stop, get under shelter, change into dry insulation or sleep layers, eat or sip warm fluids if available, and get help for severe, worsening, or altered-mental-status symptoms.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'If lightning starts while you are on a ridge, stop immediately and seek shelter. Follow safety guidance: stop hiking, find immediate shade, and cool down.',
			'What should I do if lightning starts while I am on a ridge?'
		),
		'If lightning starts while you are on a ridge, stop immediately and seek shelter.\n\nLightning ridge note: if it is safe to move, leave exposed high ground and ridgelines immediately. Avoid lone trees, open knobs, metal objects, and water; spread out from partners, wait well after the last thunder before resuming, and do not keep hiking exposed terrain.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Hang up the rain jacket and unpack the sleep system in a dry room.',
			'How do I dry gear in town without wasting the whole day?'
		),
		'Hang up the rain jacket and unpack the sleep system in a dry room.\n\nTown gear-drying note: sequence the chores: sleeping bag or quilt and insulation first, then socks, shoes or liners, wet clothes, and rain gear. Use a laundromat, dryer on safe settings, hostel drying room, or motel room airflow before charging, repacking, and leaving town.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Verify lightning, heat, cold rain, wind, and flooding before relying on weather.',
			'What weather facts must Scout verify live before I rely on an answer?'
		),
		'Verify lightning, heat, cold rain, wind, and flooding before relying on weather.\n\nLive-weather verification note: verify storms and lightning, heat or cold exposure, wind, flooding or high water, closures or fire/smoke alerts, and whether the cache is stale before relying on the answer for exposed terrain or a safety-critical decision.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			"I can't route you around a closure or detour without knowing exactly where you are and what the current official management agency says. You need to verify the current managing-agency route before committing.",
			'Can Scout route me around a closure or detour?',
			[
				{
					toolId: 'trail_conditions',
					args: { fromMile: 300 },
					summary: 'Active official trail conditions: HIGH CLOSURE - Eval closure near current section. A short official closure/detour example is loaded so Scout must say to verify the current managing-agency route before committing.',
					confidence: 'high',
					receipts: []
				}
			]
		),
		"I can't route you around a closure or detour without knowing exactly where you are and what the current official management agency says. You need to verify the current managing-agency route before committing.\n\nClosure/detour note: loaded official alert says Active official trail conditions: HIGH CLOSURE - Eval closure near current section. A short official closure/detour example is loaded so Scout must say to verify the current managing-agency route before committing. Scout can summarize that alert as advisory context, not turn-by-turn detour routing. Verify the current managing-agency detour and posted signage before committing, follow official route guidance, and do not invent alternate route details."
	);

	assert.equal(
		polishOnDeviceAnswer(
			"If you smell smoke or see fire near the trail, stop hiking immediately. You need to check for official alerts right away.\n\nThe trail conditions guidance says that smoke or fire reports should trigger an official alert check and a safer route or exit decision. Since I cannot verify live conditions, you need to check for any official alerts immediately. If you can't confirm the situation, choose a lower-mileage or safer stop option and name what still needs confirmation.\n\nYou should move away from the smoke and fire source and seek a safe area. If you are in immediate danger, use your emergency plan.",
			'What if I smell smoke or see fire near the trail?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 438.9 },
					summary: 'Cached weather near mile 438.9: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.',
					confidence: 'medium',
					receipts: []
				},
				{
					toolId: 'trail_conditions',
					args: { fromMile: 438.9 },
					summary: 'Active official trail conditions: HIGH FIRE - Eval fire/smoke caution. Smoke or fire reports should trigger an official alert check and a safer route or exit decision.',
					confidence: 'high',
					receipts: []
				}
			]
		),
		"If you smell smoke or see fire near the trail, do not continue toward the smoke or fire. You need to check for official alerts right away.\n\nThe trail conditions guidance says that smoke or fire reports should trigger an official alert check and a safer route or exit decision. Since I cannot verify live conditions, you need to check for any official alerts immediately. If you can't confirm the situation, choose a lower-mileage or safer stop option and name what still needs confirmation.\n\nYou should move away from the smoke and fire source and seek a safe area. If you are in immediate danger, use your emergency plan.\n\nSmoke/fire trail note: loaded official alert says Active official trail conditions: HIGH FIRE - Eval fire/smoke caution. Smoke or fire reports should trigger an official alert check and a safer route or exit decision. Weather context: Cached weather near mile 438.9: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices. Do not continue toward or through smoke or visible fire; move away toward a known safe road, town, ranger station, or public area when you can do so safely. Follow official closures, evacuation orders, ranger, 911, or emergency-device instructions; do not invent a safe route through the hazard. Escalate immediately for visible flames, heavy smoke, blocked exits, fast-changing wind, or immediate danger."
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Keep items that are essential for your current situation, like your water filter or first aid kit, but be cautious about mailing things that are not necessary.',
			'What gear should I not mail home too early even if the weather looks warm?',
			[
				{
					toolId: 'weather_lookup',
					args: { fromMile: 109.8 },
					summary: 'Cached weather near mile 109.8: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.',
					confidence: 'medium',
					receipts: []
				}
			]
		),
		'Mail-home gear note: do not mail home rain protection, insulation or warm layers, water treatment, first aid, battery or navigation power, or sleep safety just because one forecast looks warm. Recheck the forecast, next town timing, and replacement options before sending gear forward or home.\n\nWeather note: Cached weather near mile 109.8: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Think about your budget in terms of daily burn versus town spikes. Keep it flexible around your pace.',
			'How should I think about trail budget without overplanning every town?'
		),
		'Think about your budget in terms of daily burn versus town spikes. Keep it flexible around your pace.\n\nBudget note: separate daily burn from town spikes like hostels, shuttles, laundry, and meals; include gear replacement and an emergency cushion, and keep it flexible around actual pace and services rather than treating it as a guarantee.'
	);
});
