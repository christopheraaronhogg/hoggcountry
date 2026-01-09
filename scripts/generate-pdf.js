#!/usr/bin/env node
/**
 * Generate PDF of the AT Field Guide
 * Run after build: node scripts/generate-pdf.js
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const publicDir = join(__dirname, '..', 'public');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// MIME types for static file serving
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Simple static file server
function createStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(dir, req.url === '/' ? 'index.html' : req.url);

      // Handle directory requests
      if (!extname(filePath)) {
        filePath = join(filePath, 'index.html');
      }

      try {
        if (existsSync(filePath)) {
          const ext = extname(filePath);
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          const content = readFileSync(filePath);
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (err) {
        res.writeHead(500);
        res.end('Server error');
      }
    });

    server.listen(port, () => {
      console.log(`📁 Static server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function generatePDF() {
  const port = 4322;
  let server;
  let browser;

  try {
    // Check if dist exists
    if (!existsSync(distDir)) {
      console.error('❌ Error: dist/ directory not found. Run `npm run build` first.');
      process.exit(1);
    }

    // Start static server
    server = await createStaticServer(distDir, port);

    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Navigate to guide page
    console.log('📖 Loading guide page...');
    await page.goto(`http://localhost:${port}/guide/`, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Wait for content to fully render
    await page.waitForSelector('.chapter-section', { timeout: 30000 });

    // Small delay for any animations/fonts to settle
    await new Promise(r => setTimeout(r, 1000));

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfPath = join(publicDir, 'AT-Field-Guide-2026.pdf');

    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 0 0.5in;">
          <span>AT Field Guide 2026 — Hogg Country</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 0 0.5in;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    });

    console.log(`✅ PDF saved to: ${pdfPath}`);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
}

generatePDF();
