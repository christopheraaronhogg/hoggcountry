const { existsSync, readFileSync } = require('node:fs');

const sharedEnvPath =
  process.env.SCOUT_SHARED_ENV_FILE ||
  process.env.OPENCLAW_SHARED_ENV_FILE ||
  '/home/forge/hoggcountry.on-forge.com/.env';
const root =
  process.env.SCOUT_CHATGPT_APP_ROOT ||
  '/home/forge/hoggcountry.on-forge.com/current';

function readSharedEnv(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value];
      })
  );
}

const sharedEnv = readSharedEnv(sharedEnvPath);

function envValue(keys, fallback) {
  for (const key of Array.isArray(keys) ? keys : [keys]) {
    const value = process.env[key] || sharedEnv[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return fallback;
}

module.exports = {
  apps: [
    {
      name: envValue('SCOUT_CHATGPT_APP_PM2_NAME', 'hoggcountry-scout-chatgpt-app'),
      cwd: root,
      script: 'apps/scout-chatgpt-app/build/server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: envValue('NODE_ENV', 'production'),
        PORT: envValue('SCOUT_CHATGPT_APP_PORT', '8788'),
        PUBLIC_SITE_ORIGIN: envValue('PUBLIC_SITE_ORIGIN', 'https://hoggcountry.com'),
        SCOUT_APP_DOMAIN: envValue(
          ['SCOUT_CHATGPT_APP_DOMAIN', 'SCOUT_APP_DOMAIN'],
          'https://hoggcountry.on-forge.com'
        ),
      },
    },
  ],
};
