import type { ContextPack } from './types.ts';

const DEFAULT_GENERATED_AT = '2026-06-17T05:11:50.239Z';
const DEFAULT_VALID_UNTIL = '2026-06-22T00:00:00.000Z';

export const DEFAULT_CONTEXT_PACK: ContextPack = {
	frame: {
		totalMiles: 2197.4,
		startMile: 0,
		endMile: 2197.4,
		source: 'AWOL 2026 reference length + neutral Scout starter pack'
	},
	hiker: {
		currentMile: 0,
		direction: 'NOBO',
		dayNumber: 1
	},
	water: [],
	shelters: [],
	towns: [],
	guideExcerpts: [
		{
			id: 'pack-water-on-ridges',
			title: 'Confirm mapped water before committing',
			body: 'Mapped water candidates are planning prompts, not promises. Top off at the last confirmed source before committing to a longer warm-weather push.',
			tags: ['water', 'planning', 'ridge'],
			citation: 'Hogg Country Field Guide, Section: Water Discipline'
		},
		{
			id: 'town-stop-readiness',
			title: 'Town stops are recovery first, logistics second',
			body: 'Treat town as a recovery interval. Calories, foot care, sleep, charging, downloads, then logistics. Logistics-first town stops cost mileage two days later. Default resupply rule: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops. Never say hard-to-find items are better bought in town unless a current town source proves availability. Budget planning should separate normal daily burn from town spikes like hostels, shuttles, laundry, meals, replacement gear, and emergency cushion; never present budget advice as a guarantee.',
			tags: ['town', 'recovery', 'budget', 'mail-drop'],
			citation: 'Hogg Country Field Guide, Section: Town Discipline'
		},
		{
			id: 'pretrip-offline-readiness',
			title: 'Pretrip offline readiness needs a real rehearsal',
			body: 'Before leaving service, charge the phone and battery bank, refresh the field pack, confirm current mile, download the local AI model on Wi-Fi and power, download offline maps and references, verify the Bible text is available offline, then turn on airplane mode, relaunch, and ask Scout a water question. Scout is a field companion, not an emergency communicator; keep inReach, PLB, 911, or the family emergency plan separate.',
			tags: ['pretrip', 'offline', 'local-ai', 'field-pack', 'safety', 'bible'],
			citation: 'Hogg Country Field Guide, Section: Offline Readiness'
		},
		{
			id: 'first-week-mileage-discipline',
			title: 'First-week mileage follows body and constraints',
			body: 'First-week mileage should start low and respond to body condition, daylight, elevation, water spacing, weather, pack weight, foot or knee condition, and the next legal shelter, campsite, or town stop. Protect feet and knees, stop while you can still recover normally, and adjust only after several normal mornings. Do not promise a fixed daily mileage.',
			tags: ['terrain', 'pace', 'mileage', 'first-week', 'recovery'],
			citation: 'Hogg Country Field Guide, Section: Mileage Discipline'
		},
		{
			id: 'shelter-camping-discipline',
			title: 'Shelter and camping entries need rule checks',
			body: 'Shelters, campsites, huts, and tent sites are planning candidates until current rules, availability, water, fees, and crowding are checked. In regulated areas, verify the land-manager rule before committing to an overnight plan.',
			tags: ['shelter', 'camping', 'campsite', 'rules'],
			citation: 'Hogg Country Field Guide, Section: Shelter Discipline'
		},
		{
			id: 'loadout-contents-discipline',
			title: 'Read the pack contents before gear advice',
			body: 'Loadout advice starts with what is actually carried, then compares that gear against weather, terrain, water carry, shelter choice, body condition, and next town timing. A shakedown hike should prove the sleep system, rain system, cooking and food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow. Turn failures into specific gear or app fixes instead of treating one shakedown as proof every condition is solved.',
			tags: ['loadout', 'gear', 'pack', 'safety', 'shakedown', 'battery'],
			citation: 'Hogg Country Field Guide, Section: Gear System'
		},
		{
			id: 'safety-risk-discipline',
			title: 'Safety decisions prefer current checks and safer stops',
			body: 'Closures, fires, high water, injury, bear activity, heat, cold, and bailout decisions need current source checks when online. If Scout cannot verify a live risk, choose the lower-mileage or safer-stop option and name what still needs confirmation. Scout must not diagnose, replace emergency services, or replace a dedicated emergency communicator.',
			tags: ['safety', 'risk', 'closure', 'bailout'],
			citation: 'Hogg Country Field Guide, Section: Safety and Emergency'
		},
		{
			id: 'offline-personal-documents',
			title: 'Offline personal documents stay separate from Scout chat',
			body: 'Before day one, save ID, insurance, emergency contacts, medication or allergy notes, itinerary, check-in plan, permits or reservations if needed, shuttle/lodging confirmations, and Scout field-pack/offline map status somewhere reachable offline. Distinguish personal documents from Scout trail data. Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; Scout only needs source summaries and trail context.',
			tags: ['safety', 'documents', 'offline', 'pretrip', 'itinerary', 'insurance', 'permits', 'sensitive'],
			citation: 'Hogg Country Field Guide, Section: Offline Safety'
		},
		{
			id: 'family-checkin-discipline',
			title: 'Family check-ins need cadence and escalation rules',
			body: 'Family check-ins should set expectations before the trail: usual cadence, current mile or location, how you feel, planned stop, and next expected contact. Normal gaps can happen from dead zones, battery conservation, rain, or town chaos. Give family an escalation window and emergency contact/itinerary sheet ahead of time: if they do not hear from you after that window, they should escalate. Repeated missed check-ins, bad weather, health concern, or itinerary mismatch should escalate to direct calls/texts, emergency contacts, hostels/shuttles/rangers when appropriate, and then emergency services. Do not promise live location is always available.',
			tags: ['safety', 'check-ins', 'family', 'offline', 'emergency', 'itinerary'],
			citation: 'Hogg Country Field Guide, Section: Family Check-ins'
		},
		{
			id: 'cold-wind-risk',
			title: 'Cold wind multiplies fatigue',
			body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, and protect extremities.',
			tags: ['weather', 'safety', 'cold'],
			citation: 'Hogg Country Field Guide, Section: Cold Weather'
		},
		{
			id: 'heavy-rain-start-discipline',
			title: 'Heavy rain starts need conservative mileage and dry sleep layers',
			body: 'For a heavy-rain start, recommend conservative mileage, keeping sleep layers dry, footing caution on slick roots, rocks, bog boards, and descents, and a bailout or stop plan if lightning, hypothermia risk, flooding, or worsening conditions appear. Cached weather is a caution signal, not live proof; check a current forecast when possible.',
			tags: ['weather', 'rain', 'footing', 'bailout', 'safety'],
			citation: 'Hogg Country Field Guide, Section: Rain Start Safety'
		}
	],
	loadout: [],
	weather: null,
	downloadedRegions: ['Starter pack - set your AT mile to fetch trail-ahead data'],
	generatedAt: DEFAULT_GENERATED_AT,
	validUntil: DEFAULT_VALID_UNTIL,
	sourceReceipts: [
		{
			id: 'field-pack:starter',
			title: 'Scout starter offline pack',
			kind: 'trail-pack',
			citation: 'Bundled neutral starter pack; fetch a field pack after setting your mile.',
			generatedAt: DEFAULT_GENERATED_AT,
			miles: { from: 0, to: 0 }
		},
		{
			id: 'field-guide:water-discipline',
			title: 'Water discipline field-guide excerpt',
			kind: 'field-guide',
			citation: 'Hogg Country Field Guide'
		},
		{
			id: 'derived:awol-length',
			title: 'AT reference length',
			kind: 'derived',
			citation: 'AWOL 2026 calibrated reference length',
			miles: { from: 0, to: 2197.4 }
		},
		{
			id: 'derived:generated-mile-caveat',
			title: 'Generated mile caveat',
			kind: 'derived',
			citation: 'Open-reference landmark miles are anchor-calibrated estimates; confirm exact guidebook mileage before safety-critical decisions.'
		}
	],
	pilotNotice:
		'Bundled starter pack only. Set your trail mile or follow the Hogg pilot to download current trail-ahead context; confirm water, weather, services, rules, and access before relying on any pack.'
};

export function cloneDefaultContextPack(): ContextPack {
	return JSON.parse(JSON.stringify(DEFAULT_CONTEXT_PACK)) as ContextPack;
}
