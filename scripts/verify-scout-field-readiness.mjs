const args = process.argv.slice(2);

const options = {
  baseUrl: process.env.FORGE_BASE_URL || 'https://hoggcountry.on-forge.com',
  email: process.env.SCOUT_VERIFY_EMAIL || '',
  password: process.env.SCOUT_VERIFY_PASSWORD || '',
  json: false
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--base-url' && args[i + 1]) {
    options.baseUrl = args[i + 1];
    i += 1;
    continue;
  }

  if (arg === '--email' && args[i + 1]) {
    options.email = args[i + 1];
    i += 1;
    continue;
  }

  if (arg === '--password' && args[i + 1]) {
    options.password = args[i + 1];
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

function authSetCookie(setCookie) {
  return setCookieValues(setCookie).find((value) => value.startsWith('hc_auth_token=')) ?? '';
}

function cookiePair(setCookie) {
  const authCookie = authSetCookie(setCookie);
  if (!authCookie) return null;
  const match = /^(hc_auth_token=[^;,\s]+)/u.exec(authCookie);
  return match?.[1] ?? null;
}

function cookieAttributes(setCookie) {
  return authSetCookie(setCookie).toLowerCase();
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...init,
    headers: {
      'user-agent': 'hoggcountry-scout-field-verify/1.0',
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

async function postLogin(email, password, redirectTo = '/app/scout') {
  return request('/login', {
    method: 'POST',
    headers: {
      origin: baseUrl,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      email,
      password,
      redirectTo
    })
  });
}

function expectHtmlMarkers(label, result, markers) {
  if (result.status !== 200) {
    problems.push(`${label} expected 200, got ${result.status}`);
    return;
  }

  for (const marker of markers) {
    if (!marker.test(result.text)) problems.push(`${label} missing ${marker} marker`);
  }
}

const login = await request('/login');
expectHtmlMarkers('/login', login, [
  /Sign in to your trail workspace/u,
  /private beta email and password/u,
  /Email/u,
  /Password/u,
  /Forgot password/u
]);

const signup = await request('/signup');
expectHtmlMarkers('/signup', signup, [
  /Private web beta/u,
  /Notify me/u,
  /Already have a login/u
]);

const forgotPassword = await request('/forgot-password');
expectHtmlMarkers('/forgot-password', forgotPassword, [
  /Recover|reset|password/iu,
  /Email/u
]);

const gatedPaths = ['/app', '/app/today', '/app/map'];
const gatedResults = {};

for (const path of gatedPaths) {
  const result = await request(path);
  gatedResults[path] = result.status;
  const expectedLocation = `/login?redirect=${encodeURIComponent(path)}`;

  if (result.status !== 302) problems.push(`${path} expected anonymous 302, got ${result.status}`);
  if (result.headers.location !== expectedLocation) {
    problems.push(`${path} expected redirect ${expectedLocation}, got ${result.headers.location ?? 'none'}`);
  }
}

const badLogin = await postLogin(`codex-${Date.now()}@example.invalid`, 'not-the-password');
if (![400, 401, 422].includes(badLogin.status)) {
  problems.push(`Bad login expected 400, 401, or 422, got ${badLogin.status}`);
}
if (cookiePair(badLogin.setCookies)) problems.push('Bad login unexpectedly set hc_auth_token cookie');

let credentialLoginStatus = 'skipped';
let appStatus = 'skipped';

if (options.email && options.password) {
  const credentialLogin = await postLogin(options.email, options.password);
  credentialLoginStatus = credentialLogin.status;
  const authCookie = cookiePair(credentialLogin.setCookies);
  const authAttrs = cookieAttributes(credentialLogin.setCookies);

  if (credentialLogin.status !== 303) problems.push(`Credential login expected 303, got ${credentialLogin.status}`);
  if (credentialLogin.headers.location !== '/app/scout') {
    problems.push(`Credential login expected /app/scout redirect, got ${credentialLogin.headers.location ?? 'none'}`);
  }
  if (!authCookie) problems.push('Credential login did not set hc_auth_token cookie');
  if (!authAttrs.includes('httponly')) problems.push('Credential login cookie missing HttpOnly');
  if (!authAttrs.includes('samesite=lax')) problems.push('Credential login cookie missing SameSite=Lax');
  if (baseUrl.startsWith('https://') && !authAttrs.includes('secure')) {
    problems.push('Credential login cookie missing Secure on HTTPS');
  }

  if (authCookie) {
    const app = await request('/app/scout', {
      headers: {
        cookie: authCookie
      }
    });
    appStatus = app.status;
    if (app.status !== 200) problems.push(`Authenticated /app/scout expected 200, got ${app.status}`);
    if (!/Scout|workspace|Today|Plan/iu.test(app.text)) problems.push('Authenticated /app/scout missing Scout workspace markers');
  }
}

const summary = {
  baseUrl,
  ok: problems.length === 0,
  authLogin: credentialLoginStatus,
  app: appStatus,
  checks: {
    login: login.status,
    signup: signup.status,
    forgotPassword: forgotPassword.status,
    gated: gatedResults,
    badLogin: badLogin.status
  },
  problems
};

if (options.json) {
  console.log(JSON.stringify(summary, null, 2));
} else if (summary.ok) {
  console.log(`Scout field readiness OK for ${baseUrl}`);
  if (credentialLoginStatus === 'skipped') {
    console.log('- authenticated login skipped; set SCOUT_VERIFY_EMAIL and SCOUT_VERIFY_PASSWORD to test a real account');
  }
} else {
  console.error(`Scout field readiness failed for ${baseUrl}`);
  for (const problem of problems) console.error(`- ${problem}`);
}

if (!summary.ok) {
  process.exitCode = 1;
}
