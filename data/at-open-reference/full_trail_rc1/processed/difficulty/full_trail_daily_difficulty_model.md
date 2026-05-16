
# Full Trail Daily Difficulty Model

The RC1 difficulty model is a planning screen, not field verified and not a field-verified rating.

Inputs:
- distance
- gain/loss, steep descents, and max-grade screens from 100-meter USGS 3DEP/EPQS summaries
- Rockiness V2 score when present; tread v1 remains a compatibility fallback
- tread/rockiness/rootiness/mud model score
- ford uncertainty
- remoteness and bailout scarcity
- water uncertainty
- weather severity and alpine exposure
- permit, fee, camping, and rule friction
- known data-quality gaps

Outputs:
- difficulty_score_0_10
- difficulty_label: easier, moderate, hard, or severe
- explanation
- confidence

Rules:
- Short mileage may still be hard in the Smokies, White Mountains, Maine, Katahdin, and rugged New England.
- Prefer processed/elevation/full_trail_elevation_samples_100m.json for detailed terrain; the 1-mile elevation file is retained for compatibility.
- Prefer processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json for tread/rockiness difficulty input; tread v1 remains for compatibility and regional fallback.
- Static difficulty cannot answer current weather, closures, fords, snow/ice, fire bans, permits, campsite/hut status, or Baxter/Katahdin conditions.
- The Davenport Gap to Damascus corridor receives an explicit regional-gap factor until MVP detail exists.
