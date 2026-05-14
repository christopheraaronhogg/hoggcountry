#!/usr/bin/env python3
"""Validate the Scout Appalachian Trail MVP4 NJ/NY/CT reference pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}
FORBIDDEN_LICENSES = {"unknown_review_required", "blocked"}
BLOCKED_SOURCE_IDS = {
    "atc_website",
    "atc_trail_updates_pointer",
    "ny_nj_trail_conference_pointer",
    "ct_amc_pointer",
    "farout",
    "awol_at_guide",
    "at_data_book",
    "alltrails_gaia_hiking_project",
}
POINTER_SOURCE_IDS = {"atc_trail_updates_pointer", "ny_nj_trail_conference_pointer", "ct_amc_pointer"}
PACE = {0: 1.00, 1: 1.03, 2: 1.08, 3: 1.15, 4: 1.25, 5: 1.40}

REQUIRED_PATHS = [
    "README.md",
    "source_manifest.yaml",
    "license_review.md",
    "blocked_sources.md",
    "attribution.md",
    "prompt_artifact_checklist.md",
    "data_quality_report_mvp4_nj_ny_ct.md",
    "MVP4_STATUS.md",
    "manifest.json",
    "processed/route/mvp4_nj_ny_ct_route.geojson",
    "processed/route/route_notes.md",
    "processed/milepoints/mvp4_nj_ny_ct_milepoints_0_1mi.geojson",
    "processed/milepoints/mvp4_nj_ny_ct_milepoints_0_5mi.geojson",
    "processed/milepoints/mvp4_nj_ny_ct_milepoints_1_0mi.geojson",
    "processed/elevation/elevation_samples_1_0mi.json",
    "processed/elevation/elevation_profile.geojson",
    "processed/elevation/climbs_descents_by_5mi_segment.json",
    "processed/elevation/climbs_descents_by_10mi_segment.json",
    "processed/elevation/major_climbs.json",
    "processed/elevation/major_descents.json",
    "processed/elevation/high_low_points.json",
    "processed/elevation/steep_descents.json",
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
    "processed/waypoints/towns_resupply_candidates.json",
    "processed/waypoints/private_businesses_review_required.json",
    "processed/rules/rules_by_land_manager.json",
    "processed/rules/rules_by_state.json",
    "processed/live_conditions/live_condition_sources.json",
    "processed/live_conditions/nps_alerts_cache.json",
    "processed/live_conditions/dwg_alerts_cache.json",
    "processed/live_conditions/nws_alerts_cache.json",
    "processed/live_conditions/nj_ny_ct_state_alerts_cache.json",
    "processed/live_conditions/nj_ny_ct_state_local_alert_sources.json",
    "processed/tread_rockiness/tread_rockiness_0_1mi.json",
    "processed/tread_rockiness/tread_rockiness_1_0mi.json",
    "processed/tread_rockiness/tread_rockiness_5_0mi.json",
    "processed/tread_rockiness/model_notes.md",
    "processed/tread_rockiness/mvp4_vs_mvp3_pa_calibration_report.json",
    "processed/tread_rockiness/mvp4_vs_mvp3_pa_calibration_report.md",
    "processed/export/manifest.json",
    "processed/export/scout_at_mvp4_nj_ny_ct_production_safe.json",
    "processed/export/scout_at_mvp4_nj_ny_ct_production_safe.zip",
    "rag_docs/state_guides/NJ.md",
    "rag_docs/state_guides/NY.md",
    "rag_docs/state_guides/CT.md",
    "rag_docs/rules/camping_permit_fee_mvp4_nj_ny_ct.md",
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
    "tests/mvp4_nj_ny_ct_behavior_questions.json",
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
        "nps_dewa_official_pages",
        "njdep_official_pages",
        "nys_parks_dec_official_pages",
        "nys_palisades_official_pages",
        "ct_deep_official_pages",
        "ny_nj_trail_conference_pointer",
        "ct_amc_pointer",
        "usda_ssurgo_gssurgo",
        "mvp4_nj_ny_ct_tread_model",
    ]:
        fail_if(required_source not in sources, failures, f"source manifest missing {required_source}")
    fail_if(sources.get("osm", {}).get("license_status") != "open_license_share_alike", failures, "OSM not ODbL/share-alike")

    blocked_text = t("blocked_sources.md").lower()
    for term in ["farout", "a.t. guide", "alltrails", "gaia", "hiking project", "atc"]:
        fail_if(term not in blocked_text, failures, f"blocked_sources missing {term}")

    route = rows(j("processed/route/mvp4_nj_ny_ct_route.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route must be official:false")
    fail_if(route.get("measured_length_miles") != 206.0, failures, "route measured length must be 206.0")
    fail_if(route.get("start_mile_nobo_global_est") != 1270.0, failures, "route start global mile wrong")
    fail_if(route.get("end_mile_nobo_global_est") != 1476.0, failures, "route end global mile wrong")
    fail_if("not official atc" not in route.get("ai_answer_rule", "").lower(), failures, "route missing official-mile caution")
    notes = t("processed/route/route_notes.md").lower()
    for term in ["mvp3", "mvp5", "delaware water gap", "sages ravine", "not official atc", "nj/ny/ct"]:
        fail_if(term not in notes, failures, f"route notes missing {term}")

    for interval, minimum in [("0_1", 2060), ("0_5", 412), ("1_0", 207)]:
        data = rows(j(f"processed/milepoints/mvp4_nj_ny_ct_milepoints_{interval}mi.geojson"))
        fail_if(len(data) < minimum, failures, f"{interval} milepoints too few")
        for record in data[:15] + data[-5:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official flag wrong")
            fail_if(record.get("state") not in {"NJ", "NY", "CT"}, failures, "milepoint state wrong")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint caution missing")

    elevation = j("processed/elevation/elevation_samples_1_0mi.json")
    fail_if(len(elevation) < 207, failures, "elevation samples too few")
    for record in elevation[:5] + elevation[-5:]:
        common(record, failures, "elevation")
        fail_if(record.get("source_id") != "usgs_3dep", failures, "elevation not USGS")
        fail_if("model-derived" not in record.get("ai_answer_rule", "").lower(), failures, "elevation missing model caution")
    for relative in ["climbs_descents_by_5mi_segment", "climbs_descents_by_10mi_segment", "major_climbs", "major_descents", "steep_descents"]:
        data = j(f"processed/elevation/{relative}.json")
        fail_if(not data, failures, f"{relative} empty")
        for record in data[:5]:
            common(record, failures, relative)
    high_low = j("processed/elevation/high_low_points.json")
    common(high_low, failures, "high low")
    summary = j("processed/elevation/elevation_summary.json")
    common(summary, failures, "elevation summary")
    fail_if(summary.get("total_gain_ft", 0) <= 5000, failures, "total gain too low for NJ/NY/CT span")
    fail_if("model-derived" not in t("processed/elevation/elevation_summary.md").lower(), failures, "elevation md missing caution")

    water = j("processed/water/water_candidates.json")
    fail_if(len(water) < 100, failures, "water candidates too few")
    for record in water[:10] + water[-5:]:
        common(record, failures, "water")
        fail_if(record.get("state") not in {"NJ", "NY", "CT"}, failures, "water state wrong")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability not unknown")
        fail_if(record.get("potable") != "unknown", failures, "water potability not unknown")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified unexpectedly set")
        fail_if("mapped water candidate" not in record.get("ai_answer_rule", "").lower(), failures, "water mapped candidate wording missing")
    fail_if("mapped water candidate" not in t("processed/water/water_confidence_notes.md").lower(), failures, "water notes missing mapped wording")
    sparse_water = j("processed/water/sparse_uncertain_water_stretches.json")
    fail_if(len(sparse_water) < 1, failures, "sparse water stretches too few")
    for record in sparse_water[:5]:
        common(record, failures, "sparse water")
        fail_if("not proof" not in record.get("ai_answer_rule", "").lower(), failures, "sparse water missing not-proof caution")

    for name, minimum in {
        "shelters": 15,
        "campsites": 30,
        "privies": 50,
        "parking": 250,
        "road_crossings": 350,
        "trailheads": 8,
        "vistas": 50,
        "towns_resupply_candidates": 200,
    }.items():
        data = j(f"processed/waypoints/{name}.json")
        fail_if(len(data) < minimum, failures, f"{name} too few")
        for record in data[:5]:
            common(record, failures, name)
            fail_if(record.get("state") not in {"NJ", "NY", "CT"}, failures, f"{name} wrong state")
            fail_if(not isinstance(record.get("mile_nobo_mvp4"), (int, float)), failures, f"{name} missing MVP4 mile")
            if name == "towns_resupply_candidates":
                fail_if(record.get("candidate_services", {}).get("grocery") != "unknown", failures, "town grocery not unknown")
                fail_if("do not copy guidebook" not in record.get("ai_answer_rule", "").lower(), failures, "town guidebook caution missing")

    rules = j("processed/rules/rules_by_land_manager.json")
    expected = {
        "mvp4-njnyct-dwg-nps",
        "mvp4-njnyct-nj-parks-forests",
        "mvp4-njnyct-ny-parks-forests",
        "mvp4-njnyct-harriman-bear-mountain",
        "mvp4-njnyct-ct-at-corridor",
        "mvp4-njnyct-sages-ravine-ct-ma-handoff",
        "mvp4-njnyct-local-municipal-private-easement-source-gap",
    }
    fail_if(not expected <= {rule.get("rule_id") for rule in rules}, failures, "required land-manager rules missing")
    for record in rules:
        common(record, failures, "rule")
        fail_if(record.get("permit_required") not in {"yes", "no", "unknown"}, failures, "permit field not yes/no/unknown")
        fail_if(record.get("fee_required") not in {"yes", "no", "unknown"}, failures, "fee field not yes/no/unknown")
        for field in ["food_storage_rule", "dogs_allowed", "fire_rule"]:
            fail_if(not record.get(field), failures, f"rule missing {field}")
        lower_rule = json.dumps(record).lower()
        fail_if("verify current" not in record.get("ai_answer_rule", "").lower(), failures, "rule current verification missing")
        fail_if(record.get("rule_id") != "mvp4-njnyct-dwg-nps" and "no_dispersed_camping_inferred" not in lower_rule and "source_gap" not in record.get("confidence", ""), failures, "rule missing no-dispersed-camping caution")

    live_policy = t("rag_docs/policies/weather_live_conditions.md").lower()
    for term in ["closures", "detours", "fire bans", "flooding", "storm damage", "bear activity", "snow/ice", "permit changes", "dangerous weather", "verification pointers", "live retrieval fails"]:
        fail_if(term not in live_policy, failures, f"live policy missing {term}")
    live_sources = j("processed/live_conditions/live_condition_sources.json")
    live_source_ids = {record.get("source_id") for record in live_sources}
    for required_live_source in [
        "noaa_nws_api",
        "nps_api",
        "nps_dewa_official_pages",
        "njdep_official_pages",
        "nys_parks_dec_official_pages",
        "nys_palisades_official_pages",
        "ct_deep_official_pages",
        "njnyct_state_local_alerts",
        "atc_trail_updates_pointer",
        "ny_nj_trail_conference_pointer",
        "ct_amc_pointer",
    ]:
        fail_if(required_live_source not in live_source_ids, failures, f"live source missing {required_live_source}")
    for record in live_sources:
        common(record, failures, "live source", allow_blocked_pointer=True)
        if record.get("source_id") in POINTER_SOURCE_IDS:
            fail_if("do not package" not in record.get("ai_answer_rule", "").lower(), failures, f"{record.get('source_id')} pointer missing do-not-package rule")

    for interval, minimum in [("0_1", 2060), ("1_0", 206), ("5_0", 41)]:
        data = j(f"processed/tread_rockiness/tread_rockiness_{interval}mi.json")
        fail_if(len(data) < minimum, failures, f"tread {interval} too few")
        for record in data[:10] + data[-3:]:
            common(record, failures, "tread")
            score = record.get("score")
            fail_if(not isinstance(score, int) or score < 0 or score > 5, failures, "tread score invalid")
            fail_if(abs(record.get("pace_penalty_multiplier", 0) - PACE.get(score, -1)) > 0.001, failures, "tread pace mismatch")
            fail_if(record.get("state") not in {"NJ", "NY", "CT"}, failures, "tread state wrong")
            fail_if(record.get("field_verified") is not False, failures, "tread field_verified not false")
            fail_if("not field verified" not in record.get("ai_answer_rule", "").lower(), failures, "tread caution missing")
    tread_notes = t("processed/tread_rockiness/model_notes.md").lower()
    for term in ["ssurgo", "geology", "user reports", "not ingested", "not field_verified"]:
        fail_if(term not in tread_notes, failures, f"tread notes missing {term}")
    calibration = j("processed/tread_rockiness/mvp4_vs_mvp3_pa_calibration_report.json")
    common(calibration, failures, "mvp4 vs mvp3 calibration")
    for field in ["nj_average_score", "ny_average_score", "ct_average_score"]:
        fail_if(not isinstance(calibration.get(field), (int, float)), failures, f"calibration missing {field}")
    calibration_md = t("processed/tread_rockiness/mvp4_vs_mvp3_pa_calibration_report.md").lower()
    for term in ["mvp3 pa", "nj sample", "ny sample", "ct sample", "not field_verified"]:
        fail_if(term not in calibration_md, failures, f"calibration report missing {term}")

    rag = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(rag) < 17, failures, "RAG docs too few")
    for record in rag:
        common(record, failures, "rag")
        path = ROOT / record["path"]
        fail_if(not path.exists(), failures, f"RAG file missing {record['path']}")
        lower = path.read_text().lower()
        fail_if(not any(term in lower for term in ["not official", "unknown", "verify", "live", "source gap", "not field verified", "mapped water candidate", "model estimate"]), failures, f"RAG doc lacks caution {record['path']}")
    segment_docs = list((ROOT / "rag_docs/segment_guides").glob("*.md"))
    fail_if(len(segment_docs) < 9, failures, "segment docs too few")
    fail_if(not any("000_025" in doc.name for doc in segment_docs), failures, "first segment doc missing")
    fail_if(not any("200_206" in doc.name for doc in segment_docs), failures, "terminal segment doc missing")
    required_sections = ["## identity", "## terrain", "## tread / rockiness", "## water candidates", "## waypoints / access", "## resupply / town candidates", "## camping / permit summary", "## ai cautions", "## source / confidence notes"]
    for doc in segment_docs:
        doc_text = doc.read_text().lower()
        for section in required_sections:
            fail_if(section not in doc_text, failures, f"segment doc {doc.name} missing section {section}")
    for state_doc, terms in {
        "rag_docs/state_guides/NJ.md": ["delaware water gap", "njdep", "designated camping"],
        "rag_docs/state_guides/NY.md": ["harriman", "bear mountain", "palisades"],
        "rag_docs/state_guides/CT.md": ["ct deep", "sages ravine", "permit"],
    }.items():
        state_guide = t(state_doc).lower()
        for term in terms:
            fail_if(term not in state_guide, failures, f"{state_doc} missing {term}")

    questions = j("tests/mvp4_nj_ny_ct_behavior_questions.json")
    fail_if(len(questions) < 60, failures, "behavior questions below 60")
    blob = "\n".join(f"{q.get('question', '')} {q.get('expected_behavior', '')}" for q in questions).lower()
    for term in ["not official", "reliability unknown", "live retrieval", "not field verified", "blocked", "potability unknown", "verify current", "delaware water gap", "new jersey", "harriman", "bear mountain", "connecticut", "illegal dispersed camping", "rockiness"]:
        fail_if(term not in blob, failures, f"behavior questions missing {term}")

    safe_export = j("processed/export/scout_at_mvp4_nj_ny_ct_production_safe.json")
    for source in safe_export.get("source_manifest", []):
        fail_if(source.get("license_status") in FORBIDDEN_LICENSES, failures, "safe export includes forbidden license")
        fail_if(source.get("source_id") in BLOCKED_SOURCE_IDS, failures, "safe export includes blocked source")
    fail_if("unknown_review_required" not in safe_export.get("excluded_license_statuses", []), failures, "safe export missing unknown exclusion")
    fail_if("blocked" not in safe_export.get("excluded_license_statuses", []), failures, "safe export missing blocked exclusion")
    export_manifest = j("processed/export/manifest.json")
    fail_if(export_manifest.get("production_safe_zip") != "processed/export/scout_at_mvp4_nj_ny_ct_production_safe.zip", failures, "zip export not declared")
    fail_if(not (ROOT / "processed/export/scout_at_mvp4_nj_ny_ct_production_safe.zip").read_bytes().startswith(b"PK\x03\x04"), failures, "zip export missing ZIP header")

    report = t("data_quality_report_mvp4_nj_ny_ct.md").lower()
    for term in ["work completed", "sources", "licenses", "measured", "gaps", "blocked sources", "validation", "weak points", "next work"]:
        fail_if(term not in report, failures, f"quality report missing {term}")
    status = t("MVP4_STATUS.md").lower()
    for lane in ["route", "elevation", "water", "waypoints", "rules", "live connectors", "tread", "rag docs", "validation", "licensing"]:
        fail_if(lane not in status, failures, f"status missing {lane}")
    top_manifest = j("manifest.json")
    fail_if(top_manifest.get("prompt_artifact_checklist") != "prompt_artifact_checklist.md", failures, "manifest missing checklist pointer")
    fail_if(top_manifest.get("production_safe_zip") != "processed/export/scout_at_mvp4_nj_ny_ct_production_safe.zip", failures, "manifest missing production zip pointer")
    checklist = t("prompt_artifact_checklist.md").lower()
    for command in ["build-mvp4-nj-ny-ct-reference-pack.mjs", "run_mvp4_nj_ny_ct_validation.py --json", "npm test", "npm run build:openclaw:forge"]:
        fail_if(command not in checklist, failures, f"checklist missing command {command}")

    result = {
        "ok": not failures,
        "failures": failures,
        "sources": len(manifest),
        "mvp4_nj_ny_ct_miles": 206.0,
        "behavior_questions": len(questions),
        "rag_docs": len(rag),
        "water_candidates": len(water),
        "tread_1mi_records": len(j("processed/tread_rockiness/tread_rockiness_1_0mi.json")),
        "validated_at": "2026-05-14T00:00:00.000Z",
    }
    (ROOT / "tests/validation_results_mvp4_nj_ny_ct.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate_pack()
    if args.json:
        print(json.dumps(result, indent=2))
    elif result["ok"]:
        print(f"Scout AT MVP4 NJ/NY/CT validation OK: {result['sources']} sources, {result['behavior_questions']} behavior questions, {result['rag_docs']} RAG docs.")
    else:
        print("Scout AT MVP4 NJ/NY/CT validation failed:")
        for failure in result["failures"]:
            print(f"- {failure}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
