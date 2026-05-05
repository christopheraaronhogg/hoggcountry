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


const clawAgentSource = readFileSync(new URL('../apps/openclaw-web/src/lib/server/claw-agent.ts', import.meta.url), 'utf8');
const replyFunctionStart = clawAgentSource.indexOf('export async function replyInWorkspaceClaw');
const strictReplyIndex = clawAgentSource.indexOf('const strictRouteReply = await buildStrictAtRouteItineraryReply', replyFunctionStart);
const runtimeResolveIndex = clawAgentSource.indexOf('const runtime = await resolveClawRuntime(record);', replyFunctionStart);
assert.ok(replyFunctionStart >= 0 && strictReplyIndex >= 0 && runtimeResolveIndex >= 0, 'Strict reply/provider runtime wiring should remain findable');
assert.ok(strictReplyIndex < runtimeResolveIndex, 'Strict deterministic route replies must run before provider runtime resolution so missing API credentials do not block validator-only answers');
assert.ok(clawAgentSource.includes('deterministicClawTurn(record, null, trimmedPrompt, strictRouteReply)'), 'Strict route replies should be recorded as system/strict-route-validator turns, not as cloud model turns');

console.log('Scout grounding eval passed: Pine Grove and GSMNP route order, blocked endpoints, bad mileage, providerless strict replies, and camping-rule guardrails are active.');
