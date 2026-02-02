import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const inPdf = process.argv[2] || 'private/awol/AT-Guide-2026.pdf';
const outTxt = process.argv[3] || 'private/awol/AT-Guide-2026.txt';

if (inPdf === '--help' || inPdf === '-h') {
  console.log('Usage: node scripts/awol-pdf-to-text.js [inputPdf] [outputTxt]'); // eslint-disable-line no-console
  console.log('Default input:  private/awol/AT-Guide-2026.pdf'); // eslint-disable-line no-console
  console.log('Default output: private/awol/AT-Guide-2026.txt'); // eslint-disable-line no-console
  process.exit(0);
}

if (!fs.existsSync(inPdf)) {
  console.error(`Missing input PDF: ${inPdf}`); // eslint-disable-line no-console
  console.error('Place your purchased AWOL / A.T. Guide PDF under `private/awol/` (gitignored).'); // eslint-disable-line no-console
  process.exit(1);
}

fs.mkdirSync(path.dirname(outTxt), { recursive: true });

const result = spawnSync('pdftotext', ['-layout', inPdf, outTxt], { stdio: 'inherit' });
if (result.error) {
  console.error('Failed to run `pdftotext`. Install Poppler (pdftotext) and try again.'); // eslint-disable-line no-console
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);

console.log(`✅ Wrote ${outTxt}`); // eslint-disable-line no-console
