#!/usr/bin/env node
/**
 * Parse Master Guide Script (Dynamic Version with Fact Injection)
 *
 * Reads MASTER_NOBO_FIELD_GUIDE.md and splits it into individual chapter files
 * for the Astro content collection. Also injects facts from trail-facts.yaml.
 *
 * TEMPLATE SYNTAX (in master guide):
 * - {{trail.total_miles}}           → raw value (2197.4)
 * - {{trail.total_miles|commas}}    → with commas (2,197.4)
 * - {{trail.total_miles|round}}     → rounded (2197)
 * - {{trail.total_miles|display}}   → uses .display if available
 * - {{trail.total_miles|marketing}} → uses .marketing if available
 * - {{landmarks.blood_mountain.elevation}} → nested access (4458)
 * - {{factbox:landmarks.blood_mountain}}   → generates fact card
 * - {{table:towns.GA}}                     → generates town table
 *
 * Usage: node scripts/parse-master-guide.js
 *        npm run update-guide
 *
 * Quick reference cards in src/content/guide/quick/ are preserved.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_FILE = path.join(ROOT, 'MASTER_NOBO_FIELD_GUIDE.md');
const GUIDE_DIR = path.join(ROOT, 'src/content/guide');
const FACTS_FILE = path.join(ROOT, 'src/data/trail-facts.yaml');

// Icon mapping based on common keywords in titles
const ICON_MAP = {
  'introduction': 'compass',
  'profile': 'user',
  'experience': 'user',
  'gear': 'backpack',
  'clothing': 'shirt',
  'water': 'droplet',
  'shelter': 'home',
  'tent': 'home',
  'weather': 'cloud',
  'food': 'utensils',
  'resupply': 'utensils',
  'town': 'building',
  'resource': 'map',
  'navigation': 'map',
  'permit': 'clipboard',
  'logistics': 'clipboard',
  'mail': 'mail',
  'drop': 'mail',
  'power': 'battery',
  'electronic': 'battery',
  'medical': 'heart',
  'health': 'heart',
  'safety': 'alert',
  'emergency': 'alert',
  'section': 'flag',
  'milestone': 'flag',
  'content': 'camera',
  'creation': 'camera',
  'video': 'camera',
  'financial': 'dollar',
  'budget': 'dollar',
  'money': 'dollar',
  'katahdin': 'mountain',
  'conclusion': 'mountain',
  'final': 'mountain',
  'truth': 'mountain',
};

// =============================================================================
// FACT INJECTION SYSTEM
// =============================================================================

let _facts = null;

/**
 * Load facts from YAML file
 */
function loadFacts() {
  if (_facts) return _facts;

  if (!fs.existsSync(FACTS_FILE)) {
    console.warn(`⚠️  Facts file not found: ${FACTS_FILE}`);
    console.warn('   Template variables will not be replaced.');
    return null;
  }

  const yamlContent = fs.readFileSync(FACTS_FILE, 'utf-8');
  _facts = yaml.load(yamlContent);
  return _facts;
}

/**
 * Get a value from facts by dot-notation path
 */
function getFactByPath(path) {
  const facts = loadFacts();
  if (!facts) return undefined;

  const parts = path.split('.');
  let current = facts;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[part];
  }

  // Auto-extract .value from FactValue objects
  if (current && typeof current === 'object' && 'value' in current) {
    return current;
  }

  return current;
}

/**
 * Format a number with the specified format
 */
function formatNumber(value, format) {
  if (typeof value !== 'number') return String(value);

  switch (format) {
    case 'commas':
      return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
    case 'round':
      return Math.round(value).toString();
    case 'raw':
    default:
      return value.toString();
  }
}

/**
 * Format a fact value
 */
