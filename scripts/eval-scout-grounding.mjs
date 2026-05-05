#!/usr/bin/env node
import assert from 'node:assert/strict';
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

console.log('Scout grounding eval passed: Pine Grove route order, blocked endpoints, bad mileage, and day options are guarded.');
