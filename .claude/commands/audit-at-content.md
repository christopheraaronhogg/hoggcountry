---
description: Run AT thru-hiker expert assessment on field guide content and trail tools
---

# AT Content Audit

Have an expert AT thru-hiker (5x finisher) assess the field guide and trail tools for accuracy, completeness, safety, and real-world applicability.

## What Gets Assessed

### Field Guide Content
The `MASTER_NOBO_FIELD_GUIDE.md` document covering:
- Gear recommendations
- Clothing systems
- Weather strategy
- Resupply logistics
- Town information
- Permits and regulations
- Safety protocols
- Training guidance
- Financial planning

### Trail Tools
Interactive tools in `src/components/`:
- LayeringAdvisor.svelte
- ShelterDecision.svelte
- WeatherAssessor.svelte
- MilestoneTracker.svelte
- PackBuilder.svelte
- ResupplyPlanner.svelte
- WaterCalculator.svelte
- BudgetTracker.svelte
- MailDropPlanner.svelte
- PowerManager.svelte
- FoodCalculator.svelte
- GearSwapper.svelte
- TrainingSchedule.svelte
- EmergencyProtocol.svelte

## Execution

Launch the `at-thru-hiker-consultant` agent to:

1. **Read the full field guide** (`MASTER_NOBO_FIELD_GUIDE.md`)
2. **Review trail tool components** for logic accuracy
3. **Perform live research** to verify current information
4. **Cross-reference** against official ATC data
5. **Generate comprehensive assessment report**

## Output

Creates report at:
```
audit-reports/at-content-{timestamp}/
├── 00-executive-summary.md
├── 01-field-guide-assessment.md
├── 02-tools-assessment.md
└── 03-recommendations.md
```

## Running the Audit

The consultant agent will:
1. Read all field guide content
2. Analyze tool logic and calculations
3. Research current trail conditions and regulations
4. Identify inaccuracies, gaps, and safety concerns
5. Write detailed findings to report files
6. Return summary status

## Expert Credentials

The assessment comes from "Ridgeline" persona:
- 5 completed AT thru-hikes (3 NOBO, 2 SOBO)
- Triple Crown holder (AT, PCT, CDT)
- 15+ years long-distance hiking
- Trail guide and ATC volunteer

## Alternative Commands

For focused assessments:
- Focus on field guide only: Ask consultant to assess only `MASTER_NOBO_FIELD_GUIDE.md`
- Focus on specific tool: Ask consultant to assess specific component
- Focus on specific section: Ask about gear, resupply, weather, etc.
