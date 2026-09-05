import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GUIDE_START_MILE = 1850;
const TERMINUS_MILE = 2197.9;
const SOURCE_CHECKED_AT = '2026-07-30';

const PATHS = {
  route: path.join(ROOT, 'mobile/static/trail/route-snap-20m.json'),
  elevation: path.join(ROOT, 'mobile/static/trail/elevation-100m.json'),
  rockiness: path.join(
    ROOT,
    'data/at-open-reference/full_trail_rc1/processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json'
  ),
  calibration: path.join(ROOT, 'src/data/at-mile-calibration.json'),
  output: path.join(ROOT, 'apps/openclaw-web/src/lib/data/northern-mountains-guide.json'),
  candidateOutput: path.join(ROOT, 'apps/openclaw-web/src/lib/data/northern-mountains-guide-b.json')
};

// Curated named peaks that the AT crosses or closely skirts from mile 1850
// north. Names, coordinates, and elevations are an OSM snapshot; miles are
// deliberately absent and are re-derived from Hoggcountry's calibrated 20 m
// trail geometry every time this script runs.
const PEAKS = [
  { name: 'Mount Webster', osmId: 357731004, lat: 44.1947717, lon: -71.3881649, elevationM: 1162 },
  { name: 'Mount Jackson', osmId: 357730193, lat: 44.2031805, lon: -71.3754594, elevationM: 1235 },
  { name: 'Mount Pierce', osmId: 357730582, lat: 44.2268471, lon: -71.3657149, elevationM: 1308 },
  { name: 'Mount Eisenhower', osmId: 357729959, lat: 44.2406884, lon: -71.3504035, elevationM: 1449 },
  { name: 'Mount Franklin', osmId: 4951755915, lat: 44.2494222, lon: -71.3307696, elevationM: 1516 },
  { name: 'Mount Monroe', osmId: 357730406, lat: 44.2550584, lon: -71.3214955, elevationM: 1617 },
  { name: 'Mount Washington', osmId: 2432687944, lat: 44.2704946, lon: -71.3033045, elevationM: 1917 },
  { name: 'Mount Clay', osmId: 357729820, lat: 44.2858946, lon: -71.3158013, elevationM: 1684 },
  { name: 'Mount Jefferson', osmId: 357730203, lat: 44.3042322, lon: -71.3167502, elevationM: 1725 },
  { name: 'Mount Madison', osmId: 357730333, lat: 44.3287945, lon: -71.2766663, elevationM: 1636 },
  {
    name: 'Wildcat Ridge',
    sourceName: 'Wildcat Mountain',
    osmId: 357731054,
    lat: 44.2592019,
    lon: -71.2016104,
    elevationM: 1340,
    crosses: ['Wildcat E', 'Wildcat D', 'Wildcat C', 'Wildcat B', 'Wildcat A']
  },
  { name: 'Carter Dome', osmId: 357729779, lat: 44.267398, lon: -71.1791213, elevationM: 1471 },
  { name: 'Mount Hight', osmId: 357730126, lat: 44.2757927, lon: -71.1702431, elevationM: 1415 },
  { name: 'South Carter Mountain', osmId: 357730765, lat: 44.2898743, lon: -71.1764248, elevationM: 1344 },
  { name: 'Middle Carter Mountain', osmId: 357730372, lat: 44.3030843, lon: -71.1677083, elevationM: 1384 },
  { name: 'North Carter Mountain', osmId: 357730457, lat: 44.3132725, lon: -71.164958, elevationM: 1359 },
  { name: 'Mount Moriah', osmId: 357730423, lat: 44.3405251, lon: -71.1317151, elevationM: 1234 },
  { name: 'Cascade Mountain', osmId: 357729782, lat: 44.4339263, lon: -71.1508439, elevationM: 794 },
  { name: 'Mount Success', osmId: 357730837, lat: 44.471448, lon: -71.038965, elevationM: 1086 },
  { name: 'Mount Carlo', osmId: 358226719, lat: 44.4891094, lon: -71.0082026, elevationM: 1086 },
  { name: 'Goose Eye Mountain', osmId: 358220041, lat: 44.5027286, lon: -70.9994111, elevationM: 1132 },
  { name: 'Mahoosuc Arm', osmId: 358221800, lat: 44.5606282, lon: -70.978077, elevationM: 1128 },
  { name: 'Old Speck Mountain', osmId: 358222613, lat: 44.5708812, lon: -70.9536182, elevationM: 1263 },
  {
    name: 'Baldpate Mountain - West and East Peaks',
    sourceName: 'East Peak',
    osmId: 358219340,
    lat: 44.6089807,
    lon: -70.892091,
    elevationM: 1141,
    crosses: ['West Peak', 'East Peak', 'Little Baldpate Mountain']
  },
  { name: 'Wyman Mountain', osmId: 358225904, lat: 44.6892244, lon: -70.8372944, elevationM: 891 },
  { name: 'Moody Mountain', osmId: 358222133, lat: 44.7152472, lon: -70.8051121, elevationM: 727 },
  { name: 'Old Blue Mountain', osmId: 358222591, lat: 44.7470505, lon: -70.7655047, elevationM: 1091 },
  { name: 'Bemis Mountain', osmId: 358211700, lat: 44.7945013, lon: -70.7681259, elevationM: 1085 },
  { name: 'Spruce Mountain', osmId: 358224436, lat: 44.8374999, lon: -70.7069337, elevationM: 735 },
  { name: 'Saddleback Mountain', osmId: 358223661, lat: 44.9364558, lon: -70.5045543, elevationM: 1231 },
  { name: 'The Horn', osmId: 358225013, lat: 44.9510745, lon: -70.4874886, elevationM: 1203 },
  { name: 'Saddleback Junior', osmId: 358223655, lat: 44.9581117, lon: -70.4575676, elevationM: 1108 },
  { name: 'Lone Mountain', osmId: 358221636, lat: 44.9738424, lon: -70.3623765, elevationM: 975 },
  { name: 'Spaulding Mountain', osmId: 358210868, lat: 45.0029169, lon: -70.3337765, elevationM: 1219 },
  { name: 'South Crocker Mountain', osmId: 358227076, lat: 45.0361665, lon: -70.3764565, elevationM: 1228 },
  { name: 'Crocker Mountain', osmId: 358213882, lat: 45.0471462, lon: -70.3828086, elevationM: 1279 },
  {
    name: 'Bigelow Range - The Horns',
    sourceName: 'South Peak',
    osmId: 358225015,
    lat: 45.1450502,
    lon: -70.323041,
    elevationM: 1159,
    crosses: ['South Horn', 'North Horn']
  },
  {
    name: 'Mount Bigelow - West Peak',
    sourceName: 'Mount Bigelow',
    osmId: 358211892,
    lat: 45.1468631,
    lon: -70.2878593,
    elevationM: 1227
  },
  { name: 'Avery Peak', osmId: 358222318, lat: 45.1466665, lon: -70.2753233, elevationM: 1234 },
  { name: 'Little Bigelow Mountain', osmId: 358221466, lat: 45.1389344, lon: -70.2267042, elevationM: 912 },
  { name: 'Pleasant Pond Mountain', osmId: 358223044, lat: 45.2720855, lon: -69.8957212, elevationM: 746 },
  { name: 'Bald Mountain', osmId: 4964181976, lat: 45.2638558, lon: -69.7717998, elevationM: null },
  { name: 'Barren Mountain', osmId: 358211377, lat: 45.4155813, lon: -69.3703942, elevationM: 742 },
  { name: 'Fourth Mountain', osmId: 358219815, lat: 45.4324046, lon: -69.3193871, elevationM: 714 },
  { name: 'Third Mountain', osmId: 358225058, lat: 45.4439016, lon: -69.2972648, elevationM: 610 },
  { name: 'Columbus Mountain', osmId: 358213647, lat: 45.4492844, lon: -69.2685444, elevationM: 707 },
  { name: 'Chairback Mountain', osmId: 358213235, lat: 45.4564462, lon: -69.255958, elevationM: 667.5 },
  { name: 'Gulf Hagas Mountain', osmId: 358220339, lat: 45.5403414, lon: -69.3204097, elevationM: 814 },
  { name: 'White Cap Mountain', osmId: 358225659, lat: 45.5547685, lon: -69.2461602, elevationM: 1109 },
  { name: 'Little Boardman Mountain', osmId: 358221476, lat: 45.6156018, lon: -69.1531029, elevationM: 609 },
  { name: 'Baxter Peak - Katahdin', sourceName: 'Baxter Peak', osmId: 358211478, lat: 45.9043602, lon: -68.9212786, elevationM: 1605 }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function nearestRoutePoint(peak, route) {
  const latitudeMiles = 69.093;
  const longitudeMiles = latitudeMiles * Math.cos((peak.lat * Math.PI) / 180);
  let nearestIndex = 0;
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  for (let index = 0; index < route.m.length; index += 1) {
    if (route.m[index] < GUIDE_START_MILE - 20) continue;
    const y = (route.lat[index] - peak.lat) * latitudeMiles;
    if (Math.abs(y) > 0.5) continue;
    const x = (route.lon[index] - peak.lon) * longitudeMiles;
    const distanceSquared = x * x + y * y;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestIndex = index;
    }
  }

  return {
    mile: route.m[nearestIndex],
    distanceMiles: Math.sqrt(nearestDistanceSquared)
  };
}

