const args = process.argv.slice(2);

const options = {
  baseUrl: process.env.FORGE_BASE_URL || 'https://hoggcountry.on-forge.com',
  expectedSha: process.env.EXPECTED_SHA || '',
  includeMcp: false,
  json: false
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--base-url' && args[i + 1]) {
    options.baseUrl = args[i + 1];
    i += 1;
    continue;
  }

  if ((arg === '--expected-sha' || arg === '--sha') && args[i + 1]) {
    options.expectedSha = args[i + 1];
    i += 1;
    continue;
  }

  if (arg === '--include-mcp') {
    options.includeMcp = true;
    continue;
  }

  if (arg === '--json') {
    options.json = true;
  }
}

const baseUrl = options.baseUrl.replace(/\/+$/u, '');

function hasHtml(result) {
  return (result.headers['content-type'] || '').includes('text/html');
}

function hasJson(result) {
  return (result.headers['content-type'] || '').includes('json');
}

function includesAll(text, patterns) {
  return patterns.every((pattern) => pattern.test(text));
}

function expectsStatus(check, status) {
  const expected = Array.isArray(check.expectStatus) ? check.expectStatus : [check.expectStatus];
  return expected.includes(status);
}

const checks = [
  {
    label: 'root',
    path: '/',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected root HTML response from the SvelteKit public frontend';
      if (!includesAll(result.text, [/Hogg Country/i, /Latest from the trail/i])) {
        return 'expected Ranger homepage markers';
      }
      return null;
    }
  },
  {
    label: 'updates-page',
    path: '/updates',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected updates HTML response';
      if (!/Trail Updates|Latest from the trail/i.test(result.text)) return 'expected updates page markers';
      return null;
    }
  },
  {
    label: 'updates-feed',
    path: '/updates/feed?limit=50',
    expectStatus: 200,
    validate(result) {
      if (!hasJson(result)) return 'expected updates feed JSON';
      const updates = Array.isArray(result.json?.updates) ? result.json.updates : [];
      if (updates.length === 0) return 'expected non-empty merged trail feed';
      const sourceTypes = new Set(updates.map((update) => update?.sourceType));
      if (!sourceTypes.has('youtube_video')) return 'expected at least one youtube_video update';
      if (!sourceTypes.has('youtube_short')) return 'expected at least one youtube_short update';
      return null;
    }
  },
  {
    label: 'videos',
    path: '/videos',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected videos HTML response';
      if (!/Videos|YouTube|video/i.test(result.text)) return 'expected videos page markers';
      return null;
    }
  },
  {
    label: 'guide',
    path: '/guide',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected guide HTML response';
      if (!/AT NOBO Field Guide|guide-search-container|chapter-section/i.test(result.text)) {
        return 'expected guide index markers';
      }
      return null;
    }
  },
  {
    label: 'guide-page',
    path: '/guide/quick/layering',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected nested guide HTML response';
      if (!/Layering|Field Guide|guide/i.test(result.text)) return 'expected nested guide page markers';
      return null;
    }
  },
  {
    label: 'tools',
    path: '/tools',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected tools HTML response';
      if (!/What Matters Right Now|All Tools|Trail Tools/i.test(result.text)) {
        return 'expected restored public trail tools hub';
      }
      if (/Trail tools now live inside the workspace|old dashboard is no longer a standalone public surface/i.test(result.text)) {
        return 'found retired tools placeholder copy';
      }
      return null;
    }
  },
  {
    label: 'at-map',
    path: '/at-map',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected AT map HTML response';
      if (!/AT Map|Appalachian Trail Map|TrailMapExplorer|map/i.test(result.text)) return 'expected map page markers';
      return null;
    }
  },
  {
    label: 'track',
    path: '/track',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected track HTML response';
      if (!/Live Trail Map|Track|TrailMapExplorer|map/i.test(result.text)) return 'expected live tracking page markers';
      return null;
    }
  },
  {
    label: 'track-map-pack',
    path: '/track/map-pack',
    expectStatus: 200,
    validate(result) {
      if (!hasJson(result)) return 'expected public map-pack JSON';
      const current = result.json?.tracker?.current;
      if (typeof current?.lat !== 'number' || typeof current?.lon !== 'number') {
        return 'expected Garmin-backed current tracker coordinates';
      }
      if (!Array.isArray(result.json?.tracker?.history)) return 'expected tracker history array';
      return null;
    }
  },
  {
    label: 'login',
    path: '/login',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected login HTML response';
      if (!includesAll(result.text, [/Continue with Google/i, /Email/i, /Password/i, /Forgot password/i])) {
        return 'expected unified login form markers';
      }
      return null;
    }
  },
  {
    label: 'signup',
    path: '/signup',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected signup HTML response';
      if (!includesAll(result.text, [/Create your trail workspace/i, /Confirm password/i, /Already have an account/i])) {
        return 'expected current signup form markers';
      }
      return null;
    }
  },
  {
    label: 'app-auth-gate',
    path: '/app',
    expectStatus: 302,
    validate(result) {
      const location = result.headers.location || '';
      if (!location.startsWith('/login?redirect=%2Fapp')) return `expected /app to redirect to login, got ${location || 'none'}`;
      return null;
    }
  },
  {
    label: 'admin-updates',
    path: '/admin/updates',
    expectStatus: 200,
    validate(result) {
      if (!hasHtml(result)) return 'expected admin updates HTML response';
      if (!/Trail Updates Admin|passcode|Admin/i.test(result.text)) return 'expected admin update flow markers';
      return null;
    }
  },
  {
    label: 'health',
    path: '/api/v1/health',
    expectStatus: 200,
    validate(result) {
      if (result.json?.data?.status !== 'ok') return 'expected health JSON with data.status=ok';
      return null;
    }
  },
  {
    label: 'manifest',
    path: '/manifest.webmanifest',
    expectStatus: 200,
    validate(result) {
      if (!hasJson(result) && !(result.headers['content-type'] || '').includes('manifest')) {
        return 'expected web app manifest JSON';
      }
      if (result.json?.start_url !== '/app') return 'expected manifest start_url=/app';
      if (result.json?.display !== 'standalone') return 'expected standalone PWA display mode';
      return null;
    }
  },
  {
    label: 'service-worker',
    path: '/service-worker.js',
    expectStatus: 200,
    validate(result) {
      if (!(result.headers['content-type'] || '').includes('javascript')) return 'expected service worker JavaScript';
      if (!/scout-static|scout-runtime|serviceworker|ServiceWorkerGlobalScope/i.test(result.text)) {
        return 'expected Scout service worker markers';
      }
      if (/\/(?:trips|blog|tags)(?:['"`/,]|\\b)/i.test(result.text)) {
        return 'Trips, Blog, or Tags should not be service-worker runtime blockers';
      }
      return null;
    }
  },
  {
    label: 'rss',
    path: '/rss.xml',
    expectStatus: 200,
    validate(result) {
      if (!(result.headers['content-type'] || '').includes('rss')) return 'expected RSS content type';
      if (!/<rss\b|<channel>|<item>/i.test(result.text)) return 'expected RSS feed items';
      return null;
    }
  },
  {
    label: 'sitemap',
    path: '/sitemap.xml',
    expectStatus: 200,
    validate(result) {
      if (!(result.headers['content-type'] || '').includes('xml')) return 'expected sitemap XML content type';
      if (!includesAll(result.text, [/<urlset\b/i, /\/updates/i, /\/tools/i, /\/at-map/i, /\/track/i])) {
        return 'expected public beta routes in sitemap';
      }
      if (/\/(?:trips|blog|tags)(?:<|\/)/i.test(result.text)) {
        return 'Trips, Blog, or Tags should not be sitemap launch blockers';
      }
      return null;
    }
  }
];

if (options.includeMcp) {
  checks.push({
    label: 'scout-chatgpt-mcp',
    path: '/mcp',
    method: 'POST',
    expectStatus: 200,
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: {
          name: 'hoggcountry-forge-verify',
          version: '1.0'
        }
      }
    }),
    validate(result) {
      if (!/"name"\s*:\s*"scout-chatgpt-app"/.test(result.text)) {
        return 'expected MCP initialize response from Scout ChatGPT app';
      }
      return null;
    }
  });
}