function formatFact(factOrValue, format = 'raw') {
  // Handle FactValue objects
  if (factOrValue && typeof factOrValue === 'object' && 'value' in factOrValue) {
    const factValue = factOrValue;

    switch (format) {
      case 'display':
        return factValue.display ?? formatNumber(factValue.value, 'commas');
      case 'marketing':
        return factValue.marketing ?? formatNumber(factValue.value, 'commas');
      case 'commas':
        return formatNumber(factValue.value, 'commas');
      case 'round':
        return formatNumber(factValue.value, 'round');
      case 'raw':
      default:
        return String(factValue.value);
    }
  }

  // Handle raw values
  if (typeof factOrValue === 'number') {
    return formatNumber(factOrValue, format === 'raw' ? 'raw' : format);
  }

  return String(factOrValue ?? '');
}

/**
 * Generate a fact box for a landmark
 */
function generateFactBox(landmarkId) {
  const facts = loadFacts();
  if (!facts) return `<!-- Facts not loaded -->`;

  const landmark = facts.landmarks?.[landmarkId];
  if (!landmark) return `<!-- Landmark not found: ${landmarkId} -->`;

  const lines = [
    '',
    `> **📍 ${landmark.name}**`,
    `> Mile ${landmark.mile.toLocaleString('en-US', { maximumFractionDigits: 1 })} | Elevation ${landmark.elevation.toLocaleString('en-US')} ft | ${landmark.state}`,
  ];

  if (landmark.significance) {
    lines.push(`> *${landmark.significance}*`);
  }

  if (landmark.note) {
    lines.push(`> ${landmark.note}`);
  }

  lines.push(`> <small>Source: ${landmark.citation.source} ${landmark.citation.year}</small>`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a town table for a state
 */
function generateTownTable(stateId) {
  const facts = loadFacts();
  if (!facts) return `<!-- Facts not loaded -->`;

  const upper = stateId.toUpperCase();
  const towns = Object.values(facts.towns || {}).filter(t =>
    t.state.toUpperCase() === upper
  );

  if (towns.length === 0) return `<!-- No towns found for state: ${stateId} -->`;

  // Sort by mile
  towns.sort((a, b) => a.mile - b.mile);

  const headers = ['Town', 'Mile', 'From Trail', 'Grocery', 'Outfitter', 'Hostel', 'PO'];
  const rows = towns.map(t => [
    t.name,
    t.mile.toString(),
    t.distance_from_trail === 0 ? 'On trail' : `${t.distance_from_trail} mi`,
    t.services.grocery ? '✓' : '—',
    t.services.outfitter ? '✓' : '—',
    t.services.hostel ? '✓' : '—',
    t.services.post_office ? '✓' : '—',
  ]);

  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(r => `| ${r.join(' | ')} |`).join('\n');

  return `\n${headerRow}\n${separatorRow}\n${dataRows}\n`;
}

/**
 * Process all template syntax in content
 */
function processTemplates(content) {
  const facts = loadFacts();
  if (!facts) return content;

  let processed = content;
  let replacementCount = 0;

  // Process fact boxes: {{factbox:landmarks.blood_mountain}}
  processed = processed.replace(/\{\{factbox:([^}]+)\}\}/g, (match, expr) => {
    const [type, id] = expr.trim().split('.');
    if (type === 'landmarks') {
      replacementCount++;
      return generateFactBox(id);
    }
    return match;
  });

  // Process tables: {{table:towns.GA}}
  processed = processed.replace(/\{\{table:towns\.([^}]+)\}\}/g, (match, stateId) => {
    replacementCount++;
    return generateTownTable(stateId.trim());
  });

  // Process simple values: {{path.to.fact}} or {{path.to.fact|format}}
  processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
    // Skip if already processed (factbox/table)
    if (expr.startsWith('factbox:') || expr.startsWith('table:')) {
      return match;
    }

    const [path, format] = expr.trim().split('|');
    const fact = getFactByPath(path.trim());

    if (fact === undefined) {
      console.warn(`⚠️  Template variable not found: ${path.trim()}`);
      return match; // Keep original if not found
    }

    replacementCount++;
    return formatFact(fact, format?.trim() || 'raw');
  });

  if (replacementCount > 0) {
    console.log(`   📝 Replaced ${replacementCount} template variables`);
  }

  return processed;
}

// =============================================================================
// ROMAN NUMERALS & UTILITIES
// =============================================================================

