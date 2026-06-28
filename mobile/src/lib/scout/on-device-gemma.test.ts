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
	assert.match(systemContext, /For heat-wave water questions/);
	assert.match(systemContext, /dizziness, confusion, headache, nausea, cramps, chills, stopped sweating/);
	assert.match(systemContext, /For camel-up or ridge-water questions/);
	assert.match(systemContext, /camel up at the last confirmed source and carry extra/);
	assert.match(systemContext, /For dry-stretch water-carry questions/);
	assert.match(systemContext, /0\.5-1 liter per 3-5 miles/);
	assert.match(systemContext, /For questionable-water, tired, or low-daylight treatment questions/);
	assert.match(systemContext, /do not drink untreated questionable water/);
	assert.match(systemContext, /For frozen or failing water-filter questions/);
	assert.match(systemContext, /hollow-fiber filter may be compromised/);
	assert.match(systemContext, /For rain-pants or rain-gear cut\/drop questions/);
	assert.match(systemContext, /For camp-shoes questions/);
	assert.match(systemContext, /When tool findings are labeled as guidance/);
	assert.match(systemContext, /When preparation or training questions have pretrip/);
	assert.match(systemContext, /include an immediate first-week checklist/);
	assert.match(systemContext, /End every answer with a complete sentence/);
	assert.match(systemContext, /verify Bible text is available offline/);
	assert.match(systemContext, /Do not include Bible verses, scripture, prayer, or spiritual encouragement unless the hiker explicitly asks/);
	assert.match(systemContext, /For Bible or scripture questions/);
	assert.match(systemContext, /Psalms 56:3, Isaiah 41:10, 2 Timothy 1:7/);
	assert.match(systemContext, /Do not use disturbing, violent, judgment, or famine passages as comfort/);
	assert.match(systemContext, /make a one-hour plan/);
	assert.match(systemContext, /never write "if you don't hear from you\."/);
	assert.match(systemContext, /For zero, nero, or town-rest questions/);
	assert.match(systemContext, /cached\/current weather, town chores, budget, and the next section/);
	assert.match(systemContext, /For resupply or mail-drop questions/);
	assert.match(systemContext, /For first-aid kit or blister questions/);
	assert.match(systemContext, /spreading redness, drainage, fever, worsening pain/);
	assert.match(systemContext, /do not tell the hiker to train through pain/);
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
		'Download maps and refresh the field pack.\n\nAlso verify Bible text is available offline.'
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
			'Use the cached trail line and external offline maps if they are available. Do not rely on missing basemap tiles for complex navigation.',
			'How do I use the map when there is no basemap or cell signal?'
		),
		'Use the cached trail line and external offline maps if they are available. Do not rely on missing basemap tiles for complex navigation.'
	);

	assert.equal(
		polishOnDeviceAnswer('Protect your knee. I can look up terrain, but I can', 'How should I train with a bad knee before the first week of the AT?'),
		'Protect your knee.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Protect your knee.\n\nA shakedown hike should prove your sleep system, rain system, and offline app flow.\n\nThis approach is what the terrain guidance suggests for the first trail week.',
			'How should I train with a bad knee before the first week of the AT?'
		),
		'Protect your knee.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'For practical next steps, first, check the weather and any immediate hazards around you. If you are cold or wet, get warm and dry immediately. Eat or drink if you have food or water available. Make a one-hour plan for what you need to do next, focusing on immediate safety. If you feel you are in immediate danger, use your emergency plan.\n\nYou need to check the weather and any immediate hazards around you. If you are cold or wet, get warm and dry immediately. Eat or drink if you have food or water available. Make a one-hour plan for what you need to do next, focusing on immediate safety. If you feel you are in immediate danger, use your emergency plan.',
			'I am scared and alone tonight. Give me scripture and practical next steps.'
		),
		'For practical next steps, first, check the weather and any immediate hazards around you. If you are cold or wet, get warm and dry immediately. Eat or drink if you have food or water available. Make a one-hour plan for what you need to do next, focusing on immediate safety. If you feel you are in immediate danger, use your emergency plan.'
	);

	assert.equal(
		polishOnDeviceAnswer('The next water is at mile 138.3. The reliable creek is at mile 142.7.', 'Should I camel up?'),
		'The next water is at mile 138.3. The reliable creek is at mile 142.7.\n\nRidge-water decision note: camel up at the last confirmed source and carry extra over the ridge when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only carry the lighter plan when the next reliable water is confirmed and conditions are mild.'
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
		'Keep mileage conservative and protect your dry sleep layers. Verify the current forecast before exposed terrain, especially if thunderstorms are possible.\n\nWeather note: Cached weather near mile 0.0: showers and possible thunderstorms (high 67F / low 51F, wind 22 mph). Lightning and wet-cold exposure are possible; verify live before exposed terrain.'
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
		'Heat makes water decisions harder. Carry more water if the next source is not confirmed and look for shade when you can.\n\nHeat-water safety note: if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms show up, stop hiking, get shade, cool down, sip treated water with electrolytes if available, and escalate through the emergency plan if symptoms do not improve.'
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
		'When the weather is bad, stop and reassess. Check the current forecast and choose a safer stop.\n\nWeather note: Cached weather near mile 468.4: partly cloudy with changing mountain conditions (high 67F / low 51F, wind 9 mph). Mountain weather changes quickly; refresh before safety-critical choices.\n\nNero note: choose a short day, town stop, or early stop when the forecast, footing, exposure, daylight, or body condition makes pushing the full plan less safe.'
	);

	assert.equal(
		polishOnDeviceAnswer(
			'Think about your budget in terms of daily burn versus town spikes. Keep it flexible around your pace.',
			'How should I think about trail budget without overplanning every town?'
		),
		'Think about your budget in terms of daily burn versus town spikes. Keep it flexible around your pace.\n\nBudget note: separate daily burn from town spikes like hostels, shuttles, laundry, and meals; include gear replacement and an emergency cushion, and keep it flexible around actual pace and services rather than treating it as a guarantee.'
	);
});
