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

  if (legacyIssues.length > 0 || constantIssues.length > 0) {
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

    process.exit(1);
  }

  console.log(`Mileage check passed. Total miles = ${totalMiles}.`);
}

main();
