import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

const rulesByStatePath = path.join(packRoot, 'processed', 'camping_rules', 'rules_by_state.json');
const outDir = path.join(packRoot, 'rag_docs', 'state_guides');

const states = [
  ['GA', 'Georgia'],
  ['NC', 'North Carolina'],
  ['TN', 'Tennessee'],
  ['VA', 'Virginia'],
  ['WV', 'West Virginia'],
  ['MD', 'Maryland'],
  ['PA', 'Pennsylvania'],
  ['NJ', 'New Jersey'],
  ['NY', 'New York'],
  ['CT', 'Connecticut'],
  ['MA', 'Massachusetts'],
  ['VT', 'Vermont'],
  ['NH', 'New Hampshire'],
  ['ME', 'Maine'],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function uniqueSources(rules) {
  const byUrl = new Map();
  for (const rule of rules) {
    if (!rule.source_url) continue;
    byUrl.set(rule.source_url, rule);
  }
  return [...byUrl.values()].sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));
}

function docForState(code, name, rules) {
  const ruleLines = rules.length
    ? rules
        .map(
          (rule) =>
            `- ${rule.jurisdiction}: ${rule.camping_policy}; permit=${rule.permit_required}; fee=${rule.fee_required}. Source: ${rule.source_url} (license ${rule.license_status}, confidence ${rule.confidence}, last checked ${rule.last_checked}).`,
        )
        .join('\n')
    : '- No state-specific official-source camping rule has been processed yet. Verify current rules with the land manager before relying on Scout.';

  const sourceLines = uniqueSources(rules)
    .map((rule) => `- ${rule.jurisdiction}: ${rule.source_url}`)
    .join('\n');

  return `# ${name} AT State Guide

This is a generated Scout RAG guide for ${name}. It summarizes only sources already processed into the open reference pack. It is not a guidebook and not an official land-manager publication.

## Official-source rules in this pack

${ruleLines}

## Scout answer policy

- Generated miles are based on Scout's open route geometry, not an official ATC mile.
- OSM shelters, campsites, privies, vistas, parking, trailheads, road crossings, side trails, towns, and resupply records are mapped candidates only.
- Water from this pack has reliability unknown and potability unknown unless a recent licensed source, user report, or official managed-drinking-water record says otherwise.
- Weather, closures, fire/smoke, flooding, bear activity, permit changes, and other current conditions require live checks when online.
- If live retrieval fails, Scout must say live retrieval failed and show the last-checked timestamp available in this pack.
- If a rule is uncertain, Scout must tell hikers to verify current rules with the land manager before itinerary commitment.

## Sources

${sourceLines || '- No processed state-specific source URL yet.'}
`;
}

function main() {
  if (!fs.existsSync(rulesByStatePath)) throw new Error(`Missing rules file: ${rulesByStatePath}`);
  const rules = readJson(rulesByStatePath);
  fs.mkdirSync(outDir, { recursive: true });

  for (const entry of fs.readdirSync(outDir)) {
    if (entry !== 'README.md' && entry.endsWith('.md')) fs.unlinkSync(path.join(outDir, entry));
  }

  for (const [code, name] of states) {
    const stateRules = rules.filter((rule) => rule.state === code);
    fs.writeFileSync(path.join(outDir, `${code}.md`), docForState(code, name, stateRules), 'utf8');
  }

  console.log(`Built ${states.length} state RAG guides`);
}

main();
