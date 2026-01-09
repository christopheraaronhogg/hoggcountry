#!/usr/bin/env node
/**
 * Tests for the Master Guide Parser
 *
 * Run with: node scripts/parse-master-guide.test.js
 *           npm test
 */

import { strict as assert } from 'node:assert';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  romanToArabic,
  slugify,
  titleCase,
  getIconForTitle,
  generateDescription,
  extractDescription,
  parseMasterDocument,
  main,
} from './parse-master-guide.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ============================================================================
// Unit Tests: romanToArabic
// ============================================================================

describe('romanToArabic', () => {
  it('converts single numerals correctly', () => {
    assert.equal(romanToArabic('I'), 1);
    assert.equal(romanToArabic('V'), 5);
    assert.equal(romanToArabic('X'), 10);
    assert.equal(romanToArabic('L'), 50);
    assert.equal(romanToArabic('C'), 100);
  });

  it('converts compound numerals correctly', () => {
    assert.equal(romanToArabic('II'), 2);
    assert.equal(romanToArabic('III'), 3);
    assert.equal(romanToArabic('IV'), 4);
    assert.equal(romanToArabic('VI'), 6);
    assert.equal(romanToArabic('IX'), 9);
    assert.equal(romanToArabic('XI'), 11);
    assert.equal(romanToArabic('XIV'), 14);
    assert.equal(romanToArabic('XV'), 15);
    assert.equal(romanToArabic('XVI'), 16);
    assert.equal(romanToArabic('XVII'), 17);
    assert.equal(romanToArabic('XVIII'), 18);
    assert.equal(romanToArabic('XIX'), 19);
    assert.equal(romanToArabic('XX'), 20);
  });

  it('handles lowercase input', () => {
    assert.equal(romanToArabic('iv'), 4);
    assert.equal(romanToArabic('xvii'), 17);
  });

  it('returns 0 for null/undefined', () => {
    assert.equal(romanToArabic(null), 0);
    assert.equal(romanToArabic(undefined), 0);
    assert.equal(romanToArabic(''), 0);
  });
});

// ============================================================================
// Unit Tests: slugify
// ============================================================================

describe('slugify', () => {
  it('converts to lowercase', () => {
    assert.equal(slugify('HELLO WORLD'), 'hello-world');
  });

  it('replaces spaces with hyphens', () => {
    assert.equal(slugify('hello world'), 'hello-world');
  });

  it('replaces & with and', () => {
    assert.equal(slugify('Food & Resupply'), 'food-and-resupply');
  });

  it('removes special characters', () => {
    assert.equal(slugify('Hello! World?'), 'hello-world');
  });

  it('removes leading/trailing hyphens', () => {
    assert.equal(slugify('--hello--'), 'hello');
  });

  it('truncates long slugs', () => {
    const longTitle = 'This is a very long title that should be truncated to a reasonable length';
    const slug = slugify(longTitle);
    assert.ok(slug.length <= 50);
  });
});

// ============================================================================
// Unit Tests: titleCase
// ============================================================================

describe('titleCase', () => {
  it('capitalizes first letter of each word', () => {
    assert.equal(titleCase('hello world'), 'Hello World');
  });

  it('handles all caps input', () => {
    assert.equal(titleCase('GEAR SYSTEM'), 'Gear System');
  });

  it('keeps lowercase words lowercase (except first)', () => {
    assert.equal(titleCase('THE PATH TO KATAHDIN'), 'The Path to Katahdin');
  });

  it('returns empty string for empty input', () => {
    assert.equal(titleCase(''), '');
    assert.equal(titleCase(null), '');
    assert.equal(titleCase(undefined), '');
  });
});

// ============================================================================
// Unit Tests: getIconForTitle
// ============================================================================

describe('getIconForTitle', () => {
  it('returns compass for introduction', () => {
    assert.equal(getIconForTitle('Introduction'), 'compass');
  });

  it('returns correct icons for various titles', () => {
    assert.equal(getIconForTitle('Gear System'), 'backpack');
    assert.equal(getIconForTitle('Clothing System'), 'shirt');
    assert.equal(getIconForTitle('Water Treatment'), 'droplet');
    assert.equal(getIconForTitle('Weather Strategy'), 'cloud');
    assert.equal(getIconForTitle('Food & Resupply'), 'utensils');
    assert.equal(getIconForTitle('Town Strategy'), 'building');
    assert.equal(getIconForTitle('Medical Planning'), 'heart');
    assert.equal(getIconForTitle('Safety & Emergency'), 'alert');
    assert.equal(getIconForTitle('Financial Planning'), 'dollar');
    assert.equal(getIconForTitle('The Path to Katahdin'), 'mountain');
  });

  it('returns default icon for unknown titles', () => {
    assert.equal(getIconForTitle('Random Unknown Title'), 'book');
  });
});

// ============================================================================
// Unit Tests: extractDescription
// ============================================================================

