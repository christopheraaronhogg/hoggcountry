# TRAIL LEGS

**Product Requirements Document**

An Appalachian Trail Thru-Hiking Simulation

Version 1.0 | January 2026

*"Every mile is earned."*

---

## 1. Executive Summary

Trail Legs is a deep simulation game that challenges players to complete a thru-hike of the Appalachian Trail. Inspired by the systemic depth of Project Zomboid but with a hopeful, encouraging tone, the game puts players against the trail itself rather than supernatural threats. With only ~25% of real AT hikers completing their thru-hikes, Trail Legs aims to authentically capture this challenge while celebrating the journey regardless of outcome.

The game features realistic skill progression, detailed navigation mechanics including authentic white blaze trail marking, dynamic weather systems, gear management, and a rich social layer with other hikers. Players will experience the full emotional arc of a thru-hike: the early excitement, the Virginia blues, the mental battles, and hopefully, the triumph of Katahdin.

### Key Differentiators

- **Authentic AT Experience:** Real shelter names, towns, distances, and elevation profiles from the actual Appalachian Trail.
- **White Blaze Navigation:** Players must actually follow trail blazes, not a GPS line. Getting lost is a real possibility.
- **Hopeful Tone:** Challenge without cynicism. Failure is reframed as part of the journey, not punishment.
- **PZ-Style Multiplayer:** Host your own servers, hike with friends, or join larger "bubble" servers.
- **Mobile-First, Cross-Platform:** Designed for mobile play sessions with full desktop support.

---

## 2. Vision & Goals

### Vision Statement

Trail Legs captures the authentic experience of attempting an Appalachian Trail thru-hike: the physical challenge, the mental battles, the trail community, and the profound personal growth. The game respects both the difficulty of the endeavor and the dignity of those who attempt it, whether they finish or not.

### Design Philosophy

**Challenging but not cruel:** The ~25% completion rate should emerge naturally from realistic systems, not artificial difficulty spikes or unfair randomness.

**Honest but hopeful:** When players don't finish, the game acknowledges their journey with dignity. Every mile hiked matters.

**Simulation depth over graphics:** Like Project Zomboid, the richness comes from interconnected systems, not visual fidelity.

**Teach real skills:** Players who master the game should understand real AT navigation, pacing, and preparation concepts.

**Faith-inspired values:** Themes of perseverance, community, sabbath rest, and gratitude are woven into mechanics without being preachy.

### Success Metrics

- Target completion rate: ~25% of first-time players complete a thru-hike
- Retry rate: 60%+ of players who don't finish attempt another hike
- Session length: Average 15-30 minute sessions (mobile-friendly)
- Community engagement: Active multiplayer servers, shared stories

---

## 3. Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Game Client | Phaser 3 | Mature 2D framework, excellent pixel art support, web-native |
| Multiplayer Server | Colyseus | Elegant state sync, Node.js, easy self-hosting |
| Mobile Wrapper | Capacitor | Web-to-native bridge, iOS/Android from same codebase |
| Language | TypeScript | Type safety, excellent AI agent support, shared client/server code |
| Desktop Distribution | Electron / Steam | Web app wrapped for desktop, Steam integration |
| Database | SQLite / PostgreSQL | SQLite for self-hosted, Postgres for official servers |

### Architecture Overview

The architecture follows a client-server model where the server is authoritative for all game state. This prevents cheating and enables the multiplayer "bubble" experience.

#### Client Responsibilities

- Rendering the game world (trail, terrain, weather effects)
- Capturing player input (movement, decisions, inventory management)
- Displaying UI (stats, map, journal, social)
- Local prediction for responsive feel

#### Server Responsibilities

- Simulation tick (weather, time, NPC hikers)
- Player state management (calories, fatigue, skills, inventory)
- Trail state (blaze visibility, conditions, shelter occupancy)
- Event generation (encounters, trail magic, hazards)
- Persistence (save/load game state)

### Multiplayer Model

Following the Project Zomboid model, players can host their own dedicated servers or connect to official/community servers.

**Self-Hosted:** Players download a server package, run it locally or on a VPS, and share connection details with friends. Docker support for easy deployment.

