# Hogg Country Trail App — UX Design Bake-off (2026-06)

**Exploration, not a rebuild.** Five genuinely distinct UX directions for the same functional scope
(Scout · Map · Gear · Trail + KJV), each rendered as a static HTML mockup, then scored by an
independent 5-judge panel for a one-handed, outdoor, sometimes-offline trail app.

➡ **Open [`overview.html`](overview.html) for the visual, side-by-side version.**

---

## 🥇 Winner: **D3 — Today (Calm)** — a paper-quiet, glanceable dashboard

**325 / 400**, and it won **4 of the 5 judges** (Calm-minimalist, Field/Accessibility, IA/Product, and
"Dad" the end-user). The only dissenter — the Touch/ergonomics judge — still ranked it **second**.
For a tired, cold-handed hiker reading in sun glare on one bar of signal, the calm dashboard is the one
that reliably surfaces the thing that keeps you safe **in a two-second glance** — without shouting,
without a gesture to discover, and while telling the truth about uncertain data.

> *"d3 is the one I'd actually carry: in bright sun with cold hands I can read the numbers that keep me
> safe — water, weather, readiness — in a two-second glance, and it tells me the water's unconfirmed in
> plain words."* — **Hal ("Dad"), the end-user judge**

---

## Scoreboard (average per criterion, 1–10, across 5 judges)

| Direction | Clarity | Calm | Glance | 1-Hand | Hierarchy | Learn | Delight | Outdoor | **Total /400** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **🥇 D3 Today (Calm)** | 8.8 | **9.0** | **9.0** | 7.0 | 8.8 | 8.0 | 6.0 | **8.4** | **325** |
| D1 Scout Hub *(baseline)* | 7.2 | 6.2 | 5.4 | 7.2 | 6.4 | **8.8** | 5.4 | 6.4 | 265 |
| D4 One Thumb | 6.0 | 6.8 | 7.2 | **7.8** | 6.8 | 3.4 | 7.4 | 7.4 | 264 |
| D5 Field Notes | 6.0 | 6.0 | 5.2 | 6.8 | 5.8 | 7.2 | **8.8** | 4.4 | 251 |
| D2 Trailhead | 5.2 | 4.8 | 5.4 | 4.6 | 6.0 | 4.0 | 7.2 | 4.6 | 209 |

**Bold = criterion champion.** D3 wins 5 of 8 criteria outright. The other directions each win exactly
one criterion — and, crucially, the three they win (Learnability, One-handed, Delight) are precisely
D3's three softest scores. **The losers are a parts bin for the winner.**

### Per-judge totals (/80)

| | Tess (Touch) | Rune (Calm) | Mara (Field) | Ivo (IA) | Hal (Dad) | **Sum** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| **D3 Today (Calm)** | 58 | **67** | **67** | **66** | **67** | **325** |
| D1 Scout Hub | **62** | 51 | 50 | 49 | 53 | 265 |
| D4 One Thumb | 57 | 49 | 51 | 55 | 52 | 264 |
| D5 Field Notes | 49 | 48 | 45 | 52 | 57 | 251 |
| D2 Trailhead | 47 | 41 | 38 | 43 | 40 | 209 |