function measuredToOfficialConverter(calibration) {
  const pairs = calibration.pairs
    .map(([measured, official]) => [Number(measured), Number(official)])
    .sort((left, right) => left[0] - right[0]);

  return (measured) => {
    let lowerIndex = 0;
    let upperIndex = pairs.length - 1;
    if (measured <= pairs[0][0]) upperIndex = 1;
    else if (measured >= pairs[upperIndex][0]) lowerIndex = upperIndex - 1;
    else {
      while (lowerIndex + 1 < upperIndex) {
        const middle = (lowerIndex + upperIndex) >> 1;
        if (pairs[middle][0] <= measured) lowerIndex = middle;
        else upperIndex = middle;
      }
    }

    const [measuredStart, officialStart] = pairs[lowerIndex];
    const [measuredEnd, officialEnd] = pairs[upperIndex];
    const proportion = measuredEnd > measuredStart
      ? (measured - measuredStart) / (measuredEnd - measuredStart)
      : 0;
    return clamp(officialStart + (officialEnd - officialStart) * proportion, 0, TERMINUS_MILE);
  };
}

function officialRockiness(rows, toOfficial) {
  return rows.map((row) => ({
    startMile: toOfficial(Number(row.start_mile_nobo_global_est)),
    endMile: toOfficial(Number(row.end_mile_nobo_global_est)),
    score: Number(row.rockiness_v2_1_score_0_10)
  }));
}

