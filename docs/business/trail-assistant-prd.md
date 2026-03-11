# Trail Assistant PRD

Last updated: 2026-03-11
Status: Draft for implementation alignment

## 1. Summary

Trail Assistant is the personal trail-ops layer for Hogg Country. The product should feel to Appalachian Trail hikers the way WHOOP feels to athletes: a daily operating system that turns raw signals into a clear recommendation, adapts when reality changes, and provides a trusted escalation path when the user needs a human.

The product is not just AI chat. It combines:
- daily readiness scoring
- adaptive itinerary planning
- town and logistics coordination
- safety check-ins and escalation
- human concierge support
- a partner network of hostels, shuttle operators, and local experts

## 2. Product thesis

The strongest current AT support businesses do not merely sell lodging or guided miles. They sell lower uncertainty.

Trail Assistant should package that value into software plus operations:
- before trail: plan the hike
- on trail: decide what to do today
- when conditions change: adapt the next 7 days
- when stakes are high: escalate to a real person fast

## 3. Opportunity

Current AT support is fragmented across:
- guidebooks and static planning content
- FarOut comments and manual note-taking
- hostels and shuttle operators with regional expertise
- outfitters doing ad hoc gear shakedowns
- texting friends and family for logistics or reassurance

There is room for a product that unifies those workflows into a single hiker-facing system.

## 4. Product principles

- **Trail first**: mobile, offline-aware, one-thumb, low-cognitive-load UX.
- **Action over information**: each screen should tell the hiker what to do next.
- **Confidence through context**: recommendations should reflect the user’s route, recent effort, weather, and logistics.
- **Human backup**: software handles routine support; humans handle uncertainty, urgency, and trust-sensitive work.
- **Safety by default**: privacy-preserving sharing, explicit escalation controls, abuse resistance, and auditable workflows.
- **Partner-leveraged moat**: the product should improve as partner data and operational relationships deepen.

## 5. Target users

### Primary
- **Thru-hiker in preparation**
  - needs gear, pace, budget, and start-date planning
- **Thru-hiker on trail**
  - needs daily decisions, town planning, recovery guidance, and logistics support

### Secondary
- **Section hiker**
  - needs lighter-weight itinerary and shuttle support
- **Family/friend support circle**
  - wants confidence, check-ins, and limited visibility into ETA/safety
- **Trail concierge / moderator**
  - works the queue when AI confidence is low or operational work is required

## 6. Jobs to be done

When I am preparing for the AT, help me build a realistic plan that matches my body, budget, and goals.

When I am on trail and tired, cold, wet, low-signal, or behind schedule, tell me the best next move without making me do a bunch of trail math.

When town logistics get messy, help me secure the next safe and efficient option.

When I am at risk or uncertain, make it easy to get a real person involved.

## 7. Goals

### User goals
- know whether today is a push, hold, nero, zero, or slackpack day
- maintain a realistic 7-day plan
- reduce avoidable town/logistics mistakes
- improve confidence for solo hikers and support circles

### Business goals
- create a season-priced premium product with strong recurring value during the hike
- build a differentiated service layer that generic chat products cannot easily copy
- convert hostels/shuttles/outfitters into distribution and data partners

## 8. Non-goals

- replace official permitting, land-management, or safety instructions
- operate as a trailwide commercial guiding service
- build custom wearable hardware in v1
- replace every function of FarOut in the first release
- create a broad social network for hikers in v1

## 9. Core experience

### WHOOP translation

| WHOOP concept | Trail Assistant equivalent |
|---|---|
| Recovery | Trail Readiness |
| Strain target | Today’s Trail Target |
| Weekly Plan | Rolling 7-Day Trail Plan |
| Journal | Trail Log |
| Coach | Trail Coach |
| Health monitor | Safety + Check-In system |

### Core screens

#### Today
- Trail Readiness score
- recommended mileage and elevation target
- top risk flags for weather, recovery, foot issues, and schedule drift
- next water / shelter / town / shuttle cue

#### Plan
- rolling 7-day itinerary
- recommended camp/hostel sequence
- resupply and mail-drop needs
- budget impact and weather pivots

#### Coach
- AI assistant grounded in the hiker’s current plan, context, and history
- quick actions: weather, mileage, town, gear, injury, shuttle
- clear escalation path to human support

#### Town
- hostel and shuttle options
- laundry, showers, breakfast, resupply, fuel, and mail-drop intelligence
- partner status if available: bed space, pickup windows, closures, service hours

#### Map
- current segment context
- next services and bailout points
- trail hazards and closures
- privacy-aware map sharing when enabled

#### Safety
- check-ins
- missed-check-in handling
- emergency escalation
- support-circle and responder workflows

## 10. Human concierge model

Trail Assistant should feel autonomous for routine use, but it must not pretend every hard situation is fully automatable.

### Human escalation triggers
- injury, illness, or sustained fatigue risk
- severe weather or closure-driven reroute
- same-day lodging or shuttle coordination
- ambiguous or high-stakes safety situations
- missed check-ins or family concern
- low-confidence model response

