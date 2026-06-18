# Hogg Country — UX Design Bake-off Brief (2026-06)

Shared source-of-truth for every design direction and judge in this bake-off.
This is **exploration**, not a rebuild. All mockups are static HTML, saved to disk.

---

## The product (functional scope — keep ALL of this in every direction)

A **mobile app for one Appalachian Trail thru-hiker** (Chris's Dad, NOBO, started Feb/Mar 2026,
currently Day 42 at Mile 1438 in the NY/CT corridor). Used **one-handed, outdoors, in sun, with
cold/tired hands, often on one bar of signal or fully offline.** An on-device Gemma model (Scout)
answers when offline. Honesty about stale/uncertain data is a safety feature, not a nicety.

Four functional pillars must all be present:

1. **Scout** — an AI trail assistant (chat). Answers "can I push miles today?", "next reliable water?",
   "what needs verifying before town?", "safest next move?". Shows **source receipts** + a
   **confidence badge** and is honest when data is *candidate-grade* (unconfirmed).
2. **Map** — the AT line, Dad's position, shelters / water / towns, elevation, trail-pulse field reports.
3. **Gear** — the pack loadout: items, categories, carried weight (base + total lb).
4. **Trail** — the offline library: **field Guide**, the **KJV Bible** (opens to Psalm 23, full-text search),
   and the **Journal** (check-in history / daily notes).

## Authentic data to populate the mockups (use these exact values — no lorem ipsum)

- **Status strip:** Day **42** · Mile **1438.0** · **65%** of 2,197.4 mi · Online/Offline toggle (show an Offline state somewhere)
- **Today:** target **8.2 mi** to **Morgan Stewart Memorial Shelter** (mile 1442.6, +1,700 ft). Readiness **84 — HOLD**.
  Reason: "last two days above plan, recovery lagging; mapped water is candidate-grade — keep miles conservative."
- **Weather:** High **82°F** / Low **63°F**, wind **9 mph**, humid ridge walking, scattered showers possible.
- **Next water:** *Unnamed mapped stream*, mile 1438.4 (0.4 mi) — **reliability: thin / candidate-grade, confirm flow.**
- **Next shelter:** Morgan Stewart Memorial Shelter, mile 1442.6 (4.6 mi).
- **Next town:** Pawling corridor, mile 1457.9 — services **Unverified** (open-data candidate).
- **Scout greeting:** "Good morning. Trail readiness is holding steady today. Keep mapped water marked
  low-confidence until it's confirmed from a current source or in the field."
- **Quick prompts:** "Can I push mileage today?" · "What's the next reliable water?" ·
  "What needs verifying before the next town?" · "Give me the safest next move."
- **Source receipts** (show 2-3 on a Scout answer): `AWOL 2026` (Field guide), `NWS` (Cached weather),
  `FarOut` (Recent reports), `On-device trail pack`. Confidence badge: **High / Medium / Candidate**.
- **Trail Pulse field reports:** "Rocks" — *Backtrack*, 34 min ago, mile 1438.4 · "Water — mapped stream
  candidate needs field confirmation", 2 days ago, mile 1441.5.
- **Gear (sample):** Base weight **14.8 lb**, total **22.3 lb** carried, **31 of 38 items**. Categories:
  Shelter (tent 2.1 lb), Sleep (quilt 1.4 lb, pad 0.9 lb), Pack (1.9 lb), Cook (stove + pot 0.7 lb),
  Water (filter 0.2 lb), Worn (shoes, sun hoody), Consumables (food 5 d, fuel).
- **Bible:** KJV, opens to **Psalm 23** ("The LORD is my shepherd; I shall not want…"). Full-text search box.
- **Journal/Guide:** last check-in "NY/CT pilot corridor — safe, 2h ago." Father's Day target Jun 21.
- **Support circle:** Sarah Hogg (primary, SMS), Trail Concierge, Dad (family backup, call).

## Brand tokens (the real app palette — share the DNA; each direction may push it)

```css
--bg:#f4efe4; --bg-deep:#e7dcc8; --surface:#fbf7ef; --surface-strong:#fffdf8;
--ink:#1f241d; --muted:#5f6558; --line:#d8cfbf;
--forest:#2f4b35; --moss:#6a845f; --sand:#c8a77a; --clay:#aa6843; --sky:#5f8090;
--danger:#9a3b2f; --success:#2f6a47; --warn:#b6892c;
--radius-lg:22px; --radius-md:16px; --radius-sm:12px;
/* fonts: sans = 'Avenir Next'/system; display serif = 'Iowan Old Style'/Georgia/serif; mono = ui-monospace */
```
The current build is **warm cream + deep forest green + serif display numerals**, topographic feel.
You may use web-safe/system fonts and Google Fonts (Oswald, Lato, Caveat, Fraunces, etc.) via `<link>`/`@font-face`
or system stacks. Keep it legible in bright sun (strong contrast, large type).

## Output format (EVERY direction must follow this exactly)

- One **self-contained `.html` file** (all CSS inline in a `<style>` block; no JS build deps; Google Fonts via `<link>` is OK).
- A **title band** at the very top: the direction name, a one-line concept, and the visual/interaction language in a phrase.
- Then **four phone frames in a flex-wrap row** (each frame ~**320px wide × ~660px tall**, gap 24px, centered on a
  neutral backdrop) so they render **2×2** inside an iframe. Put a small label chip above each phone: **Scout · Map · Gear · Trail**.
- Each phone shows that pillar's **key screen**, fully populated with the authentic data above. Make it look like a real shipping screen.
- Commit hard to your direction's distinct concept — do **not** produce a generic card app. Avoid AI-slop: no meaningless gradients,
  no centered-everything, no filler. Real hierarchy, real spacing, real craft.

## Judging rubric (what this is graded on — design for it)

Scored 1–10 on: **Clarity · Calm/Simplicity · Glanceability · One-handed usability · Information hierarchy ·
Learnability · Delight · Outdoor-fitness** (sun legibility, cold-hands targets, offline honesty).
Target user is tired, cold, one-handed, sometimes offline. Safety-critical info (water, weather, readiness) must win the hierarchy.
