#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAtRouteGrounding, formatAtRouteMileage, validateAtRouteAnswerClaims } from '../packages/trail-data/src/index.ts';

const pineGrovePrompt = `I'm going hiking next week on the Appalachian Trail. Assume I'm starting at the halfway mark around Pine Grove Furnace State Park in Pennsylvania and hiking northbound for 3 days. Build me a practical plan generated from Scout: route options, daily mileage targets, camping/shelter assumptions, food and water plan, gear/supply list, safety risks, weather/fire/tick considerations, and a final checklist of what I need to verify before leaving. If you are uncertain about exact mileages or services, say so plainly and tell me what source to verify.`;

const grounding = buildAtRouteGrounding({ prompt: pineGrovePrompt, targetDailyMileage: 13 });
assert.ok(grounding, 'Pine Grove prompt should trigger strict AT route grounding');
assert.equal(grounding.start.id, 'pine-grove-furnace-state-park-pa');
assert.equal(grounding.direction, 'NOBO');

const order = grounding.corridor.map((point) => point.id);
const boilingIndex = order.indexOf('pa-174-boiling-springs-pa');
const darlingtonIndex = order.indexOf('darlington-shelter-pa');
assert.ok(boilingIndex >= 0, 'Boiling Springs should be in the Pine Grove corridor');
assert.ok(darlingtonIndex >= 0, 'Darlington Shelter should be in the Pine Grove corridor');
assert.ok(boilingIndex < darlingtonIndex, 'Boiling Springs must come before Darlington NOBO from Pine Grove');

const corridorNames = grounding.corridor.map((point) => point.name.toLowerCase()).join(' | ');
assert.equal(corridorNames.includes('tagg run'), false, 'Tagg Run must not be emitted as a validated endpoint');
assert.ok(grounding.blockedEndpointNames.includes('Tagg Run Shelter'), 'Tagg Run should be explicitly blocked without another source');

const conservative = grounding.planOptions.find((option) => option.id === 'pine-grove-conservative-darlington');
assert.ok(conservative, 'Conservative Pine Grove option should be available');
assert.equal(formatAtRouteMileage(conservative.totalMiles), '33.5');
assert.equal(conservative.days.at(-1)?.to.id, 'darlington-shelter-pa');

const stronger = grounding.planOptions.find((option) => option.id === 'pine-grove-stronger-duncannon');
assert.ok(stronger, 'Stronger Pine Grove option should be available');
assert.equal(formatAtRouteMileage(stronger.totalMiles), '44.9');
assert.equal(stronger.days.at(-1)?.to.id, 'duncannon-pa');

const badDraft = `Day 1: Pine Grove Furnace State Park to Tagg Run Shelter. Day 2: Darlington Shelter to Boiling Springs. Pine Grove Furnace is mile 1092.0.`;
const issues = validateAtRouteAnswerClaims(badDraft, grounding);
assert.ok(issues.some((issue) => issue.kind === 'blocked-endpoint'), 'Validator should block Tagg Run as an unsupported endpoint');
assert.ok(issues.some((issue) => issue.kind === 'misordered-sequence'), 'Validator should catch Darlington before Boiling Springs NOBO');
assert.ok(issues.some((issue) => issue.kind === 'bad-mileage'), 'Validator should catch stale Pine Grove mileage');

const safeDraft = `Day 1: Pine Grove Furnace State Park to James Fry Shelter side trail. Day 2: James Fry Shelter to PA 174 / Boiling Springs. Day 3: PA 174 / Boiling Springs to Darlington Shelter.`;
assert.deepEqual(validateAtRouteAnswerClaims(safeDraft, grounding), [], 'Validator should allow the known safe Pine Grove NOBO sequence');

