# MVP1 Tread / Rockiness Model Notes

Scores are 0-5:

- 0 smooth
- 1 mostly smooth
- 2 moderate rocks/roots
- 3 rocky/uneven
- 4 very rocky
- 5 severe rocks/boulders/scramble

Pace multipliers: 0=1.00x, 1=1.03x, 2=1.08x, 3=1.15x, 4=1.25x, 5=1.40x.

Inputs used in MVP1:

- OSM surface/smoothness/trail_visibility/sac_scale tags when matched near the open route.
- USGS 3DEP 1-mile elevation samples for slope/local-relief proxy.

Inputs documented but not yet ingested:

- USDA SSURGO/gSSURGO rock fragments, shallow bedrock, rock outcrop, stony/bouldery terms.
- Geology layers.
- Field/user reports.

No MVP1 tread score is field_verified; each score is not field_verified and must be described as a model estimate. Scout must state confidence and avoid overclaiming rockiness.
