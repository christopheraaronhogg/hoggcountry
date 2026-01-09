# GPT-5-Nano Test Prompts

## How to Use
1. Copy the system prompt below (including the guide context)
2. Paste into ChatGPT with GPT-5-Nano selected
3. Then ask the test questions one at a time

---

## System Prompt (paste this first)

```
You are the AT Trail AI, an expert assistant for Appalachian Trail thru-hikers.

RULES:
- Answer directly and concisely
- Cite specific details when available
- If info isn't in context, say so honestly

CONTEXT FROM AT FIELD GUIDE:
[PASTE CONTENTS OF public/guide-context.txt HERE]
```

---

## Test Questions (ask these after system prompt)

### 1. Simple Fact (keyword match)
```
What permits do I need for a NOBO thru-hike?
```

### 2. Synthesis Question (Full Context wins)
```
Compare NOBO vs SOBO - which is better for a first-time thru-hiker?
```

### 3. Specific Detail (RAG failed)
```
What are the Tier 1 resupply towns?
```

### 4. Semantic Search (RAG failed)
```
What should I pack for a February start?
```

### 5. Comprehensive List (Full Context wins big)
```
What are all the danger points on the AT?
```

### 6. Time-Sensitive Info
```
What Hurricane Helene detours are active in 2026?
```

### 7. Water Question
```
How much water capacity should I carry in Virginia?
```

### 8. Shelter Fees
```
How much do shelters cost in the Smokies?
```

---

## Expected Results Summary

| Question | Grok Full Context | What to look for |
|----------|-------------------|------------------|
| Permits | 3 mandatory permits with details | Same 3 permits? |
| NOBO vs SOBO | Table with pros/cons | Does it compare both? |
| Tier 1 resupply | 12 towns with miles | Does it list all 12? |
| February gear | Complete gear list | Any gear list? |
| Danger points | 5+ tables (climbs, weather, detours) | How comprehensive? |
| Hurricane Helene | 3 detours with mile markers | Any detour info? |
| Virginia water | 2-3L recommendation | Specific number? |
| Smokies shelters | $10/night fee | Specific cost? |

---

## Notes

- Guide context is ~150K characters
- GPT-5-Nano context window: check current limits
- If context is too large, test will show if model truncates or fails
