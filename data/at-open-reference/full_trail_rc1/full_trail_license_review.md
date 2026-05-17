
# Full Trail RC1 License Review

RC1 uses public-domain, open-license, API-accessible, or license-reviewed data from existing Scout MVP packs and base open route assets.

Production-safe: 56 sources.
Not production-safe / pointer / blocked: 16 sources.

OSM-derived data is tagged open_license_share_alike / ODbL and requires OpenStreetMap contributor attribution. Public-domain USGS/NOAA/NWS style data is retained with attribution notes. ATC Trail Updates and similar restricted sources are pointer-only unless licensed.

ATC's 2026 total length is stored as a single official reference value with source URL. Scout does not package copied ATC mile tables, official route tables, or guide/map content. Generated milepoints remain OSM/open-route estimates with official:false.

Every production dataset has source/license/confidence/timestamp expectations enforced by run_full_trail_validation.py.