### Concierge outcomes
- revised itinerary
- booked or coordinated shuttle/hostel path
- resupply or mail-drop instructions
- safety callback and escalation path
- partner follow-up

### Service level targets
- urgent safety/logistics: first human action in under 10 minutes during staffed windows
- same-day town logistics: under 30 minutes
- standard planning requests: same day

## 11. Membership model

### Free
- trip setup
- basic itinerary
- limited Coach turns
- public alerts and planning content

### Hiker
- full Today / Plan / Coach
- persistent Trail Log
- readiness scoring
- full town planning tools

### Trail Pro
- priority support
- support-circle visibility
- advanced logistics support
- richer check-in and safety workflows

### Concierge
- human planning and on-trail intervention
- town-day rescue and rerouting
- personalized resupply and schedule work

Exact pricing should be validated, but the structure should feel seasonal rather than purely monthly.

## 12. Operational network strategy

The moat is not only software. It is software plus regional operating relationships.

### Target partner categories
- hostels
- shuttle operators
- outfitters
- local trail angels and experts
- regional weather/safety specialists where appropriate

### Initial regional wedge
- Georgia / Neel Gap / Smokies
- Hot Springs / Roan Highlands
- Monson / 100-Mile Wilderness / Katahdin

These regions have high decision density and proven demand for support.

## 13. Success metrics

### Product
- weekly active hikers
- daily Today-screen open rate
- 7-day plan adherence or explicit plan-change completion rate
- chat-to-action completion rate

### Service
- median time to first actionable response
- percentage of urgent requests handled within SLA
- percentage of users who complete a check-in at least every 48 hours on trail
- successful concierge resolution rate

### Business
- free-to-paid conversion
- partner participation by region
- gross retention across a hiking season
- referral rate from hostels/outfitters/word of mouth

## 14. Constraints and risks

### Trail/legal constraint
Commercial guiding is restricted on much of the Appalachian Trail. Trail Assistant should position itself as a planning, logistics, readiness, and concierge product, with guided experiences only where specific permits or approved partner structures allow them.

### Product risks
- overpromising on “AI hiking advice” without enough local context
- building too broad a map product too early
- weak partner participation creating stale town intelligence
- safety escalation burden growing faster than staffing

### Technical risks
- public deploy drift between Netlify and Forge
- low-signal/offline reliability gaps
- privacy issues if map-sharing defaults are too permissive
- model output quality if not grounded in user and trail state

## 15. Release strategy

### Phase 1
- ship Today, Plan, Coach, and Check-In for a closed pilot
- keep concierge as human backstop

### Phase 2
- add Town layer and partner workflows in 2-3 regions
- add support-circle and family-facing safety visibility

### Phase 3
- add paid subscription gates and partner dashboards
- deepen operational intelligence and automation

## 16. Relationship to current repo

The repo already contains important Trail Assistant foundations:
- public intake and profile-state flows
- authenticated chat, check-in, progress, map-report, and SOS APIs
- moderator governance and quarantine controls
- plan catalog and BYOS entitlement scaffolding
- mobile screen and API contract drafts

The next step is not inventing the product from scratch. It is connecting those primitives into a cohesive, premium hiker experience.

## 17. Research references

- WHOOP Weekly Plan: <https://www.whoop.com/us/en/thelocker/set-and-reach-your-goals-with-weekly-plan>
- WHOOP Coach: <https://www.whoop.com/thelocker/introducing-whoop-coach-powered-by-openai/>
- WHOOP Journal: <https://www.whoop.com/us/en/thelocker/the-whoop-journal/>
- WHOOP Strain Coach: <https://www.whoop.com/us/en/thelocker/strain-coach>
- Wandering Boots Appalachian Trail support: <https://www.appalachiantrailhikingsupport.com/hike-thru>
- Mountain Crossings Virtual Shake Down: <https://www.mountaincrossings.com/Virtual-Shake-Down-p/vsd.htm>
- Blue Ridge Hiking Company / Trail-er: <https://blueridgehikingco.com/bunkhouse_reservation>
- Boots Off Hostel services: <https://www.bootsoff.camp/services>
- Green Mountain House amenities: <https://greenmountainhouse.net/what-we-offer>
- Shaw’s Hiker Hostel 100-Mile Wilderness support: <https://www.shawshikerhostel.com/100-mile-wilderness-.html>
- Appalachian Trail Hostel & Outfitters services: <https://appalachiantrailhostel.com/hiker-services>
- Mountain Harbour shuttle and hiker info: <https://mountainharbour.info/home/shuttle-service/> and <https://mountainharbour.info/home/hiker-hostel/hiker-information/>
- FarOut Appalachian Trail guide: <https://faroutguides.com/appalachian-trail-map/>
- ATCamp registration: <https://atcamp.org/>
- ATC transportation: <https://appalachiantrail.org/explore/plan-and-prepare/transportation-options/>
- ATC group hiking / commercial-use constraints: <https://appalachiantrail.org/experience/hike-the-trail/group-hiking/>
