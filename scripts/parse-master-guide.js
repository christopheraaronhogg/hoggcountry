#!/usr/bin/env node
/**
 * Parse Master Guide Script
 *
 * Reads MASTER_NOBO_FIELD_GUIDE.md and splits it into individual chapter files
 * for the Astro content collection.
 *
 * Usage: node scripts/parse-master-guide.js
 *
 * This preserves existing quick reference cards in src/content/guide/quick/
 * Only regenerates the main chapter files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_FILE = path.join(ROOT, 'MASTER_NOBO_FIELD_GUIDE.md');
const GUIDE_DIR = path.join(ROOT, 'src/content/guide');

// Chapter metadata configuration
// Maps PART numbers to output filenames and metadata
const CHAPTER_CONFIG = {
  intro: {
    filename: '00-introduction.md',
    title: 'Introduction',
    part: 0,
    order: 0,
    description: 'The philosophy behind this guide and how to use it',
    icon: 'compass'
  },
  1: {
    filename: '01-hiker-profile.md',
    title: 'Hiker Profile & Experience',
    part: 1,
    order: 1,
    description: 'Trail resume and mountain readiness assessment',
    icon: 'user'
  },
  2: {
    filename: '02-gear-system.md',
    title: 'Gear System',
    part: 2,
    order: 2,
    description: 'Complete gear philosophy, packing strategies, and weight management',
    icon: 'backpack'
  },
  3: {
    filename: '03-clothing-system.md',
    title: 'Clothing System',
    part: 3,
    order: 3,
    description: 'Layering strategy and clothing choices by season',
    icon: 'shirt'
  },
  4: {
    filename: '04-water-treatment.md',
    title: 'Water Treatment System',
    part: 4,
    order: 4,
    description: 'Water sources, treatment methods, and carry strategy',
    icon: 'droplet'
  },
  5: {
    filename: '05-shelter-decisions.md',
    title: 'Shelter vs. Tent Decision System',
    part: 5,
    order: 5,
    description: 'When to use shelters vs tent camping',
    icon: 'home'
  },
  6: {
    filename: '06-weather-strategy.md',
    title: 'Weather Strategy',
    part: 6,
    order: 6,
    description: 'Weather patterns, forecasting, and response protocols',
    icon: 'cloud'
  },
  7: {
    filename: '07-food-resupply.md',
    title: 'Food & Resupply',
    part: 7,
    order: 7,
    description: 'Nutrition, meal planning, and resupply strategy',
    icon: 'utensils'
  },
  8: {
    filename: '08-town-strategy.md',
    title: 'Town Strategy',
    part: 8,
    order: 8,
    description: 'Town stops, zero days, and town efficiency',
    icon: 'building'
  },
  9: {
    filename: '09-trail-resources.md',
    title: 'Trail Resources & Navigation',
    part: 9,
    order: 9,
    description: 'Apps, maps, and navigation tools for the AT',
    icon: 'map'
  },
  10: {
    filename: '10-permits-logistics.md',
    title: 'Permits & Logistics',
    part: 10,
    order: 10,
    description: 'Required permits, reservations, and logistics',
    icon: 'clipboard'
  },
  11: {
    filename: '11-mail-drops.md',
    title: 'USPS Mail Drop System',
    part: 11,
    order: 11,
    description: 'Mail drop strategy and post office logistics',
    icon: 'mail'
  },
  12: {
    filename: '12-power-electronics.md',
    title: 'Power & Electronics',
    part: 12,
    order: 12,
    description: 'Battery strategy, charging, and electronics management',
    icon: 'battery'
  },
  13: {
    filename: '13-medical-planning.md',
    title: 'Medical Planning',
    part: 13,
    order: 13,
    description: 'Health management, first aid, and injury prevention',
    icon: 'heart'
  },
  14: {
    filename: '14-safety-emergency.md',
    title: 'Safety & Emergency Procedures',
    part: 14,
    order: 14,
    description: 'Emergency protocols, bailout points, and safety systems',
    icon: 'alert'
  },
  15: {
    filename: '15-trail-sections.md',
    title: 'Trail Sections & Milestones',
    part: 15,
    order: 15,
    description: 'Section-by-section overview and key milestones',
    icon: 'flag'
  },
  16: {
    filename: '16-content-creation.md',
    title: 'Content Creation',
    part: 16,
    order: 16,
    description: 'Documentation, photography, and video strategy',
    icon: 'camera'
  },
  17: {
    filename: '17-financial-planning.md',
    title: 'Financial Planning',
    part: 17,
    order: 17,
    description: 'Budget planning and cost management',
    icon: 'dollar'
  },
  conclusion: {
    filename: '18-final-truths.md',
    title: 'The Path to Katahdin',
    part: 18,
    order: 18,
    description: 'Final trail truths and the one-line rule',
    icon: 'mountain'
  }
};

/**
 * Parse the master document into sections
 */
function parseMasterDocument(content) {
  const sections = {};

  // Split by PART headers
  // Pattern: # PART I: or # PART II: etc. or # CONCLUSION:
  const partRegex = /^# (PART [IVXLC]+:|CONCLUSION:)/gm;

  let matches = [];
  let match;
  while ((match = partRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      header: match[0],
      type: match[1]
    });
  }

  // Extract introduction (everything before first PART)
  if (matches.length > 0) {
    const introContent = content.substring(0, matches[0].index).trim();
    sections.intro = cleanIntroContent(introContent);
  }

  // Extract each PART section
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    const startIndex = currentMatch.index;
    const endIndex = nextMatch ? nextMatch.index : content.length;

    let sectionContent = content.substring(startIndex, endIndex).trim();

    // Determine section key
    if (currentMatch.type === 'CONCLUSION:') {
      sections.conclusion = cleanConclusionContent(sectionContent);
    } else {
      // Extract PART number from "PART X:"
      const partNum = romanToArabic(currentMatch.type.replace('PART ', '').replace(':', ''));
      sections[partNum] = cleanPartContent(sectionContent, partNum);
    }
  }

  return sections;
}

