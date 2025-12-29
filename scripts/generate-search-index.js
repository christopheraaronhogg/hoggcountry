/**
 * Generate search index for AT Field Guide offline search
 * Runs at build time to create a JSON index of all guide content
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUIDE_DIR = path.join(__dirname, '../src/content/guide');
const OUTPUT_PATH = path.join(__dirname, '../public/guide-search-index.json');

// Parse frontmatter from markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatterStr = match[1];
  const body = content.slice(match[0].length).trim();

  const frontmatter = {};
  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Parse booleans and numbers
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value !== '') value = Number(value);
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

// Strip markdown formatting for plain text search
function stripMarkdown(text) {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove table formatting
    .replace(/\|/g, ' ')
    .replace(/^[-:]+$/gm, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Get all markdown files recursively
function getMarkdownFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getMarkdownFiles(fullPath, files);
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Generate file ID from path (matches Astro's content collection ID)
function getFileId(filePath) {
  const relative = path.relative(GUIDE_DIR, filePath);
  return relative.replace(/\.md$/, '').replace(/\\/g, '/');
}

// Main
function generateIndex() {
  console.log('📚 Generating search index for AT Field Guide...');

  const files = getMarkdownFiles(GUIDE_DIR);
  console.log(`   Found ${files.length} guide files`);

  const index = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    const id = getFileId(filePath);

    // Strip markdown and create searchable text
    const plainText = stripMarkdown(body);

    // Extract section headers for better search results
    const headers = [];
    body.replace(/^#{2,3}\s+(.+)$/gm, (_, header) => {
      headers.push(header.trim());
    });

    index.push({
      id,
      title: frontmatter.title || id,
      description: frontmatter.description || '',
      quickRef: frontmatter.quickRef || false,
      part: frontmatter.part || 0,
      order: frontmatter.order || 0,
      // Store plain text content for full-text search
      content: plainText,
      // Store headers for enhanced search
      headers: headers.join(' | '),
    });
  }

  // Sort by part, then order
  index.sort((a, b) => {
    if (a.part !== b.part) return a.part - b.part;
    return a.order - b.order;
  });

  // Write index
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2));

  // Calculate size
  const stats = fs.statSync(OUTPUT_PATH);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(`✅ Search index generated: ${OUTPUT_PATH}`);
  console.log(`   ${index.length} documents indexed, ${sizeKB} KB`);
}

generateIndex();
