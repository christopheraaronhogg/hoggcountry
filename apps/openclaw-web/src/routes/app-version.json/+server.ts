import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const TESTFLIGHT_URL = 'https://testflight.apple.com/join/BagBCrzf';

const MOBILE_MANIFEST_CANDIDATES = [
  join(process.cwd(), '..', '..', 'mobile', 'static', 'app-version.json'),
  join(process.cwd(), 'mobile', 'static', 'app-version.json')
];

const IOS_PROJECT_CANDIDATES = [
  join(process.cwd(), '..', '..', 'mobile', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj'),
  join(process.cwd(), 'mobile', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')
];

export const GET = async () => {
  const manifest = await readMobileManifest().catch(() => readIosFallbackManifest());

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};

async function readMobileManifest() {
  for (const candidate of MOBILE_MANIFEST_CANDIDATES) {
    if (existsSync(candidate)) {
      return JSON.parse(await readFile(candidate, 'utf8'));
    }
  }
  throw new Error('mobile app-version manifest not found');
}

function readIosFallbackManifest() {
  for (const candidate of IOS_PROJECT_CANDIDATES) {
    if (!existsSync(candidate)) continue;
    const project = readFileSync(candidate, 'utf8');
    const version = uniqueBuildSetting(project, 'MARKETING_VERSION') ?? '1.0';
    const build = uniqueBuildSetting(project, 'CURRENT_PROJECT_VERSION') ?? '0';
    return {
      name: 'Hogg Country',
      channel: 'testflight',
      version,
      build,
      label: build ? `${version} (${build})` : version,
      testFlightUrl: TESTFLIGHT_URL
    };
  }

  return {
    name: 'Hogg Country',
    channel: 'testflight',
    version: '1.0',
    build: '0',
    label: '1.0',
    testFlightUrl: TESTFLIGHT_URL
  };
}

function uniqueBuildSetting(text: string, key: string): string | null {
  const matches = [...text.matchAll(new RegExp(`${key} = ([^;]+);`, 'gu'))].map((match) =>
    match[1]?.trim()
  );
  const unique = [...new Set(matches.filter(Boolean))];
  return unique.length === 1 ? unique[0] : null;
}
