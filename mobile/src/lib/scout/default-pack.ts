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
			body: 'Mapped water candidates are planning prompts, not promises. Camel up at the last confirmed source and carry extra before a ridge when the next water is seasonal, unverified, exposed, hot, or after a hard climb. Only choose the lighter carry when the next reliable water is confirmed and conditions are mild. For a dry stretch, start from roughly 0.5-1 liter per 3-5 miles, then increase for heat, exposure, climbing, slow pace, or personal thirst. Treatment is non-negotiable for questionable water: filter, backflush if needed, use backup tablets or boil if the filter is suspect, and choose a safe legal stop before dark rather than drinking untreated water or rushing into darkness.',
			tags: ['water', 'planning', 'ridge', 'heat', 'treatment', 'daylight'],
			citation: 'Hogg Country Field Guide, Section: Water Discipline'
		},
		{
			id: 'town-stop-readiness',
			title: 'Town stops are recovery first, logistics second',
			body: 'Treat town as a recovery interval. Calories, foot care, sleep, charging, downloads, then logistics. Logistics-first town stops cost mileage two days later. Zero and nero decisions should weigh body condition or injury, cached/current weather, chores, budget, and the next section; rest is an investment, not failure. Default resupply rule: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops. For mail-drop versus buy-in-town questions, name the missing decision inputs before firm advice: diet restrictions, expected pace, next town timing, store hours, post-office hours, hostel or shuttle access, and whether the item is hard to find locally. Bad-weather nero decisions should compare storm severity, temperature, footing, exposure, daylight, body condition, terrain, and town access. Gear drying in town should prioritize sleeping bag or quilt and insulation first, then socks, shoes or liners, wet clothes, and rain gear using laundry, safe dryer settings, drying rooms, or motel airflow before repacking. Never say hard-to-find items are better bought in town unless a current town source proves availability. Budget planning should separate normal daily burn from town spikes like hostels, shuttles, laundry, meals, replacement gear, and emergency cushion; never present budget advice as a guarantee.',
			tags: ['town', 'recovery', 'budget', 'mail-drop', 'zero', 'nero', 'weather'],
			citation: 'Hogg Country Field Guide, Section: Town Discipline'
		},
		{
			id: 'pretrip-offline-readiness',
			title: 'Pretrip offline readiness needs a real rehearsal',
			body: 'Before leaving service, charge the phone and battery bank, refresh the field pack, confirm current mile, download the local AI model on Wi-Fi and power, download offline maps and references, verify the Bible text is available offline, then turn on airplane mode, relaunch, and ask Scout a water question. Scout and the phone do not replace inReach, PLB, 911, or the family emergency plan.',
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
			body: 'Shelters, campsites, huts, and tent sites are planning candidates until current rules, availability, water, fees, crowding, daylight, weather, fatigue, and backup options are checked. In regulated areas, verify the land-manager rule before committing to an overnight plan. If fatigue is driving the decision, choose the safer legal stop rather than extra miles for pride. If the shelter is full while daylight remains, use only legal established overflow options and choose a backup before dark. If it is already dark, slow down, use the headlamp, take the nearest safe legal option, avoid extra risky night miles, and keep a fallback if the shelter is full. Do not stealth camp in regulated or prohibited areas.',
			tags: ['shelter', 'camping', 'campsite', 'rules', 'daylight'],
			citation: 'Hogg Country Field Guide, Section: Shelter Discipline'
		},
		{
			id: 'loadout-contents-discipline',
			title: 'Read the pack contents before gear advice',
			body: 'Loadout advice starts with what is actually carried, then compares that gear against weather, terrain, water carry, shelter choice, body condition, and next town timing. A shakedown hike should prove the sleep system, rain system, cooking and food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow. Turn failures into specific gear or app fixes instead of treating one shakedown as proof every condition is solved. Dry priorities are the sleep base layer, socks, insulation or warm layer, quilt or bag, and critical electronics; protect them in a pack liner or dry bag because wet-cold mistakes can become hypothermia risk. A battery-bank plan should use phone model, days between town charging, navigation/maps/photos/family check-in habits, local AI/model use, and an actual airplane-mode drain test with the phone and bank. Do not mail home rain protection, insulation or warm layers, water treatment, first aid, battery/navigation power, or sleep safety just because one forecast looks warm; tie mail-home choices to forecast, next town timing, and replacement options.',
			tags: ['loadout', 'gear', 'pack', 'safety', 'shakedown', 'battery', 'dry-clothes', 'mail-home'],
			citation: 'Hogg Country Field Guide, Section: Gear System'
		},
		{
			id: 'safety-risk-discipline',
			title: 'Safety decisions prefer current checks and safer stops',
			body: 'Closures, fires, high water, injury, bear activity, heat, cold, and bailout decisions need current source checks when online. If Scout cannot verify a live risk, choose the lower-mileage or safer-stop option and name what still needs confirmation. For severe fatigue or unclear thinking, start with stop hiking, sit in a safe spot, eat, drink treated water or electrolytes, adjust layers for warmth or cooling, and check daylight, weather, body symptoms, and whether the hiker can think clearly. Then use loaded water, shelter, town, or bailout context to choose the nearest lower-risk legal stop or help option; escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for confusion, worsening symptoms, injury, exposure, inability to continue safely, or inability to make decisions. For prayer plus safe-plan prompts, a short prayer-like support can be included when requested, but encouragement must stay separate from trail facts. Prayer alone is not a request for Bible quotes; quote only loaded KJV verses if the hiker explicitly asks for scripture or verses. Use loaded shelter/water/town/bailout context as candidates, verify status, water, crowding, weather, alerts, and legal options, choose the lower-risk option, and say prayer is support, not a substitute for evacuation or help. For scared or alone nighttime support, comfort can include loaded scripture when requested, but the practical safety plan still matters: check immediate hazards, weather, and alerts if possible, get warm and dry, eat or drink if needed, use the headlamp, choose the nearest safe legal sleep option or known public/help option, treat loaded shelter context as a candidate rather than a guarantee, and escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger, injury, exposure, or repeated panic. Do not spiritualize away real danger or symptoms. For smoke or visible fire near the trail, do not continue toward or through the hazard; move away toward a known safe road, town, ranger station, or public area when safe, follow official closures, evacuation orders, rangers, 911, or emergency-device instructions, and do not invent a safe route through smoke or fire. Escalate immediately for visible flames, heavy smoke, blocked exits, fast-changing wind, or immediate danger. For a bear near camp, stay calm, create distance, do not run, give the bear an exit, secure food/trash/scented items away from sleep, and do not approach, feed, corner, or try to retrieve food from the bear. Verify current local bear guidance, alerts, and food-storage rules when available, and do not invent species- or park-specific rules unless loaded. Use emergency communication or local authorities/rangers if there is immediate danger. For heat illness risk, stop hiking, find shade, cool down, sip treated water with electrolytes if available, and escalate if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms appear. For knee or joint pain, do not train through worsening pain; back off or stop if pain worsens, swelling appears, or gait changes, and use clinician or physical-therapist guidance before building mileage. First-aid and blister advice should stay compact and personal: prevention tape, blister treatment, wound basics, normal personal meds, and a clear warning to stop or get medical help for spreading redness, drainage, fever, worsening pain, swelling, or changed gait. Scout must not diagnose, replace emergency services, or replace a dedicated emergency communicator.',
			tags: ['safety', 'risk', 'closure', 'bailout', 'first-aid', 'blisters', 'wound', 'infection', 'heat', 'bear'],
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
			body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, drink steadily, protect hands, head, and feet, keep insulation and sleep layers dry, and treat wet wind on exposed ridges as hypothermia risk.',
			tags: ['weather', 'safety', 'cold'],
			citation: 'Hogg Country Field Guide, Section: Cold Weather'
		},
		{
			id: 'heavy-rain-start-discipline',
			title: 'Heavy rain starts need conservative mileage and dry sleep layers',
			body: 'Weather is volatile. Stale cached weather can guide caution but must not be treated as live proof. Thunderstorms, lightning, heat, cold rain, wind, flooding or high water, closures or fire/smoke alerts, and exposed ridges require current checks when possible. For thunderstorms, avoid exposed ridges and high points during the storm window, shift timing or mileage earlier/lower, and stop or bail out if lightning, flooding, wet-cold exposure, or worsening weather appears. For lightning on a ridge, leave exposed high ground if it is safe to move, avoid lone trees, open knobs, metal objects, and water, spread out from partners, wait well after the last thunder, and do not keep hiking exposed terrain. For a heavy-rain start, recommend conservative mileage, keeping sleep layers dry, footing caution on slick roots, rocks, bog boards, and descents, and a bailout or stop plan if lightning, hypothermia risk, flooding, or worsening conditions appear. For hot days, hike harder miles early, schedule shade breaks, carry more water when sources are uncertain, and stop/cool/escalate for dizziness, confusion, headache, nausea, cramps, stopped sweating, or worsening symptoms. For wet-weather hypothermia, watch for shivering, clumsiness, confusion, apathy, slurred speech, and poor coordination; stop, get sheltered, change into dry insulation, and get help for severe or worsening symptoms. For cold-rain camping, protect the dry sleep layer and warm layer first, set up early, keep the filter warm, and stop or bail out if the sleep system or camp setup cannot stay dry. Cached weather is a caution signal, not live proof; check a current forecast when possible.',
			tags: ['weather', 'rain', 'footing', 'bailout', 'safety'],
			citation: 'Hogg Country Field Guide, Section: Rain Start Safety'
		},
		{
			id: 'food-on-the-move-discipline',
			title: 'Food on the move keeps decisions steady',
			body: 'Each morning, split the day food before leaving camp. Put the next 3-4 hours of snacks and lunch where they can be reached without unpacking: hip belt pockets, shoulder pouch, top pocket, or outside mesh. Keep cook/camp meals, extra days of food, and trash packed separately so hiking food does not get buried. If food is hard to reach, the hiker will under-eat, get cold or foggy, and make worse mileage, water, and shelter decisions.',
			tags: ['loadout', 'food', 'snacks', 'ration', 'packing', 'energy'],
			citation: 'Hogg Country Field Guide, Section: Eating While Hiking'
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
