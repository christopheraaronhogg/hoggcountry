# Hogg Country Issues Backlog

Active issues being tracked. See README.md for full roadmap.

## In Progress
- [ ] **#9 AWOL 2026 comparison** - Deep audit of our mileage vs official guide

## Pending
- [ ] **#2 Broken links on videos main page** - Bug fix
- [ ] **#3 Approach trail mileage clarification** - Does total include 8.8mi approach?
- [ ] **#4 Resupply planner mobile vs laptop** - Responsive issue
- [ ] **#5 Fontana before Smokies ordering** - Content fix
- [ ] **#6 Add Franklin before Smokies** - Missing resupply town
- [ ] **#7 Website image update** - Asset update
- [ ] **#8 Slider sensitivity** - UX issue
- [ ] **#10 Guide formatting on mobile** - Responsive issue
- [ ] **#11 Gear changes in personal finance** - Missing feature
- [ ] **#12 Damascus drop list review** - Content review
- [ ] **#13 Snowbird/Blood Mountain bottom line** - Content fix
- [ ] **#14 Winter tent site checklist** - New content

## Completed
- [x] **#1 Distance consistency** - YAML-based trail facts with template injection (2026-01-14)
- [x] **Trail Data System** - Created `src/data/trail-facts.yaml` as single source of truth
- [x] **Parser Upgrade** - `parse-master-guide.js` now injects facts from YAML
- [x] **Fact-Check Skill** - Built `/audit-trail-facts` multi-agent system (2026-01-14)

---

## Quick Reference

**Single source of truth:** `src/data/trail-facts.yaml`
**TypeScript wrapper:** `src/data/trailFacts.ts`
**Run fact audit:** `/audit-trail-facts`
**Regenerate guide:** `npm run update-guide`

**Key facts (AWOL 2026):**
- Trail length: **2,197.4 miles** (automatically injected)
- Approach trail: **8.8 miles** (NOT included in AT total)
- States: **14**
- Shelters: **~260**

**Template syntax in master guide:**
```markdown
{{trail.total_miles}}           → 2197.4
{{trail.total_miles|commas}}    → 2,197.4
{{landmarks.blood_mountain.elevation}} → 4458
{{factbox:landmarks.blood_mountain}}   → Generates fact card
{{table:towns.GA}}                     → Generates town table
```

---
*Last updated: 2026-01-14*