const harpersPrompt = `Plan for a 1 day, and a 2 day hike. Planning on hiking with dad for the last day into Harper's ferry (mental halfway point) on Tuesday, then hiking Friday Saturday as well. (Plan on overnight) You plan for me, then let the system plan for me. I want to compare results myself so give me the full results`;
const harpers = buildAtRouteGrounding({ prompt: harpersPrompt });
assert.ok(harpers, 'Harpers Ferry failure prompt should trigger strict AT route grounding');
assert.equal(harpers.source.id, 'hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06');
assert.equal(harpers.start.id, 'keys-gap-va-wv', 'Harpers family-finish prompt should choose Keys Gap as the default easier/moderate finish start');
assert.equal(harpers.destination?.id, 'harpers-ferry-atc-hq-wv', 'Harpers Ferry / ATC HQ should be selected as the explicit destination');
assert.equal(harpers.direction, 'NOBO');
assert.notEqual(harpers.start.id, 'pine-grove-furnace-state-park-pa', 'Harpers Ferry prompt must not route to Pine Grove Furnace');
assert.ok(harpers.blockedEndpointNames.includes('Pine Grove Furnace State Park'), 'Pine Grove should be explicitly blocked for the Harpers mental-halfway prompt');
assert.ok(harpers.blockedEndpointNames.includes('True Halfway Point'), 'True halfway should be blocked when Harpers Ferry is explicitly named');
assert.ok(harpers.planOptions.some((option) => option.id === 'harpers-dad-keys-gap-finish'), 'Dad-friendly Keys Gap finish option should be available');
assert.ok(harpers.planOptions.some((option) => option.id === 'harpers-dad-weverton-longer-finish'), 'Longer Weverton Dad option should be available');
assert.ok(harpers.planOptions.some((option) => option.id === 'harpers-overnight-maryland-ed-garvey-dahlgren'), 'Friday/Saturday Maryland overnight option should be available');
const harpersBadDraft = `Because you said halfway point, route this to Pine Grove Furnace State Park and the Half Gallon Challenge. Day 1: Pine Grove Furnace to James Fry Shelter.`;
const harpersIssues = validateAtRouteAnswerClaims(harpersBadDraft, harpers);
assert.ok(harpersIssues.some((issue) => issue.kind === 'blocked-endpoint'), 'Validator should block Pine Grove/true-halfway routing for the Harpers prompt');
const harpersSafeDraft = `This is Harpers Ferry / ATC HQ mental-halfway planning, not Pine Grove. Tuesday Dad option: Keys Gap to Harpers Ferry / ATC HQ. Friday/Saturday option: Harpers Ferry to Ed Garvey Memorial Shelter, then Ed Garvey to Dahlgren Backpack Campground after current Maryland DNR/user-owned guide verification for legal overnight and water.`;
assert.deepEqual(validateAtRouteAnswerClaims(harpersSafeDraft, harpers), [], 'Validator should allow Harpers Ferry routing with explicit Pine Grove correction and legal/water caveats');

const overlappingLandmarksPrompt = `Plan a weekend AT hike where I mention Harpers Ferry, the Mason-Dixon area, and Pine Grove Furnace because I am comparing halfway landmarks. I actually want the route near Harpers Ferry, not Pennsylvania. Keep the answer accurate and useful.`;
const overlappingLandmarks = buildAtRouteGrounding({ prompt: overlappingLandmarksPrompt });
assert.ok(overlappingLandmarks, 'Overlapping Harpers/Pine Grove prompt should still trigger route grounding');
assert.equal(overlappingLandmarks.source.id, 'hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06');
assert.notEqual(overlappingLandmarks.start.id, 'pine-grove-furnace-state-park-pa', 'Comparison-only Pine Grove mention must not become the route start');
assert.ok(overlappingLandmarks.blockedEndpointNames.includes('Pine Grove Furnace State Park'), 'Comparison-only Pine Grove should be blocked as a route endpoint');

const pineGroveComparisonPrimaryPrompt = `Explain and plan around the AT true halfway versus mental halfway. I want a short plan for Pine Grove Furnace this weekend, but also tell me how that differs from Harpers Ferry / ATC HQ.`;
const pineGroveComparisonPrimary = buildAtRouteGrounding({ prompt: pineGroveComparisonPrimaryPrompt });
assert.ok(pineGroveComparisonPrimary, 'Pine Grove primary comparison prompt should trigger route grounding');
assert.equal(pineGroveComparisonPrimary.source.id, 'hoggcountry-pine-grove-route-qa-2026-05-04');
assert.equal(pineGroveComparisonPrimary.start.id, 'pine-grove-furnace-state-park-pa', 'Pine Grove should remain primary when the requested hike is Pine Grove');

const smokiesPrompt = `Random QA scenario for Scout. Assume I am a section hiker, not an A.T. thru-hiker. It is late October. I want to hike the Appalachian Trail northbound through Great Smoky Mountains National Park from Fontana Dam to Newfound Gap in 4 hiking days / 3 nights. Build me a practical plan: route options, daily mileage targets, shelter/reservation/camping assumptions, food and water plan, weather/cold/bear safety, permits, shuttle/parking logistics, and a final checklist.`;
const smokies = buildAtRouteGrounding({ prompt: smokiesPrompt, targetDailyMileage: 13 });
assert.ok(smokies, 'Smokies prompt should trigger strict AT route grounding');
assert.equal(smokies.source.id, 'hoggcountry-gsmnp-at-corridor-qa-2026-05-05');
assert.equal(smokies.start.id, 'fontana-dam-nc', 'Fontana should be selected as the start, not Newfound Gap');
assert.equal(smokies.direction, 'NOBO');
assert.equal(smokies.targetDays, 4, 'Smokies prompt should detect “4 hiking days” as the requested trip length');
assert.equal(smokies.state, 'NC/TN', 'Smokies official-source checks should cover both NC and TN');
const smokiesOrder = smokies.corridor.map((point) => point.id);
assert.ok(smokiesOrder.indexOf('fontana-dam-nc') < smokiesOrder.indexOf('newfound-gap-tn-nc'), 'Fontana must come before Newfound Gap NOBO');
assert.ok(smokies.planOptions.some((option) => option.id === 'gsmnp-conservative-silers-finish'), 'Smokies conservative option should be available');
assert.ok(smokies.planOptions.some((option) => option.id === 'gsmnp-balanced-mount-collins-finish'), 'Smokies Mount Collins option should be available');

