#!/usr/bin/env python3
"""Validate the Scout Appalachian Trail MVP5 MA/VT/NH reference pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}
FORBIDDEN_LICENSES = {"unknown_review_required", "blocked"}
POINTER_SOURCE_IDS = {"atc_trail_updates_pointer", "amc_pointer", "gmc_pointer"}
BLOCKED_SOURCE_IDS = {
    "atc_website",
    "atc_trail_updates_pointer",
    "amc_pointer",
    "gmc_pointer",
    "farout",
    "awol_at_guide",
    "at_data_book",
    "alltrails_gaia_hiking_project",
}
PACE = {0: 1.00, 1: 1.03, 2: 1.08, 3: 1.15, 4: 1.25, 5: 1.40}

REQUIRED_PATHS = [
    "README.md",
    "source_manifest.yaml",
    "license_review.md",
    "blocked_sources.md",
    "attribution.md",
    "prompt_artifact_checklist.md",
    "data_quality_report_mvp5_ma_vt_nh.md",
    "MVP5_STATUS.md",
    "manifest.json",
    "processed/route/mvp5_ma_vt_nh_route.geojson",
    "processed/route/route_notes.md",
    "processed/milepoints/mvp5_ma_vt_nh_milepoints_0_1mi.geojson",
    "processed/milepoints/mvp5_ma_vt_nh_milepoints_0_5mi.geojson",
    "processed/milepoints/mvp5_ma_vt_nh_milepoints_1_0mi.geojson",
    "processed/elevation/elevation_samples_1_0mi.json",
    "processed/elevation/elevation_profile.geojson",
    "processed/elevation/climbs_descents_by_5mi_segment.json",
    "processed/elevation/climbs_descents_by_10mi_segment.json",
    "processed/elevation/major_climbs.json",
    "processed/elevation/major_descents.json",
    "processed/elevation/high_low_points.json",
    "processed/elevation/steep_descents.json",
    "processed/elevation/exposed_ridgelines.json",
    "processed/elevation/elevation_summary.json",
    "processed/elevation/elevation_summary.md",
    "processed/water/water_crossings.geojson",
    "processed/water/spring_drinking_water_candidates.json",
    "processed/water/water_candidates.json",
    "processed/water/sparse_uncertain_water_stretches.json",
    "processed/water/water_confidence_notes.md",
    "processed/waypoints/shelters.json",
    "processed/waypoints/campsites.json",
    "processed/waypoints/privies.json",
    "processed/waypoints/parking.json",
    "processed/waypoints/road_crossings.json",
    "processed/waypoints/trailheads.json",
    "processed/waypoints/vistas.json",
    "processed/waypoints/huts.json",
    "processed/waypoints/tent_sites.json",
    "processed/waypoints/summits.json",
    "processed/waypoints/alpine_exposure_points.json",
    "processed/waypoints/towns_resupply_candidates.json",
    "processed/waypoints/private_businesses_review_required.json",
    "processed/rules/rules_by_land_manager.json",
    "processed/rules/rules_by_state.json",
    "processed/live_conditions/live_condition_sources.json",
    "processed/live_conditions/nps_alerts_cache.json",
    "processed/live_conditions/usfs_wmnf_alerts_cache.json",
    "processed/live_conditions/usfs_gmnf_alerts_cache.json",
    "processed/live_conditions/nws_alerts_cache.json",
    "processed/live_conditions/ma_vt_nh_state_alerts_cache.json",
    "processed/live_conditions/ma_vt_nh_state_local_alert_sources.json",
    "processed/tread_rockiness/tread_rockiness_0_1mi.json",
    "processed/tread_rockiness/tread_rockiness_1_0mi.json",
    "processed/tread_rockiness/tread_rockiness_5_0mi.json",
    "processed/tread_rockiness/model_notes.md",
    "processed/tread_rockiness/mvp5_mountain_tread_mud_calibration_report.json",
    "processed/tread_rockiness/mvp5_mountain_tread_mud_calibration_report.md",
    "processed/difficulty/difficulty_by_10mi_segment.json",
    "processed/difficulty/difficulty_policy.md",
    "processed/export/manifest.json",
    "processed/export/scout_at_mvp5_ma_vt_nh_production_safe.json",
    "processed/export/scout_at_mvp5_ma_vt_nh_production_safe.zip",
    "rag_docs/state_guides/MA.md",
    "rag_docs/state_guides/VT.md",
    "rag_docs/state_guides/NH.md",
    "rag_docs/rules/camping_permit_fee_mvp5_ma_vt_nh.md",
    "rag_docs/policies/water.md",
    "rag_docs/policies/navigation.md",
    "rag_docs/policies/weather_live_conditions.md",
    "rag_docs/policies/tread_rockiness.md",
    "rag_docs/rag_doc_metadata.json",
    "schemas/route.schema.json",
    "schemas/milepoint.schema.json",
    "schemas/elevation_sample.schema.json",
    "schemas/water_candidate.schema.json",
    "schemas/waypoint.schema.json",
    "schemas/rule.schema.json",
    "schemas/rag_doc_metadata.schema.json",
    "schemas/tread_rockiness.schema.json",
    "schemas/difficulty.schema.json",
    "tests/mvp5_ma_vt_nh_behavior_questions.json",
]


def j(relative: str) -> Any:
    return json.loads((ROOT / relative).read_text())


def t(relative: str) -> str:
    return (ROOT / relative).read_text()


def rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    if isinstance(value, dict) and isinstance(value.get("features"), list):
        return [feature.get("properties", feature) for feature in value["features"] if isinstance(feature, dict)]
    return [value] if isinstance(value, dict) else []


def fail_if(condition: bool, failures: list[str], message: str) -> None:
    if condition:
        failures.append(message)


def common(record: dict[str, Any], failures: list[str], label: str, allow_blocked_pointer: bool = False) -> None:
    fail_if(not (record.get("source_id") or record.get("source_ids")), failures, f"{label} missing source")
    fail_if(not (record.get("source_url") or record.get("source_ids")), failures, f"{label} missing source URL")
    license_status = record.get("license_status")
    source_id = record.get("source_id")
    pointer_ok = allow_blocked_pointer and source_id in POINTER_SOURCE_IDS and license_status == "blocked"
    fail_if(not pointer_ok and license_status not in VALID_LICENSES, failures, f"{label} invalid license {license_status}")
    fail_if(not pointer_ok and license_status in FORBIDDEN_LICENSES, failures, f"{label} forbidden license")
    fail_if(not pointer_ok and source_id in BLOCKED_SOURCE_IDS, failures, f"{label} blocked source")
    fail_if(not record.get("confidence"), failures, f"{label} missing confidence")
    fail_if(not (record.get("last_checked") or record.get("last_generated")), failures, f"{label} missing timestamp")
    fail_if(not record.get("ai_answer_rule"), failures, f"{label} missing ai_answer_rule")


def validate_pack() -> dict[str, Any]:
    failures: list[str] = []
    for relative in REQUIRED_PATHS:
        fail_if(not (ROOT / relative).exists(), failures, f"missing {relative}")

    manifest = j("source_manifest.yaml")
    sources = {source.get("source_id"): source for source in manifest}
    for source in manifest:
        for field in ["source_id", "name", "owner", "source_url", "license_status", "allowed_use", "attribution_required", "confidence", "last_checked"]:
            fail_if(not source.get(field), failures, f"source {source.get('source_id')} missing {field}")
        fail_if(source.get("license_status") not in VALID_LICENSES | {"blocked"}, failures, f"source {source.get('source_id')} invalid license")
    for blocked in BLOCKED_SOURCE_IDS:
        if blocked in sources:
            fail_if(sources[blocked].get("license_status") != "blocked", failures, f"blocked source {blocked} not blocked")
    for required_source in [
        "osm",
        "usgs_3dep",
        "usgs_3dhp_nhd",
        "noaa_nws_api",
        "nps_api",
        "ma_dcr_official_pages",
        "vt_state_official_pages",
        "usfs_gmnf_official_pages",
        "nh_state_local_official_pages",
        "usfs_wmnf_official_pages",
        "mavtnh_state_local_alerts",
        "amc_pointer",
        "gmc_pointer",
        "atc_trail_updates_pointer",
        "usda_ssurgo_gssurgo",
        "usgs_geology_weak_signal",
        "mvp5_ma_vt_nh_tread_model",
        "mvp5_ma_vt_nh_difficulty_model",
    ]:
        fail_if(required_source not in sources, failures, f"source manifest missing {required_source}")
    fail_if(sources.get("osm", {}).get("license_status") != "open_license_share_alike", failures, "OSM not ODbL/share-alike")

    blocked_text = t("blocked_sources.md").lower()
    for term in ["farout", "a.t. guide", "alltrails", "gaia", "hiking project", "atc"]:
        fail_if(term not in blocked_text, failures, f"blocked_sources missing {term}")

    route = rows(j("processed/route/mvp5_ma_vt_nh_route.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route must be official:false")
    fail_if(route.get("measured_length_miles") != 377.0, failures, "route measured length must be 377.0")
    fail_if(route.get("start_mile_nobo_global_est") != 1476.0, failures, "route start global mile wrong")
    fail_if(route.get("end_mile_nobo_global_est") != 1853.0, failures, "route end global mile wrong")
    fail_if("not official atc" not in route.get("ai_answer_rule", "").lower(), failures, "route missing official-mile caution")
    notes = t("processed/route/route_notes.md").lower()
    for term in ["mvp4", "mvp6", "sages ravine", "nh/me", "berkshires", "green mountain", "white mountain", "presidential", "not official atc"]:
        fail_if(term not in notes, failures, f"route notes missing {term}")

    for interval, minimum in [("0_1", 3770), ("0_5", 754), ("1_0", 378)]:
        data = rows(j(f"processed/milepoints/mvp5_ma_vt_nh_milepoints_{interval}mi.geojson"))
        fail_if(len(data) < minimum, failures, f"{interval} milepoints too few")
        for record in data[:15] + data[-5:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official flag wrong")
            fail_if(record.get("state") not in {"MA", "VT", "NH"}, failures, "milepoint state wrong")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint caution missing")

    elevation = j("processed/elevation/elevation_samples_1_0mi.json")
    fail_if(len(elevation) < 378, failures, "elevation samples too few")
    for record in elevation[:5] + elevation[-5:]:
        common(record, failures, "elevation")
        fail_if(record.get("source_id") != "usgs_3dep", failures, "elevation not USGS")
        fail_if("model-derived" not in record.get("ai_answer_rule", "").lower(), failures, "elevation missing model caution")
    for relative in ["climbs_descents_by_5mi_segment", "climbs_descents_by_10mi_segment", "major_climbs", "major_descents", "steep_descents"]:
        data = j(f"processed/elevation/{relative}.json")
        fail_if(not data, failures, f"{relative} empty")
        for record in data[:5]:
            common(record, failures, relative)
    exposed = j("processed/elevation/exposed_ridgelines.json")
    fail_if(len(exposed) < 1, failures, "exposed ridgelines missing")
    for record in exposed[:3]:
        common(record, failures, "exposed ridgeline")
        fail_if("nws" not in record.get("ai_answer_rule", "").lower(), failures, "exposed ridgeline missing live weather caution")
    high_low = j("processed/elevation/high_low_points.json")
    common(high_low, failures, "high low")
    summary = j("processed/elevation/elevation_summary.json")
    common(summary, failures, "elevation summary")
    fail_if(summary.get("total_gain_ft", 0) <= 30000, failures, "total gain too low for MA/VT/NH span")
    summary_md = t("processed/elevation/elevation_summary.md").lower()
    fail_if("short-but-severe" not in summary_md, failures, "elevation md missing short-but-severe caution")

    water = j("processed/water/water_candidates.json")
    fail_if(len(water) < 300, failures, "water candidates too few")
    for record in water[:10] + water[-5:]:
        common(record, failures, "water")
        fail_if(record.get("state") not in {"MA", "VT", "NH"}, failures, "water state wrong")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability not unknown")
        fail_if(record.get("potable") != "unknown", failures, "water potability not unknown")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified unexpectedly set")
        fail_if("mapped water candidate" not in record.get("ai_answer_rule", "").lower(), failures, "water mapped candidate wording missing")
    fail_if("mapped water candidate" not in t("processed/water/water_confidence_notes.md").lower(), failures, "water notes missing mapped wording")

    for name, minimum in {
        "shelters": 30,
        "campsites": 20,
        "privies": 10,
        "parking": 250,
        "road_crossings": 300,
        "trailheads": 5,
        "vistas": 40,
        "huts": 1,
        "tent_sites": 25,
        "summits": 15,
        "alpine_exposure_points": 20,
        "towns_resupply_candidates": 120,
    }.items():
        data = j(f"processed/waypoints/{name}.json")
        fail_if(len(data) < minimum, failures, f"{name} too few")
        for record in data[:5]:
            common(record, failures, name)
            fail_if(record.get("state") not in {"MA", "VT", "NH"}, failures, f"{name} state wrong")
    towns = j("processed/waypoints/towns_resupply_candidates.json")
    for record in towns[:10]:
        fail_if(record.get("candidate_services", {}).get("grocery") != "unknown", failures, "town services should remain unknown")
        fail_if("guidebook" not in record.get("ai_answer_rule", "").lower(), failures, "town missing guidebook caution")

    rules = j("processed/rules/rules_by_land_manager.json")
    expected_rules = {
        "mvp5-mavtnh-ma-at-designated-sites",
        "mvp5-mavtnh-green-mountain-nf-long-trail",
        "mvp5-mavtnh-vt-state-local-lands",
        "mvp5-mavtnh-hanover-local-lands",
        "mvp5-mavtnh-white-mountain-nf",
        "mvp5-mavtnh-amc-huts-campsites-pointer",
        "mvp5-mavtnh-alpine-fpa-restrictions",
        "mvp5-mavtnh-local-municipal-private-easement-source-gap",
    }
    fail_if({rule.get("rule_id") for rule in rules} != expected_rules, failures, "unexpected rule IDs")
    for record in rules:
        common(record, failures, "rule", allow_blocked_pointer=True)
        text = " ".join(str(record.get(key, "")) for key in ["camping_policy", "ai_answer_rule", "alpine_rule", "group_rule"]).lower()
        fail_if("verify" not in text, failures, f"rule {record.get('rule_id')} missing verify caution")
    rule_doc = t("rag_docs/rules/camping_permit_fee_mvp5_ma_vt_nh.md").lower()
    for term in ["green mountain", "white mountain", "amc", "alpine", "verify current"]:
        fail_if(term not in rule_doc, failures, f"rule doc missing {term}")

    live_sources = j("processed/live_conditions/live_condition_sources.json")
    live_source_ids = {source.get("source_id") for source in live_sources}
    for required in ["noaa_nws_api", "nps_api", "ma_dcr_official_pages", "vt_state_official_pages", "usfs_gmnf_official_pages", "usfs_wmnf_official_pages", "nh_state_local_official_pages", "amc_pointer", "gmc_pointer", "atc_trail_updates_pointer"]:
        fail_if(required not in live_source_ids, failures, f"live source missing {required}")
    for record in live_sources:
        common(record, failures, "live source", allow_blocked_pointer=True)
        fail_if("live" not in record.get("update_cadence", "").lower(), failures, "live source missing live cadence")
    live_policy = t("rag_docs/policies/weather_live_conditions.md").lower()
    for term in ["alpine weather", "mud closures", "hut/campsite status", "verification pointers", "live retrieval fails"]:
        fail_if(term not in live_policy, failures, f"live policy missing {term}")
    for cache in ["nps_alerts_cache", "usfs_wmnf_alerts_cache", "usfs_gmnf_alerts_cache", "nws_alerts_cache", "ma_vt_nh_state_alerts_cache"]:
        record = j(f"processed/live_conditions/{cache}.json")
        fail_if(record.get("status") != "not_fetched_static_pack", failures, f"{cache} status wrong")
        fail_if("static mvp5 cache is not current" not in record.get("ai_answer_rule", "").lower(), failures, f"{cache} missing stale-cache warning")

    for name, expected_min in [("tread_rockiness_0_1mi", 3770), ("tread_rockiness_1_0mi", 377), ("tread_rockiness_5_0mi", 75)]:
        data = j(f"processed/tread_rockiness/{name}.json")
        fail_if(len(data) < expected_min, failures, f"{name} too few")
        for record in data[:10] + data[-5:]:
            common(record, failures, name)
            score = record.get("score")
            fail_if(score not in PACE, failures, f"{name} invalid score")
            fail_if(record.get("pace_penalty_multiplier") != PACE.get(score), failures, f"{name} pace mismatch")
            fail_if(record.get("field_verified") is not False, failures, f"{name} must not be field verified")
            fail_if("model-estimated" not in record.get("ai_answer_rule", "").lower(), failures, f"{name} missing model wording")
            fail_if("wet_mud_flag" not in record, failures, f"{name} missing wet/mud flag")
            fail_if("rootiness_flag" not in record, failures, f"{name} missing rootiness flag")
    tread_notes = t("processed/tread_rockiness/model_notes.md").lower()
    for term in ["ssurgo/gssurgo", "not field_verified", "mud", "roots"]:
        fail_if(term not in tread_notes, failures, f"tread notes missing {term}")
    calibration = j("processed/tread_rockiness/mvp5_mountain_tread_mud_calibration_report.json")
    common(calibration, failures, "tread calibration")
    fail_if("white_mountain_average_score" not in calibration, failures, "calibration missing White Mountain screen")
    calibration_md = t("processed/tread_rockiness/mvp5_mountain_tread_mud_calibration_report.md").lower()
    for term in ["massachusetts", "vermont", "new hampshire", "white mountain", "presidential", "not field_verified"]:
        fail_if(term not in calibration_md, failures, f"calibration md missing {term}")

    difficulty = j("processed/difficulty/difficulty_by_10mi_segment.json")
    fail_if(len(difficulty) < 37, failures, "difficulty segments too few")
    for record in difficulty[:10] + difficulty[-5:]:
        common(record, failures, "difficulty")
        for field in ["distance_miles", "elevation_gain_ft", "elevation_loss_ft", "tread_score_avg", "mud_factor", "alpine_exposure_factor", "bailout_scarcity_factor", "weather_severity_factor", "water_uncertainty_factor"]:
            fail_if(field not in record, failures, f"difficulty missing {field}")
        difficulty_rule = record.get("ai_answer_rule", "").lower()
        fail_if("planning" not in difficulty_rule or "screen" not in difficulty_rule, failures, "difficulty missing planning-screen caution")
    fail_if("not a safety guarantee" not in t("processed/difficulty/difficulty_policy.md").lower(), failures, "difficulty policy missing safety caution")

    docs = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(docs) < 24, failures, "rag docs too few")
    for record in docs:
        common(record, failures, "rag doc")
        fail_if(not (ROOT / record["path"]).exists(), failures, f"rag doc file missing {record['path']}")
    for state_file, terms in {
        "MA.md": ["berkshires", "greylock", "massachusetts dcr"],
        "VT.md": ["green mountain", "long trail", "mud"],
        "NH.md": ["white mountain", "presidential", "alpine", "amc"],
    }.items():
        text = t(f"rag_docs/state_guides/{state_file}").lower()
        for term in terms:
            fail_if(term not in text, failures, f"{state_file} missing {term}")
    segment_docs = sorted((ROOT / "rag_docs/segment_guides").glob("*.md"))
    fail_if(len(segment_docs) < 16, failures, "segment docs too few")
    first_segment = segment_docs[0].read_text().lower()
    for term in ["## terrain", "## water candidates", "## difficulty", "## camping / permit summary", "## ai cautions", "generated miles are not official"]:
        fail_if(term not in first_segment, failures, f"segment guide missing {term}")

    behavior = j("tests/mvp5_ma_vt_nh_behavior_questions.json")
    fail_if(len(behavior) < 70, failures, "behavior question count below 70")
    behavior_text = json.dumps(behavior).lower()
    for term in ["presidential", "franconia", "green mountain", "white mountains", "mud", "amc", "gmc", "illegal dispersed camping", "reliability unknown", "current/future weather"]:
        fail_if(term not in behavior_text, failures, f"behavior questions missing {term}")

    safe_export = j("processed/export/scout_at_mvp5_ma_vt_nh_production_safe.json")
    for source in safe_export.get("source_manifest", []):
        fail_if(source.get("license_status") in FORBIDDEN_LICENSES, failures, "production export includes forbidden source")
        fail_if(source.get("source_id") in POINTER_SOURCE_IDS, failures, "production export includes pointer source")
    zip_bytes = (ROOT / "processed/export/scout_at_mvp5_ma_vt_nh_production_safe.zip").read_bytes()[:4]
    fail_if(zip_bytes != b"PK\x03\x04", failures, "production zip missing ZIP header")

    result = {
        "ok": not failures,
        "failures": failures,
        "mvp5_ma_vt_nh_miles": route.get("measured_length_miles"),
        "behavior_questions": len(behavior),
        "rag_docs": len(docs),
        "water_candidates": len(water),
        "tread_1mi_records": len(j("processed/tread_rockiness/tread_rockiness_1_0mi.json")),
        "difficulty_segments": len(difficulty),
        "waypoint_counts": {
            "shelters": len(j("processed/waypoints/shelters.json")),
            "campsites": len(j("processed/waypoints/campsites.json")),
            "huts": len(j("processed/waypoints/huts.json")),
            "tent_sites": len(j("processed/waypoints/tent_sites.json")),
            "alpine_exposure_points": len(j("processed/waypoints/alpine_exposure_points.json")),
            "towns_resupply_candidates": len(towns),
        },
    }
    (ROOT / "tests/validation_results_mvp5_ma_vt_nh.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true", help="print JSON result")
    args = parser.parse_args()
    result = validate_pack()
    if args.json:
        print(json.dumps(result))
    else:
        print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["ok"] else 1)


if __name__ == "__main__":
    main()
