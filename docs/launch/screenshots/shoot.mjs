// Captures crisp store screenshots of the live M1 build at native iPhone 6.9"
// resolution (430x932 @3 = 1290x2796) using puppeteer's bundled Chrome.
// Prereq: dev server on http://localhost:5199. Run from repo root.
import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';

const OUT = 'docs/launch/screenshots/ios';
mkdirSync(OUT, { recursive: true });
const URL = 'http://localhost:5199/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3 });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(1500);

async function clickText(texts, exact = false) {
  return page.evaluate((texts, exact) => {
    const btns = [...document.querySelectorAll('button, [role=tab], a')];
    for (const t of texts) {
      const el = btns.find((b) => {
        const s = (b.textContent || '').trim();
        return exact ? s === t : new RegExp(t).test(s);
      });
      if (el) { el.click(); return (el.textContent || '').trim().slice(0, 30); }
    }
    return null;
  }, texts, exact);
}
async function nav(label) { await clickText([label]); await sleep(900); }
async function shoot(name) { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); }

// 1. Today (day timeline) — already home
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(400);
await shoot('01-today');

// 2. Map (trail ribbon + elevation)
await nav('Map');
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(700);
await shoot('02-map');

// 3. Scout (on-device AI chat)
await nav('Scout');
await sleep(700);
await shoot('03-scout');

// 4. Trail -> Bible (Read, Psalm 23)
await nav('Trail');
await clickText(['Bible'], true);
await sleep(600);
// wait for the 19MB KJV index to load
await page.waitForFunction(
  () => !document.body.innerText.includes('Loading the King') && !!document.querySelector('.passage, .book-grid'),
  { timeout: 25000 }
).catch(() => {});
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);
await shoot('04-bible');

// 5. Bible -> Ask (Scout-powered scripture Q&A, cited verses)
await clickText(['Ask'], true);
await sleep(500);
await page.evaluate(() => {
  const chip = document.querySelector('.ask-chip');
  if (chip) chip.click();
});
await page.waitForFunction(() => !document.querySelector('.ask-working'), { timeout: 9000 }).catch(() => {});
await sleep(800);
await page.evaluate(() => window.scrollTo(0, 0));
await shoot('05-bible-ask');

// 6. Trail -> Gear (loadout)
await nav('Trail');
await clickText(['Gear'], true);
await sleep(600);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);
await shoot('06-gear');

await browser.close();
console.log('done — screenshots in', OUT);