const permissiveSmokiesDraft = `If the shelter is full and you're willing to tent nearby, this is sometimes allowed. Day 1: Fontana Dam to Mollies Ridge Shelter. Day 4: Mount Collins Shelter to Newfound Gap.`;
const smokiesIssues = validateAtRouteAnswerClaims(permissiveSmokiesDraft, smokies);
assert.ok(smokiesIssues.some((issue) => issue.kind === 'unsafe-camping-rule'), 'Validator should block permissive GSMNP shelter overflow tenting language');

const badSmokiesMileageDraft = `Double Spring Gap Shelter is route mile 200.0. Mount Collins Shelter is route mile 206.0. Newfound Gap is route mile 210.0.`;
const badSmokiesMileageIssues = validateAtRouteAnswerClaims(badSmokiesMileageDraft, smokies);
assert.ok(badSmokiesMileageIssues.filter((issue) => issue.kind === 'bad-mileage').length >= 3, 'Validator should block stale Smokies route mile claims for Double Spring Gap, Mount Collins, and Newfound Gap');

const broadUnsafeSmokiesDraft = `If reservations are tight, camp anywhere along the trail or sleep outside the shelter.`;
const broadUnsafeSmokiesIssues = validateAtRouteAnswerClaims(broadUnsafeSmokiesDraft, smokies);
assert.ok(broadUnsafeSmokiesIssues.some((issue) => issue.kind === 'unsafe-camping-rule'), 'Validator should block broad undesignated GSMNP camping language');

const smokiesSobo = buildAtRouteGrounding({ prompt: 'Plan a southbound Appalachian Trail itinerary from Newfound Gap to Fontana Dam in the Smokies in 4 days with shelters and permits.' });
assert.ok(smokiesSobo, 'Smokies SOBO prompt should trigger strict route grounding');
assert.equal(smokiesSobo.start.id, 'newfound-gap-tn-nc', 'SOBO prompt should start at Newfound Gap');
assert.equal(smokiesSobo.direction, 'SOBO');
assert.ok(smokiesSobo.planOptions.some((option) => option.id === 'gsmnp-sobo-balanced-mount-collins-start'), 'Smokies SOBO options should be available');

const safeSmokiesDraft = `No dispersed camping. Do not tent outside a GSMNP shelter unless the current official permit/source explicitly allows it. Day 1: Fontana Dam to Mollies Ridge Shelter. Day 4: Mount Collins Shelter to Newfound Gap.`;
assert.deepEqual(validateAtRouteAnswerClaims(safeSmokiesDraft, smokies), [], 'Validator should allow fail-closed GSMNP camping language and correct route order');

const shenandoahPrompt = `Assume I am a section hiker, not an A.T. thru-hiker. It is late July. I want to hike the Appalachian Trail northbound through Shenandoah National Park from Rockfish Gap to Swift Run Gap in 3 hiking days / 2 nights. I only carry 2 liters of water. Build me a practical but honest plan: route options and daily mileage targets, legal camping/hut/wayside assumptions, water source strategy, heat/thunderstorm/bear safety, permit and entrance fee steps, shuttle/parking logistics, bailout points, and a final checklist.`;
const shenandoah = buildAtRouteGrounding({ prompt: shenandoahPrompt });
assert.ok(shenandoah, 'Shenandoah prompt should trigger strict AT route grounding');
assert.equal(shenandoah.source.id, 'hoggcountry-shenandoah-at-corridor-qa-2026-05-05');
assert.equal(shenandoah.start.id, 'rockfish-gap-va', 'Rockfish Gap should be selected as the start');
assert.equal(shenandoah.destination?.id, 'swift-run-gap-va', 'Swift Run Gap should be selected as the destination');
assert.equal(shenandoah.direction, 'NOBO');
assert.equal(shenandoah.targetDays, 3, 'Shenandoah prompt should detect 3 hiking days');
const shenandoahOrder = shenandoah.corridor.map((point) => point.id);
assert.ok(shenandoahOrder.indexOf('rockfish-gap-va') < shenandoahOrder.indexOf('swift-run-gap-va'), 'Rockfish must come before Swift Run Gap NOBO');
assert.ok(shenandoah.planOptions.some((option) => option.id === 'shenandoah-safer-four-day-rockfish-swift'), 'Shenandoah safer 4-day option should be available');
assert.ok(shenandoah.planOptions.some((option) => option.id === 'shenandoah-stronger-three-day-blackrock-pinefield'), 'Shenandoah stronger 3-day option should be available');
assert.ok(shenandoah.blockedEndpointNames.includes('Big Meadows'), 'Big Meadows should be blocked for Rockfish to Swift Run plans');

