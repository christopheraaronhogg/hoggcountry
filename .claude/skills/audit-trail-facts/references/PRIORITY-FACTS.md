# Priority Facts for Verification

These facts should ALWAYS be verified against multiple sources. They are the most visible and most likely to be questioned.

## Tier 1: Critical (Verify Annually)

These facts appear prominently and are often cited. Get them wrong and credibility suffers.

### Trail Length
```yaml
fact: trail.total_miles
current_value: 2197.4
sources_to_check:
  - ATC website (official)
  - AWOL 2026 (detailed)
  - ATC Data Book (backup)
note: Changes slightly each year due to relocations
```

### Approach Trail
```yaml
fact: trail.approach_trail_miles
current_value: 8.8
sources_to_check:
  - AWOL 2026
  - Amicalola Falls SP website
note: NOT included in AT total mileage
```

### Highest Point
```yaml
fact: extremes.highest_point
current_value:
  name: Clingmans Dome (Kuwohi)
  elevation: 6643
  mile: 199.5
sources_to_check:
  - USGS elevation data
  - ATC (confirms highest)
  - NPS GSMNP
note: Renamed to Kuwohi in 2024
```

### Lowest Point
```yaml
fact: extremes.lowest_point
current_value:
  name: Bear Mountain Bridge
  elevation: 124
  mile: 1394.5
sources_to_check:
  - USGS elevation data
  - ATC
```

### State Count
```yaml
fact: trail.state_count
current_value: 14
sources_to_check:
  - ATC (official)
note: GA, NC, TN, VA, WV, MD, PA, NJ, NY, CT, MA, VT, NH, ME
```

---

## Tier 2: Important (Verify When Updated)

### Completion Rate
```yaml
fact: trail.completion_rate
current_value: 0.25 (25%)
sources_to_check:
  - ATC annual reports
  - ALDHA surveys
note: Varies by year, use most recent data
```

### Shelter Count
```yaml
fact: trail.shelter_count
current_value: ~260
sources_to_check:
  - ATC shelter registry
  - AWOL guide count
note: Changes as shelters built/removed
```

### Virginia Miles (Longest State)
```yaml
fact: states.VA.miles
current_value: 544.6
sources_to_check:
  - AWOL 2026
  - ATC Data Book
note: Often cited as "over 500 miles"
```

---

## Tier 3: Key Landmarks (Verify If Questioned)

### Major Summits

| Landmark | Mile | Elevation | Primary Source |
|----------|------|-----------|----------------|
| Springer Mountain | 0.0 | 3,782 ft | AWOL, ATC |
| Blood Mountain | 30.7 | 4,458 ft | AWOL, USGS |
| Clingmans Dome | 199.5 | 6,643 ft | USGS, NPS |
| Mount Washington | 1841.0 | 6,288 ft | USGS, AMC |
| Katahdin | 2197.4 | 5,269 ft | USGS, BSP |

### Major Towns (First 500 Miles)

| Town | Mile | Verify Services With |
|------|------|---------------------|
| Neels Gap | 31.7 | AWOL, Mountain Crossings website |
| Hiawassee | 69.2 | AWOL, town chamber |
| Franklin | 108.3 | AWOL, town website |
| Fontana Dam | 163.8 | AWOL, TVA |
| Gatlinburg | 206.4 | AWOL, NPS |
| Hot Springs | 273.4 | AWOL, town website |
| Damascus | 471.0 | AWOL, Trail Days |

---

## Annual Verification Checklist

When new AWOL releases (typically January):

- [ ] Total trail length updated?
- [ ] Any major relocations affecting mile markers?
- [ ] Town services still accurate?
- [ ] Any new shelters or closures?
- [ ] State boundary miles unchanged?
- [ ] Update `_meta.awol_edition` in YAML
- [ ] Update `_meta.last_verified` date

---

## Quick Verification Queries

### Check Total Miles (ATC)
```
WebFetch: https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/
Prompt: "What is the official total length of the Appalachian Trail?"
```

### Check Elevation (USGS)
```
# Clingmans Dome coordinates
WebFetch: https://epqs.nationalmap.gov/v1/json?x=-83.4985&y=35.5629&units=Feet
```

### Check Completion Stats (ALDHA)
```
WebSearch: "ALDHA thru-hiker statistics 2025"
```

### Check Town Services
```
WebSearch: "site:whiteblaze.net [town name] services 2026"
```