/**
 * Convert Roman numerals to Arabic numbers
 */
export function romanToArabic(roman) {
  if (!roman) return 0;

  const romanMap = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
  };

  let result = 0;
  const chars = roman.toUpperCase().split('');

  for (let i = 0; i < chars.length; i++) {
    const current = romanMap[chars[i]] || 0;
    const next = romanMap[chars[i + 1]] || 0;

    if (current < next) {
      result -= current;
    } else {
      result += current;
    }
  }

  return result;
}

/**
 * Convert a title to a URL-friendly slug
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Convert a string to Title Case
 */
export function titleCase(str) {
  if (!str) return '';

  // Words that should stay lowercase (unless first word)
  const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'vs'];

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Get an icon based on the title keywords
 */
export function getIconForTitle(title) {
  const lowerTitle = title.toLowerCase();

  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (lowerTitle.includes(keyword)) {
      return icon;
    }
  }

  return 'book'; // Default icon
}

/**
 * Generate a description from the title
 */
export function generateDescription(title, partNumber) {
  // Simple description generation based on title
  if (partNumber === 0) {
    return 'The philosophy behind this guide and how to use it';
  }

  if (partNumber === 999) {
    return 'Final trail truths and the path forward';
  }

  // Generic description from title
  return `${title} for Appalachian Trail thru-hiking`;
}

/**
 * Extract the first meaningful paragraph as description
 */
export function extractDescription(content, maxLength = 120) {
  // Remove the title heading
  const withoutTitle = content.replace(/^#[^#].*$/m, '').trim();

  // Find first paragraph (non-heading, non-empty line)
  const lines = withoutTitle.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, headings, horizontal rules, blockquotes
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') ||
        trimmed.startsWith('>') || trimmed.startsWith('|') || trimmed.startsWith('-')) {
      continue;
    }
    // Skip lines that are just bold text (like subtitles)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      continue;
    }
    // Skip lines that are just italic
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.includes('**')) {
      continue;
    }

    // Found a paragraph - clean and truncate
    let desc = trimmed
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove markdown links

    if (desc.length > maxLength) {
      desc = desc.substring(0, maxLength - 3) + '...';
    }

    return desc;
  }

  return null;
}

/**
 * Parse the master document into sections (DYNAMIC VERSION)
 */
export function parseMasterDocument(content) {
  const sections = [];

  // Pattern to match PART headers: # PART I: TITLE or # CONCLUSION: TITLE
  const partRegex = /^# (PART\s+([IVXLCDM]+)|CONCLUSION):\s*(.*)$/gm;

  let markers = [];
  let match;

  while ((match = partRegex.exec(content)) !== null) {
    markers.push({
      index: match.index,
      fullMatch: match[0],
      type: match[1].startsWith('PART') ? 'part' : 'conclusion',
      romanNumeral: match[2] || null,  // Roman numeral for parts
      title: match[3].trim(),          // Title after the colon
    });
  }

  // Sort markers by position (should already be sorted, but be safe)
  markers.sort((a, b) => a.index - b.index);

  // Extract introduction (everything before first marker)
  if (markers.length > 0) {
    const introContent = content.substring(0, markers[0].index).trim();
    if (introContent) {
      sections.push({
        type: 'introduction',
        partNumber: 0,
        order: 0,
        title: 'Introduction',
        rawTitle: 'Introduction',
        content: cleanIntroContent(introContent),
      });
    }
  }

  // Extract each PART and CONCLUSION section
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const nextMarker = markers[i + 1];

    const startIndex = marker.index;
    const endIndex = nextMarker ? nextMarker.index : content.length;
    const sectionContent = content.substring(startIndex, endIndex).trim();

    if (marker.type === 'conclusion') {
      sections.push({
        type: 'conclusion',
        partNumber: 999,
        order: 999,
        title: titleCase(marker.title),
        rawTitle: marker.title,
        content: cleanPartContent(sectionContent, titleCase(marker.title)),
      });
    } else {
      const partNumber = romanToArabic(marker.romanNumeral);
      sections.push({
        type: 'part',
        partNumber,
        order: partNumber,
        title: titleCase(marker.title),
        rawTitle: marker.title,
        content: cleanPartContent(sectionContent, titleCase(marker.title)),
      });
    }
  }

  // Sort by order
  sections.sort((a, b) => a.order - b.order);

  // Reassign order numbers sequentially for proper file naming
  let orderIndex = 0;
  for (const section of sections) {
    section.fileOrder = orderIndex;
    orderIndex++;
  }

  return sections;
}