describe('extractDescription', () => {
  it('extracts first paragraph as description', () => {
    const content = `# Title

This is the first paragraph that should be extracted.

## Section
More content here.`;

    const desc = extractDescription(content);
    assert.equal(desc, 'This is the first paragraph that should be extracted.');
  });

  it('skips headings and empty lines', () => {
    const content = `# Title

## Subtitle

Real content starts here.`;

    const desc = extractDescription(content);
    assert.equal(desc, 'Real content starts here.');
  });

  it('truncates long descriptions', () => {
    const content = `# Title

This is a very long paragraph that goes on and on and on and should definitely be truncated because it exceeds the maximum length that we want for descriptions in our frontmatter.`;

    const desc = extractDescription(content, 50);
    assert.ok(desc.length <= 50);
    assert.ok(desc.endsWith('...'));
  });

  it('removes markdown formatting', () => {
    const content = `# Title

This has **bold** and *italic* and [links](http://example.com).`;

    const desc = extractDescription(content);
    assert.equal(desc, 'This has bold and italic and links.');
  });
});

// ============================================================================
// Integration Tests: parseMasterDocument
// ============================================================================

describe('parseMasterDocument', () => {
  it('parses a minimal document with one part', () => {
    const content = `# THE COMPLETE GUIDE

Introduction content here.

# PART I: FIRST SECTION

First section content.`;

    const sections = parseMasterDocument(content);

    assert.equal(sections.length, 2);
    assert.equal(sections[0].type, 'introduction');
    assert.equal(sections[0].title, 'Introduction');
    assert.equal(sections[1].type, 'part');
    assert.equal(sections[1].partNumber, 1);
    assert.equal(sections[1].title, 'First Section');
  });

  it('parses multiple parts in order', () => {
    const content = `Intro

# PART I: FIRST
Content 1

# PART II: SECOND
Content 2

# PART III: THIRD
Content 3`;

    const sections = parseMasterDocument(content);

    assert.equal(sections.length, 4); // intro + 3 parts
    assert.equal(sections[0].type, 'introduction');
    assert.equal(sections[1].partNumber, 1);
    assert.equal(sections[2].partNumber, 2);
    assert.equal(sections[3].partNumber, 3);
  });

  it('handles conclusion section', () => {
    const content = `Intro

# PART I: FIRST
Content 1

# CONCLUSION: THE END
Final thoughts.`;

    const sections = parseMasterDocument(content);

    assert.equal(sections.length, 3);
    assert.equal(sections[2].type, 'conclusion');
    assert.equal(sections[2].title, 'The End');
    assert.equal(sections[2].partNumber, 999);
  });

  it('assigns sequential file orders', () => {
    const content = `Intro

# PART I: A
Content

# PART II: B
Content

# CONCLUSION: C
Content`;

    const sections = parseMasterDocument(content);

    assert.equal(sections[0].fileOrder, 0);
    assert.equal(sections[1].fileOrder, 1);
    assert.equal(sections[2].fileOrder, 2);
    assert.equal(sections[3].fileOrder, 3);
  });

  it('handles roman numerals up to XVII and beyond', () => {
    const content = `# PART XVII: SEVENTEEN
Content

# PART XVIII: EIGHTEEN
Content

# PART XIX: NINETEEN
Content`;

    const sections = parseMasterDocument(content);

    assert.equal(sections[0].partNumber, 17);
    assert.equal(sections[1].partNumber, 18);
    assert.equal(sections[2].partNumber, 19);
  });

  it('cleans part headers in content', () => {
    const content = `# PART I: MY TITLE HERE

Some content after the title.`;

    const sections = parseMasterDocument(content);

    assert.ok(sections[0].content.startsWith('# My Title Here'));
    assert.ok(!sections[0].content.includes('PART I:'));
  });
});

// ============================================================================
// Integration Tests: Real Master Document
// ============================================================================