**Official Servers:** Anthropic-hosted (or community-hosted) larger servers for the "mega bubble" experience with many concurrent hikers.

**Single Player:** Runs a local server instance transparently. Same codebase, same experience.

---

## 4. Core Gameplay Loop

### The Day Cycle

Each in-game day follows a natural rhythm that mirrors real thru-hiking. A full day takes approximately 15-30 minutes of real time, making it ideal for mobile sessions.

#### Morning Phase

- Wake at camp/shelter (or be woken by weather, wildlife, other hikers)
- Check status (how rested, any new aches, weather forecast)
- Eat breakfast (affects energy for the day)
- Pack up camp (speed affected by skills, gear)

#### Hiking Phase

- Set pace (affects speed, fatigue accumulation, injury risk)
- Navigate by white blazes (core mechanic)
- Random events (weather changes, encounters, discoveries)
- Decision points (side trails, water sources, viewpoints)
- Manage resources (water, snacks, energy)

#### Evening Phase

- Find camp (shelter, tent site, stealth camp)
- Set up (shelter quality affects rest)
- Cook dinner (meal quality affects recovery)
- Social time (if at shelter with others)
- Gear maintenance (repair, organize)
- Sleep (quality affected by conditions, mental state)

### Town Days

Reaching a town changes the gameplay significantly. Town stops are critical decision points for resupply, rest, and morale.

- **Zero Day:** Full rest day in town. Maximum recovery, significant cost, time investment.
- **Nero (Near Zero):** Partial day. Some town benefits, continue hiking.
- **Resupply Only:** Quick stop for food/gear, minimal time lost.

---

## 5. Skill System

Skills improve through use, not through menus or point allocation. This creates natural progression that mirrors real hiking experience.

### Primary Skills

| Skill | How It Builds | Effects |
|-------|---------------|---------|
| Trail Legs | Miles hiked, especially consecutive days | Daily mileage capacity, stamina recovery rate, reduced leg fatigue |
| Navigation | Finding blazes, using maps, recovering from lost | Blaze detection range, map reading accuracy, reduced panic when lost |
| Foraging | Identifying and harvesting wild food | Edible plant recognition, safe mushroom ID, berry yield |
| Camp Craft | Setting up shelters, tarps, fire building | Setup speed, rain protection quality, fire success rate |
| Gear Maintenance | Repairing items, pack adjustments | Repair success rate, gear longevity, weight distribution |
| First Aid | Treating injuries, blisters, illness | Healing speed, infection prevention, medication effectiveness |
| Trail Cooking | Preparing meals efficiently | Calorie extraction from food, fuel efficiency, meal morale bonus |
| Weather Reading | Observing conditions, checking forecasts | Storm prediction accuracy, optimal shelter timing |
| Social | Interacting with other hikers, townspeople | Trail magic frequency, information quality, tramily bonding |
| Mental Fortitude | Pushing through hard days, recovering from setbacks | Resistance to quit events, faster morale recovery |

### Skill Progression Curve

Skills follow a logarithmic curve: early gains come quickly, mastery takes time. A new hiker might improve Trail Legs rapidly in the first week, but the difference between a competent hiker and an expert is hundreds of miles of experience.

This prevents experienced players from "speedrunning" the early game while ensuring new players feel meaningful progress.

---

## 6. Status System (Moodles)

Following Project Zomboid's moodle system, visible status indicators show the player's current physical and mental state.

### Physical Status Effects

| Status | Progression | Effects |
|--------|-------------|---------|
| Hunger | Peckish > Hungry > Very Hungry > Starving > Bonking | Reduced speed, then reduced stamina, then collapse risk |
| Thirst | Thirsty > Dehydrated > Severely Dehydrated | Reduced endurance, then heat stroke risk |
| Fatigue | Tired > Exhausted > Dead Tired > Collapse | Reduced speed, injury risk, decision impairment |
| Pain | Mild > Moderate > Severe (by body part) | Reduced pace, morale drain, potential injury worsening |
| Temperature | Cold > Chilled > Hypothermic / Hot > Overheated > Heat Stroke | Stamina drain, then health damage |
| Wetness | Damp > Wet > Soaked | Chill risk, gear degradation, blister risk |
| Illness | Giardia, Norovirus, Lyme (separate tracks) | Various debuffs, may require town/evacuation |