async function fetchCheck(check) {
  const url = `${baseUrl}${check.path}`;

  try {
    const response = await fetch(url, {
      method: check.method ?? 'GET',
      redirect: 'manual',
      headers: {
        'user-agent': 'hoggcountry-forge-verify/1.0',
        ...(check.headers ?? {})
      },
      ...(check.body ? { body: check.body } : {})
    });

    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    return {
      label: check.label,
      path: check.path,
      url,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text,
      json,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      label: check.label,
      path: check.path,
      url,
      ok: false,
      status: 0,
      statusText: 'FETCH_ERROR',
      text: String(error),
      json: null,
      headers: {}
    };
  }
}

const results = await Promise.all(checks.map(fetchCheck));
const problems = [];
const failedLabels = new Set();

for (const [index, result] of results.entries()) {
  const check = checks[index];

  if (!expectsStatus(check, result.status)) {
    const expected = Array.isArray(check.expectStatus) ? check.expectStatus.join(' or ') : check.expectStatus;
    failedLabels.add(check.label);
    problems.push(`${check.label}: expected ${expected}, got ${result.status}`);
    continue;
  }

  const validationProblem = check.validate(result);
  if (validationProblem) {
    failedLabels.add(check.label);
    problems.push(`${check.label}: ${validationProblem}`);
  }
}

const health = results.find((result) => result.label === 'health');
const build = health?.json?.meta?.build ?? null;

if (options.expectedSha && build?.sha && build.sha !== options.expectedSha) {
  problems.push(`health build SHA mismatch: expected ${options.expectedSha}, got ${build.sha}`);
}

if (health?.status === 200) {
  const root = results.find((result) => result.label === 'root');
  const guide = results.find((result) => result.label === 'guide');
  const updatesFeed = results.find((result) => result.label === 'updates-feed');

  if (root?.headers['content-type']?.includes('application/json')) {
    problems.push('deployment drift detected: root is still serving legacy API JSON instead of the SvelteKit frontend');
  }

  if (guide && guide.status === 404) {
    problems.push('deployment drift detected: guide route is missing on Forge');
  }

  if (updatesFeed && updatesFeed.status === 401) {
    problems.push('deployment drift detected: public updates feed is behind an auth gate');
  }
}

const summary = {
  baseUrl,
  ok: problems.length === 0,
  build,
  results: results.map((result) => ({
    label: result.label,
    url: result.url,
    status: result.status,
    ok: !failedLabels.has(result.label),
    service: result.json?.data?.service ?? null,
    contentType: result.headers['content-type'] ?? null,
    build: result.json?.meta?.build ?? null
  })),
  problems
};

if (options.json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Forge deploy verification for ${baseUrl}`);
  for (const result of summary.results) {
    console.log(`- ${result.label}: ${result.status} ${result.ok ? 'OK' : 'FAIL'} ${result.url}`);
  }

  if (build) {
    console.log('- build:', JSON.stringify(build));
  }

  if (problems.length > 0) {
    console.log('- problems:');
    for (const problem of problems) console.log(`  - ${problem}`);
  } else {
    console.log('- problems: none');
  }
}

process.exit(problems.length > 0 ? 1 : 0);
