/**
 * Generate asset manifest for service worker precaching
 * Runs after build to list all /_astro/ files that need offline caching
 */

import fs from 'fs';
import path from 'path';

const DIST_DIR = path.join(process.cwd(), 'dist');
const ASTRO_DIR = path.join(DIST_DIR, '_astro');
const OUTPUT_FILE = path.join(DIST_DIR, 'asset-manifest.json');

// File types to include (JS, CSS - skip images, they're too big)
const INCLUDE_EXTENSIONS = ['.js', '.css'];

function generateManifest() {
  console.log('📦 Generating asset manifest for offline caching...');

  if (!fs.existsSync(ASTRO_DIR)) {
    console.warn('   ⚠️ No _astro directory found, skipping');
    return;
  }

  const files = fs.readdirSync(ASTRO_DIR);

  const assets = files
    .filter(file => INCLUDE_EXTENSIONS.some(ext => file.endsWith(ext)))
    .map(file => `/_astro/${file}`);

  const manifest = {
    version: Date.now().toString(36),
    assets
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

  console.log(`✅ Asset manifest generated: ${OUTPUT_FILE}`);
  console.log(`   ${assets.length} assets (${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB manifest)`);
}

generateManifest();
