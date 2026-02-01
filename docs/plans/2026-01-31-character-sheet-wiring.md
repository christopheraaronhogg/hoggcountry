# Character Sheet wiring plan (v1)

Goal: make `/tools/character/` the “single spine” UI for `hcCharacter.v1` so it’s actually useful (not just Overview + Trail).

Non-goals (v1):
- No heavy refactors of existing tool UIs.
- Avoid duplicating the full tool experiences inside the sheet.
- Keep the Character Sheet fast + stable.

## Current state
- Route exists: `/tools/character/`.
- `ToolPage` dynamically loads `CharacterSheet.svelte`.
- Unified store exists: `src/stores/character.svelte.ts`.
- CharacterSheet currently:
  - Overview: identity/constraints + progress
  - Trail: start date, mile, target pace, zeros
  - Other tabs: stub placeholder

## UX direction
Character Sheet should be “Inspect” + “Quick Edit” + “Jump to Tool”:
- Each tab contains:
  1) **Summary cards** (read-only, derived)
  2) **Quick-edit fields** for the most-used settings
  3) **Deep links** to the full tool for heavy editing

This avoids duplicating entire tool UIs and keeps the sheet maintainable.

## Architecture / code structure
Create dedicated tab components to keep `CharacterSheet.svelte` small:

- `src/components/character/tabs/EquipmentTab.svelte`
- `src/components/character/tabs/ConsumablesTab.svelte`
- `src/components/character/tabs/LogisticsTab.svelte`
- `src/components/character/tabs/FinanceTab.svelte`
- `src/components/character/tabs/TrainingTab.svelte`
- `src/components/character/tabs/EmergencyTab.svelte`

Optional helper components:
- `src/components/character/widgets/SectionHeader.svelte`
- `src/components/character/widgets/StatCard.svelte`
- `src/components/character/widgets/KeyValueRow.svelte`

Update `CharacterSheet.svelte` to import and render these components in the tab switch.

## Data flow rules (avoid Svelte reactive loops)
- Prefer **event-driven writes** (onchange/onclick) over global `$effect(() => updateCharacter(...))`.
- If you do use `$effect`, guard it with a signature string (only write when inputs truly change).
- Never read reactive store values “just to write them back” on mount.

## Tab requirements

### 1) Equipment tab
**Read-only summary**
- Base weight (already computed)
- Inventory item count, worn items count
- Gear transitions count

**Quick edits (Character slices)**
- `character.equipment.packPrefs.typicalWaterCarryLiters`
- `character.equipment.packPrefs.foodWeightPerDayLb`
- `character.logistics.resupply.carryDays` (since PackBuilder uses it)

**Links**
- `/tools/pack/` (full inventory)
- `/tools/gear/` (budget gear tool)
- `/tools/geartrans/` (gear transitions)

**Optional (nice)**
- Show a small inventory preview table (top 8 items) with category/name/weight.

---

### 2) Consumables tab
**Read-only summary**
- Food: calories/day, days between resupply
- Water: capacity, rate, buffer
- Power: bank capacity + current %, days since town

**Quick edits**
- Food: `character.consumables.food.{caloriesPerDay, caloriesPerOz, daysBetweenResupply}`
- Water: `character.consumables.water.{waterCapacityL, litersPer10Mi, bufferPct}`
- Power: `character.consumables.power.{powerBankCapacityMah, powerBankCurrentPct, daysSinceTown, powerSaveMode}`

**Links**
- `/tools/food/`, `/tools/water/`, `/tools/power/`

---

### 3) Logistics tab
**Read-only summary**
- Resupply preferences (mail-drop-only, require grocery/outfitter)
- Mail drops: count enabled / shipped / received

**Quick edits**
- Resupply: `character.logistics.resupply.{carryDays, mailDropOnly, requireGrocery, requireOutfitter}`
- Mail meta: `character.logistics.mail.{hikerName, supportName, supportPhone, returnAddress, triggerLeadMiles, defaultHoldTimeDays}`

**Links**
- `/tools/resupply/`, `/tools/mail/`

Note: if `MailDropPlanner.svelte` still uses localStorage, migrate it first so the sheet and tool stay in sync.

---

### 4) Finance tab
**Read-only summary**
- Total spend (already computed in sheet)
- Current month spend (derive from `expenses` by YYYY-MM)

**Quick edits**
- Add expense form: amount + category + note + date → append to `character.finance.expenses`
- Category list editor (name/icon/color) → `character.finance.categories`

**Links**
- `/tools/budget/`

Note: `BudgetCalculator.svelte` currently needs migration if it isn’t already reading `character.finance.*`.

---

### 5) Training tab
**Quick edits**
- `character.training.{currentFitness, hikingExperience, weeklyHours}`
- `character.training.completedBenchmarks` (checkbox list)

**Link**
- `/tools/training/`

---

### 6) Emergency tab
**Quick edits**
- Contacts list (add/edit/remove) → `character.emergency.contacts`
- Personal medical block → `character.emergency.personal`

**Link**
- `/tools/emergency/`

## Trail tab improvements (small)
- Add direction select → `character.trail.direction` (NOBO/SOBO/FLIP)
- Optional: toggle “context expanded” preference if desired.

## Styling consistency
- Use site tokens from `src/styles/global.css` (pine/bg/muted/marker).
- Character sheet already has its own style block; keep new tab components using the same token conventions.

## Testing checklist
1) `npm run dev`:
   - Change a value on Character Sheet → open the relevant tool and confirm it reflects immediately.
2) `npm run build` passes.
3) Reload browser (ensure persistence).
4) Optional: test in a private window (service worker/cache sanity).

## Suggested implementation order
1) Consumables tab (small + immediate value)
2) Equipment tab
3) Logistics tab
4) Training + Emergency
5) Finance tab
6) Trail direction + optional portrait
