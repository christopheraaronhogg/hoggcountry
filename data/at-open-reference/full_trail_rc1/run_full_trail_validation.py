#!/usr/bin/env python3
"""Validate Scout Full Trail RC1 source-aware reference pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}
BLOCKED_LICENSES = {"blocked", "unknown_review_required", "permission_required"}

REQUIRED_PATHS = [
    "README.md",
    "manifest.json",
    "FULL_TRAIL_RC1_STATUS.md",
    "data_quality_report_full_trail_rc1.md",
    "full_trail_source_manifest.yaml",
    "full_trail_license_review.md",
    "blocked_sources.md",
    "attribution.md",
    "processed/route/full_at_route_rc1.geojson",
    "processed/route/route_integration_notes.md",
    "processed/route/route_alignment_diagnostics.json",
    "processed/route/route_alignment_report.md",
    "processed/route/route_continuity_diagnostics.json",
    "processed/route/route_segment_length_checks.json",
    "processed/milepoints/full_at_milepoints_0_1mi.geojson",
    "processed/milepoints/full_at_milepoints_0_5mi.geojson",
    "processed/milepoints/full_at_milepoints_1_0mi.geojson",
    "processed/milepoints/global_mile_alignment_report.md",
    "processed/elevation/full_trail_elevation_samples_1_0mi.json",
    "processed/elevation/full_trail_elevation_samples_100m.json",
    "processed/elevation/full_trail_elevation_100m_status.json",
    "processed/elevation/full_trail_elevation_by_1mi_segment_100m.json",
    "processed/elevation/full_trail_elevation_by_5mi_segment_100m.json",
    "processed/elevation/full_trail_elevation_by_10mi_segment_100m.json",
    "processed/elevation/full_trail_elevation_by_5mi_segment.json",
    "processed/elevation/full_trail_elevation_by_10mi_segment.json",
    "processed/elevation/full_trail_major_climbs_descents_100m.json",
    "processed/elevation/full_trail_steep_grade_sections_100m.json",
    "processed/elevation/full_trail_elevation_summary.md",
    "processed/water/full_trail_water_candidates.json",
    "processed/water/full_trail_major_ford_candidates.json",
    "processed/waypoints/full_trail_shelters.json",
    "processed/waypoints/full_trail_campsites.json",
    "processed/waypoints/full_trail_privies.json",
    "processed/waypoints/full_trail_parking.json",
    "processed/waypoints/full_trail_trailheads.json",
    "processed/waypoints/full_trail_road_crossings.json",
    "processed/waypoints/full_trail_towns_resupply_candidates.json",
    "processed/rules/full_trail_rules_by_land_manager.json",
    "processed/live_conditions/full_trail_live_condition_sources.json",
    "processed/tread/full_trail_tread_rockiness_1_0mi.json",
    "processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json",
    "processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json",
    "processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json",
    "processed/tread_rockiness_v2/full_trail_soil_stoniness.json",
    "processed/tread_rockiness_v2/full_trail_osm_surface_tags.json",
    "processed/tread_rockiness_v2/rockiness_v2_model_notes.md",
    "processed/tread_rockiness_v2/rockiness_v2_source_limitations.md",
    "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json",
    "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json",
    "processed/tread_rockiness_v2_1/rockiness_v2_1_model_notes.md",
    "processed/tread_rockiness_v2_1/rockiness_v2_1_source_limitations.md",
    "processed/legal/blocked_legacy_awol_audit.json",
    "processed/difficulty/full_trail_daily_difficulty_model.md",
    "processed/difficulty/full_trail_daily_difficulty_model.json",
    "processed/difficulty/full_trail_difficulty_by_10mi_segment.json",
    "processed/index/full_trail_dataset_index.json",
    "processed/index/full_trail_file_manifest.json",
    "rag_docs/overview/full_trail_overview.md",
    "rag_docs/state_guides/state_guide_index.md",
    "rag_docs/segment_guides/segment_index_25mi.md",
    "rag_docs/rules/land_manager_rules_index.md",
    "rag_docs/policies/water.md",
    "rag_docs/policies/weather_live_conditions.md",
    "rag_docs/policies/closures.md",
    "rag_docs/policies/navigation.md",
    "rag_docs/policies/tread.md",
    "rag_docs/policies/difficulty.md",
    "rag_docs/policies/license_attribution.md",
    "rag_docs/rag_doc_metadata.json",
    "schemas/rockiness_v2.schema.json",
    "schemas/rockiness_v2_1.schema.json",
    "sources/opentrail_review.json",
    "sources/openlongtrails_review.json",
    "sources/open_dem_review.json",
    "tests/full_trail_rc1_behavior_questions.json",
    "exports/full_trail_reference_pack_rc1.zip",
    "exports/manifest.json",
]


def j(path: str) -> Any:
    return json.loads((ROOT / path).read_text())


def t(path: str) -> str:
    return (ROOT / path).read_text()


def rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    if isinstance(value, dict) and isinstance(value.get("features"), list):
        return [feature.get("properties", feature) for feature in value["features"] if isinstance(feature, dict)]
    return []


def fail_if(condition: bool, failures: list[str], message: str) -> None:
    if condition:
        failures.append(message)


def common(record: dict[str, Any], failures: list[str], label: str) -> None:
    fail_if(not (record.get("source_id") or record.get("source_ids") or record.get("source_route_id")), failures, f"{label} missing source")
    fail_if(record.get("license_status") in BLOCKED_LICENSES, failures, f"{label} blocked/review license")
    fail_if(not record.get("confidence"), failures, f"{label} missing confidence")
    fail_if(not (record.get("last_checked") or record.get("last_generated")), failures, f"{label} missing timestamp")
    fail_if(not record.get("ai_answer_rule"), failures, f"{label} missing ai_answer_rule")


def coordinate_first_landmark(record: dict[str, Any], failures: list[str], label: str) -> None:
    anchor = record.get("coordinate_anchor")
    snap = record.get("route_snap")
    fail_if(not isinstance(anchor, dict), failures, f"{label} missing coordinate_anchor")
    fail_if(not isinstance(snap, dict), failures, f"{label} missing route_snap")
    if isinstance(anchor, dict):
        fail_if(anchor.get("anchor_role") != "canonical_landmark_location", failures, f"{label} coordinate anchor not canonical")
        fail_if(round(float(anchor.get("lat")), 6) != round(float(record.get("lat")), 6) or round(float(anchor.get("lon")), 6) != round(float(record.get("lon")), 6), failures, f"{label} coordinate anchor differs from record coordinates")
        fail_if("route miles are derived snaps" not in anchor.get("identity_rule", "").lower(), failures, f"{label} coordinate anchor lacks derived-mile rule")
    if isinstance(snap, dict):
        fail_if(snap.get("official") is not False, failures, f"{label} route_snap official not false")
        fail_if(snap.get("generated") is not True, failures, f"{label} route_snap not generated")
        fail_if(snap.get("route_alignment_status") != "yellow_unresolved_open_route_delta", failures, f"{label} route_snap missing alignment status")
        fail_if(snap.get("mile_nobo_global_est") != record.get("mile_nobo_global_est"), failures, f"{label} route_snap mile mismatch")
        fail_if("coordinate_anchor is the landmark identity" not in snap.get("ai_answer_rule", ""), failures, f"{label} route_snap lacks coordinate-first rule")


def validate() -> dict[str, Any]:
    failures: list[str] = []
    for path in REQUIRED_PATHS:
        fail_if(not (ROOT / path).exists(), failures, f"missing {path}")

    manifest = j("full_trail_source_manifest.yaml")
    fail_if(len(manifest) < 20, failures, "source manifest too small")
    source_map = {source.get("source_id"): source for source in manifest}
    for source in manifest:
        for field in ["source_id", "name", "owner", "source_url", "license_status", "allowed_use", "confidence", "last_checked"]:
            fail_if(not source.get(field), failures, f"source {source.get('source_id')} missing {field}")
        if source.get("production_safe"):
            fail_if(source.get("license_status") not in VALID_LICENSES, failures, f"production-safe source {source.get('source_id')} has unsafe license")
    for blocked in ["farout", "awol_at_guide", "at_data_book", "alltrails_gaia_hiking_project", "atc_website"]:
        fail_if(source_map.get(blocked, {}).get("license_status") != "blocked", failures, f"{blocked} not blocked")
    for review_only in ["opentrail_review", "openlongtrails_review"]:
        source = source_map.get(review_only, {})
        fail_if(source.get("license_status") != "unknown_review_required", failures, f"{review_only} should remain review-only")
        fail_if(source.get("production_safe") is not False, failures, f"{review_only} leaked into production-safe sources")
        fail_if(not source.get("blocked_until"), failures, f"{review_only} missing blocked_until")
    for safe_source in ["usgs_3dep_seamless_dem", "usgs_3dep_lidar", "nrcs_gssurgo_ssurgo", "full_trail_rockiness_v2_model", "full_trail_rockiness_v2_1_extraction_model"]:
        source = source_map.get(safe_source, {})
        fail_if(source.get("production_safe") is not True, failures, f"{safe_source} not production safe")
        fail_if(source.get("license_status") not in VALID_LICENSES, failures, f"{safe_source} unsafe license")
    opentrail_review = j("sources/opentrail_review.json")
    openlongtrails_review = j("sources/openlongtrails_review.json")
    open_dem_review = j("sources/open_dem_review.json")
    for review in [opentrail_review, openlongtrails_review, *open_dem_review]:
        for field in ["source_id", "owner", "source_url", "access_method", "license_status", "production_safe", "allowed_use", "candidate_use", "confidence", "last_checked", "recommendation"]:
            if field == "recommendation" and review.get(field) is None:
                # Older manifest rows call this notes; the generated review files below must normalize it.
                pass
            else:
                fail_if(field not in review or review.get(field) in (None, ""), failures, f"source review {review.get('source_id')} missing {field}")
    fail_if(opentrail_review.get("production_safe") is not False, failures, "OpenTrail review production_safe not false")
    fail_if(openlongtrails_review.get("production_safe") is not False, failures, "OpenLongTrails review production_safe not false")

    route = rows(j("processed/route/full_at_route_rc1.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route official must be false")
    fail_if(route.get("measured_length_miles") != 2106.2, failures, "route measured length mismatch")
    fail_if(route.get("official_reference_length_miles") != 2197.9, failures, "official reference length hidden or wrong")
    fail_if(route.get("length_delta_miles") != -91.7, failures, "route length delta missing")
    fail_if(route.get("alignment_status") != "yellow_unresolved_open_route_delta", failures, "route alignment status missing")
    fail_if("generated/open-route mile" not in route.get("ai_answer_rule", "").lower(), failures, "route answer rule missing generated/open-route policy")
    fail_if("coverage_gaps" not in route or not route["coverage_gaps"], failures, "route missing coverage gaps")
    notes = t("processed/route/route_integration_notes.md").lower()
    for term in ["davenport gap", "damascus", "amicalola", "baxter", "katahdin", "not official", "openstreetmap", "2197.9", "-91.7", "alignment status"]:
        fail_if(term not in notes, failures, f"route notes missing {term}")

    alignment = j("processed/route/route_alignment_diagnostics.json")
    fail_if(alignment.get("official") is not False, failures, "alignment official must be false")
    fail_if(alignment.get("official_reference_length_miles") != 2197.9, failures, "alignment official reference missing")
    fail_if(alignment.get("generated_route_length_miles") != 2106.2, failures, "alignment generated route length missing")
    fail_if(alignment.get("length_delta_miles") != -91.7, failures, "alignment delta missing")
    fail_if(alignment.get("alignment_status") != "yellow_unresolved_open_route_delta", failures, "alignment status missing")
    measurements = alignment.get("route_length_measurements", {})
    fail_if(measurements.get("local_geodesic_miles") is None, failures, "alignment missing geodesic measurement")
    fail_if(measurements.get("waymarked_reported_miles") is None, failures, "alignment missing Waymarked comparison")
    fail_if(measurements.get("three_d_estimate", {}).get("estimated_3d_length_miles") is None, failures, "alignment missing 3D estimate")
    compared = json.dumps(alignment.get("compared_factors", [])).lower()
    for term in ["osm/waymarked", "projection", "approach trail", "baxter", "detours", "official atc"]:
        fail_if(term not in compared, failures, f"alignment comparison missing {term}")
    fail_if(len(alignment.get("suspected_causes", [])) < 4, failures, "alignment suspected causes too thin")
    fail_if(len(alignment.get("unresolved_causes", [])) < 3, failures, "alignment unresolved causes too thin")
    report = t("processed/route/route_alignment_report.md").lower()
    for term in ["2197.9", "2106.2", "-91.7", "generated/open-route", "not official", "waymarked", "geodesic", "unresolved", "davenport gap"]:
        fail_if(term not in report, failures, f"route alignment report missing {term}")
    continuity = j("processed/route/route_continuity_diagnostics.json")
    fail_if(continuity.get("vertex_count", 0) < 100000, failures, "continuity vertex count too low")
    fail_if(continuity.get("consecutive_segments_over_1_0_miles", 1) != 0, failures, "continuity has undocumented >1 mile route vertex gap")
    segment_checks = j("processed/route/route_segment_length_checks.json")
    fail_if(len(segment_checks) < 7, failures, "segment length checks missing regional rows")
    fail_if(not any(check.get("region_id") == "coverage_gap_davenport_damascus" and check.get("gap") is True for check in segment_checks), failures, "Davenport-Damascus gap not documented in segment checks")

    for interval, minimum in [("0_1", 21000), ("0_5", 4200), ("1_0", 2100)]:
        milepoints = rows(j(f"processed/milepoints/full_at_milepoints_{interval}mi.geojson"))
        fail_if(len(milepoints) < minimum, failures, f"{interval} milepoints too few")
        previous = -1
        for record in milepoints[:25] + milepoints[-25:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official not false")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint lacks official caution")
            fail_if("generated/open-route mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint lacks generated/open-route label")
        for record in milepoints:
            mile = record.get("mile_nobo_global_est")
            fail_if(mile is None or mile < previous, failures, f"{interval} milepoints not monotonic")
            previous = mile

    elevation_100m = j("processed/elevation/full_trail_elevation_samples_100m.json")
    elevation_status = j("processed/elevation/full_trail_elevation_100m_status.json")
    fail_if(len(elevation_100m) < 33000, failures, "100m elevation samples too few")
    fail_if(elevation_status.get("complete") is not True, failures, "100m elevation status incomplete")
    fail_if(elevation_status.get("sample_spacing_meters") != 100, failures, "100m elevation status wrong spacing")
    fail_if(elevation_status.get("sample_count") != len(elevation_100m), failures, "100m elevation status count mismatch")
    previous_distance = -1
    for record in elevation_100m[:25] + elevation_100m[-25:]:
        common(record, failures, "elevation 100m")
        fail_if(record.get("official") is not False, failures, "100m elevation official not false")
        fail_if(record.get("sample_spacing_meters") != 100, failures, "100m elevation wrong spacing")
        fail_if(record.get("source_id") != "usgs_3dep", failures, "100m elevation wrong source")
        fail_if(record.get("license_status") != "public_domain", failures, "100m elevation wrong license")
        fail_if(not isinstance(record.get("epqs"), dict), failures, "100m elevation missing EPQS metadata")
        fail_if("100-meter" not in record.get("ai_answer_rule", ""), failures, "100m elevation answer rule missing spacing")
    for record in elevation_100m:
        distance = record.get("distance_meters")
        fail_if(distance is None or distance < previous_distance, failures, "100m elevation distance not monotonic")
        previous_distance = distance
        fail_if(record.get("elevation_ft") is None, failures, "100m elevation missing elevation_ft")
    for relative, minimum in [
        ("processed/elevation/full_trail_elevation_by_1mi_segment_100m.json", 2000),
        ("processed/elevation/full_trail_elevation_by_5mi_segment_100m.json", 420),
        ("processed/elevation/full_trail_elevation_by_10mi_segment_100m.json", 210),
        ("processed/elevation/full_trail_elevation_by_5mi_segment.json", 420),
        ("processed/elevation/full_trail_elevation_by_10mi_segment.json", 210),
    ]:
        summaries = j(relative)
        fail_if(len(summaries) < minimum, failures, f"{relative} too few")
        for record in summaries[:10]:
            common(record, failures, relative)
            fail_if(record.get("sample_spacing_meters") != 100, failures, f"{relative} not derived from 100m samples")
            fail_if(record.get("sample_count", 0) < 2, failures, f"{relative} missing sample_count")
            fail_if(record.get("max_grade_percent") is None, failures, f"{relative} missing max grade")
            fail_if("100-meter" not in record.get("ai_answer_rule", ""), failures, f"{relative} answer rule missing high-res caution")
    major_climbs = j("processed/elevation/full_trail_major_climbs_descents_100m.json")
    steep_sections = j("processed/elevation/full_trail_steep_grade_sections_100m.json")
    fail_if(len(major_climbs) < 50, failures, "major climb/descent candidates too few")
    fail_if(len(steep_sections) < 100, failures, "steep-grade sections too few")
    for record in major_climbs[:10] + steep_sections[:10]:
        common(record, failures, "100m terrain derived feature")
        fail_if(record.get("sample_spacing_meters") != 100, failures, "100m terrain feature wrong spacing")
        fail_if("100-meter" not in record.get("ai_answer_rule", ""), failures, "100m terrain feature missing answer rule")

    water = j("processed/water/full_trail_water_candidates.json")
    fail_if(len(water) < 1700, failures, "water candidates too few")
    for record in water[:50] + water[-50:]:
        common(record, failures, "water")
        coordinate_first_landmark(record, failures, "water")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability overclaimed")
        fail_if(record.get("potable") != "unknown", failures, "water potability overclaimed")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified without proof")
        fail_if("mapped water candidate" not in record.get("ai_answer_rule", "").lower(), failures, "water answer rule missing mapped candidate")
    for record in j("processed/water/full_trail_major_ford_candidates.json")[:50]:
        common(record, failures, "ford")
        coordinate_first_landmark(record, failures, "ford")
        fail_if(record.get("ford_safety") != "unknown", failures, "ford safety overclaimed")
        fail_if("never call" not in record.get("ai_answer_rule", "").lower(), failures, "ford safety caution missing")

    for dataset in ["full_trail_shelters", "full_trail_campsites", "full_trail_parking", "full_trail_road_crossings", "full_trail_towns_resupply_candidates"]:
        records = j(f"processed/waypoints/{dataset}.json")
        fail_if(len(records) < 20, failures, f"{dataset} too small")
        for record in records[:20]:
            common(record, failures, dataset)
            coordinate_first_landmark(record, failures, dataset)
            fail_if(record.get("production_safe") is not True, failures, f"{dataset} unsafe record in candidate output")

    rules = j("processed/rules/full_trail_rules_by_land_manager.json")
    fail_if(len(rules) < 20, failures, "rules too few")
    rules_text = json.dumps(rules).lower()
    for term in ["shenandoah", "baxter", "katahdin", "white mountain", "connecticut", "new jersey", "smok", "permit"]:
        fail_if(term not in rules_text, failures, f"rules missing {term}")
    fail_if("dispersed camping is allowed everywhere" in rules_text, failures, "illegal camping advice present")

    live_policy = t("processed/live_conditions/full_trail_live_condition_policy.md").lower()
    for term in ["nws", "nps", "usfs", "state", "baxter", "katahdin", "atc trail updates", "live retrieval fails"]:
        fail_if(term not in live_policy, failures, f"live policy missing {term}")

    tread = j("processed/tread/full_trail_tread_rockiness_1_0mi.json")
    fail_if(len(tread) < 2000, failures, "tread records too few")
    fail_if(not any(record.get("confidence") == "low" and record.get("region_id") == "coverage_gap_davenport_damascus" for record in tread), failures, "gap tread low confidence missing")
    for record in tread[:25] + tread[-25:]:
        common(record, failures, "tread")
        fail_if(record.get("field_verified") is not False, failures, "tread unexpectedly field verified")
        fail_if(record.get("score") not in [0, 1, 2, 3, 4, 5], failures, "tread score outside range")

    rockiness01 = j("processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json")
    rockiness1 = j("processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json")
    micro_coverage = j("processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json")
    soil = j("processed/tread_rockiness_v2/full_trail_soil_stoniness.json")
    osm_surface = j("processed/tread_rockiness_v2/full_trail_osm_surface_tags.json")
    fail_if(len(rockiness01) < 21000, failures, "Rockiness V2 0.1mi records too few")
    fail_if(len(rockiness1) < 2100, failures, "Rockiness V2 1mi records too few")
    fail_if(len(micro_coverage) < 3, failures, "micro roughness coverage missing reviewed lanes")
    coverage_text = json.dumps(micro_coverage).lower()
    for term in ["100m", "3dep", "lidar", "not_downloaded", "not_streamed"]:
        fail_if(term not in coverage_text, failures, f"micro coverage missing {term}")
    fail_if(len(soil) < 2000, failures, "soil stoniness lane too small")
    fail_if(len(osm_surface) < 2000, failures, "OSM surface lane too small")
    fail_if(not all(record.get("license_status") == "public_domain" for record in soil[:50]), failures, "soil lane not public domain")
    fail_if(not all(record.get("soil_stoniness_score") is None for record in soil[:50]), failures, "soil lane should stay null until extraction")
    fail_if(not all(record.get("license_status") == "open_license_share_alike" for record in osm_surface[:50]), failures, "OSM surface lane not ODbL/open_license_share_alike")
    fail_if(not any(record.get("osm_surface_signal") is not None for record in osm_surface), failures, "OSM surface signals never populated")
    rockiness_required = [
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
    for dataset_name, records in [("rockiness01", rockiness01), ("rockiness1", rockiness1)]:
        fail_if(any(record.get("field_verified") is True for record in records), failures, f"{dataset_name} has field_verified true")
        fail_if(any(record.get("official") is not False for record in records[:50] + records[-50:]), failures, f"{dataset_name} official not false")
        fail_if(any(record.get("lidar_available") is True for record in records), failures, f"{dataset_name} marks lidar available without extraction evidence")
        fail_if(any(record.get("license_status") != "open_license_share_alike" for record in records[:50] + records[-50:]), failures, f"{dataset_name} license is not ODbL/open share alike")
        for record in records[:50] + records[-50:]:
            common(record, failures, dataset_name)
            for field in rockiness_required:
                fail_if(field not in record, failures, f"{dataset_name} missing {field}")
            fail_if(not 0 <= record.get("rockiness_v2_score_0_10", -1) <= 10, failures, f"{dataset_name} score outside 0-10")
            fail_if(record.get("dem_resolution_m") != 100, failures, f"{dataset_name} should use current 100m baseline")
            fail_if("not field verified" not in record.get("ai_answer_rule", "").lower(), failures, f"{dataset_name} missing not-field-verified rule")
            fail_if("not official atc" not in record.get("ai_answer_rule", "").lower() and dataset_name == "rockiness01", failures, f"{dataset_name} missing generated-mile caution")
    fail_if(not any(record.get("confidence") == "low_due_to_regional_mvp_gap" for record in rockiness1), failures, "Rockiness V2 gap low confidence missing")
    fail_if(not any(record.get("confidence", "").startswith("medium") for record in rockiness1), failures, "Rockiness V2 lacks medium confidence records where OSM/100m signals exist")
    notes_text = t("processed/tread_rockiness_v2/rockiness_v2_model_notes.md").lower()
    limitations_text = t("processed/tread_rockiness_v2/rockiness_v2_source_limitations.md").lower()
    for term in ["opentrail", "openlongtrails", "not field verified", "100-meter", "osm", "gssurgo", "lidar", "user reports"]:
        fail_if(term not in limitations_text and term not in notes_text, failures, f"Rockiness V2 docs missing {term}")

    rockiness21_extraction = j("processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json")
    rockiness21_1 = j("processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json")
    fail_if(rockiness21_extraction.get("production_safe") is not True, failures, "Rockiness V2.1 extraction not production-safe")
    fail_if(rockiness21_extraction.get("extraction_level") == "missing_snapshot_fallback", failures, "Rockiness V2.1 missing live extraction snapshot")
    dem_sections = rockiness21_extraction.get("dem", {}).get("sections", [])
    fail_if(not any(section.get("item_count_returned", 0) > 0 for section in dem_sections), failures, "Rockiness V2.1 DEM STAC extraction has no items")
    lidar = rockiness21_extraction.get("lidar", {})
    fail_if(lidar.get("catalog_item_link_count", 0) <= 0, failures, "Rockiness V2.1 LiDAR catalog not checked")
    fail_if(lidar.get("at_state_item_link_count", 0) <= 0, failures, "Rockiness V2.1 LiDAR AT-state catalog count missing")
    fail_if(len(rockiness21_1) != len(rockiness1), failures, "Rockiness V2.1 1mi count does not match V2")
    for label, records in [("1mi V2.1", rockiness21_1)]:
        fail_if(any(record.get("field_verified") is True for record in records), failures, f"{label} has field_verified true")
        fail_if(any(record.get("lidar_available") is True for record in records), failures, f"{label} claims lidar_available before point-cloud extraction")
        fail_if(any(record.get("official") is not False for record in records[:50] + records[-50:]), failures, f"{label} official not false")
        fail_if(not any(record.get("dem_stac_item_count", 0) > 0 for record in records), failures, f"{label} lacks DEM STAC metadata")
        for record in records[:50] + records[-50:]:
            common(record, failures, label)
            fail_if(record.get("source_id") != "full_trail_rockiness_v2_1_extraction_model", failures, f"{label} wrong source_id")
            fail_if("not field verified" not in record.get("ai_answer_rule", "").lower(), failures, f"{label} missing not-field-verified rule")
            fail_if("generated/open-route miles are not official" not in record.get("ai_answer_rule", "").lower(), failures, f"{label} missing generated-mile caution")
    v21_notes = t("processed/tread_rockiness_v2_1/rockiness_v2_1_model_notes.md").lower()
    v21_limits = t("processed/tread_rockiness_v2_1/rockiness_v2_1_source_limitations.md").lower()
    for term in ["bounded", "stac", "lidar", "not field verified", "ssurgo", "does not sample"]:
        fail_if(term not in v21_notes and term not in v21_limits, failures, f"Rockiness V2.1 docs missing {term}")

    awol_audit = j("processed/legal/blocked_legacy_awol_audit.json")
    fail_if(awol_audit.get("production_safe") is not False, failures, "AWOL audit should not be production safe")
    fail_if(awol_audit.get("license_status") != "blocked", failures, "AWOL audit should be blocked")
    fail_if(len(awol_audit.get("awol_scripts", [])) < 1, failures, "AWOL audit did not find legacy scripts")
    fail_if("production_safe" not in awol_audit.get("production_export_rule", ""), failures, "AWOL audit missing production-safe export rule")

    difficulty = j("processed/difficulty/full_trail_difficulty_by_10mi_segment.json")
    fail_if(len(difficulty) < 210, failures, "difficulty segments too few")
    fail_if(not any(record["factors"].get("ford_uncertainty_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks ford factor")
    fail_if(not any(record["factors"].get("regional_gap_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks regional gap factor")
    fail_if(not any(record["factors"].get("permit_rule_friction_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks permit/rule friction")
    fail_if(not any(record["factors"].get("steep_grade_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks steep-grade factor")
    fail_if(not any(record["factors"].get("rockiness_v2_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks Rockiness V2 factor")
    for record in difficulty[:10]:
        common(record, failures, "difficulty")
        fail_if(record.get("difficulty_score_0_10") is None, failures, "difficulty missing score")
        fail_if(record.get("inputs", {}).get("elevation_sample_spacing_meters") != 100, failures, "difficulty not using 100m elevation")
        fail_if(record.get("inputs", {}).get("max_grade_percent") is None, failures, "difficulty missing max-grade input")
        fail_if("rockiness_v2_score_avg" not in record.get("inputs", {}), failures, "difficulty missing Rockiness V2 input")
        fail_if("rockiness_v2_factor" not in record.get("factors", {}), failures, "difficulty missing Rockiness V2 factor")
    difficulty_model = j("processed/difficulty/full_trail_daily_difficulty_model.json")
    fail_if(difficulty_model.get("preferred_tread_source") != "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json", failures, "difficulty model does not prefer Rockiness V2.1")
    difficulty_doc = t("processed/difficulty/full_trail_daily_difficulty_model.md").lower()
    fail_if("rockiness v2" not in difficulty_doc or ("not field verified" not in difficulty_doc and "not field-verified" not in difficulty_doc), failures, "difficulty doc missing Rockiness V2 caveat")

    rag_metadata = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(rag_metadata) < 84, failures, "RAG segment metadata too few")
    for record in rag_metadata[:10]:
        common(record, failures, "rag metadata")
    segment_index = t("rag_docs/segment_guides/segment_index_25mi.md").lower()
    fail_if("2106" not in segment_index, failures, "segment index missing end")

    qa = j("tests/full_trail_rc1_behavior_questions.json")
    fail_if(len(qa) < 200, failures, "QA questions below 200")
    qa_text = json.dumps(qa).lower()
    for term in ["itinerary", "shelter", "water", "permit", "camping", "weather", "closures", "rockiness", "rockiness v2", "rocky-but-flat", "user report override", "blocked source leakage", "ford", "baxter", "katahdin", "smokies", "shenandoah", "white mountains", "nj/ct", "pa rockiness", "resupply", "davenport", "official length alignment", "2197.9", "2106.2", "-91.7"]:
        fail_if(term not in qa_text, failures, f"QA missing {term}")

    dataset_index = j("processed/index/full_trail_dataset_index.json")
    safe_files = {entry["path"] for entry in dataset_index if entry.get("production_safe")}
    with ZipFile(ROOT / "exports/full_trail_reference_pack_rc1.zip") as zf:
        names = set(zf.namelist())
    for required in ["attribution.md", "manifest.json"]:
        fail_if(required not in names, failures, f"export missing {required}")
    for safe in safe_files:
        fail_if(safe not in names, failures, f"export missing safe file {safe}")
    for entry in dataset_index:
        if not entry.get("production_safe"):
            fail_if(entry["path"] in names, failures, f"export included unsafe file {entry['path']}")
        if entry.get("production_safe"):
            fail_if("awol" in entry["path"].lower() or "awol" in entry["dataset_id"].lower(), failures, f"AWOL path marked production safe: {entry['path']}")
    for unsafe_review_path in ["sources/opentrail_review.json", "sources/openlongtrails_review.json", "sources/open_dem_review.json", "processed/legal/blocked_legacy_awol_audit.json"]:
        fail_if(unsafe_review_path in names, failures, f"export included review/blocked file {unsafe_review_path}")
    fail_if(any("awol" in name.lower() for name in names), failures, "export zip contains AWOL path")

    return {
        "ok": not failures,
        "failures": failures,
        "route_miles": route.get("measured_length_miles"),
        "official_reference_miles": route.get("official_reference_length_miles"),
        "length_delta_miles": route.get("length_delta_miles"),
        "alignment_status": route.get("alignment_status"),
        "milepoints_0_1mi": len(rows(j("processed/milepoints/full_at_milepoints_0_1mi.geojson"))),
        "elevation_100m_samples": len(elevation_100m),
        "major_climbs_descents_100m": len(major_climbs),
        "steep_grade_sections_100m": len(steep_sections),
        "water_candidates": len(water),
        "rules": len(rules),
        "tread_1mi_records": len(tread),
        "rockiness_v2_0_1mi_records": len(rockiness01),
        "rockiness_v2_1mi_records": len(rockiness1),
        "rockiness_v2_1_1mi_records": len(rockiness21_1),
        "difficulty_segments": len(difficulty),
        "rag_docs": len(rag_metadata),
        "behavior_questions": len(qa),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate()
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("ok" if result["ok"] else "failed")
        for failure in result["failures"]:
            print(f"- {failure}")
    raise SystemExit(0 if result["ok"] else 1)


if __name__ == "__main__":
    main()
