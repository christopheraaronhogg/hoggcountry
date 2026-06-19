// Generates ALL app icon + launch assets for iOS and Android from the brand
// emblem, writing straight into the native projects (and keeping copies here).
// Run from repo root: node docs/launch/icon/make-app-assets.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const M = 'mobile';
const DOCS = 'docs/launch/icon';
mkdirSync(`${DOCS}/generated`, { recursive: true });

// --- palette ---
const cream = '#f1e8d3', creamDeep = '#e9ddc2', sun = '#df7a30', sunSoft = '#eaa055';
const sage = '#8a9c77', forest = '#2f4b35', forestDeep = '#1d2f1c';

const boar = `
  <g fill="${forestDeep}">
    <path d="M380 470 C 364 462, 362 442, 378 440 C 388 439, 389 451 383 460 Z"/>
    <rect x="612" y="476" width="25" height="72" rx="8"/>
    <rect x="552" y="478" width="23" height="70" rx="8"/>
    <rect x="452" y="478" width="23" height="70" rx="8"/>
    <rect x="396" y="476" width="25" height="72" rx="8"/>
    <path d="M380 452 C 380 412, 402 388, 448 382 C 492 376, 522 376, 552 382
      C 582 388, 602 404, 620 424 C 634 438, 646 448, 662 454 C 676 459, 684 468, 686 480
      C 687 489, 683 495, 674 496 L 654 496 C 646 496, 641 492, 636 486
      C 620 474, 560 472, 500 476 C 452 479, 412 480, 398 490 C 388 496, 382 492, 380 480 Z"/>
    <path d="M638 450 L650 421 L670 448 Z"/>
  </g>`;

// Full-bleed brand scene (1024 viewBox). `bleed` extends ridges a touch for safe masking.
function sceneSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cream}"/><stop offset="1" stop-color="${creamDeep}"/></linearGradient>
      <radialGradient id="sg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${sunSoft}"/><stop offset="1" stop-color="${sun}"/></radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#sky)"/>
    <circle cx="560" cy="402" r="180" fill="url(#sg)"/>
    <path d="M0 1024 L0 560 Q 200 486 392 520 Q 560 470 712 478 Q 880 486 1024 548 L1024 1024 Z" fill="${sage}"/>
    ${boar}
    <path d="M0 1024 L0 612 Q 210 540 360 566 Q 470 510 600 556 Q 792 612 1024 572 L1024 1024 Z" fill="${forest}"/>
    <g fill="${forestDeep}"><path d="M150 600 L188 520 L226 600 Z"/><path d="M158 648 L188 576 L218 648 Z"/><rect x="180" y="640" width="16" height="40"/></g>
  </svg>`;
}

const sceneBuf = await sharp(Buffer.from(sceneSVG())).png().toBuffer();
const at = (px) => sharp(sceneBuf).resize(px, px).png().toBuffer();

async function circle(px) {
  const mask = Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);
  return sharp(await at(px)).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}
async function splash(w, h) {
  const s = Math.round(Math.min(w, h) * 0.5);
  const emblem = await sharp(sceneBuf).resize(s, s).png().toBuffer();
  return sharp({ create: { width: w, height: h, channels: 4, background: cream } })
    .composite([{ input: emblem, top: Math.round((h - s) / 2), left: Math.round((w - s) / 2) }]).png().toBuffer();
}
const write = (p, buf) => { writeFileSync(p, buf); };

// ---------- iOS ----------
const iosIcon = await sharp(sceneBuf).resize(1024, 1024).flatten({ background: cream }).png().toBuffer(); // no alpha
write(`${M}/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`, iosIcon);
write(`${DOCS}/generated/AppIcon-1024.png`, iosIcon);
const iosSplash = await splash(2732, 2732);
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
  write(`${M}/ios/App/App/Assets.xcassets/Splash.imageset/${f}`, iosSplash);

// ---------- Android adaptive foreground (108dp) + legacy + round ----------
const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const fg = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
for (const [d, px] of Object.entries(legacy)) {
  write(`${M}/android/app/src/main/res/mipmap-${d}/ic_launcher.png`, await at(px));
  write(`${M}/android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, await circle(px));
}
for (const [d, px] of Object.entries(fg))
  write(`${M}/android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, await at(px));

// ---------- Android splash drawables (match each existing file's size) ----------
const splashes = [
  'drawable/splash.png', 'drawable-port-mdpi/splash.png', 'drawable-port-hdpi/splash.png',
  'drawable-port-xhdpi/splash.png', 'drawable-port-xxhdpi/splash.png', 'drawable-port-xxxhdpi/splash.png',
  'drawable-land-mdpi/splash.png', 'drawable-land-hdpi/splash.png', 'drawable-land-xhdpi/splash.png',
  'drawable-land-xxhdpi/splash.png'
];
for (const rel of splashes) {
  const p = `${M}/android/app/src/main/res/${rel}`;
  try {
    const m = await sharp(p).metadata();
    write(p, await splash(m.width, m.height));
  } catch { /* file absent for this bucket */ }
}

// keep a marketing copy of the master + a 180 preview
write(`${DOCS}/generated/preview-180.png`, await at(180));
console.log('Generated iOS icon+splash and Android adaptive/legacy/round icons + splashes.');