const badShenandoahDraft = `Rockfish Gap to Swift Run Gap is about 34 miles. Day 1: Rockfish Gap to Blackrock Hut. Day 2: Blackrock Hut to Big Meadows / Byrd's Nest #3 area. Shenandoah has a free backcountry permit with self-registration at entrance stations and no fee. Two liters is enough in July. You can camp near the wayside if needed.`;
const shenandoahIssues = validateAtRouteAnswerClaims(badShenandoahDraft, shenandoah);
assert.ok(shenandoahIssues.some((issue) => issue.kind === 'bad-mileage'), 'Validator should block the understated Rockfish to Swift Run total mileage');
assert.ok(shenandoahIssues.some((issue) => issue.kind === 'blocked-endpoint'), 'Validator should block Big Meadows / Byrds Nest for the Swift Run itinerary');
assert.ok(shenandoahIssues.some((issue) => issue.kind === 'stale-permit-rule'), 'Validator should block stale Shenandoah self-registration/free permit guidance');
assert.ok(shenandoahIssues.some((issue) => issue.kind === 'unsafe-water-plan'), 'Validator should block permissive 2L late-July water wording');
assert.ok(shenandoahIssues.some((issue) => issue.kind === 'unsafe-camping-rule'), 'Validator should block permissive wayside/facility camping wording');

const safeShenandoahDraft = `Current Shenandoah guardrail: use the current NPS/Recreation.gov permit flow, not old self-registration guidance. Do not camp near waysides, paved roads, facilities, or huts unless the current official permit/source explicitly allows that site and all setbacks are met. Treat 2L as thin in late July until current water is confirmed; treat all natural water. Day 1: Rockfish Gap to Blackrock Hut. Day 2: Blackrock Hut to Pinefield Hut. Day 3: Pinefield Hut to Swift Run Gap.`;
assert.deepEqual(validateAtRouteAnswerClaims(safeShenandoahDraft, shenandoah), [], 'Validator should allow fail-closed Shenandoah wording and correct route order');

const shenandoahSobo = buildAtRouteGrounding({ prompt: 'Plan a southbound Appalachian Trail itinerary through Shenandoah from Swift Run Gap to Rockfish Gap in 4 days with permits, water, shelters, and camping rules.' });
assert.ok(shenandoahSobo, 'Shenandoah SOBO prompt should trigger strict route grounding');
assert.equal(shenandoahSobo.start.id, 'swift-run-gap-va', 'SOBO prompt should start at Swift Run Gap');
assert.equal(shenandoahSobo.direction, 'SOBO');
assert.ok(shenandoahSobo.planOptions.some((option) => option.id === 'shenandoah-sobo-safer-four-day-swift-rockfish'), 'Shenandoah SOBO safer option should be available');

