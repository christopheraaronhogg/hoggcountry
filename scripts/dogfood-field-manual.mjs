import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MANUAL_BUILDER_PATH = '/guide/manual-builder/';
const DIST_DIR = path.resolve('dist');
const STEP_TIMEOUT = 20000;
const DOWNLOAD_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'hoggcountry-manual-download-'));
const PROFILE_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'hoggcountry-manual-profile-'));

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolveFilePath(rootDir, requestPathname) {
  const pathname = decodeURIComponent(requestPathname);
  const normalized = pathname.endsWith('/')
    ? `${pathname}index.html`
    : (path.extname(pathname) ? pathname : `${pathname}/index.html`);

  const relativePath = normalized.replace(/^\/+/, '');
  const filePath = path.resolve(rootDir, relativePath);

  if (!filePath.startsWith(rootDir)) {
    throw new Error('Path traversal blocked');
  }

  return filePath;
}

async function startStaticServer(rootDir, port) {
  const server = http.createServer(async (request, response) => {
    if (!request.url) {
      response.writeHead(400).end('Bad request');
      return;
    }

    try {
      const url = new URL(request.url, BASE_URL);
      const filePath = resolveFilePath(rootDir, url.pathname);
      const body = await fs.readFile(filePath);
      const contentType = MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream';

      response.writeHead(200, { 'Content-Type': contentType });
      response.end(body);
    } catch (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`Not found: ${request.url}`);
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  return server;
}

async function setDownloadBehavior(page, downloadPath) {
  const session = await page.target().createCDPSession();
  await session.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath,
  });
}

async function clearAndType(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(selector, value);
}

async function clickAndWaitForNavigation(page, selector) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click(selector),
  ]);
}

async function waitForSaved(page, entryId) {
  await page.waitForFunction(
    (targetId) => {
      const button = document.querySelector(`[data-manual-entry-id="${targetId}"]`);
      return button && /Saved/i.test(button.textContent || '');
    },
    {},
    entryId,
  );
}

async function searchAndSaveTrail(page, query, entryId) {
  await clearAndType(page, 'input[aria-label="Search guide content"]', query);
  const selector = `.search-results [data-manual-entry-id="${entryId}"]`;
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector);
  await waitForSaved(page, entryId);
}

async function searchAndSaveScripture(page, query, entryId) {
  await clearAndType(page, '#scripture-search-input', query);
  const selector = `[data-manual-entry-id="${entryId}"]`;
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector);
  await waitForSaved(page, entryId);
}

async function waitForDownload(downloadDir, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const files = await fs.readdir(downloadDir);
    const htmlFile = files.find((file) => file.endsWith('.html'));
    if (htmlFile) {
      return path.join(downloadDir, htmlFile);
    }
    await delay(250);
  }

  throw new Error('Timed out waiting for exported Field Manual download');
}

function logStep(step) {
  console.log(`[dogfood] ${step}`);
}

