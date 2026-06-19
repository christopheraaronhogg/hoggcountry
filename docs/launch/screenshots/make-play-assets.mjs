// Derives Google Play assets from the iOS screenshots + brand scene:
//  - phone screenshots letterboxed onto a 1080x2160 cream canvas (Play caps aspect at 2:1)
//  - the required 1024x500 feature graphic (cropped from the brand scene)
//  - a 512x512 hi-res Play icon
// Run from repo root after shoot.mjs + make-app-assets.mjs.
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';

const cream = '#f1e8d3';
const IOS = 'docs/launch/screenshots/ios';
const PLAY = 'docs/launch/screenshots/play';
mkdirSync(PLAY, { recursive: true });

// 1. phone screenshots -> 1080x2160 cream-letterboxed (1:2, within Play's aspect limit)
for (const f of readdirSync(IOS).filter((f) => f.endsWith('.png'))) {
  await sharp(`${IOS}/${f}`)
    .resize(1080, 2160, { fit: 'contain', background: cream })
    .png()
    .toFile(`${PLAY}/${f}`);
}

// 2. feature graphic 1024x500 — crop the heart (sun + boar + ridge) from the master scene
const scene = await sharp('docs/launch/icon/generated/AppIcon-1024.png').png().toBuffer();
await sharp(scene)
  .resize(1024, 1024)
  .extract({ left: 0, top: 200, width: 1024, height: 500 })
  .png()
  .toFile(`${PLAY}/feature-graphic-1024x500.png`);

// 3. 512 hi-res Play icon
await sharp(scene).resize(512, 512).png().toFile(`${PLAY}/play-icon-512.png`);

console.log('Play assets written to', PLAY, '-', readdirSync(PLAY).join(', '));
