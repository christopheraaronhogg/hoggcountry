#!/usr/bin/env node

const args = process.argv.slice(2);

const options = {
  baseUrl: process.env.FORGE_BASE_URL || 'https://hoggcountry.on-forge.com',
  json: false,
};

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--base-url' && args[index + 1]) {
    options.baseUrl = args[index + 1];
    index += 1;
    continue;
  }
  if (arg === '--json') options.json = true;
}

const baseUrl = options.baseUrl.replace(/\/+$/u, '');
const problems = [];

function setCookieValues(setCookie) {
  if (Array.isArray(setCookie)) return setCookie;
  return setCookie ? [setCookie] : [];
}

function betaSetCookie(setCookie) {
  return setCookieValues(setCookie).find((value) => value.startsWith('hogg_beta_profile=')) ?? '';
}

function cookiePair(setCookie) {
  const betaCookie = betaSetCookie(setCookie);
  if (!betaCookie) return null;
  const match = /^(hogg_beta_profile=[^;,\s]+)/u.exec(betaCookie);
  return match?.[1] ?? null;
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...init,
    headers: {
      'user-agent': 'hoggcountry-scout-rockiness-live-verify/1.0',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const setCookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return {
    path,
    status: response.status,
    ok: response.ok,
    text,
    headers: Object.fromEntries(response.headers.entries()),
    setCookies,
  };
}

async function postLogin(username, password) {
  return request('/signup', {
    method: 'POST',
    headers: {
      origin: baseUrl,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      quickUsername: username,
      quickPassword: password,
    }),
  });
}

const login = await postLogin(process.env.SCOUT_VERIFY_USER || 'chris', process.env.SCOUT_VERIFY_PASSWORD || '0721');
const cookie = cookiePair(login.setCookies);
if (login.status !== 303) problems.push(`quick login expected 303, got ${login.status}`);
if (!cookie) problems.push('quick login did not set hogg_beta_profile cookie');

let app = null;
let progress = null;
if (cookie) {
  app = await request('/app/scout', {
    headers: { cookie },
  });
  if (app.status !== 200) problems.push(`/app/scout expected 200, got ${app.status}`);
  if (!/Scout beta/u.test(app.text)) problems.push('/app/scout missing Scout beta marker');

  progress = await request('/app/admin/reference-progress', {
    headers: { cookie },
  });
  if (progress.status !== 200) problems.push(`/app/admin/reference-progress expected 200, got ${progress.status}`);
  for (const marker of [
    /Reference Progress/u,
    /Rockiness V2\.1/u,
    /Source extraction/u,
    /DEM\/LiDAR metadata snapshot/u,
    /not field verified/u,
    /generated\/open-route mile/u,
  ]) {
    if (!marker.test(progress.text)) problems.push(`reference progress missing marker ${marker}`);
  }
}

const summary = {
  baseUrl,
  ok: problems.length === 0,
  checks: {
    login: login.status,
    app: app?.status ?? null,
    referenceProgress: progress?.status ?? null,
  },
  problems,
};

if (options.json) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(`Scout Rockiness live smoke OK for ${baseUrl}`);
} else {
  console.error(`Scout Rockiness live smoke failed for ${baseUrl}`);
  for (const problem of problems) console.error(`- ${problem}`);
}

if (!summary.ok) process.exitCode = 1;