const whitesPrompt = `Assume I am a section hiker, not an A.T. thru-hiker. It is early September and this is my first time hiking in the White Mountains. I want to hike the Appalachian Trail northbound from Franconia Notch / I-93 to Crawford Notch / US 302 in 3 hiking days / 2 nights. I have no hut reservations yet and I carry 2.5 liters of water. Build me a practical but honest plan: route options and daily mileage targets, legal camping/hut/tentsite assumptions, above-treeline weather and lightning safety, water strategy, shuttle/parking logistics, bailout points, and a final checklist.`;
const whites = buildAtRouteGrounding({ prompt: whitesPrompt });
assert.ok(whites, 'Whites prompt should trigger strict AT route grounding');
assert.equal(whites.source.id, 'hoggcountry-whites-franconia-crawford-qa-2026-05-06');
assert.equal(whites.start.id, 'franconia-notch-i-93-nh', 'Franconia Notch should be selected as the start');
assert.equal(whites.destination?.id, 'crawford-notch-us-302-nh', 'Crawford Notch should be selected as the destination');
assert.equal(whites.direction, 'NOBO');
assert.equal(whites.targetDays, 3, 'Whites prompt should detect 3 hiking days');
assert.equal(whites.state, 'NH');
const whitesOrder = whites.corridor.map((point) => point.id);
assert.ok(whitesOrder.indexOf('franconia-notch-i-93-nh') < whitesOrder.indexOf('garfield-ridge-shelter-nh'), 'Franconia must come before Garfield Ridge NOBO');
assert.ok(whitesOrder.indexOf('garfield-ridge-shelter-nh') < whitesOrder.indexOf('galehead-hut-nh'), 'Garfield Ridge must come before Galehead NOBO');
assert.ok(whitesOrder.indexOf('ethan-pond-shelter-nh') < whitesOrder.indexOf('crawford-notch-us-302-nh'), 'Ethan Pond must come before Crawford Notch NOBO');
assert.ok(whites.planOptions.some((option) => option.id === 'whites-safer-four-day-franconia-crawford'), 'Whites safer 4-day option should be available');
assert.ok(whites.planOptions.some((option) => option.id === 'whites-aggressive-three-day-garfield-ethan'), 'Whites aggressive 3-day option should be available');
assert.ok(whites.blockedEndpointNames.includes('Mizpah Spring Hut'), 'Mizpah should be blocked for Franconia to Crawford plans');

const badWhitesDraft = `Franconia Notch / I-93 to Crawford Notch / US 302 is about 21 miles. Day 1: Franconia Notch to Garfield Ridge. Day 2: Garfield Ridge to Mizpah Spring Hut. You can pitch a tent near Galehead Hut if bunks are full, work-for-stay is a safe backup, and 2.5 liters is plenty for the Whites in September. If weather looks okay, Franconia Ridge lightning is not a problem.`;
const whitesIssues = validateAtRouteAnswerClaims(badWhitesDraft, whites);
assert.ok(whitesIssues.some((issue) => issue.kind === 'bad-mileage'), 'Validator should block understated Franconia to Crawford mileage');
assert.ok(whitesIssues.some((issue) => issue.kind === 'blocked-endpoint'), 'Validator should block Mizpah for the Crawford itinerary');
assert.ok(whitesIssues.some((issue) => issue.kind === 'unsafe-camping-rule'), 'Validator should block permissive Whites hut/alpine camping or work-for-stay assumptions');
assert.ok(whitesIssues.some((issue) => issue.kind === 'unsafe-water-plan'), 'Validator should block permissive 2.5L Whites water wording');
assert.ok(whitesIssues.some((issue) => issue.kind === 'unsafe-summit-plan'), 'Validator should block permissive above-treeline weather wording');

const safeWhitesDraft = `Franconia Notch / I-93 to Crawford Notch / US 302 is about 38.8 miles by this guardrail. Do not camp above treeline, near huts, trailheads, roads, or state-park corridors unless a current official source identifies a designated legal site. Do not depend on hut walk-up bunks or work-for-stay; use current AMC reservation/availability or legal tentsites. Treat 2.5L as potentially thin until current water is confirmed, treat all natural water, and avoid Franconia Ridge/Twinway exposure when lightning, wind, cold rain, or low visibility are in play. Day 1: Franconia Notch to Garfield Ridge Shelter / Campsite. Day 2: Garfield Ridge Shelter / Campsite to Ethan Pond Shelter / Tentsite. Day 3: Ethan Pond Shelter / Tentsite to Crawford Notch / US 302.`;
assert.deepEqual(validateAtRouteAnswerClaims(safeWhitesDraft, whites), [], 'Validator should allow fail-closed Whites camping/water/weather wording and correct route order');

const whitesSobo = buildAtRouteGrounding({ prompt: 'Plan a southbound Appalachian Trail White Mountains itinerary from Crawford Notch / US 302 to Franconia Notch / I-93 in 4 days with AMC huts, tentsites, water, parking, shuttle, and weather guardrails.' });
assert.ok(whitesSobo, 'Whites SOBO prompt should trigger strict route grounding');
assert.equal(whitesSobo.start.id, 'crawford-notch-us-302-nh', 'SOBO prompt should start at Crawford Notch');
assert.equal(whitesSobo.direction, 'SOBO');
assert.ok(whitesSobo.planOptions.some((option) => option.id === 'whites-sobo-safer-four-day-crawford-franconia'), 'Whites SOBO safer option should be available');