function elevationWindow(elevation, startMile, endMile) {
  const selected = elevation.filter((point) => point.m >= startMile && point.m <= endMile);
  if (selected.length > 1) return selected;

  const nearest = [...elevation]
    .sort((left, right) => Math.abs(left.m - endMile) - Math.abs(right.m - endMile))
    .slice(0, 2)
    .sort((left, right) => left.m - right.m);
  return nearest;
}

function valleyBefore(elevation, peakMile, previousPeakMile) {
  const searchStart = Math.max(GUIDE_START_MILE, previousPeakMile, peakMile - 8);
  const points = elevationWindow(elevation, searchStart, peakMile);
  return points.reduce((lowest, point) => point.ft < lowest.ft ? point : lowest, points[0]);
}

function valleyAfter(elevation, peakMile, nextPeakMile) {
  const searchEnd = Math.min(TERMINUS_MILE, nextPeakMile, peakMile + 8);
  if (searchEnd - peakMile < 0.02) return null;
  const points = elevationWindow(elevation, peakMile, searchEnd);
  return points.reduce((lowest, point) => point.ft < lowest.ft ? point : lowest, points[0]);
}

function terrainMetrics(points) {
  let gainFt = 0;
  let lossFt = 0;
  let maxGradePercent = 0;
  let maxDescentGradePercent = 0;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const deltaFeet = current.ft - previous.ft;
    if (deltaFeet > 0) gainFt += deltaFeet;
    else lossFt += Math.abs(deltaFeet);

    // The calibrated mile frame clamps the final samples to 2197.9. Ignore
    // those near-zero horizontal intervals for grade so the terminus clamp
    // cannot create a mathematically huge, physically false slope.
    const distanceMiles = current.m - previous.m;
    if (distanceMiles < 0.02) continue;
    const grade = Math.abs(deltaFeet / (distanceMiles * 5280)) * 100;
    maxGradePercent = Math.max(maxGradePercent, grade);
    if (deltaFeet < 0) maxDescentGradePercent = Math.max(maxDescentGradePercent, grade);
  }

  return { gainFt, lossFt, maxGradePercent, maxDescentGradePercent };
}

