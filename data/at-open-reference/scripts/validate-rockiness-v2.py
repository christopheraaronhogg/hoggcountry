#!/usr/bin/env python3
"""Validate the Scout Full Trail RC1 Rockiness V2 layer."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
RC_ROOT = ROOT / "full_trail_rc1"

REQUIRED_FIELDS = [
    "mile_nobo_global_est",
    "mile_sobo_global_est",
    "official",
    "rockiness_v2_score_0_10",
    "rockiness_class",
    "confidence",
    "field_verified",
    "lidar_available",
    "dem_resolution_m",
    "micro_roughness_score",
    "soil_stoniness_score",
    "osm_surface_signal",
    "user_report_signal",
    "pace_penalty_factor",
    "source_id",
    "source_url",
    "license_status",
    "last_checked",
    "last_generated",
    "ai_answer_rule",
]


def read_json(relative: str):
    return json.loads((RC_ROOT / relative).read_text())


def fail_if(condition: bool, failures: list[str], message: str) -> None:
    if condition:
        failures.append(message)


def validate() -> dict:
    failures: list[str] = []
    rockiness_01 = read_json("processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json")
    rockiness_1 = read_json("processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json")
    rockiness_21_extraction = read_json("processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json")
    rockiness_21_1 = read_json("processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json")
    soil = read_json("processed/tread_rockiness_v2/full_trail_soil_stoniness.json")
    osm = read_json("processed/tread_rockiness_v2/full_trail_osm_surface_tags.json")
    coverage = read_json("processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json")
    source_manifest = read_json("full_trail_source_manifest.yaml")
    dataset_index = read_json("processed/index/full_trail_dataset_index.json")

    fail_if(len(rockiness_01) < 21000, failures, "0.1mi Rockiness V2 records below full-trail coverage threshold")
    fail_if(len(rockiness_1) < 2100, failures, "1mi Rockiness V2 records below full-trail coverage threshold")
    fail_if(len(soil) < 2000, failures, "soil stoniness lane below expected coverage")
    fail_if(len(osm) < 2000, failures, "OSM surface lane below expected coverage")
    fail_if(len(coverage) < 3, failures, "micro-roughness coverage lacks DEM/LiDAR lanes")

    source_by_id = {source.get("source_id"): source for source in source_manifest}
    for source_id in ["usgs_3dep_seamless_dem", "usgs_3dep_lidar", "nrcs_gssurgo_ssurgo"]:
        source = source_by_id.get(source_id, {})
        fail_if(source.get("production_safe") is not True, failures, f"{source_id} not production-safe")
        fail_if(source.get("license_status") != "public_domain", failures, f"{source_id} should be public_domain")
    source = source_by_id.get("full_trail_rockiness_v2_1_extraction_model", {})
    fail_if(source.get("production_safe") is not True, failures, "Rockiness V2.1 source not production-safe")
    fail_if(source.get("license_status") != "open_license_share_alike", failures, "Rockiness V2.1 source should be open_license_share_alike")
    for source_id in ["opentrail_review", "openlongtrails_review"]:
        source = source_by_id.get(source_id, {})
        fail_if(source.get("production_safe") is not False, failures, f"{source_id} should remain held")
        fail_if(source.get("license_status") != "unknown_review_required", failures, f"{source_id} should require review")

    for label, records in [("0.1mi", rockiness_01), ("1mi", rockiness_1)]:
        for record in records[:100] + records[-100:]:
            for field in REQUIRED_FIELDS:
                fail_if(field not in record, failures, f"{label} record missing {field}")
            fail_if(record.get("official") is not False, failures, f"{label} record has official true/missing")
            fail_if(record.get("field_verified") is not False, failures, f"{label} record field_verified not false")
            fail_if(record.get("lidar_available") is True, failures, f"{label} record claims LiDAR without extraction evidence")
            fail_if(record.get("license_status") != "open_license_share_alike", failures, f"{label} record missing ODbL/share-alike license")
            score = record.get("rockiness_v2_score_0_10")
            fail_if(not isinstance(score, (int, float)) or score < 0 or score > 10, failures, f"{label} score outside 0-10")
            rule = record.get("ai_answer_rule", "").lower()
            fail_if("not field verified" not in rule, failures, f"{label} answer rule lacks not-field-verified caution")
    fail_if(not any(record.get("confidence") == "low_due_to_regional_mvp_gap" for record in rockiness_1), failures, "gap low-confidence records missing")
    fail_if(not any(record.get("confidence", "").startswith("medium") for record in rockiness_1), failures, "medium confidence records missing")
    fail_if(not all(record.get("soil_stoniness_score") is None for record in soil[:100]), failures, "soil lane should stay null until bounded extraction")
    fail_if(not any(record.get("osm_surface_signal") is not None for record in osm), failures, "OSM surface signal never populated")

    fail_if(rockiness_21_extraction.get("production_safe") is not True, failures, "V2.1 source extraction not production-safe")
    fail_if(rockiness_21_extraction.get("extraction_level") == "missing_snapshot_fallback", failures, "V2.1 source extraction fell back to missing snapshot")
    dem_sections = rockiness_21_extraction.get("dem", {}).get("sections", [])
    fail_if(not any(section.get("item_count_returned", 0) > 0 for section in dem_sections), failures, "V2.1 DEM STAC metadata missing")
    lidar = rockiness_21_extraction.get("lidar", {})
    fail_if(lidar.get("catalog_item_link_count", 0) <= 0, failures, "V2.1 LiDAR catalog metadata missing")
    fail_if(lidar.get("at_state_item_link_count", 0) <= 0, failures, "V2.1 AT-state LiDAR catalog count missing")
    fail_if(len(rockiness_21_1) != len(rockiness_1), failures, "V2.1 1mi record count should match V2")

    for label, records in [("V2.1 1mi", rockiness_21_1)]:
        fail_if(any(record.get("field_verified") is True for record in records), failures, f"{label} marked field verified")
        fail_if(any(record.get("lidar_available") is True for record in records), failures, f"{label} marks lidar_available before point-cloud extraction")
        fail_if(not any(record.get("dem_stac_item_count", 0) > 0 for record in records), failures, f"{label} lacks bounded DEM metadata")
        for record in records[:100] + records[-100:]:
            fail_if(record.get("official") is not False, failures, f"{label} record has official true/missing")
            fail_if(record.get("source_id") != "full_trail_rockiness_v2_1_extraction_model", failures, f"{label} wrong source_id")
            fail_if(record.get("license_status") != "open_license_share_alike", failures, f"{label} missing ODbL/share-alike license")
            fail_if(record.get("soil_extraction_status") != "not_extracted_in_v2_1", failures, f"{label} should not claim soil extraction")
            rule = record.get("ai_answer_rule", "").lower()
            fail_if("not field verified" not in rule, failures, f"{label} answer rule lacks not-field-verified caution")
            fail_if("not official atc" not in rule, failures, f"{label} answer rule lacks generated-mile caution")

    safe_paths = {dataset["path"] for dataset in dataset_index if dataset.get("production_safe")}
    with ZipFile(RC_ROOT / "exports/full_trail_reference_pack_rc1.zip") as zf:
        zip_names = set(zf.namelist())
    for expected in [
        "processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json",
        "processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json",
        "processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json",
        "processed/tread_rockiness_v2/full_trail_soil_stoniness.json",
        "processed/tread_rockiness_v2/full_trail_osm_surface_tags.json",
        "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json",
        "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json",
    ]:
        fail_if(expected not in safe_paths, failures, f"{expected} not marked production-safe")
        fail_if(expected not in zip_names, failures, f"{expected} missing from production-safe zip")
    for held in ["sources/opentrail_review.json", "sources/openlongtrails_review.json", "processed/legal/blocked_legacy_awol_audit.json"]:
        fail_if(held in zip_names, failures, f"{held} leaked into production-safe zip")

    return {
        "ok": not failures,
        "failures": failures,
        "rockiness_v2_0_1mi_records": len(rockiness_01),
        "rockiness_v2_1mi_records": len(rockiness_1),
        "rockiness_v2_1_1mi_records": len(rockiness_21_1),
        "soil_records": len(soil),
        "osm_surface_records": len(osm),
        "coverage_records": len(coverage),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate()
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("ok" if result["ok"] else "\n".join(result["failures"]))
    raise SystemExit(0 if result["ok"] else 1)


if __name__ == "__main__":
    main()