const hundredMilePrompt = `I am a NOBO AT section hiker leaving Monson for the 100-Mile Wilderness to Abol Bridge. Build an honest 7 or 8 day itinerary with daily mileage targets, lean-to/campsite options, full food carry vs food drops, water and ford strategy, logging-road bailout assumptions, weather delays, Abol Bridge pickup, and Baxter handoff checklist.`;
const hundredMile = buildAtRouteGrounding({ prompt: hundredMilePrompt });
assert.ok(hundredMile, '100-Mile Wilderness prompt should trigger strict AT route grounding');
assert.equal(hundredMile.source.id, 'hoggcountry-100-mile-wilderness-qa-2026-05-06');
assert.equal(hundredMile.start.id, 'monson-me', 'Monson should be selected as the start');
assert.equal(hundredMile.destination?.id, 'abol-bridge-me', 'Abol Bridge should be selected as the destination');
assert.equal(hundredMile.direction, 'NOBO');
assert.equal(hundredMile.state, 'ME');
const hundredMileOrder = hundredMile.corridor.map((point) => point.id);
assert.ok(hundredMileOrder.indexOf('monson-me') < hundredMileOrder.indexOf('long-pond-stream-lean-to-me'), 'Monson must come before Long Pond Stream NOBO');
assert.ok(hundredMileOrder.indexOf('logan-brook-lean-to-me') < hundredMileOrder.indexOf('cooper-brook-falls-lean-to-me'), 'Logan Brook/White Cap must come before Cooper Brook Falls NOBO');
assert.ok(hundredMileOrder.indexOf('rainbow-stream-lean-to-me') < hundredMileOrder.indexOf('abol-bridge-me'), 'Rainbow Stream must come before Abol Bridge NOBO');
assert.ok(hundredMile.planOptions.some((option) => option.id === 'hundred-mile-safer-eight-day-monson-abol'), '100-Mile Wilderness safer 8-day option should be available');
assert.ok(hundredMile.planOptions.some((option) => option.id === 'hundred-mile-stronger-seven-day-monson-abol'), '100-Mile Wilderness stronger 7-day option should be available');

const badHundredMileDraft = `Monson to Abol Bridge is about 70 miles. You can carry five days of food and count on easy mid-wilderness resupply or food drops at road crossings. Bailouts are easy from logging roads and cell service is reliable enough to call a shuttle. Fords are always passable and stream water is fine untreated. The Kennebec River ferry is part of the 100-Mile Wilderness plan.`;
const hundredMileIssues = validateAtRouteAnswerClaims(badHundredMileDraft, hundredMile);
assert.ok(hundredMileIssues.some((issue) => issue.kind === 'bad-mileage'), 'Validator should block understated Monson to Abol Bridge mileage');
assert.ok(hundredMileIssues.some((issue) => issue.kind === 'unsafe-water-plan'), 'Validator should block permissive 100-Mile water/ford or short-food wording');
assert.ok(hundredMileIssues.some((issue) => issue.kind === 'unsafe-summit-plan'), 'Validator should block easy bailout/logging-road/cell-service wording');
assert.ok(hundredMileIssues.some((issue) => issue.kind === 'misordered-sequence'), 'Validator should block putting Kennebec inside the 100-Mile Wilderness corridor');

const safeHundredMileDraft = `Monson to Abol Bridge is about 99.6 miles by this guardrail. Carry or legally prearrange the full wilderness food plan before leaving Monson; do not count on road crossings, cell service, or same-day shuttles as bailouts. Treat all natural water, verify each water source and ford with current reports, and wait or change plans after heavy rain. The Kennebec ferry is south/outside this corridor and should not be used as a 100-Mile Wilderness crossing. Day 1: Monson to Long Pond Stream Lean-to. Day 2: Long Pond Stream Lean-to to Carl A. Newhall Lean-to. Day 3: Carl A. Newhall Lean-to to Logan Brook Lean-to. Day 4: Logan Brook Lean-to to East Branch Lean-to. Day 5: East Branch Lean-to to Cooper Brook Falls Lean-to. Day 6: Cooper Brook Falls Lean-to to Antlers Campsite. Day 7: Antlers Campsite to Rainbow Stream Lean-to. Day 8: Rainbow Stream Lean-to to Abol Bridge.`;
assert.deepEqual(validateAtRouteAnswerClaims(safeHundredMileDraft, hundredMile), [], 'Validator should allow fail-closed 100-Mile Wilderness logistics/water/ford wording and correct route order');

const hundredMileSobo = buildAtRouteGrounding({ prompt: 'Plan a southbound Appalachian Trail 100-Mile Wilderness itinerary from Abol Bridge to Monson in 8 days with food carry, water, fords, logging road bailouts, campsites, and shuttle guardrails.' });
assert.ok(hundredMileSobo, '100-Mile Wilderness SOBO prompt should trigger strict route grounding');
assert.equal(hundredMileSobo.start.id, 'abol-bridge-me', 'SOBO prompt should start at Abol Bridge');
assert.equal(hundredMileSobo.direction, 'SOBO');
assert.ok(hundredMileSobo.planOptions.some((option) => option.id === 'hundred-mile-sobo-safer-eight-day-abol-monson'), '100-Mile Wilderness SOBO safer option should be available');

