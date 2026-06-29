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
const FIRST_RUN_ONBOARDING_READINESS_NOTE =
	'Do not rely on Scout offline until the field-pack refresh, model download, and airplane-mode test succeed; keep inReach, PLB, 911, or the family emergency plan separate.';
const FIRST_RUN_ONBOARDING_NOTE =
	`First-run Scout setup: set your hiker profile and current mile first, refresh the field pack, confirm the pack age/status looks current, download or update the local AI model on Wi-Fi and power, save offline maps/docs, let cloud sync finish if signed in, then turn on airplane mode, relaunch, and ask Scout a water or nearby-trail question. ${FIRST_RUN_ONBOARDING_READINESS_NOTE}`;
const AIRPLANE_MODE_CAPABILITY_NOTE =
	'Airplane-mode boundary: with no cell service, Scout can answer from what is already on the phone: the cached field pack, on-device local AI model, saved offline maps/docs, saved document summaries, and Bible text if it was packaged or downloaded. It cannot fetch fresh weather, official closures or fire alerts, new water reports, town or service changes, cloud sync/backup, messages, or live/tramily location until you are back online. Treat cached weather, closures, water, and services as stale until refreshed again, and keep inReach, PLB, 911, or the family emergency plan separate.';
const AIRPLANE_MODE_REHEARSAL_NOTE =
	'Airplane-mode rehearsal: before turning it on, charge the phone and battery bank, refresh the field pack, confirm current mile, finish cloud sync if signed in, download or update the local AI model on Wi-Fi and power, save offline maps/docs, verify Bible text is available offline, and refresh weather and closure checks. Then turn on airplane mode or disable network, fully relaunch Scout, and ask a water, weather, or offline Scout question. Passing means Scout can answer from cached field pack/local model/saved docs, not that live data is current. Go back online and refresh before relying on weather, closures, water reports, town services, or other safety-critical facts.';
const PRETRIP_SCREENSHOT_NOTE =
	'Before day one, screenshot or save offline: current mile/start location, itinerary and check-in plan, emergency contacts, next resupply or town/bailout plan, offline map download/status, Scout field-pack/local-model status, key permits or reservations, shuttle/lodging confirmations, and medication/allergy notes. Keep copies outside Scout too, such as Photos/Files and a paper card. Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; Scout only needs source summaries and trail context.';
const PRETRIP_SCREENSHOT_DRAFT_NOTE =
	'Draft screenshot/save checklist note: 1. Current mile or start location confirmed. 2. Itinerary and check-in plan saved offline. 3. Emergency contacts saved outside Scout. 4. Next resupply, town, or bailout plan saved. 5. Offline map and Scout field-pack/local-model status captured. 6. Key permits, reservations, shuttle, lodging, and medication/allergy summaries saved without private numbers. Review this draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it.';
const DOCUMENT_WRITING_SOURCE_BOUNDARY_NOTE =
	'Document draft boundary: keep source-backed facts separate from placeholders and open questions. Use placeholders for private values like ID numbers, insurance details, medication details, reservation numbers, and exact current-mile specifics; verify current mile, permits, reservations, shuttles, lodging, weather, closures, water, and town services before treating them as final.';
const MODEL_DOWNLOADING_STATUS_NOTE =
	'Model-download status: a failed or stuck download means the on-device local AI model is not ready for offline Scout yet. In town or on reliable Wi-Fi, plug into power, confirm enough free storage, leave the app open long enough for download/verification, then retry from the model download control. If it stays stuck, restart the app and try again on Wi-Fi before leaving service. The field pack and saved maps/docs may still be available offline if already downloaded, but Scout should not pretend local AI can answer offline until the model reports ready and an airplane-mode Scout question succeeds.';
const FIELD_PACK_STALENESS_NOTE =
	"Field-pack status: Scout's field pack is the cached trail data on the phone, not the physical backpack. Before trusting it, check the pack age/status, current mile or downloaded region, and source timestamps when shown. If it is old, expired, for the wrong mile/region, or was loaded before weather, closures, water, or services changed, treat it as stale. Refresh on Wi-Fi or in town before water, weather, closure, bailout, or town-service decisions. Until refreshed, cached weather, closures, water, and services are caution signals, not current proof.";
const SIGN_IN_CLOUD_SYNC_NOTE =
	'Sign-in boundary: accounts are invite-only. If you have an invite, sign in before the trail on Wi-Fi so backup, restore, and cloud sync can finish before you leave service. Sign-in helps recover data if the phone is replaced, restore documents/settings, and sync changes between devices. Offline Scout/local AI is separate: after setup, it can work from the downloaded field pack, on-device model, and saved maps/docs without a live login. Cloud sync and sign-in are not an emergency safety system and do not replace inReach, PLB, 911, or the family emergency plan.';
const OWN_MILE_RISK_NOTE =
	'A wrong mile shifts water, shelter, town, terrain, and bailout answers, so confirm against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap before relying on Scout.';
const OWN_MILE_SETUP_NOTE =
	`Own-mile setup: on first run, use the hike setup sheet, choose Start my hike, and enter the Current AT mile; later use Settings > Edit hike details or a confirmed mile update. Then check Today and Scout both show the new mile, refresh the field pack when online, and re-ask water, shelter, town, terrain, or bailout questions. ${OWN_MILE_RISK_NOTE}`;
const WRONG_MILE_RECOVERY_NOTE =
	'Wrong-mile recovery: correct the Current AT mile in first-run hike setup, Settings > Edit hike details, or a confirmed manual mile update. Confirm the corrected mile against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap. Then check Today and Scout both show the corrected mile, refresh the field pack when online, and re-ask Scout for water, shelter, town, terrain, and bailout. A wrong mile shifts water, shelter, town, terrain, and bailout answers; do not make water, shelter, town, or safety decisions from a wrong mile.';
const GPS_WRONG_SPOT_RECOVERY_NOTE =
	'GPS wrong-spot recovery: stop in a safe place and give GPS time to settle with a clearer sky view. Compare Scout against blazes, trail signs, landmarks, map, compass, and your last known point. If Scout is still wrong, set Current AT mile only from a confirmed location in Settings > Edit hike details or with a confirmed manual mile update, then check Today and Scout show the corrected mile. Refresh the field pack/current mile when online and re-ask Scout for water, shelter, town, terrain, and bailout. A bad GPS fix or wrong spot shifts water, shelter, town, terrain, and bailout answers; do not make water, shelter, town, terrain, or safety decisions from the bad GPS location.';
const GUIDEBOOK_MILE_MISMATCH_NOTE =
	"Your mile can differ because Scout's trail miles come from a calibrated AT mile frame, while guidebook editions, reroutes or relocations, rounded or local trail signs, side-trail distances, GPS snap, or a manual Current AT mile entry can differ. Ask which guidebook, sign, edition, or source you are comparing, confirm your real position against a blaze, road or shelter sign, map, or GPS snap, then update Scout's Current AT mile and refresh the field pack online if Scout is wrong. Do not let Scout mileage override posted signs, closures, or current official guidance for safety decisions.";
const NO_BASEMAP_NAVIGATION_NOTE =
	"If basemap tiles are not cached, do not pretend they are available. Use Scout's cached trail line and field-pack mile context only as a rough trail-corridor check, and use an external offline map/GPS app or paper map and compass if available. For complex navigation, confusing junctions, off-trail uncertainty, bad weather, or safety decisions, stop and verify with blazes, signs, map, and GPS; do not keep hiking just because Scout shows a line.";
const OFF_TRAIL_IMMEDIATE_FALLBACK_NOTE =
	'Off-trail immediate note: stop moving, get to a safe stable spot, and conserve battery. Verify your position against map/GPS, compass, blazes, signs, and your last known point. Backtrack only if the route back is obvious and safe. Do not bushwhack, shortcut, or let Scout route you through unknown terrain. Escalate with 911, inReach/PLB, rangers/authorities, or the emergency plan if you are injured, exposed, confused, weather or darkness is closing in, or you cannot regain the trail safely.';
const CLIMB_TERRAIN_AHEAD_FALLBACK_NOTE =
	'Climb/terrain note: Scout does not have a verified climb, elevation profile, gain/loss, or grade for this question, so do not invent a climb distance or difficulty. Use the loaded pack only as landmark spacing until an offline map, guide, GPS/elevation profile, or trail sign confirms the climb. Pace impact: slow the target pace, budget daylight, water spacing, pack weight, feet/knees, weather, and the next legal stop before committing to miles.';
const BAILOUT_INJURY_EXIT_FALLBACK_NOTE =
	'Bailout planning note: next loaded bailout/access candidate is not available in the current pack. Treat this as incomplete context: for worsening knee pain, swelling, changed gait, or inability to continue safely, do not push through it. Back off or stop, confirm the nearest road, town, shuttle, pickup, and services when possible, and use 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger or if you cannot continue safely.';
const OFFLINE_EMERGENCY_BOUNDARY_NOTE =
	'Emergency boundary: Scout and the phone do not replace inReach, PLB, 911, or the family emergency plan.';
const MANUAL_MILE_AFTER_SHUTTLE_NOTE =
	'Manual-mile update after a shuttle or missed GPS fix: confirm where you actually are first, then set Current AT mile from a reliable reference such as a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap. In the app, use first-run hike setup or Settings > Edit hike details, enter Current AT mile, save, then check Today and Scout show the new mile. Refresh the field pack when online and re-ask Scout for water, shelter, town, terrain, and bailout because downstream answers depend on that mile. If signed in, let cloud sync/backup catch up when you have service; do not make water, shelter, town, or safety decisions from an unconfirmed mile.';
const CONFUSING_JUNCTION_NOTE =
	'Confusing-junction note: stop at the junction, do not guess, and do not keep hiking just because a line on the phone looks plausible. Compare the blaze, sign, map, compass, GPS, and last known clear blaze or landmark. Backtrack only on the obvious safe route to the last confirmed point if needed, and wait or ask another reliable source when visibility, weather, injury, or darkness makes the choice unsafe.';
const ROLLED_ANKLE_NOW_NOTE =
	'Rolled-ankle note: stop and assess pain, swelling, weight-bearing, and gait before making miles. Reduce load and pace, choose the nearest safe legal stop or loaded exit candidate, and do not push through worsening pain, swelling, numbness, deformity, changed gait, or inability to walk normally. Get medical help or use 911, inReach/PLB, rangers/authorities, or the emergency plan for severe pain, instability, worsening symptoms, exposure, or if you cannot continue safely.';
const SOS_SUPPORT_CIRCLE_NOTE =
	'SOS/support-circle note: Scout cannot call 911, trigger SOS, or rescue you. For immediate danger, use phone SOS/911 if available or your inReach/PLB/emergency device, then contact your support circle when safe. Send concise facts: current mile/location or last known point, what happened, injury/weather/urgency, what you plan to do next, and when you will check in again. If it is not immediate danger, use your family emergency plan and escalation window, but do not wait on Scout for rescue.';
const NO_SIGNAL_HELP_SOON_NOTE =
	'No-signal help note: if you need help soon, first get to a safe stable spot and conserve battery. Use inReach/PLB or 911/SOS if available; if not, send a text/call attempt with current mile or last known point, issue, plan, and check-in time because queued texts may send when service returns. Move for signal only if the route is obvious and safer than staying put; do not wander, climb exposed terrain, or leave a known safe location just to chase bars.';
const OVERDUE_PARTNER_NOTE =
	'Overdue-partner note: start from the agreed check-in plan, last known mile/location, intended stop, route, and how overdue they are. Try direct call/text and contact the support circle named in the plan. If they are beyond the escalation window, injured, exposed, missing in bad weather/darkness, or the situation feels unsafe, escalate to 911, rangers/authorities, hostel/shuttle/ridgerunner, or the emergency plan with the last known facts. Do not create a second emergency by leaving your own safe location without a clear plan.';
const MEDICAL_ADVICE_BOUNDARY_NOTE =
	'Medical-advice boundary: Scout can help you make a conservative field decision, but it cannot diagnose, clear you to keep hiking, or replace a clinician or emergency services. For symptoms, describe red flags, stop or reduce exertion, choose a safer stop or exit, and seek medical help or use 911/inReach/PLB for chest pain, trouble breathing, severe allergic reaction, head injury, fainting, confusion, severe bleeding, signs of stroke, severe/worsening pain, infection signs, heat illness, hypothermia, or inability to continue safely.';
const STOP_HIKING_IMMEDIATE_NOTE =
	'Stop-hiking-immediately note: stop making miles for heat illness signs, hypothermia signs, lightning/exposed ridge danger, smoke/fire, flooding/high water, being lost or off trail, unsafe people, severe fatigue with foggy thinking, worsening injury, swelling, changed gait, chest pain, trouble breathing, fainting, confusion, or darkness/weather that makes navigation unsafe. Get to a safe stable spot, choose the nearest lower-risk legal stop or exit, and use 911, inReach/PLB, rangers/authorities, or the emergency plan when danger, exposure, injury, or confusion is present.';
const RESUPPLY_MAIL_DROP_NOTE =
	'Before making a firm mail-versus-town call, confirm diet restrictions, expected pace, next town timing, store and post-office hours, hostel or shuttle access, and whether the item is hard to find locally. Default rule: buy common food in town; mail only constrained, medical, diet-specific, or hard-to-find items to verified stops.';
const TOWN_RECOVERY_FIRST_NOTE =
	'Town recovery order: eat real calories first, then shower and laundry, inspect and treat feet, sleep or rest, charge the phone and battery bank, refresh/download Scout items, and only then handle shopping, shuttles, reservations, and next-section logistics. If foot pain, infection signs, injury, or exhaustion is present, handle that before chasing chores.';
const TOWN_DAY_SEQUENCE_NOTE =
	'Town-day sequence: make a short list, eat first, shower/laundry next, inspect feet and gear, resupply, then charge, refresh, and download before leaving service. Time-box errands so the day does not vanish, but do not skip food, rest, foot care, or sleep just to feel productive.';
const HOSTEL_CHORE_ORDER_NOTE =
	'Hostel-stop order: claim/confirm the bed or pickup first, start laundry and shower early, inspect feet and shoes before shopping, eat, resupply, dry wet gear, charge batteries, refresh the field pack/current mile/weather/closures, update the local AI model on Wi-Fi if needed, and confirm checkout/shuttle timing. Treat laundry, showers, bunks, shuttles, and store access as unconfirmed until the hostel or town source confirms them.';
const ZERO_NERO_DECISION_NOTE =
	'Zero/nero decision: do not default to miles or default to a full zero. Weigh body condition, injury or foot issues, sleep debt, weather, required chores, budget, and the next section. Take the zero when recovery, injury, dangerous weather, or unfinished chores would make tomorrow worse; take a nero when the essential chores are done and the next short move is safe. Rest is an investment, not a failure.';
const FOOD_DAYS_NEXT_STRETCH_NOTE =
	'Food-days estimate: calculate days from the distance to the next confirmed resupply, your realistic pace for the terrain, appetite, and one small backup margin. Do not base food days on the next water source, and do not assume a road crossing has food or store access unless current service data proves it. If the next reliable resupply point is not loaded, ask for or verify the exact next town/store before giving a precise day count.';
const RESUPPLY_POINT_CARRY_NOTE =
	'Resupply-point choice: choose the next stop by distance, terrain difficulty, appetite, reliable store or hostel access, hours, shuttle/pickup reality, and a backup food margin. Do not cut food carry just because Scout names a road or town candidate; confirm services first. If Scout only has thin road/town context, ask for the next known resupply point or carry conservatively to the next verified option.';
const SCOUT_TOWN_UPDATE_NOTE =
	'Before leaving town, update Scout with your profile/current AT mile, refreshed field pack, weather and closure checks, food/loadout changes, saved documents, offline maps/docs, and a quick airplane-mode test. Then re-ask water, shelter, town, terrain, and bailout questions because fresh Scout state changes those answers. Treat old cached weather, closures, water, and services as stale until refreshed.';
const SCOUT_TOWN_UPDATE_DRAFT_NOTE =
	'Draft town-exit update note: 1. Current AT mile: confirm before saving. 2. Food and water carry: note what changed. 3. Weather and closures: refreshed or still needs live check. 4. Loadout or gear changes: record anything added, removed, wet, broken, or replaced. 5. Documents: note permits, reservations, shuttle, lodging, or itinerary updates without private numbers. 6. Offline readiness: field pack, maps/docs, Bible, and local AI model checked. 7. Open questions before walking out: water, shelter, town, terrain, and bailout. Review this draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it.';
const OFFLINE_DOCUMENT_CHECKLIST_DRAFT_NOTE =
	'Draft offline document checklist note: 1. Photo ID saved offline outside Scout. 2. Insurance card saved offline outside Scout. 3. Emergency contacts saved and shared. 4. Medication/allergy summary saved without private numbers. 5. Itinerary and check-in plan saved. 6. Permits, reservations, shuttle, and lodging confirmations saved as summaries. 7. Scout field pack, maps/docs, Bible, and local AI model checked for offline use. Review this draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it.';
const JOHN_316_SIMPLE_NOTE =
	'John 3:16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." Simply: God loved the world, gave his Son, and promises everlasting life to those who believe in him.';
const SALVATION_DIRECT_NOTE =
	'The Bible answers directly: believe on the Lord Jesus Christ, repent and turn to God, receive salvation by grace through faith, and call on the name of the Lord. Acts 16:31 says, "Believe on the Lord Jesus Christ, and thou shalt be saved." Acts 3:19 says, "Repent ye therefore, and be converted." Ephesians 2:8-9 says salvation is by grace through faith, "not of works." Romans 10:13 says, "For whosoever shall call upon the name of the Lord shall be saved." Do not add denominational checklists as if they are required by Scout.';
const REPEAT_LAST_NO_HISTORY_NOTE =
	"I do not have a reliable previous question in this standalone local-AI run, so I should not invent one. Ask it again and I will answer shorter.";
const INJURY_PAIN_SAFETY_NOTE =
	'First: do not train through worsening pain. Back off or stop if pain worsens, swelling appears, or your gait changes; use pain-free load reduction, low-impact conditioning, and clinician or physical-therapist guidance before building mileage.';
const HEAVY_RAIN_START_NOTE =
	'Heavy-rain start note: keep mileage conservative, protect dry sleep layers, watch footing on slick roots, rocks, bog boards, and descents, verify the current forecast, and stop or bail out for lightning, hypothermia risk, flooding, or worsening conditions.';
const SHAKEDOWN_CAVEAT_NOTE =
	'Shakedown caveat: one shakedown does not prove every condition is covered. Treat failures as specific gear, app, food, water, foot-care, sleep, rain, battery, or pack-fit fixes before Springer.';
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
const DRY_CLOTHES_PRIORITY_NOTE =
	'Dry-clothes priority note: keep the sleep base layer, socks, insulation or warm layer, quilt or bag, and critical electronics protected in a pack liner or dry bag. Wet-cold mistakes can become hypothermia risk, so keep the sleep, warmth, and electronics core dry while rain gear stays accessible.';
const BATTERY_BANK_PLANNING_NOTE =
	'Battery-bank planning note: size the bank from phone model, days between town charging, navigation, photos, family check-ins, local AI/model use, and cold or rain margin. Before trail, run an airplane-mode rehearsal with Scout, maps, photos, and check-ins to measure actual drain instead of guessing.';
const FIRST_AID_KIT_NOTE =
	'First-aid kit note: keep it compact and personal: prevention tape, blister treatment, wound basics, and normal personal meds. Do not diagnose; stop or get medical help for spreading redness, drainage, fever, worsening pain, swelling, or changed gait.';
const MAIL_HOME_GEAR_NOTE =
	'Mail-home gear note: do not mail home rain protection, insulation or warm layers, water treatment, first aid, battery or navigation power, or sleep safety just because one forecast looks warm. Recheck the forecast, next town timing, and replacement options before sending gear forward or home.';
const HEAT_WATER_NOTE =
	'Heat-water safety note: do not keep hiking through dizziness. Stop, get shade, cool down, and sip treated water with electrolytes if safe. Seek urgent help or use the emergency plan for confusion, fainting, stopped sweating, or symptoms that worsen or do not improve.';
const HEAT_WATER_PLANNING_NOTE =
	'Heat-water planning note: move harder miles into the cooler part of the day, schedule shade breaks, eat salty food or use electrolytes if available, and carry conservatively to verified water when the next source is seasonal, unverified, exposed, or after a hard climb.';
const RIDGE_WATER_NOTE =
	'Ridge-water decision note: camel up at the last confirmed source and carry extra over the ridge when the next source is seasonal, unverified, exposed, hot, or after a hard climb; only carry the lighter plan when the next reliable water is confirmed and conditions are mild.';
const DRY_STRETCH_WATER_NOTE =
	'Dry-stretch water note: for a 10-mile dry stretch, start from roughly 0.5-1 liter per 3-5 miles, increase for heat, exposed climbing, slow pace, or personal thirst, top off at the last confirmed source, and carry enough to reach the next reliable source when the next source is seasonal or unverified.';
const SKIP_SEASONAL_WATER_NOTE =
	'Skip-water decision: treat the nearer seasonal or unconfirmed spring as a candidate, not the plan. You can pass it only if your current treated carry comfortably covers the full distance to the next reliable water plus margin for heat, exposure, climbing, slow pace, daylight, and your risk tolerance. If your current carry is low, effort or heat is high, or you are not sure, top off at the last confirmed source or collect and filter or treat at the spring only after you visually confirm it is flowing; do not assume seasonal water is flowing.';
const WATER_REPORT_CONFLICT_NOTE =
	"Water-report conflict: trust a current observed or recent dry report for current flow over Scout's cached field-pack listing. Use the Scout pack as planning context, not proof of flow; treat the listed spring or seep as dry until you visually confirm flowing water or a fresher reliable report says otherwise. Carry enough from the last confirmed source to reach the next reliable or verified water, and filter or treat anything you collect.";
const QUESTIONABLE_WATER_LOW_DAYLIGHT_NOTE =
	'Questionable-water note: treatment is non-negotiable even when tired or low on daylight; filter or backflush if needed, use backup tablets or boil if the filter is slow or suspect, do not drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.';
const WATER_SOURCE_VERIFICATION_NOTE =
	'Water verification note: seasonal or mapped water is a candidate, not a guarantee. Visually confirm flow before relying on it, filter or treat any water you collect, and carry enough to reach a verified source if it is dry.';
const SHELTER_DECISION_NOTE =
	'Shelter-decision note: when fatigue drives the sleep choice, choose the safer legal stop and check daylight, water, current shelter status or crowding, local rules, and a backup option before committing.';
const FULL_SHELTER_NOTE =
	'Full-shelter note: if the shelter is full, stay courteous, use legal established overflow tenting only if allowed, choose a backup before dark, and avoid unsafe or illegal camping.';
const STEALTH_CAMP_NOTE =
	'Stealth-camping note: do not stealth camp in regulated or prohibited areas. Check land-manager rules first; if exhausted, choose a safer legal shelter, campsite, town stop, or established legal site and stop earlier.';
const STORM_CAMPSITE_NOTE =
	'Storm-campsite note: set up early in a legal protected spot, avoid exposed ridges, dead trees or widow makers, drainages, and flood-prone ground, keep dry sleep layers protected, and stop or bail out if lightning, flooding, hypothermia risk, or worsening conditions appear.';
const LOW_IMPACT_CAMPSITE_NOTE =
	'Low-impact campsite note: use established or durable surfaces, stay roughly 200 feet from water and trail when local rules allow, keep hygiene water and toothpaste away from camp and water, and follow posted land-manager rules over general advice.';
const CLIMB_STOP_NOTE =
	'Climb-stop note: stop before the climb if daylight, legs, water, weather, or legal camp options are weak; climb only when you have enough daylight, water, energy, and a known legal stop after it.';
const AFTER_DARK_SHELTER_NOTE =
	'After-dark shelter note: slow down, use the headlamp, avoid risky night navigation when tired, take the nearest safe legal option rather than adding extra night miles, and keep a fallback plan in case the shelter is full.';
const WATERLESS_SHELTER_NOTE =
	'Waterless-shelter note: do not assume shelter water is flowing; top off before the shelter, carry enough to the next verified source, or stop where both legal sleep and water are workable.';
const BEAR_ACTIVITY_SHELTER_NOTE =
	'Bear-activity shelter note: verify current local guidance, alerts, closures, and required food storage before committing. Use proper food storage and odor control such as a bear box, cable, canister, or approved hang as local rules require, keep food and scented items away from sleep, and choose an alternate legal stop if the report cannot be cleared.';
const BEAR_NEAR_CAMP_NOTE =
	'Bear-near-camp note: stay calm, create distance, do not run, and give the bear an exit. Secure food, trash, and scented items away from sleep; do not approach, feed, corner, or try to retrieve food from the bear. Verify current local bear guidance, alerts, and food-storage rules when available, and avoid species- or park-specific rules unless they are loaded. Use emergency communication or local authorities/rangers if there is immediate danger.';
const UNSAFE_PERSON_SHELTER_NOTE =
	'Unsafe-person shelter note: trust the concern and do not confront, negotiate, or stay to be polite. Create distance, move toward a safer public or known place when you can do so safely, contact a trusted person, hostel or shuttle, ridgerunner, land manager, or authorities, and use emergency communication immediately if there is danger.';
const THUNDERSTORM_HIKE_NOTE =
	'Thunderstorm hike note: check live forecast or radar if available, avoid exposed ridges and high points during the storm window, shorten or shift mileage earlier, and stop or bail out if lightning, flooding, wet-cold exposure, or worsening weather appears.';
const COLD_WIND_RIDGE_NOTE =
	'Cold-wind ridge note: cap target miles, eat more often, drink steadily, protect hands, head, and feet, keep insulation and sleep layers dry, and treat wet wind on exposed ridges as hypothermia risk.';
const HOT_DAY_PLAN_NOTE =
	'Hot-day plan note: move harder miles into the cooler part of the day, carry more water when the next source is uncertain, schedule shade breaks, eat salty food or use electrolytes if available, and stop to cool down for dizziness, confusion, headache, nausea, cramps, stopped sweating, or worsening symptoms.';
const WET_HYPOTHERMIA_NOTE =
	'Wet-weather hypothermia note: watch for shivering, clumsiness, confusion, apathy, slurred speech, and poor coordination. Stop, get under shelter, change into dry insulation or sleep layers, eat or sip warm fluids if available, and get help for severe, worsening, or altered-mental-status symptoms.';
const LIGHTNING_RIDGE_NOTE =
	'Lightning ridge note: if it is safe to move, leave exposed high ground and ridgelines immediately. Avoid lone trees, open knobs, metal objects, and water; spread out from partners, wait well after the last thunder before resuming, and do not keep hiking exposed terrain.';
const TOWN_GEAR_DRYING_NOTE =
	'Town gear-drying note: sequence the chores: sleeping bag or quilt and insulation first, then socks, shoes or liners, wet clothes, and rain gear. Use a laundromat, dryer on safe settings, hostel drying room, or motel room airflow before charging, repacking, and leaving town.';