### Mental Status Effects

| Status | Progression | Effects |
|--------|-------------|---------|
| Loneliness | Isolated > Lonely > Deeply Lonely | Morale drain, social skill atrophy |
| Morale | Motivated <> Content <> Discouraged <> Demoralized | Affects all activities, quit risk |
| Homesickness | Missing Home > Homesick > Aching for Home | Morale drain, town temptation increase |
| Trail Blues | Triggered around week 3, and during Virginia | Significant morale challenge, many hikers quit here |
| Anxiety | Uneasy > Anxious > Panicked (when lost) | Decision impairment, navigation difficulty |

### The Quit Mechanic

Unlike Project Zomboid where failure means death, Trail Legs recognizes that most AT attempts end by choice, not catastrophe. When mental health bottoms out during a difficult stretch, players face a "Consider Leaving" event. This is a decision point, not an automatic failure.

**Factors that trigger quit risk:** accumulated negative moodles, consecutive bad days, isolation, chronic pain, money stress, time pressure, specific trail sections (Virginia Blues).

**Factors that prevent quitting:** high Mental Fortitude skill, tramily support, recent positive experiences, clear goals, adequate rest.

---

## 7. Navigation System

The white blaze navigation system is a core differentiator. Players must actually follow trail markers rather than a GPS line or minimap.

### White Blaze Mechanics

#### Blaze Types

- **Single White Blaze:** You're on trail, continue in current direction.
- **Double Blaze (stacked):** Attention! A turn, junction, or significant change ahead.
- **Double Blaze (top offset right):** Turn right ahead.
- **Double Blaze (top offset left):** Turn left ahead.
- **Blue Blaze:** Side trail (water, viewpoint, shelter access, alternate route).
- **Rock Cairns:** Used on open balds where no trees exist.

#### Blaze Visibility Factors

| Factor | Effect on Visibility |
|--------|---------------------|
| Weather | Fog reduces sight distance. Rain makes you look down. Snow can cover low blazes. |
| Time of Day | Dawn/dusk = harder. Night = headlamp cone only. Midday = easiest. |
| Fatigue Level | Exhausted characters have reduced attention radius. |
| Trail Section | High-traffic areas = obvious. Remote sections = blazes further apart. |
| Season | Full leaf cover can hide blazes. Bare trees = easier to spot. |
| Hiking Pace | Moving fast = easier to miss. Slow and careful = better detection. |
| Navigation Skill | Higher skill = longer detection range, better interpretation. |

### Getting Lost

#### Ways to Lose the Trail

- Bathroom break without maintaining visual contact with trail
- Missing a turn at a junction (especially double blazes)
- Following a "social trail" (false path worn by previous confused hikers)
- Night hiking with inadequate light
- Fog on open balds (rock cairns hard to see)

#### Lost States

**Mildly Lost:** Pretty sure where trail is, just can't see a blaze. Options: backtrack, search pattern, guess and continue.

**Moderately Lost:** Off trail for a while, unsure of direction. Anxiety moodle appears. Map consultation helps if skilled.

**Severely Lost:** No idea where you are. Panic risk. Survival priorities shift to shelter, water, signaling.

When players recover from being lost, the game shows them where they went wrong as a teaching moment.

---

## 8. Real AT Data Integration

The game uses authentic Appalachian Trail data to create an accurate simulation. This includes real locations, real distances, and real elevation profiles.

### Data Requirements

#### Shelter Data

- All 260+ shelters with real names and mile markers
- Capacity (number of sleeping spots)
- Water source proximity and reliability
- Privy availability
- Notable features (bear box, tent platforms, views)

#### Town Data

- All trail towns with accurate distances from trail
- Services available (grocery, outfitter, post office, lodging, restaurants)
- General price levels (budget vs expensive towns)

#### Trail Segment Data

