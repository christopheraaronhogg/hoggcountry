#!/usr/bin/env python3
"""Validate the Scout Appalachian Trail MVP1 reference pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}
FORBIDDEN_LICENSES = {"unknown_review_required", "blocked"}
BLOCKED_SOURCE_IDS = {"atc_website", "farout", "awol_at_guide", "at_data_book", "alltrails_gaia_hiking_project"}
PACE = {0: 1.00, 1: 1.03, 2: 1.08, 3: 1.15, 4: 1.25, 5: 1.40}

REQUIRED_PATHS = [
    "README.md",
    "source_manifest.yaml",
    "license_review.md",
    "blocked_sources.md",
    "attribution.md",
    "prompt_artifact_checklist.md",
    "data_quality_report_mvp1.md",
    "MVP1_STATUS.md",
    "manifest.json",
    "processed/route/mvp1_route.geojson",
    "processed/route/route_notes.md",
    "processed/milepoints/mvp1_milepoints_0_1mi.geojson",
    "processed/milepoints/mvp1_milepoints_0_5mi.geojson",
    "processed/milepoints/mvp1_milepoints_1_0mi.geojson",
    "processed/elevation/elevation_samples_1_0mi.json",
    "processed/elevation/elevation_profile.geojson",
    "processed/elevation/climbs_descents_by_5mi_segment.json",
    "processed/elevation/climbs_descents_by_10mi_segment.json",
    "processed/elevation/major_climbs.json",
    "processed/elevation/steep_sections.json",
    "processed/elevation/elevation_summary.json",
    "processed/water/water_crossings.geojson",
    "processed/water/spring_drinking_water_candidates.json",
    "processed/water/water_candidates.json",
    "processed/water/water_confidence_notes.md",
    "processed/waypoints/shelters.json",
    "processed/waypoints/campsites.json",
    "processed/waypoints/privies.json",
    "processed/waypoints/parking.json",
    "processed/waypoints/road_crossings.json",
    "processed/waypoints/trailheads.json",
    "processed/waypoints/vistas.json",
    "processed/waypoints/towns_resupply_candidates.json",
    "processed/rules/rules_by_land_manager.json",
    "processed/rules/rules_by_state.json",
    "processed/live_conditions/live_condition_sources.json",
    "processed/live_conditions/nps_alerts_cache.json",
    "processed/live_conditions/nws_alerts_cache.json",
    "processed/live_conditions/land_manager_alert_sources.json",
    "processed/tread_rockiness/tread_rockiness_0_1mi.json",
    "processed/tread_rockiness/tread_rockiness_1_0mi.json",
    "processed/tread_rockiness/tread_rockiness_5_0mi.json",
    "processed/tread_rockiness/model_notes.md",
    "processed/export/manifest.json",
    "processed/export/scout_at_mvp1_production_safe.json",
    "processed/export/scout_at_mvp1_production_safe.zip",
    "rag_docs/state_guides/GA.md",
    "rag_docs/state_guides/NC_TN.md",
    "rag_docs/rules/camping_permit_fee_mvp1.md",
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
    "tests/mvp1_behavior_questions.json",
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


def common(record: dict[str, Any], failures: list[str], label: str) -> None:
    fail_if(not (record.get("source_id") or record.get("source_ids")), failures, f"{label} missing source")
    fail_if(not (record.get("source_url") or record.get("source_ids")), failures, f"{label} missing source URL")
    fail_if(record.get("license_status") not in VALID_LICENSES, failures, f"{label} invalid license {record.get('license_status')}")
    fail_if(record.get("license_status") in FORBIDDEN_LICENSES, failures, f"{label} forbidden license")
    fail_if(record.get("source_id") in BLOCKED_SOURCE_IDS, failures, f"{label} blocked source")
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
        fail_if(sources.get(blocked, {}).get("license_status") != "blocked", failures, f"blocked source {blocked} not blocked")
    fail_if(sources.get("osm", {}).get("license_status") != "open_license_share_alike", failures, "OSM not ODbL/share-alike")

    blocked_text = t("blocked_sources.md").lower()
    for term in ["farout", "a.t. guide", "alltrails", "gaia", "hiking project", "atc"]:
        fail_if(term not in blocked_text, failures, f"blocked_sources missing {term}")

    route = rows(j("processed/route/mvp1_route.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route must be official:false")
    fail_if(route.get("measured_length_miles") != 234.7, failures, "route measured length must be 234.7")
    fail_if("not official atc" not in route.get("ai_answer_rule", "").lower(), failures, "route missing official-mile caution")
    fail_if("amicalola" not in t("processed/route/route_notes.md").lower(), failures, "route notes missing Amicalola")
    fail_if("davenport" not in t("processed/route/route_notes.md").lower(), failures, "route notes missing Davenport")

    for interval, minimum in [("0_1", 2300), ("0_5", 450), ("1_0", 230)]:
        data = rows(j(f"processed/milepoints/mvp1_milepoints_{interval}mi.geojson"))
        fail_if(len(data) < minimum, failures, f"{interval} milepoints too few")
        for record in data[:15] + data[-5:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official flag wrong")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint caution missing")

    elevation = j("processed/elevation/elevation_samples_1_0mi.json")
    fail_if(len(elevation) < 235, failures, "elevation samples too few")
    for record in elevation[:5] + elevation[-5:]:
        common(record, failures, "elevation")
        fail_if(record.get("source_id") != "usgs_3dep", failures, "elevation not USGS")
        fail_if("model-derived" not in record.get("ai_answer_rule", "").lower(), failures, "elevation missing model caution")
    for relative in ["climbs_descents_by_5mi_segment", "climbs_descents_by_10mi_segment", "major_climbs", "steep_sections"]:
        data = j(f"processed/elevation/{relative}.json")
        fail_if(not data, failures, f"{relative} empty")
        for record in data[:5]:
            common(record, failures, relative)
    summary = j("processed/elevation/elevation_summary.json")
    common(summary, failures, "elevation summary")
    fail_if(summary.get("total_gain_ft", 0) <= 10000, failures, "total gain too low")

    water = j("processed/water/water_candidates.json")
    fail_if(len(water) < 100, failures, "water candidates too few")
    for record in water[:10] + water[-5:]:
        common(record, failures, "water")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability not unknown")
        fail_if(record.get("potable") != "unknown", failures, "water potability not unknown")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified unexpectedly set")
        fail_if("mapped water candidate" not in record.get("ai_answer_rule", "").lower(), failures, "water mapped candidate wording missing")

    for name, minimum in {
        "shelters": 10,
        "campsites": 50,
        "privies": 10,
        "parking": 10,
        "road_crossings": 50,
        "trailheads": 5,
        "vistas": 10,
        "towns_resupply_candidates": 10,
    }.items():
        data = j(f"processed/waypoints/{name}.json")
        fail_if(len(data) < minimum, failures, f"{name} too few")
        for record in data[:5]:
            common(record, failures, name)
            fail_if(record.get("state") not in {"GA", "NC", "NC/TN", "TN"}, failures, f"{name} missing state lane")
            if name == "towns_resupply_candidates":
                fail_if(record.get("candidate_services", {}).get("grocery") != "unknown", failures, "town grocery not unknown")
                fail_if("do not copy guidebook" not in record.get("ai_answer_rule", "").lower(), failures, "town guidebook caution missing")

    rules = j("processed/rules/rules_by_land_manager.json")
    expected = {"mvp1-amicalola-approach-source-gap", "camping-chattahoochee-oconee-nf", "camping-nantahala-at-cheoah-district", "camping-grsm-backcountry", "camping-cherokee-nf-at"}
    fail_if(not expected <= {rule.get("rule_id") for rule in rules}, failures, "required land-manager rules missing")
    for record in rules:
        common(record, failures, "rule")
        fail_if(record.get("permit_required") not in {"yes", "no", "unknown"}, failures, "permit field not yes/no/unknown")
        fail_if(record.get("fee_required") not in {"yes", "no", "unknown"}, failures, "fee field not yes/no/unknown")
        fail_if("verify current" not in record.get("ai_answer_rule", "").lower(), failures, "rule current verification missing")

    live_policy = t("rag_docs/policies/weather_live_conditions.md").lower()
    for term in ["closures", "detours", "fire", "flooding", "storm damage", "bear activity", "snow", "permit changes", "dangerous weather", "live retrieval fails"]:
        fail_if(term not in live_policy, failures, f"live policy missing {term}")
    for relative in ["processed/live_conditions/live_condition_sources.json", "processed/live_conditions/land_manager_alert_sources.json"]:
        for record in j(relative):
            common(record, failures, relative)

    for interval, minimum in [("0_1", 2000), ("1_0", 200), ("5_0", 40)]:
        data = j(f"processed/tread_rockiness/tread_rockiness_{interval}mi.json")
        fail_if(len(data) < minimum, failures, f"tread {interval} too few")
        for record in data[:10] + data[-3:]:
            common(record, failures, "tread")
            score = record.get("score")
            fail_if(not isinstance(score, int) or score < 0 or score > 5, failures, "tread score invalid")
            fail_if(abs(record.get("pace_penalty_multiplier", 0) - PACE.get(score, -1)) > 0.001, failures, "tread pace mismatch")
            fail_if(record.get("field_verified") is not False, failures, "tread field_verified not false")
            fail_if("not field verified" not in record.get("ai_answer_rule", "").lower(), failures, "tread caution missing")
    tread_notes = t("processed/tread_rockiness/model_notes.md").lower()
    for term in ["ssurgo", "geology", "user reports", "not yet ingested", "not field_verified"]:
        fail_if(term not in tread_notes, failures, f"tread notes missing {term}")

    rag = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(rag) < 15, failures, "RAG metadata too few")
    for record in rag:
        common(record, failures, "rag")
        doc = ROOT / record["path"]
        fail_if(not doc.exists(), failures, f"RAG doc missing {record['path']}")
        lower = doc.read_text().lower()
        fail_if(not any(term in lower for term in ["not official", "unknown", "verify", "live", "source gap", "not field verified", "mapped water candidate", "model estimate"]), failures, f"RAG doc lacks caution {record['path']}")
    segment_docs = list((ROOT / "rag_docs/segment_guides").glob("*.md"))
    fail_if(len(segment_docs) < 10, failures, "segment docs too few")
    fail_if(not any("225_235" in doc.name for doc in segment_docs), failures, "terminal segment doc missing")

    questions = j("tests/mvp1_behavior_questions.json")
    fail_if(len(questions) < 40, failures, "behavior questions below 40")
    blob = "\n".join(q.get("expected_behavior", "") for q in questions).lower()
    for term in ["not official", "reliability unknown", "live retrieval", "not field verified", "blocked", "potability unknown", "verify current"]:
        fail_if(term not in blob, failures, f"behavior questions missing {term}")

    safe_export = j("processed/export/scout_at_mvp1_production_safe.json")
    for source in safe_export.get("source_manifest", []):
        fail_if(source.get("license_status") in FORBIDDEN_LICENSES, failures, "safe export includes forbidden license")
        fail_if(source.get("source_id") in BLOCKED_SOURCE_IDS, failures, "safe export includes blocked source")
    fail_if("unknown_review_required" not in safe_export.get("excluded_license_statuses", []), failures, "safe export missing unknown exclusion")
    fail_if("blocked" not in safe_export.get("excluded_license_statuses", []), failures, "safe export missing blocked exclusion")
    export_manifest = j("processed/export/manifest.json")
    fail_if(export_manifest.get("production_safe_zip") != "processed/export/scout_at_mvp1_production_safe.zip", failures, "zip export not declared")
    zip_path = ROOT / "processed/export/scout_at_mvp1_production_safe.zip"
    fail_if(not zip_path.read_bytes().startswith(b"PK\x03\x04"), failures, "zip export missing ZIP header")

    report = t("data_quality_report_mvp1.md").lower()
    for term in ["work completed", "sources", "licenses", "measured", "gaps", "blocked sources", "validation"]:
        fail_if(term not in report, failures, f"quality report missing {term}")

    result = {
        "ok": not failures,
        "failures": failures,
        "sources": len(manifest),
        "mvp1_miles": 234.7,
        "behavior_questions": len(questions),
        "rag_docs": len(rag),
        "water_candidates": len(water),
        "tread_1mi_records": len(j("processed/tread_rockiness/tread_rockiness_1_0mi.json")),
        "validated_at": "2026-05-14T00:00:00.000Z",
    }
    (ROOT / "tests/validation_results_mvp1.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate_pack()
    if args.json:
        print(json.dumps(result, indent=2))
    elif result["ok"]:
        print(f"Scout AT MVP1 validation OK: {result['sources']} sources, {result['behavior_questions']} behavior questions, {result['rag_docs']} RAG docs.")
    else:
        print("Scout AT MVP1 validation failed:")
        for failure in result["failures"]:
            print(f"- {failure}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
