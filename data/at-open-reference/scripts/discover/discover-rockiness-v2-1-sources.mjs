#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const STAC_SEARCH_URL = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const DEM_COLLECTION = '3dep-seamless';
const LIDAR_STAC_ROOT = 'https://usgs-lidar-stac.s3-us-west-2.amazonaws.com/ept/catalog.json';
const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
const NRCS_GSSURGO_URL = 'https://www.nrcs.usda.gov/resources/data-and-reports/gridded-soil-survey-geographic-gssurgo-database';

const CALIBRATION_SECTIONS = [
  {
    section_id: 'full_at_corridor',
    label: 'Full Appalachian Trail corridor bounding box',
    bbox: [-84.35, 34.45, -68.75, 46.0],
    expected_signal: 'broad 10m/30m DEM coverage discovery',
  },
  {
    section_id: 'northern_pennsylvania_rocky_ridges',
    label: 'Northern Pennsylvania rocky ridge calibration window',
    bbox: [-77.9, 40.3, -75.1, 41.4],
    mile_range_nobo_global_est: [1180, 1270],
    expected_signal: 'rocky-but-lower-elevation tread calibration',
  },
  {
    section_id: 'white_mountains_nh',
    label: 'White Mountains high-relief calibration window',
    bbox: [-72.2, 43.8, -70.7, 44.5],
    mile_range_nobo_global_est: [1760, 1853],
    expected_signal: 'steep rocky/rooty alpine terrain calibration',
  },
  {
    section_id: 'western_maine_mahoosucs_100_mile',
    label: 'Western Maine / Mahoosucs / 100-Mile Wilderness calibration window',
    bbox: [-71.1, 44.4, -68.7, 46.0],
    mile_range_nobo_global_est: [1853, 2106.2],
    expected_signal: 'rocks, roots, mud, remoteness, and ford uncertainty calibration',
  },
];

const AT_STATE_PREFIXES = [
  'GA_',
  'NC_',
  'TN_',
  'VA_',
  'WV_',
  'MD_',
  'PA_',
  'NJ_',
  'NY_',
  'CT_',
  'MA_',
  'VT_',
  'NH_',
  'ME_',
];

const args = process.argv.slice(2);
const writeIndex = args.indexOf('--write');
const writePath = writeIndex >= 0 ? args[writeIndex + 1] : null;
const demLimitIndex = args.indexOf('--dem-limit');
const demLimit = demLimitIndex >= 0 ? Number(args[demLimitIndex + 1]) : 12;
const lidarLimitIndex = args.indexOf('--lidar-item-limit');
const lidarItemLimit = lidarLimitIndex >= 0 ? Number(args[lidarLimitIndex + 1]) : 220;