function rockinessMetrics(rockiness, startMile, endMile) {
  let weightedScore = 0;
  let totalOverlap = 0;
  let maxScore = 0;

  for (const segment of rockiness) {
    const overlap = Math.max(0, Math.min(endMile, segment.endMile) - Math.max(startMile, segment.startMile));
    if (overlap <= 0) continue;
    weightedScore += segment.score * overlap;
    totalOverlap += overlap;
    maxScore = Math.max(maxScore, segment.score);
  }

  const average = totalOverlap > 0 ? weightedScore / totalOverlap : 0;
  return { average, max: maxScore || average };
}

function movementDifficulty({ distanceMiles, gainFt, lossFt, maxGradePercent, rockiness }) {
  const distance = Math.max(0.25, distanceMiles);
  const ascentScore = clamp((gainFt / distance / 350) * 10, 0, 10);
  const descentScore = clamp((lossFt / distance / 700) * 10, 0, 10);
  const gradeScore = clamp((maxGradePercent / 24) * 10, 0, 10);
  const treadScore = clamp(rockiness, 0, 10);
  return clamp(
    (ascentScore * 0.46) +
      (gradeScore * 0.24) +
      (treadScore * 0.2) +
      (descentScore * 0.1),
    0,
    10
  );
}

function difficultyLabel(score) {
  if (score >= 8.5) return 'Severe';
  if (score >= 7) return 'Hard';
  if (score >= 5) return 'Steady';
  return 'Cruise';
}

function rockinessLabel(score) {
  if (score >= 7.5) return 'Very rocky';
  if (score >= 6) return 'Rocky';
  if (score >= 4.5) return 'Rocks and roots';
  return 'Moderate tread';
}

function inclineLabel(maxGradePercent) {
  if (maxGradePercent >= 30) return 'Very steep pitches';
  if (maxGradePercent >= 22) return 'Steep pitches';
  if (maxGradePercent >= 15) return 'Sustained incline';
  return 'Rolling incline';
}

function declineLabel(maxGradePercent) {
  if (maxGradePercent >= 30) return 'Very steep downhill pitches';
  if (maxGradePercent >= 22) return 'Steep downhill pitches';
  if (maxGradePercent >= 15) return 'Sustained downhill';
  return 'Rolling descent';
}

function kneeLoadScore({ distanceMiles, lossFt, maxDescentGradePercent, rockiness }) {
  if (distanceMiles <= 0 || lossFt <= 0) return 0;
  const distance = Math.max(0.25, distanceMiles);
  const lossRateScore = clamp((lossFt / distance / 450) * 10, 0, 10);
  const cumulativeLossScore = clamp((lossFt / 1800) * 10, 0, 10);
  const gradeScore = clamp((maxDescentGradePercent / 24) * 10, 0, 10);
  const treadScore = clamp(rockiness, 0, 10);
  return clamp(
    (lossRateScore * 0.3) +
      (cumulativeLossScore * 0.25) +
      (gradeScore * 0.25) +
      (treadScore * 0.2),
    0,
    10
  );
}

function kneeLoadLabel(score) {
  if (score >= 8.5) return 'Severe knee load';
  if (score >= 7) return 'High knee load';
  if (score >= 5) return 'Moderate knee load';
  return 'Lower knee load';
}

function regionForMile(mile) {
  if (mile < 1900) return { id: 'white-mountains', name: 'White Mountains', state: 'New Hampshire' };
  if (mile < 1936) return { id: 'mahoosucs', name: 'Mahoosucs', state: 'New Hampshire / Maine' };
  if (mile < 2025) return { id: 'western-maine', name: 'Western Maine highlands', state: 'Maine' };
  if (mile < 2160) return { id: 'wilderness', name: '100-Mile Wilderness', state: 'Maine' };
  return { id: 'baxter', name: 'Baxter finish', state: 'Maine' };
}

function trailRelation(distanceMiles) {
  if (distanceMiles <= 0.04) return 'AT crosses the summit or crest';
  if (distanceMiles <= 0.12) return 'AT closely skirts the mapped summit';
  return `Mapped summit is about ${round(distanceMiles, 1)} mi from the AT`;
}

function downsample(points, target = 18) {
  if (points.length <= target) return points.map((point) => ({ mile: round(point.m, 2), elevationFt: Math.round(point.ft) }));
  const sampled = [];
  for (let index = 0; index < target; index += 1) {
    const pointIndex = Math.round((index / (target - 1)) * (points.length - 1));
    const point = points[pointIndex];
    sampled.push({ mile: round(point.m, 2), elevationFt: Math.round(point.ft) });
  }
  return sampled;
}

