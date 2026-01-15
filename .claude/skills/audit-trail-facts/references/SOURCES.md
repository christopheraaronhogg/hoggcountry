# Official AT Data Sources

Reference guide for verifying Appalachian Trail facts.

## Primary Sources

### 1. ATC (Appalachian Trail Conservancy)

**Authority:** Official trail maintainer and governing body
**Best for:** Total mileage, state boundaries, official statistics, shelter registry

**Key URLs:**
- Main: https://appalachiantrail.org
- Trail facts: https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/
- State pages: https://appalachiantrail.org/explore/explore-by-state/
- Shelter list: https://appalachiantrail.org/explore/hike-the-a-t/shelters/

**How to query:**
```
WebFetch: https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/
Prompt: "Extract the official total trail mileage and any statistics about thru-hiking"
```

**Data available:**
- Total trail length (official)
- Number of states
- Completion statistics
- Shelter count
- Trail history

**Citation format:**
```yaml
citation:
  source: ATC
  year: 2026
  url: https://appalachiantrail.org/...
```

---

### 2. AWOL Guide (The A.T. Guide by David Miller)

**Authority:** Most trusted hiker reference, updated annually
**Best for:** Detailed mile markers, town services, water sources, shelter details

**How to access:**
- Purchase annual edition (print or PDF)
- Cannot be scraped - use as manual reference
- New editions typically release in December/January

**Data available:**
- Mile-by-mile waypoints
- Town distances and services
- Shelter capacities
- Water source locations
- Road crossings
- Elevation profiles

**Citation format:**
```yaml
citation:
  source: AWOL
  year: 2026
  page: 14
  note: "Town services verified"
```

**Current edition:** AWOL 2026

---

### 3. NPS (National Park Service)

**Authority:** Federal land manager for AT corridor
**Best for:** Official park data, regulations, permits

**Key URLs:**
- AT main: https://www.nps.gov/appa
- GSMNP: https://www.nps.gov/grsm (Great Smoky Mountains)
- SNP: https://www.nps.gov/shen (Shenandoah)

**How to query:**
```
WebFetch: https://www.nps.gov/appa/planyourvisit/index.htm
Prompt: "Extract trail information, mileage, and any official statistics"
```

**Data available:**
- Park-specific regulations
- Permit requirements
- Official park mileage
- Campsite/shelter info within parks

**Citation format:**
```yaml
citation:
  source: NPS
  year: 2026
  url: https://www.nps.gov/appa/...
```

---

### 4. ALDHA (Appalachian Long Distance Hikers Association)

**Authority:** Hiker community organization
**Best for:** Completion statistics, hiker surveys, historical data

**Key URLs:**
- Main: https://aldha.org
- 2000-miler list: https://aldha.org/2000-milers/

**How to query:**
```
WebFetch: https://aldha.org
Prompt: "Find thru-hiker completion statistics, success rates, and survey data"
```

**Data available:**
- Annual completion numbers
- Success rate estimates
- Average completion times
- Demographics data

**Citation format:**
```yaml
citation:
  source: ALDHA
  year: 2025
  note: "From annual hiker survey"
```

---

### 5. USGS (US Geological Survey)

**Authority:** Federal mapping agency
**Best for:** Elevation data, topographic verification

**Key URLs:**
- National Map: https://apps.nationalmap.gov/viewer/
- Elevation query: https://nationalmap.gov/epqs/

**How to query elevation:**
```
WebFetch: https://epqs.nationalmap.gov/v1/json?x=-83.9286&y=34.7392&units=Feet&wkid=4326
Prompt: "Return the elevation value"
```
(Coordinates are longitude, latitude)

**Data available:**
- Peak elevations
- Gap/pass elevations
- Topographic profiles

**Citation format:**
```yaml
citation:
  source: USGS
  note: "USGS National Elevation Dataset"
```

---

## Secondary Sources

### 6. FarOut (formerly Guthook)

**Authority:** GPS-verified waypoints from hikers
**Best for:** Current conditions, GPS coordinates, crowdsourced updates

**URL:** https://faroutguides.com

**Note:** Commercial app, data not freely scrapable. Use for manual verification.

---

### 7. WhiteBlaze

**Authority:** Largest AT hiker forum
**Best for:** Current conditions, recent hiker reports, town updates

**URL:** https://www.whiteblaze.net

**How to query:**
```
WebSearch: "site:whiteblaze.net [topic] 2026"
```

**Use for:**
- Verifying town services still exist
- Recent trail conditions
- Service closures/changes

---

### 8. ATC Data Book

**Authority:** Official ATC publication
**Best for:** Precise mile markers (separate from AWOL)

**Note:** Annual publication, provides second verification for mileage data.

---

## Verification Hierarchy

When sources disagree, use this priority:

1. **ATC** - Official governing body (for official stats)
2. **AWOL** - Most detailed and updated annually (for waypoints)
3. **NPS** - For park-specific data
4. **USGS** - For elevation verification
5. **ALDHA** - For hiker statistics
6. **FarOut/WhiteBlaze** - For current conditions only

## Multi-Source Citation Example

```yaml
clingmans_dome:
  name: Clingmans Dome (Kuwohi)
  mile: 199.5
  elevation: 6643
  citations:
    - source: AWOL
      year: 2026
      page: 42
      note: "Mile marker"
    - source: ATC
      year: 2026
      note: "Confirmed highest point on AT"
    - source: USGS
      note: "Elevation verified via National Elevation Dataset"
    - source: NPS
      year: 2024
      note: "Renamed to Kuwohi, Cherokee name restored"
```

## Quick Verification Commands

```bash
# Check ATC for official mileage
WebFetch https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/

# Check USGS elevation for coordinates
WebFetch "https://epqs.nationalmap.gov/v1/json?x=-83.4985&y=35.5629&units=Feet"

# Search WhiteBlaze for recent info
WebSearch "site:whiteblaze.net Damascus services 2026"

# Search ATC for state-specific data
WebFetch https://appalachiantrail.org/explore/explore-by-state/georgia/
```