/**
 * Clean introduction content
 */
function cleanIntroContent(content) {
  // Load facts for template replacement in intro
  const facts = loadFacts();
  const totalMiles = facts?.trail?.total_miles?.display || '2,197.4';
  const totalMilesRaw = facts?.trail?.total_miles?.value || 2197.4;

  // Remove the document header block
  let cleaned = content
    .replace(/^# THE COMPLETE APPALACHIAN TRAIL NOBO FIELD GUIDE\s*/mi, '')
    .replace(/^\*\*Springer Mountain.*?\*\*\s*/m, '')
    .replace(/^\*2,197\.\d+ Miles.*?\*\s*/m, '')
    .replace(/^\*February Start Edition\*\s*/m, '')
    .replace(/^---\s*/gm, '')
    .replace(/^\*\*Prepared by:\*\*.*\s*/m, '')
    .replace(/^\*\*A Comprehensive.*?\*\*\s*/m, '')
    .replace(/^\*Based on.*?\*\s*/m, '')
    .trim();

  // Remove the TABLE OF CONTENTS section (from ## TABLE OF CONTENTS to the next --- or # heading)
  // This prevents duplicate TOC since the site has its own navigation
  cleaned = cleaned.replace(
    /## TABLE OF CONTENTS[\s\S]*?(?=---\s*\n\s*#|# The Philosophy)/i,
    ''
  );

  // Convert "## Introduction: ..." to proper structure
  cleaned = cleaned.replace(
    /^## Introduction:\s*(.*)$/mi,
    (match, subtitle) => {
      return `# The Complete Appalachian Trail NOBO Field Guide

**Springer Mountain, Georgia to Mount Katahdin, Maine**
*${totalMiles} Miles of Trail-Tested Knowledge*
*February Start Edition*

---

**Prepared by:** HoggCountry
*Based on 840+ Miles of Thru-Hiking Experience*

---

## ${subtitle}`;
    }
  );

  // Replace hardcoded trail length with dynamic value
  cleaned = cleaned.replace(/2,?197\.9/g, totalMiles);
  cleaned = cleaned.replace(/2197\.9/g, String(totalMilesRaw));

  return cleaned;
}

/**
 * Clean PART/CONCLUSION content - replace the PART header with a clean title
 */
function cleanPartContent(content, title) {
  // Replace the PART X: TITLE or CONCLUSION: TITLE header with just # Title
  let cleaned = content.replace(
    /^# (PART\s+[IVXLCDM]+|CONCLUSION):\s*.*$/mi,
    `# ${title}`
  );

  // Load facts for template replacement
  const facts = loadFacts();
  if (facts) {
    const totalMiles = facts.trail?.total_miles?.display || '2,197.4';
    const totalMilesRaw = facts.trail?.total_miles?.value || 2197.4;

    // Replace hardcoded trail length with dynamic value
    cleaned = cleaned.replace(/2,?197\.9/g, totalMiles);
    cleaned = cleaned.replace(/2197\.9/g, String(totalMilesRaw));
  }

  return cleaned.trim();
}

/**
 * Generate frontmatter for a chapter
 */
function generateFrontmatter(section) {
  const description = extractDescription(section.content) ||
                      generateDescription(section.title, section.partNumber);
  const icon = getIconForTitle(section.title);

  return `---
title: "${section.title}"
part: ${section.partNumber}
order: ${section.fileOrder}
description: "${description.replace(/"/g, '\\"')}"
icon: "${icon}"
---

`;
}

/**
 * Generate filename from section
 */
function generateFilename(section) {
  const paddedOrder = String(section.fileOrder).padStart(2, '0');
  const slug = slugify(section.title);
  return `${paddedOrder}-${slug}.md`;
}

/**
 * Write a chapter file
 */
function writeChapter(section, dryRun = false) {
  const filename = generateFilename(section);
  const frontmatter = generateFrontmatter(section);

  // Process templates in content
  const processedContent = processTemplates(section.content);
  const fullContent = frontmatter + processedContent;

  const filePath = path.join(GUIDE_DIR, filename);

  if (!dryRun) {
    fs.writeFileSync(filePath, fullContent, 'utf-8');
  }

  return { filename, filePath, section };
}

/**
 * Clean old chapter files (except quick refs)
 */
function cleanOldChapters() {
  if (!fs.existsSync(GUIDE_DIR)) {
    return [];
  }

  const files = fs.readdirSync(GUIDE_DIR);
  const removed = [];

  for (const file of files) {
    // Only remove numbered chapter files, not quick/ directory
    if (/^\d{2}-.*\.md$/.test(file)) {
      const filePath = path.join(GUIDE_DIR, file);
      fs.unlinkSync(filePath);
      removed.push(file);
    }
  }

  return removed;
}

/**
 * Main execution
 */
export function main(options = {}) {
  const { dryRun = false, silent = false } = options;

  const log = silent ? () => {} : console.log;

  log('\n📚 Parsing Master Guide Document\n');

  // Check master file exists
  if (!fs.existsSync(MASTER_FILE)) {
    const error = `Master file not found: ${MASTER_FILE}`;
    if (!silent) console.error(`❌ ${error}`);
    return { success: false, error };
  }

  // Load facts
  log('Loading trail facts from YAML...');
  const facts = loadFacts();
  if (facts) {
    log(`   ✓ Loaded facts (AWOL ${facts._meta?.awol_edition || 'unknown'} edition)`);
    log(`   ✓ Trail length: ${facts.trail?.total_miles?.value} miles`);
    log(`   ✓ ${Object.keys(facts.landmarks || {}).length} landmarks defined`);
    log(`   ✓ ${Object.keys(facts.towns || {}).length} towns defined`);
  }

  // Read master document
  log('\nReading MASTER_NOBO_FIELD_GUIDE.md...');
  const masterContent = fs.readFileSync(MASTER_FILE, 'utf-8');

  // Parse into sections
  log('Parsing sections dynamically...\n');
  const sections = parseMasterDocument(masterContent);

  if (sections.length === 0) {
    const error = 'No sections found in master document';
    if (!silent) console.error(`❌ ${error}`);
    return { success: false, error };
  }

  // Ensure guide directory exists
  if (!dryRun && !fs.existsSync(GUIDE_DIR)) {
    fs.mkdirSync(GUIDE_DIR, { recursive: true });
  }

  // Clean old chapters
  if (!dryRun) {
    const removed = cleanOldChapters();
    if (removed.length > 0) {
      log(`Cleaned ${removed.length} old chapter files`);
    }
  }

  // Write chapter files
  log('Writing chapter files:');
  const written = [];

  for (const section of sections) {
    const result = writeChapter(section, dryRun);
    written.push(result);
    log(`  ✓ ${result.filename} — "${section.title}"`);
  }

  log(`\n✅ Generated ${written.length} chapter files`);
  log(`📁 Output: ${GUIDE_DIR}\n`);

  // List quick reference files (preserved, not regenerated)
  const quickDir = path.join(GUIDE_DIR, 'quick');
  let quickFiles = [];
  if (fs.existsSync(quickDir)) {
    quickFiles = fs.readdirSync(quickDir).filter(f => f.endsWith('.md'));
    if (quickFiles.length > 0) {
      log('Quick reference cards (preserved):');
      quickFiles.forEach(f => log(`  • ${f}`));
      log('');
    }
  }

  log('Done! Run `npm run build` to rebuild the site.\n');

  return {
    success: true,
    sections,
    written,
    quickFiles,
    factsLoaded: !!facts,
  };
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = main();
  if (!result.success) {
    process.exit(1);
  }
}