function buildMountain(peak, snap, index, snappedPeaks, elevation, rockiness) {
  const previousPeakMile = index === 0 ? GUIDE_START_MILE : snappedPeaks[index - 1].snap.mile;
  const valley = valleyBefore(elevation, snap.mile, previousPeakMile);
  const climbPoints = elevationWindow(elevation, valley.m, snap.mile);
  const terrain = terrainMetrics(climbPoints);
  const rocks = rockinessMetrics(rockiness, valley.m, snap.mile);
  const distanceMiles = Math.max(0.1, snap.mile - valley.m);
  const difficulty = movementDifficulty({
    distanceMiles,
    gainFt: terrain.gainFt,
    lossFt: terrain.lossFt,
    maxGradePercent: terrain.maxGradePercent,
    rockiness: rocks.average
  });
  const roundedDifficulty = round(difficulty, 1);
  const region = regionForMile(snap.mile);

  return {
    id: peak.name.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/(^-|-$)/gu, ''),
    name: peak.name,
    regionId: region.id,
    region: region.name,
    state: region.state,
    summitMile: round(snap.mile, 1),
    milesFromGuideStart: round(snap.mile - GUIDE_START_MILE, 1),
    milesToKatahdin: round(TERMINUS_MILE - snap.mile, 1),
    summitElevationFt: peak.elevationM === null ? null : Math.round(peak.elevationM * 3.28084),
    climbStartMile: round(valley.m, 1),
    climbDistanceMiles: round(distanceMiles, 1),
    climbGainFt: Math.round(terrain.gainFt / 10) * 10,
    climbLossFt: Math.round(terrain.lossFt / 10) * 10,
    averageGainFtPerMile: Math.round(terrain.gainFt / distanceMiles / 10) * 10,
    maxGradePercent: round(terrain.maxGradePercent, 1),
    inclineLabel: inclineLabel(terrain.maxGradePercent),
    approachType: terrain.gainFt < 150 ? 'Ridge traverse' : 'NOBO climb',
    rockinessScore: round(rocks.average, 1),
    rockinessMax: round(rocks.max, 1),
    rockinessLabel: rockinessLabel(rocks.average),
    difficultyScore: roundedDifficulty,
    difficultyLabel: difficultyLabel(roundedDifficulty),
    trailRelation: trailRelation(snap.distanceMiles),
    crosses: peak.crosses ?? [],
    profile: downsample(climbPoints),
    source: {
      name: peak.sourceName ?? peak.name,
      osmNodeId: peak.osmId,
      url: `https://www.openstreetmap.org/node/${peak.osmId}`,
      distanceFromTrailMiles: round(snap.distanceMiles, 2)
    }
  };
}