/**
 * Convert Roman numerals to Arabic numbers
 */
function romanToArabic(roman) {
  const romanMap = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100
  };

  let result = 0;
  const chars = roman.split('');

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
 * Clean introduction content - convert title structure
 */
function cleanIntroContent(content) {
  // Remove the big title header, we'll use frontmatter
  let cleaned = content
    .replace(/^# THE COMPLETE APPALACHIAN TRAIL NOBO FIELD GUIDE\s*/m, '')
    .replace(/^\*\*Springer Mountain.*\*\*\s*/m, '')
    .replace(/^\*2,197\.9 Miles.*\*\s*/m, '')
    .replace(/^\*February Start Edition\*\s*/m, '')
    .replace(/^---\s*/gm, '')
    .replace(/^\*\*Prepared by:\*\* Theman\s*/m, '')
    .replace(/^\*\*A Comprehensive.*\*\*\s*/m, '')
    .replace(/^\*Based on.*\*\s*/m, '')
    .trim();

  // Convert "## Introduction: The Philosophy..." to "# The Complete Appalachian Trail..."
  cleaned = cleaned.replace(
    /^## Introduction: The Philosophy Behind This Guide/m,
    '# The Complete Appalachian Trail NOBO Field Guide\n\n**Springer Mountain, Georgia to Mount Katahdin, Maine**\n*2,197.9 Miles of Trail-Tested Knowledge*\n*February Start Edition*\n\n---\n\n**Prepared by:** Theman\n*Based on 840+ Miles of Thru-Hiking Experience*\n\n---\n\n## The Philosophy Behind This Guide'
  );

  return cleaned;
}

/**
 * Clean PART content - remove the PART header, content becomes the chapter
 */
function cleanPartContent(content, partNum) {
  const config = CHAPTER_CONFIG[partNum];
  if (!config) return content;

  // Remove the PART X: TITLE header and replace with just # Title
  // Pattern: # PART X: TITLE
  const partHeaderRegex = /^# PART [IVXLC]+:\s*(.+)$/m;

  let cleaned = content.replace(partHeaderRegex, `# ${config.title}`);

  return cleaned.trim();
}

/**
 * Clean conclusion content
 */
function cleanConclusionContent(content) {
  // Replace "# CONCLUSION: THE PATH TO KATAHDIN" with "# The Path to Katahdin"
  let cleaned = content.replace(
    /^# CONCLUSION:\s*THE PATH TO KATAHDIN/m,
    '# The Path to Katahdin'
  );

  return cleaned.trim();
}

/**
 * Generate frontmatter for a chapter
 */
function generateFrontmatter(config) {
  return `---
title: "${config.title}"
part: ${config.part}
order: ${config.order}
description: "${config.description}"
icon: "${config.icon}"
---

`;
}

/**
 * Write a chapter file
 */
function writeChapter(key, content) {
  const config = CHAPTER_CONFIG[key];
  if (!config) {
    console.warn(`No config found for key: ${key}`);
    return false;
  }

  const frontmatter = generateFrontmatter(config);
  const fullContent = frontmatter + content;

  const filePath = path.join(GUIDE_DIR, config.filename);

  fs.writeFileSync(filePath, fullContent, 'utf-8');
  console.log(`  ✓ ${config.filename}`);

  return true;
}

/**
 * Main execution
 */
function main() {
  console.log('\n📚 Parsing Master Guide Document\n');

  // Check master file exists
  if (!fs.existsSync(MASTER_FILE)) {
    console.error(`❌ Master file not found: ${MASTER_FILE}`);
    process.exit(1);
  }

  // Read master document
  console.log('Reading MASTER_NOBO_FIELD_GUIDE.md...');
  const masterContent = fs.readFileSync(MASTER_FILE, 'utf-8');

  // Parse into sections
  console.log('Parsing sections...\n');
  const sections = parseMasterDocument(masterContent);

  // Ensure guide directory exists
  if (!fs.existsSync(GUIDE_DIR)) {
    fs.mkdirSync(GUIDE_DIR, { recursive: true });
  }

  // Write chapter files
  console.log('Writing chapter files:');
  let written = 0;

  for (const [key, content] of Object.entries(sections)) {
    if (writeChapter(key, content)) {
      written++;
    }
  }

  console.log(`\n✅ Generated ${written} chapter files`);
  console.log(`📁 Output: ${GUIDE_DIR}\n`);

  // List quick reference files (preserved, not regenerated)
  const quickDir = path.join(GUIDE_DIR, 'quick');
  if (fs.existsSync(quickDir)) {
    const quickFiles = fs.readdirSync(quickDir).filter(f => f.endsWith('.md'));
    if (quickFiles.length > 0) {
      console.log('Quick reference cards (preserved):');
      quickFiles.forEach(f => console.log(`  • ${f}`));
      console.log('');
    }
  }

  console.log('Done! Run `npm run build` to rebuild the site.\n');
}

main();