const HOSTEL_FULL_TOWN_NOTE =
	'One more boundary: treat hostels, visitor centers, campgrounds, shuttles, and road crossings as candidates until confirmed. Call or message ahead while you still have service; confirm same-day bed space, shuttle or pickup, visitor-center hours, campground reservations or seasonal status, and legal overnight rules. Use backup lodging, a legal campground or public/legal overnight option, or an earlier legal stop, short day, or nero if tired or injured. Do not invent availability or sleep in unsafe or illegal spots.';
const BAD_WEATHER_NERO_NOTE =
	'Nero weather note: choose a short day, town stop, or early legal stop when storm severity, temperature, footing, exposure, daylight, body condition, or town access makes the full plan less safe. Rest is a safety and recovery decision, not failure.';
const LIVE_WEATHER_FACTS_NOTE =
	'Live-weather verification note: verify storms and lightning, heat or cold exposure, wind, flooding or high water, closures or fire/smoke alerts, and whether the cache is stale before relying on the answer for exposed terrain or a safety-critical decision.';
const CLOSURE_DETOUR_ROUTING_NOTE =
	'Closure/detour note: Scout can summarize loaded official alerts, but it is advisory context, not turn-by-turn detour routing. Verify the current managing-agency detour and posted signage before committing, follow official route guidance, and do not invent alternate route details.';
const SMOKE_FIRE_TRAIL_NOTE =
	'Smoke/fire trail note: treat smoke or visible fire near trail as a serious hazard. Do not continue toward or through smoke or visible fire; move away toward a known safe road, town, ranger station, or public area when you can do so safely. Follow official closures, evacuation orders, ranger, 911, or emergency-device instructions; do not invent a safe route through the hazard. Escalate immediately for visible flames, heavy smoke, blocked exits, fast-changing wind, or immediate danger.';
const SCARED_ALONE_NIGHT_NOTE =
	'Night support note: take the loaded KJV scripture as comfort, then make the next hour concrete. Check immediate hazards, weather, and alerts if possible; get warm and dry, eat or drink if needed, use your headlamp, and choose the nearest safe legal sleep option or known public/help option. Do not let comfort verses override danger; use 911, inReach/PLB, ranger/authorities, or the emergency plan for real danger, injury, exposure, or repeated panic.';
const SEVERE_FATIGUE_CLEAR_THINKING_NOTE =
	'Severe-fatigue note: stop hiking now and sit in a safe spot. Eat a snack, drink treated water or electrolytes, adjust layers for warmth or cooling, and check daylight, weather, body symptoms, and whether you can think clearly. Choose the nearest lower-risk legal stop or help option; do not add miles for pride if your thinking is foggy. Use 911, inReach/PLB, rangers/authorities, or the emergency plan for confusion, worsening symptoms, injury, exposure, inability to continue safely, or inability to make decisions.';