function buildCandidateMountain(mountain, index, snappedPeaks, elevation, rockiness) {
  const summitMile = snappedPeaks[index].snap.mile;
  const nextPeakMile = index === snappedPeaks.length - 1
    ? TERMINUS_MILE
    : snappedPeaks[index + 1].snap.mile;
  const valley = valleyAfter(elevation, summitMile, nextPeakMile);

  if (!valley) {
    return {
      ...mountain,
      upDifficultyScore: mountain.difficultyScore,
      upDifficultyLabel: mountain.difficultyLabel,
      descentEndMile: mountain.summitMile,
      descentDistanceMiles: 0,
      descentLossFt: 0,
      descentGainFt: 0,
      averageLossFtPerMile: 0,
      maxDescentGradePercent: 0,
      declineLabel: 'AT ends at the summit',
      descentType: 'Finish summit',
      descentRockinessScore: 0,
      descentRockinessMax: 0,
      descentRockinessLabel: 'Not screened beyond terminus',
      kneeLoadScore: 0,
      kneeLoadLabel: 'Plan the separate exit descent',
      terrainDemandScore: mountain.difficultyScore,
      terrainDemandLabel: mountain.difficultyLabel,
      descentProfile: [],
      terminusDescentNote: 'The official AT and this calibrated dataset end at Baxter Peak. The required trip back down Katahdin is real, but it is outside this guide and is not scored here.'
    };
  }

  const descentPoints = elevationWindow(elevation, summitMile, valley.m);
  const terrain = terrainMetrics(descentPoints);
  const rocks = rockinessMetrics(rockiness, summitMile, valley.m);
  const distanceMiles = Math.max(0, valley.m - summitMile);
  const kneeLoad = round(kneeLoadScore({
    distanceMiles,
    lossFt: terrain.lossFt,
    maxDescentGradePercent: terrain.maxDescentGradePercent,
    rockiness: rocks.average
  }), 1);
  const terrainDemand = Math.max(mountain.difficultyScore, kneeLoad);
  const descentType = terrain.lossFt >= 1800
    ? 'Major NOBO descent'
    : distanceMiles >= 4
      ? 'Long NOBO descent'
      : terrain.lossFt < 150
        ? 'Ridge dip'
        : 'NOBO descent';

  return {
    ...mountain,
    upDifficultyScore: mountain.difficultyScore,
    upDifficultyLabel: mountain.difficultyLabel,
    descentEndMile: round(valley.m, 1),
    descentDistanceMiles: round(distanceMiles, 1),
    descentLossFt: Math.round(terrain.lossFt / 10) * 10,
    descentGainFt: Math.round(terrain.gainFt / 10) * 10,
    averageLossFtPerMile: distanceMiles > 0
      ? Math.round(terrain.lossFt / distanceMiles / 10) * 10
      : 0,
    maxDescentGradePercent: round(terrain.maxDescentGradePercent, 1),
    declineLabel: declineLabel(terrain.maxDescentGradePercent),
    descentType,
    descentRockinessScore: round(rocks.average, 1),
    descentRockinessMax: round(rocks.max, 1),
    descentRockinessLabel: rockinessLabel(rocks.average),
    kneeLoadScore: kneeLoad,
    kneeLoadLabel: kneeLoadLabel(kneeLoad),
    terrainDemandScore: terrainDemand,
    terrainDemandLabel: difficultyLabel(terrainDemand),
    descentProfile: downsample(descentPoints),
    terminusDescentNote: null
  };
}

function fullRouteSummary(elevation) {
  const points = elevationWindow(elevation, GUIDE_START_MILE, TERMINUS_MILE);
  const terrain = terrainMetrics(points);
  return {
    distanceMiles: round(TERMINUS_MILE - GUIDE_START_MILE, 1),
    gainFt: Math.round(terrain.gainFt / 100) * 100,
    lossFt: Math.round(terrain.lossFt / 100) * 100,
    profile: downsample(points, 180)
  };
}

