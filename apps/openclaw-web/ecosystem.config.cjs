const { existsSync, readFileSync } = require('node:fs');

const sharedEnvPath =
  process.env.SCOUT_SHARED_ENV_FILE ||
  process.env.OPENCLAW_SHARED_ENV_FILE ||
  '/home/forge/hoggcountry.on-forge.com/.env';
const root =
  process.env.SCOUT_WEB_ROOT ||
  process.env.OPENCLAW_WEB_ROOT ||
  '/home/forge/hoggcountry.on-forge.com/current/apps/openclaw-web';

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
      name: envValue('SCOUT_PM2_NAME', 'hoggcountry-scout'),
      cwd: root,
      script: 'build/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        HOST: envValue('HOST', '127.0.0.1'),
        PORT: envValue('PORT', '3000'),
        NODE_ENV: envValue('NODE_ENV', 'production'),
        SCOUT_WORKSPACE_DATA_DIR: envValue(
          ['SCOUT_WORKSPACE_DATA_DIR', 'OPENCLAW_WORKSPACE_DATA_DIR'],
          '/home/forge/hoggcountry.on-forge.com/storage/app/scout-workspaces'
        ),
        SCOUT_PROVIDER_SECRET: envValue(['SCOUT_PROVIDER_SECRET', 'OPENCLAW_PROVIDER_SECRET'], undefined),
        HOGGCOUNTRY_PROVIDER_SECRET: envValue('HOGGCOUNTRY_PROVIDER_SECRET', undefined),
        SCOUT_OPENAI_CODEX_REDIRECT_URI: envValue(
          ['SCOUT_OPENAI_CODEX_REDIRECT_URI', 'OPENCLAW_OPENAI_CODEX_REDIRECT_URI'],
          undefined
        ),
        HOGGCOUNTRY_OPENAI_CODEX_REDIRECT_URI: envValue('HOGGCOUNTRY_OPENAI_CODEX_REDIRECT_URI', undefined),
        OPENAI_API_KEY: envValue('OPENAI_API_KEY', undefined),
        OPENAI_MODEL: envValue('OPENAI_MODEL', undefined),
        OPENCODE_API_KEY: envValue('OPENCODE_API_KEY', undefined),
        SCOUT_PROVIDER: envValue(['SCOUT_PROVIDER', 'OPENCLAW_CLAW_PROVIDER', 'OPENCLAW_SCOUT_PROVIDER'], undefined),
        SCOUT_MODEL: envValue(['SCOUT_MODEL', 'OPENCLAW_CLAW_MODEL', 'OPENCLAW_SCOUT_MODEL'], undefined),
      },
    },
  ],
};
