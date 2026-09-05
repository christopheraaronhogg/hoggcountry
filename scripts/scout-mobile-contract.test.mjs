import assert from 'node:assert/strict';
import test from 'node:test';

const {
  SCOUT_MOBILE_PACK_VERSION,
  ScoutMobileContractError,
  buildScoutMobileMeta,
  validatePublicFieldPackEnvelope
} = await import('../packages/scout-mobile-contract/src/index.ts');

const baseReceipt = {
  id: 'atc-trail-updates',
  label: 'ATC Trail Updates',
  kind: 'live',
  status: 'cached',
  license: 'fair-use-facts',
  last_checked: '2026-06-16T17:00:00.000Z',
  citation_url: 'https://appalachiantrail.org/trail-updates/',
  confidence: 'high',
  notes: null
};

function sampleEnvelope() {
  return {
    data: {
      dad: {
        current_mile: 482.6,
        total_miles: 2197.9,
        percent_complete: 21.96,
        miles_remaining: 1714.8,
        current_state: 'Virginia',
        days_on_trail: 107,
        pace_miles_per_day: 4.5,
        start_date: '2026-03-01',
        latest_fix: {
          label: '36.812, -81.500',
          at: '2026-06-16T17:42:00.000Z',
          is_preview: false,
          trail_location: {
            mile: 482.6,
            label: 'AT mile 482.6',
            distance_off_trail_miles: 0.04
          }
        },
        recent_dispatch: {
          title: 'Damascus zero',
          published_at: '2026-06-16T12:00:00.000Z',
          trail_mile: 470.6
        },
        recent_trail_update: null
      },
      trail_ahead: {
        start_mile: 482.6,
        end_mile: 502.6,
        miles: [
          {
            mile: 483.0,
            elevation_ft: 3215,
            state: 'Virginia',
            rockiness_score: 4.2,
            difficulty_score: 5.1
          }
        ],
        upcoming_services: [
          {
            id: 'lost-mountain-shelter',
            kind: 'shelter',
            name: 'Lost Mountain Shelter',
            mile: 490.4,
            distance_miles: 7.8,
            state: 'Virginia',
            detail: '6-person shelter; water 0.1 mi north on side trail.',
            source_id: 'open-reference-shelters',
            confidence: 'high'
          }
        ],
        upcoming_climbs: [
          {
            start_mile: 488.0,
            end_mile: 491.5,
            direction: 'climb',
            grade_percent: 12.5,
            vertical_ft: 1280,
            state: 'Virginia'
          }
        ],
        difficulty_summary: { avg_score: 5.1, max_score: 7.4, label: 'steady' },
        source_receipts: [baseReceipt]
      },
      reference_loadout: {
        base_weight_oz: 198,
        worn_weight_oz: 88,
        consumable_weight_oz: 92,
        total_weight_oz: 290,
        item_count: 34,
        items: [
          {
            id: 'osprey-exos-58',
            name: 'Osprey Exos 58',
            category: 'pack',
            weight_oz: 38.4,
            quantity: 1,
            worn: false,
            consumable: false,
            notes: 'Dad uses size L',
            link: 'https://example.com/exos',
            last_updated: '2026-06-01T00:00:00.000Z'
          }
        ],
        missing_essentials: [],
        weather_change_recommendations: [
          {
            label: 'Pack the puffy back in',
            detail: 'Lows are forecast to drop below 35°F two nights running.',
            trigger: 'low_below_freezing',
            source_id: 'nws-forecast-cache'
          }
        ],
        source_receipts: [baseReceipt]
      },
      weather_cache: {
        regions: [
          {
            region_id: 'va-grayson',
            label: 'Virginia · Grayson Highlands',
            bounds: { min_mile: 480, max_mile: 520 },
            forecast: {
              fetched_at: '2026-06-16T17:30:00.000Z',
              valid_until: '2026-06-16T20:30:00.000Z',
              source: 'nws',
              point_url: 'https://api.weather.gov/points/36.6,-81.5',
              forecast_url: 'https://api.weather.gov/gridpoints/RNK/123,45/forecast',
              summary: [
                {
                  name: 'Tonight',
                  start_time: '2026-06-16T20:00:00-04:00',
                  end_time: '2026-06-17T06:00:00-04:00',
                  temperature: '38 F',
                  wind: '5 to 10 mph NW',
                  short_forecast: 'Clear',
                  detailed_forecast: 'Clear skies. Low near 38.'
                }
              ]
            },
            alerts: {
              fetched_at: '2026-06-16T17:30:00.000Z',
              source: 'nws',
              alerts_url: 'https://api.weather.gov/alerts/active?area=VA',
              items: []
            },
            trail_updates: {
              fetched_at: '2026-06-16T17:00:00.000Z',
              source: 'atc',
              items: []
            }
          }
        ],
        default_authoritative_source: 'nws'
      },
      at_reference_summary: {
        summary_id: 'at-open-reference-rc1',
        loaded_at: '2026-06-16T17:00:00.000Z',
        available: true,
        generated_at: '2026-06-12T00:00:00.000Z',
        reason: null,
        datasets: [
          {
            id: 'shelters',
            label: 'Shelters',
            category: 'waypoints',
            path: 'processed/waypoints/full_trail_shelters.json',
            record_count: 263,
            source_ids: ['at-open-reference'],
            license_statuses: ['odbl'],
            confidence: 'high',
            last_checked: '2026-06-12T00:00:00.000Z',
            ai_answer_rule: 'cite-source-id',
            bundled_payload_size_bytes: 412_000,
            download_url: 'https://assets.hoggcountry.com/at/shelters-rc1.json'
          }
        ],
        totals: { datasets: 1, records: 263 },
        policies: {
          generated_mile_disclosure: 'Mileage is calibrated, see provenance.md',
          route_quality_disclosure: 'Route is open-reference derived.',
          water_disclosure: 'Water comments are sourced; verify locally.',
          live_conditions_disclosure: 'Live conditions require online check.',
          blocked_sources_disclosure: 'Some sources are unavailable offline.',
          offline_use_disclosure: 'Bundled data is safe for offline use.'
        }
      }
    },
    meta: buildScoutMobileMeta({
      generatedAt: '2026-06-16T18:14:02.119Z',
      validUntil: '2026-06-16T18:44:02.119Z',
      requestId: 'test-1',
      sourceReceipts: [baseReceipt]
    }),
    error: null
  };
}

