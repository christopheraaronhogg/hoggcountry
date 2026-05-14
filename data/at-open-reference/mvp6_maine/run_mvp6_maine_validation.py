#!/usr/bin/env python3
"""Validate the Scout Appalachian Trail MVP6 Maine reference pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}
FORBIDDEN_LICENSES = {"unknown_review_required", "blocked"}
POINTER_SOURCE_IDS = {"atc_trail_updates_pointer", "monson_pointer"}
BLOCKED_SOURCE_IDS = {
    "atc_website",
    "atc_trail_updates_pointer",
    "monson_pointer",
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
    "data_quality_report_mvp6_maine.md",
    "MVP6_STATUS.md",
    "manifest.json",
    "processed/route/mvp6_maine_route.geojson",
    "processed/route/route_notes.md",
    "processed/milepoints/mvp6_maine_milepoints_0_1mi.geojson",
    "processed/milepoints/mvp6_maine_milepoints_0_5mi.geojson",
    "processed/milepoints/mvp6_maine_milepoints_1_0mi.geojson",
    "processed/elevation/elevation_samples_1_0mi.json",
    "processed/elevation/elevation_profile.geojson",
    "processed/elevation/climbs_descents_by_5mi_segment.json",
    "processed/elevation/climbs_descents_by_10mi_segment.json",
    "processed/elevation/major_climbs.json",
    "processed/elevation/major_descents.json",
    "processed/elevation/high_low_points.json",
    "processed/elevation/steep_descents.json",
    "processed/elevation/exposed_ridgelines.json",
    "processed/elevation/mahoosuc_difficulty_flags.json",
    "processed/elevation/katahdin_climb_summary.json",
    "processed/elevation/elevation_summary.json",
    "processed/elevation/elevation_summary.md",
    "processed/water/water_crossings.geojson",
    "processed/water/spring_drinking_water_candidates.json",
    "processed/water/water_candidates.json",
    "processed/water/major_river_fording_candidates.json",
    "processed/water/sparse_uncertain_water_stretches.json",
    "processed/water/water_confidence_notes.md",
    "processed/water/ford_confidence_notes.md",
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
    "processed/waypoints/river_crossings.json",
    "processed/waypoints/bailout_access_points.json",
    "processed/waypoints/monson_logistics_candidates.json",
    "processed/waypoints/towns_resupply_candidates.json",
    "processed/waypoints/private_businesses_review_required.json",
    "processed/rules/rules_by_land_manager.json",
    "processed/rules/rules_by_state.json",
    "processed/live_conditions/live_condition_sources.json",
    "processed/live_conditions/nps_alerts_cache.json",
    "processed/live_conditions/nws_alerts_cache.json",
    "processed/live_conditions/maine_state_alerts_cache.json",
    "processed/live_conditions/baxter_conditions_cache.json",
    "processed/live_conditions/baxter_rules_cache.json",
    "processed/live_conditions/atc_trail_updates_cache.json",
    "processed/live_conditions/monson_pointer_cache.json",
    "processed/live_conditions/maine_state_local_alert_sources.json",
    "processed/tread_rockiness/tread_rockiness_0_1mi.json",
    "processed/tread_rockiness/tread_rockiness_1_0mi.json",
    "processed/tread_rockiness/tread_rockiness_5_0mi.json",
    "processed/tread_rockiness/model_notes.md",
    "processed/tread_rockiness/mvp6_maine_tread_remoteness_calibration_report.json",
    "processed/tread_rockiness/mvp6_maine_tread_remoteness_calibration_report.md",
    "processed/difficulty/difficulty_by_10mi_segment.json",
    "processed/difficulty/difficulty_policy.md",
    "processed/export/manifest.json",
    "processed/export/scout_at_mvp6_maine_production_safe.json",
    "processed/export/scout_at_mvp6_maine_production_safe.zip",
    "rag_docs/state_guides/ME.md",
    "rag_docs/rules/camping_permit_fee_mvp6_maine.md",
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
    "tests/mvp6_maine_behavior_questions.json",
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
        "maine_state_official_pages",
        "maine_state_local_alerts",
        "baxter_state_park_authority_pages",
        "baxter_current_conditions",
        "monson_pointer",
        "atc_trail_updates_pointer",
        "usda_ssurgo_gssurgo",
        "usgs_geology_weak_signal",
        "mvp6_maine_tread_model",
        "mvp6_maine_difficulty_model",
    ]:
        fail_if(required_source not in sources, failures, f"source manifest missing {required_source}")
    fail_if(sources.get("osm", {}).get("license_status") != "open_license_share_alike", failures, "OSM not ODbL/share-alike")

    route = rows(j("processed/route/mvp6_maine_route.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route must be official:false")
    fail_if(route.get("measured_length_miles") != 253.2, failures, "route measured length must be 253.2")
    fail_if(route.get("start_mile_nobo_global_est") != 1853.0, failures, "route start global mile wrong")
    fail_if(route.get("end_mile_nobo_global_est") != 2106.2, failures, "route end global mile wrong")
    fail_if("not official atc" not in route.get("ai_answer_rule", "").lower(), failures, "route missing official-mile caution")
    notes = t("processed/route/route_notes.md").lower()
    for term in ["mvp5", "mahoosuc", "monson", "100-mile wilderness", "baxter", "katahdin", "ford", "not official"]:
        fail_if(term not in notes, failures, f"route notes missing {term}")

    for interval, minimum in [("0_1", 2530), ("0_5", 506), ("1_0", 254)]:
        data = rows(j(f"processed/milepoints/mvp6_maine_milepoints_{interval}mi.geojson"))
        fail_if(len(data) < minimum, failures, f"{interval} milepoints too few")
        for record in data[:15] + data[-5:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official flag wrong")
            fail_if(record.get("state") != "ME", failures, "milepoint state wrong")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint caution missing")

    elevation = j("processed/elevation/elevation_samples_1_0mi.json")
    fail_if(len(elevation) < 254, failures, "elevation samples too few")
    for record in elevation[:5] + elevation[-5:]:
        common(record, failures, "elevation")
        fail_if(record.get("source_id") != "usgs_3dep", failures, "elevation not USGS")
        fail_if(record.get("state") != "ME", failures, "elevation state wrong")
    for relative in ["climbs_descents_by_5mi_segment", "climbs_descents_by_10mi_segment", "major_climbs", "major_descents", "steep_descents", "mahoosuc_difficulty_flags"]:
        data = j(f"processed/elevation/{relative}.json")
        fail_if(not data, failures, f"{relative} empty")
        for record in data[:5]:
            common(record, failures, relative)
    katahdin = j("processed/elevation/katahdin_climb_summary.json")
    common(katahdin, failures, "katahdin climb")
    fail_if(katahdin.get("elevation_gain_ft", 0) <= 1000, failures, "katahdin climb gain too low")
    fail_if("baxter" not in katahdin.get("ai_answer_rule", "").lower(), failures, "katahdin climb missing Baxter caution")
    summary_md = t("processed/elevation/elevation_summary.md").lower()
    for term in ["mahoosuc", "katahdin", "short maine days", "baxter"]:
        fail_if(term not in summary_md, failures, f"elevation md missing {term}")

    water = j("processed/water/water_candidates.json")
    fail_if(len(water) < 100, failures, "water candidates too few")
    for record in water[:10] + water[-5:]:
        common(record, failures, "water")
        fail_if(record.get("state") != "ME", failures, "water state wrong")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability not unknown")
        fail_if(record.get("potable") != "unknown", failures, "water potability not unknown")
        fail_if(record.get("ford_safety") != "unknown", failures, "water ford safety not unknown")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified unexpectedly set")
        fail_if("never call" not in record.get("ai_answer_rule", "").lower(), failures, "water missing anti-certainty rule")
    major_fords = j("processed/water/major_river_fording_candidates.json")
    fail_if(len(major_fords) < 50, failures, "major ford candidates too few")
    for record in major_fords[:10]:
        common(record, failures, "ford")
        fail_if(record.get("ford_safety") != "unknown", failures, "ford safety not unknown")
        fail_if("never call ford safe" not in record.get("ai_answer_rule", "").lower(), failures, "ford missing safety caveat")
    for relative in ["water_confidence_notes.md", "ford_confidence_notes.md"]:
        text = t(f"processed/water/{relative}").lower()
        for term in ["unknown", "static", "safe"]:
            fail_if(term not in text, failures, f"{relative} missing {term}")

    for relative, minimum in [
        ("shelters", 20),
        ("campsites", 20),
        ("parking", 20),
        ("road_crossings", 40),
        ("river_crossings", 50),
        ("bailout_access_points", 60),
        ("towns_resupply_candidates", 20),
        ("monson_logistics_candidates", 1),
    ]:
        data = j(f"processed/waypoints/{relative}.json")
        fail_if(len(data) < minimum, failures, f"{relative} too few")
        for record in data[:5]:
            common(record, failures, relative, allow_blocked_pointer=True)
            fail_if(record.get("state") != "ME", failures, f"{relative} state wrong")
    monson = t("processed/waypoints/monson_logistics_candidates.json").lower()
    fail_if("verify current services" not in monson, failures, "Monson candidates missing current-services caution")

    rules = j("processed/rules/rules_by_land_manager.json")
    rule_ids = {rule.get("rule_id") for rule in rules}
    for required_rule in [
        "mvp6-maine-nh-me-mahoosuc-handoff-source-gap",
        "mvp6-maine-western-maine-corridor-source-gap",
        "mvp6-maine-monson-logistics-pointer",
        "mvp6-maine-100-mile-wilderness-source-gap",
        "mvp6-maine-baxter-state-park",
        "mvp6-maine-katahdin-hunt-trail-status",
        "mvp6-maine-local-private-easement-source-gap",
    ]:
        fail_if(required_rule not in rule_ids, failures, f"missing rule {required_rule}")
    for rule in rules:
        common(rule, failures, "rule", allow_blocked_pointer=True)
        rule_text = rule.get("ai_answer_rule", "").lower()
        fail_if("verify" not in rule_text and "verification" not in rule_text and "live-check" not in rule_text and "never answer" not in rule_text, failures, f"rule {rule.get('rule_id')} missing verification caution")
    rule_doc = t("rag_docs/rules/camping_permit_fee_mvp6_maine.md").lower()
    for term in ["baxter", "katahdin", "100-mile wilderness", "verify current"]:
        fail_if(term not in rule_doc, failures, f"rule doc missing {term}")

    live_sources = j("processed/live_conditions/live_condition_sources.json")
    live_ids = {source.get("source_id") for source in live_sources}
    for source_id in ["noaa_nws_api", "nps_api", "maine_state_official_pages", "maine_state_local_alerts", "baxter_state_park_authority_pages", "baxter_current_conditions", "monson_pointer", "atc_trail_updates_pointer"]:
        fail_if(source_id not in live_ids, failures, f"live sources missing {source_id}")
    for record in live_sources:
        common(record, failures, "live source", allow_blocked_pointer=True)
    for cache in ["nps_alerts_cache", "nws_alerts_cache", "maine_state_alerts_cache", "baxter_conditions_cache", "baxter_rules_cache", "atc_trail_updates_cache", "monson_pointer_cache"]:
        record = j(f"processed/live_conditions/{cache}.json")
        fail_if("not_fetched" not in record.get("status", ""), failures, f"{cache} should be stale placeholder")
        fail_if("static mvp6 cache is not current" not in record.get("ai_answer_rule", "").lower(), failures, f"{cache} missing stale-cache warning")
    live_policy = t("rag_docs/policies/weather_live_conditions.md").lower()
    for term in ["katahdin", "baxter", "river/fords", "live-check", "live retrieval fails"]:
        fail_if(term not in live_policy, failures, f"live policy missing {term}")

    tread = j("processed/tread_rockiness/tread_rockiness_1_0mi.json")
    fail_if(len(tread) < 250, failures, "tread 1mi records too few")
    for record in tread[:10] + tread[-10:]:
        common(record, failures, "tread")
        score = record.get("score")
        fail_if(score not in PACE, failures, "tread score out of range")
        fail_if(abs(record.get("pace_penalty_multiplier", 0) - PACE[score]) > 0.001, failures, "tread pace penalty wrong")
        fail_if(record.get("field_verified") is not False, failures, "tread must not be field verified")
        for field in ["wet_mud_flag", "rootiness_flag", "fording_flag", "remoteness_flag"]:
            fail_if(not record.get(field), failures, f"tread missing {field}")
    tread_notes = t("processed/tread_rockiness/model_notes.md").lower()
    for term in ["ssurgo/gssurgo", "not field_verified", "rootiness", "mud"]:
        fail_if(term not in tread_notes, failures, f"tread notes missing {term}")
    calibration = j("processed/tread_rockiness/mvp6_maine_tread_remoteness_calibration_report.json")
    common(calibration, failures, "tread calibration")
    calibration_md = t("processed/tread_rockiness/mvp6_maine_tread_remoteness_calibration_report.md").lower()
    for term in ["mahoosuc", "100-mile wilderness", "katahdin", "not field_verified", "ford"]:
        fail_if(term not in calibration_md, failures, f"calibration md missing {term}")

    difficulty = j("processed/difficulty/difficulty_by_10mi_segment.json")
    fail_if(len(difficulty) < 25, failures, "difficulty segments too few")
    for record in difficulty[:5] + difficulty[-5:]:
        common(record, failures, "difficulty")
        for field in ["ford_uncertainty_factor", "remoteness_bailout_scarcity_factor", "weather_severity_factor", "water_uncertainty_factor"]:
            fail_if(field not in record, failures, f"difficulty missing {field}")
        fail_if("short maine mileage" not in record.get("ai_answer_rule", "").lower(), failures, "difficulty missing short-mileage caution")
    difficulty_policy = t("processed/difficulty/difficulty_policy.md").lower()
    for term in ["ford uncertainty", "remoteness", "short maine day", "baxter/katahdin"]:
        fail_if(term not in difficulty_policy, failures, f"difficulty policy missing {term}")

    rag_docs = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(rag_docs) < 15, failures, "RAG docs too few")
    for doc in rag_docs:
        common(doc, failures, "rag doc")
        fail_if(not (ROOT / doc["path"]).exists(), failures, f"RAG doc path missing {doc['path']}")
    me_guide = t("rag_docs/state_guides/ME.md").lower()
    for term in ["mahoosuc", "monson", "100-mile wilderness", "baxter", "katahdin", "ford safety unknown"]:
        fail_if(term not in me_guide, failures, f"ME guide missing {term}")
    segment = t("rag_docs/segment_guides/mvp6_maine_000_025.md")
    for term in ["## Terrain", "## Water Candidates", "## Difficulty", "## Camping / Permit Summary", "## AI Cautions", "Generated miles are not official ATC mileage"]:
        fail_if(term not in segment, failures, f"segment missing {term}")

    behavior = j("tests/mvp6_maine_behavior_questions.json")
    fail_if(len(behavior) < 80, failures, "behavior question count too low")
    behavior_text = json.dumps(behavior).lower()
    for term in ["katahdin", "baxter", "ford", "monson", "100-mile wilderness", "official atc", "reliability unknown", "static"]:
        fail_if(term not in behavior_text, failures, f"behavior questions missing {term}")

    safe_export = j("processed/export/scout_at_mvp6_maine_production_safe.json")
    fail_if(any(source.get("license_status") in FORBIDDEN_LICENSES for source in safe_export.get("source_manifest", [])), failures, "safe export contains forbidden license")
    zip_bytes = (ROOT / "processed/export/scout_at_mvp6_maine_production_safe.zip").read_bytes()[:4]
    fail_if(zip_bytes != b"PK\x03\x04", failures, "production zip header invalid")

    result = {
        "ok": not failures,
        "failures": failures,
        "mvp6_maine_miles": route.get("measured_length_miles"),
        "behavior_questions": len(behavior),
        "rag_docs": len(rag_docs),
        "water_candidates": len(water),
        "major_ford_candidates": len(major_fords),
        "tread_1mi_records": len(tread),
        "difficulty_segments": len(difficulty),
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate_pack()
    (ROOT / "tests/validation_results_mvp6_maine.json").write_text(json.dumps(result, indent=2) + "\n")
    if args.json:
        print(json.dumps(result))
    else:
        print(json.dumps(result, indent=2))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
