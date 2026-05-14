#!/usr/bin/env python3
"""Export the Scout Full Trail RC1 production-safe subset."""

from __future__ import annotations

import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

PACK_ROOT = Path(__file__).resolve().parents[2]
RC_ROOT = PACK_ROOT / "full_trail_rc1"
EXPORT_ROOT = RC_ROOT / "exports"
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}


def read_json(path: Path):
    return json.loads(path.read_text())


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n")


def main() -> None:
    EXPORT_ROOT.mkdir(parents=True, exist_ok=True)

    dataset_index = read_json(RC_ROOT / "processed/index/full_trail_dataset_index.json")
    source_manifest = read_json(RC_ROOT / "full_trail_source_manifest.yaml")
    safe_sources = [
        source for source in source_manifest
        if source.get("production_safe") and source.get("license_status") in VALID_LICENSES
    ]
    safe_datasets = [entry for entry in dataset_index if entry.get("production_safe")]

    manifest = {
        "export_id": "full_trail_reference_pack_rc1_production_safe",
        "route_id": "at-full-trail-rc1-open-2026",
        "generated_from": "data/at-open-reference/full_trail_rc1",
        "production_safe": True,
        "policy": "Only datasets marked production_safe:true are included. Unknown, review-required, blocked, pointer-only, and test datasets are excluded.",
        "source_count": len(safe_sources),
        "dataset_count": len(safe_datasets),
        "datasets": safe_datasets,
        "attribution_files": ["attribution.md", "rag_docs/policies/license_attribution.md"],
        "odbl_notice": "OSM-derived route/POI/access data requires OpenStreetMap contributor attribution and ODbL/share-alike handling.",
        "live_condition_notice": "Static export cannot answer current closures, weather, permits, fords, or Baxter/Katahdin status.",
        "generated_mile_notice": "Generated miles are not official ATC mileage.",
    }

    write_json(EXPORT_ROOT / "manifest.json", manifest)
    write_json(EXPORT_ROOT / "full_trail_reference_pack_rc1_production_safe.json", {
        "manifest": manifest,
        "safe_sources": safe_sources,
        "dataset_index": safe_datasets,
    })

    zip_path = EXPORT_ROOT / "full_trail_reference_pack_rc1.zip"
    with ZipFile(zip_path, "w", compression=ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", json.dumps(manifest, indent=2) + "\n")
        zf.writestr("safe_source_manifest.json", json.dumps(safe_sources, indent=2) + "\n")
        for relative in ["README.md", "attribution.md", "data_quality_report_full_trail_rc1.md", "FULL_TRAIL_RC1_STATUS.md"]:
            zf.write(RC_ROOT / relative, relative)
        for relative in ["rag_docs/policies/license_attribution.md", "rag_docs/policies/navigation.md", "rag_docs/policies/water.md", "rag_docs/policies/weather_live_conditions.md"]:
            zf.write(RC_ROOT / relative, relative)
        for dataset in safe_datasets:
            relative = dataset["path"]
            source_path = RC_ROOT / relative
            if source_path.exists():
                zf.write(source_path, relative)

    print(json.dumps({
        "ok": True,
        "zip": str(zip_path),
        "datasets": len(safe_datasets),
        "sources": len(safe_sources),
    }, indent=2))


if __name__ == "__main__":
    main()