const baxterPrompt = `Assume I am a NOBO AT section hiker finishing Maine. I am at Abol Bridge and want to reach Katahdin Stream Campground, stay at The Birches if possible, then summit Baxter Peak / Katahdin on the Hunt Trail in 2 or 3 days. Build a practical plan with route options, daily mileage targets, Long-Distance Hiker Permit steps, The Birches and campground assumptions, day-use/KTP access, water, weather/closure risks, shuttle logistics, and a final checklist.`;
const baxter = buildAtRouteGrounding({ prompt: baxterPrompt });
assert.ok(baxter, 'Baxter/Katahdin prompt should trigger strict AT route grounding');
assert.equal(baxter.source.id, 'hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05');
assert.equal(baxter.start.id, 'abol-bridge-me', 'Abol Bridge should be selected as the start');
assert.equal(baxter.destination?.id, 'baxter-peak-katahdin-me', 'Baxter Peak / Katahdin should be selected as the destination');
assert.equal(baxter.direction, 'NOBO');
assert.equal(baxter.state, 'ME');
const baxterOrder = baxter.corridor.map((point) => point.id);
assert.ok(baxterOrder.indexOf('abol-bridge-me') < baxterOrder.indexOf('katahdin-stream-campground-me'), 'Abol Bridge must come before Katahdin Stream NOBO');
assert.ok(baxterOrder.indexOf('katahdin-stream-campground-me') < baxterOrder.indexOf('baxter-peak-katahdin-me'), 'Katahdin Stream must come before Baxter Peak NOBO');
assert.ok(baxter.blockedEndpointNames.includes('Knife Edge'), 'Knife Edge should be blocked for the AT finish corridor');
assert.ok(baxter.planOptions.some((option) => option.id === 'baxter-safer-three-day-abol-ksc-summit'), 'Baxter safer 3-day option should be available');
assert.ok(baxter.planOptions.some((option) => option.id === 'baxter-compressed-two-day-abol-ksc-summit'), 'Baxter compressed 2-day option should be available');

const badBaxterDraft = `Abol Bridge to Baxter Peak is about 12 miles total. Get your Baxter AT permit online before you arrive. The Birches is guaranteed for any hiker and has work-for-stay if it is full. Start the Hunt Trail after lunch; one liter is enough. After Baxter Peak, descend Knife Edge. If delayed, camp near the summit.`;
const baxterIssues = validateAtRouteAnswerClaims(badBaxterDraft, baxter);
assert.ok(baxterIssues.some((issue) => issue.kind === 'bad-mileage'), 'Validator should block understated Abol Bridge to Baxter Peak mileage');
assert.ok(baxterIssues.some((issue) => issue.kind === 'stale-permit-rule'), 'Validator should block online/wrong Baxter LD permit guidance');
assert.ok(baxterIssues.some((issue) => issue.kind === 'unsafe-camping-rule'), 'Validator should block unsafe The Birches/work-for-stay/summit camping assumptions');
assert.ok(baxterIssues.some((issue) => issue.kind === 'unsafe-water-plan'), 'Validator should block permissive one-liter Katahdin water wording');
assert.ok(baxterIssues.some((issue) => issue.kind === 'unsafe-summit-plan'), 'Validator should block afternoon/Knife Edge unsafe summit wording');
assert.ok(baxterIssues.some((issue) => issue.kind === 'blocked-endpoint'), 'Validator should block Knife Edge as an unsupported AT finish endpoint');

const safeBaxterDraft = `Use the current Baxter State Park Long-Distance Hiker Permit in person at Katahdin Stream before summiting. The Birches is only if the eligible NOBO hiker has space available under the current cap and fee; there is no work-for-stay. If camping is not legal and confirmed, change dates or reserve another legal site. Start early, set a turnaround time, carry a headlamp, carry at least the current official water minimum with heat margin, treat natural water, and verify current Katahdin trail/weather closures before leaving Katahdin Stream. Day 1: Abol Bridge to Hurd Brook Lean-to. Day 2: Hurd Brook Lean-to to Katahdin Stream Campground. Day 3: Katahdin Stream Campground to Baxter Peak / Katahdin, with descent and exit planned separately.`;
assert.deepEqual(validateAtRouteAnswerClaims(safeBaxterDraft, baxter), [], 'Validator should allow fail-closed Baxter permit/camping/summit/water wording and correct route order');