*(Bold = that judge's winner.)*

---

## Why each landed where it did

### 🥇 D3 · Today (Calm) — 325
The only direction where **the structure itself does the safety work.** Readiness "**84 · HOLD**" is an
88px serif numeral that owns the screen; the candidate-grade water caution sits directly under the water
distance in calm clay (no red klaxon, but unmissable by *size*); "Offline · on-device" lives in every
status bar. Pure vertical scroll — the most motor-tolerant, cold-hands-friendly model. Three of five
judges independently used the phrase "two-second glance."
- **Strength:** safety wins the hierarchy by *scale*, not by alarm color or ornament; best contrast + biggest type in the set.
- **Only real debt:** the bottom section-switcher is tiny text links (~11px) — its single un-thumb-friendly element. *(Easy fix — see Recommendation.)*
- **Lowest scores:** One-handed **7.0**, Delight **6.0** — and those are exactly what D4 and D5 are best at.

### 2nd · D1 · Scout Hub (baseline) — 265
The honest control did well: **most learnable** (8.8 — a zero-curve 4-tab bar nobody gets lost in) and
the **most fully-realized source-receipt + confidence-badge machinery** of any direction. But making a
**chat log the home screen** is the wrong default for a glance — the decision that matters (84 HOLD,
candidate water) is the third bubble down a scrollable log you have to read or type to reach. The Touch
judge's pick (textbook bottom-tab thumb layout); everyone else dinged its glanceability (5.4).

### 3rd · D4 · One Thumb — 264 (the heartbreaker)
Has the **single best action surface in the bake-off** — the 70–78px **thumb-zone command arc** and a
genuine **dusk/dark mode** — and the highest one-handed (7.8) and strong outdoor (7.4) scores. But it
**bets the whole IA on an undiscoverable swipe** with no persistent navigation, scoring a brutal **3.4
on learnability** (lowest single number in the entire matrix). Every judge loved the buttons and feared
the gesture. *"Asking a tired old man to memorize a maze."* — Dad.

### 4th · D5 · Field Notes — 251 (the most loved)
**Most delightful by a mile (8.8)** and the truest to the human jobs — *stay connected to family, keep
faith*. Its boldest idea is genuinely brilliant: the candidate-grade stream is **circled and questioned
in Dad's own handwriting ("stream 1438.4? confirm flow")** — uncertainty rendered as a person's doubt,
not a system badge. But the analog aesthetic is its undoing **outdoors (4.4, worst in the set)**: Caveat
handwriting + sepia-on-paper + texture grain wreck contrast in sun and risk burying the safety warning
under ornament.

### 5th · D2 · Trailhead — 209
The most beautiful cartography and the clearest "where am I" map — but it **fights every one of the
user's real conditions.** A **dark map substrate washes out in glare**, a 5px draggable-sheet grabber is
hostile to cold hands, and gating Scout behind a pin tap leaves *"can I push miles today?"* with no home.
Lowest on one-handed (4.6) and tied-lowest outdoors. A stunning tabletop demo; a poor trail tool.

---

## ✅ Recommendation

**Ship the D3 "Today (Calm)" dashboard as the core experience — then graft on the three things it scores
lowest, each of which a losing direction has already solved:**

1. **From D4 (One Thumb): the thumb-zone targets.** Replace D3's tiny text section-switcher with a
   persistent, large, bottom-anchored control (and consider the command-arc fan for primary actions —
   Ask · Check-in · Water · Verse). This directly patches D3's One-handed 7.0, its lowest non-delight score.
   *Take the buttons; leave the swipe-only IA behind.*
2. **From D5 (Field Notes): the handwritten honesty + a touch of warmth.** Keep D3's calm safety
   hierarchy, but borrow the human voice for the candidate-grade caveat and add a journal/keepsake
   surface under Trail (the family follows along; Father's Day is Jun 21). This patches Delight 6.0 —
   D3's true weakest score — without sacrificing legibility.
3. **From D1 (Scout Hub): the receipt machinery + a real Scout chat one layer down.** D3's "glance, don't
   explore" makes Scout thin. Keep the calm Ask-Scout card as the entry, but wire D1's fully-built
   source-receipts + confidence-badge into the expanded answer, and let it open into a genuine chat for
   follow-ups. *Glance by default, converse on demand.*

**From D2 (Trailhead): borrow the idea, not the screen.** Location-as-context — Scout answers anchored to
a place ("about Morgan Stewart Shelter, mi 1442.6"), and the clean topo "where am I" map — is worth
keeping as the **Map pillar's** deeper layer. Just don't make a dark map the home of the whole app.

**Net:** D3 is the spine. D4 fixes its hands, D5 fixes its heart, D1 fixes its depth, D2 enriches its map.
Because D3's three weakest criteria are the three the other directions each win, this isn't a compromise —
it's an assembly.

---

## Method notes
- **Directions:** 5 deliberately distinct concepts (chat-hub / map-hub / glance-dashboard / gesture-no-tabs /
  analog-journal), each built as a self-contained 4-screen HTML mockup grounded in the real app's tokens
  (`#f4efe4` cream / `#2f4b35` forest) and authentic data (Day 42, Mile 1438, Morgan Stewart Shelter,
  candidate-grade water, Psalm 23). D1 is the current `scout-redesign` build, reconstructed as an honest control.
- **Judges:** 5 independent UX-expert personas — Touch/ergonomics, Calm-minimalist, Field/accessibility,
  IA/product strategist, and the end-user himself ("Dad," 62, Day 42, cold hands, sun glare, one bar) —
  each scoring all five directions blind to the others on 8 criteria (1–10), then naming a winner.
- **Files:** mockups in [`mockups/`](mockups/); this analysis + [`overview.html`](overview.html) are the deliverables.
  Nothing here touches the app — it's a decision aid for Chris.