- Accurate elevation profiles (climbs, descents)
- Terrain types (rocky, smooth, rooty, boggy)
- Water source locations
- Notable features (balds, viewpoints, landmarks)
- Typical blaze frequency (affects navigation difficulty)

### Key Locations for MVP

The MVP covers approximately the first week of a northbound (NOBO) thru-hike, from Springer Mountain, Georgia to roughly Neels Gap/Mountain Crossings outfitter. This ~30 mile section includes:

- Springer Mountain (southern terminus, start point)
- Springer Mountain Shelter
- Stover Creek Shelter
- Hawk Mountain Shelter
- Gooch Mountain Shelter
- Woods Hole Shelter
- Blood Mountain (highest point in Georgia)
- Neels Gap / Mountain Crossings (first resupply, outfitter)
- Multiple water sources, creek crossings, and terrain variations

---

## 9. Multiplayer System

The social experience of the AT is fundamental. The trail has a vibrant community of hikers moving in "bubbles" together, and the multiplayer system recreates this.

### Server Types

#### Self-Hosted Servers

Players download a server package and run their own instance. Perfect for hiking with friends. Docker container available for easy VPS deployment. Configuration options for time scale, difficulty, and starting conditions.

#### Official/Community Servers

Larger servers with many concurrent hikers for the full "bubble" experience. Persistent world with synchronized time. Players can encounter each other naturally on trail.

#### Single Player

Transparent local server. Same game, same experience, NPC hikers fill out the social elements.

### Social Features

#### Trail Names

Players start with their real name. Trail names are earned through events (funny, embarrassing, or heroic moments). Other players and NPCs use your trail name once earned.

#### Tramily (Trail Family)

Form bonds with other hikers (players or NPCs). Travel together for safety and morale benefits. Share resources in tough times. Different hiking paces naturally separate the group (bittersweet mechanic).

#### Shelter Registers

Leave and read entries at shelters. See who passed through and when. Share information about trail conditions ahead. Creates async communication between players.

---

## 10. MVP Scope

The Minimum Viable Product focuses on proving the core gameplay loop is compelling. It covers approximately one week on trail, the first ~30 miles from Springer Mountain to Neels Gap.

### MVP Includes

1. Character creation with basic traits and starting builds
2. Core day loop: morning, hiking, evening phases
3. White blaze navigation system with getting lost mechanics
4. Basic skill progression (Trail Legs, Navigation, Camp Craft)
5. Core status effects (hunger, thirst, fatigue, basic pain)
6. Weather system (clear, rain, fog)
7. Gear system (pack, shelter, sleep system, cookware, water treatment)
8. Food and water management
9. Shelters (capacity, features, water sources)
10. One trail town: Neels Gap / Mountain Crossings (resupply, basic services)
11. NPC hikers for social interaction
12. Basic multiplayer (2-4 player server)
13. Pixel art visual style

### MVP Excludes (Future Versions)

- Full 2,190 mile trail (only first ~30 miles)
- Complete illness/injury system
- Full town services (hostels, restaurants, full outfitter)
- Trail name system
- Tramily mechanics
- Seasonal variations
- Large-scale multiplayer servers
- Other trails (PCT, CDT)

### MVP Success Criteria

The MVP is successful if players find the core loop engaging enough to replay the week multiple times, learning from failures, and wanting more trail to explore. The navigation system should feel challenging but fair, and the simulation should feel deep enough to reward thoughtful play.

---

## 11. Character System

### Starting Builds

Players choose a background that sets initial skill levels and starting gear. Each has trade-offs.

| Build | Strengths | Weaknesses |
|-------|-----------|------------|
| Weekend Warrior | Decent fitness, good budget | Poor gear knowledge, overconfident |
| Scout Leader | Good camp craft, first aid | Modest fitness, older gear |
| Ultra Runner | Exceptional fitness | Bad at pacing, minimal gear knowledge |
| Gear Head | Excellent equipment, high maintenance skill | Poor fitness, overthinks decisions |
| Broke College Kid | High motivation, learns fast | No money, poor equipment |
| Retiree | Unlimited time, great mental game | Moderate fitness, slower recovery |

### Traits