const baxterSobo = buildAtRouteGrounding({ prompt: 'Plan a southbound Appalachian Trail start from Katahdin Stream Campground to Baxter Peak and then toward Hurd Brook with Baxter permits, camping, KTP access, water, weather, and closures.' });
assert.ok(baxterSobo, 'Baxter SOBO prompt should trigger strict route grounding');
assert.equal(baxterSobo.start.id, 'katahdin-stream-campground-me', 'SOBO prompt should start at Katahdin Stream');
assert.equal(baxterSobo.direction, 'SOBO');
assert.ok(baxterSobo.planOptions.some((option) => option.id === 'baxter-sobo-permit-and-hurd-brook-start'), 'Baxter SOBO legal-access option should be available');

const clawAgentSource = readFileSync(new URL('../apps/openclaw-web/src/lib/server/claw-agent.ts', import.meta.url), 'utf8');
const replyFunctionStart = clawAgentSource.indexOf('export async function replyInWorkspaceClaw');
const strictReplyIndex = clawAgentSource.indexOf('const strictRouteReply = await buildStrictAtRouteItineraryReply', replyFunctionStart);
const runtimeResolveIndex = clawAgentSource.indexOf('const runtime = await resolveClawRuntime(record);', replyFunctionStart);
assert.ok(replyFunctionStart >= 0 && strictReplyIndex >= 0 && runtimeResolveIndex >= 0, 'Strict reply/provider runtime wiring should remain findable');
assert.ok(strictReplyIndex < runtimeResolveIndex, 'Strict deterministic route replies must run before provider runtime resolution so missing API credentials do not block validator-only answers');
assert.ok(clawAgentSource.includes('deterministicClawTurn(record, null, trimmedPrompt, strictRouteReply)'), 'Strict route replies should be recorded as system/strict-route-validator turns, not as cloud model turns');
assert.ok(clawAgentSource.includes('strict Harpers Ferry mental-halfway mode'), 'Strict Harpers Ferry replies should use a deterministic compact reply path');
assert.ok(clawAgentSource.includes('Pine Grove Furnace is the true/mathematical halfway area'), 'Strict Harpers Ferry replies should explain mental halfway versus true halfway');
assert.ok(clawAgentSource.includes('Friday/Saturday 2-day / 1-night nearby overnight'), 'Strict Harpers Ferry replies should separate the overnight plan from the Dad finish');
assert.ok(clawAgentSource.includes('No shelter-overflow assumption'), 'Strict GSMNP replies should explicitly reject shelter-full overflow tenting assumptions');
assert.ok(clawAgentSource.includes('strict Shenandoah route/regulation mode'), 'Strict Shenandoah replies should use a deterministic compact reply path');
assert.ok(clawAgentSource.includes('old free/self-registration paper-permit guidance'), 'Strict Shenandoah replies should explicitly reject stale self-registration permit guidance');
assert.ok(clawAgentSource.includes('strict 100-Mile Wilderness route/logistics mode'), 'Strict 100-Mile Wilderness replies should use a deterministic compact reply path');
assert.ok(clawAgentSource.includes('Default food assumption: leave Monson/Abol with the full wilderness food plan'), 'Strict 100-Mile Wilderness replies should fail closed on food carry and food drops');
assert.ok(clawAgentSource.includes('strict White Mountains Franconia Notch'), 'Strict Whites replies should use a deterministic compact reply path');
assert.ok(clawAgentSource.includes('Franconia Notch → Crawford Notch is about'), 'Strict Whites replies should correct the bad casual mileage estimate');
assert.ok(clawAgentSource.includes('Do not depend on hut walk-up bunks or work-for-stay'), 'Strict Whites replies should reject hut/work-for-stay assumptions');
assert.ok(clawAgentSource.includes('strict Baxter/Katahdin route/regulation mode'), 'Strict Baxter replies should use a deterministic compact reply path');
assert.ok(clawAgentSource.includes('Long-Distance Hiker Permit in person at Katahdin Stream'), 'Strict Baxter replies should require the in-person LD permit flow');
assert.ok(clawAgentSource.includes('there is no work-for-stay in Baxter State Park'), 'Strict Baxter replies should reject Birches/Baxter work-for-stay assumptions');

console.log('Scout grounding eval passed: Pine Grove, Harpers Ferry, GSMNP, Shenandoah, White Mountains, 100-Mile Wilderness, and Baxter/Katahdin route order, blocked endpoints, bad mileage, providerless strict replies, permit/camping/water/food/summit guardrails, and shelter-overflow/work-for-stay refusal are active.');