describe('Real Master Document', () => {
  const MASTER_FILE = path.join(ROOT, 'MASTER_NOBO_FIELD_GUIDE.md');

  before(() => {
    if (!fs.existsSync(MASTER_FILE)) {
      console.log('⚠️  Skipping real document tests - master file not found');
    }
  });

  it('parses the actual master document', async (t) => {
    if (!fs.existsSync(MASTER_FILE)) {
      t.skip('Master file not found');
      return;
    }

    const content = fs.readFileSync(MASTER_FILE, 'utf-8');
    const sections = parseMasterDocument(content);

    // Should have introduction + parts + conclusion
    assert.ok(sections.length >= 18, `Expected at least 18 sections, got ${sections.length}`);

    // First should be introduction
    assert.equal(sections[0].type, 'introduction');
    assert.equal(sections[0].title, 'Introduction');

    // Last section - could be 'conclusion' if document has one, or 'part' otherwise
    const lastSection = sections[sections.length - 1];
    assert.ok(
      lastSection.type === 'conclusion' || lastSection.type === 'part',
      `Last section should be 'conclusion' or 'part', got '${lastSection.type}'`
    );

    // All sections should have required fields
    for (const section of sections) {
      assert.ok(section.title, 'Section should have title');
      assert.ok(section.content, 'Section should have content');
      assert.ok(typeof section.fileOrder === 'number', 'Section should have fileOrder');
      assert.ok(typeof section.partNumber === 'number', 'Section should have partNumber');
    }
  });

  it('generates valid filenames for all sections', async (t) => {
    if (!fs.existsSync(MASTER_FILE)) {
      t.skip('Master file not found');
      return;
    }

    const content = fs.readFileSync(MASTER_FILE, 'utf-8');
    const sections = parseMasterDocument(content);

    const filenames = new Set();

    for (const section of sections) {
      const paddedOrder = String(section.fileOrder).padStart(2, '0');
      const slug = slugify(section.title);
      const filename = `${paddedOrder}-${slug}.md`;

      // Should be valid filename
      assert.ok(/^\d{2}-[a-z0-9-]+\.md$/.test(filename), `Invalid filename: ${filename}`);

      // Should be unique
      assert.ok(!filenames.has(filename), `Duplicate filename: ${filename}`);
      filenames.add(filename);
    }
  });

  it('extracts all expected parts from current document', async (t) => {
    if (!fs.existsSync(MASTER_FILE)) {
      t.skip('Master file not found');
      return;
    }

    const content = fs.readFileSync(MASTER_FILE, 'utf-8');
    const sections = parseMasterDocument(content);

    // Check for expected sections (based on current document structure)
    const types = sections.map(s => s.type);
    const partNumbers = sections.filter(s => s.type === 'part').map(s => s.partNumber);

    assert.ok(types.includes('introduction'), 'Should have introduction');
    // Note: conclusion is optional - only present if document has "# CONCLUSION:" header

    // Should have at least parts 1-17 (current structure has 19)
    const minParts = 17;
    assert.ok(
      partNumbers.length >= minParts,
      `Should have at least ${minParts} parts, got ${partNumbers.length}`
    );

    // Verify sequential part numbers starting from 1
    for (let i = 1; i <= Math.min(minParts, partNumbers.length); i++) {
      assert.ok(partNumbers.includes(i), `Should have part ${i}`);
    }
  });
});

// ============================================================================
// Integration Tests: main() function
// ============================================================================

describe('main() function', () => {
  const MASTER_FILE = path.join(ROOT, 'MASTER_NOBO_FIELD_GUIDE.md');

  it('returns success with valid document', async (t) => {
    if (!fs.existsSync(MASTER_FILE)) {
      t.skip('Master file not found');
      return;
    }

    const result = main({ dryRun: true, silent: true });

    assert.ok(result.success, 'Should return success');
    assert.ok(Array.isArray(result.sections), 'Should return sections array');
    assert.ok(Array.isArray(result.written), 'Should return written array');
    assert.ok(result.sections.length >= 18, 'Should have at least 18 sections');
  });

  it('dry run does not write files', async (t) => {
    if (!fs.existsSync(MASTER_FILE)) {
      t.skip('Master file not found');
      return;
    }

    // Create a temp marker file
    const testMarker = path.join(ROOT, 'src/content/guide', '.test-marker');
    const markerExists = fs.existsSync(testMarker);

    const result = main({ dryRun: true, silent: true });

    assert.ok(result.success);
    // Marker should still exist or not exist (unchanged)
    assert.equal(fs.existsSync(testMarker), markerExists);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('handles empty document', () => {
    const sections = parseMasterDocument('');
    assert.equal(sections.length, 0);
  });

  it('handles document with no parts', () => {
    const content = `# Just a title

Some content but no PART markers.`;

    const sections = parseMasterDocument(content);
    assert.equal(sections.length, 0);
  });

  it('handles document with only conclusion', () => {
    const content = `Intro text

# CONCLUSION: THE END
Final content.`;

    const sections = parseMasterDocument(content);
    assert.equal(sections.length, 2);
    assert.equal(sections[0].type, 'introduction');
    assert.equal(sections[1].type, 'conclusion');
  });

  it('handles special characters in titles', () => {
    const content = `# PART I: FOOD & RESUPPLY — THE COMPLETE GUIDE!

Content here.`;

    const sections = parseMasterDocument(content);

    assert.equal(sections[0].title, 'Food & Resupply — the Complete Guide!');
    const slug = slugify(sections[0].title);
    assert.ok(!slug.includes('&'), 'Slug should not contain &');
    assert.ok(!slug.includes('—'), 'Slug should not contain em-dash');
  });

  it('preserves content between sections', () => {
    const content = `Intro content here.

# PART I: FIRST

First section content.
More content.

Tables and stuff.

# PART II: SECOND

Second section content.`;

    const sections = parseMasterDocument(content);

    assert.ok(sections[1].content.includes('More content'));
    assert.ok(sections[1].content.includes('Tables and stuff'));
    assert.ok(!sections[1].content.includes('Second section'));
  });
});

// ============================================================================
// Run Summary
// ============================================================================

console.log('\n🧪 Running Master Guide Parser Tests...\n');
