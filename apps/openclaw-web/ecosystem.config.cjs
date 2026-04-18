const root = process.env.OPENCLAW_WEB_ROOT || '/home/forge/hoggcountry.on-forge.com/current/apps/openclaw-web';

module.exports = {
  apps: [
    {
      name: 'hoggcountry-openclaw',
      cwd: root,
      script: 'build/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        HOST: process.env.HOST || '127.0.0.1',
        PORT: process.env.PORT || '3000',
        NODE_ENV: process.env.NODE_ENV || 'production',
        OPENCLAW_WORKSPACE_DATA_DIR:
          process.env.OPENCLAW_WORKSPACE_DATA_DIR || '/home/forge/hoggcountry.on-forge.com/storage/app/openclaw-workspaces',
      },
    },
  ],
};