test('SCOUT_MOBILE_PACK_VERSION is the v1 contract', () => {
  assert.equal(SCOUT_MOBILE_PACK_VERSION, 1);
});

test('buildScoutMobileMeta returns the v1 envelope meta with required fields', () => {
  const meta = buildScoutMobileMeta({
    generatedAt: '2026-06-16T00:00:00.000Z',
    validUntil: '2026-06-16T00:30:00.000Z',
    requestId: 'abc',
    sourceReceipts: [baseReceipt]
  });
  assert.equal(meta.pack_version, 1);
  assert.equal(meta.fallback_reason, null);
  assert.equal(meta.request_id, 'abc');
  assert.equal(meta.source_receipts.length, 1);
});

test('validatePublicFieldPackEnvelope round-trips a well-formed envelope', () => {
  const envelope = sampleEnvelope();
  const validated = validatePublicFieldPackEnvelope(envelope);
  assert.equal(validated.meta.pack_version, 1);
  assert.equal(validated.data.dad.current_mile, 482.6);
  assert.equal(validated.data.trail_ahead.miles.length, 1);
  assert.equal(validated.data.weather_cache.regions[0].forecast?.source, 'nws');
  assert.equal(validated.data.at_reference_summary.datasets[0].id, 'shelters');
});

test('validatePublicFieldPackEnvelope rejects a mismatched pack_version with a path-tagged error', () => {
  const envelope = sampleEnvelope();
  envelope.meta = { ...envelope.meta, pack_version: 2 };
  assert.throws(() => validatePublicFieldPackEnvelope(envelope), (error) => {
    assert.ok(error instanceof ScoutMobileContractError);
    assert.match(error.message, /envelope\.meta\.pack_version/);
    return true;
  });
});

test('validatePublicFieldPackEnvelope rejects a Dad snapshot missing preview flag', () => {
  const envelope = sampleEnvelope();
  // @ts-expect-error — deliberately invalid for the test
  envelope.data.dad.latest_fix.is_preview = 'no';
  assert.throws(() => validatePublicFieldPackEnvelope(envelope), (error) => {
    assert.ok(error instanceof ScoutMobileContractError);
    assert.match(error.message, /envelope\.data\.dad\.latest_fix\.is_preview/);
    return true;
  });
});

test('validatePublicFieldPackEnvelope rejects a trail-ahead service with an unknown kind', () => {
  const envelope = sampleEnvelope();
  // @ts-expect-error — deliberately invalid for the test
  envelope.data.trail_ahead.upcoming_services[0].kind = 'hostel';
  assert.throws(() => validatePublicFieldPackEnvelope(envelope), (error) => {
    assert.ok(error instanceof ScoutMobileContractError);
    assert.match(error.message, /upcoming_services\[0\]\.kind/);
    return true;
  });
});

test('validatePublicFieldPackEnvelope rejects a weather forecast with a non-NWS source', () => {
  const envelope = sampleEnvelope();
  const region = envelope.data.weather_cache.regions[0];
  // @ts-expect-error — deliberately invalid for the test
  region.forecast.source = 'farout';
  assert.throws(() => validatePublicFieldPackEnvelope(envelope), (error) => {
    assert.ok(error instanceof ScoutMobileContractError);
    assert.match(error.message, /weather_cache\.regions\[0\]\.forecast\.source/);
    return true;
  });
});

test('validatePublicFieldPackEnvelope rejects a missing AT reference policy disclosure', () => {
  const envelope = sampleEnvelope();
  // @ts-expect-error — deliberately invalid for the test
  delete envelope.data.at_reference_summary.policies.water_disclosure;
  assert.throws(() => validatePublicFieldPackEnvelope(envelope), (error) => {
    assert.ok(error instanceof ScoutMobileContractError);
    assert.match(error.message, /at_reference_summary\.policies\.water_disclosure/);
    return true;
  });
});
