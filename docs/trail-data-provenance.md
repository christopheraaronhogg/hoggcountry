# Trail Data Provenance & Licensing Policy

**Status:** Working policy, adopted 2026-06-12.
**Why this exists:** mile-marker data drifted up to ~35 miles from official
guidebook miles because stale frames were mixed and citations were taken on
faith. The fix (anchor calibration) and the rules below keep Hogg Country's
trail data accurate AND legally clean. This doc guides every future data
decision. Not legal advice — get an hour with an IP attorney before the paid
app leans on third-party data commercially.

---

## 1. The one-file recalibration architecture

Every mile the product displays derives from a single chain:

```
src/data/at-mile-anchors.yaml          ~58 citation-backed (location → official mile) facts
        │  scripts/calibrate-at-mileposts.mjs
        ▼
src/data/at-mile-calibration.json      measured→official piecewise curve + committed report
public/at-mileposts.json               milepost positions per official mile (0–2197)
        │  apps/openclaw-web/src/lib/server/map-pack.ts (pack boundary conversion)
        ▼
map · tracker banner · Today brief · Scout lookups · shelter/water/town miles
```

- **Annual update:** when AWOL/ATC 2027 numbers land, update the anchor YAML,
  run `node scripts/calibrate-at-mileposts.mjs`, review the report
  (`data/at-mile-calibration/report.md`), commit. Nothing else changes.
- **Self-validation:** the pipeline reports anchor residuals, per-interval
  scale bounds, and leave-one-out cross-validation (current accuracy: mean
  0.63 mi, max ~3 mi between anchors). `scripts/at-mile-calibration.test.mjs`
  guards the shipped data in `npm test`.
- **Rule:** never hardcode a trail mile anywhere. Anchors feed the pipeline;
  the pipeline feeds everything.

## 2. Licensing rules — what we may and may not use

### The legal foundation (US: *Feist v. Rural Telephone*, 1991)
- **Facts are not copyrightable.** "Bear Mountain Bridge is at NOBO mile
  1409.8" is a fact about the world. Effort spent measuring it ("sweat of the
  brow") creates no copyright.
- **Compilations are thinly protected.** A guidebook's *selection and
  arrangement* — which 3,000 waypoints it includes, its descriptions, icons,
  elevation profiles, layout — IS protected.
- **Contracts can reach further than copyright.** A purchased PDF's terms of
  use can forbid database extraction even where copyright wouldn't. Check the
  purchase terms before any extraction workflow.

### The operating rule: **our selection, their verification**
- ✅ **Allowed:** curating OUR OWN list of landmarks and recording each one's
  official mile, cross-checked against multiple sources with citations. A few
  dozen independently-selected facts is squarely uncopyrightable-facts
  territory. This is how `at-mile-anchors.yaml` was built.
- ✅ **Allowed:** buying AWOL/ATC guides and READING them to verify or correct
  our anchor values (the YAML's medium/low-confidence flags exist for exactly
  this pass). A purchased book used to fact-check your own database is normal,
  legitimate use.
- ✅ **Allowed:** deriving the other 2,197 miles from anchors + geometry. The
  calibrated skeleton is our own work product.
- ❌ **Forbidden:** wholesale extraction of any guidebook's waypoint tables —
  all the shelters/waters/towns with their descriptions, symbols, ordering.
  That reproduces the protected selection/arrangement, likely violates the
  PDF's terms, and burns trust in the small trail community we serve.
- ❌ **Forbidden:** scraping FarOut/Guthook or any app's data, ever.
- ❌ **Forbidden:** adding anchor values "from memory" or uncited sources —
  this is how the original ~35-mile drift happened, hidden behind fabricated
  "AWOL 2026" citations.

### Current source inventory (all clean)
| Source | What we use | License posture |
|---|---|---|
| NPS/ATC ArcGIS `ANST_Centerline` | trail geometry only | public service, geometry has no mileage attributes |
| OpenStreetMap relation 156553 | dense route (via at-open-reference) | **ODbL — attribution + share-alike obligations; see `data/at-open-reference/license_review.md`** |
| ATC Data Book values (2024/25/26) republished on atdist.com / traildistance.com | individual anchor facts, our selection | uncopyrightable facts, cited |
| ATC trail-update pages, The Trek, NPS pages, Wikipedia | cross-checks + coordinates | public web, cited |
| OpenTopoMap tiles | map background | attribution shown on the map |

Note: there is **no openly licensed official mileage dataset**. The NPS org's
`MilePointsFromSpringer` layer totals ~2,169.9 (a stale geometric measure) —
we checked. That's why the anchor approach is necessary, and why the guides
cost money.

## 3. Long-term strategy

1. **ATC licensing conversation.** ATC has partnership/licensing channels.
   "Official ATC mileage, licensed" on Scout is a trust asset, not just legal
   cover. Worth pursuing before the paid app launches.
2. **Dad's hike = first-party ground truth.** From Feb 2026, his Garmin track
   is a continuous measurement of the actual 2026 trail. By Katahdin we own an
   end-to-end GPS trace nobody can license-restrict — a unique calibration and
   product asset. Preserve every fix.
3. **Annual recalibration playbook:** buy the new AWOL/Data Book → verify the
   ~58 anchors against it (reading + correcting our own facts; ~20 minutes) →
   re-run the pipeline → review the report → ship.

## 4. Known gaps (as of 2026-06-12)

- `MASTER_NOBO_FIELD_GUIDE.md` bail-out/mileage tables still carry mixed-frame
  rows up to ~90 mi off; regenerate them data-driven from the calibrated
  waypoints rather than patching rows.
- Anchors marked `medium`/`low` in `at-mile-anchors.yaml` await verification
  against the physical AWOL 2026 guide.
- `/audit-trail-facts` validation pass pending after the trail-facts
  recalibration.
- Active trail detours (post-Helene Nolichucky/Damascus corridor, per the 2026
  Data Book) mean on-the-ground mileage can differ from any guide locally.