Additional traits modify the character. Some are purely positive, some purely negative, some trade-offs. Examples:

- **Fast Healer / Slow Healer:** Injury and blister recovery rate
- **Iron Stomach / Sensitive Stomach:** Food-related illness resistance
- **Early Bird / Night Owl:** Performance at different times of day
- **Extrovert / Introvert:** Social interaction effects on morale
- **Light Sleeper / Heavy Sleeper:** Rest quality vs. awareness of danger
- **Fast Metabolism:** Hungry faster but lighter starting weight
- **Lucky / Unlucky:** Random event rolls

---

## 12. Art & Audio Direction

### Visual Style

Pixel art inspired by Project Zomboid but with a warmer, more inviting color palette. The trail should feel like a challenging but beautiful place, not a hostile wasteland.

#### Art Direction Principles

- Readable at mobile resolution (key elements visible on small screens)
- White blazes must be visible but not highlighted (skill-based detection)
- Weather effects visible (rain, fog, snow) without obscuring gameplay
- Day/night cycle with meaningful visual difference
- Character and NPC sprites with enough detail for identification

#### Color Palette

Earthy greens, browns, and grays for the forest. Sky blues and warm sunrise/sunset tones for time-of-day. White for blazes that pops against tree bark. Muted but not desaturated; the trail is alive.

### Audio Direction

- Ambient forest sounds (birds, wind, water, insects by time of day)
- Weather audio (rain intensity levels, thunder, wind)
- Footstep sounds varying by terrain (dirt, rock, wood, water)
- UI sounds (minimal, satisfying)
- Music: Sparse, acoustic, appears at significant moments rather than constant

---

## 13. Monetization

### Initial Release

Free to play during early access / MVP phase. Focus on building community and gathering feedback.

### Full Release

One-time purchase: $5-10 for mobile, $10-15 for Steam desktop version. No in-app purchases, no subscriptions, no pay-to-win. The game respects players' time and money.

### Future Expansion Revenue

- Additional trails as paid DLC (Pacific Crest Trail, Continental Divide Trail)
- Cosmetic options (character appearance, gear skins) if community requests

---

## 14. Development Roadmap

### Phase 1: Prototype (MVP)

Springer Mountain to Neels Gap (~30 miles, ~1 week). Prove core loop: hiking, navigation, survival, basic multiplayer.

### Phase 2: Georgia Complete

Extend to Georgia/North Carolina border. Add full shelter system, expanded weather, injury/illness mechanics, trail name system.

### Phase 3: Virginia

The longest state, the infamous "Virginia Blues." Mental health mechanics fully developed. Tramily system. Multiple town experiences.

### Phase 4: Full Trail

Complete 2,190 miles. All 14 states. Hundred-Mile Wilderness. Katahdin summit. Full thru-hike possible.

### Phase 5: Expansion

Additional trails: PCT (Pacific Crest Trail), CDT (Continental Divide Trail). SOBO (southbound) and flip-flop variations. Seasonal variations. Large-scale multiplayer "mega bubble" servers.

---

## Appendix: Design Values

These principles guide all design decisions:

### Challenge Without Cruelty

The game is hard because the AT is hard, not because we want to punish players. Difficulty emerges from realistic systems, not arbitrary punishment. When players fail, they should understand why and know what to do differently.

### Every Mile Matters

A player who hikes 500 miles and leaves the trail has still accomplished something meaningful. The game celebrates progress, not just completion. Epilogues honor the journey regardless of outcome.

### The Trail Provides

Trail magic, community support, and unexpected kindness are real parts of the AT experience. The game includes these, not as easy mode, but as authentic representation of how the trail community works.

### Rest is Not Weakness

Sabbath rest is baked into the mechanics. Pushing 7 days straight has diminishing returns. Zero days restore more than just health. The game rewards wisdom, not just grit.

### Teach Real Skills

Players who master this game should genuinely understand AT navigation, pacing, gear selection, and mental preparation better than when they started. The simulation has educational value.

### Respect the Source Material

The Appalachian Trail is a real place with a real community. We honor that by using accurate data, representing the culture authentically, and not sensationalizing the experience.

---

*End of Document*