function bboxIntersects(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function compactFeature(feature) {
  const assets = feature.assets ?? {};
  return {
    item_id: feature.id,
    collection: feature.collection ?? DEM_COLLECTION,
    bbox: feature.bbox ?? null,
    datetime: feature.properties?.datetime ?? null,
    asset_keys: Object.keys(assets).sort(),
    has_cog_asset: Object.values(assets).some((asset) => /cog|geotiff|tif/i.test(`${asset.type ?? ''} ${asset.href ?? ''}`)),
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'user-agent': 'hoggcountry-rockiness-v2-1-discovery/1.0',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`${url} failed: ${response.status} ${response.statusText}`);
  return response.json();
}

async function discoverDemSection(section) {
  const request = {
    collections: [DEM_COLLECTION],
    bbox: section.bbox,
    limit: demLimit,
  };
  const json = await fetchJson(STAC_SEARCH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
  const features = Array.isArray(json.features) ? json.features : [];
  return {
    ...section,
    source_id: 'usgs_3dep_seamless_dem',
    source_url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/3dep-seamless',
    request,
    item_count_returned: features.length,
    item_ids: features.map((feature) => feature.id),
    items: features.map(compactFeature),
    extraction_status: 'bounded_stac_metadata_extracted_no_raster_pixels_downloaded',
    production_safe: true,
    license_status: 'public_domain',
  };
}

function stacItemIdFromHref(href) {
  return path.basename(href).replace(/\.json$/u, '');
}

async function discoverLidar() {
  const catalog = await fetchJson(LIDAR_STAC_ROOT);
  const itemLinks = (catalog.links ?? []).filter((link) => link.rel === 'item' && typeof link.href === 'string');
  const atStateLinks = itemLinks.filter((link) => AT_STATE_PREFIXES.some((prefix) => stacItemIdFromHref(link.href).startsWith(prefix)));
  const cappedLinks = atStateLinks.slice(0, lidarItemLimit);

  const items = [];
  for (const link of cappedLinks) {
    try {
      const item = await fetchJson(link.href);
      items.push({
        item_id: item.id ?? stacItemIdFromHref(link.href),
        href: link.href,
        bbox: item.bbox ?? null,
        point_count: item.properties?.['pc:count'] ?? null,
        point_type: item.properties?.['pc:type'] ?? null,
        point_encoding: item.properties?.['pc:encoding'] ?? null,
        projection: item.properties?.['proj:code'] ?? null,
      });
    } catch (error) {
      items.push({
        item_id: stacItemIdFromHref(link.href),
        href: link.href,
        fetch_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const calibrationSections = CALIBRATION_SECTIONS.filter((section) => section.section_id !== 'full_at_corridor')
    .map((section) => {
      const intersecting = items.filter((item) => Array.isArray(item.bbox) && bboxIntersects(item.bbox, section.bbox));
      return {
        ...section,
        source_id: 'usgs_3dep_lidar',
        source_url: 'https://registry.opendata.aws/usgs-lidar/',
        intersecting_item_count: intersecting.length,
        item_ids: intersecting.map((item) => item.item_id),
        sample_items: intersecting.slice(0, 8),
        extraction_status: 'bounded_catalog_metadata_extracted_no_ept_tiles_streamed',
        production_safe: true,
        license_status: 'public_domain',
      };
    });

  return {
    source_id: 'usgs_3dep_lidar',
    source_url: 'https://registry.opendata.aws/usgs-lidar/',
    stac_root: LIDAR_STAC_ROOT,
    catalog_id: catalog.id ?? null,
    catalog_item_link_count: itemLinks.length,
    at_state_item_link_count: atStateLinks.length,
    inspected_item_count: items.length,
    inspected_item_errors: items.filter((item) => item.fetch_error).length,
    calibration_sections: calibrationSections,
    extraction_status: 'bounded_catalog_metadata_extracted_no_ept_tiles_streamed',
    production_safe: true,
    license_status: 'public_domain',
  };
}

async function main() {
  const demSections = [];
  for (const section of CALIBRATION_SECTIONS) {
    demSections.push(await discoverDemSection(section));
  }
  const lidar = await discoverLidar();

  const result = {
    extraction_id: 'rockiness-v2-1-bounded-source-extraction',
    generated_at: new Date().toISOString(),
    extraction_level: 'catalog_coverage_metadata_only_not_raster_or_point_cloud_sampling',
    production_safe: true,
    license_status: 'open_license_share_alike_or_public_domain',
    dem: {
      source_id: 'usgs_3dep_seamless_dem',
      source_url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/3dep-seamless',
      stac_search_url: STAC_SEARCH_URL,
      collection: DEM_COLLECTION,
      sections: demSections,
    },
    lidar,
    soil: {
      source_id: 'nrcs_gssurgo_ssurgo',
      source_url: NRCS_GSSURGO_URL,
      extraction_status: 'not_extracted_in_v2_1',
      production_safe: true,
      license_status: 'public_domain',
      reason: 'V2.1 starts with bounded DEM/LiDAR coverage metadata. Corridor SSURGO attribute joins remain a separate bounded extractor, so soil_stoniness_score must stay null.',
    },
    osm: {
      source_id: 'osm',
      source_url: OSM_COPYRIGHT_URL,
      extraction_status: 'uses_existing_rc1_odbl_surface_signal_lane',
      production_safe: true,
      license_status: 'open_license_share_alike',
    },
    policy: 'Use this snapshot as extraction evidence for source availability only. Do not claim field-verified rockiness, reliable footing, LiDAR-derived record scores, or SSURGO-derived record scores until bounded pixel/point/soil attribute extraction writes record-level evidence.',
  };

  if (writePath) {
    const target = path.resolve(writePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
