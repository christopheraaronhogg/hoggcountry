const args = process.argv.slice(2);

const options = {
  baseUrl: process.env.FORGE_BASE_URL || 'https://hoggcountry.on-forge.com',
  json: false
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--base-url' && args[i + 1]) {
    options.baseUrl = args[i + 1];
    i += 1;
    continue;
  }
  if (arg === '--json') {
    options.json = true;
  }
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

function cookieAttributes(setCookie) {
  return betaSetCookie(setCookie).toLowerCase();
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...init,
    headers: {
      'user-agent': 'hoggcountry-openclaw-field-verify/1.0',
      ...(init.headers ?? {})
    }
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
    setCookie: response.headers.get('set-cookie'),
    setCookies
  };
}

async function postLogin(username, password) {
  return request('/signup', {
    method: 'POST',
    headers: {
      origin: baseUrl,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      quickUsername: username,
      quickPassword: password
    })
  });
}

const signup = await request('/signup');
if (signup.status !== 200) problems.push(`/signup expected 200, got ${signup.status}`);
if (!/Trail beta quick login/u.test(signup.text)) problems.push('/signup missing quick login marker');
if (!/value="chris"/u.test(signup.text) || !/value="dad"/u.test(signup.text)) {
  problems.push('/signup missing Chris/Dad quick login buttons');
}

const chrisLogin = await postLogin('chris', '0721');
const chrisCookie = cookiePair(chrisLogin.setCookies);
const chrisAttrs = cookieAttributes(chrisLogin.setCookies);
if (chrisLogin.status !== 303) problems.push(`Chris login expected 303, got ${chrisLogin.status}`);
if (chrisLogin.headers.location !== '/app/claw') problems.push(`Chris login expected /app/claw redirect, got ${chrisLogin.headers.location ?? 'none'}`);
if (!chrisCookie) problems.push('Chris login did not set hogg_beta_profile cookie');
if (!chrisAttrs.includes('httponly')) problems.push('Chris login cookie missing HttpOnly');
if (!chrisAttrs.includes('samesite=lax')) problems.push('Chris login cookie missing SameSite=Lax');
if (baseUrl.startsWith('https://') && !chrisAttrs.includes('secure')) problems.push('Chris login cookie missing Secure on HTTPS');

const dadLogin = await postLogin('dad', '0721');
const dadCookie = cookiePair(dadLogin.setCookies);
if (dadLogin.status !== 303) problems.push(`Dad login expected 303, got ${dadLogin.status}`);
if (!dadCookie) problems.push('Dad login did not set hogg_beta_profile cookie');
if (chrisCookie && dadCookie && chrisCookie === dadCookie) problems.push('Chris and Dad resolved to the same beta cookie');

if (chrisCookie) {
  const app = await request('/app/claw', {
    headers: {
      cookie: chrisCookie
    }
  });
  if (app.status !== 200) problems.push(`Chris /app/claw expected 200, got ${app.status}`);
  if (!/Scout beta/u.test(app.text)) problems.push('Chris /app/claw missing Scout beta app marker');
  if (!/Chris/u.test(app.text)) problems.push('Chris /app/claw missing Chris workspace marker');

  const logout = await request('/app/logout', {
    headers: {
      cookie: chrisCookie
    }
  });
  if (logout.status !== 303) problems.push(`Logout expected 303, got ${logout.status}`);
  if (logout.headers.location !== '/signup') problems.push(`Logout expected /signup redirect, got ${logout.headers.location ?? 'none'}`);
  if (!betaSetCookie(logout.setCookies)) problems.push('Logout did not clear beta cookie');
}

const badLogin = await postLogin('chris', 'wrong');
if (badLogin.status !== 401) problems.push(`Bad quick login expected 401, got ${badLogin.status}`);

const summary = {
  baseUrl,
  ok: problems.length === 0,
  checks: {
    signup: signup.status,
    chrisLogin: chrisLogin.status,
    dadLogin: dadLogin.status,
    badLogin: badLogin.status
  },
  problems
};

if (options.json) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(`OpenClaw field readiness OK for ${baseUrl}`);
} else {
  console.error(`OpenClaw field readiness failed for ${baseUrl}`);
  for (const problem of problems) console.error(`- ${problem}`);
}

if (!summary.ok) {
  process.exitCode = 1;
}