async function main() {
  const server = await startStaticServer(DIST_DIR, PORT);
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: PROFILE_DIR,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(STEP_TIMEOUT);
    page.setDefaultNavigationTimeout(STEP_TIMEOUT);

    page.on('console', (message) => {
      const text = message.text();
      if (text) {
        console.log(`[page:${message.type()}] ${text}`);
      }
    });
    page.on('pageerror', (error) => {
      console.error('[page:error]', error);
    });

    await setDownloadBehavior(page, DOWNLOAD_DIR);

    logStep('Open hidden Field Manual builder preview');
    await page.goto(`${BASE_URL}${MANUAL_BUILDER_PATH}`, { waitUntil: 'networkidle2' });
    logStep('Register and activate service worker');
    await page.waitForFunction(() => 'serviceWorker' in navigator);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      if (navigator.serviceWorker.controller) {
        return;
      }
      await navigator.serviceWorker.ready;
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    logStep('Reload for service worker control');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

    logStep('Save trail entries');
    await searchAndSaveTrail(page, 'water', 'guide:09-water-treatment-system');
    await searchAndSaveTrail(page, 'shelter', 'guide:08-shelter-vs-tent-decision-system');
    await searchAndSaveTrail(page, 'resupply', 'guide:15-resupply-logistics');

    logStep('Switch to scripture tab');
    await clickAndWaitForNavigation(page, '[data-guide-corpus="scripture"]');
    await page.waitForSelector('#scripture-search-input', { visible: true });

    logStep('Save scripture entries');
    await searchAndSaveScripture(page, 'fear', 'scripture:fear:psalms-56-3');
    await searchAndSaveScripture(page, 'fear', 'scripture:fear:isaiah-41-10');
    await searchAndSaveScripture(page, 'endurance', 'scripture:endurance:hebrews-12-1-2');
    await searchAndSaveScripture(page, 'rest', 'scripture:rest:psalms-4-8');

    logStep('Switch to My Field Manual');
    await clickAndWaitForNavigation(page, '[data-guide-view="mine"]');
    await page.waitForSelector('[data-manual-entry]', { visible: true });

    const initialCount = await page.$$eval('[data-manual-entry]', (entries) => entries.length);
    if (initialCount < 7) {
      throw new Error(`Expected at least 7 manual entries, found ${initialCount}`);
    }

    logStep('Reorder, annotate, and prune entries');
    const firstEntryId = await page.$eval('[data-manual-entry]', (entry) => entry.getAttribute('data-manual-entry'));
    await page.click(`[data-manual-action="move-down"][data-manual-target="${firstEntryId}"]`);
    await delay(300);

    await page.click('[data-manual-action="add-note"]');
    await page.waitForSelector('[data-manual-entry^="note:"]', { visible: true });

    await page.type('[data-manual-note^="note:"]', 'Town stop checklist: charge batteries, refill food, wash clothes, call home.');
    await delay(600);

    await page.click(`[data-manual-action="remove"][data-manual-target="${firstEntryId}"]`);
    await delay(300);

    const countAfterRemove = await page.$$eval('[data-manual-entry]', (entries) => entries.length);
    if (countAfterRemove < 7) {
      throw new Error(`Expected at least 7 manual entries after add/remove, found ${countAfterRemove}`);
    }

    logStep('Reload My Field Manual offline');
    await page.setOfflineMode(true);
    await page.goto(`${BASE_URL}${MANUAL_BUILDER_PATH}?view=mine`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-manual-entry]', { visible: true });

    logStep('Export Field Manual HTML');
    await page.click('[data-manual-action="export"]');
    const downloadedFile = await waitForDownload(DOWNLOAD_DIR);

    logStep('Validate exported HTML');
    const exportedPage = await browser.newPage();
    exportedPage.setDefaultTimeout(STEP_TIMEOUT);
    exportedPage.setDefaultNavigationTimeout(STEP_TIMEOUT);
    await exportedPage.goto(`file:///${downloadedFile.replace(/\\/g, '/')}`, { waitUntil: 'load' });

    const exportedSummary = await exportedPage.evaluate(() => ({
      title: document.title,
      entryCount: document.querySelectorAll('.entry').length,
      hasJson: Boolean(document.querySelector('#field-manual-data')),
      heading: document.querySelector('h1')?.textContent?.trim() ?? null,
    }));

    if (exportedSummary.title !== 'My Field Manual') {
      throw new Error(`Unexpected export title: ${exportedSummary.title}`);
    }
    if (!exportedSummary.hasJson) {
      throw new Error('Exported file is missing #field-manual-data payload');
    }
    if (exportedSummary.entryCount < 7) {
      throw new Error(`Expected exported file to contain at least 7 entries, found ${exportedSummary.entryCount}`);
    }

    console.log(JSON.stringify({
      ok: true,
      initialCount,
      countAfterRemove,
      downloadedFile,
      exportedSummary,
    }, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

await main();
