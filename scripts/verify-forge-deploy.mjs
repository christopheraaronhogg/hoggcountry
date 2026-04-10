const args = process.argv.slice(2);

const options = {
  baseUrl: process.env.FORGE_BASE_URL || "https://hoggcountry.on-forge.com",
  expectedSha: process.env.EXPECTED_SHA || "",
  json: false,
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === "--base-url" && args[i + 1]) {
    options.baseUrl = args[i + 1];
    i += 1;
    continue;
  }

  if (arg === "--expected-sha" && args[i + 1]) {
    options.expectedSha = args[i + 1];
    i += 1;
    continue;
  }

  if (arg === "--json") {
    options.json = true;
  }
}

const baseUrl = options.baseUrl.replace(/\/+$/, "");

const checks = [
  {
    label: "root",
    path: "/",
    expectStatus: 200,
    validate(result) {
      if (!result.json || result.json?.data?.service !== "hoggcountry-api") {
        return "expected root JSON response from hoggcountry-api";
      }

      return null;
    },
  },
  {
    label: "health",
    path: "/api/v1/health",
    expectStatus: 200,
    validate(result) {
      if (result.json?.data?.status !== "ok") {
        return "expected health JSON with data.status=ok";
      }

      return null;
    },
  },
  {
    label: "plans",
    path: "/api/v1/trail-assistant/plans",
    expectStatus: 200,
    validate(result) {
      if (!result.ok) {
        return "expected public trail-assistant plans route to exist";
      }

      return null;
    },
  },
  {
    label: "byos-providers",
    path: "/api/v1/trail-assistant/byos/providers",
    expectStatus: 200,
    validate(result) {
      if (!result.ok) {
        return "expected public BYOS providers route to exist";
      }

      return null;
    },
  },
];

async function fetchCheck(check) {
  const url = `${baseUrl}${check.path}`;

  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "user-agent": "hoggcountry-forge-verify/1.0",
      },
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
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      label: check.label,
      path: check.path,
      url,
      ok: false,
      status: 0,
      statusText: "FETCH_ERROR",
      text: String(error),
      json: null,
      headers: {},
    };
  }
}

const results = await Promise.all(checks.map(fetchCheck));

let hasFailures = false;
const problems = [];

for (const [index, result] of results.entries()) {
  const check = checks[index];

  if (result.status !== check.expectStatus) {
    hasFailures = true;
    problems.push(
      `${check.label}: expected ${check.expectStatus}, got ${result.status}`
    );
  }

  const validationProblem = check.validate(result);
  if (validationProblem) {
    hasFailures = true;
    problems.push(`${check.label}: ${validationProblem}`);
  }
}

const health = results.find((result) => result.label === "health");
const build = health?.json?.meta?.build ?? null;

if (options.expectedSha && build?.sha && build.sha !== options.expectedSha) {
  hasFailures = true;
  problems.push(
    `health build SHA mismatch: expected ${options.expectedSha}, got ${build.sha}`
  );
}

if (health?.status === 200) {
  const plans = results.find((result) => result.label === "plans");
  const providers = results.find((result) => result.label === "byos-providers");

  if ((plans && plans.status === 404) || (providers && providers.status === 404)) {
    problems.push(
      "deployment drift detected: health is live but trail-assistant public routes are missing"
    );
    hasFailures = true;
  }
}

const summary = {
  baseUrl,
  ok: !hasFailures,
  build,
  results: results.map((result) => ({
    label: result.label,
    url: result.url,
    status: result.status,
    ok: result.ok,
    service: result.json?.data?.service ?? null,
    build: result.json?.meta?.build ?? null,
  })),
  problems,
};

if (options.json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Forge deploy verification for ${baseUrl}`);
  for (const result of summary.results) {
    console.log(
      `- ${result.label}: ${result.status} ${result.ok ? "OK" : "FAIL"} ${result.url}`
    );
  }

  if (build) {
    console.log("- build:", JSON.stringify(build));
  }

  if (problems.length > 0) {
    console.log("- problems:");
    for (const problem of problems) {
      console.log(`  - ${problem}`);
    }
  } else {
    console.log("- problems: none");
  }
}

process.exit(hasFailures ? 1 : 0);
