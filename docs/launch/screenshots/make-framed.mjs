// Composes clean marketing screenshots: the real app screen on a forest brand
// background with a caption headline. Outputs iOS (1290x2796) + Play (1080x2160).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const IOS = 'docs/launch/screenshots/ios';
const OUT_IOS = 'docs/launch/screenshots/ios-framed';
const OUT_PLAY = 'docs/launch/screenshots/play-framed';
mkdirSync(OUT_IOS, { recursive: true });
mkdirSync(OUT_PLAY, { recursive: true });

const forest = '#2f4b35', forestDeep = '#21331f', cream = '#f1e8d3', sun = '#df7a30';
const FONT = "'Avenir Next','Helvetica Neue',Helvetica,Arial,sans-serif";

const shots = [
  { file: '01-today.png', caption: 'Your whole day, mile by mile' },
  { file: '02-map.png', caption: 'The trail ahead, at a glance' },
  { file: '03-scout.png', caption: 'Ask Scout — cited, offline' },
  { file: '04-bible.png', caption: 'The whole KJV, offline' },
  { file: '05-bible-ask.png', caption: 'Ask the Bible, get the verses' },
  { file: '06-gear.png', caption: 'Your pack, dialed in' }
];

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function frame(srcPng, caption, W, H) {
  // scaled screenshot
  const sw = Math.round(W * 0.82);
  const meta = await sharp(srcPng).metadata();
  const sh = Math.round(meta.height * (sw / meta.width));
  const radius = Math.round(W * 0.035);
  const mask = Buffer.from(`<svg width="${sw}" height="${sh}"><rect width="${sw}" height="${sh}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
  const shot = await sharp(srcPng).resize(sw, sh).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  const capTop = Math.round(H * 0.058);
  const shotTop = Math.round(H * 0.155);
  const left = Math.round((W - sw) / 2);
  const fs = Math.round(W * 0.05);

  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${forest}"/><stop offset="1" stop-color="${forestDeep}"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <circle cx="${Math.round(W * 0.99)}" cy="${Math.round(H * 0.008)}" r="${Math.round(W * 0.07)}" fill="${sun}" opacity="0.92"/>
    <text x="${W / 2}" y="${capTop + fs}" font-family="${FONT}" font-size="${fs}" font-weight="800"
          fill="${cream}" text-anchor="middle">${esc(caption)}</text>
  </svg>`;

  return sharp(Buffer.from(bg))
    .composite([{ input: shot, top: shotTop, left }])
    .png()
    .toBuffer();
}

for (const { file, caption } of shots) {
  const src = `${IOS}/${file}`;
  await sharp(await frame(src, caption, 1290, 2796)).toFile(`${OUT_IOS}/${file}`);
  await sharp(await frame(src, caption, 1080, 2160)).toFile(`${OUT_PLAY}/${file}`);
  console.log('framed', file);
}
console.log('done');