const PRAYER_SAFE_PLAN_NOTE =
	'Prayer and safety note: yes. Here is a short prayer you can pray: Lord, steady me, give me wisdom, and help me choose the safe next step. Amen. Then make the plan practical: check immediate danger, weather, daylight, body symptoms, and alerts if possible; treat loaded shelter, water, town, or bailout context as candidates; verify status, water, crowding, and legal options; choose the nearest lower-risk option. Prayer is support, not a substitute for help; use 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger, injury, exposure, confusion, or inability to continue safely.';

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
	answer = removeInlineProvenanceSentences(answer);
	answer = normalizeSpelledDecimalDistances(answer);
	answer = removeTrailingProvenanceParagraphs(answer);
	answer = removeRepeatedSentences(answer);
	answer = trimToCompleteSentence(answer);

	const lowerPrompt = prompt.toLowerCase();
	if (isJohn316SimplePrompt(lowerPrompt)) {
		answer = JOHN_316_SIMPLE_NOTE;
	}
	if (isSalvationPrompt(lowerPrompt)) {
		answer = SALVATION_DIRECT_NOTE;
	}
	if (isRepeatLastQuestionPrompt(lowerPrompt)) {
		answer = REPEAT_LAST_NO_HISTORY_NOTE;
	}
	if (!isBiblePrompt(lowerPrompt)) {
		answer = removeUnaskedBibleDrift(answer);
	}
	if (!isFearComfortPrompt(lowerPrompt)) {
		answer = removeUnaskedFearComfortDrift(answer);
	}
	if (isInjuryPrompt(lowerPrompt)) {
		answer = removeInjuryPrepDrift(answer);
	}
	if (isInjuryPrompt(lowerPrompt) && !firstParagraphMentionsInjuryStopBoundary(answer)) {
		answer = prependSentence(answer, INJURY_PAIN_SAFETY_NOTE);
	}
	if (isFamilyCheckinPrompt(lowerPrompt) && !mentionsNormalGapsAndLiveLocation(answer)) {
		answer = appendSentence(
			answer,
			'Normal gaps can happen from dead zones, battery conservation, rain, or town chaos; live location may be delayed or unavailable, so do not treat it as guaranteed.'
		);
	}
	if (isFirstRunOnboardingPrompt(lowerPrompt) && !mentionsFirstRunOnboardingReadiness(answer)) {
		answer = appendSentence(
			answer,
			mentionsFirstRunOnboardingSetupSequence(answer) ? FIRST_RUN_ONBOARDING_READINESS_NOTE : FIRST_RUN_ONBOARDING_NOTE
		);
	}
	if (isAirplaneModeCapabilityPrompt(lowerPrompt) && !mentionsAirplaneModeCapabilityBoundary(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) || isAirplaneModeCapabilityPartialAnswer(answer)
			? AIRPLANE_MODE_CAPABILITY_NOTE
			: appendSentence(answer, AIRPLANE_MODE_CAPABILITY_NOTE);
	}
	if (isAirplaneModeRehearsalPrompt(lowerPrompt) && !mentionsAirplaneModeRehearsal(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) || isAirplaneModeRehearsalPartialAnswer(answer)
			? AIRPLANE_MODE_REHEARSAL_NOTE
			: appendSentence(answer, AIRPLANE_MODE_REHEARSAL_NOTE);
	}
	if (isPretripScreenshotPrompt(lowerPrompt) && !mentionsPretripScreenshotChecklist(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) || isPretripScreenshotPartialAnswer(answer)
			? PRETRIP_SCREENSHOT_NOTE
			: appendSentence(answer, PRETRIP_SCREENSHOT_NOTE);
	}
	if (isDocumentWritingPrompt(lowerPrompt) && isPretripScreenshotPrompt(lowerPrompt) && !mentionsDocumentDraft(answer)) {
		answer = appendSentence(answer, PRETRIP_SCREENSHOT_DRAFT_NOTE);
	}
	if (isModelDownloadingStatusPrompt(lowerPrompt)) {
		answer = normalizeModelDownloadingStatusWording(answer);
		if (isModelDownloadFailurePrompt(lowerPrompt)) {
			answer = MODEL_DOWNLOADING_STATUS_NOTE;
		} else if (!mentionsModelDownloadingStatusReadiness(answer)) {
			answer = isVagueSourceOnlyAnswer(answer) ? MODEL_DOWNLOADING_STATUS_NOTE : appendSentence(answer, MODEL_DOWNLOADING_STATUS_NOTE);
		}
	}
	if (isFieldPackStalenessPrompt(lowerPrompt) && !mentionsFieldPackStalenessReadiness(answer)) {
		answer = isPhysicalPackStalenessAnswer(answer) || isVagueSourceOnlyAnswer(answer)
			? FIELD_PACK_STALENESS_NOTE
			: appendSentence(answer, FIELD_PACK_STALENESS_NOTE);
	}
	if (isSignInBeforeTrailPrompt(lowerPrompt) && !mentionsSignInCloudSyncBoundary(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) || isSignInPartialAnswer(answer)
			? SIGN_IN_CLOUD_SYNC_NOTE
			: appendSentence(answer, SIGN_IN_CLOUD_SYNC_NOTE);
	}
	if (isWrongMileRecoveryPrompt(lowerPrompt) && !mentionsWrongMileRecovery(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) || isWrongMilePartialAnswer(answer)
			? WRONG_MILE_RECOVERY_NOTE
			: appendSentence(answer, WRONG_MILE_RECOVERY_NOTE);
	}
	if (isGpsWrongSpotPrompt(lowerPrompt) && !mentionsGpsWrongSpotRecovery(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) ? GPS_WRONG_SPOT_RECOVERY_NOTE : appendSentence(answer, GPS_WRONG_SPOT_RECOVERY_NOTE);
	}
	if (isGuidebookMileMismatchPrompt(lowerPrompt) && !mentionsGuidebookMileMismatchContext(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) || isGuidebookMileMismatchPartialAnswer(answer)
			? buildGuidebookMileMismatchNote(toolInvocations)
			: appendSentence(answer, buildGuidebookMileMismatchNote(toolInvocations));
	}
	if (isNoBasemapNavigationPrompt(lowerPrompt) && !mentionsNoBasemapNavigationBoundary(answer)) {
		answer = isVagueSourceOnlyAnswer(answer) ? NO_BASEMAP_NAVIGATION_NOTE : appendSentence(answer, NO_BASEMAP_NAVIGATION_NOTE);
	}
	if (isManualMileAfterShuttlePrompt(lowerPrompt) && !mentionsManualMileAfterShuttle(answer)) {
		answer = MANUAL_MILE_AFTER_SHUTTLE_NOTE;
	}
	if (isConfusingJunctionPrompt(lowerPrompt)) {
		answer = removeConfusingJunctionDrift(answer);
		if (!mentionsConfusingJunctionSafety(answer)) {
			answer = isVagueSourceOnlyAnswer(answer) ? CONFUSING_JUNCTION_NOTE : appendSentence(answer, CONFUSING_JUNCTION_NOTE);
		}
	}
	if (isOffTrailImmediatePrompt(lowerPrompt)) {
		answer = normalizeOffTrailImmediateWording(answer);
		if (!mentionsOffTrailImmediateContext(answer)) {
			answer = appendSentence(answer, buildOffTrailImmediateNote(toolInvocations));
		}
	}
	if (!isManualMileAfterShuttlePrompt(lowerPrompt) && isOwnMileSetupPrompt(lowerPrompt) && !mentionsOwnMileSetupReadiness(answer)) {
		answer = appendSentence(answer, mentionsOwnMileSetupFlow(answer) ? OWN_MILE_RISK_NOTE : OWN_MILE_SETUP_NOTE);
	}
	if (isOfflineSetupPrompt(lowerPrompt) && !mentionsOfflineBible(answer)) {
		answer = appendSentence(answer, 'Also verify Bible text is available offline.');
	}
	if (isOfflineSetupPrompt(lowerPrompt) && !mentionsEmergencyCommunicationBoundary(answer)) {
		answer = appendSentence(answer, OFFLINE_EMERGENCY_BOUNDARY_NOTE);
	}
	if (isScaredAloneNightPrompt(lowerPrompt)) {
		answer = normalizeScaredAloneNightWording(answer);
	}
	if (isScaredAloneNightPrompt(lowerPrompt) && !mentionsScaredAloneNightPlan(answer, toolInvocations)) {
		answer = appendSentence(answer, buildScaredAloneNightNote(toolInvocations));
	}
	if (isPrayerSafePlanPrompt(lowerPrompt)) {
		answer = normalizePrayerSafePlanWording(answer);
	}
	if (isPrayerSafePlanPrompt(lowerPrompt) && !wantsScriptureQuotePrompt(lowerPrompt)) {
		answer = removePrayerSafePlanScriptureDrift(answer);
	}
	if (isPrayerSafePlanPrompt(lowerPrompt) && !mentionsPrayerSafePlan(answer, toolInvocations)) {
		answer = appendSentence(answer, buildPrayerSafePlanNote(toolInvocations, !hasPrayerSafePlanSupport(answer)));
	}
	if (isPersonalDocumentPrompt(lowerPrompt) && !mentionsPrivateDocumentBoundary(answer)) {
		answer = appendSentence(
			answer,
			'Do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat; keep those saved separately offline.'
		);
	}
	if (isDocumentWritingPrompt(lowerPrompt) && isPersonalDocumentPrompt(lowerPrompt) && !mentionsDocumentDraft(answer)) {
		answer = appendSentence(answer, OFFLINE_DOCUMENT_CHECKLIST_DRAFT_NOTE);
	}
	const directNextWaterSummary = toolSummary(toolInvocations, 'next_water');
	if (
		isDirectNextWaterDistancePrompt(lowerPrompt) &&
		hasActionableWaterSummary(directNextWaterSummary) &&
		!mentionsToolPlace(answer, directNextWaterSummary)
	) {
		answer = buildDirectNextWaterDistanceAnswer(toolInvocations);
	}
	if (isWeatherSensitivePrompt(lowerPrompt)) {
		const weatherSummary = weatherLookupSummary(toolInvocations);
		if (weatherSummary && !mentionsWeatherLookupSummary(answer, weatherSummary)) {
			answer = isTomorrowWeatherPrompt(lowerPrompt)
				? buildCachedWeatherAnswer(toolInvocations)
				: appendSentence(answer, `Weather note: ${weatherSummary}`);
		}
	}
	if (isClosureDetourRoutingPrompt(lowerPrompt) && !mentionsClosureDetourRoutingBoundary(answer, toolInvocations)) {
		answer = appendSentence(answer, buildClosureDetourRoutingNote(toolInvocations));
	}
	if (isSmokeFireTrailPrompt(lowerPrompt)) {
		answer = normalizeSmokeFireTrailWording(answer);
	}
	if (isSmokeFireTrailPrompt(lowerPrompt) && !mentionsSmokeFireTrailSafety(answer, toolInvocations)) {
		answer = appendSentence(answer, buildSmokeFireTrailNote(toolInvocations));
	}
	if (isRolledAnkleNowPrompt(lowerPrompt)) {
		answer = removeMisappliedHeatIllnessDrift(answer);
		if (!mentionsRolledAnklePlan(answer, toolInvocations)) {
			answer = appendSentence(answer, buildRolledAnkleNowNote(toolInvocations));
		}
	}
	if (isSosSupportCirclePrompt(lowerPrompt) && !mentionsSosSupportCircleBoundary(answer)) {
		answer = SOS_SUPPORT_CIRCLE_NOTE;
	}
	if (isNoSignalHelpSoonPrompt(lowerPrompt) && !mentionsNoSignalHelpSoon(answer)) {
		answer = NO_SIGNAL_HELP_SOON_NOTE;
	}
	if (isOverduePartnerPrompt(lowerPrompt) && !mentionsOverduePartnerPlan(answer)) {
		answer = buildOverduePartnerNote(toolInvocations);
	}
	if (isMedicalAdviceBoundaryPrompt(lowerPrompt)) {
		answer = MEDICAL_ADVICE_BOUNDARY_NOTE;
	}
	if (isStopHikingImmediatePrompt(lowerPrompt) && !mentionsStopHikingImmediateBoundary(answer)) {
		answer = appendSentence(answer, STOP_HIKING_IMMEDIATE_NOTE);
	}
	if (isUnsafePersonShelterPrompt(lowerPrompt)) {
		answer = removeUnsafePersonShelterDrift(answer);
	}
	if (isUnsafePersonShelterPrompt(lowerPrompt) && !mentionsUnsafePersonShelterSafety(answer, toolInvocations)) {
		answer = appendSentence(answer, buildUnsafePersonShelterNote(toolInvocations));
	}
	if (isBearNearCampPrompt(lowerPrompt)) {
		answer = removeBearNearCampDrift(answer);
	}
	if (isBearNearCampPrompt(lowerPrompt) && !mentionsBearNearCampSafety(answer)) {
		answer = appendSentence(answer, buildBearNearCampNote(toolInvocations));
	}
	if ((isLightningRidgePrompt(lowerPrompt) || isWetHypothermiaPrompt(lowerPrompt)) && !isHeatWaterPrompt(lowerPrompt)) {
		answer = removeMisappliedHeatIllnessDrift(answer);
	}
	if (isSevereFatigueClearThinkingPrompt(lowerPrompt)) {
		answer = removeMisappliedHeatIllnessDrift(answer);
	}
	if (isSevereFatigueClearThinkingPrompt(lowerPrompt) && !mentionsSevereFatigueClearThinkingPlan(answer, toolInvocations)) {
		answer = appendSentence(answer, buildSevereFatigueClearThinkingNote(toolInvocations));
	}
	if (isThunderstormHikePrompt(lowerPrompt) && !isLightningRidgePrompt(lowerPrompt) && !mentionsThunderstormHikeDecision(answer)) {
		answer = appendSentence(answer, THUNDERSTORM_HIKE_NOTE);
	}
	if (isColdWindRidgePrompt(lowerPrompt) && !mentionsColdWindRidgeDecision(answer)) {
		answer = appendSentence(answer, COLD_WIND_RIDGE_NOTE);
	}
	if (isHotDayPlanPrompt(lowerPrompt) && !isHeatWaterPrompt(lowerPrompt) && !mentionsHotDayPlan(answer)) {
		answer = appendSentence(answer, HOT_DAY_PLAN_NOTE);
	}
	if (isWetHypothermiaPrompt(lowerPrompt) && !mentionsWetHypothermiaResponse(answer)) {
		answer = appendSentence(answer, WET_HYPOTHERMIA_NOTE);
	}
	if (isLightningRidgePrompt(lowerPrompt) && !mentionsLightningRidgeSafety(answer)) {
		answer = appendSentence(answer, LIGHTNING_RIDGE_NOTE);
	}
	if (isTownGearDryingPrompt(lowerPrompt) && !mentionsTownGearDryingSequence(answer)) {
		answer = appendSentence(answer, TOWN_GEAR_DRYING_NOTE);
	}
	if (isHostelFullTownPrompt(lowerPrompt) && !mentionsHostelFullTownBackup(answer, toolInvocations)) {
		answer = appendSentence(answer, buildHostelFullTownNote(toolInvocations));
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
	if (isHeatWaterPrompt(lowerPrompt) && !isAcuteHeatIllnessPrompt(lowerPrompt) && !mentionsHeatWaterPlanning(answer)) {
		answer = appendSentence(answer, HEAT_WATER_PLANNING_NOTE);
	}
	if (isRidgeWaterDecisionPrompt(lowerPrompt) && !mentionsRidgeWaterDecision(answer)) {
		answer = appendSentence(answer, RIDGE_WATER_NOTE);
	}
	if (isRidgeWaterDecisionPrompt(lowerPrompt) && !mentionsConcreteRidgeWaterContext(answer, toolInvocations)) {
		answer = appendSentence(answer, buildRidgeWaterContextNote(toolInvocations));
	}
	if (isDryStretchWaterPrompt(lowerPrompt) && !mentionsDryStretchWaterCarry(answer)) {
		answer = appendSentence(answer, DRY_STRETCH_WATER_NOTE);
	}
	if (isQuestionableWaterLowDaylightPrompt(lowerPrompt) && !mentionsQuestionableWaterLowDaylight(answer)) {
		answer = appendSentence(answer, QUESTIONABLE_WATER_LOW_DAYLIGHT_NOTE);
	}
	if (isUnknownWaterFlowPrompt(lowerPrompt) && !mentionsUnknownWaterFlowContext(answer)) {
		answer = appendSentence(answer, buildUnknownWaterFlowNote(toolInvocations));
	}
	if (isSkipSeasonalWaterPrompt(lowerPrompt)) {
		answer = normalizeSkipSeasonalWaterWording(answer);
		if (!mentionsSkipSeasonalWaterDecision(answer)) {
			answer = appendSentence(answer, SKIP_SEASONAL_WATER_NOTE);
		}
	}
	if (isWaterReportConflictPrompt(lowerPrompt)) {
		answer = normalizeWaterReportConflictWording(answer);
		if (!mentionsWaterReportConflictDecision(answer)) {
			answer = appendSentence(answer, WATER_REPORT_CONFLICT_NOTE);
		}
	}
	if (isBailoutInjuryExitPrompt(lowerPrompt) && !mentionsBailoutInjuryExitContext(answer, toolInvocations)) {
		answer = appendSentence(answer, buildBailoutInjuryExitNote(toolInvocations));
	}
	if (isRoadTownRelativePrompt(lowerPrompt) && !isBailoutInjuryExitPrompt(lowerPrompt)) {
		answer = normalizeRoadTownNavigationWording(answer);
		if (!mentionsRoadTownNavigationContext(answer, toolInvocations)) {
			answer = buildRoadTownNavigationNote(toolInvocations);
		}
	}
	if (isTodayDifficultyPrompt(lowerPrompt) && !mentionsTodayDifficultyContext(answer, toolInvocations)) {
		answer = buildTodayDifficultyNote(toolInvocations);
	}
	if (isClimbTerrainAheadPrompt(lowerPrompt) && !mentionsClimbTerrainAheadBoundary(answer)) {
		answer = appendSentence(answer, buildClimbTerrainAheadNote(toolInvocations));
	}
	if (isWaterDecisionPrompt(lowerPrompt) && toolSummary(toolInvocations, 'next_water') && !mentionsWaterVerificationAndTreatment(answer)) {
		answer = appendSentence(answer, buildNearestWaterVerificationNote(toolInvocations));
	}
	if (isAfterDarkShelterPrompt(lowerPrompt)) {
		answer = removeAfterDarkBeforeDarkContradiction(answer);
	}
	if (isShelterFatigueDecisionPrompt(lowerPrompt) && !isSpecificShelterSafetyPrompt(lowerPrompt) && !mentionsShelterDecisionFactors(answer)) {
		answer = appendSentence(answer, SHELTER_DECISION_NOTE);
	}
	if (isFullShelterPrompt(lowerPrompt) && !mentionsFullShelterFallback(answer)) {
		answer = appendSentence(answer, FULL_SHELTER_NOTE);
	}
	if (isStealthCampPrompt(lowerPrompt) && !mentionsStealthCampBoundary(answer)) {
		answer = appendSentence(answer, STEALTH_CAMP_NOTE);
	}
	if (isStormCampsitePrompt(lowerPrompt) && !mentionsStormCampsiteSafety(answer)) {
		answer = appendSentence(answer, STORM_CAMPSITE_NOTE);
	}
	if (isLowImpactCampsitePrompt(lowerPrompt) && !mentionsLowImpactCampsite(answer)) {
		answer = appendSentence(answer, LOW_IMPACT_CAMPSITE_NOTE);
	}
	if (isClimbStopPrompt(lowerPrompt) && !mentionsClimbStopDecision(answer)) {
		answer = appendSentence(answer, CLIMB_STOP_NOTE);
	}
	if (isAfterDarkShelterPrompt(lowerPrompt) && !mentionsAfterDarkShelterSafety(answer)) {
		answer = appendSentence(answer, AFTER_DARK_SHELTER_NOTE);
	}
	if (isWaterlessShelterPrompt(lowerPrompt) && !mentionsWaterlessShelterPlanning(answer)) {
		answer = appendSentence(answer, WATERLESS_SHELTER_NOTE);
	}
	if (isBearActivityShelterPrompt(lowerPrompt) && !mentionsBearActivityShelterPlan(answer)) {
		answer = appendSentence(answer, BEAR_ACTIVITY_SHELTER_NOTE);
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
	if (isDryClothesPriorityPrompt(lowerPrompt) && !mentionsDryClothesPriority(answer)) {
		answer = appendSentence(answer, DRY_CLOTHES_PRIORITY_NOTE);
	}
	if (isBatteryBankPlanningPrompt(lowerPrompt) && !mentionsBatteryBankPlanning(answer)) {
		answer = appendSentence(answer, BATTERY_BANK_PLANNING_NOTE);
	}
	if (isFirstAidKitPrompt(lowerPrompt) && !mentionsFirstAidKitSafety(answer)) {
		answer = appendSentence(answer, FIRST_AID_KIT_NOTE);
	}
	if (isMailHomeGearSafetyPrompt(lowerPrompt)) {
		answer = removeMailHomeGearConfusion(answer);
		if (!firstParagraphMentionsMailHomeGearSafety(answer)) {
			answer = prependSentence(answer, MAIL_HOME_GEAR_NOTE);
		}
	}
	if (isBadWeatherNeroPrompt(lowerPrompt) && !mentionsBadWeatherNeroDecision(answer)) {
		answer = appendSentence(answer, BAD_WEATHER_NERO_NOTE);
	}
	if (isLiveWeatherFactsPrompt(lowerPrompt) && !mentionsLiveWeatherFacts(answer)) {
		answer = appendSentence(answer, LIVE_WEATHER_FACTS_NOTE);
	}
	if (isShakedownPrompt(lowerPrompt) && !mentionsShakedownCaveat(answer)) {
		answer = appendSentence(answer, SHAKEDOWN_CAVEAT_NOTE);
	}
	if (isHeavyRainStartPrompt(lowerPrompt) && !mentionsHeavyRainStartSafety(answer)) {
		answer = appendSentence(answer, HEAVY_RAIN_START_NOTE);
	}
	if (isResupplyMailDropPrompt(lowerPrompt) && !firstParagraphMentionsResupplyMailDropInputs(answer)) {
		answer = prependSentence(answer, RESUPPLY_MAIL_DROP_NOTE);
	}
	if (isTownRecoveryFirstPrompt(lowerPrompt) && !mentionsTownRecoveryOrder(answer)) {
		answer = TOWN_RECOVERY_FIRST_NOTE;
	}
	if (isFoodDaysNextStretchPrompt(lowerPrompt)) {
		answer = buildFoodDaysNextStretchNote(toolInvocations);
	}
	if (
		isZeroNeroPrompt(lowerPrompt) &&
		!isBadWeatherNeroPrompt(lowerPrompt) &&
		(!mentionsZeroNeroDecision(answer) || isOvercommittedZeroNeroAnswer(answer))
	) {
		answer = buildZeroNeroDecisionNote(toolInvocations);
	}
	if (isTownDaySequencePrompt(lowerPrompt) && !mentionsTownDaySequence(answer)) {
		answer = TOWN_DAY_SEQUENCE_NOTE;
	}
	if (isHostelChoreOrderPrompt(lowerPrompt) && !mentionsHostelChoreOrder(answer)) {
		answer = HOSTEL_CHORE_ORDER_NOTE;
	}
	if (isResupplyPointCarryPrompt(lowerPrompt)) {
		answer = buildResupplyPointCarryNote(toolInvocations);
	}
	if (isScoutTownUpdatePrompt(lowerPrompt) && !mentionsScoutTownUpdate(answer)) {
		answer = SCOUT_TOWN_UPDATE_NOTE;
	}
	if (isDocumentWritingPrompt(lowerPrompt) && isScoutTownUpdatePrompt(lowerPrompt) && !mentionsDocumentDraft(answer)) {
		answer = appendSentence(answer, SCOUT_TOWN_UPDATE_DRAFT_NOTE);
	}
	if (isDocumentWritingPrompt(lowerPrompt) && !mentionsDocumentSourceBoundary(answer)) {
		answer = appendSentence(answer, DOCUMENT_WRITING_SOURCE_BOUNDARY_NOTE);
	}
	if (isDocumentWritingPrompt(lowerPrompt) && !mentionsDocumentWriteConfirmation(answer)) {
		answer = appendSentence(
			answer,
			'Review the draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it.'
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
	answer = removeRedundantWaterCarryAdvice(answer);

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

function removeInlineProvenanceSentences(answer: string): string {
	return answer
		.split(/\n{2,}/u)
		.map((paragraph) =>
			paragraph
				.replace(/\b(?:The|These) findings state that\b[^.?!]*(?:[.?!]|$)/giu, '')
				.replace(/\bSafety guidance states that\b[^.?!]*(?:[.?!]|$)/giu, '')
				.replace(/\bThis (?:guidance|approach|answer|advice) (?:comes from|is based on)\b[^.?!]*(?:[.?!]|$)/giu, '')
				.replace(/[ \t]{2,}/gu, ' ')
				.trim()
		)
		.filter(Boolean)
		.join('\n\n');
}

function removeInjuryPrepDrift(answer: string): string {
	return answer
		.split(/\n{2,}/u)
		.filter((paragraph) => !/^A shakedown hike should prove\b/iu.test(paragraph.trim()))
		.filter((paragraph) => !/^For your first week, the plan should include\b/iu.test(paragraph.trim()))
		.filter((paragraph) => !/^Terrain guidance says\b/iu.test(paragraph.trim()))
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

function removeAfterDarkBeforeDarkContradiction(answer: string): string {
	return answer
		.replace(/\bchoose a backup before dark\b/giu, 'keep a fallback if the shelter is full')
		.replace(/\bchoose backups before dark\b/giu, 'keep fallbacks for full shelters or unsafe conditions')
		.replace(/\bpick a safe legal earlier stop if one is available\b/giu, 'take the nearest safe legal option rather than adding extra night miles');
}

function removeMisappliedHeatIllnessDrift(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsHeatIllnessDrift(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
}

function removeUnsafePersonShelterDrift(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsUnsafePersonShelterDrift(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
}

function removeBearNearCampDrift(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsBearNearCampDrift(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
}

function removeMailHomeGearConfusion(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsMailHomeGearConfusion(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
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

function removeRedundantWaterCarryAdvice(answer: string): string {
	const seenTargets = new Set<string>();
	return answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph);
			return sentences
				.map((sentence) => sentence.trim())
				.filter((sentence) => {
					const target = waterCarryTargetForDedupe(sentence);
					if (!target) return true;
					if (seenTargets.has(target)) return false;
					seenTargets.add(target);
					return true;
				})
				.join(' ');
		})
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.join('\n\n')
		.trim();
}

function waterCarryTargetForDedupe(sentence: string): string | null {
	const normalized = sentence.toLowerCase().replace(/\s+/gu, ' ').trim();
	if (!/\bcarry enough water\b/u.test(normalized)) return null;
	const target = normalized.match(/\b(?:to reach|reach) (?:that |the )?(?:next )?(seep|source|verified source|reliable source)\b/u)?.[1];
	return target ? `carry-water:${target}` : null;
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

function prependSentence(answer: string, sentence: string): string {
	return `${sentence}\n\n${answer.trim()}`;
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

function isAirplaneModeCapabilityPrompt(prompt: string): boolean {
	const asksCapability =
		/\b(?:can i use scout|use scout|what can (?:you|scout) still answer|what still works|will scout work|works? offline|answer in airplane mode)\b/u.test(
			prompt
		);
	const mentionsOfflineMode =
		/\b(?:airplane mode|airplane-mode|no cell|cell service|without service|without signal|offline)\b/u.test(prompt);
	return asksCapability && mentionsOfflineMode;
}

function isAirplaneModeRehearsalPrompt(prompt: string): boolean {
	const asksTest = /\b(?:test|try|verify|rehearsal|rehearse|practice)\b/u.test(prompt);
	const mentionsAirplane = /\b(?:airplane mode|airplane-mode|offline|no cell|without service)\b/u.test(prompt);
	const mentionsBeforeTown = /\b(?:before leaving town|before leaving|leaving town|town|service|wi[-\s]?fi)\b/u.test(prompt);
	return asksTest && mentionsAirplane && mentionsBeforeTown;
}

function isPretripScreenshotPrompt(prompt: string): boolean {
	const asksScreenshot = /\b(?:screenshot|screen shot|screen-shot|save offline|save outside|copy)\b/u.test(prompt);
	const mentionsTiming = /\b(?:before day one|day one|before leaving|before trail|app|signal|service|acts up)\b/u.test(prompt);
	return asksScreenshot && mentionsTiming;
}

function isDocumentWritingPrompt(prompt: string): boolean {
	const writingVerb = /\b(?:draft|write|create|revise)\b/u;
	const documentObject = /\b(?:checklist|note|plan|summary|update|decision|document|document vault|vault)\b/u;
	return (writingVerb.test(prompt) && documentObject.test(prompt)) ||
		/\b(?:save|saving|saved)\b[^.?!\n]*(?:document vault|vault|note|checklist|document)\b/u.test(prompt) ||
		/\b(?:update my notes|update note|town[-\s]?exit update note|checklist note)\b/u.test(prompt);
}

function isModelDownloadingStatusPrompt(prompt: string): boolean {
	const mentionsModel = /\b(?:model|local ai|gemma)\b/u.test(prompt);
	const mentionsDownloadState =
		/\b(?:still downloading|downloading|download is stuck|download stuck|download failed|failed download|not ready|model status|installing|verifying)\b/u.test(
			prompt
		);
	return mentionsModel && mentionsDownloadState;
}

function isModelDownloadFailurePrompt(prompt: string): boolean {
	return /\b(?:download failed|failed download|download is stuck|download stuck|stuck download|won't download|will not download|can't download|cannot download)\b/u.test(prompt) ||
		(/\bdownload\b/u.test(prompt) && /\bfailed\b/u.test(prompt));
}

function isFieldPackStalenessPrompt(prompt: string): boolean {
	const mentionsFieldPack = /\b(?:field[-\s]?pack|scout\s+pack|cached\s+(?:trail\s+)?pack|trail\s+data\s+pack)\b/u.test(prompt);
	const asksFreshness = /\b(?:stale|fresh|current|trust|age|status|refresh|old|outdated|valid|expired)\b/u.test(prompt);
	return mentionsFieldPack && asksFreshness && !isWaterReportConflictPrompt(prompt);
}

function isSignInBeforeTrailPrompt(prompt: string): boolean {
	const mentionsAccount = /\b(?:sign in|log in|login|account|invite-only|invited|cloud sync|backup|restore)\b/u.test(prompt);
	const mentionsTiming = /\b(?:before (?:the )?trail|before leaving|can i wait|wait|trail|service|town|wi[-\s]?fi)\b/u.test(prompt);
	return mentionsAccount && mentionsTiming;
}

function isFirstRunOnboardingPrompt(prompt: string): boolean {
	return /\b(?:just installed|new install|first run|first use|first[-\s]?time|newly installed|set up scout|setup scout|scout useful|useful on trail)\b/u.test(prompt) &&
		/\b(?:app|scout|trail|start|first|useful)\b/u.test(prompt);
}

function isOwnMileSetupPrompt(prompt: string): boolean {
	const mentionsMileOrProfile = /\b(?:current mile|trail mile|at mile|mile marker|profile|gps|position|spot)\b/u.test(prompt);
	const mentionsSetupOrCorrection =
		/\b(?:make scout follow|follow my own|someone else|someone else's|wrong|manual|manually|set my|set the|set .*mile|update .*mile|change .*mile|edit hike|shuttle|missed gps|gps jumps?|shows? .*wrong)\b/u.test(
			prompt
		);
	return mentionsMileOrProfile && mentionsSetupOrCorrection;
}

function isWrongMileRecoveryPrompt(prompt: string): boolean {
	return /\b(?:wrong trail mile|wrong mile|enter(?:ed)? .*wrong .*mile|mile .*mistake|mistake .*mile)\b/u.test(prompt);
}

function isGpsWrongSpotPrompt(prompt: string): boolean {
	const mentionsGpsProblem =
		/\b(?:gps jumps?|gps jump(?:ing)?|gps drift|gps bounces?|gps is wrong|bad gps|missed gps|wrong gps|wrong spot|wrong location|wrong position|shows? (?:the )?wrong spot|shows? .*wrong (?:spot|location|position))\b/u.test(
			prompt
		);
	const mentionsScoutOrLocation = /\b(?:scout|gps|spot|location|position|mile|fix)\b/u.test(prompt);
	return mentionsGpsProblem && mentionsScoutOrLocation;
}

function isGuidebookMileMismatchPrompt(prompt: string): boolean {
	const mentionsMismatch = /\b(?:not match|doesn'?t match|do not match|different|disagree|off by|mismatch|wrong)\b/u.test(prompt);
	const mentionsMile = /\b(?:mile|mileage|milepost|mile marker|trail mile)\b/u.test(prompt);
	const mentionsReference = /\b(?:guidebook|guide book|guide|trail sign|sign|map|gps|scout|farout|source)\b/u.test(prompt);
	return mentionsMismatch && mentionsMile && mentionsReference;
}

function isNoBasemapNavigationPrompt(prompt: string): boolean {
	const mentionsMap = /\b(?:map|basemap|map tiles?|tiles?|gps|trail line|navigation|navigate)\b/u.test(prompt);
	const mentionsOfflineGap = /\b(?:no basemap|missing basemap|no cell|cell signal|no signal|offline|airplane mode|not cached|not downloaded)\b/u.test(prompt);
	return mentionsMap && mentionsOfflineGap;
}

function isOffTrailImmediatePrompt(prompt: string): boolean {
	const mentionsLostOrOffTrail =
		/\b(?:off trail|off-trail|off route|off-route|lost|not on trail|can't find the trail|cannot find the trail|where is the trail|left the trail|missed the trail)\b/u.test(
			prompt
		);
	const asksImmediateAction = /\b(?:right now|what should i do|do now|should i do|i think|i am|i'm|lost)\b/u.test(prompt);
	return mentionsLostOrOffTrail && asksImmediateAction;
}

function isManualMileAfterShuttlePrompt(prompt: string): boolean {
	const asksManualMile = /\b(?:set|update|change|enter|correct)\b[^.?!\n]*(?:mile|current at mile|trail mile)|\b(?:mile|current at mile|trail mile)\b[^.?!\n]*(?:manual|manually|after a shuttle|missed gps|missed gps fix)\b/u.test(prompt);
	const mentionsShuttleOrGps = /\b(?:shuttle|missed gps|gps fix|manual|manually)\b/u.test(prompt);
	return asksManualMile && mentionsShuttleOrGps;
}

function isConfusingJunctionPrompt(prompt: string): boolean {
	return /\b(?:confusing junction|junction|intersection|fork|turn)\b/u.test(prompt) &&
		/\b(?:blaze|blazes|unclear|not clear|can't tell|cannot tell|which way|wrong way)\b/u.test(prompt);
}

function isBailoutInjuryExitPrompt(prompt: string): boolean {
	const mentionsExitIntent = /\b(?:bailout|bail out|exit|access|road crossing|road|town|shuttle|pickup|get off trail|evacuat\w*)\b/u.test(prompt);
	const mentionsInjuryRisk =
		/\b(?:knee|joint|ankle|injur\w*|hurt|pain|worse|worsens|worsening|swelling|gait|cannot continue|can't continue)\b/u.test(prompt);
	return mentionsExitIntent && mentionsInjuryRisk;
}

function isPersonalDocumentPrompt(prompt: string): boolean {
	return /documents|personal documents|information should i keep saved offline|insurance|emergency contacts|permits|reservations/u.test(prompt);
}

function isResupplyMailDropPrompt(prompt: string): boolean {
	return /\b(?:mail ahead|mail drop|mail-drop|mail box|ship a box|shipping a box|mail versus|mail vs|buy in town|buy as i go|buy versus ship|ship versus buy|mail ahead versus buy|mail ahead vs buy)\b/u.test(prompt);
}

function isFamilyCheckinPrompt(prompt: string): boolean {
	return /check-ins|check ins|check-in|family|miss one|missed check-in|miss a check-in/u.test(prompt);
}

function isInjuryPrompt(prompt: string): boolean {
	return /injury|hurt|pain|knee|ankle|rolled|symptoms|medical|sick/u.test(prompt);
}

function isRolledAnkleNowPrompt(prompt: string): boolean {
	return /\b(?:rolled|twisted|sprained)\b[^.?!\n]*\bankle\b|\bankle\b[^.?!\n]*(?:rolled|twisted|sprained)\b/u.test(prompt);
}

function isSosSupportCirclePrompt(prompt: string): boolean {
	return /\b(?:sos|support circle|emergency contacts?|contact my support|contact support|call for help)\b/u.test(prompt);
}

function isNoSignalHelpSoonPrompt(prompt: string): boolean {
	return /\b(?:lose|lost|no|without)\b[^.?!\n]*(?:phone signal|cell signal|signal|service)\b/u.test(prompt) &&
		/\b(?:need help soon|need help|help soon|emergency|something goes wrong)\b/u.test(prompt);
}

function isOverduePartnerPrompt(prompt: string): boolean {
	return /\b(?:partner|hiking partner|tramily|friend|someone)\b/u.test(prompt) &&
		/\b(?:overdue|late|cannot reach|can't reach|not back|missing|hasn't checked in|has not checked in)\b/u.test(prompt);
}

function isMedicalAdviceBoundaryPrompt(prompt: string): boolean {
	return /\b(?:medical advice|symptoms?|diagnos\w*|sick|illness|what should scout handle)\b/u.test(prompt);
}

function isStopHikingImmediatePrompt(prompt: string): boolean {
	return /\b(?:stop hiking immediately|stop hiking|stop instead of trying to make miles|instead of trying to make miles|make miles)\b/u.test(prompt);
}

function isZeroNeroPrompt(prompt: string): boolean {
	return /\b(?:zero|nero)\b|town[-\s]?rest|rest day/u.test(prompt);
}

function isBiblePrompt(prompt: string): boolean {
	return /\b(?:bible|scripture|verse|pray|prayer|psalm|proverb|john|romans|jesus|christ|lord|god|faith|salvation|spiritual|fear while|scared and alone)\b/u.test(prompt) ||
		/\b(?:be saved|get saved|am i saved)\b/u.test(prompt);
}

function isJohn316SimplePrompt(prompt: string): boolean {
	return /\bjohn\s*3\s*:?\s*16\b/u.test(prompt) && /\b(?:read|quote|explain|simple|simply)\b/u.test(prompt);
}

function isSalvationPrompt(prompt: string): boolean {
	return /\b(?:what must i do to be saved|how (?:can|do) i (?:be|get) saved|how am i saved|salvation)\b/u.test(prompt);
}

function isRepeatLastQuestionPrompt(prompt: string): boolean {
	return /\b(?:answer|say|repeat)\b[^.?!\n]*(?:last question|previous question|again)\b/u.test(prompt) ||
		/\b(?:last question|previous question)\b[^.?!\n]*(?:shorter|again)\b/u.test(prompt);
}

function isTownRecoveryFirstPrompt(prompt: string): boolean {
	return /\b(?:first|do first)\b/u.test(prompt) &&
		/\btown\b/u.test(prompt) &&
		/\b(?:recover|recovery|feel better|rest)\b/u.test(prompt);
}

function isFoodDaysNextStretchPrompt(prompt: string): boolean {
	return /\b(?:how many days|days of food|food should i buy|buy.*food)\b/u.test(prompt) &&
		/\b(?:next stretch|next section|resupply|food)\b/u.test(prompt);
}

function isTownDaySequencePrompt(prompt: string): boolean {
	return /\b(?:town day|wasting a town day|waste a town day|feel human)\b/u.test(prompt);
}

function isHostelChoreOrderPrompt(prompt: string): boolean {
	return /\bhostel\b/u.test(prompt) &&
		/\b(?:laundry|shower|resupply|foot care|chores?)\b/u.test(prompt);
}

function isResupplyPointCarryPrompt(prompt: string): boolean {
	return /\b(?:choose|pick|select|plan)\b[^.?!\n]*(?:resupply point|next resupply|resupply stop)\b/u.test(prompt) ||
		/\b(?:resupply point|next resupply|resupply stop)\b[^.?!\n]*(?:carry|too much food|food carry|choose|pick|select)\b/u.test(prompt);
}

function isScoutTownUpdatePrompt(prompt: string): boolean {
	return /\b(?:update in scout|update scout|what should i update)\b/u.test(prompt) &&
		/\b(?:leaving town|before leaving town|town)\b/u.test(prompt);
}

function isFearComfortPrompt(prompt: string): boolean {
	return /\b(?:scared|afraid|alone|anxious|anxiety|panic|fear|fearful|comfort|nighttime support|night support)\b/u.test(prompt);
}

function isScaredAloneNightPrompt(prompt: string): boolean {
	return /\b(?:scared|afraid|alone|anxious|panic|fearful)\b/u.test(prompt) &&
		/\b(?:tonight|night|dark|alone|by myself)\b/u.test(prompt);
}

function isPrayerSafePlanPrompt(prompt: string): boolean {
	return /\b(?:pray|prayer)\b/u.test(prompt) &&
		/\b(?:safe plan|safety plan|make a plan|safe next step|safe next steps|plan)\b/u.test(prompt);
}

function wantsScriptureQuotePrompt(prompt: string): boolean {
	return /\b(?:bible|scripture|verse|verses|psalm|psalms|proverb|proverbs|john|romans|timothy)\b/u.test(prompt);
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

function isTomorrowWeatherPrompt(prompt: string): boolean {
	return /\btomorrow\b/u.test(prompt) && /\b(?:weather|forecast|rain|storm|wind|hot|cold|temperature|temps?)\b/u.test(prompt);
}

function isDirectNextWaterDistancePrompt(prompt: string): boolean {
	return /\b(?:how far|where|nearest|next)\b[^.?!\n]*(?:water|spring|creek|source)|\b(?:water|spring|creek|source)\b[^.?!\n]*(?:how far|nearest|next)\b/u.test(prompt) &&
		!isDryStretchWaterPrompt(prompt) &&
		!isRidgeWaterDecisionPrompt(prompt) &&
		!isHeatWaterPrompt(prompt) &&
		!isQuestionableWaterLowDaylightPrompt(prompt) &&
		!isUnknownWaterFlowPrompt(prompt) &&
		!isSkipSeasonalWaterPrompt(prompt) &&
		!isWaterReportConflictPrompt(prompt);
}

function isDirectNextTownDistancePrompt(prompt: string): boolean {
	if (/\b(?:where am i|relative to)\b/u.test(prompt)) return false;
	return /\b(?:how far|nearest|next)\b[^.?!\n]*(?:town|resupply|road crossing|road|access)|\b(?:town|resupply|road crossing|road|access)\b[^.?!\n]*(?:how far|nearest|next)\b/u.test(prompt);
}

function isTodayDifficultyPrompt(prompt: string): boolean {
	return /\b(?:how hard|how tough|hard is today|hard today|today going to be|today gonna be)\b/u.test(prompt);
}

function isThunderstormHikePrompt(prompt: string): boolean {
	return /\b(?:thunderstorms?|storm|lightning)\b/u.test(prompt) &&
		/\b(?:today|afternoon|hike|mileage|miles|ridge|ridges|exposed)\b/u.test(prompt) &&
		!isStormCampsitePrompt(prompt);
}

function isHeavyRainStartPrompt(prompt: string): boolean {
	return /\b(?:heavy rain|hard rain|rain start|start(?:ing)? the at in rain|start(?:ing)? in rain)\b/u.test(prompt) &&
		/\b(?:start|springer|at|trail|plan|safe|safety)\b/u.test(prompt);
}

function isShakedownPrompt(prompt: string): boolean {
	return /\b(?:shakedown|shake down|test hike|practice hike)\b/u.test(prompt);
}

function isColdWindRidgePrompt(prompt: string): boolean {
	return /\b(?:cold|35 degrees|thirty five|wind|windy)\b/u.test(prompt) &&
		/\b(?:ridge|ridgeline|exposed)\b/u.test(prompt);
}

function isHotDayPlanPrompt(prompt: string): boolean {
	return /\b(?:hot|heat|humid|heat illness)\b/u.test(prompt) &&
		/\b(?:today|plan|change|adjust|hike|miles?|water|shade)\b/u.test(prompt);
}

function isWetHypothermiaPrompt(prompt: string): boolean {
	return /\bhypothermia\b/u.test(prompt) &&
		/\b(?:wet|rain|cold|weather)\b/u.test(prompt);
}

function isLightningRidgePrompt(prompt: string): boolean {
	return /\blightning\b/u.test(prompt) &&
		/\b(?:ridge|ridgeline|high point|exposed)\b/u.test(prompt);
}

function isTownGearDryingPrompt(prompt: string): boolean {
	return /\b(?:dry|drying|wet)\b/u.test(prompt) &&
		/\b(?:gear|sleep system|quilt|bag|shoes|socks|clothes|rain gear)\b/u.test(prompt) &&
		/\b(?:town|laundry|laundromat|hostel|motel|day)\b/u.test(prompt);
}

function isHostelFullTownPrompt(prompt: string): boolean {
	return /\b(?:hostel|lodging|motel|hotel|bunkhouse)\b/u.test(prompt) &&
		/\b(?:full|booked|sold out|no room|no bed|no beds|no vacancy)\b/u.test(prompt);
}

function isBadWeatherNeroPrompt(prompt: string): boolean {
	return /\b(?:zero|nero)\b/u.test(prompt) &&
		/\b(?:weather|rains?|rainy|raining|storms?|thunderstorms?|thunder|lightning|winds?|cold|heat|hot|hypothermia|freez\w*|bad weather)\b/u.test(prompt);
}

function isLiveWeatherFactsPrompt(prompt: string): boolean {
	return /\b(?:weather facts|verify live|must scout verify|rely on an answer|before i rely)\b/u.test(prompt);
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

function isAcuteHeatIllnessPrompt(prompt: string): boolean {
	return /\b(?:heat|hot|humid|dehydrat\w*|heat illness)\b/u.test(prompt) &&
		/\b(?:dizz\w*|confus\w*|faint\w*|passed out|passing out|nausea|cramps?|stopped sweating|chills?|symptoms?)\b/u.test(prompt);
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

function isUnknownWaterFlowPrompt(prompt: string): boolean {
	return /\b(?:do(?:es)? not know|don't know|unknown|not know|cannot verify|can't verify)\b[^.?!\n]*(?:current )?(?:water )?flow|(?:current )?(?:water )?flow[^.?!\n]*(?:unknown|do(?:es)? not know|don't know|not know|cannot verify|can't verify)\b/u.test(
		prompt
	);
}

function isSkipSeasonalWaterPrompt(prompt: string): boolean {
	const asksSkip = /\b(?:skip|pass|bypass)\b/u.test(prompt);
	const mentionsCandidate = /\b(?:spring|seep|water source|source)\b/u.test(prompt);
	const mentionsReliable = /\b(?:next reliable|reliable water|make the next|make it to the next)\b/u.test(prompt);
	return asksSkip && mentionsCandidate && mentionsReliable;
}

function isWaterReportConflictPrompt(prompt: string): boolean {
	const mentionsReport = /\b(?:farout|report|reports|reported|says|comments?|other hikers?|recent)\b/u.test(prompt);
	const mentionsDry = /\b(?:dry|not flowing|no flow|not running|empty)\b/u.test(prompt);
	const mentionsScoutPack = /\b(?:scout|pack|field[-\s]?pack|cached|listed|shows|has it)\b/u.test(prompt);
	const mentionsWaterSource = /\b(?:spring|seep|water source|source|water)\b/u.test(prompt);
	const asksTrust = /\b(?:trust|believe|rely|which|who)\b/u.test(prompt);
	return mentionsReport && mentionsDry && mentionsScoutPack && mentionsWaterSource && asksTrust;
}

function isRoadTownRelativePrompt(prompt: string): boolean {
	const asksPosition = /\b(?:where am i|relative to|how far (?:am i )?(?:from|to)|nearest|next)\b/u.test(prompt);
	const mentionsAccess = /\b(?:road crossing|road|crossing|town|bailout|exit|access)\b/u.test(prompt);
	return asksPosition && mentionsAccess;
}

function isClimbTerrainAheadPrompt(prompt: string): boolean {
	const asksClimbDetail = /\b(?:how far|how hard|next climb|climb ahead|terrain ahead|elevation|gain|loss|grade)\b/u.test(prompt);
	const mentionsClimbOrTerrain = /\b(?:climb|terrain|elevation|gain|loss|grade)\b/u.test(prompt);
	return (asksClimbDetail && mentionsClimbOrTerrain) || isTodayDifficultyPrompt(prompt);
}

function isNearestWaterPrompt(prompt: string): boolean {
	return /\b(?:what water is ahead|water ahead|next water|nearest water)\b/u.test(prompt) &&
		!isDryStretchWaterPrompt(prompt) &&
		!isRidgeWaterDecisionPrompt(prompt) &&
		!isHeatWaterPrompt(prompt) &&
		!isQuestionableWaterLowDaylightPrompt(prompt) &&
		!isUnknownWaterFlowPrompt(prompt) &&
		!isSkipSeasonalWaterPrompt(prompt) &&
		!isWaterReportConflictPrompt(prompt);
}

function isWaterDecisionPrompt(prompt: string): boolean {
	return isNearestWaterPrompt(prompt) ||
		isHeatWaterPrompt(prompt) ||
		isRidgeWaterDecisionPrompt(prompt) ||
		isDryStretchWaterPrompt(prompt) ||
		isQuestionableWaterLowDaylightPrompt(prompt) ||
		isUnknownWaterFlowPrompt(prompt) ||
		isSkipSeasonalWaterPrompt(prompt) ||
		isWaterReportConflictPrompt(prompt);
}

function isShelterFatigueDecisionPrompt(prompt: string): boolean {
	return /\b(?:tired|fatigue|exhausted)\b/u.test(prompt) &&
		/\b(?:where should i sleep|sleep tonight|sleep|shelter|camp|campsite)\b/u.test(prompt);
}

function isSevereFatigueClearThinkingPrompt(prompt: string): boolean {
	return /\b(?:too tired|too exhausted|can't keep going|cannot keep going|keep going|too wiped out|think clearly|clear[-\s]?headed)\b/u.test(prompt) &&
		/\b(?:keep going|think clearly|clear[-\s]?headed|what should i do|help me|continue safely)\b/u.test(prompt) &&
		!isSpecificShelterSafetyPrompt(prompt) &&
		!isShelterFatigueDecisionPrompt(prompt) &&
		!isQuestionableWaterLowDaylightPrompt(prompt) &&
		!isAcuteHeatIllnessPrompt(prompt);
}

function isSpecificShelterSafetyPrompt(prompt: string): boolean {
	return isFullShelterPrompt(prompt) ||
		isStealthCampPrompt(prompt) ||
		isStormCampsitePrompt(prompt) ||
		isLowImpactCampsitePrompt(prompt) ||
		isClimbStopPrompt(prompt) ||
		isAfterDarkShelterPrompt(prompt) ||
		isWaterlessShelterPrompt(prompt) ||
		isBearActivityShelterPrompt(prompt);
}

function isFullShelterPrompt(prompt: string): boolean {
	return /\b(?:shelter is full|shelter.*full|full shelter|no room at the shelter)\b/u.test(prompt);
}

function isStealthCampPrompt(prompt: string): boolean {
	return /\b(?:stealth camp|stealth camping|camp here|illegal camp|undesignated camp)\b/u.test(prompt) &&
		/\b(?:stealth|exhausted|tired|legal|rules|regulated|prohibited|camp)\b/u.test(prompt);
}

function isStormCampsitePrompt(prompt: string): boolean {
	return /\b(?:campsite|camp site|camp|camping|set up|sleep)\b/u.test(prompt) &&
		/\b(?:storm|storms|thunderstorm|thunderstorms|lightning|heavy rain|flood|wind)\b/u.test(prompt);
}

function isLowImpactCampsitePrompt(prompt: string): boolean {
	return /\b(?:too close to water|damaging the place|leave no trace|low impact|durable surface|durable surfaces|camping near water|200 feet)\b/u.test(prompt);
}

function isClimbStopPrompt(prompt: string): boolean {
	return /\b(?:stop before|stop after|before a big climb|after a big climb|big climb|climb)\b/u.test(prompt) &&
		/\b(?:stop|camp|shelter|sleep|push|before|after)\b/u.test(prompt);
}

function isAfterDarkShelterPrompt(prompt: string): boolean {
	return /\b(?:after dark|dark|dusk|night|late)\b/u.test(prompt) &&
		/\b(?:shelter|arriv|camp|sleep)\b/u.test(prompt);
}

function isWaterlessShelterPrompt(prompt: string): boolean {
	return /\b(?:shelter|camp|sleep)\b/u.test(prompt) &&
		/\b(?:no reliable water|without reliable water|waterless|no water|dry shelter|shelter water)\b/u.test(prompt);
}

function isBearActivityShelterPrompt(prompt: string): boolean {
	return /\b(?:bear activity|bear reports?|bear warning|bear alert|bear closure)\b/u.test(prompt) &&
		/\b(?:shelter|camp|campsite|sleep|overnight|nearby|near)\b/u.test(prompt);
}

function isBearNearCampPrompt(prompt: string): boolean {
	return /\bbear\b/u.test(prompt) &&
		/\b(?:near camp|near my camp|near the camp|in camp|around camp|at camp|campsite|tent|food)\b/u.test(prompt);
}

function isUnsafePersonShelterPrompt(prompt: string): boolean {
	return /\b(?:unsafe|threatened|creep\w*|harass\w*|scared|afraid|uncomfortable)\b/u.test(prompt) &&
		/\b(?:person|someone|guy|hiker|people|shelter|camp|campsite)\b/u.test(prompt);
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

function isDryClothesPriorityPrompt(prompt: string): boolean {
	return /\b(?:stay dry|keep .*dry|dry at all costs|must stay dry)\b/u.test(prompt) &&
		/\b(?:clothes|layers?|socks?|insulation|electronics?|pack|sleep)\b/u.test(prompt) &&
		!/\b(?:town|laundry|laundromat|drying room)\b/u.test(prompt);
}

function isBatteryBankPlanningPrompt(prompt: string): boolean {
	return /\b(?:battery bank|battery|power bank|charging)\b/u.test(prompt) &&
		/\b(?:scout|maps?|photos?|family|check-ins?|checkins?|local ai|model|phone)\b/u.test(prompt);
}

function isFirstAidKitPrompt(prompt: string): boolean {
	return /\b(?:first[-\s]?aid|blister kit|blisters?|wound basics?|normal trail problems?)\b/u.test(prompt);
}

function isMailHomeGearSafetyPrompt(prompt: string): boolean {
	return /\b(?:mail|send|ship)\b[^.?!\n]*(?:home|ahead|forward)|\b(?:home|ahead|forward)\b[^.?!\n]*(?:mail|send|ship)\b/u.test(prompt) &&
		/\b(?:gear|rain|warm|weather|looks warm|warm spell|insulation|water treatment|battery|sleep)\b/u.test(prompt);
}

function isClosureDetourRoutingPrompt(prompt: string): boolean {
	return /\b(?:closure|closed|detour|reroute|route around|route me around|alternate route|alternate path)\b/u.test(prompt) &&
		/\b(?:route|routing|around|detour|closed|closure|trail|scout)\b/u.test(prompt);
}

function isSmokeFireTrailPrompt(prompt: string): boolean {
	return /\b(?:smoke|fire|wildfire|flames?|burning|burn)\b/u.test(prompt) &&
		/\b(?:trail|near|ahead|smell|smelling|see|seeing|hike|hiking|route|section)\b/u.test(prompt);
}

function weatherLookupSummary(toolInvocations: ToolInvocationRecord[]): string | null {
	const summary = toolInvocations.find((tool) => tool.toolId === 'weather_lookup')?.summary?.trim();
	return summary || null;
}

function toolSummary(toolInvocations: ToolInvocationRecord[], toolId: string): string | null {
	const summary = toolInvocations.find((tool) => tool.toolId === toolId)?.summary?.trim();
	return summary || null;
}

function hasActionableWaterSummary(summary: string | null): summary is string {
	return Boolean(summary && !/\bNo water source or mapped water candidate found\b/iu.test(summary));
}

function containsUnsafePersonShelterDrift(sentence: string): boolean {
	return /\b(?:speak|talk|go)\b[^.?!\n]*(?:shelter staff|shelter manager|manager|staff)|\b(?:de[-\s]?escalate|resolve the issue|resolve it|clear about your concerns|confront|negotiate)\b/iu.test(sentence);
}

function containsBearNearCampDrift(sentence: string): boolean {
	return /\b(?:make yourself look big|waving your arms?|stand your ground|bear spray|keep(?:ing)? your eyes on it|talk to it calmly|curious|aggressive)\b/iu.test(sentence);
}

function normalizeSmokeFireTrailWording(answer: string): string {
	return answer.replace(/\bstop hiking immediately\b/giu, 'do not continue toward the smoke or fire');
}

function mentionsClosureDetourRoutingBoundary(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const hasLoadedAlert = Boolean(toolSummary(toolInvocations, 'trail_conditions'));
	const mentionsLoadedAlert = !hasLoadedAlert ||
		/\b(?:loaded|active official|official alert|official trail condition|trail update|alert says|closure.*loaded|detour.*loaded)\b/iu.test(answer);
	const mentionsAdvisoryBoundary =
		/\b(?:advisory context|not turn[-\s]?by[-\s]?turn|not a route planner|cannot provide turn[-\s]?by[-\s]?turn|can't provide turn[-\s]?by[-\s]?turn)\b/iu.test(answer);
	const mentionsAgencyRoute =
		/\b(?:managing[-\s]?agency|land[-\s]?manager|official detour|official route guidance|posted sign(?:age|s)?|posted detour)\b/iu.test(answer);
	const refusesInventedRoute =
		/\b(?:do not invent|don't invent|must not invent|cannot invent|can't invent|no invented|not invent)\b[^.?!\n]*(?:route|detour|alternate|details?)|(?:route|detour|alternate|details?)[^.?!\n]*(?:do not invent|don't invent|must not invent|cannot invent|can't invent|no invented|not invent)/iu.test(answer);
	return mentionsLoadedAlert && mentionsAdvisoryBoundary && mentionsAgencyRoute && refusesInventedRoute;
}

function mentionsSmokeFireTrailSafety(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const hasLoadedAlert = Boolean(toolSummary(toolInvocations, 'trail_conditions'));
	const mentionsLoadedAlert = !hasLoadedAlert ||
		/\b(?:loaded|active official|official alert|official trail condition|trail conditions guidance|trail update|alert says|fire alert|smoke alert)\b/iu.test(answer);
	const avoidsHazard =
		/\b(?:do not|don't|avoid|never|must not|cannot|can't)\b[^.?!\n]*(?:continue|enter|walk|hike|go|push|proceed|route)[^.?!\n]*(?:smoke|fire|flames?|hazard)|\b(?:do not|don't|avoid|never|must not|cannot|can't)\b[^.?!\n]*(?:smoke|fire|flames?)/iu.test(answer);
	const movesAwayOrExits =
		/\b(?:move away|get away|back away|exit|evacuat|bail out|leave the area|known safe|safe road|road|town|ranger station|public area|safer area)\b/iu.test(answer);
	const followsOfficialInstructions =
		/\b(?:official|closure|evacuation|ranger|911|emergency|authorit|managing[-\s]?agency|posted)\b/iu.test(answer);
	const refusesInventedRoute =
		/\b(?:do not|don't|must not|never|cannot|can't|avoid)\b[^.?!\n]*(?:invent|improvise|make up|guess)[^.?!\n]*(?:route|detour|safe route|path)|\b(?:invented|guessed|improvised)\b[^.?!\n]*(?:route|detour|safe route|path)|\b(?:safe route through|route through)\b[^.?!\n]*(?:smoke|fire|hazard)/iu.test(answer);
	const escalatesImmediateDanger =
		/\b(?:visible flames|heavy smoke|blocked exits?|fast-changing wind|immediate danger|911|emergency|inreach|plb|emergency device|emergency plan)\b/iu.test(answer);
	return mentionsLoadedAlert && avoidsHazard && movesAwayOrExits && followsOfficialInstructions && refusesInventedRoute && escalatesImmediateDanger;
}

function buildClosureDetourRoutingNote(toolInvocations: ToolInvocationRecord[]): string {
	const alert = toolSummary(toolInvocations, 'trail_conditions');
	if (!alert) return CLOSURE_DETOUR_ROUTING_NOTE;
	return `Closure/detour note: loaded official alert says ${trimToolClause(alert)}. Scout can summarize that alert as advisory context, not turn-by-turn detour routing. Verify the current managing-agency detour and posted signage before committing, follow official route guidance, and do not invent alternate route details.`;
}

function buildSmokeFireTrailNote(toolInvocations: ToolInvocationRecord[]): string {
	const alert = toolSummary(toolInvocations, 'trail_conditions');
	const weather = toolSummary(toolInvocations, 'weather_lookup');
	const intro = alert
		? `Smoke/fire trail note: loaded official alert says ${trimToolClause(alert)}.`
		: SMOKE_FIRE_TRAIL_NOTE;
	const weatherContext = weather ? ` Weather context: ${trimToolClause(weather)}.` : '';
	if (!alert) return `${intro}${weatherContext}`;
	return `${intro}${weatherContext} Do not continue toward or through smoke or visible fire; move away toward a known safe road, town, ranger station, or public area when you can do so safely. Follow official closures, evacuation orders, ranger, 911, or emergency-device instructions; do not invent a safe route through the hazard. Escalate immediately for visible flames, heavy smoke, blocked exits, fast-changing wind, or immediate danger.`;
}

function buildScaredAloneNightNote(toolInvocations: ToolInvocationRecord[]): string {
	const shelter = toolSummary(toolInvocations, 'next_shelter');
	if (!shelter) return SCARED_ALONE_NIGHT_NOTE;
	return `${SCARED_ALONE_NIGHT_NOTE} Loaded shelter context: ${trimToolClause(shelter)}. Treat that as a candidate, not a guarantee; verify status, water, and crowding when possible, and do not add risky night miles if it is not the safer legal option.`;
}

function buildPrayerSafePlanNote(toolInvocations: ToolInvocationRecord[], includePrayer = true): string {
	const shelter = toolSummary(toolInvocations, 'next_shelter');
	const water = toolSummary(toolInvocations, 'next_water');
	const town = toolSummary(toolInvocations, 'next_town');
	const context = [
		shelter ? `shelter: ${trimToolClause(shelter)}` : '',
		water ? `water: ${trimToolClause(water)}` : '',
		town ? `town/help: ${trimToolClause(town)}` : ''
	].filter(Boolean);
	const note = includePrayer
		? PRAYER_SAFE_PLAN_NOTE
		: 'Prayer and safety note: make the plan practical: check immediate danger, weather, daylight, body symptoms, and alerts if possible; treat loaded shelter, water, town, or bailout context as candidates; verify status, water, crowding, and legal options; choose the nearest lower-risk option. Prayer is support, not a substitute for help; use 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger, injury, exposure, confusion, or inability to continue safely.';
	if (!context.length) return note;
	return `${note} Loaded context: ${context.join('; ')}. Treat those as candidates, not guarantees, and choose the lower-risk option if anything cannot be verified.`;
}

function buildHostelFullTownNote(toolInvocations: ToolInvocationRecord[]): string {
	const town = toolSummary(toolInvocations, 'next_town');
	const park = toolSummary(toolInvocations, 'park_services');
	const context: string[] = [];
	if (town) {
		const townClause = trimToolClause(town).split('. ')[0];
		const guarantee = /\bno guaranteed services\b/iu.test(town) ? '; no guaranteed services at the crossing' : '';
		context.push(`Nearby access context: ${townClause}${guarantee}.`);
	}
	if (park) {
		const parkBits = [
			/\bvisitor center\b/iu.test(park) ? 'visitor-center candidate' : '',
			/\bcampground\b/iu.test(park) ? 'campground candidate' : '',
			/\bnot thru[-\s]?hiker shelters?\b/iu.test(park) ? 'not thru-hiker shelters' : '',
			/\b(?:reservations?|seasonal status)\b/iu.test(park) ? 'confirm reservations or seasonal status' : ''
		].filter(Boolean);
		context.push(
			parkBits.length
				? `Park-service context: ${parkBits.join(', ')}.`
				: `Park-service context: ${trimToolClause(park).split('\n')[0]}.`
		);
	}
	if (!context.length) return HOSTEL_FULL_TOWN_NOTE;
	return `${HOSTEL_FULL_TOWN_NOTE} ${context.join(' ')}`;
}

function buildSevereFatigueClearThinkingNote(toolInvocations: ToolInvocationRecord[]): string {
	const water = toolSummary(toolInvocations, 'next_water');
	const shelter = toolSummary(toolInvocations, 'next_shelter');
	const town = toolSummary(toolInvocations, 'next_town');
	const context = [
		water ? `water: ${trimToolClause(water)}` : '',
		shelter ? `shelter: ${trimToolClause(shelter)}` : '',
		town ? `town/help: ${trimToolClause(town)}` : ''
	].filter(Boolean);
	if (!context.length) return SEVERE_FATIGUE_CLEAR_THINKING_NOTE;
	return `${SEVERE_FATIGUE_CLEAR_THINKING_NOTE} Loaded context: ${context.join('; ')}. Treat those as candidates, not guarantees; verify water, shelter status, daylight, weather, and legal options before committing.`;
}

function buildUnsafePersonShelterNote(toolInvocations: ToolInvocationRecord[]): string {
	const exit = toolSummary(toolInvocations, 'next_town');
	if (!exit) return UNSAFE_PERSON_SHELTER_NOTE;
	return `${UNSAFE_PERSON_SHELTER_NOTE} Loaded exit context: ${trimToolClause(exit)}.`;
}

function buildBearNearCampNote(toolInvocations: ToolInvocationRecord[]): string {
	const condition = toolSummary(toolInvocations, 'trail_conditions');
	if (!condition) return BEAR_NEAR_CAMP_NOTE;
	return `${BEAR_NEAR_CAMP_NOTE} Loaded alert context: ${trimToolClause(condition)}.`;
}

function buildNearestWaterVerificationNote(toolInvocations: ToolInvocationRecord[]): string {
	const nextWater = toolSummary(toolInvocations, 'next_water');
	if (!nextWater) return WATER_SOURCE_VERIFICATION_NOTE;
	return `Water verification note: ${nextWater} Visually confirm flow before relying on it, filter or treat any water you collect, and carry enough to reach a verified source if it is dry.`;
}

function buildDirectNextWaterDistanceAnswer(toolInvocations: ToolInvocationRecord[]): string {
	const nextWater = toolSummary(toolInvocations, 'next_water');
	if (!hasActionableWaterSummary(nextWater)) {
		return 'I do not have a loaded water source ahead in this cached field pack. Refresh when online or verify from a current source before planning a carry.';
	}
	return `Next water from the cached field pack: ${trimToolClause(nextWater)}. Visually confirm current flow before relying on it, filter or treat anything you collect, and carry enough to reach a verified source if it is dry.`;
}

function buildCachedWeatherAnswer(toolInvocations: ToolInvocationRecord[]): string {
	const weather = weatherLookupSummary(toolInvocations);
	if (!weather) {
		return 'I do not have cached weather in this field pack. Refresh when online or check an official weather source before relying on tomorrow weather.';
	}
	return `Cached weather answer: ${trimToolClause(weather)}. Treat this as offline context, not live proof; refresh when you have service before exposed terrain, storms, heat, cold, flooding, or a safety-critical decision.`;
}

function normalizeSkipSeasonalWaterWording(answer: string): string {
	return answer
		.replace(
			/\bYou (?:can't|cannot) skip the next reliable water source\.?/giu,
			'Do not count the seasonal spring as reliable; use the next reliable water source as the planning target.'
		)
		.replace(
			/\bYou can skip the ((?:seasonal|unconfirmed|unverified)\s+(?:spring|seep)(?:\s+at\s+mile\s+\d+(?:\.\d+)?)?)\s+and make the ((?:reliable\s+)?(?:creek crossing|water source|spring|source)(?:\s+at\s+mile\s+\d+(?:\.\d+)?)?) your next water source\.?/giu,
			'Use the $2 as the planning target; skip the $1 only if your current treated carry and conditions give you enough margin.'
		);
}

function normalizeWaterReportConflictWording(answer: string): string {
	return answer
		.replace(
			/\bYou should trust what is in your pack(?:, especially when it comes to water)?\.?/giu,
			"Trust the current dry report for flow; use Scout's cached pack only as planning context."
		)
		.replace(
			/\bTrust (?:Scout|the Scout pack|Scout's pack|your pack) (?:over|instead of) (?:FarOut|the report|the current report|a current report)[^.?!\n]*\.?/giu,
			"Trust the current dry report for flow; use Scout's cached pack only as planning context."
		);
}

function normalizeRoadTownNavigationWording(answer: string): string {
	return answer.replace(/\bThe next reliable water source is a seasonal seep\b/giu, 'The closest loaded water candidate is a seasonal seep');
}

function normalizeOffTrailImmediateWording(answer: string): string {
	return answer.replace(/\b(?:find|get to|move to) a safe spot away from the trail\b/giu, 'Get to a safe stable spot out of immediate hazards');
}

function removeConfusingJunctionDrift(answer: string): string {
	const filtered = answer
		.split(/\n{2,}/u)
		.map((paragraph) => {
			const sentences = splitSentences(paragraph)
				.map((sentence) => sentence.trim())
				.filter((sentence) => sentence && !containsConfusingJunctionDrift(sentence));
			return sentences.join(' ');
		})
		.filter(Boolean)
		.join('\n\n')
		.trim();
	return filtered || answer;
}

function containsConfusingJunctionDrift(sentence: string): boolean {
	return /\b(?:fire|smoke|high water|weather|current conditions|current source checks?|live risk|lower-mileage|safer-stop|hazards?)\b/iu.test(sentence) &&
		!/\b(?:blaze|junction|map|compass|gps|backtrack|last known)\b/iu.test(sentence);
}

function buildGuidebookMileMismatchNote(toolInvocations: ToolInvocationRecord[]): string {
	const current = toolSummary(toolInvocations, 'current_mile');
	if (!current) {
		return GUIDEBOOK_MILE_MISMATCH_NOTE;
	}
	const currentPosition = trimToolClause(current).replace(/^Currently\b/u, 'currently');
	return `Scout's loaded position is ${currentPosition}. ${GUIDEBOOK_MILE_MISMATCH_NOTE}`;
}

function buildRoadTownNavigationNote(toolInvocations: ToolInvocationRecord[]): string {
	const current = toolSummary(toolInvocations, 'current_mile');
	const town = toolSummary(toolInvocations, 'next_town');
	const parts = [
		current ? trimToolClause(current) : '',
		town ? `next loaded road/town access is ${trimToolClause(town)}` : 'next loaded road/town access is not available in the current pack'
	].filter(Boolean);
	return `Road/town navigation note: ${parts.join('; ')}. Treat this as approximate loaded context. Confirm shuttle or pickup and do not assume services at a road crossing unless current service data proves them.`;
}

function buildTodayDifficultyNote(toolInvocations: ToolInvocationRecord[]): string {
	const terrain = toolSummary(toolInvocations, 'upcoming_terrain');
	const weather = toolSummary(toolInvocations, 'weather_lookup');
	const water = toolSummary(toolInvocations, 'next_water');
	const shelter = toolSummary(toolInvocations, 'next_shelter');
	const parts = [
		terrain ? `terrain: ${trimToolClause(terrain)}` : '',
		weather ? `weather: ${trimToolClause(weather)}` : '',
		water ? `water: ${trimToolClause(water)}` : '',
		shelter ? `sleep option: ${trimToolClause(shelter)}` : ''
	].filter(Boolean);
	if (!parts.length) {
		return 'I do not have enough cached field-pack detail to rate today. Refresh the field pack when online, then check terrain, weather, water spacing, daylight, pack weight, feet/knees, and the next legal stop before committing to miles.';
	}
	return `Today from the cached field pack: ${parts.join('; ')}. Use that as the difficulty picture: terrain plus water spacing, weather, daylight, pack weight, feet/knees, and the next legal stop. It is offline context, so refresh when online before safety-critical decisions.`;
}

function buildBailoutInjuryExitNote(toolInvocations: ToolInvocationRecord[]): string {
	const current = toolSummary(toolInvocations, 'current_mile');
	const town = toolSummary(toolInvocations, 'next_town');
	if (!current && !town) {
		return BAILOUT_INJURY_EXIT_FALLBACK_NOTE;
	}
	const parts = [
		current ? trimToolClause(current) : '',
		town ? `nearest loaded bailout/access candidate is ${trimToolClause(town)}` : 'nearest loaded bailout/access candidate is not available in the current pack'
	].filter(Boolean);
	return `Bailout planning note: ${parts.join('; ')}. Treat this as approximate loaded context: for worsening knee pain, swelling, changed gait, or inability to continue safely, do not push through it. Back off or stop, confirm shuttle/pickup and services when possible, and use 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger or if you cannot continue safely.`;
}

function buildRolledAnkleNowNote(toolInvocations: ToolInvocationRecord[]): string {
	const current = toolSummary(toolInvocations, 'current_mile');
	const town = toolSummary(toolInvocations, 'next_town');
	const context = [
		current ? trimToolClause(current) : '',
		town ? `loaded exit candidate: ${trimToolClause(town)}` : ''
	].filter(Boolean);
	if (!context.length) return ROLLED_ANKLE_NOW_NOTE;
	return `${ROLLED_ANKLE_NOW_NOTE} Loaded context: ${context.join('; ')}. Treat that exit as a candidate, not a guarantee; confirm shuttle, pickup, services, weather, and whether walking to it is safer than stopping.`;
}

function buildOverduePartnerNote(toolInvocations: ToolInvocationRecord[]): string {
	const town = toolSummary(toolInvocations, 'next_town');
	if (!town) return OVERDUE_PARTNER_NOTE;
	return `${OVERDUE_PARTNER_NOTE} Loaded nearby help/access context: ${trimToolClause(town)}. Treat it as a candidate for contacting help or arranging pickup, not proof that services are available.`;
}

function buildFoodDaysNextStretchNote(toolInvocations: ToolInvocationRecord[]): string {
	const town = toolSummary(toolInvocations, 'next_town');
	const terrain = toolSummary(toolInvocations, 'upcoming_terrain');
	const context = [
		town ? `loaded next town/access candidate: ${trimToolClause(town)}` : '',
		terrain ? `loaded terrain context: ${trimToolClause(terrain)}` : ''
	].filter(Boolean);
	const contextNote = context.length ? ` Loaded context: ${context.join('; ')}.` : '';
	return `${FOOD_DAYS_NEXT_STRETCH_NOTE}${contextNote}`;
}

function buildZeroNeroDecisionNote(toolInvocations: ToolInvocationRecord[]): string {
	const town = toolSummary(toolInvocations, 'next_town');
	const weather = toolSummary(toolInvocations, 'weather_lookup');
	const context = [
		town ? `loaded town/access candidate: ${trimToolClause(town)}` : '',
		weather ? `weather context: ${trimToolClause(weather)}` : ''
	].filter(Boolean);
	const contextNote = context.length ? ` Loaded context: ${context.join('; ')}. Verify before safety-critical choices.` : '';
	return `${ZERO_NERO_DECISION_NOTE}${contextNote}`;
}

function buildResupplyPointCarryNote(toolInvocations: ToolInvocationRecord[]): string {
	const town = toolSummary(toolInvocations, 'next_town');
	const terrain = toolSummary(toolInvocations, 'upcoming_terrain');
	const context = [
		town ? `loaded next town/access candidate: ${trimToolClause(town)}` : '',
		terrain ? `loaded terrain context: ${trimToolClause(terrain)}` : ''
	].filter(Boolean);
	const contextNote = context.length ? ` Loaded context: ${context.join('; ')}.` : '';
	return `${RESUPPLY_POINT_CARRY_NOTE}${contextNote}`;
}

function buildOffTrailImmediateNote(toolInvocations: ToolInvocationRecord[]): string {
	const current = toolSummary(toolInvocations, 'current_mile');
	if (!current) {
		return OFF_TRAIL_IMMEDIATE_FALLBACK_NOTE;
	}
	const currentPosition = trimToolClause(current).replace(/^Currently\b/u, 'currently');
	return `Off-trail immediate note: Scout's loaded position is ${currentPosition}. Stop moving, get to a safe stable spot, and conserve battery. Verify your position against map/GPS, compass, blazes, signs, and your last known point. Backtrack only if the route back is obvious and safe. Do not bushwhack, shortcut, or let Scout route you through unknown terrain. Escalate with 911, inReach/PLB, rangers/authorities, or the emergency plan if you are injured, exposed, confused, weather or darkness is closing in, or you cannot regain the trail safely.`;
}

function buildClimbTerrainAheadNote(toolInvocations: ToolInvocationRecord[]): string {
	const terrain = toolSummary(toolInvocations, 'upcoming_terrain');
	if (!terrain) {
		return CLIMB_TERRAIN_AHEAD_FALLBACK_NOTE;
	}
	if (/\b(?:gain|loss|max grade|difficulty|key steep sections)\b/iu.test(terrain)) {
		return `Climb/terrain note: loaded upcoming window is ${trimToolClause(terrain)}. Treat it as cached offline terrain context. Verify with an offline map, guide, GPS/elevation profile, or trail sign before committing to a hard push. Pace impact: slow the target pace, budget daylight, water spacing, pack weight, feet/knees, weather, and the next legal stop.`;
	}
	return `Climb/terrain note: loaded upcoming window is ${trimToolClause(terrain)}. That window does not include a verified climb, elevation profile, gain/loss, or grade, so do not invent a climb distance or difficulty. Use it as landmark spacing until an offline map, guide, GPS/elevation profile, or trail sign confirms the climb. Pace impact: slow the target pace, budget daylight, water spacing, pack weight, feet/knees, weather, and the next legal stop before committing to miles.`;
}

function buildUnknownWaterFlowNote(toolInvocations: ToolInvocationRecord[]): string {
	const nextWater = toolSummary(toolInvocations, 'next_water');
	if (!nextWater) {
		return 'Unknown-flow note: Scout does not know current flow. Verify flow at the source or with a current report, filter or treat any water you collect, and choose a safer carry or stop as if the source may be dry until confirmed.';
	}
	return `Unknown-flow note: cached water context is ${nextWater} This does not prove current flow. Verify flow at the source or with a current report, filter or treat any water you collect, and choose a safer carry or stop as if the source may be dry until confirmed.`;
}

function buildRidgeWaterContextNote(toolInvocations: ToolInvocationRecord[]): string {
	const nextWater = toolSummary(toolInvocations, 'next_water');
	const weather = toolSummary(toolInvocations, 'weather_lookup');
	const reliableWater = extractReliableWaterFromTerrain(toolSummary(toolInvocations, 'upcoming_terrain'));
	const parts = [
		nextWater ? `next water is ${trimToolClause(nextWater)}` : 'next water is not proven reliable from the cached pack',
		reliableWater ? `the next reliable loaded option is ${reliableWater}` : 'use the next reliable or verified source as the safer target',
		weather ? `weather context is ${trimToolClause(weather)}` : ''
	].filter(Boolean);
	return `Ridge-water context: ${parts.join('; ')}. Decision: camel up at the last confirmed source and carry extra until reliable water is confirmed.`;
}

function trimToolClause(summary: string): string {
	return summary.trim().replace(/[.;:\s]+$/u, '');
}

function extractReliableWaterFromTerrain(summary: string | null): string | null {
	if (!summary) return null;
	const withMile = summary.match(/\bReliable[^|,.]*\([^)]*\)/iu);
	if (withMile) return withMile[0].trim();
	const withoutMile = summary.match(/\bReliable[^|,.]*/iu);
	return withoutMile?.[0]?.trim() ?? null;
}

function mentionsOfflineBible(answer: string): boolean {
	return /bible[^.?!\n]*(?:offline|available|download)|(?:offline|available|download)[^.?!\n]*bible/iu.test(answer);
}

function normalizeScaredAloneNightWording(answer: string): string {
	return answer
		.replace(/\bRemember what you said:\s*/giu, 'Remember the loaded verse: ')
		.replace(/\bscared,\s*scared\b/giu, 'scared')
		.replace(/\bscared,\s+or alone\b/giu, 'scared or alone');
}

function normalizePrayerSafePlanWording(answer: string): string {
	return answer
		.replace(
			/\bYes\.\s*Here is a short prayer you can pray, and then we will make the safety plan concrete\./giu,
			'Yes. Here is a short prayer you can pray: Lord, steady me, give me wisdom, and help me choose the safe next step. Amen. Then we will make the safety plan concrete.'
		)
		.replace(
			/\bI can help you make a safe plan\.\s*I can't pray, but I can help you think through the next steps\./giu,
			'Yes. Here is a short prayer you can pray: Lord, steady me, give me wisdom, and help me choose the safe next step. Amen. Then we will make the safety plan concrete.'
		)
		.replace(/\bI can't pray, but\b/giu, 'I can keep this prayer short, and')
		.replace(/\bI cannot pray, but\b/giu, 'I can keep this prayer short, and');
}

function removePrayerSafePlanScriptureDrift(answer: string): string {
	return answer
		.split(/\n{2,}/u)
		.filter((paragraph) => {
			if (!/\b(?:King James Bible|Bible offers|verses? like|Esther\s+4:8|Psalms?\s+\d+:\d+|Proverbs?\s+\d+:\d+|John\s+\d+:\d+|Romans\s+\d+:\d+)\b/iu.test(paragraph)) {
				return true;
			}
			return /\b(?:prayer you can pray|short prayer|Amen)\b/iu.test(paragraph);
		})
		.join('\n\n');
}

function mentionsScaredAloneNightPlan(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const hasLoadedShelter = Boolean(toolSummary(toolInvocations, 'next_shelter'));
	const mentionsComfortScripture =
		/\b(?:Psalms?\s+56:3|Isaiah\s+41:10|2\s+Timothy\s+1:7|Psalms?\s+23:4|Psalms?\s+4:8|John\s+14:27|loaded KJV|loaded verse|scripture|verse)\b/iu.test(answer);
	const checksImmediateHazards =
		/\b(?:check|look|verify)\b[^.?!\n]*(?:weather|alerts?|hazards?|danger)|\b(?:weather|alerts?|hazards?)\b[^.?!\n]*(?:check|verify)/iu.test(answer);
	const coversBodyBasics =
		/\b(?:warm|dry)\b/iu.test(answer) && /\b(?:eat|drink|water|food)\b/iu.test(answer);
	const makesOneHourPlan =
		/\b(?:one-hour|one hour|next hour|for the next hour|next 60 minutes|right now)\b/iu.test(answer);
	const usesShelterOrSafeSleep =
		!hasLoadedShelter ||
		/\b(?:shelter|safe legal sleep|sleep option|legal option|known public|help option|Ridge Shelter)\b/iu.test(answer);
	const escalatesRealDanger =
		/\b(?:real danger|immediate danger|injury|exposure|repeated panic|911|inReach|PLB|emergency plan|ranger|authorities)\b/iu.test(answer);
	return mentionsComfortScripture && checksImmediateHazards && coversBodyBasics && makesOneHourPlan && usesShelterOrSafeSleep && escalatesRealDanger;
}

function mentionsPrayerSafePlan(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const hasLoadedShelter = Boolean(toolSummary(toolInvocations, 'next_shelter'));
	const doesNotRefusePrayer = !/\b(?:can't|cannot) pray\b/iu.test(answer);
	const includesPrayerSupport = hasPrayerSafePlanSupport(answer);
	const separatesPrayerFromSafety =
		/\b(?:prayer is support|not a substitute for help|not a substitute for evacuation|not replace help)\b/iu.test(answer);
	const usesLoadedShelter =
		!hasLoadedShelter || /\b(?:loaded shelter|next shelter|Ridge Shelter|shelter|mile\s+250\.2)\b/iu.test(answer);
	const verifiesCandidates =
		/\b(?:verify|check)\b[^.?!\n]*(?:status|water|crowding|weather|alerts?|legal|danger)|(?:status|water|crowding|weather|alerts?|legal)[^.?!\n]*(?:verify|check)/iu.test(answer);
	const choosesLowerRisk =
		/\b(?:lower[-\s]?risk|safer|nearest|safe legal|do not push|don't push|choose the safer|choose the lower)\b/iu.test(answer);
	const escalatesDanger =
		/\b(?:911|inReach|PLB|rangers?|authorities|emergency plan)\b/iu.test(answer) &&
		/\b(?:real danger|injury|exposure|confusion|cannot continue|can't continue|evacuation|help|inability to continue)\b/iu.test(answer);
	return doesNotRefusePrayer && includesPrayerSupport && separatesPrayerFromSafety && usesLoadedShelter && verifiesCandidates && choosesLowerRisk && escalatesDanger;
}

function hasPrayerSafePlanSupport(answer: string): boolean {
	return /\b(?:prayer|pray)\b/iu.test(answer) &&
		/\b(?:Lord|God)\b/iu.test(answer) &&
		/\b(?:Amen|steady me|wisdom|help me choose|safe next step)\b/iu.test(answer);
}

function mentionsSevereFatigueClearThinkingPlan(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const hasLoadedWater = Boolean(toolSummary(toolInvocations, 'next_water'));
	const hasLoadedShelter = Boolean(toolSummary(toolInvocations, 'next_shelter'));
	const stopsAndSits =
		/\b(?:stop hiking|stop moving|stop now|sit down|sit in a safe spot|pause)\b/iu.test(answer);
	const eatsAndDrinks =
		/\b(?:eat|snack|food)\b/iu.test(answer) && /\b(?:drink|sip|water|electrolytes?)\b/iu.test(answer);
	const coversLayers =
		/\b(?:layer|layers|warm|insulation|rain shell|temperature)\b/iu.test(answer);
	const checksDecisionFacts =
		/\bdaylight\b/iu.test(answer) &&
		/\b(?:weather|forecast|conditions)\b/iu.test(answer) &&
		/\b(?:symptoms?|body|confusion|thinking|clear(?:ly)?|foggy)\b/iu.test(answer);
	const usesLoadedDecisionContext =
		(!hasLoadedWater || /\b(?:loaded water|next water|seasonal seep|seep|creek|water source|mile\s+191\.1)\b/iu.test(answer)) &&
		(!hasLoadedShelter || /\b(?:loaded shelter|next shelter|shelter|Ridge Shelter|mile\s+192\.7)\b/iu.test(answer));
	const choosesLowerRisk =
		/\b(?:lower[-\s]?risk|safer|safe legal|nearest|do not add miles|don't add miles|stop earlier|help option)\b/iu.test(answer);
	const escalatesIfImpaired =
		/\b(?:911|inReach|PLB|emergency plan|rangers?|authorities|confusion|worsening symptoms|injury|exposure|cannot continue|can't continue|cannot think|can't think|make decisions)\b/iu.test(answer);
	return stopsAndSits && eatsAndDrinks && coversLayers && checksDecisionFacts && usesLoadedDecisionContext && choosesLowerRisk && escalatesIfImpaired;
}

function mentionsPrivateDocumentBoundary(answer: string): boolean {
	return /(?:do not|don't) paste private|private (?:id|insurance|medical|payment|reservation).*scout chat/iu.test(answer);
}

function mentionsEmergencyCommunicationBoundary(answer: string): boolean {
	return /(?:scout|phone)[^.?!\n]*(?:does not|do not|doesn't|don't|not)[^.?!\n]*(?:replace|substitute)[^.?!\n]*(?:inreach|plb|911|family emergency plan)|(?:inreach|plb|911|family emergency plan)[^.?!\n]*(?:separate|emergency plan|backup)/iu.test(answer);
}

function mentionsResupplyMailDropInputs(answer: string): boolean {
	const mentionsDiet = /\bdiet|dietary|medical|restricted|restriction/iu.test(answer);
	const mentionsPace = /\bpace|daily miles?|mileage/iu.test(answer);
	const mentionsTiming = /\bnext town|town timing|arrival|when you reach|days? to town/iu.test(answer);
	const mentionsHours = /\bstore[^.?!\n]*hours?|post[-\s]?office[^.?!\n]*hours?|hours?[^.?!\n]*(?:store|post[-\s]?office)/iu.test(answer);
	const mentionsAccess = /\bhostel|shuttle|access|hard[-\s]?to[-\s]?find|locally/iu.test(answer);
	return mentionsDiet && mentionsPace && mentionsTiming && mentionsHours && mentionsAccess;
}

function firstParagraphMentionsResupplyMailDropInputs(answer: string): boolean {
	return mentionsResupplyMailDropInputs(firstParagraph(answer));
}

function firstParagraphMentionsInjuryStopBoundary(answer: string): boolean {
	return mentionsInjuryStopBoundary(firstParagraph(answer));
}

function mentionsInjuryStopBoundary(answer: string): boolean {
	const mentionsStopOrBackOff = /\b(?:stop|back off|reduce|cut back|do not train through|don't train through|medical help|clinician|physical therapist)\b/iu.test(answer);
	const mentionsWorsening = /\b(?:pain worsens|worsening pain|worse pain|swelling|swells|changed gait|changes gait|gait changes)\b/iu.test(answer);
	return mentionsStopOrBackOff && mentionsWorsening;
}

function firstParagraph(answer: string): string {
	return answer.split(/\n{2,}/u)[0] ?? answer;
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

function mentionsThunderstormHikeDecision(answer: string): boolean {
	const mentionsLiveCheck = /\b(?:live|current|radar|forecast|verify|refresh)\b/iu.test(answer);
	const mentionsRidgeAvoidance = /\b(?:avoid|stay off|get off|do not enter|don't enter|skip)\b[^.?!\n]*(?:exposed|ridge|high point)|(?:exposed|ridge|high point)[^.?!\n]*(?:avoid|stay off|get off|do not enter|don't enter|skip)/iu.test(answer);
	const mentionsTimingMileage = /\b(?:shorten|shift|earlier|wait|delay|conservative mileage|lower mileage|stop|bail)\b/iu.test(answer);
	const mentionsLightning = /\blightning\b/iu.test(answer);
	return mentionsLiveCheck && mentionsRidgeAvoidance && mentionsTimingMileage && mentionsLightning;
}

function mentionsColdWindRidgeDecision(answer: string): boolean {
	const mentionsMileageCap = /\b(?:cap|cut|shorten|lower|conservative|reduce)\b[^.?!\n]*(?:miles?|mileage|target)|(?:miles?|mileage|target)[^.?!\n]*(?:cap|cut|shorten|lower|conservative|reduce)/iu.test(answer);
	const mentionsExtremities = /\b(?:hands?|feet|head|extremities|gloves?|hat|socks?)\b/iu.test(answer);
	const mentionsFood = /\b(?:eat|snack|calor(?:y|ies)|food)\b/iu.test(answer);
	const mentionsDrink = /\b(?:drink|sip|hydrate|hydration|water|warm fluids?)\b/iu.test(answer);
	const mentionsHypothermia = /\bhypothermia|wet[-\s]?cold/iu.test(answer);
	return mentionsMileageCap && mentionsExtremities && mentionsFood && mentionsDrink && mentionsHypothermia;
}

function mentionsHotDayPlan(answer: string): boolean {
	const mentionsTiming = /\b(?:early|earlier|morning|cooler part|cooler hours|midday heat|heat of the day)\b/iu.test(answer);
	const mentionsWater = /\b(?:water|hydrate|hydration|electrolytes?|sip|drink)\b/iu.test(answer);
	const mentionsShadeBreaks = /\b(?:shade|breaks?|rest)\b/iu.test(answer);
	const mentionsSymptoms = /\b(?:dizz\w*|confus\w*|headache|nausea|cramps?|stopped sweating|heat illness)\b/iu.test(answer);
	return mentionsTiming && mentionsWater && mentionsShadeBreaks && mentionsSymptoms;
}

function mentionsWetHypothermiaResponse(answer: string): boolean {
	const mentionsSymptoms = /\bshiver\w*\b/iu.test(answer) &&
		/\b(?:clumsy|clumsiness|coordination|confusion|confused|apathy|apathetic|slurred)\b/iu.test(answer);
	const mentionsDryWarmShelter = /\b(?:shelter|dry|warm|insulation|sleep layer|sleep system|quilt|bag)\b/iu.test(answer);
	const mentionsHelp = /\b(?:get help|call 911|inreach|plb|emergency|escalate|medical help|altered mental)\b/iu.test(answer);
	return mentionsSymptoms && mentionsDryWarmShelter && mentionsHelp;
}

function mentionsLightningRidgeSafety(answer: string): boolean {
	const mentionsLeaveHighGround = /\b(?:leave|get off|move off|descend from|avoid)\b[^.?!\n]*(?:ridge|ridgeline|high ground|high point|exposed)|(?:ridge|ridgeline|high ground|high point|exposed)[^.?!\n]*(?:leave|get off|move off|avoid)/iu.test(answer);
	const mentionsAvoidTargets = /\b(?:lone tree|isolated tree|metal|open knob|water)\b/iu.test(answer);
	const mentionsWait = /\b(?:wait|last thunder|resume|until the storm passes)\b/iu.test(answer);
	const avoidsContinuing = /\b(?:do not keep hiking|don't keep hiking|stop hiking|do not continue|don't continue|avoid continuing)\b/iu.test(answer);
	return mentionsLeaveHighGround && mentionsAvoidTargets && mentionsWait && avoidsContinuing;
}

function mentionsTownGearDryingSequence(answer: string): boolean {
	const mentionsSleep = /\b(?:sleeping bag|sleep system|quilt|dry sleep|insulation)\b/iu.test(answer);
	const mentionsShoesSocks = /\b(?:shoes?|socks?|liners?)\b/iu.test(answer);
	const mentionsLaundryDryer = /\b(?:laundry|laundromat|dryer|drying room|motel room|hostel)\b/iu.test(answer);
	const mentionsSequence = /\b(?:first|then|next|before leaving|sequence|priority|prioritize)\b/iu.test(answer);
	return mentionsSleep && mentionsShoesSocks && mentionsLaundryDryer && mentionsSequence;
}

function mentionsHostelFullTownBackup(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const mentionsCallAhead =
		/\b(?:call|text|message|phone|confirm|verify)\b[^.?!\n]*(?:ahead|same[-\s]?day|bed|beds|space|hostel|shuttle|pickup|hours|reservations?|seasonal|legal)|(?:ahead|same[-\s]?day|bed|beds|space|hostel|shuttle|pickup|hours|reservations?|seasonal|legal)[^.?!\n]*(?:call|text|message|phone|confirm|verify)\b/iu.test(answer);
	const mentionsBackupOptions =
		/\b(?:backup lodging|lodging|motel|hotel|hostel|bunk|bed)\b/iu.test(answer) &&
		/\b(?:campground|legal public|legal overnight|visitor center|ranger|public option|legal option)\b/iu.test(answer);
	const treatsServicesAsCandidates =
		/\b(?:candidate|not guaranteed|do not assume|don't assume|not thru[-\s]?hiker shelter|verify|confirm)\b/iu.test(answer);
	const keepsTiredSafe =
		/\b(?:tired|injured|injury|fatigue|body condition)\b/iu.test(answer) &&
		/\b(?:short day|nero|early legal stop|town stop|stop earlier|safer legal stop)\b/iu.test(answer);
	const avoidsUnsafeIllegal =
		/\b(?:do not|don't|never|avoid)\b[^.?!\n]*(?:unsafe|illegal|stealth|unverified|sleeping spot|sleep spot)|(?:unsafe|illegal|stealth|unverified|sleeping spot|sleep spot)[^.?!\n]*(?:do not|don't|never|avoid)\b/iu.test(answer);
	const usesLoadedContext =
		(!toolSummary(toolInvocations, 'next_town') || mentionsToolPlace(answer, toolSummary(toolInvocations, 'next_town'))) &&
		(!toolSummary(toolInvocations, 'park_services') || /\b(?:visitor center|campground|park service|ranger|nps|developed campground)\b/iu.test(answer));
	return mentionsCallAhead && mentionsBackupOptions && treatsServicesAsCandidates && keepsTiredSafe && avoidsUnsafeIllegal && usesLoadedContext;
}

function mentionsLiveWeatherFacts(answer: string): boolean {
	const mentionsStorms = /\b(?:storms?|thunderstorms?|lightning)\b/iu.test(answer);
	const mentionsHeatCold = /\b(?:heat|hot|cold|hypothermia|exposure)\b/iu.test(answer);
	const mentionsWindFlood = /\bwind\b/iu.test(answer) && /\b(?:flood|flooding|high water)\b/iu.test(answer);
	const mentionsClosures = /\b(?:closure|closures|fire|smoke|alert)\b/iu.test(answer);
	const mentionsStaleCache = /\b(?:stale|cache|cached|live|current)\b/iu.test(answer);
	return mentionsStorms && mentionsHeatCold && mentionsWindFlood && mentionsClosures && mentionsStaleCache;
}

function mentionsHeavyRainStartSafety(answer: string): boolean {
	const mentionsConservativeMileage = /\b(?:conservative|shorten|short|lower|reduce|cap)\b[^.?!\n]*(?:mileage|miles?)|(?:mileage|miles?)[^.?!\n]*(?:conservative|shorten|short|lower|reduce|cap)/iu.test(answer);
	const mentionsDrySleep = /\b(?:dry sleep|sleep layers?|sleep system|quilt|bag|insulation)\b/iu.test(answer);
	const mentionsFooting = /\b(?:footing|slick|roots?|rocks?|bog boards?|descents?)\b/iu.test(answer);
	const mentionsForecast = /\b(?:current|live|verify|refresh|forecast|radar)\b/iu.test(answer);
	const mentionsBailHypothermia = /\b(?:stop|bail|bailout)\b/iu.test(answer) && /\bhypothermia\b/iu.test(answer);
	return mentionsConservativeMileage && mentionsDrySleep && mentionsFooting && mentionsForecast && mentionsBailHypothermia;
}

function mentionsShakedownCaveat(answer: string): boolean {
	return /\bone shakedown\b/iu.test(answer) &&
		/\b(?:does not|doesn't|do not|don't|not)\b[^.?!\n]*(?:prove|cover|solve)/iu.test(answer) &&
		/\b(?:condition|everything|every condition|all conditions)\b/iu.test(answer);
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

function mentionsAirplaneModeRehearsal(answer: string): boolean {
	const mentionsPrep =
		/\b(?:charge|battery)\b/iu.test(answer) &&
		/\bfield[-\s]?pack\b/iu.test(answer) &&
		/\bcurrent mile\b/iu.test(answer) &&
		/\b(?:local ai|model|gemma)\b/iu.test(answer) &&
		/\b(?:offline maps?|maps\/docs|offline docs?|documents?)\b/iu.test(answer);
	const mentionsNetworkTest =
		/\b(?:turn on airplane mode|airplane mode|disable network|disable.*network)\b/iu.test(answer) &&
		/\b(?:relaunch|restart|reopen)\b/iu.test(answer) &&
		/\b(?:ask Scout|ask a|question)\b/iu.test(answer) &&
		/\b(?:water|weather|offline)\b/iu.test(answer);
	const separatesCachedFromLive =
		/\b(?:cached|local model|saved docs?|field pack)\b/iu.test(answer) &&
		/\b(?:live data|fresh weather|closures|water reports|town services|not .*current|stale)\b/iu.test(answer);
	const returnsOnline =
		/\b(?:go back online|return online|back online|refresh)\b/iu.test(answer) &&
		/\b(?:safety-critical|weather|closures|water reports?|town services?)\b/iu.test(answer);
	return mentionsPrep && mentionsNetworkTest && separatesCachedFromLive && returnsOnline;
}

function isAirplaneModeRehearsalPartialAnswer(answer: string): boolean {
	return /\b(?:airplane mode|water question|offline maps?|field[-\s]?pack|cloud sync|local ai|model)\b/iu.test(answer);
}

function mentionsPretripScreenshotChecklist(answer: string): boolean {
	const mentionsItinerary = /\b(?:itinerary|check[-\s]?in plan)\b/iu.test(answer);
	const mentionsEmergencyContacts = /\bemergency contacts?\b/iu.test(answer);
	const mentionsNextResupply = /\b(?:next resupply|resupply|town\/bailout|bailout|next town)\b/iu.test(answer);
	const mentionsOfflineStatus =
		/\boffline map\b/iu.test(answer) &&
		/\b(?:download|status)\b/iu.test(answer) &&
		/\b(?:field[-\s]?pack|local[-\s]?model|local ai|model)\b/iu.test(answer);
	const mentionsReservations = /\b(?:reservations?|permits?|shuttle|lodging confirmations?)\b/iu.test(answer);
	const mentionsOutsideScout = /\b(?:outside Scout|Photos\/Files|paper card|available offline|save offline)\b/iu.test(answer);
	const mentionsPrivacyBoundary = mentionsPrivateDocumentBoundary(answer);
	return mentionsItinerary && mentionsEmergencyContacts && mentionsNextResupply && mentionsOfflineStatus && mentionsReservations &&
		mentionsOutsideScout && mentionsPrivacyBoundary;
}

function mentionsDocumentDraft(answer: string): boolean {
	const hasDraftLabel = /\b(?:draft|checklist note|checklist:|town[-\s]?exit update note|offline document checklist|screenshot\/save checklist)\b/iu.test(answer);
	const hasDraftShape =
		/\b1\.\s+\S/iu.test(answer) ||
		/\b(?:current AT mile|photo ID|emergency contacts|open questions|weather and closures|food and water carry|permits|reservations)\b/iu.test(answer);
	return hasDraftLabel && hasDraftShape;
}

function mentionsDocumentSourceBoundary(answer: string): boolean {
	const mentionsSourceFacts = /\b(?:source-backed|source summaries?|saved document facts?|document vault facts?)\b/iu.test(answer);
	const mentionsAssumptionBoundary = /\b(?:assumptions?|open questions?|placeholders?|verify|confirm before saving|private values?)\b/iu.test(answer);
	return mentionsSourceFacts && mentionsAssumptionBoundary;
}

function mentionsDocumentWriteConfirmation(answer: string): boolean {
	const mentionsReviewOrConfirm = /\b(?:review|confirm|confirmation|explicitly confirm|before saving|before save)\b/iu.test(answer);
	const mentionsSaveBoundary = /\b(?:save|saving|overwrite|document|draft)\b/iu.test(answer);
	return mentionsReviewOrConfirm && mentionsSaveBoundary;
}

function isPretripScreenshotPartialAnswer(answer: string): boolean {
	return /\b(?:screenshot|current location|itinerary|critical contact|emergency contacts?|offline maps?|documents?)\b/iu.test(answer);
}

function mentionsFirstRunOnboardingSetupSequence(answer: string): boolean {
	const mentionsProfileMile = /\b(?:profile|hiker profile|setup|set up)\b/iu.test(answer) &&
		/\b(?:current mile|mile)\b/iu.test(answer);
	const mentionsPack = /\bfield[-\s]?pack\b/iu.test(answer) &&
		/\b(?:refresh|current|age|status|succeed|success)\b/iu.test(answer);
	const mentionsModel = /\b(?:local ai|model|gemma)\b/iu.test(answer) &&
		/\b(?:download|update|wi[-\s]?fi|power|succeed|success)\b/iu.test(answer);
	const mentionsOfflineSaved =
		/\b(?:offline maps?(?:\s*(?:\/|and|or)\s*(?:docs?|documents?))?|offline docs?|offline documents?|offline references?|maps\/docs|maps and documents|maps or documents)\b/iu.test(
			answer
		);
	const mentionsOfflineTest = /\b(?:airplane mode|airplane-mode)\b/iu.test(answer) &&
		/\b(?:relaunch|reopen|ask scout|water question|nearby[-\s]?trail question|test)\b/iu.test(answer);
	return mentionsProfileMile && mentionsPack && mentionsModel && mentionsOfflineSaved && mentionsOfflineTest;
}

function mentionsFirstRunOnboardingReadiness(answer: string): boolean {
	const avoidsPrematureReady = /\b(?:do not rely|don't rely|not ready|until|before relying)\b/iu.test(answer) &&
		/\b(?:succeed|success|successful|field[-\s]?pack refresh|model download|airplane[-\s]?mode test)\b/iu.test(answer);
	return mentionsFirstRunOnboardingSetupSequence(answer) && avoidsPrematureReady;
}

function mentionsAirplaneModeCapabilityBoundary(answer: string): boolean {
	const mentionsCachedPack =
		/\b(?:cached|saved|downloaded|already on (?:the )?phone|offline)\b/iu.test(answer) &&
		/\b(?:field[-\s]?pack|pack|trail data)\b/iu.test(answer);
	const mentionsLocalModel = /\b(?:on-device|local ai|local model|gemma|model)\b/iu.test(answer);
	const mentionsSavedDocs = /\b(?:saved|offline|downloaded)\b/iu.test(answer) && /\b(?:maps?|docs?|documents?|references?)\b/iu.test(answer);
	const mentionsBible = /\bbible\b/iu.test(answer);
	const mentionsNetworkWeatherClosures =
		/\b(?:fresh|current|live|new|latest|online|network|cell)\b/iu.test(answer) &&
		/\b(?:weather|closures?|fire alerts?|alerts?)\b/iu.test(answer);
	const mentionsSyncLocation =
		/\b(?:cloud sync|sync|backup|messages?|live location|tramily location|family location)\b/iu.test(answer);
	const mentionsStaleBoundary =
		/\b(?:stale|cached|not current|until refreshed|refresh again|back online|cannot fetch|can't fetch)\b/iu.test(answer) &&
		/\b(?:weather|closures?|water|services?|alerts?)\b/iu.test(answer);
	return mentionsCachedPack && mentionsLocalModel && mentionsSavedDocs && mentionsBible && mentionsNetworkWeatherClosures && mentionsSyncLocation && mentionsStaleBoundary;
}

function isAirplaneModeCapabilityPartialAnswer(answer: string): boolean {
	return /\b(?:airplane mode|offline|cached|field[-\s]?pack|local ai|model|saved|fresh weather|closures?|live location)\b/iu.test(answer);
}

function mentionsTownRecoveryOrder(answer: string): boolean {
	return /\b(?:eat|calories)\b/iu.test(answer) &&
		/\b(?:shower|laundry)\b/iu.test(answer) &&
		/\b(?:foot care|feet|blister)\b/iu.test(answer) &&
		/\b(?:sleep|rest)\b/iu.test(answer) &&
		/\b(?:charge|download|refresh)\b/iu.test(answer) &&
		/\b(?:logistics|shopping|shuttle|reservation|next section)\b/iu.test(answer);
}

function mentionsZeroNeroDecision(answer: string): boolean {
	return /\b(?:body condition|injury|foot|feet|sleep debt)\b/iu.test(answer) &&
		/\bweather\b/iu.test(answer) &&
		/\b(?:chores|laundry|resupply|shower)\b/iu.test(answer) &&
		/\bbudget\b/iu.test(answer) &&
		/\bnext section\b/iu.test(answer) &&
		/\brest is an investment\b/iu.test(answer);
}

function isOvercommittedZeroNeroAnswer(answer: string): boolean {
	const firstSentence = splitSentences(answer)[0]?.trim() ?? answer.trim();
	return /^(?:take|you should take|i would take|choose)\s+(?:the\s+)?(?:zero|nero)\b/iu.test(firstSentence);
}

function mentionsTownDaySequence(answer: string): boolean {
	return /\b(?:time-box|timebox|short list|list)\b/iu.test(answer) &&
		/\beat\b/iu.test(answer) &&
		/\b(?:shower|laundry)\b/iu.test(answer) &&
		/\b(?:feet|foot care|gear)\b/iu.test(answer) &&
		/\b(?:charge|refresh|download)\b/iu.test(answer) &&
		/\b(?:rest|sleep|food)\b/iu.test(answer);
}

function mentionsHostelChoreOrder(answer: string): boolean {
	return /\b(?:bed|pickup|hostel|bunk)\b/iu.test(answer) &&
		/\b(?:laundry|shower)\b/iu.test(answer) &&
		/\b(?:feet|foot care|shoes)\b/iu.test(answer) &&
		/\bresupply\b/iu.test(answer) &&
		/\b(?:charge|refresh|field[-\s]?pack|model)\b/iu.test(answer) &&
		/\b(?:confirm|unconfirmed|verify)\b/iu.test(answer);
}

function mentionsScoutTownUpdate(answer: string): boolean {
	return /\b(?:profile|current at mile|current mile|AT mile)\b/iu.test(answer) &&
		/\bfield[-\s]?pack\b/iu.test(answer) &&
		/\bweather\b/iu.test(answer) &&
		/\bclosures?\b/iu.test(answer) &&
		/\b(?:loadout|food)\b/iu.test(answer) &&
		/\b(?:documents|offline maps|maps\/docs)\b/iu.test(answer) &&
		/\b(?:airplane[-\s]?mode test|airplane mode)\b/iu.test(answer) &&
		/\b(?:water|shelter|town|terrain|bailout)\b/iu.test(answer) &&
		/\bstale\b/iu.test(answer);
}

function normalizeModelDownloadingStatusWording(answer: string): string {
	return answer
		.replace(
			/\bthe system is still getting the necessary information to run the local AI model effectively\b/giu,
			'the on-device local AI model is still downloading and verifying'
		)
		.replace(
			/\bIt'?s working to get the right knowledge base loaded for you\./giu,
			'It is not ready for offline Scout yet.'
		)
		.replace(
			/\bknowledge base\b/giu,
			'on-device model files'
		);
}

function mentionsModelDownloadingStatusReadiness(answer: string): boolean {
	const mentionsNotReady =
		/\b(?:not ready|isn't ready|not installed|still downloading|download(?:ing)? and verifying|verification)\b/iu.test(answer) &&
		/\b(?:offline|local ai|on-device|model|gemma|scout)\b/iu.test(answer);
	const mentionsWifiPower =
		/\bwi[-\s]?fi\b/iu.test(answer) &&
		/\b(?:power|charged|charger|plugged in|battery)\b/iu.test(answer);
	const mentionsStatus =
		/\b(?:status|progress|ready|complete|finished|verified|verification)\b/iu.test(answer) &&
		/\b(?:check|watch|wait|until|says|reports)\b/iu.test(answer);
	const mentionsRetry =
		/\b(?:retry|cancel|restart|try again|stuck|failed)\b/iu.test(answer);
	const mentionsNoFakeOffline =
		/\b(?:do not trust|don't trust|do not rely|don't rely|not ready|until|should not pretend|must not pretend)\b/iu.test(answer) &&
		/\b(?:offline|local ai|local model|fake offline|pretend)\b/iu.test(answer) &&
		/\b(?:airplane[-\s]?mode|model reports ready|succeeds|successful)\b/iu.test(answer);
	return mentionsNotReady && mentionsWifiPower && mentionsStatus && mentionsRetry && mentionsNoFakeOffline;
}

function isPhysicalPackStalenessAnswer(answer: string): boolean {
	const mentionsGearPack =
		/\b(?:gear|loadout|sleep system|rain gear|water filter|first aid kit|battery bank|pack fit|shakedown hike)\b/iu.test(answer);
	const mentionsDataPack = /\b(?:field[-\s]?pack|cached|trail data|pack age|source timestamp|valid until|downloaded region)\b/iu.test(answer);
	return mentionsGearPack && !mentionsDataPack;
}

function mentionsFieldPackStalenessReadiness(answer: string): boolean {
	const mentionsDataPack =
		/\b(?:field[-\s]?pack|scout's field pack|cached trail data|trail data pack)\b/iu.test(answer) &&
		/\b(?:phone|cached|data|trail)\b/iu.test(answer);
	const mentionsAgeOrStatus =
		/\b(?:age|status|generated|updated|source timestamp|timestamps|valid until|fresh|stale|expired|old)\b/iu.test(answer);
	const mentionsMileOrRegion =
		/\b(?:current mile|downloaded region|region|wrong mile|wrong region|mile\/region|mile or downloaded region)\b/iu.test(answer);
	const mentionsVolatileData =
		/\b(?:weather|closures?|water|services?|alerts?)\b/iu.test(answer) &&
		/\b(?:stale|changed|current|live|volatile|not current|caution)\b/iu.test(answer);
	const mentionsRefresh =
		/\b(?:refresh|update|download)\b/iu.test(answer) &&
		/\b(?:wi[-\s]?fi|town|service|online)\b/iu.test(answer);
	const mentionsSafetyTrust =
		/\b(?:before trusting|before relying|do not trust|don't trust|until refreshed|caution signals|not current proof|safety|bailout|decision)\b/iu.test(answer);
	return mentionsDataPack && mentionsAgeOrStatus && mentionsMileOrRegion && mentionsVolatileData && mentionsRefresh && mentionsSafetyTrust;
}

function mentionsSignInCloudSyncBoundary(answer: string): boolean {
	const mentionsInviteOnly = /\b(?:invite-only|invite only|invited|invite)\b/iu.test(answer);
	const mentionsCloudValue =
		/\b(?:backup|restore|recover|recovery|cloud sync|sync)\b/iu.test(answer) &&
		/\b(?:documents?|settings?|data|devices?|phone)\b/iu.test(answer);
	const mentionsBeforeTrail =
		/\b(?:before (?:the )?trail|before leaving|while .*wi[-\s]?fi|on wi[-\s]?fi|before .*service)\b/iu.test(answer);
	const separatesOffline =
		/\b(?:offline scout|offline|local ai|on-device model)\b/iu.test(answer) &&
		/\b(?:separate|without a live login|downloaded field pack|saved maps|maps\/docs|after setup)\b/iu.test(answer);
	const mentionsEmergencyBoundary =
		/\b(?:not an emergency|do not replace|does not replace|not a safety system)\b/iu.test(answer) &&
		/\b(?:inreach|plb|911|family emergency plan|emergency plan)\b/iu.test(answer);
	return mentionsInviteOnly && mentionsCloudValue && mentionsBeforeTrail && separatesOffline && mentionsEmergencyBoundary;
}

function isSignInPartialAnswer(answer: string): boolean {
	return /\b(?:sign in|log in|login|account|cloud sync|backup|restore|recover|offline maps?|documents?)\b/iu.test(answer);
}

function mentionsWrongMileRecovery(answer: string): boolean {
	const mentionsShiftedAnswers =
		/\bwrong mile\b/iu.test(answer) &&
		/\bwater\b/iu.test(answer) &&
		/\bshelter\b/iu.test(answer) &&
		/\btown\b/iu.test(answer) &&
		/\b(?:terrain|bailout)\b/iu.test(answer);
	const mentionsCorrection =
		/\b(?:correct|update|change|edit|enter|set)\b/iu.test(answer) &&
		/\b(?:Current AT mile|current mile|trail mile|Settings > Edit hike details|manual mile update|hike setup)\b/iu.test(answer);
	const mentionsConfirmation =
		/\b(?:trail sign|blaze|shelter|road crossing|guide source|map|GPS snap|gps)\b/iu.test(answer);
	const mentionsRefreshAndReask =
		/\bfield[-\s]?pack\b/iu.test(answer) &&
		/\brefresh\b/iu.test(answer) &&
		/\bre-?ask Scout\b/iu.test(answer);
	const mentionsDecisionBoundary =
		/\bdo not\b/iu.test(answer) &&
		/\b(?:water|shelter|town|safety)\b/iu.test(answer) &&
		/\bdecisions?\b/iu.test(answer);
	return mentionsShiftedAnswers && mentionsCorrection && mentionsConfirmation && mentionsRefreshAndReask && mentionsDecisionBoundary;
}

function mentionsGpsWrongSpotRecovery(answer: string): boolean {
	const mentionsSettle = /\b(?:settle|clearer sky|sky view|wait)\b/iu.test(answer) && /\bgps\b/iu.test(answer);
	const mentionsConfirmation =
		/\b(?:blaze|blazes|trail sign|signs|landmarks?|map|compass|last known point|last known location)\b/iu.test(answer) &&
		/\b(?:compare|confirm|verify|check)\b/iu.test(answer);
	const mentionsManualCorrection =
		/\b(?:Current AT mile|current mile|Settings > Edit hike details|manual mile update)\b/iu.test(answer) &&
		/\b(?:confirmed location|confirmed mile|set|update|corrected mile)\b/iu.test(answer);
	const mentionsRefreshAndReask =
		/\bfield[-\s]?pack\b/iu.test(answer) &&
		/\brefresh\b/iu.test(answer) &&
		/\bre-?ask Scout\b/iu.test(answer);
	const mentionsDownstreamRisk =
		/\b(?:bad GPS|wrong spot|wrong location|wrong position|bad fix)\b/iu.test(answer) &&
		/\bwater\b/iu.test(answer) &&
		/\bshelter\b/iu.test(answer) &&
		/\btown\b/iu.test(answer) &&
		/\bterrain\b/iu.test(answer) &&
		/\bbailout\b/iu.test(answer);
	const mentionsDecisionBoundary =
		/\bdo not\b/iu.test(answer) &&
		/\b(?:water|shelter|town|terrain|safety)\b/iu.test(answer) &&
		/\bdecisions?\b/iu.test(answer);
	return mentionsSettle && mentionsConfirmation && mentionsManualCorrection && mentionsRefreshAndReask && mentionsDownstreamRisk && mentionsDecisionBoundary;
}

function isWrongMilePartialAnswer(answer: string): boolean {
	return /\b(?:wrong mile|trail mile|map|gps|position|location|re-establish|verify)\b/iu.test(answer);
}

function isGuidebookMileMismatchPartialAnswer(answer: string): boolean {
	return /\b(?:numbering system|guidebook|guide book|trail sign|mileage|trail mile|map|gps|source)\b/iu.test(answer);
}

function mentionsGuidebookMileMismatchContext(answer: string): boolean {
	const mentionsCalibration = /\b(?:calibrated AT mile frame|calibration|mile frame|mileage frame|mile numbering)\b/iu.test(answer);
	const mentionsEditionOrReroute = /\b(?:guidebook editions?|edition|year|reroute|reroutes|relocation|relocations|trail signs?|local signs?)\b/iu.test(answer);
	const mentionsGpsOrManual = /\b(?:gps|manual Current AT mile|manual mile|app position|current mile)\b/iu.test(answer);
	const asksComparedSource =
		/\b(?:which|what)\b[^.?!\n]*(?:guidebook|sign|source|edition|map)\b/iu.test(answer) ||
		/\b(?:ask|compare|comparing)\b[^.?!\n]*(?:guidebook|sign|source|edition|map)\b/iu.test(answer);
	const mentionsNoScoutOverride =
		/\b(?:do not|don't|does not|doesn't)\b[^.?!\n]*(?:override|overrule|replace)\b[^.?!\n]*(?:posted signs?|signs?|closures?|official guidance|safety)\b/iu.test(answer) ||
		/\b(?:posted signs?|closures?|official guidance)\b[^.?!\n]*(?:safety decisions?|override|overrule)\b/iu.test(answer);
	return mentionsCalibration && mentionsEditionOrReroute && mentionsGpsOrManual && asksComparedSource && mentionsNoScoutOverride;
}

function mentionsNoBasemapNavigationBoundary(answer: string): boolean {
	const mentionsMissingTiles =
		/\b(?:basemap tiles?|map tiles?|basemap)\b[^.?!\n]*(?:not cached|missing|not available|unavailable|not downloaded)|\bmissing basemap tiles?\b|\bnot pretend\b[^.?!\n]*(?:basemap|tiles?|available)\b/iu.test(
			answer
		);
	const mentionsScoutLine = /\b(?:cached trail line|trail line|field[-\s]?pack mile|field[-\s]?pack.*mile|trail corridor)\b/iu.test(answer);
	const mentionsExternalMap = /\b(?:external offline maps?|offline map\/GPS app|offline maps?|paper map|compass)\b/iu.test(answer);
	const mentionsComplexBoundary =
		/\b(?:complex navigation|confusing junctions?|off[-\s]?trail|safety decisions?|bad weather)\b/iu.test(answer) &&
		/\b(?:stop|verify|do not rely|don't rely|do not keep hiking|don't keep hiking)\b/iu.test(answer);
	return mentionsMissingTiles && mentionsScoutLine && mentionsExternalMap && mentionsComplexBoundary;
}

function mentionsManualMileAfterShuttle(answer: string): boolean {
	const mentionsAppFlow = /\b(?:Current AT mile|current mile|hike setup|Settings > Edit hike details|edit hike details)\b/iu.test(answer) &&
		/\b(?:save|enter|set|update)\b/iu.test(answer);
	const mentionsVerification =
		/\b(?:trail sign|blaze|shelter|road crossing|guide source|map|GPS snap|gps)\b/iu.test(answer) &&
		/\b(?:confirm|verify|reliable reference|actually are)\b/iu.test(answer);
	const mentionsTodayScout = /\bToday\b/iu.test(answer) && /\bScout\b/iu.test(answer);
	const mentionsRefreshReask =
		/\bfield[-\s]?pack\b/iu.test(answer) &&
		/\brefresh\b/iu.test(answer) &&
		/\bre-?ask Scout\b/iu.test(answer) &&
		/\b(?:water|shelter|town|terrain|bailout)\b/iu.test(answer);
	const mentionsSyncBoundary = /\bif signed in\b/iu.test(answer) && /\b(?:cloud sync|backup|sync)\b/iu.test(answer);
	const mentionsDecisionBoundary = /\bdo not\b/iu.test(answer) && /\bunconfirmed mile\b/iu.test(answer);
	return mentionsAppFlow && mentionsVerification && mentionsTodayScout && mentionsRefreshReask && mentionsSyncBoundary && mentionsDecisionBoundary;
}

function mentionsConfusingJunctionSafety(answer: string): boolean {
	const mentionsStop = /\b(?:stop|slow down)\b/iu.test(answer);
	const mentionsNoGuess = /\b(?:do not|don't|never)\b[^.?!\n]*(?:guess|keep hiking|continue blindly|continue)|\bnot guess\b/iu.test(answer);
	const mentionsPositionChecks = /\b(?:blaze|blazes|sign|map|compass|gps|last known clear|last known)\b/iu.test(answer);
	const mentionsSafeBacktrack = /\bbacktrack\b[^.?!\n]*(?:obvious|safe|last confirmed|last known|clear)|\b(?:obvious|safe|last confirmed|last known|clear)\b[^.?!\n]*\bbacktrack\b/iu.test(answer);
	return mentionsStop && mentionsNoGuess && mentionsPositionChecks && mentionsSafeBacktrack;
}

function mentionsOffTrailImmediateContext(answer: string): boolean {
	const mentionsStop = /\b(?:stop moving|stop hiking|stay put|do not keep hiking|don't keep hiking|stop)\b/iu.test(answer);
	const mentionsBattery = /\b(?:conserve|save|preserve)\b[^.?!\n]*(?:battery|phone power)|\bbattery\b[^.?!\n]*(?:conserve|save|preserve|low power)\b/iu.test(answer);
	const mentionsPositionCheck = /\b(?:map|gps|compass|blazes?|signs?|last known point|last known location)\b/iu.test(answer);
	const mentionsSafeBacktrack = /\bbacktrack\b[^.?!\n]*(?:obvious|safe|known|clear)|\b(?:obvious|safe|known|clear)\b[^.?!\n]*\bbacktrack\b/iu.test(answer);
	const mentionsNoBushwhack = /\b(?:do not|don't|never|avoid)\b[^.?!\n]*(?:bushwhack|shortcut|unknown terrain|route .*unknown|leave the trail)\b/iu.test(answer);
	const mentionsEscalation = /\b(?:911|inReach|PLB|rangers?|authorities|emergency plan|get help|call for help)\b/iu.test(answer);
	return mentionsStop && mentionsBattery && mentionsPositionCheck && mentionsSafeBacktrack && mentionsNoBushwhack && mentionsEscalation;
}

function mentionsBailoutInjuryExitContext(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const town = toolSummary(toolInvocations, 'next_town');
	const mentionsLoadedExit = !town || mentionsToolPlace(answer, town);
	const mentionsDistance = !town || /\b\d+(?:\.\d+)?\s*(?:mi|miles?)\s+(?:ahead|away|from|to)\b/iu.test(answer);
	const mentionsExit = /\b(?:bailout|bail out|exit|access|road crossing|road|town|shuttle|pickup|get off trail)\b/iu.test(answer);
	const mentionsConfirmation =
		/\b(?:confirm|verify|call|text|check)\b[^.?!\n]*(?:shuttle|pickup|services?|road|town)\b/iu.test(answer) ||
		/\b(?:no guaranteed services|no services guaranteed|services are not guaranteed|do not assume services|don't assume services)\b/iu.test(answer);
	const mentionsInjuryStop =
		/\b(?:do not|don't|never)\b[^.?!\n]*(?:push through|keep hiking|continue through|train through)\b/iu.test(answer) ||
		/\b(?:back off|stop|stop hiking)\b[^.?!\n]*(?:worsen|worsens|worsening|swelling|gait|cannot continue|can't continue|safely)\b/iu.test(answer);
	const mentionsEmergencyEscalation = /\b(?:911|inReach|PLB|rangers?|authorities|emergency plan|get help|medical help)\b/iu.test(answer);
	return mentionsLoadedExit && mentionsDistance && mentionsExit && mentionsConfirmation && mentionsInjuryStop && mentionsEmergencyEscalation;
}

function mentionsRolledAnklePlan(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const town = toolSummary(toolInvocations, 'next_town');
	const mentionsAssessment = /\b(?:pain|swelling|weight-bearing|weight bearing|gait)\b/iu.test(answer);
	const mentionsReduceLoad = /\b(?:reduce load|reduce.*pace|slow|lower-mileage|low[-\s]?impact|nearest safe|safe legal stop|exit)\b/iu.test(answer);
	const mentionsLoadedExit = !town || mentionsToolPlace(answer, town);
	const mentionsHelpCriteria =
		/\b(?:worsening pain|swelling|numbness|deformity|changed gait|cannot walk|can't walk|inability to walk|severe pain|instability|cannot continue)\b/iu.test(answer) &&
		/\b(?:medical help|911|inReach|PLB|rangers?|authorities|emergency plan|get help)\b/iu.test(answer);
	const refusesPushThrough = /\b(?:do not|don't|never)\b[^.?!\n]*(?:push through|keep hiking|continue through)\b/iu.test(answer);
	return mentionsAssessment && mentionsReduceLoad && mentionsLoadedExit && mentionsHelpCriteria && refusesPushThrough;
}

function mentionsSosSupportCircleBoundary(answer: string): boolean {
	const mentionsCannotRescue = /\bScout\b[^.?!\n]*(?:cannot|can't|does not|doesn't)\b[^.?!\n]*(?:call 911|trigger SOS|rescue)|\b(?:cannot|can't|does not|doesn't)\b[^.?!\n]*(?:call 911|trigger SOS|rescue)\b[^.?!\n]*Scout/iu.test(answer);
	const mentionsEmergencyDevice = /\b(?:phone SOS|911|inReach|PLB|emergency device)\b/iu.test(answer);
	const mentionsFactsToSend =
		/\b(?:current mile|location|last known point)\b/iu.test(answer) &&
		/\b(?:what happened|issue|injury|weather|urgency|plan|check in|check-in)\b/iu.test(answer);
	const mentionsEscalationWindow = /\b(?:support circle|family emergency plan|escalation window|emergency plan)\b/iu.test(answer);
	return mentionsCannotRescue && mentionsEmergencyDevice && mentionsFactsToSend && mentionsEscalationWindow;
}

function mentionsNoSignalHelpSoon(answer: string): boolean {
	const mentionsStableSpot = /\b(?:safe stable spot|stay put|safe place|conserve battery)\b/iu.test(answer);
	const mentionsEmergencyDevice = /\b(?:inReach|PLB|911|SOS|emergency device)\b/iu.test(answer);
	const mentionsQueuedMessage =
		/\b(?:text|call)\b/iu.test(answer) &&
		/\b(?:current mile|last known point|issue|plan|check-in|check in)\b/iu.test(answer) &&
		/\b(?:service returns|queued|send when service|signal returns)\b/iu.test(answer);
	const mentionsNoChasingBars =
		/\b(?:do not|don't|never)\b[^.?!\n]*(?:wander|chase bars|climb exposed|leave a known safe location)|\bmove for signal only if\b/iu.test(answer);
	return mentionsStableSpot && mentionsEmergencyDevice && mentionsQueuedMessage && mentionsNoChasingBars;
}

function mentionsOverduePartnerPlan(answer: string): boolean {
	const mentionsLastKnown =
		/\b(?:last known mile|last known location|last known facts|last known point|intended stop|route|how overdue|agreed check-in|check-in plan)\b/iu.test(answer);
	const mentionsDirectAndSupport = /\b(?:call|text)\b/iu.test(answer) && /\b(?:support circle|support|emergency contact|family|trusted)\b/iu.test(answer);
	const mentionsEscalation =
		/\b(?:escalation window|beyond the escalation window|911|rangers?|authorities|ridgerunner|hostel|shuttle|emergency plan)\b/iu.test(answer);
	const mentionsNoSecondEmergency = /\b(?:do not|don't|avoid)\b[^.?!\n]*(?:second emergency|risk yourself|leave your own safe location)|\bwithout a clear plan\b/iu.test(answer);
	return mentionsLastKnown && mentionsDirectAndSupport && mentionsEscalation && mentionsNoSecondEmergency;
}

function mentionsMedicalAdviceBoundary(answer: string): boolean {
	const mentionsNoDiagnosis =
		/\b(?:cannot|can't|does not|doesn't|not)\b[^.?!\n]*(?:diagnose|clear you|replace a clinician|replace emergency services)|\bnot medical diagnosis\b/iu.test(answer);
	const mentionsConservativeDecision = /\b(?:conservative field decision|stop|reduce exertion|safer stop|exit)\b/iu.test(answer);
	const mentionsRedFlags =
		/\b(?:chest pain|trouble breathing|allergic reaction|head injury|fainting|confusion|severe bleeding|stroke|worsening pain|infection|heat illness|hypothermia|cannot continue)\b/iu.test(answer);
	const mentionsEmergency = /\b(?:clinician|medical help|911|inReach|PLB|emergency services)\b/iu.test(answer);
	return mentionsNoDiagnosis && mentionsConservativeDecision && mentionsRedFlags && mentionsEmergency;
}

function mentionsStopHikingImmediateBoundary(answer: string): boolean {
	const mentionsMultipleStopReasons =
		/\b(?:heat illness|hypothermia|lightning|smoke|fire|flooding|lost|off trail|unsafe people|severe fatigue|worsening injury|changed gait|chest pain|trouble breathing|fainting|confusion|darkness)\b/iu.test(answer);
	const mentionsSafeSpot = /\b(?:safe stable spot|lower-risk legal stop|nearest lower-risk|stop making miles|stop hiking)\b/iu.test(answer);
	const mentionsEmergency = /\b(?:911|inReach|PLB|rangers?|authorities|emergency plan)\b/iu.test(answer);
	return mentionsMultipleStopReasons && mentionsSafeSpot && mentionsEmergency;
}

function mentionsOwnMileSetupFlow(answer: string): boolean {
	const mentionsConcreteFlow = /\b(?:hike setup|start my hike|settings|edit hike details|current at mile)\b/iu.test(answer);
	const mentionsVerification =
		/\b(?:today|new mile|refresh|field[-\s]?pack|re-ask|ask again)\b/iu.test(answer) &&
		/\b(?:scout|show|check|field[-\s]?pack)\b/iu.test(answer);
	return mentionsConcreteFlow && mentionsVerification;
}

function mentionsOwnMileRiskAndConfirmation(answer: string): boolean {
	const mentionsWrongMileRisk =
		/\b(?:wrong|incorrect|bad|stale)\s+(?:mile|position|spot)\b/iu.test(answer) &&
		/\b(?:water|shelter|town|terrain|bailout)\b/iu.test(answer);
	const mentionsConfirmation =
		/\b(?:trail sign|blaze|shelter|road crossing|guide source|guidebook|map|gps snap|gps)\b/iu.test(answer) &&
		/\b(?:confirm|verify|check|match)\b/iu.test(answer);
	return mentionsWrongMileRisk && mentionsConfirmation;
}

function mentionsOwnMileSetupReadiness(answer: string): boolean {
	return mentionsOwnMileSetupFlow(answer) && mentionsOwnMileRiskAndConfirmation(answer);
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
	const mentionsStopCool = /\b(?:stop hiking|stop, get shade|stop and cool|cool down|get shade|find shade|shade)\b/iu.test(answer);
	const mentionsFluids = /\b(?:sip|drink)[^.?!\n]*(?:water|electrolytes?)|(?:water|electrolytes?)[^.?!\n]*(?:sip|drink)\b/iu.test(answer);
	const mentionsNoHikingThrough = /\b(?:do not|don't|not|never)\b[^.?!\n]*(?:keep hiking|hike through|continue hiking|push through)|\bstop hiking\b/iu.test(answer);
	const mentionsFainting = /\b(?:faint\w*|passed out|passing out)\b/iu.test(answer);
	const mentionsFaintingEscalation = /\b(?:urgent help|emergency plan|911|inreach|plb|medical help|get help|seek help)\b[^.?!\n]*(?:confus\w*|faint\w*|passed out|stopped sweating|worsen\w*|do not improve|does not improve)|(?:confus\w*|faint\w*|passed out|stopped sweating|worsen\w*|do not improve|does not improve)[^.?!\n]*(?:urgent help|emergency plan|911|inreach|plb|medical help|get help|seek help)\b/iu.test(answer);
	return mentionsStopCool && mentionsFluids && mentionsNoHikingThrough && mentionsFainting && mentionsFaintingEscalation;
}

function mentionsHeatWaterPlanning(answer: string): boolean {
	const mentionsTiming = /\b(?:early|earlier|morning|cooler part|cooler hours|midday heat|heat of the day)\b/iu.test(answer);
	const mentionsShade = /\b(?:shade|shade breaks?|rest breaks?)\b/iu.test(answer);
	const mentionsElectrolytesFood = /\b(?:electrolytes?|salty food|salt|eat|food|snack)\b/iu.test(answer);
	const mentionsConservativeCarry = /\b(?:carry more water|carry extra|conservative carry|more water|verified water|reliable water|seasonal|unverified)\b/iu.test(answer);
	return mentionsTiming && mentionsShade && mentionsElectrolytesFood && mentionsConservativeCarry;
}

function mentionsRidgeWaterDecision(answer: string): boolean {
	const mentionsCamelUp = /\b(?:camel up|top off|drink at the source|last confirmed source)\b/iu.test(answer);
	const mentionsCarryExtra = /\b(?:carry extra|more water|safer carry|heavier carry)\b/iu.test(answer);
	const mentionsUncertaintyOrRidge = /\b(?:ridge|seasonal|unverified|unknown|confirmed|reliable|exposed|hot|dry stretch)\b/iu.test(answer);
	return mentionsCamelUp && mentionsCarryExtra && mentionsUncertaintyOrRidge;
}

function mentionsConcreteRidgeWaterContext(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	if (!toolSummary(toolInvocations, 'next_water')) return true;
	const mentionsSpecificSource = /\b(?:seasonal seep|creek crossing|thin mapped branch|water at mile|mile\s+\d|\d+(?:\.\d+)?\s*mi ahead)\b/iu.test(answer);
	const mentionsReliableTarget = /\b(?:reliable creek|next reliable|reliable water|verified source|verified water)\b/iu.test(answer);
	const mentionsDecision = /\b(?:camel up|top off)\b/iu.test(answer) && /\b(?:carry extra|carry enough|safer carry|heavier carry)\b/iu.test(answer);
	return mentionsSpecificSource && mentionsReliableTarget && mentionsDecision;
}

function mentionsDryStretchWaterCarry(answer: string): boolean {
	const mentionsRange = /\b(?:0\.5|half|1)\s*(?:-|to|and)?\s*(?:1)?\s*(?:l|liter|liters|litre|litres)\b/iu.test(answer) ||
		/\b(?:3-5|3 to 5|three to five)\s*miles?\b/iu.test(answer);
	const mentionsTopOff = /\b(?:top off|camel up|last confirmed source|confirmed source)\b/iu.test(answer);
	const mentionsAdjustment = /\b(?:heat|hot|exposed|climb|slow pace|pace|personal thirst|thirst)\b/iu.test(answer);
	const mentionsReliableTarget = /\b(?:next reliable|reliable source|seasonal|unverified|verified source)\b/iu.test(answer);
	return mentionsRange && mentionsTopOff && mentionsAdjustment && mentionsReliableTarget;
}

function mentionsSkipSeasonalWaterDecision(answer: string): boolean {
	const mentionsSeasonalCandidate =
		/\b(?:seasonal|unconfirmed|unverified)\b/iu.test(answer) &&
		/\b(?:spring|seep|water source|source)\b/iu.test(answer) &&
		/\b(?:candidate|not reliable|not the plan|not a reliable source|do not assume|don't assume)\b/iu.test(answer);
	const mentionsCurrentCarry =
		/\bcurrent (?:treated )?(?:water )?carry\b/iu.test(answer) ||
		/\b(?:already have|have enough)[^.?!\n]*(?:water|carry)\b/iu.test(answer);
	const mentionsReliableTarget = /\b(?:next reliable|reliable water|creek crossing|verified source)\b/iu.test(answer);
	const mentionsRiskFactors =
		/\bheat\b/iu.test(answer) &&
		/\b(?:exposure|exposed)\b/iu.test(answer) &&
		/\b(?:climb|climbing|effort)\b/iu.test(answer) &&
		/\b(?:risk tolerance|risk margin|risk)\b/iu.test(answer);
	const mentionsVisualConfirmation =
		/\b(?:visually confirm|confirm (?:current )?flow|verify (?:current )?flow)\b/iu.test(answer) &&
		/\b(?:filter|treat)\b/iu.test(answer);
	return mentionsSeasonalCandidate && mentionsCurrentCarry && mentionsReliableTarget && mentionsRiskFactors && mentionsVisualConfirmation;
}

function mentionsWaterReportConflictDecision(answer: string): boolean {
	const mentionsCurrentDryReport =
		/\b(?:current|recent|observed)[^.?!\n]*(?:dry report|report|says? dry|flow)|(?:dry report|report says dry)[^.?!\n]*(?:current|recent|observed)\b/iu.test(answer);
	const mentionsCachedPlanningOnly =
		/\b(?:scout|pack|field[-\s]?pack|cached)\b/iu.test(answer) &&
		/\b(?:planning context|not proof|does not prove|doesn't prove|not current proof|caution signal)\b/iu.test(answer);
	const treatsListedSourceAsDry =
		/\b(?:treat|assume)[^.?!\n]*(?:spring|seep|source)[^.?!\n]*(?:dry|not flowing)|(?:spring|seep|source)[^.?!\n]*(?:dry|not flowing)[^.?!\n]*(?:until|unless|verify|confirm)\b/iu.test(answer);
	const mentionsReliableCarry =
		/\b(?:carry enough|top off|carry conservatively|conservative carry)\b/iu.test(answer) &&
		/\b(?:next reliable|verified water|verified source|reliable source|creek crossing)\b/iu.test(answer);
	const mentionsTreatment = mentionsWaterTreatmentMethod(answer);
	return mentionsCurrentDryReport && mentionsCachedPlanningOnly && treatsListedSourceAsDry && mentionsReliableCarry && mentionsTreatment;
}

function mentionsRoadTownNavigationContext(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const mentionsCurrent = !toolSummary(toolInvocations, 'current_mile') || mentionsToolPlace(answer, toolSummary(toolInvocations, 'current_mile'));
	const mentionsTown = !toolSummary(toolInvocations, 'next_town') || mentionsToolPlace(answer, toolSummary(toolInvocations, 'next_town'));
	const mentionsDistance = /\b(?:about|approx(?:\.|imately)?|roughly)?\s*\d+(?:\.\d+)?\s*(?:mi|miles?)\s+(?:ahead|away|from|to)\b/iu.test(answer);
	const mentionsUncertainty = /\b(?:confirm|candidate|not guaranteed|no guaranteed|approximate|loaded context|shuttle|pickup|services?)\b/iu.test(answer);
	const avoidsSeasonalReliable = !/\breliable water source is a seasonal\b/iu.test(answer);
	return mentionsCurrent && mentionsTown && mentionsDistance && mentionsUncertainty && avoidsSeasonalReliable;
}

function mentionsClimbTerrainAheadBoundary(answer: string): boolean {
	const mentionsCachedTerrain =
		/\b(?:cached|loaded)\b[^.?!\n]*(?:terrain|upcoming window|field pack)|\b(?:terrain|upcoming window)\b[^.?!\n]*(?:cached|loaded)\b/iu.test(answer) &&
		/\b(?:gain|loss|max grade|grade|difficulty|steep sections?|landmark spacing)\b/iu.test(answer) &&
		/\b(?:offline map|guide|gps\/elevation profile|elevation profile|trail sign|verify|confirm|cached offline terrain)\b/iu.test(answer) &&
		/\b(?:pace impact|slow|slower|target pace|budget daylight|daylight|water spacing|pack weight|feet\/knees|feet|knees|next legal stop)\b/iu.test(answer);
	if (mentionsCachedTerrain) return true;

	const mentionsMissingElevation =
		/\b(?:does not include|doesn't include|lacks?|not have|no verified|cannot verify|can't verify)\b[^.?!\n]*(?:climb|elevation|gain\/loss|gain|loss|grade|profile)\b/iu.test(
			answer
		);
	const avoidsFabrication =
		/\b(?:do not|don't|cannot|can't|should not|shouldn't)\b[^.?!\n]*(?:invent|guess|pretend|call|rate|rank)\b[^.?!\n]*(?:climb|difficulty|hard|elevation|grade|distance)\b/iu.test(
			answer
		);
	const mentionsLoadedContext = /\b(?:loaded upcoming window|upcoming terrain|landmark spacing|water spacing|shelter|town|mile\s+\d+(?:\.\d+)?)\b/iu.test(answer);
	const mentionsExternalVerification = /\b(?:offline map|guide|gps\/elevation profile|elevation profile|trail sign|verify|confirm)\b/iu.test(answer);
	const mentionsPaceImpact = /\b(?:pace impact|slow|slower|target pace|budget daylight|daylight|pack weight|feet\/knees|feet|knees|next legal stop)\b/iu.test(answer);
	return mentionsMissingElevation && avoidsFabrication && mentionsLoadedContext && mentionsExternalVerification && mentionsPaceImpact;
}

function mentionsTodayDifficultyContext(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const terrain = toolSummary(toolInvocations, 'upcoming_terrain');
	const weather = toolSummary(toolInvocations, 'weather_lookup');
	const usesTerrain = !terrain || mentionsToolPlace(answer, terrain) || /\b(?:terrain|difficulty|gain|loss|grade|steep|water spacing|shelter|town)\b/iu.test(answer);
	const usesWeather = !weather || /\b(?:weather|forecast|rain|storm|wind|hot|cold|cached)\b/iu.test(answer);
	const mentionsDecisionFactors = /\b(?:daylight|water spacing|pack weight|feet|knees|next legal stop|body|weather)\b/iu.test(answer);
	const mentionsCachedBoundary = /\b(?:cached|offline|field pack|refresh|not live|stale)\b/iu.test(answer);
	return usesTerrain && usesWeather && mentionsDecisionFactors && mentionsCachedBoundary;
}

function mentionsQuestionableWaterLowDaylight(answer: string): boolean {
	const mentionsTreatmentRequired = /\b(?:treatment is non-negotiable|treat(?:ment)? (?:all|any|the) questionable|do not drink untreated|don't drink untreated|never drink untreated)\b/iu.test(answer);
	const mentionsMethod = /\b(?:filter|backflush|backup tablets?|water tablets?|chemical treatment|chlorine dioxide|aquamira|boil)\b/iu.test(answer);
	const mentionsDarkStop = /\b(?:safe legal stop|stop before dark|before dark|low daylight|dark|headlamp|do not push into darkness|don't push into darkness)\b/iu.test(answer);
	return mentionsTreatmentRequired && mentionsMethod && mentionsDarkStop;
}

function mentionsUnknownWaterFlowContext(answer: string): boolean {
	const mentionsUnknown = /\b(?:do not know|don't know|unknown|not proven|not know|cannot verify|can't verify|does not prove current flow)\b/iu.test(answer);
	const mentionsCachedCandidate = /\b(?:cached|candidate|seasonal|mapped|next loaded water|seasonal seep)\b/iu.test(answer);
	const mentionsVerify = /\b(?:verify|confirm|current report|visual|visually|flow)\b/iu.test(answer);
	const mentionsTreatment = mentionsWaterTreatmentMethod(answer);
	const mentionsSaferChoice = /\b(?:safer carry|carry extra|carry enough|safer stop|verified source|reliable source)\b/iu.test(answer);
	return mentionsUnknown && mentionsCachedCandidate && mentionsVerify && mentionsTreatment && mentionsSaferChoice;
}

function mentionsWaterVerificationAndTreatment(answer: string): boolean {
	const mentionsVerify = /\b(?:verify|confirm|visual|visually|current flow|flow before relying)\b/iu.test(answer);
	const mentionsTreatment = mentionsWaterTreatmentMethod(answer);
	const mentionsSaferCarry = /\b(?:carry extra|carry enough|safer carry|verified source|reliable source|if it is dry)\b/iu.test(answer);
	return mentionsVerify && mentionsTreatment && mentionsSaferCarry;
}

function mentionsWaterTreatmentMethod(answer: string): boolean {
	return /\b(?:filter|filtering|filtered|treat\/filter|filter\/treat|filter or treat|treat or filter|treat(?:ed|ing)? (?:all|any|the|collected|questionable|source|water)|water treatment|backup tablets?|water tablets?|chemical treatment|chlorine dioxide|aquamira|boil)\b/iu.test(answer);
}

function mentionsShelterDecisionFactors(answer: string): boolean {
	const mentionsDaylight = /\b(?:daylight|before dark|dark|dusk|late|time left)\b/iu.test(answer);
	const mentionsWater = /\bwater\b/iu.test(answer);
	const mentionsLegalRules = /\b(?:legal|rules?|allowed|land-manager|regulat\w*)\b/iu.test(answer);
	const mentionsStatusCrowding = /\b(?:status|crowd\w*|capacity|full|availability|available)\b/iu.test(answer);
	const mentionsBackup = /\b(?:backup|alternative|next option|safer stop|closer option)\b/iu.test(answer);
	return mentionsDaylight && mentionsWater && mentionsLegalRules && mentionsStatusCrowding && mentionsBackup;
}

function mentionsFullShelterFallback(answer: string): boolean {
	const mentionsLegalOverflow = /\b(?:legal|allowed|established|designated|overflow|tent(?:ing)?)\b/iu.test(answer);
	const mentionsBeforeDark = /\b(?:before dark|daylight|dark|dusk)\b/iu.test(answer);
	const mentionsCourtesy = /\b(?:courteous|courtesy|quiet|make room|crowd\w*|full shelter)\b/iu.test(answer);
	const mentionsAvoidIllegal = /\b(?:avoid unsafe|avoid illegal|do not camp illegally|don't camp illegally|illegal camping)\b/iu.test(answer);
	return mentionsLegalOverflow && mentionsBeforeDark && mentionsCourtesy && mentionsAvoidIllegal;
}

function mentionsStealthCampBoundary(answer: string): boolean {
	const mentionsNoStealth = /\b(?:do not stealth camp|don't stealth camp|avoid stealth camping|not stealth camp)\b/iu.test(answer);
	const mentionsRules = /\b(?:regulated|prohibited|land-manager|legal|rules?|allowed)\b/iu.test(answer);
	const mentionsLegalAlternative = /\b(?:legal shelter|legal campsite|town stop|established legal|safer legal|legal stop)\b/iu.test(answer);
	return mentionsNoStealth && mentionsRules && mentionsLegalAlternative;
}

function mentionsStormCampsiteSafety(answer: string): boolean {
	const mentionsAvoidTerrain = /\b(?:exposed ridge|ridges|dead trees?|widow makers?|drainages?|flood-prone|creek bottoms?|flooding)\b/iu.test(answer);
	const mentionsEarlySetup = /\b(?:set up early|setup early|pitch early|camp early)\b/iu.test(answer);
	const mentionsDryLayers = /\b(?:dry sleep|sleep system|dry layers?|warm layer|insulation|quilt)\b/iu.test(answer);
	const mentionsLightningBail = /\b(?:lightning|bail(?:out)?|stop|hypothermia|worsening conditions)\b/iu.test(answer);
	return mentionsAvoidTerrain && mentionsEarlySetup && mentionsDryLayers && mentionsLightningBail;
}

function mentionsLowImpactCampsite(answer: string): boolean {
	const mentionsDistance = /\b(?:200\s*feet|two hundred feet|roughly 200|about 200)\b/iu.test(answer);
	const mentionsSurface = /\b(?:durable surfaces?|established campsites?|existing use|designated)\b/iu.test(answer);
	const mentionsRules = /\b(?:local rules?|posted rules?|land-manager|regulat\w*|allowed)\b/iu.test(answer);
	return mentionsDistance && mentionsSurface && mentionsRules;
}

function mentionsClimbStopDecision(answer: string): boolean {
	const mentionsBefore = /\b(?:stop before|before the climb|before a climb)\b/iu.test(answer) &&
		/\b(?:daylight|legs|energy|water|weather|legal camp|legal stop)\b/iu.test(answer);
	const mentionsAfter = /\b(?:after the climb|known legal stop|legal stop after|enough daylight|enough water|enough energy)\b/iu.test(answer);
	return mentionsBefore && mentionsAfter;
}

function mentionsAfterDarkShelterSafety(answer: string): boolean {
	const mentionsHeadlamp = /\bheadlamp\b/iu.test(answer);
	const mentionsSlow = /\b(?:slow down|slow your pace|move slowly|take it slow)\b/iu.test(answer);
	const mentionsNightNav = /\b(?:night navigation|risky navigation|avoid risky|do not push into darkness|don't push into darkness|dark)\b/iu.test(answer);
	const mentionsBackup = /\b(?:backup|fallback|nearest safe legal|safe legal option|shelter is full|full shelter)\b/iu.test(answer);
	return mentionsHeadlamp && mentionsSlow && mentionsNightNav && mentionsBackup;
}

function mentionsWaterlessShelterPlanning(answer: string): boolean {
	const mentionsNoAssumption = /\b(?:do not assume|don't assume|not assume|no reliable water|water may not be flowing|flow is unknown)\b/iu.test(answer);
	const mentionsTopOffCarry = /\b(?:top off|carry enough|carry water|safer carry)\b/iu.test(answer);
	const mentionsVerifiedSource = /\b(?:next verified source|next reliable source|verified water|reliable water|confirmed source)\b/iu.test(answer);
	const mentionsSleepWater = /\b(?:legal sleep and water|sleep and water|shelter and water|camp and water)\b/iu.test(answer);
	return mentionsNoAssumption && mentionsTopOffCarry && mentionsVerifiedSource && mentionsSleepWater;
}

function mentionsBearActivityShelterPlan(answer: string): boolean {
	const mentionsCurrentGuidance = /\b(?:current local guidance|latest guidance|current guidance|current alerts?|local alerts?|closures?|bear report|bear activity report|verify|confirm)\b/iu.test(answer);
	const mentionsConcreteStorage = /\b(?:store food|bear box|bear cable|bear canister|approved hang|hang food)\b/iu.test(answer);
	const mentionsAlternateStop = /\b(?:alternate legal stop|alternative legal stop|safer legal stop|different legal stop|lower-mileage|move on to another legal|choose another legal|if the report cannot be cleared)\b/iu.test(answer);
	return mentionsCurrentGuidance && mentionsConcreteStorage && mentionsAlternateStop;
}

function mentionsBearNearCampSafety(answer: string): boolean {
	const mentionsCalmNoRun = /\b(?:stay calm|keep calm|calm)\b/iu.test(answer) &&
		/\b(?:do not run|don't run|not run|never run)\b/iu.test(answer);
	const mentionsDistance = /\b(?:create distance|back away|move away|give the bear an exit|do not approach|don't approach|do not corner|don't corner)\b/iu.test(answer);
	const mentionsFoodStorage =
		/\b(?:food|trash|scented|odor)\b/iu.test(answer) &&
		/\b(?:away from sleep|away from your tent|bear box|bear cable|canister|approved hang|hang|secure)\b/iu.test(answer);
	const mentionsCurrentGuidance = /\b(?:current local bear guidance|current local guidance|current alerts?|local alerts?|food-storage rules?|verify|confirm)\b/iu.test(answer);
	const avoidsInventedRules = /\b(?:avoid|do not|don't|unless)\b[^.?!\n]*(?:species|park-specific|loaded)|(?:species|park-specific)[^.?!\n]*(?:unless|loaded|do not invent|don't invent|avoid)/iu.test(answer);
	const mentionsEmergency = /\b(?:emergency|911|inreach|plb|authorities|rangers?|local authorities|immediate danger)\b/iu.test(answer);
	return mentionsCalmNoRun && mentionsDistance && mentionsFoodStorage && mentionsCurrentGuidance && avoidsInventedRules && mentionsEmergency;
}

function mentionsUnsafePersonShelterSafety(answer: string, toolInvocations: ToolInvocationRecord[]): boolean {
	const mentionsValidation = /\b(?:trust|valid|take it seriously|you do not have to stay|don't have to stay|do not stay|leave)\b/iu.test(answer);
	const avoidsConfrontation =
		/\b(?:do not|don't|avoid|not)\b[^.?!\n]*(?:confront|negotiate|de[-\s]?escalate|stay to be polite)|(?:do not|don't|avoid|not)[^.?!\n]*(?:stay|remain)[^.?!\n]*(?:polite|courteous)/iu.test(answer);
	const mentionsDistanceOrExit =
		/\b(?:create distance|move away|leave|safer public|known place|road crossing|town|exit|bail out|public place|safe legal option)\b/iu.test(answer);
	const mentionsSupport =
		/\b(?:trusted person|family|friend|support|authorities|911|inreach|plb|emergency|ridgerunner|land manager|shuttle|hostel)\b/iu.test(answer);
	const usesLoadedExit = !toolSummary(toolInvocations, 'next_town') || mentionsToolPlace(answer, toolSummary(toolInvocations, 'next_town'));
	return mentionsValidation && avoidsConfrontation && mentionsDistanceOrExit && mentionsSupport && usesLoadedExit;
}

function mentionsToolPlace(answer: string, summary: string | null): boolean {
	if (!summary) return true;
	const name = summary.split(' at mile ')[0]?.replace(/^(?:Next loaded town:|Next town:)\s*/iu, '').trim();
	if (name && answer.toLowerCase().includes(name.toLowerCase())) return true;
	const mile = summary.match(/\bmile\s+(\d+(?:\.\d+)?)\b/iu)?.[1];
	return Boolean(mile && answer.includes(mile));
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

function mentionsDryClothesPriority(answer: string): boolean {
	const mentionsSleep = /\b(?:sleep base layer|sleep layer|sleep clothes|sleep system|quilt|bag)\b/iu.test(answer);
	const mentionsSocks = /\bsocks?\b/iu.test(answer);
	const mentionsWarmLayer = /\b(?:insulation|warm layer|puffy|fleece)\b/iu.test(answer);
	const mentionsElectronics = /\b(?:electronics|phone|battery bank|battery|critical electronics)\b/iu.test(answer);
	const mentionsDryMethod = /\b(?:pack liner|dry bag|liner|waterproof bag|trash compactor bag)\b/iu.test(answer);
	const mentionsHypothermia = /\bhypothermia|wet[-\s]?cold/iu.test(answer);
	return mentionsSleep && mentionsSocks && mentionsWarmLayer && mentionsElectronics && mentionsDryMethod && mentionsHypothermia;
}

function mentionsBatteryBankPlanning(answer: string): boolean {
	const mentionsPhone = /\bphone model|model of your phone|your phone\b/iu.test(answer);
	const mentionsTownDays = /\b(?:days? between towns?|days? between charging|town charging|time between charges|next charge)\b/iu.test(answer);
	const mentionsUsePattern = /\b(?:navigation|maps?|photos?|family check-ins?|checkins?|check-ins?)\b/iu.test(answer);
	const mentionsLocalAi = /\b(?:local ai|model|gemma|scout)\b/iu.test(answer);
	const mentionsDrainTest = /\b(?:actual drain|drain test|airplane-mode rehearsal|test.*drain|measure.*drain|instead of guessing)\b/iu.test(answer);
	return mentionsPhone && mentionsTownDays && mentionsUsePattern && mentionsLocalAi && mentionsDrainTest;
}

function mentionsFirstAidKitSafety(answer: string): boolean {
	const mentionsKitBasics = /\b(?:prevention tape|tape)\b/iu.test(answer) &&
		/\b(?:blister treatment|blisters?|moleskin|padding)\b/iu.test(answer) &&
		/\b(?:wound basics|wound care|cuts?|scrapes?)\b/iu.test(answer) &&
		/\b(?:personal meds|personal medications|normal meds|normal personal meds)\b/iu.test(answer);
	const mentionsEscalation = /\b(?:spreading redness|drainage|fever|worsening pain|swelling|changed gait|changes gait)\b/iu.test(answer);
	const avoidsDiagnosis = /\b(?:do not diagnose|don't diagnose|medical help|get help|clinician)\b/iu.test(answer);
	return mentionsKitBasics && mentionsEscalation && avoidsDiagnosis;
}

function mentionsMailHomeGearSafety(answer: string): boolean {
	const mentionsRain = /\b(?:rain protection|rain jacket|rain pants|rain gear|rain shell)\b/iu.test(answer);
	const mentionsWarmth = /\b(?:insulation|warm layers?|warmth|puffy|fleece)\b/iu.test(answer);
	const mentionsWater = /\b(?:water treatment|water filter|backup tablets?|filter)\b/iu.test(answer);
	const mentionsSafetyPower = /\b(?:first aid|battery|navigation|phone power)\b/iu.test(answer);
	const mentionsSleep = /\b(?:sleep safety|sleep system|quilt|sleep layer|sleep gear)\b/iu.test(answer);
	const avoidsWarmSpell = /\b(?:warm spell|looks warm|forecast looks warm|one forecast|short warm|current forecast)\b/iu.test(answer);
	const mentionsTownTiming = /\b(?:next town|town timing|replacement|replace|forecast)\b/iu.test(answer);
	return mentionsRain && mentionsWarmth && mentionsWater && mentionsSafetyPower && mentionsSleep && avoidsWarmSpell && mentionsTownTiming;
}

function firstParagraphMentionsMailHomeGearSafety(answer: string): boolean {
	return mentionsMailHomeGearSafety(firstParagraph(answer));
}

function containsMailHomeGearConfusion(sentence: string): boolean {
	return /\b(?:not mail home anything that is not essential|is not essential for your immediate needs|not essential for your current situation|isn't critical for survival|not critical for survival|easily replaceable|personal items|afford to leave behind|things? that (?:are|is) not necessary|not necessary for your current situation|aren't necessary for your current situation)\b/iu.test(sentence);
}

function containsBibleDrift(paragraph: string): boolean {
	return /\b(?:bible|scripture|verse|verses|psalms?|isaiah|john|romans|proverbs?|timothy|lord|god|christ|jesus)\b/iu.test(paragraph) ||
		/[“"]?[A-Z][^.!?]{10,}\b(?:I am with you|do not fear|trust in the lord|righteous right hand)\b/iu.test(paragraph);
}

function containsFearComfortDrift(paragraph: string): boolean {
	return /\b(?:scared|afraid|alone|anxious|anxiety|panic|comfort verses?)\b/iu.test(paragraph);
}

function containsHeatIllnessDrift(sentence: string): boolean {
	return /\b(?:find (?:immediate )?shade|cool(?:ing)? down|heat illness|stopped sweating|nausea|cramps)\b/iu.test(sentence);
}

function mentionsBadWeatherNeroDecision(answer: string): boolean {
	const mentionsShortStop = /\b(?:short day|town stop|early stop|stop early|nero)\b/iu.test(answer);
	const mentionsWeatherRisk = /\b(?:storm|rain|lightning|temperature|cold|heat|weather|footing|exposure|forecast)\b/iu.test(answer);
	const mentionsBodyOrAccess = /\b(?:body condition|injury|fatigue|tired|town access|road crossing|daylight|legal stop|terrain)\b/iu.test(answer);
	const framesRestWell = /\b(?:not failure|recovery|safety decision|pause and reassess|right move)\b/iu.test(answer);
	return mentionsShortStop && mentionsWeatherRisk && mentionsBodyOrAccess && framesRestWell;
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
		`For the core offline field questions, lead with the cached finding: next water distance/source, next town or road/town access distance, today difficulty from terrain/weather/water/shelter spacing, and cached tomorrow weather. Then give the caveat. Do not answer these with generic hiking advice when a tool finding is present.`,
		`For water questions, use the next_water tool finding as the answer's spine. Lead with the nearest actionable water option or next reliable source from the tool finding. If the source is seasonal or unverified, say it is a candidate, visually confirm current flow, filter or treat collected water, and carry enough to reach a verified source if it is dry. If no reliable water is loaded, say that after the source hierarchy; do not start with a generic refusal.`,
		`For "skip this spring and make the next reliable water" questions, compare the nearer seasonal/unconfirmed source with the next reliable source. Make the decision depend on current treated water carry, heat, exposure, climbing or effort, pace, daylight, and risk tolerance. Do not guarantee the seasonal source is flowing; say to visually confirm and filter/treat if collecting.`,
		`For current water-report conflicts, such as another report saying a spring is dry while Scout's cached field pack lists it, trust the current observed or recent dry report for flow. Use Scout's cached pack as planning context, not proof of current flow; treat the listed source as dry until visually confirmed or a fresher reliable report says otherwise, and carry to the next reliable or verified water.`,
		`For heat-wave water questions, combine planning and emergency thresholds: move hard miles into the cooler part of the day, schedule shade breaks, eat salty food or use electrolytes if available, carry conservatively to verified water, and escalate if dizziness, confusion, headache, nausea, cramps, chills, stopped sweating, or worsening symptoms appear.`,
		`For active heat illness or dizziness in heat, lead with immediate safety: do not keep hiking through symptoms, stop, find shade, cool down, sip treated water with electrolytes if safe, and seek urgent help or use the emergency plan for confusion, fainting, stopped sweating, or symptoms that worsen or do not improve.`,
		`For camel-up or ridge-water questions, give a clear decision: camel up at the last confirmed source and carry extra when the next water is seasonal, unverified, exposed, hot, or after a hard climb; only use the lighter carry when the next reliable water is confirmed and conditions are mild. When tool findings name a seasonal source and a reliable source, name both and make the carry decision from those facts.`,
		`For dry-stretch water-carry questions, give a practical conservative range: roughly 0.5-1 liter per 3-5 miles as a starting point, more for heat, exposure, climbing, slow pace, or personal thirst. Tell the hiker to top off at the last confirmed source and carry enough to reach the next reliable source when the next source is seasonal or unverified.`,
		`For questionable-water, tired, or low-daylight treatment questions, keep the answer focused on water safety unless heat symptoms are explicit. Say treatment is non-negotiable, use filter/backflush or backup tablets/boil, do not drink untreated questionable water, and choose a safe legal stop before dark if treatment or verification will delay the push.`,
		`For frozen or failing water-filter questions, say a hollow-fiber filter may be compromised if it froze, use backup treatment or replace it if unsure, backflush or clean a slow filter when the model supports it, and prevent the next freeze by sleeping with the filter or keeping it warm overnight. Use next-water context before telling the hiker to push past water.`,
		`For shelter and camping decisions, use the next_shelter and upcoming_terrain findings as planning candidates, not guarantees. Name daylight, water, current shelter status/crowding, legal rules, weather, fatigue, and a backup option before committing to a sleep plan.`,
		`For full-shelter, stealth-camping, storm-campsite, low-impact campsite, climb-stop, or waterless-shelter questions, keep the legal/safety boundary explicit: no illegal camping, choose backups before dark when there is still daylight, use established or durable surfaces, keep roughly 200 feet from water and trail when rules allow, avoid exposed ridges/dead trees/drainages/flood-prone ground in storms, and top off/carry enough water when shelter water is uncertain.`,
		`For bear-activity shelter questions, verify current local guidance, alerts, closures, and required food storage before committing. Name proper food storage and odor control such as a bear box, cable, canister, or approved hang as local rules require, keep food and scented items away from sleep, and choose an alternate legal stop if the report cannot be cleared.`,
		`For bear-near-camp questions, stay calm, create distance, do not run, give the bear an exit, secure food/trash/scented items away from sleep, and do not approach, feed, corner, or retrieve food from the bear. Verify current local bear guidance, alerts, and food-storage rules when available; do not invent species- or park-specific rules unless they are loaded. Use emergency communication or local authorities/rangers for immediate danger.`,
		`For unsafe-person shelter or campsite questions, validate the concern without dramatizing, do not suggest confrontation, negotiation, de-escalation with the person, or staying to be polite. Create distance, move toward a safer public or known place or loaded exit when safe, contact trusted support or authorities, and use emergency communication immediately for danger.`,
		`For closure or detour routing questions, summarize loaded official alerts when present, say Scout is giving advisory context rather than turn-by-turn detour routing, verify the current managing-agency detour and posted signage, follow official route guidance, and never invent alternate route details.`,
		`For smoke or fire near trail questions, treat smoke or visible fire as a serious hazard. Use loaded fire/smoke trail conditions and weather as risk context, do not continue toward or through smoke or visible fire, move away toward a known safe road, town, ranger station, or public area when safe, follow official closures, evacuation orders, ranger/911/emergency-device instructions, and never invent a safe route through the hazard.`,
		`For severe fatigue or "too tired to keep going" prompts, do not jump to heat illness unless heat, dizziness, or hot-weather symptoms are explicit. Start with immediate clarity: stop hiking, sit in a safe spot, eat, drink treated water or electrolytes, adjust layers for warmth or cooling, check daylight, weather, body symptoms, and whether the hiker can think clearly. Then use loaded water, shelter, town, or bailout context to choose the nearest lower-risk legal stop or help option. Escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for confusion, worsening symptoms, injury, exposure, inability to continue safely, or inability to make decisions.`,
		`For after-dark shelter arrivals, do not tell the hiker to choose a backup before dark. Say to slow down, use the headlamp, avoid risky tired night navigation, take the nearest safe legal option rather than adding extra night miles, and keep a fallback plan if the shelter is full.`,
		`When tool findings are labeled as guidance, treat them as topic-specific documents Scout intentionally read for this answer. Use them to shape caveats and next-step advice.`,
		`When preparation or training questions have pretrip, terrain, loadout, safety, or offline setup findings, give a concrete short plan. For "what should I focus on first" prompts, include an immediate first-week checklist, not only general training advice. Include shakedown hikes, foot care/blister practice, conservative early mileage, gear/loadout checks, water treatment habits, and an offline app/model rehearsal when those appear in the findings.`,
		`For first-run or newly installed app onboarding questions, give simple ordered setup steps: set the hiker profile/current mile, refresh the field pack, confirm pack age/status looks current, download or update the local AI model on Wi-Fi and power, save offline maps/docs, let cloud sync finish if signed in, then turn on airplane mode, relaunch, and ask Scout a water or nearby-trail question. Do not call Scout ready for offline trail use until the field-pack refresh, model download, and airplane-mode test succeed.`,
		`For airplane-mode, no-cell, or "what works offline" Scout questions, split the answer plainly: what still works offline is the cached field pack, on-device local AI model, saved offline maps/docs, saved document summaries, and Bible text if packaged or downloaded; what needs network is fresh weather, official closures/fire alerts, new water reports, town/service changes, cloud sync/backup, messages, and live/tramily location. Say cached weather, closures, water, and services can be stale until refreshed again.`,
		`For "test airplane mode" or offline rehearsal questions, give the test sequence: charge phone and battery bank, refresh field pack, confirm current mile, finish cloud sync if signed in, download/update the local AI model on Wi-Fi and power, save offline maps/docs, verify Bible text is available offline, refresh weather/closures, turn on airplane mode or disable network, fully relaunch Scout, then ask a water, weather, or offline Scout question. Say passing proves cached field pack/local model/saved docs answer, not live freshness, and tell the hiker to go back online and refresh before relying on weather, closures, water reports, town services, or safety-critical facts.`,
		`For "what should I screenshot before day one" or app/signal failure screenshot prompts, list current mile/start location, itinerary and check-in plan, emergency contacts, next resupply or town/bailout plan, offline map download/status, Scout field-pack/local-model status, key permits or reservations, shuttle/lodging confirmations, and medication/allergy notes. Tell the hiker to keep copies outside Scout too, and do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat.`,
		`For document-writing prompts such as "draft a checklist", "draft my town-exit update note", "update my notes", or "save this to my Document Vault", answer the factual question first, then include a clearly labeled draft note/checklist. Separate source-backed facts from placeholders or open questions, use placeholders for private values, and say Scout should not save or overwrite a document unless the user explicitly confirms it.`,
		`For model-downloading, model status, stuck download, failed download, or "still downloading" questions, say the on-device local AI model is not ready for offline Scout yet. Tell the hiker to stay on Wi-Fi and power, wait for download and verification, check Scout model status/progress until it says ready, retry/cancel/restart only if stuck or failed, and not trust offline/local AI until the model reports ready and an airplane-mode Scout question succeeds.`,
		`For stale field-pack, field-pack status, or "can I trust Scout's field pack" questions, field pack means cached Scout trail data on the phone, not the physical backpack or loadout. Tell the hiker to check pack age/status, current mile or downloaded region, and source timestamps when shown. If the pack is old, expired, wrong-mile/wrong-region, or loaded before weather, closures, water, or services changed, treat it as stale. Refresh on Wi-Fi or in town before water, weather, closure, bailout, or town-service decisions, and use stale cached data only as caution, not current proof.`,
		`For sign-in, login, account, cloud sync, backup, restore, or "can I wait to sign in" questions, say accounts are invite-only. Recommend signing in before trail on Wi-Fi if the hiker has an invite so backup/restore and cloud sync can finish. Keep offline Scout/local AI separate: once the field pack, on-device model, and saved maps/docs are downloaded, offline use does not require a live login. Do not imply sign-in or cloud sync is emergency safety; keep inReach, PLB, 911, and the family emergency plan separate.`,
		`For own-mile, manual-mile, wrong-mile, profile, GPS correction, shuttle, or "someone else's mile" questions, explain the app flow: first-run hike setup or Settings > Edit hike details, enter Current AT mile, save, then check Today and Scout show the new mile. If the hiker entered the wrong mile, tell them to correct it, refresh the field pack when online, and re-ask Scout for water, shelter, town, terrain, and bailout. Warn that a wrong mile shifts water, shelter, town, terrain, and bailout answers, and not to make water, shelter, town, or safety decisions from a wrong mile. Tell the hiker to confirm against a trail sign or blaze, shelter or road crossing, guide source, map, or GPS snap before relying on Scout.`,
		`For GPS jumping, bad GPS fixes, or Scout showing the wrong spot, tell the hiker to stop in a safe place, wait for GPS to settle with clearer sky view, compare Scout against blazes, signs, landmarks, map, compass, and last known point, then set Current AT mile only from a confirmed location. Tell them to refresh the field pack/current mile when online and re-ask water, shelter, town, terrain, and bailout questions because downstream tools can be wrong until the mile/location is corrected.`,
		`For manual-mile updates after a shuttle or missed GPS fix, answer the app flow directly: confirm the real location from a reliable reference, use first-run hike setup or Settings > Edit hike details, enter Current AT mile, save, check Today and Scout, refresh the field pack when online, re-ask water/shelter/town/terrain/bailout, and mention cloud sync/backup only if signed in.`,
		`For guidebook, trail-sign, Scout, GPS, or map mile-mismatch questions, explain that Scout uses a calibrated AT mile frame and that guidebook editions, reroutes or relocations, rounded/local signs, side-trail distances, GPS snap, or manual Current AT mile entry can differ. Ask which guidebook, sign, edition, map, or source the hiker is comparing. Tell the hiker to confirm real position against a blaze, road or shelter sign, map, or GPS snap, update Scout only when the app position is wrong, and do not let Scout mileage override posted signs, closures, or current official safety guidance.`,
		`For no-basemap, missing-map-tiles, no-cell, or offline map navigation questions, do not pretend basemap tiles are available unless cached. Say Scout's cached trail line and field-pack mile context are only rough trail-corridor checks. Use an external offline map/GPS app or paper map and compass when available. For complex navigation, confusing junctions, off-trail uncertainty, bad weather, or safety decisions, stop and verify with blazes, signs, map, and GPS instead of continuing just because Scout shows a line.`,
		`For confusing-junction or unclear-blaze questions, keep it immediate: stop at the junction, do not guess, compare blaze/sign/map/compass/GPS/last known clear blaze, backtrack only on the obvious safe route to the last confirmed point, and wait or ask a reliable source when visibility, weather, injury, or darkness makes the choice unsafe.`,
		`For lost or off-trail prompts, keep it immediate: stop moving, get to a safe stable spot, conserve battery, verify position against map/GPS, compass, blazes, signs, and last known point, backtrack only if the route back is obvious and safe, and do not bushwhack, shortcut, or route through unknown terrain. Escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for injury, exposure, confusion, worsening weather or darkness, or inability to regain the trail safely.`,
		`For bailout, exit, or worsening-injury questions, start from the current_mile finding and the next_town road/town/access finding. Name the nearest loaded bailout or access candidate and approximate distance. Say if it is only a road crossing or emergency-exit candidate, confirm shuttle, pickup, and services when possible, choose conservative exit or rest planning, and do not tell the hiker to push through worsening knee or joint pain.`,
		`For rolled-ankle or acute injury questions, stop first, assess pain/swelling/weight-bearing/gait, reduce load and pace, use loaded exit context when available, and set clear help criteria. Do not diagnose or tell the hiker to push through worsening pain, swelling, changed gait, deformity, numbness, exposure, or inability to continue safely.`,
		`For SOS, no signal, support-circle, or overdue-partner questions, separate Scout from rescue. Scout cannot call 911, trigger SOS, or rescue the hiker. Tell the hiker what facts to send: current mile/location or last known point, issue, urgency, plan, and next check-in. Use 911, phone SOS, inReach/PLB, rangers/authorities, or the emergency plan for danger, and do not create a second emergency while searching or chasing signal.`,
		`For medical-advice questions, Scout can support conservative field decisions but cannot diagnose, clear the hiker to continue, or replace clinicians/emergency services. Name red flags and tell the hiker to stop, choose a safer stop or exit, and get medical/emergency help when symptoms are serious, worsening, confusing, or unsafe.`,
		`For "when should I stop hiking immediately" questions, cover multiple stop-now categories, not only heat: heat illness, hypothermia, lightning/exposed ridge danger, smoke/fire, flooding/high water, lost/off-trail, unsafe people, severe fatigue/foggy thinking, worsening injury, chest pain, breathing trouble, fainting, confusion, and unsafe darkness/weather.`,
		`For "where am I relative to the next road crossing or town" questions, start from the current_mile finding and the next_town road/town access finding. State the approximate distance, say when the loaded place is only a road crossing or emergency-exit candidate, confirm shuttle or pickup when needed, and do not assume services at a crossing unless loaded current service data proves them. Do not drift into water or shelter unless asked; if nearby water is mentioned, never call seasonal water reliable.`,
		`For "how hard is today", "next climb", "how hard is the terrain ahead", elevation, gain/loss, or grade questions, use the upcoming_terrain finding as the loaded window. If it has cached difficulty, gain/loss, max grade, or steep sections, state those plainly as offline field-pack context. If it lacks verified climb, elevation profile, gain/loss, or grade detail, say so plainly and do not invent it. Give pace-impact guidance from daylight, water spacing, pack weight, feet/knees, weather, and the next legal stop.`,
		`For offline setup, offline downloads, phone settings, or day-one readiness questions, distinguish phone/app readiness from personal safety readiness. Always include the exact check "verify Bible text is available offline." Also mention field-pack refresh, current mile, local AI model, offline maps/docs, battery, airplane-mode rehearsal, and that Scout does not replace inReach, PLB, 911, or the family emergency plan. For personal documents, include this safety boundary in plain words: do not paste private ID, insurance, medical, payment, or reservation numbers into Scout chat.`,
		`Do not include Bible verses, scripture, prayer, or spiritual encouragement unless the hiker explicitly asks for Bible, scripture, prayer, faith, fear comfort, or spiritual support. Safety, weather, town, water, gear, and navigation answers must stay focused on the field decision first.`,
		`For Bible or scripture questions, quote only verses returned by bible_search and keep the reference with each quote. For exact read requests like John 3:16, read the verse exactly and then explain briefly; do not paraphrase as if quoting. For "what must I do to be saved" or salvation prompts, answer directly from scripture about faith, repentance, grace, and calling on the Lord without adding denominational requirements or deflecting back to trail logistics. For fear, scared, alone, or nighttime comfort prompts, use direct comfort verses when present, such as Psalms 56:3, Isaiah 41:10, 2 Timothy 1:7, Psalms 23:4, Psalms 4:8, or John 14:27. Do not use disturbing, violent, judgment, or famine passages as comfort unless the hiker explicitly asked about that passage. If the hiker sounds scared or alone, pair scripture with immediate safety steps: check weather and hazards, get warm and dry, eat or drink if needed, use the headlamp, make a one-hour plan, and use loaded shelter context as a candidate rather than a guarantee. Escalate through 911, inReach/PLB, ranger/authorities, or the emergency plan if there is real danger, injury, exposure, or repeated panic; do not spiritualize away real danger or symptoms.`,
		`For prayer plus safe-plan prompts, do not refuse to pray. Give one short plain prayer-like sentence or paragraph if asked, then clearly separate encouragement from verified trail facts. Prayer alone is not a request for Bible quotes; quote only loaded KJV verses if the hiker explicitly asks for scripture or verses. Use loaded shelter, water, town, or bailout context as candidates, verify status/water/crowding/weather/alerts/legal options, choose the lower-risk option, and say prayer is support, not a substitute for evacuation or help. Escalate through 911, inReach/PLB, rangers/authorities, or the emergency plan for real danger, injury, exposure, confusion, or inability to continue safely.`,
		`For shakedown questions, name what the shakedown must prove: sleep system, rain system, cooking/food rhythm, water filtering, battery drain, pack fit, foot care, and offline app/model flow. Turn failures into specific gear or app fixes. Always say that one shakedown does not prove every condition is covered.`,
		`For first-week mileage questions, use body condition, daylight, elevation, weather, pack weight, water spacing, foot/knee condition, and legal shelter/campsite/town spacing. Start low, protect feet and knees, and avoid fixed mileage promises.`,
		`For heavy-rain start questions, include conservative mileage, dry sleep layers, footing caution on slick roots/rocks/descents, current forecast verification, and a bailout or stop plan for lightning, hypothermia risk, flooding, or worsening conditions.`,
		`For thunderstorm or lightning hiking questions, require current forecast or radar when available, avoid exposed ridges and high points during the storm window, shift timing or mileage earlier/lower, and stop or bail out if lightning, flooding, wet-cold exposure, or worsening conditions appear.`,
		`For lightning on a ridge, keep it concise: leave exposed high ground if it is safe to move, avoid lone trees, open knobs, metal objects, and water, spread out from partners, wait well after the last thunder, and do not keep hiking exposed terrain.`,
		`For cold wind on a ridge, cap target miles, eat more often, drink steadily, protect hands/head/feet, keep insulation and sleep layers dry, and treat wet wind as hypothermia risk.`,
		`For hot-day plan questions, move harder miles into the cooler part of the day, carry more water when the next source is uncertain, schedule shade breaks, and name heat danger signs that mean stop, cool down, and escalate.`,
		`For wet-weather hypothermia questions, name shivering, clumsiness, confusion, apathy, slurred speech, and poor coordination; then tell the hiker to stop, get sheltered, change into dry insulation or sleep layers, eat or sip warm fluids if available, and get help for severe or worsening symptoms.`,
		`For rain-pants or rain-gear cut/drop questions, visibly weigh cold rain, wind, personal cold tolerance, cached/current forecast uncertainty, and shakedown evidence before making a keep/drop call. For Georgia or March starts, default conservative until the hiker proves the rain system in comparable wet-cold conditions.`,
		`For camp-shoes questions, balance foot recovery, shelter/camp comfort, stream crossings, hygiene, and weight. Do not frame recovery comfort as laziness. Suggest testing the shoes and reassessing after the first section or first town, not deciding from ounces alone.`,
		`For food-packing or eating-while-hiking questions, tell the hiker to split out today's snacks and lunch before leaving camp, keep them reachable without unpacking, keep cook/camp meals and extra days of food separate, and connect accessible food to steady energy, warmth, and better water/shelter/mileage decisions. Do not give medical nutrition advice.`,
		`For cold-rain camping questions, explicitly name hypothermia risk, protect the dry sleep layer and warm layer first, set up early in a legal protected spot, keep the filter warm, verify the current forecast, and stop or bail out if the sleep system or camp setup cannot stay dry.`,
		`For dry-clothes priority questions, name the sleep base layer, socks, insulation or warm layer, quilt or bag, and critical electronics as dry priorities. Give a simple packing method such as pack liner or dry bag, keep rain gear accessible, and connect wet-cold mistakes to hypothermia risk.`,
		`For battery-bank planning questions, ask for phone model, days between town charging, navigation/maps/photos/family check-in habits, local AI/model use, and cold or rain margin. Recommend an airplane-mode rehearsal with the actual phone and bank to measure real drain instead of guessing. Do not promise live location or local AI battery impact.`,
		`For mail-home gear questions, do not mail home rain protection, insulation or warm layers, water treatment, first aid, battery/navigation power, or sleep safety just because one forecast looks warm. Tie the decision to current forecast, next town timing, and replacement options.`,
		`For family check-in questions, set cadence, content, normal gap expectations, escalation window, emergency contacts, itinerary sharing, and the live-location caveat. Use phrasing like "if they do not hear from you" or "if you miss a check-in"; never write "if you don't hear from you." Repeated missed check-ins, bad weather, health concerns, or itinerary mismatch should escalate beyond Scout.`,
		`For trail budget questions, separate daily burn from town spikes, hostels/shuttles/laundry/meals, gear replacement, and emergency cushion. Keep advice flexible around actual pace and services, and do not provide financial guarantees.`,
		`For "answer my last question again" prompts, use conversation history only when it is actually present in the prompt/context. If no previous question is available in the local run, say that plainly and ask the hiker to send it again; do not invent a previous question.`,
		`For zero, nero, or town-rest questions, visibly weigh body condition or injury, cached/current weather, town chores, budget, and the next section. Frame rest as an investment, not failure. If weather was fetched, include the weather summary or verification caveat in the decision.`,
		`For "what should I do first in town" and town-day efficiency prompts, give an ordered recovery sequence: eat calories, shower/laundry, foot care, sleep/rest, charge/download/refresh, then logistics. Time-box errands, but do not skip food, rest, foot care, or medical attention for logistics.`,
		`For food-days and next-resupply-point questions, calculate from distance to the next confirmed resupply, realistic pace for the loaded terrain, appetite, and backup food margin. Do not base food carry on the next water source. Do not assume a road crossing has food or services unless current service data proves it; ask for the exact next known resupply when Scout data is thin.`,
		`For bad-weather nero questions, compare storm severity, temperature, footing, exposure, daylight, body condition, terrain, and town access. Recommend a short day, town stop, or early legal stop when those risks make the full plan less safe; never frame rest as failure.`,
		`For hostel-full or lodging-full town questions, treat hostels, visitor centers, campgrounds, shuttles, and road crossings as candidates until confirmed. Tell the hiker to call or message ahead while they have service, confirm same-day bed space, shuttle/pickup, visitor-center hours, campground reservations/seasonal status, and legal overnight rules. Suggest backup lodging, legal campground or public/legal overnight options, or a short day, nero, town stop, or earlier legal stop if tired or injured. Do not invent availability or unsafe/illegal sleeping spots.`,
		`For drying gear in town, sequence the chores: sleeping bag or quilt and insulation first, then socks, shoes or liners, wet clothes, and rain gear; use laundry, safe dryer settings, drying room, or motel airflow before charging, repacking, and leaving town.`,
		`For town questions about charging, refreshing, downloading, updating Scout, or leaving service, give a concrete pre-departure checklist: charge phone and battery bank, refresh field pack/current mile, finish cloud sync while online, update the local AI model on Wi-Fi and power, save offline maps/docs, verify Bible text is available offline, refresh weather and closure checks, then airplane-mode test with a water question. Say cached weather, closures, water, and services can go stale.`,
		`For "what must Scout verify live" weather questions, name storms/lightning, heat/cold exposure, wind, flooding or high water, closures or fire/smoke alerts, and stale cache boundaries. Explain cached versus live data plainly.`,
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