function main() {
  const route = readJson(PATHS.route);
  const elevation = readJson(PATHS.elevation);
  const calibration = readJson(PATHS.calibration);
  const toOfficial = measuredToOfficialConverter(calibration);
  const rockiness = officialRockiness(readJson(PATHS.rockiness), toOfficial);

  const snappedPeaks = PEAKS
    .map((peak) => ({ peak, snap: nearestRoutePoint(peak, route) }))
    .filter(({ snap }) => snap.mile >= GUIDE_START_MILE && snap.mile <= TERMINUS_MILE)
    .sort((left, right) => left.snap.mile - right.snap.mile);

  const mountains = snappedPeaks.map(({ peak, snap }, index) =>
    buildMountain(peak, snap, index, snappedPeaks, elevation, rockiness)
  );

  const regions = [...new Map(mountains.map((mountain) => [
    mountain.regionId,
    {
      id: mountain.regionId,
      name: mountain.region,
      state: mountain.state,
      startMile: mountain.summitMile,
      endMile: mountain.summitMile,
      mountainCount: 0
    }
  ])).values()];

  for (const region of regions) {
    const matches = mountains.filter((mountain) => mountain.regionId === region.id);
    region.startMile = Math.min(...matches.map((mountain) => mountain.summitMile));
    region.endMile = Math.max(...matches.map((mountain) => mountain.summitMile));
    region.mountainCount = matches.length;
  }

  const hardest = [...mountains]
    .sort((left, right) => right.difficultyScore - left.difficultyScore || left.summitMile - right.summitMile)
    .slice(0, 6)
    .map(({ id, name, summitMile, difficultyScore }) => ({ id, name, summitMile, difficultyScore }));
  const rockiest = [...mountains]
    .sort((left, right) => right.rockinessScore - left.rockinessScore || left.summitMile - right.summitMile)
    .slice(0, 6)
    .map(({ id, name, summitMile, rockinessScore }) => ({ id, name, summitMile, rockinessScore }));
  const candidateMountains = mountains.map((mountain, index) =>
    buildCandidateMountain(mountain, index, snappedPeaks, elevation, rockiness)
  );
  const hardestBalanced = [...candidateMountains]
    .sort((left, right) => right.terrainDemandScore - left.terrainDemandScore || left.summitMile - right.summitMile)
    .slice(0, 6)
    .map(({ id, name, summitMile, terrainDemandScore, upDifficultyScore, kneeLoadScore }) => ({
      id,
      name,
      summitMile,
      terrainDemandScore,
      upDifficultyScore,
      kneeLoadScore
    }));
  const highestKneeLoad = [...candidateMountains]
    .filter((mountain) => mountain.descentDistanceMiles > 0)
    .sort((left, right) => right.kneeLoadScore - left.kneeLoadScore || left.summitMile - right.summitMile)
    .slice(0, 8)
    .map(({ id, name, summitMile, descentEndMile, descentLossFt, kneeLoadScore }) => ({
      id,
      name,
      summitMile,
      descentEndMile,
      descentLossFt,
      kneeLoadScore
    }));

  const output = {
    title: 'Mountains Ahead',
    subtitle: 'Appalachian Trail mile 1,850 to Katahdin',
    direction: 'NOBO',
    guideStartMile: GUIDE_START_MILE,
    terminusMile: TERMINUS_MILE,
    generatedAt: SOURCE_CHECKED_AT,
    methodology: {
      climbDefinition: 'NOBO climb from the lowest calibrated elevation point after the previous listed mountain, capped at an 8-mile lookback.',
      difficultyDefinition: 'Movement-only 1-10 score weighted toward ascent, steep grade, Rockiness V2.1, then descent - the same formula used by the Hoggcountry map.',
      caution: 'Terrain planning screen only. Weather, wet rock, fatigue, pack weight, daylight, closures, and current trail conditions can make any mountain harder.'
    },
    summary: {
      ...fullRouteSummary(elevation),
      mountainCount: mountains.length,
      hardest,
      rockiest
    },
    regions,
    mountains,
    sources: [
      {
        label: 'Hoggcountry anchor-calibrated AT mile frame',
        detail: 'Dense 20 m route-snap geometry generated from src/data/at-mile-anchors.yaml; no mountain mile is hand-entered.',
        url: 'https://hoggcountry.com/at-map'
      },
      {
        label: 'USGS 3D Elevation Program',
        detail: '100 m elevation samples used for climb gain, loss, and grade screens.',
        url: 'https://www.usgs.gov/3d-elevation-program'
      },
      {
        label: 'Scout Rockiness V2.1',
        detail: 'Model screening from open terrain/OSM signals; not field verified.',
        url: 'https://hoggcountry.com/at-map'
      },
      {
        label: 'OpenStreetMap contributors',
        detail: 'Named peak coordinates and open AT route context, ODbL.',
        url: 'https://www.openstreetmap.org/relation/156553'
      }
    ]
  };

  const candidateOutput = {
    ...output,
    title: 'Mountains Ahead',
    subtitle: 'Knee-aware climb and descent field reference',
    version: 'up-down',
    methodology: {
      climbDefinition: output.methodology.climbDefinition,
      descentDefinition: 'NOBO descent from each listed summit to the lowest calibrated elevation point before the next listed mountain, capped at an 8-mile lookahead.',
      kneeLoadDefinition: 'The 1-10 knee-load screen combines downhill feet per mile (30%), cumulative loss (25%), steepest descending grade (25%), and descent rockiness (20%).',
      difficultyDefinition: 'Overall terrain demand is the higher of the existing climb difficulty and the knee-load screen, so a consequential descent is never averaged away.',
      caution: 'Terrain planning screen only, not medical guidance. Weather, wet rock, fatigue, pack weight, poles, pace, daylight, closures, and current trail conditions can materially change downhill strain.'
    },
    summary: {
      ...output.summary,
      hardestBalanced,
      highestKneeLoad
    },
    mountains: candidateMountains
  };

  fs.mkdirSync(path.dirname(PATHS.output), { recursive: true });
  fs.writeFileSync(PATHS.output, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  fs.writeFileSync(PATHS.candidateOutput, `${JSON.stringify(candidateOutput, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, PATHS.output)} with ${mountains.length} mountains.`);
  console.log(`Wrote ${path.relative(ROOT, PATHS.candidateOutput)} with knee-aware descents.`);
}

main();
