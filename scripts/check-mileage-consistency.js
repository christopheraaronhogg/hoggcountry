#!/usr/bin/env node
/**
 * Mileage Consistency Check
 *
 * Ensures trail total mileage references stay aligned with trail-facts.yaml.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const FACTS_FILE = path.join(ROOT, 'src/data/trail-facts.yaml');
const WEB_MILEPOSTS_FILE = path.join(ROOT, 'public/at-mileposts.json');
const MOBILE_GEOMETRY_FILE = path.join(ROOT, 'mobile/static/trail/elevation-100m.json');
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.astro', '.svelte', '.md', '.mdx']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.astro', 'public', 'coverage']);

const LEGACY_TOTAL_PATTERN = /2,?197\.9|2197\.9/g;

function loadFacts() {
  if (!fs.existsSync(FACTS_FILE)) {
    throw new Error(`Facts file not found: ${FACTS_FILE}`);
  }

  const content = fs.readFileSync(FACTS_FILE, 'utf-8');
  return yaml.load(content);
}

function walkFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkFiles(path.join(dir, entry.name), results);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;

    results.push(path.join(dir, entry.name));
  }

  return results;
}

function findLegacyTotals(files) {
  const issues = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;

    while ((match = LEGACY_TOTAL_PATTERN.exec(content)) !== null) {
      const before = content.slice(0, match.index);
      const line = before.split('\n').length;
      issues.push({ file, line, value: match[0] });
    }
  }

  return issues;
}

function checkConstants(totalMiles) {
  const checks = [
    {
      file: path.join(ROOT, 'src/data/trailFacts.ts'),
      name: 'trailFacts.ts TRAIL_TOTAL_MILES',
      pattern: /TRAIL_TOTAL_MILES\s*=\s*([0-9.]+)/,
    },
    {
      file: path.join(ROOT, 'src/lib/hikerStats.ts'),
      name: 'hikerStats.ts TRAIL_TOTAL_MILES',
      pattern: /TRAIL_TOTAL_MILES\s*=\s*([0-9.]+)/,
    },
    {
      file: path.join(ROOT, 'trailhogg/trailhogg/shared/src/trailConstants.ts'),
      name: 'trailConstants.ts TRAIL_TOTAL_MILES',
      pattern: /TRAIL_TOTAL_MILES\s*=\s*([0-9.]+)/,
    },
  ];

  const issues = [];

  for (const check of checks) {
    if (!fs.existsSync(check.file)) {
      issues.push(`${check.name} missing (${check.file})`);
      continue;
    }

    const content = fs.readFileSync(check.file, 'utf-8');
    const match = content.match(check.pattern);

    if (!match) {
      issues.push(`${check.name} not found in ${check.file}`);
      continue;
    }

    const value = Number(match[1]);
    if (Number.isNaN(value) || value !== totalMiles) {
      issues.push(`${check.name} is ${match[1]} (expected ${totalMiles})`);
    }
  }

  return issues;
}

function snapToMobileGeometry(mobileGeometry, lat, lon) {
  const toRad = Math.PI / 180;
  const latRad = lat * toRad;
  let best = mobileGeometry[0];
  let bestDist = Infinity;
  for (const p of mobileGeometry) {
    const dx = (p.lon - lon) * toRad * Math.cos(latRad);
    const dy = (p.lat - lat) * toRad;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return {
    mile: best.m,
    distanceMiles: Math.sqrt(bestDist) * 3958.8
  };
}

function checkMobileWebAlignment(totalMiles) {
  const issues = [];
  if (!fs.existsSync(WEB_MILEPOSTS_FILE)) {
    return { issues: [`missing web mileposts (${WEB_MILEPOSTS_FILE})`], stats: null };
  }
  if (!fs.existsSync(MOBILE_GEOMETRY_FILE)) {
    return { issues: [`missing mobile trail geometry (${MOBILE_GEOMETRY_FILE})`], stats: null };
  }

  const webMileposts = JSON.parse(fs.readFileSync(WEB_MILEPOSTS_FILE, 'utf8')).mileposts;
  const mobileGeometry = JSON.parse(fs.readFileSync(MOBILE_GEOMETRY_FILE, 'utf8'));
  if (!Array.isArray(webMileposts) || webMileposts.length < 2000) {
    issues.push(`web mileposts unexpectedly small (${WEB_MILEPOSTS_FILE})`);
  }
  if (!Array.isArray(mobileGeometry) || mobileGeometry.length < 30_000) {
    issues.push(`mobile geometry should keep dense 100m samples (${MOBILE_GEOMETRY_FILE})`);
  }
  if (issues.length) return { issues, stats: null };

  if (mobileGeometry[0].m !== 0 || mobileGeometry[mobileGeometry.length - 1].m !== totalMiles) {
    issues.push(
      `mobile geometry is in the wrong mile frame: ${mobileGeometry[0].m}-${mobileGeometry[mobileGeometry.length - 1].m} (expected 0-${totalMiles})`
    );
  }
  for (let i = 1; i < mobileGeometry.length; i += 1) {
    if (mobileGeometry[i].m < mobileGeometry[i - 1].m) {
      issues.push(`mobile geometry mile went backwards at index ${i}`);
      break;
    }
  }

  let worstMileError = { mile: 0, error: 0, snapped: 0 };
  let worstDistance = { mile: 0, distanceMiles: 0 };
  for (const post of webMileposts) {
    const snapped = snapToMobileGeometry(mobileGeometry, post.lat, post.lon);
    const error = snapped.mile - post.mile;
    if (Math.abs(error) > Math.abs(worstMileError.error)) {
      worstMileError = { mile: post.mile, error, snapped: snapped.mile };
    }
    if (snapped.distanceMiles > worstDistance.distanceMiles) {
      worstDistance = { mile: post.mile, distanceMiles: snapped.distanceMiles };
    }
  }

  if (Math.abs(worstMileError.error) > 0.1) {
    issues.push(
      `mobile/web mile frame drift: web mile ${worstMileError.mile} snaps to mobile mile ${worstMileError.snapped} (${worstMileError.error.toFixed(3)} mi)`
    );
  }
  if (worstDistance.distanceMiles > 0.075) {
    issues.push(
      `mobile/web route geometry drift: web mile ${worstDistance.mile} is ${worstDistance.distanceMiles.toFixed(3)} mi from mobile geometry`
    );
  }

  return {
    issues,
    stats: {
      maxMileError: Math.abs(worstMileError.error),
      maxRouteDistance: worstDistance.distanceMiles
    }
  };
}

function main() {
  const facts = loadFacts();
  const totalMiles = facts?.trail?.total_miles?.value;

  if (typeof totalMiles !== 'number') {
    console.error('Trail total miles missing or invalid in trail-facts.yaml');
    process.exit(1);
  }

  const files = [
    ...walkFiles(path.join(ROOT, 'src')),
    ...walkFiles(path.join(ROOT, 'trailhogg')),
    path.join(ROOT, 'MASTER_NOBO_FIELD_GUIDE.md'),
  ].filter((file) => fs.existsSync(file));

  const legacyIssues = findLegacyTotals(files);
  const constantIssues = checkConstants(totalMiles);
  const alignment = checkMobileWebAlignment(totalMiles);

  if (legacyIssues.length > 0 || constantIssues.length > 0 || alignment.issues.length > 0) {
    console.error('Mileage consistency check failed.');

    if (legacyIssues.length > 0) {
      console.error('\nLegacy total references (2197.9) found:');
      for (const issue of legacyIssues) {
        console.error(`- ${issue.file}:${issue.line} (${issue.value})`);
      }
    }

    if (constantIssues.length > 0) {
      console.error('\nTotal mileage constants out of sync:');
      for (const issue of constantIssues) {
        console.error(`- ${issue}`);
      }
    }

    if (alignment.issues.length > 0) {
      console.error('\nMobile/web mileage alignment issues:');
      for (const issue of alignment.issues) {
        console.error(`- ${issue}`);
      }
    }

    process.exit(1);
  }

  const alignmentText = alignment.stats
    ? ` Mobile/web max drift = ${alignment.stats.maxMileError.toFixed(3)} mi; route delta = ${alignment.stats.maxRouteDistance.toFixed(3)} mi.`
    : '';
  console.log(`Mileage check passed. Total miles = ${totalMiles}.${alignmentText}`);
}

main();
